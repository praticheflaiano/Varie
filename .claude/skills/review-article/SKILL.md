---
name: review-article
description: "Pipeline completa di revisione: fact-check normativo + ottimizzazione SEO + checklist finale. Obbligatorio prima della pubblicazione."
argument-hint: "[percorso-articolo]"
---

# Revisione Articolo (Fact-Check + SEO + Checklist)

Esegui la pipeline completa di revisione su un articolo del blog.

## Istruzioni

1. Identifica il percorso dell'articolo da `$ARGUMENTS`
   - Se non specificato, chiedi all'utente quale articolo revisionare
   - Puoi anche cercare in `content/` articoli con `status: draft` nel frontmatter

2. **FASE 1: Fact-Check** (priorita massima)
   - Delega al subagent `fact-checker`
   - Il report va salvato in `reviews/YYYY-MM-DD-SLUG-factcheck.md`
   - Attendi il verdetto: PUBBLICABILE, PUBBLICABILE CON CORREZIONI, o NON PUBBLICARE
   - Se il verdetto e **NON PUBBLICARE**: FERMA la pipeline e riporta all'utente i problemi trovati. Status resta `draft`.
   - Se il verdetto e positivo: aggiorna `status` a `fact-checked`

3. **FASE 2: Ottimizzazione SEO** (solo se il fact-check e superato)
   - Delega al subagent `seo-specialist`
   - Il report va salvato in `reviews/YYYY-MM-DD-SLUG-seo.md`
   - Applica le ottimizzazioni SEO suggerite
   - Verifica che le ottimizzazioni non abbiano alterato il contenuto fattuale
   - Aggiorna `status` a `seo-optimized`

4. **FASE 3: Checklist finale**
   Verifica tutti i seguenti punti:
   - [ ] Lunghezza articolo: 1200-1800 parole
   - [ ] Disclaimer presente e completo
   - [ ] Campo `slug` presente nel frontmatter
   - [ ] Campo `deadline` presente (se articolo tipo scadenza)
   - [ ] Nessun placeholder nel testo (es. `[LINK]`, `[DA COMPLETARE]`)
   - [ ] Link corretti: formato `https://praticheflaiano.it/blog/SLUG`, nessun percorso repository
   - [ ] Categoria corretta secondo `docs/topic-taxonomy.md`
   - [ ] CTA massimo 3, contestuali all'argomento
   - [ ] Geo-SEO: "Roma" presente, zone servite menzionate

5. **Output finale**
   - Se la checklist e superata: aggiorna `status` a `ready`
   - Aggiorna `last_updated` alla data odierna
   - Riporta all'utente:
     - Verdetto del fact-check
     - Eventuali correzioni applicate
     - Report SEO
     - Esito checklist finale
     - Conferma che l'articolo e pronto per la pubblicazione (o i motivi per cui non lo e)

## Flusso degli stati

`draft` → `fact-checked` → `seo-optimized` → `ready` → `published`

## Regole

- MAI saltare il fact-check
- MAI pubblicare un articolo con verdetto NON PUBBLICARE
- Il fact-check ha la precedenza sull'ottimizzazione SEO: non serve ottimizzare un articolo con dati sbagliati
- I report vanno in `reviews/`, NON come commenti HTML nell'articolo
