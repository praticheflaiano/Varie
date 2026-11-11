"""Lettura DIRETTA dell'estratto conto previdenziale INPS in PDF (senza OCR e senza modelli).

L'estratto scaricato dal sito INPS è un PDF con testo vero: ogni cella della tabella è un
frammento di testo con la sua posizione. Qui si ricompongono le righe e le colonne:

    Dal | Al | Tipo di contribuzione | unità | utili al diritto | utili al calcolo | Retribuzione o reddito | Azienda | Note

più l'anagrafica (nome, nascita, codice fiscale, residenza), la data "Emesso il", la sezione
(es. "Regime generale"), la legenda dei codici nota e le "Segnalazioni personalizzate".

Le stesse regole sono in sito/api/_lib/estrattoModel.ts (lettura nel browser): se cambi qui, cambia là.
Nessun numero viene calcolato o corretto: i valori sono copiati come scritti.
Le scansioni (PDF senza testo) non si leggono così: `completo` resta False e si usa la lettura con AI.
"""
import io
import re
from datetime import date

DATA = re.compile(r"^(\d{2})[/.\-](\d{2})[/.\-](\d{4})$")
DATA_UNITA = re.compile(r"^(\d{2}[/.\-]\d{2}[/.\-]\d{4})\s+(\S.*)$")
UNITA = re.compile(r"^(sett\.?|settimane|mesi|mese|giorni|gg\.?)$", re.I)
INTERO = re.compile(r"^\d{1,4}$")
DECIMALE = re.compile(r"^\d{1,4},\d{3}$")   # contributi utili al calcolo: sempre tre decimali ("46,000")
IMPORTO = re.compile(r"^-?\d{1,3}(?:\.?\d{3})*,\d{2}-?$")   # euro con due decimali, anche senza punto delle migliaia
# distanze massime (in punti) tra le colonne: il calcolo sta subito a destra del diritto, l'importo poco oltre
DIST_CALCOLO, DIST_IMPORTO, DIST_IMPORTO_DA_UNITA = 70, 140, 190
CF = re.compile(r"\b([A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z])\b")
SEZIONE = re.compile(r"^(regime|gestion[ei]|fondo|fondi|cassa|lavoratori)\b", re.I)
VOCE_NOTA = re.compile(r"^(\S{1,3})\)\s+(.+)$")
PIEDE = re.compile(r"^(estratto conto di\b|pagina\s+\d+)", re.I)
TOLLERANZA_RIGA = 2.5

# Gestione dedotta dal tipo di contribuzione o dal titolo della sezione (codici del motore di calcolo).
GESTIONI = (
    (r"pubblic|inpdap", "PUBBLICO"),
    (r"cpdel", "CPDEL"), (r"\bcps\b", "CPS"), (r"\bcpi\b", "CPI"), (r"cpug", "CPUG"), (r"ctps|dipendenti dello stato", "CTPS"),
    (r"separata|parasubordinat|collaborazion|co\.\s?co\.", "GS"),
    # "ART." e "COM." valgono solo per titolari e collaboratori d'impresa (non "art. 13", non "settore commercio")
    (r"(titolare|coadiuv|collaborator|impresa).*(artigian|\bart\.)|^artigian|gestione (degli )?artigian", "ARTIGIANI"),
    (r"(titolare|coadiuv|collaborator|impresa).*(commerc|\bcomm?\.)|^commerc|gestione (dei )?commerc", "COMMERCIANTI"),
    (r"dipend|fpld|domestic", "FPLD"),
)


def codice_gestione(testo):
    t = (testo or "").lower().strip()
    for modello, codice in GESTIONI:
        if re.search(modello, t):
            return codice
    return None


