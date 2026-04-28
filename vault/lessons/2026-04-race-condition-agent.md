---
title: "Lesson: race condition tra fact-checker e seo-specialist sullo stesso file"
type: lesson
tags: [agent, race-condition, workflow, content]
created: 2026-04-28
related: [[procedure/01-workflow-editoriale]], [[procedure/04-pubblicazione-articolo]]
severity: medio
---

# Race condition tra subagent che modificano lo stesso file

## Contesto

Lanciato in sequenza `fact-checker` e poi `seo-specialist` sull'articolo Precompilata 2026. Entrambi modificano `content/730-redditi/2026-04-28-precompilata-...md` in-place.

Pero dato che lavoravano in **modalita async background**, hanno operato in parallelo. Il file e stato modificato da entrambi, l'uno dopo l'altro, **senza coordinamento**.

## Sintomo

- Il fact-checker termina dopo SEO e dice: "il file al momento del fact-check risultava gia con `status: seo-optimized` (probabilmente gia processato dal seo-specialist in parallelo)"
- Edit successivo del file da parte mia (`status -> published`) fallisce: `File has been modified since read, either by the user or by a linter` -> serve riread
- Frontmatter contiene riarrangiamenti dovuti ad entrambi i pass (il SEO ha ottimizzato meta description, il fact-check ha aggiustato FAQ)
- Risultato finale e comunque corretto, ma per fortuna gli edit erano ortogonali (frontmatter vs body in punti diversi)

## Cause

Lanciando due `Agent({...})` con default sync, **uno aspetta l'altro**. Ma se l'agent va in background o l'utente prosegue prima del termine, il secondo lancio parte mentre il primo non e finito.

In questo caso ho lanciato fact-checker in background (timeout precedente -> avevo timore di un nuovo timeout) e dopo poco anche seo-specialist. Risultato: parallelismo accidentale.

## Conseguenze potenziali (non si sono verificate ma sono concrete)

- **Edit in conflitto**: agent A legge file, agent B legge file, A scrive, B scrive (sovrascrive). L'edit di A e perso silenziosamente.
- **Doppia correzione**: fact-checker corregge X, seo-specialist applica modifiche al testo che invalidano la correzione di X
- **Status regression**: se fact-checker era partito prima e SEO ha gia messo `seo-optimized`, fact-checker che vuole impostare `fact-checked` farebbe regredire (per fortuna l'agent ha fatto la cosa giusta non regredendo manualmente)

## Risoluzione corretta (workflow)

**SEMPRE in sequenza, mai in parallelo, sui file in `content/`**:

```
1. Lancio fact-checker. Aspetto completion (notifica).
2. Verifico stato file (status: fact-checked).
3. Lancio seo-specialist. Aspetto completion.
4. Verifico stato file (status: seo-optimized).
5. Cambio io status a published.
```

Se devo lanciare in background per non bloccare la conversazione, lancio UNO PER VOLTA e aspetto la notifica `task-notification` con `<status>completed</status>` prima del successivo.

## Eccezioni in cui parallelizzare e OK

- File **diversi**: fact-check su articolo A + SEO su articolo B (file diversi, no race)
- Letture parallele: piu agent che leggono ma non scrivono
- Build green check + lint check (entrambi read-only)

## Lezione astratta

1. **Subagent != processo isolato**. Modificano filesystem condiviso. Le modifiche concorrenti possono sovrapporsi.

2. **Background mode con cautela**: utile per parallelismo, pericoloso quando i job toccano gli stessi file.

3. **Frontmatter status e race-prone**: se due agent vogliono cambiarlo, il secondo vince. Considerare di non far cambiare lo status agli agent intermediari, ma lasciarlo al chiamante.

4. **Notifica `task-notification` come barriera**: aspettarla prima del prossimo lancio sullo stesso file.

## Mitigazione futura

Considerare di:
- Aggiornare i prompt dei subagent fact-checker e seo-specialist per **NON cambiare status**, e lasciare al caller la transizione di stato
- Oppure usare un lock-file `.<filename>.lock` durante l'edit (over-engineering per il volume attuale)

Per ora la regola operativa e: **sequenziale, sempre**.

## Vedi anche

- [[procedure/01-workflow-editoriale]]
- [[procedure/04-pubblicazione-articolo]]
- Tool docs: `Agent` con `run_in_background: true`
