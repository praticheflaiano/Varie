# Blog Centro Pratiche Flaiano - CAF UNSIC e Patronato ENASC

## Identita

Blog informativo del **Centro Pratiche Flaiano**, CAF affiliato UNSIC e Patronato ENASC.
Sede: Via Filoteo Alberini 25 int 10, 00139 Roma (Centro Acquisti Flaiano, zona Vigne Nuove).
Zone servite: Vigne Nuove, Tufello, Conca d'Oro, Bufalotta, Porta di Roma, Municipio III Montesacro.
Tel: 0697845429 | WhatsApp: 3716230690 | Email: info@praticheflaiano.it
Orari: Lun-Gio 9:30-13:00 / 15:30-18:00 | Ven 9:30-14:00
Sito: praticheflaiano.it | Tessera: 30 euro/anno o 20 euro/semestre per nucleo familiare
Prenotazioni: https://link.arcanis.it/widget/group/bklXY9sZUszt8V2GpkU1
Base URL blog: https://praticheflaiano.it/blog/

## Servizi

- **CAF**: 730, ISEE/DSU, IMU/TASI, TARI, Successioni e Volture, Contratti affitto, Bonus fiscali
- **Patronato**: Pensioni, Legge 104/invalidita, Accompagno, Assegno Unico, Maternita/bonus nido, ADI/SFL, NASpI
- **Generali**: PEC, Rateizzazioni, Utenze, Assicurazioni, Cambio residenza, Certificati, Comunicazioni AdE

## ⚡ Knowledge Base — Vault Obsidian (CONSULTARE PRIMA)

**`vault/` contiene la mappa di conoscenza operativa del progetto.** Prima di affrontare un task non triviale, **leggere `vault/00-INDEX.md`** e identificare la nota pertinente. Riduce drasticamente il context-burn rispetto al rileggere transcript.

- `vault/00-INDEX.md` → MOC (entry point)
- `vault/procedure/` → workflow editoriale, deploy Vercel, redesign, pubblicazione articolo, knowledge base
- `vault/lessons/` → errori incontrati e fix (Vercel rootDir, stream timeout, race condition, licenze, design bundle, SSO)
- `vault/riferimenti/` → agenti, skill, comandi, dati ufficio, credenziali (no segreti)
- `vault/template/` → schemi standard procedura/lesson

**Regola operativa**: ogni nuovo errore o cambio significativo va riflesso nel vault. Il vault e fonte di verita operativa.

## Directory progetto

- `vault/` → **Knowledge base Obsidian (vedi sopra)**
- `sito/` → Sito web Astro 5 (deploy Vercel: praticheflaiano-sito.vercel.app)
- `docs/` → Riferimenti: regole-contenuto, tassonomia, personas
- `content/_templates/` → 4 template articoli (informativo, scadenza, guida, novita)
- `content/<categoria>/` → 13 directory per articoli pubblicati
- `reviews/` → Report di fact-check e SEO (separati dagli articoli)
- `calendar/` → Piano editoriale attivo + argomenti stagionali
- `social/` → Output post Facebook e WhatsApp
- `.claude/agents/` → 5 subagent specializzati (vedi `vault/riferimenti/agenti-disponibili.md`)
- `.claude/skills/` → 5 slash command invocabili (vedi `vault/riferimenti/skill-progetto.md`)

## Regola fondamentale: ZERO INVENZIONI

Ogni articolo tratta materia fiscale/previdenziale. Un dato errato causa danni reali ai lettori.
- MAI inventare date, importi, percentuali o scadenze
- MAI dare per scontato che una scadenza dell'anno precedente sia uguale quest'anno
- Citare SEMPRE la fonte normativa (Circolare INPS n. X, Risoluzione AdE, D.L./D.Lgs.)
- Se un dato non e verificabile al momento della scrittura, scrivere "in corso di definizione"
- Ogni articolo deve avere data "ultimo aggiornamento" e disclaimer
- Leggere `docs/regole-contenuto.md` per le regole complete

## Flusso degli stati di un articolo

```
draft → fact-checked → seo-optimized → ready → published
```

- `draft`: appena scritto dal content-writer. Non pubblicare.
- `fact-checked`: superato il fact-check. Report in reviews/.
- `seo-optimized`: superata ottimizzazione SEO. Report in reviews/.
- `ready`: checklist pre-pubblicazione superata. Pronto per GHL.
- `published`: pubblicato su praticheflaiano.it.

## Workflow standard

1. Pianifica → `editorial-planner` o `/plan-month [mese] [anno]`
2. Scrivi → `content-writer` o `/write-article [topic] [tipo]`
3. Verifica → `fact-checker` poi `seo-specialist` → `/review-article [path]` (OBBLIGATORIO)
4. Promuovi → `social-media-manager` o `/create-social [path]` (solo su articoli `ready` o `published`)

## Comandi disponibili

- `/write-article [argomento] [informativo|scadenza|guida|novita]`
- `/review-article [percorso-articolo]`
- `/plan-month [mese] [anno]`
- `/create-social [percorso-articolo]`
- `/update-calendar`

## Procedure consolidate (link al vault)

Prima di eseguire questi task, leggere la procedura corrispondente:

| Task | Procedura |
|---|---|
| Scrivere e pubblicare un articolo dalla A alla Z | `vault/procedure/04-pubblicazione-articolo.md` |
| Workflow editoriale completo (panoramica) | `vault/procedure/01-workflow-editoriale.md` |
| Deploy o redeploy Vercel | `vault/procedure/02-deploy-vercel.md` |
| Modificare design system del sito | `vault/procedure/03-redesign-frontend.md` |
| Mantenere il vault stesso | `vault/procedure/05-knowledge-base-vault.md` |

## Stato infrastruttura (2026-04-28)

- **Sito web**: live su https://praticheflaiano-sito.vercel.app (Astro 5 + Tailwind v4 + Svelte islands, design "Adriatic Blue")
- **Vercel project**: `praticheflaiano-sito`, rootDirectory `sito`, SSO disattivata
- **GitHub**: repo `praticheflaiano/Varie`, branch attivo `claude/identify-project-ULhhV`, PR draft #1 aperta
- **Articoli published**: 4 (Precompilata 2026, Guida 730/2026, IVA 2026, Rottamazione Quinquies 2026)
- **Token Vercel temporanei usati e da revocare**: vedi `vault/riferimenti/credenziali-deploy.md`
