"""
Pratiche della "Stima e Calcolo della pensione": registrazione prima del pagamento, prezzo,
stati, avvio dell'elaborazione dopo il pagamento. Il pagamento avviene sul checkout GHL: i coupon
(100% per le prove, 50% associati) sono creati e applicati lì, il sito non li gestisce.

Stati di una pratica:
  ricevuta         dati e documenti salvati, in attesa del pagamento
  attesa_estratto  pagata, ma l'estratto contributivo lo deve richiedere l'ufficio
  pagata           pagata (anche a zero euro con coupon GHL), pronta per il calcolo
  in_elaborazione  calcolo in corso (una sola esecuzione alla volta: file di blocco)
  consegnata       prospetto pronto e scaricabile dal cliente
  da_rivedere      prospetto pronto ma trattenuto: i controlli chiedono una verifica dell'ufficio
  fallita          calcolo non riuscito (si può riprovare fino a MAX_TENTATIVI)

Variabili d'ambiente:
  STIMA_PENSIONE_ATTIVA   "1" per accettare pratiche in produzione (sulle anteprime è sempre attivo)
  STIMA_LINK_PAGAMENTO    JSON {"6000": "https://...", "6500": "https://..."}
                          (prezzo pieno in centesimi -> link di pagamento del prodotto GHL)
  STIMA_PENSIONE_TOKEN    segreto che GHL presenta nell'avviso di pagamento (intestazione x-stima-token)
"""
import base64, hashlib, json, os, re, secrets, time
from datetime import date, datetime, timezone

import archivio

PREZZO_BASE, PREZZO_ESTRATTO = 6000, 500  # centesimi
MAX_TENTATIVI = 2
BLOCCO_SCADUTO = 400  # secondi: oltre il limite della funzione (300 s) il calcolo è sicuramente morto
MAX_B64 = 4_200_000
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")
EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
B64 = re.compile(r"[A-Za-z0-9+/=]+")
HOST_OK = re.compile(r"^(praticheflaiano\.it|www\.praticheflaiano\.it|localhost|127\.0\.0\.1|praticheflaiano-sito[a-z0-9-]*\.vercel\.app)$")
_tentativi = {}


# ---------- ambiente e richieste ----------

def in_produzione():
    return os.environ.get("VERCEL_ENV") == "production"


def attivo():
    return not in_produzione() or os.environ.get("STIMA_PENSIONE_ATTIVA") == "1"


def adesso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def origine(headers):
    """Indirizzo del sito da cui arriva la richiesta se è uno dei nostri, altrimenti None."""
    m = re.match(r"^(https?://([^/:]+)(:\d+)?)", headers.get("origin") or headers.get("referer") or "")
    return m.group(1) if m and HOST_OK.match(m.group(2)) else None


def token_ok(headers):
    atteso = os.environ.get("STIMA_PENSIONE_TOKEN")
    return bool(atteso) and secrets.compare_digest(headers.get("x-stima-token") or "", atteso)


def entro_limite(chiave, massimo, finestra=3600):
    """Limite di richieste in memoria (best-effort: vale per la singola istanza della funzione)."""
    ora = time.time()
    n, da = _tentativi.get(chiave, (0, ora))
    if ora - da > finestra:
        n, da = 0, ora
    _tentativi[chiave] = (n + 1, da)
    return n < massimo


def ip(headers):
    return (headers.get("x-forwarded-for") or "sconosciuto").split(",")[0].strip()


def rispondi(h, codice, corpo):
    dati = json.dumps(corpo, ensure_ascii=False).encode()
    h.send_response(codice)
    h.send_header("content-type", "application/json; charset=utf-8")
    h.send_header("cache-control", "no-store")
    h.send_header("content-length", str(len(dati)))
    h.end_headers()
    h.wfile.write(dati)


def corpo_json(h, massimo):
    try:
        n = int(h.headers.get("content-length") or 0)
        dati = json.loads(h.rfile.read(n)) if 0 < n <= massimo else None
    except ValueError:
        dati = None
    return dati if isinstance(dati, dict) else None


# ---------- prezzo ----------

def prezzo(richiedi_estratto):
    """Prezzo pieno in centesimi (eventuali sconti si applicano sul checkout GHL)."""
    return {"totale": PREZZO_BASE + (PREZZO_ESTRATTO if richiedi_estratto else 0), "estratto": bool(richiedi_estratto)}


def link_pagamento(centesimi):
    try:
        link = (json.loads(os.environ.get("STIMA_LINK_PAGAMENTO") or "{}") or {}).get(str(centesimi), "")
    except ValueError:
        link = ""
    return link if isinstance(link, str) and link.startswith("https://") else ""


# ---------- archivio delle pratiche ----------

def impronta_email(email):
    return hashlib.sha256(str(email or "").strip().lower().encode()).hexdigest()[:40]


