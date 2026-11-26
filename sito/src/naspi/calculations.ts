/**
 * Calcoli NASpI e anticipo NASpI. Regole verificate il 26/11/2026 su fonti ufficiali:
 * - d.lgs. 22/2015 (testo vigente): art. 3 requisiti (13 settimane in 4 anni; 30 giornate non più richieste dal 2022,
 *   c. 1-bis aggiunto da L. 234/2021, art. 1, c. 221, lett. b; lett. c-bis dal 2025, L. 207/2024, art. 1, c. 171;
 *   c. 2 giusta causa e risoluzione consensuale nella procedura dell'art. 7 L. 604/1966), art. 4 misura e riduzione,
 *   art. 5 durata (metà delle settimane dei 4 anni, senza quelle già usate per altre indennità), art. 6 domanda entro
 *   68 giorni e decorrenza dall'8° giorno dopo la cessazione o dal giorno dopo la domanda, art. 8 anticipazione.
 * - circolare INPS 94/2015: riduzione dal "91° giorno" (vecchio 4° mese), quindi mesi di fruizione da 30 giorni;
 *   importo giornaliero = mensile / 30.
 * - circolare INPS 2/2022: dal 2022 riduzione dal 151° giorno (6° mese), dal 211° (8° mese) se 55 anni alla domanda.
 * - circolare INPS 98/2025: requisito delle 13 settimane dopo dimissioni da un tempo indeterminato nei 12 mesi prima.
 * - circolare INPS 4/2026: importi 2026 (constants.ts).
 * - messaggio INPS 1215 del 7/4/2026 e art. 8, c. 3-bis, d.lgs. 22/2015 (L. 199/2025, art. 1, c. 176): anticipo in due
 *   rate, 70% alla liquidazione e 30% alla fine del periodo teorico NASpI, comunque entro 6 mesi dalla domanda.
 * - messaggio INPS 3649 del 10/11/2026: anticipazione NASpI a tassazione separata (art. 17 TUIR).
 * Non verificato su fonte ufficiale: se la riduzione del 3% si calcola sul mese precedente (composta, come qui)
 * o sempre sull'importo iniziale. Le differenze sono di pochi euro al mese.
 */
import { NASPI_CONSTANTS, IRPEF_BRACKETS_2026 } from "./constants";
import { TerminationReason, VoluntaryException } from "./types";
import type { NaspiResult, UserInputData, MonthlyPayment, AnticipoInput, AnticipoResult } from "./types";

const DAY_MS = 1000 * 60 * 60 * 24;

/** Legge "AAAA-MM-GG" come data locale (new Date("2026-03-01") sarebbe mezzanotte UTC e può spostare il giorno). */
export const parseISODate = (iso: string): Date => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || '').trim());
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Date(NaN);
};

const addDays = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const toISO = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return "Data non valida";
    return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

const formatMonthYear = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return "N/A";
    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(date);
};

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Numero valido e non negativo, altrimenti 0. */
const safeNum = (n: unknown): number => (typeof n === 'number' && isFinite(n) && n > 0 ? n : 0);

/**
 * Legge un importo scritto all'italiana: "1.300,50", "1300,50", "1300.50", "45.000", "€ 1.300". Restituisce NaN se non è un numero.
 * Un solo punto seguito da esattamente 3 cifre è letto come separatore delle migliaia ("45.000" = 45000).
 * Da usare con campi type="text" inputMode="decimal": un campo type="number" scarta o fraintende "45.000".
 */
export const parseItNumber = (raw: string): number => {
    let s = String(raw ?? '').replace(/[€\s ]/g, '');
    if (!s) return NaN;
    if (s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
        s = s.replace(/\./g, '');
    }
    if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
    return parseFloat(s);
};

