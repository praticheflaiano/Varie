---
title: "Lesson: Vercel rootDirectory mancante = articoli invisibili in produzione"
type: lesson
tags: [vercel, deploy, blog, content, debugging]
created: 2026-04-28
related: [[procedure/02-deploy-vercel]], [[procedure/04-pubblicazione-articolo]]
severity: critico
---

# Vercel rootDirectory mancante = articoli invisibili in produzione

## Contesto

Pubblicato il primo articolo `published` sul blog (Precompilata 2026, 28 aprile). Aspettativa: la URL `https://praticheflaiano-sito.vercel.app/blog/precompilata-2026-30-aprile-14-maggio` rispondeva con l'articolo. Realta: 404.

Ironia: i deploy precedenti del sito (28 pagine generate) sembravano funzionare perfettamente (homepage, tesseramento, FAQ, ecc.). Solo gli articoli erano assenti, ma all'epoca **nessun articolo era `published`** quindi nessuno se ne accorgeva.

## Sintomo

- `https://praticheflaiano-sito.vercel.app/blog/precompilata-2026-30-aprile-14-maggio` -> 404
- `https://praticheflaiano-sito.vercel.app/blog/categoria/730-redditi` -> 200 ma elenco vuoto
- `https://praticheflaiano-sito.vercel.app/llms.txt` -> 200 ma SENZA articoli nell'indice
- Build locale (`cd sito && npm run build`) -> 28+ pagine generate INCLUSO l'articolo
- Discrepanza locale/produzione = qualcosa nel build CI Vercel funziona diversamente

## Root cause

Il project Vercel aveva `rootDirectory: null` (auto-detect). Vercel guardava il `package.json` in `sito/` e cambiava working dir li, ma **NON leggeva `sito/vercel.json`** ne eseguiva il `buildCommand` custom.

Significato pratico:
- Il `buildCommand` configurato (`node scripts/sync-content.mjs && astro build && pagefind --site dist`) **non veniva eseguito**
- Il sync-content.mjs **non copiava `../content` in `.content-mirror/`**
- Il loader Astro non trovava i markdown -> `getCollection("articles")` restituiva array vuoto
- L'articolo **non veniva incluso nel build**

L'auto-detect di Vercel rilevava Astro e faceva `npm install && astro build`, ignorando il vercel.json. Il build sembrava verde, ma scartava silenziosamente i contenuti del blog.

Verifica via API:
```bash
curl -s "https://api.vercel.com/v9/projects/<id>?teamId=<team>" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | jq '.rootDirectory'
# Output: null  <-- BUG
```

## Risoluzione

PATCH del project per impostare `rootDirectory: sito`:

```bash
curl -X PATCH "https://api.vercel.com/v9/projects/prj_61Xs3AKvE8w2fbTKK7E4MrwgBect?teamId=team_3d3wtSuFBvCDAPeG2qcEO8sx" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory":"sito"}'
```

**ATTENZIONE collaterale**: dopo aver impostato `rootDirectory`, il `vercel` CLI deve essere lanciato dalla **root del repo** (`/home/user/Varie`), non da `sito/`. Se lanci da `sito/`, il CLI applica rootDirectory al cwd e cerca `sito/sito/` -> errore "path does not exist".

```bash
# CORRETTO
cd /home/user/Varie
npx vercel --prod --token=$VERCEL_TOKEN

# SBAGLIATO (con rootDirectory configurato)
cd /home/user/Varie/sito
npx vercel --prod --token=$VERCEL_TOKEN
# -> Error: The provided path "/home/user/Varie/sito/sito" does not exist
```

Il `.vercel/` link va creato dalla root: `cd /home/user/Varie && vercel link`. Se esisteva uno in `sito/.vercel/` da prima -> rimuovere.

## Lezione astratta

1. **Mai assumere che Vercel auto-detect "fa la cosa giusta"** quando il progetto e in una subdirectory. Sempre impostare `rootDirectory` esplicito.

2. **Build locale verde != build Vercel verde** se la configurazione differisce. Il sync-content.mjs locale girava sempre, su Vercel mai.

3. **Test dopo ogni cambio infra**: dopo aver pubblicato il primo articolo `published`, verificare immediatamente che l'URL risponda. Non aspettare di accumulare 10 articoli per accorgersi.

4. **CLI lanciato da dove conta**: con rootDirectory configurato, il cwd Vercel CLI deve essere la root del repo, non la subdir. Logica controintuitiva.

5. **Diagnostica: confrontare local vs prod**. Se `npm run build` locale produce N pagine ma Vercel solo M < N, il sync-content (o equivalente) non sta girando.

## Verifica permanente

Aggiunto al [[procedure/02-deploy-vercel]]:
- Sezione "Configurazione critica del project" con il PATCH rootDirectory
- Sezione "Troubleshooting" con sintomo "404 su /blog/[slug]"

## Vedi anche

- [[procedure/02-deploy-vercel]]
- [[procedure/04-pubblicazione-articolo]] step 7-8
- File config: `sito/vercel.json`, `sito/scripts/sync-content.mjs`
