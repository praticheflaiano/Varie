---
title: "Riferimento: dati ufficio Centro Pratiche Flaiano"
type: riferimento
tags: [contatti, ufficio, brand, geo]
created: 2026-04-28
updated: 2026-04-28
---

# Dati ufficio (single source of truth)

Tutti i dati di contatto / brand / geo del Centro Pratiche Flaiano. **Sincronizzato con `sito/src/consts.ts`**: se qualcosa cambia, aggiornare entrambi.

## Identita

- **Nome**: Centro Pratiche Flaiano
- **Claim**: "Risparmia tempo, ci pensiamo noi" (storico) | "Persone, non sportelli" (variante design Adriatic Blue)
- **Ruoli**:
  - CAF UNSIC (Centro di Assistenza Fiscale, autorizzato D.Lgs. 241/97)
  - Patronato ENASC (riconosciuto Legge 152/2001)
- **Anni attivita**: ~22 (placeholder, da verificare con cliente)
- **Sito attuale**: https://praticheflaiano.it
- **Sito nuovo (Vercel)**: https://praticheflaiano-sito.vercel.app

## Contatti

- **Indirizzo**: Via Filoteo Alberini 25, int. 10, 00139 Roma (RM)
- **Landmark**: Centro Acquisti Flaiano - quartiere Vigne Nuove
- **Municipio**: III Montesacro
- **Telefono fisso**: 06 9784 5429 (`+390697845429`)
- **Mobile / WhatsApp**: 371 6230 690 (`+393716230690`)
- **Email**: info@praticheflaiano.it
- **WhatsApp link**: https://wa.me/393716230690
- **Canale WhatsApp**: https://whatsapp.com/channel/0029VaVaZQKDDmFc54xFmA2d
- **Facebook**: https://www.facebook.com/PRATICHEFLAIANO
- **Google Maps**: https://maps.app.goo.gl/HBKDcNoEWpPyy9x69
- **Geo**: 41.9519, 12.5347

## Orari

| Giorno | Mattina | Pomeriggio |
|---|---|---|
| Lunedi | 9:30-13:00 | 15:30-18:00 |
| Martedi | 9:30-13:00 | 15:30-18:00 |
| Mercoledi | 9:30-13:00 | 15:30-18:00 |
| Giovedi | 9:30-13:00 | 15:30-18:00 |
| Venerdi | 9:30-14:00 | (continuato) |
| Sabato | chiuso | chiuso |
| Domenica | chiuso | chiuso |

## Tessera (tesseramento)

- **Annuale**: 30 € / nucleo familiare / 12 mesi
- **Semestrale**: 20 € / nucleo familiare / 6 mesi
- **Vantaggi** (TODO: lista ufficiale da pagina /tesseramento_vantaggi attualmente in 503)

## Booking (prenotazioni)

- **In sede (Arcanis)**: https://link.arcanis.it/widget/group/bklXY9sZUszt8V2GpkU1
- **Da remoto**: https://link.arcanis.it/widget/bookings/consulenza_da_remoto
- **Pagina link-in-bio**: https://praticheflaiano.it/linkl-in-bio-page-8736-3400-1351

## Zone servite (geo-SEO)

Primarie (uso prioritario in articoli):
- Vigne Nuove
- Tufello
- Conca d'Oro
- Bufalotta
- Porta di Roma

Secondarie:
- Fidene
- Castel Giubileo
- Serpentara
- Talenti
- Nuovo Salario

Macro: Roma Nord, Municipio III Montesacro.

## Servizi (categorie blog)

13 categorie ufficiali (vedi `docs/topic-taxonomy.md`):

**CAF**: 730-redditi, iva, isee-dsu, bonus-fiscali, successioni-volture, imu-tributi-locali, detrazioni-deduzioni

**Patronato**: assegno-unico, naspi-disoccupazione, pensioni, invalidita-civile, red-invciv-accas, lavoro-domestico

## Personas target

(vedi `docs/audience-personas.md`)

1. **Lavoratore dipendente** - 730, ISEE, detrazioni, bonus
2. **Pensionato 65+** - RED, invalidita, Legge 104, successioni
3. **Famiglia con figli 30-55** - ISEE, AUU, bonus nido, NASpI

## Domini di crawl per WebSearch (allowed_domains)

```
agenziaentrate.gov.it
inps.it
inail.it
gazzettaufficiale.it
fiscoetasse.com
informazionefiscale.it
ipsoa.it
fiscooggi.it
ilsole24ore.com
lavoroediritti.com
studiobarberi.it
finanzaefisco.com
dirittobancario.it
soluzionetasse.com
gov.it
```

## Vedi anche

- File: `sito/src/consts.ts` (single source of truth applicativo)
- File: `CLAUDE.md` (project root)
- [[riferimenti/credenziali-deploy]]
