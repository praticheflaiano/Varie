import { NASPI_CONSTANTS, IRPEF_BRACKETS_2026 } from "./constants";
import { TerminationReason, VoluntaryException } from "./types";
import type { NaspiResult, UserInputData, MonthlyPayment, AnticipoInput, AnticipoResult } from "./types";

const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return "Data non valida";
    return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

const formatMonthYear = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return "N/A";
    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(date);
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
    return parseFloat((grossAmount * (1 - effectiveTaxRate)).toFixed(2));
};

const generateSchedule = (startDateObj: Date, totalDaysDuration: number, baseMonthlyAmount: number, age: number): MonthlyPayment[] => {
    const schedule: MonthlyPayment[] = [];
    if (isNaN(startDateObj.getTime()) || totalDaysDuration <= 0) return schedule;

    const dailyRate = baseMonthlyAmount / 30;
    let remainingDays = totalDaysDuration;
    let currentDate = new Date(startDateObj);
    const reductionStartMonth = age >= 55 ? NASPI_CONSTANTS.REDUCTION_START_MONTH_OVER_55 : NASPI_CONSTANTS.REDUCTION_START_MONTH;

    while (remainingDays > 0) {
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const currentDayOfMonth = currentDate.getDate();

        let daysInThisMonth = (lastDayOfMonth - currentDayOfMonth) + 1;
        if (daysInThisMonth > remainingDays) daysInThisMonth = remainingDays;

        const msSinceStart = currentDate.getTime() - startDateObj.getTime();
        const monthsSinceStart = Math.floor(msSinceStart / (1000 * 60 * 60 * 24 * 30.4375));
        const naspiMonthIndex = monthsSinceStart + 1;

        let reductionApplied = false;
        let reductionPercentageDisplay = 0;
        let currentReductionFactor = 1;

        if (naspiMonthIndex >= reductionStartMonth) {
            const monthsOver = naspiMonthIndex - reductionStartMonth + 1;
            currentReductionFactor = Math.pow(1 - NASPI_CONSTANTS.REDUCTION_PERCENTAGE, monthsOver);
            reductionApplied = true;
            reductionPercentageDisplay = Math.round((1 - currentReductionFactor) * 100);
        }

        const grossAmount = (dailyRate * currentReductionFactor) * daysInThisMonth;
        const netAmount = calculateEstimatedNet(grossAmount, daysInThisMonth);
        const paymentDate = new Date(currentYear, currentMonth + 1, 15);

        schedule.push({
            monthYear: formatMonthYear(currentDate),
            grossAmount: parseFloat(grossAmount.toFixed(2)),
            netAmount: netAmount,
            reductionApplied,
            reductionPercentage: reductionPercentageDisplay,
            daysPaid: daysInThisMonth,
            estimatedPaymentDate: formatDate(paymentDate),
            dateObj: new Date(currentDate)
        });

        remainingDays -= daysInThisMonth;
        currentDate = new Date(currentYear, currentMonth + 1, 1);
    }
    return schedule;
};

export const calculateNaspiEligibility = (data: UserInputData): NaspiResult => {
    const { weeksWorkedLast4Years, totalGrossWagesLast4Years, terminationReason, voluntaryException, age, terminationDate } = data;
    let isEligible = true;
    let ineligibilityReason = "";

    if (terminationReason === TerminationReason.VOLUNTARY && voluntaryException === VoluntaryException.NONE) {
        isEligible = false;
        ineligibilityReason = "Le dimissioni volontarie non danno diritto alla NASpI (salvo giusta causa/maternità).";
    }
    if (isEligible && weeksWorkedLast4Years < 13) {
        isEligible = false;
        ineligibilityReason = `Requisito non soddisfatto: servono 13 settimane contributive (tu ne hai ${weeksWorkedLast4Years}).`;
    }
    if (!isEligible) {
        return { isEligible: false, ineligibilityReason, durationWeeks: 0, totalDaysDuration: 0, grossMonthlyAmount: 0, startDate: "", endDate: "", schedule: [], calculationDetails: { averageMonthlyWage: 0, referenceWage: 0 } };
    }

    const durationWeeks = Math.min(weeksWorkedLast4Years / 2, 104);
    const totalDaysDuration = Math.floor(durationWeeks * 7);
    const averageMonthlyWage = (totalGrossWagesLast4Years / Math.max(weeksWorkedLast4Years, 1)) * NASPI_CONSTANTS.COEFF_WEEKS_TO_MONTHS;

    let baseGrossMonthly = 0;
    if (averageMonthlyWage <= NASPI_CONSTANTS.THRESHOLD_AMOUNT) {
        baseGrossMonthly = averageMonthlyWage * NASPI_CONSTANTS.PERCENTAGE_BASE;
    } else {
        const excess = averageMonthlyWage - NASPI_CONSTANTS.THRESHOLD_AMOUNT;
        baseGrossMonthly = (NASPI_CONSTANTS.THRESHOLD_AMOUNT * NASPI_CONSTANTS.PERCENTAGE_BASE) + (excess * NASPI_CONSTANTS.PERCENTAGE_EXCESS);
    }
    if (baseGrossMonthly > NASPI_CONSTANTS.MAX_MONTHLY_CAP) baseGrossMonthly = NASPI_CONSTANTS.MAX_MONTHLY_CAP;

    const termDateObj = new Date(terminationDate);
    const startDateObj = new Date(termDateObj);
    startDateObj.setDate(termDateObj.getDate() + 8);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + totalDaysDuration);

    return {
        isEligible: true,
        durationWeeks,
        totalDaysDuration,
        grossMonthlyAmount: parseFloat(baseGrossMonthly.toFixed(2)),
        startDate: formatDate(startDateObj),
        endDate: formatDate(endDateObj),
        schedule: generateSchedule(startDateObj, totalDaysDuration, baseGrossMonthly, age),
        calculationDetails: { averageMonthlyWage, referenceWage: averageMonthlyWage },
    };
};

