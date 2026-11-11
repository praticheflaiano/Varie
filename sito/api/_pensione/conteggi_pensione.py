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
  "versione": "2026-11-09",
  "fonti": [
    "L. 199/2025 (Bilancio 2026); INPS circ. 28/2026 e msg 558/2026 (speranza di vita 2027-2028)",
    "INPS circ. 41/2026; L. 213/2023 c.162 (finestre CPDEL/CPS/CPI/CPUG)",
    "DD Min. Lavoro-MEF 16/10/2026 (coefficienti trasformazione 2027-2028); DD 20/11/2024 (2025-2026)",
    "INPS msg 707/2026 (rivalutazione montanti, decorrenze 2026); nota ISTAT/Min. Lavoro 21/10/2026 (tasso 2026 = 6,3359%)",
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
  "invalidi80_uomini":      {2026:(61,0), 2027:(61,1), 2028:(61,3)},   # 2027+ DA VERIFICARE
  "invalidi80_donne":       {2026:(56,0), 2027:(56,1), 2028:(56,3)},   # 2027+ DA VERIFICARE
  "ape_sociale_eta":        {2026:(63,5), 2027:(63,6)},                # 2027 da DDL; dopo 2027 non prevista
  # deroghe (esclusi dall'adeguamento 2027-2028)
  "gravosi_vecchiaia_eta": (66,7), "gravosi_anticipata_u": (42,10), "gravosi_anticipata_d": (41,10),
  "gravosi_precoci": (41,0),
  # finestre (mesi) per anticipata/precoci gestioni esclusive PA per anno di maturazione
  "finestra_pa": {2025:4, 2026:5, 2027:7, 2028:9},
  "assegno_sociale": {2026: 546.24},     # mensile; anni successivi = rivalutato con ipotesi (default 2%/anno)
  "soglia_ac": {"base":3.0, "donna_1_figlio":2.8, "donna_2_figli":2.6},
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
  "aliquota_computo": {"FPLD":0.33,"GS":0.33,"ARTIGIANI":0.24,"COMMERCIANTI":0.24,"CPDEL":0.33,"CPS":0.33,
                       "CPI":0.33,"CPUG":0.33,"CTPS":0.33,"ALTRO":0.33},
  "gestioni_esclusive_pa": ["CPDEL","CPS","CPI","CPUG","CTPS"],
  "finestre_lunghe_pa": ["CPDEL","CPS","CPI","CPUG"],
  # fisco 2026
  "irpef": [(28000,0.23),(50000,0.33),(None,0.43)],
  "add_reg_lazio": "1,73% se reddito <= 28.000; oltre: 1,73% fino a 15.000 + 3,33% sull'eccedenza; -60 euro tra 28.000 e 30.000",
  "add_com_roma": 0.009,
}
SETT_ANNO = 52.0

