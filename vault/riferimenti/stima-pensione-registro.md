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
| 2026-11-12 | Calcolatore d'ufficio riparato: Python (Pyodide 0.27.7), `dateutil` e libreria standard ora sono file dell'artefatto (prima scaricati da jsdelivr, bloccato sulle pagine di claude.ai: restava su "Carico il motore…"). Tabella "Confronto tra scenari" con le stesse righe e avvisi del sito (`alternative.py`) | Segnalazione di Antonio: il motore non si caricava. Vedi [[lessons/2026-11-artefatti-niente-download-esterni]] | artefatto `65b90f55-…` versione `1794485799-0608`, file allineati al commit `8b8fcad` | sì | — |
| 2026-11-12 | Importi senza certezza segnati "non garantito" (uscite dal 2029; "smetti ora" = "Solo per conoscenza, nessuna certezza") con la spiegazione sotto la tabella; il modello non presenta queste strade come convenienti. "Lavora fino a": la pensione decorre dopo la fine del lavoro e l'importo si calcola a quella data; per "smetti ora" si indica quanto si incasserebbe nel frattempo con la prima uscita | Prospetto della pratica `E3-BF4qPfwLvHjvqQuN_`: 1.438,98 € smettendo ora sembrava un guadagno; "lavori fino a 62 anni" mostrava l'importo del 2029. Decisione di Antonio: indicarlo solo per conoscenza, evidenziando che non è certo (coefficienti INPS aggiornati ogni due anni, DD 16/10/2026). Rivalutazione futura lasciata all'1,5% reale | PR #16, produzione `dpl_GcttKcNyaaDz56HrSTXS1svWt3EV` + `info-praticheflaiano` `dpl_Bctpv4EszZ8N12YwPw9yyvogLejx` | sì (versione `1794485799-0608`) | no |
| 2026-11-12 | Letture dell'archivio Vercel Blob senza cache (`?cache=0`) | Il ricalcolo della pratica `E3-BF4qPfwLvHjvqQuN_` rileggeva lo stato vecchio e non partiva; la pratica è rimasta "pagata". Vedi [[lessons/2026-11-vercel-blob-cache-lettura]] | PR #15, produzione `dpl_GcttKcNyaaDz56HrSTXS1svWt3EV` | — | — |
| 2026-11-12 | Pulsante ufficio "Ricalcola con le regole aggiornate" (azione `ricalcola`, stime consegnate o da rivedere; la stima vecchia resta in `stime_precedenti`). CRM: se il contatto nasce in ritardo si scrivono le note perse (questionario, pagamento) senza ripetere le email | Pratica `E3-BF4qPfwLvHjvqQuN_`: consegnata prima della correzione, non si poteva né ricalcolare né mandare a GHL | PR #14, produzione `dpl_AJ9YYsKpLC3Cm11G2X46aUopYpi6` (pulsante sulla pagina pubblica dal redeploy `dpl_Bctpv4EszZ8N12YwPw9yyvogLejx`) | — | — |
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
  Ricalcolata il 12/11 alle 12:40 circa (dopo PR #10 e #14): "se smetti ora" porta ora alla vecchiaia dal 01/03/2037; pratica collegata al CRM
  (contatto, opportunità, note recuperate) ed email "La tua stima della pensione è pronta" arrivata da info@praticheflaiano.it (in Gmail finisce in "Aggiornamenti").
  Controllo del prospetto (ore 13): 1.438,98 € "se smetti ora" (vecchiaia 2037) è coerente con le regole (coefficiente più alto a 67 anni e montante rivalutato),
  ma non è certo: ora è segnato "Solo per conoscenza". Errore vero trovato: "lavori fino a 62 anni" con l'importo del 2029 (corretto, PR #16).
  Per scelta di Antonio il prospetto di questa pratica NON è stato rifatto dopo la PR #16.
