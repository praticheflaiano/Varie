"""
Stima e Calcolo della pensione - stato della pratica e avvio del calcolo.

Cliente (codice pratica + data di nascita, risposta uniforme se non corrispondono):
  {"azione": "stato"}   stato della pratica
  {"azione": "avvia"}   se è pagata esegue il calcolo (dura minuti) e restituisce lo stato finale
  {"azione": "reclama", "contatto": "<email o telefono usati per pagare>"}   abbina un pagamento
                        arrivato con dati diversi da quelli del questionario
  {"azione": "simula-pagamento"}   solo fuori produzione: segna pagata senza passare da GHL
Ufficio (intestazione x-stima-token = STIMA_PENSIONE_TOKEN, basta il codice; pagina /stima-pensione/ufficio):
  dettaglio, pdf, rilascia (rende scaricabile un prospetto trattenuto), carica-estratto
  (con "pdf": base64), riprova (rimette in coda un calcolo fallito), segna-pagata, calcola
"""
import base64, hmac, os, sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_pensione"))
import archivio  # noqa: E402
import pratiche  # noqa: E402


AZIONI_UFFICIO = ("dettaglio", "pdf", "rilascia", "carica-estratto", "riprova", "segna-pagata", "calcola")


class handler(BaseHTTPRequestHandler):
    def _ufficio(self, codice, azione, dati, sito):
        """Azioni dell'operatore, già autenticato con il segreto dell'ufficio."""
        p = pratiche.carica(codice)
        if not p or "stato" not in p:
            return pratiche.rispondi(self, 404, {"errore": "non-trovato"})
        if azione == "pdf":
            pdf = archivio.leggi(codice, "prospetto.pdf")
            return pratiche.rispondi(self, 200 if pdf else 404, {"pdf_base64": base64.b64encode(pdf).decode()} if pdf else {"errore": "non-trovato"})
        if azione == "rilascia":
            p = pratiche.rilascia(codice)
        elif azione == "carica-estratto":
            p = pratiche.carica_estratto(codice, str(dati.get("pdf") or ""))
        elif azione == "riprova":
            p = pratiche.riprova(codice)
        elif azione == "segna-pagata":
            p = pratiche.paga(codice, "ufficio") if p["stato"] == "ricevuta" else None
        elif azione == "calcola":
            chiave = os.environ.get("ANTHROPIC_API_KEY")
            if not chiave:
                return pratiche.rispondi(self, 503, {"errore": "non-configurato"})
            import elabora  # caricato solo qui: porta con sé motore e generatore del PDF
            p = pratiche.avvia(codice, chiave, p.get("sito") or sito or "https://praticheflaiano.it", elabora.elabora)
        elif azione != "dettaglio":
            return pratiche.rispondi(self, 400, {"errore": "azione"})
        if not p:
            return pratiche.rispondi(self, 409, {"errore": "stato-non-compatibile"})
        pratiche.rispondi(self, 200, pratiche.vista_ufficio(codice, p))

    def do_POST(self):
        ufficio = pratiche.token_ok(self.headers)
        if not ufficio and self.headers.get("x-stima-token") and not pratiche.entro_limite(("ufficio", pratiche.ip(self.headers)), 10):
            return pratiche.rispondi(self, 429, {"errore": "troppi-tentativi"})
        sito = pratiche.origine(self.headers)
        if not ufficio and not sito:
            return pratiche.rispondi(self, 403, {"errore": "origine"})
        if not archivio.configurato():
            return pratiche.rispondi(self, 503, {"errore": "non-configurato"})
        dati = pratiche.corpo_json(self, 4_500_000) or {}
        codice, azione = str(dati.get("c") or ""), str(dati.get("azione") or "stato")
        try:
            if ufficio:
                return self._ufficio(codice, azione, dati, sito)
            if azione in AZIONI_UFFICIO:
                # Il segreto dell'ufficio manca o è sbagliato: limite di tentativi per indirizzo.
                pratiche.entro_limite(("ufficio", pratiche.ip(self.headers)), 10)
                return pratiche.rispondi(self, 403, {"errore": "non-autorizzato"})
            if not pratiche.entro_limite(("ip", pratiche.ip(self.headers)), 240) or not pratiche.entro_limite(("c", codice), 240):
                return pratiche.rispondi(self, 429, {"errore": "troppi-tentativi"})
            p = pratiche.carica(codice)
            if not p or not hmac.compare_digest(str(p.get("nascita") or ""), str(dati.get("n") or "")) or "stato" not in p:
                if not pratiche.entro_limite(("errati", pratiche.ip(self.headers)), 20):
                    return pratiche.rispondi(self, 429, {"errore": "troppi-tentativi"})
                return pratiche.rispondi(self, 404, {"errore": "non-trovato"})
            if azione == "simula-pagamento" and not pratiche.in_produzione():
                p = pratiche.paga(codice, "simulato")
            elif azione == "reclama":
                if not pratiche.entro_limite(("reclama", codice), 10):
                    return pratiche.rispondi(self, 429, {"errore": "troppi-tentativi"})
                p = pratiche.reclama(codice, dati.get("contatto"))
            elif azione == "avvia":
                chiave = os.environ.get("ANTHROPIC_API_KEY")
                if not chiave:
                    return pratiche.rispondi(self, 503, {"errore": "non-configurato"})
                import elabora  # caricato solo qui: porta con sé motore e generatore del PDF
                p = pratiche.avvia(codice, chiave, sito or "https://praticheflaiano.it", elabora.elabora)
            pratiche.rispondi(self, 200, pratiche.vista_cliente(p))
        except Exception as e:
            print("pratica: errore", type(e).__name__)
            pratiche.rispondi(self, 500, {"errore": "archivio"})

    def log_message(self, *args):
        pass
