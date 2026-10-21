import test from "node:test";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {calculate} from "../engine.js";
import {quarterCalendar,makeQuarterDraft,calculateQuarter,importQuarterSnapshot} from "../quarter.js";
import {quarterDocx,quarterXlsx,quarterPdf,quarterSnapshot,quarterReport} from "../quarter-exports.js";
const draft=(input={},q=4)=>{
 const result=calculate(input);assert.equal(result.ok,true,JSON.stringify(result.errors));
 const d=makeQuarterDraft(result,q);
 for(const row of d.rows){row.inpsHours=result.special?result.input.specialInpsHours:result.input.hours;row.cassaHours=result.cassaMeanHours*12/52;}
 d.confirmed=true;return d;
};
const checked=d=>{const r=calculateQuarter(d);assert.equal(r.ok,true,JSON.stringify(r.errors));return r;};
test("calendario 2026: settimane e riporto dei giorni fra trimestri",()=>{
 const a=quarterCalendar(2026,1),b=quarterCalendar(2026,2),d=quarterCalendar(2026,4);
 assert.equal(a.from,"2025-12-28");assert.equal(a.to,"2026-03-28");assert.equal(b.from,"2026-03-29");
 assert.equal(a.weeks.length,13);assert.equal(a.weeks.filter(w=>w.to.slice(5,7)==="01").length,5);
 assert.equal(d.carryFrom,"2026-12-27");assert.equal(d.carryTo,"2026-12-31");
 for(const q of [1,2,3,4])assert.equal(quarterCalendar(2026,q).weeks.length,13);
});
test("scadenze: sabato non spostato, domenica spostata",()=>{
 assert.equal(quarterCalendar(2026,3).due,"2026-10-10");
 assert.equal(quarterCalendar(2026,4).due,"2027-01-11");
});
test("cessazione comprende giorni dopo ultimo sabato e termine dieci giorni",()=>{
 const c=quarterCalendar(2026,3,"2026-09-29");
 assert.equal(c.to,"2026-09-29");assert.equal(c.weeks.at(-1).partial,true);assert.equal(c.weeks.at(-1).from,"2026-09-27");assert.equal(c.due,"2026-10-09");
 assert.throws(()=>quarterCalendar(2026,3,"2026-02-30"));
 assert.throws(()=>quarterCalendar(2027,1));
});
test("25 ore: quote trimestrali riconciliate al centesimo",()=>{
 const r=checked(draft());
 assert.equal(r.inpsHours,325);assert.equal(r.inpsTotal,403);assert.equal(r.inpsWorker,100.75);assert.equal(r.inpsEmployer,302.25);
 assert.equal(r.cassaTotal,19.5);assert.equal(r.total,422.5);assert.equal(r.workerTotal,107.25);assert.equal(r.employerTotal,315.25);
 assert.equal(Math.round((r.workerTotal+r.employerTotal)*100),Math.round(r.total*100));
});
test("20 ore: seconda fascia e tabella TD/sostitutivo/CUAF",()=>{
 const r=checked(draft({hours:20,payMode:"gross",pay:10}));
 assert.equal(r.rate.band,1);assert.equal(r.inpsTotal,499.2);assert.equal(r.total,514.8);
 assert.equal(checked(draft({contract:"fixed"})).rate.total,1.32);
 assert.equal(checked(draft({contract:"fixed",substitution:true})).rate.total,1.24);
 assert.equal(checked(draft({cuaf:false})).rate.total,1.25);
});
test("arrotondamento ore una sola volta sul trimestre",()=>{
 const d=draft({hours:20,payMode:"gross",pay:10});d.rows.forEach(r=>r.inpsHours=1.25);
 const r=checked(d);assert.equal(r.rawInpsHours,16.25);assert.equal(r.inpsHours,17);assert.equal(r.cassaHours,17);assert.equal(r.inpsTotal,32.64);
});
test("rapporti notturni: ore Cassa separate dalla base INPS",()=>{
 const d=draft({regime:"night",level:"CS",hours:40,payMode:"minimum",specialConfirmed:true,specialInpsHours:30,nightsWeek:5});
 const r=checked(d);assert.equal(r.inpsHours,390);assert.equal(r.cassaHours,520);assert.equal(r.inpsTotal,483.6);assert.equal(r.cassaTotal,31.2);
});
test("avviso separato da trattenute e integrazione del solo datore",()=>{
 const d=draft();Object.assign(d,{officialInps:403,officialCassa:20.5,cassaSupplement:1,withheldInps:100.74,withheldCassa:6.5});
 const r=checked(d);assert.equal(r.reconciled,true);assert.equal(r.cassaWorker,6.5);assert.equal(r.cassaEmployer,14);assert.equal(r.inpsWorkerBalance,.01);assert.equal(r.cassaWorkerBalance,0);
 d.officialCassa=20.49;assert.equal(checked(d).reconciled,false);assert.equal(checked(d).cassaDifference,.01);
});
test("dati incompleti, duplicati, invalidi o non confermati non espongono totali",()=>{
 const original=draft();
 for(const edit of [d=>d.confirmed=false,d=>d.rows[0].inpsHours="",d=>d.rows[0].inpsHours=-1,d=>d.rows[0].inpsHours="abc",d=>d.rows[1].key=d.rows[0].key,d=>d.officialInps=-1,d=>d.sourceInput.nonstandardContributions=true]){
  const d=structuredClone(original);edit(d);const r=calculateQuarter(d);assert.equal(r.ok,false);assert.equal(r.total,undefined);
 }
 assert.equal(checked(original).reconciled,false);
});
test("scatti che cambiano la paga nel trimestre richiedono periodi distinti",()=>{
 const d=draft({payMode:"minimum",autoScatti:true,hireDate:"2024-11-01"});
 const r=calculateQuarter(d);assert.equal(r.ok,false);assert.ok(r.errors.some(e=>e.message.includes("scatti")));
});
test("file trimestrale ricalcolabile e conferma rimossa alla riapertura",()=>{
 const d=draft(),json=JSON.stringify(quarterSnapshot(d)),restored=importQuarterSnapshot(json);
 assert.equal(restored.confirmed,false);assert.equal(restored.rows.length,13);
 assert.throws(()=>importQuarterSnapshot(JSON.stringify({application:"flaiano-domestico-quarter",schema:1,rulesYear:2026,input:{...d,rows:[]}})));
});
test("documenti trimestrali reali con settimane, formule e fonti",async()=>{
 const r=checked(draft({employer:"Famiglia & <prova>",employee:"Lavoratrice di prova"}));
 const sections=quarterReport(r).sections;assert.ok(sections.some(s=>s.title==="Settimane e ore da presenze"&&s.rows.length===13));
 const files={docx:quarterDocx(r),xlsx:quarterXlsx(r),pdf:quarterPdf(r)};
 assert.equal(files.docx[0],80);assert.equal(files.xlsx[0],80);assert.equal(new TextDecoder().decode(files.pdf.slice(0,8)),"%PDF-1.4");
 const xml=new TextDecoder().decode(files.xlsx);assert.ok(xml.includes("ROUNDUP(SUM(Settimane!C2:C14),0)"));assert.ok(xml.includes("Riconciliazione"));
 await mkdir("pwa-test-artifacts",{recursive:true});
 for(const [ext,bytes] of Object.entries(files))await writeFile("pwa-test-artifacts/contributi-trimestre."+ext,bytes);
});
