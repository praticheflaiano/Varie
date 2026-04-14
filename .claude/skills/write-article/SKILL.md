---
name: write-article
description: "Genera un nuovo articolo per il blog su un argomento fiscale/previdenziale. Specifica l'argomento e il tipo di articolo."
argument-hint: "[argomento] [informativo|scadenza|guida|novita]"
---

# Scrivi un Nuovo Articolo

Genera un articolo per il blog del Centro Pratiche Flaiano.

## Istruzioni

1. Analizza `$ARGUMENTS` per identificare:
   - **Argomento**: il tema dell'articolo (es. "ISEE 2026", "bonus ristrutturazione", "NASpI")
   - **Tipo**: `informativo`, `scadenza`, `guida`, o `novita` (default: `informativo`)

2. **Verifica che l'argomento non sia gia coperto**:
   - Cerca in `content/` con Glob e Grep se esistono gia articoli sullo stesso tema
   - Se esiste un articolo simile, chiedi all'utente se vuole aggiornarlo o creare un articolo complementare

3. Leggi i file di riferimento:
   - `docs/regole-contenuto.md` per le regole complete (scrittura, disclaimer, fonti, compliance)
   - `docs/topic-taxonomy.md` per identificare la categoria e i tag corretti
   - `docs/audience-personas.md` per il target

4. Leggi il template corretto da `content/_templates/`:
   - `informativo` → `content/_templates/article-informativo.md`
   - `scadenza` → `content/_templates/article-scadenza.md`
   - `guida` → `content/_templates/article-guida.md`
   - `novita` → `content/_templates/article-novita.md`

5. **Verifica i dati** usando WebSearch e WebFetch su fonti ufficiali PRIMA di scrivere

6. Scrivi l'articolo seguendo il template e le regole, includendo il campo `slug` nel frontmatter

7. Salva il file in `content/<categoria>/YYYY-MM-DD-slug.md`

8. Cerca articoli correlati in `content/` per suggerire cross-link (formato: `[Titolo](https://praticheflaiano.it/blog/SLUG)`)

9. **Lancia automaticamente il fact-check**: dopo la scrittura, avvia `/review-article [path]` per la pipeline di revisione

## Output atteso

Un file Markdown completo con frontmatter YAML (incluso `slug`), pronto per la revisione del fact-checker. La pipeline di revisione viene avviata automaticamente.
