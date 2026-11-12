#!/usr/bin/env python3
"""
Motore conteggi pensionistici - Centro Pratiche Flaiano (Patronato ENASC 102)
Deterministico: stesso input JSON + stessa versione parametri = stesso output.
Uso:  python3 conteggi_pensione.py input.json  [--md report.md] [--json out.json]
"""
import json, sys, hashlib, argparse
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

# =====================================================================
# PARAMETRI NORMATIVI  (aggiornare SOLO qui, con fonte e data)
# =====================================================================
PARAMS = {
  "versione": "2026-11-11",
  "fonti": [
    "L. 199/2025 (Bilancio 2026); INPS circ. 28/2026 e msg 558/2026 (speranza di vita 2027-2028)",
    "INPS circ. 41/2026; L. 213/2023 c.162 (finestre CPDEL/CPS/CPI/CPUG)",
    "DD Min. Lavoro-MEF 16/10/2026 (coefficienti trasformazione 2027-2028); DD 20/11/2024 (2025-2026)",
    "INPS msg 707/2026 (rivalutazione montanti, decorrenze 2026); nota ISTAT/Min. Lavoro 21/10/2026 (tasso 2026 = 6,3359%)",
    "Quota retributiva: D.Lgs. 503/1992 (quote A e B); INPS msg 707/2026 all. 1-2 (coefficienti di rivalutazione delle retribuzioni); INPS circ. 6/2026 (tetto pensionabile 56.224 euro)",
    "DDL Bilancio 2027 A.C. 3174 art. 51 (APE sociale 2027: 63a6m) - NON ancora legge",
  ],
  # requisiti per ANNO DI MATURAZIONE: (anni, mesi). Anni >2028 = 2028 'salvo adeguamenti' (provvisorio)
  "vecchiaia_eta":          {2026:(67,0), 2027:(67,1), 2028:(67,3)},
  "vecchiaia_contrib_eta":  {2026:(71,0), 2027:(71,1), 2028:(71,3)},
  "anticipata_uomini":      {2026:(42,10),2027:(42,11),2028:(43,1)},
  "anticipata_donne":       {2026:(41,10),2027:(41,11),2028:(42,1)},
  "anticip_contrib_eta":    {2026:(64,0), 2027:(64,1), 2028:(64,3)},
  "anticip_contrib_contr":  {2026:(20,0), 2027:(20,1), 2028:(20,3)},
  "precoci":                {2026:(41,0), 2027:(41,1), 2028:(41,3)},
  "invalidi80_uomini":      {2026:(61,0), 2027:(61,1), 2028:(61,3)},   # 2027-28: Camera, Servizio Studi 20/03/2026
  "invalidi80_donne":       {2026:(56,0), 2027:(56,1), 2028:(56,3)},
  "ape_sociale_eta":        {2026:(63,5), 2027:(63,6)},                # 2027 da DDL; dopo 2027 non prevista
  # deroghe (esclusi dall'adeguamento 2027-2028)
  "gravosi_vecchiaia_eta": (66,7), "gravosi_anticipata_u": (42,10), "gravosi_anticipata_d": (41,10),
  "gravosi_precoci": (41,0),
  # finestre (mesi) per anticipata/precoci gestioni esclusive PA per anno di maturazione
  "finestra_pa": {2024:3, 2025:4, 2026:5, 2027:7, 2028:9},   # requisiti maturati entro il 2024: 3 mesi (INPS circ. 78/2024)
  "assegno_sociale": {2026: 546.24},     # mensile; anni successivi = rivalutato con ipotesi (default 2%/anno)
  # soglia dell'anticipata contributiva: 3,0 volte l'assegno sociale, 3,2 dal 1/1/2030 (DL 201/2011 art. 24 c. 11 vigente)
  "soglia_ac": {"base":3.0, "base_dal_2030":3.2, "donna_1_figlio":2.8, "donna_2_figli":2.6},
  # trattamento minimo mensile (INPS circ. 153/2025): l'anticipata contributiva non supera 5 volte il minimo fino all'eta' di vecchiaia
  "trattamento_minimo": {2026: 611.85},
  # massimale contributivo per chi non ha anzianita' al 31/12/1995 (INPS circ. 6/2026)
  "massimale_contributivo": {2026: 122295.00},
  # coefficienti di trasformazione (%) per eta' intera
  "coeff": {
    "2025-2026": {57:4.204,58:4.308,59:4.419,60:4.536,61:4.661,62:4.795,63:4.936,64:5.088,65:5.250,
                  66:5.423,67:5.608,68:5.808,69:6.024,70:6.258,71:6.510},
    "2027-2028": {57:4.153,58:4.254,59:4.361,60:4.475,61:4.596,62:4.725,63:4.863,64:5.009,65:5.166,
                  66:5.334,67:5.514,68:5.707,69:5.914,70:6.139,71:6.382},
  },
  # coefficiente di capitalizzazione da applicare al "montante maturato al 31/12/X"
  "capitalizzazione": {1996:1.055871,1997:1.053597,1998:1.056503,1999:1.051781,2000:1.047781,2001:1.043698,
    2002:1.041614,2003:1.039272,2004:1.040506,2005:1.035386,2006:1.033937,2007:1.034625,2008:1.033201,
    2009:1.017935,2010:1.016165,2011:1.011344,2012:1.001643,2013:1.000000,2014:1.005058,2015:1.004684,
    2016:1.005205,2017:1.013478,2018:1.018254,2019:1.019199,2020:1.000000,2021:1.009756,2022:1.023082,
    2023:1.036622,2024:1.040445,2025:1.063359},
  # Quota retributiva (anzianita' fino al 1995, o al 2011 con 18 anni al 1995): coefficienti di rivalutazione delle
  # retribuzioni e dei redditi per le pensioni con decorrenza 2026 (INPS msg 707/2026, all. 1 = quota A, all. 2 = quota B).
  # Per decorrenze successive si calcola in moneta di oggi con questi stessi coefficienti (come le simulazioni INPS).
  "rival_retribuzioni": {"A": {1970:21.4903,1971:20.4448,1972:19.1884,1973:17.1305,1974:14.6132,1975:12.5205,1976:10.7300,1977:9.1146,1978:8.0943,1979:7.0233,1980:5.9433,1981:5.0208,1982:4.3300,1983:3.7988,1984:3.4205,1985:3.1545,1986:2.9789,1987:2.8249,1988:2.6818,1989:2.5185,1990:2.3499,1991:2.1814,1992:2.0835,1993:1.9984,1994:1.9167,1995:1.8010,1996:1.7223,1997:1.6969,1998:1.6676,1999:1.6421,2000:1.6004,2001:1.5590,2002:1.5214,2003:1.4847,2004:1.4566,2005:1.4323,2006:1.4044,2007:1.3801,2008:1.3373,2009:1.3275,2010:1.3067,2011:1.2727,2012:1.2350,2013:1.2215,2014:1.2189,2015:1.2189,2016:1.2189,2017:1.2057,2018:1.1927,2019:1.1867,2020:1.1867,2021:1.1646,2022:1.0773,2023:1.0221,2024:1.0140,2025:1.0,2026:1.0},
                         "B": {1970:33.2483,1971:31.4608,1972:29.5936,1973:26.6379,1974:22.1548,1975:18.7833,1976:16.0127,1977:13.4676,1978:11.8959,1979:10.2084,1980:8.3689,1981:7.0018,1982:5.9764,1983:5.1610,1984:4.6344,1985:4.2372,1986:3.9650,1987:3.7627,1988:3.5591,1989:3.3141,1990:3.1006,1991:2.8923,1992:2.7234,1993:2.5939,1994:2.4768,1995:2.3330,1996:2.2281,1997:2.1732,1998:2.1182,1999:2.0688,2000:2.0011,2001:1.9334,2002:1.8722,2003:1.8124,2004:1.7626,2005:1.7187,2006:1.6710,2007:1.6289,2008:1.5646,2009:1.5397,2010:1.5031,2011:1.4509,2012:1.3960,2013:1.3681,2014:1.3534,2015:1.3412,2016:1.3290,2017:1.3025,2018:1.2765,2019:1.2584,2020:1.2466,2021:1.2117,2022:1.1105,2023:1.0432,2024:1.0243,2025:1.0,2026:1.0}},
  # Prima fascia di retribuzione pensionabile ("tetto"), INPS circ. 6/2026; oltre il tetto il rendimento scende per fasce
  "tetto_pensionabile": {2026: 56224.00},
  "fasce_rendimento": {"A": [(1.00, 0.02), (1.33, 0.015), (1.66, 0.0125), (None, 0.01)],
                       "B": [(1.00, 0.02), (1.33, 0.016), (1.66, 0.0135), (1.90, 0.011), (None, 0.009)]},
  "gestioni_autonomi": ["ARTIGIANI", "COMMERCIANTI"],
  "aliquota_computo": {"FPLD":0.33,"GS":0.33,"ARTIGIANI":0.24,"COMMERCIANTI":0.24,"CPDEL":0.33,"CPS":0.33,
                       "CPI":0.33,"CPUG":0.33,"CTPS":0.33,"ALTRO":0.33},
  # Aliquote di computo che sono cambiate nel tempo (anno di inizio -> aliquota).
  # Artigiani e commercianti: 20% dal 1996 (L. 335/1995 art. 1 c. 10), poi +1,3 punti nel 2012 e +0,45 l'anno fino al 24% dal 2018
  # (DL 201/2011 art. 24 c. 22; INPS circ. 24/2013 e 27/2018). Gestione separata, iscritti senza altra copertura: INPS circ. 7/2007
  # all. 2, 27/2015, 18/2018 (professionisti con partita IVA e iscritti ad altra forma hanno aliquote piu' basse: non distinti).
  "aliquota_computo_storica": {
    "ARTIGIANI":    {1996:0.20, 2012:0.213, 2013:0.2175, 2014:0.222, 2015:0.2265, 2016:0.231, 2017:0.2355, 2018:0.24},
    "COMMERCIANTI": {1996:0.20, 2012:0.213, 2013:0.2175, 2014:0.222, 2015:0.2265, 2016:0.231, 2017:0.2355, 2018:0.24},
    "GS": {1996:0.10, 1998:0.125, 2000:0.145, 2002:0.155, 2004:0.193, 2005:0.195, 2006:0.197, 2007:0.23, 2008:0.24, 2009:0.25,
           2010:0.26, 2012:0.27, 2014:0.28, 2015:0.30, 2016:0.31, 2017:0.32, 2018:0.33},
  },
  "gestioni_esclusive_pa": ["CPDEL","CPS","CPI","CPUG","CTPS"],
  "finestre_lunghe_pa": ["CPDEL","CPS","CPI","CPUG"],
  # fisco 2026
  "irpef": [(28000,0.23),(50000,0.33),(None,0.43)],
  "add_reg_lazio": "1,73% se reddito <= 28.000; oltre: 1,73% fino a 15.000 + 3,33% sull'eccedenza; -60 euro tra 28.000 e 30.000",
  "add_com_roma": 0.009,
  "add_com_roma_esenzione": 14000,   # esente fino a 14.000 euro di imponibile (delib. A.C. 186/2024; 2026 da riconfermare sull'elenco MEF)
}
SETT_ANNO = 52.0

