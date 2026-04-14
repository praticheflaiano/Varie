---
name: update-calendar
description: "Aggiorna il calendario editoriale: segna gli articoli pubblicati, identifica gap di contenuto e articoli da aggiornare."
---

# Aggiornamento Calendario Editoriale

Aggiorna `calendar/editorial-calendar.md` con lo stato reale dei contenuti.

## Istruzioni

1. Scansiona `content/` con Glob per trovare tutti gli articoli esistenti

2. Per ogni articolo trovato, leggi il frontmatter per estrarre:
   - `title`, `date`, `category`, `status`, `last_updated`

3. Aggiorna `calendar/editorial-calendar.md`:
   - Segna come "Pubblicato" gli articoli con `status: published`
   - Segna come "Pronto" gli articoli con `status: ready`
   - Segna come "SEO completato" gli articoli con `status: seo-optimized`
   - Segna come "Verificato" gli articoli con `status: fact-checked`
   - Segna come "In lavorazione" gli articoli con `status: draft`

4. Aggiorna la sezione "Articoli da Aggiornare":
   - Identifica articoli con `last_updated` piu vecchio di 12 mesi
   - Identifica articoli con anno fiscale precedente nel titolo (es. "2025" quando siamo nel 2026)
   - Assegna priorita: Alta (contiene importi/scadenze), Media (contiene procedure), Bassa (evergreen)

5. Aggiorna la sezione "Gap di Contenuto":
   - Conta gli articoli per categoria
   - Segnala categorie con meno di 3 articoli

6. Riporta all'utente un riepilogo:
   - Totale articoli per stato
   - Articoli da aggiornare con priorita
   - Categorie scoperte

## Flusso degli stati

Gli articoli seguono questo flusso: `draft` → `fact-checked` → `seo-optimized` → `ready` → `published`

## Riferimenti

- Regole contenuto: `docs/regole-contenuto.md`
- Calendario editoriale: `calendar/editorial-calendar.md`
- Tassonomia: `docs/topic-taxonomy.md`
