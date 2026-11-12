"""Prove delle regole verificate nella revisione dell'11/11/2026 (motore, preparazione dei dati, lettura dell'estratto).
Ogni prova ha un risultato atteso calcolato a mano. Nessun dato reale. Uso: python3 api/_pensione/test_regole.py
"""
import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "stima"))
import conteggi_pensione as m  # noqa: E402
import elabora as e  # noqa: E402
import estratto_inps as x  # noqa: E402

OGGI = "2026-11-11"


def vicino(a, b, cosa, tolleranza=0.01):
    assert abs(a - b) <= tolleranza, f"{cosa}: atteso {b}, ottenuto {a}"


def uguale(a, b, cosa):
    assert a == b, f"{cosa}: atteso {b!r}, ottenuto {a!r}"


def caso(nascita, sesso, contributi, figli=0, continua=True, imponibile=30000, **altro):
    return {"assistito": {"nome": "Prova", "nascita": nascita, "sesso": sesso, "figli": figli}, "data_calcolo": OGGI,
            "gestione_principale": altro.pop("gestione", "FPLD"), "primo_accredito": f"{min(c['anno'] for c in contributi)}-01-01",
            "contributi": contributi,
            "proiezione": {"continua_lavoro": continua, "settimane_annue": 52, "imponibile_annuo": imponibile, "crescita_imponibile": 0.0, "fino_a": None,
                           "settimane_volontari_annue": 0, **altro.pop("proiezione", {})},
            "condizioni": altro.pop("condizioni", {}), "ipotesi": {"tasso_capitalizzazione_futuro": 0.015, "rivalutazione_assegno_sociale": 0.0}, **altro}


def anni(da, a, gestione="FPLD", imponibile=30000, **piu):
    return [{"anno": y, "gestione": gestione, "settimane": 52, "figurative": 0, "imponibile": imponibile, **piu} for y in range(da, a + 1)]


def canale(esito, nome):
    return next(c for c in esito["canali"] if c["canale"].startswith(nome))


# 1. Aliquote di computo per anno (artigiani/commercianti 20% fino al 2011, 24% dal 2018; gestione separata dal 10% al 33%)
uguale(m.aliquota_computo("COMMERCIANTI", 2005), 0.20, "commercianti 2005")
uguale(m.aliquota_computo("ARTIGIANI", 2012), 0.213, "artigiani 2012")
uguale(m.aliquota_computo("ARTIGIANI", 2017), 0.2355, "artigiani 2017")
uguale(m.aliquota_computo("COMMERCIANTI", 2026), 0.24, "commercianti 2026")
uguale(m.aliquota_computo("GS", 1996), 0.10, "gestione separata 1996")
uguale(m.aliquota_computo("GS", 2008), 0.24, "gestione separata 2008")
uguale(m.aliquota_computo("GS", 2020), 0.33, "gestione separata 2020")
uguale(m.aliquota_computo("FPLD", 2000), 0.33, "dipendenti")
c = m.Caso(caso("1960-05-10", "M", [{"anno": 1998, "gestione": "GS", "settimane": 52, "figurative": 0, "imponibile": 20000}], continua=False))
vicino(c.anni[1998]["contr"], 2500.0, "contributi gestione separata 1998 (12,5%)")

# 2. Fasce di rendimento e addizionale comunale di Roma (esente fino a 14.000 euro)
tetto = m.PARAMS["tetto_pensionabile"][2026]
vicino(m.Caso._rendimento(tetto, "A"), tetto * 0.02, "rendimento al tetto")
vicino(m.Caso._rendimento(2 * tetto, "B"), tetto * (0.02 + 0.33 * 0.016 + 0.33 * 0.0135 + 0.24 * 0.011 + 0.10 * 0.009), "rendimento B a due volte il tetto")
vicino(m.netto_annuo(13000), 13000 - m.irpef(13000) - m.add_lazio(13000), "nessuna addizionale comunale fino a 14.000")
vicino(m.netto_annuo(19500), 19500 - m.irpef(19500) - m.add_lazio(19500) - 19500 * 0.009, "addizionale comunale oltre 14.000")

