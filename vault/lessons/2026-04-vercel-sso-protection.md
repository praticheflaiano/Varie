---
title: "Lesson: Vercel team SSO protection blocca production di default"
type: lesson
tags: [vercel, sso, deploy, security]
created: 2026-04-28
related: [[procedure/02-deploy-vercel]]
severity: alto
---

# Vercel Deployment Protection (SSO) blocca production di default

## Contesto

Primo deploy production riuscito (status `READY`), ma tutte le URL pubbliche rispondono `503 Authentication Required`.

## Sintomo

```bash
curl -s -o /dev/null -w "%{http_code}" "https://praticheflaiano-sito.vercel.app/"
# -> 503
```

`vercel inspect <deploy-url>` mostra status "Ready" ma il sito non e accessibile pubblicamente.

## Root cause

I team account Vercel hanno **Vercel Authentication** (SSO Protection) attiva di default su **tutti i deployment**, incluso production. La protection forza login al team Vercel prima di servire qualsiasi pagina.

Verifica via API:
```bash
curl -s "https://api.vercel.com/v9/projects/<id>?teamId=<team>" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('ssoProtection:', d.get('ssoProtection'))"
# Output: {'deploymentType': 'all_except_custom_domains'}
```

`all_except_custom_domains` significa: tutti i deploy `*.vercel.app` sono protetti, solo i custom domain (es. `praticheflaiano.it` quando configurato) bypassano. Senza custom domain, tutto e bloccato.

## Risoluzione

Disattivata via API:
```bash
curl -X PATCH "https://api.vercel.com/v9/projects/<id>?teamId=<team>" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ssoProtection":null}'
```

Effetto: tutti i deployment (inclusi production e preview) diventano pubblicamente accessibili senza auth.

Dopo 5-15 secondi (cold start nuovo config) le URL rispondono 200.

## Configurazioni alternative

```json
// SSO solo sui Preview (raccomandato per progetti con preview privati)
{"ssoProtection": {"deploymentType": "only_preview_deployments"}}

// SSO su tutto (default team accounts)
{"ssoProtection": {"deploymentType": "all_except_custom_domains"}}

// Niente SSO ovunque
{"ssoProtection": null}
```

Per Pratiche Flaiano (sito CAF pubblico) -> `null` (zero protezione).

## Lezione astratta

1. **Default sicuro != default desiderato**. I team Vercel mettono SSO Protection per evitare leak di branch interni, ma per siti vetrina pubblici e l'opposto di quello che serve.

2. **Verifica sempre la configurazione del project dopo il primo deploy**, non assumere che le default siano giuste.

3. **API patch e tuo amico**: la dashboard Vercel ha l'opzione, ma via curl + jq e piu rapido e replicabile.

4. **Diagnostica 503**: non e sempre un errore di build. Su Vercel un 503 con cold-start lungo o costante = quasi sempre Deployment Protection attiva.

## Verifica futura

Aggiunto a [[procedure/02-deploy-vercel]] sezione "Configurazione critica del project".

## Custom domain quando arriva

Quando il dominio `praticheflaiano.it` sara puntato su Vercel:
- Custom domain -> bypass automatico SSO (anche se attiva con `all_except_custom_domains`)
- Possiamo riattivare SSO solo su preview deployments (`only_preview_deployments`)
- I preview restano privati al team, production sul custom domain resta pubblico

## Vedi anche

- [[procedure/02-deploy-vercel]]
- Vercel docs: https://vercel.com/docs/deployment-protection
