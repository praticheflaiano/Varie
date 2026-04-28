---
title: "Procedura: redesign / restyle del sito Astro"
type: procedura
tags: [design-system, frontend, astro, tailwind, css]
created: 2026-04-28
related: [[lessons/2026-04-anthropic-design-bundle]], [[lessons/2026-04-licenza-skill-commerciali]]
---

# Redesign / restyle frontend del sito

## Quando applicarla

Modifiche significative al design system: nuova palette, font, layout hero, componenti. Per piccole tweaks (un colore, un padding) basta editare il singolo file.

## Architettura design system

Tutto vive in `sito/src/`:

| File | Cosa contiene |
|---|---|
| `src/styles/global.css` | Design tokens (`@theme`), reset base, componenti utility (`.btn`, `.pill`, `.card`, `.eyebrow`, ecc.), prose articolo, grain texture |
| `src/layouts/BaseLayout.astro` | Meta SEO, JSON-LD sitewide, font-link, classe `grain` su `<body>` |
| `src/layouts/ArticleLayout.astro` | Layout articolo blog (TOC, breadcrumb, article meta, related, disclaimer, CTA) |
| `src/components/layout/` | Navbar, Footer, MobileMenu (Svelte), Breadcrumb, WhatsAppFab |
| `src/components/ui/` | Primitive: Button, Card, Badge, SectionHeading, Accordion (Svelte) |
| `src/components/home/` | Hero, TrustBar, ServicesGrid, WhyUs, BookingCTA, TesseramentoTeaser, ZoneSection |
| `src/components/illustrations/` | SVG inline custom (Logo, HeroBlob, ZoneMap, FamilyShield, RomaSkyline, DocumentStack) |
| `src/consts.ts` | Single source of truth: contatti, orari, palette nomi, claim |

## Design system attuale: "Adriatic Blue" (2026-04-28)

Implementato dal **bundle handoff Claude Design** consegnato dall'utente via `https://api.anthropic.com/v1/design/h/<hash>`. Vedi [[lessons/2026-04-anthropic-design-bundle]] per come decomprimerlo.

| Token | Valore |
|---|---|
| Primary | `#0A4DA2` (blu Adriatico) |
| Accent | `#18A0D8` (azzurro acqua) |
| Gold | `#E8B547` (ottone caldo) |
| Background | `#EEF3F8` (carta fredda) |
| Display font | Newsreader (variable serif, opensource Google Fonts) |
| Body font | Public Sans (variable sans, opensource) |
| Mono | JetBrains Mono |

3 varianti via `[data-palette]`: default, sky, midnight.

Texture **grain SVG** (noise multiplicativo) sopra il body via classe `.grain` in BaseLayout.

## Quando arriva un nuovo bundle Anthropic Design

1. Decomprimi (vedi [[lessons/2026-04-anthropic-design-bundle]]):
   ```bash
   mkdir -p /tmp/handoff && cd /tmp/handoff
   gunzip < /path/to/bundle.bin | tar -xv
   ```
2. **Leggi `README.md` PRIMA** - dice cosa l'utente ha iterato e quale e il file principale
3. **Leggi `chats/chat1.md`** - dove vive l'intent finale (l'utente puo aver cambiato idea)
4. Identifica i file critici: di solito `project/styles.css` (tokens), `project/index.html` (struttura), `project/hero.jsx` (sezione cardine), `project/chrome.jsx` (header/footer/brand)
5. **Adatta a Astro** invece di copiare il prototype: i bundle sono React+Babel UMD, il sito e Astro. Preserva l'OUTPUT VISIVO, non la struttura interna come da README
6. Non copiare letteralmente codice/asset di skill terze parti senza verificarne la licenza. Vedi [[lessons/2026-04-licenza-skill-commerciali]]

## Flusso di redesign

### 1. Aggiornare design tokens

Modifica `src/styles/global.css` blocco `@theme { --color-..., --font-..., --shadow-... }`. Tailwind v4 li trasforma automaticamente in classi utility.

**Backwards-compat**: se il sito ha gia componenti che usano nomi vecchi (`--color-brand-700`, `--color-accent-400`), mantieni gli alias mappati ai nuovi colori per evitare cascata di edit.

### 2. Aggiornare font

In `src/layouts/BaseLayout.astro`:
- `<link>` Google Fonts (preconnect + preload + stylesheet)
- Variabili font in global.css (`--font-display`, `--font-sans`, `--font-alt`, `--font-mono`)

In dev usa Google Fonts CDN. **In produzione raccomandato self-host woff2 subset latin** (TODO non ancora applicato).

### 3. Aggiornare componenti

- `Navbar.astro`: brand-mark + nav + CTA
- `Footer.astro`: 4 colonne + sub
- `Logo.astro`: SVG inline (oggi monogramma "PF" stile lapide romana)
- `Hero.astro` (in `home/`): la sezione che cambia il "feeling" del sito

### 4. Verifica build

```bash
cd /home/user/Varie/sito
npx astro check    # 0 errors target
npm run build      # 28+ pagine, 0 errori
```

### 5. Smoke test routes

```bash
sleep 8 && for url in "/" "/blog" "/tesseramento" "/servizi/caf" "/contatti" "/llms.txt"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://praticheflaiano-sito.vercel.app${url}")
  echo "$code  $url"
done
```

### 6. Commit + deploy

Vedi [[procedure/02-deploy-vercel]].

## Insidie note

### Tailwind v4 @theme: nomi colore

I colori dichiarati in `@theme { --color-brand-700: ... }` generano automaticamente le classi `bg-brand-700`, `text-brand-700`, `border-brand-700`. Se cambi solo il valore, le classi continuano a funzionare. Se rinomini la chiave (es. `--color-brand-700` -> `--color-primary`), tutte le classi che usavano `bg-brand-700` smettono di funzionare.

**Regola**: in caso di redesign, mantieni gli alias dei nomi vecchi mappati ai nuovi valori almeno fino a una migrazione completa di tutti i componenti.

### `font-display` in Tailwind = Fraunces o Newsreader?

`font-display` in Tailwind v4 mappa alla CSS var `--font-display`. Nel design Adriatic Blue questa e Newsreader. Se in passato era Fraunces e cambi solo il valore, tutte le classi `font-display` esistenti adottano il nuovo font automaticamente.

### SVG inline + currentColor

I componenti illustrazione SVG in `src/components/illustrations/` usano `currentColor` o CSS var (`var(--color-primary)`). Cambiando i token CSS cambiano anche le illustrazioni senza toccare il codice JSX. Mantieni questa pattern.

### Scegli ESPLICITAMENTE quale font rappresenta cosa

Il design system Adriatic Blue ha 3 font:
- `--font-display` (Newsreader serif): titoli, headlines, numeri grandi
- `--font-sans` (Public Sans): body, navigazione, CTA, label
- `--font-alt` (Public Sans alias): eyebrow uppercase, badge, label tracking

Non lasciarli ambigui: se un componente usa `font-display` su una label uppercase, sara serif (sbagliato). Edit a `font-alt` o `font-sans`.

## Vedi anche

- [[lessons/2026-04-anthropic-design-bundle]]
- [[lessons/2026-04-licenza-skill-commerciali]]
- [[procedure/02-deploy-vercel]]
- File chiave: `sito/src/styles/global.css`, `sito/src/layouts/BaseLayout.astro`, `sito/src/components/home/Hero.astro`
