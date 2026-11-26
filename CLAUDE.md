# Blog Centro Pratiche Flaiano - CAF UNSIC e Patronato ENASC

## Identita

Blog informativo del **Centro Pratiche Flaiano**, CAF affiliato UNSIC e Patronato ENASC.
Sede: Via Filoteo Alberini 25 int 10, 00139 Roma (Centro Acquisti Flaiano, zona Vigne Nuove).
Zone servite: Vigne Nuove, Tufello, Conca d'Oro, Bufalotta, Porta di Roma, Municipio III Montesacro.
Tel: 0697845429 | WhatsApp: 3716230690 | Email: info@praticheflaiano.it
Orari: Lun-Gio 9:30-13:00 / 15:30-18:00 | Ven 9:30-14:00
Sito: praticheflaiano.it | Tessera: 30 euro/anno per nucleo familiare (semestrale 20 euro non pubblicizzata)
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

## Link a calcolatori e documenti: sempre come pulsante grande

Regola di Antonio (21/11/2026): i rimandi a calcolatori e PDF devono essere ben visibili, mai un link nel testo.
- Negli articoli (markdown): una citazione con un solo link allo strumento, es.
  `> [calcolatore del bollo auto](/calcolo-bollo-auto): scopri se sei esente e quanto paghi.`
  Il plugin `sito/src/lib/remark-cta.mjs` la trasforma in pulsante (vale per /calcolo-*, /assegno-vedovanza, /calcolatore*, file .pdf).
- Stesso sistema per le prenotazioni: `> [Prenota l'ISEE 2027 gratis](https://link.arcanis.it/widget/booking/...): sottotitolo` oppure `(/prenota)` diventa un pulsante con il calendario. Metterne uno subito dopo il riquadro "In breve" negli articoli più letti (strategia SEO del 23/11/2026).
- Nelle pagine/fragment HTML: usare la classe `pdf-btn` (landing.css) come nella pagina ISEE.

## Accessibilità: regole per ogni pagina e ogni articolo

Regola di Antonio (24/11/2026): queste pratiche valgono su tutte le pagine, nuove e vecchie. Il 24/11/2026 il controllo axe (WCAG 2 A/AA) dava zero errori su tutte le 239 pagine: va mantenuto così.
- **Contrasto**: testo piccolo almeno 4,5:1 sullo sfondo. Coppie già verificate: bianco su viola `#5B3DF5`; bianco su rosa `#DB2E6B` (mai bianco su `#FF5C8A`); sottotitoli `#F1EEFF` su viola (mai `#DCD5FF`); testo scuro `#14142B` sul verde WhatsApp `#25D366` (mai bianco); bianco su verde `#15803D`; grigio `#A3A3BD` su sfondo scuro `#14142B`. Colori di categoria in `sito/src/utils/categories.ts`: usare solo toni scuri (es. `#B81F56`, `#B03A0A`, `#0E7038`).
- **Link nei testi**: sempre sottolineati (lo fa il CSS per i link senza classe dentro `main` e dentro `.lp`). Se un link ha una classe o sta fuori da p/li/td, aggiungere `text-decoration:underline`.
- **Titoli in ordine**: dopo l'h1 viene un h2, mai saltare a h3/h4. Le card articolo e i titoli del piè di pagina sono h2. Negli articoli il riquadro iniziale usa `> **In breve**`, non `> ### In breve`.
- **Zone da toccare**: link e pulsanti alti almeno 24 px (per i link di solo testo isolati: `display:inline-block;padding:4px 0`).
- **Link con lo stesso testo**: due link con lo stesso testo nella stessa pagina devono portare allo stesso indirizzo. Se portano a pagine diverse, cambiare il testo o aggiungere un `aria-label` che inizia con il testo visibile (es. nel piè di pagina: "Pensioni: il servizio" e "Pensioni: articoli del blog"). Evitare testi generici come "la nostra pagina".
- **Campi dei moduli**: ogni input, select e textarea ha un'etichetta (`<label>` oppure `aria-label`).
- **Articoli markdown**: caselle `- [ ]`, tabelle scorrevoli e intestazioni vuote sono sistemate da `sito/src/lib/rehype-a11y.mjs`. Dopo una modifica a quel file cancellare la cache (`rm -rf sito/node_modules/.astro`) prima della build.
- **Domande frequenti negli articoli** (dal 26/11/2026): `sito/src/lib/rehype-faq.mjs` trasforma ogni domanda della sezione "## Domande frequenti" (`### Domanda?` o `**Domanda?**`) in un riquadro apribile `<details class="faq-item">`; la risposta resta sempre nell'HTML, quindi Google la legge. Le guide (ToolGuideLayout, NaspiGuideLayout) usano lo stesso riquadro. Mai nascondere le risposte con componenti che le scrivono solo all'apertura.
- **Prima di pubblicare** pagine o componenti nuovi: controllo con axe-core sulle pagine toccate (Playwright + `axe.run` con `wcag2a`, `wcag2aa`, `best-practice`) e correggere ogni errore.