def req(tab, anno):
    ks = sorted(tab); a = min(max(anno, ks[0]), ks[-1]); return tab[a]

def aliquota_computo(gestione, anno):
    """Aliquota di computo della gestione nell'anno (per autonomi e gestione separata e' cambiata nel tempo)."""
    serie = PARAMS["aliquota_computo_storica"].get(gestione)
    if serie:
        return serie[max((a for a in serie if a <= anno), default=min(serie))]
    return PARAMS["aliquota_computo"].get(gestione, 0.33)

def to_weeks(am): return am[0]*SETT_ANNO + am[1]*SETT_ANNO/12

def fmt_am(w):
    tot_m = int(round(w*12/SETT_ANNO)); return f"{tot_m//12}a {tot_m%12}m"

def d(s): return date.fromisoformat(s) if isinstance(s, str) else s

def eta_at(nascita, dt):
    r = relativedelta(dt, nascita); return r.years, r.months

def eta_raggiunta(nascita, am):
    return nascita + relativedelta(years=am[0], months=am[1])

# =====================================================================
class Caso:
    def __init__(self, inp):
        self.inp = inp
        a = inp["assistito"]
        self.nascita = d(a["nascita"]); self.sesso = a["sesso"].upper(); self.figli = int(a.get("figli",0))
        self.oggi = d(inp.get("data_calcolo", date.today().isoformat()))
        self.gestione = inp.get("gestione_principale","FPLD").upper()
        self.pa_esclusiva = self.gestione in PARAMS["gestioni_esclusive_pa"]
        self.cond = inp.get("condizioni", {})
        self.ipo = inp.get("ipotesi", {})
        # Ipotesi in termini reali (moneta di oggi): montante futuro +1,5% l'anno come il PIL ipotizzato dall'INPS, soglie ferme
        self.tasso_fut = float(self.ipo.get("tasso_capitalizzazione_futuro", 0.015))
        self.perequazione = float(self.ipo.get("rivalutazione_assegno_sociale", 0.0))
        self.avvisi = []; self.log = []
        # --- contributi per anno (cap 52 settimane/anno per il diritto) ---
        per_anno = {}
        self.righe = {}   # (anno, gestione) -> settimane al diritto, settimane al calcolo, retribuzione: per la quota retributiva
        for c in inp.get("contributi", []):
            y = int(c["anno"]); g = c.get("gestione", self.gestione).upper()
            s = float(c.get("settimane", 0)); fig = float(c.get("figurative", 0))
            if "contributi_versati" in c: contr = float(c["contributi_versati"])
            else: contr = float(c.get("imponibile",0)) * float(c.get("aliquota_computo", aliquota_computo(g, y)))
            e = per_anno.setdefault(y, {"sett":0.0,"fig":0.0,"dm":0.0,"contr":0.0})
            e["sett"] += s; e["fig"] += fig; e["contr"] += contr
            e["dm"] += float(c.get("figurative_dm", 0))   # disoccupazione e malattia: non valgono per i 35 anni dell'anticipata
            r = self.righe.setdefault((y, g), {"sett":0.0,"calc":0.0,"retr":0.0,"imp":0.0})
            calc = float(c.get("settimane_calcolo", s)); imp = float(c.get("imponibile",0))
            r["sett"] += s; r["calc"] += calc; r["imp"] += imp
            r["retr"] += float(c.get("settimane_retribuite", calc if imp > 0 else 0))   # settimane che hanno una retribuzione
        for y, e in per_anno.items():
            if e["sett"] > SETT_ANNO + 0.01:
                self.avvisi.append(f"Anno {y}: {e['sett']:.0f} settimane > 52 (sovrapposizione): per il diritto conto 52.")
                # nelle sovrapposizioni si tolgono prima le settimane figurative, poi quelle effettive
                e["fig"] = max(0.0, e["fig"] - (e["sett"] - SETT_ANNO)); e["dm"] = min(e["dm"], e["fig"]); e["sett"] = SETT_ANNO
        self.anni = per_anno
        self.primo_accredito = d(inp["primo_accredito"]) if inp.get("primo_accredito") else (date(min(per_anno),1,1) if per_anno else self.oggi)
        p = inp.get("proiezione", {})
        self.continua = bool(p.get("continua_lavoro", False))
        self.sett_annue = float(p.get("settimane_annue", 52))
        self.imp_fut = float(p.get("imponibile_annuo", 0))
        self.gest_fut = str(p.get("gestione", self.gestione)).upper()   # gestione in cui si verseranno i contributi futuri
        self.aliq_fut = float(p.get("aliquota_computo", aliquota_computo(self.gest_fut, self.oggi.year)))
        self.rapporto_calcolo = float(p.get("rapporto_calcolo", 1.0))   # part-time: settimane utili al calcolo / al diritto
        self.cresc = float(p.get("crescita_imponibile", 0.0))
        self.fine_lavoro = d(p["fino_a"]) if p.get("fino_a") else None
        self.volontari = float(p.get("settimane_volontari_annue", 0))  # es. prosecuzione volontaria
        # sistema di calcolo
        self.w1995 = sum(e["sett"] for y,e in per_anno.items() if y <= 1995)
        if self.primo_accredito >= date(1996,1,1): self.sistema = "contributivo puro"
        elif self.w1995 >= 18*SETT_ANNO: self.sistema = "retributivo fino al 2011 + contributivo dal 2012"
        else: self.sistema = "misto (retributivo fino al 1995)"
        self.opzione_contributivo = bool(inp.get("opzione_contributivo", False))
        self.puro = self.sistema == "contributivo puro" or self.opzione_contributivo
        self.massimale = PARAMS["massimale_contributivo"][max(PARAMS["massimale_contributivo"])] if self.sistema == "contributivo puro" else None
        if self.massimale:
            self.imp_fut = min(self.imp_fut, self.massimale)
            alti = [y for (y, g), e in self.righe.items() if e["imp"] > 100000]
            if alti: self.avvisi.append(f"Retribuzioni oltre 100.000 euro negli anni {min(alti)}-{max(alti)}: per chi ha iniziato dal 1996 la parte oltre il massimale contributivo non conta; verifica da fare a mano.")
        if self.opzione_contributivo:
            ok = self.w1995 < 18*SETT_ANNO and self.tot_weeks(self.oggi) >= 15*SETT_ANNO and \
                 sum(e["sett"] for y,e in per_anno.items() if y >= 1996) >= 5*SETT_ANNO
            if not ok: self.avvisi.append("Opzione contributivo richiesta ma requisiti (art.1 c.23 L.335/95) non verificati: <18 anni al 1995, >=15 anni totali, >=5 dopo il 1995.")

    # settimane accreditate alla data dt (distribuite uniformemente nell'anno)
    def _acc(self, dt, effettive=False, campo=None):
        tot = 0.0
        for y, e in self.anni.items():
            w = e[campo] if campo else e["sett"] - (e["fig"] if effettive else 0)
            start = date(y,1,1); end = min(date(y,12,31), self.oggi) if y == self.oggi.year else date(y,12,31)
            if y > self.oggi.year: continue
            if dt >= end: tot += w
            elif dt > start:
                span = (end - start).days or 1; tot += w * (dt - start).days / span
        return tot

    def _libere_anno_corrente(self):
        """Settimane ancora accreditabili nell'anno in corso (l'anno non supera 52 settimane)."""
        return max(0.0, SETT_ANNO - self.anni.get(self.oggi.year, {"sett": 0.0})["sett"])

    def _proj(self, dt):
        if dt <= self.oggi: return 0.0
        w = 0.0
        if self.continua:
            fine = min(dt, self.fine_lavoro) if self.fine_lavoro else dt
            if fine > self.oggi:
                fine_anno = min(fine, date(self.oggi.year, 12, 31))
                w += min((fine_anno - self.oggi).days * self.sett_annue / 365.25, self._libere_anno_corrente())
                if fine > fine_anno: w += (fine - fine_anno).days * self.sett_annue / 365.25
        if self.volontari:
            w += (dt - self.oggi).days * self.volontari / 365.25
        # cap 52/anno
        return min(w, (dt - self.oggi).days * SETT_ANNO / 365.25)

    def tot_weeks(self, dt): return self._acc(dt) + self._proj(dt)
    def eff_weeks(self, dt): return self._acc(dt, True) + self._proj(dt)
    def senza_dis_mal(self, dt): return self.tot_weeks(dt) - self._acc(dt, campo="dm")   # per i 35 anni dell'anticipata

    # ------------------- importo -------------------
    def contributi_anno(self, y, decorrenza):
        """contributi utili al montante nell'anno y (storici + proiettati fino a decorrenza)"""
        c = 0.0
        if y in self.anni and y <= self.oggi.year: c += self.anni[y]["contr"]
        if (self.continua and self.imp_fut > 0):
            ini = max(date(y,1,1), self.oggi + timedelta(days=1))
            fin = min(date(y,12,31), decorrenza - timedelta(days=1))
            if self.fine_lavoro: fin = min(fin, self.fine_lavoro)
            if fin >= ini:
                frac = ((fin - ini).days + 1) / 365.25
                if y == self.oggi.year and self.sett_annue > 0:   # anno in corso gia' (quasi) pieno: niente doppio conteggio
                    frac = min(frac, self._libere_anno_corrente() / self.sett_annue)
                imp = self.imp_fut * ((1+self.cresc) ** max(0, y - self.oggi.year))
                c += imp * self.aliq_fut * frac
        return c

    def montante(self, decorrenza):
        D = decorrenza.year
        anno_inizio = 1996 if (self.sistema.startswith("misto") or self.opzione_contributivo or self.puro) else 2012
        if self.opzione_contributivo: anno_inizio = min(self.anni) if self.anni else 1996
        M = 0.0; stime = False
        for y in range(anno_inizio, D+1):
            M_contrib = self.contributi_anno(y, decorrenza)
            M += M_contrib
            if y <= D - 2:
                if y in PARAMS["capitalizzazione"]: M *= PARAMS["capitalizzazione"][y]
                else: M *= (1 + self.tasso_fut); stime = True
        return M, stime

    def coeff_trasf(self, decorrenza):
        y = decorrenza.year
        tab_key = "2025-2026" if y <= 2026 else "2027-2028"
        tab = PARAMS["coeff"][tab_key]
        a, m = eta_at(self.nascita, decorrenza)
        if a < 57: a, m = 57, 0
        if a >= 71: return tab[71], tab_key
        c = tab[a] + (tab[a+1] - tab[a]) * m / 12
        return c, tab_key

    # ------------------- quota retributiva dalle retribuzioni dell'estratto -------------------
    def _serie_retribuzioni(self, decorrenza):
        """Per gestione: anno -> [settimane utili al calcolo, retribuzione], storiche e proiettate fino alla decorrenza."""
        serie = {}
        for (y, g), e in self.righe.items():
            if y > self.oggi.year: continue
            # Le settimane accreditate senza retribuzione (es. figurativi senza importo) valgono quanto la media
            # delle altre settimane dello stesso anno (L. 155/1981 art. 8); un anno tutto senza retribuzione resta fuori dalla media.
            imp = e["imp"] * e["calc"] / e["retr"] if 0 < e["retr"] < e["calc"] else (e["imp"] if e["retr"] > 0 else 0.0)
            serie.setdefault(g, {})[y] = [e["calc"], imp]
        if self.continua and self.imp_fut > 0:
            for y in range(self.oggi.year, decorrenza.year + 1):
                ini = max(date(y,1,1), self.oggi + timedelta(days=1))
                fin = min(date(y,12,31), decorrenza - timedelta(days=1))
                if self.fine_lavoro: fin = min(fin, self.fine_lavoro)
                if fin < ini: continue
                frac = ((fin - ini).days + 1) / 365.25
                v = serie.setdefault(self.gest_fut, {}).setdefault(y, [0.0, 0.0])
                nuove = self.sett_annue * self.rapporto_calcolo * frac
                parte = min(1.0, max(0.0, SETT_ANNO - v[0]) / nuove) if nuove > 0 else 0.0   # l'anno non supera 52 settimane
                v[0] += nuove * parte
                v[1] += self.imp_fut * ((1+self.cresc) ** max(0, y - self.oggi.year)) * frac * parte
        return serie

    @staticmethod
    def _media_settimanale(anni, quante, tipo, dal=None, fino=None):
        """Retribuzione media settimanale rivalutata sulle ultime `quante` settimane (None = tutte) degli anni tra `dal` e `fino`.
        Le settimane senza retribuzione (es. servizio militare) non entrano nella media. Restituisce (media, settimane usate)."""
        coeff = PARAMS["rival_retribuzioni"][tipo]
        presi, somma = 0.0, 0.0
        for y in sorted(anni, reverse=True):
            if (fino is not None and y > fino) or (dal is not None and y < dal): continue
            w, imp = anni[y]
            if w <= 0 or imp <= 0: continue
            k = coeff.get(y, 1.0 if y > max(coeff) else coeff[min(coeff)])
            if quante is not None and presi + w > quante:
                parte = (quante - presi) / w
                somma += imp * k * parte; presi = quante; break
            somma += imp * k; presi += w
        return (somma / presi if presi else None), presi

    @staticmethod
    def _rendimento(retribuzione_annua, tipo):
        """Pensione annua per ogni anno di anzianita': 2% fino al tetto, poi aliquote ridotte per fasce."""
        tetto = PARAMS["tetto_pensionabile"][max(PARAMS["tetto_pensionabile"])]
        resa, sotto = 0.0, 0.0
        for limite, aliquota in PARAMS["fasce_rendimento"][tipo]:
            sopra = retribuzione_annua if limite is None else min(retribuzione_annua, tetto * limite)
            if sopra > sotto: resa += (sopra - sotto) * aliquota
            sotto = max(sotto, sopra)
        return resa

    @staticmethod
    def _eur(x):
        return f"{x:,.0f}".replace(",", ".")

    def quota_retributiva_calcolata(self, decorrenza, tutto_retributivo=False):
        """Quote A e B calcolate con le regole INPS dalle retribuzioni dell'estratto, gestione per gestione.
        L'anzianita' si misura in settimane utili al calcolo (il part-time conta in proporzione all'orario).
        Con `tutto_retributivo` la quota B arriva fino alla decorrenza e non c'e' il limite dei 40 anni: serve al
        confronto di legge per chi aveva 18 anni di contributi al 1995 (L. 190/2014 c. 707).
        Restituisce (quota annua, note, settimane non coperte) oppure None se mancano le retribuzioni."""
        taglio = decorrenza.year if tutto_retributivo else (1995 if self.sistema.startswith("misto") else 2011)
        serie = self._serie_retribuzioni(decorrenza)
        anz92 = sum(e["sett"] for y, e in self.anni.items() if y <= 1992)
        tot = sum(e["sett"] for y, e in self.anni.items() if y <= taglio)   # gia' limitato a 52 settimane l'anno
        if tot <= 0: return None
        riduzione = 1.0 if tutto_retributivo else min(1.0, 40 * SETT_ANNO / tot)   # l'anzianita' utile non supera 40 anni
        quota, note, scoperte = 0.0, [], 0.0
        senza_media, rif, peso_rif = [], None, 0.0
        for g in sorted(serie):
            anni = serie[g]
            cA = sum(v[0] for y, v in anni.items() if y <= 1992)
            cB = sum(v[0] for y, v in anni.items() if 1993 <= y <= taglio)
            if cA + cB <= 0: continue
            autonomi = g in PARAMS["gestioni_autonomi"]
            if g != "FPLD" and not autonomi:
                scoperte += cA + cB; continue
            nA, nB = (520, 780) if autonomi else (260, 520)
            mA, usateA = self._media_settimanale(anni, nA, "A")
            if anz92 >= 15 * SETT_ANNO:
                mB, usateB = self._media_settimanale(anni, nB, "B")
                periodoB = f"ultime {usateB:.0f} settimane"
            else:
                # meno di 15 anni al 1992: tutte le retribuzioni dal 1993 alla decorrenza piu' le ultime nA settimane precedenti
                dopo, w1 = self._media_settimanale(anni, None, "B", dal=1993)
                prima, w0 = self._media_settimanale(anni, nA, "B", fino=1992)
                usateB = w1 + w0
                mB = ((dopo or 0) * w1 + (prima or 0) * w0) / usateB if usateB else None
                periodoB = f"retribuzioni dal 1993 alla decorrenza e {w0:.0f} settimane precedenti"
            if (cA and mA is None) or (cB and mB is None):
                senza_media.append((g, cA, cB)); continue
            if cA + cB > peso_rif: rif, peso_rif = (g, mA, mB, usateA, periodoB), cA + cB
            qA = self._rendimento(mA * SETT_ANNO, "A") * cA / SETT_ANNO * riduzione if cA else 0.0
            qB = self._rendimento(mB * SETT_ANNO, "B") * cB / SETT_ANNO * riduzione if cB else 0.0
            quota += qA + qB
            if cA: note.append(f"Quota A {g}: {cA:.0f} settimane fino al 1992 x retribuzione media rivalutata {self._eur(mA*SETT_ANNO)} euro/anno (ultime {usateA:.0f} settimane) = {self._eur(qA)} euro/anno.")
            if cB: note.append(f"Quota B {g}: {cB:.0f} settimane dal 1993 al {taglio} x retribuzione media rivalutata {self._eur(mB*SETT_ANNO)} euro/anno ({periodoB}) = {self._eur(qB)} euro/anno.")
        # Periodi accreditati in una gestione senza retribuzioni proprie (es. servizio militare di chi poi ha lavorato solo
        # da autonomo): si valorizzano con le retribuzioni medie della gestione in cui si e' lavorato di piu'.
        for g, cA, cB in senza_media:
            if rif is None or (cA and rif[1] is None) or (cB and rif[2] is None):
                scoperte += cA + cB; continue
            qA = self._rendimento(rif[1] * SETT_ANNO, "A") * cA / SETT_ANNO * riduzione if cA else 0.0
            qB = self._rendimento(rif[2] * SETT_ANNO, "B") * cB / SETT_ANNO * riduzione if cB else 0.0
            quota += qA + qB
            note.append(f"{cA + cB:.0f} settimane senza una retribuzione propria (es. servizio militare) valorizzate con le retribuzioni medie della gestione {rif[0]} = {self._eur(qA + qB)} euro/anno.")
        if not note: return None
        return quota, note, scoperte

    def importo(self, decorrenza, canale_note):
        M, stime = self.montante(decorrenza)
        coeff, tabk = self.coeff_trasf(decorrenza)
        quota_c = M * coeff / 100
        quota_r = None; conf = "media"
        if not self.puro:
            if self.inp.get("quota_retributiva_annua"):
                quota_r = float(self.inp["quota_retributiva_annua"]); conf = "media"
                canale_note.append("Quota retributiva presa dal dato fornito (es. simulazione INPS).")
            elif (calc := self.quota_retributiva_calcolata(decorrenza)) is not None:
                quota_r, note_r, scoperte = calc
                conf = "media"
                if self.sistema.startswith("retributivo") and not scoperte:
                    # Chi aveva 18 anni di contributi al 1995 riceve il minore tra questo calcolo e quello tutto retributivo
                    alt = self.quota_retributiva_calcolata(decorrenza, tutto_retributivo=True)
                    if alt is not None and not alt[2] and alt[0] < quota_c + quota_r:
                        canale_note.append(f"Applicato il limite di legge (L. 190/2014 c. 707): il calcolo interamente retributivo ({self._eur(alt[0])} euro/anno) e' piu' basso della somma di quota retributiva e contributiva ({self._eur(quota_c + quota_r)}), quindi vale il primo.")
                        quota_r, note_r, quota_c = alt[0], alt[1], 0.0
                canale_note.append("Quota retributiva calcolata con le regole INPS (quote A e B) sulle retribuzioni dell'estratto, rivalutate con i coefficienti INPS 2026.")
                canale_note.extend(note_r)
                if scoperte > 0:
                    conf = "bassa"
                    canale_note.append(f"{scoperte:.0f} settimane anteriori al {'1996' if self.sistema.startswith('misto') else '2012'} sono in gestioni o periodi senza retribuzioni leggibili: la loro quota non e' compresa.")
            elif self.inp.get("retribuzione_pensionabile_annua"):
                anni_r = (self.w1995 if self.sistema.startswith("misto") else min(self._acc(date(2011,12,31)), 40*SETT_ANNO)) / SETT_ANNO
                quota_r = 0.02 * min(anni_r, 40) * float(self.inp["retribuzione_pensionabile_annua"])
                conf = "bassa"; canale_note.append(f"Quota retributiva STIMATA: 2% x {anni_r:.1f} anni x retribuzione pensionabile indicata.")
            else:
                conf = "parziale"; canale_note.append("Manca la quota retributiva: importo = SOLO quota contributiva.")
        if y_after := (decorrenza.year >= 2029):
            canale_note.append("Coefficienti 2029+ non ancora pubblicati: uso 2027-2028 (sovrastima probabile).")
        if stime: canale_note.append(f"Per gli anni futuri il montante e' rivalutato dell'{self.tasso_fut*100:.1f}% l'anno in termini reali (ipotesi: e' la crescita del PIL che usa anche l'INPS nelle sue simulazioni).".replace(".", ",", 1))
        if conf == "media" and (stime or decorrenza.year >= 2029): conf = "media-bassa"
        if decorrenza.year > self.oggi.year:
            futuro = (f"le retribuzioni future crescono del {self.cresc*100:.0f}% l'anno oltre l'inflazione, come indicato nel questionario," if self.cresc > 0
                      else "le retribuzioni future sono considerate ferme al valore attuale")
            canale_note.append(f"Importi in moneta di oggi: {futuro} e coefficienti, tetti e soglie sono quelli del 2026.")
        lordo_annuo = quota_c + (quota_r or 0)
        return {"montante": round(M,2), "coeff_trasf_%": round(coeff,4), "tabella_coeff": tabk,
                "quota_contributiva_annua": round(quota_c,2),
                "quota_retributiva_annua": None if quota_r is None else round(quota_r,2),
                "lordo_annuo": round(lordo_annuo,2), "lordo_mensile_13": round(lordo_annuo/13,2),
                "netto_mensile_13_stima": round(netto_annuo(lordo_annuo)/13,2), "affidabilita": conf}

    # ------------------- ricerca data di maturazione -------------------
    def scan(self, ok, start=None, anni_max=45):
        """Prima data in cui `ok` e' vero: passo mensile, poi si raffina al giorno. I requisiti crescono al 1° gennaio,
        quindi a ogni cambio d'anno si prova anche il 31 dicembre, per non saltare chi matura negli ultimi giorni dell'anno."""
        start = start or max(self.primo_accredito, self.nascita + relativedelta(years=40))
        end = self.oggi + relativedelta(years=anni_max)
        prev, dt = None, start
        while dt <= end:
            if prev is not None and prev.year < dt.year and ok(date(prev.year, 12, 31)):
                dt = date(prev.year, 12, 31)
            if ok(dt):
                x = start if prev is None else prev + timedelta(days=1)
                while x < dt:
                    if ok(x): return x
                    x += timedelta(days=1)
                return dt
            prev = dt; dt += timedelta(days=30)
        return None

    def decorrenza(self, mat, finestra_mesi):
        if self.pa_esclusiva:
            return mat + relativedelta(months=finestra_mesi) + timedelta(days=1)
        return (mat.replace(day=1) + relativedelta(months=finestra_mesi + 1))

    def assegno_sociale(self, y):
        t = PARAMS["assegno_sociale"]; ult = max(t)
        if y <= ult: return t[max(y, min(t))]
        return t[ult] * (1 + self.perequazione) ** (y - ult)   # ipotesi di rivalutazione annua

