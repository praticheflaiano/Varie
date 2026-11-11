---
title: "Procedura: servizio Stima e Calcolo della pensione"
type: procedura
tags: [pensioni, servizio-a-pagamento, ghl, stima-pensione]
created: 2026-11-11
---

# Stima e Calcolo della pensione (`/stima-pensione`)

Servizio online a pagamento: 60 €, più 5 € se l'estratto contributivo lo richiediamo noi.
Il cliente compila questionario e carica i documenti **prima** del pagamento.

## Stato (2026-11-11): flusso completo sulle anteprime, servizio NON attivo in produzione

Fatto:
- `sito/src/pages/stima-pensione.astro`: pagina del servizio.
- `sito/src/components/pensione/StimaPensioneForm.svelte`: questionario in 7 passi
  (estratto, dati, lavoro, contributi, salute e famiglia, altri documenti, riepilogo con consensi).
- Opzione "richiedetelo voi" per l'estratto: incorpora lo stesso sondaggio GHL di
  `/certificazioni` (`P3FbJB9wj14iplGZxaFF`) e lo stesso mandato.
- `sito/api/_pensione/`: motore deterministico della skill `conteggi-pensionistici`
  (parametri 2026-11-09) con test di regressione. Non è ancora collegato a nulla.

Finché `PUBLIC_STIMA_PENSIONE_API` è vuota la pagina è `noindex`, fuori da sitemap e
ricerca interna, e l'ultimo passo non invia nulla.

## Lettura diretta dell'estratto (dal 2026-11-11): la fonte principale

L'estratto scaricato dal sito INPS è un PDF **con testo vero** (generato con iText, pagina ruotata di 90°):
ogni cella della tabella è un frammento di testo con la sua posizione. Non serve OCR né un modello: le righe
e le colonne si ricompongono con codice deterministico, e nessuna riga va persa.

Com'è fatto l'estratto ("Estratto Conto Previdenziale"), verificato su due estratti reali:

- **Intestazione**: titolo, sezione (es. `Regime generale`), `Emesso il gg/mm/aaaa`; a destra nome, `nato a`, `il`, `Codice fiscale`, `residente in` (due righe).
- **Tabella**, con intestazione ripetuta a ogni pagina: `Dal | Al | Tipo di contribuzione | unità | utili al diritto | utili al calcolo | Retribuzione o reddito (Euro) | Azienda | Note`.
  - L'**unità cambia da riga a riga**: `sett.` per dipendenti e figurativi, `mesi` per i titolari d'impresa (12 mesi = 52 settimane).
  - Il **tipo** dice la gestione: `Titolare di impresa COM.` = commercianti, `ART.` = artigiani (aliquota 24%, non 33%), `Lavoro dipendente`, `Lav.dipend. part-time`.
  - **Diritto e calcolo possono differire** (part-time: 51 al diritto, 46,000 al calcolo).
  - Righe **sovrapposte** nello stesso anno (lavoro + cassa integrazione, due gestioni) e righe a **0 contributi con importo** (`Cassa integrazione (Int)`, `Contr.solidar. ad integr`): si tengono tutte.
  - Non tutte le righe hanno importo, azienda o nota.
- **Note**: codice breve a fine riga (`O`, `0`, `5`, `c`…) spiegato nella legenda `Note:` sotto la tabella. Attenzione: `O` lettera e `0` zero sono codici diversi.
- **Segnalazioni personalizzate e/o pratiche in corso**: es. posizione attiva presso un altro ente (Enasarco).
- **Piè di pagina**: `Estratto conto di …`, `Pagina n di m`.

