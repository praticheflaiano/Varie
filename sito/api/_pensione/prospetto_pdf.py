"""
Prospetto PDF di due pagine della Stima e Calcolo della pensione, con QR di recupero.
Usa solo i dati già calcolati (motore) e scritti (modello): qui non si calcola nulla.
"""
from datetime import date
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle

VIOLA, INCHIOSTRO, LIME, LILLA, GRIGIO, ROSA = (colors.HexColor(x) for x in ("#5B3DF5", "#14142B", "#D4FF4F", "#F1EEFF", "#6B6B85", "#FFE3EC"))
PRECISIONE = {"media": "buona", "media-bassa": "discreta", "bassa": "di massima", "parziale": "incompleta"}
STUDIO = "Centro Pratiche Flaiano · Via Filoteo Alberini 25 int. 10, 00139 Roma · Tel. 06 97845429 · WhatsApp 371 623 0690 · praticheflaiano.it"


def _data(s):
    try:
        return date.fromisoformat(str(s)[:10]).strftime("%d/%m/%Y")
    except ValueError:
        return "—"


def _euro(x):
    if x is None:
        return "—"
    return f"{x:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")


def _stili(scala):
    def st(nome, size, **kw):
        return ParagraphStyle(nome, fontName=kw.pop("font", "Helvetica"), fontSize=size * scala, leading=size * scala * 1.28,
                              textColor=kw.pop("color", INCHIOSTRO), alignment=TA_LEFT, **kw)
    return {
        "h1": st("h1", 20, font="Helvetica-Bold", spaceAfter=2),
        "h2": st("h2", 11.5, font="Helvetica-Bold", spaceBefore=7, spaceAfter=3, color=VIOLA),
        "p": st("p", 9.2),
        "piccolo": st("piccolo", 7.6, color=GRIGIO),
        "cella": st("cella", 8.2),
        "cellab": st("cellab", 8.2, font="Helvetica-Bold"),
        "evid": st("evid", 11.5, font="Helvetica-Bold"),
        "punto": st("punto", 8.8, leftIndent=9, bulletIndent=0),
    }


def _punti(voci, stile, massimo):
    voci = [v for v in voci if v]
    out = [Paragraph(escape(str(v)), stile, bulletText="•") for v in voci[:massimo]]
    if len(voci) > massimo:
        out.append(Paragraph(f"… e altre {len(voci) - massimo} voci: chiedici il dettaglio completo.", stile))
    return out


def _tabella(righe, larghezze, stili, testata=True):
    t = Table(righe, colWidths=larghezze, repeatRows=1 if testata else 0)
    base = [("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3), ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#E4E4EE"))]
    if testata:
        base += [("BACKGROUND", (0, 0), (-1, 0), INCHIOSTRO), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white)]
    t.setStyle(TableStyle(base + stili))
    return t


def _riga_canale(c, s):
    imp = c.get("importo") or {}
    if imp.get("lordo_mensile_13") is not None:
        lordo, netto = _euro(imp["lordo_mensile_13"]), _euro(imp.get("netto_mensile_13_stima"))
    elif imp.get("indennita_mensile_lorda_12") is not None:
        lordo, netto = _euro(imp["indennita_mensile_lorda_12"]) + " (12 mesi)", "—"
    else:
        lordo = netto = "—"
    return [Paragraph(escape(c["canale"]), s["cellab"]), Paragraph(_data(c.get("data_maturazione")), s["cella"]),
            Paragraph(_data(c.get("decorrenza")), s["cella"]), Paragraph(escape(c.get("eta_alla_decorrenza") or "—"), s["cella"]),
            Paragraph(lordo, s["cella"]), Paragraph(netto, s["cella"]), Paragraph(PRECISIONE.get(imp.get("affidabilita"), "—"), s["cella"])]


