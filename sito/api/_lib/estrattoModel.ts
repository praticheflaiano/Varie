// Modello dati e regole pure per l'estratto conto contributivo INPS.
// (Nessuna dipendenza dal browser: usato anche dalla funzione server api/stima/leggi-estratto.ts, per questo sta in api/_lib)
//
// LETTURA DIRETTA (leggiEstrattoDaCelle): l'estratto scaricato dal sito INPS è un PDF con testo
// vero, in cui ogni cella della tabella è un frammento con la sua posizione. Le righe e le colonne
// si ricompongono sul dispositivo del cliente, senza inviare il file e senza modelli:
//   Dal | Al | Tipo di contribuzione | unità | utili al diritto | utili al calcolo | Retribuzione | Azienda | Note
// più anagrafica, data "Emesso il", sezione, legenda delle note e segnalazioni.
// Le stesse regole sono in api/_pensione/estratto_inps.py (lettura sul server dopo il pagamento):
// se cambi qui, cambia là. Regole verificate su estratti reali del 2026.
//
// La lettura per righe di testo (leggiEstratto) resta come riserva per i PDF con un'impaginazione diversa.

export interface RigaEstratto {
  dal: string; // ISO
  al: string; // ISO
  tipo: string;
  settimane: number | null;
  importo: number | null;
  figurativa: boolean;
  /** Unità scritta sulla riga; i contributi sono poi convertiti in settimane (12 mesi = 52 settimane). */
  unita?: "settimane" | "mesi" | "giorni" | "";
  /** Contributi utili al diritto e al calcolo come scritti (nell'unità della riga). */
  contributi?: number | null;
  contributiCalcolo?: number | null;
  azienda?: string;
  /** Codice della colonna Note (spiegato in EstrattoLetto.legenda). */
  nota?: string;
  /** Codice della gestione dedotto dal tipo o dalla sezione (FPLD, COMMERCIANTI, ARTIGIANI, GS…), vuoto se non riconosciuto. */
  gestione?: string;
}

/** Frammento di testo del PDF con la sua posizione sulla pagina (y cresce verso il basso). */
export interface Cella {
  p: number;
  x: number;
  y: number;
  t: string;
}

export interface AnnoEstratto {
  anno: number;
  settimane: number;
  figurative: number;
  imponibile: number;
}

export interface EstrattoLetto {
  nome: string;
  cognome: string;
  codiceFiscale: string;
  nascita: string; // ISO, dal codice fiscale o dal testo
  sesso: "M" | "F" | "";
  dataEstratto: string;
  righe: RigaEstratto[];
  anni: AnnoEstratto[];
  totaleSettimane: number;
  /** Situazione lavorativa dedotta dall'ultimo periodo (chiave del questionario). */
  situazione: "" | "privato" | "pubblico" | "autonomo" | "separata" | "disoccupato";
  /** Retribuzione dell'ultimo anno con almeno 48 settimane, se c'è. */
  ultimaRetribuzione: number | null;
  avvisi: string[];
  residenza?: string;
  /** Legenda dei codici nota riportata dal documento. */
  legenda?: { codice: string; testo: string }[];
  /** Voci di "Segnalazioni personalizzate e/o pratiche in corso". */
  segnalazioni?: string[];
  /** Gestioni trovate, con le settimane di ciascuna. */
  gestioni?: { codice: string; settimane: number }[];
  /** Come è stato letto il documento. */
  lettura?: "diretta" | "ai" | "locale";
  /** Solo lettura diretta: true se ogni pagina ha testo e ogni riga ha i suoi contributi. */
  completa?: boolean;
}

const MESI_CF = "ABCDEHLMPRST";
const RE_CF = /\b([A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z])\b/;
const RE_DATA = /(\d{2})[/.-](\d{2})[/.-](\d{4})/;
const RE_RIGA = /^\s*(\d{2}[/.-]\d{2}[/.-]\d{4})\s*[-–]?\s*(\d{2}[/.-]\d{2}[/.-]\d{4})\s+(.*)$/;
const RE_IMPORTO = /(?<![\d.,])(\d{1,3}(?:\.\d{3})*,\d{2})(?![\d.,])/;
export const RE_FIGURATIVA = /disoccupaz|naspi|aspi\b|mobilit|malattia|maternit|congedo|militare|cassa integr|cig\b|figurativ|infortun|solidar/i;

