"""
Prova del flusso delle pratiche senza servizi esterni: archivio in una cartella temporanea,
calcolo sostituito da una funzione finta. Esegue le funzioni HTTP vere su una porta locale.
Uso: python3 sito/api/_pensione/test_pratiche.py
"""
import base64, importlib.util, json, os, sys, tempfile, threading, urllib.error, urllib.request
from http.server import HTTPServer

QUI = os.path.dirname(os.path.abspath(__file__))
STIMA = os.path.join(QUI, "..", "stima")
sys.path.insert(0, QUI)
os.environ["STIMA_ARCHIVIO_DIR"] = tempfile.mkdtemp()
os.environ["STIMA_PENSIONE_TOKEN"] = "segreto-di-prova"
os.environ["ANTHROPIC_API_KEY"] = "finta"
os.environ.pop("VERCEL_ENV", None)
os.environ.pop("STIMA_LINK_PAGAMENTO", None)

import archivio, pratiche  # noqa: E402

esiti = {"revisione": [], "fallisci": False, "chiamate": 0}


class ElaboraFinta:
    @staticmethod
    def elabora(dati, chiave, sito, codice=None):
        esiti["chiamate"] += 1
        assert base64.b64decode(dati["pdf"]).startswith(b"%PDF") and dati["risposte"]["salute"] is True
        if esiti["fallisci"]:
            return 502, {"errore": "provider"}
        archivio.salva(codice, "prospetto.pdf", b"%PDF-finto", "application/pdf")
        return 200, {"scenari": [], "revisione_consigliata": esiti["revisione"], "pdf_base64": "x", "codice": codice, "recupero_url": "", "archiviato": True}


sys.modules["elabora"] = ElaboraFinta


def funzione(nome):
    spec = importlib.util.spec_from_file_location("f_" + nome, os.path.join(STIMA, nome + ".py"))
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo.handler


FUNZIONI = {n: funzione(n) for n in ("invia", "pratica", "pagamento", "prospetto")}


PORTE = {}
for _nome, _classe in FUNZIONI.items():
    _server = HTTPServer(("127.0.0.1", 0), _classe)
    threading.Thread(target=_server.serve_forever, daemon=True).start()
    PORTE[_nome] = _server.server_port


def chiama(nome, corpo, **intestazioni):
    richiesta = urllib.request.Request(f"http://127.0.0.1:{PORTE[nome]}/api/stima/{nome}", json.dumps(corpo).encode(), {"content-type": "application/json", "origin": "http://localhost:4321", **intestazioni})
    try:
        with urllib.request.urlopen(richiesta) as r:
            dati = r.read()
            return r.status, (json.loads(dati) if r.headers["content-type"].startswith("application/json") else dati)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


PDF = base64.b64encode(b"%PDF-1.4 estratto di prova").decode()
RISPOSTE = {"nome": "Mario", "cognome": "Rossi", "email": "Mario.Rossi@example.com", "nascita": "1962-03-10", "sesso": "M",
            "richiediEstratto": False, "privacy": True, "salute": True, "condizioni": True}
TOKEN = {"x-stima-token": "segreto-di-prova"}


def nuova(**modifiche):
    pratiche._tentativi.clear()  # il limite di 6 invii l'ora vale anche qui
    stato, corpo = chiama("invia", {"risposte": {**RISPOSTE, **modifiche}, **({} if modifiche.get("richiediEstratto") else {"pdf": PDF}), "prelettura_settimane": 2136})
    assert stato == 200, (stato, corpo)
    return corpo["codice"]


def stato(codice, azione="stato", nascita="1962-03-10"):
    return chiama("pratica", {"c": codice, "n": nascita, "azione": azione})


# Richieste rifiutate
assert chiama("invia", {"risposte": RISPOSTE, "pdf": PDF}, origin="https://altro.example")[0] == 403
assert chiama("invia", {"risposte": {**RISPOSTE, "salute": False}, "pdf": PDF}) == (400, {"errore": "consensi"})
assert chiama("invia", {"risposte": RISPOSTE, "pdf": base64.b64encode(b"non un pdf").decode()}) == (400, {"errore": "estratto"})
assert chiama("pagamento", {"email": "mario.rossi@example.com"})[0] == 403

# Flusso normale: invio -> avviso di pagamento GHL (due volte) -> calcolo -> scarico
c = nuova()
assert stato(c, nascita="1970-01-01")[0] == 404 and stato("x" * 20)[0] == 404
s = stato(c)[1]
assert s["stato"] == "ricevuta" and s["totale"] == 6000 and s["prova"] is True, s
assert stato(c, "avvia")[1]["stato"] == "ricevuta" and esiti["chiamate"] == 0, "non si calcola prima del pagamento"
assert chiama("prospetto", {"c": c, "n": "1962-03-10"})[0] == 404
for _ in range(2):
    assert chiama("pagamento", {"contact": {"email": "mario.rossi@example.com"}, "order_id": "ord_1", "amount": 0}, **TOKEN) == (200, {"ok": True, "pratica": _ == 0})
