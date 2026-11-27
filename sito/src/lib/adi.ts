/**
 * Calcolo dell'Assegno di inclusione (ADI): valori e regole in vigore nel 2026 (verificati il 27/11/2026).
 *
 * Fonti:
 * - D.L. 4 maggio 2023, n. 48, artt. 1-3 e 6 (testo come convertito e come modificato dalla L. 207/2024, art. 1, c. 198,
 *   e dalla L. 199/2025, cc. 158 e 208): dossier Camera A.C. 1238 (D23048b) pp. 19-26 e 41; dossier legge di bilancio 2025 pp. 312-316.
 * - INPS, messaggio n. 148 del 15/01/2025 (soglie 2025: ISEE 10.140, reddito 6.500 / 8.190, affitto 3.640 / 1.950).
 * - INPS, notizia del 20/02/2025 (esempi: reddito 0 + affitto 4.500 = 10.140 €/anno; reddito 8.140 + affitto 3.640 = 3.640 €/anno).
 * - INPS, slide "Inps in rete per l'inclusione" del 14/01/2025, slide 8 e 12 (reddito familiare; formula
 *   [(6.500 x scala - reddito familiare) + canone] : 12; minimo 480 € l'anno).
 * - INPS, tutorial "Invio domanda ADI" (chi prende il valore 1 della scala; esempi 1,3 / 1,4 / 1,9 / 1,7 / 2,05).
 * - INPS, scheda ADI aggiornata al 29/07/2026 (esclusi dal reddito i trattamenti per disabilità; patrimoni).
 * - Ministero del Lavoro, notizia del 12/01/2026 (dal 2026 niente mese di stop: la prima rata del rinnovo è al 50%).
 *
 * Punti interpretativi (scritti come "stima" nella pagina):
 * - la soglia di 10.140 € per chi è in affitto serve solo per l'accesso ed è trattata come importo fisso
 *   (se 6.500 x scala è più alta, vale quella);
 * - lo 0,4 per i carichi di cura si somma anche all'adulto che prende il valore 1 (esempio INPS "2,05");
 * - il reddito familiare si ricostruisce dalla DSU come spiegato nella pagina (l'INPS non pubblica una formula scritta).
 * Ogni gennaio controllare se le soglie cambiano (legge di bilancio / messaggio INPS).
 */

export const ADI_AGGIORNATO = "27 novembre 2026";
export const ADI = {
  isee: 10140,
  soglia: 6500,
  sogliaAnziani: 8190,
  sogliaAffittoAccesso: 10140,
  affittoMax: 3640,
  affittoMaxAnziani: 1950,
  minimoAnnuo: 480,
  scalaMax: 2.2,
  scalaMaxGrave: 2.3,
  immobiliare: 30000,
  casaEsclusa: 150000,
  franchigiaLavoro: 3000,
} as const;

