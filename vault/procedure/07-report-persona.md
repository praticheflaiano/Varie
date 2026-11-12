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
| `OPENAPI_TOKEN` | Token Openapi con i permessi Risk (`IT-report-persona`) e DocuEngine (`documents`, `requests`). Senza, il catalogo non si legge e le richieste non partono. Vale anche il vecchio nome `OPENAPI_RISK_TOKEN`. |
| `OPENAPI_PROVA` | Facoltativa. `1` = ambienti di prova di Openapi (`test.risk…`, `test.docuengine…`), `0` = veri. **Senza la variabile l'ambiente si riconosce dal token**: se il catalogo risponde 401 in produzione e 200 in prova, la pagina passa alla prova, lo scrive in `report/ambiente.json` e mostra l'avviso "Ambiente di PROVA". Cambiando token si riparte dalla produzione. |
| `GHL_API_TOKEN` | Già presente (stima pensione). |
| `REPORT_PERSONA_URL` | Facoltativa: indirizzo pubblico delle funzioni per l'avviso di Openapi. In produzione si ricava da solo. |
| `BLOB_READ_WRITE_TOKEN` | Già presente: archivio Vercel Blob. |

I valori non vanno mai scritti nel repository né in questa nota.

## Come funziona

1. **Accesso**: password, poi sessione firmata di 12 ore tenuta nella scheda del browser. Dopo 5 password
   sbagliate la pagina resta bloccata 15 minuti (contatore nell'archivio, vale per tutti).
2. **Catalogo**: ricerca per parola, filtro per categoria, filtro "solo quelli che arrivano subito". Ogni voce
   mostra prezzo e tempi. I documenti che richiedono allegati (campi di tipo `file`: documento d'identità,
   delega) sono mostrati ma non richiedibili da qui.
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
- Come si passano i campi di tipo `file`: non documentato, per questo quei documenti non si chiedono da qui.
- Chiamate reali a GHL: ricerca contatti (`POST /contacts/search`), creazione dei campi, caricamento del
  file (`POST /forms/upload-custom-files`), comportamento con più file nello stesso campo.
- Da chiarire fuori dal codice: condizioni d'uso Openapi e inquadramento privacy (finalità, consenso)
  per l'uso in ufficio.