def celle_pdf(dati):
    """Frammenti di testo del PDF: lista di (pagina, x, y, testo) con y che cresce verso il basso."""
    from pypdf import PdfReader  # import pigro: serve solo qui

    lettore = PdfReader(io.BytesIO(dati))
    celle = []
    for n, pagina in enumerate(lettore.pages):
        rot = int(pagina.get("/Rotate") or 0) % 360
        grezze = []

        def visita(testo, cm, tm, _font, _corpo, grezze=grezze):
            t = (testo or "").strip()
            if not t:
                return
            # posizione nello spazio della pagina = matrice del testo applicata alla matrice corrente
            ux = cm[0] * tm[4] + cm[2] * tm[5] + cm[4]
            uy = cm[1] * tm[4] + cm[3] * tm[5] + cm[5]
            grezze.append((ux, uy, t))

        pagina.extract_text(visitor_text=visita)
        for ux, uy, t in grezze:
            # coordinate "a schermo" secondo la rotazione della pagina (l'estratto INPS è ruotato di 90°)
            x, y = {0: (ux, -uy), 90: (uy, ux), 180: (-ux, uy), 270: (-uy, -ux)}.get(rot, (ux, -uy))
            if t and not (ux == 0 and uy == 0):
                celle.append((n, round(x, 1), round(y, 1), t))
    return celle, len(lettore.pages)


def _righe(celle):
    """Raggruppa le celle in righe (stessa pagina, stessa altezza), ordinate dall'alto in basso."""
    # Alcuni lettori di PDF uniscono celle vicine ("31/12/1985 Servizio militare"): la data si separa dal resto.
    separate = []
    for n, x, y, t in celle:
        m = DATA_UNITA.match(t)
        while m:
            separate.append((n, x, y, m.group(1)))
            t, x = m.group(2).strip(), x + 50
            m = DATA_UNITA.match(t)
        if t:
            separate.append((n, x, y, t))
    righe = []
    for n, x, y, t in sorted(separate, key=lambda c: (c[0], c[2], c[1])):
        ultima = righe[-1] if righe else None
        if ultima and ultima["p"] == n and abs(ultima["y"] - y) <= TOLLERANZA_RIGA:
            ultima["c"].append((x, t))
        else:
            righe.append({"p": n, "y": y, "c": [(x, t)]})
    for r in righe:
        r["c"].sort()
    return righe


def _iso(t):
    m = DATA.match(t)
    if not m:
        return ""
    try:   # la data deve esistere davvero (non 31/02)
        return date(int(m.group(3)), int(m.group(2)), int(m.group(1))).isoformat()
    except ValueError:
        return ""


def _lettere_cf(parola, nome=False):
    p = re.sub(r"[^A-Z]", "", parola.upper())
    cons = [c for c in p if c not in "AEIOU"]
    voc = [c for c in p if c in "AEIOU"]
    if nome and len(cons) >= 4:
        cons = [cons[0], cons[2], cons[3]]
    return ("".join(cons + voc) + "XXX")[:3]


def dividi_nome(intero, cf):
    """Divide "COGNOME NOME" usando il codice fiscale (cognomi o nomi di più parole)."""
    parti = intero.split()
    if len(parti) < 2:
        return intero, ""
    if cf:
        for k in range(1, len(parti)):
            a, b = " ".join(parti[:k]), " ".join(parti[k:])
            if _lettere_cf(a) + _lettere_cf(b, True) == cf[:6]:
                return a, b
            if _lettere_cf(b) + _lettere_cf(a, True) == cf[:6]:
                return b, a
    return parti[0], " ".join(parti[1:])


def _unita(t):
    t = t.lower()
    return "settimane" if t.startswith("sett") else "mesi" if t.startswith("mes") else "giorni"