export type Disabilita = "no" | "media" | "grave" | "nonauto";
export interface Adulto {
  eta: number; // anni compiuti
  disabilita: Disabilita;
  svantaggio?: boolean; // grave disagio bio-psico-sociale in un programma di cura certificato
}
export interface NucleoInput {
  adulti: Adulto[];
  minori: number;
  minoreSotto3?: boolean;
  disabiliMinori?: Disabilita[]; // disabilità dei minori (per i carichi di cura e il tetto 2,3)
  carichiDiCura?: boolean; // c'è un adulto che si occupa della cura (se ne ricorrono le condizioni)
}
export interface EconomiaInput {
  isee: number;
  redditoFamiliare: number;
  canoneAnnuo: number; // 0 se non in affitto
  patrimonioMobiliare?: number;
  patrimonioImmobiliare?: number; // esclusa la casa di abitazione
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Coefficiente proprio di un adulto (prima di scegliere chi prende il valore 1). */
function pesoAdulto(a: Adulto): { peso: number; voce: string } {
  if (a.disabilita !== "no") return { peso: 0.5, voce: "con disabilità o non autosufficiente" };
  if (a.eta >= 60) return { peso: 0.4, voce: "di 60 anni o più" };
  if (a.svantaggio) return { peso: 0.3, voce: "in condizione di svantaggio certificata" };
  return { peso: 0, voce: "" };
}

export interface ScalaRisultato {
  ok: boolean;
  errore?: string;
  scala: number;
  righe: { voce: string; valore: number }[];
  tetto: number;
  anziani: boolean;
  carichiPossibili: boolean;
}

export function calcolaScala(n: NucleoInput): ScalaRisultato {
  const adulti = n.adulti ?? [];
  const minori = Math.max(0, Math.floor(n.minori || 0));
  const disMin = (n.disabiliMinori ?? []).filter((d) => d !== "no");
  const vuoto: ScalaRisultato = { ok: false, scala: 0, righe: [], tetto: ADI.scalaMax, anziani: false, carichiPossibili: false };
  if (adulti.length === 0) return { ...vuoto, errore: "Nel nucleo serve almeno un maggiorenne: l'ADI lo chiede un adulto." };

  const qualifica = minori > 0 || adulti.some((a) => a.eta >= 60 || a.disabilita !== "no" || a.svantaggio) || disMin.length > 0;
  if (!qualifica) return { ...vuoto, errore: "L'ADI spetta solo se nel nucleo c'è almeno un minorenne, una persona di 60 anni o più, una persona con disabilità o una persona in condizione di svantaggio certificata. Per gli altri c'è il Supporto formazione e lavoro (SFL)." };

  const pesi = adulti.map((a, i) => ({ i, ...pesoAdulto(a) }));
  // Il valore 1 va all'adulto con il peso minore (tutorial INPS).
  const base = [...pesi].sort((a, b) => a.peso - b.peso)[0];
  const righe: { voce: string; valore: number }[] = [{ voce: "Richiedente / primo adulto", valore: 1 }];
  for (const p of pesi) {
    if (p.i === base.i || p.peso === 0) continue;
    righe.push({ voce: "Adulto " + p.voce, valore: p.peso });
  }
  for (let k = 0; k < minori; k++) righe.push({ voce: k < 2 ? "Minorenne (primo e secondo)" : "Minorenne dal terzo", valore: k < 2 ? 0.15 : 0.1 });

  const disabileInNucleo = adulti.some((a) => a.disabilita !== "no") || disMin.length > 0;
  const carichiPossibili = !!n.minoreSotto3 || minori >= 3 || disabileInNucleo;
  if (carichiPossibili && n.carichiDiCura) righe.push({ voce: "Un adulto con carichi di cura", valore: 0.4 });

  const grave = adulti.some((a) => a.disabilita === "grave" || a.disabilita === "nonauto") || disMin.some((d) => d === "grave" || d === "nonauto");
  const tetto = grave ? ADI.scalaMaxGrave : ADI.scalaMax;
  const somma = r2(righe.reduce((s, x) => s + x.valore, 0));
  const scala = Math.min(somma, tetto);

  // Soglia 8.190: tutti di almeno 67 anni, oppure over 67 con altri componenti tutti con disabilità grave o non autosufficienti.
  const over67 = adulti.filter((a) => a.eta >= 67).length;
  const altriGravi = adulti.filter((a) => a.eta < 67).every((a) => a.disabilita === "grave" || a.disabilita === "nonauto");
  const anziani = minori === 0 && over67 > 0 && altriGravi;

  return { ok: true, scala, righe, tetto, anziani, carichiPossibili };
}

export function massimaleMobiliare(componenti: number, minori: number, disabili: number, gravi: number): number {
  const base = Math.min(6000 + 2000 * Math.max(0, componenti - 1), 10000);
  return base + 1000 * Math.max(0, minori - 2) + 5000 * disabili + 7500 * gravi;
}

export interface AdiRisultato {
  ammesso: boolean;
  motivi: string[]; // perché non spetta
  avvisi: string[];
  scala: number;
  sogliaBase: number; // 6.500 o 8.190
  sogliaReddito: number; // sogliaBase x scala
  sogliaAccesso: number; // con l'eventuale soglia affitto
  quotaA: number;
  quotaB: number;
  annuo: number;
  mensile: number;
  primaRataRinnovo: number;
  minimoApplicato: boolean;
}

export function calcolaAdi(n: NucleoInput, e: EconomiaInput): AdiRisultato & { scalaDett: ScalaRisultato } {
  const s = calcolaScala(n);
  const motivi: string[] = [];
  const avvisi: string[] = [];
  const out = (x: Partial<AdiRisultato>) => ({ ammesso: false, motivi, avvisi, scala: s.scala, sogliaBase: 0, sogliaReddito: 0, sogliaAccesso: 0, quotaA: 0, quotaB: 0, annuo: 0, mensile: 0, primaRataRinnovo: 0, minimoApplicato: false, ...x, scalaDett: s });
  if (!s.ok) { motivi.push(s.errore || "Composizione del nucleo non valida."); return out({}); }

  const sogliaBase = s.anziani ? ADI.sogliaAnziani : ADI.soglia;
  const sogliaReddito = r2(sogliaBase * s.scala);
  const inAffitto = e.canoneAnnuo > 0;
  const sogliaAccesso = inAffitto ? Math.max(sogliaReddito, ADI.sogliaAffittoAccesso) : sogliaReddito;

  if (!(e.isee >= 0) || e.isee > ADI.isee) motivi.push(`L'ISEE supera ${eurA(ADI.isee)}: con questo ISEE l'ADI non spetta.`);
  if (!(e.redditoFamiliare < sogliaAccesso)) motivi.push(`Il reddito familiare (${eurA(e.redditoFamiliare)}) non è sotto la soglia di ${eurA(sogliaAccesso)}.`);

  const componenti = n.adulti.length + (n.minori || 0);
  const disMin = (n.disabiliMinori ?? []);
  const disabili = n.adulti.filter((a) => a.disabilita === "media").length + disMin.filter((d) => d === "media").length;
  const gravi = n.adulti.filter((a) => a.disabilita === "grave" || a.disabilita === "nonauto").length + disMin.filter((d) => d === "grave" || d === "nonauto").length;
  const maxMob = massimaleMobiliare(componenti, n.minori || 0, disabili, gravi);
  if (e.patrimonioMobiliare !== undefined && e.patrimonioMobiliare > maxMob) motivi.push(`Il patrimonio mobiliare (conti, libretti, titoli) supera il limite di ${eurA(maxMob)} per il tuo nucleo.`);
  if (e.patrimonioImmobiliare !== undefined && e.patrimonioImmobiliare > ADI.immobiliare) motivi.push(`Il patrimonio immobiliare (esclusa la casa dove abiti) supera ${eurA(ADI.immobiliare)}.`);

  const quotaA = r2(Math.max(0, sogliaReddito - e.redditoFamiliare));
  const quotaB = inAffitto ? r2(Math.min(e.canoneAnnuo, s.anziani ? ADI.affittoMaxAnziani : ADI.affittoMax)) : 0;
  let annuo = r2(quotaA + quotaB);
  let minimoApplicato = false;
  if (motivi.length === 0 && annuo < ADI.minimoAnnuo) { annuo = ADI.minimoAnnuo; minimoApplicato = true; }
  const mensile = r2(annuo / 12);

  if (s.scala < r2(s.righe.reduce((a, x) => a + x.valore, 0))) avvisi.push(`La scala è stata ridotta al massimo previsto (${String(s.tetto).replace(".", ",")}).`);
  if (disMin.some((d) => d !== "no")) avvisi.push("Per il minorenne con disabilità abbiamo contato il valore dei minorenni (0,15): la legge prevede 0,5 per ogni componente con disabilità, quindi la scala e l'importo potrebbero essere più alti. Lo verifichiamo con te.");
  if (inAffitto && e.redditoFamiliare >= sogliaReddito && motivi.length === 0) avvisi.push("Il reddito è sopra la soglia base ma sotto quella per chi è in affitto: spetta solo la parte per l'affitto.");

  return out({ ammesso: motivi.length === 0, sogliaBase, sogliaReddito, sogliaAccesso, quotaA, quotaB, annuo: motivi.length ? 0 : annuo, mensile: motivi.length ? 0 : mensile, primaRataRinnovo: motivi.length ? 0 : r2(mensile / 2), minimoApplicato });
}

/** Reddito familiare ADI ricostruito dai dati della DSU (vedi spiegazione nella pagina). */
export function redditoFamiliareDaDsu(x: { redditiDsu: number; trattamentiDaTogliere: number; aiutiInCorso: number; pensioniNuove: number }): number {
  return r2(Math.max(0, (x.redditiDsu || 0) - (x.trattamentiDaTogliere || 0)) + (x.aiutiInCorso || 0) + (x.pensioniNuove || 0));
}

/** Legge un importo scritto all'italiana ("1.234,56", "1234,5", "1234") o vuoto. 0 è valido. */
export function leggiEuro(testo: string): number | undefined {
  let s = String(testo ?? "").replace(/[€\s]/g, "");
  if (!s) return undefined;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export function eurA(n: number): string {
  const [i, d] = (Math.round(n * 100) / 100).toFixed(2).split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + d + " €";
}