# =====================================================================
def irpef(R):
    imp, prev = 0.0, 0.0
    for lim, al in PARAMS["irpef"]:
        top = R if lim is None else min(R, lim)
        if top > prev: imp += (top - prev) * al
        if lim is None or R <= lim: break
        prev = lim
    if R <= 8500: det = 1955
    elif R <= 28000: det = 700 + 1255 * (28000 - R) / 19500
    elif R <= 50000: det = 700 * (50000 - R) / 22000
    else: det = 0
    if 25000 < R <= 29000: det += 50
    return max(0.0, imp - det)

def add_lazio(R):
    if R <= 28000: return R * 0.0173
    a = 15000*0.0173 + (R-15000)*0.0333
    if R <= 30000: a -= 60
    return a

def netto_annuo(R):
    if R <= 8500: return R
    add_com = 0.0 if R <= PARAMS["add_com_roma_esenzione"] else R*PARAMS["add_com_roma"]
    return R - irpef(R) - add_lazio(R) - add_com

# =====================================================================
def calcola(inp):
    c = Caso(inp); out = []
    sesso_f = c.sesso == "F"
    cond = c.cond
    gravoso_dich = bool(cond.get("gravoso_7su10")); usurante = bool(cond.get("usurante"))
    # La mansione gravosa vale solo se svolta per almeno 7 dei 10 anni prima della pensione: chi smette di lavorare
    # (o lavora fino a una data) la perde se tra la fine del lavoro e l'uscita passano piu' di 3 anni.
    fine_gravoso = None if (c.continua and not c.fine_lavoro) else (c.fine_lavoro if c.continua else c.oggi)
    def gravoso_a(dt):
        return gravoso_dich and (fine_gravoso is None or dt <= fine_gravoso + relativedelta(years=3))
    finestra_lunga = c.gestione in PARAMS["finestre_lunghe_pa"]

    def fin_anticipata(mat):
        if finestra_lunga: return req(PARAMS["finestra_pa"], mat.year)
        return 3

    # Madri nel sistema contributivo: eta' ridotta di 4 mesi per figlio, fino a 12 mesi (16 con 4 o piu' figli) - INPS circ. 53/2025
    mesi_madre = (16 if c.figli >= 4 else min(4*c.figli, 12)) if (sesso_f and c.puro) else 0
    nota_madre = (f"Eta' ridotta di {mesi_madre} mesi per i figli (lavoratrici madri nel sistema contributivo): si chiede con la domanda di pensione "
                  "ed e' alternativa al coefficiente di calcolo piu' favorevole.")
    def eta_req(am): return eta_raggiunta(c.nascita, am) - relativedelta(months=mesi_madre)
    def trentacinque(dt): return c.puro or c.senza_dis_mal(dt) >= 35*SETT_ANNO - 1e-6
    nota_35 = "Servono anche 35 anni di contributi senza contare disoccupazione e malattia: nel conteggio questi periodi sono stati esclusi da tale verifica."
    ha_dm = any(e["dm"] > 0 for e in c.anni.values())

    def add(canale, mat, fin, note, extra=None, importo=True, stato=None):
        r = {"canale": canale, "note": note}
        if mat is None:
            r.update({"stato": stato or "non raggiungibile entro l'orizzonte / requisiti non soddisfatti"}); out.append(r); return r
        dec = c.decorrenza(mat, fin)
        if mat <= c.oggi:
            r["stato"] = "GIA' MATURATO"
            note.append("Diritto gia' maturato (cristallizzato): decorrenza dal 1° del mese successivo alla domanda, a finestra trascorsa.")
            dec = max(dec, (c.oggi.replace(day=1) + relativedelta(months=1)))
        else: r["stato"] = "da maturare"
        a, m = eta_at(c.nascita, dec)
        r.update({"data_maturazione": mat.isoformat(), "finestra_mesi": fin, "decorrenza": dec.isoformat(),
                  "eta_alla_decorrenza": f"{a}a {m}m", "contributi_alla_decorrenza": fmt_am(c.tot_weeks(dec))})
        if mat.year > 2028: note.append("Maturazione dopo il 2028: requisiti 2029+ provvisori (prossimo adeguamento speranza di vita non ancora fissato).")
        if mat > c.oggi and (c.continua or c.volontari): note.append("Data basata sulla proiezione dei contributi futuri: ogni periodo non coperto la sposta in avanti.")
        if c.pa_esclusiva and fin == 0: note.append("Gestione pubblica: decorrenza dal giorno successivo alla cessazione; verificare limiti ordinamentali e collocamento a riposo d'ufficio.")
        if extra: r.update(extra)
        if importo: r["importo"] = c.importo(dec, note)
        out.append(r); return r

    # 1. VECCHIAIA ORDINARIA ------------------------------------------
    note = []
    def ok_vec_ord(dt):
        return dt >= eta_req(req(PARAMS["vecchiaia_eta"], dt.year)) and c.tot_weeks(dt) >= 20*SETT_ANNO - 1e-6
    def ok_vec(dt):
        if gravoso_a(dt) and dt >= eta_raggiunta(c.nascita, PARAMS["gravosi_vecchiaia_eta"]) and c.tot_weeks(dt) >= 30*SETT_ANNO - 1e-6:
            return True
        return ok_vec_ord(dt)
    mat = c.scan(ok_vec)
    agevolata = bool(mat) and gravoso_a(mat) and not ok_vec_ord(mat)
    if mesi_madre and not agevolata: note.append(nota_madre)
    if agevolata: note.append("Requisito agevolato gravosi (66a7m + 30 anni, 7 anni su 10 di attivita' gravosa prima della pensione): VERIFICARE documentazione.")
    elif gravoso_dich and fine_gravoso is not None: note.append("Requisito agevolato gravosi NON applicato: lasciando il lavoro in questa data, prima della pensione non ci sono 7 anni su 10 di attivita' gravosa.")
    r = add("Pensione di vecchiaia", mat, 0, note)
    if mat and c.puro and "importo" in r:
        soglia = c.assegno_sociale(d(r["decorrenza"]).year)
        if r["importo"]["lordo_mensile_13"] < soglia:
            r["note"].append(f"ATTENZIONE: contributivo puro, importo {r['importo']['lordo_mensile_13']} < assegno sociale {soglia}: serve attendere 71 anni (vedi riga dedicata) salvo verifiche.")
            r["stato"] += " - SOGLIA IMPORTO NON RAGGIUNTA"

    # 2. VECCHIAIA CONTRIBUTIVA 71 ANNI (solo puri) ------------------
    if c.puro:
        note = []
        def ok71(dt):
            return dt >= eta_req(req(PARAMS["vecchiaia_contrib_eta"], dt.year)) and c.eff_weeks(dt) >= 5*SETT_ANNO - 1e-6
        if mesi_madre: note.append(nota_madre)
        add("Vecchiaia contributiva (71 anni, 5 anni effettivi)", c.scan(ok71), 0, note)

    # 3. ANTICIPATA ORDINARIA ---------------------------------------
    note = []
    def ok_ant(dt):
        if gravoso_a(dt): am = PARAMS["gravosi_anticipata_d" if sesso_f else "gravosi_anticipata_u"]
        else: am = req(PARAMS["anticipata_donne" if sesso_f else "anticipata_uomini"], dt.year)
        return c.tot_weeks(dt) >= to_weeks(am) - 1e-6 and trentacinque(dt)
    mat = c.scan(ok_ant, start=c.primo_accredito)
    if ha_dm and not c.puro: note.append(nota_35)
    if finestra_lunga: note.append("Gestione CPDEL/CPS/CPI/CPUG: finestra lunga (L.213/2023). Valutare il CUMULO: con piu' gestioni la finestra torna a 3 mesi.")
    if finestra_lunga: note.append("Iscritti CPDEL/CPS/CPI/CPUG con <15 anni al 1995: aliquote di rendimento ridotte sulla quota retributiva (L.213/2023).")
    if mat: add("Pensione anticipata ordinaria", mat, fin_anticipata(mat), note)
    else: add("Pensione anticipata ordinaria", None, 0, note)

    # 4. ANTICIPATA CONTRIBUTIVA ------------------------------------
    if c.puro:
        note = []
        def mult_ac(anno):
            if sesso_f and c.figli >= 2: return PARAMS["soglia_ac"]["donna_2_figli"]
            if sesso_f and c.figli == 1: return PARAMS["soglia_ac"]["donna_1_figlio"]
            return PARAMS["soglia_ac"]["base_dal_2030" if anno >= 2030 else "base"]
        def ok_ac_req(dt):
            return dt >= eta_req(req(PARAMS["anticip_contrib_eta"], dt.year)) and \
                   c.eff_weeks(dt) >= to_weeks(req(PARAMS["anticip_contrib_contr"], dt.year)) - 1e-6
        mat = c.scan(ok_ac_req)
        found = None
        if mat:
            x = mat; lim = eta_raggiunta(c.nascita, (71,0))
            while x < lim:
                if ok_ac_req(x):
                    dec = c.decorrenza(x, 3)
                    imp = c.importo(dec, [])
                    soglia = mult_ac(dec.year) * c.assegno_sociale(dec.year)
                    if imp["lordo_mensile_13"] >= soglia: found = (x, soglia, mult_ac(dec.year)); break
                x = (x.replace(day=1) + relativedelta(months=1))
        mult = found[2] if found else mult_ac(mat.year if mat else c.oggi.year)
        note.append(f"Soglia importo = {mult} x assegno sociale" + (" (3,2 per le decorrenze dal 2030)" if mult == 3.0 else "") + "; la rendita del fondo pensione NON conta dal 2026 (L.199/2025).")
        if mesi_madre: note.append(nota_madre)
        if found:
            if found[0] != mat: note.append(f"Requisiti eta'/contributi raggiunti il {mat.isoformat()} ma soglia importo superata solo dopo.")
            r = add("Pensione anticipata contributiva", found[0], 3, note, {"soglia_mensile": round(found[1],2)})
            tetto = 5 * PARAMS["trattamento_minimo"][max(PARAMS["trattamento_minimo"])]
            im = r.get("importo") or {}
            if im.get("lordo_mensile_13", 0) > tetto:
                # fino all'eta' di vecchiaia l'anticipata contributiva non supera 5 volte il trattamento minimo (DL 201/2011 art. 24 c. 11)
                im["lordo_mensile_pieno_dalla_vecchiaia"] = im["lordo_mensile_13"]
                im["lordo_mensile_13"] = round(tetto, 2); im["lordo_annuo"] = round(tetto * 13, 2)
                im["netto_mensile_13_stima"] = round(netto_annuo(tetto * 13) / 13, 2)
                r["note"].append(f"Fino all'eta' della pensione di vecchiaia l'importo non puo' superare 5 volte il trattamento minimo ({eur(tetto)} al mese): poi si riceve l'importo pieno ({eur(im['lordo_mensile_pieno_dalla_vecchiaia'])}).")
        else:
            add("Pensione anticipata contributiva", None, 0, note, stato="soglia importo non raggiunta prima dei 71 anni" if mat else None)

    # 5. PRECOCI - QUOTA 41 -----------------------------------------
    if cond.get("precoce"):
        note = []
        cat = cond.get("categoria_precoci")
        if c.sistema == "contributivo puro":
            add("Quota 41 precoci", None, 0, note, stato="non spetta: serve almeno un contributo prima del 1996")
        elif not cat:
            note.append("Serve una categoria (disoccupato con NASpI finita, caregiver, invalido >=74%, gravoso/usurante): non indicata.")
            add("Quota 41 precoci", None, 0, note, stato="categoria non indicata")
        else:
            esente = cat in ("gravoso","usurante")
            def ok_q41(dt):
                if cat == "gravoso" and not gravoso_a(dt): return False   # la categoria richiede 7 anni su 10 di mansione prima dell'uscita
                am = PARAMS["gravosi_precoci"] if esente else req(PARAMS["precoci"], dt.year)
                return c.tot_weeks(dt) >= to_weeks(am) - 1e-6 and trentacinque(dt)
            mat = c.scan(ok_q41, start=c.primo_accredito)
            if ha_dm: note.append(nota_35)
            note.append("Verificare 12 mesi di contributi effettivi prima dei 19 anni e la categoria con domanda di riconoscimento (scadenze 31 marzo, 15 luglio, 30 novembre).")
            add(f"Quota 41 precoci ({cat})", mat, fin_anticipata(mat) if mat else 3, note)

    # 6. VECCHIAIA INVALIDI >=80% (solo AGO privati, dipendenti) ------
    inv = float(cond.get("invalidita_pct", 0))
    if inv >= 80:
        note = []
        if c.pa_esclusiva or c.gestione in ("ARTIGIANI","COMMERCIANTI","GS"):
            add("Vecchiaia anticipata invalidi >=80%", None, 0, note, stato="non spetta: solo dipendenti privati AGO")
        else:
            tab = PARAMS["invalidi80_donne" if sesso_f else "invalidi80_uomini"]
            data_inv = d(cond["data_invalidita"]) if cond.get("data_invalidita") else c.oggi
            def ok_inv(dt):
                return dt >= data_inv and dt >= eta_raggiunta(c.nascita, req(tab, dt.year)) and c.tot_weeks(dt) >= 20*SETT_ANNO - 1e-6
            note.append("Invalidita' pensionabile accertata da commissione INPS (non basta il verbale di invalidita' civile).")
            add("Vecchiaia anticipata invalidi >=80%", c.scan(ok_inv), 12, note)

    # 7. APE SOCIALE (indennita' ponte) ------------------------------
    cat_ape = cond.get("categoria_ape")
    if cat_ape:
        note = []
        min_c = 36 if cat_ape == "gravoso" else 30
        if cond.get("edile_ceramista"): min_c = 32
        rid = min(c.figli, 2) if sesso_f else 0
        def ok_ape(dt):
            if dt.year > max(PARAMS["ape_sociale_eta"]): return False
            if cat_ape == "gravoso" and not gravoso_a(dt): return False
            return dt >= eta_raggiunta(c.nascita, req(PARAMS["ape_sociale_eta"], dt.year)) and \
                   c.tot_weeks(dt) >= (min_c - rid)*SETT_ANNO - 1e-6
        mat = c.scan(ok_ape)
        note.append(f"Categoria: {cat_ape}; contributi minimi {min_c - rid} anni. Indennita' max 1.500 euro lordi x 12, fino alla vecchiaia. 2027 subordinata all'approvazione della Legge di Bilancio.")
        r = add("APE sociale (indennita' ponte)", mat, 0, note, importo=False)
        if mat:
            dec = d(r["decorrenza"]); im = c.importo(dec, [])
            r["importo"] = {"indennita_mensile_lorda_12": round(min(1500.0, im["lordo_annuo"]/13),2), "affidabilita": im["affidabilita"]}

    # 8. USURANTI / NOTTURNI ---------------------------------------
    if usurante:
        note = ["Quote (97,6 dipendenti / 98,6 autonomi) escluse dall'adeguamento fino al 31/12/2028. Domanda di riconoscimento entro 1° maggio dell'anno precedente.",
                "Calcolo valido per lavori usuranti e per i notturni con almeno 78 notti l'anno: con 72-77 notti servono 1 anno e 1 punto di quota in piu', con 64-71 notti 2 anni e 2 punti in piu' (INPS circ. 28/2026)."]
        aut = c.gestione in ("ARTIGIANI","COMMERCIANTI")
        min_eta = (62,7) if aut else (61,7); quota = 98.6 if aut else 97.6
        def ok_us(dt):
            a, m = eta_at(c.nascita, dt); eta = a + m/12; anz = c.tot_weeks(dt)/SETT_ANNO
            return dt >= eta_raggiunta(c.nascita, min_eta) and anz >= 35 and eta + anz >= quota
        add("Pensione lavori usuranti/notturni", c.scan(ok_us), 0, note)

    res = {"motore": "conteggi_pensione.py", "versione_parametri": PARAMS["versione"],
           "impronta_input": hashlib.sha256(json.dumps(inp, sort_keys=True).encode()).hexdigest()[:12],
           "data_calcolo": c.oggi.isoformat(),
           "assistito": inp["assistito"], "gestione": c.gestione, "sistema_calcolo": c.sistema,
           "opzione_contributivo": c.opzione_contributivo,
           "contributi_ad_oggi": fmt_am(c.tot_weeks(c.oggi)), "settimane_ad_oggi": round(c.tot_weeks(c.oggi),1),
           "contributi_effettivi_ad_oggi": fmt_am(c.eff_weeks(c.oggi)),
           "settimane_al_1995": round(c.w1995,1),
           "ipotesi": {"continua_lavoro": c.continua, "settimane_annue": c.sett_annue, "fino_a": inp.get("proiezione",{}).get("fino_a"),
                       "imponibile_annuo_futuro": c.imp_fut, "crescita_imponibile": c.cresc,
                       "tasso_capitalizzazione_futuro": c.tasso_fut, "rivalutazione_assegno_sociale": c.perequazione},
           "avvisi": c.avvisi, "canali": out}
    vec = next((x for x in out if x["canale"]=="Pensione di vecchiaia" and x.get("decorrenza") and "NON RAGGIUNTA" not in x["stato"]), None)
    for x in out:
        if vec and x is not vec and x.get("decorrenza") and x["decorrenza"] > vec["decorrenza"] and not x["canale"].startswith("APE"):
            x["stato"] += " (irrilevante: dopo la vecchiaia)"
    valide = [x for x in out if x.get("decorrenza") and "NON RAGGIUNTA" not in x.get("stato","") and not x["canale"].startswith("APE")]
    if valide:
        prima = min(valide, key=lambda x: x["decorrenza"]); res["prima_uscita_pensione"] = {"canale": prima["canale"], "decorrenza": prima["decorrenza"]}
    return res

