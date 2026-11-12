---
title: "Procedura: Report Persona Openapi (area riservata)"
type: procedura
tags: [openapi, report-persona, area-riservata, ghl]
created: 2026-11-12
updated: 2026-11-12
---

# Report Persona (`/riservata/report-persona`)

Pagina **a uso interno del titolare** per richiedere il Report Persona di Openapi (API Risk):
anagrafica, affidabilità, protesti, pregiudizievoli, cariche, partecipazioni, dati catastali.
Non è un servizio venduto al pubblico. Ogni richiesta costa 3,60 € + IVA (listino del 12/11/2026).

## Decisioni di Antonio (12/11/2026)

- Accesso solo suo, con una password.
- Report standard Openapi, **senza loghi** (nessun parametro white label).
- Conservazione: **12 mesi** nell'archivio Vercel, poi cancellazione automatica; nel CRM GHL il PDF resta **senza scadenza**.
- CRM: si riusa il `GHL_API_TOKEN` già presente sul progetto Vercel. Il contatto si cerca per codice fiscale
  e incrociando nome e cognome; se il contatto trovato non ha il codice fiscale, viene aggiunto.

## Dove sta il codice

| Cosa | File |
|---|---|
| Pagina | `sito/src/pages/riservata/report-persona.astro` |
| Logica (accesso, Openapi, archivio, CRM) | `sito/api/_report/report.py` |
| Funzione della pagina | `sito/api/report/persona.py` |
| Avviso di Openapi e manutenzione giornaliera | `sito/api/report/avviso.py` (cron in `sito/vercel.json`, ogni giorno alle 04:17 UTC) |
| Prove | `sito/api/_report/test_report.py` (Openapi e GHL finti) |

Le funzioni girano nel progetto Vercel `praticheflaiano-sito`, come quelle della stima pensione
(vedi [[procedure/06-stima-pensione]]); la pagina sul sito pubblico le chiama all'altro indirizzo.

## Variabili d'ambiente (progetto `praticheflaiano-sito`)

| Variabile | A cosa serve |
|---|---|
| `REPORT_PERSONA_PASSWORD` | Password della pagina. Senza, la pagina resta chiusa (503). |
| `OPENAPI_RISK_TOKEN` | Token Openapi con il permesso `IT-report-persona`. Senza, le richieste non partono. |
| `OPENAPI_RISK_BASE` | Facoltativa. `https://test.risk.openapi.com` = ambiente di prova (serve il token di prova). |
| `GHL_API_TOKEN` | Già presente (stima pensione). |
| `REPORT_PERSONA_URL` | Facoltativa: indirizzo pubblico delle funzioni per l'avviso di Openapi. In produzione si ricava da solo. |
| `BLOB_READ_WRITE_TOKEN` | Già presente: archivio Vercel Blob. |

I valori non vanno mai scritti nel repository né in questa nota.

## Come funziona

1. **Accesso**: password, poi sessione firmata di 12 ore tenuta nella scheda del browser. Dopo 5 password
   sbagliate la pagina resta bloccata 15 minuti (contatore nell'archivio, vale per tutti).
2. **Richiesta**: nome, cognome, codice fiscale (controllo formale completo), finalità, spunta del consenso.
   La richiesta viene salvata in archivio **prima** di chiamare Openapi. Stesso codice fiscale nelle
   ultime 24 ore: la pagina chiede conferma prima di pagare di nuovo.
3. **Attesa**: Openapi evade da 10 minuti fino a 24-48 ore. Il PDF si scarica da Openapi quando arriva
   l'avviso (callback, solo in produzione), a ogni "Aggiorna" della pagina (da sola ogni minuto finché è
   aperta) e una volta al giorno con il cron. `406` da Openapi = non ancora pronto.
4. **Archivio** (Vercel Blob privato): `report/richieste/<codice>.json`, `report/pdf/<codice>.pdf`,
   `report/accesso/tentativi.json`.
5. **CRM**:
   - un contatto con quel codice fiscale → è lui;
   - un solo contatto con quel nome e cognome e senza codice fiscale → è lui, e il codice fiscale viene aggiunto;
   - omonimi, oppure contatto con un codice fiscale diverso → la pagina mostra i candidati e sceglie Antonio
     (nessuna scrittura automatica; un codice fiscale diverso non viene mai sovrascritto);
   - nessuno → la pagina chiede se creare il contatto.
   Il PDF va nel campo file **"Report Persona"** del contatto (creato da solo se manca), più una nota con
   data e finalità. Il campo del codice fiscale viene riconosciuto dal nome ("Codice Fiscale", "CF");
   se non esiste viene creato "Codice Fiscale".

## Limiti noti

- Un PDF oltre circa 3,2 MB non si scarica dalla pagina (limite di risposta delle funzioni): si apre dal CRM.
- Se Openapi non risponde alla richiesta, l'esito è **incerto** (potrebbe essere stata addebitata): la pagina
  lo scrive e invita a controllare su console.openapi.com prima di ripetere.
- Stati di Openapi: la documentazione cita `processing`, `completed`, `evaso`. Il codice non si fida del
  nome dello stato: prova direttamente il download.

## Non ancora verificato contro i servizi veri (12/11/2026)

- Chiamate reali a Openapi (forma della risposta, dove sta l'`id`, avviso di callback).
- Chiamate reali a GHL: ricerca contatti (`POST /contacts/search`), creazione dei campi, caricamento del
  file (`POST /forms/upload-custom-files`), comportamento con più file nello stesso campo.
- Da chiarire fuori dal codice: condizioni d'uso Openapi e inquadramento privacy (finalità, consenso)
  per l'uso in ufficio.
