import {RULES,LEVELS,REGIMES,DEFAULTS,VERSION,ccnlMinimum,inpsRate,validISODate} from "./data.js";
export const money = n => Math.round((Number(n)+Number.EPSILON)*100)/100;
const numeric = (v,fallback=0) => v === "" || v === null || v === undefined ? fallback : Number(v);
export function normalize(raw={}) {
 const i={...DEFAULTS};
 for(const key of Object.keys(DEFAULTS)) if(Object.hasOwn(raw,key)) i[key]=raw[key];
 const numberKeys=Object.keys(DEFAULTS).filter(k=>typeof DEFAULTS[k]==="number");
 for(const k of numberKeys) i[k]=numeric(i[k],DEFAULTS[k]);
 for(const k of Object.keys(DEFAULTS).filter(k=>typeof DEFAULTS[k]==="boolean")) i[k]=i[k]===true;
 for(const k of ["employer","employee","operator","scenario","hireDate","endDate","reference"]) i[k]=String(i[k]??"").slice(0,200);
 return i;
}
export function seniority(hire,reference) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(hire)||!/^\d{4}-\d{2}$/.test(reference)) return 0;
 const [y,m]=reference.split("-").map(Number),[hy,hm]=hire.split("-").map(Number);
 return Math.max(0,Math.min(7,Math.floor(((y-hy)*12+m-hm-1)/24)));
}
export function contribution(grossSalary,ctx,forcedBand=null) {
 const effective=(grossSalary*(ctx.referenceMultiplier||1)+ctx.benefitMonthly+(ctx.referenceExtraBenefit||0))*13/12/ctx.meanHours;
 return inpsRate({effective,hoursWeek:ctx.contributionHoursWeek,contract:ctx.contract,substitution:ctx.substitution,cuaf:ctx.cuaf},forcedBand);
}
export function solveNet(targetMonthly,ctx) {
 const bands=ctx.contributionHoursWeek>24?[3]:[0,1,2],solutions=[];
 for(const band of bands) {
  const rate=contribution(0,ctx,band);
  const candidate=targetMonthly+rate.worker*ctx.contributionMeanHours+RULES.cassa.worker*(ctx.cassaMeanHours??ctx.contributionMeanHours)-ctx.benefitCash;
  const actual=contribution(candidate,ctx);
  if(actual.band===band&&candidate+1e-7>=ctx.minimum) solutions.push({gross:candidate,rate:actual});
 }
 return solutions.sort((a,b)=>a.gross-b.gross);
}
export function calculate(raw={}) {
 const i=normalize(raw),errors=[],warnings=[],notes=[];
 const fail=(key,message)=>errors.push({key,message});
 const level=LEVELS[i.level], hourly=["hourly","replacement"].includes(i.regime),special=["night","presence"].includes(i.regime);
 if(!level) fail("level","Selezionare un livello valido.");
 if(i.nonstandardContributions) fail("nonstandardContributions","Sono presenti incentivi o esoneri individuali: la tabella contributiva ordinaria non è applicabile. Verificare la posizione e le tariffe autorizzate sul Portale INPS.");
 if(!REGIMES[i.regime]) fail("regime","Selezionare una tipologia di rapporto valida.");
 if(!/^2026-(0[1-9]|1[0-2])$/.test(i.reference)) fail("reference","Questa versione contiene esclusivamente tabelle 2026.");
 for(const k of Object.keys(DEFAULTS).filter(k=>typeof DEFAULTS[k]==="number")) {
  if(!Number.isFinite(i[k])) fail(k,"Inserire un numero valido per "+k+".");
  else if(i[k]<0&&k!=="foi") fail(k,"Il valore non può essere negativo.");
 }
 for(const k of ["ordinaryPaidHours","holidayPaidHours","leavePaidHours","extraOrdinary","overtime10","overtime25","overtime50","holidayWorked","restWorked","ordinaryNight"]) if(i[k]>744) fail(k,"Le ore mensili non possono superare 744.");
 if(i.pay>1000000||i.supermin>1000000) fail("pay","Importo oltre il limite di calcolo ammesso (1.000.000 €).");
 if(!(i.hours>0&&i.hours<=54)) fail("hours","Le ore contrattuali devono essere superiori a zero e non oltre 54.");
 if(!Number.isInteger(i.days)||i.days<1||i.days>6) fail("days","Indicare da 1 a 6 giorni settimanali.");
 if(!Number.isInteger(i.scatti)||i.scatti>7) fail("scatti","Gli scatti devono essere un intero da 0 a 7.");
 if(!["indefinite","fixed"].includes(i.contract)) fail("contract","Tipologia contrattuale non valida.");
 if(!["minimum","gross","net"].includes(i.payMode)) fail("payMode","Modalità di calcolo non valida.");
 if(!["hour","month"].includes(i.payUnit)) fail("payUnit","Unità della paga non valida.");
 if(!["average","actual"].includes(i.monthMode)) fail("monthMode","Periodo di calcolo non valido.");
 if((i.regime==="hourly"||i.regime==="replacement")&&i.hours>40) fail("hours","L'orario ordinario non convivente non può superare 40 ore. Indicare gli straordinari nelle voci aggiuntive.");
 if(i.regime==="livein"&&i.hours/i.days>10+1e-7) fail("days","La distribuzione indicata supera 10 ore ordinarie al giorno per il convivente.");
 if(["hourly","replacement"].includes(i.regime)&&i.hours/i.days>8+1e-7) fail("days","La distribuzione indicata supera 8 ore ordinarie al giorno per il non convivente.");
 if(i.regime==="reduced"&&(!level?.reduced||i.hours>30)) fail("regime","La tabella B gestita qui è ammessa per B, BS e C, fino a 30 ore. L'eccezione studenti richiede verifica individuale.");
 if(i.regime==="reduced"&&!["morning","afternoon","threeDays"].includes(i.reducedWindow)) fail("reducedWindow","Selezionare la collocazione contrattuale dell'orario ridotto.");
 if(i.regime==="reduced"&&i.hours/i.days>(i.reducedWindow==="threeDays"?10:8)+1e-7) fail("days","La distribuzione dell’orario ridotto supera il limite giornaliero della fascia scelta.");
 if(i.regime==="reduced"&&i.reducedWindow==="threeDays"&&i.days>3) fail("days","L'opzione fino a tre giorni richiede un massimo di tre giorni settimanali.");
 if(i.regime==="replacement"&&!level?.replacement) fail("regime","La sostituzione dei riposi in tabella G è prevista solo per CS e DS.");
 if(i.regime==="night"&&!level?.night) fail("regime","L'assistenza notturna è prevista per BS, CS e DS.");
 if(special&&(!i.specialConfirmed||!(i.specialInpsHours>0))) fail("specialInpsHours","Per i rapporti notturni indicare le ore INPS settimanali verificate e confermare la disciplina specifica.");
 if(special&&(!Number.isInteger(i.nightsWeek)||!(i.nightsWeek>0)||i.nightsWeek>6)) fail("nightsWeek","Indicare da 1 a 6 notti settimanali.");
 if(i.child&&i.level!=="BS") fail("child","L'indennità bambini sotto 6 anni è prevista per la baby-sitter BS.");
 if(i.multiple&&!["CS","DS"].includes(i.level)) fail("multiple","L'indennità per più persone non autosufficienti è prevista per CS e DS.");
 if(i.certified&&!["B","BS","CS"].includes(i.level)) fail("certified","L'indennità UNI 11766 è prevista nelle tabelle 2026 per B, BS e CS.");
 if(i.level==="DS"&&!i.qualified) warnings.push("Per l'assistenza DS verificare il titolo o la formazione qualificante. La sola esperienza non equivale alla qualifica.");
 if(!Number.isInteger(i.benefitDaysWeek)||i.benefitDaysWeek>7) fail("benefitDaysWeek","I giorni settimanali di fruizione del vitto/alloggio non possono superare 7.");
 if(i.cashBenefitDays>30) fail("cashBenefitDays","I giorni convenzionali monetizzati non possono superare 30.");
 if(i.monthMode==="actual"&&!hourly&&!i.actualContributionsConfirmed) fail("actualContributionsConfirmed","Per il cedolino mensilizzato inserire e confermare le ore INPS e Cassa effettive, distinte dal mese medio.");
 if(i.actualInpsHours>744||i.actualCassaHours>744) fail("actualInpsHours","Le ore contributive del mese non possono superare 744.");
 const partialMonth=i.monthMode==="actual"&&((!hourly&&i.monthlyFraction<1)||(i.hireDate.slice(0,7)===i.reference&&i.hireDate.slice(8)!=="01")||(i.endDate.slice(0,7)===i.reference&&validISODate(i.endDate)&&new Date(Date.parse(i.endDate+"T00:00:00Z")+86400000).toISOString().slice(0,7)===i.reference));
 if(partialMonth&&!i.useTfrVerifiedBase) fail("useTfrVerifiedBase","Mese parziale: inserire la retribuzione utile TFR verificata, comprensiva degli elementi e del rateo di tredicesima spettanti.");
 if(i.monthlyFraction<=0||i.monthlyFraction>1) fail("monthlyFraction","La frazione di mensilità deve essere superiore a 0 e non oltre 1.");
 if(i.autoScatti&&!i.hireDate) fail("hireDate","Inserire la data di assunzione per il calcolo automatico degli scatti.");
 if(i.hireDate&&!validISODate(i.hireDate)) fail("hireDate","Data di assunzione non valida.");
 if(i.endDate&&!validISODate(i.endDate)) fail("endDate","Data di fine contratto non valida.");
 if(![0,1].includes(i.accrualMonths)) fail("accrualMonths","Indicare se il mese è utile oppure non utile alla maturazione di tredicesima e ferie.");
 if(i.endDate&&i.hireDate&&i.endDate<i.hireDate) fail("endDate","La cessazione non può precedere l'assunzione.");
 if(i.endDate&&i.endDate.slice(0,4)!=="2026") warnings.push("La scadenza supera il 2026: gli importi oltre il 31 dicembre 2026 richiederanno nuove tabelle.");
 if(i.hireDate&&i.hireDate.slice(0,7)>i.reference) fail("hireDate","Il mese simulato precede l'assunzione.");
 if(i.overtime10>0&&i.regime!=="hourly") fail("overtime10","La maggiorazione del 10% fra la 41ª e la 44ª ora è riservata ai non conviventi.");
 if(i.restWorked>0&&!["livein","reduced"].includes(i.regime)) fail("restWorked","Le 12 ore di riposo con maggiorazione del 40% riguardano i conviventi.");
 if(errors.length) return {ok:false,input:i,errors,warnings,version:VERSION,rules:RULES};
 const meanHours=i.hours*52/12;
 const tabular=ccnlMinimum(i.level,i.regime,i.hours);
 const tableBase=tabular.base*(hourly?meanHours:1),role=tabular.role;
 const nScatti=i.autoScatti?seniority(i.hireDate,i.reference):i.scatti;
 const scatti=(tableBase+role)*.04*nScatti;
 const child=i.child?(hourly?.84*meanHours:i.regime==="reduced"?97.06:138.54):0;
 const multiple=i.multiple?(hourly?.70*meanHours:119.66):0;
 const certification=i.certified?30.27:0;
 const indemnities=child+multiple+certification;
 const minimum=tableBase+role+scatti+indemnities;
 const dailyBenefit=(i.meal?2.33:0)+(i.dinner?2.33:0)+(i.room?2:0);
 // For hourly relationships use actual weekly benefit days for the INPS effective remuneration.
 const benefitMonthly=hourly?dailyBenefit*i.benefitDaysWeek*52/12:dailyBenefit*30;
 const inpsBenefitMonthly=dailyBenefit*i.benefitDaysWeek*52/12;
 const benefitCash=dailyBenefit*i.cashBenefitDays;
 if(benefitCash>benefitMonthly+1e-7) fail("cashBenefitDays","La quota monetizzata supera il valore convenzionale mensile configurato.");
 const contributionHoursWeek=special?i.specialInpsHours:i.hours;
 const contributionMeanHours=contributionHoursWeek*52/12;
 const cassaMeanHours=special?(i.regime==="night"?8:5)*i.nightsWeek*52/12:meanHours;
 const recurringCoefficient=i.extrasRecurring?(i.extraOrdinary+i.overtime10*1.10+i.overtime25*1.25+i.overtime50*1.50+i.holidayWorked*1.60+i.restWorked*1.40+i.ordinaryNight*.20)/meanHours:0;
 const ctx={meanHours,minimum,benefitMonthly:inpsBenefitMonthly,benefitCash,contributionHoursWeek,contributionMeanHours,cassaMeanHours,referenceMultiplier:i.regime==="presence"?1:1+recurringCoefficient,referenceExtraBenefit:i.regime==="presence"?recurringCoefficient*meanHours*i.presenceActivePay:recurringCoefficient*benefitMonthly,contract:i.contract,substitution:i.substitution,cuaf:i.cuaf};
 let grossSalary=minimum,alternatives=0;
 if(i.payMode==="minimum") {
  const extra=i.supermin*(i.payUnit==="hour"?meanHours:1);
  grossSalary=tableBase+role+scatti+(i.absorb?Math.max(indemnities,extra):indemnities+extra);
 } else if(i.payMode==="gross") {
  grossSalary=i.pay*(i.payUnit==="hour"?meanHours:1);
  if(grossSalary+1e-7<minimum) fail("pay","La retribuzione lorda è inferiore al minimo complessivo: "+money(minimum)+" € mensili.");
 } else {
  const target=i.pay*(i.payUnit==="hour"?meanHours:1);
  // Cassa may have a different conventional base in night contracts.
  const candidates=[];
  const monthFraction=i.monthMode==="actual"&&!hourly?i.monthlyFraction:1;
   const ordinaryExtraHours=i.extraOrdinary+i.overtime10+i.overtime25+i.overtime50+i.holidayWorked+i.restWorked;
   const netInpsHours=i.monthMode==="actual"&&!hourly?Math.max(0,i.actualInpsHours-ordinaryExtraHours)/monthFraction:contributionMeanHours;
   const netCassaHours=i.monthMode==="actual"&&!hourly?Math.max(0,i.actualCassaHours-ordinaryExtraHours)/monthFraction:cassaMeanHours;
  for(const b of contributionHoursWeek>24?[3]:[0,1,2]) {
   const rr=contribution(0,ctx,b);
   const candidate=target+rr.worker*netInpsHours+.02*netCassaHours-benefitCash;
   if(contribution(candidate,ctx).band===b&&candidate+1e-7>=minimum) candidates.push(candidate);
  }
  candidates.sort((a,b)=>a-b);alternatives=candidates.length;
  if(!candidates.length) {
   const rr=contribution(minimum,ctx);
   const minNet=minimum+benefitCash-rr.worker*netInpsHours-.02*netCassaHours;
   fail("pay","Il netto richiesto non raggiunge il minimo contrattuale. Netto minimo ordinario stimato: "+money(minNet)+" € al mese.");
  } else grossSalary=candidates[0];
 }
 if(errors.length) return {ok:false,input:i,errors,warnings,minimum,version:VERSION,rules:RULES};
 const rate=contribution(grossSalary,ctx);
 const hasPresenceWork=i.regime==="presence"&&(i.extraOrdinary+i.overtime10+i.overtime25+i.overtime50+i.holidayWorked+i.restWorked+i.ordinaryNight)>0;
 if(hasPresenceWork&&i.presenceActivePay+1e-7<level.hourly*(1+.04*nScatti)) fail("presenceActivePay","Per gli interventi durante la presenza notturna inserire una paga oraria verificata almeno pari alla tabella C con gli scatti spettanti.");
 if(i.regime==="presence"&&(i.overtime10+i.overtime25+i.overtime50+i.restWorked)>0) fail("extraOrdinary","Gli interventi durante la presenza notturna non sono straordinario: usare ore aggiuntive ordinarie, eventuale notturno ordinario o festivo sulla paga attiva verificata.");
 const unitOrdinary=grossSalary/meanHours,globalHourly=hasPresenceWork?i.presenceActivePay:(grossSalary+benefitMonthly)/meanHours;
 const accrualMonths=i.monthMode==="actual"?i.accrualMonths:1;
 const fraction=i.monthMode==="actual"&&!hourly?i.monthlyFraction:1;
 const basePaidHours=i.monthMode==="actual"&&hourly?i.ordinaryPaidHours+i.holidayPaidHours+i.leavePaidHours:meanHours;
 if(i.ordinaryNight>(i.regime==="presence"?i.extraOrdinary:basePaidHours)) fail("ordinaryNight","Le ore notturne ordinarie non possono superare le ore già comprese nella paga ordinaria.");
 const regularPeriod=hourly?unitOrdinary*basePaidHours:grossSalary*fraction;
 const benefitCashPeriod=benefitCash*fraction;
 const benefitUsefulPeriod=benefitMonthly*fraction;
 const extraDefs=[
 ["extraOrdinary","Ore aggiuntive ordinarie",1],["overtime10","Ore dalla 41ª alla 44ª (+10%)",1.10],
 ["overtime25","Straordinario diurno (+25%)",1.25],["overtime50","Straordinario notturno (+50%)",1.50],
 ["holidayWorked","Lavoro festivo / domenicale (+60%)",1.60],["restWorked","Riposo convivente (+40%)",1.40]
 ];
 const extraRows=extraDefs.filter(([k])=>i[k]>0).map(([k,label,mult])=>({code:k,label,quantity:i[k],rate:globalHourly*mult,amount:globalHourly*mult*i[k]}));
 if(i.ordinaryNight>0) extraRows.push({code:"ordinaryNight",label:"Maggiorazione notturno ordinario (+20%)",quantity:i.ordinaryNight,rate:globalHourly*.20,amount:globalHourly*.20*i.ordinaryNight});
 const extraPay=extraRows.reduce((a,b)=>a+b.amount,0);
 const extraHours=extraDefs.reduce((a,[k])=>a+i[k],0);
 if(basePaidHours+extraHours>744) fail("ordinaryPaidHours","Il totale delle ore retribuite del periodo supera 744: verificare sovrapposizioni e quantità.");
 if(i.monthMode==="actual"&&!hourly&&(i.actualInpsHours+1e-7<extraHours||i.actualCassaHours+1e-7<extraHours)) fail("actualInpsHours","Le ore contributive totali verificate non possono essere inferiori alle ore aggiuntive indicate.");
 const inpsHours=i.monthMode==="actual"?(hourly?basePaidHours+extraHours:i.actualInpsHours):contributionMeanHours+extraHours;
 const cassaHours=i.monthMode==="actual"?(hourly?basePaidHours+extraHours:i.actualCassaHours):cassaMeanHours+extraHours;
 const inpsWorker=money(inpsHours*rate.worker),inpsEmployer=money(inpsHours*rate.employer),inpsTotal=money(inpsWorker+inpsEmployer);
 const cassaWorker=money(cassaHours*.02),cassaEmployer=money(cassaHours*.04),cassaTotal=money(cassaWorker+cassaEmployer);
 const gross=money(regularPeriod+benefitCashPeriod+extraPay);
 const netOrdinary=money(gross-inpsWorker-cassaWorker);
 const recurringExtra=i.extrasRecurring?extraPay:0;
 const thirteenthAnnual=grossSalary+benefitMonthly+recurringExtra;
 const thirteenthAccrual=money(thirteenthAnnual/12*accrualMonths);
 const tfrUseful=i.monthMode==="actual"&&i.useTfrVerifiedBase?i.tfrVerifiedBase:regularPeriod+benefitUsefulPeriod+(i.extrasTfr||i.extrasRecurring?extraPay:0)+thirteenthAnnual/12*accrualMonths;
 const tfrAccrual=money(tfrUseful/13.5);
 const paid13=money(i.paid13),tfrAdvance=money(i.tfrAdvance);
 if(i.tfrAdvance>0&&(!i.tfrAdvanceConfirmed||i.tfrFund<=0||i.tfrAdvance>i.tfrFund*.7+1e-7)) fail("tfrAdvance","Per l'anticipo TFR confermare richiesta, limite annuo e fondo disponibile; l'anticipo non può superare il 70% del fondo indicato.");
 const netPayable=money(netOrdinary+paid13+tfrAdvance+i.reimbursements-i.advance);
 if(netPayable<0) fail("advance","Gli anticipi superano le competenze da corrispondere.");
 const currentCost=money(gross+inpsEmployer+cassaEmployer+money(i.reimbursements)+money(i.actualBoardCost));
 const totalCost=money(currentCost+thirteenthAccrual+tfrAccrual);
 const cashOut=money(netPayable+inpsTotal+cassaTotal+i.actualBoardCost);
 const normalInpsEmployer=rate.employer*contributionMeanHours,normalCassaEmployer=.04*cassaMeanHours;
 const annualExtra=i.extrasRecurring?extraPay*12:0;
 const annualExtraContribution=i.extrasRecurring?extraHours*12*(rate.employer+.04):0;
 const annualTfr=((grossSalary+benefitMonthly)*12+thirteenthAnnual+((i.extrasTfr||i.extrasRecurring)?annualExtra:0))/13.5;
 const annualCost=money((grossSalary+benefitCash+normalInpsEmployer+normalCassaEmployer+i.actualBoardCost)*12+annualExtra+annualExtraContribution+thirteenthAnnual+annualTfr);
 const revaluation=i.calculateRevaluation?money(i.existingFund*(.015+.75*i.foi/100)):0;
 if(i.calculateRevaluation) notes.push("La rivalutazione indicata è un calcolo annuo sul fondo pregresso con FOI inserito manualmente, separato dal costo previsto. Non determina imposte o liquidazione finale.");
 if(i.monthMode==="average") notes.push("Mese medio: ore settimanali × 52 ÷ 12. Non è un cedolino basato sulle presenze del calendario.");
 else notes.push("Prospetto mensile simulato sulle ore retribuite e sulla frazione di mensilità inserite. I dati devono essere ricavati dalle presenze.");
 notes.push("Il netto è prima dell'eventuale IRPEF personale. Il datore domestico privato non opera le normali ritenute IRPEF.");
 notes.push("Costo annuale strutturale su 12 mesi a condizioni costanti; ferie ordinarie già comprese. Festività aggiuntive del calendario, sostituzioni, assenze e voci occasionali richiedono una simulazione specifica.");
 notes.push("Ore INPS/Cassa e versamenti esposti sono stime: il pagamento trimestrale richiede le ore retribuite effettive e il relativo calendario previdenziale.");
 if(!i.extrasRecurring&&extraPay>0) notes.push("Voci aggiuntive del periodo escluse dalla proiezione annua; inclusione TFR del periodo: "+(i.extrasTfr?"sì":"no (occasionali)"));
 if(!i.cuaf) warnings.push("Esclusione CUAF: verificare il rapporto familiare e le condizioni di riconoscimento previste da INPS.");
 if(i.hireDate||i.endDate) notes.push("Le date non riproporzionano automaticamente il preventivo annuale. Per un periodo parziale inserire le ore e la quota di mensilità verificate; il costo annuo resta una proiezione a condizioni costanti.");
 if(dailyBenefit>0) notes.push("Per la fascia INPS il vitto/alloggio è ripartito sulle ore tramite i giorni settimanali di fruizione; per gli istituti dei mensilizzati il valore convenzionale mensile usa 30 giorni.");
 if(i.contract==="fixed"&&i.substitution) notes.push("Tempo determinato sostitutivo: applicata la tabella senza contributo addizionale.");
 if(!hourly&&dailyBenefit===0) warnings.push("Per il rapporto mensilizzato verificare il diritto a vitto/alloggio e inserire le componenti spettanti.");
 if(dailyBenefit>0&&i.actualBoardCost===0&&benefitMonthly>benefitCash) warnings.push("Vitto/alloggio in natura: il costo effettivo non è stato inserito. Il totale non comprende tale esborso, mentre il valore convenzionale entra negli istituti.");
 if(special) warnings.push("Rapporto notturno: ore INPS inserite dall'operatore. Per Cassa utilizzate le ore convenzionali contrattuali; verificare atto scritto, fascia oraria e riposi.");
 if(i.monthMode==="actual"&&!hourly) notes.push("Trattenute del mese mensilizzato calcolate sulle ore INPS/Cassa effettive confermate, non sulle settimane del mese medio.");
 if(i.monthMode==="actual"&&i.useTfrVerifiedBase) notes.push("Rateo TFR del periodo sulla retribuzione utile verificata di "+money(i.tfrVerifiedBase)+" euro, già comprensiva della tredicesima utile. La proiezione annua resta strutturale.");
 if(i.monthMode==="actual") notes.push("Tredicesima e ferie: mese "+(accrualMonths?"utile":"non utile")+" secondo la scelta dell’operatore, distinta dalla frazione della paga. Le frazioni di almeno 15 giorni di calendario si computano come mese intero, ferme le assenze tutelate.");
 if(hasPresenceWork) notes.push("Interventi attivi durante la presenza notturna: paga oraria verificata dall’operatore sulla tabella C, distinta dal compenso di attesa della tabella E.");
 if(i.regime==="replacement") notes.push("Tabella G: verificare che il titolare sostituito sia un assistente CS/DS a tempo pieno. Non è una sostituzione generica.");
 if(i.ordinaryNight>0||extraHours>0) warnings.push("Le tipologie di ore sono scelte dall'operatore: verificare limiti giornalieri, collocazione settimanale, riposi e assenza di sovrapposizioni.");
 if(alternatives>1) notes.push("Più soluzioni netto/lordo valide al cambio di fascia: selezionato il minore lordo conforme al minimo.");
 if(Math.abs(i.hours-Math.round(i.hours))>1e-7) warnings.push("Orario settimanale frazionario: verificare gli arrotondamenti delle ore nel versamento INPS effettivo.");
 const components=[
 {label:"Minimo tabellare",amount:tableBase},{label:"Indennità di funzione",amount:role},
 {label:"Scatti di anzianità ("+nScatti+")",amount:scatti},{label:"Indennità bambini sotto 6 anni",amount:child},
 {label:"Indennità più non autosufficienti",amount:multiple},{label:"Certificazione UNI 11766",amount:certification},
 {label:"Superminimo residuo",amount:Math.max(0,grossSalary-minimum)}
 ];
 const roundingAdjustment=money(gross-money(regularPeriod)-money(benefitCashPeriod)-extraRows.reduce((sum,row)=>sum+money(row.amount),0));
 const payslip=[
 {label:"Retribuzione ordinaria monetaria",amount:money(regularPeriod),kind:"earning"},
 ...(benefitCashPeriod?[{label:"Vitto/alloggio monetizzato",amount:money(benefitCashPeriod),kind:"earning"}]:[]),
 ...extraRows.map(r=>({...r,amount:money(r.amount),kind:"earning"})),
 ...(roundingAdjustment?[{label:"Arrotondamento competenze",amount:roundingAdjustment,kind:"earning"}]:[]),
 {label:"Totale lordo ordinario e aggiuntivo",amount:gross,kind:"total"},
 {label:"INPS a carico del lavoratore",amount:-inpsWorker,kind:"deduction"},
 {label:"CAS.SA.COLF a carico del lavoratore",amount:-cassaWorker,kind:"deduction"},
 {label:"Netto ordinario prima IRPEF",amount:netOrdinary,kind:"total"},
 ...(paid13?[{label:"Tredicesima corrisposta",amount:paid13,kind:"earning"}]:[]),
 ...(tfrAdvance?[{label:"Anticipo TFR (fondo già maturato)",amount:tfrAdvance,kind:"earning"}]:[]),
 ...(i.reimbursements?[{label:"Rimborsi documentati",amount:money(i.reimbursements),kind:"earning"}]:[]),
 ...(i.advance?[{label:"Acconto già corrisposto",amount:-money(i.advance),kind:"deduction"}]:[]),
 {label:"Da corrispondere al lavoratore",amount:netPayable,kind:"total"}
 ];
 const costRows=[
 {label:"Retribuzione lorda monetaria",amount:gross},{label:"Contributi INPS datore",amount:inpsEmployer},
 {label:"CAS.SA.COLF datore",amount:cassaEmployer},{label:"Rimborsi documentati",amount:money(i.reimbursements)},
 {label:"Costo effettivo vitto/alloggio inserito",amount:money(i.actualBoardCost)},
 {label:"Costo corrente del periodo",amount:currentCost,kind:"total"},
 {label:"Rateo tredicesima maturato",amount:thirteenthAccrual},{label:"Rateo TFR maturato",amount:tfrAccrual},
 {label:"Costo complessivo del periodo",amount:totalCost,kind:"total"}
 ];
 if(errors.length) return {ok:false,input:i,errors,warnings,minimum,version:VERSION,rules:RULES};
 return {ok:true,input:i,errors,warnings,notes,version:VERSION,rules:RULES,level:level.name,regime:REGIMES[i.regime],
 hourly,special,meanHours,contributionMeanHours,cassaMeanHours,basePaidHours,inpsHours,cassaHours,rate,minimum,
 grossSalary,unitOrdinary,globalHourly,nScatti,components,tfrUseful,benefitMonthly,inpsBenefitMonthly,benefitCash,dailyBenefit,regularPeriod,
 benefitCashPeriod,extraRows,extraPay,gross,inpsWorker,inpsEmployer,inpsTotal,cassaWorker,cassaEmployer,cassaTotal,
 netOrdinary,netPayable,thirteenthAccrual,thirteenthAnnual,tfrAccrual,annualTfr:money(annualTfr),currentCost,totalCost,
 annualCost,cashOut,revaluation,payslip,costRows,accrualMonths,leaveAccrual:26/12*accrualMonths};
}
