"""Prova della lettura diretta dell'estratto (estratto_inps.py) su un estratto FINTO con la stessa
impaginazione di quello vero: pagina ruotata di 90°, una cella per frammento di testo, intestazione
ripetuta, legenda delle note e segnalazioni. Nessun dato reale. Uso: python3 api/_pensione/test_estratto.py
"""
import io
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "stima"))
import estratto_inps  # noqa: E402

RIGHE = [
    ("01/03/1985", "31/12/1985", "Servizio militare", "sett.", "43", "43,000", "", "", ""),
    ("01/01/1990", "31/12/1990", "Titolare di impresa COM.", "mesi", "12", "12,000", "7.952,91", "DE LUCA MARIO", ""),
    ("01/01/1991", "30/09/1991", "Titolare di impresa ART.", "mesi", "9", "9,000", "8.100,00", "DE LUCA MARIO", "0"),
    ("01/01/2000", "31/12/2000", "Lavoro dipendente", "sett.", "52", "52,000", "22.155,00", "SRL ESEMPIO", ""),
    ("16/03/2000", "16/05/2000", "Cassa integrazione (Int)", "sett.", "0", "0,000", "1.141,70", "SRL ESEMPIO", ""),
    ("01/01/2001", "31/12/2001", "Lav.dipend. part-time", "sett.", "51", "46,000", "19.919,00", "SPA SOC. UN. ESEMPIO & ESEMPIO MEDICAL", "5"),
    ("01/01/2002", "31/12/2002", "Contr.Figurativa NASpI", "sett.", "52", "52,000", "21.646,56", "", "O"),
]
COLONNE = (56.1, 112.2, 162.3, 338.8, 390.0, 430.6, 491.7, 573.8, 775.7)


def pdf_finto():
    from reportlab.pdfgen import canvas

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(595, 842))

    def pagina(n, righe, coda=()):
        c.setPageRotation(90)
        c.transform(0, 1, -1, 0, 595, 0)
        c.setFont("Helvetica", 9)
        y = 536.0
        if n == 1:
            for testo, x, yy in (("Estratto Conto Previdenziale", 221.2, 511), ("Regime generale", 283.8, 491), ("DE LUCA MARIO", 494, 515),
                                 ("nato a ROMA   (RM)", 494, 497), ("il 01/01/1960", 494, 479), ("Emesso il 05/11/2026", 288.5, 461),
                                 ("Codice fiscale DLCMRA60A01H501X", 494, 461), ("residente in VIA DI PROVA 1", 494, 443), ("00100 ROMA (RM)", 494, 434)):
                c.drawString(x, yy, testo)
            y = 354.8
        for testo, x, dy in (("Periodo", 87.4, 0), ("Contributi utili pensione", 345.2, 0), ("Retribuzione o", 461.9, 0), ("Tipo di contribuzione", 203, 3),
                             ("Azienda", 628.3, 3), ("Note", 770.2, 3), ("reddito", 477.9, 10), ("Dal", 69.1, 24.6), ("Al", 127.7, 24.6),
                             ("al diritto e al calcolo", 363.3, 24.6), ("Euro", 482.9, 24.6)):
            c.drawString(x, y - dy, testo)
        y -= 39.2
        for r in righe:
            for x, t in zip(COLONNE, r):
                if t:
                    c.drawString(x, y, t)
            y -= 14.6
        y -= 12
        for t in coda:
            c.drawString(50, y, t)
            y -= 14.6
        c.drawString(48, 72, "Estratto conto di DE LUCA MARIO DLCMRA60A01H501X")
        c.drawString(48, 52, f"Pagina {n} di 2")
        c.showPage()

    pagina(1, RIGHE[:4])
    pagina(2, RIGHE[4:], ("Note:", "O) Contribuzione non utile per il requisito di prova.", "0) Contributi accreditati in base ai versamenti.",
                           "5) Numero di contributi soggetto a verifica.", "", "Segnalazioni personalizzate e/o pratiche in corso",
                           "-  Risulta presenza di posizione assicurativa attiva presso l'Ente: Ente di Prova"))
    c.save()
    return buf.getvalue()


def uguale(a, b, cosa):
    assert a == b, f"{cosa}: atteso {b!r}, letto {a!r}"


def main():
    letto = estratto_inps.leggi_pdf(pdf_finto())
    assert letto and letto["completo"], letto and letto["note"]
    uguale((letto["cognome"], letto["nome"]), ("De Luca", "Mario"), "nome diviso con il codice fiscale")
    uguale(letto["codice_fiscale"], "DLCMRA60A01H501X", "codice fiscale")
    uguale(letto["data_nascita"], "1960-01-01", "nascita")
    uguale(letto["data_estratto"], "2026-11-05", "emesso il")
    uguale(letto["residenza"], "VIA DI PROVA 1, 00100 ROMA (RM)", "residenza")
    uguale(len(letto["periodi"]), len(RIGHE), "numero di righe")
    for p, r in zip(letto["periodi"], RIGHE):
        g, m, a = r[0].split("/")
        uguale(p["dal"], f"{a}-{m}-{g}", "dal")
        uguale((p["tipo"], p["contributi_diritto"], p["contributi_calcolo"], p["importo"], p["azienda"], p["nota"]), (r[2], r[4], r[5], r[6], r[7], r[8]), r[0])
        uguale(p["unita"], "mesi" if r[3] == "mesi" else "settimane", "unità")
        uguale(p["gestione"], "Regime generale", "sezione")
    uguale([v["codice"] for v in letto["legenda_note"]], ["O", "0", "5"], "legenda")
    uguale(letto["segnalazioni"], ["Risulta presenza di posizione assicurativa attiva presso l'Ente: Ente di Prova"], "segnalazioni")

    for tipo, atteso in (("Titolare di impresa COM.", "COMMERCIANTI"), ("Titolare di impresa ART.", "ARTIGIANI"), ("Lavoro dipendente", "FPLD"),
                         ("Lav.dipend. part-time", "FPLD"), ("Gestione Separata", "GS"), ("Servizio militare", None), ("Regime generale", None)):
        uguale(estratto_inps.codice_gestione(tipo), atteso, tipo)

    # dalle righe ai contributi per anno e gestione (stessa funzione usata dopo il pagamento)
    import elabora
    contributi, dubbi, primo = elabora.righe_in_contributi(letto)
    per = {(c["anno"], c["gestione"]): c for c in contributi}
    uguale(per[(1990, "COMMERCIANTI")]["settimane"], 52, "12 mesi = 52 settimane")
    uguale(per[(1991, "ARTIGIANI")]["settimane"], 39, "9 mesi = 39 settimane")
    uguale(per[(2000, "FPLD")]["imponibile"], 23296.70, "retribuzione + integrazione dello stesso anno")
    uguale(per[(2001, "FPLD")].get("settimane_calcolo"), 46, "settimane utili al calcolo del part-time")
    uguale(per[(2002, "FPLD")]["figurative"], 52, "NASpI figurativa")
    uguale(primo, "1985-03-01", "primo accredito")
    assert any("Nota «O»" in d and "requisito di prova" in d for d in dubbi), dubbi
    assert any("Segnalazione INPS" in d for d in dubbi), dubbi
    assert not any("gestione non riconosciuta" in d for d in dubbi), dubbi

    # un PDF senza testo (scansione) non si legge così: si passa alla lettura con il modello
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.rect(10, 10, 100, 100)
    c.save()
    assert estratto_inps.leggi_pdf(buf.getvalue()) is None
    assert estratto_inps.leggi_pdf(b"non un pdf") is None
    print("OK: lettura diretta dell'estratto")


if __name__ == "__main__":
    main()
