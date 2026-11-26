# Procedura 08 - Ottimizzare i contenuti con Search Console (domande reali)

Creata il 26/11/2026 dopo la prima ottimizzazione di tutto il sito (6 agenti in parallelo, uno per gruppo di argomenti). Regole di scrittura: `docs/regole-contenuto.md` sezione 4-ter.

## Quando
- Ogni mese (inizio mese) e ogni volta che esce una notizia stagionale (pagamenti INPS del mese, scadenze IMU/TARI, ISEE nuovo anno).

## Come leggere i dati (browser integrato, Search Console)
1. Aprire `https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Apraticheflaiano.it&num_of_days=90&breakdown=query`.
2. Righe per pagina 500, poi pagina successiva: si arriva a 1.000 query (limite dell'interfaccia). Leggere la tabella con JavaScript (`tr` → celle, ultime 5 colonne: query, clic, impressioni, CTR, posizione) e togliere i doppioni.
3. Filtro ricerche lunghe: aggiungere `&query=~%5E(%3F%3A%5CS%2B%5Cs%2B)%7B5%2C%7D%5CS%2B%24` all'indirizzo (regex `^(?:\S+\s+){5,}\S+$`).
4. Scheda PAGINE con lo stesso filtro: dice quali pagine ricevono le domande.
5. Raggruppare per tema con espressioni regolari (ISEE/famiglia, pensioni/RED, NASpI/lavoro, fisco/tributi, invalidità, colf, locale).

## Cosa guardare
- **Posizione 5-15 con molte impressioni e pochi clic**: pagina da ottimizzare (titoli-domanda, risposta in una riga, In breve, FAQ).
- **Posizione oltre 20 su un tema nostro**: articolo da rafforzare o da scrivere.
- **Ricerche di servizio** (costo, vicino a me, aperti): FAQ nelle pagine servizio e zona; scheda Google.
- **Domande senza pagina**: idee per nuovi articoli (prima controllare che non esista già un articolo sullo stesso tema).

## Come lavorare con agenti in parallelo
1. Brief comune in un file (obiettivo, regole, divieti: ZERO INVENZIONI, solo i propri file, niente git/build).
2. Un agente per gruppo di argomenti, ognuno con: elenco file suoi, query del gruppo (query | impressioni | clic | posizione), eventuali nuovi articoli consentiti, nome del report `reviews/seo-domande-<gruppo>-<data>.md`.
3. Il coordinatore: controlla i diff, genera copertine per gli articoli nuovi, build, axe, PR, deploy (procedura 02), IndexNow, richiesta di indicizzazione delle pagine principali.

## Dopo 2-4 settimane
Confrontare posizione e CTR delle pagine toccate con il periodo precedente (Search Console > Confronta). Annotare il risultato nel progetto claude.ai e in questa procedura.
