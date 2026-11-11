"""
Stima e Calcolo della pensione - stato della pratica e avvio del calcolo.

Cliente (codice pratica + data di nascita, risposta uniforme se non corrispondono):
  {"azione": "stato"}   stato della pratica
  {"azione": "avvia"}   se è pagata esegue il calcolo (dura minuti) e restituisce lo stato finale
  {"azione": "reclama", "contatto": "<email o telefono usati per pagare>"}   abbina un pagamento
                        arrivato con dati diversi da quelli del questionario
  {"azione": "simula-pagamento"}   solo fuori produzione: segna pagata senza passare da GHL
Ufficio (intestazione x-stima-token = STIMA_PENSIONE_TOKEN, basta il codice):
  {"azione": "rilascia"}          rende scaricabile un prospetto trattenuto ("da_rivedere")
  {"azione": "carica-estratto", "pdf": "<base64>"}   aggiunge l'estratto richiesto dall'ufficio
"""
import hmac, os, sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_pensione"))
import archivio  # noqa: E402
import pratiche  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        ufficio = pratiche.token_ok(self.headers)
        sito = pratiche.origine(self.headers)
        if not ufficio and not sito:
            return pratiche.rispondi(self, 403, {"errore": "origine"})
        if not archivio.configurato():
            return pratiche.rispondi(self, 503, {"errore": "non-configurato"})
        dati = pratiche.corpo_json(self, 4_500_000) or {}
        codice, azione = str(dati.get("c") or ""), str(dati.get("azione") or "stato")
        try:
            if ufficio and azione in ("rilascia", "carica-estratto"):
                p = pratiche.rilascia(codice) if azione == "rilascia" else pratiche.carica_estratto(codice, str(dati.get("pdf") or ""))
                return pratiche.rispondi(self, 200 if p else 409, {"stato": p["stato"]} if p else {"errore": "stato-non-compatibile"})
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