Dove sta il codice (le due versioni hanno le stesse regole: se ne cambi una, cambia l'altra):

| Dove | File | Quando |
|---|---|---|
| Browser | `sito/api/_lib/estrattoModel.ts` (`leggiEstrattoDaCelle`), `sito/src/utils/estrattoInps.ts` (`leggiPdf`, pdf.js) | Primo passo del questionario: il file **non lascia il dispositivo** |
| Server | `sito/api/_pensione/estratto_inps.py` (`leggi_pdf`, pypdf) | Dopo il pagamento, in `elabora.py` |

Ordine di lettura nel questionario: **diretta** → se il PDF non ha testo o una riga non torna (`completa` falso), **Mistral OCR** sul server → riserva per righe di testo.
Dopo il pagamento: le righe sono quelle della lettura diretta; **Fable rilegge comunque il documento come controllo indipendente** (e trascrive simulazione e busta paga). Se le due letture differiscono lo si scrive nei controlli e il calcolo usa la lettura diretta; se Fable non risponde si prosegue con la sola lettura diretta. Per le scansioni vale la sola trascrizione di Fable.

Cosa arriva al calcolo in più rispetto a prima: gestione per riga (e aliquota giusta), settimane utili al calcolo, note con il testo della legenda, segnalazioni INPS (mandano la stima in verifica all'operatore), aliquota dei contributi futuri presa dalla gestione più recente quando è diversa dalla prevalente.

Prove: `python3 sito/api/_pensione/test_estratto.py` (estratto finto con la stessa impaginazione, nessun dato reale).
Gli estratti veri dei clienti **non vanno messi nel repository**.

Limiti noti: sezioni diverse dal Regime generale (Gestione separata, dipendenti pubblici) non sono state viste su estratti reali: se una riga non si legge per intero si passa alla lettura con AI. Coltivatori diretti e altre gestioni non mappate restano segnalate come "gestione non riconosciuta".

## Stima "in verifica" = prospetto provvisorio già consegnato (dal 2026-11-11)

Quando i controlli chiedono una verifica (`revisione_consigliata` non vuota → stato `da_rivedere`) il cliente **scarica comunque il prospetto**, indicato come provvisorio (riquadro rosa in prima pagina e sulla pagina della pratica), e viene invitato a prenotare l'appuntamento telefonico o a scrivere in chat. L'operatore riceve nota e compito sul CRM, completa la stima con il cliente e la conferma dalla pagina dell'ufficio ("Verificato: conferma la stima" → `consegnata`, email di conferma).

## Impaginazione del prospetto e della pagina della pratica (dal 2026-11-11)

- `prospetto_pdf.py`: testo a 11 punti, numero di pagine libero (di solito 3). Prima era forzato in due pagine rimpicciolendo il carattere fino all'82%: non rifarlo. Struttura: apertura con prima uscita e tre cifre chiave, "In breve", strada consigliata, una scheda per strada, alternative, cosa decidere, consulenza inclusa, QR, note in fondo (limiti, avvertenze, note tecniche, senza tagli).
- `pratica.astro`: quando la stima è consegnata o provvisoria la pagina la mostra anche a schermo (`riepilogo_stima` in `pratiche.py`), con le stesse sezioni.

## Consulenza con l'operatore inclusa (dal 2026-11-11)

Nei 60 € è compresa una consulenza facoltativa con un operatore, al telefono o in chat. Lo dicono la pagina del servizio, il banner in home, la pagina della pratica (pulsante "Prenota la consulenza inclusa") e l'email di consegna del prospetto (`CONSULENZA` in `crm.py`; link in `STIMA_LINK_CONSULENZA`, predefinito il calendario generale delle prenotazioni).
Se l'estratto lo richiediamo noi: le richieste si lavorano la mattina, 9:30-13:00, nei giorni di apertura; chi chiede di pomeriggio o di sera riceve la stima dal giorno lavorativo successivo (scritto in pagina, nel questionario, nella pagina della pratica e nell'email dopo il pagamento).

## Prelettura con Mistral (solo scansioni e PDF con impaginazione diversa)

Dopo la spunta di consenso il cliente carica il PDF. Il browser lo invia a
`sito/api/stima/leggi-estratto.ts`, che via **OpenRouter** lo fa leggere a **Mistral OCR**
(plugin `file-parser`, motore `mistral-ocr`) e fa strutturare le righe a un modello Mistral
di chat (`mistralai/mistral-small-2603`, schema JSON rigido, sola trascrizione).
Conversioni e somme sono fatte da codice (`sito/api/_lib/estrattoModel.ts`). Se la funzione
non risponde, il browser ripiega sulla lettura locale (`sito/src/utils/estrattoInps.ts`) con
l'avviso "Lettura semplificata": su un estratto reale ha letto solo 32 settimane, quindi è
solo una riserva. Protezioni: origine, 8 letture/ora per IP (in memoria), niente log.

## Stima dopo il pagamento (Fable 5.2 + motore)

`sito/api/stima/elabora.py` (Python, stessa cartella del motore):
1. **Claude Fable 5.2** (API Anthropic, `claude-fable-5-2`) rilegge per intero il PDF e ne
   trascrive le righe con uno strumento a schema fisso.
2. Codice deterministico converte le righe (12 mesi = 360 giorni = 52 settimane), riconosce
   la gestione e costruisce l'input del motore dalle risposte del questionario.
3. Il motore calcola lo scenario base e una variante (smettere ora / continuare a lavorare).
4. Fable 5.2 scrive sintesi, uscita consigliata, decisioni e dati mancanti usando solo i
   numeri del motore.
Restituisce anche i token usati e il costo stimato (listino 8 $/40 $ per milione).
In produzione risponde solo con l'intestazione `x-stima-token` = `STIMA_PENSIONE_TOKEN`;
sulle anteprime è richiamabile dalla modalità prova. `vercel.json` le dà 300 s.

Non ancora coperti: quota retributiva dalla simulazione INPS, scenari riscatto/volontari/
cumulo/opzione contributivo, residenza diversa da Roma per il netto, prospetto PDF via email.

**Stato verifiche (2026-11-11)**: entrambe le funzioni sono state provate solo contro
fornitori finti (OpenRouter e Anthropic simulati in locale). Con le chiavi vere vanno
verificati: nome del modello Mistral, qualità della lettura su estratti reali, tempi e costi.

## Precisione della stima (2026-11-11)

`elabora.py` ora: legge anche simulazione INPS e busta paga/CU (confronto con soglia 10%,
retribuzione dalla CU, quota retributiva solo se scritta nel documento); fa scegliere a Fable
fino a 3 varianti tra quelle ammesse (`applica_variante`) e le fa calcolare al motore;
confronta la prelettura Mistral con la rilettura Fable; dichiara i limiti del calcolo
(`casi_non_coperti`) e i parametri non definitivi (`SCADENZE_PARAMETRI`, da tenere allineata
alla tabella di validità della skill); restituisce `revisione_consigliata`.
Il questionario chiede residenza e motivo degli anni senza contributi.

## Prospetto PDF, QR e archivio

- `sito/api/_pensione/prospetto_pdf.py`: PDF di due pagine (reportlab), con QR di recupero.
- `sito/api/_pensione/archivio.py`: Vercel Blob, store **privato** (creare in regione `fra1`
  e collegarlo al progetto); nei test cartella locale `STIMA_ARCHIVIO_DIR`.
- `sito/api/stima/prospetto.py` + pagina `/stima-pensione/recupera`: scarico con codice
  (nell'ancora dell'URL) e data di nascita; risposta uniforme sugli errori, limite tentativi.
- Salvati: `stime/<codice>/prospetto.pdf` e `pratica.json` (stima + risposte). L'estratto
  caricato NON viene salvato. Manca ancora la cancellazione automatica a scadenza (Blob non
  ha TTL: servirà un job periodico).

## Modalità prova (solo anteprime)

Su `localhost` e sulle anteprime Vercel dei rami (host `*-git-*.vercel.app`), se
`PUBLIC_STIMA_PENSIONE_API` è vuota, il questionario attiva una modalità prova: pagamento
simulato, conferma dei contributi letti e poi **stima vera** tramite `api/stima/elabora`.
Se la stima vera non è disponibile (chiave mancante o errore) mostra il prospetto di esempio
con la spiegazione. Non compare mai su praticheflaiano.it.

## Flusso vero: pratica, pagamento GHL, calcolo (2026-11-11)

Decisioni di Antonio: i **coupon li gestisce GHL** (100% per le prove, 50% associati), il sito non
ne sa nulla; l'archivio Blob (privato, Europa) **non ha cancellazione automatica**: i dati restano
finché c'è spazio.

1. **Invio** (`sito/api/stima/invia.py`): il questionario manda risposte e documenti in JSON
   (base64, totale entro ~3 MB). `_pensione/pratiche.py` crea la pratica (`stime/<codice>/pratica.json`,
   `estratto.pdf`, `simulazione.bin`, `busta.bin`), stato `ricevuta`, e risponde con `next` =
   link di pagamento GHL del prezzo pieno (60 o 65 €). Il browser ricorda codice e data di nascita
   (`localStorage`, chiave `stima-pratica`).
2. **Pagamento** sul checkout GHL (coupon compresi). Un workflow GHL chiama
   `POST /api/stima/pagamento` con intestazione `x-stima-token`, email e telefono del contatto: la pratica
   in attesa più recente con quella email (o, in mancanza, quel telefono) passa a `pagata` (o `attesa_estratto`). Ripetibile.
   L'email al checkout deve essere **la stessa** del questionario.
3. **Pagina della pratica** (`/stima-pensione/pratica`, funzione `api/stima/pratica.py`): mostra lo
   stato; da `pagata` il cliente conferma e parte il calcolo (`avvia`, fino a 300 s, una sola
   esecuzione per volta grazie al file `blocco.json`). Il link di ritorno del checkout GHL deve
   puntare a questa pagina.
4. **Esito**: `consegnata` (PDF scaricabile) oppure `da_rivedere` se `revisione_consigliata` non è
   vuota: il PDF resta trattenuto finché l'ufficio non lo rilascia. `fallita`: due tentativi.

**Chi paga può non essere chi compila** (e GHL può unire l'ordine a un contatto esistente con
altri dati). L'avviso di pagamento si abbina così (`pratiche.paga_da_contatto`): 1) pratica in
attesa con la stessa email, poi con lo stesso telefono; 2) altrimenti, se nelle ultime 3 ore c'è
una sola pratica in attesa, è la sua; 3) altrimenti il pagamento resta "aperto"
(`pagamenti/aperti/`) e la pagina della pratica chiede l'email o il cellulare usati per pagare
(azione `reclama`). Un avviso ripetuto non paga una seconda pratica.

