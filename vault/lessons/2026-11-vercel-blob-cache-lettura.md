---
title: "Lesson: Vercel Blob rilegge la versione vecchia subito dopo una sovrascrittura"
type: lesson
tags: [vercel, blob, cache, stima-pensione]
created: 2026-11-12
related: [[procedure/06-stima-pensione]]
severity: alto
---

# Vercel Blob rilegge la versione vecchia subito dopo una sovrascrittura

## Sintomo

Ricalcolo dall'ufficio della pratica `E3-BF4qPfwLvHjvqQuN_`: la funzione salva la pratica come "pagata" e subito dopo
`avvia()` la rilegge... ancora "consegnata", quindi non calcola. Nei log: PUT di `pratica.json`, poi GET, risposta in meno di un secondo.

## Root cause

Le letture di Vercel Blob passano da una cache: dopo una sovrascrittura (`allow_overwrite=True`) per un po' torna il contenuto precedente.
Il pacchetto `vercel-blob` 0.5.1 non ha l'opzione per saltarla; il kit `vercel` più recente la implementa aggiungendo `?cache=0` all'indirizzo.

## Risoluzione applicata

`archivio._leggi()` legge sempre dall'indirizzo `https://<store>.private.blob.vercel-storage.com/<percorso>?cache=0`
(store da `BLOB_STORE_ID` o dal `BLOB_READ_WRITE_TOKEN`). Se lo store non si ricava, resta la lettura per percorso.

## Regola

Ogni stato salvato su Blob e riletto nella stessa esecuzione (o pochi secondi dopo) va letto senza cache.
Se una pratica "non cambia stato" senza errori nei log, sospettare prima la cache.
