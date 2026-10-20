# Revisione del calcolatore · 20 ottobre 2026

Versione applicativa: 1.2.0. CCNL H501 2025–2028, tabelle economiche e contributive 2026.

## Esito e perimetro

Le tabelle ordinarie sono state confrontate con le fonti ministeriali, INPS e delle parti firmatarie elencate sotto. Sono state aggiunte correzioni, verifiche automatiche e un prospetto trimestrale riproducibile. Non viene dichiarata una garanzia assoluta o una certificazione dei cedolini: mansioni, presenze, diritti individuali, comunicazioni e autorizzazioni INPS dipendono dal singolo rapporto.

Il calcolatore distingue preventivo mensile medio, prospetto paga mensile simulato e controllo dei contributi trimestrali. I contributi trimestrali non sono cedolini della retribuzione e il documento esportato non è un avviso pagoPA.

## Controlli e correzioni

| Componente | Regola verificata / comportamento |
|---|---|
| Minimi CCNL | Tabelle A/B/C/D/E/G confrontate con il PDF ministeriale 2026. I minimi sono uguali per determinato e indeterminato. |
| Funzione D/DS | 207,69 euro nella convivenza ordinaria, esposta separatamente e inclusa una sola volta nel minimo complessivo. |
| Coerenza UI/motore | Paga base visualizzata e base del motore condividono la stessa funzione. |
| Mensilizzati da presenze | Trattenute su ore INPS e Cassa effettive confermate, comprese le aggiuntive una sola volta; inversione del netto sulle ore effettive. |
| Netto/lordo | Inversione per ciascuna fascia INPS e scelta del minore lordo conforme. Netto prima dell’IRPEF personale. |
| INPS ordinario | Tabelle della circolare 9/2026, addizionale TD già inclusa; sostitutivo senza addizionale; CUAF distinta. |
| Soglia oraria | Contributo fisso per orario superiore a 24 ore; 24 ore restano nelle fasce retributive. |
| Retribuzione effettiva | Comprende paga, vitto/alloggio ripartito e quota di tredicesima. Il valore per la fascia può differire dalla paga ordinaria. |
| Vitto/alloggio | Convenzionale distinto da monetizzazione e costo reale. Per istituti dei mensilizzati: valori giornalieri per 30; per fascia INPS: giorni settimanali di fruizione. |
| Scatti | 4% ogni biennio, fino a sette, dal mese successivo. Non assorbibili dal superminimo. |
| Mese parziale | Quota di paga distinta dal mese utile a tredicesima e ferie. La scelta del mese utile richiede verifica della soglia di 15 giorni e delle assenze tutelate. |
| TFR | Divisore 13,5. Nei mesi parziali identificati dal modello è richiesta una base utile verificata separatamente, già comprensiva della tredicesima utile. Fondo pregresso, rivalutazione e anticipi separati. |
| Presenza notturna | Interventi attivi con paga verificata di tabella C; non viene usata impropriamente la paga oraria derivata dal compenso di attesa E. |
| Orario ridotto | Controllati anche limite giornaliero e distribuzione in tre giorni. |
| Date e quantità | Date impossibili rifiutate; notti e giorni settimanali interi; valori non finiti o negativi bloccati. |
| Esoneri individuali | La loro presenza blocca l’applicazione della tabella ordinaria; serve la tariffa autorizzata INPS. |
| Calendario trimestrale | Settimane da domenica a sabato, riporto dei giorni successivi all’ultimo sabato. Cessazione con settimana finale parziale. |
| Ore trimestrali | Somma prima dell’arrotondamento all’unità superiore, senza arrotondamento preventivo di ogni settimana. |
| Quote e centesimi | Totale sulla tariffa ufficiale; quota lavoratore arrotondata; quota datore come residuo. Totali riconciliati. |
| CAS.SA.COLF | F2 pari a 0,06 euro/ora, 0,02 lavoratore e 0,04 datore. Base separata per rapporti notturni e integrazione volontaria del solo datore. |
| Scadenze 2026 | 10 aprile, 10 luglio, 10 ottobre; quarto trimestre 11 gennaio 2027. Il sabato non viene spostato automaticamente. |
| Confronto avviso | INPS e F2 confrontati separatamente. Commissioni, sanzioni e interessi esclusi dal confronto. |
| Trattenute dei cedolini | Eventuali differenze rispetto al trimestre esposte come saldi; nessun conguaglio applicato silenziosamente. |
| Trasparenza | Le condizioni copiate nel trimestre sono esplicite; la riapertura di un file richiede una nuova verifica dei dati. |
| Esportazioni | Tabelle native DOCX, formule e valori XLSX, PDF vettoriale; lettura indipendente con python-docx, openpyxl e pypdf. |
| Guide | Spiegazioni di significato, compilazione ed effetti, accessibili da tastiera e tocco anche offline. |

