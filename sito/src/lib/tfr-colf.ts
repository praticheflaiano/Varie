/**
 * TFR di colf, badanti e baby sitter (lavoro domestico).
 * Regole verificate il 26/11/2026:
 * - CCNL lavoro domestico 28/10/2025, art. 41: retribuzioni dell'anno (compresi tredicesima e valore convenzionale
 *   di vitto e alloggio) diviso 13,5; quote accantonate rivalutate dell'1,5% annuo (riproporzionato a mesi) più il 75%
 *   dell'aumento ISTAT (indice FOI), esclusa la quota dell'anno in corso; anticipo fino al 70% una volta l'anno.
 * - Codice civile art. 2120: frazioni di mese di almeno 15 giorni contano come mese intero.
 * - INPS, scheda "Dimissioni, licenziamento e TFR dei lavoratori domestici" (agg. 3/11/2026): esempio 900 x 13 / 13,5
 *   e tabella delle rivalutazioni 1998-2018 (da qui gli indici 1998-2018); TFR anche per rapporti brevi e se il rapporto
 *   finisce in prova durata almeno 15 giorni; pagamento annuale possibile con l'accordo delle parti.
 * Coefficienti di dicembre 2019-2023: tabella ISTAT pubblicata dalla Camera di Commercio di Cremona; 2024: Webcolf e ANCE;
 * 2025: ANCE e Assolombarda (2,311148). Coefficienti mensili 2026: FiscoeTasse, Webcolf e Rivaluta (ottobre 5,234939).
 * Ogni mese ISTAT pubblica il nuovo indice (verso il 15): aggiungere il coefficiente in COEFF_MESI_2026 (poi 2027...).
 */

export const AGGIORNATO_TFR = "26 novembre 2026";

/** Coefficiente annuo di rivalutazione (dicembre), in percentuale, applicato a fine anno al TFR accumulato fino all'anno prima. */
export const COEFF_DICEMBRE: Record<number, number> = {
  1998: 2.626761, 1999: 3.095745, 2000: 3.538043, 2001: 3.219577, 2002: 3.50431, 2003: 3.200252, 2004: 2.793103,
  2005: 2.952785, 2006: 2.747031, 2007: 3.485981, 2008: 3.036419, 2009: 2.224907, 2010: 2.935935, 2011: 3.880058,
  2012: 3.302885, 2013: 1.922535, 2014: 1.5, 2015: 1.5, 2016: 1.795304, 2017: 2.098205, 2018: 2.24184,
  2019: 1.79383, 2020: 1.5, 2021: 4.359238, 2022: 9.974576, 2023: 1.944162, 2024: 2.320017, 2025: 2.311148,
};

/** Coefficienti mensili dell'anno in corso: il mese M vale per i rapporti che finiscono dal 15 di M al 14 del mese dopo. */
export const ANNO_MESI = 2026;
export const COEFF_MESI: number[] = [0.363025, 0.862716, 1.437346, 2.311729, 2.661543, 2.786543, 3.015144, 3.710988, 4.285618, 5.234939];

/** Coefficienti mensili di anni passati (stessa regola del 15): 2025 da Webcolf, dicembre uguale ad ANCE. */
export const COEFF_MESI_PASSATI: Record<number, number[]> = {
  2025: [0.561772, 0.811564, 1.123752, 1.186356, 1.24896, 1.436356, 1.873336, 1.998336, 2.06094, 1.998752, 2.061356, 2.311148],
};

export const PRIMO_ANNO = 1997;
export const VITTO_MESE_2026 = 6.66 * 30;
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

export interface RigaInput { anno: number; retribuzione?: number; pagato?: number }
export interface InputTfr {
  tipo: "convivente" | "orario";
  mensile?: number;      // conviventi: stipendio lordo al mese
  oraria?: number;       // a ore: paga oraria lorda
  ore?: number;          // a ore: ore a settimana
  inizio: string;        // AAAA-MM-GG
  fine: string;          // AAAA-MM-GG
  righe?: RigaInput[];   // correzioni anno per anno
}
export interface Riga {
  anno: number; mesi: number; retribuzione: number; stimata: boolean; quota: number;
  coeff: number; rivalutazione: number; pagato: number; totale: number; nota?: string;
}
export interface RisultatoTfr { ok: boolean; errore?: string; avvisi: string[]; righe: Riga[]; totale: number; quote: number; rivalutazioni: number; pagato: number }

const r2 = (n: number) => Math.round(n * 100) / 100;
function data(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 ? d : null;
}

/** Mesi da contare nell'anno: un mese conta se è lavorato tutto o per almeno 15 giorni (art. 2120 c.c.). */
export function mesiNellAnno(inizio: Date, fine: Date, anno: number): number {
  let n = 0;
  for (let m = 0; m < 12; m++) {
    const da = new Date(Date.UTC(anno, m, 1));
    const a = new Date(Date.UTC(anno, m + 1, 0));
    const s = inizio > da ? inizio : da;
    const e = fine < a ? fine : a;
    if (e < s) continue;
    const giorni = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
    if (giorni >= 15 || giorni === a.getUTCDate()) n++;
  }
  return n;
}

