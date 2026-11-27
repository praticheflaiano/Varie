/**
 * Calcolatori e test gratuiti del sito (27/11/2026). Un solo elenco usato da:
 * - la pagina /calcolatori (gruppi per tema e dati ItemList);
 * - la sezione "Calcola quanto ti spetta" in home (CALCOLATORI_HOME);
 * - il riquadro "Altri calcolatori" in fondo alle pagine (components/tools/AltriCalcolatori.astro).
 *
 * Regole:
 * - Ogni testo riprende la description o l'h1 della pagina dello strumento: nessun dato nuovo.
 * - Quando nasce un calcolatore nuovo (pagine /calcolo-*, /anticipo-naspi, /assegno-vedovanza, /quale-isee,
 *   strumenti dentro le guide NASpI) aggiungerlo qui, nel tema giusto. Aggiungere anche la voce in
 *   src/data/ricerca-sinonimi.ts.
 * - /stima-pensione è a pagamento e resta noindex finché non è attivo (PUBLIC_STIMA_PENSIONE_API):
 *   compare solo quando il servizio è attivo, senza prezzo (non è in /prezzi).
 */

export type TemaCalcolatore = "lavoro" | "famiglia" | "pensioni" | "casa-tasse" | "aiuti-isee" | "colf-badanti";

export interface Tema {
  id: TemaCalcolatore;
  titolo: string;
  /** Icona astro-icon. */
  icona: string;
}

export interface Calcolatore {
  nome: string;
  /** Indirizzo della pagina (può avere un ?parametro). */
  url: string;
  /** Riga descrittiva per la pagina /calcolatori. */
  cosa: string;
  /** Riga breve per le card piccole (home, "Altri calcolatori"). */
  breve: string;
  tema: TemaCalcolatore;
  /** Testo del pulsante. */
  cta: string;
  /** Etichetta sopra il nome (es. "Servizio a pagamento"). */
  nota?: string;
}

const stimaPensioneAttiva = Boolean(import.meta.env.PUBLIC_STIMA_PENSIONE_API);

export const TEMI: Tema[] = [
  { id: "lavoro", titolo: "Lavoro e disoccupazione", icona: "heroicons:briefcase" },
  { id: "famiglia", titolo: "Famiglia e figli", icona: "lucide:baby" },
  { id: "pensioni", titolo: "Pensioni", icona: "heroicons:banknotes" },
  { id: "casa-tasse", titolo: "Casa, tasse e successioni", icona: "heroicons:home" },
  { id: "aiuti-isee", titolo: "Aiuti e ISEE", icona: "heroicons:hand-raised" },
  { id: "colf-badanti", titolo: "Colf e badanti", icona: "lucide:heart-handshake" },
];

