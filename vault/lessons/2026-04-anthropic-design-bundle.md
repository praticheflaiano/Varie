---
title: "Lesson: decompressione e uso del bundle handoff Anthropic Design"
type: lesson
tags: [design, anthropic, handoff, bundle, gzip, tar]
created: 2026-04-28
related: [[procedure/03-redesign-frontend]], [[lessons/2026-04-licenza-skill-commerciali]]
severity: medio
---

# Bundle handoff Anthropic Design (api.anthropic.com/v1/design/h/<hash>)

## Contesto

L'utente ha condiviso un URL del tipo:
```
https://api.anthropic.com/v1/design/h/pMKpC0WDZNfft9GakTe3VA?open_file=index.html
```

con l'istruzione "Fetch this design file, read its readme, and implement the relevant aspects".

E un **bundle di handoff** dal tool Claude Design (claude.ai/design) verso un coding agent. L'utente ha mockato un design HTML/CSS/JSX in claude.ai/design e poi esportato il bundle perche io lo implementi nel codebase reale.

## Sintomo iniziale (cosa NON funziona)

WebFetch sull'URL restituisce:
```
[Binary content (application/gzip, 42.5KB) also saved to /root/.claude/projects/.../tool-results/webfetch-<id>.bin]
```

Il modello AI di WebFetch dice "content corrupted, encoded, or compressed" e suggerisce alternative. Trappola: l'output binario E utilizzabile, basta accedere al file salvato.

## Decompressione

Il bundle e **gzip + tar** (formato `.tar.gz`):

```bash
BIN="/root/.claude/projects/<project-id>/tool-results/webfetch-<id>.bin"
file "$BIN"
# -> gzip compressed data, original size modulo 2^32 160256

mkdir -p /tmp/handoff && cd /tmp/handoff
gunzip < "$BIN" > bundle.tar
tar -xf bundle.tar
ls
```

Output:
```
<project-name>/
  README.md
  chats/chat1.md
  project/
    app.jsx
    chrome.jsx
    design-canvas.jsx
    hero.jsx
    icons.jsx
    index.html
    portraits.jsx
    sections-1.jsx
    sections-2.jsx
    sections-3.jsx
    styles.css
    tweaks-panel.jsx
```

Il `<project-name>` e impostato dall'utente in claude.ai/design (es. `praticheflaiano-it`).

## Struttura tipica

| File | Cosa |
|---|---|
| `README.md` | Istruzioni handoff per coding agent. **Leggere PER PRIMO** |
| `chats/chat1.md` | Transcript della sessione design - dove vive l'INTENT FINALE (l'utente puo aver iterato cambiando idea) |
| `project/index.html` | Entry point, monta i jsx via Babel UMD |
| `project/styles.css` | Design tokens (`:root { --color-... }`), componenti utility (`.btn`, `.card`, `.pill`, `.eyebrow`, `.grain`), header/footer |
| `project/hero.jsx` | Sezione cardine (di solito il pezzo che cambia il "feeling") |
| `project/chrome.jsx` | Header + Footer + brand mark |
| `project/sections-N.jsx` | Sezioni della home (services, trust, faq, ecc.) |
| `project/icons.jsx` | Set icone custom |
| `project/portraits.jsx` | Generatore SVG ritratti staff |
| `project/tweaks-panel.jsx` | UI panel per cambiare tema/density/tono in live |
| `project/design-canvas.jsx` | Pagina con multiple varianti hero affiancate (per A/B) |

## Linee guida del README (riassunte)

1. **Read chat transcripts FIRST** - l'intent vive nei chat, non solo nel codice
2. Read primary design file top-to-bottom, follow its imports
3. Bundle e **prototype HTML/CSS/JS**, non production code
4. **Recreate visually**, don't copy structure - implementa nel framework target
5. Don't render in browser / take screenshots - leggi codice, basta

## Workflow di implementazione

### 1. Estrai e leggi

```bash
# Estrazione (vedi sopra)
# Leggi README e chat completi
```

### 2. Estrai design tokens

Da `project/styles.css`: copia-adatta `:root {...}` come `@theme {...}` Tailwind v4 nel `sito/src/styles/global.css`. Mantieni alias dei nomi vecchi se ci sono componenti gia esistenti che li usano.

### 3. Estrai font

Dal `<link>` Google Fonts in `index.html` -> aggiorna `src/layouts/BaseLayout.astro`.

### 4. Componenti utility

Le classi `.btn`, `.pill`, `.card`, `.eyebrow`, `.grain` di styles.css vanno in `@layer components` del global.css. Sono pure CSS, no React, copiabili senza adattamento.

### 5. Hero

Riscrivi `src/components/home/Hero.astro` adattando `project/hero.jsx`. Il Hero del bundle usa React.useState + React refs - in Astro statico non serve interattivita, semplifica a JSX puro statico (Astro convertira in HTML).

Le illustrazioni SVG inline le copi paro (sono solo path).

### 6. Brand glyph + Logo

Da `project/chrome.jsx` -> `BrandMark` -> nuovo `src/components/illustrations/Logo.astro` con il monogramma SVG.

### 7. Navbar e Footer

`Header` di chrome.jsx -> `src/components/layout/Navbar.astro`. Mantieni link al routing Astro reale, non agli `#anchor` del prototype.

### 8. Sezioni opzionali

`sections-1/2/3.jsx` contengono ticker, "Come funziona", recensioni Google, staff portraits, FAQ accordion, lead form, CTA. Sono **opzionali** per la prima iterazione: porta solo l'hero + chrome + tokens, poi pubblica e itera con l'utente. Vale la pena segnalare cosa NON e stato portato.

## Insidie note

- **Bundle e prototype, non production**: usa `unpkg.com/react@18 + babel/standalone`. Non installare quelle deps nel progetto target. Riscrivi in framework target.
- **`script type="text/babel"` non e production-ready**: lo si vede nel bundle, ma non e adatto al sito reale. Astro compila JSX/Svelte alla build.
- **Color values hard-coded nei JSX**: il prototype puo avere colori inline `#0A4DA2`. Sostituisci con CSS var `var(--color-primary)` per ereditare il tema.
- **`React.useState` per tweaks**: il `tweaks-panel.jsx` usa state React per cambiare `data-palette` e `data-density` su `<body>`. In Astro fai un'isola Svelte minimale con `client:idle` se vuoi questa feature, oppure NON portarla nella v1 e lascia il tema fisso.

## Differenza con skill di terze parti

A differenza di [[lessons/2026-04-licenza-skill-commerciali]], questi bundle sono **del cliente stesso** (l'utente li ha generati per il SUO progetto). Uso libero per quel progetto. Sempre verificare comunque eventuali asset di terzi referenziati nel bundle (font, icone) - di solito Google Fonts open source, ma non si sa mai.

## Lezione astratta

1. **WebFetch su URL Anthropic interni puo restituire binari gzip**. Non scartare il file salvato - decomprimi.

2. **README + chats sono fonte primaria di intent**, non il codice. Leggi nell'ordine giusto.

3. **Pattern Astro + bundle React**: tokens + utility CSS si copiano puri; JSX si traduce in `.astro`/`.svelte` semplificando l'interattivita non necessaria.

4. **MVP first**: porta hero + chrome + tokens, deploya, itera. Non bloccarti su sections-3.jsx.

## Vedi anche

- [[procedure/03-redesign-frontend]]
- [[lessons/2026-04-licenza-skill-commerciali]]
- Tool: WebFetch (output salvato in `tool-results/`)
- Format docs: gzip + tar standard