// Gestione dedotta dal tipo di contribuzione o dal titolo della sezione (codici del motore di calcolo).
const GESTIONI: [RegExp, string][] = [
  [/cpdel/, "CPDEL"], [/\bcps\b/, "CPS"], [/\bcpi\b/, "CPI"], [/cpug/, "CPUG"], [/ctps|\bstato\b/, "CTPS"],
  [/artigian|\bart\./, "ARTIGIANI"], [/commerc|\bcomm?\./, "COMMERCIANTI"],
  [/separata|parasubordinat|collaborazion|co\.\s?co\./, "GS"],
  [/dipend|fpld|domestic/, "FPLD"],
];
export function codiceGestione(testo: string): string {
  const t = (testo || "").toLowerCase();
  for (const [re, codice] of GESTIONI) if (re.test(t)) return codice;
  return "";
}
export const NOMI_GESTIONE: Record<string, string> = {
  FPLD: "Lavoro dipendente", COMMERCIANTI: "Commercianti", ARTIGIANI: "Artigiani", GS: "Gestione separata",
  CPDEL: "Dipendenti pubblici (CPDEL)", CPS: "Dipendenti pubblici (CPS)", CPI: "Dipendenti pubblici (CPI)", CPUG: "Dipendenti pubblici (CPUG)", CTPS: "Dipendenti dello Stato",
};

