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

2. Leggi i file di riferimento:
   - `docs/style-guide.md` per le regole di scrittura
   - `docs/topic-taxonomy.md` per identificare la categoria e i tag corretti
   - `docs/legal-compliance.md` per il disclaimer
   - `docs/audience-personas.md` per il target

3. Leggi il template corretto da `content/_templates/`:
   - `informativo` → `content/_templates/article-informativo.md`
   - `scadenza` → `content/_templates/article-scadenza.md`
   - `guida` → `content/_templates/article-guida.md`
   - `novita` → `content/_templates/article-novita.md`

4. **Verifica i dati** usando WebSearch e WebFetch su fonti ufficiali PRIMA di scrivere

5. Scrivi l'articolo seguendo il template e le regole dello style-guide

6. Salva il file in `content/<categoria>/YYYY-MM-DD-slug.md`

7. Cerca articoli correlati in `content/` per suggerire cross-link

8. **Avvisa l'utente** che l'articolo deve passare da `/review-article [path]` prima della pubblicazione

## Output atteso

Un file Markdown completo con frontmatter YAML, pronto per la revisione del fact-checker.
