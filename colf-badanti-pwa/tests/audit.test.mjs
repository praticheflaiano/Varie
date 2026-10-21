import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from '../engine.js';
import {makeQuarterDraft,calculateQuarter,quarterCalendar} from '../quarter.js';
import {AUDIT_CONTRACTS} from './audit-fixtures.mjs';
const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
const close=(a,b,t=.011)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const checked=i=>{const r=calculate(i);assert.equal(r.ok,true,JSON.stringify(r.errors));return r;};

for(const scenario of AUDIT_CONTRACTS)for(const contract of ['indefinite','fixed','substitute'])for(const cuaf of [true,false]){
 test(`tabella ufficiale e inversione netto/lordo: ${scenario.name} ${contract} CUAF=${cuaf}`,()=>{
  const input={...scenario.input,payMode:'minimum',payUnit:'month',qualified:true,contract:contract==='indefinite'?'indefinite':'fixed',substitution:contract==='substitute',cuaf};
  const r=checked(input);close(r.grossSalary,scenario.minimum,.00001);
  const h=input.specialInpsHours||input.hours;
  const effective=(scenario.minimum+((input.meal?2.33:0)+(input.dinner?2.33:0)+(input.room?2:0))*6*52/12)*13/12/(input.hours*52/12);
  const band=h>24?3:effective<=9.61?0:effective<=11.70?1:2;
  const total=(contract==='fixed'?[1.82,2.05,2.50,1.32]:[1.70,1.92,2.34,1.24])[band]+(cuaf?0:.01);
  close(r.rate.total,total,.00001);close(r.rate.worker,[.43,.48,.59,.31][band],.00001);
  close(r.inpsTotal,cents(h*52/12*total),.00001);
  assert.equal(cents(r.inpsWorker+r.inpsEmployer),r.inpsTotal);
  assert.equal(cents(r.cassaWorker+r.cassaEmployer),r.cassaTotal);
  close(r.annualTfr,(scenario.minimum+r.benefitMonthly)*13/13.5);
  const gross=checked({...input,payMode:'gross',pay:scenario.minimum+1000});
  const netTarget=(scenario.minimum+1000)-gross.inpsWorker-gross.cassaWorker;
  const inverse=checked({...input,payMode:'net',pay:netTarget});
  close(inverse.netOrdinary,cents(netTarget));
 });
}

test('vitto/alloggio: dieci giorni monetizzati rimangono dieci nel mezzo mese',()=>{
 const r=checked({regime:'livein',level:'CS',hours:54,days:6,payMode:'minimum',monthMode:'actual',monthlyFraction:.5,actualInpsHours:100,actualCassaHours:100,actualContributionsConfirmed:true,useTfrVerifiedBase:true,tfrVerifiedBase:800,meal:true,dinner:true,room:true,cashBenefitDays:10});
 assert.equal(r.benefitCashPeriod,66.6);assert.equal(r.gross,663.52);assert.equal(r.netPayable,630.52);
});
test('netto concordato e vitto monetizzato: inversione coerente sulle ore del periodo',()=>{
 const r=checked({monthMode:'actual',ordinaryPaidHours:100,meal:true,cashBenefitDays:20});
 close(r.netOrdinary,1000);
 const m=checked({regime:'livein',level:'CS',hours:54,days:6,payMode:'net',payUnit:'month',pay:1500,monthMode:'actual',monthlyFraction:.5,actualInpsHours:100,actualCassaHours:100,actualContributionsConfirmed:true,useTfrVerifiedBase:true,tfrVerifiedBase:800,meal:true,dinner:true,room:true,cashBenefitDays:10});
 close(m.netOrdinary,750);
 assert.equal(calculate({monthMode:'actual',ordinaryPaidHours:0}).ok,false);
});
test('arrotondamento INPS: totale sulla tariffa ufficiale, quota datore per differenza',()=>{
 const r=checked({monthMode:'actual',ordinaryPaidHours:1.5});
 assert.equal(r.inpsTotal,1.86);assert.equal(r.inpsWorker,.47);assert.equal(r.inpsEmployer,1.39);
});
test('nessun cedolino dopo cessazione e mese finale esplicitamente incompleto',()=>{
 assert.equal(calculate({endDate:'2026-09-30'}).ok,false);
 assert.ok(checked({endDate:'2026-10-31'}).warnings.some(w=>w.includes('cedolino finale')));
});
test('nessun +20% sulle stesse ore già coperte dalla tabella D',()=>{
 assert.equal(calculate({regime:'night',level:'CS',hours:60,payMode:'minimum',specialConfirmed:true,specialInpsHours:30,nightsWeek:5,ordinaryNight:100}).ok,false);
});
test('trimestre: cessazione nota copiata, non eliminabile o sostituibile silenziosamente',()=>{
 const r=checked({endDate:'2026-10-31'}),d=makeQuarterDraft(r,4);
 assert.equal(d.terminationDate,'2026-10-31');
 const c=quarterCalendar(2026,4);
 assert.equal(calculateQuarter({...d,terminationDate:'',confirmed:true,rows:c.weeks.map(w=>({key:w.key,inpsHours:25}))}).ok,false);
});
test('trimestre a tariffa unica bloccato se una settimana attraversa la soglia delle 24 ore',()=>{
 for(const [hours,other] of [[25,20],[20,25]]){
  const d=makeQuarterDraft(checked({hours}),4);d.confirmed=true;d.rows.forEach(r=>r.inpsHours=hours);d.rows[2].inpsHours=other;
  const r=calculateQuarter(d);assert.equal(r.ok,false);assert.ok(r.errors.some(e=>e.message.includes('soglia')));
 }
});
test('trimestre: ore impossibili nei giorni di assunzione o cessazione bloccate',()=>{
 const r=checked({hireDate:'2026-10-31',endDate:'2026-10-31'}),d=makeQuarterDraft(r,4);
 d.confirmed=true;d.rows.forEach(x=>x.inpsHours=0);d.rows.at(-1).inpsHours=25;
 assert.equal(calculateQuarter(d).ok,false);
});
test('il mese medio differisce dalle ore del calendario: nessuna promessa di cedolino esatto',()=>{
 const average=checked({}),actual=checked({monthMode:'actual',ordinaryPaidHours:110,holidayPaidHours:25/6});
 assert.equal(average.netOrdinary,1083.33);close(actual.netOrdinary,1141.67);
 assert.notEqual(average.netOrdinary,actual.netOrdinary);
});
