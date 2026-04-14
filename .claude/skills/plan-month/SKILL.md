---
name: plan-month
description: "Genera o aggiorna il piano editoriale per un mese specifico, basato sulle scadenze fiscali verificate."
argument-hint: "[mese] [anno]"
---

# Pianificazione Editoriale Mensile

Genera il piano editoriale per il mese richiesto.

## Istruzioni

1. Analizza `$ARGUMENTS` per identificare mese e anno target
   - Se non specificati, usa il mese corrente o il mese successivo

2. Delega al subagent `editorial-planner` con le seguenti istruzioni:
   - Leggere `calendar/editorial-calendar.md` per lo stato attuale e gli argomenti stagionali
   - Leggere `docs/topic-taxonomy.md` per le categorie
   - Scansionare `content/` per identificare gap
   - **VERIFICARE le scadenze reali** del mese su fonti ufficiali
   - Generare il piano e aggiornare `calendar/editorial-calendar.md`

3. Riporta all'utente:
   - Articoli pianificati per il mese con date di pubblicazione suggerite
   - Scadenze fiscali verificate del mese
   - Gap di contenuto identificati
   - Articoli da aggiornare
