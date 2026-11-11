// Lettura automatica dell'estratto conto contributivo INPS (PDF) nel browser.
// Il file NON viene inviato a nessun server: il testo si estrae sul dispositivo
// del cliente e da lì si ricavano anagrafica e periodi contributivi.
//
// ATTENZIONE: le regole qui sotto sono euristiche scritte sul formato tipico
// dell'estratto (righe "dal - al - tipo - contributi utili - retribuzione").
// Vanno verificate su estratti reali; tutto ciò che viene letto è mostrato al
// cliente, che lo controlla e lo corregge prima di proseguire.

export interface RigaEstratto {
  dal: string; // ISO
  al: string; // ISO
  tipo: string;
  settimane: number | null;
  importo: number | null;
  figurativa: boolean;
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
}

const MESI_CF = "ABCDEHLMPRST";
const RE_CF = /\b([A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z])\b/;
const RE_DATA = /(\d{2})[/.-](\d{2})[/.-](\d{4})/;
const RE_RIGA = /^\s*(\d{2}[/.-]\d{2}[/.-]\d{4})\s*[-–]?\s*(\d{2}[/.-]\d{2}[/.-]\d{4})\s+(.*)$/;
const RE_IMPORTO = /(?<![\d.,])(\d{1,3}(?:\.\d{3})*,\d{2})(?![\d.,])/;
const RE_FIGURATIVA = /disoccupaz|naspi|aspi\b|mobilit|malattia|maternit|congedo|militare|cassa integr|cig\b|figurativ|infortun/i;

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

  // Tipo di contribuzione = testo prima del primo numero; il primo intero è il
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
  if (/artigian|commercian|coltivator/.test(t)) return "autonomo";
  if (/separata|parasubordinat|collaborator/.test(t)) return "separata";
  if (/pubblic|cpdel|ctps|stato|ex inpdap/.test(t)) return "pubblico";
  if (/dipendent/.test(t)) return "privato";
  return "";
}

/** Interpreta le righe di testo dell'estratto (una stringa per riga del PDF). */
export function leggiEstratto(linee: string[]): EstrattoLetto {
  const testo = linee.join("\n");
  const avvisi: string[] = [];

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

  const agg = testo.match(/(?:aggiornat[oa]|situazione)\s+al\s+(\d{2}[/.-]\d{2}[/.-]\d{4})/i) || testo.match(/(?:data|del)\s*:?\s*(\d{2}[/.-]\d{2}[/.-]\d{4})/i);
  const dataEstratto = agg ? iso(agg[1]) : "";

  const righe = linee.map(leggiRiga).filter((r): r is RigaEstratto => r !== null);
  righe.sort((a, b) => a.dal.localeCompare(b.dal));

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

  const ultima = [...righe].reverse().find((r) => r.tipo);
  const annoPieno = [...anni].reverse().find((a) => a.settimane - a.figurative >= 48 && a.imponibile > 0);

  return {
    nome,
    cognome,
    codiceFiscale: cf,
    nascita,
    sesso: dalCf?.sesso || "",
    dataEstratto,
    righe,
    anni,
    totaleSettimane,
    situazione: ultima ? situazioneDa(ultima.tipo) : "",
    ultimaRetribuzione: annoPieno ? annoPieno.imponibile : null,
    avvisi,
  };
}

/** Ricompone le righe di una pagina dai frammenti di testo di pdf.js (stessa altezza = stessa riga). */
export function righeDaFrammenti(frammenti: { str: string; x: number; y: number }[]): string[] {
  const ordinati = frammenti.filter((f) => f.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  const righe: { y: number; parti: { x: number; str: string }[] }[] = [];
  for (const f of ordinati) {
    const riga = righe.find((r) => Math.abs(r.y - f.y) <= 2.5);
    if (riga) riga.parti.push({ x: f.x, str: f.str });
    else righe.push({ y: f.y, parti: [{ x: f.x, str: f.str }] });
  }
  return righe.map((r) => r.parti.sort((a, b) => a.x - b.x).map((p) => p.str.trim()).join(" "));
}

/** Legge un PDF nel browser e restituisce i dati dell'estratto. */
export async function leggiEstrattoPdf(file: File): Promise<EstrattoLetto> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const linee: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n);
    const contenuto = await pagina.getTextContent();
    const frammenti = contenuto.items
      .filter((i): i is typeof i & { str: string; transform: number[] } => "str" in i)
      .map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5] }));
    linee.push(...righeDaFrammenti(frammenti));
  }
  const letto = leggiEstratto(linee);
  if (!linee.some((l) => l.trim())) letto.avvisi.unshift("Il PDF non contiene testo leggibile: sembra una scansione. Scarica l'estratto direttamente dal sito INPS.");
  return letto;
}
