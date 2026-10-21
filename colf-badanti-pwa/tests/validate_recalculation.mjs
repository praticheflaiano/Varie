// Run with CODEX_PRIMARY_RUNTIME_NODE: independent spreadsheet engine, no new dependencies.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {calculate} from '../engine.js';
import {xlsx} from '../exports.js';
import {makeQuarterDraft,calculateQuarter} from '../quarter.js';
import {quarterXlsx} from '../quarter-exports.js';
import {AUDIT_CONTRACTS} from './audit-fixtures.mjs';
const runtimeRequire=createRequire(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'..','audit-runtime.mjs'));
const {FileBlob,SpreadsheetFile}=await import(runtimeRequire.resolve('@oai/artifact-tool'));
const folder=resolve('pwa-test-artifacts/recalculation');await mkdir(folder,{recursive:true});
const scenarios=AUDIT_CONTRACTS.map(s=>({name:s.name,input:{...s.input,payMode:'minimum',payUnit:'month',qualified:true}}));
scenarios.push(
 {name:'presenza-attiva',input:{regime:'presence',level:'CS',hours:25,payMode:'minimum',specialConfirmed:true,specialInpsHours:25,nightsWeek:5,extraOrdinary:2,ordinaryNight:2,presenceActivePay:10}},
 {name:'presenza-ricorrente',input:{regime:'presence',level:'CS',hours:25,payMode:'minimum',specialConfirmed:true,specialInpsHours:25,nightsWeek:5,extraOrdinary:2,ordinaryNight:2,presenceActivePay:10,extrasRecurring:true}},
 {name:'vitto-parziale',input:{regime:'livein',level:'CS',hours:54,days:6,payMode:'minimum',monthMode:'actual',monthlyFraction:.5,actualInpsHours:100,actualCassaHours:100,actualContributionsConfirmed:true,useTfrVerifiedBase:true,tfrVerifiedBase:800,meal:true,dinner:true,room:true,cashBenefitDays:10}},
 {name:'arrotondamenti',input:{monthMode:'actual',ordinaryPaidHours:1.5}},
 {name:'extra-ricorrenti',input:{hours:20,payMode:'gross',pay:10.1234,overtime25:3.5,holidayWorked:2.5,extrasRecurring:true,extrasTfr:true}},
 {name:'netto-ore-reali',input:{monthMode:'actual',ordinaryPaidHours:100,meal:true,cashBenefitDays:20}}
);
const results=r=>[r.globalHourly,r.extraPay,r.rate.effective,r.rate.band+1,r.rate.total,r.rate.worker,r.gross,r.inpsWorker,r.cassaWorker,r.netOrdinary,r.inpsEmployer,r.cassaEmployer,r.thirteenthAnnual,r.thirteenthAccrual,r.tfrAccrual,r.currentCost,r.totalCost,r.netPayable,r.contributionMeanHours,r.cassaMeanHours,r.extraRows.filter(x=>x.code!=='ordinaryNight').reduce((s,x)=>s+x.quantity,0),r.annualTfr,r.annualCost];
let checked=0;
for(const scenario of scenarios){
 const original=calculate(scenario.input);assert.equal(original.ok,true,scenario.name+JSON.stringify(original.errors));
 const path=resolve(folder,scenario.name+'.xlsx');await writeFile(path,xlsx(original));
 const book=await SpreadsheetFile.importXlsx(await FileBlob.load(path));book.recalculate();
 const compare=(expected,stage)=>{
  const actual=book.worksheets.getItem('Calcoli').getRange('B2:B24').values.flat();
  results(expected).forEach((v,n)=>assert.ok(typeof actual[n]==='number'&&Math.abs(actual[n]-v)<.011,`${scenario.name} ${stage} B${n+2}: recalculated ${actual[n]}, app ${v}`));
  checked++;
 };
 compare(original,'originale');
 const newGross=original.grossSalary*1.12;
 const modified=calculate({...original.input,payMode:'gross',payUnit:'month',pay:newGross});assert.equal(modified.ok,true);
 book.worksheets.getItem('Parametri').getRange('B7').values=[[newGross]];book.recalculate();compare(modified,'lordo +12%');
}
console.log(`${scenarios.length} fogli mensili, ${checked} ricalcoli indipendenti, 23 risultati verificati per ciascun ricalcolo.`);
let quarterChecks=0;
for(const [name,input] of [
 ['TI-25',{}],['TD-20-no-CUAF',{hours:20,payMode:'gross',pay:10,contract:'fixed',cuaf:false}],
 ['notte',{regime:'night',hours:60,days:5,payMode:'minimum',specialConfirmed:true,specialInpsHours:30,nightsWeek:5}],
 ['presenza',{regime:'presence',hours:66,days:6,payMode:'minimum',specialConfirmed:true,specialInpsHours:30,nightsWeek:6}]
]){
 const source=calculate(input);assert.equal(source.ok,true);
 const draft=makeQuarterDraft(source,4);draft.confirmed=true;
 draft.rows.forEach(w=>{w.inpsHours=source.special?input.specialInpsHours:source.input.hours;w.cassaHours=source.cassaMeanHours*12/52;});
 const original=calculateQuarter(draft);assert.equal(original.ok,true,JSON.stringify(original.errors));
 const path=resolve(folder,'trimestre-'+name+'.xlsx');await writeFile(path,quarterXlsx(original));
 const book=await SpreadsheetFile.importXlsx(await FileBlob.load(path));book.recalculate();
 const compare=r=>{
  const expected=[r.inpsHours,r.rate.total,r.rate.worker,r.inpsTotal,r.inpsWorker,r.inpsEmployer,r.cassaHours,.06,.02,r.cassaSupplement,r.cassaTotal,r.cassaWorker,r.cassaEmployer,r.total,r.employerTotal,r.workerTotal];
  const actual=book.worksheets.getItem('Calcoli').getRange('B2:B17').values.flat();
  expected.forEach((v,n)=>assert.ok(typeof actual[n]==='number'&&Math.abs(actual[n]-v)<.011,`trimestre ${name} B${n+2}: ${actual[n]} != ${v}`));quarterChecks++;
 };
 compare(original);
 draft.rows[0].inpsHours+=1;draft.rows[0].cassaHours+=2;
 book.worksheets.getItem('Settimane').getRange('C2:D2').values=[[draft.rows[0].inpsHours,draft.rows[0].cassaHours]];
 book.recalculate();const modified=calculateQuarter(draft);assert.equal(modified.ok,true);compare(modified);
}
console.log(`4 fogli trimestrali, ${quarterChecks} ricalcoli indipendenti, 16 risultati verificati per ciascun ricalcolo.`);