## Sezione NASpI e disoccupazione (dal 25/11/2026)

Decisione di Antonio (25/11/2026): guide, calcolatori e strumenti su NASpI e disoccupazione vivono su praticheflaiano.it; il vecchio portale domandedisoccupazione.it rimanda qui pagina per pagina.
- Pagine: `/calcolo-naspi`, `/anticipo-naspi`, `/naspi/domanda`, `/naspi/fondo-garanzia-tfr`, `/naspi/ricorso` (le altre guide del portale arrivano una alla volta, solo dopo la verifica sulle fonti ufficiali).
- Strumenti React in `sito/src/naspi/` (unico punto del sito con React). Vanno sempre dentro un contenitore con classe `nz` (colori e raggi in fondo a `global.css`).
- Guide: layout `sito/src/layouts/NaspiGuideLayout.astro` (slot `intro`, `tool`, testo). Dà alle guide gli stessi elementi degli articoli: copertina (`python3 sito/scripts/genera-og-card.py` su un .md con slug, title, category naspi-disoccupazione, type guida), autore e date, tempo di lettura, pulsante Prenota dopo "In breve", fonti ufficiali con link (`{ t, url }`), "Vuoi che ce ne occupiamo noi?", avvertenze standard, articoli correlati, Condividi. In ogni guida: almeno 2-3 volte Roma e una zona servita, "Roma" nella description, sezione "Come ti aiutiamo", link a calcolatori solo come pulsante `cta-tool`.
- Pagine calcolatore (`/calcolo-naspi`, `/anticipo-naspi`): come gli altri calcolatori del sito, riga "Ultimo aggiornamento", pulsante o link Prenota, fonti con link, copertina in `ogImage`.
- Elenco delle guide: `sito/src/components/blog/PortaleNaspi.astro`. Quando una guida viene trasferita: cambiare lì il suo indirizzo e aggiungere il rimando nel `vercel.json` del portale. I rimandi di praticheflaiano.it invece stanno in `vault/riferimenti/vercel-produzione/vercel.json` e valgono solo dopo un deploy con i due file (vedi il LEGGIMI in quella cartella): un semplice redeploy non li legge.
- Importi NASpI in `sito/src/naspi/constants.ts`: ogni gennaio aggiornarli con la circolare INPS sugli importi massimi e cambiare `LAST_UPDATED`.
- La lettura dei documenti del calcolatore passa da `/api/naspi/analyze-document`, girato alla funzione del portale (rewrite nel `vercel.json` di produzione: `vault/riferimenti/vercel-produzione/`, non in `sito/vercel.json`).

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
| Ottimizzare con i dati di Search Console (domande reali) | `vault/procedure/08-ottimizzazione-search-console.md` + `docs/regole-contenuto.md` 4-ter |

## Stato infrastruttura (2026-04-28)

- **Sito web**: live su https://praticheflaiano-sito.vercel.app (Astro 5 + Tailwind v4 + Svelte islands, design "Adriatic Blue")
- **Vercel project**: `praticheflaiano-sito`, rootDirectory `sito`, SSO disattivata
- **GitHub**: repo `praticheflaiano/Varie`, branch attivo `claude/identify-project-ULhhV`, PR draft #1 aperta
- **Articoli published**: 4 (Precompilata 2026, Guida 730/2026, IVA 2026, Rottamazione Quinquies 2026)
- **Token Vercel temporanei usati e da revocare**: vedi `vault/riferimenti/credenziali-deploy.md`

## Pagine calcolatore impaginate come articoli (dal 26/11/2026)
Regola di Antonio: anche le pagine con un calcolatore seguono l'impaginazione degli articoli. Usare `sito/src/layouts/ToolGuideLayout.astro` (props: title, description, path, h1, kicker, crumbs, category, prenota, updated, published, image, imageAlt, sources, faq, related; slot intro = "In breve", tool = calcolatore, testo nel slot predefinito). Esempi: `/calcolo-tfr-colf-badanti`, `/calcolo-costo-colf-badante`.
