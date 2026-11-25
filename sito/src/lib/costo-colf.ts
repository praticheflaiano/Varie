/**
 * Costo di colf, badanti e baby sitter 2026 (lavoro domestico).
 * Dati verificati il 25/11/2026 su:
 * - Ministero del Lavoro, tabella minimi retributivi lavoro domestico, decorrenza 1/1/2026
 *   (Commissione nazionale, accordo dell'11/2/2026): tabelle A, B, C, F, H, I.
 * - CCNL lavoro domestico 28/10/2025 (in vigore 1/11/2025-31/10/2028): art. 9 livelli, art. 14 orari,
 *   art. 34 indennità, art. 36 vitto e alloggio (valori mensili = giornalieri x 30), art. 39 tredicesima,
 *   art. 41 TFR (retribuzioni dell'anno + vitto e alloggio convenzionale, diviso 13,5), art. 54 Cassa Colf 0,06 €/h (0,02 lavoratore).
 * - INPS, circolare n. 9 del 3/2/2026 (contributi orari 2026) e scheda "Contributi e agevolazioni fiscali per chi
 *   assume un lavoratore domestico" (paga oraria effettiva = paga + vitto e alloggio per ora + tredicesima per ora;
 *   oltre 24 ore settimanali contributo fisso; deduzione contributi fino a 1.549,37 €).
 * Ogni gennaio-febbraio: aggiornare minimi (nuova tabella Ministero) e contributi (nuova circolare INPS).
 */

export const ANNO = 2026;
export const AGGIORNATO = "25 novembre 2026";

export type Livello = "A" | "AS" | "B" | "BS" | "C" | "CS" | "D" | "DS";
export type Tipo = "convivente" | "convivente30" | "orario";

export const LIVELLI: { id: Livello; nome: string; esempi: string }[] = [
  { id: "A", nome: "A", esempi: "solo pulizie, solo lavanderia, aiuto cucina (senza assistenza a persone)" },
  { id: "AS", nome: "A super", esempi: "solo compagnia a un adulto autosufficiente" },
  { id: "B", nome: "B", esempi: "colf: pulizie, cucina, lavanderia insieme; custode, autista, giardiniere" },
  { id: "BS", nome: "B super", esempi: "badante di persona autosufficiente; baby sitter" },
  { id: "C", nome: "C", esempi: "cuoco" },
  { id: "CS", nome: "C super", esempi: "badante di persona non autosufficiente, senza diploma" },
  { id: "D", nome: "D", esempi: "governante, maggiordomo, amministratore dei beni di famiglia" },
  { id: "DS", nome: "D super", esempi: "badante di persona non autosufficiente con diploma (almeno 500 ore)" },
];

// Tabella A: conviventi, valori mensili (D e DS comprendono l'indennità di funzione di 207,69 €)
export const MENSILE_CONVIVENTI: Record<Livello, number> = {
  A: 908.10, AS: 958.55, B: 983.16, BS: 1053.39, C: 1123.63, CS: 1193.84, D: 1404.51 + 207.69, DS: 1474.73 + 207.69,
};
export const INDENNITA_FUNZIONE = 207.69;
// Tabella B: conviventi fino a 30 ore settimanali (art. 14 c. 2: solo livelli B, B super, C)
export const MENSILE_CONVIVENTI_30: Partial<Record<Livello, number>> = { B: 702.25, BS: 737.39, C: 814.60 };
// Tabella C: non conviventi, valori orari
export const ORARIA: Record<Livello, number> = {
  A: 6.51, AS: 6.76, B: 7.01, BS: 7.45, C: 7.86, CS: 8.30, D: 9.57, DS: 9.97,
};
// Tabella F: vitto e alloggio, valore giornaliero (pranzo/colazione 2,33 + cena 2,33 + alloggio 2,00)
export const VITTO_ALLOGGIO_GIORNO = 6.66;
// Tabella H: baby sitter (B super, profilo b) con bambini fino a 6 anni
export const IND_BABYSITTER = { convivente: 138.54, convivente30: 97.06, orario: 0.84 };
// Tabella I: C super o D super che assiste più di una persona non autosufficiente
export const IND_PIU_ASSISTITI = { mensile: 119.66, orario: 0.70 };

