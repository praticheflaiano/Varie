"""
Collegamento con il CRM GoHighLevel: ogni pratica della stima pensione diventa un contatto, una
opportunità nella pipeline "Calcolo Pensione", note con la storia della pratica e compiti per
l'ufficio quando serve un intervento. Manda anche al cliente l'email con il link della pratica.

Tutto è "best effort": se il CRM non risponde la pratica va avanti lo stesso e la sincronizzazione
riprende all'evento successivo. Senza GHL_API_TOKEN il modulo non fa nulla.

Nel CRM NON finiscono i dati su salute e assistenza a familiari (invalidità, percentuale,
caregiver) né i documenti: restano nell'archivio riservato in Europa. Le note rimandano alla
pagina dell'ufficio, dove si vedono con il segreto dell'ufficio.

Variabili d'ambiente:
  GHL_API_TOKEN     token di una Private Integration GHL (ambiti: contatti, opportunità,
                    conversazioni in scrittura). Obbligatoria per attivare il collegamento.
  GHL_LOCATION_ID   sub-account (predefinito: Centro Pratiche Flaiano)
  GHL_PIPELINE      nome della pipeline (predefinito "Calcolo Pensione")
  GHL_API_BASE      solo per i test
"""
import json, os, re, urllib.error, urllib.request

LOCATION = os.environ.get("GHL_LOCATION_ID", "p7rJcrB05COilABdw0FS")
PIPELINE = os.environ.get("GHL_PIPELINE", "Calcolo Pensione")
# Stato della pratica -> parole da cercare nel nome della fase (la prima fase che ne contiene una).
FASI = {
    "ricevuta": ["ricevuta"],
    "pagata": ["inizio", "elaborazione"],
    "in_elaborazione": ["inizio", "elaborazione"],
    "attesa_estratto": ["attesa cert", "istituto", "estratto"],
    "da_rivedere": ["verificare", "bloccat"],
    "fallita": ["verificare", "bloccat"],
    "consegnata": ["effettuato", "consegn"],
}
ETICHETTE = {
    "ricevuta": "questionario ricevuto, in attesa del pagamento", "pagata": "pagata, in attesa del calcolo",
    "in_elaborazione": "calcolo in corso", "attesa_estratto": "pagata: l'estratto contributivo va richiesto da noi",
    "da_rivedere": "stima PROVVISORIA consegnata: va completata dall'operatore", "fallita": "calcolo NON riuscito",
    "consegnata": "prospetto consegnato al cliente",
}
SENSIBILI = {"invalidita", "invaliditaPct", "invaliditaData", "caregiver"}
DOMANDE = [
    ("nascita", "Data di nascita"), ("sesso", "Sesso"), ("figli", "Figli"), ("residenza", "Residenza"),
    ("situazione", "Situazione lavorativa"), ("continua", "Continua a lavorare"), ("finoA", "Fino a"),
    ("crescita", "Retribuzione nei prossimi anni (ferma / poco / molto / nonso)"), ("retribuzione", "Retribuzione lorda annua"), ("naspi", "NASpI"), ("esuberi", "Uscite anticipate proposte dall'azienda"),
    ("mancanti", "Periodi che potrebbero mancare nell'estratto"), ("mancantiNote", "Dettaglio dei periodi"),
    ("precoce", "12 mesi di contributi prima dei 19 anni"), ("mansione", "Lavori gravosi o usuranti"),
    ("mansioneAnni", "Anni di mansione negli ultimi 10"), ("obiettivo", "Obiettivo"),
]


def configurato():
    return bool(os.environ.get("GHL_API_TOKEN"))


def _api(metodo, percorso, corpo=None):
    base = os.environ.get("GHL_API_BASE", "https://services.leadconnectorhq.com").rstrip("/")
    richiesta = urllib.request.Request(
        base + percorso, data=json.dumps(corpo).encode() if corpo is not None else None, method=metodo,
        headers={"authorization": "Bearer " + os.environ["GHL_API_TOKEN"], "version": "2021-07-28",
                 "content-type": "application/json", "accept": "application/json",
                 # Cloudflare davanti alle API GHL rifiuta lo user-agent predefinito "Python-urllib" (errore 1010, HTTP 403)
                 "user-agent": "praticheflaiano-stima-pensione/1.0 (+https://praticheflaiano.it)"})
    with urllib.request.urlopen(richiesta, timeout=10) as r:
        return json.loads(r.read() or b"{}")


