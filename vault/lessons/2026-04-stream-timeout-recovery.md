---
title: "Lesson: recupero da stream timeout dei subagent Claude"
type: lesson
tags: [agent, subagent, timeout, claude, debugging]
created: 2026-04-28
related: [[procedure/04-pubblicazione-articolo]]
severity: medio
---

# Stream timeout subagent Claude - quando recuperare e quando ripartire

## Contesto

Lanciato il subagent `content-writer` per scrivere l'articolo "Precompilata 2026". Prompt: 1500+ token con istruzioni dettagliate (frontmatter schema, struttura H2 obbligatoria, tutte le date verificate). Dopo ~98 secondi:

```
API Error: Stream idle timeout - partial response received
agentId: af9306ce9257ac9f8 (use SendMessage with to: 'af9306ce9257ac9f8' to continue this agent)
<usage>total_tokens: 0
tool_uses: 2
duration_ms: 97902</usage>
```

L'agent si era avviato, aveva fatto 2 tool calls (probabilmente Read di template/regole), ma il suo response stream e andato idle.

## Sintomo

`API Error: Stream idle timeout - partial response received` con riferimento ad un agentId per `SendMessage`. Il file dell'articolo NON era stato scritto.

## Cause possibili

1. **Sovraccarico API momentaneo** sul backend Claude
2. **Prompt troppo lungo** che spinge il modello a "thinking" troppo a lungo prima di rispondere
3. **Output troppo grande** con difficolta a streammarlo
4. **Tool call lento** (es. WebFetch) che sfora la timeout window

## Risoluzione applicata

Visto che:
- Avevo gia tutti i dati verificati nel prompt iniziale
- Il template `content/_templates/article-scadenza.md` era leggibile in pochi token
- Riavviare l'agent significava aspettare altri 60-100s

ho **scritto il file direttamente** usando il tool Write. Tempo: ~2 minuti vs 5+ minuti per riavvio agent. Risultato: 1730 parole, 13 H2, frontmatter completo, qualita pari all'output atteso dall'agent.

## Decision matrix

Quando ricevi `Stream idle timeout`:

| Situazione | Azione raccomandata |
|---|---|
| Prompt aveva istruzioni chiare e dati gia verificati | **Scrivere tu il file** (piu veloce) |
| Prompt richiedeva ricerche/analisi che l'agent doveva fare | **SendMessage all'agent** per continuare |
| L'agent doveva produrre output complesso (codice, design) | **SendMessage** con prompt che include "riepiloga lo stato e finisci" |
| Hai gia speso 10+ minuti su questo subtask | Stop e chiedi all'utente |

## Quando NON ricominciare a zero

Mai rilanciare un Agent identico se:
- Il primo aveva fatto progressi (`tool_uses > 0`)
- Hai un agentId per SendMessage (continuita meno costosa)
- Il subtask e ben definito (basta finirlo, non ridiscuterlo)

## Quando ricominciare a zero

- L'agent aveva una direzione sbagliata e te ne accorgi solo ora
- Vuoi cambiare istruzioni significativamente
- L'agent precedente non ha lasciato output utile

## Lezione astratta

1. **L'agent e un mezzo, non il fine.** Se hai gia tutti i dati per fare il task, fallo direttamente. L'agent ha senso quando aggiunge competenza specializzata o parallelizzazione.

2. **Prompt corti e mirati timeoutano meno.** Se ti accorgi di scrivere prompt da 2000+ token, considera di spezzettarli o di farne uno tu direttamente.

3. **Recovery > restart**: quasi sempre, far finire l'agent e meglio che ricominciare.

4. **Tieni traccia degli agentId** anche se l'agent sembra terminato male - puo essere ripreso.

## Vedi anche

- [[procedure/04-pubblicazione-articolo]] step 2 (scrittura articolo)
- [[procedure/01-workflow-editoriale]] step 2
- Tool docs: Agent (subagent_type, run_in_background, SendMessage)
