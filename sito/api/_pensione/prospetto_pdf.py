"""
Prospetto PDF della Stima e Calcolo della pensione, con QR di recupero.
Usa solo i dati già calcolati (motore) e scritti (modello): qui non si calcola nulla.

Impaginazione pensata per essere letta senza fatica: testo a 11 punti, una scheda per ogni
strada di uscita con le cifre in grande, sezioni ben separate, note tecniche in fondo.
Il numero di pagine è libero (di solito 3-4): non si rimpicciolisce il carattere per farlo stare in due.
"""
import os
from datetime import date
from io import BytesIO
from xml.sax.saxutils import escape

from alternative import alternativa

from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate, CondPageBreak, Frame, KeepTogether, PageTemplate, Paragraph, Spacer, Table, TableStyle

VIOLA, INCHIOSTRO, LIME, LILLA, GRIGIO, ROSA, NEBBIA, LINEA = (colors.HexColor(x) for x in (
    "#5B3DF5", "#14142B", "#D4FF4F", "#F1EEFF", "#5C5C78", "#FFE3EC", "#F7F7FB", "#E4E4EE"))
PRECISIONE = {"media": "buona", "media-bassa": "discreta", "bassa": "di massima", "parziale": "incompleta"}
STUDIO = "Centro Pratiche Flaiano · Via Filoteo Alberini 25 int. 10, 00139 Roma · Tel. 06 97845429 · WhatsApp 371 623 0690 · praticheflaiano.it"
LINK_CONSULENZA = os.environ.get("STIMA_LINK_CONSULENZA", "https://link.arcanis.it/widget/group/bklXY9sZUszt8V2GpkU1")
MARGINE = 18 * mm
LARGHEZZA = A4[0] - 2 * MARGINE


def _data(s):
    try:
        return date.fromisoformat(str(s)[:10]).strftime("%d/%m/%Y")
    except ValueError:
        return "—"


def _euro(x):
    if x is None:
        return "—"
    return f"{x:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")


def _eta(s):
    """'67a 3m' -> '67 anni e 3 mesi'."""
    import re
    m = re.match(r"^\s*(\d+)a\s+(\d+)m\s*$", str(s or ""))
    if not m:
        return str(s or "—")
    anni, mesi = int(m.group(1)), int(m.group(2))
    return f"{anni} anni" + (f" e {mesi} {'mese' if mesi == 1 else 'mesi'}" if mesi else "")


def _st(nome, corpo, **kw):
    return ParagraphStyle(nome, fontName=kw.pop("font", "Helvetica"), fontSize=corpo, leading=kw.pop("leading", corpo * 1.42),
                          textColor=kw.pop("color", INCHIOSTRO), alignment=kw.pop("align", TA_LEFT), **kw)


S = {
    "h1": _st("h1", 25, font="Helvetica-Bold", leading=29, spaceAfter=3),
    "sotto": _st("sotto", 10.5, color=GRIGIO),
    "h2": _st("h2", 15.5, font="Helvetica-Bold", color=VIOLA, leading=19, spaceBefore=16, spaceAfter=7),
    "p": _st("p", 11),
    "pb": _st("pb", 11, font="Helvetica-Bold"),
    "punto": _st("punto", 11, leftIndent=14, bulletIndent=2, spaceAfter=4),
    "etichetta": _st("etichetta", 8.5, font="Helvetica-Bold", color=GRIGIO, leading=11),
    "valore": _st("valore", 13, font="Helvetica-Bold", leading=16),
    "grande": _st("grande", 20, font="Helvetica-Bold", leading=24),
    "scheda": _st("scheda", 13.5, font="Helvetica-Bold", leading=17),
    "stato": _st("stato", 9.5, color=GRIGIO, align=TA_RIGHT),
    "th": _st("th", 9.5, font="Helvetica-Bold", color=colors.white),
    "cella": _st("cella", 10, leading=13.5),
    "cellab": _st("cellab", 10, font="Helvetica-Bold", leading=13.5),
    "nota": _st("nota", 9.5, color=GRIGIO, leading=13),
    "notap": _st("notap", 9.5, color=GRIGIO, leading=13, leftIndent=12, bulletIndent=2, spaceAfter=3),
}


def _p(testo, stile="p"):
    return Paragraph(escape(str(testo)), S[stile])


def _punti(voci, stile="punto"):
    return [Paragraph(escape(str(v)), S[stile], bulletText="•") for v in voci if v]


