---
title: "Registro: Stima e Calcolo della pensione"
type: riferimento
tags: [pensioni, stima-pensione, registro]
created: 2026-11-12
related: [[procedure/06-stima-pensione]]
---

# Registro della Stima e Calcolo della pensione

Una riga per ogni modifica, deploy o caso controllato, **la più recente in alto**. Serve a riprendere il lavoro
senza rileggere le conversazioni. Per i clienti si scrive solo il codice pratica, mai nome o dati personali.

Colonne "Ufficio" e "Skill": il calcolatore d'ufficio e la skill `conteggi-pensionistici` sono stati allineati
a questa modifica del motore? (`sì` / `no` / `—` se la modifica non tocca il motore)

Nota: la copia del motore dentro la skill è più vecchia di quella del sito anche su altre parti (quota retributiva,
madri, estratto): per un calcolo con le regole aggiornate fa fede il sito o il calcolatore d'ufficio.

| Data | Cosa | Perché / caso | Commit, PR, deploy | Ufficio | Skill |
|---|---|---|---|---|---|
| 2026-11-12 | Agevolazioni gravosi solo con 7 anni su 10 prima dell'uscita; tabella delle alternative con l'uscita giusta per "lavora fino a" e il confronto con la situazione attuale | Pratica `E3-BF4qPfwLvHjvqQuN_`: "se smetti ora" dava vecchiaia gravosi a 66a7m nel 2036 con netto più alto delle uscite 2027-2029, letto come un guadagno | PR #10 (commit `f63a8bb`) | sì (versione `1794475150-82f5`) | proposta ad Antonio, da salvare |
| 2026-11-12 | Chiamate a GHL con user-agent proprio | Stessa pratica: contatto, opportunità, note ed email mai arrivate in GHL (403 di Cloudflare, errore 1010). Vedi [[lessons/2026-11-ghl-cloudflare-user-agent]] | PR #10 (commit `71a05fe`) | — | — |
| 2026-11-12 | `GHL_API_TOKEN` inserito da Antonio su Vercel | Attivare il collegamento al CRM | deploy `dpl_D4pD46rE6t2UmSxhw6PXCktLFv2E` | — | — |
| 2026-11-11 | Lettura diretta dell'estratto, gestioni corrette, consulenza inclusa, prospetto provvisorio, PDF rifatto | Vedi la nota della procedura | PR #6, commit `539e69a` | sì (commit `e8cd2e0`) | — |
| 2026-11-11 | Servizio in produzione su praticheflaiano.it | Decisione di Antonio | PR #3, #4 | — | — |

## Casi controllati

Casi reali segnalati da Antonio, con l'esito del controllo. Il caso di prova corrispondente (dati inventati) sta in `sito/api/_pensione/test_regole.py`.

- **2026-11-12, `E3-BF4qPfwLvHjvqQuN_`** (uomo, 1969, misto, precoce e gravoso, estratto fermo a settembre 2026, pagamento fatto con un nome diverso).
  Pagamento abbinato correttamente alla pratica. CRM: niente arrivato (403 Cloudflare), corretto.
  Calcolo: vecchiaia gravosi concessa anche smettendo ora (errore, corretto); tabella delle alternative fuorviante (corretta).
  Da fare dopo il deploy: "riavvia calcolo" dalla pagina dell'ufficio, poi controllare in GHL contatto e opportunità.