export const calculateNaspiFromDecree = (data: UserInputData): NaspiResult => {
    const { approvedStartDate, approvedDaysDuration, approvedMonthlyAmount, age } = data;
    if (!approvedStartDate || !approvedDaysDuration || !approvedMonthlyAmount) return calculateNaspiEligibility({ ...data, weeksWorkedLast4Years: 0 }); // Fallback

    const startDateObj = new Date(approvedStartDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + approvedDaysDuration);

    return {
        isEligible: true,
        durationWeeks: Math.round(approvedDaysDuration / 7),
        totalDaysDuration: approvedDaysDuration,
        grossMonthlyAmount: approvedMonthlyAmount,
        startDate: formatDate(startDateObj),
        endDate: formatDate(endDateObj),
        schedule: generateSchedule(startDateObj, approvedDaysDuration, approvedMonthlyAmount, age),
        calculationDetails: { averageMonthlyWage: 0, referenceWage: 0 }
    };
}

export const calculateAnticipo = (input: AnticipoInput): AnticipoResult => {
    const startDate = new Date(input.naspiStartDate);
    const requestDate = new Date(input.anticipoRequestDate);
    const fullSchedule = generateSchedule(startDate, input.totalDays, input.monthlyGrossAmount, input.age ?? 40);

    let totalGross = 0;
    let remainingDays = 0;
    for (const payment of fullSchedule) {
        if (!payment.dateObj) continue;
        const paymentEndOfMonth = new Date(payment.dateObj.getFullYear(), payment.dateObj.getMonth() + 1, 0);
        if (payment.dateObj >= requestDate) {
            totalGross += payment.grossAmount;
            remainingDays += payment.daysPaid;
        } else if (paymentEndOfMonth > requestDate) {
            const timeDiff = paymentEndOfMonth.getTime() - requestDate.getTime();
            const daysLeftInMonth = Math.ceil(timeDiff / (1000 * 3600 * 24));
            const dailyRate = payment.grossAmount / payment.daysPaid;
            totalGross += (dailyRate * daysLeftInMonth);
            remainingDays += daysLeftInMonth;
        }
    }
    const estimatedTax = totalGross * NASPI_CONSTANTS.SEPARATE_TAXATION_RATE_ESTIMATE;
    // Dal 1° gennaio 2026 l'anticipo è pagato in due rate: 70% alla liquidazione, 30% al termine
    // del periodo teorico NASpI e comunque non oltre 6 mesi dalla domanda (messaggio INPS 1215/2026).
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + input.totalDays - 1);
    const sixMonths = new Date(requestDate.getFullYear(), requestDate.getMonth() + 6, requestDate.getDate());
    const secondBy = endDate < sixMonths ? endDate : sixMonths;
    const gross = parseFloat(totalGross.toFixed(2));
    const first = parseFloat((gross * 0.7).toFixed(2));
    return {
        totalGrossAmount: gross,
        estimatedTax: parseFloat(estimatedTax.toFixed(2)),
        estimatedNetAmount: parseFloat((totalGross - estimatedTax).toFixed(2)),
        daysRemaining: remainingDays,
        lastDayCovered: formatDate(endDate),
        firstInstallment: first,
        secondInstallment: parseFloat((gross - first).toFixed(2)),
        naspiEndDate: iso(endDate),
        secondInstallmentBy: iso(secondBy),
    };
};
