"""
Documenti Openapi richiesti dall'ufficio dalla pagina riservata /riservata/report-persona.
Uso interno: la pagina la apre solo il titolare, con una password.

Due servizi di Openapi dietro la stessa pagina:
  - Report Persona (API Risk, risk.openapi.com): voce fissa del catalogo;
  - DocuEngine (docuengine.openapi.com): il catalogo dei documenti si legge da Openapi
    (GET /documents: nome, categoria, prezzo, immediato o in differita, dati richiesti),
    quindi nuove voci e nuovi prezzi compaiono da soli.

Cosa fa:
  - accesso con password (REPORT_PERSONA_PASSWORD) e sessione firmata di 12 ore;
  - richiesta del documento a Openapi (a pagamento: ogni richiesta ha un costo);
  - controllo dello stato e scarico dei file quando Openapi li ha evasi;
  - archivio riservato su Vercel Blob (Europa), cancellazione automatica dopo 12 mesi;
  - CRM GoHighLevel: cerca il contatto per codice fiscale e per nome e cognome, aggiunge il
    codice fiscale se manca, allega il PDF al contatto e scrive una nota. Nel CRM il PDF non scade.

Archivio:
  report/richieste/<codice>.json   dati della richiesta
  report/file/<codice>/<n>.bin     i file del documento (di solito un PDF)
  report/catalogo.json             copia del catalogo DocuEngine (si rinnova ogni 6 ore)
  report/accesso/tentativi.json    contatore degli accessi sbagliati

Variabili d'ambiente:
  REPORT_PERSONA_PASSWORD   password della pagina (obbligatoria: senza, la pagina resta chiusa)
  OPENAPI_TOKEN             token Openapi con i permessi Risk (IT-report-persona) e DocuEngine
                            (documents, requests). In alternativa OPENAPI_RISK_TOKEN.
  OPENAPI_PROVA             facoltativa: "1" = ambienti di prova di Openapi, "0" = veri. Senza, l'ambiente si
                            riconosce dal token alla lettura del catalogo (report/ambiente.json)
  OPENAPI_RISK_BASE, OPENAPI_DOCUENGINE_BASE   solo per i test
  GHL_API_TOKEN             lo stesso della stima pensione (vedi _pensione/crm.py)
  REPORT_PERSONA_URL        facoltativa: indirizzo pubblico delle funzioni per l'avviso di Openapi
"""
import hashlib, hmac, json, os, re, secrets, sys, time, unicodedata, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_pensione"))
import archivio  # noqa: E402
import crm  # noqa: E402

COSTO_CENTESIMI = 360          # Report Persona, richiesta singola, IVA esclusa (listino Openapi del 12/11/2026)
CATALOGO_ORE = 6
MAX_FILE = 25_000_000          # un file più grande non viene copiato in archivio
CONSERVAZIONE_GIORNI = 365     # sull'archivio Vercel; nel CRM il PDF resta senza scadenza
SESSIONE_ORE = 12
MAX_ERRATI, BLOCCO_MINUTI = 5, 15
DOPPIONE_ORE = 24
MAX_PDF_RISPOSTA = 3_200_000   # oltre, il PDF in base64 supera il limite di risposta delle funzioni
HOST_OK = re.compile(r"^(praticheflaiano\.it|www\.praticheflaiano\.it|localhost|127\.0\.0\.1|(praticheflaiano-sito|info-praticheflaiano)[a-z0-9-]*\.vercel\.app)$")
CODICE = re.compile(r"^[A-Za-z0-9_-]{16,40}$")
CF = re.compile(r"^[A-Z]{6}[0-9LMNP-V]{2}[A-EHLMPR-T][0-9LMNP-V]{2}[A-Z][0-9LMNP-V]{3}[A-Z]$")
FINALITA = {
    "sovraindebitamento": "Pratica di sovraindebitamento",
    "successione": "Successione",
    "isee-redditi": "ISEE o dichiarazione dei redditi",
    "affitto": "Verifica dell'inquilino (contratto di affitto)",
    "altro": "Altro",
}
CAMPO_FILE = "Documenti Openapi"
REPORT_PERSONA = "report-persona"   # identificativo della voce fissa del catalogo
CAMPO_CF = "Codice Fiscale"


# ---------- utilità ----------

def adesso():
    return datetime.now(timezone.utc)


def iso(quando=None):
    return (quando or adesso()).strftime("%Y-%m-%dT%H:%M:%SZ")