def impronta_telefono(telefono):
    """Impronta delle ultime 9 cifre (senza prefisso internazionale), o "" se il numero è troppo corto."""
    cifre = re.sub(r"\D", "", str(telefono or ""))
    return hashlib.sha256(("tel:" + cifre[-9:]).encode()).hexdigest()[:40] if len(cifre) >= 9 else ""


def carica(codice):
    if not archivio.CODICE.match(str(codice or "")):
        return None
    grezzo = archivio.leggi(codice, "pratica.json")
    return json.loads(grezzo) if grezzo else None


def salva(codice, pratica):
    pratica["aggiornata"] = adesso()
    archivio.salva(codice, "pratica.json", json.dumps(pratica, ensure_ascii=False).encode(), "application/json")


def _pdf(b64):
    return bool(b64) and bool(B64.fullmatch(b64)) and base64.b64decode(b64[:16] + "=" * (-len(b64[:16]) % 4)).startswith(b"%PDF")


def crea(dati, sito):
    """Registra una pratica prima del pagamento. Restituisce (stato HTTP, corpo)."""
    r = dati.get("risposte") if isinstance(dati.get("risposte"), dict) else {}
    if (not ISO.match(str(r.get("nascita", ""))) or r.get("sesso") not in ("M", "F") or not EMAIL.match(str(r.get("email", "")))
            or not str(r.get("nome", "")).strip() or not str(r.get("cognome", "")).strip()):
        return 400, {"errore": "risposte"}
    if not (r.get("privacy") is True and r.get("condizioni") is True and r.get("salute") is True):
        return 400, {"errore": "consensi"}
    richiedi = r.get("richiediEstratto") is True
    documenti = {k: dati.get(k) or "" for k in ("pdf", "simulazione", "busta")}
    if any(not isinstance(v, str) or (v and not B64.fullmatch(v)) for v in documenti.values()) or sum(len(v) for v in documenti.values()) > MAX_B64:
        return 400, {"errore": "documenti"}
    if (not richiedi and not _pdf(documenti["pdf"])) or (richiedi and documenti["pdf"]):
        return 400, {"errore": "estratto"}
    p = prezzo(richiedi)
    link = link_pagamento(p["totale"])
    if not link and in_produzione():
        return 503, {"errore": "pagamento-non-configurato"}

    codice = secrets.token_urlsafe(15)
    nomi = {"pdf": "estratto.pdf", "simulazione": "simulazione.bin", "busta": "busta.bin"}
    for chiave, b64 in documenti.items():
        if b64:
            archivio.salva(codice, nomi[chiave], base64.b64decode(b64), "application/pdf" if chiave == "pdf" else "application/octet-stream")
    pre = dati.get("prelettura_settimane")
    pratica = {
        "nascita": r["nascita"], "creata": adesso(), "stato": "ricevuta", "tentativi": 0,
        "risposte": {k: v for k, v in r.items() if k not in ("privacy", "salute", "condizioni")},
        "consensi": {"privacy": True, "condizioni": True, "salute": True, "quando": adesso()},
        "documenti": [k for k, v in documenti.items() if v],
        "prelettura_settimane": pre if isinstance(pre, (int, float)) and not isinstance(pre, bool) and 0 < pre < 4000 else None,
        "prezzo": p, "pagamento": None,
    }
    salva(codice, pratica)
    archivio.segna("email/" + impronta_email(r["email"]), codice)
    if impronta_telefono(r.get("telefono")):
        archivio.segna("tel/" + impronta_telefono(r.get("telefono")), codice)
    pagina = f"{sito}/stima-pensione/pratica#c={codice}"
    return 200, {"codice": codice, "stato": pratica["stato"], "totale": p["totale"], "pratica_url": pagina, "next": link or pagina}


def paga(codice, come, riferimento="", importo=""):
    """Segna pagata una pratica in attesa. Ripetibile: una pratica già pagata resta com'è
    (l'avviso di pagamento di GHL può arrivare due volte)."""
    pratica = carica(codice)
    if not pratica:
        return None
    if pratica["stato"] == "ricevuta":
        pratica["pagamento"] = {"quando": adesso(), "come": come, "riferimento": str(riferimento or "")[:120], "importo": str(importo or "")[:20]}
        pratica["stato"] = "attesa_estratto" if pratica["prezzo"]["estratto"] and "pdf" not in pratica["documenti"] else "pagata"
        salva(codice, pratica)
    return pratica


