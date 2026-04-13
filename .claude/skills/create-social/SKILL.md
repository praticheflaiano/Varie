---
name: create-social
description: "Crea post Facebook e messaggio WhatsApp da un articolo pubblicato del blog."
argument-hint: "[percorso-articolo]"
---

# Creazione Post Social

Genera contenuti per Facebook e WhatsApp a partire da un articolo del blog.

## Istruzioni

1. Identifica il percorso dell'articolo da `$ARGUMENTS`
   - Se non specificato, chiedi all'utente quale articolo promuovere

2. Verifica che l'articolo abbia `status: published` nel frontmatter
   - Se non e pubblicato, avvisa l'utente che deve prima passare da `/review-article`

3. Delega al subagent `social-media-manager` che generera:
   - **Post Facebook** (150-250 parole, informativo, con hashtag)
   - **Messaggio WhatsApp** (max 80 parole, diretto, facilmente inoltrabile)

4. I file vengono salvati in `social/`:
   - `YYYY-MM-DD-facebook-[slug].md`
   - `YYYY-MM-DD-whatsapp-[slug].md`

5. Mostra all'utente un'anteprima di entrambi i post per approvazione
