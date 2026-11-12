"""
Report Persona (Openapi, API Risk): richieste fatte dall'ufficio dalla pagina riservata
/riservata/report-persona. Uso interno: la pagina la apre solo il titolare, con una password.

Cosa fa:
  - accesso con password (REPORT_PERSONA_PASSWORD) e sessione firmata di 12 ore;
  - richiesta del report a Openapi (a pagamento: ogni richiesta ha un costo);
  - controllo dello stato e scarico del PDF quando Openapi lo ha evaso;
  - archivio riservato su Vercel Blob (Europa), cancellazione automatica dopo 12 mesi;
  - CRM GoHighLevel: cerca il contatto per codice fiscale e per nome e cognome, aggiunge il
    codice fiscale se manca, allega il PDF al contatto e scrive una nota. Nel CRM il PDF non scade.

Archivio:
  report/richieste/<codice>.json   dati della richiesta
  report/pdf/<codice>.pdf          il report
  report/accesso/tentativi.json    contatore degli accessi sbagliati

Variabili d'ambiente:
  REPORT_PERSONA_PASSWORD   password della pagina (obbligatoria: senza, la pagina resta chiusa)
  OPENAPI_RISK_TOKEN        token Openapi con il permesso IT-report-persona
  OPENAPI_RISK_BASE         facoltativa: https://test.risk.openapi.com per l'ambiente di prova
  GHL_API_TOKEN             lo stesso della stima pensione (vedi _pensione/crm.py)
  REPORT_PERSONA_URL        facoltativa: indirizzo pubblico delle funzioni per l'avviso di Openapi
"""
import hashlib, hmac, json, os, re, secrets, sys, time, unicodedata, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_pensione"))
import archivio  # noqa: E402
import crm  # noqa: E402

COSTO_CENTESIMI = 360          # richiesta singola, IVA esclusa (listino Openapi del 12/11/2026)
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
CAMPO_FILE = "Report Persona"
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


def pdf(codice):
    return archivio._leggi(f"report/pdf/{codice}.pdf") if CODICE.match(codice or "") else None


def pulizia():
    """Cancella dall'archivio Vercel richieste e PDF più vecchi di 12 mesi. Restituisce quante."""
    limite = iso(adesso() - timedelta(days=CONSERVAZIONE_GIORNI))
    tolte = 0
    for r in tutte():
        if r.get("creata", "9") < limite:
            _elimina(f"report/pdf/{r['codice']}.pdf")
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

def _openapi(metodo, percorso, corpo=None, attesa=30):
    base = (os.environ.get("OPENAPI_RISK_BASE") or "https://risk.openapi.com").rstrip("/")
    richiesta = urllib.request.Request(
        base + percorso, data=json.dumps(corpo).encode() if corpo is not None else None, method=metodo,
        headers={"authorization": "Bearer " + os.environ["OPENAPI_RISK_TOKEN"], "content-type": "application/json",
                 "accept": "application/pdf, application/json", "user-agent": "praticheflaiano-report-persona/1.0 (+https://praticheflaiano.it)"})
    with urllib.request.urlopen(richiesta, timeout=attesa) as r:
        return r.read()


def _indirizzo_avviso(codice):
    base = os.environ.get("REPORT_PERSONA_URL") or ""
    if not base and os.environ.get("VERCEL_ENV") == "production" and os.environ.get("VERCEL_PROJECT_PRODUCTION_URL"):
        base = "https://" + os.environ["VERCEL_PROJECT_PRODUCTION_URL"]
    return f"{base.rstrip('/')}/api/report/avviso?r={codice}&k={segreto_avviso(codice)}" if base.startswith("https://") else ""


def doppione(cf):
    """Richiesta per lo stesso codice fiscale nelle ultime 24 ore (per non pagare due volte per sbaglio)."""
    limite = iso(adesso() - timedelta(hours=DOPPIONE_ORE))
    for r in tutte():
        if r.get("cf") == cf and r.get("creata", "") > limite and r.get("stato") != "errore":
            return r
    return None


