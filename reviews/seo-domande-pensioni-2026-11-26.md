# SEO domande reali - gruppo "pensioni" (26/11/2026)

Brief: `brief-seo-agenti.md` (scratchpad del coordinatore). Regole: `docs/regole-contenuto.md` 4-bis e 4-ter. Nessuno slug cambiato, nessun articolo nuovo, niente git/build.

## Novità trovata durante la verifica (impatta più file)

**Decreto MEF del 13 novembre 2026 "Perequazione delle pensioni con decorrenza dal 1° gennaio 2027"**, Gazzetta Ufficiale Serie Generale **n. 274 del 24 novembre 2026** (codice 26A06133): aumento **provvisorio del 3,2%** dal 1° gennaio 2027.
- Esistenza, data, titolo e GU verificati sul sito della Gazzetta Ufficiale (sommario del n. 274 e scheda atto). Il testo degli articoli non si apre via WebFetch (la pagina carica il testo a parte, il link "atto completo" supera la lunghezza consentita dal proxy).
- La percentuale 3,2% è riportata in modo coerente da Portale Normativo (25/11), Informazione Fiscale (25/11) e dai titoli di IPSOA, Il Messaggero, Leggo (24-25/11). Nei testi l'abbiamo scritta citando il decreto in GU.
- "2026 confermato all'1,4%, nessun conguaglio": solo fonti secondarie (Informazione Fiscale, Portale Normativo). Scritto come "secondo i primi resoconti… lo confermerà l'INPS con la circolare di dicembre".
- Minimo 2027 "circa 631 €": **calcolo nostro** (611,85 × 1,032 = 631,43), dichiarato come tale nel testo; la cifra ufficiale arriva con la circolare INPS di dicembre.

---

## 1. Cedolino pensione dicembre 2026
File: `content/pensioni/2026-11-10-cedolino-pensione-novembre-dicembre-2026-come-leggerlo.md` (riscritto, slug invariato)

- **seo_title** prima: "Cedolino pensione dicembre 2026: data, tredicesima e trattenute" → dopo: "Cedolino pensione dicembre 2026: data, tredicesima e 154,94 €"
- **title/H1**: "Cedolino pensione dicembre 2026: pagamento il 1° dicembre, tredicesima, 154,94 € e trattenute"
- **meta_description**: data di pagamento + tredicesima + 154,94 € + "Quando si vede" + Roma (155 car.)
- **Novembre ridotto in fondo**: la pensione di novembre è già stata pagata (valuta 2/11); le regole di novembre ora stanno in una sola sezione breve "Com'era il cedolino di novembre 2026" prima della chiusura. L'articolo è ora tutto su dicembre (le query sono quasi solo "dicembre").
- **In breve** riscritto sulle 5 domande principali (data 1/12, tredicesima, 154,94 €, trattenute, quando si vede su MyINPS) + pulsante Prenota subito dopo.
- **Titoletti-domanda nuovi**: Quando viene pagata la pensione di dicembre 2026? · Quando è visibile il cedolino della pensione di dicembre 2026? · Tredicesima 2026: quando arriva e quanto è? · Bonus 154,94 euro: a chi arriva a dicembre? · Quali trattenute ci sono sul cedolino di dicembre? (H3: addizionali, conguagli 730, conguaglio IRPEF di fine anno) · Quattordicesima a dicembre: a chi arriva? · Perché la pensione di dicembre è diversa dal solito? · E da gennaio 2027? (con il 3,2%).
- **FAQ** (8): quando esce il cedolino, quando viene pagata, 154,94 € a tutti?, addizionali, tredicesima netta più bassa, rivalutazione già a dicembre?, pensione di gennaio 2027, senza SPID.
- Fonti aggiunte: circolare 153/2025 (calendario, par. 7.1 e 7.2), scheda INPS importo aggiuntivo, decreto MEF in GU.
- **Stato notizia INPS**: al 26/11/2026 la notizia "Pensionati: il cedolino di pensione di dicembre 2026" **non risulta pubblicata** (URL atteso non raggiungibile, nessun risultato su inps.it). L'anno scorso è uscita il 26/11/2025. Nel testo resta l'avviso "aggiorneremo". **Da rifare appena esce**: verificare quattordicesima di dicembre, importo aggiuntivo e conguagli 2026.

