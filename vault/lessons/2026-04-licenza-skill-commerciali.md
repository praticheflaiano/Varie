---
title: "Lesson: licenze restrittive su skill di terze parti (huashu-design)"
type: lesson
tags: [licenza, skill, copyright, etica]
created: 2026-04-28
related: [[procedure/03-redesign-frontend]]
severity: alto
---

# Licenze restrittive su skill di terze parti - cosa si puo / non si puo fare

## Contesto

L'utente ha chiesto di "installare" la skill `https://github.com/alchaincyf/huashu-design.git` e usarla per migliorare il sito.

## Sintomo iniziale

Skill descritta come "type → enter → finished design". Sembra promettente per un redesign rapido. Tentazione: installare e procedere.

## Verifica licenza (cosa NON saltare mai)

Lettura `LICENSE` del repo:

```
Huashu Design · Personal Use License

1. Allowed (free):
   - Studio e ricerca
   - Creazione personale
   - Condivisione non profit
   - Derivati personali con citazione

2. PROHIBITED (richiede autorizzazione scritta):
   - Aziende, team, studi che integrano in tool interni o prodotti
   - Skill o derivati come deliverable a clienti paganti
   - Software commerciali / template a pagamento
   - Corsi a pagamento
   - Qualsiasi commissione cliente-fornitore
```

Il sito di **Centro Pratiche Flaiano e attivita commerciale** (CAF/Patronato e una professione retribuita). Punto 2 della licenza vieta esplicitamente l'integrazione di huashu-design. Niente eccezioni implicite.

## Risoluzione

**Letto il repo come materiale di studio (allowed)**, **NON copiato codice/asset nel sito** (prohibited).

I principi di design generali (palette OKLCH, serif display, anti-AI-slop, text-wrap pretty) **NON sono protetti da copyright** (sono concetti, non implementazioni). Posso applicarli scrivendo io codice originale ispirandomi.

Procedura concreta seguita:
1. Clone in `/tmp/huashu-design/` (fuori dal repo del progetto)
2. Lettura SKILL.md e references/ (~20 design philosophies)
3. Estrazione PRINCIPI applicabili al sito CAF
4. Riscrittura ORIGINALE del codice nel sito (no copy-paste)
5. Cancellazione del clone temporaneo

Ho dichiarato all'utente la situazione e proposto le 5 modifiche applicabili senza violare licenza, prima di procedere.

## Cosa avrei NON dovuto fare

- ❌ `npx skills add alchaincyf/huashu-design` direttamente nel progetto: avrebbe installato il SKILL.md tra le skill di Claude Code, e averla disponibile in un contesto commerciale e gia un uso vietato dalla licenza
- ❌ Copiare snippet da `assets/` o `references/` nel sito (anche con citazione del sorgente, la licenza vieta uso commerciale tout court)
- ❌ Generare design "guidato" dalla skill in una sessione per Pratiche Flaiano (deliverable a cliente pagante secondo la lettera della licenza)

## Lezione astratta

1. **Sempre leggere LICENSE prima di installare/usare**. Vale per skill, dipendenze npm, asset, font, immagini.

2. **"Personal Use" != "Use freely"**. Personal Use Only normalmente esclude qualsiasi uso commerciale, anche piccolo.

3. **Idee vs codice**: i principi di design (concetti) non sono coperti da copyright. Le implementazioni concrete (codice, asset) si.

4. **Quando in dubbio, dichiarare e proporre alternative**. Spiegare all'utente le restrizioni e proporre il percorso lecito mantiene fiducia e trasparenza.

5. **Documentare la decisione**. Nel commit message del redesign Adriatic Blue ho scritto: "Ispirato (senza copiare codice) ai principi di alchaincyf/huashu-design, licenza Personal Use Only rispettata".

## Differenza con i bundle Anthropic Design

I bundle handoff Claude Design (`api.anthropic.com/v1/design/h/<hash>`) sono **del cliente stesso** (l'utente li ha generati nel tool Claude Design durante una sessione di redesign sul SUO progetto). Sono asset prodotti per quel progetto specifico, e il README esplicito istruisce a "implementare i design pixel-perfect nel codebase target". Uso pieno permesso.

Quindi: **distinzione cruciale tra skill di terzi (license check obbligatorio) e bundle del cliente (uso libero per il progetto)**.

Vedi [[lessons/2026-04-anthropic-design-bundle]].

## Vedi anche

- [[procedure/03-redesign-frontend]]
- [[lessons/2026-04-anthropic-design-bundle]]
- Repo studiato (NON usato): https://github.com/alchaincyf/huashu-design