def leggi_celle(celle, pagine=1):
    """Interpreta le celle. Restituisce un dizionario nel formato della trascrizione (vedi SCHEMA_ESTRATTO in elabora.py),
    con in più: contributi_calcolo, azienda e nota per riga; legenda_note; segnalazioni; residenza; completo."""
    righe = _righe(celle)
    testo = " ".join(t for r in righe for _, t in r["c"])
    m = CF.search(testo.upper())
    cf = m.group(1) if m else ""

    # Anagrafica: sta nel riquadro in alto a destra della prima pagina, una cella per riga
    nome_intero = nascita = luogo = emesso = ""
    residenza = []
    x_anagrafica = None
    for r in righe:
        for x, t in r["c"]:
            if re.match(r"^nat[oa]\s+a\s+", t, re.I) and not luogo:
                luogo = re.sub(r"\s+", " ", re.sub(r"^nat[oa]\s+a\s+", "", t, flags=re.I)).strip()
                x_anagrafica = x
            elif re.match(r"^il\s+\d{2}[/.\-]\d{2}[/.\-]\d{4}$", t, re.I) and not nascita:
                nascita = _iso(t.split()[-1])
            elif re.match(r"^emesso\s+il\s+", t, re.I) and not emesso:
                emesso = _iso(t.split()[-1])
            elif re.match(r"^residente\s+in\s+", t, re.I) and not residenza:
                residenza.append(re.sub(r"^residente\s+in\s+", "", t, flags=re.I).strip())
                x_res, y_res, p_res = x, r["y"], r["p"]
    if residenza:
        for r in righe:  # la riga sotto "residente in" (CAP e comune), alla stessa x
            if r["p"] == p_res and 0 < r["y"] - y_res <= 14:
                residenza += [t for x, t in r["c"] if abs(x - x_res) <= 2]
    if x_anagrafica is not None:
        sopra = [(r["y"], t) for r in righe if r["p"] == 0 for x, t in r["c"] if abs(x - x_anagrafica) <= 2]
        prima = [t for y, t in sopra if not re.match(r"^(nat[oa]|il|codice|residente)\b", t, re.I)]
        nome_intero = prima[0] if prima else ""
    if not nome_intero:
        m = re.search(r"estratto conto di\s+(.+?)\s+[A-Z]{6}\d{2}", testo, re.I)
        nome_intero = m.group(1).strip() if m else ""
    cognome, nome = dividi_nome(re.sub(r"\s+", " ", nome_intero).strip(), cf)

    periodi, legenda, segnalazioni, problemi = [], [], [], []
    x_note = x_unita = None
    sezione = ""
    zona = "tabella"  # tabella | note | segnalazioni
    pagina_ultima, y_ultima = -1, 0.0  # posizione dell'ultima riga di dati (per il testo andato a capo)
    e_estratto = bool(re.search(r"estratto\s+conto", testo, re.I))
    for r in righe:
        c = r["c"]
        testi = [t for _, t in c]
        primo = testi[0]
        # piè di pagina ("Estratto conto di …", "Pagina n di m") e numeri di pagina isolati
        if any(PIEDE.match(t) for t in testi) or (len(c) == 1 and INTERO.match(primo)):
            continue
        # intestazione della tabella: fissa la colonna delle note e riporta alla tabella (si ripete a ogni pagina)
        if any(t == "Note" for t in testi) and any(re.match(r"^(azienda|tipo di contribuzione)", t, re.I) for t in testi):
            x_note = next(x for x, t in c if t == "Note")
            zona = "tabella"
            continue
        if len(c) >= 2 and DATA.match(c[0][1]) and DATA.match(c[1][1]):
            zona = "tabella"
            dal, al = _iso(c[0][1]), _iso(c[1][1])
            p = {"dal": dal, "al": al, "gestione": sezione, "tipo": "", "unita": "sconosciuta", "contributi_diritto": "",
                 "contributi_calcolo": "", "importo": "", "azienda": "", "nota": ""}
            tipo, azienda, visto_unita, x_dir = [], [], False, None
            for x, t in c[2:]:
                if not visto_unita and UNITA.match(t):
                    p["unita"], visto_unita, x_unita = _unita(t), True, x
                elif (x_note is not None and x >= x_note - 30 and len(t) <= 4) or (x_note is None and x >= 740 and len(t) <= 2):
                    p["nota"] = (p["nota"] + " " + t).strip()
                elif visto_unita and INTERO.match(t) and not p["contributi_diritto"] and not p["importo"] and not azienda:
                    p["contributi_diritto"], x_dir = t, x
                elif (visto_unita and (DECIMALE.match(t) or INTERO.match(t)) and p["contributi_diritto"] and not p["contributi_calcolo"]
                      and not p["importo"] and not azienda and x - x_dir <= DIST_CALCOLO):
                    p["contributi_calcolo"] = t
                elif (IMPORTO.match(t) and not p["importo"] and not azienda
                      and (x - x_dir <= DIST_IMPORTO if x_dir is not None else visto_unita and x - x_unita <= DIST_IMPORTO_DA_UNITA)):
                    p["importo"] = t.rstrip("-") if not t.endswith("-") else "-" + t.rstrip("-")
                elif not visto_unita and not p["importo"]:
                    tipo.append(t)
                else:
                    azienda.append(t)
            p["tipo"] = " ".join(tipo)
            p["azienda"] = " ".join(azienda)
            if not dal or not al or al < dal:
                problemi.append(f"riga con date non valide ({c[0][1]} - {c[1][1]})")
            elif not p["contributi_diritto"]:
                problemi.append(f"{c[0][1]} - {c[1][1]}: contributi non letti")
            periodi.append(p)
            pagina_ultima, y_ultima = r["p"], r["y"]
            continue
        if re.match(r"^note\s*:?$", primo, re.I):
            zona = "note"
            continue
        if re.match(r"^segnalazioni\b", primo, re.I):
            zona = "segnalazioni"
            continue
        riga_testo = re.sub(r"\s+", " ", " ".join(testi)).strip()
        di_seguito = (zona == "tabella" and periodi and x_unita is not None and r["p"] == pagina_ultima and r["y"] - y_ultima <= 16
                      and not re.match(r"^(dal|al|periodo|reddito|euro)\b", primo, re.I))
        if zona == "tabella" and any(DATA.match(t) or UNITA.match(t) or DATA_UNITA.match(t) for t in testi):
            # ha l'aspetto di una riga di contributi ma non comincia con due date: non la si perde in silenzio
            problemi.append(f"riga non interpretata: {riga_testo[:60]}")
            continue
        if not di_seguito and len(c) == 1 and c[0][0] > 120 and SEZIONE.match(primo) and len(primo) <= 70:
            # titolo di una sezione (es. "Gestione separata"), anche dopo le note della sezione precedente
            sezione, zona = riga_testo, "tabella"
            continue
        if zona == "note":
            v = VOCE_NOTA.match(riga_testo)
            if v:
                legenda.append({"codice": v.group(1), "testo": v.group(2)})
            elif legenda:
                legenda[-1]["testo"] += " " + riga_testo
        elif zona == "segnalazioni":
            if re.match(r"^[-–•]", riga_testo) or not segnalazioni:
                segnalazioni.append(re.sub(r"^[-–•]\s*", "", riga_testo))
            else:
                segnalazioni[-1] += " " + riga_testo
        elif di_seguito:
            # riga di seguito (testo andato a capo nella cella): si attacca al tipo o all'azienda della riga sopra
            for x, t in c:
                campo = "tipo" if x < x_unita else "azienda"
                periodi[-1][campo] = (periodi[-1][campo] + " " + t).strip()
            y_ultima = r["y"]
    return _chiudi(periodi, legenda, segnalazioni, problemi, cognome, nome, cf, nascita, luogo, emesso, residenza, e_estratto, pagine, celle)