## 2. Modello RED
### `content/red-invciv-accas/2026-11-10-red-2026-scadenza-28-febbraio-2027-messaggio-inps-3568.md`
- **seo_title** prima: "Modello RED: scadenza 1° marzo 2027, chi deve farlo" → dopo: "Modello RED 2026 scadenza 1° marzo 2027: chi deve farlo"
- **title/H1**: "Modello RED 2026: scadenza 1° marzo 2027, chi deve farlo e quando si fa il RED 2027"
- **meta**: RED 2026 (redditi 2025) e ACC.AS/PS 1° marzo 2027; RED 2027 da settembre 2027; Roma.
- Il lungo avviso "Aggiornamento del 13 novembre" in testa è stato sostituito da una frase-risposta; la spiegazione 28 febbraio → 1° marzo è spostata nel nuovo H2.
- **H2 nuovi**: Qual è la scadenza del modello RED 2026? · Modello RED 2027: quando si fa e quando scade? (con tabella RED 2026 vs RED 2027 e avviso sui nomi) · "Chi deve presentare il RED" → **Chi deve fare il RED 2026?** con risposta in una riga; aggiunta la regola dei 76 anni (guida INPS RED 2026).
- **FAQ aggiunte**: Quando inizia la campagna RED 2027? · Quando si fa il RED 2027? · Qual è la scadenza dell'ACC.AS/PS 2026?
- Fonti aggiunte: notizia INPS 13/11/2026 (avvio campagna, termine 1° marzo 2027), guida INPS Campagna RED 2026 v2.0.

### `content/red-invciv-accas/2026-11-08-red-icric-iclav-accas-ps-2026-guida.md`
- **seo_title** prima: "Modello RED, ICRIC, ICLAV e ACC.AS/PS: guida 2026" → dopo: "RED, ICRIC, ICLAV e ACC.AS/PS 2026: scadenze e chi li fa"
- **meta** con scadenza 1° marzo 2027 e "non su carta".
- In breve: aggiunte 2 righe (scadenza RED/ACC.AS/PS; ICRIC/ICLAV solo online) + pulsante Prenota (mancava).
- **Titoletti-domanda nuovi**: Il modello ICRIC non è più obbligatorio nel 2026? · ACC.AS/PS 2026: qual è la scadenza? · Qual è la scadenza dell'ICRIC e dell'ICLAV 2026? · Esiste il modello ICRIC 2026 in PDF?
- Testo ICRIC ammorbidito: "se l'INPS te la chiede (lettera o MyINPS), va presentata anche se non hai avuto ricoveri" (vedi dati non verificati).
- FAQ aggiunte: Chi deve fare il modello ICLAV 2026? · Quando scade il modello ACC.AS/PS 2026?

### `sito/src/pages/red-invciv.astro`
- title: "Modello RED 2026, ICRIC, ICLAV e ACC.AS/PS a Roma" (il layout aggiunge " | Centro Pratiche Flaiano").
- FAQ: "Entro quando…" ora inizia con la risposta; **nuova FAQ "Quando si fa il RED 2027?"**; ICRIC "se l'INPS te lo chiede"; ICRIC/ICLAV "dal 2015 non su carta".
- Fonti: "Aggiornato il 26 novembre 2026".

## 3. Importo aggiuntivo 154,94 €
File: `content/pensioni/2026-11-17-importo-aggiuntivo-154-euro-pensione-dicembre-2026.md`
- **seo_title** prima: "Bonus 154,94 € pensione dicembre 2026: a chi spetta" → dopo: "Bonus 154,94 € a chi spetta: pensione di dicembre 2026"
- H1: "… a chi spetta"; meta con 8.108,99 € e 11.931,08 € + Roma.
- In breve: primo punto ora è "A chi spetta" (pensione **e** reddito bassi).
- **H2 nuovo** "A chi spettano i 154,94 euro?" con risposta in una riga; "Quando arriva e dove lo vedo?" → "Quando arriva il bonus 154 euro a dicembre e dove lo vedo?" con il nome della voce sul cedolino e il pagamento provvisorio (notizia INPS dicembre 2025).
- **FAQ aggiunte**: A chi spetta il bonus di 154,94 euro? · Cosa vuol dire "Importo aggiuntivo (Legge 23 dicembre 2000, n. 388) - credito anno 2026" sul cedolino? · Quali bonus arrivano con la pensione di dicembre 2026?
- Correlati: aggiunti cedolino dicembre e pensione minima 2027.