def _contenuto(stima, risposte, url, codice, scala, tagli):
    s = _stili(scala)
    larg = A4[0] - 30 * mm
    testo, base = stima["testo"], stima["scenari"][0]["esito"]
    nome = f"{risposte.get('nome', '')} {risposte.get('cognome', '')}".strip() or stima["estratto"].get("intestatario", "")
    f = []

    # ---------- Pagina 1 ----------
    f.append(Paragraph("Stima e Calcolo della pensione", s["h1"]))
    riga = f"{escape(nome)} · nato/a il {_data(risposte.get('nascita'))} · calcolo del {_data(stima['data_calcolo'])}"
    if stima["estratto"].get("data_estratto"):
        riga += f" · estratto INPS aggiornato al {_data(stima['estratto']['data_estratto'])}"
    f.append(Paragraph(riga, s["piccolo"]))
    f.append(Spacer(1, 5))
    prima = base.get("prima_uscita_pensione")
    if prima:
        f.append(_tabella([[Paragraph(f"Prima uscita possibile: {escape(prima['canale'])} dal {_data(prima['decorrenza'])}", s["evid"])]], [larg],
                          [("BACKGROUND", (0, 0), (-1, -1), LIME), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)], testata=False))
    if stima.get("revisione_consigliata"):
        f.append(Spacer(1, 4))
        f.append(_tabella([[Paragraph("Da far controllare a un nostro operatore prima di decidere: " + escape("; ".join(stima["revisione_consigliata"])) + ".", s["cellab"])]],
                          [larg], [("BACKGROUND", (0, 0), (-1, -1), ROSA)], testata=False))
    f.append(Paragraph("In breve", s["h2"]))
    f.append(Paragraph(escape(testo["sintesi"]), s["p"]))
    uc = testo["uscita_consigliata"]
    f.append(Spacer(1, 3))
    f.append(Paragraph(f"<b>Uscita consigliata:</b> {escape(uc['canale'])} ({escape(uc['scenario'].lower())}). {escape(uc['motivo'])}", s["p"]))
    f.append(Paragraph("Le tue strade oggi", s["h2"]))
    f.append(Paragraph(f"Contributi ad oggi: <b>{escape(str(base['contributi_ad_oggi']))}</b> · sistema di calcolo: <b>{escape(base['sistema_calcolo'])}</b>", s["p"]))
    f.append(Spacer(1, 3))
    testata = [Paragraph(x, ParagraphStyle("th", parent=s["cellab"], textColor=colors.white)) for x in
               ("Strada", "Maturi il diritto", "Primo pagamento", "Età", "Lordo mensile", "Netto stimato", "Precisione")]
    cw = [larg * x for x in (0.27, 0.12, 0.13, 0.10, 0.14, 0.13, 0.11)]
    f.append(_tabella([testata] + [_riga_canale(c, s) for c in base["canali"]], cw, []))
    f.append(Paragraph("Importi lordi su 13 mensilità. Precisione: buona = dati certi; discreta = dipende da contributi futuri o da coefficienti non ancora "
                       "pubblicati; di massima = la parte maturata prima del 1996 è stimata; incompleta = manca una parte del calcolo.", s["piccolo"]))
    if testo.get("decisioni"):
        f.append(Paragraph("Cosa decidere", s["h2"]))
        f += _punti([d["cosa"] + (f" (entro {d['entro']})" if d.get("entro") else "") for d in testo["decisioni"]], s["punto"], tagli["decisioni"])

    # ---------- Pagina 2 ----------
    f.append(PageBreak())
    if len(stima["scenari"]) > 1:
        f.append(Paragraph("Le alternative a confronto", s["h2"]))
        righe = [[Paragraph(x, ParagraphStyle("th2", parent=s["cellab"], textColor=colors.white)) for x in ("Scenario", "Prima uscita", "Dal", "Netto stimato", "Cosa sapere")]]
        for sc in stima["scenari"]:
            e = sc["esito"]
            pu = e.get("prima_uscita_pensione") or {}
            canale = next((c for c in e["canali"] if c["canale"] == pu.get("canale")), {})
            netto = (canale.get("importo") or {}).get("netto_mensile_13_stima")
            righe.append([Paragraph(escape(sc["nome"]), s["cellab"]), Paragraph(escape(pu.get("canale", "—")), s["cella"]), Paragraph(_data(pu.get("decorrenza")), s["cella"]),
                          Paragraph(_euro(netto), s["cella"]), Paragraph(escape(" ".join(sc.get("note") or []) or sc.get("motivo") or ""), s["cella"])])
        f.append(_tabella(righe, [larg * x for x in (0.24, 0.20, 0.11, 0.13, 0.32)], []))
    if stima.get("confronto_inps"):
        f.append(Paragraph("Confronto con la simulazione INPS", s["h2"]))
        f += _punti([f"{c['canale']}: INPS {_euro(c['importo_inps'])} al mese, nostra stima {_euro(c['importo_stima'])} ({c['scarto_percento']:+.1f}%). "
                     + ("Le due stime sono coerenti." if c["coerente"] else "Lo scarto è alto: la stima va controllata.") for c in stima["confronto_inps"]], s["punto"], 3)
    if testo.get("dati_mancanti"):
        f.append(Paragraph("Per una stima più precisa", s["h2"]))
        f += _punti(testo["dati_mancanti"], s["punto"], tagli["mancanti"])
    limiti = list(stima.get("limiti") or []) + list(stima.get("parametri_non_definitivi") or [])
    if limiti:
        f.append(Paragraph("Cosa questa stima non considera", s["h2"]))
        f += _punti(limiti, s["punto"], tagli["limiti"])
    avv = list(testo.get("avvertenze") or []) + list(stima.get("dubbi") or [])
    if avv:
        f.append(Paragraph("Avvertenze", s["h2"]))
        f += _punti(avv, s["punto"], tagli["avvertenze"])
    f.append(Spacer(1, 8))
    if url:
        codice_qr = qr.QrCodeWidget(url, barLevel="M")
        lato = 30 * mm
        b = codice_qr.getBounds()
        disegno = Drawing(lato, lato, transform=[lato / (b[2] - b[0]), 0, 0, lato / (b[3] - b[1]), 0, 0])
        disegno.add(codice_qr)
        testo_qr = [Paragraph("Ritrova questo prospetto", s["cellab"]),
                    Paragraph("Inquadra il codice con il telefono: ti verrà chiesta la tua data di nascita. "
                              f"Codice pratica: <b>{escape(codice)}</b>", s["cella"])]
        f.append(_tabella([[disegno, testo_qr]], [lato + 6 * mm, larg - lato - 6 * mm], [("BACKGROUND", (0, 0), (-1, -1), LILLA), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")], testata=False))
    f.append(Spacer(1, 5))
    f.append(Paragraph("Stima indicativa basata sui documenti caricati e sulle norme in vigore alla data del calcolo: non sostituisce la certificazione dell'INPS "
                       f"e non costituisce domanda di pensione. Parametri di calcolo: versione {escape(str(stima['versione_parametri']))}.", s["piccolo"]))
    return f


def _piede(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(VIOLA)
    canvas.rect(0, A4[1] - 9 * mm, A4[0], 9 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(15 * mm, A4[1] - 6 * mm, "Centro Pratiche Flaiano")
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(GRIGIO)
    canvas.drawString(15 * mm, 8 * mm, STUDIO)
    canvas.drawRightString(A4[0] - 15 * mm, 8 * mm, f"Pagina {doc.page} di 2")
    canvas.restoreState()


def crea_prospetto(stima, risposte, url_recupero="", codice=""):
    """Restituisce i byte del PDF. Riduce progressivamente elenchi e carattere finché il prospetto sta in due pagine."""
    tentativi = [(1.0, {"decisioni": 5, "mancanti": 5, "limiti": 6, "avvertenze": 6}), (0.94, {"decisioni": 4, "mancanti": 4, "limiti": 5, "avvertenze": 4}),
                 (0.88, {"decisioni": 3, "mancanti": 3, "limiti": 4, "avvertenze": 3}), (0.82, {"decisioni": 3, "mancanti": 2, "limiti": 3, "avvertenze": 2})]
    ultimo = b""
    for scala, tagli in tentativi:
        buf = BytesIO()
        doc = BaseDocTemplate(buf, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
                              title="Stima e Calcolo della pensione", author="Centro Pratiche Flaiano")
        doc.addPageTemplates(PageTemplate(id="p", frames=[Frame(15 * mm, 14 * mm, A4[0] - 30 * mm, A4[1] - 29 * mm, id="f", leftPadding=0, rightPadding=0)], onPage=_piede))
        doc.build(_contenuto(stima, risposte, url_recupero, codice, scala, tagli))
        ultimo = buf.getvalue()
        if doc.page <= 2:
            break
    return ultimo