Attesa: `sito/src/components/pensione/Attesa.svelte` (foglio animato, passi a tempo, tempo
trascorso) per lettura dell'estratto, invio e calcolo; sulla pagina della pratica si accende con
l'evento `stima-attesa`. Al ritorno dal pagamento (segnato dal questionario in `localStorage`) la
pagina mostra per al massimo 3 minuti la verifica animata (`stima-attesa-pagamento`) rileggendo
lo stato ogni 5 secondi: la conferma di GHL arriva dopo circa 30 secondi. Durante il calcolo il
browser chiede conferma prima di chiudere la pagina. La pagina mostra sempre il link della pratica
da salvare: riaprendolo con la data di nascita si riparte dallo stato salvato sul server.

**CRM GoHighLevel** (`_pensione/crm.py`, attivo solo con `GHL_API_TOKEN`): a ogni passaggio la
pratica aggiorna contatto, opportunità nella pipeline "Calcolo Pensione" (id `KbPBLg1iBHuKF1XNlnLp`),
note e compiti, e manda al cliente l'email con il link della pratica. Fasi: ricevuta -> "Ricevuta
Richiesta"; pagata e in calcolo -> "Inizio Elaborazione"; estratto da richiedere -> "In attesa
certificazioni da istituto"; da rivedere e fallita -> "Da verificare in ufficio" (con compito);
consegnata -> "calcolo effettuato" (vinta). Nel CRM non vanno documenti né risposte su salute e
familiari. Se il CRM non risponde la pratica prosegue.

