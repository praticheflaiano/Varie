# Post social (Facebook, Instagram, Google) tramite GHL

Aggiornato: 2026-11-10

## Regola
Nessun post pubblico senza l'ok esplicito di Antonio sul testo e sull'immagine.

## Passi
1. **Testo**: solo dati già verificati nell'articolo pubblicato. Su Google niente numero di telefono nel testo. Su Instagram il link non è cliccabile: si scrive "praticheflaiano.it, sezione Blog".
2. **Immagine** 1080x1350 con la grafica del sito: `node scripts/social-img.js <dati.json>` (Playwright + font Bricolage Grotesque e Inter da @fontsource; i dati di esempio sono in `social/2026-11-10-bonus-mamme-immagine.json`).
3. **Caricamento** nella libreria media GHL: `POST /medias/upload-file` (multipart: file, name, hosted=false, altType=location, altId=<locationId>). Restituisce l'URL pubblico.
4. **Account collegati**: `GET /social-media-posting/<locationId>/accounts` (pagina Facebook, profilo Instagram, scheda Google).
5. **Pubblicazione**: `POST /social-media-posting/<locationId>/posts` con `accountIds`, `summary`, `media:[{url,type}]`, `status:"published"`, `type:"post"`, `userId`. Un post per piattaforma, così il testo si può adattare.
6. **Verifica**: `POST /social-media-posting/<locationId>/posts/list` e controllare `status: published` (Instagram impiega circa un minuto).

Il token GHL non va mai scritto nel repository.