# 3. Part-time prima del 1996: l'anzianità delle quote A e B si misura in settimane utili al calcolo
pieno = m.calcola(caso("1958-03-01", "M", anni(1975, 2014, imponibile=20000), continua=False))
pt = m.calcola(caso("1958-03-01", "M", anni(1975, 1999, imponibile=20000) + anni(2000, 2009, imponibile=10000, settimane_calcolo=26) + anni(2010, 2014, imponibile=20000), continua=False))
qr_pieno = canale(pieno, "Pensione di vecchiaia")["importo"]["quota_retributiva_annua"]
qr_pt = canale(pt, "Pensione di vecchiaia")["importo"]["quota_retributiva_annua"]
assert qr_pt < qr_pieno, f"il part-time non può rendere più del tempo pieno ({qr_pt} contro {qr_pieno})"

# 4. Settimane senza retribuzione nello stesso anno: non abbassano la media (valgono quanto le altre settimane dell'anno)
c = m.Caso(caso("1960-01-01", "M", [{"anno": 1990, "gestione": "FPLD", "settimane": 52, "figurative": 26, "imponibile": 15000, "settimane_retribuite": 26}], continua=False))
sett, imp = c._serie_retribuzioni(date(2027, 2, 1))["FPLD"][1990]
vicino(imp / sett, 15000 / 26, "media settimanale dell'anno misto")

# 5. Date: chi matura negli ultimi giorni di dicembre non slitta all'anno dopo
for giorno in (20, 24, 28, 31):
    r = m.calcola(caso(f"1959-12-{giorno}", "M", anni(1985, 2025) + [{"anno": 2026, "gestione": "FPLD", "settimane": 45, "figurative": 0, "imponibile": 26000}]))
    uguale(canale(r, "Pensione di vecchiaia")["data_maturazione"], f"2026-12-{giorno}", f"vecchiaia a 67 anni, nato il {giorno}/12/1959")

# 6. Madri nel contributivo: 4 mesi per figlio, massimo 12 (16 con quattro o più figli)
base = anni(2000, 2025, imponibile=34000) + [{"anno": 2026, "gestione": "FPLD", "settimane": 45, "figurative": 0, "imponibile": 29000}]
attese = {0: "2042-07-12", 1: "2042-03-12", 2: "2041-11-12", 3: "2041-07-12", 4: "2041-03-12"}
for figli, attesa in attese.items():
    r = m.calcola(caso("1975-04-12", "F", base, figli=figli, imponibile=34000))
    uguale(canale(r, "Pensione di vecchiaia")["data_maturazione"], attesa, f"vecchiaia contributiva con {figli} figli")

# 7. Anticipata contributiva: soglia 3,2 volte l'assegno sociale dal 2030; tetto di 5 volte il minimo fino alla vecchiaia
r = m.calcola(caso("1975-04-12", "F", base, imponibile=34000))
ac = canale(r, "Pensione anticipata contributiva")
if ac.get("decorrenza"):
    vicino(ac["soglia_mensile"], 3.2 * 546.24, "soglia dal 2030 per una donna senza figli")
ricco = anni(1996, 2025, imponibile=95000) + [{"anno": 2026, "gestione": "FPLD", "settimane": 45, "figurative": 0, "imponibile": 82000}]
r = m.calcola(caso("1962-06-01", "M", ricco, imponibile=95000))
ac = canale(r, "Pensione anticipata contributiva")
vicino(ac["importo"]["lordo_mensile_13"], 5 * 611.85, "tetto di 5 volte il trattamento minimo")
assert ac["importo"]["lordo_mensile_pieno_dalla_vecchiaia"] > 5 * 611.85

# 8. Anticipata ordinaria: servono 35 anni senza contare disoccupazione e malattia
storia = anni(1984, 2017) + [{"anno": y, "gestione": "FPLD", "settimane": 52, "figurative": 52, "figurative_dm": 52, "imponibile": 15000} for y in range(2018, 2027)]
r = m.calcola(caso("1964-02-01", "M", storia, continua=False))
assert not canale(r, "Pensione anticipata ordinaria").get("decorrenza"), "34 anni di lavoro + 9 di disoccupazione non bastano per l'anticipata"

# 9. Anno in corso già pieno: la proiezione non lo conta due volte
c = m.Caso(caso("1966-01-01", "M", anni(1986, 2026)))
vicino(c.tot_weeks(date(2026, 12, 31)), 41 * 52, "settimane a fine anno")
vicino(c.contributi_anno(2026, date(2027, 6, 1)), 9900.0, "contributi dell'anno in corso")

# 10. Precoci: non spetta a chi non ha contributi prima del 1996; scadenza corretta nella nota
r = m.calcola(caso("1980-01-01", "M", anni(1997, 2026), condizioni={"precoce": True, "categoria_precoci": "gravoso"}))
assert "non spetta" in canale(r, "Quota 41")["stato"]
r = m.calcola(caso("1964-03-01", "M", anni(1981, 2026), condizioni={"precoce": True, "categoria_precoci": "gravoso", "gravoso_7su10": True}))
assert any("31 marzo" in n for n in canale(r, "Quota 41")["note"])