def richiedi(nome, cognome, cf, finalita, nota):
    """Registra la richiesta e la manda a Openapi. La richiesta viene salvata PRIMA della chiamata:
    se la risposta si perde resta traccia, e l'esito incerto viene segnalato (potrebbe essere stata addebitata)."""
    codice = secrets.token_urlsafe(15)
    r = {"codice": codice, "nome": nome, "cognome": cognome, "cf": cf, "finalita": finalita, "nota": nota, "consenso": True,
         "creata": iso(), "stato": "invio", "costo": COSTO_CENTESIMI, "ghl": {"stato": "da_cercare"},
         "prova": "test." in (os.environ.get("OPENAPI_RISK_BASE") or "")}
    salva(r)
    corpo = {"name": nome, "surname": cognome, "taxCode": cf}
    avviso = _indirizzo_avviso(codice)
    if avviso:
        corpo["callback"] = {"url": avviso, "method": "JSON"}
    try:
        risposta = json.loads(_openapi("POST", "/IT-report-persona/", corpo) or b"{}")
        dati = risposta.get("data") or {}
        ident = dati.get("id") or (dati.get("callback") or {}).get("id")   # nell'esempio ufficiale l'id è dentro "callback"
        if not risposta.get("success") or not ident:
            r.update(stato="errore", errore=f"Openapi non ha accettato la richiesta ({str(risposta.get('message') or risposta.get('error') or 'risposta inattesa')[:160]})", costo=0)
        else:
            r.update(stato="in_lavorazione", openapi=str(ident))
    except urllib.error.HTTPError as e:
        try:
            dettaglio = str((json.loads(e.read() or b"{}") or {}).get("message") or "")[:160]
        except ValueError:
            dettaglio = ""
        motivi = {401: "token Openapi non valido o scaduto", 402: "credito Openapi insufficiente", 403: "il token Openapi non ha il permesso per il Report Persona"}
        r.update(stato="errore", errore=f"Openapi ha risposto {e.code}: {motivi.get(e.code) or dettaglio or 'richiesta rifiutata'}", costo=0)
    except Exception as e:
        r.update(stato="errore", incerto=True, errore=f"Nessuna risposta da Openapi ({type(e).__name__}): la richiesta potrebbe essere partita lo stesso. Controlla su console.openapi.com prima di ripeterla.")
    salva(r)
    return r


def controlla(r):
    """Se il report è pronto lo scarica nell'archivio e lo allega al contatto. Restituisce la richiesta aggiornata."""
    if r.get("stato") != "in_lavorazione" or not r.get("openapi") or not os.environ.get("OPENAPI_RISK_TOKEN"):
        return r
    try:
        dati = _openapi("GET", f"/IT-report-persona/{urllib.parse.quote(r['openapi'], safe='')}/download", attesa=40)
    except urllib.error.HTTPError as e:
        if e.code not in (404, 406):   # 406 = il PDF non è ancora stato creato
            r["ultimo_controllo"] = f"Openapi ha risposto {e.code}"
            salva(r)
        return r
    except Exception as e:
        print("report: controllo non riuscito", type(e).__name__)
        return r
    if not dati.startswith(b"%PDF"):
        return r
    archivio._scrivi(f"report/pdf/{r['codice']}.pdf", dati, "application/pdf", True)
    r.update(stato="pronto", pronta=iso(), dimensione=len(dati))
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
        {"name": CAMPO_FILE, "dataType": "FILE_UPLOAD", "model": "contact", "acceptedFormat": [".pdf"], "isMultipleFile": True, "maxNumberOfFiles": 20}
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
    try:
        campo_cf = _campo(_campi(), "cf")
        trovati = {}
        if campo_cf:
            for c in _cerca(r["cf"], [{"field": f"customFields.{campo_cf}", "operator": "eq", "value": r["cf"]}]):
                trovati[c.get("id")] = c
        for testo in (f"{r['nome']} {r['cognome']}", r["cf"]):
            for c in _cerca(testo):
                trovati.setdefault(c.get("id"), c)
        nome, cognome = normale(r["nome"]), normale(r["cognome"])
        con_cf = [c for c in trovati.values() if campo_cf and _valore(c, campo_cf) == r["cf"]]
        omonimi = []
        for c in trovati.values():
            n, g, intero = _nomi(c)
            if c in con_cf:
                continue
            if (n == nome and g == cognome) or (n == cognome and g == nome) or intero in (f"{nome} {cognome}", f"{cognome} {nome}"):
                omonimi.append(c)
        if len(con_cf) == 1:
            r["ghl"] = {"stato": "trovato", "contatto": con_cf[0]["id"], "nome": _scheda(con_cf[0], campo_cf)["nome"], "come": "codice fiscale"}
        elif not con_cf and len(omonimi) == 1 and not (campo_cf and _valore(omonimi[0], campo_cf)):
            # un solo contatto con quel nome e senza codice fiscale: è lui, e il codice fiscale va aggiunto
            r["ghl"] = {"stato": "trovato", "contatto": omonimi[0]["id"], "nome": _scheda(omonimi[0], campo_cf)["nome"], "come": "nome e cognome", "aggiungi_cf": True}
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
    g.pop("aggiungi_cf", None)


