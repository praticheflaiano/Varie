"""
Documenti Openapi - funzione della pagina riservata /riservata/report-persona (uso interno dell'ufficio).

  {"azione": "accedi", "password": "..."}                  -> {"sessione": "..."} (12 ore)
Con l'intestazione x-report-sessione:
  {"azione": "elenco"}                                      richieste in archivio e configurazione
  {"azione": "catalogo", "rinnova": false}                  documenti richiedibili, con prezzi e tempi (letti da Openapi)
  {"azione": "richiedi", "documento": "<id>", "valori": {...}, "opzioni": [...], "persona": {"nome", "cognome", "cf"},
   "finalita", "nota", "consenso": true, "conferma": false} manda la richiesta a Openapi (A PAGAMENTO)
  {"azione": "aggiorna"}                                    controlla le richieste in lavorazione
  {"azione": "scegli", "c": "<codice>", "risultato": "<id>"}  sceglie uno dei risultati proposti da Openapi
  {"azione": "file", "c": "<codice>", "n": 0}               un file del documento, in base64
  {"azione": "collega", "c": "<codice>", "contatto": "<id>"} oppure "crea": true
  {"azione": "ricerca", "c": "<codice>"}                    ripete la ricerca del contatto nel CRM
  {"azione": "allega", "c": "<codice>"}                     riprova ad allegare il documento al contatto
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

    def _tutto(self, altro=None):
        report.rispondi(self, 200, {"richieste": [report.vista(r) for r in report.tutte()], "configurazione": report.configurazione(), **(altro or {})})

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
            if azione == "catalogo":
                return report.rispondi(self, 200, report.catalogo(rinnova=dati.get("rinnova") is True))
            if azione == "elenco":
                report.pulizia()
            elif azione == "aggiorna":
                for r in report.tutte():
                    report.controlla(r)
            elif azione == "richiedi":
                return self._richiedi(dati)
            elif azione in ("file", "scegli", "collega", "ricerca", "allega"):
                r = report.carica(str(dati.get("c") or ""))
                if not r:
                    return report.rispondi(self, 404, {"errore": "non-trovato"})
                if azione == "file":
                    voce = next((f for f in r.get("file") or [] if str(f["n"]) == str(dati.get("n", 0))), None)
                    contenuto = report.file(r["codice"], voce["n"]) if voce else None
                    if not contenuto:
                        return report.rispondi(self, 404, {"errore": "non-trovato"})
                    if len(contenuto) > report.MAX_PDF_RISPOSTA:
                        return report.rispondi(self, 413, {"errore": "troppo-grande"})
                    return report.rispondi(self, 200, {"base64": base64.b64encode(contenuto).decode(), "nome": voce["nome"], "tipo": voce["tipo"]})
                if azione == "scegli":
                    if report.scegli(r, str(dati.get("risultato") or "")) is None:
                        return report.rispondi(self, 400, {"errore": "risultato"})
                elif azione == "collega":
                    if report.collega(r, contatto=str(dati.get("contatto") or ""), crea=dati.get("crea") is True) is None:
                        return report.rispondi(self, 400, {"errore": "contatto"})
                elif azione == "ricerca":
                    report.allega(report.cerca_contatto(r))
                else:
                    report.allega(r)
            else:
                return report.rispondi(self, 400, {"errore": "azione"})
            self._tutto()
        except Exception as e:
            print("report: errore", type(e).__name__)
            report.rispondi(self, 500, {"errore": "archivio"})

    def _richiedi(self, dati):
        pulito = lambda t, n=60: " ".join(str(t or "").split())[:n]   # noqa: E731
        finalita, nota = str(dati.get("finalita") or ""), pulito(dati.get("nota"), 200)
        if finalita not in report.FINALITA or (finalita == "altro" and not nota):
            return report.rispondi(self, 400, {"errore": "dati", "dettaglio": "Scegli la finalità (con \"Altro\" scrivi la nota)."})
        if dati.get("consenso") is not True:
            return report.rispondi(self, 400, {"errore": "consenso"})
        if not report._token():
            return report.rispondi(self, 503, {"errore": "openapi-non-configurato"})
        v = report.voce(str(dati.get("documento") or ""))
        if not v:
            return report.rispondi(self, 400, {"errore": "dati", "dettaglio": "Documento non più in catalogo: aggiorna il catalogo."})
        valori = dati.get("valori") if isinstance(dati.get("valori"), dict) else {}
        ricerca, leggibili, opzioni, costo = report.prepara(v, valori, dati.get("opzioni") if isinstance(dati.get("opzioni"), list) else [])
        if ricerca is None:
            return report.rispondi(self, 400, {"errore": "dati", "dettaglio": leggibili})
        if v["servizio"] == "risk" and not report.cf_valido(ricerca["cf"]):
            return report.rispondi(self, 400, {"errore": "dati", "dettaglio": "Il codice fiscale non è valido."})
        # Persona a cui collegare il documento nel CRM: quella del Report Persona, oppure quella indicata a parte.
        p = dati.get("persona") if isinstance(dati.get("persona"), dict) else {}
        persona = {"nome": pulito(ricerca.get("nome") if v["servizio"] == "risk" else p.get("nome")), "cognome": pulito(ricerca.get("cognome") if v["servizio"] == "risk" else p.get("cognome")),
                   "cf": (ricerca.get("cf") if v["servizio"] == "risk" else str(p.get("cf") or "")).replace(" ", "").upper()}
        if persona["cf"] and not report.cf_valido(persona["cf"]):
            return report.rispondi(self, 400, {"errore": "dati", "dettaglio": "Il codice fiscale del cliente da collegare nel CRM non è valido."})
        precedente = report.doppione(v["id"], ricerca)
        if precedente and dati.get("conferma") is not True:
            return report.rispondi(self, 409, {"errore": "gia-richiesto", "quando": precedente["creata"]})
        r = report.richiedi(v, ricerca, leggibili, opzioni, costo, persona, finalita, nota)
        if r["stato"] not in ("errore", "annullata"):
            report.allega(report.cerca_contatto(r))
        self._tutto({"nuova": r["codice"]})

    def log_message(self, *args):
        pass
