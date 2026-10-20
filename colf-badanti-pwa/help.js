import {LEVELS,REGIMES,ccnlMinimum} from "./data.js";
// Guide contestuali: descrivono i dati richiesti e il comportamento del calcolatore.
const entry=(title,what,when,effect,kind="field")=>Object.freeze({title,what,when,effect,kind});
export const FIELD_HELP=Object.freeze({
 regime:entry("Tipologia di rapporto","Indica il modo in cui si svolge il lavoro: a ore, in convivenza, con orario ridotto, in sostituzione dei riposi o di notte.","Scegli la situazione effettiva prevista nella lettera di assunzione. Assistenza notturna e semplice presenza notturna sono discipline diverse.","Seleziona la tabella del minimo, i limiti di orario e le modalità contributive. Nei rapporti notturni sono richieste ore INPS già verificate."),
 level:entry("Livello di inquadramento","È la classificazione contrattuale delle mansioni, da A a DS. Dipende dalle attività, dall'autonomia e, quando richiesta, dalla formazione.","Indica il livello corrispondente al lavoro realmente svolto: colf, baby-sitting, assistenza a persone autosufficienti o non autosufficienti. Leggi la descrizione sotto la scelta.","Determina il minimo lordo, le indennità ammesse e la base degli scatti. Una paga superiore al minimo non sostituisce la scelta del livello corretto."),
 hours:entry("Ore settimanali","Sono le ore ordinarie concordate per una settimana, escluse le ore aggiuntive che inserisci nelle sezioni successive.","Inserisci l'orario previsto dal contratto. Esempio: 5 ore per 5 giorni = 25 ore. Non inserire le ore complessive del mese.","Per la paga a ore il mese medio vale ore settimanali × 52 ÷ 12. L'orario incide anche sui contributi: oltre 24 ore settimanali cambia il regime INPS."),
 days:entry("Giorni di lavoro a settimana","È il numero di giorni sui quali si distribuisce l'orario ordinario settimanale.","Indica i giorni effettivamente previsti, da 1 a 6. Non confonderli con i giorni di fruizione di vitto e alloggio.","L'app verifica che la media delle ore giornaliere sia compatibile con il rapporto. Il numero non sostituisce la verifica della distribuzione giornaliera e dei riposi."),
 contract:entry("Tipo di contratto","Indica se il rapporto ha una scadenza prestabilita oppure prosegue a tempo indeterminato.","Seleziona la durata riportata nella lettera di assunzione. In caso di termine indica anche se si sostituisce un lavoratore assente.","Per il determinato ordinario si applica la tabella INPS con addizionale già inclusa. Nel sostitutivo ammesso viene usata la tabella senza addizionale."),
 reference:entry("Mese di riferimento","È il mese al quale riferire il preventivo, le verifiche contrattuali e il prospetto esportato.","Scegli il mese che vuoi simulare. Questa versione contiene esclusivamente le tabelle del 2026.","Controlla l'anno delle tabelle e, se richiesto, la maturazione degli scatti. Da solo non conta automaticamente presenze, festività o giorni lavorati."),
 substitution:entry("Assunzione sostitutiva","Indica un contratto a termine stipulato per sostituire un lavoratore temporaneamente assente.","Selezionalo soltanto se la sostituzione risulta dal rapporto e dalla documentazione. Non è la stessa cosa della copertura dei riposi in tabella G.","Utilizza la contribuzione INPS senza addizionale per il determinato sostitutivo. La spunta non modifica il minimo retributivo del livello."),
 endDate:entry("Data di fine contratto","È la scadenza prevista per il rapporto a termine.","Compilala se la data è già nota. Deve essere successiva o uguale alla data di assunzione.","Compare fra i dati salvati e permette controlli di coerenza. Non riduce automaticamente il costo annuo o le competenze del mese: per periodi parziali occorrono i dati del periodo."),
 reducedWindow:entry("Distribuzione dell'orario ridotto","È la collocazione dell'orario richiesta per il regime di convivenza ridotta gestito in tabella B.","Scegli la fascia 6–14, la fascia 14–22 oppure il lavoro concentrato in non più di tre giorni, secondo quanto concordato.","Permette il controllo delle condizioni dell'orario ridotto. Non trasforma automaticamente un convivente ordinario in un rapporto di tabella B."),
 specialInpsHours:entry("Ore INPS settimanali verificate","È la base settimanale previdenziale già verificata per il particolare rapporto notturno.","Compilala per assistenza o presenza notturna, utilizzando il dato corretto per INPS. Non copiare automaticamente le ore convenzionali della Cassa Colf.","Determina ore contributive e fascia INPS del rapporto notturno. Il preventivo rimane bloccato finché il dato e la conferma richiesta non sono presenti."),
 nightsWeek:entry("Notti a settimana","È il numero di notti nelle quali è prevista l'assistenza o la presenza notturna.","Indica da 1 a 6 notti settimanali, secondo il rapporto verificato.","Serve alla stima CAS.SA.COLF: l'app usa 8 ore convenzionali per notte di assistenza e 5 per notte di presenza. Le ore INPS sono gestite separatamente."),
 specialConfirmed:entry("Conferma del rapporto notturno","È l'attestazione dell'operatore di aver verificato atto scritto, fasce orarie, riposi e base previdenziale.","Selezionala dopo aver esaminato le condizioni del rapporto notturno e aver inserito le ore INPS appropriate.","Consente di completare il preventivo speciale. Non calcola da sola le ore INPS e non sostituisce la verifica delle condizioni contrattuali."),
 qualified:entry("Qualificazione DS verificata","Indica che il titolo o la formazione qualificante richiesti per le mansioni DS sono stati controllati.","Usala per l'assistenza qualificata DS dopo l'esame della documentazione. La sola esperienza non equivale automaticamente alla qualifica.","Rimuove il richiamo alla verifica della formazione. Il minimo DS resta quello del livello selezionato: la spunta non attribuisce una qualifica e non aggiunge un'indennità autonoma."),
 scatti:entry("Scatti biennali maturati","È il numero di aumenti di anzianità già spettanti presso lo stesso datore, non il numero degli anni lavorati.","Inserisci un intero da 0 a 7 se conosci gli scatti maturati. Se preferisci il calcolo dalla data di assunzione, attiva l'opzione automatica.","Ogni scatto aumenta del 4% la base minima contrattuale usata dall'app. Gli scatti si aggiungono alla paga e non vengono assorbiti dal superminimo."),
 hireDate:entry("Data di assunzione","È la data di inizio del servizio presso questo datore di lavoro.","Indicala quando è nota; è necessaria per calcolare automaticamente gli scatti. Non usare la data di un precedente datore.","Con l'opzione automatica determina gli scatti dal mese successivo al compimento del biennio. Non riproporziona da sola presenze, ratei o proiezione annuale."),
 autoScatti:entry("Calcolo automatico degli scatti","Consente di ricavare gli scatti dalla data di assunzione e dal mese simulato.","Attivalo se la data di assunzione è corretta e vuoi evitare l'inserimento manuale del numero degli scatti.","Sostituisce il numero manuale, che diventa non modificabile. L'app applica la decorrenza dal mese successivo al biennio e il massimo di sette scatti."),
 cuaf:entry("Contribuzione comprensiva CUAF","Identifica la contribuzione ordinaria comprendente la quota per la Cassa unica assegni familiari.","Lasciala selezionata per i rapporti ordinari. L'esclusione è riservata ai rapporti familiari ammessi e riconosciuti dall'INPS.","Sceglie la specifica colonna delle tabelle INPS. Togliere la spunta non significa sottrarre una percentuale libera e non comporta necessariamente un contributo totale inferiore."),
 payMode:entry("Come impostare la retribuzione","Puoi partire dal minimo contrattuale, da un lordo concordato oppure dal netto ordinario desiderato.","Usa Minimo CCNL per un preventivo di base; Dal lordo se conosci la paga prima delle trattenute; Dal netto se l'accordo indica quanto deve ricevere il lavoratore prima dell'eventuale IRPEF.","La modalità decide quale dato l'app ricostruisce. Da minimo puoi aggiungere un superminimo; da netto il lordo viene risolto verificando fasce INPS e minimo complessivo."),
 pay:entry("Paga ordinaria concordata","È la paga oraria o mensile da cui partire. Il suo significato dipende dalla scelta Dal netto o Dal lordo.","Indica l'importo ordinario pattuito nell'unità selezionata. Ore aggiuntive, rimborsi, tredicesima e anticipi TFR vanno nei rispettivi campi.","Dal lordo l'app sottrae i contributi del lavoratore. Dal netto ricostruisce il lordo compatibile con le fasce INPS e blocca un importo sotto il minimo."),
 payUnit:entry("Unità della paga","Specifica se l'importo concordato o il superminimo si riferisce a un'ora oppure a un mese.","Scegli l'unità nella quale è stato formulato l'accordo. Esempio: 10 euro all'ora è diverso da 10 euro al mese.","Converte il dato nel riferimento mensile utilizzato dal calcolo. Per i conviventi la tabella minima resta mensile e non viene ridotta proporzionalmente alle ore."),
 supermin:entry("Superminimo aggiuntivo lordo","È l'importo riconosciuto oltre il trattamento minimo contrattuale, prima delle trattenute del lavoratore.","Compilalo nella modalità Minimo CCNL quando vuoi aumentare la paga. Usa l'unità oraria o mensile selezionata; lascia zero se basta il minimo.","Aumenta lordo, netto e costo, con effetti su tredicesima e TFR e, quando rilevante, sulla fascia INPS. L'opzione di assorbimento regola il rapporto con le indennità assorbibili."),
 absorb:entry("Assorbimento delle indennità","Indica che il superminimo copre, nei limiti consentiti, le indennità contrattuali assorbibili invece di aggiungersi integralmente ad esse.","Attivalo soltanto se la struttura della paga concordata prevede questo assorbimento. Gli scatti non sono assorbibili.","Nella modalità Minimo CCNL l'app considera il maggiore fra superminimo e indennità assorbibili; senza spunta li somma. Non consente di scendere sotto i diritti minimi."),
 child:entry("Baby-sitter con bambino sotto 6 anni","È l'indennità prevista per la baby-sitter BS che assiste almeno un bambino che non ha ancora compiuto sei anni.","Selezionala se ricorrono mansioni di baby-sitting BS ed età prevista. Non basta che il nucleo abbia un bambino piccolo.","Aggiunge l'indennità della tabella pertinente al rapporto e ne considera gli effetti sugli istituti. Il numero dei bambini non viene usato per moltiplicarla automaticamente."),
 multiple:entry("Più persone non autosufficienti","È l'indennità collegata all'assistenza di più di una persona non autosufficiente nei livelli CS o DS.","Attivala quando il lavoratore assiste effettivamente almeno due persone non autosufficienti.","Aumenta il minimo complessivo e le basi utili del preventivo. È gestita secondo l'eventuale assorbimento nel superminimo, senza moltiplicazioni per ogni ulteriore assistito."),
 certified:entry("Certificazione UNI 11766","È l'indennità per la certificazione di qualità professionale prevista dalle tabelle 2026 per B, BS e CS.","Selezionala se la certificazione è valida, è stata controllata ed è stata comunicata al datore secondo il contratto.","Aggiunge l'indennità mensile prevista al trattamento minimo, con i relativi effetti sugli istituti e sull'eventuale assorbimento. Non coincide con la qualificazione DS."),
 meal:entry("Pranzo o colazione","Indica la componente convenzionale del vitto relativa a pranzo/colazione spettante nel rapporto.","Selezionala quando questa componente è dovuta. Indica poi giorni di fruizione e, se necessario, quelli da monetizzare.","Il valore convenzionale entra nei conteggi pertinenti di INPS, tredicesima e TFR. Non è automaticamente denaro da consegnare né il costo reale del pasto."),
 dinner:entry("Cena","Indica la componente convenzionale del vitto relativa alla cena spettante nel rapporto.","Selezionala quando la cena è dovuta, configurando correttamente i giorni di fruizione e la quota eventualmente monetizzata.","Concorre al valore di vitto/alloggio utile ai conteggi. Il costo effettivo sostenuto dal datore si indica separatamente e non viene dedotto dal netto."),
 room:entry("Alloggio","Indica la componente convenzionale relativa all'alloggio spettante al lavoratore.","Selezionala quando il rapporto prevede l'alloggio. Verifica anche le specifiche condizioni di convivenza o di presenza notturna.","Concorre al valore convenzionale utile a INPS e istituti. La spunta non inserisce automaticamente un affitto reale nel costo del datore."),
 benefitDaysWeek:entry("Giorni di fruizione del vitto/alloggio","È il numero di giorni settimanali ai quali riferire le componenti convenzionali selezionate.","Indica i giorni effettivi di fruizione; possono essere diversi dai giorni lavorati. Non inserire qui il numero di giorni del mese.","Serve a ripartire il valore di vitto/alloggio sulle ore per la fascia INPS. Per gli istituti dei mensilizzati l'app usa il valore convenzionale mensile di 30 giorni."),
 cashBenefitDays:entry("Giorni di vitto/alloggio monetizzati","È il numero di giorni convenzionali per i quali le componenti selezionate sono corrisposte in denaro.","Indicalo quando, secondo il rapporto e il periodo verificati, spetta il compenso sostitutivo. Lascia zero per le quote integralmente fruite in natura.","Aggiunge la quota monetaria al lordo e al netto del periodo, mantenendo il valore utile agli istituti senza duplicarlo. Non deve superare il valore mensile configurato."),
 actualBoardCost:entry("Costo effettivo di vitto/alloggio","È la spesa reale stimata sostenuta dal datore per le prestazioni fornite in natura.","Compilalo per includere nel preventivo pasti e alloggio realmente a carico del datore. Escludi le quote già pagate in denaro al lavoratore.","Si aggiunge al costo del periodo e alla proiezione annua. Non aumenta il netto né sostituisce il valore convenzionale usato per INPS, tredicesima e TFR."),
 monthMode:entry("Base del prospetto","Distingue la stima di un mese medio da una simulazione sulle ore retribuite del periodo.","Usa Mese medio per un preventivo; usa Dati da presenze quando hai ore e competenze del mese già verificate.","Nel mese medio si usano 52/12 settimane. Nel prospetto mensile entrano le ore o la frazione di mensilità inserite; il calendario non viene ricostruito automaticamente."),
 ordinaryPaidHours:entry("Ore ordinarie retribuite del mese","Sono le ore ordinarie da pagare nel periodo simulato per un rapporto a ore.","Inserisci le ore ricavate dalle presenze, escludendo ferie, festività e ore aggiuntive che riporti negli altri campi.","Sono moltiplicate per la paga ordinaria e concorrono alle ore INPS e Cassa. Inserire due volte le stesse ore aumenta impropriamente retribuzione e contributi."),
 holidayPaidHours:entry("Ore di festività non lavorate","Sono le ore retribuite per le festività spettanti nel periodo, senza prestazione lavorativa.","Compilale dopo la verifica delle festività da pagare. Nel rapporto a ore una giornata convenzionale è ragguagliata a 1/6 dell'orario settimanale.","Si aggiungono alle ore retribuite e contributive. Il lavoro effettivamente svolto in una festività va nella voce Festivo/domenicale, senza duplicare ore ordinarie."),
 leavePaidHours:entry("Ore di ferie retribuite","Sono le ore convenzionali corrispondenti alle ferie godute e retribuite nel periodo.","Indicale nel prospetto da presenze, escludendole dalle ordinarie. Per il rapporto a ore una giornata convenzionale vale 1/6 dell'orario settimanale.","Concorrono a retribuzione e contribuzione del periodo. Non sono il saldo delle ferie residue e non aggiungono un ulteriore costo ferie al preventivo annuo medio."),
 monthlyFraction:entry("Frazione di mensilità spettante","È la quota della mensilità ordinaria da riconoscere nel prospetto di un rapporto mensilizzato.","Usa 1 per il mese intero. Inserisci una quota inferiore solo dopo aver verificato il corretto trattamento di assunzione, cessazione o assenze.","Riproporziona le voci mensilizzate e i ratei gestiti dall'app. Non basta fare una divisione libera per i giorni del calendario: il criterio va prima verificato."),
 extraOrdinary:entry("Ore aggiuntive ordinarie","Sono ore ulteriori pagate senza una maggiorazione specifica, quando la loro qualificazione contrattuale lo consente.","Usale per ore aggiuntive già verificate che non siano straordinario, lavoro festivo o ore già incluse nella paga base.","Aggiungono retribuzione e ore contributive. L'app usa il riferimento orario globale; non decide da sola se le ore vadano invece assoggettate a una maggiorazione."),
 overtime10:entry("Ore diurne dalla 41ª alla 44ª · +10%","È la specifica maggiorazione per le ore dei non conviventi oltre 40 e fino a 44 nella settimana, nella fascia diurna prevista.","Inserisci soltanto le ore che ricadono effettivamente in questa fascia settimanale. Non usare il campo per qualunque ora aggiuntiva di un part-time.","Le ore inserite sono pagate al 110% del riferimento orario globale e aumentano le ore contributive. L'app non ricostruisce la distribuzione di ciascuna settimana."),
 overtime25:entry("Straordinario diurno · +25%","È il lavoro straordinario qualificato come diurno, nella fascia 6–22, secondo i limiti del contratto.","Indica le ore verificate eccedenti i limiti ordinari pertinenti. Non ripetere qui ore già inserite in altre maggiorazioni.","Paga le ore al 125% del riferimento orario globale e le aggiunge alla base delle ore contributive."),
 overtime50:entry("Straordinario notturno · +50%","È lo straordinario svolto nella fascia notturna 22–6.","Usalo per ore straordinarie notturne verificate. È diverso dalle ore notturne ordinarie già comprese nella paga e dai rapporti speciali di assistenza/presenza notturna.","Paga le ore al 150% del riferimento orario globale e aumenta le ore contributive. Non sommare un'ulteriore maggiorazione del 20% sulle stesse ore."),
 holidayWorked:entry("Lavoro festivo o domenicale · +60%","Sono ore effettivamente lavorate in una festività o nella giornata soggetta alla disciplina domenicale.","Indica le ore aggiuntive da remunerare con questa maggiorazione, dopo aver verificato anche riposi e normale retribuzione della festività.","Le paga al 160% del riferimento orario globale e aggiunge i contributi. La retribuzione della festività spettante deve essere già correttamente considerata nel prospetto."),
 restWorked:entry("Lavoro nel riposo del convivente · +40%","È la prestazione nelle 12 ore di riposo settimanale non domenicale del convivente, nei casi contrattualmente previsti.","Usalo dopo aver verificato che non vi sia un recupero del riposo che esclude questa maggiorazione. Non è il campo per il lavoro domenicale.","Paga le ore inserite al 140% del riferimento orario globale e le aggiunge alle ore contributive."),
 ordinaryNight:entry("Notturno ordinario già incluso · +20%","Sono ore notturne ordinarie già comprese nella paga base, per le quali si aggiunge soltanto la maggiorazione.","Inserisci il sottoinsieme delle ore ordinarie svolte nella fascia 22–6. Non usarlo per straordinari o per i rapporti notturni speciali.","Aggiunge soltanto il 20% del riferimento orario. Non aggiunge un secondo monte ore INPS o Cassa e non può superare le ore già retribuite come ordinarie."),
 extrasRecurring:entry("Voci aggiuntive ricorrenti","Indica che le voci aggiuntive simulate si ripetono ogni mese nelle stesse condizioni.","Attivalo per un compenso aggiuntivo stabile. Lascialo disattivato per ore o maggiorazioni occasionali del solo periodo.","Le voci entrano nella proiezione di 12 mesi, nella tredicesima e nel TFR gestiti, e nella retribuzione effettiva usata per la fascia INPS."),
 extrasTfr:entry("Voci aggiuntive utili al TFR","Indica che i compensi aggiuntivi del periodo devono concorrere alla base di maturazione TFR.","Selezionalo dopo averne verificato la natura utile. Le voci già segnate come ricorrenti vengono considerate negli istituti dall'app.","Aumenta il rateo TFR del periodo per la quota utile. Da solo non ripete le voci occasionali per dodici mesi e non le rende utili alla tredicesima."),
 reimbursements:entry("Rimborsi documentati","Sono restituzioni di spese sostenute dal lavoratore per conto del datore, giustificate e correttamente qualificate.","Indica il rimborso del periodo se dovuto. Non usare questa casella per una parte della paga o per un compenso aggiuntivo.","Aumenta la somma da consegnare e il costo del periodo. Nel modello non aumenta la retribuzione utile a contributi e ratei."),
 advance:entry("Acconto già pagato","È una parte delle competenze del periodo che è già stata materialmente consegnata al lavoratore.","Compilalo se devi determinare il saldo ancora da pagare, evitando di consegnare nuovamente l'acconto.","Riduce il saldo da corrispondere. Il costo economico della retribuzione e i ratei restano interi, perché l'acconto è solo un pagamento anticipato."),
 paid13:entry("Tredicesima effettivamente corrisposta","È la somma di tredicesima che viene pagata nel prospetto, distinta dalla quota che matura.","Inserisci l'importo che intendi riconoscere dopo aver verificato quanto è maturato e quanto è già stato pagato.","Aumenta il saldo da consegnare al lavoratore. Il costo con accantonamenti continua a considerare il rateo maturato, evitando di contarne due volte il pagamento."),
 tfrAdvance:entry("Anticipo TFR","È un pagamento a valere sul fondo TFR già maturato e disponibile.","Indicalo quando esiste una richiesta del lavoratore e sono stati verificati fondo, limite del 70% e condizioni dell'anticipo annuo.","Aumenta la somma da corrispondere, ma non il nuovo TFR maturato né il costo economico corrente del lavoro. Mancanza di conferma o superamento del limite bloccano il prospetto."),
 tfrFund:entry("Fondo TFR disponibile per l'anticipo","È l'ammontare di TFR maturato e ancora disponibile già verificato dall'operatore.","Compilalo se viene riconosciuto un anticipo TFR. Considera anche anticipi precedenti e ricostruzione del fondo.","Serve al controllo del limite del 70% sull'anticipo indicato. L'app non ricostruisce automaticamente lo storico del fondo da questo valore."),
 tfrAdvanceConfirmed:entry("Conferma dei requisiti dell'anticipo TFR","Attesta la verifica della richiesta del lavoratore, dell'anticipo annuo e del fondo disponibile.","Selezionala soltanto dopo il controllo della documentazione e dell'assenza di un altro anticipo incompatibile nell'anno.","Consente la validazione dell'anticipo nei limiti inseriti. La spunta non genera automaticamente un pagamento e non incrementa il rateo TFR."),
 existingFund:entry("Fondo TFR al 31 dicembre precedente","È il fondo pregresso da assoggettare alla rivalutazione annua separata.","Inseriscilo se vuoi simulare la rivalutazione, utilizzando un fondo già ricostruito. Non includere qui la quota che matura nell'anno in corso.","Costituisce la base del calcolo della rivalutazione quando attivi l'opzione. Non viene aggiunto al costo annuo del nuovo lavoro."),
 foi:entry("Variazione annua FOI","È la variazione percentuale verificata dell'indice dei prezzi FOI da usare nella simulazione annua del fondo pregresso.","Inserisci la variazione dell'indice, per esempio 2 per il 2%, non il coefficiente finale di rivalutazione. Il dato deve essere verificato e riferito al periodo corretto.","L'app calcola separatamente 1,5% più il 75% della variazione inserita. Non prevede l'inflazione futura e non determina imposte o liquidazione finale."),
 calculateRevaluation:entry("Mostra la rivalutazione annua TFR","Attiva un calcolo informativo separato sul fondo pregresso e sul FOI inseriti.","Usalo se possiedi i due dati verificati e ti serve la simulazione annua della rivalutazione.","Mostra la rivalutazione fra gli istituti e nei documenti. Non modifica il preventivo del costo corrente e non si applica al nuovo rateo TFR dell'anno."),
 scenario:entry("Nome della simulazione","È il titolo con cui riconoscere questo preventivo.","Scegli un nome utile per archivio e confronto, ad esempio Colf 25 ore o Badante convivente.","Personalizza intestazione, archivio e nome dei file. Non incide sugli importi e viene salvato solo quando richiedi il salvataggio o l'esportazione."),
 employer:entry("Datore di lavoro","È il nome da riportare nell'intestazione del prospetto.","Compilalo se il preventivo deve essere intestato; puoi lasciarlo vuoto per una simulazione anonima.","Compare nei documenti e nell'eventuale file salvato. Non modifica i calcoli e non identifica automaticamente condizioni familiari o contributive."),
 employee:entry("Lavoratore","È il nome della colf, della badante o dell'altro assistente familiare a cui si riferisce il prospetto.","Compilalo per un documento intestato oppure lascialo vuoto per un preventivo anonimo.","Personalizza i documenti e la simulazione salvata. Non imposta automaticamente livello, anzianità, qualifica o agevolazioni."),
 operator:entry("Operatore","È il riferimento di chi prepara la simulazione.","Indicalo se vuoi riconoscere l'operatore nei documenti o nell'archivio.","Compare nel prospetto e nei dati esportati. Non modifica il calcolo e non crea un account o una condivisione fra dispositivi.")
});
export function fieldHelp(key,state={}) {
 if(key==="pay"&&state.payMode==="net")return entry("Netto ordinario concordato","È quanto il lavoratore deve ricevere per la sola paga ordinaria dopo le sue quote INPS e Cassa, prima dell'eventuale IRPEF personale.","Usalo quando l'accordo è espresso al netto, per esempio 10 euro netti all'ora. Seleziona correttamente ora o mese e inserisci separatamente maggiorazioni e rimborsi.","L'app ricostruisce il lordo nelle fasce INPS possibili, sceglie il minore conforme al minimo e determina il costo del datore. Il netto non è un importo fiscale definitivo.");
 if(key==="pay"&&state.payMode==="gross")return entry("Lordo ordinario concordato","È la retribuzione monetaria ordinaria prima delle trattenute del lavoratore, comprensiva di minimo, scatti, indennità e superminimo.","Inseriscila se conosci la paga lorda pattuita, nell'unità oraria o mensile selezionata. Vitto/alloggio monetizzato e voci aggiuntive restano nei rispettivi campi.","L'app verifica il minimo complessivo e sottrae INPS e Cassa del lavoratore per il netto. Calcola poi contributi del datore, tredicesima e TFR.");
 return FIELD_HELP[key]||null;
}
export const RESULT_HELP=Object.freeze({
 totalCost:entry("Costo del datore con accantonamenti","È il costo economico del periodo: costo corrente più quote maturate di tredicesima e TFR.","Usalo per valutare il budget complessivo della colf o badante, confrontando periodi e ipotesi omogenei.","I ratei sono conteggiati anche se non vengono pagati nel mese. Il costo effettivo del vitto/alloggio è incluso solo se lo hai inserito; il totale non è il solo bonifico al lavoratore.","result"),
 currentCost:entry("Costo corrente del periodo","Somma retribuzione lorda monetaria, contributi a carico del datore, rimborsi e costo effettivo di vitto/alloggio inserito.","Leggilo per distinguere il costo ordinario del periodo dalle quote di competenze che maturano per il futuro.","Non comprende i ratei di tredicesima e TFR, esposti a parte. Le quote contributive trattenute al lavoratore sono già nella retribuzione lorda e non si sommano una seconda volta.","result"),
 netPayable:entry("Da corrispondere al lavoratore","È il saldo monetario del prospetto dopo le trattenute e gli acconti, con gli eventuali altri pagamenti inseriti.","Usalo per sapere quanto resta da consegnare secondo questa simulazione. Controlla rimborsi, tredicesima pagata, anticipo TFR e acconto già versato.","Parte dal netto del periodo, aggiunge le somme corrisposte e i rimborsi, poi sottrae l'acconto. È prima dell'eventuale IRPEF personale e non coincide con il costo del datore.","result"),
 grossHourly:entry("Lordo orario ordinario","È la paga monetaria ordinaria di riferimento prima delle trattenute, espressa per ora.","Usala per leggere la conversione da netto o confrontare la componente ordinaria fra scenari.","Deriva dal lordo ordinario mensile diviso per le ore medie. Non comprende vitto/alloggio monetizzato e voci aggiuntive; per i conviventi è un equivalente orario di una paga minima mensile.","result"),
 grossPeriod:entry("Lordo monetario del periodo","È la somma delle competenze monetarie ordinarie e aggiuntive considerate nel periodo, prima delle quote contributive del lavoratore.","Leggilo nel dettaglio paga, verificando le ore, le maggiorazioni e l'eventuale vitto/alloggio monetizzato.","È la base da cui si sottraggono le trattenute del lavoratore per il netto del periodo. I pagamenti di tredicesima, anticipo TFR e rimborsi sono riportati separatamente.","result"),
 annualCost:entry("Costo annuo strutturale","È una proiezione di dodici mesi con paga, orario e condizioni invariati, comprese tredicesima e TFR maturati.","Usalo per confrontare budget annuali standard. Per un contratto più breve, assenze o eventi particolari occorre un conteggio specifico.","Le ferie ordinarie sono già comprese. Le voci aggiuntive entrano per dodici mesi solo se ricorrenti; festività aggiuntive da calendario, sostituzioni e costi non inseriti restano da valutare.","result"),
 base:entry("Minimo tabellare","È la paga minima della tabella contrattuale applicabile a livello e rapporto selezionati, esposta come riferimento mensile.","Confrontalo con le altre componenti per capire da dove parte il trattamento minimo.","Da solo non comprende scatti, indennità separate o superminimo. Nei rapporti a ore è convertito usando l'orario medio mensile; nei conviventi ordinari resta il minimo mensile.","result"),
 role:entry("Indennità di funzione","È la componente specifica prevista per i livelli D e DS conviventi ordinari.","La voce compare quando è prevista dalla tabella applicata. Non va aggiunta nuovamente come superminimo.","Si somma alla base contrattuale nel modello e concorre alle basi retributive pertinenti. Il minimo orario non convivente segue invece la propria tabella.","result"),
 seniority:entry("Scatti di anzianità","È l'aumento dovuto ai bienni maturati presso il datore, distinto dal superminimo.","Leggi il numero fra parentesi e controlla che corrisponda all'anzianità verificata o al calcolo automatico.","L'app applica il 4% della base minima per scatto, fino a sette. Aumenta la retribuzione utile e non viene assorbito nel superminimo.","result"),
 child:entry("Indennità bambini sotto 6 anni","È la componente prevista per le mansioni di baby-sitting BS con il requisito di età.","Controllala se hai selezionato l'apposita casella nelle indennità contrattuali.","L'importo segue la tabella del rapporto. Concorre al trattamento minimo e agli istituti pertinenti; l'eventuale assorbimento è gestito nella struttura della paga.","result"),
 multiple:entry("Indennità più non autosufficienti","È il compenso aggiuntivo per CS o DS che assistono più persone non autosufficienti.","La voce compare quando hai selezionato tale condizione effettiva.","Aumenta il trattamento minimo e le basi retributive pertinenti. Non è moltiplicata automaticamente per ogni persona aggiuntiva.","result"),
 certified:entry("Certificazione UNI 11766","È l'indennità di certificazione professionale configurata per i livelli B, BS e CS.","Controllala quando la certificazione valida è stata verificata e comunicata al datore.","Entra nel trattamento minimo e negli istituti gestiti dall'app, nel rispetto dell'eventuale assorbimento nel superminimo.","result"),
 supermin:entry("Superminimo residuo","È la parte della paga ordinaria che supera minimo, scatti e indennità dovute nel modello.","Leggila per capire quale margine aggiuntivo deriva dalla paga concordata o dal superminimo impostato.","È già compresa nel lordo e non va sommata nuovamente. Se un superminimo assorbe indennità, qui compare soltanto la parte residua oltre il minimo complessivo.","result"),
 regular:entry("Retribuzione ordinaria monetaria","È la paga ordinaria riferita al periodo simulato, senza le voci aggiuntive esposte a parte.","Confrontala con il mese medio oppure con le ore retribuite e la frazione di mensilità inserite.","Fa parte del lordo e concorre alle competenze del periodo. Le ore di ferie e festività inserite nel prospetto a ore sono già considerate nella retribuzione ordinaria.","result"),
 benefitCash:entry("Vitto/alloggio monetizzato","È il valore convenzionale delle componenti di vitto/alloggio corrisposte in denaro secondo i giorni configurati.","Compare se hai indicato giorni convenzionali da monetizzare.","Aumenta il lordo monetario e il netto del periodo. La stessa quota non deve essere reinserita nel costo effettivo delle prestazioni in natura.","result"),
 rounding:entry("Arrotondamento competenze","È l'eventuale rettifica di pochi centesimi dovuta all'arrotondamento delle singole voci.","Usala per riconciliare la somma delle competenze visibili con il totale lordo.","Non rappresenta un nuovo compenso contrattuale: rende coerenti i valori mostrati al centesimo.","result"),
 inpsWorker:entry("INPS a carico del lavoratore","È la quota contributiva del lavoratore, trattenuta dalla retribuzione lorda e compresa nel versamento totale INPS.","Controllala nel passaggio dal lordo al netto. Dipende dalla fascia e dalle ore contributive del periodo.","Riduce il netto. Il datore la versa insieme alla propria quota, ma non deve aggiungerla nuovamente al lordo per calcolare il proprio costo.","result"),
 inpsEmployer:entry("Contributi INPS del datore","È la quota INPS effettivamente a carico del datore, calcolata per le ore del periodo.","Usala per leggere il costo aggiuntivo rispetto alla retribuzione lorda.","È data dal contributo totale meno la quota del lavoratore. Si aggiunge al costo del datore e non riduce il netto del lavoratore.","result"),
 inpsTotal:entry("INPS totale","È la somma delle quote INPS del datore e del lavoratore per le ore considerate.","Leggila per distinguere la somma complessiva da versare dalla sola quota di costo del datore.","Non va sommata integralmente al lordo, perché la parte del lavoratore è già trattenuta dalla paga. Il versamento trimestrale effettivo richiede ore e calendario reali.","result"),
 cassaWorker:entry("CAS.SA.COLF del lavoratore","È la quota contrattuale di assistenza a carico del lavoratore, pari a 0,02 euro per ora retribuita nel modello 2026.","La trovi fra le trattenute e nel riepilogo contributivo.","Riduce il netto. Non è una percentuale della paga e viene versata insieme alla quota del datore secondo le modalità previste.","result"),
 cassaEmployer:entry("CAS.SA.COLF del datore","È la quota contrattuale a carico del datore, pari a 0,04 euro per ora retribuita nel modello 2026.","Leggila fra i contributi di costo del datore.","Si aggiunge al costo corrente. Non riduce il netto e non cambia soltanto perché aumenta la paga oraria.","result"),
 cassaTotal:entry("CAS.SA.COLF totale","È la somma della quota datore e della quota lavoratore: 0,06 euro per ora retribuita nel modello 2026.","Usala per leggere il contributo contrattuale complessivo relativo alle ore considerate.","Il datore versa il totale; solo la propria quota è un costo aggiuntivo al lordo. Nei rapporti notturni l'app usa le ore convenzionali Cassa specifiche.","result"),
 netPeriod:entry("Netto del periodo prima IRPEF","È il lordo monetario del periodo meno INPS e Cassa a carico del lavoratore.","Usalo per leggere quanto deriva dalle competenze retributive, prima di rimborsi, acconti e pagamenti di altri istituti.","Non coincide sempre con il saldo da consegnare, che considera anche le altre somme inserite. L'eventuale imposta personale del lavoratore non è calcolata.","result"),
 paid13:entry("Tredicesima corrisposta","È l'importo di tredicesima che hai indicato come effettivamente pagato nel prospetto.","Verifica che sia coerente con maturato, precedenti pagamenti e accordi applicabili.","Aumenta il saldo da consegnare, mentre il costo maturato della tredicesima è esposto nel suo rateo. I due importi non si sommano due volte al costo economico.","result"),
 tfrAdvance:entry("Anticipo TFR già maturato","È il pagamento autorizzato a valere sul fondo disponibile indicato.","Leggilo se hai compilato anticipo, fondo e relativa conferma.","Aumenta il saldo monetario del lavoratore. Non rappresenta nuovo TFR maturato nel periodo e non incrementa il costo corrente del nuovo lavoro.","result"),
 reimbursements:entry("Rimborsi documentati","È la restituzione delle spese giustificate inserite nella simulazione.","Controllala se il lavoratore ha anticipato costi per conto del datore.","Aumenta saldo da corrispondere e costo del periodo; nel modello non entra nella retribuzione utile a contributi, tredicesima o TFR.","result"),
 advance:entry("Acconto già corrisposto","È una parte della paga che risulta già versata al lavoratore.","Leggila per riconciliare il saldo da consegnare con i pagamenti già eseguiti.","Viene sottratta dal saldo, senza ridurre il costo economico della retribuzione e senza cambiare gli istituti maturati.","result"),
 actualBoard:entry("Costo effettivo vitto/alloggio inserito","È la spesa reale in natura che hai aggiunto al preventivo, distinta dal valore convenzionale.","Usala per verificare che il costo familiare includa anche questa componente, quando sostenuta.","Aumenta il costo del datore ma non il netto del lavoratore. Se non è stata inserita, il totale non stima automaticamente quella spesa.","result"),
 thirteenth:entry("Rateo tredicesima maturato","È la quota di tredicesima che matura nel periodo, distinta dalla somma già pagata.","Usala per accantonare il costo della mensilità aggiuntiva.","Nel modello deriva dalla retribuzione annua di riferimento divisa per dodici, con l'eventuale proporzione del rapporto mensilizzato. Comprende il vitto/alloggio convenzionale spettante.","result"),
 tfr:entry("Rateo TFR maturato","È la quota di trattamento di fine rapporto che matura nel periodo simulato.","Usala per stimare l'accantonamento del periodo, separatamente dagli anticipi di fondi già maturati.","L'app divide la retribuzione utile per 13,5, includendo quota di tredicesima e vitto/alloggio pertinenti. La rivalutazione del fondo pregresso è separata.","result"),
 leave:entry("Ferie maturate in giorni convenzionali","È la maturazione informativa delle ferie, riferita alla settimana convenzionale di sei giorni.","Leggila per capire la quota maturata; non è il saldo residuo, che richiederebbe ferie precedenti, godute e spettanti.","Un mese intero di riferimento vale 26/12 giorni. Nel preventivo annuo medio il costo delle ferie ordinarie è già incluso, senza aggiungere un secondo accantonamento economico.","result"),
 inpsBand:entry("Fascia INPS","È la classe contributiva applicata secondo retribuzione effettiva e orario settimanale.","Controllala quando confronti diverse paghe o orari, soprattutto alle soglie contributive.","Fino a 24 ore rilevano le fasce retributive; oltre 24 ore il modello usa il contributo fisso per tutte le ore. Non è un'aliquota fiscale.","result"),
 inpsEffective:entry("Retribuzione effettiva per la fascia INPS","È il riferimento previdenziale orario comprendente paga, quota di tredicesima e vitto/alloggio pertinenti.","Usalo per capire perché è stata selezionata una certa fascia. Non sostituisce la paga oraria ordinaria concordata.","Determina la fascia fino a 24 ore settimanali. Può essere superiore al lordo orario visualizzato perché contiene componenti aggiuntive previste per il riferimento contributivo.","result"),
 inpsHours:entry("Ore INPS del periodo","Sono le ore contributive utilizzate nella stima, comprese le ore retribuite aggiuntive pertinenti.","Confrontale con presenze e periodo; per i rapporti notturni controlla anche la base settimanale inserita dall'operatore.","Moltiplicate per il contributo orario determinano le quote INPS. Il mese medio non sostituisce il conteggio trimestrale effettivo.","result"),
 cassaHours:entry("Ore CAS.SA.COLF del periodo","Sono le ore utilizzate per il contributo contrattuale della Cassa nel periodo.","Controllale insieme alla retribuzione delle ore e alla disciplina del rapporto.","Determinano le quote Cassa di datore e lavoratore. Nei rapporti speciali notturni possono essere diverse dalle ore INPS per le convenzioni contrattuali.","result"),
 grossMonthly:entry("Lordo ordinario del mese medio","È la paga ordinaria mensile di riferimento prima delle trattenute.","Leggila per riconciliare minimo, scatti, indennità e superminimo.","Per i rapporti a ore deriva dalla paga oraria per le ore medie mensili. Non comprende le voci aggiuntive del periodo esposte nelle altre righe.","result")
});
const RESULT_ALIASES=Object.freeze({
 "Costo del datore con accantonamenti":"totalCost","Costo complessivo del periodo":"totalCost","Costo con ratei del periodo":"totalCost",
 "Costo corrente":"currentCost","Costo corrente del periodo":"currentCost","Da corrispondere al lavoratore":"netPayable","Da corrispondere":"netPayable",
 "Lordo orario ordinario":"grossHourly","Lordo orario":"grossHourly","Lordo monetario del periodo":"grossPeriod","Retribuzione lorda monetaria":"grossPeriod","Totale lordo ordinario e aggiuntivo":"grossPeriod",
 "Costo annuo strutturale":"annualCost","Minimo tabellare":"base","Indennità di funzione":"role","Indennità bambini sotto 6 anni":"child","Indennità più non autosufficienti":"multiple","Certificazione UNI 11766":"certified","Superminimo residuo":"supermin",
 "Retribuzione ordinaria monetaria":"regular","Vitto/alloggio monetizzato":"benefitCash","Arrotondamento competenze":"rounding",
 "INPS a carico del lavoratore":"inpsWorker","INPS lavoratore":"inpsWorker","INPS datore":"inpsEmployer","Contributi INPS datore":"inpsEmployer","INPS totale":"inpsTotal",
 "CAS.SA.COLF a carico del lavoratore":"cassaWorker","CAS.SA.COLF lavoratore":"cassaWorker","CAS.SA.COLF datore":"cassaEmployer","CAS.SA.COLF totale":"cassaTotal",
 "Netto ordinario prima IRPEF":"netPeriod","Tredicesima corrisposta":"paid13","Anticipo TFR (fondo già maturato)":"tfrAdvance","Rimborsi documentati":"reimbursements","Acconto già corrisposto":"advance",
 "Costo effettivo vitto/alloggio inserito":"actualBoard","Rateo tredicesima":"thirteenth","Rateo tredicesima maturato":"thirteenth","Rateo TFR":"tfr","Rateo TFR maturato":"tfr","Ferie · giorni":"leave",
 "Lordo ordinario del mese medio":"grossMonthly","Livello":"field.level","Rapporto":"field.regime","Ore settimanali":"field.hours"
});
const EXTRA_RESULTS=Object.freeze({
 "Ore aggiuntive ordinarie":"extraOrdinary","Ore dalla 41ª alla 44ª (+10%)":"overtime10",
 "Straordinario diurno (+25%)":"overtime25","Straordinario notturno (+50%)":"overtime50",
 "Lavoro festivo / domenicale (+60%)":"holidayWorked","Riposo convivente (+40%)":"restWorked",
 "Maggiorazione notturno ordinario (+20%)":"ordinaryNight"
});
export function resultHelpKey(label) {
 if(/^Scatti di anzianità \(/.test(label))return "result.seniority";
 if(EXTRA_RESULTS[label])return "extra."+EXTRA_RESULTS[label];
 const key=RESULT_ALIASES[label];
 return key?(key.startsWith("field.")?key:"result."+key):null;
}
export const ACTION_HELP=Object.freeze({
 docx:entry("Esportazione Word modificabile","Genera un documento DOCX con intestazione, tabelle native, dati, ipotesi e fonti.","Usalo per personalizzare il prospetto, aggiungere osservazioni o preparare una relazione per il cliente.","Scarica un file modificabile in Word e programmi compatibili. Modificare il documento non aggiorna automaticamente la simulazione nell'app.","action"),
 xlsx:entry("Esportazione Excel con formule","Genera un file XLSX con parametri, formule, voci aggiuntive, tabelle e dati originali.","Usalo per esaminare o rielaborare il preventivo in un foglio di calcolo.","Il lordo risolto nell'app è un parametro modificabile. Per rifare l'inversione netto/lordo o cambiare livello e regime, rigenera dall'app: le modifiche al foglio non ritornano automaticamente nel calcolatore.","action"),
 pdf:entry("Esportazione PDF","Genera il prospetto impaginato con testo e tabelle pronti per la consegna.","Usalo quando vuoi inviare o stampare una versione stabile del risultato.","Scarica il documento con i dati e le ipotesi del calcolo corrente. Per modificare testi e celle usa l'esportazione Word o Excel.","action"),
 json:entry("File della simulazione","Salva i dati strutturati necessari a riaprire il preventivo nell'app.","Usalo per conservare una copia o trasferire il preventivo a un altro dispositivo con la funzione Importa simulazione.","Non è un documento da consegnare come relazione. Quando lo riapri, l'app valida e ricalcola i dati con la propria versione compatibile.","action")
});
export function minimumHelp(levelKey,regime,hours=0){
 const m=ccnlMinimum(levelKey,regime,hours);if(!m)return null;
 const value=m.total.toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2});
 return entry("Minimo CCNL · tabella "+m.table,"È il minimo lordo 2026 "+(regime==="presence"?"della presenza notturna a livello unico":"del livello "+levelKey)+" per il rapporto "+REGIMES[regime].toLowerCase()+": "+value+" euro "+(m.unit==="hour"?"per ora":"al mese")+".","È la base da applicare quando mansioni e condizioni del rapporto corrispondono alla tabella. Il minimo è lo stesso per tempo determinato e indeterminato.","È il riferimento prima di scatti, ulteriori indennità e superminimo. "+(m.role?"Il totale comprende già l’indennità di funzione di "+m.role.toLocaleString("it-IT",{minimumFractionDigits:2})+" euro: non sommarla due volte. ":"")+(m.unit==="hour"?"Il riferimento mensile si ottiene con ore settimanali × 52 ÷ 12.":"La paga mensile della specifica tabella non si riduce automaticamente in proporzione alle ore.")+" La durata del contratto può invece cambiare la contribuzione INPS.","result");
}
function resolveHelp(key,state){
 if(key==="minimum.selected")return minimumHelp(state.level,state.regime,state.hours);
 if(key.startsWith("minimum.")){const [,level,regime]=key.split(".");return minimumHelp(level,regime);}
 if(key.startsWith("field."))return fieldHelp(key.slice(6),state);
 if(key.startsWith("result."))return RESULT_HELP[key.slice(7)]||null;
 if(key.startsWith("extra.")){const h=fieldHelp(key.slice(6),state);return h?entry(h.title,h.what,"La voce compare perché hai inserito ore nella relativa casella. Verifica quantità, tipologia e assenza di sovrapposizioni.",h.effect,"result"):null;}
 if(key.startsWith("export."))return ACTION_HELP[key.slice(7)]||null;
 return null;
}
let active=null,panel=null,getState=()=>({}),openTimer=null,closeTimer=null,serial=0,restoringFocus=false;
const byId=id=>document.getElementById(id);
function makeButton(key,title){
 const b=document.createElement("button");
 b.type="button";b.className="help-trigger";b.dataset.helpKey=key;
 b.setAttribute("aria-label","Aiuto: "+title);b.setAttribute("aria-haspopup","dialog");
 b.setAttribute("aria-controls","context-help-popover");b.setAttribute("aria-expanded","false");
 const icon=document.createElement("span");icon.setAttribute("aria-hidden","true");icon.textContent="i";b.append(icon);
 return b;
}
function placePanel(){
 if(!active||!panel||panel.hidden)return;
 const r=active.anchor.getBoundingClientRect(),vv=window.visualViewport;
 const left=vv?.offsetLeft||0,top=vv?.offsetTop||0,width=vv?.width||innerWidth,height=vv?.height||innerHeight;
 const pad=12;
 panel.style.maxWidth=Math.max(0,width-2*pad)+"px";
 panel.style.maxHeight=Math.max(0,height-2*pad)+"px";
 const size=panel.getBoundingClientRect();
 const x=Math.max(left+pad,Math.min(r.left,left+width-size.width-pad));
 const below=top+height-r.bottom-pad,above=r.top-top-pad;
 let y=r.bottom+8;
 if(size.height>below&&above>=size.height+8)y=r.top-size.height-8;
 else if(size.height>below)y=top+pad;
 y=Math.max(top+pad,Math.min(y,top+height-size.height-pad));
 panel.style.left=x+"px";panel.style.top=y+"px";
}
export function closeContextHelp(returnFocus=false){
 clearTimeout(openTimer);clearTimeout(closeTimer);
 if(!active)return;
 const anchor=active.anchor;
 anchor.setAttribute("aria-expanded","false");active=null;
 panel.hidden=true;
 if(returnFocus&&anchor.isConnected){restoringFocus=true;anchor.focus({preventScroll:true});queueMicrotask(()=>{restoringFocus=false;});}
}
function showHelp(anchor,pin=false){
 const data=resolveHelp(anchor.dataset.helpKey,getState());if(!data)return;
 clearTimeout(openTimer);clearTimeout(closeTimer);
 const existing=active?.anchor;
 if(existing&&existing!==anchor)existing.setAttribute("aria-expanded","false");
 const container=anchor.closest("dialog[open]")||document.body;
 if(panel.parentElement!==container)container.append(panel);
 active={anchor,pinned:pin||(existing===anchor&&active?.pinned===true)};
 anchor.setAttribute("aria-expanded","true");
 byId("context-help-title").textContent=data.title;
 const labels=data.kind==="result"?["Che cos’è","Quando considerarlo","Come si determina"]:data.kind==="action"?["A cosa serve","Quando usarlo","Cosa succede"]:["Che cos’è","Quando indicarlo","Cosa determina"];
 const values=[data.what,data.when,data.effect],body=byId("context-help-body");
 body.replaceChildren();
 labels.forEach((label,n)=>{const section=document.createElement("section"),h=document.createElement("h3"),p=document.createElement("p");h.textContent=label;p.textContent=values[n];section.append(h,p);body.append(section);});
 panel.hidden=false;panel.style.left="12px";panel.style.top="12px";placePanel();
 if(pin)panel.querySelector(".help-close").focus({preventScroll:true});
}
function delayClose(){
 clearTimeout(closeTimer);
 closeTimer=setTimeout(()=>{
  if(active&&!active.pinned&&!panel.matches(":hover")&&document.activeElement!==active.anchor&&!panel.contains(document.activeElement))closeContextHelp();
 },180);
}
function captionText(label){
 const control=label.querySelector("input,select,textarea");
 const clone=label.cloneNode(true);clone.querySelectorAll("input,select,textarea,.input-money,small").forEach(n=>n.remove());
 return clone.textContent.replace(/\s+/g," ").trim()||control?.name||"Campo";
}
function decorateForm(form){
 for(const label of [...form.querySelectorAll("label.field")]){
  const input=label.querySelector("input[name],select[name],textarea[name]");
  if(!input||!FIELD_HELP[input.name])continue;
  const title=captionText(label),container=document.createElement("div"),caption=document.createElement("div"),textLabel=document.createElement("label");
  container.className=label.className;
  for(const attr of [...label.attributes])if(attr.name!=="class")container.setAttribute(attr.name,attr.value);
  caption.className="field-caption";textLabel.htmlFor=input.id;
  const nodes=[...label.childNodes];
  for(const node of nodes){
   if(node===input||node.nodeType===1&&node.contains(input))break;
   if(node.nodeType===3||node.nodeType===1&&node.id==="pay-label")textLabel.append(node);
  }
  caption.append(textLabel,makeButton("field."+input.name,title));
  label.replaceWith(container);container.append(caption,...label.childNodes);
  const description=document.createElement("span");description.id="field-help-summary-"+(++serial);description.className="help-sr-only";
  description.textContent=FIELD_HELP[input.name].what;
  container.append(description);
  input.setAttribute("aria-describedby",[input.getAttribute("aria-describedby"),description.id].filter(Boolean).join(" "));
 }
 for(const label of [...form.querySelectorAll("label.check")]){
  const input=label.querySelector("input[name]");if(!input||!FIELD_HELP[input.name])continue;
  const holder=document.createElement("div");holder.className="check-with-help"+(label.classList.contains("full")?" full":"");
  if(label.hasAttribute("data-visible")){holder.dataset.visible=label.dataset.visible;label.removeAttribute("data-visible");}
  label.classList.remove("full");
  label.replaceWith(holder);holder.append(label,makeButton("field."+input.name,FIELD_HELP[input.name].title));
 }
 const modes=form.querySelector(".segmented");
 if(modes){const caption=document.createElement("div");caption.className="field-caption mode-caption";const text=document.createElement("span");text.textContent="Modalità di calcolo";caption.append(text,makeButton("field.payMode",FIELD_HELP.payMode.title));modes.before(caption);}
}
export function refreshResultHelp(root){
 if(!root)return;
 for(const node of root.querySelectorAll(".result-label,.hero-pair>span,.metric>span,.accruals>div>span,.data-table td:first-child,.compare-table th[scope='row'],[data-help-result],[data-help-minimum]")){
  if(node.querySelector(".help-trigger"))continue;
  const label=(node.firstChild?.nodeType===3?node.firstChild.textContent:node.textContent).trim();
  const key=node.dataset.helpMinimum?"minimum."+node.dataset.helpMinimum:node.dataset.helpResult?"result."+node.dataset.helpResult:resultHelpKey(label);
  const data=key&&resolveHelp(key,getState());if(data)node.append(makeButton(key,data.title));
 }
}
export function installContextHelp(form,stateReader){
 getState=stateReader;
 panel=document.createElement("aside");panel.id="context-help-popover";panel.className="context-help";panel.hidden=true;
 panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","false");panel.setAttribute("aria-labelledby","context-help-title");panel.setAttribute("aria-describedby","context-help-body");
 const header=document.createElement("div");header.className="context-help-header";
 const heading=document.createElement("h2");heading.id="context-help-title";
 const close=document.createElement("button");close.type="button";close.className="help-close";close.setAttribute("aria-label","Chiudi spiegazione");close.textContent="×";close.addEventListener("click",()=>closeContextHelp(true));
 header.append(heading,close);
 const body=document.createElement("div");body.id="context-help-body";body.className="context-help-body";
 panel.append(header,body);document.body.append(panel);
 decorateForm(form);
 for(const choice of [...document.querySelectorAll("[data-export]")]){
  const key=choice.dataset.export,holder=document.createElement("div");holder.className="export-choice";
  choice.replaceWith(holder);holder.append(choice,makeButton("export."+key,ACTION_HELP[key].title));
 }
 document.addEventListener("click",event=>{
  const trigger=event.target.closest?.(".help-trigger");if(!trigger)return;
  event.preventDefault();event.stopPropagation();
  if(active?.anchor===trigger&&active.pinned)closeContextHelp(true);else showHelp(trigger,true);
 });
 document.addEventListener("pointerover",event=>{
  const trigger=event.target.closest?.(".help-trigger");
  if(!trigger||event.pointerType==="touch"||!matchMedia("(hover: hover) and (pointer: fine)").matches||trigger.contains(event.relatedTarget))return;
  if(active?.pinned)return;clearTimeout(openTimer);openTimer=setTimeout(()=>showHelp(trigger),180);
 });
 document.addEventListener("pointerout",event=>{
  const trigger=event.target.closest?.(".help-trigger");if(trigger&&!trigger.contains(event.relatedTarget)){clearTimeout(openTimer);delayClose();}
 });
 panel.addEventListener("pointerenter",()=>clearTimeout(closeTimer));panel.addEventListener("pointerleave",delayClose);
 document.addEventListener("focusin",event=>{
  if(restoringFocus)return;
  const trigger=event.target.closest?.(".help-trigger");
  if(trigger){showHelp(trigger);return;}
  if(active&&!panel.contains(event.target))closeContextHelp();
 });
 document.addEventListener("focusout",()=>setTimeout(()=>{if(active&&document.activeElement!==active.anchor&&!panel.contains(document.activeElement)&&!panel.matches(":hover"))closeContextHelp();},0));
 document.addEventListener("pointerdown",event=>{if(active&&!active.anchor.contains(event.target)&&!panel.contains(event.target))closeContextHelp();},true);
 document.addEventListener("keydown",event=>{
  if(!active)return;
  if(event.key==="Escape"){event.preventDefault();event.stopPropagation();closeContextHelp(true);return;}
  if(event.key==="Tab"&&panel.contains(document.activeElement)){
   const anchor=active.anchor;
   const controls=[...document.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,summary')].filter(n=>!n.disabled&&n.getClientRects().length&&!panel.contains(n));
   const next=event.shiftKey?anchor:controls[controls.indexOf(anchor)+1]||anchor;
   event.preventDefault();closeContextHelp(false);next.focus({preventScroll:true});
  }
 },true);
 document.addEventListener("toggle",()=>{if(active&&!active.anchor.getClientRects().length)closeContextHelp();},true);
 document.addEventListener("close",()=>closeContextHelp(),true);
 window.addEventListener("resize",placePanel);
 window.visualViewport?.addEventListener("resize",placePanel);
 window.visualViewport?.addEventListener("scroll",placePanel);
 document.addEventListener("scroll",event=>{if(!active||panel.contains(event.target))return;const r=active.anchor.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)closeContextHelp();else placePanel();},true);
 window.addEventListener("beforeprint",()=>closeContextHelp());
}
