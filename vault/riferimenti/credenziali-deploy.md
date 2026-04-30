---
title: "Riferimento: credenziali e config deploy (placeholder + workflow)"
type: riferimento
tags: [deploy, vercel, github, openrouter, credenziali]
created: 2026-04-28
updated: 2026-04-29
---

# Credenziali e config deploy

> ⚠️ **Niente segreti reali in questo file.** Token Vercel, API keys, chiavi private NON vanno mai committate. Questo file contiene solo IDs pubblici e placeholder.

## GitHub

- **Repo**: https://github.com/praticheflaiano/Varie
- **Owner/Org**: `praticheflaiano`
- **Visibilita**: privata (verificare)
- **Branch produzione**: `main`
- **Branch corrente**: `claude/identify-project-ULhhV`
- **PR draft attiva**: https://github.com/praticheflaiano/Varie/pull/1

## Vercel

- **Team**: `praticheflaianos-projects`
- **Team ID**: `team_3d3wtSuFBvCDAPeG2qcEO8sx`
- **Project name**: `praticheflaiano-sito`
- **Project ID**: `prj_61Xs3AKvE8w2fbTKK7E4MrwgBect`
- **URL produzione**: https://praticheflaiano-sito.vercel.app
- **URL alias**: `praticheflaiano-sito-praticheflaianos-projects.vercel.app`
- **Inspector**: https://vercel.com/praticheflaianos-projects/praticheflaiano-sito
- **Settings**: https://vercel.com/praticheflaianos-projects/praticheflaiano-sito/settings
- **Settings/Git**: https://vercel.com/praticheflaianos-projects/praticheflaiano-sito/settings/git
- **Settings/Tokens dell'utente**: https://vercel.com/account/tokens

### Config attuale del project

| Field | Value |
|---|---|
| `rootDirectory` | `sito` |
| `framework` | `astro` |
| `buildCommand` | `node scripts/sync-content.mjs && astro build && pagefind --site dist` |
| `installCommand` | `npm install` |
| `outputDirectory` | `dist` |
| `ssoProtection` | `null` (production pubblico) |

### Env variables

| Var | Production | Preview | Development |
|---|---|---|---|
| `PUBLIC_SITE_URL` | `https://praticheflaiano-sito.vercel.app` | (preview URL) | `http://localhost:4321` |
| `SHOW_DRAFTS` | `false` | `true` | `true` |

## Token Vercel

⚠️ Mai commitare token reali. Procedura:

1. Crea token usa-e-getta su https://vercel.com/account/tokens
2. Scope: solo team `praticheflaianos-projects`
3. Scadenza: 24h
4. Usa via env var `VERCEL_TOKEN`
5. Revoca dopo l'uso

In una sessione Claude Code, l'utente passa il token via chat (NON in repo). Assistant lo usa solo via shell `export VERCEL_TOKEN='...' && ...` e mai lo scrive in file.

## Booking system esterno

- **Arcanis** (booking widget): https://link.arcanis.it/widget/group/bklXY9sZUszt8V2GpkU1
- **Arcanis remoto**: https://link.arcanis.it/widget/bookings/consulenza_da_remoto

Non gestito da Vercel/repo, e SaaS esterno con account separato (TODO: documentare credenziali Arcanis se serve modifica).

## Domain (futuro go-live)

- `praticheflaiano.it` - dominio finale (oggi serve il sito vecchio)
- Strategia migrazione (vedi piano `che-progetto-c-qui-robust-balloon.md`):
  1. Subdomain `nuovo.praticheflaiano.it` -> Vercel deploy (test)
  2. Switch DNS A/CNAME `praticheflaiano.it` -> Vercel
  3. 301 redirect dagli slug del vecchio sito (mappa da preparare)

## OpenRouter (LLM + image gen via fallback)

- **Dashboard**: https://openrouter.ai
- **Tokens**: https://openrouter.ai/keys
- **Modelli usati**:
  - **Fact-check fallback** (quando subagent Anthropic e bloccato dall'org limit):
    `deepseek/deepseek-chat-v3-0324` — non-reasoning, 163K ctx, ~$0.0002/1K input, ~$0.0006/1K output. Costo per articolo ~$0.002.
  - **Image generation** (OG image articoli blog):
    `google/gemini-3-pro-image-preview` — qualita superiore, ~$0.10/img. **Modello di riferimento per immagini editoriali del Centro**.
    Alternativa economica: `google/gemini-2.5-flash-image` (~$0.04/img) - qualita inferiore ma accettabile.
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions` (compatibile OpenAI)
- **Header obbligatori**: `Authorization: Bearer $OPENROUTER_API_KEY` + `Content-Type: application/json`
- **Header opzionali raccomandati**: `HTTP-Referer: https://praticheflaiano-sito.vercel.app` + `X-Title: Centro Pratiche Flaiano`

### Procedura token OpenRouter

1. Crea token su https://openrouter.ai/keys con limit di spesa basso (es $5)
2. Usa via env var `OPENROUTER_API_KEY`
3. Mai committare in repo
4. Revoca dopo task one-shot

### Script disponibili che usano OpenRouter

- `sito/scripts/factcheck-via-openrouter.py` - fact-check articoli (fallback)
- `sito/scripts/generate-og-via-openrouter.py` - generazione OG image 1200x630 JPEG

Vedi [[lessons/2026-04-org-usage-limit]] e [[lessons/2026-04-image-gen-openrouter-gemini]].

## GitHub PAT per push cross-repo

Il sandbox e whitelistato solo per `praticheflaiano/Varie`. Per pushare verso `domande-disoccupazione-web` o altri repo serve PAT utente:

1. Crea PAT classic su https://github.com/settings/tokens/new
2. Scope minimo: `public_repo` (per repo pubblici dell'utente)
3. Scadenza 24h max
4. Push tramite URL ephemeral:
   ```bash
   git -c "http.proxy=" push \
     "https://x-access-token:${GH_TOKEN}@github.com/owner/repo.git" branch
   ```
5. PR creation via API REST (vedi `[[lessons/2026-04-cross-repo-deploy-sandbox-restricted]]`)
6. Revoca dopo l'uso

## Provider altri servizi

- **Email** (info@praticheflaiano.it): provider attuale TODO
- **Cookie banner / privacy** (Iubenda? altro): TODO
- **Form contatto futuro**: Resend (non ancora settato), Cloudflare Turnstile (non ancora settato)
- **OG image dynamic**: implementato (`scripts/generate-og-via-openrouter.py`), commit asset versionati

## Vedi anche

- [[procedure/02-deploy-vercel]]
- [[lessons/2026-04-vercel-rootdir-trap]]
- [[lessons/2026-04-vercel-sso-protection]]
- [[riferimenti/dati-ufficio]]
