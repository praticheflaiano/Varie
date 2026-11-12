"""
Report Persona - avvisi e manutenzione, senza accesso dell'utente.

POST ?r=<codice>&k=<segreto>   avviso di Openapi: il report è pronto. Il contenuto dell'avviso non viene
                               usato: serve solo a far partire il controllo, che scarica il PDF da Openapi.
GET                            manutenzione giornaliera (cron di Vercel): cancella dall'archivio i report più
                               vecchi di 12 mesi e controlla le richieste ancora in lavorazione.
Non restituisce mai dati.
"""
import hmac, os, sys, time
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_report"))
import report  # noqa: E402


ultima_manutenzione = 0   # in memoria: la pagina è pubblica, la manutenzione gira al massimo ogni 10 minuti


class handler(BaseHTTPRequestHandler):
    def _fatto(self):
        report.rispondi(self, 200, {"ok": True})

    def do_POST(self):
        try:
            q = parse_qs(urlparse(self.path).query)
            codice, chiave = (q.get("r") or [""])[0], (q.get("k") or [""])[0]
            if os.environ.get("REPORT_PERSONA_PASSWORD") and report.archivio.configurato() and report.CODICE.match(codice) \
                    and hmac.compare_digest(chiave, report.segreto_avviso(codice)):
                r = report.carica(codice)
                if r:
                    report.controlla(r)
        except Exception as e:
            print("report: avviso non gestito", type(e).__name__)
        self._fatto()

    def do_GET(self):
        global ultima_manutenzione
        try:
            if os.environ.get("REPORT_PERSONA_PASSWORD") and report.archivio.configurato() and time.time() - ultima_manutenzione > 600:
                ultima_manutenzione = time.time()
                report.pulizia()
                for r in report.tutte():
                    report.controlla(r)
        except Exception as e:
            print("report: manutenzione non riuscita", type(e).__name__)
        self._fatto()

    def log_message(self, *args):
        pass
