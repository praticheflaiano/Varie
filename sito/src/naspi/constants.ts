// Parametri NASpI ufficiali 2026 (rivalutazione ISTAT +1,4%)
// Fonte: INPS - Circolari di inizio anno 2026. Verificare annualmente.
export const NASPI_CONSTANTS = {
    THRESHOLD_AMOUNT: 1456.72,
    MAX_MONTHLY_CAP: 1584.70,
    COEFF_WEEKS_TO_MONTHS: 4.33,
    PERCENTAGE_BASE: 0.75,
    PERCENTAGE_EXCESS: 0.25,
    REDUCTION_START_MONTH: 6,
    REDUCTION_START_MONTH_OVER_55: 8,
    REDUCTION_PERCENTAGE: 0.03,
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
export const LAST_UPDATED = "2026-11-25";
