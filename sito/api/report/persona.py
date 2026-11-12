"""
Report Persona - funzione della pagina riservata /riservata/report-persona (uso interno dell'ufficio).

  {"azione": "accedi", "password": "..."}                  -> {"sessione": "..."} (12 ore)
Con l'intestazione x-report-sessione:
  {"azione": "elenco"}                                      richieste in archivio e configurazione
  {"azione": "richiedi", "nome", "cognome", "cf", "finalita", "nota", "consenso": true, "conferma": false}
                                                            manda la richiesta a Openapi (A PAGAMENTO)
  {"azione": "aggiorna"}                                    controlla le richieste in lavorazione
  {"azione": "pdf", "c": "<codice>"}                        il report in base64
  {"azione": "collega", "c": "<codice>", "contatto": "<id>"} oppure "crea": true
  {"azione": "ricerca", "c": "<codice>"}                    ripete la ricerca del contatto nel CRM
  {"azione": "allega", "c": "<codice>"}                     riprova ad allegare il PDF al contatto
"""
import base64, os, sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_report"))
import report  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("content-length", "0")
        self.end_headers()

    def do_POST(self):
        if not report.origine(self.headers):
            return report.rispondi(self, 403, {"errore": "origine"})
        if not report.archivio.configurato() or not os.environ.get("REPORT_PERSONA_PASSWORD"):
            return report.rispondi(self, 503, {"errore": "non-configurato"})
        dati = report.corpo_json(self)
        azione = str(dati.get("azione") or "")
        try:
            if azione == "accedi":
                sessione, motivo = report.accedi(dati.get("password"))
                return report.rispondi(self, 200 if sessione else 429 if motivo == "bloccato" else 403, {"sessione": sessione} if sessione else {"errore": motivo})
            if not report.sessione_ok(self.headers):
                return report.rispondi(self, 401, {"errore": "sessione"})
            if azione == "elenco":
                report.pulizia()
            elif azione == "aggiorna":
                for r in report.tutte():
                    report.controlla(r)
            elif azione == "richiedi":
                return self._richiedi(dati)
            elif azione in ("pdf", "collega", "ricerca", "allega"):
                r = report.carica(str(dati.get("c") or ""))
                if not r:
                    return report.rispondi(self, 404, {"errore": "non-trovato"})
                if azione == "pdf":
                    pdf = report.pdf(r["codice"])
                    if not pdf:
                        return report.rispondi(self, 404, {"errore": "non-trovato"})
                    if len(pdf) > report.MAX_PDF_RISPOSTA:
                        return report.rispondi(self, 413, {"errore": "troppo-grande"})
                    return report.rispondi(self, 200, {"pdf_base64": base64.b64encode(pdf).decode(), "nome": f"report-persona-{r['cf']}-{r['creata'][:10]}.pdf"})
                if azione == "collega":
                    if report.collega(r, contatto=str(dati.get("contatto") or ""), crea=dati.get("crea") is True) is None:
                        return report.rispondi(self, 400, {"errore": "contatto"})
                elif azione == "ricerca":
                    report.allega(report.cerca_contatto(r))
                else:
                    report.allega(r)
            else:
                return report.rispondi(self, 400, {"errore": "azione"})
            report.rispondi(self, 200, {"richieste": [report.vista(r) for r in report.tutte()], "configurazione": report.configurazione()})
        except Exception as e:
            print("report: errore", type(e).__name__)
            report.rispondi(self, 500, {"errore": "archivio"})

    def _richiedi(self, dati):
        nome, cognome = " ".join(str(dati.get("nome") or "").split())[:60], " ".join(str(dati.get("cognome") or "").split())[:60]
        cf = str(dati.get("cf") or "").replace(" ", "").upper()
        finalita, nota = str(dati.get("finalita") or ""), " ".join(str(dati.get("nota") or "").split())[:200]
        if not nome or not cognome or not report.cf_valido(cf) or finalita not in report.FINALITA or (finalita == "altro" and not nota):
            return report.rispondi(self, 400, {"errore": "dati"})
        if dati.get("consenso") is not True:
            return report.rispondi(self, 400, {"errore": "consenso"})
        if not os.environ.get("OPENAPI_RISK_TOKEN"):
            return report.rispondi(self, 503, {"errore": "openapi-non-configurato"})
        precedente = report.doppione(cf)
        if precedente and dati.get("conferma") is not True:
            return report.rispondi(self, 409, {"errore": "gia-richiesto", "quando": precedente["creata"]})
        r = report.richiedi(nome, cognome, cf, finalita, nota)
        if r["stato"] == "in_lavorazione":
            report.cerca_contatto(r)
        report.rispondi(self, 200, {"richieste": [report.vista(x) for x in report.tutte()], "configurazione": report.configurazione(), "nuova": r["codice"]})

    def log_message(self, *args):
        pass
