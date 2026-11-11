"""
Recupero del prospetto PDF di una stima: servono il codice della pratica (dal QR) e la data
di nascita. Risponde sempre allo stesso modo quando qualcosa non corrisponde, per non rivelare
se un codice esiste. Limite di tentativi per indirizzo e per codice (in memoria, best-effort).
"""
import hmac, json, os, re, sys, time
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_pensione"))
import archivio  # noqa: E402

HOST_OK = re.compile(r"^(praticheflaiano\.it|www\.praticheflaiano\.it|localhost|127\.0\.0\.1|praticheflaiano-sito[a-z0-9-]*\.vercel\.app)$")
tentativi = {}


def entro_limite(chiave, massimo, finestra=3600):
    ora = time.time()
    n, da = tentativi.get(chiave, (0, ora))
    if ora - da > finestra:
        n, da = 0, ora
    tentativi[chiave] = (n + 1, da)
    return n < massimo


class handler(BaseHTTPRequestHandler):
    def _json(self, codice, corpo):
        dati = json.dumps(corpo).encode()
        self.send_response(codice)
        self.send_header("content-type", "application/json")
        self.send_header("cache-control", "no-store")
        self.send_header("content-length", str(len(dati)))
        self.end_headers()
        self.wfile.write(dati)

    def do_POST(self):
        m = re.match(r"^https?://([^/:]+)", self.headers.get("origin") or self.headers.get("referer") or "")
        if not m or not HOST_OK.match(m.group(1)):
            return self._json(403, {"errore": "origine"})
        if not archivio.configurato():
            return self._json(503, {"errore": "non-configurato"})
        ip = (self.headers.get("x-forwarded-for") or "sconosciuto").split(",")[0].strip()
        try:
            n = int(self.headers.get("content-length") or 0)
            dati = json.loads(self.rfile.read(n)) if 0 < n < 2000 else {}
        except ValueError:
            dati = {}
        codice, nascita = str(dati.get("c") or ""), str(dati.get("n") or "")
        if not entro_limite(("ip", ip), 20) or not entro_limite(("c", codice), 8):
            return self._json(429, {"errore": "troppi-tentativi"})
        try:
            pratica = json.loads(archivio.leggi(codice, "pratica.json") or b"{}") if archivio.CODICE.match(codice) else {}
            ok = bool(pratica) and hmac.compare_digest(str(pratica.get("nascita") or ""), nascita)
            pdf = archivio.leggi(codice, "prospetto.pdf") if ok else None
        except Exception as e:
            print("prospetto: errore", type(e).__name__)
            return self._json(500, {"errore": "archivio"})
        if not pdf:
            return self._json(404, {"errore": "non-trovato"})
        self.send_response(200)
        self.send_header("content-type", "application/pdf")
        self.send_header("content-disposition", 'attachment; filename="stima-pensione.pdf"')
        self.send_header("cache-control", "no-store")
        self.send_header("content-length", str(len(pdf)))
        self.end_headers()
        self.wfile.write(pdf)

    def log_message(self, *args):
        pass
