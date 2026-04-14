# Regole Contenuto - Centro Pratiche Flaiano

Documento unificato delle regole editoriali, SEO, legali e di compliance per il blog del Centro Pratiche Flaiano (CAF UNSIC / Patronato ENASC, Roma).

**Tutti gli agenti devono leggere questo file prima di operare.**

---

## 1. REGOLA ZERO: Nessuna Invenzione

Ogni articolo tratta materia fiscale o previdenziale. Un dato errato puo causare sanzioni economiche, perdita di benefici o ricorsi legali per i lettori.

### Regole assolute
- **MAI inventare** date, importi, percentuali, scadenze, soglie di reddito
- **MAI dare per scontato** che una norma o scadenza dell'anno precedente sia ancora valida
- **MAI citare** una legge, circolare o risoluzione senza averla verificata su fonte ufficiale
- **MAI presentare come definitivo** un dato non confermato: scrivere "in corso di definizione" o "[DA VERIFICARE]"
- **MAI confondere** l'anno di imposta con l'anno di dichiarazione

### Esempi concreti di errori da evitare
- ERRATO: "Nel 730/2026 si applica la nuova aliquota IRPEF al 33%"
  CORRETTO: "Il 730/2026 dichiara i redditi 2025, dove l'aliquota e ancora 35%. La riduzione al 33% si applichera nel 730/2027"
- ERRATO: "L'importo dell'Assegno Unico e di 199 euro" (importo del 2025)
  CORRETTO: "L'importo dell'Assegno Unico per il 2026, rivalutato del 1,4%, e di X euro (Fonte: Circolare INPS n. Y del GG/MM/AAAA)"
- ERRATO: "Quota 103 permette di andare in pensione a 62 anni"
  CORRETTO: Verificare se Quota 103 e ancora attiva nell'anno corrente prima di scrivere

### Cosa fare se non si verifica un dato
1. Cercare su fonti ufficiali (inps.it, agenziaentrate.gov.it, gazzettaufficiale.it)
2. Se non si trova: scrivere "[DA VERIFICARE]" nel testo
3. Segnalarlo al fact-checker
4. Se il fact-checker non riesce a verificare: NON pubblicare quel dato

---

## 2. Anno di Imposta vs Anno di Dichiarazione

Distinzione critica e fonte di errori frequenti:

| Modello | Periodo d'imposta | Anno presentazione |
|---|---|---|
| 730/2026 | redditi 2025 | tra aprile e settembre 2026 |
| 730/2027 | redditi 2026 | tra aprile e settembre 2027 |

Una norma che entra in vigore "dal 1 gennaio 2026" si applica ai redditi 2026, quindi nel **730/2027** (NON nel 730/2026).

**Verifica sempre**: "questa norma riguarda il periodo d'imposta [anno] o il modello dichiarativo [anno]?"

---

## 3. Stile e Tono

### Lingua
- Esclusivamente in italiano
- Forma "Lei" quando ci si rivolge al lettore
- Spiegare i termini tecnici tra parentesi al primo utilizzo (es. "ISEE - Indicatore della Situazione Economica Equivalente")
- Niente anglicismi se esiste un equivalente italiano chiaro

### Tono
- **Autorevole**: chi scrive padroneggia la materia
- **Empatico**: il lettore e una persona confusa dalla burocrazia
- **Rassicurante**: trasmettere che la pratica e gestibile
- **MAI allarmistico**: "potrebbe costarti migliaia di euro" senza fonte e vietato
- **MAI promozionale aggressivo**: informare prima, vendere come conseguenza

### Formattazione
- Frasi brevi e dirette
- Paragrafi di 3-4 righe massimo
- Elenchi puntati per documenti, requisiti, passaggi
- Tabelle per confronti o fasce di importi
- Grassetto per termini chiave

---

## 4. Struttura Articolo

### Frontmatter YAML obbligatorio

```yaml
---
title: "Titolo H1"
slug: "slug-breve-con-keyword"
date: YYYY-MM-DD
last_updated: YYYY-MM-DD
category: "categoria-da-tassonomia"
tags: ["tag1", "tag2", "tag3"]
meta_description: "Max 155 caratteri con keyword + Roma"
author: "Redazione Centro Pratiche Flaiano"
sources:
  - "Fonte normativa 1 con riferimento e link"
  - "Fonte normativa 2"
status: draft
type: informativo|scadenza|guida|novita
deadline: YYYY-MM-DD  # solo per articoli tipo scadenza
---
```

