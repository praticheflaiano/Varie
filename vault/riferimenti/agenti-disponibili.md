---
title: "Riferimento: subagent Claude Code disponibili nel progetto"
type: riferimento
tags: [agent, subagent, reference]
created: 2026-04-28
updated: 2026-04-28
---

# Subagent Claude Code disponibili

I subagent vivono in `.claude/agents/` e si invocano con il tool `Agent({ subagent_type: "...", description: "...", prompt: "..." })`.

## content-writer

**Scopo**: Scrive nuovi articoli per il blog su tematiche fiscali/previdenziali.

**Tools**: `Read, Write, Edit, Glob, Grep, WebFetch, WebSearch`

**Quando usarlo**:
- Creazione nuovo articolo (tipo informativo/scadenza/guida/novita)
- Riscrittura articolo esistente

**Insidie**: stream timeout su prompt lunghi (>1500 token). Vedi [[lessons/2026-04-stream-timeout-recovery]].

## fact-checker

**Scopo**: Verifica accuratezza normativa di un articolo prima della pubblicazione.

**Tools**: `Read, Edit, Glob, Grep, WebFetch, WebSearch`

**Quando usarlo**: dopo content-writer, sempre. Nessun articolo va `published` senza fact-check.

**Output**: report in `reviews/fact-check-<slug>.md` (a volte restituisce inline come messaggio - in quel caso scrivilo tu).

## seo-specialist

**Scopo**: Ottimizza SEO di un articolo gia fact-checked.

**Tools**: `Read, Edit, Glob, Grep, WebSearch`

**Quando usarlo**: dopo fact-checker. **Mai in parallelo** (race condition - vedi [[lessons/2026-04-race-condition-agent]]).

**Output**: status -> `seo-optimized`, report in `reviews/seo-<slug>.md` con score /100.

## editorial-planner

**Scopo**: Pianifica calendario editoriale mensile basandosi su scadenze fiscali, gap di contenuto, esigenze stagionali.

**Tools**: `Read, Write, Edit, Glob, Grep, WebFetch, WebSearch`

**Quando usarlo**: inizio mese o per rivedere strategia editoriale.

**Output**: aggiornamento di `calendar/editorial-calendar.md`.

## social-media-manager

**Scopo**: Crea post Facebook + messaggi WhatsApp da un articolo.

**Tools**: `Read, Write, Glob, Grep`

**Quando usarlo**: dopo che un articolo ha raggiunto status `ready` o `published`.

**Output**: file in `social/`.

## Subagent generici (non specifici al progetto)

- **general-purpose**: ricerche complesse, multi-step, fall-back generale
- **Explore**: ricerca read-only veloce su file/keyword (ottimo per "dove e definito X")
- **Plan**: design implementazione (ritorna piani step-by-step)
- **claude-code-guide**: domande su Claude Code, Claude Agent SDK, Claude API
- **statusline-setup**: configurare status line di Claude Code

## Pattern di invocazione

### Sequenziale (workflow editoriale)

```js
// 1. Content writer (sync, blocca finche non finisce)
Agent({
  subagent_type: "content-writer",
  description: "Articolo X",
  prompt: "..."
})
// aspetto risultato
// 2. Fact-checker
Agent({ subagent_type: "fact-checker", ... })
// aspetto
// 3. SEO
Agent({ subagent_type: "seo-specialist", ... })
```

### Background (long-running, non-blocking)

```js
Agent({
  subagent_type: "fact-checker",
  description: "...",
  prompt: "...",
  run_in_background: true
})
// Continuo con altro lavoro
// Aspetto la `task-notification` con status: completed
```

**ATTENZIONE**: in background, evita di lanciare due agent che modificano lo stesso file.

### Continuare un agent timeoutato

```js
SendMessage({
  to: "<agentId>",
  message: "Riprendi dal punto dove eri arrivato. ..."
})
```

## Vedi anche

- [[procedure/01-workflow-editoriale]]
- [[procedure/04-pubblicazione-articolo]]
- [[lessons/2026-04-race-condition-agent]]
- [[lessons/2026-04-stream-timeout-recovery]]
- File definizione: `.claude/agents/*.md`
