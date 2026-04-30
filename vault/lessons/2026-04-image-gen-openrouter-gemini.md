---
title: "Lesson: generazione immagini OG via OpenRouter + Google Gemini Image"
type: lesson
tags: [image-gen, openrouter, gemini, og-image, seo]
created: 2026-04-29
related: [[lessons/2026-04-org-usage-limit]], [[lessons/2026-04-cross-repo-deploy-sandbox-restricted]], [[procedure/04-pubblicazione-articolo]]
severity: medio
---

# Generazione immagini OG via OpenRouter + Gemini Image

## Contesto

Sito principale (10 articoli published) senza nessuna immagine hero / OG image dedicata: anteprima social Facebook/WhatsApp/X usava il default `og-default.png` per tutti gli articoli, riducendo CTR e differenziazione.

L'utente ha chiesto di creare immagini editoriali per ogni articolo, dietro budget limitato.

## Sintomo / problema

- 10 articoli senza thumbnail visiva nella lista `/blog`
- 10 articoli senza immagine hero nell'apertura del singolo articolo
- 10 articoli con OG image identica generica
- CTR social potenzialmente sotto la media perche manca differenziazione visiva

## Soluzione applicata

### Stack

- **API**: OpenRouter `chat/completions` con `modalities: ["image", "text"]`
- **Modello scelto**: `google/gemini-3-pro-image-preview` (Gemini 3 Pro Image)
  - Costo: ~$0.10/img (vs $0.04 di Gemini 2.5 Flash Image)
  - Qualita visivamente superiore, palette piu coerente, meno tendenza a AI-slop
  - Input: solo prompt testo, niente reference image richiesta
  - Output: PNG base64 in `choices[0].message.images[0].image_url.url`
- **Post-processing**: PIL (Python Pillow) per crop center 16:9 + resize 1200x630 + JPEG quality 88 progressive
  - Gemini ritorna PNG quadrato 1024x1024 nonostante prompt richieda 1200x630
  - Output finale: ~80-150 KB JPEG (target <200 KB per OG)

### Script riutilizzabile

`sito/scripts/generate-og-via-openrouter.py`:
- Dict `PROMPTS = {"<article-slug>": "<prompt>"}` estendibile
- CLI: `python generate-og-via-openrouter.py <slug>` per uno solo, `python generate-og-via-openrouter.py` per batch
- Salva in `sito/public/og/<slug>.jpg`
- Stampa cost per chiamata

### Prompt template "Adriatic Blue editoriale"

Costanti applicate a TUTTI i prompt (variabile `COMMON_STYLE` nello script):

```
Style: Modern editorial illustration, sober Italian magazine style.
Adriatic Blue palette only:
- deep blue #0A4DA2
- water blue #18A0D8
- warm gold #E8B547
- cream paper #EEF3F8
- ink #0C1B2E

Composition: Wide horizontal 1200x630 (Open Graph format).
Negative space on left half, main subject on the right half.

Strict rules:
- NO human faces, NO people, NO realistic photos
- NO readable text, NO numbers, NO letters as design elements
- NO logos, NO brand names, NO trademark-like marks
- NO purple, NO pink, NO neon
- NO AI-slop tropes (no glowing orbs, no rainbow gradients, no chromatic aberration)
- Hand-drawn illustration feel with gentle vector shapes
- Italian institutional sober mood, calm, trustworthy
```

### Integrazione Astro

Per far apparire l'immagine sul sito (non solo come OG meta):

1. **Frontmatter articolo**:
   ```yaml
   image: /og/<slug>.jpg
   image_alt: "Descrizione editoriale dell'illustrazione."
   ```
2. **Schema content collection** (`sito/src/content.config.ts`): campi `image` e `image_alt` gia opzionali
3. **ArticleLayout.astro**: aggiungere `<figure><img src={article.data.image} ...></figure>` sopra ArticleMeta + propagare `ogImage={article.data.image}` a BaseLayout
4. **ArticleCard.astro**: aggiungere `<a href={href}><img ... class="aspect-[16/9] object-cover" /></a>` sopra il `.p-6` interno
5. **BaseLayout.astro**: gia letto `ogImage` da SEO component (verificato 2026-04-28 nel debug iniziale)

## Insidie note

### Il modello restituisce 1024x1024 invece di 1200x630

Gemini Image (sia Flash che Pro) ignora completamente le richieste di dimensioni nel prompt. Output sempre quadrato. Il post-processing PIL **e' obbligatorio**: senza, non hai aspect ratio OG canonico.

### Bug iniziale "og:image punta al default"

Anche con frontmatter `image:` valorizzato, l'`og:image` HTML usciva con il default. Causa: `ArticleLayout.astro` non passava `ogImage={article.data.image}` a `<BaseLayout>`. Una linea di edit. Verifica con:

