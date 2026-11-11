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
    assert chiama("pagamento", {"contact": {"email": "mario.rossi@example.com"}, "order_id": "ord_1", "amount": 0}, **TOKEN) == (200, {"ok": True, "pratica": True}), "il secondo avviso riconosce la stessa pratica"
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
assert chiama("prospetto", {"c": recente, "n": "1962-03-10"})[0] == 200  # stima provvisoria: il prospetto si scarica subito
assert chiama("pratica", {"c": recente, "azione": "rilascia"})[0] == 403, "le azioni dell'ufficio vogliono il segreto"
assert chiama("pratica", {"c": recente, "azione": "dettaglio"}, **{"x-stima-token": "sbagliato"})[0] == 403
d = chiama("pratica", {"c": recente, "azione": "dettaglio"}, **TOKEN)[1]
assert d["stato"] == "da_rivedere" and d["stima"]["revisione"] == ["letture dell'estratto discordanti"] and d["risposte"]["email"]
assert chiama("pratica", {"c": recente, "azione": "pdf"}, **TOKEN)[1]["pdf_base64"] == base64.b64encode(b"%PDF-finto").decode()
assert chiama("pratica", {"c": recente, "azione": "rilascia"}, **TOKEN)[1]["stato"] == "consegnata"
assert chiama("pratica", {"c": recente, "azione": "rilascia"}, **TOKEN)[0] == 409
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
#    l'ufficio lo rimette in coda e lo fa ripartire
assert chiama("pratica", {"c": vecchia, "azione": "riprova"}, **TOKEN)[1]["stato"] == "pagata"
assert chiama("pratica", {"c": vecchia, "azione": "calcola"}, **TOKEN)[1]["stato"] == "consegnata"

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
assert chiama("pratica", {"c": c, "azione": "carica-estratto", "pdf": PDF}, **TOKEN)[1]["stato"] == "pagata"
assert stato(c, "avvia")[1]["stato"] == "consegnata"

# Chi paga ha email e telefono diversi da chi ha compilato il questionario.
def chiudi_attese():
    for gruppo in ("attesa/pratiche", "pagamenti/aperti"):
        for cod in archivio.elenco(gruppo):
            archivio.togli(gruppo, cod)


# a) stesso telefono: si abbina da sola
chiudi_attese()
c = nuova(email="altra@example.com", telefono="371 623 0000")
assert chiama("pagamento", {"email": "contatto-ghl@example.com", "phone": "+393716230000"}, **TOKEN) == (200, {"ok": True, "pratica": True})
assert stato(c)[1]["stato"] == "pagata" and archivio.elenco("attesa/pratiche") == []
# b) nessun dato in comune ma una sola pratica in attesa: è la sua
c = nuova(email="figlia@example.com", telefono="333 111 2222")
assert stato(c)[1]["da_abbinare"] is False
assert chiama("pagamento", {"email": "padre@example.com", "phone": "+393409998888", "order_id": "ord_9"}, **TOKEN) == (200, {"ok": True, "pratica": True})
assert stato(c)[1]["stato"] == "pagata" and pratiche.carica(c)["pagamento"]["come"] == "ghl-unica-in-attesa"
#    l'avviso ripetuto dello stesso ordine non paga la pratica di un altro
altro = nuova(email="altro-cliente@example.com", telefono="333 444 5555")
assert chiama("pagamento", {"email": "padre@example.com", "phone": "+393409998888", "order_id": "ord_9"}, **TOKEN) == (200, {"ok": True, "pratica": True})
assert stato(altro)[1]["stato"] == "ricevuta" and stato(altro)[1]["da_abbinare"] is False
chiudi_attese()
# c) due pratiche in attesa: il pagamento resta aperto e lo abbina chi indica con che cosa ha pagato
uno, due = nuova(email="uno@example.com", telefono="333 000 0001"), nuova(email="due@example.com", telefono="333 000 0002")
for _ in range(2):  # anche qui l'avviso può arrivare due volte: resta un solo pagamento aperto
    assert chiama("pagamento", {"email": "pagante@example.com", "phone": "+393477776666"}, **TOKEN) == (200, {"ok": True, "pratica": False})
assert len(archivio.elenco("pagamenti/aperti")) == 1
assert stato(uno)[1]["da_abbinare"] is True and stato(due)[1]["da_abbinare"] is True
assert chiama("pratica", {"c": uno, "n": "1962-03-10", "azione": "reclama", "contatto": "sbagliata@example.com"})[1]["stato"] == "ricevuta"
assert chiama("pratica", {"c": due, "n": "1962-03-10", "azione": "reclama", "contatto": " Pagante@Example.com "})[1]["stato"] == "pagata"
assert chiama("pratica", {"c": uno, "n": "1962-03-10", "azione": "reclama", "contatto": "pagante@example.com"})[1]["stato"] == "ricevuta", "un pagamento vale per una pratica sola"
assert stato(uno)[1]["da_abbinare"] is False
#    ...anche dal telefono, e un pagamento arrivato PRIMA della pratica non si può reclamare
chiama("pagamento", {"email": "x@example.com", "phone": "+39 347 555 4444"}, **TOKEN)
tardi = nuova(email="tardi@example.com", telefono="333 000 0003")
assert stato(tardi)[1]["da_abbinare"] is False
assert chiama("pratica", {"c": tardi, "n": "1962-03-10", "azione": "reclama", "contatto": "3475554444"})[1]["stato"] == "ricevuta"
assert chiama("pratica", {"c": uno, "n": "1962-03-10", "azione": "reclama", "contatto": "347 555 4444"})[1]["stato"] == "pagata"
assert chiama("pagamento", {"nome": "x"}, **TOKEN)[0] == 400
chiudi_attese()

