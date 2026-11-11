// Lettura dell'estratto conto contributivo INPS (PDF) lato browser: pdf.js estrae i frammenti di
// testo con la loro posizione e estrattoModel.ts li ricompone in righe e colonne (lettura diretta).
// Se il PDF non ha testo (scansione) si passa alla lettura con AI sul server; come ultima riserva,
// la lettura per righe di testo.
import { leggiEstratto, leggiEstrattoDaCelle, type Cella, type EstrattoLetto } from "../../api/_lib/estrattoModel";
export * from "../../api/_lib/estrattoModel";

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

export interface PdfLetto {
  /** Frammenti di testo con posizione "a schermo" (y verso il basso), per la lettura diretta. */
  celle: Cella[];
  pagine: number;
  /** Una stringa per riga del PDF, per la lettura di riserva e per l'invio del solo testo. */
  linee: string[];
}

/** Estrae dal PDF i frammenti di testo con la loro posizione. Nessun frammento se il PDF è una scansione. */
export async function leggiPdf(file: File): Promise<PdfLetto> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const celle: Cella[] = [];
  const linee: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n);
    // La vista tiene conto della rotazione della pagina (l'estratto INPS è ruotato di 90°):
    // dopo la trasformazione x va da sinistra a destra e y dall'alto in basso, come si legge.
    const vista = pagina.getViewport({ scale: 1 });
    const contenuto = await pagina.getTextContent();
    const diPagina = contenuto.items
      .filter((i): i is typeof i & { str: string; transform: number[] } => "str" in i && !!i.str.trim())
      .map((i) => {
        const [x, y] = pdfjs.Util.transform(vista.transform, i.transform).slice(4);
        return { p: n - 1, x, y, t: i.str.trim() };
      });
    celle.push(...diPagina);
    linee.push(...righeDaFrammenti(diPagina.map((c) => ({ str: c.t, x: c.x, y: -c.y }))));
  }
  return { celle, pagine: doc.numPages, linee: linee.filter((l) => l.trim()) };
}

/** Estrae dal PDF le righe di testo (una stringa per riga). Vuoto se il PDF è una scansione. */
export async function testoDaPdf(file: File): Promise<string[]> {
  return (await leggiPdf(file)).linee;
}

/** Lettura diretta dalle celle: valida (`completa`) solo se il PDF ha testo e ogni riga è stata letta per intero. */
export function leggiEstrattoDiretto(pdf: PdfLetto): EstrattoLetto | null {
  if (!pdf.celle.length) return null;
  const letto = leggiEstrattoDaCelle(pdf.celle, pdf.pagine);
  return letto.completa ? letto : null;
}

/** Lettura locale di riserva (regole euristiche). */
export function leggiEstrattoLocale(linee: string[]): EstrattoLetto {
  const letto = { ...leggiEstratto(linee), lettura: "locale" as const };
  if (!linee.length) letto.avvisi.unshift("Il PDF non contiene testo leggibile: sembra una scansione. Scarica l'estratto direttamente dal sito INPS.");
  return letto;
}
