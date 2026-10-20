# Flaiano · Colf e badanti 2026

PWA autonoma, senza dipendenze di produzione e senza invio dei dati a server. Il motore di calcolo, la presentazione e le esportazioni sono separati.

## Avvio

Richiede Node.js 20 o successivo solo per il server di sviluppo:

    node scripts/serve.mjs

Aprire http://localhost:4173. Per l'uso da telefono e l'installazione PWA pubblicare i file statici tramite HTTPS. Non aprire index.html direttamente con file://: i moduli JavaScript richiedono un server.

Per ospitare l'app è sufficiente copiare nella stessa cartella index.html, styles.css, app.js, data.js, engine.js, exports.js, sw.js, manifest.webmanifest, icon.svg, icon-192.png, icon-512.png, scripts/serve.mjs, package.json e questo README. Tutti i percorsi sono relativi, quindi è supportata anche una sottocartella del dominio.

## Funzioni

- Livelli A, AS, B, BS, C, CS, D e DS, con mansioni e minimi 2026.
- Non conviventi, conviventi, tabella B, sostituzione riposi, assistenza e presenza notturna.
- Minimo CCNL con superminimo, lordo concordato o netto ordinario richiesto.
- Scatti, indennità di funzione, bambini sotto 6 anni, più persone non autosufficienti e UNI 11766.
- INPS 2026: fasce, oltre 24 ore, tempo determinato e sostitutivo, CUAF.
- CAS.SA.COLF distinta per datore e lavoratore.
- Vitto/alloggio convenzionale, monetizzato e costo effettivo separati.
- Voci aggiuntive e maggiorazioni; distinzione fra voci occasionali e ricorrenti.
- Tredicesima, TFR, acconti, rimborsi e anticipo TFR verificato.
- Preventivo medio e prospetto mensile simulato sulle ore di presenza inserite.
- Confronto di quattro scenari; archivio locale; import/export JSON.
- Esportazioni native DOCX, XLSX e PDF, interamente generate sul dispositivo.
- PWA con service worker, senza librerie o font caricati da terzi.

## Calcoli e limiti

Il netto è prima dell'eventuale IRPEF personale. L'inversione netto/lordo enumera le fasce INPS e sceglie il minore lordo valido, rispettando il minimo contrattuale. Le trattenute cambiano a scaglioni: non si usa una percentuale fissa.

Il mese medio usa ore settimanali × 52 / 12. È una stima di budget, non il calendario di un cedolino. Il prospetto mensile richiede ore e frazioni verificate; non elabora malattia, maternità, infortunio, arretrati, contenziosi o liquidazioni finali.

Il costo annuale è strutturale su 12 mesi a condizioni costanti. Ferie ordinarie comprese, senza doppio accantonamento. Sono esclusi eventi occasionali, festività aggiuntive da calendario e costi di sostituzione. Le quote in natura entrano negli istituti ma il costo effettivo va inserito dal datore.

Per i rapporti notturni le ore INPS devono essere verificate e inserite dall'operatore. Le ore convenzionali contrattuali Cassa non sono usate automaticamente come ore INPS.

Gli importi trimestrali INPS definitivi richiedono calendario e ore retribuite reali: l'app non genera un PagoPA.

Le tabelle sono esclusivamente 2026. Il motore rifiuta un mese di un altro anno.

## Esportazioni

DOCX: documento A4 con tabelle native, titoli, intestazione del centro e numero pagina. Le celle sono modificabili.

XLSX: sei fogli, parametri, calcoli con formule e valori memorizzati, voci aggiuntive, aliquote, dati originali, fonti e note. Il lordo risolto nell'app è un parametro modificabile; l'inversione netto/lordo resta nell'app. Per cambiare livello o regime rigenerare il prospetto.

PDF: testo e tabelle vettoriali, font standard, pagine A4 e numerazione; non è una schermata del browser.

Il codice ZIP/Open XML è locale e non usa macro o collegamenti esterni. Le stringhe degli utenti sono esportate come testo, non come formule Excel.

## Verifiche

    npm test

Per verifiche browser:

    npm install
    npx playwright install chromium
    npm run test:browser

Le verifiche comprendono casi contributivi alle soglie, inversione netto/lordo, minimi, convivenza, indennità, scatti, rapporti notturni, TFR, riconciliazione degli importi, formati esportati, assenza di risultati obsoleti, salvataggio, confronto, viewport mobile e uso offline.

Il workflow GitHub dedicato esegue inoltre controlli con python-docx, openpyxl e pypdf e raccoglie i campioni esportati come artifact.

## Fonti e manutenzione

Fonti primarie e delle parti firmatarie elencate in data.js e nella schermata Regole e fonti. Verifica: 20 ottobre 2026. Prima di aggiungere un anno aggiornare tabelle, fonti e test ai bordi di fascia; incrementare VERSION e il nome della cache nel service worker. Una nuova cache viene applicata dopo la chiusura delle vecchie finestre per evitare aggiornamenti nel mezzo di un preventivo.

L'archivio è locale al browser, non condiviso fra dispositivi. Non vengono raccolti dati di utilizzo o inseriti dati reali di clienti nel codice.
