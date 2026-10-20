export const VERSION = "1.2.0";
export const RULES = Object.freeze({year:2026, checked:"2026-10-20", effective:"2026-01-01", ccnl:"H501", contract:"CCNL 2025–2028", validTo:"2026-12-31", cassa:{total:.06,worker:.02}, board:{meal:2.33,dinner:2.33,room:2.00}, thresholds:[9.61,11.70], inps:{worker:[.43,.48,.59,.31], indefinite:[1.70,1.92,2.34,1.24], fixed:[1.82,2.05,2.50,1.32]}});
export const LEVELS = Object.freeze({
 A:{name:"A · Compiti esecutivi",description:"Pulizie, lavanderia, aiuto cucina, cura di animali o aree verdi: mansioni specifiche esecutive, sotto il controllo del datore.",hourly:6.51,monthly:908.10},
 AS:{name:"AS · Compagnia",description:"Compagnia a persone adulte autosufficienti, senza ulteriori mansioni di assistenza.",hourly:6.76,monthly:958.55},
 B:{name:"B · Colf polifunzionale",description:"Collaborazione domestica polifunzionale; stireria, custodia, giardinaggio, autista e servizio tavola.",hourly:7.01,monthly:983.16,reduced:702.25},
 BS:{name:"BS · Autosufficienti / baby-sitter",description:"Assistenza a persone autosufficienti o baby-sitting, comprese le attività domestiche connesse alle esigenze dell'assistito.",hourly:7.45,monthly:1053.39,reduced:737.39,night:1211.38},
 C:{name:"C · Cuoco",description:"Preparazione autonoma dei pasti e attività di cucina con specifiche conoscenze tecniche.",hourly:7.86,monthly:1123.63,reduced:814.60},
 CS:{name:"CS · Assistenza non autosufficienti",description:"Assistenza a persone non autosufficienti senza la formazione qualificante prevista per il livello DS; attività domestiche collegate.",hourly:8.30,monthly:1193.84,night:1372.91,replacement:8.91},
 D:{name:"D · Responsabilità e coordinamento",description:"Amministratore, governante, capo cuoco, capo giardiniere o istitutore: mansioni con responsabilità, autonomia e coordinamento.",hourly:9.57,monthly:1404.51,role:207.69},
 DS:{name:"DS · Assistenza qualificata",description:"Assistenza a persone non autosufficienti con formazione qualificante; direzione di casa o educatore formato. Per l'assistenza qualificata verificare titolo e percorso formativo contrattuale (almeno 500 ore).",hourly:9.97,monthly:1474.73,role:207.69,night:1695.99,replacement:10.75}
});
export const REGIMES = Object.freeze({
 hourly:"Non convivente · paga oraria",
 livein:"Convivente · tabella A",
 reduced:"Convivente fino a 30 ore · tabella B",
 replacement:"Sostituzione dei riposi CS/DS · tabella G",
 night:"Assistenza notturna discontinua · tabella D",
 presence:"Presenza notturna · tabella E"
});
export const SOURCES = Object.freeze([
 {title:"Ministero del Lavoro · Minimi retributivi 2026",url:"https://www.lavoro.gov.it/temi-e-priorita-rapporti-di-lavoro-e-relazioni-industriali/focus/tabella-lavoro-domestico-2026"},
 {title:"Contributi 2026 · Circolare INPS 9/2026",url:"https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/02/Circolare_15154/Allegati/16551_Circolare-numero-9-del-03-02-2026.pdf"},
 {title:"DOMINA · Testo del CCNL H501",url:"https://associazionedomina.it/ccnl-lavoro-domestico/"},
 {title:"CAS.SA.COLF · Importi e versamenti",url:"https://www.cassacolf.it/versamenti/"},
 {title:"INPS · Retribuzione effettiva e contribuzione",url:"https://www.inps.it/it/it/dettaglio-approfondimento.schede-informative.49828.contributi-e-agevolazioni-fiscali-per-chi-assume-un-lavoratore-domestico.html"},
 {title:"INPS · Pagamento trimestrale e avvisi pagoPA",url:"https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.50061.pagamento-dei-contributi-al-lavoratore-domestico.html"},
 {title:"INPS · Istruzioni su settimane e arrotondamento delle ore (messaggio 70/2003)",url:"https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2003/06/Circolare_10887/Allegati/0_Messaggio-numero-70-del-16-6-2003_Allegato-n-1.pdf"},
 {title:"Assindatcolf · TFR",url:"https://lavorodomestico.assindatcolf.it/guide/tfr-per-colf-e-badanti-come-si-calcola-e-come-si-paga/"}
]);
export const DEFAULTS = Object.freeze({
 reference:"2026-10",scenario:"Nuovo preventivo",employer:"",employee:"",operator:"",
 level:"CS",regime:"hourly",hours:25,days:5,contract:"indefinite",substitution:false,cuaf:true,nonstandardContributions:false,
 payMode:"net",payUnit:"hour",pay:10,supermin:0,absorb:false,scatti:0,
 hireDate:"",autoScatti:false,endDate:"",reducedWindow:"morning",qualified:false,
 child:false,multiple:false,certified:false,meal:false,dinner:false,room:false,
 benefitDaysWeek:6,cashBenefitDays:0,actualBoardCost:0,
 specialConfirmed:false,specialInpsHours:0,nightsWeek:5,presenceActivePay:0,
 monthMode:"average",ordinaryPaidHours:108.3333333333,holidayPaidHours:0,leavePaidHours:0,monthlyFraction:1,accrualMonths:1,actualInpsHours:0,actualCassaHours:0,actualContributionsConfirmed:false,useTfrVerifiedBase:false,tfrVerifiedBase:0,
 extraOrdinary:0,overtime10:0,overtime25:0,overtime50:0,holidayWorked:0,restWorked:0,ordinaryNight:0,
 extrasRecurring:false,extrasTfr:false,reimbursements:0,advance:0,paid13:0,tfrAdvance:0,tfrFund:0,tfrAdvanceConfirmed:false,
 existingFund:0,foi:0,calculateRevaluation:false
});

