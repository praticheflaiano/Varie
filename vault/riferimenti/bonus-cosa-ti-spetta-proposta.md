# Scopri cosa ti spetta - proposta (Squadra 4)
Data verifica: 14/11/2026. Solo analisi e dati: nessun file del sito toccato.
File: `bonus.json` (30 misure attive verificate + 15 "da_verificare"). Tutti i percorsi pagina e gli slug articolo del JSON sono stati controllati su `sito/src/pages` e `content/`.

## 1. Decisione: estendere /quale-isee, niente pagina nuova
- `/quale-isee` e gia' un quiz a domande (grafo Q{}, result(), CTA WhatsApp e /prenota, JSON-LD WebApplication, solo evento aggregato `quale_isee_result`). La prima domanda ("Per cosa ti serve l'ISEE?") gia' parte da figli, ADI/SFL, universita', disabilita, bonus. E' linkata da footer, llms.txt, isee, cosa-portare.
- `/bonus-famiglia` e' troppo stretta (solo famiglia). `/adi-sfl`, `/caregiver`, `/naspi` coprono ciascuna un pezzo: una pagina nuova duplicherebbe tutto.
- Proposta: `/quale-isee` diventa a due modalita' (due tab nella stessa pagina): "Quale ISEE ti serve" (esistente, invariata) e "Cosa ti spetta" (nuova). Stesso URL, stessa SEO, stesso codice JS. `bonus.json` viene importato a build time e inlinato.
- Fase 2 opzionale: alias `/cosa-ti-spetta` che apre il tab bonus, solo se i dati di ricerca lo giustificano.

## 2. UX: 7 domande, risposta in meno di 1 minuto
Tutto in memoria del browser, niente localStorage, niente invio.

| # | Domanda | Risposte (codici JSON) |
|---|---|---|
| 1 | Dove abiti? | Roma / altro Lazio / fuori Lazio -> `residenza` |
| 2 | ISEE indicativo | nessuno-non so; fino 6.500; 6.500-9.796; 9.796-10.140; 10.140-15.000; 15.000-20.668; 20.668-28.340; 28.340-40.000; 40.000-46.583; oltre -> `isee_max` |
| 3 | Figli | nessuno / in attesa / nato 2026 (120 gg) / sotto 3 anni / minorenni / 18-20 / universitario -> `figli` |
| 4 | Lavoro | dipendente, autonomo, disoccupato, studente, pensionato, non lavoro, domestico -> `lavoro` |
| 5 | Eta' (e pensione se 65+) | fasce 18-29, 30-59, 60-64, 65-69, 70-74, 75-79, 80+ -> `eta` |
| 6 | Disabilita / assistenza | invalidita 67/74/100, L.104 art.3 c.3, accompagnamento, cieco-sordo, assisto un familiare -> `disabilita` |
| 7 | Casa e universita' | affitto / proprieta' / utenze a mio nome; figlio universitario -> `casa` |