const calculateEstimatedNet = (grossAmount: number, daysPaid: number): number => {
    if (!grossAmount || grossAmount <= 0 || !daysPaid || daysPaid <= 0) return 0;
    const projectedAnnualIncome = (grossAmount / daysPaid) * 365;
    const { FIRST_LIMIT, SECOND_LIMIT, FIRST_RATE, SECOND_RATE, THIRD_RATE,
            BASE_DETRACTION, DETRACTION_DECAY_15K_28K_BASE, DETRACTION_DECAY_15K_28K_BONUS,
            DETRACTION_DECAY_28K_50K_BASE } = IRPEF_BRACKETS_2026;

    const firstBracketTax = FIRST_LIMIT * FIRST_RATE;
    const secondBracketTax = firstBracketTax + (SECOND_LIMIT - FIRST_LIMIT) * SECOND_RATE;

    let annualTax = 0;
    if (projectedAnnualIncome <= FIRST_LIMIT) {
        annualTax = projectedAnnualIncome * FIRST_RATE;
    } else if (projectedAnnualIncome <= SECOND_LIMIT) {
        annualTax = firstBracketTax + ((projectedAnnualIncome - FIRST_LIMIT) * SECOND_RATE);
    } else {
        annualTax = secondBracketTax + ((projectedAnnualIncome - SECOND_LIMIT) * THIRD_RATE);
    }

    let annualDetraction = 0;
    if (projectedAnnualIncome <= 15000) {
        annualDetraction = BASE_DETRACTION;
    } else if (projectedAnnualIncome <= FIRST_LIMIT) {
        annualDetraction = DETRACTION_DECAY_15K_28K_BASE +
            (DETRACTION_DECAY_15K_28K_BONUS * ((FIRST_LIMIT - projectedAnnualIncome) / 13000));
    } else if (projectedAnnualIncome <= SECOND_LIMIT) {
        annualDetraction = DETRACTION_DECAY_28K_50K_BASE *
            ((SECOND_LIMIT - projectedAnnualIncome) / (SECOND_LIMIT - FIRST_LIMIT));
    }

    const netAnnualTax = Math.max(0, annualTax - annualDetraction);
    const effectiveTaxRate = netAnnualTax / projectedAnnualIncome;
    return round2(grossAmount * (1 - effectiveTaxRate));
};

/** Mese di riduzione da cui parte il 3%: 6° mese, 8° se 55 anni alla data della domanda. */
const reductionStartMonth = (age: number): number =>
    safeNum(age) >= 55 ? NASPI_CONSTANTS.REDUCTION_START_MONTH_OVER_55 : NASPI_CONSTANTS.REDUCTION_START_MONTH;

/**
 * Coefficiente di riduzione per il giorno di fruizione dayIndex (0 = primo giorno).
 * Mesi di fruizione da 30 giorni: il 6° mese inizia al 151° giorno (dayIndex 150).
 */
const reductionFactor = (dayIndex: number, startMonth: number): number => {
    const fruitionMonth = Math.floor(dayIndex / NASPI_CONSTANTS.DAYS_PER_MONTH) + 1;
    if (fruitionMonth < startMonth) return 1;
    return Math.pow(1 - NASPI_CONSTANTS.REDUCTION_PERCENTAGE, fruitionMonth - startMonth + 1);
};

/** Importo lordo di ogni giorno di NASpI, dal primo giorno (dayIndex 0) all'ultimo. */
const dailyAmounts = (totalDaysDuration: number, baseMonthlyAmount: number, age: number): number[] => {
    const daily = baseMonthlyAmount / NASPI_CONSTANTS.DAYS_PER_MONTH;
    const startMonth = reductionStartMonth(age);
    const out: number[] = [];
    for (let i = 0; i < totalDaysDuration; i++) out.push(daily * reductionFactor(i, startMonth));
    return out;
};

const generateSchedule = (startDateObj: Date, totalDaysDuration: number, baseMonthlyAmount: number, age: number): MonthlyPayment[] => {
    const schedule: MonthlyPayment[] = [];
    if (isNaN(startDateObj.getTime()) || totalDaysDuration <= 0 || baseMonthlyAmount <= 0) return schedule;

    const amounts = dailyAmounts(totalDaysDuration, baseMonthlyAmount, age);
    const startMonth = reductionStartMonth(age);
    let i = 0;
    while (i < totalDaysDuration) {
        const first = addDays(startDateObj, i);
        const lastDayOfMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
        const daysInThisMonth = Math.min(lastDayOfMonth - first.getDate() + 1, totalDaysDuration - i);

        let gross = 0;
        for (let k = i; k < i + daysInThisMonth; k++) gross += amounts[k];
        // Riduzione mostrata: quella dell'ultimo giorno del mese (la più alta del mese).
        const lastFactor = reductionFactor(i + daysInThisMonth - 1, startMonth);
        const reductionApplied = lastFactor < 1;

        schedule.push({
            monthYear: formatMonthYear(first),
            grossAmount: round2(gross),
            netAmount: calculateEstimatedNet(gross, daysInThisMonth),
            reductionApplied,
            reductionPercentage: reductionApplied ? Math.round((1 - lastFactor) * 100) : 0,
            daysPaid: daysInThisMonth,
            estimatedPaymentDate: formatDate(new Date(first.getFullYear(), first.getMonth() + 1, 15)),
            dateObj: first,
        });
        i += daysInThisMonth;
    }
    return schedule;
};

