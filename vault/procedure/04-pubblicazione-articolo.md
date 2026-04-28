---
title: "Procedura: pubblicare un nuovo articolo dalla A alla Z"
type: procedura
tags: [workflow, articolo, pubblicazione, deploy]
created: 2026-04-28
related: [[procedure/01-workflow-editoriale]], [[procedure/02-deploy-vercel]]
---

# Pubblicare un nuovo articolo dalla A alla Z

## Quando applicarla

L'utente chiede "scrivi e pubblica un articolo su X". Workflow end-to-end concreto, riproducibile.

## Esempio reale: Precompilata 2026 (28 aprile 2026)

### Step 1 - Verifica fonti ufficiali (zero invenzioni)

```
WebSearch query: "argomento + anno + parole chiave specifiche"
allowed_domains: ["agenziaentrate.gov.it", "inps.it", "fiscoetasse.com",
                  "informazionefiscale.it", "ipsoa.it", "ilsole24ore.com",
                  "fiscooggi.it", "gazzettaufficiale.it", "lavoroediritti.com"]
```

Annota le date, importi, riferimenti normativi PRECISI. Se trovi conflitti tra fonti, prevale agenziaentrate.gov.it / inps.it / gazzettaufficiale.it.

### Step 2 - Lancia content-writer subagent

```
Agent({
  subagent_type: "content-writer",
  description: "Articolo [tema]",
  prompt: "Scrivi articolo tipo [scadenza|guida|informativo|novita] su [tema].
           DATI VERIFICATI (regola ZERO invenzioni):
           - data X
           - importo Y
           - riferimento Z
           Salva in `content/<categoria>/YYYY-MM-DD-slug.md`
           Frontmatter completo, 1200-1800 parole, tipo XYZ.
           Vincoli: lunghezza, geo-SEO, tag, internal links.
           ..."
})
```

**Se l'agent va in stream timeout** (>5 min, vedi [[lessons/2026-04-stream-timeout-recovery]]): scrivi tu il file usando il template `content/_templates/article-<tipo>.md` con i dati gia verificati. E piu rapido che continuare l'agent.

### Step 3 - Fact-check

```
Agent({
  subagent_type: "fact-checker",
  description: "Fact-check articolo [tema]",
  prompt: "Verifica articolo `<path>`. Confronta ogni dato con fonti ufficiali.
           Applica correzioni minori in-place, status -> fact-checked.
           Salva report in `reviews/fact-check-<slug>.md`."
})
```

L'agent puo restituire il report **come messaggio invece di file** (succede): in quel caso, scrivilo tu in `reviews/`. Il file in `reviews/` serve a tracciare la due diligence.

### Step 4 - SEO

```
Agent({
  subagent_type: "seo-specialist",
  description: "SEO articolo [tema]",
  prompt: "Ottimizza SEO `<path>`. Title <60 char con keyword + brand.
           Meta description 150-160 char con geo (Roma/Vigne Nuove).
           Status -> seo-optimized. Report in `reviews/seo-<slug>.md`."
})
```

**ATTENZIONE race condition**: NON lanciare fact-checker e seo-specialist in parallelo. Sequenza obbligata. Vedi [[lessons/2026-04-race-condition-agent]].

### Step 5 - Status published

```bash
sed -i 's/^status: seo-optimized$/status: published/' content/<categoria>/YYYY-MM-DD-slug.md
# Verifica:
grep '^status:' content/<categoria>/YYYY-MM-DD-slug.md
```

### Step 6 - Commit + push

```bash
cd /home/user/Varie
git add content/<categoria>/YYYY-MM-DD-slug.md \
        reviews/fact-check-<slug>.md \
        reviews/seo-<slug>.md
git commit -m "Pubblica articolo <titolo>

Workflow completato: draft -> fact-checked (0 errori, X correzioni applicate)
-> seo-optimized (score Y/100) -> published.

Fonti: <citate>.

https://claude.ai/code/session_..."
git push origin <branch>
```

### Step 7 - Redeploy Vercel (se Git Integration NON attiva)

Se la Git Integration di Vercel e attiva, il push triggera deploy automatico (~1-2 min). Altrimenti:

```bash
cd /home/user/Varie  # IMPORTANTE: dalla root, non da sito/
export VERCEL_TOKEN='vcp_...'
npx -y vercel@latest --prod --yes --token="$VERCEL_TOKEN"
```

### Step 8 - Verifica live

```bash
sleep 8 && for url in "/" "/blog" "/blog/<slug>" "/blog/categoria/<categoria>" "/rss.xml"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://praticheflaiano-sito.vercel.app${url}")
  echo "$code  $url"
done
```

Verifica JSON-LD nell'HTML servito:
```bash
curl -s "https://praticheflaiano-sito.vercel.app/blog/<slug>" | \
  grep -oE '(<title>[^<]+</title>|"@type":"(News)?Article"|"datePublished":"[^"]+"|"headline":"[^"]+")'
```

### Step 9 (opzionale) - Promozione social

Skill `/create-social content/<categoria>/YYYY-MM-DD-slug.md` o subagent `social-media-manager`. Genera post Facebook + WhatsApp in `social/`.

## Pubblicazione in massa (piu articoli gia in `review`)

Per articoli che sono gia stati fact-checked nel passato (status `review` con `fact_check_date` nel frontmatter):

```bash
for f in content/*/2026-*.md; do
  if grep -q '^status: review$' "$f"; then
    sed -i 's/^status: review$/status: published/' "$f"
    echo "Pubblicato: $f"
  fi
done
git add content/
git commit -m "Pubblica in massa articoli gia fact-checked"
git push
```

ATTENZIONE: prima di farlo verifica almeno il frontmatter di ogni articolo (`fact_check_date`, `fact_check_result: PUBBLICABILE`). Se manca, l'articolo **non e stato fact-checked** e va passato per il workflow completo.

## Insidie note

- **Articolo pubblicato non visibile**: vedi [[lessons/2026-04-vercel-rootdir-trap]]
- **Stream timeout content-writer**: vedi [[lessons/2026-04-stream-timeout-recovery]]
- **Race condition agent**: vedi [[lessons/2026-04-race-condition-agent]]
- **Geo-SEO mancante**: in fact-check segna come ATTENZIONE; in SEO l'agent aggiunge

## Vedi anche

- [[procedure/01-workflow-editoriale]] - panoramica del workflow
- [[procedure/02-deploy-vercel]] - dettagli deploy
- [[riferimenti/agenti-disponibili]]
- [[riferimenti/skill-progetto]]
