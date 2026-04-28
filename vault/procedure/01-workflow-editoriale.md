---
title: "Procedura: workflow editoriale articoli blog"
type: procedura
tags: [workflow, editoriale, blog, content]
created: 2026-04-28
related: [[procedure/04-pubblicazione-articolo]], [[lessons/2026-04-race-condition-agent]]
---

# Workflow editoriale articoli blog

## Quando applicarla

Ogni nuovo articolo del blog (Centro Pratiche Flaiano - tematiche fiscali/previdenziali) segue questo flusso. **Non saltare passaggi**: il dato sbagliato in un articolo CAF puo causare danni reali al lettore. Regola del progetto: **ZERO INVENZIONI**.

## Stati possibili (frontmatter `status`)

```
draft -> fact-checked -> seo-optimized -> ready -> published
```

In dev e nei preview Vercel (env `SHOW_DRAFTS=true`) tutti gli stati sono visibili. **In produzione solo `ready` e `published` vengono renderizzati** (filtro in `sito/src/utils/articles.ts` funzione `getVisibleArticles`).

## Step-by-step

### 1. Pianificazione

Skill `/plan-month [mese] [anno]` o subagent `editorial-planner`. Genera mappa argomenti basata su scadenze fiscali. Output: `calendar/editorial-calendar.md` aggiornato.

### 2. Scrittura

Skill `/write-article [topic] [tipo]` o subagent `content-writer`. Tipi disponibili: `informativo | scadenza | guida | novita`. Template in `content/_templates/`.

**Output**: file `content/<categoria>/YYYY-MM-DD-slug.md` con `status: draft`, frontmatter completo (vedi schema sotto), 1200-1800 parole.

**Schema frontmatter obbligatorio**:
```yaml
---
title: "..."
slug: "kebab-case-con-keyword"
date: YYYY-MM-DD
last_updated: YYYY-MM-DD
category: "una delle 13 categorie ufficiali"  # vedi [[riferimenti/categorie-blog]]
tags: [...]  # 2-6 tag
meta_description: "150-160 char, deve includere geo-tag (Roma o Vigne Nuove)"
author: "Redazione Centro Pratiche Flaiano"
sources: ["fonte normativa 1", "fonte 2", ...]
status: draft
type: scadenza  # o informativo|guida|novita
deadline: YYYY-MM-DD  # solo per type: scadenza
---
```

### 3. Fact-check (OBBLIGATORIO)

Subagent `fact-checker`. Verifica ogni dato (importi, date, percentuali) contro fonti ufficiali (agenziaentrate.gov.it, inps.it, gazzettaufficiale.it).

**Verdetti possibili**:
- `PUBBLICABILE` → status passa a `fact-checked`
- `PUBBLICABILE CON CORREZIONI` → l'agent applica le correzioni in-place + status `fact-checked`
- `DA RIVEDERE` → l'agent NON modifica status, restituisce errori bloccanti

**Output**: report in `reviews/fact-check-<slug>.md`.

### 4. SEO

Subagent `seo-specialist`. Ottimizza title (<60 char), meta description (150-160 char con geo), H1/H2, tags, internal linking, geo-SEO Roma + zone servite.

**Output**: status `seo-optimized` + report `reviews/seo-<slug>.md` con score /100.

### 5. Pubblicazione

Manuale o automatica:
- `status: published` (pubblicato su praticheflaiano-sito.vercel.app)
- `status: ready` (pronto ma non ancora pushato live - usato raramente)

**Trigger live**: `git push origin <branch>` -> Vercel rebuild automatico (se la integration Git e attiva su Vercel) oppure `vercel --prod` manuale.

### 6. Promozione social (opzionale)

Skill `/create-social [path-articolo]` o subagent `social-media-manager`. Genera post Facebook + messaggio WhatsApp in `social/`.

## Insidie note (gotchas)

### Race condition fact-checker / seo-specialist

Se lanci entrambi in parallelo, possono modificare lo stesso file in `content/` causando conflitti. **Sempre lanciare in sequenza**: fact-checker -> seo-specialist. Se devi parallelizzare, fai SEO solo DOPO che fact-checker ha terminato. Vedi [[lessons/2026-04-race-condition-agent]].

### Stream timeout subagent

Il `content-writer` su articoli lunghi puo andare in timeout (>5 min). Recupero: scrivi tu il file direttamente con i dati gia verificati. Vedi [[lessons/2026-04-stream-timeout-recovery]].

### Articoli invisibili in produzione

Se un articolo `published` non appare sul sito:
1. Verifica `status: published` (non `seo-optimized` ne `ready` per sicurezza)
2. Verifica che Vercel project abbia `rootDirectory: sito` (vedi [[lessons/2026-04-vercel-rootdir-trap]])
3. Verifica che `node sito/scripts/sync-content.mjs` sia stato eseguito (parte del buildCommand)
4. Verifica che il file sia stato `git push` - Vercel triggera solo su push

### Geo-SEO obbligatorio

Ogni articolo deve menzionare Roma 2-3 volte e almeno una zona servita (Vigne Nuove, Tufello, Conca d'Oro, Bufalotta, Porta di Roma, Municipio III). Verifica in fase fact-check.

### Date e norme aggiornate

MAI dare per scontato che una scadenza dell'anno precedente sia uguale quest'anno. Sempre WebSearch + cross-check su 2-3 fonti ufficiali aggiornate.

## Vedi anche

- [[procedure/04-pubblicazione-articolo]] - flusso end-to-end concreto con esempio reale
- [[lessons/2026-04-race-condition-agent]]
- [[lessons/2026-04-stream-timeout-recovery]]
- [[riferimenti/agenti-disponibili]]
- [[riferimenti/skill-progetto]]
- File di governance del progetto: `docs/regole-contenuto.md`, `docs/topic-taxonomy.md`, `docs/audience-personas.md`