def _da_iso(testo):
    return datetime.strptime(testo, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


def origine(headers):
    m = re.match(r"^(https?://([^/:]+)(:\d+)?)", headers.get("origin") or headers.get("referer") or "")
    return m.group(1) if m and HOST_OK.match(m.group(2)) else None


def rispondi(h, codice, corpo):
    dati = json.dumps(corpo, ensure_ascii=False).encode()
    h.send_response(codice)
    h.send_header("content-type", "application/json; charset=utf-8")
    h.send_header("cache-control", "no-store")
    h.send_header("content-length", str(len(dati)))
    h.end_headers()
    h.wfile.write(dati)


def corpo_json(h, massimo=20_000):
    try:
        n = int(h.headers.get("content-length") or 0)
        dati = json.loads(h.rfile.read(n)) if 0 < n <= massimo else None
    except ValueError:
        dati = None
    return dati if isinstance(dati, dict) else {}


def cf_valido(cf):
    """Controllo formale del codice fiscale: forma e carattere di controllo (omocodie comprese)."""
    if not CF.match(cf or ""):
        return False
    dispari = {**dict(zip("0123456789", (1, 0, 5, 7, 9, 13, 15, 17, 19, 21))),
               **dict(zip("ABCDEFGHIJKLMNOPQRSTUVWXYZ", (1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23)))}
    somma = 0
    for i, c in enumerate(cf[:15]):
        somma += dispari[c] if i % 2 == 0 else (int(c) if c.isdigit() else ord(c) - 65)
    return cf[15] == chr(65 + somma % 26)


def normale(testo):
    """Nome confrontabile: senza accenti, apostrofi e spazi doppi, in minuscolo."""
    t = unicodedata.normalize("NFKD", str(testo or "")).encode("ascii", "ignore").decode().lower()
    return " ".join(re.sub(r"[^a-z ]", " ", t).split())


# ---------- archivio ----------

def _leggi_json(percorso):
    dati = archivio._leggi(percorso)
    try:
        return json.loads(dati) if dati else None
    except ValueError:
        return None


def _scrivi_json(percorso, dati):
    archivio._scrivi(percorso, json.dumps(dati, ensure_ascii=False).encode(), "application/json", True)


def _elimina(percorso):
    cartella = os.environ.get("STIMA_ARCHIVIO_DIR")
    if cartella:
        try:
            os.remove(os.path.join(cartella, percorso))
        except FileNotFoundError:
            pass
        return
    from vercel.blob.sync import BlobNotFoundError, delete_blob
    try:
        delete_blob(percorso)
    except BlobNotFoundError:
        pass


def _codici():
    cartella = os.environ.get("STIMA_ARCHIVIO_DIR")
    if cartella:
        try:
            nomi = os.listdir(os.path.join(cartella, "report/richieste"))
        except FileNotFoundError:
            nomi = []
    else:
        from vercel.blob.sync import query_blobs
        nomi = [b.pathname.rsplit("/", 1)[-1] for b in query_blobs(prefix="report/richieste/")]
    return [n[:-5] for n in nomi if n.endswith(".json") and CODICE.match(n[:-5])]


def carica(codice):
    return _leggi_json(f"report/richieste/{codice}.json") if CODICE.match(codice or "") else None


def salva(r):
    r["aggiornata"] = iso()
    _scrivi_json(f"report/richieste/{r['codice']}.json", r)


def tutte():
    richieste = [r for r in (carica(c) for c in _codici()) if r]
    return sorted(richieste, key=lambda r: r.get("creata", ""), reverse=True)


def file(codice, n):
    """Byte di un file del documento, o None."""
    return archivio._leggi(f"report/file/{codice}/{int(n)}.bin") if CODICE.match(codice or "") else None


def pulizia():
    """Cancella dall'archivio Vercel richieste e file più vecchi di 12 mesi. Restituisce quante."""
    limite = iso(adesso() - timedelta(days=CONSERVAZIONE_GIORNI))
    tolte = 0
    for r in tutte():
        if r.get("creata", "9") < limite:
            for f in r.get("file") or []:
                _elimina(f"report/file/{r['codice']}/{f['n']}.bin")
            _elimina(f"report/richieste/{r['codice']}.json")
            tolte += 1
    return tolte


# ---------- accesso ----------

def _chiave():
    password = os.environ.get("REPORT_PERSONA_PASSWORD") or ""
    return hashlib.sha256(("report-persona|" + password).encode()).digest() if password else None


def _firma(testo):
    return hmac.new(_chiave(), testo.encode(), hashlib.sha256).hexdigest()


def accedi(password):
    """Restituisce (sessione, None) oppure (None, motivo). Dopo 5 errori la pagina si blocca 15 minuti."""
    if not _chiave():
        return None, "non-configurato"
    ora = time.time()
    t = _leggi_json("report/accesso/tentativi.json") or {"n": 0, "da": ora}
    if ora - t.get("da", 0) > BLOCCO_MINUTI * 60:
        t = {"n": 0, "da": ora}
    if t["n"] >= MAX_ERRATI:
        return None, "bloccato"
    if not hmac.compare_digest(str(password or "").encode(), (os.environ.get("REPORT_PERSONA_PASSWORD") or "").encode()):
        _scrivi_json("report/accesso/tentativi.json", {"n": t["n"] + 1, "da": t["da"]})
        return None, "password"
    if t["n"]:
        _scrivi_json("report/accesso/tentativi.json", {"n": 0, "da": ora})
    scadenza = str(int(ora) + SESSIONE_ORE * 3600)
    return f"{scadenza}.{_firma('sessione|' + scadenza)}", None


def sessione_ok(headers):
    if not _chiave():
        return False
    scadenza, _, firma = (headers.get("x-report-sessione") or "").partition(".")
    return scadenza.isdigit() and int(scadenza) > time.time() and hmac.compare_digest(firma, _firma("sessione|" + scadenza))


def segreto_avviso(codice):
    return _firma("avviso|" + codice)[:40]


# ---------- Openapi ----------

def _token():
    return os.environ.get("OPENAPI_TOKEN") or os.environ.get("OPENAPI_RISK_TOKEN") or ""


_ambiente = {}   # in memoria: impronta del token -> True (prova) / False (vero)


def _impronta():
    return hashlib.sha256(_token().encode()).hexdigest()[:16]


def in_prova():
    """True se si lavora sugli ambienti di prova di Openapi (gratuiti, dati finti).
    OPENAPI_PROVA=1 o 0 lo impone; altrimenti vale quello che è stato riconosciuto dal token (vedi _riconosci)."""
    imposto = os.environ.get("OPENAPI_PROVA")
    if imposto in ("0", "1"):
        return imposto == "1"
    impronta = _impronta()
    if impronta not in _ambiente:
        salvato = _leggi_json("report/ambiente.json") or {}
        _ambiente[impronta] = bool(salvato.get("prova")) if salvato.get("token") == impronta else False
    return _ambiente[impronta]


def _riconosci():
    """Il token è rifiutato (401) dall'ambiente in uso: prova l'altro. Un token di prova vale solo sui domini test.*,
    uno vero solo su quelli di produzione, quindi basta una lettura del catalogo (gratuita) per capire quale è.
    Restituisce il catalogo letto dall'altro ambiente, oppure None."""
    if os.environ.get("OPENAPI_PROVA") in ("0", "1") or os.environ.get("OPENAPI_DOCUENGINE_BASE"):
        return None
    impronta, altro = _impronta(), not in_prova()
    _ambiente[impronta] = altro
    try:
        risposta = _openapi("docuengine", "GET", "/documents", attesa=40)
    except Exception:
        _ambiente[impronta] = not altro
        return None
    _scrivi_json("report/ambiente.json", {"token": impronta, "prova": altro, "riconosciuto": iso()})
    return risposta


def _base(servizio):
    if servizio == "catasto":
        return (os.environ.get("OPENAPI_CATASTO_BASE") or ("https://test.catasto.openapi.it" if in_prova() else "https://catasto.openapi.it")).rstrip("/")
    if servizio == "risk":
        return (os.environ.get("OPENAPI_RISK_BASE") or ("https://test.risk.openapi.com" if in_prova() else "https://risk.openapi.com")).rstrip("/")
    return (os.environ.get("OPENAPI_DOCUENGINE_BASE") or ("https://test.docuengine.openapi.com" if in_prova() else "https://docuengine.openapi.com")).rstrip("/")


def _openapi(servizio, metodo, percorso, corpo=None, attesa=30):
    richiesta = urllib.request.Request(
        _base(servizio) + percorso, data=json.dumps(corpo).encode() if corpo is not None else None, method=metodo,
        headers={"authorization": "Bearer " + _token(), "content-type": "application/json",
                 "accept": "application/pdf, application/json", "accept-language": "it", "user-agent": "praticheflaiano-report-persona/1.0 (+https://praticheflaiano.it)"})
    percorso_log = re.sub(r"/[A-Za-z0-9_-]{16,}", "/<id>", percorso)   # nel registro niente identificativi né dati
    try:
        with urllib.request.urlopen(richiesta, timeout=attesa) as r:
            dati = r.read()
        print(f"report: openapi {servizio} {metodo} {percorso_log} -> {r.status} ({len(dati)} byte, {'prova' if in_prova() else 'vero'})")
        return dati
    except urllib.error.HTTPError as e:
        print(f"report: openapi {servizio} {metodo} {percorso_log} -> {e.code} ({'prova' if in_prova() else 'vero'})")
        raise


def _motivo(e):
    """Spiegazione leggibile di un rifiuto di Openapi (senza dati della richiesta)."""
    try:
        dettaglio = str((json.loads(e.read() or b"{}") or {}).get("message") or "")[:200]
    except ValueError:
        dettaglio = ""
    noti = {401: "token Openapi non valido o scaduto", 402: "credito Openapi insufficiente", 403: "il token Openapi non ha il permesso per questo servizio"}
    return f"Openapi ha risposto {e.code}: {noti.get(e.code) or dettaglio or 'richiesta rifiutata'}"


def _indirizzo_avviso(codice):
    base = os.environ.get("REPORT_PERSONA_URL") or ""
    if not base and os.environ.get("VERCEL_ENV") == "production" and os.environ.get("VERCEL_PROJECT_PRODUCTION_URL"):
        base = "https://" + os.environ["VERCEL_PROJECT_PRODUCTION_URL"]
    return f"{base.rstrip('/')}/api/report/avviso?r={codice}&k={segreto_avviso(codice)}" if base.startswith("https://") else ""


# ----- catalogo -----

VOCE_REPORT_PERSONA = {
    "id": REPORT_PERSONA, "servizio": "risk", "nome": "Report Persona", "categoria": "Report sulla persona",
    "descrizione": "Anagrafica, affidabilità, protesti, pregiudizievoli, cariche, partecipazioni e dati catastali nazionali in un unico PDF.",
    "immediato": False, "tempi": "da 10 minuti a 24-48 ore", "ricerca": False, "prezzo": COSTO_CENTESIMI, "prezzo_ricerca": 0, "opzioni": [], "richiedibile": True,
    "campi": [{"chiave": "nome", "nome": "Nome", "tipo": "string", "obbligatorio": True, "aiuto": "", "scelte": []},
              {"chiave": "cognome", "nome": "Cognome", "tipo": "string", "obbligatorio": True, "aiuto": "", "scelte": []},
              {"chiave": "cf", "nome": "Codice fiscale", "tipo": "taxCode", "obbligatorio": True, "aiuto": "", "scelte": []}],
}


DOCUMENTO_DI_PROVA = "documento-di-prova"
VOCE_PROVA = {
    "id": DOCUMENTO_DI_PROVA, "servizio": "prova", "nome": "Documento di prova (gratis)", "categoria": "Prova della pagina",
    "descrizione": "Non chiama Openapi e non costa nulla. Crea un PDF di esempio e gli fa fare tutto il giro vero: archivio, download e, "
                   "se indichi un cliente, ricerca del contatto e allegato nel CRM. Serve a verificare che la pagina funzioni.",
    "immediato": True, "tempi": "subito", "ricerca": False, "prezzo": 0, "prezzo_ricerca": 0, "opzioni": [], "richiedibile": True,
    "campi": [{"chiave": "testo", "nome": "Testo da stampare nel PDF", "tipo": "string", "obbligatorio": True, "aiuto": "Per esempio: prova del 12 novembre.", "scelte": []}],
}

# Spiegazioni in parole semplici, scelte dal nome del documento (Openapi nel catalogo dà solo il nome).
# La prima regola che corrisponde vince: le più specifiche stanno in alto.
SPIEGAZIONI = [
    (r"bilanc|balance", "Il bilancio depositato dalla società al Registro Imprese: stato patrimoniale, conto economico e nota integrativa, così come è stato presentato."),
    (r"storic.*(visura|camer|impres|societ)|(visura|camer|impres|societ).*storic|historic", "Visura camerale storica: i dati attuali dell'impresa più tutte le variazioni dalla nascita (sedi, cariche, capitale, oggetto sociale)."),
    (r"visura.*(camer|ordinar|impres|societ)|company (registration )?report|chamber", "Visura camerale ordinaria: i dati ufficiali dell'impresa oggi (sede, attività, capitale, amministratori, stato)."),
    (r"certificat.*(iscrizion|vigenz)|registration certificate", "Certificato della Camera di Commercio: attesta l'iscrizione dell'impresa e, se di vigenza, che non ha procedure concorsuali in corso."),
    (r"soci|shareholder|quote", "Elenco dei soci e delle quote di partecipazione della società."),
    (r"cariche|representative|amministrator", "Elenco di chi ricopre cariche nell'impresa (amministratori, sindaci, procuratori), oppure le cariche ricoperte da una persona."),
    (r"protest.*(pregiud|prejud)|(pregiud|prejud).*protest", "Visura completa su una persona o impresa: protesti, pregiudizievoli di conservatoria (ipoteche giudiziali, pignoramenti) e procedure concorsuali."),
    (r"protest", "Visura protesti: assegni e cambiali non pagati registrati a nome del soggetto, con importo, data e motivo."),
    (r"pregiud|prejud", "Pregiudizievoli di conservatoria: ipoteche giudiziali, pignoramenti e sequestri iscritti contro il soggetto."),
    (r"negativ|negative", "Controllo veloce: dice se a carico del soggetto risultano protesti, pregiudizievoli o procedure, senza il dettaglio."),
    (r"planimetr", "Planimetria catastale: il disegno in scala dell'unità immobiliare depositato al Catasto. Si rilascia solo al proprietario o a chi ha la sua delega."),
    (r"mappa|map extract|estratto di mappa", "Estratto di mappa catastale: la porzione di mappa del Catasto terreni con la particella e i confini."),
    (r"ipotec|mortgage|ispezion", "Ispezione ipotecaria: le formalità in Conservatoria (compravendite, ipoteche, pignoramenti) su un immobile o a nome di una persona."),
    (r"visura.*catast|catast.*(visura|report)|cadastral", "Visura catastale: i dati del Catasto su un immobile o su tutti gli immobili di un soggetto (categoria, classe, rendita, intestatari)."),
    (r"durc", "DURC: attesta che l'impresa è in regola con i contributi INPS, INAIL e Cassa Edile."),
    (r"\bpra\b|targa|veicol|vehicle", "Visura PRA: proprietario e dati del veicolo, con eventuali fermi amministrativi, ipoteche o altri vincoli."),
    (r"anagraf|residenz|stato di famiglia|nascita|matrimon|morte", "Certificato anagrafico o di stato civile rilasciato dal Comune."),
    (r"casellario|carichi pendenti", "Certificato del Tribunale: casellario giudiziale o carichi pendenti della persona."),
    (r"statuto|atto costitutivo", "Copia dell'atto costitutivo o dello statuto depositato dalla società al Registro Imprese."),
    (r"fascicol", "Fascicolo dell'impresa: visura più statuto, ultimo bilancio e altri documenti depositati, in un unico file."),
]


def spiegazione(nome, aiuto=""):
    """Cosa si ottiene, in parole semplici. Usa il testo di Openapi se c'è, altrimenti la spiegazione scelta dal nome."""
    if len(aiuto) > 30:
        return aiuto
    testo = normale(nome)
    for regola, frase in SPIEGAZIONI:
        if re.search(regola, testo):
            return frase
    return aiuto


def _centesimi(euro):
    try:
        return round(float(euro or 0) * 100)
    except (TypeError, ValueError):
        return 0


def _testo(html, massimo=400):
    """Testo semplice da un aiuto di Openapi (a volte contiene HTML)."""
    return " ".join(re.sub(r"<[^>]+>", " ", str(html or "")).split())[:massimo]


def _voce(d):
    """Voce del catalogo DocuEngine nella forma usata dalla pagina."""
    struttura = d.get("requestStructure") or {}
    campi = []
    for chiave, c in (struttura.get("fields") or {}).items():
        if not isinstance(c, dict):
            continue
        campi.append({"chiave": chiave, "nome": str(c.get("nameIT") or c.get("name") or chiave), "tipo": str(c.get("type") or "string"), "obbligatorio": bool(c.get("required")),
                      "aiuto": _testo(c.get("help")), "scelte": [{"codice": str(o.get("code")), "nome": str(o.get("description") or o.get("code"))} for o in (c.get("options") or []) if isinstance(o, dict)]})
    campi.sort(key=lambda c: (len(c["chiave"]), c["chiave"]))
    sincrono = bool(d.get("isSync"))
    return {"id": str(d.get("id")), "servizio": "docuengine", "nome": str(d.get("name") or "Documento"), "categoria": str(d.get("category") or "Altro"),
            "descrizione": spiegazione(d.get("name"), _testo(struttura.get("help"))), "immediato": sincrono, "tempi": "subito" if sincrono else "in differita (da qualche minuto a qualche giorno, secondo il documento)",
            "ricerca": bool(d.get("hasSearch")), "prezzo": _centesimi(d.get("totalPrice") if d.get("totalPrice") is not None else d.get("documentPrice")),
            "prezzo_ricerca": _centesimi(d.get("searchPrice")), "prezzo_documento": _centesimi(d.get("documentPrice")),
            "opzioni": [{"nome": str(o.get("name")), "prezzo": _centesimi(o.get("price"))} for o in (d.get("options") or []) if isinstance(o, dict) and o.get("name")],
            "campi": campi, "richiedibile": not any(c["tipo"] == "file" and c["obbligatorio"] for c in campi),
            "successione": bool(re.search(SUCCESSIONE, normale(d.get("name"))))}


def catalogo(rinnova=False):
    """Catalogo dei documenti: Report Persona più tutto DocuEngine, letto da Openapi e tenuto in archivio per 6 ore.
    Restituisce {"voci": [...], "letto": iso, "errore": testo o None}."""
    salvato = _leggi_json("report/catalogo.json") or {}
    stessa_base = salvato.get("base") == _base("docuengine")
    fresco = stessa_base and salvato.get("letto", "") > iso(adesso() - timedelta(hours=CATALOGO_ORE))
    errore = None
    if _token() and (rinnova or not fresco):
        try:
            try:
                grezzo = _openapi("docuengine", "GET", "/documents", attesa=40)
            except urllib.error.HTTPError as e:
                grezzo = _riconosci() if e.code == 401 else None
                if grezzo is None:
                    raise
            risposta = json.loads(grezzo or b"{}")
            voci = [_voce(d) for d in (risposta.get("data") or []) if isinstance(d, dict) and d.get("id")]
            if voci:
                salvato = {"letto": iso(), "base": _base("docuengine"), "voci": sorted(voci, key=lambda v: (v["categoria"].lower(), v["nome"].lower()))}
                _scrivi_json("report/catalogo.json", salvato)
                stessa_base = True
            else:
                errore = "Openapi ha restituito un catalogo vuoto."
        except urllib.error.HTTPError as e:
            errore = "Catalogo dei documenti non letto. " + _motivo(e)
        except Exception as e:
            errore = f"Catalogo dei documenti non letto ({type(e).__name__})."
    stessa_base = salvato.get("base") == _base("docuengine")
    voci = (salvato.get("voci") or []) if stessa_base else []
    pubbliche = [{k: val for k, val in v.items() if k != "catasto"} for v in VOCI_CATASTO]
    return {"voci": [VOCE_PROVA, VOCE_REPORT_PERSONA] + pubbliche + voci, "letto": salvato.get("letto") if stessa_base else None, "errore": errore, "prova": in_prova()}


def voce(ident):
    for v in VOCI_CATASTO:
        if v["id"] == ident:
            return v
    for v in catalogo()["voci"]:
        if v["id"] == ident:
            return v
    return None


# ----- Catasto e Conservatoria (API Catasto di Openapi: non sta nel catalogo DocuEngine) -----
# Voci fisse. Prezzi a richiesta singola, IVA esclusa, dal listino pubblico Openapi letto il 12/11/2026:
# vanno ricontrollati se Openapi cambia listino (console.openapi.com/it/apis/catasto/pricing).

def _c(chiave, nome, tipo="string", obbligatorio=True, aiuto="", scelte=()):
    return {"chiave": chiave, "nome": nome, "tipo": tipo, "obbligatorio": obbligatorio, "aiuto": aiuto, "scelte": [{"codice": a, "nome": b} for a, b in scelte]}


_CF = _c("cf_piva", "Codice fiscale o partita IVA dell'intestatario", "taxCode", aiuto="Per una successione: il codice fiscale del defunto.")
_PROVINCIA = _c("provincia", "Provincia (sigla)", "provincia", aiuto="Due lettere, per esempio RM.")
_TIPO_TF = _c("tipo_catasto", "Catasto", scelte=(("TF", "Fabbricati e terreni"), ("F", "Solo fabbricati"), ("T", "Solo terreni")))
_TIPO_FT = _c("tipo_catasto", "Catasto", scelte=(("F", "Fabbricati"), ("T", "Terreni")))
_TIPO_VISURA = _c("tipo_visura", "Tipo di visura", scelte=(("ordinaria", "Attuale"), ("storica", "Storica (con tutti i passaggi)")))
_COMUNE = _c("comune", "Comune", aiuto="Il nome per esteso, per esempio ROMA.")
_FOGLIO, _PARTICELLA = _c("foglio", "Foglio", "integer"), _c("particella", "Particella", "integer")
_SUBALTERNO = _c("subalterno", "Subalterno", "integer", False)
_SEZIONE = _c("sezione", "Sezione", obbligatorio=False, aiuto="Solo per i comuni divisi in sezioni.")
_CONSERVATORIA = _c("conservatoria", "Conservatoria", aiuto="Il nome dell'ufficio, per esempio ROMA 1. Con l'ispezione nazionale scopri in quali conservatorie ci sono formalità.")
_NON_TN_BZ = " Non disponibile per le province di Trento e Bolzano."


def _catasto(ident, nome, descrizione, prezzo, tempi, campi, percorso, lettura, fisso=None, adatta=None):
    return {"id": "catasto-" + ident, "servizio": "catasto", "nome": nome, "categoria": "Catasto e Conservatoria", "descrizione": descrizione + _NON_TN_BZ,
            "immediato": False, "tempi": tempi, "ricerca": False, "prezzo": prezzo, "prezzo_ricerca": 0, "opzioni": [], "richiedibile": True, "successione": True,
            "campi": campi, "catasto": {"percorso": percorso, "lettura": lettura, "fisso": fisso or {}, "adatta": adatta}}


VOCI_CATASTO = [
    _catasto("ricerca-nazionale", "Ricerca nazionale immobili",
             "Dice in quali province e comuni d'Italia il soggetto ha fabbricati o terreni e quanti. È il primo passo: non dà il dettaglio degli immobili.",
             30, "in pochi minuti", [_CF, _TIPO_TF], "/richiesta/ricerca_nazionale/", "/richiesta"),
    _catasto("ricerca-persona", "Elenco immobili di una persona in una provincia",
             "Elenco dei fabbricati e dei terreni intestati al soggetto in una provincia, con categoria, classe, consistenza, rendita e quota di titolarità.",
             30, "in pochi minuti", [_CF, _PROVINCIA, _TIPO_TF], "/richiesta/ricerca_persona/", "/richiesta"),
    _catasto("visura-soggetto", "Visura catastale per soggetto",
             "Il documento ufficiale del Catasto (PDF) con tutti gli immobili intestati al soggetto in una provincia: dati catastali, rendite e quote.",
             190, "in pochi minuti", [_CF, _PROVINCIA, _TIPO_TF, _TIPO_VISURA], "/visura_catastale", "/visura_catastale", {"entita": "soggetto"}),
    _catasto("visura-immobile", "Visura catastale per immobile",
             "Il documento ufficiale del Catasto (PDF) di un singolo immobile: categoria, classe, consistenza, rendita, superficie e intestatari con le quote. La storica riporta tutti i passaggi.",
             190, "in pochi minuti", [_TIPO_FT, _PROVINCIA, _COMUNE, _SEZIONE, _FOGLIO, _PARTICELLA, _SUBALTERNO, _TIPO_VISURA], "/visura_catastale", "/visura_catastale", {"entita": "immobile"}),
    _catasto("ipoteche-nazionale", "Ispezione ipotecaria nazionale",
             "Dice in quali conservatorie d'Italia risultano trascrizioni, iscrizioni o annotazioni a nome del soggetto. Serve a sapere dove chiedere poi l'ispezione vera.",
             2370, "in pochi minuti", [_CF], "/ipotecarie-ispezione_nazionale", "/ipotecarie"),
    _catasto("ipoteche-soggetto", "Ispezione ipotecaria per soggetto",
             "Elenco delle formalità in una conservatoria a nome del soggetto: compravendite, successioni, donazioni, ipoteche, pignoramenti. "
             "Riporta notaio, data e repertorio di ogni atto: sono gli estremi per chiedere la copia dell'atto di provenienza.",
             1090, "in pochi minuti", [_CF, _CONSERVATORIA], "/ipotecarie-elenco-note", "/ipotecarie", {"entita": "ispezione_soggetto"}),
    _catasto("ipoteche-immobile", "Ispezione ipotecaria per immobile",
             "Elenco delle formalità registrate su un immobile: passaggi di proprietà, ipoteche (per esempio il mutuo del defunto), pignoramenti.",
             1090, "in pochi minuti", [_CONSERVATORIA, _COMUNE, _TIPO_FT, _FOGLIO, _PARTICELLA, _SUBALTERNO], "/ipotecarie-elenco-note", "/ipotecarie", {"entita": "ispezione_immobile"}),
    _catasto("nota", "Dettaglio di una nota di conservatoria",
             "Il testo completo (PDF) di una singola nota di trascrizione o iscrizione, trovata con l'ispezione ipotecaria: parti, immobili e contenuto dell'atto.",
             690, "in pochi minuti",
             [_CF, _CONSERVATORIA, _c("anno", "Anno della nota", "integer"),
              _c("tipo_registro", "Registro", scelte=(("generale", "Generale"), ("particolare", "Particolare"))), _c("numero", "Numero di registro", "integer"),
              _c("tipo_nota", "Tipo di nota", obbligatorio=False, aiuto="Serve solo con il registro particolare.", scelte=(("trascrizioni", "Trascrizione"), ("iscrizioni", "Iscrizione"), ("annotazioni", "Annotazione")))],
             "/ipotecarie-dettaglio-nota", "/ipotecarie", {"tipo_restrizione": "soggetto"}, "nota"),
    _catasto("elaborato-planimetrico", "Elaborato planimetrico",
             "Il disegno (PDF) che mostra come è diviso un fabbricato in subalterni e parti comuni. Non è la planimetria del singolo appartamento, che richiede la delega del proprietario.",
             690, "entro 24 ore lavorative", [_PROVINCIA, _COMUNE, _SEZIONE, _FOGLIO, _PARTICELLA], "/elaborato_planimetrico", "/elaborato_planimetrico"),
    _catasto("estratto-mappa", "Estratto di mappa",
             "La porzione di mappa del Catasto terreni (PDF) con la particella e i suoi confini. Utile per i terreni caduti in successione.",
             690, "entro 24 ore lavorative", [_PROVINCIA, _COMUNE, _SEZIONE, _FOGLIO, _PARTICELLA], "/estratto_mappa", "/estratto_mappa"),
]

# Documenti del catalogo DocuEngine che servono in una successione, riconosciuti dal nome.
SUCCESSIONE = r"famiglia|residenza|matrimon|morte|decess|\bpra\b|targa|planimetr|ipotec|catast|eredi|successio"


def _corpo_catasto(v, ricerca):
    """Corpo della chiamata all'API Catasto, dai dati inseriti. Restituisce (corpo, None) oppure (None, motivo)."""
    corpo = {**v["catasto"]["fisso"], **ricerca}
    for c in v["campi"]:
        if c["tipo"] == "integer" and c["chiave"] in corpo:
            corpo[c["chiave"]] = int(corpo[c["chiave"]])
    if v["catasto"]["adatta"] == "nota":
        numero, tipo_nota = corpo.pop("numero"), corpo.pop("tipo_nota", None)
        if corpo["tipo_registro"] == "generale":
            corpo["registro_generale"] = numero
        elif not tipo_nota:
            return None, "Con il registro particolare va indicato il tipo di nota."
        else:
            corpo.update(registro_particolare=numero, tipo_nota=tipo_nota)
    return corpo, None


def _righe(dati, rientro=0):
    """Righe di testo leggibili da un risultato JSON di Openapi (dizionari e liste annidati)."""
    spazio = "    " * rientro
    if isinstance(dati, dict):
        for chiave, valore in dati.items():
            etichetta = str(chiave).replace("_", " ").capitalize()
            if isinstance(valore, (dict, list)):
                if valore:
                    yield f"{spazio}{etichetta}:"
                    yield from _righe(valore, rientro + 1)
            elif valore not in (None, ""):
                yield f"{spazio}{etichetta}: {valore}"
    elif isinstance(dati, list):
        for n, elemento in enumerate(dati, 1):
            if isinstance(elemento, (dict, list)):
                yield f"{spazio}{n}."
                yield from _righe(elemento, rientro + 1)
            else:
                yield f"{spazio}- {elemento}"
    elif dati not in (None, ""):
        yield f"{spazio}{dati}"


def _pdf_esito(titolo, sottotitolo, dati):
    """PDF leggibile con il risultato di una ricerca che Openapi restituisce solo come dati (senza documento)."""
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    uscita = BytesIO()
    c = canvas.Canvas(uscita, pagesize=A4)
    c.setTitle(titolo)

    def testata():
        c.setFont("Helvetica-Bold", 15)
        c.drawString(50, 800, titolo.encode("latin-1", "replace").decode("latin-1")[:80])
        c.setFont("Helvetica", 9)
        c.drawString(50, 785, sottotitolo.encode("latin-1", "replace").decode("latin-1")[:120])
        return 760
    y = testata()
    c.setFont("Helvetica", 10)
    righe = list(_righe(dati)) or ["Nessun risultato."]
    for riga in righe[:3000]:
        riga = riga.encode("latin-1", "replace").decode("latin-1")
        for pezzo in ([riga[i:i + 105] for i in range(0, len(riga), 105)] or [""]):
            if y < 50:
                c.showPage()
                y = testata()
                c.setFont("Helvetica", 10)
            c.drawString(50, y, pezzo)
            y -= 13
    c.showPage()
    c.save()
    return uscita.getvalue()


def _controlla_catasto(r, v, dati=None):
    """Legge lo stato di una richiesta all'API Catasto e, se evasa, salva il documento ufficiale e/o il risultato.
    Restituisce True se la richiesta è arrivata a una conclusione (pronta o fallita)."""
    lettura, ident = v["catasto"]["lettura"], urllib.parse.quote(r["openapi"], safe="")
    if dati is None:
        dati = json.loads(_openapi("catasto", "GET", f"{lettura}/{ident}") or b"{}").get("data") or {}
    stato = str(dati.get("stato") or "").lower()
    r["stato_openapi"], r["controllata"] = stato or "?", iso()
    if stato != "evasa":
        return False
    esito = dati.get("esito")
    codice = esito.get("codice") if isinstance(esito, dict) else None
    risultato, giorno = dati.get("risultato"), r["creata"][:10]
    r["file"] = []
    if dati.get("documento") and lettura != "/richiesta":
        try:
            pdf = _openapi("catasto", "GET", f"{lettura}/{ident}/documento", attesa=40)
            if pdf.startswith(b"%PDF"):
                _salva_file(r, len(r["file"]), f"{v['id']}-{giorno}.pdf", "application/pdf", pdf)
        except urllib.error.HTTPError as e:
            if e.code == 422:   # documento non ancora disponibile
                return False
            raise
    if risultato:
        sottotitolo = " · ".join(f"{c['nome']}: {c['valore']}" for c in r.get("campi") or []) + f" · richiesta del {giorno[8:]}/{giorno[5:7]}/{giorno[:4]}"
        _salva_file(r, len(r["file"]), f"{v['id']}-esito-{giorno}.pdf", "application/pdf", _pdf_esito(v["nome"], sottotitolo, risultato))
        _salva_file(r, len(r["file"]), f"{v['id']}-dati-{giorno}.json", "application/json", json.dumps(risultato, ensure_ascii=False, indent=2).encode())
    if not r["file"]:
        # Evasa senza documento né dati: di solito vuol dire "non risulta nulla" (nessun immobile, nessuna formalità).
        # È comunque una risposta, e va conservata: PDF con l'esito dichiarato da Openapi.
        dettaglio = str((esito.get("info") if isinstance(esito, dict) else esito) or "nessun dettaglio")[:200]
        sottotitolo = " · ".join(f"{c['nome']}: {c['valore']}" for c in r.get("campi") or []) + f" · richiesta del {giorno[8:]}/{giorno[5:7]}/{giorno[:4]}"
        _salva_file(r, 0, f"{v['id']}-esito-{giorno}.pdf", "application/pdf",
                    _pdf_esito(v["nome"], sottotitolo, {"esito": "Openapi ha evaso la richiesta senza risultati", "risposta di Openapi": dettaglio, "codice": codice}))
        r["avviso"] = f"Openapi ha evaso la richiesta senza risultati ({dettaglio}). Nel PDF trovi l'esito."
    r.update(stato="pronto", pronta=iso())
    return True


# ----- richieste -----

def prepara(v, valori, opzioni):
    """Controlla i dati inseriti per una voce del catalogo. Restituisce (ricerca, campi leggibili, opzioni, costo) oppure (None, motivo, None, None)."""
    if not v.get("richiedibile"):
        return None, "Questo documento richiede di allegare dei file: da questa pagina non si può ancora chiedere.", None, None
    ricerca, leggibili = {}, []
    for c in v["campi"]:
        valore = " ".join(str((valori or {}).get(c["chiave"]) or "").split())[:300]
        if c["tipo"] == "file":
            continue
        if c["tipo"] == "taxCode" or c["chiave"] == "cf":
            valore = valore.replace(" ", "").upper()
        if not valore:
            if c["obbligatorio"]:
                return None, f"Manca il dato obbligatorio: {c['nome']}.", None, None
            continue
        if c["scelte"] and valore not in {s["codice"] for s in c["scelte"]}:
            return None, f"Valore non ammesso per: {c['nome']}.", None, None
        if c["tipo"] == "provincia":
            valore = valore.upper()
            if not re.fullmatch(r"[A-Z]{2}", valore):
                return None, f"{c['nome']}: servono le due lettere della sigla, per esempio RM.", None, None
        if c["tipo"] == "integer" and not re.fullmatch(r"\d{1,9}", valore):
            return None, f"{c['nome']}: deve essere un numero.", None, None
        if c["tipo"] == "taxCode" and not (re.fullmatch(r"\d{11}", valore) or cf_valido(valore)):
            return None, f"{c['nome']}: non è un codice fiscale o una partita IVA valida.", None, None
        ricerca[c["chiave"]] = valore
        scelta = next((s["nome"] for s in c["scelte"] if s["codice"] == valore), valore)
        leggibili.append({"nome": c["nome"], "valore": scelta})
    if not ricerca:
        return None, "Inserisci almeno un dato per la ricerca.", None, None
    ammesse = {o["nome"]: o["prezzo"] for o in v["opzioni"]}
    scelte = [o for o in (opzioni or []) if o in ammesse]
    return ricerca, leggibili, scelte, v["prezzo"] + sum(ammesse[o] for o in scelte)


def doppione(documento, ricerca):
    """Stessa richiesta (stesso documento, stessi dati) nelle ultime 24 ore, per non pagare due volte per sbaglio."""
    limite = iso(adesso() - timedelta(hours=DOPPIONE_ORE))
    for r in tutte():
        if r.get("documento") == documento and r.get("ricerca") == ricerca and r.get("creata", "") > limite and r.get("stato") not in ("errore", "annullata"):
            return r
    return None


def richiedi(v, ricerca, leggibili, opzioni, costo, persona, finalita, nota):
    """Registra la richiesta e la manda a Openapi. Viene salvata PRIMA della chiamata: se la risposta si perde resta
    traccia, e l'esito incerto viene segnalato (potrebbe essere stata addebitata).
    `persona`: {"nome", "cognome", "cf"} della persona a cui collegare il documento nel CRM (anche vuoti)."""
    codice = secrets.token_urlsafe(15)
    r = {"codice": codice, "servizio": v["servizio"], "documento": v["id"], "titolo": v["nome"], "immediato": v["immediato"], "ricerca": ricerca, "campi": leggibili,
         "opzioni": opzioni, "nome": persona.get("nome") or "", "cognome": persona.get("cognome") or "", "cf": persona.get("cf") or "", "finalita": finalita, "nota": nota,
         "consenso": True, "creata": iso(), "stato": "invio", "costo": costo, "file": [], "ghl": {"stato": "da_cercare"}, "prova": in_prova()}
    salva(r)
    if v["servizio"] == "prova":
        r["prova"] = True
        _salva_file(r, 0, f"documento-di-prova-{r['creata'][:10]}.pdf", "application/pdf", _pdf_di_prova(ricerca.get("testo", ""), r["creata"]))
        r.update(stato="pronto", pronta=iso())
        salva(r)
        return r
    avviso = _indirizzo_avviso(codice)
    try:
        if v["servizio"] == "risk":
            corpo = {"name": ricerca["nome"], "surname": ricerca["cognome"], "taxCode": ricerca["cf"]}
            if avviso:
                corpo["callback"] = {"url": avviso, "method": "JSON"}
            risposta = json.loads(_openapi("risk", "POST", "/IT-report-persona/", corpo) or b"{}")
            dati = risposta.get("data") or {}
            ident = dati.get("id") or (dati.get("callback") or {}).get("id")   # nell'esempio ufficiale l'id è dentro "callback"
        elif v["servizio"] == "catasto":
            corpo, motivo = _corpo_catasto(v, ricerca)
            if corpo is None:
                r.update(stato="errore", errore=motivo, costo=0)
                salva(r)
                return r
            if avviso:
                corpo["callback"] = {"url": avviso, "method": "JSON"}
            risposta = json.loads(_openapi("catasto", "POST", v["catasto"]["percorso"], corpo, attesa=60) or b"{}")
            dati = risposta.get("data") or {}
            ident = dati.get("id")
        else:
            corpo = {"documentId": v["id"], "search": ricerca}
            if opzioni:
                corpo["selectedOptions"] = opzioni
            if avviso:
                corpo["callback"] = {"url": avviso, "method": "JSON", "headers": {"x-origine": "praticheflaiano"}}   # senza "headers" Openapi rifiuta (errore 311)
            risposta = json.loads(_openapi("docuengine", "POST", "/requests", corpo, attesa=60) or b"{}")
            dati = risposta.get("data") or {}
            ident = dati.get("id")
        if not risposta.get("success") or not ident:
            r.update(stato="errore", errore=f"Openapi non ha accettato la richiesta ({str(risposta.get('message') or risposta.get('error') or 'risposta inattesa')[:200]})", costo=0)
        else:
            r.update(stato="in_lavorazione", openapi=str(ident))
            if v["servizio"] == "docuengine":
                _stato_docuengine(r, dati)
            elif v["servizio"] == "catasto":
                _controlla_catasto(r, v, dati)   # in prova (e a volte dal vero) la risposta è già completa
    except urllib.error.HTTPError as e:
        r.update(stato="errore", errore=_motivo(e), costo=0)
    except Exception as e:
        r.update(stato="errore", incerto=True, errore=f"Nessuna risposta da Openapi ({type(e).__name__}): la richiesta potrebbe essere partita lo stesso. Controlla su console.openapi.com prima di ripeterla.")
    salva(r)
    return controlla(r) if r["stato"] == "pronto_da_scaricare" else r


def _pdf_di_prova(testo, quando):
    """PDF di una pagina creato qui, senza Openapi: serve a provare archivio, download e CRM."""
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    uscita = BytesIO()
    c = canvas.Canvas(uscita, pagesize=A4)
    c.setTitle("Documento di prova")
    c.setFont("Helvetica-Bold", 20)
    c.drawString(60, 770, "Documento di prova")
    c.setFont("Helvetica", 12)
    righe = ["Creato dalla pagina riservata di Centro Pratiche Flaiano il " + f"{quando[8:10]}/{quando[5:7]}/{quando[:4]} alle {quando[11:16]} UTC.",
             "Non proviene da Openapi e non contiene dati reali.", "", "Testo inserito:", testo[:90]]
    for n, riga in enumerate(righe):
        c.drawString(60, 730 - 20 * n, riga.encode("latin-1", "replace").decode("latin-1"))
    c.showPage()
    c.save()
    return uscita.getvalue()


def _stato_docuengine(r, dati):
    """Porta nella richiesta lo stato letto da DocuEngine (NEW, SEARCH, WAIT, DONE, CANCELLED)."""
    stato = str(dati.get("state") or "").upper()
    r["stato_openapi"], r["controllata"] = stato or "?", iso()
    if dati.get("totalPrice") is not None:
        r["costo"] = _centesimi(dati["totalPrice"]) + _centesimi(dati.get("optionsPrice"))
    risultati = [x for x in (dati.get("results") or []) if isinstance(x, dict)]
    if stato == "CANCELLED":
        r.update(stato="annullata", errore="Openapi ha annullato la richiesta" + (f": {str(dati['cancellationReason'])[:200]}" if dati.get("cancellationReason") else "."), costo=0)
    elif stato == "DONE":
        r["stato"] = "pronto_da_scaricare"
    elif risultati and not dati.get("resultId"):
        # la ricerca ha trovato più risultati (più immobili, più annualità...): va scelto quello giusto
        r["stato"] = "da_scegliere"
        r["risultati"] = [{"id": str(x.get("id") or x.get("resultId") or ""), "testo": " · ".join(str(val) for k, val in x.items() if k not in ("id", "resultId") and isinstance(val, (str, int, float)) and str(val))[:300]}
                          for x in risultati[:50] if x.get("id") or x.get("resultId")]
    else:
        r["stato"] = "in_lavorazione"


def scegli(r, risultato):
    """Scelta di uno dei risultati proposti da Openapi (PATCH con resultId): da qui parte il documento vero."""
    if r.get("stato") != "da_scegliere" or risultato not in {x["id"] for x in r.get("risultati") or []}:
        return None
    try:
        risposta = json.loads(_openapi("docuengine", "PATCH", f"/requests/{urllib.parse.quote(r['openapi'], safe='')}", {"resultId": risultato}, attesa=60) or b"{}")
        r.pop("risultati", None)
        r["stato"] = "in_lavorazione"
        _stato_docuengine(r, risposta.get("data") or {})
        r.pop("errore", None)
    except urllib.error.HTTPError as e:
        r["errore"] = _motivo(e)
    except Exception as e:
        r["errore"] = f"Scelta non registrata ({type(e).__name__}). Riprova."
    salva(r)
    return controlla(r)


def _salva_file(r, n, nome, tipo, dati):
    archivio._scrivi(f"report/file/{r['codice']}/{n}.bin", dati, tipo or "application/octet-stream", True)
    r["file"].append({"n": n, "nome": nome, "tipo": tipo or "application/octet-stream", "dimensione": len(dati)})


def _scarica(indirizzo):
    """Scarica un file da un indirizzo firmato restituito da Openapi (solo https, dimensione limitata)."""
    if not str(indirizzo).startswith("https://") and not os.environ.get("OPENAPI_DOCUENGINE_BASE"):
        return None
    richiesta = urllib.request.Request(indirizzo, headers={"user-agent": "praticheflaiano-report-persona/1.0 (+https://praticheflaiano.it)"})
    with urllib.request.urlopen(richiesta, timeout=40) as risposta:
        dati = risposta.read(MAX_FILE + 1)
    return dati if len(dati) <= MAX_FILE else None


def controlla(r):
    """Se il documento è pronto lo copia nell'archivio e lo allega al contatto. Restituisce la richiesta aggiornata."""
    if r.get("stato") not in ("in_lavorazione", "pronto_da_scaricare") or not r.get("openapi") or not _token():
        return r
    ident = urllib.parse.quote(r["openapi"], safe="")
    try:
        if r.get("servizio") == "risk":
            dati = _openapi("risk", "GET", f"/IT-report-persona/{ident}/download", attesa=40)
            if not dati.startswith(b"%PDF"):
                return r
            r["file"] = []
            _salva_file(r, 0, f"report-persona-{r['cf']}-{r['creata'][:10]}.pdf", "application/pdf", dati)
        elif r.get("servizio") == "catasto":
            v = voce(r["documento"])
            if not v or not _controlla_catasto(r, v):
                salva(r)
                return r
            if r["stato"] != "pronto":
                salva(r)
                return r
        else:
            if r["stato"] == "in_lavorazione":
                _stato_docuengine(r, json.loads(_openapi("docuengine", "GET", f"/requests/{ident}") or b"{}").get("data") or {})
                if r["stato"] != "pronto_da_scaricare":
                    salva(r)
                    return r
            elenco = json.loads(_openapi("docuengine", "GET", f"/requests/{ident}/documents", attesa=40) or b"{}").get("data") or []
            r["file"], saltati = [], 0
            for n, f in enumerate(x for x in elenco[:10] if isinstance(x, dict) and x.get("downloadUrl")):
                dati = _scarica(f["downloadUrl"])
                if dati is None:
                    saltati += 1
                    continue
                _salva_file(r, n, re.sub(r"[^A-Za-z0-9._-]", "_", str(f.get("fileName") or f"documento-{n}"))[:120], str(f.get("mimeType") or ""), dati)
            if not r["file"]:
                r["ultimo_controllo"] = "Openapi dice che il documento è pronto ma non ho potuto scaricare i file: riprova con Aggiorna."
                r["stato"] = "pronto_da_scaricare"
                salva(r)
                return r
            if saltati:
                r["avviso"] = f"{saltati} file troppo grandi non sono stati copiati in archivio: scaricali da console.openapi.com."
    except urllib.error.HTTPError as e:
        if e.code not in (404, 406, 422):   # 406 / 422 = il documento non è ancora stato creato
            r["ultimo_controllo"] = f"Openapi ha risposto {e.code}"
        elif r.get("servizio") == "risk":
            r["stato_openapi"] = "non ancora pronto"
        r["controllata"] = iso()
        salva(r)
        return r
    except Exception as e:
        print("report: controllo non riuscito", type(e).__name__)
        return r
    r.update(stato="pronto", pronta=iso())
    r.pop("ultimo_controllo", None)
    salva(r)
    return allega(r)


# ---------- CRM GoHighLevel ----------

def _campi():
    return crm._api("GET", f"/locations/{crm.LOCATION}/customFields?model=contact").get("customFields") or []


def _campo(campi, cosa):
    for c in campi:
        nome, chiave, tipo = normale(c.get("name")), str(c.get("fieldKey") or "").lower(), str(c.get("dataType") or "").upper()
        if cosa == "cf" and tipo != "FILE_UPLOAD" and (re.fullmatch(r"(codice fiscale|cod fiscale|cf|c f)( .*)?", nome) or re.search(r"codice_?fiscale|\.cf$", chiave)):
            return c.get("id")
        if cosa == "file" and tipo == "FILE_UPLOAD" and nome == normale(CAMPO_FILE):
            return c.get("id")
    return None


def _crea_campo(cosa):
    corpo = {"name": CAMPO_CF, "dataType": "TEXT", "model": "contact"} if cosa == "cf" else \
        {"name": CAMPO_FILE, "dataType": "FILE_UPLOAD", "model": "contact", "isMultipleFile": True, "maxNumberOfFiles": 50}
    return (crm._api("POST", f"/locations/{crm.LOCATION}/customFields", corpo).get("customField") or {}).get("id")


def _cerca(testo, filtri=None):
    corpo = {"locationId": crm.LOCATION, "pageLimit": 50}
    corpo.update({"filters": filtri} if filtri else {"query": testo})
    try:
        return crm._api("POST", "/contacts/search", corpo).get("contacts") or []
    except urllib.error.HTTPError:
        if filtri:
            return []
        return crm._api("GET", f"/contacts/?locationId={crm.LOCATION}&limit=50&query={urllib.parse.quote(testo)}").get("contacts") or []


def _valore(contatto, campo):
    for c in contatto.get("customFields") or []:
        if c.get("id") == campo:
            return str(c.get("value") or "").strip().upper()
    return ""


def _nomi(contatto):
    nome = normale(contatto.get("firstName") or contatto.get("firstNameLowerCase"))
    cognome = normale(contatto.get("lastName") or contatto.get("lastNameLowerCase"))
    intero = normale(contatto.get("contactName") or contatto.get("name") or f"{nome} {cognome}")
    return nome, cognome, intero


def _scheda(contatto, campo_cf):
    nome, cognome, intero = _nomi(contatto)
    return {"id": contatto.get("id"), "nome": (contatto.get("contactName") or f"{contatto.get('firstName') or nome} {contatto.get('lastName') or cognome}").strip().title() or intero.title(),
            "email": contatto.get("email") or "", "telefono": contatto.get("phone") or "", "cf": _valore(contatto, campo_cf) if campo_cf else ""}


def cerca_contatto(r):
    """Cerca il contatto: prima per codice fiscale, poi incrociando nome e cognome.
    Esiti (in r["ghl"]["stato"]): trovato, da_scegliere (con i candidati), nessuno, errore."""
    if not crm.configurato():
        r["ghl"] = {"stato": "non_configurato"}
        return r
    if not r.get("cf") and not (r.get("nome") and r.get("cognome")):
        r["ghl"] = {"stato": "senza_persona"}   # documento su un'azienda o un immobile: nessun contatto da cercare
        salva(r)
        return r
    try:
        campo_cf = _campo(_campi(), "cf")
        trovati = {}
        if campo_cf and r.get("cf"):
            for c in _cerca(r["cf"], [{"field": f"customFields.{campo_cf}", "operator": "eq", "value": r["cf"]}]):
                trovati[c.get("id")] = c
        for testo in (f"{r['nome']} {r['cognome']}".strip(), r.get("cf")):
            for c in (_cerca(testo) if testo else []):
                trovati.setdefault(c.get("id"), c)
        nome, cognome = normale(r["nome"]), normale(r["cognome"])
        con_cf = [c for c in trovati.values() if campo_cf and r.get("cf") and _valore(c, campo_cf) == r["cf"]]
        omonimi = []
        for c in trovati.values():
            n, g, intero = _nomi(c)
            if c in con_cf:
                continue
            if nome and cognome and ((n == nome and g == cognome) or (n == cognome and g == nome) or intero in (f"{nome} {cognome}", f"{cognome} {nome}")):
                omonimi.append(c)
        if len(con_cf) == 1:
            r["ghl"] = {"stato": "trovato", "contatto": con_cf[0]["id"], "nome": _scheda(con_cf[0], campo_cf)["nome"], "come": "codice fiscale"}
        elif not con_cf and len(omonimi) == 1 and not (campo_cf and _valore(omonimi[0], campo_cf)):
            # un solo contatto con quel nome e senza codice fiscale: è lui, e il codice fiscale va aggiunto
            r["ghl"] = {"stato": "trovato", "contatto": omonimi[0]["id"], "nome": _scheda(omonimi[0], campo_cf)["nome"], "come": "nome e cognome", "aggiungi_cf": bool(r.get("cf"))}
        elif con_cf or omonimi:
            r["ghl"] = {"stato": "da_scegliere", "candidati": [_scheda(c, campo_cf) for c in (con_cf + omonimi)[:10]]}
        else:
            r["ghl"] = {"stato": "nessuno"}
    except Exception as e:
        print("report: ricerca contatto non riuscita", type(e).__name__, getattr(e, "code", ""))
        r["ghl"] = {"stato": "errore", "errore": f"Ricerca nel CRM non riuscita ({type(e).__name__} {getattr(e, 'code', '')})".strip()}
    if r["ghl"].get("aggiungi_cf"):
        _scrivi_cf(r)
    salva(r)
    return r


def _scrivi_cf(r):
    """Aggiunge il codice fiscale al contatto se non ne ha uno (mai sovrascrive un codice diverso)."""
    g = r["ghl"]
    g.pop("aggiungi_cf", None)
    if not r.get("cf"):
        return
    try:
        campi = _campi()
        campo = _campo(campi, "cf") or _crea_campo("cf")
        attuale = _valore((crm._api("GET", f"/contacts/{g['contatto']}").get("contact") or {}), campo)
        if attuale and attuale != r["cf"]:
            g["avviso"] = f"Il contatto ha già un codice fiscale diverso ({attuale}): non è stato modificato."
        elif not attuale:
            crm._api("PUT", f"/contacts/{g['contatto']}", {"customFields": [{"id": campo, "value": r["cf"]}]})
            g["cf_aggiunto"] = True
    except Exception as e:
        print("report: codice fiscale non scritto", type(e).__name__, getattr(e, "code", ""))
        g["avviso"] = "Non sono riuscito ad aggiungere il codice fiscale al contatto."


def collega(r, contatto=None, crea=False):
    """Scelta fatta dalla pagina: un contatto tra i candidati, oppure la creazione di uno nuovo."""
    try:
        if crea:
            if not (r.get("nome") and r.get("cognome")):
                return None
            corpo = {"locationId": crm.LOCATION, "firstName": r["nome"].title(), "lastName": r["cognome"].title(), "source": "Documenti Openapi (area riservata)"}
            if r.get("cf"):
                corpo["customFields"] = [{"id": _campo(_campi(), "cf") or _crea_campo("cf"), "value": r["cf"]}]
            nuovo = crm._api("POST", "/contacts/", corpo)
            ident = (nuovo.get("contact") or {}).get("id")
            if not ident:
                raise ValueError("contatto non creato")
            r["ghl"] = {"stato": "trovato", "contatto": ident, "nome": f"{r['nome']} {r['cognome']}".title(), "come": "creato ora", "cf_aggiunto": bool(r.get("cf"))}
        else:
            ammessi = {c["id"]: c for c in (r.get("ghl") or {}).get("candidati") or []}
            if contatto not in ammessi:
                return None
            r["ghl"] = {"stato": "trovato", "contatto": contatto, "nome": ammessi[contatto]["nome"], "come": "scelto da te"}
            _scrivi_cf(r)
    except Exception as e:
        print("report: collegamento non riuscito", type(e).__name__, getattr(e, "code", ""))
        r["ghl"] = {**(r.get("ghl") or {}), "errore": f"Operazione sul CRM non riuscita ({type(e).__name__} {getattr(e, 'code', '')})".strip()}
        salva(r)
        return r
    salva(r)
    return allega(r)


def _carica_file(contatto, campo, nome_file, dati, tipo="application/pdf"):
    confine = "----report" + secrets.token_hex(12)
    chiave = f"{campo}_{secrets.token_hex(8)}"
    corpo = (f"--{confine}\r\nContent-Disposition: form-data; name=\"{chiave}\"; filename=\"{nome_file}\"\r\nContent-Type: {tipo}\r\n\r\n").encode() + dati + f"\r\n--{confine}--\r\n".encode()
    base = os.environ.get("GHL_API_BASE", "https://services.leadconnectorhq.com").rstrip("/")
    richiesta = urllib.request.Request(
        f"{base}/forms/upload-custom-files?contactId={contatto}&locationId={crm.LOCATION}", data=corpo, method="POST",
        headers={"authorization": "Bearer " + os.environ["GHL_API_TOKEN"], "version": "2021-07-28", "accept": "application/json",
                 "content-type": f"multipart/form-data; boundary={confine}", "user-agent": "praticheflaiano-report-persona/1.0 (+https://praticheflaiano.it)"})
    with urllib.request.urlopen(richiesta, timeout=40) as risposta:
        risposta.read()


def allega(r):
    """Quando il documento è pronto e il contatto è deciso: file nel campo "Documenti Openapi" del contatto e nota."""
    g = r.get("ghl") or {}
    if r.get("stato") != "pronto" or g.get("stato") != "trovato" or g.get("allegato") or not r.get("file"):
        return r
    try:
        campo = _campo(_campi(), "file") or _crea_campo("file")
        giorno = r["creata"][:10]
        for f in r["file"]:
            dati = file(r["codice"], f["n"])
            if dati:
                _carica_file(g["contatto"], campo, f["nome"], dati, f["tipo"])
        g["allegato"] = iso()
        g.pop("errore", None)
        crm._prova("nota", lambda: crm._api("POST", f"/contacts/{g['contatto']}/notes", {"body": (
            f"{r['titolo'].upper()} (Openapi) - richiesto il {giorno[8:]}/{giorno[5:7]}/{giorno[:4]}\nFinalità: {FINALITA.get(r['finalita'], r['finalita'])}"
            + (f" - {r['nota']}" if r.get("nota") else "") + f"\nIl documento è nel campo \"{CAMPO_FILE}\" del contatto.")}))
    except Exception as e:
        print("report: allegato non riuscito", type(e).__name__, getattr(e, "code", ""))
        g["errore"] = f"Non sono riuscito ad allegare il documento al contatto ({type(e).__name__} {getattr(e, 'code', '')})".strip()
    r["ghl"] = g
    salva(r)
    return r


# ---------- viste ----------

def vista(r):
    g = r.get("ghl") or {}
    stato = "in_lavorazione" if r["stato"] == "pronto_da_scaricare" else r["stato"]
    return {"codice": r["codice"], "titolo": r.get("titolo") or "Report Persona", "campi": r.get("campi") or [], "opzioni": r.get("opzioni") or [],
            "persona": " ".join(x for x in (r.get("nome"), r.get("cognome")) if x), "cf": r.get("cf") or "", "finalita": FINALITA.get(r.get("finalita"), r.get("finalita")), "nota": r.get("nota") or "",
            "creata": r["creata"], "pronta": r.get("pronta"), "stato": stato, "errore": r.get("errore"), "incerto": bool(r.get("incerto")), "ultimo_controllo": r.get("ultimo_controllo"),
            "stato_openapi": r.get("stato_openapi"), "controllata": r.get("controllata"), "avviso": r.get("avviso"), "costo": r.get("costo", 0), "prova": bool(r.get("prova")), "risultati": r.get("risultati") if stato == "da_scegliere" else None,
            "file": [{"n": f["n"], "nome": f["nome"], "scaricabile": f["dimensione"] <= MAX_PDF_RISPOSTA} for f in r.get("file") or []] if stato == "pronto" else [],
            "scade": iso(_da_iso(r["creata"]) + timedelta(days=CONSERVAZIONE_GIORNI))[:10],
            "ghl": {k: g.get(k) for k in ("stato", "nome", "come", "candidati", "allegato", "errore", "avviso", "cf_aggiunto") if g.get(k)}}


def configurazione():
    return {"openapi": bool(_token()), "prova": in_prova(), "ghl": crm.configurato(), "archivio": archivio.configurato(), "avviso": bool(_indirizzo_avviso("x" * 20))}