# ---- preparazione dei dati
uguale(e.numero(28500.5), 28500.5, "numero già numerico")
uguale(e.numero("1.641,47"), 1641.47, "numero all'italiana")
uguale(e.numero("1641.47"), 1641.47, "numero con punto decimale")
uguale(e.numero("€ 25.000"), 25000.0, "migliaia senza decimali")
uguale(e.numero("abc"), None, "testo non numerico")
assert not e.data_valida("1966-02-31") and e.data_valida("1966-02-28")


def periodo(dal, al, tipo, unita, diritto, calcolo="", importo="", nota=""):
    return {"dal": dal, "al": al, "gestione": "Regime generale", "tipo": tipo, "unita": unita, "contributi_diritto": diritto, "contributi_calcolo": calcolo, "importo": importo, "azienda": "", "nota": nota}


def per_anno(periodi, legenda=()):
    contributi, dubbi, _ = e.righe_in_contributi({"periodi": periodi, "legenda_note": list(legenda)})
    return {(c["anno"], c["gestione"]): c for c in contributi}, dubbi


# dodici righe da un mese fanno 52 settimane, non 48
mesi = [periodo(f"2005-{k:02d}-01", f"2005-{k:02d}-28", "Collaborazione coordinata", "mesi", "1", "1,000", "1.000,00") for k in range(1, 13)]
uguale(per_anno(mesi)[0][(2005, "GS")]["settimane"], 52, "dodici mesi")
# un periodo a cavallo d'anno si divide tra i due anni
agg, _ = per_anno([periodo("1990-07-01", "1991-06-30", "Servizio militare", "settimane", "52", "52,000")])
uguale((agg[(1990, "FPLD")]["settimane"], agg[(1991, "FPLD")]["settimane"]), (26, 26), "militare a cavallo d'anno")
# figurativi senza importo nello stesso anno: settimane retribuite distinte
agg, _ = per_anno([periodo("2015-01-01", "2015-06-30", "Lavoro dipendente", "settimane", "26", "26,000", "15.000,00"),
                   periodo("2015-07-01", "2015-12-31", "Malattia", "settimane", "26", "26,000")])
uguale((agg[(2015, "FPLD")]["settimane"], agg[(2015, "FPLD")]["settimane_retribuite"], agg[(2015, "FPLD")]["figurative_dm"]), (52, 26, 26), "anno misto lavoro e malattia")
# la nota "non utile" dell'estratto esclude le settimane dai 35 anni
agg, _ = per_anno([periodo("2023-01-01", "2023-12-31", "Contr.Figurativa", "settimane", "52", "52,000", "20.000,00", "O")], [{"codice": "O", "testo": "Contribuzione non utile per il diritto alla pensione di anzianita'."}])
uguale(agg[(2023, "FPLD")]["figurative_dm"], 52, "nota 'non utile'")
# gestioni
for tipo, attesa in (("Titolare di impresa COM.", "COMMERCIANTI"), ("Collaboratore di impresa ART.", "ARTIGIANI"), ("Lavoro dipendente settore commercio", "FPLD"),
                     ("Rendita vitalizia art. 13 L.1338/62", None), ("Gestione dipendenti pubblici", "PUBBLICO"), ("Stato estero convenzionato", None)):
    uguale(x.codice_gestione(tipo), attesa, tipo)
agg, _ = per_anno([{**periodo("2001-01-01", "2001-12-31", "Lavoro dipendente", "settimane", "52", "52,000", "20.000,00"), "gestione": "Gestione Dipendenti Pubblici"}])
assert (2001, "PUBBLICO") in agg, "la sezione dei dipendenti pubblici prevale sul tipo"