## 4. Pensione di reversibilità
File: `content/pensioni/2026-11-12-pensione-reversibilita-quanto-spetta-domanda.md`
- **seo_title** prima: "Pensione di reversibilità: quanto spetta e come fare domanda" → dopo: "Pensione di reversibilità: quanto spetta, a chi e documenti"
- meta: 60% al coniuge, tagli oltre 23.862 €, quando si perde, "serve lo stato di famiglia?", Roma.
- In breve: righe nuove "Quando si perde" e "Documenti"; pulsante Prenota dopo il riquadro (mancava).
- **Struttura a domande** (H2): Cos'è la pensione di reversibilità? · A chi spetta la pensione di reversibilità? · Quanto spetta della pensione di reversibilità? (H3 **Come si calcola la reversibilità del marito?** in 3 passaggi) · Pensione di reversibilità al coniuge con reddito: quanto si riduce? · Da quando si prende e quanto tempo ci vuole? · **Quando si perde la pensione di reversibilità?** (nuovo: nuove nozze, figli per età/studi/reddito, quota che resta, H3 risposarsi) · Si può lavorare e prendere la reversibilità? · Come si chiede la pensione di reversibilità? · **Documenti per la reversibilità: serve lo stato di famiglia?** (nuovo: il certificato non serve, si autocertifica, art. 46 DPR 445/2000).
- FAQ: tolte quelle ora coperte da titoletti (stato di famiglia, quanto al coniuge, se lavoro, decorrenza, risposarsi); aggiunte: Quanto costa la domanda al patronato? (gratis, già pubblicato su /pensioni) · Il coniuge separato ha diritto? · La reversibilità si può chiedere anche dopo anni? · Il figlio studente che lavora perde la reversibilità?
- Tabella F 2026 riverificata sull'allegato 2 della circolare 153/2025 (soglie 23.862,15 / 31.816,20 / 39.770,25 €; studenti 10.340,27 €; TM 611,85 €/7.954,05 €).