def _riquadro(contenuto, sfondo, larghezza=LARGHEZZA, margine=12, bordo=None):
    """Un riquadro colorato con gli angoli arrotondati. `contenuto`: lista di elementi."""
    t = Table([[contenuto]], colWidths=[larghezza])
    stile = [("BACKGROUND", (0, 0), (-1, -1), sfondo), ("LEFTPADDING", (0, 0), (-1, -1), margine), ("RIGHTPADDING", (0, 0), (-1, -1), margine),
             ("TOPPADDING", (0, 0), (-1, -1), margine - 2), ("BOTTOMPADDING", (0, 0), (-1, -1), margine), ("ROUNDEDCORNERS", [9, 9, 9, 9])]
    if bordo:
        stile.append(("BOX", (0, 0), (-1, -1), 1.2, bordo))
    t.setStyle(TableStyle(stile))
    return t


def _cifre(coppie, larghezza):
    """Riga di cifre: etichetta piccola sopra, valore grande sotto."""
    n = len(coppie)
    t = Table([[[Paragraph(escape(e.upper()), S["etichetta"]), Spacer(1, 2), Paragraph(escape(v), S["valore"])] for e, v in coppie]], colWidths=[larghezza / n] * n)
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                           ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return t


def _importi(c):
    imp = c.get("importo") or {}
    if imp.get("lordo_mensile_13") is not None:
        return _euro(imp["lordo_mensile_13"]), _euro(imp.get("netto_mensile_13_stima")), "al mese, su 13 mensilità"
    if imp.get("indennita_mensile_lorda_12") is not None:
        return _euro(imp["indennita_mensile_lorda_12"]), "—", "indennità al mese, su 12 mensilità"
    return "—", "—", ""


def _scheda_canale(c, spiegazione, prima):
    """La scheda di una strada di uscita: nome, date ed età, importi, spiegazione."""
    interno = LARGHEZZA - 28
    lordo, netto, base = _importi(c)
    testa = Table([[Paragraph(escape(c["canale"]), S["scheda"]), Paragraph(escape("Prima uscita possibile" if prima else str(c.get("stato") or "")), S["stato"])]],
                  colWidths=[interno * 0.62, interno * 0.38])
    testa.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                               ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    corpo = [testa, Spacer(1, 8),
             _cifre([("Maturi il diritto", _data(c.get("data_maturazione"))), ("Primo pagamento", _data(c.get("decorrenza"))), ("Età al primo pagamento", _eta(c.get("eta_alla_decorrenza")))], interno),
             Spacer(1, 8),
             _cifre([("Lordo mensile", lordo), ("Netto mensile stimato", netto), ("Precisione dell'importo", PRECISIONE.get((c.get("importo") or {}).get("affidabilita"), "—"))], interno)]
    if base:
        corpo += [Spacer(1, 3), Paragraph(escape(f"Importi {base}."), S["nota"])]
    if spiegazione:
        corpo += [Spacer(1, 7), _p(spiegazione)]
    return KeepTogether([_riquadro(corpo, LIME if prima else NEBBIA, margine=14), Spacer(1, 9)])


def _tabella(righe, larghezze):
    t = Table(righe, colWidths=larghezze, repeatRows=1)
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                           ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6), ("LINEBELOW", (0, 1), (-1, -1), 0.5, LINEA),
                           ("BACKGROUND", (0, 0), (-1, 0), INCHIOSTRO), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, NEBBIA])]))
    return t


