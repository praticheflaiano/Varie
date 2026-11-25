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
    age: number;
    weeksWorkedLast4Years: number;
    totalGrossWagesLast4Years: number;
    terminationReason: TerminationReason;
    voluntaryException: VoluntaryException;
    hasWorked30DaysLastYear: boolean;
    terminationDate: string;
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
    /** Età alla cessazione: da 55 anni la riduzione del 3% parte dall'8° mese invece che dal 6°. */
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
}
