---
title: "Lesson: le pagine artefatto di claude.ai non scaricano file da altri siti"
type: lesson
tags: [artefatti, pyodide, calcolatore-ufficio, csp]
created: 2026-11-12
related: [[procedure/06-stima-pensione]]
severity: alto
---

# Le pagine artefatto di claude.ai non scaricano file da altri siti

## Sintomo

Calcolatore d'ufficio (artefatto `65b90f55-fe67-4b36-b51f-0cb19674c856`): restava per sempre su "Carico il motore di calcolo…".

## Root cause

Le pagine artefatto girano con una politica di sicurezza (CSP) che permette di caricare *script* da alcuni CDN
(tra cui `cdn.jsdelivr.net/pyodide/`), ma blocca ogni `fetch` verso altri siti (`connect-src 'self'`).
`pyodide.js` arrivava, ma Pyodide poi scarica con `fetch` il file `.wasm`, la libreria standard e `pyodide-lock.json`:
bloccati, e `loadPyodide` non finisce mai (nessun errore sulla pagina). Riprodotto in Chrome con la stessa CSP.

## Risoluzione applicata

- Pyodide 0.27.7 preso da npm (`npm pack pyodide@0.27.7`) e pubblicato come file dell'artefatto in `lib/pyodide/`.
- Il server degli artefatti non accetta `.zip` né `.bin`: la libreria standard è `python_stdlib.zip.b64.txt` (base64);
  la pagina intercetta il `fetch` di quel file e restituisce i byte decodificati.
- `WebAssembly.instantiateStreaming` sostituito da una versione che compila dai byte (il tipo del `.wasm` servito può non essere `application/wasm`).
- `python-dateutil` e `six` (servono solo `relativedelta`) sono file `.py.txt` in `motore/py/`, scritti nel filesystem di Pyodide: niente `loadPackage`.
- Avvio con limite di 120 secondi: se non parte, la pagina lo dice invece di restare in attesa.

## Regola

In un artefatto ogni file che la pagina legge con `fetch` deve essere un file dell'artefatto. Prima di pubblicare,
provare la pagina in Chrome headless servendola con `connect-src 'self'` (script di prova: vedi la nota del calcolatore nel Project).
