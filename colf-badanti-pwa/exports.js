import {SOURCES,VERSION,RULES} from "./data.js";
const E = s => String(s??"").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export function utf8(s) { const a=[]; for(const ch of String(s)){const c=ch.codePointAt(0);if(c<128)a.push(c);else if(c<2048)a.push(192|(c>>6),128|(c&63));else if(c<65536)a.push(224|(c>>12),128|((c>>6)&63),128|(c&63));else a.push(240|(c>>18),128|((c>>12)&63),128|((c>>6)&63),128|(c&63));}return new Uint8Array(a); }
const concat = a => {const out=new Uint8Array(a.reduce((n,b)=>n+b.length,0));let p=0;for(const b of a){out.set(b,p);p+=b.length;}return out;};
export function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
const le=(n,count)=>{const a=new Uint8Array(count);for(let j=0;j<count;j++)a[j]=(n/2**(8*j))&255;return a;};
export function zip(entries) {
 const parts=[],central=[];let offset=0;
 for(const [name,source] of Object.entries(entries)) {
  const filename=utf8(name),bytes=source instanceof Uint8Array?source:utf8(source),crc=crc32(bytes);
  const h=concat([le(0x04034b50,4),le(20,2),le(0x800,2),le(0,2),le(0,2),le(0x5d54,2),le(crc,4),le(bytes.length,4),le(bytes.length,4),le(filename.length,2),le(0,2),filename]);
  parts.push(h,bytes);
  central.push(concat([le(0x02014b50,4),le(20,2),le(20,2),le(0x800,2),le(0,2),le(0,2),le(0x5d54,2),le(crc,4),le(bytes.length,4),le(bytes.length,4),le(filename.length,2),le(0,2),le(0,2),le(0,2),le(0,2),le(0,4),le(offset,4),filename]));
  offset+=h.length+bytes.length;
 }
 const cd=concat(central),end=concat([le(0x06054b50,4),le(0,2),le(0,2),le(central.length,2),le(central.length,2),le(cd.length,4),le(offset,4),le(0,2)]);
 return concat([...parts,cd,end]);
}
export const formatMoney=n=>Number(n).toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
const formatNum=n=>Number(n).toLocaleString("it-IT",{maximumFractionDigits:4});
export function reportSections(r) {
 if(!r?.ok) throw new Error("Calcolo non valido: esportazione non disponibile.");
 const i=r.input;
 return [
 {title:"Dati della simulazione",rows:[["Riferimento",i.scenario],["Datore di lavoro",i.employer||"Non indicato"],["Lavoratore",i.employee||"Non indicato"],["Operatore",i.operator||"Non indicato"],["Periodo",i.reference+" · "+(i.monthMode==="average"?"mese medio":"ore del periodo")],["Inquadramento",r.level],["Rapporto",r.regime],["Contratto",i.contract==="fixed"?"Tempo determinato"+(i.substitution?" sostitutivo":""):"Tempo indeterminato"],["Ore settimanali",formatNum(i.hours)],["Giorni settimanali",String(i.days)],["Paga di partenza",i.payMode==="minimum"?"Minimo CCNL + eventuale superminimo":formatMoney(i.pay)+"/"+(i.payUnit==="hour"?"ora":"mese")+" "+(i.payMode==="net"?"netti prima IRPEF":"lordi")]]},
 {title:"Sintesi economica",rows:[["Lordo orario ordinario",formatMoney(r.unitOrdinary)],["Lordo mensile ordinario di riferimento",formatMoney(r.grossSalary)],["Netto del periodo prima IRPEF",formatMoney(r.netOrdinary)],["Da corrispondere al lavoratore",formatMoney(r.netPayable)],["Costo corrente del periodo",formatMoney(r.currentCost)],["Costo con ratei del periodo",formatMoney(r.totalCost)],["Costo annuo strutturale",formatMoney(r.annualCost)]]},
 {title:"Composizione retribuzione ordinaria · mese medio",rows:r.components.filter(x=>x.amount).map(x=>[x.label,formatMoney(x.amount)])},
 {title:"Prospetto paga simulato",rows:r.payslip.map(x=>[x.label,formatMoney(x.amount)])},
 {title:"Costo del datore",rows:r.costRows.filter(x=>x.amount||x.kind==="total").map(x=>[x.label,formatMoney(x.amount)])},
 {title:"Contributi e istituti",rows:[["Retribuzione effettiva oraria per fascia INPS",formatMoney(r.rate.effective)],["Fascia INPS",r.rate.band===3?"Oltre 24 ore settimanali":String(r.rate.band+1)],["INPS orario totale",formatMoney(r.rate.total)],["INPS orario lavoratore",formatMoney(r.rate.worker)],["Ore INPS del periodo",formatNum(r.inpsHours)],["Ore CAS.SA.COLF del periodo",formatNum(r.cassaHours)],["INPS totale da versare per il periodo",formatMoney(r.inpsTotal)],["CAS.SA.COLF totale del periodo",formatMoney(r.cassaTotal)],["Tredicesima annua di riferimento",formatMoney(r.thirteenthAnnual)],["TFR annuo strutturale",formatMoney(r.annualTfr)],["Ferie maturate (giorni convenzionali)",formatNum(r.leaveAccrual)],["Valore convenzionale vitto/alloggio mensile",formatMoney(r.benefitMonthly)],...(i.calculateRevaluation?[["Rivalutazione annua fondo pregresso",formatMoney(r.revaluation)]]:[])]},
 {title:"Ipotesi e verifiche",rows:[...r.warnings.map(x=>["Da verificare",x]),...r.notes.map(x=>["Metodo",x]),["Arrotondamenti","Importi del periodo arrotondati al centesimo per voce. Il costo annuo è calcolato separatamente a precisione piena prima dell'arrotondamento finale."],["Versione","App "+VERSION+" · regole "+RULES.year+" verificate il "+RULES.checked]]},
 {title:"Fonti",rows:SOURCES.map(x=>[x.title,x.url])}
 ];
}
const declaration='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const relns="http://schemas.openxmlformats.org/package/2006/relationships";
export function docx(r) {
 const p=(s,style="Normal")=>'<w:p><w:pPr><w:pStyle w:val="'+style+'"/></w:pPr><w:r><w:t xml:space="preserve">'+E(s)+'</w:t></w:r></w:p>';
 const cell=(s,width,head=false,right=false)=>'<w:tc><w:tcPr><w:tcW w:w="'+width+'" w:type="dxa"/>'+(head?'<w:shd w:fill="143F46"/>':"")+'</w:tcPr><w:p><w:pPr>'+(right?'<w:jc w:val="right"/>':"")+'</w:pPr><w:r><w:rPr>'+(head?'<w:b/><w:color w:val="FFFFFF"/>':"")+'</w:rPr><w:t xml:space="preserve">'+E(s)+'</w:t></w:r></w:p></w:tc>';
 let body=p("CENTRO PRATICHE FLAIANO","Subtitle")+p("Colf e badanti · Prospetto economico","Title")+p("Via Filoteo Alberini 25 int. 10, 00139 Roma · 06 97845429")+p("info@praticheflaiano.it · praticheflaiano.it","Subtitle");
 for(const section of reportSections(r)) {
  body+=p(section.title,"Heading1");
  body+='<w:tbl><w:tblPr><w:tblStyle w:val="FlaianoTable"/><w:tblW w:w="9360" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid><w:gridCol w:w="5500"/><w:gridCol w:w="3860"/></w:tblGrid>';
  body+='<w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>'+cell("Voce",5500,true)+cell("Valore / dettaglio",3860,true)+"</w:tr>";
  for(const row of section.rows) body+='<w:tr><w:trPr><w:cantSplit/></w:trPr>'+cell(row[0],5500)+cell(row[1],3860,false,/€$/.test(row[1]))+"</w:tr>";
  body+="</w:tbl>"+p("");
 }
 body+='<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1100" w:right="1273" w:bottom="1100" w:left="1273" w:header="400" w:footer="400"/></w:sectPr>';
 const entries={
 "[Content_Types].xml":declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>',
 "_rels/.rels":declaration+'<Relationships xmlns="'+relns+'"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 "word/document.xml":declaration+'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>'+body+"</w:body></w:document>",
 "word/_rels/document.xml.rels":declaration+'<Relationships xmlns="'+relns+'"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>',
 "word/styles.xml":declaration+'<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="21"/><w:color w:val="21363A"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="143F46"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:sz w:val="18"/><w:color w:val="526B70"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="140"/></w:pPr><w:rPr><w:b/><w:sz w:val="25"/><w:color w:val="143F46"/></w:rPr></w:style><w:style w:type="table" w:styleId="FlaianoTable"><w:name w:val="Flaiano Table"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D8E4E2"/><w:bottom w:val="single" w:sz="4" w:color="D8E4E2"/><w:insideH w:val="single" w:sz="4" w:color="D8E4E2"/></w:tblBorders><w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>',
 "word/footer1.xml":declaration+'<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:t>Flaiano · Simulazione '+E(r.input.reference)+' · Pagina </w:t></w:r><w:fldSimple w:instr="PAGE"/></w:p></w:ftr>'
 };return zip(entries);
}
export function xlsx(r) {
 const i=r.input;
 const f=(formula,value)=>({formula,value});
 const inputRows=[
 ["FLAIANO · PARAMETRI MODIFICABILI","Valore"],
 ["Periodo",i.reference],["Inquadramento",r.level],["Rapporto",r.regime],
 ["Ore settimanali",i.hours],["Ore medie mensili",f("B5*52/12",r.meanHours)],
 ["Lordo mensile ordinario risolto nell'app",r.grossSalary],["Vitto/alloggio convenzionale mensile",r.benefitMonthly],
 ["Vitto/alloggio monetizzato nel periodo",r.benefitCashPeriod],["Ore INPS del periodo",r.inpsHours],
 ["Ore Cassa del periodo",r.cassaHours],["Ore INPS settimanali",r.special?i.specialInpsHours:i.hours],
 ["Addizionale TD (1 sì / 0 no)",r.rate.additional?1:0],["CUAF (1 sì / 0 no)",i.cuaf?1:0],
 ["Fattore paga ordinaria del periodo",r.grossSalary?r.regularPeriod/r.grossSalary:1],
 ["Fattore mensilità per ratei",i.monthMode==="actual"&&!r.hourly?i.monthlyFraction:1],
 ["Rimborsi documentati",i.reimbursements],["Costo effettivo vitto/alloggio",i.actualBoardCost],
 ["Acconto già pagato",i.advance],["Tredicesima corrisposta",i.paid13],["Anticipo TFR",i.tfrAdvance],
 ["Voci aggiuntive ricorrenti (1 sì / 0 no)",i.extrasRecurring?1:0],["Aggiuntive utili TFR (1 sì / 0 no)",i.extrasTfr?1:0],
 ["Nota","La conversione netto/lordo è eseguita nell'app. Modificando il lordo in B7, il foglio Calcoli ricalcola costi e netto. Per cambiare livello, rapporto o diritti contrattuali, rigenerare dall'app."]
 ];
 const extraRows=[["VOCI AGGIUNTIVE","Ore","Moltiplicatore","Importo"],...r.extraRows.map(x=>[x.label,x.quantity,x.rate/r.globalHourly,f("B"+(r.extraRows.indexOf(x)+2)+"*C"+(r.extraRows.indexOf(x)+2)+"*Calcoli!B2",x.amount)])];
 const exLast=Math.max(2,extraRows.length),exSum=r.extraRows.length?"SUM(Aggiuntive!D2:D"+exLast+")":"0";
 const extraHours=r.extraRows.filter(x=>x.code!=="ordinaryNight").reduce((n,x)=>n+x.quantity,0);
 const calcRows=[
 ["FLAIANO · CALCOLI","Importo"],
 ["Retribuzione globale oraria",f("(Parametri!B7+Parametri!B8)/Parametri!B6",r.globalHourly)],
 ["Voci aggiuntive del periodo",f(exSum,r.extraPay)],
 ["Retribuzione effettiva INPS",f("(Parametri!B7+Parametri!B8+IF(Parametri!B22=1,B3,0))*13/12/Parametri!B6",r.rate.effective)],
 ["Fascia INPS",f("IF(Parametri!B12>24,4,IF(B4<=9.61,1,IF(B4<=11.70,2,3)))",r.rate.band+1)],
 ["INPS orario totale",f("INDEX(Tabelle!B2:C5,B5,IF(Parametri!B13=1,2,1))+IF(Parametri!B14=1,0,0.01)",r.rate.total)],
 ["INPS orario lavoratore",f("INDEX(Tabelle!D2:D5,B5)",r.rate.worker)],
 ["Lordo monetario del periodo",f("ROUND(Parametri!B7*Parametri!B15+Parametri!B9+B3,2)",r.gross)],
 ["INPS lavoratore",f("ROUND(Parametri!B10*B7,2)",r.inpsWorker)],
 ["Cassa lavoratore",f("ROUND(Parametri!B11*0.02,2)",r.cassaWorker)],
 ["Netto del periodo prima IRPEF",f("ROUND(B8-B9-B10,2)",r.netOrdinary)],
 ["INPS datore",f("ROUND(Parametri!B10*(B6-B7),2)",r.inpsEmployer)],
 ["Cassa datore",f("ROUND(Parametri!B11*0.04,2)",r.cassaEmployer)],
 ["Tredicesima annua di riferimento",f("Parametri!B7+Parametri!B8+IF(Parametri!B22=1,B3,0)",r.thirteenthAnnual)],
 ["Rateo tredicesima",f("ROUND(B14/12*Parametri!B16,2)",r.thirteenthAccrual)],
 ["Rateo TFR",f("ROUND((Parametri!B7*Parametri!B15+Parametri!B8*Parametri!B16+IF(OR(Parametri!B22=1,Parametri!B23=1),B3,0)+B14/12*Parametri!B16)/13.5,2)",r.tfrAccrual)],
 ["Costo corrente",f("ROUND(B8+B12+B13+Parametri!B17+Parametri!B18,2)",r.currentCost)],
 ["Costo del periodo con ratei",f("ROUND(B17+B15+B16,2)",r.totalCost)],
 ["Da corrispondere al lavoratore",f("ROUND(B11+Parametri!B20+Parametri!B21+Parametri!B17-Parametri!B19,2)",r.netPayable)],
 ["Ore INPS medie mensili strutturali",r.contributionMeanHours],["Ore Cassa medie mensili strutturali",r.cassaMeanHours],
 ["Ore aggiuntive contributive del periodo",extraHours],
 ["TFR annuo strutturale",f("((Parametri!B7+Parametri!B8)*12+B14+IF(OR(Parametri!B22=1,Parametri!B23=1),IF(Parametri!B22=1,B3*12,0),0))/13.5",r.annualTfr)],
 ["Costo annuo strutturale",f("ROUND((Parametri!B7+Parametri!B9/Parametri!B16+(B6-B7)*B20+0.04*B21+Parametri!B18)*12+IF(Parametri!B22=1,B3*12+B22*12*(B6-B7+0.04),0)+B14+B23,2)",r.annualCost)],
 ["Metodo","Netto prima IRPEF. Ore e aliquote per il periodo da verificare. La proiezione annua esclude eventi occasionali e festività aggiuntive."]
 ];
 const tables=[["FASCIA 2026","Totale TI","Totale TD","Lavoratore"],["Fino a 9,61",1.70,1.82,.43],["Oltre 9,61 fino a 11,70",1.92,2.05,.48],["Oltre 11,70",2.34,2.50,.59],["Oltre 24 ore",1.24,1.32,.31],["Cassa datore",.04],["Cassa lavoratore",.02],["Anno",2026],["Verifica fonti",RULES.checked]];
 const original=[["DATI ORIGINALI DELLA SIMULAZIONE","Valore"],...Object.entries(i).map(([k,v])=>[k,typeof v==="boolean"?(v?1:0):v]),["Versione",VERSION]];
 const notes=[["FONTI E IPOTESI","Dettaglio"],...r.warnings.map(x=>["Verifica",x]),...r.notes.map(x=>["Metodo",x]),...SOURCES.map(x=>[x.title,x.url])];
 const sheets=[["Parametri",inputRows],["Calcoli",calcRows],["Aggiuntive",extraRows],["Tabelle",tables],["Dati originali",original],["Fonti e note",notes]];
 const col=n=>{let s="";while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;};
 const entry={};
 entry["_rels/.rels"]=declaration+'<Relationships xmlns="'+relns+'"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
 entry["xl/workbook.xml"]=declaration+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>'+sheets.map(([name],n)=>'<sheet name="'+E(name)+'" sheetId="'+(n+1)+'" r:id="rId'+(n+1)+'"/>').join("")+'</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
 entry["xl/_rels/workbook.xml.rels"]=declaration+'<Relationships xmlns="'+relns+'">'+sheets.map((_,n)=>'<Relationship Id="rId'+(n+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(n+1)+'.xml"/>').join("")+'<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
 entry["xl/styles.xml"]=declaration+'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/><color rgb="FF21363A"/></font><font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font><font><sz val="11"/><name val="Calibri"/><color rgb="FF1465A8"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF143F46"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
 for(let sn=0;sn<sheets.length;sn++) {
  const [,rows]=sheets[sn];
  let xml=declaration+'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="58" customWidth="1"/><col min="2" max="2" width="65" customWidth="1"/><col min="3" max="4" width="22" customWidth="1"/></cols><sheetData>';
  for(let row=0;row<rows.length;row++) {
   xml+='<row r="'+(row+1)+'"'+(row===0?' ht="32" customHeight="1"':"")+">";
   for(let c=0;c<rows[row].length;c++) {
    const v=rows[row][c],ref=col(c+1)+(row+1),style=row===0?1:typeof v==="number"?(sn===0?3:2):v&&typeof v==="object"?2:0;
    xml+='<c r="'+ref+'" s="'+style+'"';
    if(v&&typeof v==="object") xml+='><f>'+E(v.formula)+'</f><v>'+Number(v.value)+'</v></c>';
    else if(typeof v==="number") xml+='><v>'+v+"</v></c>";
    else xml+=' t="inlineStr"><is><t xml:space="preserve">'+E(v)+"</t></is></c>";
   } xml+="</row>";
  }
  xml+='</sheetData><autoFilter ref="A1:'+col(Math.max(...rows.map(r=>r.length)))+rows.length+'"/><pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
  entry["xl/worksheets/sheet"+(sn+1)+".xml"]=xml;
 }
 entry["[Content_Types].xml"]=declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,n)=>'<Override PartName="/xl/worksheets/sheet'+(n+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("")+"</Types>";
 return zip(entry);
}
const win1252=s=>{const extras={8364:128,8211:150,8212:151,8216:145,8217:146,8220:147,8221:148,8226:149};return Array.from(String(s),ch=>{const c=ch.codePointAt(0);return c<256?c:(extras[c]||63);});};
const pdfString=s=>"("+win1252(s).map(c=>c===40||c===41||c===92?"\\"+String.fromCharCode(c):c<32||c>126?"\\"+c.toString(8).padStart(3,"0"):String.fromCharCode(c)).join("")+")";
const wrap=(s,max)=>{const lines=[];for(const p of String(s).split("\n")){let line="";for(const word of p.split(/\s+/)){if(word.length>max){if(line){lines.push(line);line="";}for(let j=0;j<word.length;j+=max)lines.push(word.slice(j,j+max));}else if((line+" "+word).trim().length>max){lines.push(line);line=word;}else line=(line+" "+word).trim();}if(line||!lines.length)lines.push(line);}return lines;};
export function pdf(r) {
 const pages=[];let stream="",y=0,pageNo=0;
 const text=(s,x,yy,size=10,bold=false)=>{stream+="BT /"+(bold?"F2":"F1")+" "+size+" Tf 0.08 0.21 0.23 rg 1 0 0 1 "+x+" "+yy+" Tm "+pdfString(s)+" Tj ET\n";};
 const line=(yy)=>{stream+="0.82 0.88 0.87 RG 0.5 w 48 "+yy+" m 547 "+yy+" l S\n";};
 const newPage=()=>{if(stream)pages.push(stream);stream="";pageNo++;y=785;text("CENTRO PRATICHE FLAIANO",48,y,10,true);text("Colf e badanti · Simulazione "+r.input.reference,48,y-23,17,true);text("Via Filoteo Alberini 25 int. 10, Roma · 06 97845429",48,y-41,8);line(y-52);y-=76;text("Regole 2026 · App "+VERSION+" · Pagina "+pageNo,48,28,8);};
 newPage();
 for(const section of reportSections(r)) {
  if(y<120)newPage();text(section.title,48,y,12,true);y-=23;
  for(const row of section.rows) {
   const a=wrap(row[0],45),b=wrap(row[1],48),height=Math.max(a.length,b.length)*12+14;
   if(y-height<48){newPage();text(section.title+" (segue)",48,y,12,true);y-=23;}
   for(let n=0;n<a.length;n++)text(a[n],48,y-n*12,9);
   for(let n=0;n<b.length;n++)text(b[n],300,y-n*12,9,/€$/.test(row[1]));
   y-=height;line(y+5);
  } y-=15;
 }
 pages.push(stream);
 const objects=[];
 const add=s=>{objects.push(s);return objects.length;};
 add("<< /Type /Catalog /Pages 2 0 R >>");add("");
 const font1=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
 const font2=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
 const pageIds=[];
 for(const content of pages){const contentId=add("<< /Length "+content.length+" >>\nstream\n"+content+"endstream");pageIds.push(add("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 "+font1+" 0 R /F2 "+font2+" 0 R >> >> /Contents "+contentId+" 0 R >>"));}
 objects[1]="<< /Type /Pages /Count "+pageIds.length+" /Kids ["+pageIds.map(n=>n+" 0 R").join(" ")+"] >>";
 let out="%PDF-1.4\n",offsets=[0];
 for(let n=0;n<objects.length;n++){offsets.push(out.length);out+=(n+1)+" 0 obj\n"+objects[n]+"\nendobj\n";}
 const xref=out.length;out+="xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n";
 for(let n=1;n<offsets.length;n++)out+=String(offsets[n]).padStart(10,"0")+" 00000 n \n";
 out+="trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF\n";
 return new Uint8Array(Array.from(out,ch=>ch.charCodeAt(0)));
}
export function download(bytes,name,type) {
 const url=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement("a");
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export function snapshot(r) { if(!r?.ok)throw new Error("Calcolo non valido.");return {application:"flaiano-domestico",schema:1,appVersion:VERSION,rulesYear:RULES.year,createdAt:new Date().toISOString(),input:r.input};}
export function importSnapshot(text) {
 if(String(text).length>200000)throw new Error("File troppo grande.");
 const p=JSON.parse(text);
 if(p.application!=="flaiano-domestico"||p.schema!==1||p.rulesYear!==2026||!p.input||typeof p.input!=="object"||Array.isArray(p.input))throw new Error("Formato o anno della simulazione non compatibile.");
 return p.input;
}