const TUTTI: Calcolatore[] = [
  // Lavoro e disoccupazione
  { tema: "lavoro", nome: "Calcolo NASpI", url: "/calcolo-naspi", cta: "Calcola la NASpI", breve: "Quanto prendi e per quanti mesi", cosa: "Quanto prendi di NASpI e per quanti mesi, con i valori INPS 2026." },
  { tema: "lavoro", nome: "Anticipo NASpI", url: "/anticipo-naspi", cta: "Calcola l'anticipo NASpI", breve: "Le due rate se apri un'attività", cosa: "Se apri un'attività: le due rate dell'anticipo, 70% subito e 30% dopo." },
  { tema: "lavoro", nome: "Scadenze della domanda NASpI", url: "/naspi/domanda", cta: "Calcola le scadenze NASpI", breve: "Entro quando fare la domanda", cosa: "Entro quando fare la domanda e da quale giorno parte la NASpI." },
  { tema: "lavoro", nome: "Fondo di garanzia INPS", url: "/naspi/fondo-garanzia-tfr", cta: "Fai la verifica del Fondo", breve: "TFR e stipendi non pagati", cosa: "Il datore è fallito o non paga? Verifica se puoi chiedere TFR e ultimi stipendi all'INPS." },

  // Famiglia e figli
  { tema: "famiglia", nome: "Calcolo Assegno Unico", url: "/calcolo-assegno-unico", cta: "Calcola l'Assegno Unico", breve: "Quanto ti spetta per ogni figlio", cosa: "Quanto ti spetta per ogni figlio con la tabella ufficiale INPS 2026 e le maggiorazioni." },
  { tema: "famiglia", nome: "Maternità e congedi", url: "/calcolo-maternita-congedi", cta: "Calcola maternità e congedi", breve: "Le tue date e quanto prendi", cosa: "Le date di maternità, paternità e congedo parentale, e quanto prendi." },
  { tema: "famiglia", nome: "Congedo parentale", url: "/calcolo-congedo-parentale", cta: "Calcola il congedo parentale", breve: "Quanti mesi ti restano e quanto prendi", cosa: "Quanti mesi ti restano, quanti all'80% e quanti al 30%, fino a quando usarli e quanto prendi." },

  // Pensioni
  { tema: "pensioni", nome: "Assegno di vedovanza", url: "/assegno-vedovanza", cta: "Verifica l'assegno di vedovanza", breve: "Scopri se ti spetta", cosa: "Scopri se ti spetta l'assegno di vedovanza sulla pensione di reversibilità." },
  ...(stimaPensioneAttiva
    ? [{ tema: "pensioni" as const, nome: "Stima e calcolo della pensione", url: "/stima-pensione", cta: "Chiedi la stima della pensione", nota: "Servizio a pagamento", breve: "Date di uscita e importi stimati", cosa: "Dal tuo estratto conto INPS un prospetto in PDF con date di uscita, importi stimati e alternative." }]
    : []),

  // Casa, tasse e successioni
  { tema: "casa-tasse", nome: "Bollo auto Lazio", url: "/calcolo-bollo-auto", cta: "Calcola il bollo auto", breve: "Quanto paghi e se sei esente", cosa: "Quanto paghi di bollo auto nel Lazio con le tariffe 2026, e se sei esente." },
  { tema: "casa-tasse", nome: "Imposte di successione", url: "/calcolo-imposte-successione", cta: "Calcola le imposte di successione", breve: "Quanto paga ogni erede", cosa: "Imposta per ogni erede, ipotecaria, catastale, tasse e bollo della successione." },

  // Aiuti e ISEE
  { tema: "aiuti-isee", nome: "Quale ISEE ti serve", url: "/quale-isee", cta: "Fai il test sull'ISEE", breve: "Il test di un minuto", cosa: "Test di un minuto: ordinario, minorenni, università, sociosanitario, corrente e gli altri." },
  { tema: "aiuti-isee", nome: "Cosa ti spetta", url: "/quale-isee?modo=bonus", cta: "Scopri bonus e aiuti", breve: "Bonus e aiuti per te, in un minuto", cosa: "Test di un minuto: quali bonus e aiuti ti spettano a Roma e nel Lazio." },
  { tema: "aiuti-isee", nome: "Assegno di inclusione (ADI)", url: "/calcolo-assegno-inclusione", cta: "Calcola l'Assegno di inclusione", breve: "Quanto ti spetta di ADI", cosa: "Quanto ti spetta di ADI: scala di equivalenza, reddito familiare dalla DSU e quota affitto." },

  // Colf e badanti
  { tema: "colf-badanti", nome: "Costo di colf e badante", url: "/calcolo-costo-colf-badante", cta: "Calcola il costo di colf e badante", breve: "Stipendio, contributi e TFR", cosa: "Stipendio minimo, tredicesima, contributi INPS e TFR di colf, badante o baby sitter nel 2026." },
  { tema: "colf-badanti", nome: "TFR di colf e badanti", url: "/calcolo-tfr-colf-badanti", cta: "Calcola il TFR di colf e badanti", breve: "Il TFR anno per anno", cosa: "Il TFR anno per anno, con le rivalutazioni ISTAT e gli anticipi già pagati." },
];

/** Tutti i calcolatori visibili (senza quelli non ancora attivi). */
export const CALCOLATORI: Calcolatore[] = TUTTI;

/** I temi con i loro calcolatori, nell'ordine della pagina /calcolatori. Temi vuoti esclusi. */
export const GRUPPI_CALCOLATORI = TEMI.map((t) => ({ ...t, strumenti: CALCOLATORI.filter((c) => c.tema === t.id) })).filter((g) => g.strumenti.length > 0);

/** I quattro calcolatori della home ("Calcola quanto ti spetta"), nell'ordine delle card. */
export const CALCOLATORI_HOME: Calcolatore[] = ["/calcolo-naspi", "/calcolo-assegno-unico", "/calcolo-assegno-inclusione", "/calcolo-maternita-congedi"].map((u) => {
  const c = CALCOLATORI.find((x) => x.url === u);
  if (!c) throw new Error(`CALCOLATORI_HOME: ${u} non è in CALCOLATORI`);
  return c;
});

/** Indirizzo senza ?parametri, #ancora e barra finale. */
export const percorso = (u: string) => u.split(/[?#]/)[0].replace(/\/$/, "") || "/";

/**
 * Calcolatori da proporre in fondo a una pagina: prima quelli dello stesso tema (escluso quello della pagina),
 * poi, se sono pochi, quelli della home e poi gli altri. Al massimo `max`.
 */
export function altriCalcolatori(current: string, max = 4, tema?: TemaCalcolatore): Calcolatore[] {
  const qui = percorso(current);
  const corrente = CALCOLATORI.find((c) => percorso(c.url) === qui);
  // Pagine che non sono calcolatori: le guide NASpI hanno il tema "lavoro".
  const t = tema ?? corrente?.tema ?? (qui === "/naspi" || qui.startsWith("/naspi/") ? "lavoro" : undefined);
  const candidati = [
    ...CALCOLATORI.filter((c) => c.tema === t),
    ...CALCOLATORI_HOME,
    ...CALCOLATORI,
  ];
  const out: Calcolatore[] = [];
  for (const c of candidati) {
    if (percorso(c.url) === qui || out.includes(c)) continue;
    out.push(c);
    if (out.length >= max) break;
  }
  return out;
}