/** Coefficiente per l'anno in cui il rapporto finisce. */
function coeffFine(fine: Date, avvisi: string[]): { c: number; nota: string } {
  const y = fine.getUTCFullYear();
  let m = fine.getUTCMonth();
  if (fine.getUTCDate() < 15) m -= 1;
  if (m < 0) return { c: 0, nota: "nessuna rivalutazione nell'anno (fine entro il 14 gennaio)" };
  if (y in COEFF_DICEMBRE && m === 11) return { c: COEFF_DICEMBRE[y], nota: "coefficiente di dicembre " + y };
  if (y === ANNO_MESI) {
    if (m < COEFF_MESI.length) return { c: COEFF_MESI[m], nota: "coefficiente di " + MESI[m] + " " + y };
    const u = COEFF_MESI.length - 1;
    avvisi.push(`Il coefficiente ISTAT di ${MESI[m]} ${y} non è ancora uscito: abbiamo usato quello di ${MESI[u]} ${y}. Il valore finale cambierà di poco.`);
    return { c: COEFF_MESI[u], nota: "stima con il coefficiente di " + MESI[u] + " " + y };
  }
  if (COEFF_MESI_PASSATI[y]) return { c: COEFF_MESI_PASSATI[y][m], nota: "coefficiente di " + MESI[m] + " " + y };
  const anni = Object.keys(COEFF_DICEMBRE).map(Number);
  const ultimo = Math.max(...anni);
  if (y <= ultimo && y in COEFF_DICEMBRE) {
    // mese intermedio di un anno passato: stima proporzionale al coefficiente annuo
    const c = COEFF_DICEMBRE[y] * (m + 1) / 12;
    avvisi.push(`Per la fine del rapporto a ${MESI[m]} ${y} abbiamo stimato la rivalutazione in proporzione ai mesi: il coefficiente esatto del mese è nelle tabelle ISTAT.`);
    return { c, nota: "stima in proporzione ai mesi" };
  }
  return { c: 0, nota: "" };
}

export function retribuzioneAnnua(i: InputTfr, mesi: number): number {
  const mensile = i.tipo === "convivente" ? (i.mensile || 0) + VITTO_MESE_2026 : (i.oraria || 0) * (i.ore || 0) * 52 / 12;
  return mensile * mesi * 13 / 12;
}

export function calcolaTfr(i: InputTfr): RisultatoTfr {
  const avvisi: string[] = [];
  const vuoto = (errore: string): RisultatoTfr => ({ ok: false, errore, avvisi, righe: [], totale: 0, quote: 0, rivalutazioni: 0, pagato: 0 });
  const ini = data(i.inizio), fin = data(i.fine);
  if (!ini || !fin) return vuoto("Scrivi la data di inizio e la data di fine del rapporto.");
  if (fin < ini) return vuoto("La data di fine viene prima della data di inizio.");
  if (ini.getUTCFullYear() < PRIMO_ANNO) return vuoto("Per i rapporti iniziati prima del 1997 il TFR segue regole e tabelle diverse: lo calcoliamo noi in ufficio.");
  const maxAnno = ANNO_MESI;
  if (fin.getUTCFullYear() > maxAnno) return vuoto(`Il calcolo arriva fino al 31 dicembre ${maxAnno}.`);
  if (i.tipo === "convivente" && !(i.mensile && i.mensile > 0)) return vuoto("Scrivi lo stipendio lordo al mese.");
  if (i.tipo === "orario" && !((i.oraria || 0) > 0 && (i.ore || 0) > 0)) return vuoto("Scrivi la paga oraria e le ore a settimana.");
  const giorni = Math.round((fin.getTime() - ini.getTime()) / 86400000) + 1;
  if (giorni < 15) avvisi.push("Il rapporto è durato meno di 15 giorni: se è finito durante la prova, secondo l'INPS il TFR spetta solo se la prova è durata almeno 15 giorni.");

  const y0 = ini.getUTCFullYear(), y1 = fin.getUTCFullYear();
  const righe: Riga[] = [];
  let tot = 0, quote = 0, riv = 0, pag = 0;
  for (let y = y0; y <= y1; y++) {
    const mesi = mesiNellAnno(ini, fin, y);
    const over = i.righe?.find((x) => x.anno === y);
    const stimata = !(over?.retribuzione && over.retribuzione >= 0);
    const retr = stimata ? retribuzioneAnnua(i, mesi) : over!.retribuzione!;
    const quota = r2(retr / 13.5);
    let coeff = 0, nota = "";
    if (y > y0) {
      if (y === y1 && !(fin.getUTCMonth() === 11 && fin.getUTCDate() === 31)) { const cf = coeffFine(fin, avvisi); coeff = cf.c; nota = cf.nota; }
      else if (y in COEFF_DICEMBRE) { coeff = COEFF_DICEMBRE[y]; nota = "coefficiente di dicembre " + y; }
      else if (y === ANNO_MESI) { const cf = coeffFine(new Date(Date.UTC(y, 11, 31)), avvisi); coeff = cf.c; nota = cf.nota; }
    }
    const rival = r2(tot * coeff / 100);
    const pagato = Math.max(0, over?.pagato || 0);
    tot = r2(tot + rival + quota - pagato);
    quote += quota; riv += rival; pag += pagato;
    righe.push({ anno: y, mesi, retribuzione: r2(retr), stimata, quota: r2(quota), coeff, rivalutazione: r2(rival), pagato: r2(pagato), totale: r2(tot), nota });
  }
  if (tot < 0) return vuoto("Le somme già pagate superano il TFR maturato: controlla gli importi.");
  if (righe.length > 1 && righe.some((r) => r.stimata)) avvisi.push("Per gli anni passati abbiamo usato la paga di oggi. Se era diversa, correggi la retribuzione dell'anno nella tabella e ricalcola.");
  if (i.tipo === "convivente") avvisi.push("Per chi vive in casa abbiamo aggiunto il valore di vitto e alloggio 2026 (199,80 € al mese): negli anni passati era un po' più basso.");
  return { ok: true, avvisi, righe, totale: r2(tot), quote: r2(quote), rivalutazioni: r2(riv), pagato: r2(pag) };
}
