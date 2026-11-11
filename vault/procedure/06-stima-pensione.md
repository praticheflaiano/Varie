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

## Prelettura dell'estratto (primo passo, prima del pagamento)

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

## Modalità prova (solo anteprime)

Su `localhost` e sulle anteprime Vercel dei rami (host `*-git-*.vercel.app`), se
`PUBLIC_STIMA_PENSIONE_API` è vuota, il questionario attiva una modalità prova: pagamento
simulato, conferma dei contributi letti e poi **stima vera** tramite `api/stima/elabora`.
Se la stima vera non è disponibile (chiave mancante o errore) mostra il prospetto di esempio
con la spiegazione. Non compare mai su praticheflaiano.it.

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
