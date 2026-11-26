// Parametri NASpI 2026. Verificati il 26/11/2026 su:
// - circolare INPS n. 4 del 28/01/2026, par. 6: retribuzione di riferimento 1.456,72 €, importo massimo mensile 1.584,70 €
//   https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-4-del-28-01-2026_15147.html
// - d.lgs. 22/2015, art. 4 (4,33; 75%; 25% dell'eccedenza; riduzione 3% dal 6° mese, dall'8° per chi ha 55 anni
//   alla data della domanda: art. 1, c. 221, lett. c, L. 234/2021)
// - circolare INPS 94/2015: riduzione dal "91° giorno" con la vecchia regola del 4° mese, quindi mesi di 30 giorni:
//   6° mese = dal 151° giorno, 8° mese = dal 211° giorno (circ. INPS 2/2022); divisore 30 per l'importo giornaliero.
// Da aggiornare ogni gennaio con la nuova circolare INPS sugli importi massimi (e cambiare LAST_UPDATED).
export const NASPI_CONSTANTS = {
    THRESHOLD_AMOUNT: 1456.72,
    MAX_MONTHLY_CAP: 1584.70,
    COEFF_WEEKS_TO_MONTHS: 4.33,
    PERCENTAGE_BASE: 0.75,
    PERCENTAGE_EXCESS: 0.25,
    /** Requisito minimo: 13 settimane di contributi nei 4 anni (art. 3, c. 1, lett. b). */
    MIN_WEEKS: 13,
    /** 4 anni = al massimo 208 settimane; durata massima quindi 104 settimane (art. 5). */
    MAX_WEEKS_4_YEARS: 208,
    /** Giorni di un "mese di fruizione" e divisore dell'importo giornaliero (circ. INPS 94/2015). */
    DAYS_PER_MONTH: 30,
    REDUCTION_START_MONTH: 6,
    REDUCTION_START_MONTH_OVER_55: 8,
    REDUCTION_PERCENTAGE: 0.03,
    /** La NASpI parte dall'8° giorno dopo la cessazione se la domanda è presentata entro quella data (art. 6, c. 2). */
    START_DAYS_AFTER_TERMINATION: 8,
    /** Termine di decadenza per la domanda: 68 giorni dalla cessazione (art. 6, c. 1). */
    APPLICATION_DEADLINE_DAYS: 68,
    /**
     * Ritenuta stimata sull'anticipo. L'INPS considera l'anticipazione NASpI soggetta a tassazione separata
     * (art. 17 TUIR: messaggio INPS n. 3649 del 10/11/2026, par. 2), con aliquota che dipende dai redditi
     * dei due anni precedenti: il 23% (prima aliquota IRPEF) è solo un'ipotesi per la stima.
     */
    SEPARATE_TAXATION_RATE_ESTIMATE: 0.23,
};

// Scaglioni IRPEF 2026 (L. 199/2025 - Legge di Bilancio 2026)
// Seconda fascia ridotta dal 35% al 33%.
export const IRPEF_BRACKETS_2026 = {
    FIRST_LIMIT: 28000,
    SECOND_LIMIT: 50000,
    FIRST_RATE: 0.23,
    SECOND_RATE: 0.33,
    THIRD_RATE: 0.43,
    // Detrazioni lavoro dipendente (no tax area 8.500 €)
    BASE_DETRACTION: 1955,
    DETRACTION_DECAY_15K_28K_BASE: 1910,
    DETRACTION_DECAY_15K_28K_BONUS: 1190,
    DETRACTION_DECAY_28K_50K_BASE: 1910,
};

export const REFERENCE_YEAR = 2026;
export const LAST_UPDATED = "2026-11-26";