def _chiudi(periodi, legenda, segnalazioni, problemi, cognome, nome, cf, nascita, luogo, emesso, residenza, e_estratto, pagine, celle):
    pagine_con_testo = len({c[0] for c in celle})
    if pagine_con_testo < pagine:
        problemi.append(f"{pagine - pagine_con_testo} pagine senza testo leggibile")
    return {
        "e_estratto_inps": e_estratto and bool(periodi),
        "cognome": cognome.title(), "nome": nome.title(), "codice_fiscale": cf,
        "data_nascita": nascita, "luogo_nascita": luogo, "residenza": ", ".join(residenza),
        "data_estratto": emesso,
        "periodi": periodi,
        "totale_dichiarato": "",
        "note": "; ".join(problemi[:8]),
        "legenda_note": legenda,
        "segnalazioni": segnalazioni,
        "pagine": pagine,
        "lettura": "diretta",
        # completo = si può usare senza AI: è un estratto, ogni pagina ha testo e ogni riga ha i suoi contributi
        "completo": e_estratto and bool(periodi) and not problemi,
    }


def leggi_pdf(dati):
    """Lettura diretta di un PDF (bytes). Restituisce None se il file non si apre o non contiene testo."""
    try:
        celle, pagine = celle_pdf(dati)
    except Exception as e:  # PDF protetto, rovinato o non PDF
        print("estratto_inps: PDF non leggibile", type(e).__name__)
        return None
    if not celle:
        return None
    return leggi_celle(celle, pagine)
