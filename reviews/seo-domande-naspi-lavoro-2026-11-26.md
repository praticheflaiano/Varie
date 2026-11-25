# SEO domande reali - gruppo "naspi-lavoro" - 26/11/2026

Brief: `brief-seo-agenti.md` (26/11/2026). Dati: Search Console, 3 mesi (query | impressioni | clic | posizione). Nessun comando git, build o deploy eseguito.

## File modificati / creati

| File | Tipo |
|---|---|
| `content/naspi-disoccupazione/2026-11-15-somma-non-imponibile-naspi-cassa-integrazione-2026.md` | riscritto (struttura a domande) |
| `content/naspi-disoccupazione/2026-11-26-dimissioni-online-senza-spid-come-fare.md` | **NUOVO** (guida) |
| `content/naspi-disoccupazione/2026-11-13-c2-storico-lazio-come-richiederlo-online.md` | riscritto (passaggi ufficiali del portale) |
| `content/naspi-disoccupazione/2026-11-16-bonus-donne-2026-assunzione-disoccupate.md` | titolo, meta, nota DDL 2027, Prenota |
| `content/naspi-disoccupazione/2026-04-29-checklist-primi-7-giorni-perdita-lavoro-roma.md` | 2 FAQ, link, correzioni, disclaimer |
| `content/naspi-disoccupazione/2026-04-29-naspi-2026-patronato-vs-caf-cosa-fa-cosa.md` | link correlato + disclaimer |
| `sito/src/pages/dimissioni-online.astro` | 4 FAQ nuove/riscritte, description, related, fonti |
| `sito/src/pages/siisl.astro` | FAQ PAD, title, description |
| `sito/src/pages/naspi.astro` | title, description |

**Per il coordinatore**
- Copertina da generare: `/og/dimissioni-online-senza-spid-come-fare.jpg` (nuovo articolo).
- È cambiato il `title` (H1) di **somma non imponibile** e **C2 storico**: se la copertina riporta il titolo, valutare di rigenerarla. Slug invariati.
- Pagina nuova: se serve, aggiungerla alla lista delle pagine note nei test (`related.test.ts` del portale riguarda solo il portale; verificare se il sito ha un elenco analogo).
- In `naspi.astro` le FAQ visibili stanno nel fragment `sito/src/fragments/naspi.html` (non mio): non ho aggiunto domande al JSON-LD per non creare FAQ strutturate non visibili.

---

## 1. Somma non imponibile NASpI (priorità 1)

- **seo_title** prima: "Somma non imponibile NASpI: quando arriva e quanto spetta" → dopo: **"Somma non imponibile NASpI 2026 (somma aggiuntiva): quando arriva"** (65).
- **title/H1** prima: "NASpI e cassa integrazione: da novembre la somma esentasse con gli arretrati 2026" → dopo: "Somma non imponibile NASpI 2026 (somma aggiuntiva): quando arriva, quanto è e arretrati".
- **meta_description** riscritta (148): sinonimo "somma aggiuntiva", novembre 2026, arretrati da gennaio, percentuali, Roma.
- Riga "Ultimo aggiornamento" allineata a 26/11/2026 (prima diceva 15 novembre con `last_updated` 23/11).
- "In breve" ora risponde a: cos'è, quando arriva, quanto è, per chi, domanda, esclusi.
- Titoletti-domanda nuovi (ognuno con risposta in una riga in grassetto):
  - Cos'è la somma non imponibile NASpI? (query "cos è")
  - Quando arriva la somma non imponibile NASpI? (494 + "quando viene pagata" 60 + "quando arriva" 17)
  - Quanto è la somma aggiuntiva NASpI 2026? (806 + 128 + "a quanto ammonta")
  - A chi spetta e chi resta fuori?
  - Spetta anche sulla disoccupazione agricola? (34)
  - Cosa sono gli arretrati NASpI di novembre 2026? (87 + 13)
  - Come la vedi nel Fascicolo previdenziale e nella CU? (cedolino/fascicolo)
  - Quando pagano la NASpI a dicembre 2026? (12 + "quando pagano la naspi a dicembre") → risposta onesta: data non comunicata ufficialmente.
