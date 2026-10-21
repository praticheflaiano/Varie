import {RULES,VERSION,validISODate,inpsRate} from "./data.js";
import {calculate,money} from "./engine.js";
const DAY=86400000,iso=d=>new Date(d).toISOString().slice(0,10),stamp=s=>Date.parse(s+"T00:00:00Z");
const lastSaturday=d=>{const n=new Date(d);return d-((n.getUTCDay()+1)%7)*DAY;};
export function quarterCalendar(year,quarter,terminationDate=""){
 year=Number(year);quarter=Number(quarter);
 if(year!==RULES.year||!Number.isInteger(quarter)||quarter<1||quarter>4)throw new Error("Sono disponibili soltanto i quattro trimestri del 2026.");
 const solarFrom=Date.UTC(year,(quarter-1)*3,1),solarTo=Date.UTC(year,quarter*3,0);
 const from=lastSaturday(solarFrom-DAY)+DAY,last=lastSaturday(solarTo);
 let to=last;
 if(terminationDate){
  if(!validISODate(terminationDate)||stamp(terminationDate)<solarFrom||stamp(terminationDate)>solarTo)throw new Error("La cessazione deve essere una data valida del trimestre solare scelto.");
  to=stamp(terminationDate);
 }
 const weeks=[];
 for(let start=from;start<=to;start+=7*DAY){const end=Math.min(start+6*DAY,to);weeks.push({from:iso(start),to:iso(end),key:iso(end),partial:end-start<6*DAY});}
 const due=terminationDate?shiftDue(stamp(terminationDate)+10*DAY):["2026-04-10","2026-07-10","2026-10-10","2027-01-11"][quarter-1];
 return {year,quarter,solarFrom:iso(solarFrom),solarTo:iso(solarTo),from:iso(from),to:iso(to),lastSaturday:iso(last),carryFrom:to<solarTo?iso(to+DAY):null,carryTo:to<solarTo?iso(solarTo):null,due:typeof due==="number"?iso(due):due,weeks,terminationDate};
}
function shiftDue(day){
 const fixed=new Set(["01-01","01-06","04-25","05-01","06-02","08-15","10-04","11-01","12-08","12-25","12-26"]);
 while(new Date(day).getUTCDay()===0||fixed.has(iso(day).slice(5))||iso(day)==="2026-04-06")day+=DAY;
 return day;
}
const optionalNumber=(v,key,fail)=>{
 if(v===""||v===null||v===undefined)return null;
 const n=Number(v);if(!Number.isFinite(n)||n<0||n>1000000){fail(key,"Inserire un importo valido, non negativo.");return null;}return money(n);
};
export function makeQuarterDraft(result,quarter=Math.ceil(Number(result?.input?.reference?.slice(5,7))/3)){
 if(!result?.ok)throw new Error("Correggi il preventivo prima di copiarne i parametri.");
 const end=result.input.endDate;
 const terminationDate=end&&end.slice(0,4)===String(RULES.year)&&Math.ceil(Number(end.slice(5,7))/3)===Number(quarter)?end:"";
 const calendar=quarterCalendar(RULES.year,quarter,terminationDate);
 return {schema:1,year:RULES.year,quarter,terminationDate,sourceInput:{...result.input},rows:calendar.weeks.map(w=>({key:w.key,inpsHours:"",cassaHours:""})),confirmed:false,cassaSupplement:0,officialInps:"",officialCassa:"",withheldInps:"",withheldCassa:""};
}
export function calculateQuarter(raw){
 const errors=[],fail=(key,message)=>errors.push({key,message});
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false,errors:[{key:"quarter",message:"Prospetto trimestrale non valido."}]};
 let calendar;try{calendar=quarterCalendar(raw.year,raw.quarter,raw.terminationDate||"");}catch(e){fail("quarter",e.message);}
 if(!raw.sourceInput||typeof raw.sourceInput!=="object"||Array.isArray(raw.sourceInput))fail("sourceInput","Copia i parametri da un preventivo valido.");
 const source=raw.sourceInput?calculate(raw.sourceInput):null;
 if(!source?.ok)fail("sourceInput","I parametri di origine non producono un calcolo valido. Riapri e correggi il preventivo.");
 if(calendar&&source?.ok){
  const {hireDate,endDate}=source.input;
  if(hireDate&&hireDate>calendar.solarTo||endDate&&endDate<calendar.from)fail("sourceInput","Il rapporto non è attivo nel trimestre selezionato.");
  if(endDate&&endDate>=calendar.solarFrom&&endDate<=calendar.solarTo&&calendar.terminationDate!==endDate)fail("terminationDate","La cessazione del trimestre deve coincidere con la fine rapporto già indicata nel preventivo.");
  if(endDate&&calendar.terminationDate&&endDate!==calendar.terminationDate)fail("terminationDate","Le date di cessazione del preventivo e del trimestre non coincidono.");
 }
 const rows=Array.isArray(raw.rows)?raw.rows:[];
 if(calendar&&(rows.length!==calendar.weeks.length||rows.some((r,n)=>r?.key!==calendar.weeks[n]?.key)))fail("rows","Le settimane non corrispondono al calendario selezionato: rigenera il prospetto.");
 if(raw.confirmed!==true)fail("confirmed","Conferma ore da presenze e condizioni retributive e contributive costanti nel trimestre.");
 if(errors.length)return {ok:false,errors,calendar};
 if(source.input.autoScatti){
  const grossValues=[];
  for(let month=(calendar.quarter-1)*3+1;month<=calendar.quarter*3;month++){
   const ref=calendar.year+"-"+String(month).padStart(2,"0");
   if(source.input.hireDate&&ref<source.input.hireDate.slice(0,7)||calendar.terminationDate&&ref>calendar.terminationDate.slice(0,7))continue;
   const r=calculate({...source.input,reference:ref});
   if(!r.ok||Math.abs(r.grossSalary-source.grossSalary)>1e-7)fail("sourceInput","Nel trimestre cambia la paga per gli scatti: preparare conteggi distinti per i periodi e verificare l’avviso INPS.");
   if(r.ok)grossValues.push(r.grossSalary);
  }
 }
 if(errors.length)return {ok:false,errors,calendar};
 const special=source.special,checked=[];
 for(let n=0;n<rows.length;n++){
  const row=rows[n],w=calendar.weeks[n],read=(key)=>{
   const value=row[key];if(value===""||value===null||value===undefined){fail("rows","Completa le ore della settimana "+w.from+" – "+w.to+"; usa 0 se non retribuita.");return 0;}
   const num=Number(value);if(!Number.isFinite(num)||num<0||num>168){fail("rows","Ore settimanali non valide per "+w.to+".");return 0;}return num;
  };
  const inpsHours=read("inpsHours"),cassaHours=special?read("cassaHours"):inpsHours;
  const referenceHours=special?source.input.specialInpsHours:source.input.hours;
  if(inpsHours>0&&(inpsHours>24)!==(referenceHours>24))fail("rows","La settimana fino al "+w.to+" attraversa la soglia delle 24 ore rispetto alla tariffa del preventivo. Questo prospetto a tariffa unica non è applicabile: elaborare le fasce settimanali e verificare i relativi importi nel Portale INPS.");
  if(source.input.hireDate&&w.to<source.input.hireDate&&(inpsHours>0||cassaHours>0))fail("rows","Sono indicate ore anteriori all’assunzione nella settimana "+w.to+".");
  const activeFrom=source.input.hireDate&&source.input.hireDate>w.from?source.input.hireDate:w.from;
  const activeTo=source.input.endDate&&source.input.endDate<w.to?source.input.endDate:w.to;
  const maximumHours=Math.max(0,(stamp(activeTo)-stamp(activeFrom))/DAY+1)*24;
  if(inpsHours>maximumHours+1e-7||cassaHours>maximumHours+1e-7)fail("rows","Le ore superano il tempo disponibile nei giorni di rapporto della settimana "+w.to+".");
  checked.push({...w,inpsHours,cassaHours});
 }
 const cassaSupplement=optionalNumber(raw.cassaSupplement,"cassaSupplement",fail)??0;
 const officialInps=optionalNumber(raw.officialInps,"officialInps",fail),officialCassa=optionalNumber(raw.officialCassa,"officialCassa",fail);
 const withheldInps=optionalNumber(raw.withheldInps,"withheldInps",fail),withheldCassa=optionalNumber(raw.withheldCassa,"withheldCassa",fail);
 if(errors.length)return {ok:false,errors,calendar};
 const rawInpsHours=checked.reduce((sum,r)=>sum+r.inpsHours,0),inpsHours=Math.ceil(rawInpsHours-1e-9);
 const cassaHours=special?checked.reduce((sum,r)=>sum+r.cassaHours,0):inpsHours;
 const rate=inpsRate({effective:source.rate.effective,hoursWeek:source.special?source.input.specialInpsHours:source.input.hours,contract:source.input.contract,substitution:source.input.substitution,cuaf:source.input.cuaf});
 const inpsTotal=money(inpsHours*rate.total),inpsWorker=money(inpsHours*rate.worker),inpsEmployer=money(inpsTotal-inpsWorker);
 const cassaTotal=money(cassaHours*RULES.cassa.total+cassaSupplement),cassaWorker=money(cassaHours*RULES.cassa.worker),cassaEmployer=money(cassaTotal-cassaWorker);
 const total=money(inpsTotal+cassaTotal),workerTotal=money(inpsWorker+cassaWorker),employerTotal=money(inpsEmployer+cassaEmployer);
 const inpsDifference=officialInps===null?null:money(inpsTotal-officialInps),cassaDifference=officialCassa===null?null:money(cassaTotal-officialCassa);
 const reconciled=inpsDifference===0&&cassaDifference===0;
 const notes=[
  "Prospetto di controllo per un solo rapporto e condizioni retributive e contributive costanti. Variazioni di paga, fascia, orario contrattuale, CUAF, durata o agevolazioni richiedono conteggi distinti e verifica nel Portale INPS.",
  "Calendario previdenziale: settimana da domenica a sabato. In assenza di cessazione i giorni successivi all’ultimo sabato passano al trimestre successivo. La cessazione comprende anche la settimana finale parziale.",
  "Le ore INPS sono sommate nel trimestre e arrotondate all’unità superiore una sola volta. Non si arrotondano preventivamente le singole settimane.",
  special?"Ore CAS.SA.COLF separate, da verificare secondo gli artt. 10 e 11 e 54 CCNL: 8 ore per notte di assistenza o 5 di presenza, oltre alle prestazioni attive pertinenti.":"CAS.SA.COLF F2: applicati 0,06 euro alle ore dichiarate nel prospetto INPS, con 0,02 euro al lavoratore e 0,04 euro al datore.",
  "Il totale INPS è calcolato sulla tariffa totale ufficiale; la quota datore è il residuo dopo la quota lavoratore. Il trimestre non è la somma delle stime mensili arrotondate.",
  "L’integrazione F2 eventualmente inserita resta interamente a carico del datore e non garantisce da sola il diritto alle prestazioni della Cassa.",
  "Gli importi dell’avviso si confrontano separatamente per INPS e F2, senza commissioni, sanzioni, arretrati o interessi. La coincidenza degli importi non certifica presenze, inquadramento o correttezza delle comunicazioni.",
  "Questo file non è un avviso pagoPA e non contiene un codice di pagamento. Generare l’avviso ufficiale e verificare la scadenza nel Portale INPS."
 ];
 return {ok:true,kind:"quarter",schema:1,version:VERSION,rulesYear:RULES.year,calendar,source,rows:checked,rate,rawInpsHours,inpsHours,cassaHours,inpsTotal,inpsWorker,inpsEmployer,cassaTotal,cassaWorker,cassaEmployer,cassaSupplement,total,workerTotal,employerTotal,officialInps,officialCassa,inpsDifference,cassaDifference,reconciled,withheldInps,withheldCassa,inpsWorkerBalance:withheldInps===null?null:money(inpsWorker-withheldInps),cassaWorkerBalance:withheldCassa===null?null:money(cassaWorker-withheldCassa),paidWeeks:checked.filter(r=>r.inpsHours>0).length,notes};
}
export function importQuarterSnapshot(text){
 if(String(text).length>200000)throw new Error("File trimestrale troppo grande.");
 const value=JSON.parse(text);
 if(value.application!=="flaiano-domestico-quarter"||value.schema!==1||value.rulesYear!==RULES.year||!value.input||typeof value.input!=="object"||Array.isArray(value.input))throw new Error("Formato trimestrale non compatibile.");
 const p=value.input;
 quarterCalendar(p.year,p.quarter,p.terminationDate||"");
 if(!p.sourceInput||!calculate(p.sourceInput).ok)throw new Error("Parametri del prospetto trimestrale non validi.");
 const calendar=quarterCalendar(p.year,p.quarter,p.terminationDate||"");
 if(!Array.isArray(p.rows)||p.rows.length!==calendar.weeks.length||p.rows.some((r,n)=>!r||r.key!==calendar.weeks[n].key))throw new Error("Settimane del file trimestrale non valide.");
 return {...p,confirmed:false};
}