Regole (schema domande -> regole):
- E tra campi, O dentro gli array. Campo null nel JSON = non conta.
- Residenza gerarchica: roma soddisfa lazio e italia.
- ISEE: fascia tutta sotto `isee_max` = "probabile"; fascia a cavallo = "dipende, controlliamo l'ISEE"; tutta sopra = nascosta; "non so" = tutte le misure con ISEE, con CTA "ISEE gratis". Con 4+ figli vale `isee_max_con_4_figli`.
- Eta': `eta.min/max`. APE sociale solo da 60 anni in su (fascia 60-64 = "forse").
- Misure con soglie di reddito personale (assegno sociale, pensione inabilita', canone RAI, ticket) e `nota_motore` non filtrano per ISEE: compaiono come "Puo' spettarti" con la voce "cosa controlliamo".
- Misure con `scadenza.data` passata o `stato=finestra_chiusa`: sezione "Riapre presto" (EBIT trasporti/sport), non tra le attive.
- Ordinamento: prima "probabile", poi "dipende"; dentro ciascun gruppo per scadenza piu' vicina, poi "sempre aperto".

Scheda risultato: ente (badge), importo (`importo.testo`), scadenza con giorni mancanti (calcolati ad ogni apertura), link a `pagina_sito` o `articolo_sito` (se presenti), fonte ufficiale (`fonti`), pulsante secondo `cta.aiuto`:
- `te_lo_facciamo_noi` -> "Te lo facciamo noi" (WhatsApp con testo precompilato opt-in, oppure /prenota)
- `ti_aiutiamo` -> "Chiedi aiuto"
- `solo_informazione` -> "Controlliamo il tuo ISEE" (es. Carta Dedicata a te, senza domanda)
Prezzi: mostrare `cta.prezzo_pubblicato_sul_sito` solo se valorizzato; dove e' scritto "non pubblicato" dire "te lo diciamo prima" (come fa ServiceLanding).

Privacy: risposte solo in memoria, nessuna scrittura su server o localStorage, solo l'evento aggregato dataLayer (senza profilo). Nota in pagina: "Strumento indicativo. Non salviamo le tue risposte. Per verificare davvero serve il tuo ISEE" con link a /privacy. Idea lead (solo con consenso esplicito): "Avvisami quando riapre" per i bandi chiusi.

## 3. Dove inserirlo (solo proposta)
1. `quale-isee.astro`: tab "Cosa ti spetta" + import di `bonus.json`; stessa pagina, JSON-LD invariato.
2. Tessera in `pages/index.astro` e voce NAV/Footer: "Scopri cosa ti spetta" verso `/quale-isee?modo=bonus`.
3. Una riga di rimando da `/bonus-famiglia`, `/adi-sfl`, `/caregiver`, `/naspi`, `/isee`, `/imu-tari`, `/luce-gas`.
4. Aggiungere la voce in `llms.txt.ts`.

## 4. Dati: cosa c'e' nel JSON
30 misure attive: 20 nazionali, 5 Regione Lazio, 3 Roma Capitale, 2 EBIT Lazio. Ogni misura ha: requisiti strutturati, importo, scadenza (tipo + data + testo), stato, come si chiede, cosa controlla il Centro, pagina/articolo, `cta`, `fonti` (URL ufficiali), `verificato_il`, `campi_da_riverificare`. In `meta` ci sono i codici e la spiegazione delle regole. `da_verificare` (15 voci) contiene bandi chiusi, proposte della legge di bilancio 2027, DDL caregiver e misure non lette.

Misure senza pagina sul sito (lacuna da colmare): Carta acquisti, Assegno di maternita' dei Comuni, Prestazione universale anziani, Assegno sociale (solo menzione), Pensione di inabilita'/assegno mensile, Over 70 trasporti, esenzione ticket, DiSCo, EBIT (solo articolo). Per ora il link punta alla pagina piu' vicina o resta vuoto.

## 5. Discrepanze da risolvere (segnalate anche nel JSON)
1. Bonus nuovi nati: la scheda INPS dice "nati dal 1/1/2025" senza data finale; l'articolo del sito dice solo 2026 e 2027 da definire.
2. Roma Capitale (pagina TARI 24/2/2026) riporta ancora la soglia bonus 9.530 €; ARERA dice 9.796 € dal 1/1/2026.
3. Ticket: la pagina ASL scrive 11.362,65 (E02) e 11.362,05 (E04). Cifra non pubblicata.
4. Canone RAI over 75: scadenza 30/4/2027 e importo 90 € vengono dall'articolo del sito, non dalla pagina AdE letta.
5. Permessi 104 (3 giorni/mese): dato dalla pagina Caregiver del sito, non riletto nella scheda INPS.
6. TARI Roma 2027: scadenza 28/2/2027 e' la regola del regolamento, manca l'avviso ufficiale 2027.
7. EBIT: date 2027 non pubblicate. 8. Prestazione universale anziani: scade 31/12/2026, proroga solo in bozza di bilancio.

## 6. Cosa serve ad Antonio
- Decidere: approvazione del tab su /quale-isee (si/no) e della fase 2.
- Prezzi da pubblicare per: ADI/SFL (domanda), invalidita'/104 permessi, caregiver, CUDE, bollo disabili, assegno sociale, Carta acquisti, assegno maternita', ticket, TARI esenzione. Senza prezzo il testo resta "te lo diciamo prima".
- Conferma su quali servizi vuole offrire davvero (pulsante "Te lo facciamo noi") e quali solo come informazione.
- Via libera a scrivere le pagine mancanti (punto 4) e a verificare le discrepanze (punto 5).
- Conferma che il nostro CAF e' tra quelli convenzionati DiSCo per l'ISEEUP (scade la DSU il 17/11/2026).
- Testo e consenso per eventuali promemoria ("avvisami quando riapre").
- Manutenzione: ricontrollare il JSON a gennaio 2027 (importi, soglie ISEE, nuovi bandi EBIT e Lazio).

## 7. Urgenze da mostrare in cima (a 14/11/2026)
DiSCo (domanda entro 30/11, DSU entro 17/11), APE sociale (30/11), Carta Dedicata a te (primo acquisto entro 16/12), Bonus mamme (31/12), Prestazione universale anziani (31/12).
