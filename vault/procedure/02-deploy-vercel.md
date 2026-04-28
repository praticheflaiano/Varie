---
title: "Procedura: deploy Vercel del sito Astro"
type: procedura
tags: [vercel, deploy, astro, produzione]
created: 2026-04-28
related: [[lessons/2026-04-vercel-rootdir-trap]], [[lessons/2026-04-vercel-sso-protection]]
---

# Deploy Vercel del sito praticheflaiano-sito

## Stato attuale (2026-04-28)

- **URL produzione**: https://praticheflaiano-sito.vercel.app
- **Project ID**: `prj_61Xs3AKvE8w2fbTKK7E4MrwgBect`
- **Team**: `praticheflaianos-projects` (`team_3d3wtSuFBvCDAPeG2qcEO8sx`)
- **rootDirectory**: `sito` (CRITICO - vedi sotto)
- **Framework**: Astro (auto-detect)
- **Build command**: `node scripts/sync-content.mjs && astro build && pagefind --site dist` (da `sito/vercel.json`)
- **Output directory**: `dist`

## Quando applicarla

Ogni volta che si vuole pubblicare un cambiamento al sito Astro: nuovo articolo, redesign, fix.

## Modalita di deploy

### Auto-deploy via Git (preferito)

Se la **Git Integration** Vercel e attiva sul progetto, ogni `git push origin main` triggera automaticamente un deploy production. I push su altri branch generano preview deploy.

Verifica integrazione attiva:
```bash
curl -s "https://api.vercel.com/v9/projects/prj_61Xs3AKvE8w2fbTKK7E4MrwgBect?teamId=team_3d3wtSuFBvCDAPeG2qcEO8sx" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | jq '.link'
```

Se `null`, va attivata da dashboard Vercel: project -> Settings -> Git -> Connect.

### Deploy manuale via CLI

Richiede `VERCEL_TOKEN` (da revocare dopo l'uso).

```bash
cd /home/user/Varie  # IMPORTANTE: dalla root del repo, non da sito/
export VERCEL_TOKEN='vcp_...'
npx -y vercel@latest --prod --yes --token="$VERCEL_TOKEN"
```

**Perche dalla root**: il project ha `rootDirectory: sito` - se lanci da `sito/` il CLI cerca `sito/sito/` e fallisce con "path does not exist". Vedi [[lessons/2026-04-vercel-rootdir-trap]].

Se il `.vercel/` link non esiste:
```bash
cd /home/user/Varie
npx -y vercel@latest link --yes \
  --project=praticheflaiano-sito \
  --scope=praticheflaianos-projects \
  --token="$VERCEL_TOKEN"
```

## Configurazione critica del project

### rootDirectory = sito (NON CAMBIARE senza pensarci)

```bash
curl -X PATCH "https://api.vercel.com/v9/projects/prj_61Xs3AKvE8w2fbTKK7E4MrwgBect?teamId=team_3d3wtSuFBvCDAPeG2qcEO8sx" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory":"sito"}'
```

Se `rootDirectory` e `null`, Vercel auto-detecta package.json in `sito/` ma **NON** legge `sito/vercel.json` ne esegue il buildCommand custom -> articoli invisibili in produzione. Vedi [[lessons/2026-04-vercel-rootdir-trap]].

### SSO Protection disattivata su production

Di default i team Vercel hanno **Vercel Authentication** attiva su tutti i deployment (incluso production). Risultato: il sito risponde 503 "Authentication Required" agli utenti pubblici.

Disattivata via API (mantenuta tale da quel momento):
```bash
curl -X PATCH "https://api.vercel.com/v9/projects/prj_61Xs3AKvE8w2fbTKK7E4MrwgBect?teamId=team_3d3wtSuFBvCDAPeG2qcEO8sx" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ssoProtection":null}'
```

Se serve riattivarla solo sui Preview deployments (raccomandato):
```bash
-d '{"ssoProtection":{"deploymentType":"only_preview_deployments"}}'
```

Vedi [[lessons/2026-04-vercel-sso-protection]].

### Variabili d'ambiente

| Var | Valore | Scope |
|---|---|---|
| `PUBLIC_SITE_URL` | `https://praticheflaiano.it` (o preview URL) | production, preview |
| `SHOW_DRAFTS` | `false` in production, `true` in preview | environment-specific |

Da settare via:
```bash
echo "https://praticheflaiano.it" | npx vercel env add PUBLIC_SITE_URL production --token="$VERCEL_TOKEN"
```

## Verifica post-deploy

```bash
sleep 8  # aspetta cold-start su nuovi deploy
for url in "/" "/blog" "/tesseramento" "/llms.txt" "/sitemap-index.xml" "/rss.xml"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://praticheflaiano-sito.vercel.app${url}")
  echo "$code  $url"
done
```

Tutti `200`. Se vedi `503` ripeti dopo 10-15s (cold start). Se persiste 503 dopo 30s -> SSO probabilmente riattivata, vedi sopra.

## Verifica articolo specifico

```bash
curl -s "https://praticheflaiano-sito.vercel.app/blog/<slug>" | \
  grep -oE '(<title>[^<]+</title>|"@type":"Article"|"datePublished":"[^"]+"|"headline":"[^"]+")'
```

Devono apparire `<title>` corretto, `"@type":"Article"` JSON-LD, `datePublished` e `headline`.

## Token Vercel - sicurezza

- **Mai commitare** in repo
- **Scope ristretto**: solo team `praticheflaianos-projects`
- **Scadenza**: 24h massimo per token usa-e-getta
- **Revoca**: https://vercel.com/account/tokens dopo l'uso

## Troubleshooting

| Sintomo | Causa probabile | Fix |
|---|---|---|
| 503 su tutto | SSO Protection attiva | PATCH `ssoProtection: null` |
| 404 su `/blog/<slug>` | rootDirectory mancante o sync-content fallito | PATCH `rootDirectory: sito`; verifica buildCommand |
| Build fallisce su `../content` not found | Working dir Vercel sbagliato | rootDirectory = sito (non `/`) |
| Articoli `review` invisibili anche in preview | `SHOW_DRAFTS=false` in preview | Imposta env `SHOW_DRAFTS=true` su Preview |
| Deploy CLI errore "path does not exist" | CLI lanciato da subdir con rootDirectory configurato | `cd` alla root del repo prima di `vercel --prod` |

## Vedi anche

- [[lessons/2026-04-vercel-rootdir-trap]]
- [[lessons/2026-04-vercel-sso-protection]]
- [[procedure/04-pubblicazione-articolo]]
- File config: `sito/vercel.json`, `sito/scripts/sync-content.mjs`
