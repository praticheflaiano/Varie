---
title: "Riferimento: comandi CLI piu usati"
type: riferimento
tags: [cli, snippet, comandi, vercel, git, astro]
created: 2026-04-28
updated: 2026-04-28
---

# Comandi CLI piu usati

## Sito Astro (sito/)

```bash
cd /home/user/Varie/sito

# Dev server
npm run dev                # http://localhost:4321

# Sync content (mirror ../content -> .content-mirror/)
node scripts/sync-content.mjs

# Type/lint check
npx astro check            # 0 errori target

# Build production
npm run build              # 28+ pagine, includes pagefind index

# Preview built site
npm run preview            # serve dist/ localmente

# Build con drafts visibili
SHOW_DRAFTS=true npm run build
```

## Vercel deploy

```bash
# IMPORTANT: lanciare dalla root del repo, non da sito/
cd /home/user/Varie

# Auth
export VERCEL_TOKEN='vcp_...'

# Verifica chi sono
npx -y vercel@latest whoami --token="$VERCEL_TOKEN"
# -> praticheflaiano

# Link project (una volta sola)
npx -y vercel@latest link --yes \
  --project=praticheflaiano-sito \
  --scope=praticheflaianos-projects \
  --token="$VERCEL_TOKEN"

# Deploy production
npx -y vercel@latest --prod --yes --token="$VERCEL_TOKEN"

# Inspect ultimo deploy
npx -y vercel@latest inspect <deploy-url> --token="$VERCEL_TOKEN"

# List recent deployments
npx -y vercel@latest ls praticheflaiano-sito --token="$VERCEL_TOKEN"

# Set env var
echo "value" | npx vercel env add VAR_NAME production --token="$VERCEL_TOKEN"

# Remove env var
echo "y" | npx vercel env rm VAR_NAME production --token="$VERCEL_TOKEN"
```

## Vercel API (PATCH project config)

```bash
PROJECT="prj_61Xs3AKvE8w2fbTKK7E4MrwgBect"
TEAM="team_3d3wtSuFBvCDAPeG2qcEO8sx"

# Read project config
curl -s "https://api.vercel.com/v9/projects/$PROJECT?teamId=$TEAM" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | jq

# Patch rootDirectory
curl -X PATCH "https://api.vercel.com/v9/projects/$PROJECT?teamId=$TEAM" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory":"sito"}'

# Disable SSO Protection
curl -X PATCH "https://api.vercel.com/v9/projects/$PROJECT?teamId=$TEAM" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ssoProtection":null}'
```

## Smoke test produzione

```bash
sleep 8 && for url in "/" "/blog" "/tesseramento" "/servizi/caf" "/contatti" "/llms.txt" "/sitemap-index.xml" "/rss.xml" "/robots.txt"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://praticheflaiano-sito.vercel.app${url}")
  echo "$code  $url"
done
```

## Verifica articolo specifico (JSON-LD + meta)

```bash
SLUG="precompilata-2026-30-aprile-14-maggio"
curl -s "https://praticheflaiano-sito.vercel.app/blog/$SLUG" | \
  grep -oE '(<title>[^<]+</title>|"@type":"(News)?Article"|"datePublished":"[^"]+"|"headline":"[^"]+"|name="description"[^>]+)'
```

## Git per workflow articoli

```bash
# Stato articoli per status
grep -l '^status: published$' content/*/*.md  # gia pubblicati
grep -l '^status: draft$' content/*/*.md       # in scrittura
grep -l '^status: review$' content/*/*.md      # in fact-check (da rivedere)

# Mass set published (con cautela)
for f in content/*/2026-*.md; do
  if grep -q '^status: review$' "$f" && grep -q '^fact_check_date:' "$f"; then
    sed -i 's/^status: review$/status: published/' "$f"
    echo "OK: $f"
  fi
done

# Word count articolo
wc -w content/<categoria>/<file>.md
# Conteggio H2
grep -c '^## ' content/<categoria>/<file>.md
```

## Astro Content Collections

```bash
# Verifica frontmatter di tutti gli articoli
for f in content/*/2026-*.md; do
  echo "=== $f ==="
  grep -E '^(status|category|type|date|slug):' "$f"
done

# Conta articoli per categoria
for d in content/*/; do
  count=$(ls "$d"2026-*.md 2>/dev/null | wc -l)
  echo "$count  $(basename "$d")"
done
```

## Branch e PR

Branch attivo: `claude/identify-project-ULhhV`. Branch produzione: `main` (target dei merge).

```bash
git checkout claude/identify-project-ULhhV
git status
git log --oneline -5

git add <file>
git commit -m "..."
git push origin claude/identify-project-ULhhV

# PR draft (via mcp__github__create_pull_request o gh)
```

## Vault Obsidian

```bash
# Naviga vault
ls /home/user/Varie/vault/

# Cerca nelle note
grep -r "vercel" /home/user/Varie/vault/ --include="*.md" -l

# Conta note per cartella
for d in /home/user/Varie/vault/*/; do
  count=$(ls "$d"*.md 2>/dev/null | wc -l)
  echo "$count  $(basename "$d")"
done
```

## Vedi anche

- [[procedure/02-deploy-vercel]]
- [[procedure/04-pubblicazione-articolo]]
- [[riferimenti/credenziali-deploy]]