# =====================================================================
def eur(x): return "—" if x is None else f"{x:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")
def it(s): return "—" if not s else date.fromisoformat(s).strftime("%d/%m/%Y")

def to_md(r):
    a = r["assistito"]; L = []
    L.append(f"# Prospetto conteggi pensionistici — {a.get('nome','')}")
    L.append(f"Data calcolo {it(r['data_calcolo'])} · parametri {r['versione_parametri']} · impronta {r['impronta_input']}\n")
    L.append(f"- Nato/a il {it(a['nascita'])} · sesso {a['sesso']} · figli {a.get('figli',0)}")
    L.append(f"- Gestione: {r['gestione']} · Sistema di calcolo: **{r['sistema_calcolo']}**")
    L.append(f"- Contributi ad oggi: **{r['contributi_ad_oggi']}** ({r['settimane_ad_oggi']} sett.) · effettivi {r['contributi_effettivi_ad_oggi']} · al 31/12/1995: {r['settimane_al_1995']} sett.")
    ip = r["ipotesi"]
    L.append(f"- Ipotesi: continua a lavorare = {ip['continua_lavoro']} ({ip['settimane_annue']} sett/anno, fino a {ip['fino_a'] or 'pensione'}), imponibile futuro {eur(ip['imponibile_annuo_futuro'])}, capitalizzazione futura {ip['tasso_capitalizzazione_futuro']*100:.1f}%\n")
    if r.get("prima_uscita_pensione"):
        p = r["prima_uscita_pensione"]; L.append(f"**Prima uscita possibile: {p['canale']} dal {it(p['decorrenza'])}**\n")
    L.append("| Canale | Stato | Maturazione | Finestra | Decorrenza | Età | Lordo mensile (x13) | Netto stimato | Affidabilità |")
    L.append("|---|---|---|---|---|---|---|---|---|")
    for x in r["canali"]:
        im = x.get("importo", {})
        lordo = im.get("lordo_mensile_13", im.get("indennita_mensile_lorda_12"))
        L.append(f"| {x['canale']} | {x['stato']} | {it(x.get('data_maturazione'))} | {x.get('finestra_mesi','—')} m | {it(x.get('decorrenza'))} | {x.get('eta_alla_decorrenza','—')} | {eur(lordo)} | {eur(im.get('netto_mensile_13_stima'))} | {im.get('affidabilita','—')} |")
    L.append("\n## Note per canale")
    for x in r["canali"]:
        if x["note"]:
            L.append(f"**{x['canale']}**"); L += [f"- {n}" for n in dict.fromkeys(x["note"])]
    if r["avvisi"]:
        L.append("\n## Avvisi sui dati"); L += [f"- {n}" for n in r["avvisi"]]
    L.append("\n_Stima indicativa: l'importo definitivo è determinato dall'INPS alla liquidazione. Netto stimato come media su 13 mensilita', con IRPEF 2026 e addizionali Lazio e Roma, pensione come unico reddito, senza altre detrazioni._")
    return "\n".join(L)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("input"); ap.add_argument("--md"); ap.add_argument("--json")
    a = ap.parse_args()
    res = calcola(json.load(open(a.input)))
    if a.json: json.dump(res, open(a.json,"w"), indent=2, ensure_ascii=False)
    md = to_md(res)
    if a.md: open(a.md,"w").write(md)
    print(md)
