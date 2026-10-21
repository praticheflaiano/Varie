# Verifica dei calcoli del 21 ottobre 2026

Versione verificata: 1.3.0. Versione di partenza esaminata: commit 0d96445bdfcebf5416c8cf66cc1b7efb78ae1599, versione 1.2.0.

## Esito

La versione precedente conteneva difetti riproducibili anche se superava i suoi test. Sono stati corretti gli errori descritti sotto e aggiunti casi indipendenti. Le tabelle ordinarie 2026 risultano coerenti con le fonti ministeriali e INPS consultate.

Il calcolatore produce preventivi, prospetti mensili simulati e controlli trimestrali. Non è un elaboratore completo di paghe per ogni evento del rapporto. La corrispondenza perfetta con qualsiasi busta paga reale non è dimostrata e non viene dichiarata. Non sono stati confrontati cedolini domestici reali e avvisi INPS ufficiali riferiti allo stesso rapporto con tutte le presenze.

## Errori individuati e interventi

| Caso riproducibile | Versione 1.2.0 | Versione 1.3.0 |
|---|---|---|
| Convivente CS, mezza mensilità, 10 giorni monetizzati di vitto/alloggio completo | Accreditava 33,30 euro, riducendo nuovamente i giorni già riferiti al periodo | Accredita 66,60 euro. Nel caso campione il netto passa da 597,22 a 630,52 euro |
| Presenza E, 2 ore attive a 10 euro e notturno sulle stesse 2 ore | Excel conservava 24 euro ma ricalcolava circa 17,97 euro, usando la paga di attesa | Il ricalcolo usa la paga attiva e restituisce 24 euro |
| 1,5 ore INPS, tariffa totale 1,24 e quota lavoratore 0,31 | Le quote arrotondate separatamente totalizzavano 1,87 euro | Totale 1,86 euro; lavoratore 0,47 e datore 1,39 euro |
| Mese successivo alla cessazione già inserita | Esponeva ancora una normale paga | Il calcolo è bloccato |
| Fine rapporto al 31 ottobre copiata al quarto trimestre, 25 ore costanti e rapporto già attivo | La data non veniva trasferita; potevano essere proposte 13 settimane | La data viene trasferita e controllata. Nelle cinque settimane del caso: 155 euro INPS + 7,50 euro F2 = 162,50 euro, anziché 422,50 euro |
| Assistenza D e altre 100 ore di notturno ordinario sulle ore già coperte | Consentiva circa 158,41 euro di maggiorazione nel caso campione | Impedisce la doppia maggiorazione |
| Sei notti di presenza da 11 ore | Il limite generale di 54 ore impediva l'inserimento di 66 ore | Limiti distinti per i rapporti speciali: 66 ore per E e 72 per D. La base previdenziale resta separata |
| Netto concordato, ore effettive e vitto monetizzato | L'inversione considerava un periodo diverso da quello pagato | Usa la stessa frazione retributiva e i giorni monetizzati del periodo |
| Una settimana passa dall'altra parte della soglia di 24 ore | Il trimestre applicava a tutte le ore la sola tariffa del preventivo | Blocca il prospetto a tariffa unica: occorre elaborare le fasce settimanali |

Sono inoltre controllate le ore materialmente possibili nei giorni iniziali/finali del rapporto. Il mese di cessazione avvisa che non contiene una liquidazione finale.

## Copertura per tipo di rapporto

La matrice economica include 33 combinazioni: tabella C per otto livelli a 20 e 25 ore, A per otto livelli, B per B/BS/C, G per CS/DS, D per BS/CS/DS ed E. Ciascuna è verificata con tempo indeterminato, determinato ordinario e sostitutivo, con e senza CUAF: 198 combinazioni. Ogni test confronta minimo, paga lorda e inversione da netto.

| Componente | Verifica eseguita | Dati ancora necessari nella pratica |
|---|---|---|
| Minimi A/B/C/D/E/G e funzione D/DS | Confronto numerico con il Ministero | Mansioni, livello e regime corretti |
| INPS ordinario, TD/sostitutivo, CUAF | Tariffe 2026, limiti delle fasce e quote | Fascia applicabile e posizione senza esoneri individuali |
| Conviventi A/B | Minimo mensile, basi convenzionali e netto | Ore effettive, quota di paga e costo reale del vitto/alloggio |
| Notturni D/E | Basi INPS/Cassa distinte e interventi attivi E | Atto scritto, notti, attività, fasce orarie e base previdenziale verificati |
| Tabella G | Minimi CS/DS | Effettiva copertura dei riposi prevista dal contratto |
| Tredicesima e TFR | Formule e separazione fra maturato e pagato | Base utile verificata nei mesi parziali; fondo e liquidazione finale specifici |
| Ferie | Rateo convenzionale 26/12 per mese utile | Registro di maturato, goduto e residuo |
| Permessi | Nessun conteggio automatico completo dei diversi diritti | Causale, documentazione, quantità e trattamento verificati |
| Trimestre INPS/F2 | Calendario, somme, quote e riconciliazione dei casi ammessi | Presenze, tariffa costante e confronto con l'avviso ufficiale |

