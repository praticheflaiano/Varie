# Sito Centro Pratiche Flaiano

Sito web pubblico del Centro Pratiche Flaiano (CAF UNSIC + Patronato ENASC, Roma Vigne Nuove).
Costruito con **Astro 5 + Tailwind CSS v4 + Svelte islands + MDX + Pagefind**.

I contenuti del blog provengono dalla cartella `../content/` del repo (gestita dal workflow editoriale Claude Code: `/write-article`, `/review-article`, ecc.). Il sito e' un consumer dei file markdown gia' esistenti, **non duplica nulla**.

## Setup

```bash
cd sito
npm install
npm run dev
```

Aperto su [http://localhost:4321](http://localhost:4321).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Server di sviluppo con hot reload |
| `npm run build` | Sync content + build statico in `dist/` + indicizzazione Pagefind |
| `npm run preview` | Anteprima del build |
| `npm run check` | Astro check (errori type/template) |
| `npm run type-check` | `tsc --noEmit` |
| `npm run sync-content` | Mirror manuale di `../content/` -> `.content-mirror/` |

## Architettura

- `src/consts.ts` - **single source of truth** per indirizzo, telefoni, orari, URL Arcanis, zone, social, disclaimer.
- `src/content.config.ts` - schema Zod del frontmatter + loader glob su `../content` (in dev) o `.content-mirror` (in CI).
- `src/layouts/BaseLayout.astro` - meta SEO, JSON-LD sitewide, navbar, footer.
- `src/pages/` - route file-based.
- `src/components/` - design system (layout, ui, seo, home, services, blog, tesseramento, contatti, illustrations).
- `public/` - asset statici (fonts, immagini, robots.txt, llms.txt).
- `scripts/sync-content.mjs` - copia `../content/` in `.content-mirror/` per build deterministica.

## Variabili ambiente

Vedi `.env.example`. In dev creare `.env.local` con i valori pubblici. I segreti (Resend, Turnstile secret) vanno solo nelle env Vercel.

## Deploy su Vercel

**1) Setup iniziale (una volta sola, da fare dalla dashboard Vercel):**

1. Vai su https://vercel.com/new
2. Importa il repository `praticheflaiano/Varie`
3. **Importante**: nelle impostazioni del progetto imposta:
   - **Root Directory**: `sito`
   - **Framework Preset**: Astro (auto-detect)
   - Build/install/output sono gia presenti in `sito/vercel.json`, non toccare
4. **Variabili d'ambiente da settare in Vercel**:
   - `PUBLIC_SITE_URL` = `https://praticheflaiano.it` (o il dominio scelto)
   - `SHOW_DRAFTS` = `false` in Production, `true` nei Preview (mostra articoli in review)
   - quando si aggiungera il form contatto: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`
5. Branch di produzione: `main`. I push su altri branch generano preview deploy automatici.
6. **Dominio**: nelle impostazioni del progetto -> Domains, aggiungi prima `nuovo.praticheflaiano.it` (subdominio sicuro per testing). Dopo aver verificato tutto, switch DNS finale su `praticheflaiano.it`.

**2) Deploy automatico:**

Una volta collegato il repo, ogni `git push` su `main` (o merge di una PR) deploya in produzione. I push su altri branch generano un Preview URL (es. `praticheflaiano-git-xxx.vercel.app`).

**3) Deploy manuale via CLI** (alternativa, richiede `VERCEL_TOKEN`):

```bash
cd sito
npx vercel --prod --token=$VERCEL_TOKEN
```

## Workflow editoriale (invariato)

Gli articoli vivono in `../content/<categoria>/YYYY-MM-DD-slug.md`. Il sito mostra in produzione solo gli articoli con `status: ready | published`. In dev (e nei preview con `SHOW_DRAFTS=true`) sono visibili anche `draft`, `review`, `fact-checked`, `seo-optimized`.
