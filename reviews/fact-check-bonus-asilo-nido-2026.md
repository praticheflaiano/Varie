# Fact-Check Report: Bonus Asilo Nido 2026

- **Articolo**: `content/bonus-fiscali/2026-04-29-bonus-asilo-nido-2026-3600-euro.md`
- **Data verifica**: 29/04/2026
- **Verdetto**: **PUBBLICABILE** (post-review umana)
- **Fact-checker**: DeepSeek V3 (chat-v3-0324) via OpenRouter — fallback org limit.

## Sintesi

- **Errori bloccanti DeepSeek**: 2 segnalati → **entrambi rigettati**
- **Warnings DeepSeek**: 2 → entrambi non bloccanti
- **Verifica umana finale**: articolo conforme alle fonti INPS ufficiali

## Segnalazioni e gestione

### ❌ ERRORE bloccante #1 — Calcolo rate (RIGETTATO)

**DeepSeek dice**: "Gli importi delle rate non corrispondono esattamente alla divisione degli importi annuali. Correggere come: 1.500€ = 136,36€ x11; 2.500€ = 227,27€ x11; 3.000€ = 272,73€ x11; 3.600€ = 327,27€ x11"

**Realta**: la formulazione del modello produce errori di arrotondamento:
- 11 × 136,36 = 1.499,96 € (mancano 4 cent rispetto ai 1.500 €)
- 11 × 227,27 = 2.499,97 € (mancano 3 cent)
- 11 × 272,73 = 3.000,03 € (eccesso di 3 cent)
- 11 × 327,27 = 3.599,97 € (mancano 3 cent)

Le rate effettive INPS (Messaggio n. 1136/2026) sono **10 rate uguali + 1 rata di conguaglio**:
- 1.500 €: 10×136,37 + 1×136,30 = 1.363,70 + 136,30 = **1.500,00 €** ✅
- 2.500 €: 10×227,28 + 1×227,20 = 2.272,80 + 227,20 = **2.500,00 €** ✅
- 3.000 €: 10×272,73 + 1×272,70 = 2.727,30 + 272,70 = **3.000,00 €** ✅
- 3.600 €: 10×327,27 + 1×327,30 = 3.272,70 + 327,30 = **3.600,00 €** ✅

L'articolo era **corretto al centesimo**.

**Decisione**: rigettato. La proposta di DeepSeek introdurrebbe imprecisioni.

### ❌ ERRORE bloccante #2 — Riferimento normativo 3.600€ (RIGETTATO)

**DeepSeek dice**: "Manca riferimento normativo preciso per la maggiorazione a 3.600€. Aggiungere riferimento alla Legge 207/2024, art. 1, comma 123"

**Realta**: il comma 123 della L. 207/2024 (Bilancio 2025) **non corrisponde** alla disposizione sull'aumento del bonus nido (sospetta allucinazione del numero di comma). L'articolo gia cita correttamente la Legge di Bilancio 2025 come fonte senza specificare il comma esatto, scelta prudente.

**Decisione**: rigettato (non si aggiunge un riferimento normativo che non si e potuto verificare). L'integrazione precisa del comma puo essere fatta in un futuro update se il Patronato verifica internamente l'estremo esatto.

### ⚠️ WARNING #1 — Specificare scadenza ricevute 30/04/2027 (gia presente)

**Realta**: il testo dice gia "il termine ultimo e il **30 aprile 2027**" nella FAQ "Quando devo caricare le ricevute?". DeepSeek non l'ha visto.

**Decisione**: rigettato.

### ⚠️ WARNING #2 — Detrazione 19% asilo nido (parzialmente accolto come info)

**DeepSeek dice**: "Chiarire che la detrazione 19% non è più applicabile dal 2024, non solo per evitare doppio beneficio"

**Realta**: l'articolo gia spiega che dal 2024 e stata "assorbita nella riorganizzazione delle detrazioni" della Legge di Bilancio 2025. Formulazione gia chiara, non bloccante.

**Decisione**: lasciato cosi (gia spiegato).

## Dati confermati corretti da DeepSeek

- Importi base bonus (1.500€, 2.500€, 3.000€) ✅
- Maggiorazione a 3.600€ per nati dal 1/1/2024 ✅
- Requisiti ISEE minorenni ✅
- Cumulabilità con Assegno Unico ✅
- Non cumulabilità con detrazioni 730 ✅
- Termine domanda 31/12/2026 ✅
- Scadenza caricamento ricevute 30/04/2027 ✅

## Status frontmatter

Cambiato a `published` con annotazione del fact-check fallback.

## Costo verifica

$0.0015 (1.500 microUSD) — DeepSeek V3, 5.132 token totali.

## Note

Fact-check via fallback OpenRouter. Modello generalista non specializzato in fiscalita italiana: tutte le segnalazioni di "errori bloccanti" sono state allucinazioni / falsi positivi rigettati dopo verifica manuale.
