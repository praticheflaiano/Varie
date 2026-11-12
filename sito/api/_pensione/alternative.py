"""
Riga del confronto tra le alternative, uguale per il prospetto PDF e per la pagina della pratica.

Per ogni variante si mostra l'uscita di cui parla la variante (con "lavora fino a" quella che parte dopo la fine
del lavoro, non la prima in assoluto) e, accanto, la stessa strada nella situazione attuale: così un importo più
alto che arriva molti anni dopo non sembra un guadagno.
"""
from datetime import date


def _data(iso):
    try:
        return date.fromisoformat(str(iso)[:10]).strftime("%d/%m/%Y")
    except ValueError:
        return str(iso or "")


def _euro(x):
    return "—" if x is None else f"{x:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")


def _pensioni(esito):
    return sorted((c for c in esito.get("canali") or [] if c.get("decorrenza") and (c.get("importo") or {}).get("netto_mensile_13_stima") is not None),
                  key=lambda c: c["decorrenza"])


def alternativa(sc, base, data_calcolo=None):
    """Restituisce {canale, decorrenza, netto, confronto} per lo scenario `sc` rispetto all'esito di base."""
    e = sc.get("esito") or {}
    ip = sc.get("ipotesi") or {}
    pensioni = _pensioni(e)
    scelta = None
    if ip.get("continua_lavoro") and ip.get("fino_a"):
        # Lavorando fino a quella data si esce con la strada migliore già maturata a fine lavoro (non prima della fine
        # del lavoro); se nessuna è maturata, con la prima che matura dopo.
        fine = str(ip["fino_a"])[:10]
        maturate = [c for c in pensioni if str(c.get("data_maturazione") or c["decorrenza"]) <= fine]
        if maturate:
            # Il motore ha già spostato la decorrenza (e ricalcolato l'importo) dopo la fine del lavoro.
            scelta = max(maturate, key=lambda c: c["importo"]["netto_mensile_13_stima"])
        else:
            scelta = next((c for c in pensioni if c["decorrenza"] > fine), None)
    if scelta is None:
        pu = e.get("prima_uscita_pensione") or {}
        scelta = next((c for c in pensioni if c.get("canale") == pu.get("canale")), None) or (pensioni[0] if pensioni else {})
    netto = (scelta.get("importo") or {}).get("netto_mensile_13_stima")
    frasi = []
    stessa = next((c for c in _pensioni(base) if c.get("canale") == scelta.get("canale")), None)
    if stessa and (stessa["decorrenza"] != scelta.get("decorrenza") or stessa["importo"].get("netto_mensile_13_stima") != netto):
        frasi.append(f"Nella situazione attuale la stessa pensione parte il {_data(stessa['decorrenza'])} con {_euro(stessa['importo'].get('netto_mensile_13_stima'))} netti al mese.")
    if not ip.get("continua_lavoro") and not ip.get("settimane_volontari_annue") and scelta.get("decorrenza") and data_calcolo:
        anni = (date.fromisoformat(scelta["decorrenza"][:10]) - date.fromisoformat(str(data_calcolo)[:10])).days / 365.25
        if anni >= 1:
            frasi.append(f"Fino ad allora, circa {round(anni)} anni senza stipendio né pensione.")
        # L'importo più alto arriva perché si esce più tardi (età più alta e montante rivalutato), non perché si è versato
        # di più: si mostra quanto si incasserebbe nel frattempo con la prima uscita possibile continuando a lavorare.
        pu = (base.get("prima_uscita_pensione") or {})
        prima = next((c for c in _pensioni(base) if c.get("canale") == pu.get("canale")), None)
        if prima and prima["decorrenza"] < scelta["decorrenza"]:
            d0, d1 = date.fromisoformat(prima["decorrenza"][:10]), date.fromisoformat(scelta["decorrenza"][:10])
            mesi = (d1.year - d0.year) * 12 + d1.month - d0.month
            incassato = prima["importo"]["netto_mensile_13_stima"] * 13 / 12 * mesi
            if incassato > 0:
                frasi.append(f"Restando al lavoro fino alla {prima['canale']} ({_data(prima['decorrenza'])}), prima di quella data incasseresti già circa "
                             f"{_euro(round(incassato, -3)).replace(',00', '')} netti di pensione.")
    return {"canale": scelta.get("canale"), "decorrenza": scelta.get("decorrenza"), "netto": netto, "confronto": " ".join(frasi)}
