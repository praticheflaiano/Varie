import test from "node:test";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {calculate} from "../engine.js";
import {docx,xlsx,pdf,zip,crc32,utf8,snapshot,importSnapshot} from "../exports.js";
const r=calculate({employer:"Prova & Figli <Roma>",employee:"È una prova",scenario:"Esempio verificabile"});
const unzip=bytes=>{const out={},v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let n=0;while(v.getUint32(n,true)===0x04034b50){const size=v.getUint32(n+18,true),nameSize=v.getUint16(n+26,true),extraSize=v.getUint16(n+28,true),start=n+30+nameSize+extraSize,name=new TextDecoder().decode(bytes.slice(n+30,n+30+nameSize)),data=bytes.slice(start,start+size);assert.equal(crc32(data),v.getUint32(n+14,true));out[name]=new TextDecoder().decode(data);n=start+size;}return out;};
test("CRC32 standard e zip",()=>{assert.equal(crc32(utf8("123456789")),0xcbf43926);assert.equal(unzip(zip({"prova.txt":"è una prova"}))["prova.txt"],"è una prova");});
test("DOCX nativo con tabelle, stile, footer e testo escapato",()=>{
 const entries=unzip(docx(r));assert.ok(entries["[Content_Types].xml"]);assert.match(entries["word/document.xml"],/Prova &amp; Figli &lt;Roma&gt;/);assert.match(entries["word/document.xml"],/<w:tbl>/);assert.ok(entries["word/footer1.xml"]);assert.ok(entries["word/styles.xml"]);
});
test("XLSX nativo con formule e valori cached",()=>{
 const entries=unzip(xlsx(r));assert.match(entries["xl/workbook.xml"],/Calcoli/);assert.match(entries["xl/worksheets/sheet2.xml"],/<f>/);assert.match(entries["xl/worksheets/sheet2.xml"],/INDEX/);assert.match(entries["xl/worksheets/sheet5.xml"],/Prova &amp; Figli/);
});
test("PDF con xref corretto e font WinAnsi",()=>{
 const bytes=pdf(r),s=new TextDecoder().decode(bytes);assert.ok(s.startsWith("%PDF-1.4"));assert.match(s,/\/WinAnsiEncoding/);const index=Number(s.match(/startxref\n(\d+)/)[1]);assert.equal(s.slice(index,index+4),"xref");assert.match(s,/%%EOF/);
});
test("simulazione riapribile e importazione validata",()=>{
 const serialized=JSON.stringify(snapshot(r));assert.equal(importSnapshot(serialized).employer,r.input.employer);
 for(const text of ['{"input":{}}','{"application":"flaiano-domestico","schema":2,"rulesYear":2026,"input":{}}','{"application":"flaiano-domestico","schema":1,"rulesYear":2027,"input":{}}'])assert.throws(()=>importSnapshot(text));
});
test("esportazioni bloccate per calcoli invalidi",()=>{const bad=calculate({hours:0});for(const fn of [docx,xlsx,pdf,snapshot])assert.throws(()=>fn(bad));});
test("prepara campioni per verifica con software indipendenti",async()=>{
 await mkdir(".pwa-test-artifacts",{recursive:true});
 await writeFile(".pwa-test-artifacts/sample.docx",docx(r));await writeFile(".pwa-test-artifacts/sample.xlsx",xlsx(r));await writeFile(".pwa-test-artifacts/sample.pdf",pdf(r));
 await writeFile(".pwa-test-artifacts/expected.json",JSON.stringify({net:r.netPayable,cost:r.totalCost,annual:r.annualCost}));
});
