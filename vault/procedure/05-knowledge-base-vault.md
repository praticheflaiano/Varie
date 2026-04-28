---
title: "Procedura: come usare e mantenere il vault Obsidian"
type: procedura
tags: [vault, obsidian, knowledge, meta]
created: 2026-04-28
related: [[00-INDEX]]
---

# Vault Obsidian: uso e manutenzione

## Cosa e

Vault `vault/` nel git repo `praticheflaiano/Varie`. Knowledge base persistente. Sostituisce la "memoria di sessione" di Claude (che si svuota a ogni nuova conversazione) con file markdown wikilinked.

**Logica**: leggere una nota da 200 righe e molto piu economico (in token) che rileggere un transcript da 50.000 righe.

## Struttura

```
vault/
  00-INDEX.md                # MOC centrale (entry point)
  procedure/                 # Come fare X (intramontabili)
  lessons/                   # Cosa successo il giorno Y (storiche)
  riferimenti/               # Dati di fatto attuali (quick lookup)
  template/                  # Schema per nuove note
  _attachments/              # Immagini, screenshot
  .obsidian/                 # Config app Obsidian (opzionale)
```

## Convenzioni di scrittura

### Naming

- `procedure/NN-titolo-kebab.md` - NN = ordine logico (01, 02, ...)
- `lessons/YYYY-MM-titolo-kebab.md` - data per cronologia
- `riferimenti/titolo-kebab.md` - sempre attuali, no data
- `template/titolo-template.md`

### Frontmatter

```yaml
---
title: "Titolo leggibile"
type: procedura | lesson | riferimento | template | moc
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD  # solo se modificata
related: [[nota1]], [[nota2]]
---
```

### Wikilink

`[[procedure/02-deploy-vercel]]` - path completo da vault root, senza estensione `.md`.

Pipe alias per rinominare il display: `[[procedure/02-deploy-vercel|deploy Vercel]]` mostra "deploy Vercel" come testo.

### Sezioni standard

Per **procedure**:
1. Quando applicarla
2. Procedura step-by-step
3. Insidie note (gotchas)
4. Vedi anche

Per **lessons**:
1. Contesto (cosa stavo facendo)
2. Errore o sintomo
3. Causa root identificata
4. Risoluzione applicata
5. Lezione astratta (cosa ricordare per il futuro)
6. Vedi anche

Per **riferimenti**:
- Tabelle, liste, dati di fatto
- Aggiornati in continuo
- Frontmatter `updated` indispensabile

## Come usare il vault in una nuova sessione Claude Code

### Inizio sessione

1. **Leggi `vault/00-INDEX.md` come prima cosa** se l'utente fa una richiesta non triviale
2. Identifica la nota pertinente al task
3. **Leggi solo quella nota** - non rileggere transcript precedenti
4. Esegui il task

### Durante il task

- Se il task tocca aree gia documentate, **applica le procedure** del vault
- Se trovi insidie nuove non documentate -> appunta mentalmente, scriverai una nota a fine task

### Fine sessione

- **Crea/aggiorna note** per cose imparate o cambiamenti significativi
- Aggiorna `00-INDEX.md` se aggiungi nuove note
- Commit + push del vault insieme alle altre modifiche del progetto

## Quando creare una nuova nota

| Tipo | Quando |
|---|---|
| **Procedura** | Task che si ripete: scrivere/pubblicare articolo, deploy, redesign, setup |
| **Lesson** | Errore o sorpresa: comportamento inatteso, fix non ovvio, fonte di confusione |
| **Riferimento** | Dato che cambia poco e si consulta spesso: token IDs, URL, configurazioni |

## Esempi di buoni titoli

- ✅ `procedure/02-deploy-vercel.md` (verbo + scopo + tool)
- ✅ `lessons/2026-04-vercel-rootdir-trap.md` (data + errore conciso)
- ✅ `riferimenti/agenti-disponibili.md` (sostantivo + qualifica)
- ❌ `procedure/cose-da-ricordare.md` (vago, non azionabile)
- ❌ `lessons/oggi-ho-fatto-X.md` (egoistico, no data, no errore)

## Aggiornamento

Quando una procedura o lesson cambia:
1. Aggiorna il contenuto
2. Aggiungi `updated: YYYY-MM-DD` nel frontmatter
3. Se cambia il significato dei link in entrata -> verifica le note che linkano qui (Obsidian "backlinks")

## Anti-pattern da evitare

- **NON copiare interi transcript di sessione** - filtra solo l'azionabile
- **NON aggiornare 5 note insieme con stesse info** - DRY: un'info, una nota, link da altrove
- **NON lasciare TODO senza assignee/data** - se non sai chi/quando, e troppo presto per scriverlo
- **NON committare segreti** - nemmeno scaduti. Riferimenti a credenziali devono essere placeholder

## Vedi anche

- [[00-INDEX]] - MOC del vault
- [[template/procedura-template]]
- [[template/lesson-template]]
