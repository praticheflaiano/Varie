---
name: create-social
description: "Crea post Facebook e messaggio WhatsApp da un articolo con status ready o published."
argument-hint: "[percorso-articolo]"
---

# Creazione Post Social

Genera contenuti per Facebook e WhatsApp a partire da un articolo del blog.

## Istruzioni

1. Identifica il percorso dell'articolo da `$ARGUMENTS`
   - Se non specificato, chiedi all'utente quale articolo promuovere

2. Verifica che l'articolo abbia `status: ready` o `status: published` nel frontmatter
   - Se lo status non e `ready` ne `published`, avvisa l'utente che deve prima passare da `/review-article`

3. Estrai lo `slug` dal frontmatter dell'articolo per costruire l'URL reale:
   `https://praticheflaiano.it/blog/[SLUG]`

4. Delega al subagent `social-media-manager` che generera:
   - **Post Facebook** (150-250 parole, informativo, con hashtag e URL reale)
   - **Messaggio WhatsApp** (max 80 parole, diretto, facilmente inoltrabile, con URL reale)

5. Verifica che nei post generati:
   - NON ci siano placeholder `[LINK ARTICOLO]` - devono contenere l'URL reale
   - L'URL sia corretto: `https://praticheflaiano.it/blog/` + slug

6. I file vengono salvati in `social/`:
   - `YYYY-MM-DD-facebook-[slug].md`
   - `YYYY-MM-DD-whatsapp-[slug].md`

7. Mostra all'utente un'anteprima di entrambi i post per approvazione
