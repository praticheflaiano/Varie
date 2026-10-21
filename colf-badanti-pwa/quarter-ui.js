import {calculate} from "./engine.js";
import {makeQuarterDraft,quarterCalendar,calculateQuarter,importQuarterSnapshot} from "./quarter.js";
import {quarterDocx,quarterXlsx,quarterPdf,quarterSnapshot} from "./quarter-exports.js";
import {formatMoney,download} from "./exports.js";
import {registerContextGuides,closeContextHelp} from "./help.js";
const E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const n=s=>Number(s).toLocaleString("it-IT",{maximumFractionDigits:6});
export function installQuarterCalculator(root,getResult,toast){
 let draft=null,result=null;const periodDrafts=new Map();
 const periodKey=v=>String(v.quarter)+"|"+(v.terminationDate||"");
 root.innerHTML='<div class="quarter-toolbar"><span data-help-guide="quarter.copy"><button class="button primary" id="q-copy" type="button">Usa i parametri del preventivo</button></span><button class="button quiet" id="q-import" type="button">Riapri file trimestrale</button><input id="q-file" type="file" accept=".json,application/json" hidden></div><p class="muted" id="q-intro">Copia i parametri da un preventivo valido, poi compila le ore. I risultati trimestrali non derivano da tre mesi medi. Salva il file trimestrale per conservare il lavoro dopo la chiusura della pagina.</p><div id="q-editor"></div><div id="q-results" aria-live="polite"></div>';
 const $=id=>root.querySelector("#"+id);
 const field=(name,label,guide,type="number",extra="")=>'<div class="field"><div class="field-caption" data-help-guide="quarter.'+guide+'"><label for="q-'+name+'">'+label+'</label></div><input id="q-'+name+'" name="'+name+'" type="'+type+'" '+extra+'></div>';
 function refreshGuides(){registerContextGuides(root);}
 function copy(){
  const current=getResult();if(!current?.ok){toast("Correggi il preventivo prima di copiarne i parametri.");return;}
  const next=makeQuarterDraft(current,draft?.quarter);
  if(draft){for(const row of next.rows){const old=draft.rows.find(x=>x.key===row.key);if(old)Object.assign(row,old);}next.terminationDate=next.terminationDate||draft.terminationDate||"";}
  draft=next;rebuildCalendar();mount();toast("Parametri copiati. Verifica le ore e le condizioni del trimestre.");
 }
 function rebuildCalendar(){
  const c=quarterCalendar(draft.year,draft.quarter,draft.terminationDate);
  const old=draft.rows||[];draft.rows=c.weeks.map(w=>{const row=old.find(x=>x.key===w.key);return {key:w.key,inpsHours:row?.inpsHours??"",cassaHours:row?.cassaHours??""};});
  draft.confirmed=false;
 }
 function mount(){
  closeContextHelp();
  const r=getResultForDraft(),special=r?.special,c=quarterCalendar(draft.year,draft.quarter,draft.terminationDate);
  $("q-intro").textContent="Parametri copiati dal preventivo del "+draft.sourceInput.reference+". Per cambiare le condizioni, modifica il preventivo e ricopia i parametri.";
  $("q-editor").innerHTML='<form id="q-form" novalidate><section class="panel form-panel"><div class="section-heading"><span class="step">01</span><div><h2>Il trimestre e il rapporto</h2><p>Un rapporto con condizioni costanti nel periodo</p></div></div><div class="form-grid"><div class="field"><div class="field-caption" data-help-guide="quarter.period"><label for="q-quarter">Trimestre 2026</label></div><select name="quarter" id="q-quarter">'+[1,2,3,4].map(q=>'<option value="'+q+'">'+q+'° trimestre</option>').join("")+'</select></div>'+field("terminationDate","Cessazione effettiva nel trimestre","termination","date")+'</div><div class="quarter-profile"><strong>'+E(r?.level||"Dati da correggere")+'</strong><span>'+E(r?.regime||"")+' · '+E(draft.sourceInput.hours)+' ore settimanali</span><span>Retribuzione effettiva INPS: '+(r?n(r.rate.effective):"—")+' €/ora · '+(draft.sourceInput.contract==="fixed"?"Determinato"+(draft.sourceInput.substitution?" sostitutivo":""):"Indeterminato")+' · '+(draft.sourceInput.cuaf?"con CUAF":"senza CUAF")+'</span></div><p id="q-calendar" class="field-help"></p></section><section class="panel form-panel"><div class="panel-heading"><h2>Ore settimana per settimana</h2><span data-help-guide="quarter.fill"><button class="button quiet small" id="q-fill" type="button">Proponi ore contrattuali</button></span></div><p id="q-rows-note" class="field-help">Inserisci ore da presenze, compreso lo zero per settimane senza retribuzione. Le ore INPS saranno arrotondate una sola volta sul totale; la tredicesima non aggiunge ore.</p><div class="quarter-table-scroll"><table class="quarter-table"><thead><tr><th scope="col">Settimana · domenica/sabato</th><th scope="col">Ore INPS</th>'+(special?'<th scope="col">Ore Cassa</th>':"")+'</tr></thead><tbody id="q-weeks">'+c.weeks.map((w,k)=>'<tr><th scope="row">'+E(w.from)+'<small>'+E(w.to)+(w.partial?" · parziale":"")+'</small></th><td><div class="quarter-hour" data-help-guide="quarter.hours"><input data-week="'+k+'" data-column="inpsHours" type="number" min="0" max="168" step="0.01" inputmode="decimal" aria-label="Ore INPS settimana fino al '+E(w.to)+'" aria-describedby="q-rows-note" value="'+E(draft.rows[k].inpsHours)+'"></div></td>'+(special?'<td><div class="quarter-hour" data-help-guide="quarter.cassaHours"><input data-week="'+k+'" data-column="cassaHours" type="number" min="0" max="168" step="0.01" inputmode="decimal" aria-label="Ore Cassa settimana fino al '+E(w.to)+'" aria-describedby="q-rows-note" value="'+E(draft.rows[k].cassaHours)+'"></div></td>':"")+'</tr>').join("")+'</tbody></table></div><div class="check-with-help quarter-confirm" data-help-guide="quarter.confirm"><label class="check" for="q-confirmed"><input name="confirmed" id="q-confirmed" type="checkbox">Ho verificato le ore dalle presenze e la costanza di paga, orario per fascia e condizioni contributive nel periodo.</label></div></section><section class="panel form-panel"><div class="section-heading"><span class="step">02</span><div><h2>Confronto e trattenute</h2><p>Facoltativo · dati dell’avviso ufficiale e dei cedolini</p></div></div><div class="form-grid">'+field("officialInps","INPS sull’avviso (€)","officialInps","number",'min="0" step="0.01"')+field("officialCassa","CAS.SA.COLF F2 sull’avviso (€)","officialCassa","number",'min="0" step="0.01"')+field("withheldInps","INPS lavoratore già trattenuto (€)","withheldInps","number",'min="0" step="0.01"')+field("withheldCassa","Cassa lavoratore già trattenuta (€)","withheldCassa","number",'min="0" step="0.01"')+field("cassaSupplement","Integrazione volontaria F2 datore (€)","supplement","number",'min="0" step="0.01"')+'</div></section></form><div class="quarter-export"><h2>Conserva o esporta il trimestre</h2>'+[["docx","Word modificabile","exportDocx"],["xlsx","Excel con formule","exportXlsx"],["pdf","PDF","exportPdf"],["json","Salva file trimestrale","exportJson"]].map(([type,title,key])=>'<span data-help-guide="quarter.'+key+'"><button class="button '+(type==="xlsx"?"primary":"quiet")+'" data-quarter-export="'+type+'" type="button">'+title+'</button></span>').join("")+'</div>';
  $("q-quarter").value=String(draft.quarter);
  for(const key of ["terminationDate","officialInps","officialCassa","withheldInps","withheldCassa","cassaSupplement"])$("q-"+key).value=String(draft[key]??"");
  $("q-confirmed").checked=draft.confirmed===true;
  const carry=!draft.terminationDate&&c.carryFrom?" Giorni "+c.carryFrom+" – "+c.carryTo+" da riportare al trimestre successivo.":"";
  $("q-calendar").textContent="Periodo previdenziale: "+c.from+" – "+c.to+". Scadenza calcolata: "+c.due+"; verificare l’avviso INPS."+carry;
  $("q-form").addEventListener("input",event=>{
   if(event.target.name==="quarter"||event.target.name==="terminationDate")return;
   if(event.target.dataset.week!==undefined||event.target.name==="cassaSupplement"){$("q-confirmed").checked=false;}
   read();updateResult();
  });
  $("q-form").addEventListener("change",event=>{
   if(!["quarter","terminationDate"].includes(event.target.name))return;
   const before={quarter:draft.quarter,terminationDate:draft.terminationDate};
   periodDrafts.set(periodKey(before),JSON.parse(JSON.stringify(draft)));
   read();try{const previous=periodDrafts.get(periodKey(draft));if(previous)draft={...previous,confirmed:false};rebuildCalendar();mount();}catch(e){Object.assign(draft,before);$("q-quarter").value=String(before.quarter);$("q-terminationDate").value=before.terminationDate;toast(e.message);}
  });
  $("q-form").addEventListener("submit",event=>event.preventDefault());
  $("q-fill").addEventListener("click",()=>{
   read();const source=getResultForDraft(),cal=quarterCalendar(draft.year,draft.quarter,draft.terminationDate);
   if(!source){toast("Parametri non validi.");return;}
   const hire=source.input.hireDate;
   draft.rows=cal.weeks.map(w=>({key:w.key,inpsHours:hire&&w.to<hire?0:w.partial||hire&&w.from<hire?"":source.special?source.input.specialInpsHours:source.input.hours,cassaHours:hire&&w.to<hire?0:w.partial||hire&&w.from<hire?"":source.special?(source.input.regime==="night"?8:5)*source.input.nightsWeek:source.input.hours}));
   draft.confirmed=false;mount();toast("Ore proposte: correggi i dati dalle presenze prima della conferma.");
  });
  refreshGuides();updateResult();
 }
 function getResultForDraft(){const r=calculate(draft.sourceInput);return r.ok?r:null;}
 function read(){
  if(!draft)return;
  draft.quarter=Number($("q-quarter").value);draft.terminationDate=$("q-terminationDate").value;
  draft.confirmed=$("q-confirmed").checked;
  for(const key of ["officialInps","officialCassa","withheldInps","withheldCassa","cassaSupplement"])draft[key]=$("q-"+key).value;
  root.querySelectorAll("[data-week][data-column]").forEach(input=>{draft.rows[Number(input.dataset.week)][input.dataset.column]=input.value;});
 }
 function updateResult(){
  closeContextHelp();result=calculateQuarter(draft);
  root.querySelectorAll("[data-quarter-export]").forEach(b=>b.disabled=b.dataset.quarterExport!=="json"&&!result.ok);
  if(!result.ok){$("q-results").innerHTML='<div class="notice" role="status"><strong>Completa il prospetto trimestrale</strong><ul>'+[...new Set(result.errors.map(x=>x.message))].slice(0,6).map(t=>'<li>'+E(t)+'</li>').join("")+'</ul></div>';return;}
  const r=result,m=formatMoney,hasCompare=r.inpsDifference!==null&&r.cassaDifference!==null,status=r.reconciled?"Importi coincidenti con l’avviso":hasCompare?"Scostamento rispetto all’avviso":"Confronto con avviso da completare";
  const diff=(label,value)=>{const guide=/Differenza|Saldo/.test(label)?"reconciliation":/Cassa|COLF/.test(label)?"cassaResult":/INPS/.test(label)?"inpsResult":"split";return '<tr><td data-help-guide="quarter.'+guide+'">'+label+'</td><td>'+(value===null?"Non indicato":E(m(value)))+'</td></tr>';};
  $("q-results").innerHTML='<section class="panel result-panel quarter-results"><div class="panel-heading"><h2 data-help-guide="quarter.total">Totale trimestrale INPS + F2</h2><span class="badge">Prospetto di controllo</span></div><strong class="quarter-total" data-testid="quarter-total">'+E(m(r.total))+'</strong><p class="field-help">'+n(r.inpsHours)+' ore INPS dichiarate da '+n(r.rawInpsHours)+' ore prima dell’arrotondamento · '+r.paidWeeks+' settimane retribuite</p><table class="data-table"><thead><tr><th scope="col" data-help-guide="quarter.split">Contributo</th><th scope="col">Importo</th></tr></thead><tbody>'+diff("INPS totale",r.inpsTotal)+diff("INPS lavoratore",r.inpsWorker)+diff("INPS datore",r.inpsEmployer)+diff("CAS.SA.COLF F2 totale",r.cassaTotal)+diff("Cassa lavoratore",r.cassaWorker)+diff("Cassa datore · integrazione inclusa",r.cassaEmployer)+diff("Quota complessiva datore",r.employerTotal)+diff("Quota complessiva lavoratore",r.workerTotal)+'</tbody></table><div class="'+(hasCompare&&!r.reconciled?"warning-box":"quarter-reconciliation")+'"><h2 data-help-guide="quarter.reconciliation">'+status+'</h2><table class="data-table"><tbody>'+diff("Differenza INPS · calcolo meno avviso",r.inpsDifference)+diff("Differenza F2 · calcolo meno avviso",r.cassaDifference)+diff("Saldo INPS lavoratore",r.inpsWorkerBalance)+diff("Saldo Cassa lavoratore",r.cassaWorkerBalance)+'</tbody></table><p class="field-help">Saldi positivi: quote residue da riconciliare; negativi: eccedenze. Gli importi coincidenti non certificano presenze o inquadramento.</p></div><p class="notice">Il prospetto non è un avviso pagoPA. Genera e verifica il documento ufficiale nel Portale INPS, con il codice F2 e gli importi distinti.</p><p class="mini-note">'+r.notes.map(E).join("<br>")+'</p></section>';
  refreshGuides();
 }
 $("q-copy").addEventListener("click",copy);
 $("q-import").addEventListener("click",()=>$("q-file").click());
 $("q-file").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{if(file.size>200000)throw new Error("File troppo grande.");draft=importQuarterSnapshot(await file.text());mount();toast("Trimestre riaperto. Ricontrolla i dati e conferma le presenze.");}catch(e){toast(e.message);}event.target.value="";
 });
 root.addEventListener("click",event=>{
  const button=event.target.closest("[data-quarter-export]");if(!button||button.disabled)return;
  try{
   read();updateResult();const type=button.dataset.quarterExport,stem="flaiano-contributi-"+draft.year+"-T"+draft.quarter;
   if(type==="json")download(JSON.stringify(quarterSnapshot(draft),null,2),stem+".json","application/json");
   else if(!result?.ok)throw new Error("Completa i dati prima di esportare.");
   else if(type==="docx")download(quarterDocx(result),stem+".docx","application/vnd.openxmlformats-officedocument.wordprocessingml.document");
   else if(type==="xlsx")download(quarterXlsx(result),stem+".xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
   else if(type==="pdf")download(quarterPdf(result),stem+".pdf","application/pdf");
   toast("File trimestrale "+type.toUpperCase()+" generato.");
  }catch(e){toast(e.message||"Esportazione trimestrale non riuscita.");}
 });
 refreshGuides();
}