def collega(r, contatto=None, crea=False):
    """Scelta fatta dalla pagina: un contatto tra i candidati, oppure la creazione di uno nuovo."""
    try:
        if crea:
            campo = _campo(_campi(), "cf") or _crea_campo("cf")
            nuovo = crm._api("POST", "/contacts/", {"locationId": crm.LOCATION, "firstName": r["nome"].title(), "lastName": r["cognome"].title(),
                                                   "source": "Report Persona (area riservata)", "customFields": [{"id": campo, "value": r["cf"]}]})
            ident = (nuovo.get("contact") or {}).get("id")
            if not ident:
                raise ValueError("contatto non creato")
            r["ghl"] = {"stato": "trovato", "contatto": ident, "nome": f"{r['nome']} {r['cognome']}".title(), "come": "creato ora", "cf_aggiunto": True}
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


def _carica_file(contatto, campo, nome_file, dati):
    confine = "----report" + secrets.token_hex(12)
    chiave = f"{campo}_{secrets.token_hex(8)}"
    corpo = (f"--{confine}\r\nContent-Disposition: form-data; name=\"{chiave}\"; filename=\"{nome_file}\"\r\nContent-Type: application/pdf\r\n\r\n").encode() + dati + f"\r\n--{confine}--\r\n".encode()
    base = os.environ.get("GHL_API_BASE", "https://services.leadconnectorhq.com").rstrip("/")
    richiesta = urllib.request.Request(
        f"{base}/forms/upload-custom-files?contactId={contatto}&locationId={crm.LOCATION}", data=corpo, method="POST",
        headers={"authorization": "Bearer " + os.environ["GHL_API_TOKEN"], "version": "2021-07-28", "accept": "application/json",
                 "content-type": f"multipart/form-data; boundary={confine}", "user-agent": "praticheflaiano-report-persona/1.0 (+https://praticheflaiano.it)"})
    with urllib.request.urlopen(richiesta, timeout=40) as risposta:
        risposta.read()


def allega(r):
    """Quando il report è pronto e il contatto è deciso: PDF nel campo "Report Persona" del contatto e nota."""
    g = r.get("ghl") or {}
    if r.get("stato") != "pronto" or g.get("stato") != "trovato" or g.get("allegato"):
        return r
    dati = pdf(r["codice"])
    if not dati:
        return r
    try:
        campo = _campo(_campi(), "file") or _crea_campo("file")
        giorno = r["creata"][:10]
        _carica_file(g["contatto"], campo, f"report-persona-{r['cf']}-{giorno}.pdf", dati)
        g["allegato"] = iso()
        g.pop("errore", None)
        crm._prova("nota", lambda: crm._api("POST", f"/contacts/{g['contatto']}/notes", {"body": (
            f"REPORT PERSONA (Openapi) - richiesto il {giorno[8:]}/{giorno[5:7]}/{giorno[:4]}\nFinalità: {FINALITA.get(r['finalita'], r['finalita'])}"
            + (f" - {r['nota']}" if r.get("nota") else "") + "\nConsenso dell'interessato: acquisito\nIl PDF è nel campo \"Report Persona\" del contatto.")}))
    except Exception as e:
        print("report: allegato non riuscito", type(e).__name__, getattr(e, "code", ""))
        g["errore"] = f"Non sono riuscito ad allegare il PDF al contatto ({type(e).__name__} {getattr(e, 'code', '')})".strip()
    r["ghl"] = g
    salva(r)
    return r


# ---------- viste ----------

def vista(r):
    g = r.get("ghl") or {}
    return {"codice": r["codice"], "nome": r["nome"], "cognome": r["cognome"], "cf": r["cf"], "finalita": FINALITA.get(r.get("finalita"), r.get("finalita")), "nota": r.get("nota") or "",
            "creata": r["creata"], "pronta": r.get("pronta"), "stato": r["stato"], "errore": r.get("errore"), "incerto": bool(r.get("incerto")), "ultimo_controllo": r.get("ultimo_controllo"),
            "costo": r.get("costo", 0), "prova": bool(r.get("prova")), "scaricabile": r["stato"] == "pronto" and r.get("dimensione", 0) <= MAX_PDF_RISPOSTA,
            "scade": iso(_da_iso(r["creata"]) + timedelta(days=CONSERVAZIONE_GIORNI))[:10],
            "ghl": {k: g.get(k) for k in ("stato", "nome", "come", "candidati", "allegato", "errore", "avviso", "cf_aggiunto") if g.get(k)}}


def configurazione():
    return {"openapi": bool(os.environ.get("OPENAPI_RISK_TOKEN")), "prova": "test." in (os.environ.get("OPENAPI_RISK_BASE") or ""),
            "ghl": crm.configurato(), "archivio": archivio.configurato(), "avviso": bool(_indirizzo_avviso("x" * 20)), "costo": COSTO_CENTESIMI}