## Casi numerici di controllo

| Caso, trimestre intero costante | INPS | F2 | Totale |
|---|---:|---:|---:|
| 25 ore/settimana, 13 settimane, TI con CUAF | 403,00 € | 19,50 € | 422,50 € |
| 20 ore/settimana, 13 settimane, lordo 10 €/ora, seconda fascia | 499,20 € | 15,60 € | 514,80 € |
| Notturno: 30 ore INPS e 40 ore Cassa/settimana, 13 settimane | 483,60 € | 31,20 € | 514,80 € |

I casi usano condizioni dichiarate e non sostituiscono la ricostruzione delle presenze reali.

## Limiti operativi espliciti

- Il prospetto trimestrale gestisce un solo rapporto e condizioni costanti. Per cambi di paga, fascia, orario contrattuale, contratto, CUAF o agevolazioni occorrono periodi distinti verificati nel Portale INPS.
- Scatti automatici che cambiano la paga all’interno del trimestre bloccano il prospetto unico.
- Malattia, maternità, infortunio, arretrati, preavviso, ferie non godute e liquidazione finale non vengono elaborati automaticamente.
- Le ore dei rapporti notturni e le prestazioni attive richiedono dati verificati; le convenzioni Cassa non vengono trasferite automaticamente all’INPS.
- La proiezione annuale resta strutturale a condizioni costanti; non è un conteggio del calendario annuo.
- Il pagamento della tredicesima non aggiunge automaticamente ore INPS; la quota è già nella retribuzione effettiva.
- Coincidenza con gli importi inseriti dell’avviso significa riconciliazione numerica, senza certificare classificazione, presenze o regolarità degli adempimenti.
- Le tabelle 2026 non sono applicate automaticamente al 2027. Il pagamento a gennaio del quarto trimestre 2026 usa la competenza 2026.

## Fonti primarie

1. Ministero del Lavoro, minimi retributivi dal 1° gennaio 2026:
   https://www.lavoro.gov.it/temi-e-priorita-rapporti-di-lavoro-e-relazioni-industriali/focus/tabella-lavoro-domestico-2026
2. INPS, circolare 9 del 3 febbraio 2026:
   https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/02/Circolare_15154/Allegati/16551_Circolare-numero-9-del-03-02-2026.pdf
3. CCNL, testo della parte firmataria DOMINA, artt. 10–17, 34–41 e 54 e chiarimenti a verbale:
   https://associazionedomina.it/ccnl-lavoro-domestico/
4. INPS, calcolo della paga oraria effettiva (le tariffe nell’esempio sono 2025 e non sono riutilizzate):
   https://www.inps.it/it/it/dettaglio-approfondimento.schede-informative.49828.contributi-e-agevolazioni-fiscali-per-chi-assume-un-lavoratore-domestico.html
5. INPS, calendario e versamenti trimestrali:
   https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.50061.pagamento-dei-contributi-al-lavoratore-domestico.html
6. INPS, istruzioni del messaggio 70/2003, allegato 1, per settimane e arrotondamento (nessuna tariffa storica è usata):
   https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2003/06/Circolare_10887/Allegati/0_Messaggio-numero-70-del-16-6-2003_Allegato-n-1.pdf
7. CAS.SA.COLF, importi e procedura F2:
   https://www.cassacolf.it/versamenti/
8. ASSINDATCOLF, metodo del TFR:
   https://lavorodomestico.assindatcolf.it/guide/tfr-per-colf-e-badanti-come-si-calcola-e-come-si-paga/

Le istruzioni di CAS.SA.COLF sul sito riportano ancora l’articolo 53 del precedente testo: il CCNL 2025–2028 disciplina i contributi nell’articolo 54. L’importo di 0,06 euro è confermato nel testo vigente.

## Verifica riproducibile

Eseguire `npm test`, `python tests/validate_exports.py` dopo aver installato i parser e `npm run test:browser`. Il workflow GitHub conserva log, documenti campione e prova dell’anteprima ospitata. I risultati effettivi del workflow sono l’evidenza dei controlli superati; non una certificazione normativa individuale.
