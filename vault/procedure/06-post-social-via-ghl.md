# Post social (Facebook, Instagram, Google) tramite GHL

Aggiornato: 2026-11-12

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

## Alternativa senza token: caricamento CSV dal browser (12/11/2026)

Usata quando il token API non è disponibile. Antonio è già collegato a GHL nel browser integrato.

1. **Immagini** pubbliche: `python3 sito/scripts/genera-og-card.py <articolo.md> --formato quadrato|google --testo "..."` scrive in `social/immagini/`; copiarle in `sito/public/social/` e pubblicare il sito, così hanno un URL `https://praticheflaiano.it/social/<file>.jpg`.
2. **CSV formato avanzato** (modello: `https://storage.googleapis.com/leadgen-social-planner-scheduled-media-production/public/social-planner-advance-sample.csv`, due righe di intestazione, 40 colonne). Un file per account:
   - Facebook: colonna 13 `type` = `post`; Instagram: colonna 14 `type` = `post`;
   - Google: `eventType` = `call_to_action`, `actionType` = `learn_more`, `actionUrl` = URL dell'articolo (pulsante "Scopri di più").
   - `postAtSpecificTime` nel fuso dell'account (Roma), formato `YYYY-MM-DD HH:mm:ss`.
3. In GHL: Agenda social → Nuovo post → Carica da CSV → Formato avanzato. Il file si allega da JavaScript (DataTransfer sull'`input[type=file]`), poi Successivo → scegliere l'account → Crea → controllare anteprime e orari → Programma → Importa.
4. **Verifica** nella vista elenco dell'agenda (stato Programmato/Pubblicato).

Orari usati finora: Facebook mattina 9:30-10:00 o 18:30, Instagram 15 minuti dopo; scheda Google appena approvati. Un solo argomento al giorno: prima di programmare controllare i giorni già occupati nell'agenda.