**Pagina dell'ufficio** `/stima-pensione/ufficio#c=<codice>` (link nelle note del CRM): con il
segreto dell'ufficio (`STIMA_PENSIONE_TOKEN`) mostra stato, motivi della verifica, controlli,
risposte complete; permette di scaricare il prospetto, consegnarlo al cliente, caricare l'estratto,
rimettere in coda o avviare il calcolo, segnare pagata.

Stati: `ricevuta`, `attesa_estratto`, `pagata`, `in_elaborazione`, `consegnata`, `da_rivedere`, `fallita`.

Variabili: `STIMA_LINK_PAGAMENTO` (JSON `{"6000": "https://...", "6500": "https://..."}`),
`STIMA_PENSIONE_TOKEN`, `STIMA_PENSIONE_ATTIVA=1` (solo così le funzioni accettano pratiche in
produzione), `PUBLIC_STIMA_PENSIONE_API=/api/stima/invia` (accende il modulo e toglie il noindex).
`GET /api/stima/invia` dice che cosa è configurato.

Sulle anteprime il flusso vero è sempre attivo; se manca il link di pagamento la pagina della
pratica offre "Simula il pagamento". Resta anche la "Prova rapida senza salvare".

Le funzioni girano a Francoforte (`"regions": ["fra1"]` in `vercel.json`): prima erano negli
Stati Uniti (`iad1`), con l'archivio in Europa.