const emptyResult = (reason: string, warnings: string[] = []): NaspiResult => ({
    isEligible: false, ineligibilityReason: reason, missingData: reason.startsWith('Inserisci'), durationWeeks: 0, totalDaysDuration: 0, grossMonthlyAmount: 0,
    startDate: "", endDate: "", schedule: [], calculationDetails: { averageMonthlyWage: 0, referenceWage: 0 }, warnings,
});

/** Importo mensile lordo iniziale dalla retribuzione media mensile (art. 4, cc. 1-2). */
export const monthlyAmountFromAverageWage = (averageMonthlyWage: number): number => {
    const { THRESHOLD_AMOUNT, PERCENTAGE_BASE, PERCENTAGE_EXCESS, MAX_MONTHLY_CAP } = NASPI_CONSTANTS;
    const w = safeNum(averageMonthlyWage);
    const base = w <= THRESHOLD_AMOUNT
        ? w * PERCENTAGE_BASE
        : THRESHOLD_AMOUNT * PERCENTAGE_BASE + (w - THRESHOLD_AMOUNT) * PERCENTAGE_EXCESS;
    return Math.min(base, MAX_MONTHLY_CAP);
};

const commonDates = (startDateObj: Date, totalDays: number, age: number) => {
    const endDateObj = addDays(startDateObj, totalDays - 1);
    const reductionDay = (reductionStartMonth(age) - 1) * NASPI_CONSTANTS.DAYS_PER_MONTH; // 150 o 210
    return {
        endDate: formatDate(endDateObj),
        firstReductionDate: reductionDay < totalDays ? formatDate(addDays(startDateObj, reductionDay)) : "",
    };
};

