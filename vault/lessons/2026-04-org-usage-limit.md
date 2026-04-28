---
title: "Lesson: org monthly usage limit raggiunto durante mass-production di subagent"
type: lesson
tags: [agent, subagent, limits, anthropic, billing]
created: 2026-04-29
related: [[procedure/01-workflow-editoriale]], [[procedure/04-pubblicazione-articolo]], [[lessons/2026-04-race-condition-agent]]
severity: alto
---

# Org monthly usage limit raggiunto durante mass-production

## Contesto

Lavoro batch su 3 articoli simultanei: dopo aver scritto i file in serie, lanciato 3 fact-checker subagent in parallelo (uno per articolo, file diversi quindi safe da race condition).

Pochi minuti dopo, le 3 task-notification sono arrivate in rapida successione, tutte con lo stesso payload:

```
<result>You've hit your org's monthly usage limit</result>
<usage>total_tokens: 306..407
tool_uses: 19..22
duration_ms: 126899..155647</usage>
```

Tutti e 3 gli agenti sono **partiti effettivamente** (130-156 secondi di esecuzione, 19-22 tool uses ciascuno) ma **terminati prima del completamento** quando l'organization Anthropic ha colpito il limite mensile.

## Sintomo

- 3 agenti tornano "completed" formalmente ma con result string `"You've hit your org's monthly usage limit"`
- Token usage molto basso (300-400 token totali) - i tool uses pero sono ~20 ciascuno, suggerendo che gli agenti hanno fatto WebSearch + WebFetch + Read prima del blocco
- **Effetto collaterale interessante**: l'agente IMU aveva gia applicato in-place le correzioni sul ravvedimento operoso (riforma D.Lgs. 87/2024 sanzione 30% -> 25%, tasso interesse 2026 1,60%) E le aveva salvate. Il limite e arrivato durante il **salvataggio del report** o durante il cambio di status. I file degli altri 2 agenti invece sono rimasti senza modifiche
- Status frontmatter dei 3 articoli: tutti rimasti `draft` (nessun fact-check formale completato)
- Lesson collaterale: il **rate limiter Anthropic colpisce a meta esecuzione** dell'agent, non ne impedisce il lancio. Le modifiche parziali permangono.

## Root cause

L'organization Anthropic ha un **monthly usage limit** condiviso tra tutti i progetti dell'org. I subagent (Agent tool) consumano credito separato dal main thread:

- Ogni subagent = nuovo contesto LLM separato
- Ogni Agent tool call = ~10-100x token del main thread (a parita di lavoro)
- Lavorando in parallelo su 3 agent in background, il consumo si moltiplica per 3 in pochi secondi

In una sessione con gia 4 subagent precedenti (content-writer, fact-checker x2, seo-specialist x2 sulla precompilata + ISEE), aggiungere 3 fact-checker batch ha esaurito il quota residuo del mese.

## Risoluzione applicata

1. **Riconoscimento del blocker**: notifica chiara all'utente che NON ho finito (rifiutato di pubblicare draft articles senza fact-check formale - regola progetto ZERO INVENZIONI)
2. **Salvataggio dello stato**: i 3 articoli draft committati in `97d1369`, modifiche parziali del fact-checker IMU committate dopo il blocco
3. **Documentazione lesson** (questa nota)
4. **Tre opzioni proposte all'utente**:
   - A) attendere ricarica/rinnovo
   - B) commit draft + lesson, ripresa workflow al rinnovo (scelto)
   - C) fact-check manuale in modalita degraded (rischioso su materia fiscale)

## Lezione astratta

### 1. **Mass-production costa esponenzialmente**

3 articoli in batch != 3 volte il costo di uno. Ogni articolo richiede write + fact-check + SEO = ~3 agent calls. Tre articoli in parallelo = 9 agent calls in pochi minuti, picco di consumo che esaurisce quota mensile.

### 2. **Pianificare il rate limit**

Prima di un batch grosso (3+ articoli):
- Stimare il consumo: ~3 agent calls per articolo nel workflow standard
- Verificare quota residua quando possibile (al momento niente API endpoint pubblico per quota org Claude Code, ma si puo desumere da consumi precedenti)
- Considerare di **distribuire nel tempo** invece di parallelizzare: 1 articolo/giorno = 3 agent calls/giorno, sostenibile

### 3. **Race condition non e l'unico rischio del parallelismo**

Avevo correttamente verificato che i 3 agent operassero su file diversi (no race condition - lesson [[lessons/2026-04-race-condition-agent]]). Ma il **rate limit** e un nuovo tipo di rischio del parallelismo: lancio 3 in 5 secondi -> picco di consumo -> blocco. Lanciandoli in serie a distanza di 2 minuti, magari il primo finisce e il secondo ha la quota.

### 4. **Le modifiche parziali permangono**

Quando un agent colpisce il rate limit dopo aver gia scritto/edited file, le modifiche sono permanenti. Bene quando le modifiche sono utili (fact-checker IMU che corregge sanzioni); male quando sono parziali e creano stato inconsistente (es. agent che cambia status frontmatter ma non finisce le edit del corpo).

### 5. **Trasparenza > completezza apparente**

Tentazione: "fact-check manuale io stesso e dichiaro fatto". Errore, sulla materia CAF un dato sbagliato pubblicato live causa danni reali. Meglio dire "non ho finito" che pubblicare con un check inferiore al subagent dedicato.

## Mitigazione futura

### Strategia operativa

| Articoli da pubblicare | Strategia |
|---|---|
| 1 articolo | Sequenziale, no preoccupazioni |
| 2-3 articoli | Sequenziale (uno alla volta, completo workflow), evitare batch parallelo |
| 4+ articoli | Distribuire su piu giorni (1-2/giorno), monitorare quota |

### Workflow batch sicuro

```
Per ogni articolo (in serie, non in parallelo):
  1. Write
  2. Fact-check (subagent, foreground, attendere completion)
  3. SEO (subagent, sequenziale dopo fact-check)
  4. Status -> published
  5. (opzionale) Pausa 2-3 minuti prima del prossimo
Alla fine:
  - 1 commit unico per i N articoli
  - 1 push
  - 1 redeploy
```

Tempo per 3 articoli: ~60-75 min sequenziale (vs ~25 min in parallelo). Trade-off accettabile: zero rischio rate limit, zero race condition, fact-check ognuno in stato pulito.

### Quando il rate limit colpisce

- **NON ripubblicare** articoli con check inferiore al subagent
- **Salvare lo stato** in commit (anche `draft`) per non perdere il lavoro
- **Documentare** nel vault (questa nota)
- **Aspettare** ricarica/rinnovo o **chiedere all'utente** di passare al piano superiore se urgenza alta

## Aggiornamenti necessari nel vault

- [[procedure/01-workflow-editoriale]] - aggiungere "rate limit awareness" come gotcha nella sezione mass-production
- [[procedure/04-pubblicazione-articolo]] - sezione "pubblicazione in massa" con strategia distribuita

## Vedi anche

- [[lessons/2026-04-race-condition-agent]] (altro rischio del parallelismo)
- [[lessons/2026-04-stream-timeout-recovery]] (altro modo in cui un agent puo fallire)
- [[procedure/01-workflow-editoriale]]
- [[procedure/04-pubblicazione-articolo]]
- Tool: `Agent` - parametro `run_in_background`
