# Audit SEO praticheflaiano.it – 19 novembre 2026

Metodo: scansione di tutte le 107 URL della sitemap (title, description, H1, canonical, robots, dati strutturati, immagini), verifica dei redirect dalle vecchie URL e ricerche web su query locali.
Non disponibili: Google Search Console, dati della scheda Google, Ahrefs (connettore non autorizzato). Le posizioni reali su Google.it vanno verificate in Search Console.

## Sintesi

Il sito nuovo (Astro su Vercel) è **tecnicamente in ottimo stato**. Il problema non è il sito: è che **i motori di ricerca non hanno ancora recepito il passaggio dal vecchio sito**. Nei risultati compaiono ancora le vecchie URL (/post/…, /services, /about-us, /collaborazioni) con contenuti vecchi, incluso un indirizzo diverso. Le ricerche locali ("CAF patronato Vigne Nuove") non mostrano il Centro.

I problemi segnalati nell'audit del 7/11 (link example.com, pagina ISEE ferma, "Generic Author", meta keywords, 130 € invalidità, /pricing vuota) **sono risolti**: le pagine vecchie fanno redirect 308 verso quelle nuove, che non contengono più quei difetti.

## Cosa funziona

| Elemento | Stato |
|---|---|
| HTTPS, www → senza www, /index.html, slash finale | Redirect 308 corretti, un'unica versione del sito |
| Vecchie URL (/isee2026, /documenti_isee_2025, /pricing, /tesseramento_vantaggi, /invalidita-civile, /red-icric-iclav-accasps, /prenotazioni918656, /post/…, /services, /about-us, /collaborazioni, /notizie-bonus) | Tutte in 308 verso la pagina nuova corrispondente |
| robots.txt | Corretto, consente motori e crawler AI, punta alla sitemap |
| Sitemap | 107 URL, tutte 200, nessuna in noindex |
| Canonical | Corretto su tutte le pagine |
| H1 | Uno solo su ogni pagina |
| Immagini | Tutte con alt |
| Dati strutturati | LocalBusiness/AccountingService con indirizzo, coordinate, orari, chiusure festive; FAQPage, BreadcrumbList; BlogPosting sulla maggior parte degli articoli |
| Pagine zona | /zone con Tufello-Conca d'Oro, Talenti-Montesacro, Fidene-Serpentara-Nuovo Salario |
| Articoli | Date di pubblicazione e aggiornamento visibili e in schema |

## Problemi – per priorità

### Alta (impatto alto, sforzo basso)

