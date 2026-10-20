import test from "node:test";
import assert from "node:assert/strict";
import {calculate,seniority,money} from "../engine.js";
import {LEVELS} from "../data.js";
const close=(a,b,t=.011)=>assert.ok(Math.abs(a-b)<=t,String(a)+" ≠ "+String(b));
const calc=i=>{const r=calculate(i);assert.equal(r.ok,true,JSON.stringify(r.errors));return r;};
test("25 h, 10 netti: lordo, quote e costo riconciliati",()=>{
 const r=calc({hours:25,pay:10,payMode:"net"});
 close(r.unitOrdinary,10.33,.00001);assert.equal(r.rate.band,3);
 close(r.gross,1119.08);close(r.netOrdinary,1083.33);close(r.inpsWorker,33.58);close(r.inpsEmployer,100.75);
 close(r.cassaWorker,2.17);close(r.cassaEmployer,4.33);close(r.thirteenthAccrual,93.26);close(r.tfrAccrual,89.80);
 assert.equal(r.totalCost,money(r.currentCost+r.thirteenthAccrual+r.tfrAccrual));close(r.annualCost,16886.72);
});
test("20 h, 10 netti: seconda fascia",()=>{
 const r=calc({hours:20,pay:10,payMode:"net"});
 close(r.unitOrdinary,10.5,.000001);assert.equal(r.rate.band,1);close(r.rate.effective,11.375,.000001);
 close(r.netOrdinary,866.67);close(r.totalCost,1187.12);close(r.annualCost,14245.50);
});
test("24 ore non accede al contributo oltre 24",()=>{assert.equal(calc({hours:24}).rate.band,1);assert.equal(calc({hours:24.5}).rate.band,3);});
test("bordi di fascia 9,61 e 11,70 inclusivi",()=>{
 for(const [effective,band] of [[9.61,0],[9.6101,1],[11.70,1],[11.7001,2]])assert.equal(calc({level:"A",hours:20,payMode:"gross",pay:effective*12/13}).rate.band,band);
});
test("inversione al salto di fascia: sceglie il lordo valido minore",()=>{
 const target=9.61*12/13-.46;
 const r=calc({level:"A",hours:20,payMode:"net",pay:target});
 assert.equal(r.rate.band,0);close(r.unitOrdinary,target+.45,.0000001);
 assert.ok(r.notes.some(n=>n.includes("Più soluzioni")));
});
test("tempo determinato: addizionale già in tabella",()=>{
 const fixed=calc({contract:"fixed"}),sub=calc({contract:"fixed",substitution:true});
 close(fixed.rate.total,1.32);close(sub.rate.total,1.24);close(fixed.rate.worker,sub.rate.worker);
});
test("senza CUAF: tabella specifica, non sottrazione",()=>{close(calc({cuaf:false}).rate.total,1.25);});
test("tutti i minimi tabella C",()=>{
 for(const [level,v] of Object.entries(LEVELS))close(calc({level,payMode:"minimum"}).unitOrdinary,v.hourly,.0000001);
});
test("convivente CS: minimo invariato a 40 e 54 ore",()=>{
 const a=calc({regime:"livein",level:"CS",hours:40,days:5,payMode:"minimum",payUnit:"month",meal:true,dinner:true,room:true});
 const b=calc({regime:"livein",level:"CS",hours:54,days:6,payMode:"minimum",payUnit:"month",meal:true,dinner:true,room:true});
 close(a.grossSalary,1193.84);close(b.grossSalary,1193.84);close(a.benefitMonthly,199.80);
 close(a.thirteenthAnnual,1393.64);close(a.annualTfr,1393.64*13/13.5);
});
test("funzione D/DS e scatti non assorbiti",()=>{
 const r=calc({regime:"livein",level:"DS",hours:54,days:6,payMode:"minimum",payUnit:"month",scatti:2,supermin:100});
 close(r.grossSalary,(1474.73+207.69)*1.08+100,.00001);
});
test("scatti dal mese successivo al biennio e tetto sette",()=>{
 assert.equal(seniority("2024-10-20","2026-10"),0);assert.equal(seniority("2024-10-20","2026-11"),1);
 assert.equal(seniority("2000-01-01","2026-10"),7);
});
test("indennità baby e superminimo assorbibile",()=>{
 const common={level:"BS",payMode:"minimum",payUnit:"hour",child:true,supermin:1};
 const add=calc({...common,absorb:false}),abs=calc({...common,absorb:true});
 close(add.unitOrdinary,7.45+.84+1,.000001);close(abs.unitOrdinary,8.45,.000001);
});
test("indennità più assistiti CS",()=>close(calc({payMode:"minimum",multiple:true}).unitOrdinary,9,.000001));
test("tabella B ammessa solo livelli previsti",()=>{
 assert.equal(calculate({regime:"reduced",level:"CS",hours:30,payMode:"minimum"}).ok,false);
 close(calc({regime:"reduced",level:"BS",hours:30,payMode:"minimum"}).grossSalary,737.39);
});
test("tabella G riposi",()=>close(calc({regime:"replacement",level:"CS",payMode:"minimum"}).unitOrdinary,8.91,.000001));
test("notte: non assumere automaticamente le ore INPS",()=>{
 assert.equal(calculate({regime:"night",payMode:"minimum"}).ok,false);
 const r=calc({regime:"night",level:"CS",hours:40,payMode:"minimum",specialConfirmed:true,specialInpsHours:30,nightsWeek:5});
 close(r.grossSalary,1372.91);close(r.cassaMeanHours,8*5*52/12);close(r.contributionMeanHours,30*52/12);
});
test("presenza: base Cassa cinque ore per notte",()=>{
 const r=calc({regime:"presence",hours:25,payMode:"minimum",specialConfirmed:true,specialInpsHours:25,nightsWeek:5});
 close(r.grossSalary,811.09);close(r.cassaMeanHours,5*5*52/12);
});
test("mensile ore reali: ordinarie, ferie, festività senza duplicare",()=>{
 const r=calc({hours:20,payMode:"gross",pay:10,monthMode:"actual",ordinaryPaidHours:72,holidayPaidHours:4,leavePaidHours:8});
 close(r.gross,840);close(r.inpsHours,84);close(r.cassaHours,84);
});
test("notturno ordinario solo maggiorazione, senza altre ore contributive",()=>{
 const a=calc({payMode:"gross",pay:10}),b=calc({payMode:"gross",pay:10,ordinaryNight:10});
 close(b.gross-a.gross,20);close(a.inpsHours,b.inpsHours);
});
test("straordinario e festivo maggiorati",()=>{
 const r=calc({payMode:"gross",pay:10,overtime25:2,overtime50:2,holidayWorked:2});
 close(r.extraPay,25+30+32);close(r.inpsHours,r.meanHours+6);
});
test("voci ricorrenti partecipano alla fascia",()=>{
 const r=calc({level:"A",hours:20,payMode:"gross",pay:8.8,extraOrdinary:15,extrasRecurring:true});
 assert.equal(r.rate.band,1);assert.ok(r.thirteenthAnnual>r.grossSalary);
});
test("pagamento 13a non duplica il costo maturato",()=>{
 const a=calc({}),b=calc({paid13:100});close(a.totalCost,b.totalCost);close(b.netPayable-a.netPayable,100);
});
test("acconto non riduce costo economico",()=>{const a=calc({}),b=calc({advance:100});close(a.totalCost,b.totalCost);close(a.netPayable-b.netPayable,100);});
test("anticipo TFR richiede fondo e conferma",()=>{
 assert.equal(calculate({tfrAdvance:100}).ok,false);
 assert.equal(calculate({tfrAdvance:701,tfrFund:1000,tfrAdvanceConfirmed:true}).ok,false);
 const a=calc({}),b=calc({tfrAdvance:700,tfrFund:1000,tfrAdvanceConfirmed:true});close(a.totalCost,b.totalCost);close(b.netPayable-a.netPayable,700);
});
test("rivalutazione separata dal costo del preventivo",()=>{
 const a=calc({}),b=calc({calculateRevaluation:true,existingFund:10000,foi:2});
 close(b.revaluation,300);close(a.totalCost,b.totalCost);
});
test("lordo o netto sotto minimo bloccati",()=>{assert.equal(calculate({payMode:"gross",pay:5}).ok,false);assert.equal(calculate({payMode:"net",pay:5}).ok,false);});
test("tabelle non applicate al 2027",()=>assert.equal(calculate({reference:"2027-01"}).ok,false));
test("NaN, infiniti, orari e combinazioni incoerenti bloccati",()=>{
 for(const input of [{hours:0},{hours:-1},{hours:Infinity},{hours:"abc"},{hours:41},{days:0},{days:1},{scatti:8},{scatti:1.5},{level:"X"},{child:true},{certified:true,level:"D"},{multiple:true,level:"B"},{cashBenefitDays:31},{payMode:"x"},{payUnit:"x"},{monthMode:"x"}])assert.equal(calculate(input).ok,false,JSON.stringify(input));
});
test("nessun doppio costo ferie nel mese medio",()=>{
 const r=calc({payMode:"gross",pay:10,level:"B"});
 close(r.annualCost,(r.grossSalary+r.rate.employer*r.contributionMeanHours+.04*r.cassaMeanHours)*12+r.thirteenthAnnual+r.annualTfr);
});
test("gli importi visibili si riconciliano al centesimo",()=>{
 const r=calc({payMode:"gross",pay:10.1234,overtime25:1.5,overtime50:2.5,holidayWorked:3.5});
 let earnings=0;for(const row of r.payslip){if(row.label==="Totale lordo ordinario e aggiuntivo")break;earnings+=row.amount;}
 close(money(earnings),r.gross,.00000001);
 close(r.totalCost,money(r.currentCost+r.thirteenthAccrual+r.tfrAccrual),.00000001);
});

