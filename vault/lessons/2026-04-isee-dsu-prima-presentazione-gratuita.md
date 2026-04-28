---
title: "Lesson: ISEE/DSU al CAF - prima presentazione gratuita per il cittadino"
type: lesson
tags: [isee, dsu, caf, costi, normativa, fact-check]
created: 2026-04-29
related: [[procedure/01-workflow-editoriale]], [[lessons/2026-04-org-usage-limit]]
severity: alto
---

# ISEE/DSU al CAF: prima presentazione gratuita per il cittadino

## Contesto

Dopo la pubblicazione live dell'articolo "ISEE 2026 e DSU entro il 30 giugno per gli arretrati AUU" (29/04/2026), l'utente (titolare del CAF) ha segnalato un **errore importante** nel testo: l'articolo dichiarava un "costo medio 25-50 €" per la DSU al CAF, e una FAQ sul costo "in base alla complessita".

**Realta normativa**: per il cittadino la **prima presentazione annuale dell'ISEE al CAF e gratuita**.

## Sintomo

Articolo `content/isee-dsu/2026-04-29-isee-2026-dsu-30-giugno-arretrati-assegno-unico.md`:

- riga 155 (sezione "Online vs CAF"): "**Costo medio**: indicativamente 25-50 € a seconda della complessita del nucleo (per i soci tessera tariffe agevolate)"
- riga 158: "**Contro**: non e gratis (ma il 'danno evitato' sull'AUU vale spesso molte volte il costo)"
- FAQ "Devo essere socio del CAF per fare la DSU con voi?" → menzionava "tariffe agevolate" implicitamente suggerendo costo

Anche `sito/src/pages/faq.astro` riga 70: "Quanto costa fare l'ISEE? Dipende dalla complessita..."

Tutto pubblicato in produzione su praticheflaiano-sito.vercel.app prima della segnalazione.

Errore non rilevato ne dal subagent fact-checker dedicato (non eseguito - org limit) ne dal fallback OpenRouter DeepSeek V3 (non specializzato in convenzioni INPS-CAF).

## Root cause

**Convenzione nazionale INPS-CAF**: i Centri di Assistenza Fiscale ricevono un **compenso direttamente dall'INPS** per ogni DSU/ISEE trasmessa correttamente, ai sensi del **D.M. 7 maggio 1999, n. 164** e successivi accordi convenzionali. Per il cittadino il servizio e quindi **gratuito alla prima presentazione annuale**.

**Eccezioni in cui puo essere previsto un costo**:
- **DSU sostitutive o integrazioni** richieste dopo la prima per **omissioni o difformita** rilevate nei controlli sostanziali (art. 11 DPCM 159/2013)
- **Servizi accessori** non rientranti nella convenzione (es. assistenza specifica su contestazioni complesse)
- Politica interna del CAF puo anche prevedere gratuita per tutti i rilasci (ogni CAF decide il proprio regolamento sui rilasci successivi)

**Conoscenza che mancava al modello**: questa e una regola di **convenzione INPS-CAF** non immediatamente intuibile da leggere il "regolamento ISEE" (DPCM 159/2013) o da cercare "costo ISEE" su fonti generaliste. E un'informazione **operativa di settore** che il titolare del CAF conosce per esperienza ma che fonti web generaliste spesso riportano in modo confuso (es. "costo medio 25-50 €" e una cifra che si vede su forum, ma e il costo dei rilasci tardivi/integrativi, non del primo).

## Risoluzione applicata

### File articolo (3 modifiche)

1. **Sezione "Con il CAF"** riformulata:
   > "Per il cittadino il **primo rilascio annuale dell'ISEE al CAF e gratuito**: il servizio e remunerato direttamente dall'INPS al CAF tramite la convenzione nazionale ai sensi del **D.M. 7 maggio 1999 n. 164** e successivi accordi convenzionali. Solo eventuali **rilasci successivi nello stesso anno per modifiche/integrazioni** dovuti a omissioni o difformita rilevate nei controlli (DSU sostitutive a posteriori) possono comportare un costo, secondo il regolamento interno del CAF."

