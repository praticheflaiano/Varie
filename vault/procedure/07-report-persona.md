---
title: "Procedura: documenti Openapi (area riservata)"
type: procedura
tags: [openapi, report-persona, area-riservata, ghl]
created: 2026-11-12
updated: 2026-11-12
---

# Documenti Openapi (`/riservata/report-persona`)

Pagina **a uso interno del titolare** per richiedere documenti a Openapi da un unico posto. Non è un servizio
venduto al pubblico. Dietro ci sono due servizi di Openapi:

- **Report Persona** (API Risk, `risk.openapi.com`): voce fissa. Anagrafica, affidabilità, protesti,
  pregiudizievoli, cariche, partecipazioni, dati catastali. 3,60 € + IVA (listino del 12/11/2026), non divisibile.
- **DocuEngine** (`docuengine.openapi.com`): tutto il catalogo dei documenti (camerali, catastali, protesti,
  ecc.). Il catalogo **si legge da Openapi** con `GET /documents`: nome, categoria, prezzo, immediato o in
  differita (`isSync`), dati richiesti, opzioni. La pagina costruisce il modulo da quei dati, quindi nuove voci
  e nuovi prezzi compaiono da soli. Copia in archivio per 6 ore (`report/catalogo.json`), pulsante "Aggiorna catalogo".

## Decisioni di Antonio (12/11/2026)

- Accesso solo suo, con una password.
- Report standard Openapi, **senza loghi** (nessun parametro white label).
- Conservazione: **12 mesi** nell'archivio Vercel, poi cancellazione automatica; nel CRM GHL il file resta **senza scadenza**.
- CRM: si riusa il `GHL_API_TOKEN` già presente sul progetto Vercel. Il contatto si cerca per codice fiscale
  e incrociando nome e cognome; se il contatto trovato non ha il codice fiscale, viene aggiunto.
- Una pagina sola per tutte le richieste documentali a Openapi, che dica per ogni documento quanto costa e
  in quanto tempo arriva, leggendolo da Openapi.

## Dove sta il codice

| Cosa | File |
|---|---|
| Pagina | `sito/src/pages/riservata/report-persona.astro` |
| Logica (accesso, Openapi, archivio, CRM) | `sito/api/_report/report.py` |
| Funzione della pagina | `sito/api/report/persona.py` |
| Avviso di Openapi e manutenzione giornaliera | `sito/api/report/avviso.py` (cron in `sito/vercel.json`, ogni giorno alle 04:17 UTC) |
| Prove | `sito/api/_report/test_report.py` (Openapi e GHL finti) |

Le funzioni girano nel progetto Vercel `praticheflaiano-sito`, come quelle della stima pensione
(vedi [[procedure/06-stima-pensione]]); la pagina sul sito pubblico le chiama all'altro indirizzo.

## Variabili d'ambiente (progetto `praticheflaiano-sito`)

| Variabile | A cosa serve |
|---|---|
| `REPORT_PERSONA_PASSWORD` | Password della pagina. Senza, la pagina resta chiusa (503). |
| `OPENAPI_TOKEN` | Token Openapi con i permessi Risk (`IT-report-persona`, `IT-report-persona-top`, `IT-patrimoniale-persona`, `IT-patrimoniale-persona-top`, `IT-eredi-senza-accettazione`, `IT-eredi-con-accettazione`), Catasto, DocuEngine (`documents`, `requests`) e VisEngine (`visure`, `richiesta`, `documento`). Un servizio senza permesso non blocca gli altri: il suo errore compare sopra il catalogo. Senza, il catalogo non si legge e le richieste non partono. Vale anche il vecchio nome `OPENAPI_RISK_TOKEN`. |
| `OPENAPI_PROVA` | Facoltativa. `1` = ambienti di prova di Openapi (`test.risk…`, `test.docuengine…`), `0` = veri. **Senza la variabile l'ambiente si riconosce dal token**: se il catalogo risponde 401 in produzione e 200 in prova, la pagina passa alla prova, lo scrive in `report/ambiente.json` e mostra l'avviso "Ambiente di PROVA". Cambiando token si riparte dalla produzione. |
| `GHL_API_TOKEN` | Già presente (stima pensione). |
| `REPORT_PERSONA_URL` | Facoltativa: indirizzo pubblico delle funzioni per l'avviso di Openapi. In produzione si ricava da solo. |
| `BLOB_READ_WRITE_TOKEN` | Già presente: archivio Vercel Blob. |

I valori non vanno mai scritti nel repository né in questa nota.

## Come funziona