def _prova(cosa, funzione):
    """Esegue una chiamata al CRM senza far fallire la pratica; nei log solo il tipo di errore."""
    try:
        return funzione()
    except urllib.error.HTTPError as e:
        print(f"crm: {cosa} non riuscito, HTTP {e.code}")
    except Exception as e:
        print(f"crm: {cosa} non riuscito, {type(e).__name__}")
    return None


def _fasi():
    """Fasi della pipeline: {nome in minuscolo: id}, più l'id della pipeline."""
    for p in (_api("GET", f"/opportunities/pipelines?locationId={LOCATION}").get("pipelines") or []):
        if p.get("name", "").strip().lower() == PIPELINE.lower():
            return p["id"], [(f.get("name", "").lower(), f["id"]) for f in p.get("stages") or []]
    return None, []


def _fase(stato, fasi):
    for parola in FASI.get(stato, []):
        for nome, ident in fasi:
            if parola in nome:
                return ident
    return fasi[0][1] if fasi else None


def _euro(centesimi):
    return f"{centesimi / 100:.2f}".replace(".", ",").replace(",00", "") + " €"


def _data(iso):
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", str(iso or ""))
    return f"{m.group(3)}/{m.group(2)}/{m.group(1)}" if m else str(iso or "")


def _link(codice, pratica):
    sito = pratica.get("sito") or "https://praticheflaiano.it"
    return f"{sito}/stima-pensione/pratica#c={codice}", f"{sito}/stima-pensione/ufficio#c={codice}"


def _nota_questionario(codice, pratica):
    r = pratica["risposte"]
    cliente, ufficio = _link(codice, pratica)
    righe = [f"STIMA PENSIONE - questionario ricevuto ({_data(pratica['creata'])})", f"Codice pratica: {codice}",
             f"Prezzo: {_euro(pratica['prezzo']['totale'])}" + (" (con richiesta dell'estratto da parte nostra)" if pratica["prezzo"]["estratto"] else ""),
             f"Documenti caricati: {', '.join(pratica['documenti']) or 'nessuno'}"]
    if pratica.get("prelettura_settimane"):
        righe.append(f"Contributi letti dall'estratto: {round(pratica['prelettura_settimane'])} settimane")
    righe.append("")
    for chiave, etichetta in DOMANDE:
        valore = r.get(chiave)
        if valore in (None, "", []):
            continue
        righe.append(f"{etichetta}: {', '.join(map(str, valore)) if isinstance(valore, list) else _data(valore) if chiave == 'nascita' else valore}")
    for b in r.get("buchi") or []:
        if isinstance(b, dict) and b.get("motivo"):
            righe.append(f"Anni senza contributi {b.get('da')}-{b.get('a')}: {b['motivo']}")
    righe += ["", "Le risposte su salute e assistenza a familiari non sono nel CRM: si vedono dalla pagina dell'ufficio.",
              f"Pagina dell'ufficio: {ufficio}", f"Pagina del cliente: {cliente}"]
    return "\n".join(righe)


def _nota_stima(codice, pratica):
    stima = pratica.get("stima") or {}
    _, ufficio = _link(codice, pratica)
    righe = [f"STIMA PENSIONE - {ETICHETTE[pratica['stato']]}", f"Codice pratica: {codice}"]
    if stima.get("revisione_consigliata"):
        righe.append("Motivi della verifica: " + "; ".join(stima["revisione_consigliata"]))
    base = ((stima.get("scenari") or [{}])[0].get("esito") or {})
    prima = base.get("prima_uscita_pensione") or {}
    if prima:
        righe.append(f"Prima uscita possibile: {prima.get('canale')} dal {_data(prima.get('decorrenza'))}")
    if base.get("contributi_ad_oggi"):
        righe.append(f"Contributi ad oggi: {base['contributi_ad_oggi']}")
    for canale in base.get("canali") or []:
        importo = (canale.get("importo") or {}).get("lordo_mensile_13")
        righe.append(f"- {canale.get('canale')}: primo pagamento {_data(canale.get('decorrenza')) or 'n.d.'}" + (f", lordo mensile {importo} €" if importo is not None else ""))
    righe += ["", f"Prospetto, controlli e sblocco: {ufficio}"]
    return "\n".join(righe)


# La consulenza con l'operatore (telefono o chat) è compresa nel prezzo: l'invito parte insieme al prospetto.
LINK_CONSULENZA = os.environ.get("STIMA_LINK_CONSULENZA", "https://link.arcanis.it/widget/group/bklXY9sZUszt8V2GpkU1")
CONSULENZA = ["Nel prezzo è compresa una consulenza con un nostro operatore, al telefono o in chat, per farti spiegare il risultato: è facoltativa.",
              f"Prenota l'appuntamento telefonico quando preferisci: <a href=\"{LINK_CONSULENZA}\">{LINK_CONSULENZA}</a>. In alternativa scrivici su WhatsApp al 371 623 0690."]


