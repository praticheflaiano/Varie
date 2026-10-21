import {SOURCES,VERSION,RULES} from "./data.js";
import {formatMoney,workbook,docx,pdf} from "./exports.js";
const num=n=>Number(n).toLocaleString("it-IT",{maximumFractionDigits:6});
const val=n=>n===null?"Non indicato":formatMoney(n);
export function quarterReport(r){
 if(!r?.ok)throw new Error("Completa il prospetto trimestrale prima di esportare.");
 const i=r.source.input,c=r.calendar;
 const sections=[
  {title:"Dati e periodo",rows:[["Tipo documento","Prospetto di controllo contributivo; non è un avviso pagoPA"],["Datore",i.employer||"Non indicato"],["Lavoratore",i.employee||"Non indicato"],["Operatore",i.operator||"Non indicato"],["Trimestre",c.quarter+" / "+c.year],["Periodo previdenziale",c.from+" – "+c.to],["Cessazione",c.terminationDate||"Non indicata"],["Scadenza ordinaria calcolata",c.due+" · verificare avviso INPS"],["Condizioni",r.source.level+" · "+r.source.regime],["Contratto",i.contract==="fixed"?"Tempo determinato"+(i.substitution?" sostitutivo":""):"Tempo indeterminato"],["CUAF",i.cuaf?"Tabella con CUAF":"Tabella senza CUAF"],["Retribuzione effettiva oraria INPS",num(r.rate.effective)+" euro"],["Orario settimanale per fascia",num(r.source.special?i.specialInpsHours:i.hours)],["Fascia",r.rate.band===3?"Oltre 24 ore settimanali":String(r.rate.band+1)],["Contributo orario INPS totale / lavoratore",formatMoney(r.rate.total)+" / "+formatMoney(r.rate.worker)]]},
  {title:"Ore e quote trimestrali",rows:[["Ore INPS prima dell’arrotondamento",num(r.rawInpsHours)],["Ore INPS dichiarate dopo arrotondamento",num(r.inpsHours)],["Settimane con retribuzione",String(r.paidWeeks)],["Ore CAS.SA.COLF",num(r.cassaHours)],["INPS totale",formatMoney(r.inpsTotal)],["INPS lavoratore",formatMoney(r.inpsWorker)],["INPS datore",formatMoney(r.inpsEmployer)],["CAS.SA.COLF totale · F2",formatMoney(r.cassaTotal)],["CAS.SA.COLF lavoratore",formatMoney(r.cassaWorker)],["CAS.SA.COLF datore, integrazione inclusa",formatMoney(r.cassaEmployer)],["Integrazione volontaria F2 datore",formatMoney(r.cassaSupplement)],["Totale INPS + F2",formatMoney(r.total)],["Quota complessiva lavoratore",formatMoney(r.workerTotal)],["Quota complessiva datore",formatMoney(r.employerTotal)]]},
  {title:"Settimane e ore da presenze",rows:r.rows.map(w=>[w.from+" – "+w.to+(w.partial?" · parziale":""),"INPS: "+num(w.inpsHours)+" ore; Cassa: "+num(w.cassaHours)+" ore"+(!r.source.special?" prima dell’arrotondamento trimestrale":"")])},
  {title:"Riconciliazione",rows:[["INPS sull’avviso ufficiale",val(r.officialInps)],["F2 sull’avviso ufficiale",val(r.officialCassa)],["Differenza INPS · calcolo meno avviso",val(r.inpsDifference)],["Differenza F2 · calcolo meno avviso",val(r.cassaDifference)],["INPS lavoratore già trattenuto",val(r.withheldInps)],["Cassa lavoratore già trattenuta",val(r.withheldCassa)],["Saldo trattenute INPS",val(r.inpsWorkerBalance)],["Saldo trattenute Cassa",val(r.cassaWorkerBalance)],["Lettura dei saldi","Positivo: quota residua da riconciliare; negativo: eccedenza da restituire. Non applicati automaticamente ai cedolini."]]},
  {title:"Metodo e verifiche",rows:[...r.notes.map(n=>["Metodo",n]),["Giorni da riportare al trimestre successivo",c.terminationDate?"Non applicabile alla cessazione":c.carryFrom?c.carryFrom+" – "+c.carryTo:"Nessuno"],["Versione","App "+VERSION+" · tabelle "+RULES.year+" · verifica "+RULES.checked]]},
  {title:"Fonti",rows:SOURCES.map(s=>[s.title,s.url])}
 ];
 return {ok:true,kind:"quarter",input:{reference:c.quarter+" trimestre "+c.year},sections};
}
export function quarterDocx(r){return docx(quarterReport(r));}
export function quarterPdf(r){return pdf(quarterReport(r));}
export function quarterXlsx(r){
 if(!r?.ok)throw new Error("Prospetto trimestrale non valido.");
 const F=(formula,value)=>({formula,value}),last=r.rows.length+1;
 const params=[["PARAMETRI TRIMESTRALI","Valore"],["Anno",r.calendar.year],["Trimestre",r.calendar.quarter],["Dal",r.calendar.from],["Al",r.calendar.to],["Scadenza calcolata",r.calendar.due],["Inquadramento",r.source.level],["Rapporto",r.source.regime],["Retribuzione effettiva oraria INPS",r.rate.effective],["Ore settimanali per fascia",r.source.special?r.source.input.specialInpsHours:r.source.input.hours],["CUAF",r.source.input.cuaf?1:0],["Addizionale TD",r.rate.additional?1:0],["Nota","Tariffe copiate dalle tabelle 2026: per cambiare inquadramento, paga, fascia o condizioni rigenerare il prospetto nell’app."]];
 const weeks=[["Dal","Al","Ore INPS da presenze","Ore Cassa da presenze"],...r.rows.map(w=>[w.from,w.to,w.inpsHours,w.cassaHours])];
 const calc=[["CALCOLI TRIMESTRALI","Importo / ore"],
  ["Ore INPS dichiarate",F("ROUNDUP(SUM(Settimane!C2:C"+last+"),0)",r.inpsHours)],
  ["Contributo INPS orario totale",r.rate.total],["Contributo INPS orario lavoratore",r.rate.worker],
  ["INPS totale",F("ROUND(B2*B3,2)",r.inpsTotal)],
  ["INPS lavoratore",F("ROUND(B2*B4,2)",r.inpsWorker)],["INPS datore",F("ROUND(B5-B6,2)",r.inpsEmployer)],
  ["Ore Cassa",F(r.source.special?"SUM(Settimane!D2:D"+last+")":"B2",r.cassaHours)],
  ["Cassa oraria totale",.06],["Cassa oraria lavoratore",.02],["Integrazione F2 datore",r.cassaSupplement],
  ["Cassa totale F2",F("ROUND(B8*B9+B11,2)",r.cassaTotal)],
  ["Cassa lavoratore",F("ROUND(B8*B10,2)",r.cassaWorker)],["Cassa datore",F("ROUND(B12-B13,2)",r.cassaEmployer)],
  ["Totale INPS + F2",F("ROUND(B5+B12,2)",r.total)],
  ["Quota complessiva datore",F("ROUND(B7+B14,2)",r.employerTotal)],["Quota complessiva lavoratore",F("ROUND(B6+B13,2)",r.workerTotal)]
 ];
 const recon=[["RICONCILIAZIONE","Importo"],["INPS avviso",r.officialInps??""],["F2 avviso",r.officialCassa??""],["Differenza INPS",F('IF(B2="","",ROUND(Calcoli!B5-B2,2))',r.inpsDifference??"")],["Differenza F2",F('IF(B3="","",ROUND(Calcoli!B12-B3,2))',r.cassaDifference??"")],["INPS lavoratore già trattenuto",r.withheldInps??""],["Cassa lavoratore già trattenuta",r.withheldCassa??""],["Saldo INPS lavoratore",F('IF(B6="","",ROUND(Calcoli!B6-B6,2))',r.inpsWorkerBalance??"")],["Saldo Cassa lavoratore",F('IF(B7="","",ROUND(Calcoli!B13-B7,2))',r.cassaWorkerBalance??"")],["Saldi","Positivo: residuo; negativo: eccedenza da restituire. Il file non aggiorna automaticamente i cedolini."]];
 const original=[["PARAMETRI DI ORIGINE","Valore"],...Object.entries(r.source.input).map(([k,v])=>[k,typeof v==="boolean"?(v?1:0):v]),["Versione",VERSION]];
 return workbook([["Parametri",params],["Settimane",weeks],["Calcoli",calc],["Riconciliazione",recon],["Dati originali",original],["Fonti e note",[["METODO","Dettaglio"],...r.notes.map(n=>["Metodo",n]),...SOURCES.map(s=>[s.title,s.url])]]]);
}
export function quarterSnapshot(input){
 return {application:"flaiano-domestico-quarter",schema:1,appVersion:VERSION,rulesYear:RULES.year,createdAt:new Date().toISOString(),input};
}