def _contenuto(stima, risposte, url, codice):
    testo, base = stima["testo"], stima["scenari"][0]["esito"]
    nome = f"{risposte.get('nome', '')} {risposte.get('cognome', '')}".strip() or stima["estratto"].get("intestatario", "")
    provvisoria = bool(stima.get("revisione_consigliata"))
    f = []

    # ---------- Apertura ----------
    f.append(Paragraph("Stima e Calcolo della pensione", S["h1"]))
    riga = f"{nome} · nato/a il {_data(risposte.get('nascita'))} · calcolo del {_data(stima['data_calcolo'])}"
    if stima["estratto"].get("data_estratto"):
        riga += f" · estratto INPS del {_data(stima['estratto']['data_estratto'])}"
    f.append(_p(riga, "sotto"))
    f.append(Spacer(1, 12))

    if provvisoria:
        f.append(_riquadro([
            Paragraph("Stima provvisoria: un nostro operatore la sta completando", S["scheda"]), Spacer(1, 5),
            _p("I controlli automatici hanno segnalato questi punti da verificare a mano: " + "; ".join(stima["revisione_consigliata"]) + "."), Spacer(1, 4),
            _p("Il nostro operatore ha già ricevuto la segnalazione e provvede a completare la stima, senza costi aggiuntivi. "
               "Per definirla insieme prenota l'appuntamento telefonico compreso nel prezzo (trovi il collegamento più avanti) oppure scrivici in chat su WhatsApp al 371 623 0690. "
               "Fino alla conferma, considera date e importi come indicativi."),
        ], ROSA))
        f.append(Spacer(1, 10))

    stimati = stima["estratto"].get("contributi_stimati")
    if stimati:
        f.append(_riquadro([
            Paragraph("Il tuo estratto non è aggiornato a oggi", S["scheda"]), Spacer(1, 5),
            _p(f"L'estratto che hai caricato si ferma prima del {_data(stimati['dal'])}. Per il periodo fino al {_data(stimati['al'])} abbiamo aggiunto {stimati['settimane']} settimane "
               "stimate sul ritmo e sulla retribuzione dei tuoi ultimi periodi di lavoro. Date e importi di questo prospetto dipendono anche da questa proiezione: "
               "con un estratto aggiornato diventano più precisi."),
        ], NEBBIA, bordo=INCHIOSTRO))
        f.append(Spacer(1, 10))
    prima = base.get("prima_uscita_pensione")
    canale_prima = next((c for c in base["canali"] if prima and c["canale"] == prima.get("canale")), None)
    if prima:
        corpo = [Paragraph("PRIMA USCITA POSSIBILE", S["etichetta"]), Spacer(1, 3), Paragraph(escape(prima["canale"]), S["grande"]), Spacer(1, 2),
                 Paragraph(f"dal <b>{_data(prima['decorrenza'])}</b>" + (f" · a {escape(_eta(canale_prima.get('eta_alla_decorrenza')))}" if canale_prima else ""), S["valore"])]
        f.append(_riquadro(corpo, LIME, margine=16))
        f.append(Spacer(1, 10))
    # APE sociale: non è una pensione ma un'indennità ponte; se arriva prima della pensione va detto subito
    ape = next((c for c in base["canali"] if c["canale"].startswith("APE") and c.get("decorrenza")), None)
    if ape and (not prima or ape["decorrenza"] < prima["decorrenza"]):
        ind = (ape.get("importo") or {}).get("indennita_mensile_lorda_12")
        f.append(_riquadro([Paragraph("PRIMA DELLA PENSIONE", S["etichetta"]), Spacer(1, 3),
                            Paragraph(f"APE sociale dal <b>{_data(ape['decorrenza'])}</b>" + (f" · {_euro(ind)} lordi al mese per 12 mensilità" if ind is not None else ""), S["valore"]), Spacer(1, 3),
                            _p("È un'indennità che accompagna fino alla pensione di vecchiaia: va chiesta con una domanda di riconoscimento entro le scadenze dell'anno (31 marzo, 15 luglio, 30 novembre).")], LILLA, margine=14))
        f.append(Spacer(1, 10))
    netto = _importi(canale_prima)[1] if canale_prima else "—"
    f.append(_riquadro([_cifre([("Contributi ad oggi", str(base.get("contributi_ad_oggi") or "—").replace("a ", " anni ").replace("m", " mesi")),
                                ("Netto mensile stimato", netto), ("Sistema di calcolo", str(base.get("sistema_calcolo") or "—").split(" (")[0])], LARGHEZZA - 28)], NEBBIA, margine=14))

    f.append(Paragraph("In breve", S["h2"]))
    f.append(_p(testo["sintesi"]))
    uc = testo.get("uscita_consigliata") or {}
    if uc.get("canale"):
        f.append(Spacer(1, 9))
        f.append(_riquadro([Paragraph("LA STRADA CHE TI CONSIGLIAMO", S["etichetta"]), Spacer(1, 3),
                            Paragraph(escape(uc["canale"]) + (f" <font color='#5C5C78' size='10.5'>({escape(str(uc.get('scenario', '')).lower())})</font>" if uc.get("scenario") else ""), S["scheda"]),
                            Spacer(1, 4), _p(uc.get("motivo", ""))], LILLA))

    # ---------- Le strade ----------
    f.append(CondPageBreak(90 * mm))
    f.append(Paragraph("Le tue strade per la pensione", S["h2"]))
    f.append(_p("Per ogni strada: quando maturi il diritto, da quando arriva il primo pagamento e quanto prenderesti."))
    f.append(Spacer(1, 8))
    nome_base = stima["scenari"][0]["nome"]
    spiegazioni = {x["canale"]: x["testo"] for x in testo.get("spiegazione_canali") or [] if x.get("scenario") == nome_base}
    # Si mostrano le strade percorribili; quelle che arriverebbero dopo la pensione di vecchiaia non servono al cliente,
    # quelle non raggiungibili sono elencate in una riga.
    for c in base["canali"]:
        if c.get("decorrenza") and "irrilevante" not in str(c.get("stato")):
            f.append(_scheda_canale(c, spiegazioni.get(c["canale"], ""), bool(prima) and c["canale"] == prima.get("canale")))
    chiuse = [c for c in base["canali"] if not c.get("decorrenza")]
    if chiuse:
        f.append(_p("Strade oggi non percorribili con i tuoi dati: " + "; ".join(f"{c['canale']} ({c.get('stato')})" for c in chiuse) + ".", "nota"))
        f.append(Spacer(1, 4))
    f.append(_p("Il netto è una media su 13 mensilità, con le regole fiscali del 2026 e la pensione come unico reddito.", "nota"))
    f.append(_p("Come leggere la precisione: buona = dati certi; discreta = dipende dai contributi futuri o da coefficienti non ancora pubblicati; "
                "di massima = una parte dell'importo è stimata; incompleta = manca una parte del calcolo.", "nota"))

    # ---------- Alternative ----------
    if len(stima["scenari"]) > 1:
        f.append(CondPageBreak(60 * mm))
        f.append(Paragraph("Le alternative a confronto", S["h2"]))
        righe = [[Paragraph(x, S["th"]) for x in ("Se…", "Uscita", "Dal", "Netto al mese", "Cosa sapere")]]
        for i, sc in enumerate(stima["scenari"]):
            a = alternativa(sc, base, stima.get("data_calcolo")) if i else alternativa(sc, {}, None)
            sapere = " ".join(x for x in (a["confronto"], " ".join(sc.get("note") or []) or sc.get("motivo") or "") if x)
            righe.append([_p(sc["nome"], "cellab"), _p(a["canale"] or "—", "cella"), _p(_data(a["decorrenza"]), "cella"),
                          _p(_euro(a["netto"]), "cellab"), _p(sapere, "cella")])
        f.append(_tabella(righe, [LARGHEZZA * x for x in (0.22, 0.20, 0.14, 0.17, 0.27)]))

    if stima.get("confronto_inps"):
        f.append(Paragraph("Confronto con la simulazione INPS", S["h2"]))
        f += _punti([f"{c['canale']}: INPS {_euro(c['importo_inps'])} al mese, nostra stima {_euro(c['importo_stima'])} ({c['scarto_percento']:+.1f}%). "
                     + ("Le due stime sono coerenti." if c["coerente"] else "Lo scarto è alto: la stima va controllata.") for c in stima["confronto_inps"]])

    # ---------- Cosa fare ----------
    if testo.get("decisioni"):
        f.append(CondPageBreak(45 * mm))
        f.append(Paragraph("Cosa decidere", S["h2"]))
        for i, d in enumerate(testo["decisioni"], 1):
            f.append(Paragraph(escape(d["cosa"]) + (f" <b>(entro {escape(d['entro'])})</b>" if d.get("entro") else ""), S["punto"], bulletText=f"{i}."))
    if testo.get("dati_mancanti"):
        f.append(CondPageBreak(40 * mm))
        f.append(Paragraph("Per una stima più precisa", S["h2"]))
        f += _punti(testo["dati_mancanti"])

    # ---------- Consulenza e recupero ----------
    f.append(Spacer(1, 12))
    consulenza = [Paragraph("Parlane con un nostro operatore: è compreso nel prezzo", S["scheda"]), Spacer(1, 5),
                  _p("Puoi farti spiegare questo prospetto e chiarire i tuoi dubbi al telefono o in chat. La consulenza è facoltativa e non costa nulla in più."), Spacer(1, 5),
                  Paragraph(f"Prenota l'appuntamento telefonico: <a href=\"{escape(LINK_CONSULENZA)}\" color=\"#4B2FE0\"><u>{escape(LINK_CONSULENZA)}</u></a>", S["p"]), Spacer(1, 2),
                  _p("Oppure scrivici su WhatsApp al 371 623 0690 o chiamaci allo 06 97845429.")]
    f.append(KeepTogether([_riquadro(consulenza, LILLA, margine=14)]))
    if url:
        codice_qr = qr.QrCodeWidget(url, barLevel="M")
        lato = 30 * mm
        b = codice_qr.getBounds()
        disegno = Drawing(lato, lato, transform=[lato / (b[2] - b[0]), 0, 0, lato / (b[3] - b[1]), 0, 0])
        disegno.add(codice_qr)
        t = Table([[disegno, [Paragraph("Ritrova questo prospetto quando vuoi", S["scheda"]), Spacer(1, 4),
                              _p("Inquadra il codice con il telefono: ti verrà chiesta la tua data di nascita."), Spacer(1, 3),
                              Paragraph(f"Codice pratica: <b>{escape(codice)}</b>", S["p"])]]], colWidths=[lato + 8 * mm, LARGHEZZA - lato - 8 * mm])
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NEBBIA), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ROUNDEDCORNERS", [9, 9, 9, 9]),
                               ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12), ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
        f += [Spacer(1, 9), KeepTogether([t])]

    # ---------- Note in fondo ----------
    limiti = list(stima.get("limiti") or []) + list(stima.get("parametri_non_definitivi") or [])
    note_canali = []
    for c in base["canali"]:
        if not c.get("decorrenza") or "irrilevante" in str(c.get("stato")):
            continue
        for n in c.get("note") or []:
            if n not in note_canali:
                note_canali.append(n)
    avvertenze = list(testo.get("avvertenze") or []) + list(stima.get("dubbi") or [])
    if limiti or avvertenze or note_canali:
        f.append(CondPageBreak(50 * mm))
        f.append(Paragraph("Note e avvertenze", S["h2"]))
        for titolo, voci in (("Cosa questa stima non considera", limiti), ("Da sapere sui tuoi dati", avvertenze), ("Note tecniche sul calcolo", note_canali)):
            if voci:
                f.append(Paragraph(titolo, S["pb"]))
                f.append(Spacer(1, 3))
                f += _punti(voci, "notap")
                f.append(Spacer(1, 6))
    f.append(Spacer(1, 6))
    f.append(_p("Stima indicativa basata sui documenti caricati e sulle norme in vigore alla data del calcolo: non sostituisce la certificazione dell'INPS "
                f"e non costituisce domanda di pensione. Parametri di calcolo: versione {stima['versione_parametri']}.", "nota"))
    return f