## 5. Altre pagine
- `content/pensioni/2026-11-12-rivalutazione-pensioni-2027-aumento-gennaio-fasce.md`: seo_title "Perequazione pensioni 2027: aumento di gennaio e fasce" → "Rivalutazione pensioni 2027: +3,2% da gennaio e fasce"; H1 con 3,2%; riga "Ultime notizie" sul decreto; In breve con 3,2%; H2 "Di quanto aumentano le pensioni nel 2027?" con tabella (600/1.000/1.500/2.000 €); **H2 nuovo "Decreto perequazione pensioni 2027: cosa dice"**; esempio scaglioni/fasce ricalcolato al 3,2% (2.000 → +64,00/+64,00; 2.800 → +88,47/+76,16; 4.000 → +118,52/+60,16, calcolo nostro); FAQ aggiornata + "Il 3,2% è definitivo?".
- `content/pensioni/2026-11-20-pensione-minima-2027-quanto-aumenta.md`: seo_title → "Pensione minima 2027: importo e quanto aumenta da gennaio"; H1/meta/In breve con "circa 631 €" (calcolo dichiarato); **H2 nuovo "Quanto aumenta la pensione minima nel 2027?"** (+19,60 € sul minimo; chi prende 619,80 € circa +11-12 € senza proroga dell'1,3%); "Quando si saprà l'importo ufficiale 2027?" con il decreto; FAQ aggiornate ("Quanto sarà…", "Le pensioni minime aumentano anche con l'aumento extra nel 2027?").
- `content/pensioni/2026-11-12-requisiti-pensione-2027-vecchiaia-anticipata.md`: seo_title "Requisiti pensione 2027: vecchiaia e anticipata" → "Requisiti pensione 2027: a che età e con quanti contributi"; pulsante Prenota dopo In breve; **H2 nuovi** "Con quanti anni si va in pensione nel 2027?" e "Quante settimane di contributi servono per andare in pensione?" (20 anni = 1.040 settimane); FAQ "Quanto costa il controllo dei requisiti al patronato?" (prezzi già pubblicati su /pensioni).
- `content/pensioni/2026-11-10-ape-sociale-2026-ultima-scadenza-30-novembre.md`: FAQ "Quando viene pagata l'APE sociale?" (12 mensilità, pagamento separato - circolare 153/2025 par. 12; nessun giorno fisso pubblicato).
- `sito/src/pages/pagamenti-inps.astro`: description con date e "Roma" (era senza Roma e oltre 155 car.); AGGIORNATO 26/11; riga gennaio 2027 con il 3,2%; FAQ nuove "Quando arriva il prossimo pagamento INPS?" e "Quando si vede il cedolino della pensione di dicembre 2026?"; tredicesima con data.
- `sito/src/pages/pensioni.astro`: FAQ nuove "Serve il certificato di stato di famiglia per la reversibilità?" e "Di quanto aumentano le pensioni nel 2027?"; documenti: "composizione della famiglia (lo stato di famiglia si autocertifica)"; fonte GU del decreto; data fonti 26/11.
- Non toccati: `assegno-vedovanza.astro` (nessuna query nel brief), casa albergo Monteporzio, indebiti SEND, carta d'identità.

## Fonti ufficiali verificate oggi
- INPS, Circolare n. 153 del 19/12/2025 e Allegato 2 (PDF scaricati e letti): calendario pagamenti 2026 (dicembre valuta 1), par. 7.1 conguagli IRPEF gen-feb, par. 7.2 addizionali, par. 8.2.1 contitolari superstiti, par. 12 prestazioni di accompagnamento (APE sociale), Tabella F superstiti, TM 611,85 €, importo aggiuntivo 8.108,99 / 11.931,08 / 23.862,15 € - https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2025/12/Circolare_15109/Allegati/16484_Circolare-numero-153-del-19-12-2025.pdf · https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2025/12/Circolare_15109/Allegati/16486_Circolare-numero-153-del-19-12-2025_Allegato-n-2.pdf
- INPS, Pensionati: il cedolino di pensione di dicembre 2025 (26/11/2025) - https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.11.pensionati-il-cedolino-di-pensione-di-dicembre-2025.html
- Gazzetta Ufficiale SG n. 274 del 24/11/2026, DM MEF 13/11/2026 perequazione dal 1/1/2027 - https://www.gazzettaufficiale.it/eli/id/2026/11/24/26A06133/sg
- INPS, notizia 13/11/2026 Avvio Campagna RED ordinaria 2026 e dichiarazioni di responsabilità (termine 1° marzo 2027) - https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.11.avvio-campagna-red-ordinaria-2026-e-dichiarazioni-di-responsabilit.html
- INPS, Guida Campagna RED 2026 v2.0 del 29/10/2026 (regola dei 76 anni) - https://www.inps.it/content/dam/inps-site/software/2026/10/allegatisoftware/Guida_Campagna_Red_2026_Vers_2.0.pdf
- INPS, scheda Dichiarazioni di responsabilità e ricoveri indennizzati (agg. 20/11/2025: invio annuale obbligatorio, cartaceo non più dal 2015, CAF solo ACC.AS/PS) - https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.Dichiarazioni-di-responsabilita-e-ricoveri-indennizzati.html
- INPS, scheda Pensione ai superstiti indiretta e di reversibilità (agg. 12/06/2026) - https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.pensione-ai-superstiti-indiretta-e-di-reversibilit--50605.pensione-ai-superstiti-indiretta-e-di-reversibilit-.html
- INPS, notizia 27/12/2023 Pensione ai superstiti e redditi aggiuntivi (circolare 108/2023) - https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2023.12.pensione-ai-superstiti-e-redditi-aggiuntivi-nuovi-limiti-cumulabilit-.html
- D.P.R. 445/2000, art. 46, lett. f) "stato di famiglia" (testo dal sito della Prefettura) - https://prefettura.interno.gov.it/sites/default/files/57/2024-01/art_46_dpr_445.pdf