# buco tra l'estratto e oggi: chi lavora riceve le settimane stimate, e il ritmo recente non è sempre 52 settimane
risposte = {"nome": "Prova", "cognome": "Prova", "nascita": "1968-05-20", "sesso": "M", "situazione": "privato", "continua": "pensione", "figli": "0"}
letto = {"periodi": [periodo(f"{y}-01-01", f"{y}-12-31", "Lavoro dipendente", "settimane", "52", "52,000", "30.000,00") for y in range(1985, 2026)]}
contributi, dubbi, primo = e.righe_in_contributi(letto)
base = e.costruisci_input(risposte, letto, contributi, dubbi, primo, OGGI)
aggiunte = [c for c in base["contributi"] if c.get("stimata")]
uguale((len(aggiunte), aggiunte[0]["anno"], aggiunte[0]["settimane"]), (1, 2026, 45), "settimane stimate dal 1/1/2026 a oggi")
assert any("L'estratto si ferma al 31/12/2025" in d for d in base["dubbi"])
stagionale = {"periodi": [periodo(f"{y}-04-01", f"{y}-09-30", "Lavoro dipendente", "settimane", "26", "26,000", "11.000,00") for y in range(1998, 2027)]}
contributi, dubbi, primo = e.righe_in_contributi(stagionale)
base = e.costruisci_input(risposte, stagionale, contributi, dubbi, primo, OGGI)
uguale((base["proiezione"]["settimane_annue"], base["proiezione"]["imponibile_annuo"]), (26, 11000.0), "ritmo e retribuzione dello stagionale")
# part-time in corso: anche le settimane future contano ridotte per l'importo
pt = {"periodi": [periodo(f"{y}-01-01", f"{y}-12-31", "Lav.dipend. part-time", "settimane", "52", "26,000", "15.000,00") for y in range(2010, 2026)]}
contributi, dubbi, primo = e.righe_in_contributi(pt)
uguale(e.costruisci_input(risposte, pt, contributi, dubbi, primo, OGGI)["proiezione"]["rapporto_calcolo"], 0.5, "rapporto calcolo/diritto del part-time")

# ---- lettura dell'estratto: righe anomale non si perdono in silenzio
INTESTAZIONE = [(0, 203.0, 100.0, "Tipo di contribuzione"), (0, 628.3, 100.0, "Azienda"), (0, 770.2, 100.0, "Note"), (0, 221.0, 20.0, "Estratto Conto Previdenziale")]


def riga(y, *celle):
    return [(0, cx, y, t) for cx, t in zip((56.1, 112.2, 162.3, 338.8, 390.0, 430.6, 491.7, 573.8, 775.7), celle) if t]


letto = x.leggi_celle(INTESTAZIONE + riga(130, "01/01/2000", "31/12/2000", "Lavoro dipendente", "sett.", "52", "52,000", "22.155,00", "SRL ESEMPIO"), 1)
assert letto["completo"] and letto["periodi"][0]["importo"] == "22.155,00"
# un asterisco prima delle date: la riga non è riconosciuta, quindi la lettura non è "completa"
letto = x.leggi_celle(INTESTAZIONE + riga(130, "01/01/2000", "31/12/2000", "Lavoro dipendente", "sett.", "52", "52,000", "22.155,00")
                      + [(0, 40.0, 144.6, "*")] + riga(144.6, "01/01/2001", "31/12/2001", "Lavoro dipendente", "sett.", "52", "52,000", "23.000,00"), 1)
assert not letto["completo"], "una riga con un segno davanti alle date deve mandare alla lettura di controllo"
# importo sotto 1.000 euro con la cella "al calcolo" vuota: resta un importo, non diventa settimane
letto = x.leggi_celle(INTESTAZIONE + riga(130, "01/01/2000", "31/01/2000", "Lavoro dipendente", "sett.", "4", "", "850,00"), 1)
uguale((letto["periodi"][0]["contributi_calcolo"], letto["periodi"][0]["importo"]), ("", "850,00"), "importo senza settimane al calcolo")
# importo senza punto delle migliaia
letto = x.leggi_celle(INTESTAZIONE + riga(130, "01/01/2000", "31/12/2000", "Lavoro dipendente", "sett.", "52", "52,000", "22155,00"), 1)
uguale(letto["periodi"][0]["importo"], "22155,00", "importo senza punto delle migliaia")
# data inesistente
letto = x.leggi_celle(INTESTAZIONE + riga(130, "01/02/2000", "31/02/2000", "Lavoro dipendente", "sett.", "4", "4,000", "1.000,00"), 1)
assert not letto["completo"], "una data inesistente non deve passare"
# seconda sezione dopo le note della prima
celle = (INTESTAZIONE + [(0, 283.8, 60.0, "Regime generale")] + riga(130, "01/01/2000", "31/12/2000", "Lavoro dipendente", "sett.", "52", "52,000", "22.155,00")
         + [(0, 50.0, 170.0, "Note:"), (0, 50.0, 184.6, "0) Contributi accreditati in base ai versamenti."), (0, 283.8, 220.0, "Gestione separata")]
         + [(0, 203.0, 250.0, "Tipo di contribuzione"), (0, 628.3, 250.0, "Azienda"), (0, 770.2, 250.0, "Note")]
         + riga(280, "01/01/2010", "31/12/2010", "Professionista", "mesi", "12", "12,000", "18.000,00"))