1. **Accesso**: password, poi sessione firmata di 12 ore tenuta nella scheda del browser. Dopo 5 password
   sbagliate la pagina resta bloccata 15 minuti (contatore nell'archivio, vale per tutti).
2. **Catalogo**: ricerca per parola, filtro per categoria, filtro "solo quelli che arrivano subito". Ogni voce
   mostra prezzo e tempi. I documenti che richiedono allegati (campi di tipo `file`) hanno l'etichetta
   "Con allegati" e si chiedono da qui caricando i file nel modulo.
3. **Richiesta**: modulo generato dai campi della voce (codice fiscale o partita IVA controllati, scelte a
   tendina, opzioni a pagamento con totale aggiornato), cliente facoltativo da collegare nel CRM, finalità,
   conferma di avere titolo. La richiesta viene salvata in archivio **prima** di chiamare Openapi. Stessa
   richiesta nelle ultime 24 ore: la pagina chiede conferma prima di pagare di nuovo.
4. **Stati DocuEngine**: `WAIT` in lavorazione; `results` senza `resultId` = la ricerca ha trovato più
   risultati e va scelto quello giusto (`PATCH /requests/{id}` con `resultId`); `DONE` pronto (file da
   `GET /requests/{id}/documents`, indirizzi firmati a tempo); `CANCELLED` annullata.
5. **Attesa**: i file si copiano in archivio quando arriva l'avviso di Openapi (callback, solo in produzione),
   a ogni "Aggiorna" della pagina (da sola ogni 8 secondi nei primi 3 minuti, poi ogni minuto) e una volta
   al giorno con il cron.
6. **Archivio** (Vercel Blob privato): `report/richieste/<codice>.json`, `report/file/<codice>/<n>.bin`,
   `report/catalogo.json`, `report/accesso/tentativi.json`.
7. **CRM** (solo se la richiesta riguarda una persona: Report Persona, oppure cliente indicato nel modulo):
   - un contatto con quel codice fiscale → è lui;
   - un solo contatto con quel nome e cognome e senza codice fiscale → è lui, e il codice fiscale viene aggiunto;
   - omonimi, oppure contatto con un codice fiscale diverso → la pagina mostra i candidati e sceglie Antonio
     (nessuna scrittura automatica; un codice fiscale diverso non viene mai sovrascritto);
   - nessuno → la pagina chiede se creare il contatto.
   I file vanno nel campo **"Documenti Openapi"** del contatto (creato da solo se manca), più una nota con
   documento, data e finalità. Il campo del codice fiscale viene riconosciuto dal nome ("Codice Fiscale", "CF");
   se non esiste viene creato "Codice Fiscale".

## Catasto e Conservatoria (API Catasto)

L'API Catasto di Openapi (`catasto.openapi.it`, prova `test.catasto.openapi.it`) **non** fa parte del catalogo DocuEngine,
quindi le sue voci sono fisse nel codice (`VOCI_CATASTO` in `report.py`), ognuna richiedibile da sola:

| Voce | Chiamata | Prezzo (12/11/2026, + IVA) |
|---|---|---|
| Ricerca nazionale immobili | `POST /richiesta/ricerca_nazionale/` | 0,30 € |
| Elenco immobili di una persona in una provincia | `POST /richiesta/ricerca_persona/` | 0,30 € |
| Visura catastale per soggetto / per immobile | `POST /visura_catastale` (`entita`) | 1,90 € |
| Ispezione ipotecaria nazionale | `POST /ipotecarie-ispezione_nazionale` | 23,70 € |
| Ispezione ipotecaria per soggetto / per immobile | `POST /ipotecarie-elenco-note` (`entita`) | 10,90 € |
| Dettaglio di una nota | `POST /ipotecarie-dettaglio-nota` | 6,90 € |
| Elaborato planimetrico, Estratto di mappa | `POST /elaborato_planimetrico`, `/estratto_mappa` | 6,90 € |

- **I prezzi di queste voci sono scritti nel codice**, presi dal listino pubblico: l'API non li espone. Se Openapi cambia
  listino vanno aggiornati a mano (console.openapi.com/it/apis/catasto/pricing).
- Stati: `in_erogazione`, `in_lavorazione`, `evasa`. Il documento ufficiale (PDF) si scarica da `<percorso>/{id}/documento`
  (422 = non ancora disponibile). Le ricerche restituiscono solo dati: la pagina ne fa un PDF leggibile ("esito") e
  conserva anche il JSON. Una richiesta evasa senza documento né dati ("non risulta nulla") diventa un PDF con l'esito.
- Il token deve avere anche gli scope dell'API Catasto.
- L'Anagrafica Persona (Risk, `IT-anagrafica`) non è stata aggiunta: il 12/11/2026 la pagina prodotto la dava come
  non disponibile, in attesa di una nuova versione.

## Successione

Spunta "Documenti per una successione" nel catalogo: restano le voci del Catasto e quelle del catalogo DocuEngine il cui
nome richiama una successione (`SUCCESSIONE` in `report.py`: stato di famiglia, residenza, matrimonio, morte, PRA,
planimetria…). Codice fiscale del defunto e provincia si scrivono una volta e vengono riportati in ogni modulo; la finalità
è già "Successione". Ogni documento si chiede e si paga da solo.

## Prova del giro senza Openapi

In cima al catalogo c'è **"Documento di prova (gratis)"**: non chiama Openapi, crea un PDF di una pagina e gli fa
fare il giro vero (archivio, download, ricerca del contatto e allegato nel CRM se si indica un cliente). È il modo
per verificare la pagina quando si lavora con il token di prova, perché la sandbox di Openapi può accettare la
richiesta e non consegnare mai un file.

## Spiegazioni e diagnosi

- Ogni voce del catalogo mostra una spiegazione in parole semplici. Se Openapi fornisce un testo (`requestStructure.help`)
  si usa quello; altrimenti la frase è scelta dal nome del documento (`SPIEGAZIONI` in `report.py`).
- Ogni richiesta in lavorazione mostra lo stato letto da Openapi e l'ora dell'ultimo controllo.
- Ogni chiamata a Openapi lascia una riga nei log di Vercel (`report: openapi <servizio> <metodo> <percorso> -> <codice>`),
  senza identificativi né dati della richiesta. Il piano Hobby conserva i log per un'ora.
- **Registro diagnostico** (dal 12/11/2026, PR #23 unita e in produzione alle 22:45): le stesse chiamate restano anche in
  `report/diagnostica.json` (ultime 150 righe) e si leggono nella pagina, sezione "Diagnostica" in fondo.
  Per ogni chiamata: servizio, metodo, percorso (identificativi con cifre oscurati come `<id>`), codice, sintesi
  (stato e messaggio di Openapi, codici fiscali e partite IVA oscurati), millisecondi, ambiente. Le letture riuscite
  del catalogo non si annotano; le ripetizioni uguali consecutive diventano una riga con `volte`. Si salva alla fine
  di ogni chiamata della pagina e dell'avviso (`salva_registro()` nel `finally`).

## Riletto sulla documentazione Openapi (12/11/2026, sera)

- **Callback**: l'oggetto `headers` è di fatto obbligatorio. Senza, Risk risponde 428 ("object headers not set in
  'callback', required") e DocuEngine 428 con errore 311. Successo davvero su una richiesta di Report Persona.
  Il callback si costruisce in un punto solo (`_callback`).
- **DocuEngine, stati**: una POST senza `state` viene lavorata subito (di solito `WAIT`). Con `state: NEW` la
  richiesta resta aperta e parte solo con una PATCH `{"state": "SEARCH"}`: se Openapi la restituisce in `NEW`, il
  codice la avvia (`_avvia_docuengine`).
- **DocuEngine, risultati da scegliere**: ogni risultato ha `id` e i valori dentro `data`; la scelta è una PATCH
  `{"resultId": "..."}`. Errore 213 = la ricerca non ha risultati da scegliere.
- **DocuEngine, documenti**: `GET /requests/{id}/documents` restituisce `fileName`, `mimeType`, `fileSize`, `md5`,
  `urlExpire`, `downloadUrl`; 422 con errore 225 = non ancora disponibili.
- **Altri errori utili**: 402 (610) credito insufficiente; 417 (208/316) documento temporaneamente non disponibile;
  400 (202) documento inesistente.
- **Campi di tipo `file`** (documento d'identità, delega): la documentazione dice che il valore è una stringa, in
  base64 oppure un indirizzo, senza precisare il formato. La pagina fa scegliere il file (PDF, JPG, PNG; 2,8 MB in tutto
  per richiesta, limite delle funzioni Vercel), lo controlla e lo manda a Openapi come **base64 semplice**, senza prefisso.
  Il contenuto non viene salvato in archivio: nella richiesta resta solo un'impronta (`senza_allegati`). Da verificare
  alla prima richiesta vera: se Openapi rifiuta il formato, la variante da provare è il data URI (`data:application/pdf;base64,…`).
- **Risk**: nella risposta l'`id` e lo stato possono stare dentro `callback`; lo stato finale è indicato come `evaso`.
  Il codice non si fida del nome dello stato e prova direttamente il download (406 = non pronto).

## Altri report Risk e VisEngine (12/11/2026, notte)

- **Risk**: oltre al Report Persona ci sono Report Persona Top (18 €), Patrimoniale Persona (36 €), Patrimoniale
  Top (48 €), Eredi senza accettazione (24 €) ed Eredi con accettazione (48 €), prezzi del listino pubblico IVA esclusa.
  Stesso schema: nome, cognome, codice fiscale, callback con `headers`, PDF da `/<prodotto>/{id}/download` (406 = non
  pronto). Il percorso del prodotto è salvato nella richiesta (`risk_percorso`). Per i report **Eredi** la persona
  cercata è il defunto (`crm_da_ricerca: False`): nel CRM il documento va al cliente indicato a parte.
- **VisEngine** (`visengine2.altravia.com`, prova `test.visengine2.altravia.com`): catalogo letto da `GET /visure` più
  il dettaglio di ogni voce (`GET /visure/{hash}`, 8 in parallelo, massimo 120), copia in `report/catalogo-visengine.json`
  per 6 ore. Escluse le categorie Patronato/CAF (pratiche che l'ufficio fa da sé). Richiesta `POST /richiesta`
  {hash_visura, json_visura, state 1, opzioni `opzione_N`, callback_data}; risultati da scegliere in `ricerche[].json_risultato`
  (chiavi `indice_N`), scelta con `PUT /richiesta/{id}/ricerche` {id_ricerca, indice}; documento in base64 da
  `GET /documento/{id}` (422 = non pronto). Gli allegati vanno nel formato `nome|data:<tipo>;base64,<contenuto>`.
- Catasto: Elaborato planimetrico ed Estratto di mappa arrivano "in pochi secondi" (listino), non entro 24 ore.

## Elenchi a discesa con ricerca (12/11/2026, notte)

- I campi con valori vincolati non si scrivono a mano: elenco che si restringe mentre si scrive (frecce, Invio, Tab,
  clic). Vale solo una voce dell'elenco; un testo che non corrisponde resta rosso e la richiesta non parte.
- **Catasto**: provincia, comune e sezione vengono da `GET /territorio` (province) e `GET /territorio/{sigla}` (comuni con
  sezioni e codice catastale), con `tipo_catasto` F o T ("fabbricati e terreni" usa F). Costano 0,001 € a chiamata:
  restano in archivio 30 giorni (`report/territorio/<prova|vero>-<F|T>[-<sigla>].json`). Il comune si accende dopo la
  provincia, la sezione dopo il comune (spenta se il comune non ha sezioni). L'ispezione per immobile non chiede la
  provincia: la pagina mostra una provincia "di aiuto" che serve solo a trovare il comune e non viene spedita.
- Il server ricontrolla prima di spendere (`_verifica_territorio` in `prepara`): provincia, comune e sezione devono stare
  negli elenchi; il comune viene riscritto nella forma del Catasto. Se gli elenchi non si leggono il controllo si salta
  e la pagina passa al campo libero con un avviso.
- Le scelte dei documenti DocuEngine/VisEngine con più di 6 voci usano lo stesso elenco; fino a 6 resta il menu a tendina.
- Modalità successione: anche la provincia del defunto si sceglie dall'elenco e passa già scelta nei moduli del Catasto.
- Restano a testo libero, perché Openapi non dà un elenco: la Conservatoria (es. ROMA 1) e i campi di DocuEngine/VisEngine
  senza scelte.

## Limiti noti

- Un PDF oltre circa 3,2 MB non si scarica dalla pagina (limite di risposta delle funzioni): si apre dal CRM.
- Se Openapi non risponde alla richiesta, l'esito è **incerto** (potrebbe essere stata addebitata): la pagina
  lo scrive e invita a controllare su console.openapi.com prima di ripetere.
- Stati di Openapi: la documentazione cita `processing`, `completed`, `evaso`. Il codice non si fida del
  nome dello stato: prova direttamente il download.

## Stato (12/11/2026, sera)

- Pubblicata in produzione su richiesta di Antonio (pagina privata), con token Openapi **di prova**: si passerà al
  token vero quando ci sarà credito, sostituendo solo il valore di `OPENAPI_TOKEN` (più Redeploy).
- I deploy di produzione di `praticheflaiano-sito` non partono dal ramo: vanno creati (vedi [[procedure/06-stima-pensione]]).

## Non ancora verificato contro i servizi veri (12/11/2026)

- Chiamate reali a Openapi Risk (forma della risposta, dove sta l'`id`, avviso di callback).
- Chiamate reali a DocuEngine: forma del catalogo, lingua dei nomi, forma dei `results` da scegliere (il codice
  mostra i valori di testo di ogni risultato), documenti immediati (se arrivano già `DONE` nella risposta), tempi
  reali dei documenti in differita (il catalogo dice solo immediato o no).
- Campi di tipo `file`: per VisEngine il formato è documentato; per DocuEngine si manda il base64 semplice (non documentato, da verificare).
- Chiamate reali a VisEngine e agli altri report Risk: mai provate (il token di prova deve includere anche questi servizi).
- Chiamate reali a GHL: ricerca contatti (`POST /contacts/search`), creazione dei campi, caricamento del
  file (`POST /forms/upload-custom-files`), comportamento con più file nello stesso campo.
- Da chiarire fuori dal codice: condizioni d'uso Openapi e inquadramento privacy (finalità, consenso)
  per l'uso in ufficio.
