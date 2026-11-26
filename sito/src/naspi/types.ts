export enum TerminationReason {
    INVOLUNTARY = 'Licenziamento Involontario / Scadenza Contratto',
    VOLUNTARY = 'Dimissioni Volontarie',
    CONSENSUAL = 'Risoluzione Consensuale',
}

export enum VoluntaryException {
    NONE = 'Nessuna eccezione',
    JUST_CAUSE = 'Giusta Causa',
    PROTECTED_PERIOD = 'Periodo Tutelato (es. Maternità)',
}

export type CalculatorMode = 'forecast' | 'analysis';
export type Page = 'home' | 'calculator' | 'guide' | 'office' | 'apply' | 'anticipo' | 'privacy' | 'obligations' | 'guide-book';

export interface UserInputData {
    /** Età alla data della domanda NASpI (art. 4, c. 3, d.lgs. 22/2015). */
    age: number;
    weeksWorkedLast4Years: number;
    totalGrossWagesLast4Years: number;
    terminationReason: TerminationReason;
    voluntaryException: VoluntaryException;
    /** Non più usato: il requisito delle 30 giornate non vale per gli eventi dal 1/1/2022 (art. 3, c. 1-bis, d.lgs. 22/2015). */
    hasWorked30DaysLastYear: boolean;
    terminationDate: string;
    /**
     * Settimane già usate per una precedente indennità di disoccupazione negli ultimi 4 anni:
     * non contano per la durata (art. 5 d.lgs. 22/2015). Facoltativo.
     */
    weeksAlreadyUsed?: number;
    /**
     * Requisito dal 1/1/2025 (art. 3, c. 1, lett. c-bis, d.lgs. 22/2015, aggiunta da L. 207/2024, art. 1, c. 171; circ. INPS 98/2025):
     * nei 12 mesi prima della perdita del lavoro ti sei dimesso (o hai firmato una risoluzione consensuale) da un altro
     * lavoro a tempo indeterminato? Facoltativo: se manca, il risultato riporta solo un avviso.
     */
    resignedPermanentJobLast12Months?: boolean;
    /** Settimane di contributi dalla data di quelle dimissioni alla perdita del lavoro: ne servono almeno 13. */
    weeksSinceResignation?: number;
    approvedStartDate?: string;
    approvedDaysDuration?: number;
    approvedMonthlyAmount?: number;
}

export interface MonthlyPayment {
    monthYear: string;
    grossAmount: number;
    netAmount: number;
    reductionApplied: boolean;
    reductionPercentage: number;
    daysPaid: number;
    estimatedPaymentDate: string;
    isFuture?: boolean;
    dateObj?: Date;
}

export interface NaspiResult {
    isEligible: boolean;
    ineligibilityReason?: string;
    /** true se il calcolo non è partito perché mancano dati (non è un "non spetta"). */
    missingData?: boolean;
    durationWeeks: number;
    totalDaysDuration: number;
    grossMonthlyAmount: number;
    startDate: string;
    endDate: string;
    schedule: MonthlyPayment[];
    calculationDetails: {
        averageMonthlyWage: number;
        referenceWage: number;
    };
    /** Avvisi da mostrare sotto il risultato (dati corretti, casi da verificare). */
    warnings?: string[];
    /** Ultimo giorno utile per la domanda: 68 giorni dalla cessazione (art. 6, c. 1, d.lgs. 22/2015). */
    applicationDeadline?: string;
    /** Primo giorno con la riduzione del 3% (151° giorno, o 211° da 55 anni). Vuoto se la NASpI finisce prima. */
    firstReductionDate?: string;
}

export interface ExtractedData {
    weeks?: number;
    wages?: number;
    startDate?: string;
    days?: number;
    monthlyAmount?: number;
    avvisi?: string[];
    periodo?: { dal: string; al: string };
    errore?: string;
}

export interface AnticipoInput {
    naspiStartDate: string;
    totalDays: number;
    monthlyGrossAmount: number;
    anticipoRequestDate: string;
    /** Età alla data della domanda NASpI: da 55 anni la riduzione del 3% parte dall'8° mese invece che dal 6°. */
    age?: number;
}

export interface AnticipoResult {
    totalGrossAmount: number;
    estimatedTax: number;
    estimatedNetAmount: number;
    daysRemaining: number;
    lastDayCovered: string;
    /** Prima rata: 70% del lordo residuo (art. 8, c. 3-bis, d.lgs. 22/2015). */
    firstInstallment: number;
    /** Seconda rata: 30% del lordo residuo. */
    secondInstallment: number;
    /** Ultimo giorno del periodo teorico NASpI (YYYY-MM-DD). */
    naspiEndDate: string;
    /** Data entro cui è prevista la seconda rata: fine periodo teorico, al massimo 6 mesi dalla domanda (YYYY-MM-DD). */
    secondInstallmentBy: string;
    /** Messaggio se il calcolo non si può fare (es. domanda dopo la fine della NASpI). */
    error?: string;
}
