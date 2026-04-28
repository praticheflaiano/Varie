# Fact-Check Report - ISEE 2026 e DSU 30 giugno arretrati AUU

- **Articolo**: `/home/user/Varie/content/isee-dsu/2026-04-29-isee-2026-dsu-30-giugno-arretrati-assegno-unico.md`
- **Data verifica**: 29/04/2026
- **Verdetto**: PUBBLICABILE CON CORREZIONI (correzioni applicate direttamente)
- **Numero ERRORI trovati**: 3 (corretti)
- **Numero ATTENZIONI**: 2 (rilevate, tollerabili come approssimazioni)
- **Numero SUGGERIMENTI**: 2

## ERRORI (corretti direttamente)

### 1. Maggiorazione "Madre under 21" - importo errato (riga 89 originale)
- **Testo originale**: "Madre under 21: +20 €/mese per figlio"
- **Problema**: importo non rivalutato 2026. La Circolare INPS n. 7/2026 ha applicato +1,4% di rivalutazione ISTAT.
- **Correzione applicata**: "Madre under 21: +22,80 €/mese per ogni figlio (importo rivalutato 2026)"
- **Fonte**: Circolare INPS n. 7 del 30/01/2026, Allegato 1 (https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-7-del-30-01-2026_15152.html); confermato da informazionescuola.it e enacinforma.it.

### 2. Maggiorazione "Entrambi i genitori lavoratori" - importo errato (riga 90 originale)
- **Testo originale**: "Entrambi i genitori lavoratori: +30 €/mese per figlio (importo decrescente con ISEE)"
- **Problema**: importo non rivalutato 2026. Il valore corretto post-rivalutazione e' fino a 34,10 €/figlio.
- **Correzione applicata**: "Entrambi i genitori lavoratori: fino a +34,10 €/mese per figlio (decrescente con l'ISEE, azzerata oltre 46.582,71 €)"
- **Fonte**: Eutekne.info su Circolare INPS 7/2026; confermato da CAF Treviso CGIL e Patronato INCA CGIL.

### 3. Disclaimer obbligatorio MANCANTE
- **Problema**: l'articolo non includeva il disclaimer obbligatorio richiesto da `docs/regole-contenuto.md` (sezione 8). Tutti gli articoli del blog devono terminare con il disclaimer testuale standard.
- **Correzione applicata**: aggiunto disclaimer completo in coda all'articolo (dopo "Articoli correlati"), con dati Centro Pratiche Flaiano e link prenotazioni.
- **Fonte**: regole-contenuto.md art. 8.

## ATTENZIONI (verificate, accettabili)

### A1. Maggiorazione "+50% per famiglie con almeno 3 figli e ISEE fino 46.582,71 €" (riga 87 originale)
- **Testo originale**: "Famiglie con almeno 3 figli e ISEE fino a 46.582,71 €: +50% per ogni figlio"
- **Precisazione**: la maggiorazione +50% si applica per ogni figlio nella fascia di eta' 1-3 anni (non per qualunque figlio), come indicato nelle fonti (informazionescuola.it; pmi.it).
- **Correzione applicata**: "Famiglie con almeno 3 figli e ISEE fino a 46.582,71 €: +50% sulla quota base per ogni figlio in eta' 1-3 anni"

### A2. Esempio di calcolo (riga 55-58)
- **Testo**: "AUU dovuto: ~199 €/figlio per ISEE 2026 = 18.000 €"
- **Verifica**: con interpolazione lineare tra le soglie 17.468,51 (203,80 €) e 46.582,71 (58,30 €), un ISEE di 18.000 € da' circa 201,14 €/figlio. La cifra "~199" e' approssimata in difetto ma sufficientemente vicina. Tollerabile come stima.
- **Correzione**: nessuna (tilde indica approssimazione esplicita).

## SUGGERIMENTI

- **S1**: Aggiungere link cliccabile diretto alla Circolare INPS n. 7/2026 (https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-7-del-30-01-2026_15152.html) per dare credibilita' SEO/E-E-A-T.
- **S2**: Considerare di citare l'allegato 1 della Circolare 7/2026 come tabella ufficiale di riferimento per gli importi.

## DA VERIFICARE

Nessun dato e' rimasto non verificato. Tutti i numeri principali sono stati controllati:
- Soglie ISEE 2026 (17.468,51 e 46.582,71 €): VERIFICATE
- Importo minimo 58,30 € e massimo 203,80 €: VERIFICATI
- Rivalutazione +1,4% ISTAT 2025: VERIFICATA
- Forfait 4+ figli 150 €/mese: VERIFICATO
- Soglia titoli di Stato esclusi 50.000 € (era 31.500 €): VERIFICATA (D.Lgs. attuativo riforma ISEE 2026)
- Scadenza DSU 30 giugno per arretrati: VERIFICATA (D.Lgs. 230/2021 art. 6)
- Tempi rilascio ISEE 10-15 gg lavorativi: VERIFICATI
- Riferimenti normativi (D.Lgs. 230/2021, Circolare INPS n. 7/2026): VERIFICATI

## Checklist obbligatoria

- [x] Disclaimer presente e completo (aggiunto durante il fact-check)
- [x] Data "ultimo aggiornamento" nel frontmatter corretta (29/04/2026)
- [x] Campo `sources` nel frontmatter elenca fonti citate (8 fonti)
- [x] Campo `slug` presente nel frontmatter
- [x] Dati Centro corretti (Via Filoteo Alberini 25 int 10, 0697845429, 3716230690)
- [x] Nessun claim promozionale non supportato
- [x] Nessun countdown o urgenza artificiale (consiglio scadenza esplicito su base normativa)
- [x] Nessun link placeholder o percorso repository
- [x] Anno imposta vs dichiarazione corretti (redditi 2024 in DSU 2026, 730/2025 = redditi 2024)
- [x] Linguaggio rispettoso

## Note

- L'articolo e' tecnicamente accurato sulla parte ISEE (procedura, scadenze, documenti, ISEE corrente).
- Le due correzioni sui maggiorazioni sono critiche perche' valori del 2024-2025 non rivalutati avrebbero indotto i lettori a sottostimare quanto effettivamente spettante.
- Lo status del frontmatter e' stato cambiato da `draft` a `fact-checked`.
- Aggiunti campi `fact_check_date: 2026-04-29` e `fact_check_result` nel frontmatter.

## Fonti consultate

- INPS - Comunicato 27/02/2026 "Assegno unico 2026: presentazione domanda e aggiornamento importi"
- INPS - Circolare n. 7 del 30/01/2026 (Allegato 1 con tabella importi)
- D.Lgs. 230/2021 art. 6 (regolamento AUU)
- Legge di Bilancio 2026 (esclusione titoli di Stato fino 50.000 €)
- Eutekne.info, FISAC CGIL, INCA CGIL, CAF UIL Roma e Lazio, informazionescuola.it, fiscoetasse.com (fonti secondarie di conferma)