def req(tab, anno):
    ks = sorted(tab); a = min(max(anno, ks[0]), ks[-1]); return tab[a]

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
        self.tasso_fut = float(self.ipo.get("tasso_capitalizzazione_futuro", 0.02))
        self.perequazione = float(self.ipo.get("rivalutazione_assegno_sociale", 0.02))
        self.avvisi = []; self.log = []
        # --- contributi per anno (cap 52 settimane/anno per il diritto) ---
        per_anno = {}
        for c in inp.get("contributi", []):
            y = int(c["anno"]); g = c.get("gestione", self.gestione).upper()
            s = float(c.get("settimane", 0)); fig = float(c.get("figurative", 0))
            if "contributi_versati" in c: contr = float(c["contributi_versati"])
            else: contr = float(c.get("imponibile",0)) * float(c.get("aliquota_computo", PARAMS["aliquota_computo"].get(g,0.33)))
            e = per_anno.setdefault(y, {"sett":0.0,"fig":0.0,"contr":0.0})
            e["sett"] += s; e["fig"] += fig; e["contr"] += contr
        for y, e in per_anno.items():
            if e["sett"] > SETT_ANNO + 0.01:
                self.avvisi.append(f"Anno {y}: {e['sett']:.0f} settimane > 52 (sovrapposizione): per il diritto conto 52.")
                ratio = SETT_ANNO / e["sett"]; e["fig"] *= ratio; e["sett"] = SETT_ANNO
        self.anni = per_anno
        self.primo_accredito = d(inp["primo_accredito"]) if inp.get("primo_accredito") else (date(min(per_anno),1,1) if per_anno else self.oggi)
        p = inp.get("proiezione", {})
        self.continua = bool(p.get("continua_lavoro", False))
        self.sett_annue = float(p.get("settimane_annue", 52))
        self.imp_fut = float(p.get("imponibile_annuo", 0))
        self.aliq_fut = float(p.get("aliquota_computo", PARAMS["aliquota_computo"].get(self.gestione,0.33)))
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
        if self.opzione_contributivo:
            ok = self.w1995 < 18*SETT_ANNO and self.tot_weeks(self.oggi) >= 15*SETT_ANNO and \
                 sum(e["sett"] for y,e in per_anno.items() if y >= 1996) >= 5*SETT_ANNO
            if not ok: self.avvisi.append("Opzione contributivo richiesta ma requisiti (art.1 c.23 L.335/95) non verificati: <18 anni al 1995, >=15 anni totali, >=5 dopo il 1995.")

    # settimane accreditate alla data dt (distribuite uniformemente nell'anno)
    def _acc(self, dt, effettive=False):
        tot = 0.0
        for y, e in self.anni.items():
            w = e["sett"] - (e["fig"] if effettive else 0)
            start = date(y,1,1); end = min(date(y,12,31), self.oggi) if y == self.oggi.year else date(y,12,31)
            if y > self.oggi.year: continue
            if dt >= end: tot += w
            elif dt > start:
                span = (end - start).days or 1; tot += w * (dt - start).days / span
        return tot

    def _proj(self, dt):
        if dt <= self.oggi: return 0.0
        w = 0.0
        if self.continua:
            fine = min(dt, self.fine_lavoro) if self.fine_lavoro else dt
            if fine > self.oggi: w += (fine - self.oggi).days * self.sett_annue / 365.25
        if self.volontari:
            w += (dt - self.oggi).days * self.volontari / 365.25
        # cap 52/anno
        return min(w, (dt - self.oggi).days * SETT_ANNO / 365.25)

    def tot_weeks(self, dt): return self._acc(dt) + self._proj(dt)
    def eff_weeks(self, dt): return self._acc(dt, True) + self._proj(dt)

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

    def importo(self, decorrenza, canale_note):
        M, stime = self.montante(decorrenza)
        coeff, tabk = self.coeff_trasf(decorrenza)
        quota_c = M * coeff / 100
        quota_r = None; conf = "media"
        if not self.puro:
            if self.inp.get("quota_retributiva_annua"):
                quota_r = float(self.inp["quota_retributiva_annua"]); conf = "media"
                canale_note.append("Quota retributiva presa dal dato fornito (es. simulazione INPS).")
            elif self.inp.get("retribuzione_pensionabile_annua"):
                anni_r = (self.w1995 if self.sistema.startswith("misto") else min(self._acc(date(2011,12,31)), 40*SETT_ANNO)) / SETT_ANNO
                quota_r = 0.02 * min(anni_r, 40) * float(self.inp["retribuzione_pensionabile_annua"])
                conf = "bassa"; canale_note.append(f"Quota retributiva STIMATA: 2% x {anni_r:.1f} anni x retribuzione pensionabile indicata.")
            else:
                conf = "parziale"; canale_note.append("Manca la quota retributiva: importo = SOLO quota contributiva.")
        if y_after := (decorrenza.year >= 2029):
            canale_note.append("Coefficienti 2029+ non ancora pubblicati: uso 2027-2028 (sovrastima probabile).")
        if stime: canale_note.append(f"Montante con tassi di capitalizzazione futuri ipotetici ({self.tasso_fut*100:.1f}%).")
        if conf == "media" and (stime or decorrenza.year >= 2029): conf = "media-bassa"
        lordo_annuo = quota_c + (quota_r or 0)
        return {"montante": round(M,2), "coeff_trasf_%": round(coeff,4), "tabella_coeff": tabk,
                "quota_contributiva_annua": round(quota_c,2),
                "quota_retributiva_annua": None if quota_r is None else round(quota_r,2),
                "lordo_annuo": round(lordo_annuo,2), "lordo_mensile_13": round(lordo_annuo/13,2),
                "netto_mensile_13_stima": round(netto_annuo(lordo_annuo)/13,2), "affidabilita": conf}

    # ------------------- ricerca data di maturazione -------------------
    def scan(self, ok, start=None, anni_max=45):
        start = start or max(self.primo_accredito, self.nascita + relativedelta(years=40))
        end = self.oggi + relativedelta(years=anni_max)
        dt = start; step = 30
        # passo mensile poi raffino al giorno
        prev = None
        while dt <= end:
            if ok(dt):
                lo = prev or start
                x = lo
                while x <= dt:
                    if ok(x): return x
                    x += timedelta(days=1)
                return dt
            prev = dt; dt += timedelta(days=step)
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
    return R - irpef(R) - add_lazio(R) - R*PARAMS["add_com_roma"]