def _piede(totale):
    def disegna(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(VIOLA)
        canvas.rect(0, A4[1] - 11 * mm, A4[0], 11 * mm, stroke=0, fill=1)
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 10.5)
        canvas.drawString(MARGINE, A4[1] - 7.2 * mm, "Centro Pratiche Flaiano")
        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(A4[0] - MARGINE, A4[1] - 7.2 * mm, "CAF UNSIC · Patronato ENASC")
        canvas.setStrokeColor(LINEA)
        canvas.line(MARGINE, 13.5 * mm, A4[0] - MARGINE, 13.5 * mm)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(GRIGIO)
        canvas.drawString(MARGINE, 9 * mm, STUDIO)
        canvas.drawRightString(A4[0] - MARGINE, 9 * mm, f"Pagina {doc.page}" + (f" di {totale}" if totale else ""))
        canvas.restoreState()
    return disegna


def crea_prospetto(stima, risposte, url_recupero="", codice=""):
    """Restituisce i byte del PDF. Due passate: la prima conta le pagine, la seconda le scrive nel piè di pagina."""
    totale, ultimo = 0, b""
    for _ in range(2):
        buf = BytesIO()
        doc = BaseDocTemplate(buf, pagesize=A4, leftMargin=MARGINE, rightMargin=MARGINE, topMargin=20 * mm, bottomMargin=18 * mm,
                              title="Stima e Calcolo della pensione", author="Centro Pratiche Flaiano")
        doc.addPageTemplates(PageTemplate(id="p", frames=[Frame(MARGINE, 18 * mm, LARGHEZZA, A4[1] - 38 * mm, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)],
                                          onPage=_piede(totale)))
        doc.build(_contenuto(stima, risposte, url_recupero, codice))
        ultimo, totale = buf.getvalue(), doc.page
    return ultimo