# Limite di invii per indirizzo
pratiche._tentativi.clear()
assert [chiama("invia", {"risposte": RISPOSTE, "pdf": PDF})[0] for _ in range(7)] == [200] * 6 + [429]
pratiche._tentativi.clear()

# Collegamento con il CRM: un GHL finto registra le chiamate
from http.server import BaseHTTPRequestHandler
chiamate = []


class GhlFinto(BaseHTTPRequestHandler):
    def _fai(self):
        n = int(self.headers.get("content-length") or 0)
        corpo = json.loads(self.rfile.read(n)) if n else None
        assert self.headers["authorization"] == "Bearer token-finto" and self.headers["version"] == "2021-07-28"
        chiamate.append((self.command, self.path.split("?")[0], corpo))
        risposta = {"contact": {"id": "cont_1"}, "opportunity": {"id": "opp_1"},
                    "pipelines": [{"id": "pip_1", "name": "Calcolo Pensione", "stages": [
                        {"id": "f_ric", "name": "Ricevuta Richiesta"}, {"id": "f_ini", "name": "Inizio Elaborazione"}, {"id": "f_blo", "name": "Bloccata mancanza dati"},
                        {"id": "f_att", "name": "In attesa certificazioni da istituto"}, {"id": "f_eff", "name": "calcolo effettuato"}, {"id": "f_chi", "name": "Chiusa"},
                        {"id": "f_ver", "name": "Da verificare in ufficio"}]}]}
        dati = json.dumps(risposta).encode()
        self.send_response(200); self.send_header("content-type", "application/json"); self.send_header("content-length", str(len(dati))); self.end_headers(); self.wfile.write(dati)
    do_GET = do_POST = do_PUT = _fai

    def log_message(self, *a):
        pass


ghl = HTTPServer(("127.0.0.1", 0), GhlFinto)
threading.Thread(target=ghl.serve_forever, daemon=True).start()
os.environ["GHL_API_TOKEN"], os.environ["GHL_API_BASE"] = "token-finto", f"http://127.0.0.1:{ghl.server_port}"
chiudi_attese()
c = nuova(email="crm@example.com", telefono="333 777 8888", invalidita="civile", invaliditaPct="75", situazione="privato")
assert [x[:2] for x in chiamate] == [("POST", "/contacts/upsert"), ("GET", "/opportunities/pipelines"), ("POST", "/opportunities/"), ("POST", "/contacts/cont_1/notes"), ("POST", "/conversations/messages")], chiamate
assert chiamate[2][2]["pipelineStageId"] == "f_ric" and chiamate[2][2]["contactId"] == "cont_1" and chiamate[2][2]["monetaryValue"] == 60
nota_q = chiamate[3][2]["body"]
assert "Situazione lavorativa: privato" in nota_q and "/stima-pensione/ufficio#c=" + c in nota_q and "invalid" not in nota_q.lower().replace("salute", "") and "75" not in nota_q, nota_q
assert pratiche.carica(c)["crm"]["opportunita"] == "opp_1"
chiamate.clear()
stato(c, "simula-pagamento")
assert [x[:2] for x in chiamate] == [("PUT", "/opportunities/opp_1"), ("POST", "/contacts/cont_1/notes")] and chiamate[0][2]["pipelineStageId"] == "f_ini"
chiamate.clear()
esiti["revisione"] = ["scarto dalla simulazione INPS oltre il 10%"]
assert stato(c, "avvia")[1]["stato"] == "da_rivedere"
assert [x[:2] for x in chiamate] == [("PUT", "/opportunities/opp_1"), ("POST", "/contacts/cont_1/notes"), ("POST", "/contacts/cont_1/tasks"), ("POST", "/conversations/messages")], chiamate
assert chiamate[0][2]["pipelineStageId"] == "f_ver" and "scarto dalla simulazione" in chiamate[2][2]["body"]
chiamate.clear()
chiama("pratica", {"c": c, "azione": "rilascia"}, **TOKEN)
assert chiamate[0][2]["pipelineStageId"] == "f_eff" and chiamate[0][2]["status"] == "won" and chiamate[-1][1] == "/conversations/messages"
esiti["revisione"] = []
#    CRM irraggiungibile: la pratica va avanti lo stesso
os.environ["GHL_API_BASE"] = "http://127.0.0.1:9"
c = nuova(email="senza-crm@example.com")
assert stato(c)[1]["stato"] == "ricevuta"
del os.environ["GHL_API_TOKEN"]
chiudi_attese()

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