# =====================================================================
def calcola(inp):
    c = Caso(inp); out = []
    sesso_f = c.sesso == "F"
    cond = c.cond
    gravoso = bool(cond.get("gravoso_7su10")); usurante = bool(cond.get("usurante"))
    finestra_lunga = c.gestione in PARAMS["finestre_lunghe_pa"]

    def fin_anticipata(mat):
        if finestra_lunga: return req(PARAMS["finestra_pa"], mat.year)
        return 3

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
    def ok_vec(dt):
        if gravoso: am = PARAMS["gravosi_vecchiaia_eta"]; minc = 30
        else: am = req(PARAMS["vecchiaia_eta"], dt.year); minc = 20
        return dt >= eta_raggiunta(c.nascita, am) and c.tot_weeks(dt) >= minc*SETT_ANNO - 1e-6
    mat = c.scan(ok_vec)
    if gravoso: note.append("Requisito agevolato gravosi (66a7m + 30 anni, 7 anni su 10 di attivita' gravosa): VERIFICARE documentazione.")
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
            return dt >= eta_raggiunta(c.nascita, req(PARAMS["vecchiaia_contrib_eta"], dt.year)) and c.eff_weeks(dt) >= 5*SETT_ANNO - 1e-6
        add("Vecchiaia contributiva (71 anni, 5 anni effettivi)", c.scan(ok71), 0, note)

    # 3. ANTICIPATA ORDINARIA ---------------------------------------
    note = []
    def ok_ant(dt):
        if gravoso: am = PARAMS["gravosi_anticipata_d" if sesso_f else "gravosi_anticipata_u"]
        else: am = req(PARAMS["anticipata_donne" if sesso_f else "anticipata_uomini"], dt.year)
        return c.tot_weeks(dt) >= to_weeks(am) - 1e-6
    mat = c.scan(ok_ant, start=c.primo_accredito)
    if finestra_lunga: note.append("Gestione CPDEL/CPS/CPI/CPUG: finestra lunga (L.213/2023). Valutare il CUMULO: con piu' gestioni la finestra torna a 3 mesi.")
    if finestra_lunga: note.append("Iscritti CPDEL/CPS/CPI/CPUG con <15 anni al 1995: aliquote di rendimento ridotte sulla quota retributiva (L.213/2023).")
    if mat: add("Pensione anticipata ordinaria", mat, fin_anticipata(mat), note)
    else: add("Pensione anticipata ordinaria", None, 0, note)

    # 4. ANTICIPATA CONTRIBUTIVA ------------------------------------
    if c.puro:
        note = []
        mult = PARAMS["soglia_ac"]["base"]
        if sesso_f and c.figli == 1: mult = PARAMS["soglia_ac"]["donna_1_figlio"]
        if sesso_f and c.figli >= 2: mult = PARAMS["soglia_ac"]["donna_2_figli"]
        def ok_ac_req(dt):
            return dt >= eta_raggiunta(c.nascita, req(PARAMS["anticip_contrib_eta"], dt.year)) and \
                   c.eff_weeks(dt) >= to_weeks(req(PARAMS["anticip_contrib_contr"], dt.year)) - 1e-6
        mat = c.scan(ok_ac_req)
        found = None
        if mat:
            x = mat; lim = eta_raggiunta(c.nascita, (71,0))
            while x < lim:
                if ok_ac_req(x):
                    dec = c.decorrenza(x, 3)
                    imp = c.importo(dec, [])
                    soglia = mult * c.assegno_sociale(dec.year)
                    if imp["lordo_mensile_13"] >= soglia: found = (x, soglia); break
                x = (x.replace(day=1) + relativedelta(months=1))
        note.append(f"Soglia importo = {mult} x assegno sociale; la rendita del fondo pensione NON conta dal 2026 (L.199/2025).")
        if found:
            if found[0] != mat: note.append(f"Requisiti eta'/contributi raggiunti il {mat.isoformat()} ma soglia importo superata solo dopo.")
            add("Pensione anticipata contributiva", found[0], 3, note, {"soglia_mensile": round(found[1],2)})
        else:
            add("Pensione anticipata contributiva", None, 0, note, stato="soglia importo non raggiunta prima dei 71 anni" if mat else None)

    # 5. PRECOCI - QUOTA 41 -----------------------------------------
    if cond.get("precoce"):
        note = []
        cat = cond.get("categoria_precoci")
        if not cat:
            note.append("Serve una categoria (disoccupato con NASpI finita, caregiver, invalido >=74%, gravoso/usurante): non indicata.")
            add("Quota 41 precoci", None, 0, note, stato="categoria non indicata")
        else:
            esente = cat in ("gravoso","usurante")
            def ok_q41(dt):
                am = PARAMS["gravosi_precoci"] if esente else req(PARAMS["precoci"], dt.year)
                return c.tot_weeks(dt) >= to_weeks(am) - 1e-6
            mat = c.scan(ok_q41, start=c.primo_accredito)
            note.append("Verificare 12 mesi di contributi effettivi prima dei 19 anni e la categoria con domanda di riconoscimento (scadenze 1/3, 15/7, 30/11).")
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
            note.append("Invalidita' pensionabile accertata da commissione INPS (non basta il verbale di invalidita' civile). Requisiti 2027+ da verificare.")
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
        note = ["Quote (97,6 dipendenti / 98,6 autonomi) escluse dall'adeguamento fino al 31/12/2028. Domanda di riconoscimento entro 1° maggio dell'anno precedente."]
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
    L.append("\n_Stima indicativa: l'importo definitivo è determinato dall'INPS alla liquidazione. Netto stimato con IRPEF 2026, addizionali Lazio e Roma, senza altre detrazioni._")
    return "\n".join(L)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("input"); ap.add_argument("--md"); ap.add_argument("--json")
    a = ap.parse_args()
    res = calcola(json.load(open(a.input)))
    if a.json: json.dump(res, open(a.json,"w"), indent=2, ensure_ascii=False)
    md = to_md(res)
    if a.md: open(a.md,"w").write(md)
    print(md)
