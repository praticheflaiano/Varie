---
title: "Lesson: le API GHL rifiutano lo user-agent predefinito di Python (Cloudflare 1010)"
type: lesson
tags: [ghl, cloudflare, python, stima-pensione]
created: 2026-11-12
related: [[procedure/06-stima-pensione]]
severity: alto
---

# Le API GHL rifiutano lo user-agent predefinito di Python

## Contesto

Collegamento della Stima pensione al CRM (`sito/api/_pensione/crm.py`), chiamate con `urllib.request` verso
`https://services.leadconnectorhq.com`. Token GHL inserito il 12/11/2026.

## Sintomo

Nei log Vercel ogni chiamata dava `crm: contatto non riuscito, HTTP 403`: in GHL nessun contatto, opportunità, nota o email.
Sembrava un problema di permessi del token, ma non lo era.

## Root cause

Cloudflare davanti alle API GHL blocca lo user-agent `Python-urllib/3.x` (risposta 403 con corpo
"Error 1010: Access denied"). La richiesta non arriva nemmeno a GHL, quindi il token non viene letto.
Con un user-agent qualsiasi diverso la stessa richiesta riceve la risposta vera di GHL (es. 401 con un token sbagliato).

## Risoluzione applicata

Intestazione `user-agent: praticheflaiano-stima-pensione/1.0 (+https://praticheflaiano.it)` in `_api()` di `crm.py`.

Verifica rapida, senza token vero:

```bash
cd sito/api/_pensione && GHL_API_TOKEN=pit-finto python3 -c 'import crm; crm._prova("contatto", lambda: crm._api("POST","/contacts/upsert",{"locationId":crm.LOCATION,"email":"prova@example.com"}))'
# atteso: HTTP 401 (arriva a GHL). HTTP 403 = di nuovo bloccati da Cloudflare.
```

## Regola

Ogni chiamata server verso GHL (o altri servizi dietro Cloudflare) da Python deve avere un user-agent esplicito.
Un 403 da GHL: leggere il corpo della risposta prima di toccare il token.
