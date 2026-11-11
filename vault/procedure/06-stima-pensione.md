---
title: "Procedura: servizio Stima e Calcolo della pensione"
type: procedura
tags: [pensioni, servizio-a-pagamento, ghl, stima-pensione]
created: 2026-11-11
---

# Stima e Calcolo della pensione (`/stima-pensione`)

Servizio online a pagamento: 60 €, più 5 € se l'estratto contributivo lo richiediamo noi.
Il cliente compila questionario e carica i documenti **prima** del pagamento.

## Stato (2026-11-11): solo interfaccia, servizio NON attivo

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

## Lettura automatica dell'estratto (primo passo)

Il primo passo del questionario è il caricamento dell'estratto contributivo (o la scelta
"richiedetelo voi"). `sito/src/utils/estrattoInps.ts` legge il PDF **nel browser** con
`pdfjs-dist` (il file non viene inviato) e ricava: intestatario, codice fiscale, data di
nascita e sesso (dal codice fiscale), data dell'estratto, periodi, settimane e retribuzioni
per anno, situazione lavorativa e ultima retribuzione. I campi vuoti del questionario
vengono precompilati; il cliente vede tutto e può correggere.

**Limite noto**: le regole di lettura sono euristiche sul formato tipico dell'estratto e
sono state provate solo su un PDF di esempio costruito a mano, non su estratti INPS reali.
Vanno verificate su file veri (gestione pubblica, più gestioni, contributi in mesi/giorni)
prima di attivare il servizio. XML e scansioni non vengono letti in automatico.

## Modalità prova (solo anteprime)

Su `localhost` e sulle anteprime Vercel dei rami (host `*-git-*.vercel.app`), se
`PUBLIC_STIMA_PENSIONE_API` è vuota, il questionario attiva una modalità prova: pagamento
simulato (riuscito o rifiutato), conferma dei contributi e prospetto con i dati del caso
di regressione. Non invia nulla e non compare mai su praticheflaiano.it. Va tolta quando
il backend vero è collegato.

## Da fare per attivarlo

1. Backend che riceve questionario e documenti (POST multipart su `PUBLIC_STIMA_PENSIONE_API`,
   risposta `{ "next": "<link di pagamento>" }`), li salva in archivio cifrato in UE.
2. Prodotto e pagamento sullo store GHL (60 € e 65 €) con avviso di pagamento al backend.
3. Lettura dell'estratto con l'API di Claude nello schema JSON della skill, conferma del
   cliente sulla tabella letta, esecuzione del motore, controlli di coerenza, prospetto PDF.
4. Informativa privacy dedicata (dati sulla salute), condizioni di vendita, verifica con
   ENASC/UNSIC su chi può vendere il servizio.

## Attenzioni

- Il motore calcola il netto con addizionali Lazio e Roma: per clienti di altre regioni va dichiarato.
- Aggiornare `PARAMS` solo insieme alla skill e rieseguire `python3 sito/api/_pensione/test_regressione.py`.
- Non cambiare l'id del sondaggio GHL: è quello operativo di `/certificazioni`.