```bash
curl -s https://.../blog/<slug> | grep -oE 'og:image"\s+content="[^"]+'
```

Deve puntare al nuovo `/og/<slug>.jpg`.

### .gitignore escludeva public/og/

Il `.gitignore` originale aveva `public/og/` (era stato pensato per OG generate al build con satori). Quando lo script Python committa asset versionati, va rimossa la regola altrimenti `git add` salta silenziosamente.

### Costo non e per token: e per immagine

OpenRouter pricing per modelli image-gen: il campo `pricing.image` non e sempre popolato; il costo arriva nel campo `usage.cost` della response. Per Gemini 3 Pro Image stimato ~$0.10/img dalle prime risposte.

### Modello ignora "no readable text"

Anche con prompt esplicito "NO readable text", il modello a volte produce squiggle che sembrano lettere o testo storpio. In quel caso si rigenera (max 3 tentativi). Per minimizzare: chiedere composizioni puramente astratte/geometriche, evitare di chiedere "calendari con date X" (il modello cerca di scriverle).

## Lezione astratta

### 1. OpenRouter come universal LLM gateway funziona anche per image-gen

OpenRouter abilita l'accesso a Gemini Image (e altri modelli) con la stessa API che si usa per chat completion. Stessa key, stessa response shape, basta `modalities: ["image", "text"]` nel body.

### 2. Modello superiore vale la differenza per branding

Gemini 3 Pro Image vs 2.5 Flash: il costo passa da $0.04 a $0.10 (2.5x). Per uso editoriale di brand serio (CAF, Patronato), la qualita superiore vale la differenza. Gemini 2.5 Flash bene per drafts/test, Gemini 3 Pro per produzione.

### 3. JPEG OG image: target sotto 200 KB

OG image troppo grandi (>500 KB) vengono saltate dai crawler social. Target 80-200 KB. JPEG quality 88 progressive offre il miglior compromesso visivo/peso. PNG e' troppo grande per output 1200x630 di tipo "fotografico" - va bene solo per illustrazioni piatte.

### 4. Asset versionati > generazione al build

Avevamo pensato di generare le OG image al build (via Satori). Pratica meno robusta: dipendenze build piu pesanti, possibili variazioni tra build diverse, piu lento il deploy. **Asset commitati nel repo** (~1 MB totale per 10 immagini) sono piu predictable.

### 5. Workflow "test 1, poi scala"

Per task creativi (immagini, copy, design), generare 1 esempio prima e validare visivamente con l'utente. Solo dopo l'OK, scalare al batch. Risparmia costi e iterations.

## Snippet riusabili

### Generate one image

```bash
cd /home/user/Varie/sito
export OPENROUTER_API_KEY='sk-or-...'
python3 scripts/generate-og-via-openrouter.py <slug>
```

### Batch generate (tutti i prompt nel dict PROMPTS)

```bash
cd /home/user/Varie/sito
export OPENROUTER_API_KEY='sk-or-...'
python3 scripts/generate-og-via-openrouter.py
```

### Verifica OG meta tag live

```bash
curl -s https://praticheflaiano-sito.vercel.app/blog/<slug> \
  | grep -oE '(og:image|twitter:image)"\s+content="[^"]+' \
  | head -3
```

### Aggiunta articolo nel batch

In `sito/scripts/generate-og-via-openrouter.py`:

```python
PROMPTS = {
    # ...
    "<new-slug>": (
        "Editorial illustration about <topic>.\n\n"
        "Subject: <abstract symbolic composition>.\n"
        + COMMON_STYLE
    ),
}
```

E nel frontmatter dell'articolo:

```yaml
image: /og/<new-slug>.jpg
image_alt: "<descrizione>"
```

## Costo storico cumulato

| Data | Operazione | Costo |
|---|---|---|
| 2026-04-29 | Pilota Precompilata 2026 (Gemini 2.5 Flash) | $0.039 |
| 2026-04-29 | Batch 10 articoli (Gemini 3 Pro) | ~$1.00 (stima) |

## Vedi anche

- [[lessons/2026-04-org-usage-limit]] - workaround simile via OpenRouter quando subagent Anthropic bloccati
- [[lessons/2026-04-cross-repo-deploy-sandbox-restricted]] - altro workaround sandbox restrictions
- [[riferimenti/credenziali-deploy]] - sezione OpenRouter
- File: `sito/scripts/generate-og-via-openrouter.py`
- File: `sito/src/layouts/ArticleLayout.astro`
- File: `sito/src/components/blog/ArticleCard.astro`
- File: `sito/src/content.config.ts` (schema `image`, `image_alt`)
