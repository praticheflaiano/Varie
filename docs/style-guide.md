# Guida di Stile Editoriale - Centro Pratiche Flaiano

## Lingua e Registro

- Scrivere esclusivamente in **italiano**
- Registro formale ma accessibile: usare la forma "Lei" quando ci si rivolge al lettore
- Evitare il burocratese: quando un termine tecnico e inevitabile, spiegarlo tra parentesi al primo utilizzo
  - Esempio: "l'ISEE (Indicatore della Situazione Economica Equivalente) e il documento che..."
- Frasi brevi e dirette. Paragrafi di massimo 3-4 righe
- Non usare anglicismi quando esiste un equivalente italiano chiaro

## Tono

- **Autorevole**: chi scrive conosce la materia e la padroneggia
- **Empatico**: il lettore e una persona confusa dalla burocrazia che cerca risposte chiare
- **Rassicurante**: trasmettere che la pratica e gestibile, specialmente con l'aiuto del CAF
- **Mai allarmistico**: non usare frasi come "potrebbe costarti migliaia di euro" senza dati concreti e verificati
- **Mai promozionale in modo aggressivo**: informare prima, il servizio del CAF emerge come soluzione naturale

## Struttura Articolo

Ogni articolo deve seguire questa struttura minima:

```
# [Titolo H1 con keyword primaria]

**Ultimo aggiornamento: [GG/MM/AAAA]**

[Introduzione: 2-3 frasi che descrivono il problema/tema e perche interessa al lettore]

## [Sezione H2: Cos'e / Di cosa si tratta]

## [Sezione H2: Chi ne ha diritto / A chi si rivolge]

## [Sezione H2: Come funziona / Come fare domanda]

## Documenti necessari

- [Elenco puntato dei documenti richiesti]

## Scadenze

[Scadenze specifiche con date verificate - indicare SEMPRE la fonte]

## Come possiamo aiutarti

[Breve paragrafo su come il Centro Pratiche Flaiano puo assistere il lettore]
[CTA: invito a prenotare - UNO SOLO qui, non ripetuto]

---

*Disclaimer: Le informazioni contenute in questo articolo hanno carattere puramente
informativo e non costituiscono consulenza fiscale, legale o previdenziale professionale.
Per una valutazione personalizzata della propria situazione, si consiglia di rivolgersi
a un professionista qualificato o di prenotare un appuntamento presso il nostro CAF.
Le normative citate sono soggette a modifiche; si invita a verificare sempre
l'attualita delle informazioni presso le fonti ufficiali (agenziaentrate.gov.it, inps.it).*

*Centro Pratiche Flaiano - CAF UNSIC | Patronato ENASC*
*Via Filoteo Alberini 25 int 10, 00139 Roma | Tel: 0697845429 | WhatsApp: 3716230690*
```

## Regole SEO

- **Keyword primaria** nel titolo H1, nel primo paragrafo e in almeno un H2
- **Meta description**: massimo 155 caratteri, deve contenere la keyword primaria e un invito all'azione
- **Slug URL**: breve, con keyword, separato da trattini (es. `isee-2026-documenti-necessari`)
- Keyword density naturale (1-2%), mai keyword stuffing
- Usare **grassetto** per i termini chiave (aiuta sia la lettura che il SEO)
- Ogni articolo deve suggerire 2-3 link interni ad articoli correlati

## Numeri, Date e Riferimenti Normativi

- Date sempre in formato completo: "entro il 30 settembre 2026" (mai "entro fine settembre")
- Importi con simbolo euro e cifre esatte: "333,33 euro mensili" (mai "circa 300 euro")
- Percentuali precise: "detrazione del 50%" (mai "detrazione di circa la meta")
- Riferimenti normativi completi al primo utilizzo:
  - "ai sensi dell'art. 13 del D.Lgs. 471/1997"
  - "come stabilito dalla Circolare INPS n. 45 del 15/03/2026"
  - "secondo quanto previsto dal D.L. n. 48/2023, convertito in L. n. 85/2023"
- OGNI dato numerico (importo, scadenza, percentuale) deve avere la fonte tra parentesi o in nota

## Lunghezza e Formattazione

- Target: **1200-1800 parole** per articolo
- Usare elenchi puntati per liste di documenti, requisiti, passaggi
- Usare tabelle per confronti o fasce di importi/percentuali
- Massimo **3 CTA** per articolo (idealmente 1 nel corpo + 1 nella sezione "Come possiamo aiutarti" + 1 a fine articolo)
- Mai ripetere lo stesso CTA piu di una volta

## Frontmatter YAML

Ogni articolo deve iniziare con questo blocco:

```yaml
---
title: "Titolo completo dell'articolo"
date: YYYY-MM-DD
last_updated: YYYY-MM-DD
category: nome-categoria
tags: [tag1, tag2, tag3]
meta_description: "Descrizione max 155 caratteri con keyword primaria"
author: "Redazione Centro Pratiche Flaiano"
sources:
  - "Circolare INPS n. X del GG/MM/AAAA"
  - "Art. X D.Lgs. Y/AAAA"
status: draft | review | published
---
```

## Cosa NON fare

- Non inventare statistiche ("il 75% degli italiani...")
- Non usare countdown o urgenze artificiali
- Non promettere risultati specifici ("risparmia 800 euro") senza contesto verificabile
- Non usare testimonial con risultati specifici non documentabili
- Non copiare testi da altri siti senza rielaborazione
- Non pubblicare senza aver verificato ogni dato numerico
- Non omettere il disclaimer
- Non omettere la data di ultimo aggiornamento
