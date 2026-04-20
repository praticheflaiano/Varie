---
name: watchdog
description: "Scansiona le fonti ufficiali italiane (GU, INPS, AdE) per rilevare novita normative che impattano articoli esistenti o nuove opportunita editoriali."
argument-hint: "[giorni] (default: 2 = ultime 48h)"
---

# Watchdog Normativo

Scansiona le fonti ufficiali per rilevare novita normative e il loro impatto sugli articoli del blog.

## Istruzioni

1. Analizza `$ARGUMENTS` per il periodo da scansionare
   - Se specificato un numero: scansiona gli ultimi N giorni
   - Se non specificato: scansiona le ultime 48h (default)

2. Delega al subagent `normative-watchdog` che:
   - Scansiona Gazzetta Ufficiale, INPS, Agenzia Entrate, MEF
   - Classifica le novita per tipo e rilevanza
   - Fa cross-reference con tutti gli articoli in `content/`
   - Genera il report in `reviews/YYYY-MM-DD-watchdog.md`
   - Aggiorna `calendar/editorial-calendar.md` se ci sono impatti o opportunita
   - Aggiorna `reviews/watchdog-log.md` con il log della scansione

3. Riporta all'utente un riepilogo con:
   - Numero di novita trovate
   - Articoli esistenti da aggiornare (con priorita)
   - Nuovi articoli suggeriti (opportunita editoriali)
   - Alert critici (se presenti: norme abrogate/modificate in articoli pubblicati)