1. **Far ricrawlare il sito a Google e Bing.** In Search Console (proprietà di dominio): inviare `https://praticheflaiano.it/sitemap-index.xml`, usare "Controllo URL → Richiedi indicizzazione" su home, /isee, /730, /invalidita-104, /successioni, /naspi, /pensioni, /zone/*. Verificare il report "Pagine" (quante indicizzate, quante "Rilevata ma non indicizzata"). Stesso invio su Bing Webmaster Tools (alimenta anche ChatGPT/Copilot). Tempi: 2–6 settimane.
2. **Dati NAP incoerenti fuori dal sito.** Dalle ricerche risultano:
   - un vecchio contenuto con indirizzo **Via Pier Luigi da Palestrina 47/A** (dalla cache del vecchio articolo /post/naspi-nuove-regole-2025);
   - una **seconda pagina Facebook** intitolata "Centro Pratiche Flaiano" (facebook.com/caf.patronatolumiere) oltre a facebook.com/PRATICHEFLAIANO;
   - riferimenti a "consulenza prestiti/cessione del quinto" non più presenti sul sito;
   - email diverse: sito e schema usano info@praticheflaiano.it, altri profili usano l'indirizzo Gmail.
   Azione: unire o chiudere la pagina Facebook doppia (o rinominarla se è un'altra attività), aggiornare indirizzo, telefono, orari e sito su Facebook, Google Business Profile e directory (Cylex, Pagine Gialle, Paginebianche, sito UNSIC/ENASC). Scegliere un'unica email pubblica.
3. **Google Business Profile.** Le ricerche "CAF/patronato + quartiere" si vincono nel local pack di Maps, non con il sito. Verificare che la scheda esista, sia verificata, abbia URL `https://praticheflaiano.it` (non le vecchie pagine), categorie "Servizio di consulenza fiscale" + patronato, servizi completi (invalidità con medico certificatore in sede, ISEE gratuito, 730 da 30 €), orari e chiusure festive identiche al sito (8 dicembre, 23 dicembre–10 gennaio), 1 post a settimana, foto reali.

### Media

4. **Schema BlogPosting mancante su 9 articoli:** badante-morte-assistito-ape-sociale-precoci-messaggio-inps-3694, bollo-auto-2027-esenzione-80-kw-legge-209-2026, bonus-donne-2026-assunzione-disoccupate, casa-albergo-monteporzio-inps-bando-2026-domanda, legge-caregiver-familiare-ddl-senato-contributo, legge-di-bilancio-2027-novita-famiglie-pensionati, red-2026-scadenza-28-febbraio-2027-messaggio-inps-3568, rivalutazione-pensioni-2027-aumento-gennaio-fasce, somma-non-imponibile-naspi-cassa-integrazione-2026. Probabilmente manca un campo nel frontmatter (es. data o immagine) che il template usa per generare lo schema.
5. **Data sbagliata negli articoli correlati.** Esempio in /blog/imu-saldo-16-dicembre-2026-roma: la card "IMU acconto 16 giugno 2026" ha `datetime="2026-04-29"` ma mostra "8 novembre 2026" (la data dell'articolo corrente). Bug del componente card: in un sito YMYL una data sbagliata riduce la fiducia.
6. **Meta description corte:** /certificazioni (75 caratteri), /richiesta (79), /assegno-unico (102). Portarle a 140–160 con risposta + invito a prenotare. /certificazioni e /richiesta hanno anche poco testo (circa 300 parole).
7. **Title oltre 60 caratteri** (troncati in SERP): bonus-dopo-diploma (67), dichiarazione-iva (68), isee-2026-dsu-30-giugno (67), raccomandata-send (69), più alcuni a 63. Accorciare togliendo la parte finale ripetuta.
8. **Pagine di servizio interne in sitemap:** /mandato, /richiesta, /stima-pensione, /info, /quale-isee. Se sono pagine operative (moduli per clienti) e non pagine da trovare su Google, toglierle dalla sitemap e mettere `noindex`, come previsto dal commento in robots.txt.

### Bassa

9. **Cannibalizzazione da sorvegliare:** /isee e gli articoli isee-2027-documenti-quando-rinnovare-roma, tipi-di-isee-differenze-quale-serve, /quale-isee; /successioni, /calcolo-imposte-successione e dichiarazione-successione-roma-documenti-tempi-costi; /red-invciv e i due articoli RED. Gli articoli devono linkare la pagina di servizio e non usarne la ricerca principale nel title/H1.
10. **Pagine zona:** sono un buon segnale ma brevi (circa 900 parole, molto simili tra loro). Aggiungere contenuti davvero locali (come arrivare dal quartiere, linee bus, recensioni di clienti della zona) per non sembrare pagine fotocopia. Valutare pagine per Bufalotta/Porta di Roma e Vigne Nuove/Labaro, se non già coperte dalla home.

## Piano d'azione

| Quando | Azione | Chi |
|---|---|---|
| Questa settimana | Search Console + Bing: sitemap, richiesta indicizzazione pagine principali | Titolare |
| Questa settimana | Pagina Facebook doppia, NAP su Facebook e scheda Google | Titolare |
| Entro 2 settimane | Fix schema BlogPosting (9 articoli) e bug date nelle card correlate | Sviluppo sito |
| Entro 2 settimane | Description e title da correggere (punti 6–7), noindex pagine operative | Sviluppo sito |
| Dicembre | Directory locali + sito UNSIC/ENASC con NAP identico | Titolare |
| Ogni settimana | Post su scheda Google dal calendario (ISEE 2027, IMU saldo, RED) | Social |
| Ogni mese | Tabella di monitoraggio: posizione Maps per 5–10 ricerche, chiamate/indicazioni dalla scheda, prenotazioni, recensioni | Titolare |

Ricerche da monitorare: "CAF Vigne Nuove", "patronato Bufalotta", "CAF Talenti", "invalidità civile Roma Nord", "ISEE Roma Nord", "730 Roma Vigne Nuove", "successione Roma Nord", "patronato Tufello".

## Fonti delle ricerche
- Ricerca "Pratiche Flaiano": facebook.com/PRATICHEFLAIANO, facebook.com/caf.patronatolumiere, vecchie URL praticheflaiano.it/post/…, /services, /about-us, /collaborazioni
- Ricerca "CAF patronato Vigne Nuove Roma": nessun risultato del Centro; in evidenza cylex-italia.it (Caf Confartigianato, Via Vigne Nuove 630), lazio.cgil.it/dove-siamo