- FAQ: bonus NASpI di novembre = somma non imponibile; DIS-COLL; NASpI finita; senza IRPEF; tasse; anticipo NASpI; rinuncia.
- Aggiunto dettaglio verificato: riconoscimento automatico solo sulle prestazioni **pagate direttamente** all'assicurato; pagamento **autonomo e distinto**; DS AGR inclusa; non serve capienza d'imposta; rinuncia in "Sostegni, Sussidi e Indennità".

**Fonti verificate**
- INPS, Messaggio n. 3649 del 10/11/2026 (testo letto in PDF: https://www.dirittobancario.it/wp-content/uploads/2026/11/18049_Messaggio-numero-3649-del-10-11-2026.pdf, copia del messaggio INPS)
- INPS, notizia 10/11/2026: https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.11.somma-non-imponibile-sulle-prestazioni-non-pensionistiche-indicazioni.html
- INPS, scheda Fascicolo previdenziale del cittadino (sezione Prestazioni: domande e pagamenti ricevuti): https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.fascicolo-previdenziale-del-cittadino-50865.fascicolo-previdenziale-del-cittadino.html

**Non verificato, lasciato fuori**
- **Giorno esatto** di pagamento della somma a novembre: il messaggio non lo indica (scritto in chiaro).
- **Date NASpI di dicembre 2026**: nessuna fonte ufficiale INPS trovata; solo stime di siti di informazione → scritto "l'INPS non l'ha comunicato, aggiorneremo".
- Nome esatto della voce nel Fascicolo/dettaglio pagamenti: non indicato dall'INPS → scritto solo "pagamento separato", sezione Prestazioni.
- Cassa integrazione anticipata dal datore in busta paga: il messaggio non ne parla → detto solo che il riconoscimento automatico INPS riguarda i pagamenti diretti.
- Messaggi INPS successivi al 3649 sul tema: non trovati.

## 2. Dimissioni online senza SPID (priorità 2)

### Nuovo articolo `dimissioni-online-senza-spid-come-fare`
- seo_title: **"Dimissioni online senza SPID: come darle tramite patronato"** (58); meta 150.
- Titoletti-domanda: Si possono dare le dimissioni online senza SPID? · Come dare le dimissioni online senza SPID, passo per passo · Come dare le dimissioni online da soli con SPID o CIE? · Perché le dimissioni si danno solo online? · Quanto costa dare le dimissioni al patronato? · Quanti giorni di preavviso devo dare? · Posso dare le dimissioni con effetto immediato? · Con le dimissioni prendo la NASpI? · Posso revocare le dimissioni online? · Quando le dimissioni non si fanno online?
- FAQ: come si danno le dimissioni dal lavoro; "licenziamento online" senza SPID; come lo sa il datore; fuori Roma; giusta causa con lo stesso modulo; data sbagliata.
- Prezzi presi **dal file della pagina** `/dimissioni-online` (non inventati): senza SPID o online 20 € con tessera / 25 € senza; in ufficio con il proprio SPID 15 € / 20 €; revoca 5 €. Nota: il "da 15 €" vale **con SPID e tessera**; senza SPID il prezzo parte da 20 €, e così è scritto nell'articolo.
- Risposta alla query "quanto costa al CAF": nell'elenco ministeriale degli intermediari ci sono i patronati, non i CAF → da noi le invia il Patronato ENASC.
- Collegamenti: articolo → `/dimissioni-online` (3 volte), `/naspi`, `/siisl`, `/tesseramento`, `/calcolo-naspi` (pulsante), guida colf (`/blog/licenziamento-dimissioni-colf-badante-preavviso-tfr`); pagina → articolo (FAQ + related). Aggiunto anche da checklist, C2 e patronato-vs-CAF.

### Pagina `/dimissioni-online`
- description riscritta (prezzo invariato "da 15 €", ora "tramite il Patronato ENASC a Roma").
- FAQ: "Posso dimettermi senza SPID?" → **"Come si danno le dimissioni online senza SPID?"** (con link alla guida); nuove: **"Quanto costa dare le dimissioni al patronato o al CAF?"**, **"Posso dare le dimissioni con effetto immediato?"**, **"Si può fare il licenziamento online senza SPID?"**.
- related: + "Guida: dimissioni senza SPID"; fonti: + avviso INL sulla convalida; data fonti 26/11/2026. Prezzi **non cambiati**.

**Fonti verificate**
- Ministero del Lavoro, Dimissioni volontarie: https://www.lavoro.gov.it/strumenti-e-servizi/Dimissioni-volontarie/Pagine/default (obbligo dal 12/03/2016, SPID o CIE, servizi.lavoro.gov.it/Dimissioni, intermediari, revoca 7 gg, app IO, esclusi PA/domestico/sedi protette)
- D.Lgs. 151/2015 art. 26 (testo sul sito del Ministero): https://www.lavoro.gov.it/documenti-e-norme/normative/Documents/2015/Decreto_Legislativo_14_settembre_2015_n.151.pdf
- Circolare Ministero del Lavoro n. 12/2016 (copia: https://www.snals.it/Gestione/ImmaginiCaricate/MLAV_circ_12-16_Cont_223201694117.pdf): esclusi periodo di prova e pubblico impiego; data di decorrenza calcolata con il preavviso; intermediari a prescindere da residenza/sede.
- INL, avviso convalida (gennaio 2026): https://www.ispettorato.gov.it/files/2026/01/ITL-PD-RO-Avviso-allutenza-Convalida-dimissioni-lavoratrici-madri-dimissioni-volontarie.pdf (gravidanza, primi 3 anni, adozione/affido)
- INPS circolare 94/2015: https://servizi2.inps.it/CircolariZIP/Circolare%20numero%2094%20del%2012-05-2015.pdf (NASpI con giusta causa e periodo tutelato di maternità fino al 1° anno)
- Già verificate in pagina: circolari INPS 98/2025 e 154/2025; c.c. artt. 2118-2119.

**Non verificato, lasciato fuori**
- Gratuità del servizio ministeriale fatto da soli con SPID: non scritta in modo esplicito dalla pagina del Ministero → non l'ho affermata.
- Accesso con CNS al servizio dimissioni: la pagina del Ministero cita solo SPID e CIE → scritto solo SPID o CIE.

## 3. C2 storico Lazio (priorità 3)

- seo_title: "C2 storico online Lazio: richiederlo dal Portale Lazio Lavoro" → **"Portale Lazio Lavoro C2 storico online: come richiederlo"** (56, parte con la query da 521 impressioni).
- title/H1: → "C2 storico online nel Lazio: come richiederlo sul Portale Lazio Lavoro o al Centro per l'impiego".
- meta: con SPID/CIE/CNS e percorso "Richieste documenti > Nuova richiesta".
- In breve: + accesso SPID/CIE/CNS, percorso nel portale, notifica email/SMS e download.
- Titoletti-domanda: Cos'è il C2 storico e chi lo rilascia? · Come richiedere il C2 storico online sul Portale Lazio Lavoro? (passaggi esatti della brochure regionale) · Come si scarica il C2 storico online? · Come richiederlo al Centro per l'impiego? · A cosa serve il C2 storico (anche al datore di lavoro)? (con il "Percorso lavoratore" indicato dalla Regione per le aziende) · Cosa può mancare nel C2?
- Nel testo: niente modulo PDF per la richiesta online (si compila nel portale); documento e codice fiscale da allegare.
- FAQ: con SPID; cos'è sil.regione.lazio.it; quale CPI indicare ("cpi titolare"); PA; lavori mancanti; cosa portare.

**Fonti verificate**
- Brochure Regione Lazio: https://regione.lazio.it/sites/default/files/2026-06/LAV-brochure-C2-storico-online.pdf (SPID/CIE/CNS; Scrivania > Richieste documenti > Nuova richiesta > C2 Storico; CpI di riferimento; note; Salva; notifica email/SMS; download)
- Notizia Regione Lazio 12/06/2026: https://regione.lazio.it/notizie/lavoro/richiesta-online-certificato-c-due
- Scheda servizi CpI C2: https://www.regione.lazio.it/sites/default/files/2026-03/2_Scheda%20Servizi_C2%20certificato%20storico_completa.pdf (rilascio in tutte le sedi, Percorso lavoratore per le aziende, limiti, autocertificazione)

**Non verificato, lasciato fuori**: tempi di rilascio, costo, criterio di competenza del CPI (domicilio?), modulo PDF cartaceo per lo sportello.

## 4. Altre

### Bonus donne 2026
- seo_title: "Bonus Donne 2026: fino a 650 € al mese, a chi spetta" → **"Bonus donne disoccupate 2026: 650 € al mese, fino al 31 dicembre"** (64; query "bonus disoccupati donne 2026" e "bonus donna fino al 31 dicembre 2026").
- H2 "Come si chiede" → "Come si chiede: il Portale delle Agevolazioni (ex DiResCo)" (query omonima).
- Pulsante Prenota dopo il riquadro iniziale; data aggiornamento 26/11.
- FAQ "Fino a quando..." + nota: il **DDL di bilancio 2027 (A.C. 3174-bis, art. 42, c. 1, lett. a)** propone la proroga alle assunzioni fino al 31/12/2027, **non ancora legge**. Fonte: dossier Camera/Senato 9/11/2026 https://documenti.camera.it/leg19/dossier/Pdf/LA0244.pdf

### SIISL (`siisl.astro`)
- title: "SIISL e NASpI: cosa fare entro 15 giorni | Pratiche Flaiano" → **"SIISL NASpI: Patto di attivazione digitale, come si fa"**; description 154.
- FAQ nuova: **"Come si fa il Patto di attivazione digitale sul SIISL?"** (stessi passaggi già presenti e verificati nella pagina).

### NASpI (`naspi.astro`) e checklist
- naspi.astro title: "Domanda NASpI gratis a Roma" → **"Patronato per la NASpI a Roma: domanda gratis"**; description con Roma Nord/Vigne Nuove/Municipio III (query "patronato/caf per naspi vicino a me").
- Checklist: FAQ **"Dopo la NASpI cosa posso richiedere nel 2026?"** (ADI/SFL senza soglie numeriche, rimando a /adi-sfl, coerente con D.L. 48/2023 artt. 1 e 12) e **"C'è un patronato o un CAF per la NASpI vicino a me a Roma?"**; link prenotazione da `praticheflaiano-sito.vercel.app` a `/prenota`; "Reddito di Cittadinanza/ADI" corretto (RdC non esiste più dal 2024); link alla guida dimissioni; disclaimer aggiunto; "Ultimo aggiornamento" 26/11/2026.

## Da controllare in seguito (non toccato, fuori priorità)
- Checklist: il termine SIISL è scritto "15 giorni dall'accoglimento", mentre la pagina /siisl dice "dall'inizio della prestazione"; la tabella dei codici cessazione UNILAV e le sanzioni PAD (25% / mensilità / decadenza) non sono state riverificate oggi.
- Checklist, patronato-vs-CAF, bonus donne: link al vecchio portale domandedisoccupazione.it (ora in trasferimento): sostituire con le pagine di praticheflaiano.it quando le guide arrivano.
- Bonus donne: disclaimer breve non standard.

## Idee per nuovi contenuti (gruppo naspi-lavoro)
1. **"Pagamenti NASpI dicembre 2026 / gennaio 2027"**, da pubblicare solo quando l'INPS comunica dati ufficiali: query "pagamenti naspi dicembre 2026" (12), "quando pagano la naspi a dicembre", "arretrati naspi 2026" (13).
2. **"Dopo la NASpI cosa posso richiedere"** (ADI, SFL, ISEE corrente, Assegno Unico) con soglie 2027 verificate: query "dopo la naspi cosa posso richiedere 2026".
3. **"Dimissioni per giusta causa: come fare e come avere la NASpI"**: query "dimissioni immediate" (9, pos. 37,6), "dimissioni volontarie senza spid" (70) e le domande giusta causa già sulla pagina servizio.
4. **"Percorso lavoratore Lazio: cos'è e differenza con il C2 storico"**: query "a cosa serve il c2 storico al datore di lavoro", "storico lavorativo online lazio" (15).
5. **"Somma non imponibile nella CU 2027 e nel 730"** (febbraio-marzo 2027): query della famiglia "somma non imponibile" (oltre 2.500 impressioni in 3 mesi).
