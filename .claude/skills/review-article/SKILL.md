---
name: review-article
description: "Pipeline completa di revisione: fact-check normativo + ottimizzazione SEO. Obbligatorio prima della pubblicazione."
argument-hint: "[percorso-articolo]"
---

# Revisione Articolo (Fact-Check + SEO)

Esegui la pipeline completa di revisione su un articolo del blog.

## Istruzioni

1. Identifica il percorso dell'articolo da `$ARGUMENTS`
   - Se non specificato, chiedi all'utente quale articolo revisionare
   - Puoi anche cercare in `content/` articoli con `status: draft` nel frontmatter

2. **FASE 1: Fact-Check** (priorita massima)
   - Delega al subagent `fact-checker`
   - Attendi il verdetto: PUBBLICABILE, PUBBLICABILE CON CORREZIONI, o NON PUBBLICARE
   - Se il verdetto e NON PUBBLICARE: FERMA la pipeline e riporta all'utente i problemi trovati
   - Se il verdetto e PUBBLICABILE CON CORREZIONI: verifica che le correzioni siano state applicate

3. **FASE 2: Ottimizzazione SEO** (solo se il fact-check e superato)
   - Delega al subagent `seo-specialist`
   - Applica le ottimizzazioni SEO suggerite
   - Verifica che le ottimizzazioni non abbiano alterato il contenuto fattuale

4. **Output finale**
   - Aggiorna `status` nel frontmatter a `published` se tutto e ok
   - Aggiorna `last_updated` alla data odierna
   - Riporta all'utente:
     - Verdetto del fact-check
     - Eventuali correzioni applicate
     - Report SEO
     - Conferma che l'articolo e pronto per la pubblicazione (o i motivi per cui non lo e)

## Regole

- MAI saltare il fact-check
- MAI pubblicare un articolo con verdetto NON PUBBLICARE
- Il fact-check ha la precedenza sull'ottimizzazione SEO: non serve ottimizzare un articolo con dati sbagliati
