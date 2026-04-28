# Fact-Check Report: Assegno Unico 2026 - Tabella Importi per Fascia ISEE

- **Articolo**: `content/assegno-unico/2026-04-29-assegno-unico-2026-importi-tabella-isee.md`
- **Data verifica**: 29/04/2026
- **Verdetto**: **PUBBLICABILE CON CORREZIONE APPLICATA** (post-review umana)
- **Fact-checker**: DeepSeek V3 (chat-v3-0324) via OpenRouter — fallback org limit.

## Sintesi

- **Errori bloccanti DeepSeek**: 1 segnalato → **applicato come modifica difensiva**
- **Warnings DeepSeek**: 2 → entrambi non bloccanti
- **Modifica applicata**: sezione "Figli con disabilita" riformulata in modo prudenziale rinviando alla Circolare INPS per gli importi esatti

## Segnalazioni e gestione

### ⚠️ ERRORE bloccante #1 — Importi maggiorazioni disabilita (APPLICATO COME FIX DIFENSIVO)

**DeepSeek dice**: "Gli importi delle maggiorazioni per disabilità non corrispondono a quelli ufficiali INPS. Verificare e correggere con i valori esatti dalla Circolare INPS n. 7/2026"

**Realta**: il segnalamento e **legittimo**. Gli importi originariamente nel testo (~119,60 / ~108,69 / ~97,79 / ~91,68 €/mese) erano stime non verificate al centesimo contro la Circolare INPS n. 7 del 30 gennaio 2026. DeepSeek non e stato in grado di fornire i valori corretti, ma ha correttamente segnalato il rischio.

**Correzione applicata** (modifica difensiva): la sezione "Figli con disabilita" e stata riformulata sostituendo gli importi specifici con un **rinvio alle tabelle ufficiali**:

> "Sull'importo base spettano maggiorazioni differenziate per grado di disabilita (non autosufficiente, grave, media), tutte rivalutate del +1,4% nel 2026. I valori esatti delle maggiorazioni 2026 sono pubblicati nella Circolare INPS n. 7 del 30 gennaio 2026 (allegato tabelle, sezione 'Figli con disabilita'). Per il calcolo personale sul tuo nucleo familiare ti consigliamo di consultare il simulatore INPS ufficiale o chiedere al Patronato del Centro Pratiche Flaiano..."

**Razionale**: in materia di disabilita la precisione delle cifre e essenziale, e in caso di dubbio e meglio rinviare alla fonte ufficiale che pubblicare valori non verificati al centesimo. La regola progetto **ZERO INVENZIONI** richiede questa prudenza.

### ⚠️ WARNING #1 — Riferimento art. 5 D.Lgs. 230/2021 (non applicato)

**DeepSeek dice**: "Aggiungere riferimento all'art. 5 del D.Lgs. 230/2021 per la formula di decrescenza"

**Decisione**: il D.Lgs. 230/2021 e gia citato nelle fonti del frontmatter. L'aggiunta dell'articolo specifico nel corpo del testo appesantirebbe la lettura senza dare valore al lettore tipico (genitore con figli a carico). Rigettato.

### ⚠️ WARNING #2 — Decade oltre 46.582,71 € ISEE (gia presente)

**DeepSeek dice**: "La maggiorazione per entrambi i genitori lavoratori dovrebbe specificare che si applica solo per ISEE sotto soglia"

**Realta**: il testo dice gia: "fino a +34,10 €/mese per figlio (decrescente con l'ISEE, azzerata oltre 46.582,71 €)". DeepSeek non l'ha letto bene.

**Decisione**: rigettato.

## Dati confermati corretti da DeepSeek

- Importi base minorenni (203,80 max e 58,30 min) ✅
- Soglie ISEE 17.468,51 e 46.582,71 ✅
- Importi maggiorenni 18-21 (85 max, 25 min) ✅
- Maggiorazione +50% sotto 1 anno ✅
- Maggiorazione 150 €/mese forfait per 4+ figli ✅
- Maggiorazione madre under 21: +22,80 € ✅
- Decorrenza dal mese di domanda ✅
- Pagamenti mensili entro fine mese ✅
- Regole separati/divorziati 50/50 default ✅

## Status frontmatter

Cambiato a `published` con annotazione del fact-check fallback e della modifica difensiva.

## Costo verifica

$0.0018 (1.800 microUSD) — DeepSeek V3, 5.681 token totali.

## Note

Questo e l'unico dei 3 fact-check fallback in cui una segnalazione di errore bloccante si e rivelata legittima (anche se DeepSeek non ha potuto fornire i numeri corretti). La modifica difensiva applicata aderisce alla regola **ZERO INVENZIONI**: dove non si puo certificare al centesimo, si rinvia alla fonte ufficiale.

Quando l'organizzazione Anthropic tornera disponibile, vale la pena rilanciare il subagent fact-checker dedicato (con accesso a WebFetch su inps.it) per recuperare gli importi disabilita esatti e ripristinare la tabella nel testo.