const numIt = (s: string) => {
  const n = parseFloat(s.replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/** Converte i contributi della riga in settimane (regole della skill: 12 mesi o 360 giorni = 52 settimane). */
export function inSettimane(unita: string, valore: string): number | null {
  const v = valore.trim();
  if (!v) return null;
  if (unita === "anni-mesi-giorni") {
    const p = v.split(/[^\d]+/).filter(Boolean).map(Number);
    if (p.length !== 3) return null;
    return Math.round(p[0] * 52 + (p[1] * 52) / 12 + (p[2] * 52) / 360);
  }
  const n = numIt(v);
  if (n === null || n < 0) return null;
  if (unita === "settimane") return Math.round(n);
  if (unita === "mesi") return Math.round((n * 52) / 12);
  if (unita === "giorni") return Math.round((n * 52) / 360);
  return null;
}

const iso = (d: string) => {
  const m = d.match(RE_DATA);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

/** Data di nascita e sesso dal codice fiscale (il secolo si deduce dall'anno corrente). */
export function daCodiceFiscale(cf: string, oggi = new Date()): { nascita: string; sesso: "M" | "F" } | null {
  const m = cf.toUpperCase().match(/^[A-Z]{6}(\d{2})([ABCDEHLMPRST])(\d{2})[A-Z]\d{3}[A-Z]$/);
  if (!m) return null;
  let giorno = parseInt(m[3], 10);
  const sesso = giorno > 40 ? "F" : "M";
  if (giorno > 40) giorno -= 40;
  const mese = MESI_CF.indexOf(m[2]) + 1;
  if (giorno < 1 || giorno > 31 || mese < 1) return null;
  const yy = parseInt(m[1], 10);
  // Chi chiede una stima della pensione è nato nel '900, salvo anni a due cifre "futuri".
  const anno = 2000 + yy <= oggi.getFullYear() - 16 ? 2000 + yy : 1900 + yy;
  const p = (n: number) => String(n).padStart(2, "0");
  return { nascita: `${anno}-${p(mese)}-${p(giorno)}`, sesso };
}

function leggiRiga(linea: string): RigaEstratto | null {
  const m = linea.match(RE_RIGA);
  if (!m) return null;
  const dal = iso(m[1]);
  const al = iso(m[2]);
  if (!dal || !al || al < dal) return null;
  let resto = m[3];

  const imp = resto.match(RE_IMPORTO);
  const importo = imp ? parseFloat(imp[1].replace(/\./g, "").replace(",", ".")) : null;
  if (imp) resto = resto.replace(imp[1], " ");

  // Formato INPS: "tipo  unità  diritto  calcolo …": l'unità (sett., mesi, giorni) dice come leggere il numero.
  const conUnita = resto.match(/^(.*?)\s(sett\.?|settimane|mesi|giorni|gg\.?)\s+(\d{1,4})(?:\s+(\d{1,4},\d{1,3}))?(.*)$/i);
  if (conUnita) {
    const u = /^sett/i.test(conUnita[2]) ? "settimane" : /^mes/i.test(conUnita[2]) ? "mesi" : "giorni";
    const tipo = conUnita[1].replace(/\s+/g, " ").trim();
    const gestione = codiceGestione(tipo);
    return {
      dal, al, tipo, settimane: inSettimane(u, conUnita[3]), importo, figurativa: RE_FIGURATIVA.test(tipo), unita: u,
      contributi: numIt(conUnita[3]), contributiCalcolo: conUnita[4] ? numIt(conUnita[4]) : null, azienda: "", nota: "", gestione,
    };
  }

  // Altri formati: tipo di contribuzione = testo prima del primo numero; il primo intero è il
  // numero di contributi utili al diritto (settimane, nel formato più comune).
  const primoNumero = resto.search(/(?<![A-Za-zÀ-ú])\d+(?![A-Za-zÀ-ú])/);
  const tipo = (primoNumero >= 0 ? resto.slice(0, primoNumero) : resto).replace(/\s+/g, " ").trim();
  const n = primoNumero >= 0 ? parseInt(resto.slice(primoNumero).match(/\d+/)![0], 10) : NaN;

  const giorni = (Date.parse(al) - Date.parse(dal)) / 86400000 + 1;
  const massimo = Math.ceil(giorni / 7) + 1;
  const settimane = Number.isFinite(n) && n >= 0 && n <= Math.max(massimo, 1) ? n : null;

  return { dal, al, tipo, settimane, importo, figurativa: RE_FIGURATIVA.test(tipo) };
}

function situazioneDa(tipo: string): EstrattoLetto["situazione"] {
  const t = tipo.toLowerCase();
  if (/disoccupaz|naspi|mobilit/.test(t)) return "disoccupato";
  if (/artigian|commerc|coltivator|titolare di impresa|coadiuv|\bart\.|\bcomm?\./.test(t)) return "autonomo";
  if (/separata|parasubordinat|collaborator/.test(t)) return "separata";
  if (/pubblic|cpdel|ctps|stato|ex inpdap/.test(t)) return "pubblico";
  if (/dipend/.test(t)) return "privato";
  return "";
}

export interface Anagrafica {
  nome: string;
  cognome: string;
  codiceFiscale: string;
  nascita: string;
  sesso: "M" | "F" | "";
  dataEstratto: string;
}

/** Aggrega i periodi per anno, calcola totali e avvisi. Usata sia dalla lettura locale sia da quella con AI. */
export function componi(an: Anagrafica, righeIn: RigaEstratto[], avvisiIniziali: string[] = [], altro: Pick<EstrattoLetto, "residenza" | "legenda" | "segnalazioni" | "lettura" | "completa"> = {}): EstrattoLetto {
  const avvisi = [...avvisiIniziali];
  const righe = [...righeIn].sort((a, b) => a.dal.localeCompare(b.dal));
  const cf = an.codiceFiscale;
  const perAnno = new Map<number, AnnoEstratto>();
  let senzaSettimane = 0;
  for (const r of righe) {
    const anno = parseInt(r.dal.slice(0, 4), 10);
    const a = perAnno.get(anno) ?? { anno, settimane: 0, figurative: 0, imponibile: 0 };
    if (r.settimane === null) senzaSettimane++;
    else {
      a.settimane += r.settimane;
      if (r.figurativa) a.figurative += r.settimane;
    }
    if (r.importo !== null) a.imponibile = Math.round((a.imponibile + r.importo) * 100) / 100;
    perAnno.set(anno, a);
  }
  const anni = [...perAnno.values()].sort((a, b) => a.anno - b.anno);
  const totaleSettimane = anni.reduce((s, a) => s + a.settimane, 0);

  if (!righe.length) avvisi.push("Non abbiamo trovato periodi contributivi nel file: controlla che sia l'estratto conto contributivo INPS in PDF (non una foto o una scansione).");
  if (!cf) avvisi.push("Non abbiamo trovato il codice fiscale: inserisci tu data di nascita e sesso.");
  if (senzaSettimane) avvisi.push(`In ${senzaSettimane} ${senzaSettimane === 1 ? "periodo" : "periodi"} non siamo riusciti a leggere il numero di contributi: li verifichiamo noi.`);
  for (const a of anni) if (a.settimane > 52) avvisi.push(`Nel ${a.anno} risultano ${a.settimane} settimane (più gestioni nello stesso anno): ai fini del diritto ne valgono al massimo 52.`);
  for (let i = 1; i < anni.length; i++) {
    const da = anni[i - 1].anno + 1;
    const fino = anni[i].anno - 1;
    if (fino >= da) avvisi.push(`Nessun contributo ${da === fino ? `nel ${da}` : `tra il ${da} e il ${fino}`}: se hai lavorato in quel periodo, segnalalo nel passo "Contributi".`);
  }

  // La situazione attuale si legge dall'ultima riga con contributi (non dalle integrazioni a zero settimane).
  const ultima = [...righe].reverse().find((r) => r.tipo && (r.settimane ?? 0) > 0) ?? [...righe].reverse().find((r) => r.tipo);
  const perGestione = new Map<string, number>();
  for (const r of righe) {
    if (r.settimane === null) continue;
    const g = r.gestione || (r.figurativa ? "FPLD" : codiceGestione(r.tipo)) || "ALTRO";
    perGestione.set(g, (perGestione.get(g) ?? 0) + r.settimane);
  }
  const gestioni = [...perGestione].map(([codice, settimane]) => ({ codice, settimane })).sort((a, b) => b.settimane - a.settimane);
  const annoPieno = [...anni].reverse().find((a) => a.settimane - a.figurative >= 48 && a.imponibile > 0);

  return {
    nome: an.nome,
    cognome: an.cognome,
    codiceFiscale: an.codiceFiscale,
    nascita: an.nascita,
    sesso: an.sesso,
    dataEstratto: an.dataEstratto,
    righe,
    anni,
    totaleSettimane,
    situazione: ultima ? situazioneDa(ultima.tipo) : "",
    ultimaRetribuzione: annoPieno ? annoPieno.imponibile : null,
    avvisi,
    gestioni,
    ...altro,
  };
}

// ---------------------------------------------------------------------------------------------
// Lettura diretta dalle celle del PDF
// ---------------------------------------------------------------------------------------------
const RE_DATA_CELLA = /^(\d{2})[/.-](\d{2})[/.-](\d{4})$/;
const RE_DATA_UNITA = /^(\d{2}[/.-]\d{2}[/.-]\d{4})\s+(\S.*)$/;
const RE_UNITA = /^(sett\.?|settimane|mesi|mese|giorni|gg\.?)$/i;
const RE_INTERO = /^\d{1,4}$/;
const RE_DECIMALE = /^\d{1,4},\d{1,3}$/;
const RE_IMPORTO_CELLA = /^-?\d{1,3}(?:\.\d{3})*,\d{2}$/;
const RE_SEZIONE = /^(regime|gestion[ei]|fondo|fondi|cassa|lavoratori)\b/i;
const RE_VOCE_NOTA = /^(\S{1,3})\)\s+(.+)$/;
const RE_PIEDE = /^(estratto conto di\b|pagina\s+\d+)/i;
const TOLLERANZA_RIGA = 2.5;

function lettereCf(parola: string, nome = false): string {
  const p = parola.toUpperCase().replace(/[^A-Z]/g, "");
  let cons = [...p].filter((c) => !"AEIOU".includes(c));
  const voc = [...p].filter((c) => "AEIOU".includes(c));
  if (nome && cons.length >= 4) cons = [cons[0], cons[2], cons[3]];
  return (cons.join("") + voc.join("") + "XXX").slice(0, 3);
}

/** Divide "COGNOME NOME" usando il codice fiscale (cognomi o nomi di più parole). */
export function dividiNome(intero: string, cf: string): [string, string] {
  const parti = intero.split(/\s+/).filter(Boolean);
  if (parti.length < 2) return [intero, ""];
  if (cf) {
    for (let k = 1; k < parti.length; k++) {
      const a = parti.slice(0, k).join(" ");
      const b = parti.slice(k).join(" ");
      if (lettereCf(a) + lettereCf(b, true) === cf.slice(0, 6)) return [a, b];
      if (lettereCf(b) + lettereCf(a, true) === cf.slice(0, 6)) return [b, a];
    }
  }
  return [parti[0], parti.slice(1).join(" ")];
}

/** Legge l'estratto dalle celle del PDF (vedi l'intestazione del file). `pagine` = numero di pagine del documento. */
export function leggiEstrattoDaCelle(celle: Cella[], pagine = 1): EstrattoLetto {
  // righe: stessa pagina e stessa altezza
  const righe: { p: number; y: number; c: { x: number; t: string }[] }[] = [];
  // Alcuni lettori di PDF uniscono celle vicine ("31/12/1985 Servizio militare"): la data si separa dal resto.
  const separate: Cella[] = [];
  for (const cella of celle) {
    let t = cella.t.trim();
    let x = cella.x;
    for (let m = t.match(RE_DATA_UNITA); m; m = t.match(RE_DATA_UNITA)) {
      separate.push({ ...cella, x, t: m[1] });
      t = m[2].trim();
      x += 50;
    }
    if (t) separate.push({ ...cella, x, t });
  }
  for (const cella of separate.sort((a, b) => a.p - b.p || a.y - b.y || a.x - b.x)) {
    const ultima = righe[righe.length - 1];
    if (ultima && ultima.p === cella.p && Math.abs(ultima.y - cella.y) <= TOLLERANZA_RIGA) ultima.c.push({ x: cella.x, t: cella.t.trim() });
    else righe.push({ p: cella.p, y: cella.y, c: [{ x: cella.x, t: cella.t.trim() }] });
  }
  for (const r of righe) r.c.sort((a, b) => a.x - b.x);
  const testo = righe.map((r) => r.c.map((c) => c.t).join(" ")).join(" ");
  const cf = (testo.toUpperCase().match(RE_CF) || [])[1] || "";
  const dalCf = cf ? daCodiceFiscale(cf) : null;
  const isoCella = (t: string) => {
    const m = t.match(RE_DATA_CELLA);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
  };

  // Anagrafica: riquadro in alto a destra della prima pagina, una cella per riga
  let nomeIntero = "";
  let nascita = "";
  let emesso = "";
  let xAnagrafica: number | null = null;
  const residenza: string[] = [];
  let res: { x: number; y: number; p: number } | null = null;
  for (const r of righe)
    for (const { x, t } of r.c) {
      if (/^nat[oa]\s+a\s+/i.test(t) && xAnagrafica === null) xAnagrafica = x;
      else if (/^il\s+\d{2}[/.-]\d{2}[/.-]\d{4}$/i.test(t) && !nascita) nascita = isoCella(t.split(/\s+/).pop()!);
      else if (/^emesso\s+il\s+/i.test(t) && !emesso) emesso = isoCella(t.split(/\s+/).pop()!);
      else if (/^residente\s+in\s+/i.test(t) && !res) {
        residenza.push(t.replace(/^residente\s+in\s+/i, "").trim());
        res = { x, y: r.y, p: r.p };
      }
    }
  if (res) for (const r of righe) if (r.p === res.p && r.y - res.y > 0 && r.y - res.y <= 14) for (const c of r.c) if (Math.abs(c.x - res.x) <= 2) residenza.push(c.t);
  if (xAnagrafica !== null) {
    const sopra = righe.filter((r) => r.p === 0).flatMap((r) => r.c.filter((c) => Math.abs(c.x - xAnagrafica!) <= 2).map((c) => c.t));
    nomeIntero = sopra.find((t) => !/^(nat[oa]|il|codice|residente)\b/i.test(t)) || "";
  }
  if (!nomeIntero) nomeIntero = (testo.match(/estratto conto di\s+(.+?)\s+[A-Z]{6}\d{2}/i) || [])[1] || "";
  const [cognomeGrezzo, nomeGrezzo] = dividiNome(nomeIntero.replace(/\s+/g, " ").trim(), cf);
  const maiuscola = (s: string) => s.toLowerCase().replace(/(^|[\s'])\p{L}/gu, (c) => c.toUpperCase());

  const periodi: RigaEstratto[] = [];
  const legenda: { codice: string; testo: string }[] = [];
  const segnalazioni: string[] = [];
  const problemi: string[] = [];
  let xNote: number | null = null;
  let xUnita: number | null = null;
  let sezione = "";
  let zona: "tabella" | "note" | "segnalazioni" = "tabella";
  let ultimaPagina = -1;
  let ultimaY = 0;
  const eEstratto = /estratto\s+conto/i.test(testo);
  for (const r of righe) {
    const c = r.c;
    const testi = c.map((k) => k.t);
    const primo = testi[0];
    // piè di pagina ("Estratto conto di …", "Pagina n di m") e numeri di pagina isolati
    if (testi.some((t) => RE_PIEDE.test(t)) || (c.length === 1 && RE_INTERO.test(primo))) continue;
    // intestazione della tabella: fissa la colonna delle note (si ripete a ogni pagina)
    if (testi.includes("Note") && testi.some((t) => /^(azienda|tipo di contribuzione)/i.test(t))) {
      xNote = c.find((k) => k.t === "Note")!.x;
      zona = "tabella";
      continue;
    }
    if (c.length >= 2 && RE_DATA_CELLA.test(c[0].t) && RE_DATA_CELLA.test(c[1].t)) {
      zona = "tabella";
      const dal = isoCella(c[0].t);
      const al = isoCella(c[1].t);
      let unita: RigaEstratto["unita"] = "";
      let diritto = "";
      let calcolo = "";
      let importo = "";
      let nota = "";
      const tipo: string[] = [];
      const azienda: string[] = [];
      for (const { x, t } of c.slice(2)) {
        if (!unita && RE_UNITA.test(t)) {
          unita = /^sett/i.test(t) ? "settimane" : /^mes/i.test(t) ? "mesi" : "giorni";
          xUnita = x;
        } else if (xNote !== null && x >= xNote - 30 && t.length <= 4) nota = `${nota} ${t}`.trim();
        else if (unita && RE_INTERO.test(t) && !diritto && !importo) diritto = t;
        else if (unita && (RE_DECIMALE.test(t) || RE_INTERO.test(t)) && diritto && !calcolo && !importo) calcolo = t;
        else if (RE_IMPORTO_CELLA.test(t) && !importo && !azienda.length) importo = t;
        else if (!unita && !importo) tipo.push(t);
        else azienda.push(t);
      }
      if (!dal || !al || al < dal) {
        problemi.push(`riga con date non valide (${c[0].t} - ${c[1].t})`);
        continue;
      }
      if (!diritto) problemi.push(`${c[0].t} - ${c[1].t}: contributi non letti`);
      const tipoTesto = tipo.join(" ");
      periodi.push({
        dal, al, tipo: tipoTesto,
        settimane: diritto ? inSettimane(unita, diritto) : null,
        importo: importo ? numIt(importo) : null,
        figurativa: RE_FIGURATIVA.test(tipoTesto),
        unita, contributi: diritto ? numIt(diritto) : null, contributiCalcolo: calcolo ? numIt(calcolo) : null,
        azienda: azienda.join(" "), nota,
        gestione: codiceGestione(tipoTesto) || codiceGestione(sezione),
      });
      ultimaPagina = r.p;
      ultimaY = r.y;
      continue;
    }
    if (/^note\s*:?$/i.test(primo)) { zona = "note"; continue; }
    if (/^segnalazioni\b/i.test(primo)) { zona = "segnalazioni"; continue; }
    const rigaTesto = testi.join(" ").replace(/\s+/g, " ").trim();
    if (zona === "note") {
      const v = rigaTesto.match(RE_VOCE_NOTA);
      if (v) legenda.push({ codice: v[1], testo: v[2] });
      else if (legenda.length) legenda[legenda.length - 1].testo += ` ${rigaTesto}`;
    } else if (zona === "segnalazioni") {
      if (/^[-–•]/.test(rigaTesto) || !segnalazioni.length) segnalazioni.push(rigaTesto.replace(/^[-–•]\s*/, ""));
      else segnalazioni[segnalazioni.length - 1] += ` ${rigaTesto}`;
    } else if (c.length === 1 && RE_SEZIONE.test(primo) && primo.length <= 70) sezione = primo.replace(/\s+/g, " ");
    else if (periodi.length && xUnita !== null && r.p === ultimaPagina && r.y - ultimaY <= 16 && !/^(dal|al|periodo|reddito|euro)\b/i.test(primo)) {
      // testo andato a capo nella cella: si attacca al tipo o all'azienda della riga sopra
      const riga = periodi[periodi.length - 1];
      for (const { x, t } of c) {
        if (x < xUnita) riga.tipo = `${riga.tipo} ${t}`.trim();
        else riga.azienda = `${riga.azienda ?? ""} ${t}`.trim();
      }
      ultimaY = r.y;
    }
  }
  const pagineConTesto = new Set(celle.map((c) => c.p)).size;
  if (pagineConTesto < pagine) problemi.push(`${pagine - pagineConTesto} pagine senza testo leggibile`);

  const avvisi: string[] = [];
  if (celle.length && !eEstratto) avvisi.push("Il documento non sembra un estratto conto contributivo INPS: controlla di aver caricato il file giusto.");
  const completa = eEstratto && periodi.length > 0 && !problemi.length;
  return componi(
    { nome: maiuscola(nomeGrezzo), cognome: maiuscola(cognomeGrezzo), codiceFiscale: cf, nascita: dalCf?.nascita || nascita, sesso: dalCf?.sesso || "", dataEstratto: emesso },
    periodi,
    avvisi,
    { residenza: residenza.join(", "), legenda, segnalazioni, lettura: "diretta", completa },
  );
}

/** Interpreta le righe di testo dell'estratto (una stringa per riga del PDF). */
export function leggiEstratto(linee: string[]): EstrattoLetto {
  const testo = linee.join("\n");

  const cf = (testo.toUpperCase().match(RE_CF) || [])[1] || "";
  const dalCf = cf ? daCodiceFiscale(cf) : null;

  // Anagrafica: "Cognome e nome: ROSSI MARIO" oppure "ROSSI MARIO nato/a il ..."
  let cognome = "";
  let nome = "";
  const etichetta = testo.match(/cognome\s*(?:e\s*nome)?\s*:?\s*([A-ZÀ-Ú' ]{3,})\s*(?:\n|nome\s*:?\s*([A-ZÀ-Ú' ]{2,}))/i);
  const natoIl = testo.match(/([A-ZÀ-Ú][A-ZÀ-Ú' ]{3,}?)\s*,?\s+nat[oa](?:\/a)?\s+(?:il|a)\b/);
  if (etichetta && etichetta[2]) {
    cognome = etichetta[1].trim();
    nome = etichetta[2].trim();
  } else {
    const intero = (etichetta?.[1] || natoIl?.[1] || "").replace(/\s+/g, " ").trim();
    if (intero) {
      const parti = intero.split(" ");
      cognome = parti[0];
      nome = parti.slice(1).join(" ");
    }
  }
  const maiuscola = (s: string) => s.toLowerCase().replace(/(^|[\s'])\p{L}/gu, (c) => c.toUpperCase());
  cognome = maiuscola(cognome);
  nome = maiuscola(nome);

  let nascita = dalCf?.nascita || "";
  if (!nascita) {
    const m = testo.match(/nat[oa](?:\/a)?\s+il\s+(\d{2}[/.-]\d{2}[/.-]\d{4})/i);
    if (m) nascita = iso(m[1]);
  }

  const agg = testo.match(/(?:emesso\s+il|(?:aggiornat[oa]|situazione)\s+al)\s+(\d{2}[/.-]\d{2}[/.-]\d{4})/i) || testo.match(/(?:data|del)\s*:?\s*(\d{2}[/.-]\d{2}[/.-]\d{4})/i);
  const dataEstratto = agg ? iso(agg[1]) : "";

  const righe = linee.map(leggiRiga).filter((r): r is RigaEstratto => r !== null);
  return componi({ nome, cognome, codiceFiscale: cf, nascita, sesso: dalCf?.sesso || "", dataEstratto }, righe);
}