## Dati NON verificati e lasciati fuori (o scritti come "non ancora comunicato")
- **Notizia INPS sul cedolino di dicembre 2026**: non pubblicata/non raggiungibile al 26/11. Quindi non scritti: quattordicesima di dicembre 2026 (indicata solo come regola applicata a dicembre 2025), conguagli specifici 2026, giorno in cui il cedolino diventa visibile.
- **Data pagamento pensioni gennaio 2027**: non comunicata (si sa solo "secondo giorno bancabile").
- **Testo degli articoli del decreto MEF 13/11/2026**: non leggibile; 3,2% da fonti secondarie concordi; conferma 1,4% 2026 solo secondaria (scritta come tale).
- **Trattamento minimo 2027 al centesimo** (631,42 o 631,43): non scritto; solo "circa 631 €" come nostro calcolo.
- **ICRIC "non più obbligatorio"**: una fonte secondaria (disabili.com, articolo del 2020 aggiornato nel 2025) dice che per i titolari di accompagnamento l'ICRIC non serve più grazie alla convenzione INPS-Ministero della Salute; la scheda INPS dice invece che l'invio annuale è obbligatorio. Non risolto: abbiamo scritto "non risulta abolito, va fatto quando l'INPS te lo chiede" e tolto "ogni anno, sempre". **Da verificare con l'operatività del patronato** (le richieste ICRIC arrivano ancora ai titolari di sola accompagnatoria?).
- **Scadenza ICRIC/ICLAV 2026**: l'INPS non ha pubblicato una data unica (la notizia del 13/11 cita solo RED e ACC.AS/PS).
- **Messaggi INPS 3568 e 3697**: le pagine INPS non si aprono via WebFetch; le date (RED 2027 dal 1/9/2027 al 2/3/2028; solleciti 28/2/2027) restano quelle verificate il 13/11 dal fact-check precedente. Il 1° marzo 2027 è riconfermato dalla notizia INPS del 13/11.
- **Giorno di pagamento dell'APE sociale**: nessuna fonte INPS indica un giorno specifico; non scritto.
- **Redditi esclusi dal cumulo della reversibilità** (TFR, casa di abitazione ecc.): non verificati su fonte primaria, non aggiunti.
- **Costo del RED al CAF**: non pubblicato, nessuna FAQ sul prezzo.

## Idee di nuovi contenuti (gruppo pensioni)
1. **Cedolino pensione gennaio 2027** (nuovo articolo da preparare a metà dicembre, prima che partano le ricerche): data del secondo giorno bancabile, aumento 3,2%, conguagli IRPEF gen-feb, addizionali che ripartono. Giustificato dalla regola 4-ter.6 e dal peso di "inps cedolino pensione dicembre 2026" (4.212 impr.) e "prossimo pagamento inps" (23).
2. **Aggiornamento immediato del cedolino di dicembre** appena esce la notizia INPS (presumibilmente fine novembre): quattordicesima di dicembre, conguagli; è la seconda ricerca del sito.
3. **Circolare INPS rinnovo pensioni 2027** (dicembre): aggiornare in un colpo pensione minima 2027, soglie reversibilità 2027, limiti 154,94 € 2027, rivalutazione. Query: "pensione minima 2027 importo" (19, pos. 6,8), "pensioni minime 2027", "rivalutazione pensioni 2027 ultime notizie".
4. **Pagina "Calendario pagamenti INPS 2027"** (o sezione fissa su /pagamenti-inps) appena INPS pubblica le date 2027: "calendario pagamenti inps" (10), "prossimo pagamento inps" (23), "pagamenti inps dicembre 2026" (17, pos. 7,9).
5. **Quattordicesima e importo aggiuntivo non arrivati: come chiedere la ricostituzione** (sezione o articolo breve): copre "bonus pensioni dicembre 2026", "bonus 154 euro a chi spetta" con l'intenzione "non l'ho ricevuto"; servizio del patronato.
