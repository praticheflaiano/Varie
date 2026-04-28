---
title: "Riferimento: credenziali e config deploy (placeholder)"
type: riferimento
tags: [deploy, vercel, github, credenziali]
created: 2026-04-28
updated: 2026-04-28
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

## Provider altri servizi

- **Email** (info@praticheflaiano.it): provider attuale TODO
- **Cookie banner / privacy** (Iubenda? altro): TODO
- **Form contatto futuro**: Resend (non ancora settato), Cloudflare Turnstile (non ancora settato)
- **OG image dynamic**: TODO con Satori

## Vedi anche

- [[procedure/02-deploy-vercel]]
- [[lessons/2026-04-vercel-rootdir-trap]]
- [[lessons/2026-04-vercel-sso-protection]]
- [[riferimenti/dati-ufficio]]
