---
title: "Riferimento: slash-skill del progetto (.claude/skills/)"
type: riferimento
tags: [skill, slash-command, reference]
created: 2026-04-28
updated: 2026-04-28
---

# Slash skill del progetto

Le skill vivono in `.claude/skills/` (progetto) e `~/.claude/skills/` (globali utente). Si invocano via `Skill({ skill: "<name>", args: "..." })` o l'utente le usa con `/<name>`.

## Skill del progetto Varie

### `/write-article [argomento] [tipo]`

Genera nuovo articolo informativo/scadenza/guida/novita su un argomento.

**Args**:
- `argomento`: testo libero (es. "Precompilata 730 2026")
- `tipo`: `informativo | scadenza | guida | novita`

**Output**: file in `content/<categoria>/YYYY-MM-DD-slug.md`, status `draft`.

**Internamente**: carica `editorial-planner` + `content-writer` agent.

### `/review-article [percorso-articolo]`

Pipeline completa: fact-check + SEO + checklist finale.

**Obbligatorio prima della pubblicazione**.

**Args**:
- `percorso-articolo`: path al `.md`

**Output**: status `seo-optimized`, report in `reviews/`.

**Internamente**: chiama `fact-checker` agent poi `seo-specialist`.

### `/plan-month [mese] [anno]`

Genera o aggiorna piano editoriale per un mese.

**Args**:
- `mese`: nome italiano (gennaio, febbraio, ...)
- `anno`: 4 cifre (2026)

**Output**: aggiornamento `calendar/editorial-calendar.md`.

### `/create-social [percorso-articolo]`

Crea post Facebook + messaggio WhatsApp da un articolo.

**Solo su articoli `ready` o `published`**.

**Args**:
- `percorso-articolo`: path al `.md`

**Output**: file in `social/`.

### `/update-calendar`

Aggiorna calendario editoriale: marca articoli pubblicati, identifica gap, articoli da aggiornare.

**No args**.

**Output**: aggiornamento `calendar/editorial-calendar.md`.

## Skill globali utente (`~/.claude/skills/`)

Disponibili in tutte le sessioni Claude Code dell'utente:

- `update-config` - configura settings.json
- `keybindings-help` - personalizzare scorciatoie
- `simplify` - review/refactor codice
- `fewer-permission-prompts` - riduce prompt di permission
- `loop` - run skill/prompt periodicamente
- `claude-api` - costruire/debug app con Claude API
- `session-start-hook` - setup hook startup per Claude Code on the web
- `init` - inizializza CLAUDE.md
- `review` - review pull request
- `security-review` - review di sicurezza branch corrente

## Pattern di invocazione

### Da chat utente

L'utente scrive `/write-article tessera 2026 informativo` e la skill parte.

### Da Claude (automatic)

Quando il contesto matcha la skill description, Claude la invoca via `Skill({ skill: "...", args: "..." })`. Solo se la skill compare nell'elenco delle skill disponibili nel system reminder.

## Vedi anche

- [[riferimenti/agenti-disponibili]]
- [[procedure/01-workflow-editoriale]]
- File definizione: `.claude/skills/*.md`
