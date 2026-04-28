# Patch: Brand unification del portale NASpI

**Origine**: `praticheflaiano/domande-disoccupazione-web` branch `claude/brand-unification-adriatic-blue`
**Data**: 2026-04-28
**Generato da**: sandbox Claude Code che non aveva credenziali GitHub per il repo NASpI

## Cosa fa

Allinea il design system del portale NASpI (https://domandedisoccupazione.it) al sito principale (https://praticheflaiano-sito.vercel.app):

- Palette **Adriatic Blue** (brand `#0A4DA2`, accent `#18A0D8`, gold `#E8B547`)
- Font **Newsreader** (display serif) + **Public Sans** (body) + **JetBrains Mono**
- Texture **grain SVG** per togliere "aria template"
- Cross-link sempre visibile al sito principale (topbar + footer)

Modifica 6 file:
- `tailwind.config.js`
- `src/index.css`
- `src/layouts/Base.astro`
- `src/components/SiteHeader.astro`
- `src/components/Footer.tsx`
- `src/constants.ts`

Build verificato: 40 pagine generate, 0 errori. Tutte le feature funzionali (calcolatori NASpI, OCR INPS, guide, news) restano intatte - sono solo modifiche estetiche.

## Come applicarla (sul tuo PC con accesso al repo)

```bash
# 1. Clone (se non gia in locale)
git clone https://github.com/praticheflaiano/domande-disoccupazione-web.git
cd domande-disoccupazione-web

# 2. Branch nuovo da main
git checkout main && git pull
git checkout -b claude/brand-unification-adriatic-blue

# 3. Applica il patch
git am /percorso/locale/al/file/brand-unification-naspi.patch

# 4. Verifica build
npm install
npm run build
# -> 40 pagine, 0 errori

# 5. Push
git push -u origin claude/brand-unification-adriatic-blue

# 6. Crea PR draft sul GitHub e mergia in main quando ok.
```

## Verifica visiva post-merge

Dopo che Vercel ha rebuildato `domandedisoccupazione.it`:

- Topbar in alto: scura con link "Torna al sito principale Pratiche Flaiano"
- Background: `#EEF3F8` (tinta Adriatic Blue) invece del vecchio `slate-50`
- H1/H2: in serif Newsreader (italic possibile)
- Active state nav: blu Adriatico `#0A4DA2`
- CTA "Richiedi Online": stesso blu invece del verde-acqua precedente
- Footer: sezione cross-link al sito principale con CTA gold prominent
- Footer color: `#0C1B2E` (brand-950) invece di slate-900

## Cross-link bidirezionale: status

| Direzione | Status | Live |
|---|---|---|
| Sito principale → portale NASpI | ✅ Live | https://praticheflaiano-sito.vercel.app (commit 9c1baad) |
| Portale NASpI → sito principale | ⏳ In attesa applicazione patch | - |

## Sicurezza

Il patch e un text file - puoi ispezionarlo prima di applicarlo:

```bash
cat brand-unification-naspi.patch | less
```

Sono 618 righe di diff, principalmente CSS/Tailwind/markup. Niente API keys, niente segreti.

## Vedi anche

- Plan completo: `/root/.claude/plans/che-progetto-c-qui-robust-balloon.md`
- Lesson sul cross-repo deployment: TODO se serve
- File originale: `vault/_attachments/brand-unification-naspi.patch`
