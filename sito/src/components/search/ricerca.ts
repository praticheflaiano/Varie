/**
 * Confronto tra quello che la persona scrive e le parole di `src/data/ricerca-sinonimi.ts`.
 * Usato da /cerca ("Forse cerchi", pagine suggerite, parole in più per Pagefind)
 * e dalla casella di ricerca (suggerimenti mentre scrivi). Solo dati locali: nessuna richiesta.
 */
import { VOCI_RICERCA, SUGGERITE_DEFAULT, type VoceRicerca, type TipoVoce } from "~/data/ricerca-sinonimi";

export type { VoceRicerca, TipoVoce };
export { SUGGERITE_DEFAULT };

export const ETICHETTA_TIPO: Record<TipoVoce, string> = { servizio: "Servizio", calcolatore: "Calcolatore", guida: "Guida" };

const STOP = new Set(
  ("a ad al allo ai agli alla alle con col da dal dallo dai dagli dalla dalle di del dello dei degli della delle " +
    "e ed il lo la i gli le l un uno una in nel nello nella nei negli nelle per su sul sulla sui tra fra o che come " +
    "mi ti si ci mio mia miei mie tuo tua cosa cos ho ha hai sono d c").split(" "),
);

/** Minuscole, senza accenti né punteggiatura. */
export function norm(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Parole utili della frase (senza articoli e preposizioni). */
export function parole(s: string): string[] {
  return norm(s).split(" ").filter((t) => t && !STOP.has(t));
}

/** Radice grezza: "pensione" e "pensioni", "costa" e "costo" diventano uguali. */
function radice(t: string): string {
  return t.length >= 5 ? t.replace(/[aeiou]+$/, "") : t;
}

function uguali(a: string, b: string): boolean {
  return a === b || (a.length >= 5 && b.length >= 5 && radice(a) === radice(b));
}

/** Distanza di modifica (errori di battitura), fermata appena supera `max`. */
function distanza(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prec = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let minRiga = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prec[j] + 1, cur[j - 1] + 1, prec[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < minRiga) minRiga = cur[j];
    }
    if (minRiga > max) return max + 1;
    prec = cur;
  }
  return prec[b.length];
}

function simile(a: string, b: string): boolean {
  if (a.length < 5 || b.length < 5) return false;
  return distanza(a, b, b.length >= 8 ? 2 : 1) <= (b.length >= 8 ? 2 : 1);
}

interface Indicizzata { voce: VoceRicerca; ordine: number; frasi: string[][]; titolo: string[] }
let indice: Indicizzata[] | null = null;
function voci(): Indicizzata[] {
  if (!indice) indice = VOCI_RICERCA.map((voce, ordine) => ({ voce, ordine, frasi: voce.parole.map(parole).filter((p) => p.length), titolo: parole(voce.titolo) }));
  return indice;
}

export interface Corrispondenza { voce: VoceRicerca; punti: number }

interface Opzioni {
  /** Accetta parole scritte a metà ("disoc" → disoccupazione). */
  parziali?: boolean;
  /** Lunghezza minima di una parola scritta a metà. */
  minParziale?: number;
  /** Accetta piccoli errori di battitura. */
  errori?: boolean;
  /** Cerca anche nei titoli delle voci (solo parole intere o a metà). */
  titoli?: boolean;
}

function puntiFrase(q: string[], p: string[], o: Opzioni): number {
  let best = 0;
  // La frase è tutta dentro la ricerca: "bonus luce" in "bonus luce 2027".
  if (p.every((b) => q.some((a) => uguali(a, b)))) best = 10 * p.length + (p.length === q.length ? 3 : 0);
  // Con errori di battitura: "disocupazione".
  else if (o.errori && p.every((b) => q.some((a) => uguali(a, b) || simile(a, b)))) best = 5 * p.length;
  // Ricerca scritta a metà: ogni parola scritta è l'inizio di una parola della frase.
  if (o.parziali) {
    const min = o.minParziale ?? 3;
    // Un punto in più se la frase ha tante parole quante la ricerca ("pens" → "pensione" prima di "pensione minima").
    if (q.every((a) => p.some((b) => uguali(a, b) || (a.length >= min && b.startsWith(a))))) best = Math.max(best, 4 * q.length + (p.length === q.length ? 1 : 0));
  }
  return best;
}