Prova senza servizi esterni: `python3 sito/api/_pensione/test_pratiche.py`.

Non verificato: avviso di pagamento da un workflow GHL vero (forma del corpo, ordine a zero euro
con coupon 100%), calcolo dalla pratica con Fable vero (provato solo con calcolo finto).

Limiti noti: il verbale di invalidità caricato non viene inviato né salvato (non è usato dal
calcolo); se il cliente chiude la pagina prima di confermare, il calcolo parte quando la riapre;
nessun avviso automatico all'ufficio per `da_rivedere`, `fallita`, `attesa_estratto` (serve GHL).

## In produzione (dall'11/11/2026): due progetti Vercel

- **praticheflaiano.it** è servito dal progetto `info-praticheflaiano` (`prj_9WOxx9htTscB8WRb1huS4yaqazWZ`):
  statico, senza funzioni server, costruito da `build.sh` dal ramo `nuova-grafica-info`. Contiene i
  reindirizzamenti dei vecchi indirizzi nel suo `vercel.json` (non in questo repository): non
  sostituirlo, si aggiorna con **Redeploy** dell'ultimo deploy di produzione.
- Le **funzioni della stima** girano nel progetto `praticheflaiano-sito` (produzione:
  `https://praticheflaiano-sito.vercel.app`), che ha chiavi, archivio Blob e variabili. Il deploy
  di produzione di questo progetto NON parte da solo dal ramo: va creato con `target: production`
  dallo SHA del ramo `nuova-grafica-info`.
- Le pagine pubbliche chiamano le funzioni all'altro indirizzo: nel progetto `info-praticheflaiano`
  `PUBLIC_STIMA_PENSIONE_API=https://praticheflaiano-sito.vercel.app/api/stima/invia` (le altre
  funzioni si ricavano da qui); `sito/vercel.json` dà alle funzioni le intestazioni CORS per
  `https://praticheflaiano.it` e ogni funzione risponde a OPTIONS.
- Il webhook GHL del pagamento punta a `https://praticheflaiano-sito.vercel.app/api/stima/pagamento`;
  i link di pagamento riportano a `https://praticheflaiano.it/stima-pensione/pratica`.

## Da fare per attivarlo

1. In GHL: link di pagamento dei due prodotti, ritorno su `/stima-pensione/pratica`, workflow con
   webhook verso `/api/stima/pagamento`. Poi le variabili qui sopra su Vercel.
2. Avvisi all'ufficio e al cliente (email, WhatsApp) e pipeline "Stima pensione" in GHL.
3. Informativa privacy dedicata (dati sulla salute), condizioni di vendita, verifica con
   ENASC/UNSIC su chi può vendere il servizio.

## Attenzioni

- Il motore calcola il netto con addizionali Lazio e Roma: per clienti di altre regioni va dichiarato.
- Aggiornare `PARAMS` solo insieme alla skill e rieseguire `python3 sito/api/_pensione/test_regressione.py`.
- Non cambiare l'id del sondaggio GHL: è quello operativo di `/certificazioni`.
