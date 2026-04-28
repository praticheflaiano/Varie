---
title: "Lesson: anti-ripetizione tra sito principale e portali verticali (mappa vs dettaglio)"
type: lesson
tags: [content, seo, editoriale, multi-site]
created: 2026-04-29
related: [[procedure/01-workflow-editoriale]], [[lessons/2026-04-cross-repo-deploy-sandbox-restricted]]
severity: medio
---

# Anti-ripetizione tra sito principale e portali verticali: "mappa" vs "dettaglio"

## Contesto

Il Centro Pratiche Flaiano ha **due siti pubblici distinti**:
1. **Sito principale** `praticheflaiano-sito.vercel.app` - blog editoriale del CAF/Patronato, copre tutta la gamma servizi
2. **Portale NASpI verticale** `domandedisoccupazione.it` - sito specifico con calcolatori, OCR, 30+ guide solo su disoccupazione

L'utente chiede di "ampliare i contenuti NASpI sul sito principale" + "ampliare le guide sul portale NASpI" + "**attenzione alle ripetizioni**".

## Sintomo del problema

In assenza di una strategia, due rischi:
- **Cannibalizzazione SEO**: stesso topic + parole chiave su due domini dello stesso brand → Google ne sceglie uno e penalizza l'altro per duplicate-intent
- **Confusione utente**: lo stesso contenuto disponibile su due siti diversi degrada la UX
- **Costo manutenzione**: ogni aggiornamento normativo va replicato su due posti

## Strategia adottata: "mappa vs dettaglio"

Distinzione editoriale netta:

### Sito principale = MAPPA

Articoli che inquadrano il problema dal **punto di vista CAF/Patronato del Centro Pratiche Flaiano**:
- Workflow operativo umano (ufficio fisico, prenotazione, appuntamento)
- Ruoli istituzionali (cosa fa Patronato gratis vs cosa fa CAF)
- Cross-categoria (NASpI + ISEE + AUU + 730 in un unico flusso)
- Geo-SEO Roma + zone servite
- Cross-link al portale verticale per "il calcolo concreto"

**Esempi concreti scritti il 2026-04-29**:
- "Hai perso il lavoro? La checklist dei primi 7 giorni" (procedurale CAF/Patronato)
- "NASpI 2026: cosa fa il Patronato gratis e cosa fa il CAF" (chiarezza ruoli + convenzioni)

### Portale verticale = DETTAGLIO TECNICO

Guide approfondite su **casi specifici** che non rientrerebbero in un blog generalista:
- Casuale per casuale (es. dimissioni periodo prova / dimissioni stipendio non pagato / dimissioni mobbing)
- Dettagli normativi spinti (codici UNILAV, circolari INPS specifiche)
- Tool interattivi (calcolatore importi, OCR documenti, simulatori)

**Esempi concreti scritti il 2026-04-29**:
- "Dimissioni in periodo di prova: tutti i casi"
- "NASpI dopo licenziamento: tutti i tipi e procedura"
- "NASpI dopo cessazione contratto a termine"

## Il principio: "rimanda" vs "ripete"

Per ogni contenuto:
- **Sul sito principale**: si menzionano i tools del portale verticale linkando, NON si replicano
- **Sul portale verticale**: si menziona il workflow ufficio del sito principale linkando, NON si replica

Esempio operativo: **calcolo importo NASpI**
- Sito principale: "L'importo mensile massimo NASpI 2026 e 1.584,70 € (rivalutato +1,4% ISTAT). Per il calcolo personale, usa il [calcolatore NASpI 2026](https://domandedisoccupazione.it/calcolatore)"
- Portale verticale: pagina `/calcolatore` con form interattivo che produce il calcolo

Stesso fatto, due ruoli editoriali distinti.

## Mappatura per anti-ripetizione

Prima di scrivere un articolo cross-tema, **inventario di cosa esiste sull'altro sito**:

```bash
# Sul portale verticale: lista guide
ls /tmp/domande-disoccupazione-web/src/pages/guida/*.astro
ls /tmp/domande-disoccupazione-web/src/pages/obblighi/*.astro

# Sul sito principale: articoli per categoria
grep -l "^status: published" content/categoria-x/*.md
```

Confronto:
- **Esiste sul verticale**: NON replicare. Linkalo.
- **Non esiste**: scrivilo dove il tono editoriale e piu adatto (mappa o dettaglio?)
- **Esiste su entrambi con angolature diverse**: lascia, ma cross-linka.

## Cross-link bidirezionale (il minimo sindacale)

Per garantire che la "mappa" e il "dettaglio" siano sempre raggiungibili:

### Dal sito principale al verticale

- Voce navbar dedicata (es. "Disoccupazione")
- Card prominent sulla pagina servizi/cluster pertinente
- Link in footer
- Link inline in articoli che toccano il topic

### Dal verticale al principale

- Topbar sempre visibile con "Torna al sito principale Pratiche Flaiano"
- Footer con sezione "Altri portali" o "Sito principale"
- Link inline su pagine che menzionano servizi non-NASpI

### Brand unification visiva

Aggiunge un altro layer di anti-confusione: stessa palette, stessi font, stesso brand-mark, stesso footer dark. Vedi `vault/lessons/2026-04-cross-repo-deploy-sandbox-restricted.md` per il workflow.

## Lezione astratta

### 1. Due siti dello stesso brand non sono "doppia visibilita", ma "rischio cannibalizzazione"

Senza strategia editoriale, Google penalizza. Con strategia, **i due siti si rinforzano** (link interni, autorita di dominio cumulata, copertura long-tail differenziata).

### 2. Distinzione editoriale prima di SEO

Decidi PRIMA il ruolo editoriale di ogni articolo (mappa? dettaglio?), poi scrivilo. SEO viene da solo se l'editoriale e chiaro.

### 3. "Linka, non duplicare" come regola d'oro

Il copia-incolla tra siti dello stesso brand e l'errore piu comune. Quando viene voglia di replicare, fermati e linka.

### 4. Topic cluster cross-site

Il topic "NASpI" non e UN articolo: e un **cluster** che si distribuisce naturalmente:
- Sul sito principale: 2-4 articoli istituzionali ("la mappa")
- Sul portale verticale: 30+ guide tecniche ("il dettaglio")

E un'architettura editoriale stile **silo orizzontale** che funziona per chi ha diversi domini.

## Mitigazione futura

### Workflow di pubblicazione cross-site

Aggiungere a `vault/procedure/04-pubblicazione-articolo.md` uno step pre-scrittura:

```
Step 0 - Recon anti-ripetizione cross-site
- Inventario articoli esistenti sull'altro sito sul topic
- Decidi ruolo editoriale del nuovo articolo (mappa vs dettaglio)
- Identifica i 2-3 cross-link bidirezionali rilevanti
```

### Convenzione naming

Nei file frontmatter o nel commit message, esplicitare il ruolo:

```yaml
---
editorial_role: "mappa"  # oppure "dettaglio"
cross_links_to_external_site:
  - https://altro-sito.it/pagina-rilevante
---
```

(Non implementato ancora, valutare a fine 2026 se i due siti continuano a crescere.)

## Vedi anche

- [[procedure/01-workflow-editoriale]]
- [[procedure/04-pubblicazione-articolo]]
- [[lessons/2026-04-cross-repo-deploy-sandbox-restricted]]
- [[riferimenti/dati-ufficio]] - URL dei due siti
