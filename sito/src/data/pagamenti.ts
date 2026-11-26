/**
 * Banner "Pagamenti INPS" (home e articoli) e titolo del mese della pagina /pagamenti-inps.
 * AGGIORNAMENTO MENSILE: insieme alle righe di sito/src/pages/pagamenti-inps.astro, cambiare qui
 * PAG_MESE, PAG_PROSSIMI e PAG_VALIDO_FINO. Solo date già confermate da INPS (le stesse fonti della pagina).
 * Dopo PAG_VALIDO_FINO il banner nasconde le date e mostra solo l'invito alla pagina: così non resta mai una data vecchia.
 */
export const PAG_MESE = "dicembre 2026";

/** Massimo 3-4 voci brevi, nell'ordine del calendario. */
export const PAG_PROSSIMI: { cosa: string; quando: string }[] = [
  { cosa: "Pensioni", quando: "1° dicembre" },
  { cosa: "ADI", quando: "15 e 23 dicembre" },
  { cosa: "Assegno Unico", quando: "16 e 17 dicembre" },
];

/** Ultimo giorno in cui le date del banner sono valide (fine del mese). */
export const PAG_VALIDO_FINO = "2026-12-31";

/** Categorie degli articoli in cui compare il banner compatto. */
export const PAG_CATEGORIE = ["pensioni", "assegno-unico", "isee-dsu", "naspi-disoccupazione", "red-invciv-accas", "invalidita-civile"];

export function pagamentiAggiornati(oggi = new Date()): boolean {
  return oggi.toISOString().slice(0, 10) <= PAG_VALIDO_FINO;
}