test("tabella B 20 ore: VA INPS sui giorni di fruizione, istituti su 30 giorni",()=>{
 const r=calc({regime:"reduced",level:"BS",hours:20,days:5,payMode:"minimum",meal:true,dinner:true,room:true,benefitDaysWeek:6});
 close(r.benefitMonthly,199.80);close(r.inpsBenefitMonthly,6.66*6*52/12);
 close(r.rate.effective,(737.39/(20*52/12)+6.66*6/20)*13/12,.0000001);assert.equal(r.rate.band,1);
});

test("ratei del mese parziale distinti dalla frazione di paga",()=>{
 const base={regime:"livein",level:"CS",hours:54,days:6,payMode:"minimum",payUnit:"month",monthMode:"actual",monthlyFraction:.5,actualInpsHours:100,actualCassaHours:100,actualContributionsConfirmed:true,useTfrVerifiedBase:true,tfrVerifiedBase:1200};
 const yes=calc({...base,accrualMonths:1}),no=calc({...base,accrualMonths:0});
 close(yes.regularPeriod,1193.84/2);close(yes.thirteenthAccrual,1193.84/12);close(no.thirteenthAccrual,0);
 close(yes.leaveAccrual,26/12);close(no.leaveAccrual,0);
 close(yes.tfrAccrual,1200/13.5);close(no.tfrAccrual,1200/13.5);
});
test("date impossibili, notti frazionate e distribuzione ridotta invalida bloccate",()=>{
 for(const input of [{hireDate:"2024-02-31"},{endDate:"2026-02-30"},{accrualMonths:.5},{nonstandardContributions:true},{regime:"reduced",level:"B",hours:30,days:1,payMode:"minimum"},{regime:"night",nightsWeek:2.5,specialConfirmed:true,specialInpsHours:20}])assert.equal(calculate(input).ok,false,JSON.stringify(input));
});
test("interventi presenza notturna usano la tabella C verificata",()=>{
 const input={regime:"presence",level:"CS",hours:25,payMode:"minimum",specialConfirmed:true,specialInpsHours:25,nightsWeek:5,extraOrdinary:2,ordinaryNight:2};
 assert.equal(calculate(input).ok,false);
 const r=calc({...input,presenceActivePay:10});close(r.extraPay,24);
 assert.equal(calculate({...input,presenceActivePay:10,overtime50:1}).ok,false);
});

test("mensilizzato: trattenute sulle ore reali, netto concordato e TFR parziale verificato",()=>{
 const input={regime:"livein",level:"CS",hours:54,days:6,payMode:"net",payUnit:"month",pay:1200,monthMode:"actual",actualInpsHours:270,actualCassaHours:270,actualContributionsConfirmed:true};
 const r=calc(input);close(r.netOrdinary,1200);close(r.inpsWorker,83.7);close(r.cassaWorker,5.4);
 assert.equal(calculate({...input,actualContributionsConfirmed:false}).ok,false);
 assert.equal(calculate({...input,monthlyFraction:.5}).ok,false);
});
