/**
 * Banner "Prossimi pagamenti INPS" (home e articoli) e mese principale della pagina /pagamenti-inps.
 * AGGIORNAMENTO MENSILE: insieme ai mesi di sito/src/pages/pagamenti-inps.astro, aggiornare qui PAG_MESE e PAG_DATE.
 * Solo date già confermate dall'INPS (le stesse fonti della pagina).
 * Il banner mostra da solo le prime 3 date non ancora passate (si ricalcola nel browser del visitatore ogni giorno):
 * se tutte le date sono passate, mostra solo l'invito alla pagina. Così non resta mai una data vecchia.
 */
export const PAG_MESE = "dicembre 2026";

/** da = giorno usato per l'ordine; fino = ultimo giorno in cui la voce è utile (AAAA-MM-GG). */
export const PAG_DATE: { cosa: string; quando: string; da: string; fino: string }[] = [
  { cosa: "Assegno Unico, nuove domande", quando: "ultima settimana di novembre", da: "2026-11-23", fino: "2026-11-30" },
  { cosa: "ADI ricariche", quando: "27 novembre", da: "2026-11-27", fino: "2026-11-27" },
  { cosa: "Pensioni", quando: "1° dicembre", da: "2026-12-01", fino: "2026-12-01" },
  { cosa: "ADI primi pagamenti", quando: "15 dicembre", da: "2026-12-15", fino: "2026-12-15" },
  { cosa: "Assegno Unico", quando: "16 e 17 dicembre", da: "2026-12-16", fino: "2026-12-17" },
  { cosa: "ADI ricariche", quando: "23 dicembre", da: "2026-12-23", fino: "2026-12-23" },
  { cosa: "Assegno Unico, nuove domande", quando: "ultima settimana di dicembre", da: "2026-12-24", fino: "2026-12-31" },
];

/** Categorie degli articoli in cui compare il banner compatto. */
export const PAG_CATEGORIE = ["pensioni", "assegno-unico", "isee-dsu", "naspi-disoccupazione", "red-invciv-accas", "invalidita-civile"];

export function prossimiPagamenti(oggi = new Date(), quanti = 3) {
  const g = oggi.toISOString().slice(0, 10);
  return PAG_DATE.filter((p) => p.fino >= g).sort((a, b) => a.da.localeCompare(b.da)).slice(0, quanti);
}
