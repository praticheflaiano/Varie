---
title: "Knowledge Base - Centro Pratiche Flaiano"
type: moc
tags: [index, moc]
created: 2026-04-28
---

# Knowledge Base - Centro Pratiche Flaiano

> Mappa di conoscenza centrale del progetto. Vault Obsidian-style: navigazione via wikilink `[[note]]`. Vive nel git repo (`/home/user/Varie/vault/`), persiste tra sessioni Claude Code.

## Cos'e questo vault

Repository di **procedure operative**, **lessons learned** e **riferimenti** per chi (umano o AI) lavora su `praticheflaiano/Varie` e su `praticheflaiano-sito.vercel.app`. Pensato per **ridurre il context-window-burn** delle sessioni: invece di rileggere transcript lunghi, si consultano qui le procedure consolidate.

**Regola d'oro**: prima di affrontare un task gia visto in passato, **leggere la nota di procedura corrispondente**. Se manca, scriverla a fine task.

## Architettura del progetto

`/home/user/Varie/` e un **monorepo** con due anime:

1. **Content management editoriale** (radice): blog markdown, governance, calendario, agenti subagent Claude.
2. **Sito web pubblico** (`sito/`): Astro 5 + Tailwind v4 + Svelte islands, deployato su Vercel come `praticheflaiano-sito.vercel.app`.

I markdown del blog (in `content/`) alimentano il sito tramite **Content Layer API** Astro che legge `../content` con loader `glob`. In CI uno script `sito/scripts/sync-content.mjs` mirrora `content/` in `sito/.content-mirror/` (gitignored) per build deterministica.

## Procedure operative

- [[procedure/01-workflow-editoriale]] - Pipeline draft -> fact-checked -> seo-optimized -> published
- [[procedure/02-deploy-vercel]] - Configurazione Vercel + deploy + risoluzione errori comuni
- [[procedure/03-redesign-frontend]] - Modificare design system del sito Astro (palette, font, componenti)
- [[procedure/04-pubblicazione-articolo]] - Scrivere e pubblicare un nuovo articolo dalla A alla Z
- [[procedure/05-knowledge-base-vault]] - Come mantenere e consultare questo vault

## Lessons learned (errori incontrati e risoluzioni)

- [[lessons/2026-04-vercel-rootdir-trap]] - **CRITICO**: rootDirectory mancante = articoli markdown invisibili in produzione
- [[lessons/2026-04-stream-timeout-recovery]] - Recupero da stream timeout dei subagent Claude
- [[lessons/2026-04-race-condition-agent]] - Race condition tra fact-checker e seo-specialist sullo stesso file
- [[lessons/2026-04-licenza-skill-commerciali]] - Licenze restrittive su skill di terze parti (huashu-design)
- [[lessons/2026-04-anthropic-design-bundle]] - Decompressione e uso del bundle handoff Claude Design (api.anthropic.com/v1/design)
- [[lessons/2026-04-vercel-sso-protection]] - Vercel team SSO protection blocca production di default
- [[lessons/2026-04-org-usage-limit]] - Org monthly usage limit raggiunto durante mass-production batch di subagent
- [[lessons/2026-04-isee-dsu-prima-presentazione-gratuita]] - ISEE/DSU al CAF: prima presentazione gratuita (convenzione INPS-CAF)
- [[lessons/2026-04-cross-repo-deploy-sandbox-restricted]] - **Push verso repo non-whitelisted dal sandbox: bypass proxy + token utente usa-e-getta**
- [[lessons/2026-04-anti-ripetizione-due-siti]] - **Anti-ripetizione tra siti distinti del brand: pattern "mappa vs dettaglio"**

## Riferimenti rapidi

- [[riferimenti/agenti-disponibili]] - Subagent Claude Code del progetto (.claude/agents/)
- [[riferimenti/skill-progetto]] - Skill slash-command (.claude/skills/)
- [[riferimenti/comandi-veloci]] - Snippet CLI piu usati (vercel, git, astro, sync-content)
- [[riferimenti/dati-ufficio]] - Dati di contatto, orari, zone, social del Centro Pratiche Flaiano
- [[riferimenti/credenziali-deploy]] - Token, project IDs Vercel, repo GitHub (placeholder, niente segreti)
- [[riferimenti/naspi-mappa-codici-importi]] - **NASpI 2026: codici UNILAV, importi, requisiti, scadenze + cluster contenuto cross-site**

## Template

- [[template/procedura-template]] - Schema standard per nuove procedure
- [[template/lesson-template]] - Schema standard per nuove lessons learned

## Convenzioni

**Naming**:
- `procedure/NN-titolo-kebab.md` (NN = ordine logico, non data)
- `lessons/YYYY-MM-titolo-kebab.md` (con data per cronologia)
- `riferimenti/titolo-kebab.md` (sempre attuali, no data)
- `template/titolo-template.md`

**Frontmatter standard**:
```yaml
---
title: "Titolo leggibile"
type: procedura | lesson | riferimento | template | moc
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD  # solo se modificata
related: [[nota1]], [[nota2]]
---
```

**Wikilink**: `[[procedure/02-deploy-vercel]]` (path completo da vault root, senza `.md`).

**Sezioni standard**:
1. Contesto / quando applicabile
2. Procedura step-by-step / cosa successo
3. Risultato atteso / risoluzione applicata
4. Insidie note (gotchas)
5. Vedi anche (link a note correlate)

## Come consultare questo vault da una nuova sessione Claude Code

1. Leggere `vault/00-INDEX.md` (questo file) come **primo step** in ogni nuova sessione
2. Identificare la nota pertinente al task corrente
3. Leggere SOLO la nota pertinente (no rilettura del transcript)
4. Eseguire il task
5. Se durante l'esecuzione si incontra un caso non documentato -> aggiornare/creare nota
6. Commit + push delle modifiche al vault

## Aggiornamenti

Ogni modifica significativa al sito, al workflow o ai tool va riflessa in una nota di procedura o lesson. Il vault e **fonte di verita operativa**: se qualcosa cambia, il vault va aggiornato prima del prossimo deploy.

---

*Vault creato: 2026-04-28. Manutenuto da Claude Code + redazione Centro Pratiche Flaiano.*