export function ccnlMinimum(levelKey,regime,hours=0) {
 const v=LEVELS[levelKey];
 if(!v||!REGIMES[regime])return null;
 const table={hourly:"C",livein:"A",reduced:"B",replacement:"G",night:"D",presence:"E"}[regime];
 const isHourly=regime==="hourly"||regime==="replacement";
 let base=regime==="hourly"?v.hourly:regime==="livein"?v.monthly:regime==="reduced"?v.reduced:regime==="replacement"?v.replacement:regime==="night"?v.night:811.09;
 if(!Number.isFinite(base))return null;
 const role=regime==="livein"?(v.role||0):0;
 const total=base+role;
 return {level:levelKey,regime,table,unit:isHourly?"hour":"month",base,role,total,
  monthlyEquivalent:isHourly&&Number.isFinite(Number(hours))&&Number(hours)>0?total*Number(hours)*52/12:null};
}

export function inpsRate({effective,hoursWeek,contract="indefinite",substitution=false,cuaf=true},forcedBand=null){
 const band=forcedBand??(hoursWeek>24?3:effective<=RULES.thresholds[0]+1e-9?0:effective<=RULES.thresholds[1]+1e-9?1:2);
 const additional=contract==="fixed"&&!substitution;
 const total=RULES.inps[additional?"fixed":"indefinite"][band]+(cuaf?0:.01);
 return {band,effective,total,worker:RULES.inps.worker[band],employer:total-RULES.inps.worker[band],additional};
}
export function validISODate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return false;
 const dt=new Date(value+"T00:00:00Z");
 return Number.isFinite(dt.getTime())&&dt.toISOString().slice(0,10)===value;
}