assert stato(c)[1]["stato"] == "pagata"
assert stato(c, "avvia")[1]["stato"] == "consegnata" and esiti["chiamate"] == 1
assert stato(c, "avvia")[1]["stato"] == "consegnata" and esiti["chiamate"] == 1, "non si ricalcola"
assert chiama("prospetto", {"c": c, "n": "1962-03-10"}) == (200, b"%PDF-finto")
assert pratiche.carica(c)["pagamento"]["riferimento"] == "ord_1" and not os.path.exists(os.path.join(os.environ["STIMA_ARCHIVIO_DIR"], "stime", c, "blocco.json"))

# Due pratiche della stessa email: l'avviso paga la più recente in attesa, l'altra resta in attesa
vecchia, recente = nuova(), nuova()
pratiche.carica(vecchia)  # esiste
p = pratiche.carica(vecchia); p["creata"] = "2026-01-01T00:00:00Z"; pratiche.salva(vecchia, p)
chiama("pagamento", {"email": "MARIO.ROSSI@example.com"}, **TOKEN)
assert stato(recente)[1]["stato"] == "pagata" and stato(vecchia)[1]["stato"] == "ricevuta"

# Pratica trattenuta per revisione, poi rilasciata dall'ufficio
esiti["revisione"] = ["letture dell'estratto discordanti"]
assert stato(recente, "avvia")[1]["stato"] == "da_rivedere"
assert chiama("prospetto", {"c": recente, "n": "1962-03-10"})[0] == 404
assert chiama("pratica", {"c": recente, "azione": "rilascia"})[0] == 404, "senza token è una richiesta cliente senza data"
assert chiama("pratica", {"c": recente, "azione": "rilascia"}, **TOKEN) == (200, {"stato": "consegnata"})
assert chiama("prospetto", {"c": recente, "n": "1962-03-10"})[0] == 200
esiti["revisione"] = []

# Calcolo fallito: due tentativi, poi basta
assert stato(vecchia, "simula-pagamento")[1]["stato"] == "pagata"
esiti["fallisci"] = True
s = stato(vecchia, "avvia")[1]
assert s["stato"] == "fallita" and s["riprovabile"] is True, s
s = stato(vecchia, "avvia")[1]
assert s["stato"] == "fallita" and s["riprovabile"] is False
n = esiti["chiamate"]
assert stato(vecchia, "avvia")[1]["stato"] == "fallita" and esiti["chiamate"] == n
esiti["fallisci"] = False

# Calcolo già in corso altrove (blocco presente) e blocco scaduto
c = nuova(); stato(c, "simula-pagamento")
archivio.salva_nuovo(c, "blocco.json", b"x", "application/json")
n = esiti["chiamate"]
assert stato(c, "avvia")[1]["stato"] == "in_elaborazione" and esiti["chiamate"] == n
p = pratiche.carica(c); p.update(stato="in_elaborazione", avviata="2026-01-01T00:00:00Z", tentativi=1); pratiche.salva(c, p)
assert stato(c, "avvia")[1]["stato"] == "consegnata", "un blocco scaduto non ferma la pratica"

# Estratto richiesto all'ufficio (+5 €)
c = nuova(richiediEstratto=True)
assert stato(c)[1]["totale"] == 6500
assert stato(c, "simula-pagamento")[1]["stato"] == "attesa_estratto"
assert stato(c, "avvia")[1]["stato"] == "attesa_estratto"
assert chiama("pratica", {"c": c, "azione": "carica-estratto", "pdf": PDF}, **TOKEN) == (200, {"stato": "pagata"})
assert stato(c, "avvia")[1]["stato"] == "consegnata"

# Limite di invii per indirizzo
pratiche._tentativi.clear()
assert [chiama("invia", {"risposte": RISPOSTE, "pdf": PDF})[0] for _ in range(7)] == [200] * 6 + [429]
pratiche._tentativi.clear()

# Produzione: spento senza STIMA_PENSIONE_ATTIVA, niente pagamento simulato, serve il link
os.environ["VERCEL_ENV"] = "production"
assert chiama("invia", {"risposte": RISPOSTE, "pdf": PDF}, origin="https://praticheflaiano.it")[0] == 503
os.environ["STIMA_PENSIONE_ATTIVA"] = "1"
assert chiama("invia", {"risposte": RISPOSTE, "pdf": PDF}, origin="https://praticheflaiano.it") == (503, {"errore": "pagamento-non-configurato"})
os.environ["STIMA_LINK_PAGAMENTO"] = json.dumps({"6000": "https://link.example/paga60"})
st, corpo = chiama("invia", {"risposte": RISPOSTE, "pdf": PDF}, origin="https://praticheflaiano.it")
assert st == 200 and corpo["next"] == "https://link.example/paga60" and corpo["pratica_url"].startswith("https://praticheflaiano.it/stima-pensione/pratica#c=")
s = chiama("pratica", {"c": corpo["codice"], "n": "1962-03-10", "azione": "simula-pagamento"}, origin="https://praticheflaiano.it")[1]
assert s["stato"] == "ricevuta" and s["pagamento_url"] == "https://link.example/paga60" and s["prova"] is False

print("OK: flusso delle pratiche")
