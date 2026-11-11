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
"richiedetelo voi"), dopo una spunta di consenso alla lettura automatica.

1. Il browser estrae il testo dal PDF con `pdfjs-dist` (`sito/src/utils/estrattoInps.ts`).
2. Il testo (o il PDF, se è una scansione fino a ~3 MB) va alla funzione
   `sito/api/stima/leggi-estratto.ts`, che chiede a un modello AI via OpenRouter di
   **trascrivere** tutte le righe in JSON (schema rigido, nessun calcolo).
3. Conversioni e somme sono fatte da codice (`sito/api/_lib/estrattoModel.ts`): 12 mesi o
   360 giorni = 52 settimane, aggregazione per anno, avvisi su buchi e anni oltre 52.
4. Se la funzione non risponde (chiave mancante, errore, limite), il browser ripiega sulla
   lettura locale a regole fisse e mostra l'avviso "Lettura semplificata".

Configurazione su Vercel (progetto `praticheflaiano-sito`, ambienti Preview e Production):
`OPENROUTER_API_KEY` obbligatoria, `STIMA_PENSIONE_MODEL` facoltativa.
Protezioni: controllo dell'origine, limite di 8 letture/ora per IP (in memoria), nessun
salvataggio né log del contenuto.

**Limiti noti (2026-11-11)**: la lettura con AI è stata provata solo contro un provider
finto; va verificata con la chiave vera su estratti reali (anche il nome del modello).
La lettura locale su un estratto reale ha letto solo 32 settimane: è inaffidabile e resta
solo come riserva. Il limite per IP non è globale: prima del lancio valutare Turnstile.

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