### Sezioni obbligatorie
- H1 con keyword primaria
- Riga "Ultimo aggiornamento: GG mese AAAA"
- Introduzione (2-3 frasi)
- Corpo con H2 multipli
- Sezione "Perche rivolgersi al Centro Pratiche Flaiano" (credenziali e geo-targeting)
- CTA contestuale (max 3 in tutto l'articolo)
- Articoli correlati (2-3 link interni)
- Disclaimer obbligatorio

### Lunghezza
- **Target**: 1.200-1.800 parole
- Sotto 1.200: articolo troppo scarno, da espandere
- Sopra 1.800: spezzare in piu articoli con cross-link

### CTA contestuali (max 3)
- Specifici all'argomento, NON generici
- Esempi:
  - 730: "Prenoti il Suo 730 - verifichiamo insieme tutte le detrazioni a cui ha diritto"
  - ISEE: "Rinnovi l'ISEE senza pensieri - inviamo noi la DSU all'INPS"
  - Successioni: "Prenoti una consulenza per la successione - Le spieghiamo passo passo cosa fare"
  - IMU: "Non perda la scadenza IMU - prepariamo noi il modello F24 per Lei"

---

## 5. SEO

### Keyword
- Keyword primaria nel titolo H1, primo paragrafo, almeno un H2
- Densita keyword 1-2% (mai stuffing)
- Suggerire 2-3 keyword secondarie e long-tail

### Meta description
- Max 155 caratteri
- Contiene keyword primaria
- Contiene "Roma" o "CAF Roma" (geo-signal obbligatorio)
- Invito all'azione implicito

### Heading
- Un solo H1
- H2 contengono variazioni della keyword
- Gerarchia H1 > H2 > H3 rispettata

---

## 6. Geo-SEO Locale (OBBLIGATORIO)

Il blog deve posizionarsi per ricerche locali su Roma e specificamente sulla zona Vigne Nuove/Tufello/Conca d'Oro/Municipio III.

### Regole obbligatorie per ogni articolo
- **"Roma"** deve comparire almeno 2-3 volte nel testo (variazioni: "a Roma", "nella Capitale", "romano/a")
- **Almeno una zona servita** menzionata: Vigne Nuove, Tufello, Conca d'Oro, Bufalotta, Porta di Roma, Municipio III Montesacro
- **Meta description** con geo-signal
- **Title tag**: includere "Roma" se possibile senza forzare

### Long-tail locali da targettizzare
- "CAF Roma nord"
- "patronato Vigne Nuove"
- "730 Roma Municipio III"
- "ISEE Conca d'Oro"
- "CAF Porta di Roma"
- "patronato Tufello Montesacro"

### Schema markup LocalBusiness (suggerimento)
```json
{
  "@type": "LocalBusiness",
  "name": "Centro Pratiche Flaiano - CAF UNSIC | Patronato ENASC",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Via Filoteo Alberini 25 int 10",
    "addressLocality": "Roma",
    "postalCode": "00139",
    "addressCountry": "IT"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 41.9505,
    "longitude": 12.5268
  },
  "telephone": "+390697845429",
  "areaServed": ["Vigne Nuove", "Tufello", "Conca d'Oro", "Bufalotta", "Porta di Roma", "Municipio III Montesacro"]
}
```

### Contenuti iper-locali da preferire
- Aliquote IMU specifiche del Comune di Roma (non generiche nazionali)
- TARI Roma con AMA come gestore
- Riferimenti a uffici INPS e Agenzia Entrate di zona

---

## 7. Fonti e Riferimenti Normativi

### Fonti primarie (preferite)
- **Gazzetta Ufficiale**: leggi, decreti-legge, decreti legislativi
  - Formato: "D.L. n. 48/2023, convertito con modificazioni dalla L. n. 85/2023"
- **Circolari INPS**: istruzioni operative su pensioni, prestazioni, contributi
  - Formato: "Circolare INPS n. 45 del 15/03/2026"
- **Risoluzioni Agenzia delle Entrate**: chiarimenti su tematiche fiscali
  - Formato: "Risoluzione AdE n. 12/E del 10/02/2026"
- **Messaggi INPS**: comunicazioni operative specifiche
  - Formato: "Messaggio INPS n. 1234 del GG/MM/AAAA"

### Fonti secondarie (accettabili se accompagnate da fonte primaria)
- inps.it - per procedure e modulistica
- agenziaentrate.gov.it - per guide e FAQ ufficiali
- mef.gov.it - per tematiche di politica fiscale

### Fonti NON accettabili
- Altri blog o siti di informazione fiscale (non sono fonti)
- Wikipedia
- Forum o social media
- Articoli di giornale (non sono fonti normative)
- Frasi tipo "si sa che", "e risaputo che", "generalmente"

### Linkare le fonti
Ogni riferimento normativo deve avere il **link cliccabile alla fonte ufficiale**, non solo il nome della circolare.

---

## 8. Disclaimer Obbligatorio

Ogni articolo DEVE terminare con questo disclaimer (testo esatto):

```
Le informazioni contenute in questo articolo hanno carattere puramente informativo
e non costituiscono consulenza fiscale, legale o previdenziale professionale.
Le normative, gli importi e le scadenze citati sono soggetti a modifiche da parte
del legislatore; si invita a verificare sempre l'attualita delle informazioni
presso le fonti ufficiali (agenziaentrate.gov.it, inps.it, gazzettaufficiale.it).
Per una valutazione personalizzata della propria situazione, si consiglia di
prenotare un appuntamento presso il nostro Centro.

Centro Pratiche Flaiano - CAF UNSIC | Patronato ENASC
Via Filoteo Alberini 25 int 10, 00139 Roma
Tel: 0697845429 | WhatsApp: 3716230690 | info@praticheflaiano.it
Prenotazioni online: https://link.arcanis.it/widget/group/bklXY9sZUszt8V2GpkU1
```

NON e possibile abbreviare o modificare il disclaimer.

---

## 9. Fiducia, Credenziali e Conversioni

### Credenziali da mostrare
In ogni articolo, nella sezione "Perche rivolgersi al Centro Pratiche Flaiano":
- CAF autorizzato **UNSIC** (numero autorizzazione: da inserire quando disponibile)
- Patronato **ENASC**
- Sede in Vigne Nuove, Roma (Municipio III Montesacro)
- Servizi rivolti a: Vigne Nuove, Tufello, Conca d'Oro, Bufalotta, Porta di Roma

### Cosa NON dire
- "Risparmia 800 euro" senza casistica documentata
- "Il 75% dei contribuenti..." senza fonte
- "Siamo i migliori..." (autoreferenziale)
- "Offerta limitata", countdown, urgenze artificiali

### Cosa dire invece
- "Il nostro CAF appone il visto di conformita ai sensi dell'art. 35 D.Lgs. 241/1997"
- "Operiamo nel cuore di Vigne Nuove, al servizio dei contribuenti del Municipio III"
- "Il nostro operatore verifichera tutte le detrazioni a cui Lei ha diritto"

### Strategia conversioni
- **Valore gratuito prima della vendita**: ogni articolo deve dare informazioni complete e utili
- **CTA contestuali**: specifici al servizio trattato, non generici
- **Link diretto prenotazione**: https://link.arcanis.it/widget/group/bklXY9sZUszt8V2GpkU1 (oltre a telefono e WhatsApp)
- **WhatsApp conversazionale**: facilitare risposta immediata, non solo informare

### Testimonianze (opzionale)
Se si usano testimonianze:
- Solo con consenso scritto del cliente (GDPR)
- Formato: `> "Citazione" - Mario R., zona Roma, 2026 - Servizio: tipo pratica`
- Niente claim di risultati specifici non verificabili

---

## 10. Cross-Linking

### Formato link interni
Sempre: `[Titolo](https://praticheflaiano.it/blog/SLUG)`

**MAI**:
- Percorsi repository: `[X](/content/categoria/file.md)`
- Placeholder: `[Titolo](link)`, `[LINK ARTICOLO]`, `[DA PUBBLICARE]`

### Articoli correlati
Ogni articolo deve suggerire 2-3 link interni a contenuti correlati. Per identificarli:
1. Stessa categoria
2. Tag in comune
3. Tema prerequisito o approfondimento

---

## 11. Privacy e Tematiche Sensibili

### Dati personali
- MAI usare nomi reali di clienti, nemmeno negli esempi
- MAI usare codici fiscali reali, nemmeno parziali
- Per gli esempi: "il Sig. Rossi", "la famiglia Bianchi" con dati palesemente fittizi

### Tematiche sensibili
- **Invalidita civile**: linguaggio rispettoso, "persona con disabilita" non "invalido"
- **Successioni**: tono empatico, mai burocratico (lutto recente possibile)
- **Disoccupazione/NASpI**: tono pratico e rassicurante (difficolta economiche)
- **ISEE basso**: non dare giudizi, presentare le agevolazioni come diritti

---

## 12. Aggiornamento Contenuti

### Politica di aggiornamento
- Articoli con dati numerici (importi, scadenze): verificare e aggiornare a inizio anno fiscale
- Articoli con riferimenti normativi: aggiornare quando la norma cambia
- Articoli evergreen: verificare ogni 12 mesi
- Articoli obsoleti: contrassegnare chiaramente o rimuovere

### Data ultimo aggiornamento
Visibile in due punti:
1. Frontmatter YAML: campo `last_updated`
2. Nel testo, sotto il titolo H1: "**Ultimo aggiornamento: GG mese AAAA**"

---

## 13. Flusso degli Stati di un Articolo

```
draft → fact-checked → seo-optimized → ready → published
```

| Status | Significato | Chi lo imposta |
|---|---|---|
| `draft` | Appena scritto, non verificato | content-writer |
| `fact-checked` | Superato fact-check | fact-checker |
| `seo-optimized` | Ottimizzato per SEO | seo-specialist |
| `ready` | Checklist superata, pronto per GHL | review-article (skill) |
| `published` | Pubblicato su praticheflaiano.it | utente (manuale) |

### Report di revisione
I report di fact-check e SEO vanno salvati in:
- `reviews/YYYY-MM-DD-SLUG-factcheck.md`
- `reviews/YYYY-MM-DD-SLUG-seo.md`

NON inserire i report come commento HTML nell'articolo (inquinano il CMS).
