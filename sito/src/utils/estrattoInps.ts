// Lettura dell'estratto conto contributivo INPS (PDF) lato browser: estrae il testo con
// pdf.js e, come riserva quando la lettura con AI non è disponibile, lo interpreta con le
// regole euristiche di estrattoModel.ts.
import { leggiEstratto, type EstrattoLetto } from "../../api/_lib/estrattoModel";
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

/** Estrae dal PDF le righe di testo (una stringa per riga). Vuoto se il PDF è una scansione. */
export async function testoDaPdf(file: File): Promise<string[]> {
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
  return linee.filter((l) => l.trim());
}

/** Lettura locale di riserva (regole euristiche). */
export function leggiEstrattoLocale(linee: string[]): EstrattoLetto {
  const letto = leggiEstratto(linee);
  if (!linee.length) letto.avvisi.unshift("Il PDF non contiene testo leggibile: sembra una scansione. Scarica l'estratto direttamente dal sito INPS.");
  return letto;
}
