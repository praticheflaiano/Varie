# Blog Centro Pratiche Flaiano - CAF UNSIC e Patronato ENASC

## Identita

Blog informativo del **Centro Pratiche Flaiano**, CAF affiliato UNSIC e Patronato ENASC.
Sede: Via Filoteo Alberini 25 int 10, 00139 Roma (Centro Acquisti Flaiano, zona Vigne Nuove).
Tel: 0697845429 | WhatsApp: 3716230690 | Email: info@praticheflaiano.it
Orari: Lun-Gio 9:30-13:00 / 15:30-18:00 | Ven 9:30-14:00
Sito: praticheflaiano.it | Tessera: 30 euro/anno o 20 euro/semestre per nucleo familiare

## Servizi

- **CAF**: 730, ISEE/DSU, IMU/TASI, TARI, Successioni e Volture, Contratti affitto, Bonus fiscali
- **Patronato**: Pensioni, Legge 104/invalidita, Accompagno, Assegno Unico, Maternita/bonus nido, ADI/SFL, NASpl
- **Generali**: PEC, Rateizzazioni, Utenze, Assicurazioni, Cambio residenza, Certificati, Comunicazioni AdE

## Directory

- `docs/` → Riferimenti: style-guide, calendario fiscale, tassonomia, personas, compliance legale
- `content/_templates/` → 4 template articoli (informativo, scadenza, guida, novita)
- `content/<categoria>/` → 12 directory per articoli pubblicati
- `calendar/` → Piano editoriale attivo
- `social/` → Output post Facebook e WhatsApp
- `.claude/agents/` → 5 subagent specializzati
- `.claude/skills/` → 5 slash command invocabili

## Regola fondamentale: ZERO INVENZIONI

Ogni articolo tratta materia fiscale/previdenziale. Un dato errato causa danni reali ai lettori.
- MAI inventare date, importi, percentuali o scadenze
- MAI dare per scontato che una scadenza dell'anno precedente sia uguale quest'anno
- Citare SEMPRE la fonte normativa (Circolare INPS n. X, Risoluzione AdE, D.L./D.Lgs.)
- Se un dato non e verificabile al momento della scrittura, scrivere "in corso di definizione"
- Ogni articolo deve avere data "ultimo aggiornamento" e disclaimer

## Workflow standard

1. Pianifica → `editorial-planner` o `/plan-month [mese] [anno]`
2. Scrivi → `content-writer` o `/write-article [topic] [tipo]`
3. Verifica → `fact-checker` o `/review-article [path]` (OBBLIGATORIO prima della pubblicazione)
4. Ottimizza SEO → `seo-specialist` (parte di /review-article)
5. Promuovi → `social-media-manager` o `/create-social [path]`

## Stile

Tono autorevole, empatico, rassicurante. Linguaggio semplice. Spiegare i termini tecnici.
Max 1200-1800 parole per articolo. Max 3 CTA per pagina. Fonti ufficiali sempre linkate.
Output: Markdown formattato per copia-incolla + compatibile GHL via API.
Leggere `docs/style-guide.md` prima di scrivere qualsiasi contenuto.

## Comandi disponibili

- `/write-article [argomento] [informativo|scadenza|guida|novita]`
- `/review-article [percorso-articolo]`
- `/plan-month [mese] [anno]`
- `/create-social [percorso-articolo]`
- `/update-calendar`