export const calculateNaspiEligibility = (data: UserInputData): NaspiResult => {
    const { terminationReason, voluntaryException, terminationDate } = data;
    const age = safeNum(data.age);
    const warnings: string[] = [];
    const termDateObj = parseISODate(terminationDate);

    if (isNaN(termDateObj.getTime())) {
        return emptyResult("Inserisci la data in cui è finito il lavoro.");
    }

    // Stato di disoccupazione involontaria (art. 3, cc. 1-2).
    if (terminationReason === TerminationReason.VOLUNTARY && voluntaryException === VoluntaryException.NONE) {
        return emptyResult(
            "Con le dimissioni volontarie la NASpI non spetta. Spetta invece se ti sei dimesso per giusta causa " +
            "(per esempio stipendi non pagati o trasferimento senza motivo) o durante il periodo tutelato di maternità " +
            "o paternità: in questi casi scrivici, controlliamo noi."
        );
    }
    if (terminationReason === TerminationReason.CONSENSUAL) {
        warnings.push(
            "Con la risoluzione consensuale la NASpI spetta solo se è firmata nella procedura di conciliazione " +
            "all'Ispettorato del lavoro (art. 7 legge 604/1966) o dopo il rifiuto di un trasferimento a più di 50 km " +
            "(o 80 minuti con i mezzi pubblici). Negli altri casi la domanda viene respinta."
        );
    }

    // Settimane: 13 minimo, 208 massimo (4 anni).
    let weeks = Math.floor(safeNum(data.weeksWorkedLast4Years));
    if (weeks > NASPI_CONSTANTS.MAX_WEEKS_4_YEARS) {
        warnings.push(`In 4 anni ci sono al massimo ${NASPI_CONSTANTS.MAX_WEEKS_4_YEARS} settimane: abbiamo usato ${NASPI_CONSTANTS.MAX_WEEKS_4_YEARS}. Controlla che anche la retribuzione sia solo quella degli ultimi 4 anni.`);
        weeks = NASPI_CONSTANTS.MAX_WEEKS_4_YEARS;
    }
    if (weeks < NASPI_CONSTANTS.MIN_WEEKS) {
        return emptyResult(weeks === 0
            ? "Inserisci le settimane di contributi degli ultimi 4 anni: ne servono almeno 13."
            : `Servono almeno 13 settimane di contributi negli ultimi 4 anni: ne hai indicate ${weeks}.`);
    }

    // Requisito dal 2025: 13 settimane dopo dimissioni da un tempo indeterminato nei 12 mesi precedenti (art. 3, c. 1, lett. c-bis).
    if (termDateObj >= new Date(2025, 0, 1)) {
        if (data.resignedPermanentJobLast12Months === true) {
            const since = data.weeksSinceResignation;
            if (typeof since === 'number' && isFinite(since) && since < NASPI_CONSTANTS.MIN_WEEKS) {
                return emptyResult(
                    "Nei 12 mesi prima della perdita del lavoro ti eri dimesso da un lavoro a tempo indeterminato: dal 2025 " +
                    `servono almeno 13 settimane di contributi da quelle dimissioni, ne hai indicate ${Math.max(0, Math.floor(since))}. ` +
                    "Non conta se quelle dimissioni erano per giusta causa o nel periodo tutelato di maternità o paternità."
                );
            }
            if (typeof since !== 'number' || !isFinite(since)) {
                warnings.push("Ti eri dimesso da un lavoro a tempo indeterminato nei 12 mesi prima: servono almeno 13 settimane di contributi da quelle dimissioni.");
            }
        } else if (data.resignedPermanentJobLast12Months === undefined) {
            warnings.push(
                "Dal 2025, se nei 12 mesi prima della perdita del lavoro ti eri dimesso da un altro lavoro a tempo " +
                "indeterminato, servono almeno 13 settimane di contributi dopo quelle dimissioni."
            );
        }
    }

    // Retribuzione media mensile (art. 4, c. 1).
    const wages = safeNum(data.totalGrossWagesLast4Years);
    if (wages <= 0) {
        return emptyResult("Inserisci la retribuzione imponibile degli ultimi 4 anni (la trovi nell'estratto conto contributivo INPS).");
    }
    const averageMonthlyWage = (wages / weeks) * NASPI_CONSTANTS.COEFF_WEEKS_TO_MONTHS;
    if (averageMonthlyWage < 100) {
        warnings.push("La retribuzione media risulta molto bassa: controlla di aver scritto l'imponibile senza punto delle migliaia (es. 45000, non 45.000).");
    }
    const baseGrossMonthly = round2(monthlyAmountFromAverageWage(averageMonthlyWage));

    // Durata (art. 5): metà delle settimane, senza quelle già usate per altre indennità.
    const used = Math.min(Math.floor(safeNum(data.weeksAlreadyUsed)), weeks);
    const durationWeeks = Math.min((weeks - used) / 2, NASPI_CONSTANTS.MAX_WEEKS_4_YEARS / 2);
    const totalDaysDuration = Math.floor(durationWeeks * 7);
    if (totalDaysDuration <= 0) {
        return emptyResult("Le settimane degli ultimi 4 anni hanno già dato diritto a un'altra indennità di disoccupazione: non resta durata da pagare.", warnings);
    }

    // Decorrenza (art. 6, c. 2) e termine della domanda (art. 6, c. 1).
    const startDateObj = addDays(termDateObj, NASPI_CONSTANTS.START_DAYS_AFTER_TERMINATION);
    const deadlineObj = addDays(termDateObj, NASPI_CONSTANTS.APPLICATION_DEADLINE_DAYS);
    warnings.push(`Le date valgono se presenti la domanda entro il giorno ${formatDate(startDateObj)}: se la presenti dopo, la NASpI parte dal giorno successivo alla domanda. Ultimo giorno utile per la domanda: ${formatDate(deadlineObj)}.`);

    return {
        isEligible: true,
        durationWeeks,
        totalDaysDuration,
        grossMonthlyAmount: baseGrossMonthly,
        startDate: formatDate(startDateObj),
        ...commonDates(startDateObj, totalDaysDuration, age),
        schedule: generateSchedule(startDateObj, totalDaysDuration, baseGrossMonthly, age),
        calculationDetails: { averageMonthlyWage: round2(averageMonthlyWage), referenceWage: round2(averageMonthlyWage) },
        warnings,
        applicationDeadline: formatDate(deadlineObj),
    };
};