// INPS circolare 9/2026: contributo orario con CUAF [soglia paga effettiva, totale, quota lavoratore]
const FASCE = [
  { fino: 9.61, tot: 1.70, totTD: 1.82, lav: 0.43 },
  { fino: 11.70, tot: 1.92, totTD: 2.05, lav: 0.48 },
  { fino: Infinity, tot: 2.34, totTD: 2.50, lav: 0.59 },
];
const OLTRE_24 = { tot: 1.24, totTD: 1.32, lav: 0.31 };
export const CASSA_COLF = { tot: 0.06, lav: 0.02 };
export const DEDUZIONE_MAX = 1549.37;

export interface Input {
  tipo: Tipo;
  livello: Livello;
  ore: number;            // ore settimanali
  giorni?: number;        // giorni di lavoro a settimana (serve solo per conviventi sotto le 25 ore)
  paga?: number;          // paga concordata: mensile (conviventi) o oraria (a ore). Vuota = minimo
  termine?: boolean;      // contratto a tempo determinato
  babysitter?: boolean;   // baby sitter con bambini fino a 6 anni (solo B super)
  piuAssistiti?: boolean; // più di una persona non autosufficiente (solo C super / D super)
}

export interface Risultato {
  ok: boolean;
  errore?: string;
  avvisi: string[];
  minimo: number;          // minimo contrattuale (mensile o orario) senza indennità
  pagaBase: number;        // paga usata (mensile o orario)
  indennita: number;       // indennità mensili o orarie aggiunte
  mensileLorda: number;    // stipendio lordo medio al mese
  tredicesima: number;
  vittoMese: number;       // valore convenzionale mensile del vitto e alloggio (solo conviventi)
  pagaOrariaEffettiva: number;
  contributoOrario: number;
  contributoLav: number;   // quota oraria a carico del lavoratore
  oreAnno: number;
  contributiTot: number;
  contributiDatore: number;
  contributiLav: number;
  cassaDatore: number;
  cassaLav: number;
  tfr: number;
  costoAnno: number;       // tutto quello che spende la famiglia in un anno (esclusi vitto e alloggio dati in natura)
  costoMese: number;
  nettoMese: number;       // stipendio medio al netto dei contributi trattenuti
  deducibile: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function calcola(i: Input): Risultato {
  const avvisi: string[] = [];
  const vuoto = { ok: false, avvisi, minimo: 0, pagaBase: 0, indennita: 0, mensileLorda: 0, tredicesima: 0, vittoMese: 0, pagaOrariaEffettiva: 0, contributoOrario: 0, contributoLav: 0, oreAnno: 0, contributiTot: 0, contributiDatore: 0, contributiLav: 0, cassaDatore: 0, cassaLav: 0, tfr: 0, costoAnno: 0, costoMese: 0, nettoMese: 0, deducibile: 0 };
  const ore = Number(i.ore);
  if (!(ore > 0)) return { ...vuoto, errore: "Scrivi quante ore lavora a settimana." };
  if (i.tipo === "convivente" && ore > 54) return { ...vuoto, errore: "Per chi vive in casa il contratto prevede al massimo 54 ore a settimana (10 al giorno)." };
  if (i.tipo === "convivente30" && ore > 30) return { ...vuoto, errore: "Con questo tipo di convivenza l'orario arriva al massimo a 30 ore a settimana." };
  if (i.tipo === "orario" && ore > 40) avvisi.push("Per chi non vive in casa l'orario normale arriva a 40 ore a settimana: le ore in più si pagano con le maggiorazioni dello straordinario, non calcolate qui.");

  const conv = i.tipo !== "orario";
  let minimo: number;
  if (i.tipo === "convivente") minimo = MENSILE_CONVIVENTI[i.livello];
  else if (i.tipo === "convivente30") {
    const m = MENSILE_CONVIVENTI_30[i.livello];
    if (m === undefined) return { ...vuoto, errore: "La convivenza fino a 30 ore è prevista solo per i livelli B, B super e C." };
    minimo = m;
  } else minimo = ORARIA[i.livello];

  let pagaBase = minimo;
  if (i.paga && i.paga > 0) {
    if (i.paga + 1e-9 < minimo) avvisi.push(`La paga che hai scritto è sotto il minimo del contratto (${minimo.toFixed(2).replace(".", ",")} €): il calcolo usa il minimo.`);
    else pagaBase = i.paga;
  }

  let indennita = 0;
  if (i.babysitter) {
    if (i.livello === "BS") indennita += IND_BABYSITTER[i.tipo];
    else avvisi.push("L'indennità per i bambini fino a 6 anni spetta solo alla baby sitter di livello B super: non è stata aggiunta.");
  }
  if (i.piuAssistiti) {
    if ((i.livello === "CS" || i.livello === "DS") && i.tipo !== "convivente30") indennita += i.tipo === "orario" ? IND_PIU_ASSISTITI.orario : IND_PIU_ASSISTITI.mensile;
    else avvisi.push("L'indennità per più persone non autosufficienti spetta ai livelli C super e D super: non è stata aggiunta.");
  }

  const settimaneMese = 52 / 12;
  const mensileLorda = conv ? pagaBase + indennita : (pagaBase + indennita) * ore * settimaneMese;
  const vittoMese = conv ? VITTO_ALLOGGIO_GIORNO * 30 : 0;
  const tredicesima = mensileLorda + vittoMese;

  // Paga oraria effettiva INPS: paga oraria + vitto e alloggio per ora + tredicesima per ora
  const pagaOraria = conv ? (mensileLorda * 12) / (52 * ore) : pagaBase + indennita;
  const giorni = Math.min(7, Math.max(1, Number(i.giorni) || 6));
  const vittoOra = conv ? (VITTO_ALLOGGIO_GIORNO * giorni) / ore : 0;
  const pagaOrariaEffettiva = (pagaOraria + vittoOra) * 13 / 12;

  let f: { tot: number; totTD: number; lav: number };
  if (ore > 24) f = OLTRE_24;
  else f = FASCE.find((x) => pagaOrariaEffettiva <= x.fino)!;
  const contributoOrario = i.termine ? f.totTD : f.tot;
  const oreAnno = ore * 52;
  const contributiTot = contributoOrario * oreAnno;
  const contributiLav = f.lav * oreAnno;
  const contributiDatore = contributiTot - contributiLav;
  const cassaDatore = (CASSA_COLF.tot - CASSA_COLF.lav) * oreAnno;
  const cassaLav = CASSA_COLF.lav * oreAnno;

  const annuoRetribuzioni = mensileLorda * 12 + tredicesima + vittoMese * 12;
  const tfr = annuoRetribuzioni / 13.5;
  const costoAnno = mensileLorda * 12 + tredicesima + contributiDatore + cassaDatore + tfr;
  const nettoMese = mensileLorda - (contributiLav + cassaLav) / 12;

  if (conv && ore <= 24) avvisi.push(`Sotto le 25 ore il contributo dipende anche dai giorni di lavoro: abbiamo usato ${giorni} giorni a settimana.`);
  if (i.livello === "D" || i.livello === "DS") { if (i.tipo === "convivente") avvisi.push("Per i livelli D e D super il minimo comprende l'indennità di funzione di 207,69 € al mese."); }

  return {
    ok: true, avvisi, minimo, pagaBase, indennita,
    mensileLorda: r2(mensileLorda), tredicesima: r2(tredicesima), vittoMese: r2(vittoMese),
    pagaOrariaEffettiva: r2(pagaOrariaEffettiva), contributoOrario, contributoLav: f.lav, oreAnno,
    contributiTot: r2(contributiTot), contributiDatore: r2(contributiDatore), contributiLav: r2(contributiLav),
    cassaDatore: r2(cassaDatore), cassaLav: r2(cassaLav), tfr: r2(tfr),
    costoAnno: r2(costoAnno), costoMese: r2(costoAnno / 12), nettoMese: r2(nettoMese),
    deducibile: r2(Math.min(contributiDatore, DEDUZIONE_MAX)),
  };
}

export function eur(n: number): string {
  const p = (Math.round(n * 100) / 100).toFixed(2).split(".");
  return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + p[1] + " €";
}