letto = x.leggi_celle(celle, 1)
uguale([p["gestione"] for p in letto["periodi"]], ["Regime generale", "Gestione separata"], "sezioni")
uguale(len(letto["legenda_note"]), 1, "la legenda non ingloba il titolo della sezione successiva")

print("OK: regole verificate")

# ---- retribuzione futura indicata dal cliente e nota sull'estratto non aggiornato
contributi, dubbi, primo = e.righe_in_contributi(letto_base := {"periodi": [periodo(f"{y}-01-01", f"{y}-12-31", "Lavoro dipendente", "settimane", "52", "52,000", "30.000,00") for y in range(1990, 2024)]})
fermo = e.costruisci_input({**risposte, "crescita": "nonso"}, letto_base, contributi, dubbi, primo, OGGI)
cresce = e.costruisci_input({**risposte, "crescita": "molto"}, letto_base, contributi, dubbi, primo, OGGI)
uguale((fermo["proiezione"]["crescita_imponibile"], cresce["proiezione"]["crescita_imponibile"]), (0.0, 0.02), "crescita della retribuzione dal questionario")
imp_fermo = canale(m.calcola(fermo), "Pensione di vecchiaia")["importo"]["lordo_mensile_13"]
imp_cresce = canale(m.calcola(cresce), "Pensione di vecchiaia")["importo"]["lordo_mensile_13"]
assert imp_cresce > imp_fermo, "con la retribuzione che cresce l'importo deve salire"
# estratto fermo a fine 2023 (quasi tre anni): si stima comunque, e lo si dichiara
uguale(fermo["contributi_stimati"]["dal"], "2024-01-01", "inizio del periodo stimato")
assert fermo["contributi_stimati"]["settimane"] >= 52 + 52 + 44 and any("dipendono anche da questa proiezione" in d for d in fermo["dubbi"])
print("OK: retribuzione futura e proiezione dall'estratto")

# ---- mansione gravosa: vale solo con 7 anni su 10 prima della pensione (caso del 12/11/2026)
import copy
from alternative import alternativa
grav = {"assistito": {"nascita": "1969-11-14", "sesso": "M", "figli": 0}, "data_calcolo": "2026-11-12", "gestione_principale": "FPLD",
        "primo_accredito": "1986-01-01",
        "contributi": [{"anno": y, "gestione": "FPLD", "settimane": 52 if y < 2026 else 46, "figurative": 0, "imponibile": 25000} for y in range(1986, 2027)],
        "proiezione": {"continua_lavoro": True, "settimane_annue": 52, "imponibile_annuo": 28000, "fino_a": None, "gestione": "FPLD"},
        "condizioni": {"gravoso_7su10": True, "precoce": True, "categoria_precoci": "gravoso"}}
lavora = m.calcola(grav)
ferma_in = copy.deepcopy(grav); ferma_in["proiezione"]["continua_lavoro"] = False
ferma = m.calcola(ferma_in)
uguale(canale(lavora, "Pensione di vecchiaia")["eta_alla_decorrenza"][:3], "66a", "vecchiaia gravosi lavorando")
assert canale(ferma, "Pensione di vecchiaia")["decorrenza"] > canale(lavora, "Pensione di vecchiaia")["decorrenza"], "smettendo ora si perde la vecchiaia agevolata dei gravosi"
assert not canale(ferma, "Quota 41 precoci (gravoso)").get("decorrenza"), "smettendo ora si perde Quota 41"
riga = alternativa({"esito": ferma, "ipotesi": ferma_in["proiezione"]}, lavora, "2026-11-12")
assert "situazione attuale" in riga["confronto"] and "senza stipendio" in riga["confronto"], riga
fino_in = copy.deepcopy(grav); fino_in["proiezione"]["fino_a"] = "2029-05-31"
riga = alternativa({"esito": m.calcola(fino_in), "ipotesi": fino_in["proiezione"]}, lavora, "2026-11-12")
uguale((riga["canale"], riga["decorrenza"]), ("Pensione anticipata ordinaria", "2029-06-01"), "lavorando fino a maggio 2029 l'uscita mostrata è l'anticipata")
print("OK: mansione gravosa e confronto delle alternative")