def _email(contatto, oggetto, righe):
    html = "".join(f"<p>{r}</p>" for r in righe)
    _prova("email al cliente", lambda: _api("POST", "/conversations/messages", {"type": "Email", "contactId": contatto, "subject": oggetto, "html": html}))


def sincronizza(codice, pratica, evento):
    """Porta nel CRM lo stato attuale della pratica. `evento`: ricevuta, pagata, estratto, esito,
    rilasciata. Aggiorna pratica["crm"]; restituisce True se va salvata."""
    if not configurato():
        return False
    crm = dict(pratica.get("crm") or {})
    prima = dict(crm)
    r = pratica["risposte"]
    cliente, ufficio = _link(codice, pratica)
    nome = f"{r.get('nome', '')} {r.get('cognome', '')}".strip()

    if not crm.get("contatto"):
        corpo = {"locationId": LOCATION, "email": r.get("email"), "firstName": r.get("nome"), "lastName": r.get("cognome"),
                 "source": "Stima pensione (sito)", "tags": ["stima-pensione"]}
        if r.get("telefono"):
            corpo["phone"] = r["telefono"]
        esito = _prova("contatto", lambda: _api("POST", "/contacts/upsert", corpo))
        crm["contatto"] = ((esito or {}).get("contact") or {}).get("id")
        recupera = bool(crm.get("contatto")) and evento != "ricevuta"   # contatto nato in ritardo: mancano le note degli eventi precedenti
    else:
        recupera = False
    if not crm.get("contatto"):
        pratica["crm"] = crm
        return crm != prima
    contatto = crm["contatto"]

    if not crm.get("pipeline"):
        trovata = _prova("pipeline", _fasi)
        if trovata and trovata[0]:
            crm["pipeline"], crm["fasi"] = trovata[0], trovata[1]
    fase = _fase(pratica["stato"], [tuple(f) for f in crm.get("fasi") or []])
    if crm.get("pipeline") and fase:
        dati = {"pipelineId": crm["pipeline"], "pipelineStageId": fase, "name": f"Stima pensione - {nome}",
                "status": "won" if pratica["stato"] == "consegnata" else "open", "monetaryValue": pratica["prezzo"]["totale"] / 100}
        if crm.get("opportunita"):
            _prova("opportunità", lambda: _api("PUT", f"/opportunities/{crm['opportunita']}", dati))
        else:
            esito = _prova("opportunità", lambda: _api("POST", "/opportunities/", {**dati, "locationId": LOCATION, "contactId": contatto}))
            crm["opportunita"] = ((esito or {}).get("opportunity") or {}).get("id")

    def nota(testo):
        _prova("nota", lambda: _api("POST", f"/contacts/{contatto}/notes", {"body": testo}))

    def compito(titolo, testo):
        _prova("compito", lambda: _api("POST", f"/contacts/{contatto}/tasks", {"title": titolo, "body": testo, "dueDate": pratica.get("aggiornata") or pratica["creata"], "completed": False}))

    def nota_pagamento():
        p = pratica.get("pagamento") or {}
        nota(f"STIMA PENSIONE - pagamento registrato ({p.get('come', '')})\nCodice pratica: {codice}\nRiferimento: {p.get('riferimento') or 'n.d.'}"
             f"\nImporto incassato: {p.get('importo') or 'n.d.'}\nStato: {ETICHETTE[pratica['stato']]}\nPagina dell'ufficio: {ufficio}")

    if recupera:
        # Il CRM non era raggiungibile agli eventi precedenti: si scrivono ora le note perse (senza ripetere le email).
        nota(_nota_questionario(codice, pratica))
        if pratica.get("pagamento") and evento != "pagata":
            nota_pagamento()

    if evento == "ricevuta":
        nota(_nota_questionario(codice, pratica))
        _email(contatto, "La tua Stima e Calcolo della pensione: il link della tua pratica", [
            f"Ciao {r.get('nome', '')},", "abbiamo ricevuto i tuoi dati per la Stima e Calcolo della pensione.",
            f"Questo è il link della tua pratica: <a href=\"{cliente}\">{cliente}</a>",
            "Conservalo: ti serve per completare il pagamento, seguire il calcolo e scaricare il prospetto, anche da un altro dispositivo. Ti verrà chiesta la tua data di nascita.",
            "Centro Pratiche Flaiano - 06 97845429 - WhatsApp 371 623 0690"])
    elif evento == "pagata":
        nota_pagamento()
        if pratica["stato"] == "attesa_estratto":
            _email(contatto, "Stiamo richiedendo il tuo estratto contributivo", [
                f"Ciao {r.get('nome', '')},", "abbiamo ricevuto il pagamento e la tua richiesta dell'estratto contributivo.",
                "Gli estratti li richiediamo la mattina, dalle 9:30 alle 13:00, nei giorni di apertura dell'ufficio: se hai fatto la richiesta nel pomeriggio o la sera, la lavoriamo dal giorno lavorativo successivo.",
                f"Ti avvisiamo appena è disponibile. Segui la pratica da qui: <a href=\"{cliente}\">{cliente}</a>",
                "La consulenza con un nostro operatore, al telefono o in chat, resta compresa nel prezzo.", "Centro Pratiche Flaiano"])
            compito(f"Stima pensione: richiedere l'estratto contributivo di {nome}", f"Pagata. Richiedere l'estratto all'INPS e caricarlo dalla pagina dell'ufficio: {ufficio}")
    elif evento == "estratto":
        nota(f"STIMA PENSIONE - estratto caricato dall'ufficio, pratica pronta per il calcolo\nCodice pratica: {codice}\nPagina del cliente: {cliente}")
        _email(contatto, "Il tuo estratto contributivo è arrivato: puoi avviare la stima", [
            f"Ciao {r.get('nome', '')},", "abbiamo ricevuto il tuo estratto contributivo dall'INPS.",
            f"Apri la tua pratica e avvia il calcolo: <a href=\"{cliente}\">{cliente}</a>", "Centro Pratiche Flaiano"])
    elif evento == "esito":
        if pratica["stato"] == "fallita":
            nota(f"STIMA PENSIONE - calcolo NON riuscito (tentativo {pratica.get('tentativi')}, errore: {pratica.get('errore') or 'n.d.'})\nCodice pratica: {codice}\nPagina dell'ufficio: {ufficio}")
            if pratica.get("tentativi", 0) >= 2:
                compito(f"Stima pensione: calcolo fallito per {nome}", f"Il cliente ha pagato e il calcolo non riesce. Controllare e far ripartire dalla pagina dell'ufficio: {ufficio}")
        else:
            nota(_nota_stima(codice, pratica))
            if pratica["stato"] == "da_rivedere":
                motivi = "; ".join((pratica.get("stima") or {}).get("revisione_consigliata") or [])
                compito(f"Stima pensione: completare la stima di {nome}", f"Il cliente ha già il prospetto PROVVISORIO e l'invito a prenotare la consulenza. Motivi della verifica: {motivi}. Controllare, completare la stima con il cliente e confermarla dalla pagina dell'ufficio: {ufficio}")
                _email(contatto, "La tua stima della pensione è pronta (versione provvisoria)", [
                    f"Ciao {r.get('nome', '')},", "la tua Stima e Calcolo della pensione è pronta in versione provvisoria.",
                    f"Scarica il prospetto dalla tua pratica: <a href=\"{cliente}\">{cliente}</a> (ti verrà chiesta la data di nascita).",
                    "I controlli automatici hanno segnalato alcuni punti da verificare a mano: li trovi indicati nel prospetto. Il nostro operatore ha già ricevuto la segnalazione e provvede a completare la stima, senza costi aggiuntivi.",
                    f"Per definirla insieme prenota l'appuntamento telefonico, compreso nel prezzo: <a href=\"{LINK_CONSULENZA}\">{LINK_CONSULENZA}</a>. In alternativa scrivici in chat su WhatsApp al 371 623 0690.",
                    "Centro Pratiche Flaiano"])
            else:
                _email(contatto, "La tua stima della pensione è pronta", [
                    f"Ciao {r.get('nome', '')},", "la tua Stima e Calcolo della pensione è pronta.",
                    f"Scarica il prospetto dalla tua pratica: <a href=\"{cliente}\">{cliente}</a> (ti verrà chiesta la data di nascita).", *CONSULENZA, "Centro Pratiche Flaiano"])
    elif evento == "rilasciata":
        nota(f"STIMA PENSIONE - prospetto verificato dall'ufficio e consegnato al cliente\nCodice pratica: {codice}")
        _email(contatto, "La tua stima della pensione è pronta", [
            f"Ciao {r.get('nome', '')},", "il nostro operatore ha verificato la tua Stima e Calcolo della pensione: la stima è confermata.",
            f"Scaricalo dalla tua pratica: <a href=\"{cliente}\">{cliente}</a> (ti verrà chiesta la data di nascita).", *CONSULENZA, "Centro Pratiche Flaiano"])

    pratica["crm"] = crm
    return crm != prima
