import {DEFAULTS,LEVELS,REGIMES,SOURCES,RULES,VERSION} from "./data.js";
import {calculate,normalize} from "./engine.js";
import {docx,xlsx,pdf,download,snapshot,importSnapshot,formatMoney,reportSections,zip} from "./exports.js";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const form=$("calculator-form"),storageKey="flaiano.domestico.archive.v1";
let current={...DEFAULTS},result=null,detailTab="payslip",comparison=[],toastTimer=null,installPrompt=null,updateTimer=null;
const pageNames={calculator:"Calcolatore",compare:"Confronta scenari",levels:"Livelli e mansioni",archive:"Preventivi salvati",sources:"Regole e fonti"};
$("regime").innerHTML=Object.entries(REGIMES).map(([k,v])=>'<option value="'+k+'">'+esc(v)+"</option>").join("");
$("level").innerHTML=Object.entries(LEVELS).map(([k,v])=>'<option value="'+k+'">'+esc(v.name)+"</option>").join("");
for(const c of form.elements)if(c.name&&!c.id)c.id="input-"+c.name;
function control(name){return form.elements.namedItem(name);}
function setForm(values){
 current=normalize(values);
 for(const [key,value] of Object.entries(current)){
  const el=control(key);if(!el)continue;
  if(el.type==="checkbox")el.checked=value===true;else el.value=String(value);
 }
 updateVisibility();
}
function readForm(){
 const next={...current};
 for(const key of Object.keys(DEFAULTS)){
  const el=control(key);if(!el)continue;
  next[key]=el.type==="checkbox"?el.checked:el.value;
 }
 current=normalize(next);return current;
}
function updateVisibility(){
 const i=current,hourly=["hourly","replacement"].includes(i.regime),special=["night","presence"].includes(i.regime);
 const flags={fixed:i.contract==="fixed",reduced:i.regime==="reduced",special,ds:i.level==="DS",bs:i.level==="BS",
 care:["CS","DS"].includes(i.level),uni:["B","BS","CS"].includes(i.level),minimum:i.payMode==="minimum",hourly,
 actual:i.monthMode==="actual","actual-hourly":i.monthMode==="actual"&&hourly,"actual-monthly":i.monthMode==="actual"&&!hourly};
 document.querySelectorAll("[data-visible]").forEach(el=>el.hidden=!flags[el.dataset.visible]);
 $("level-description").textContent=LEVELS[i.level]?.description||"Selezionare un livello.";
 document.querySelectorAll("[data-mode]").forEach(b=>{const chosen=b.dataset.mode===i.payMode;b.classList.toggle("selected",chosen);b.setAttribute("aria-pressed",String(chosen));});
 $("pay-field").hidden=i.payMode==="minimum";
 $("pay-label").textContent=i.payMode==="net"?"Netto ordinario concordato":"Lordo ordinario concordato";
 $("pay-explanation").textContent=i.payMode==="net"?"Il netto richiesto riguarda la paga ordinaria, prima dell’IRPEF personale. Ore aggiuntive, rimborsi e pagamenti di tredicesima o TFR sono separati.":i.payMode==="minimum"?"Al minimo contrattuale si aggiungono scatti, indennità e il superminimo inserito. La paga dei conviventi non viene ridotta automaticamente in proporzione alle ore.":"Il lordo inserito comprende minimo, scatti, indennità e superminimo; l’app ne verifica il rispetto del minimo complessivo. Non comprende il vitto/alloggio monetizzato.";
 control("scatti").disabled=i.autoScatti;
}
function toast(message){clearTimeout(toastTimer);$("toast").textContent=message;$("toast").hidden=false;toastTimer=setTimeout(()=>$("toast").hidden=true,5000);}
function go(page){
 document.querySelectorAll(".page").forEach(p=>p.hidden=p.id!=="page-"+page);
 document.querySelectorAll("[data-page]").forEach(b=>{const active=b.dataset.page===page;b.classList.toggle("active",active);if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});
 $("page-name").textContent=pageNames[page]||page;
 if(page==="compare")renderComparison();if(page==="archive")renderArchive();
 window.scrollTo({top:0,behavior:"instant"});
}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
function rows(items){return '<table class="data-table"><thead><tr><th scope="col">Voce</th><th scope="col">Importo</th></tr></thead><tbody>'+items.filter(x=>x.amount!==0||x.kind==="total").map(x=>'<tr class="'+esc(x.kind||"")+'"><td>'+esc(x.label)+(x.quantity?'<small class="muted"><br>'+esc(x.quantity)+" ore</small>":"")+'</td><td>'+esc(formatMoney(x.amount))+"</td></tr>").join("")+"</tbody></table>";}
function renderDetails(r){
 const tabs=[["payslip","Paga"],["employer","Costo datore"],["contributions","Contributi"],["composition","Composizione"]];
 let content="";
 if(detailTab==="payslip")content=rows(r.payslip);
 if(detailTab==="employer")content=rows(r.costRows);
 if(detailTab==="composition")content=rows(r.components)+rows([{label:"Lordo ordinario del mese medio",amount:r.grossSalary,kind:"total"}]);
 if(detailTab==="contributions")content=rows([{label:"INPS datore",amount:r.inpsEmployer},{label:"INPS lavoratore",amount:r.inpsWorker},{label:"INPS totale",amount:r.inpsTotal,kind:"total"},{label:"CAS.SA.COLF datore",amount:r.cassaEmployer},{label:"CAS.SA.COLF lavoratore",amount:r.cassaWorker},{label:"CAS.SA.COLF totale",amount:r.cassaTotal,kind:"total"}])+'<p class="mini-note">Fascia INPS: '+(r.rate.band===3?"oltre 24 ore settimanali":r.rate.band+1)+' · Retribuzione effettiva: '+esc(formatMoney(r.rate.effective))+'/ora.<br>Ore del periodo: INPS '+r.inpsHours.toLocaleString("it-IT",{maximumFractionDigits:3})+' · Cassa '+r.cassaHours.toLocaleString("it-IT",{maximumFractionDigits:3})+'.<br>Il versamento trimestrale effettivo richiede il calendario e le ore reali.</p>';
 return '<div class="panel result-panel"><div class="panel-heading"><h2>Il dettaglio, voce per voce</h2><span class="badge">2026</span></div><div class="result-tabs" role="group" aria-label="Dettaglio risultati">'+tabs.map(([k,label])=>'<button type="button" data-detail="'+k+'" class="'+(detailTab===k?"active":"")+'" aria-pressed="'+(detailTab===k)+'">'+label+"</button>").join("")+"</div>"+content+'<div class="accruals"><div><span>Rateo tredicesima</span><strong>'+esc(formatMoney(r.thirteenthAccrual))+'</strong></div><div><span>Rateo TFR</span><strong>'+esc(formatMoney(r.tfrAccrual))+'</strong></div><div><span>Ferie · giorni</span><strong>'+r.leaveAccrual.toLocaleString("it-IT",{maximumFractionDigits:3})+'</strong></div></div><p class="mini-note">I ratei maturati sono distinti dagli importi effettivamente pagati.</p></div>';
}
function render(){
 readForm();updateVisibility();result=calculate(current);
 for(const el of form.elements)if(el.removeAttribute)el.removeAttribute("aria-invalid");
 $("open-export").disabled=!result.ok;$("save-button").disabled=!result.ok;
 if(!result.ok){
  $("validation").innerHTML='<div class="error-box" role="alert"><strong>Completa o correggi questi dati</strong><ul>'+result.errors.map(x=>"<li>"+esc(x.message)+"</li>").join("")+"</ul></div>";
  for(const e of result.errors){const el=control(e.key);if(el)el.setAttribute("aria-invalid","true");}
  $("results").innerHTML='<div class="error-empty"><h2>Il prospetto sarà disponibile dopo la correzione.</h2><p>Non vengono mostrati risultati precedenti quando i dati non sono validi.</p></div>';return;
 }
 const r=result;
 $("validation").innerHTML=r.warnings.length?'<div class="warning-box"><strong>Verifiche per questo preventivo</strong><ul>'+r.warnings.map(w=>"<li>"+esc(w)+"</li>").join("")+"</ul></div>":"";
 $("results").innerHTML='<section class="result-hero"><div class="eyebrow">IL TUO PREVENTIVO · '+esc(current.reference)+'</div><div class="result-label">Costo del datore con accantonamenti</div><div class="amount" data-testid="total-cost">'+esc(formatMoney(r.totalCost))+'</div><div class="result-sub">'+(current.monthMode==="average"?"Stima per mese medio":"Simulazione del periodo")+' · inclusi ratei di tredicesima e TFR</div><hr class="hero-separator"><div class="hero-pair"><span>Costo corrente</span><strong>'+esc(formatMoney(r.currentCost))+'</strong></div></section>'+
 '<div class="result-metrics"><div class="metric"><span>Da corrispondere al lavoratore</span><strong data-testid="net-pay">'+esc(formatMoney(r.netPayable))+'</strong><small>Prima dell’eventuale IRPEF personale</small></div><div class="metric"><span>Lordo orario ordinario</span><strong data-testid="gross-hourly">'+esc(formatMoney(r.unitOrdinary))+'</strong><small>'+esc(r.level.split(" · ")[0])+' · '+current.hours+' ore settimanali</small></div><div class="metric"><span>Lordo monetario del periodo</span><strong>'+esc(formatMoney(r.gross))+'</strong><small>Competenze ordinarie e aggiuntive</small></div><div class="metric"><span>Costo annuo strutturale</span><strong>'+esc(formatMoney(r.annualCost))+'</strong><small>12 mesi a condizioni costanti; eventi esclusi se occasionali</small></div></div>'+
 renderDetails(r)+
 '<div class="result-actions"><button class="button primary" data-action="export">Esporta il prospetto ↓</button><button class="button quiet" data-action="compare">Aggiungi al confronto</button></div>'+
 '<section class="panel result-panel method-panel"><div class="panel-heading"><h2>Le ipotesi del calcolo</h2></div><ul class="method-list">'+r.notes.map(n=>"<li>"+esc(n)+"</li>").join("")+'</ul><p class="mini-note">App '+VERSION+' · Tabelle '+RULES.year+' · Fonti verificate il 20/10/2026</p></section>';
}
$("results").addEventListener("click",event=>{
 const detail=event.target.closest("[data-detail]");if(detail){detailTab=detail.dataset.detail;render();return;}
 const action=event.target.closest("[data-action]")?.dataset.action;
 if(action==="export")openExport();
 if(action==="compare")addComparison();
});
form.addEventListener("input",()=>{clearTimeout(updateTimer);updateTimer=setTimeout(render,180);});
form.addEventListener("change",event=>{
 const name=event.target.name;
 readForm();
 if(name==="regime"){
  const monthly=!["hourly","replacement"].includes(current.regime);
  current.payUnit=monthly?"month":"hour";current.payMode="minimum";
  current.meal=monthly;current.dinner=monthly;current.room=monthly;
  current.specialConfirmed=false;
  if(current.regime==="livein"){current.hours=54;current.days=6;}
  if(current.regime==="reduced"){current.hours=30;current.days=5;if(!LEVELS[current.level]?.reduced)current.level="BS";}
  if(current.regime==="night"){current.hours=40;current.days=5;if(!LEVELS[current.level]?.night)current.level="CS";}
  if(current.regime==="presence"){current.hours=25;current.days=5;}
  if(current.regime==="hourly"||current.regime==="replacement"){current.hours=25;current.days=5;}
  if(current.regime==="replacement"&&!LEVELS[current.level]?.replacement)current.level="CS";
  current.cashBenefitDays=0;current.specialInpsHours=0;
  current.overtime10=0;current.restWorked=0;
 }
 if(name==="level"||name==="regime"){
  if(current.level!=="BS")current.child=false;
  if(!["CS","DS"].includes(current.level))current.multiple=false;
  if(!["B","BS","CS"].includes(current.level))current.certified=false;
  current.qualified=false;
 }
 if(name==="hours")current.ordinaryPaidHours=current.hours*52/12;
 setForm(current);clearTimeout(updateTimer);render();
});
form.addEventListener("submit",event=>{event.preventDefault();clearTimeout(updateTimer);render();toast(result.ok?"Prospetto aggiornato.":"Correggi i dati evidenziati.");});
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{readForm();current.payMode=b.dataset.mode;setForm(current);render();}));
$("reset-button").addEventListener("click",()=>{setForm(DEFAULTS);render();toast("Nuovo preventivo pronto.");});
function openExport(){clearTimeout(updateTimer);render();if(!result.ok){toast("Correggi i dati prima di esportare.");return;}$("export-dialog").showModal();}
$("open-export").addEventListener("click",openExport);
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.close).close()));
const fileStem=()=>("flaiano-"+(current.scenario||"colf-badanti")+"-"+current.reference).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9-]+/g,"-").slice(0,100);
document.querySelectorAll("[data-export]").forEach(b=>b.addEventListener("click",()=>{
 try{
  clearTimeout(updateTimer);render();if(!result.ok)throw new Error("Correggi i dati prima di esportare.");
  const type=b.dataset.export,stem=fileStem();
  if(type==="docx")download(docx(result),stem+".docx","application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  if(type==="xlsx")download(xlsx(result),stem+".xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  if(type==="pdf")download(pdf(result),stem+".pdf","application/pdf");
  if(type==="json")download(JSON.stringify(snapshot(result),null,2),stem+".json","application/json");
  toast("Esportazione "+type.toUpperCase()+" generata.");
 }catch(e){toast(e.message||"Esportazione non riuscita.");}
}));
$("print-button").addEventListener("click",()=>{
 if(!result?.ok)return;
 $("print-report").innerHTML='<h1>Centro Pratiche Flaiano</h1><p>Colf e badanti · Prospetto economico · '+esc(current.reference)+'</p>'+reportSections(result).map(s=>"<h2>"+esc(s.title)+"</h2><table><thead><tr><th>Voce</th><th>Valore / dettaglio</th></tr></thead><tbody>"+s.rows.map(row=>"<tr><td>"+esc(row[0])+"</td><td>"+esc(row[1])+"</td></tr>").join("")+"</tbody></table>").join("");
 $("export-dialog").close();window.print();
});
function loadArchive(){
 try{const raw=localStorage.getItem(storageKey);if(!raw)return[];const a=JSON.parse(raw);return Array.isArray(a)?a.filter(x=>x&&typeof x.id==="string"&&x.snapshot?.application==="flaiano-domestico").slice(0,40):[];}
 catch{return[];}
}
function saveArchive(a){try{localStorage.setItem(storageKey,JSON.stringify(a));return true;}catch{toast("Salvataggio locale non disponibile. Esporta il file della simulazione.");return false;}}
$("save-button").addEventListener("click",()=>{
 render();if(!result.ok)return;
 const a=loadArchive(),id=Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);
 a.unshift({id,snapshot:snapshot(result),summary:{net:result.netPayable,cost:result.totalCost,annual:result.annualCost}});
 if(saveArchive(a.slice(0,40)))toast("Preventivo salvato su questo dispositivo.");
});
function renderArchive(){
 const a=loadArchive();
 $("archive-list").innerHTML=a.length?a.map(x=>'<article class="panel archive-card"><div><h2>'+esc(x.snapshot.input.scenario||"Preventivo")+'</h2><p>'+esc(x.snapshot.input.reference)+' · '+esc(x.snapshot.input.level)+' · '+esc(x.snapshot.input.hours)+' ore settimanali</p><p>Costo del periodo: '+esc(formatMoney(x.summary?.cost||0))+' · versione '+esc(x.snapshot.appVersion)+'</p></div><div class="archive-actions"><button class="button primary small" data-archive-open="'+esc(x.id)+'">Riapri</button><button class="button quiet small" data-archive-download="'+esc(x.id)+'">Scarica dati</button><button class="button quiet small" data-archive-delete="'+esc(x.id)+'">Elimina</button></div></article>').join(""):'<div class="empty-state"><h2>Nessun preventivo salvato</h2><p>Completa una simulazione e scegli “Salva preventivo”.</p><button class="button primary" data-go-calculator>Apri il calcolatore</button></div>';
}
$("archive-list").addEventListener("click",event=>{
 if(event.target.closest("[data-go-calculator]"))go("calculator");
 const open=event.target.closest("[data-archive-open]"),del=event.target.closest("[data-archive-delete]"),down=event.target.closest("[data-archive-download]");
 const id=open?.dataset.archiveOpen||del?.dataset.archiveDelete||down?.dataset.archiveDownload;if(!id)return;
 const a=loadArchive(),item=a.find(x=>x.id===id);if(!item)return;
 if(del){if(confirm("Eliminare questo preventivo dall’archivio del dispositivo?")){if(saveArchive(a.filter(x=>x.id!==id))){renderArchive();toast("Preventivo eliminato.");}}}
 if(open){setForm(item.snapshot.input);render();go("calculator");toast("Parametri riaperti e ricalcolati con la versione "+VERSION+".");}
 if(down)download(JSON.stringify(item.snapshot,null,2),"flaiano-simulazione-"+id+".json","application/json");
});
function addComparison(){
 if(!result?.ok)return;
 if(comparison.length>=4){toast("Il confronto contiene già quattro scenari. Rimuovine uno.");return;}
 comparison.push({name:current.scenario||"Scenario "+(comparison.length+1),input:JSON.parse(JSON.stringify(current)),net:result.netPayable,gross:result.unitOrdinary,cost:result.totalCost,annual:result.annualCost});
 $("compare-count").textContent=String(comparison.length);toast("Scenario aggiunto al confronto.");renderComparison();
}
function renderComparison(){
 if(!comparison.length){$("comparison").innerHTML='<div class="empty-state"><h2>Parti dal primo scenario</h2><p>Nel calcolatore scegli “Aggiungi al confronto”, modifica ore o paga e aggiungi lo scenario successivo.</p><button class="button primary" data-go-calculator>Apri il calcolatore</button></div>';return;}
 const data=[["Livello",s=>s.input.level],["Rapporto",s=>REGIMES[s.input.regime]],["Ore settimanali",s=>String(s.input.hours)],["Lordo orario",s=>formatMoney(s.gross)],["Da corrispondere",s=>formatMoney(s.net)],["Costo con ratei del periodo",s=>formatMoney(s.cost)],["Costo annuo strutturale",s=>formatMoney(s.annual)]];
 $("comparison").innerHTML='<div class="compare-wrap"><table class="compare-table"><thead><tr><th>Voce</th>'+comparison.map((s,n)=>'<th>'+esc(s.name)+'<small>'+esc(s.input.reference)+'</small><button class="text-button" data-compare-remove="'+n+'">Rimuovi</button></th>').join("")+'</tr></thead><tbody>'+data.map(([label,fn],n)=>'<tr class="'+(n>=5?"emphasis":"")+'"><th scope="row">'+esc(label)+'</th>'+comparison.map(s=>"<td>"+esc(fn(s))+"</td>").join("")+"</tr>").join("")+'</tbody></table></div><p class="muted">Confrontare periodi e condizioni omogenee. Gli scenari restano in memoria fino alla chiusura della pagina.</p>';
}
$("comparison").addEventListener("click",event=>{const remove=event.target.closest("[data-compare-remove]");if(remove){comparison.splice(Number(remove.dataset.compareRemove),1);$("compare-count").textContent=String(comparison.length);renderComparison();}if(event.target.closest("[data-go-calculator]"))go("calculator");});
$("levels-grid").innerHTML=Object.entries(LEVELS).map(([key,v])=>'<article class="panel level-card"><span class="level-letter">'+key+'</span><h2>'+esc(v.name.split(" · ")[1])+'</h2><p>'+esc(v.description)+'</p><div class="level-prices"><span>Non convivente / ora<strong>'+esc(formatMoney(v.hourly))+'</strong></span><span>Convivente / mese<strong>'+esc(formatMoney(v.monthly+(v.role||0)))+'</strong></span></div>'+(v.role?'<p class="mini-note">Include indennità di funzione di '+esc(formatMoney(v.role))+".</p>":"")+'<button class="button quiet small" data-select-level="'+key+'">Usa questo livello</button></article>').join("");
$("levels-grid").addEventListener("click",event=>{const b=event.target.closest("[data-select-level]");if(!b)return;readForm();current.level=b.dataset.selectLevel;current.regime="hourly";current.hours=25;current.days=5;current.payMode="minimum";current.payUnit="hour";current.child=false;current.multiple=false;current.certified=false;current.meal=false;current.dinner=false;current.room=false;setForm(current);render();go("calculator");});
$("source-links").innerHTML=SOURCES.map(s=>'<a class="source-link" href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' ↗<small>'+esc(new URL(s.url).hostname)+"</small></a>").join("");
$("import-button").addEventListener("click",()=>$("import-file").click());
$("import-file").addEventListener("change",async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{if(file.size>200000)throw new Error("File troppo grande.");const input=importSnapshot(await file.text());setForm(input);render();go("calculator");toast(result.ok?"Simulazione importata e ricalcolata.":"Dati importati: correggi le informazioni evidenziate.");}catch(e){toast(e.message||"Importazione non riuscita.");}event.target.value="";
});
$("download-app").addEventListener("click",async()=>{
 try{
  const names=["index.html","styles.css","app.js","data.js","engine.js","exports.js","sw.js","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png","README.md","scripts/serve.mjs","package.json"];
  const files={};
  for(const name of names){const response=await fetch(new URL(name,location.href));if(!response.ok)throw new Error("File progetto non disponibile: "+name);files[name]=name.endsWith(".png")?new Uint8Array(await response.arrayBuffer()):await response.text();}
  download(zip(files),"flaiano-colf-badanti-pwa-"+VERSION+".zip","application/zip");toast("Progetto PWA scaricato.");
 }catch(e){toast(e.message||"Download del progetto non disponibile.");}
});
window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();installPrompt=event;});
$("install-button").addEventListener("click",async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else $("install-dialog").showModal();});
function connection(){const online=navigator.onLine;$("connection").textContent=(online?"Online":"Offline")+" · calcoli sul dispositivo";}
window.addEventListener("online",connection);window.addEventListener("offline",connection);connection();
if("serviceWorker" in navigator&&location.protocol!=="file:"){
 navigator.serviceWorker.register("./sw.js",{scope:"./"}).then(registration=>{
  if(registration.waiting)toast("Aggiornamento disponibile: chiudi e riapri tutte le finestre dell’app per applicarlo.");
  registration.addEventListener("updatefound",()=>{const worker=registration.installing;worker?.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller)toast("Nuova versione pronta. Salva il preventivo e riapri l’app.");});});
 }).catch(()=>{ $("connection").textContent="Online · offline non disponibile su questo indirizzo"; });
}
setForm(DEFAULTS);render();renderComparison();renderArchive();