def paga_da_contatto(email="", telefono="", riferimento="", importo=""):
    """Avviso di pagamento arrivato da GHL: segna pagata la pratica in attesa più recente che ha
    quella email oppure, se non ce n'è, quel telefono (GHL può unire l'ordine a un contatto già
    esistente con un'altra email). L'importo incassato (ridotto o azzerato da un coupon) viene solo
    annotato."""
    gruppi = []
    if EMAIL.match(str(email or "")):
        gruppi.append("email/" + impronta_email(email))
    if impronta_telefono(telefono):
        gruppi.append("tel/" + impronta_telefono(telefono))
    for gruppo in gruppi:
        attese = []
        for codice in archivio.elenco(gruppo):
            pratica = carica(codice)
            if pratica and pratica.get("stato") == "ricevuta":
                attese.append((pratica["creata"], codice))
        if attese:
            codice = max(attese)[1]
            return codice if paga(codice, "ghl", riferimento, importo) else None
    return None


def carica_estratto(codice, b64):
    """L'ufficio aggiunge l'estratto richiesto per conto del cliente: la pratica diventa pronta."""
    pratica = carica(codice)
    if not pratica or pratica["stato"] != "attesa_estratto" or not _pdf(b64) or len(b64) > MAX_B64:
        return None
    archivio.salva(codice, "estratto.pdf", base64.b64decode(b64), "application/pdf")
    pratica["documenti"].append("pdf")
    pratica["stato"] = "pagata"
    salva(codice, pratica)
    return pratica


def rilascia(codice):
    """L'ufficio ha verificato una pratica trattenuta: il prospetto diventa scaricabile."""
    pratica = carica(codice)
    if not pratica or pratica["stato"] != "da_rivedere":
        return None
    pratica["stato"] = "consegnata"
    pratica["rilasciata"] = adesso()
    salva(codice, pratica)
    return pratica


def _secondi_da(quando):
    try:
        return time.time() - datetime.strptime(quando, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc).timestamp()
    except (TypeError, ValueError):
        return 1e9


def avvia(codice, chiave, sito, elabora):
    """Esegue il calcolo di una pratica pagata. `elabora` è la funzione di api/stima/elabora.py.
    Una sola esecuzione alla volta (file di blocco creato in modo atomico); restituisce la pratica."""
    pratica = carica(codice)
    if not pratica:
        return None
    if pratica["stato"] == "in_elaborazione" and _secondi_da(pratica.get("avviata")) > BLOCCO_SCADUTO:
        pratica.update(stato="fallita", errore="tempo-scaduto")
        salva(codice, pratica)
        archivio.elimina(codice, "blocco.json")
    if pratica["stato"] not in ("pagata", "fallita") or (pratica["stato"] == "fallita" and pratica.get("tentativi", 0) >= MAX_TENTATIVI):
        return pratica
    if not archivio.salva_nuovo(codice, "blocco.json", adesso().encode(), "application/json"):
        pratica["stato"] = "in_elaborazione"
        return pratica
    try:
        pratica.update(stato="in_elaborazione", avviata=adesso(), tentativi=pratica.get("tentativi", 0) + 1, errore="")
        salva(codice, pratica)
        esito, corpo = 500, {}
        try:
            dati = {"risposte": {**pratica["risposte"], "privacy": True, "salute": True, "condizioni": True},
                    "prelettura_settimane": pratica.get("prelettura_settimane")}
            for chiave_doc, nome in (("pdf", "estratto.pdf"), ("simulazione", "simulazione.bin"), ("busta", "busta.bin")):
                if chiave_doc in pratica["documenti"]:
                    dati[chiave_doc] = base64.b64encode(archivio.leggi(codice, nome) or b"").decode()
            esito, corpo = elabora(dati, chiave, sito, codice)
        except Exception as e:  # non si scrive nei log il contenuto dei documenti
            print("pratiche: calcolo non riuscito", type(e).__name__)
            corpo = {"errore": "elaborazione"}
        if esito == 200 and corpo.get("archiviato"):
            stima = {k: v for k, v in corpo.items() if k not in ("pdf_base64", "codice", "recupero_url", "archiviato")}
            pratica.update(stima=stima, stato="da_rivedere" if stima.get("revisione_consigliata") else "consegnata", consegnata=adesso())
        else:
            pratica.update(stato="fallita", errore=str(corpo.get("errore") or f"http-{esito}")[:60])
        salva(codice, pratica)
    finally:
        archivio.elimina(codice, "blocco.json")
    return pratica


def vista_cliente(pratica):
    """Quello che il cliente può vedere della propria pratica."""
    v = {"stato": pratica["stato"], "totale": pratica["prezzo"]["totale"], "creata": pratica["creata"],
         "prelettura_settimane": pratica.get("prelettura_settimane"), "nome": pratica["risposte"].get("nome", "")}
    if pratica["stato"] == "ricevuta":
        v["pagamento_url"] = link_pagamento(pratica["prezzo"]["totale"])
        v["prova"] = not in_produzione()
    if pratica["stato"] == "fallita":
        v["riprovabile"] = pratica.get("tentativi", 0) < MAX_TENTATIVI
    return v