export const calculateNaspiFromDecree = (data: UserInputData): NaspiResult => {
    const age = safeNum(data.age);
    const days = Math.floor(safeNum(data.approvedDaysDuration));
    const monthly = safeNum(data.approvedMonthlyAmount);
    const startDateObj = parseISODate(data.approvedStartDate || '');
    if (isNaN(startDateObj.getTime()) || days <= 0 || monthly <= 0) {
        return emptyResult("Inserisci data di decorrenza, giorni spettanti e importo mensile lordo come scritti nella lettera INPS.");
    }
    const warnings: string[] = [];
    if (monthly > NASPI_CONSTANTS.MAX_MONTHLY_CAP) {
        warnings.push(`L'importo supera il massimo NASpI 2026 (${NASPI_CONSTANTS.MAX_MONTHLY_CAP.toFixed(2).replace('.', ',')} € al mese): controlla di aver copiato l'importo mensile e non un totale.`);
    }
    if (monthly < 50) {
        warnings.push("L'importo mensile è molto basso: controlla di averlo scritto senza punto delle migliaia (es. 1200, non 1.200).");
    }
    if (days > (NASPI_CONSTANTS.MAX_WEEKS_4_YEARS / 2) * 7) {
        warnings.push("La NASpI dura al massimo 728 giorni (104 settimane): controlla i giorni spettanti.");
    }

    return {
        isEligible: true,
        durationWeeks: round2(days / 7),
        totalDaysDuration: days,
        grossMonthlyAmount: round2(monthly),
        startDate: formatDate(startDateObj),
        ...commonDates(startDateObj, days, age),
        schedule: generateSchedule(startDateObj, days, monthly, age),
        calculationDetails: { averageMonthlyWage: 0, referenceWage: 0 },
        warnings,
    };
};

/**
 * Anticipo NASpI (art. 8 d.lgs. 22/2015): NASpI spettante e non ancora erogata, dal giorno della domanda di anticipo
 * (compreso) alla fine del periodo, con la riduzione del 3% che sarebbe scattata nei mesi residui.
 * Dal 2026: 70% alla liquidazione, 30% alla fine del periodo teorico e comunque entro 6 mesi dalla domanda.
 */
export const calculateAnticipo = (input: AnticipoInput): AnticipoResult => {
    const startDate = parseISODate(input.naspiStartDate);
    const requestDate = parseISODate(input.anticipoRequestDate);
    const totalDays = Math.floor(safeNum(input.totalDays));
    const monthly = safeNum(input.monthlyGrossAmount);
    const age = safeNum(input.age ?? 40);

    const empty = (error: string, endDate?: Date): AnticipoResult => ({
        totalGrossAmount: 0, estimatedTax: 0, estimatedNetAmount: 0, daysRemaining: 0,
        lastDayCovered: endDate ? formatDate(endDate) : "", firstInstallment: 0, secondInstallment: 0,
        naspiEndDate: endDate ? toISO(endDate) : "", secondInstallmentBy: "", error,
    });

    if (isNaN(startDate.getTime()) || isNaN(requestDate.getTime()) || totalDays <= 0 || monthly <= 0) {
        return empty("Compila i campi per vedere le due rate.");
    }
    if (monthly < 10) {
        return empty("L'importo mensile sembra troppo basso: scrivilo senza punto delle migliaia (es. 1200, non 1.200).");
    }
    const endDate = addDays(startDate, totalDays - 1);
    if (requestDate < startDate) {
        return empty("La data della domanda di anticipo non può essere prima dell'inizio della NASpI.", endDate);
    }
    if (requestDate > endDate) {
        return empty(`La NASpI finisce il ${formatDate(endDate)}: dopo quella data non resta nulla da anticipare.`, endDate);
    }

    const amounts = dailyAmounts(totalDays, monthly, age);
    const firstIndex = Math.round((requestDate.getTime() - startDate.getTime()) / DAY_MS);
    let totalGross = 0;
    for (let i = firstIndex; i < totalDays; i++) totalGross += amounts[i];
    const remainingDays = totalDays - firstIndex;

    const gross = round2(totalGross);
    const first = round2(gross * 0.7);
    const estimatedTax = round2(gross * NASPI_CONSTANTS.SEPARATE_TAXATION_RATE_ESTIMATE);
    const sixMonths = new Date(requestDate.getFullYear(), requestDate.getMonth() + 6, requestDate.getDate());
    const secondBy = endDate < sixMonths ? endDate : sixMonths;
    return {
        totalGrossAmount: gross,
        estimatedTax,
        estimatedNetAmount: round2(gross - estimatedTax),
        daysRemaining: remainingDays,
        lastDayCovered: formatDate(endDate),
        firstInstallment: first,
        secondInstallment: round2(gross - first),
        naspiEndDate: toISO(endDate),
        secondInstallmentBy: toISO(secondBy),
    };
};