Il netto è prima dell'IRPEF personale. Nel calcolo dal netto il vitto monetizzato inserito è compreso nel netto concordato. Le ore aggiuntive richiedono la corretta classificazione dell'operatore.

## Differenza fra preventivo e paga effettiva

Il mese medio usa ore settimanali × 52 / 12. Il mese reale dipende da calendario, distribuzione giornaliera, festività, ferie e assenze.

Esempio aritmetico: 25 ore settimanali a 10 euro netti producono 1.083,33 euro nel mese medio. Inserendo 110 ore ordinarie e 25/6 ore di festività retribuita, il prospetto produce circa 1.141,67 euro, prima di altri eventi. È un confronto fra quantità retribuite, non la ricostruzione di una busta paga reale.

Il costo annuo è una proiezione strutturale a condizioni costanti. Le date non lo trasformano nel costo di un contratto più breve. Sostituti, festività aggiuntive, assenze e costi in natura non inseriti possono modificare il consuntivo.

## Limiti operativi rimasti

- Le trattenute mensili usano una sola tariffa: se le settimane attraversano la soglia di 24 ore, occorre un conteggio specifico. Il mese espone un avviso; il trimestre viene bloccato.
- Variazioni di paga, orario, CUAF, contratto o agevolazioni richiedono periodi distinti. Gli scatti che cambiano la paga nel trimestre bloccano il prospetto unico.
- Malattia, maternità, infortunio, arretrati, trasferte, preavviso e liquidazioni finali non sono elaborati automaticamente.
- Gli esoneri individuali bloccano la tabella ordinaria. La disciplina particolare degli studenti conviventi non è modellata.
- La rivalutazione TFR usa il FOI inserito dall'operatore; non è una liquidazione fiscale.
- La riconciliazione numerica non certifica presenze, inquadramento o comunicazioni. Il documento non è un avviso pagoPA.
- Le tabelle 2026 non sono applicate al 2027. Le simulazioni riaperte sono ricalcolate con la versione attiva: conservare anche i documenti originariamente consegnati.

## Controlli superati

- 261 test Node, inclusa la matrice di 198 combinazioni e le regressioni.
- 42 prove browser desktop/mobile, comprese esportazioni, uso offline, aiuti e nuovi casi di errore.
- 39 file mensili ricalcolati con un motore di foglio elettronico indipendente: 23 risultati per file, prima e dopo una modifica del lordo del 12%, per 78 ricalcoli.
- 4 file trimestrali verificati con lo stesso motore: 16 risultati, prima e dopo una modifica delle ore, per altri 8 ricalcoli.
- DOCX/XLSX/PDF mensili e trimestrali letti con python-docx, openpyxl e pypdf. La sola lettura dei valori salvati non è stata considerata prova del ricalcolo Excel.

Comandi: npm test; npm run test:browser; python3 tests/validate_exports.py. Il controllo aggiuntivo tests/validate_recalculation.mjs usa Artifact Tool nel runtime Codex e richiede CODEX_PRIMARY_RUNTIME_NODE e CODEX_PRIMARY_RUNTIME_NODE_MODULES configurati. Il controllo indipendente è stato eseguito localmente; non è un risultato della CI GitHub.

## Fonti consultate

1. [Ministero del Lavoro: minimi 2026](https://www.lavoro.gov.it/temi-e-priorita-rapporti-di-lavoro-e-relazioni-industriali/focus/tabella-lavoro-domestico-2026).
2. [INPS: circolare 9 del 3 febbraio 2026](https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/02/Circolare_15154/Allegati/16551_Circolare-numero-9-del-03-02-2026.pdf).
3. [DOMINA, parte firmataria: CCNL H501 2025-2028](https://associazionedomina.it/ccnl-lavoro-domestico/), artt. 10-20, 34-41 e 54.
4. [INPS: composizione della retribuzione effettiva](https://www.inps.it/it/it/dettaglio-approfondimento.schede-informative.49828.contributi-e-agevolazioni-fiscali-per-chi-assume-un-lavoratore-domestico.html). Nessuna tariffa 2025 della pagina viene riutilizzata.
5. [INPS: tredicesima e ferie](https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.calcolare-contributi-tredicesima-e-ferie-per-i-lavoratori-domestici-50060.calcolare-contributi-tredicesima-e-ferie-per-i-lavoratori-domestici.html).
6. [INPS: messaggio 70/2003, calendario e arrotondamento](https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2003/06/Circolare_10887/Allegati/0_Messaggio-numero-70-del-16-6-2003_Allegato-n-1.pdf). Nessuna tariffa storica viene usata.
7. [CAS.SA.COLF: versamenti](https://www.cassacolf.it/contribuzione/versamento-contributi/) e [regolamento lavoratori](https://www.cassacolf.it/chi-siamo/regolamento-lavoratori/).

I controlli documentano i casi provati e i limiti del programma. Non costituiscono certificazione delle paghe individuali o garanzia assoluta.