/** Voci che corrispondono alla ricerca, dalla più vicina. Una sola voce per indirizzo. */
export function trovaVoci(testo: string, o: Opzioni = {}): Corrispondenza[] {
  const q = parole(testo);
  if (!q.length) return [];
  const perUrl = new Map<string, Corrispondenza & { ordine: number }>();
  for (const v of voci()) {
    let punti = 0;
    for (const p of v.frasi) punti = Math.max(punti, puntiFrase(q, p, o));
    if (o.titoli && v.titolo.length) {
      const min = o.minParziale ?? 3;
      if (q.every((a) => v.titolo.some((b) => uguali(a, b) || (a.length >= min && b.startsWith(a))))) punti = Math.max(punti, 3 * q.length);
    }
    if (!punti) continue;
    const prima = perUrl.get(v.voce.url);
    if (!prima || punti > prima.punti) perUrl.set(v.voce.url, { voce: v.voce, punti, ordine: prima ? Math.min(prima.ordine, v.ordine) : v.ordine });
  }
  return [...perUrl.values()].sort((x, y) => y.punti - x.punti || x.ordine - y.ordine).map(({ voce, punti }) => ({ voce, punti }));
}

/** Riquadro "Forse cerchi": al massimo 3 voci, solo quelle vicine alla migliore. */
export function forseCerchi(testo: string, max = 3): Corrispondenza[] {
  const tutte = trovaVoci(testo, { parziali: true, errori: true });
  if (!tutte.length) return [];
  const soglia = tutte[0].punti * 0.4;
  return tutte.filter((c) => c.punti >= soglia).slice(0, max);
}

/**
 * Termini principali da cercare anche con Pagefind. Un termine già scritto si cerca da solo lo stesso
 * se la ricerca ha altre parole ("quanto costa isee" cerca anche "isee"); mai uguale alla ricerca.
 */
export function terminiInPiu(testo: string, corr: Corrispondenza[], max = 3): string[] {
  const scritto = norm(testo);
  const out: string[] = [];
  for (const c of corr) {
    const t = c.voce.parole[0];
    if (!t || out.includes(t)) continue;
    if (norm(t) === scritto || parole(t).join(" ") === parole(scritto).join(" ")) continue;
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

/** Suggerimenti mentre scrivi (casella di ricerca): parole a metà anche da 2 lettere, anche nei titoli. */
export function suggerisci(testo: string, max = 6): VoceRicerca[] {
  if (norm(testo).replace(/ /g, "").length < 2) return [];
  return trovaVoci(testo, { parziali: true, minParziale: 2, errori: true, titoli: true }).slice(0, max).map((c) => c.voce);
}

/** Pagine da proporre quando la ricerca non trova nulla: le più vicine, poi quelle di base. */
export function pagineSuggerite(testo: string, max = 5): VoceRicerca[] {
  const vicine = trovaVoci(testo, { parziali: true, errori: true, titoli: true }).map((c) => c.voce);
  const out: VoceRicerca[] = [];
  for (const v of [...vicine, ...SUGGERITE_DEFAULT]) {
    if (out.some((x) => x.url === v.url)) continue;
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

/** Calcolatori: pagine con uno strumento di calcolo. */
export function tipoDaUrl(url: string): TipoVoce {
  if (/^\/(calcolo-|anticipo-naspi|stima-pensione|quale-isee|assegno-vedovanza)/.test(url)) return "calcolatore";
  if (/^\/blog\//.test(url) || /^\/naspi\/./.test(url)) return "guida";
  return "servizio";
}