2. **FAQ "Devo essere socio del CAF"**: chiarito che la prima presentazione e gratuita per tutti soci e non, e che la tessera da accesso a "altri servizi" agevolati (730, successioni) non alla DSU.

3. **Nuova FAQ "Quanto costa fare la DSU 2026 al CAF?"** dedicata, con risposta diretta: "Niente, per la prima presentazione annuale".

### File FAQ pagina sito

`sito/src/pages/faq.astro` - FAQ "Quanto costa fare l'ISEE?" riscritta:

> "Per il cittadino la prima presentazione annuale dell'ISEE al CAF e gratuita: il servizio e remunerato direttamente dall'INPS al CAF tramite la convenzione nazionale. Solo eventuali rilasci successivi nello stesso anno per modifiche o integrazioni dovute a omissioni o difformita possono comportare un costo. Anche l'ISEE corrente rientra nella convenzione INPS-CAF."

## Lezione astratta

### 1. Il dato "facile da trovare su Google" puo essere quello sbagliato

I forum, blog generalisti, comparatori riportano spesso "costo ISEE 25-50 €" facendo confusione tra:
- prima presentazione (gratis)
- rilasci tardivi / integrativi (costosi)
- ISEE per servizi NON in convenzione (es. ISEE per condominio, banche → quelli si pagano)

WebSearch ha **bias verso la risposta piu comune ma non sempre piu corretta**.

### 2. Conoscenza di settore vs. fonti web

Su materia di convenzioni operative (INPS-CAF, INPS-Patronato, AdE-Commercialisti), le **fonti normative dirette** (decreti ministeriali, accordi nazionali) battono i blog. Bisogna citare:
- **D.M. 7 maggio 1999 n. 164** (regolamento convenzioni CAF)
- **DPCM 159/2013** (regolamento ISEE)
- **Convenzione INPS-CAF** annuale (rinnovata da Convenzione 2025-2027)

### 3. L'utente cliente CAF e la fonte di verita ultima

Il titolare del CAF conosce le regole operative meglio di qualsiasi fact-checker AI. Quando segnala "questo e sbagliato", quasi sempre lo e. **Mai contestare senza prima verificare la fonte normativa che cita o sottintende**.

### 4. Errore lampante che AI fact-checker non rileva

Sia il subagent dedicato (non eseguito - org limit) sia il fallback DeepSeek V3 non hanno segnalato l'errore. Motivi probabili:
- Subagent non lanciato per limit org
- DeepSeek V3 ha 163K context ma "conoscenza fiscale italiana" approssimativa, non specifica su convenzioni INPS-CAF
- Le fonti citate nell'articolo (INPS Circolare 7/2026, Messaggio 1136/2026) **non parlano di costi** della DSU, quindi nemmeno il fact-checker piu attento avrebbe trovato il problema su quelle fonti

**Conclusione**: anche un fact-check AI rigoroso non sostituisce la **review finale del cliente esperto** prima della pubblicazione.

## Aggiornamenti necessari nel workflow

1. **Pre-pubblicazione**: aggiungere step "review finale del titolare CAF" per articoli su procedure operative interne (DSU, 730 al CAF, costi, tempi). Annotato in [[procedure/04-pubblicazione-articolo]] come "step 5b".

2. **Vault**: questa nota.

3. **Fact-check report**: aggiornata `reviews/fact-check-isee-2026-dsu-30-giugno.md` con nota di correzione post-pubblicazione.

4. **Articolo principale**: gia corretto in produzione con redeploy.

## Riferimenti normativi sulla convenzione

- **D.M. 7 maggio 1999, n. 164** (modello di convenzione INPS-CAF)
- **D.Lgs. 9 luglio 1997, n. 241**, art. 32 e ss. (disciplina CAF)
- **DPCM 5 dicembre 2013, n. 159** (regolamento ISEE)
- **Decreto MEF 7 novembre 2014** (compenso CAF per DSU - parametri ricavati dalla convenzione)
- Convenzione triennale INPS-CAF in vigore (compenso unitario per DSU rilasciata)

## Vedi anche

- [[procedure/01-workflow-editoriale]]
- [[procedure/04-pubblicazione-articolo]]
- [[lessons/2026-04-org-usage-limit]]
- [[lessons/2026-04-stream-timeout-recovery]]
