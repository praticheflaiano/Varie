# SEO locale: domande reali su pagine zona, servizi, contatti, FAQ (26/11/2026)

Gruppo: **locale**. Dati: Search Console, ultimi 3 mesi (query | impressioni | clic | posizione), forniti nell'incarico.
File toccati: solo testi, liste `faqs`, `title` e `description` (nessun nuovo file a parte questo report, nessun cambio di slug o indirizzo, nessun dato di contatto diverso da CLAUDE.md).

## Sintesi

- Su tutte le pagine del gruppo ora ci sono **orari completi e "sabato chiuso"** (ricerche "caf aperto oggi", "caf aperto sabato vicino a me", "a che ora aprono/chiudono i caf", "caf roma vicino a me aperti adesso").
- Titoli riscritti partendo dalle parole cercate: "CAF Vigne Nuove Roma…", "CAF Conca d'Oro, Tufello e Val Melaina…", "CAF Fidene, Nuovo Salario, Colle Salario e Serpentara", "CAF Talenti e Montesacro…", "Patronato a Roma Vigne Nuove…", "CAF a Roma Vigne Nuove…".
- **Val Melaina, Colle Salario, Nuova Talenti** inseriti nelle pagine zona già esistenti: sono quartieri del Municipio III secondo Roma Capitale (verificato). **Labaro** è nel Municipio XV (verificato): nessuna pagina, solo idea sotto.
- **Correzione di un dato**: secondo Bustime la linea **86 non passa da Conca d'Oro** (percorso Eretum - Nomentana - Bufalotta - Vigne Nuove - Baseggio). Le pagine dicevano il contrario: sostituita con la **338**, che a Conca d'Oro, Jonio e Vigne Nuove/Lumiere passa davvero.
- Le pagine zona **non possono avere domande frequenti** senza toccare `ZonaPage.astro` (non è nel mio gruppo): qui sotto trovi la modifica pronta e le domande per ogni zona.

## Fonti verificate

| Dato | Fonte | Verificato |
|---|---|---|
| Quartieri del Municipio III (21): Sacco Pastore, Conca d'Oro, Monte Sacro, Tufello, Val Melaina, Prati Fiscali, Nuovo Salario, Vigne Nuove, Serpentara, Fidene, Villa Spada, Colle Salario, Porta di Roma, Talenti, Nuova Talenti, Santa Maria delle Grazie Australiano, Casal Boccone, Bufalotta, Cinquina, Castel Giubileo, Settebagni | [Roma Capitale, I quartieri di Roma - Municipio III](https://www.comune.roma.it/web/it/i-quartieri-di-roma-mun3.page) | 26/11/2026 |
| Labaro è nel Municipio XV | [Roma Capitale, I quartieri di Roma - Municipio XV](https://www.comune.roma.it/web/it/i-quartieri-di-roma-mun15.page) | 26/11/2026 |
| Linea 38: Conca d'Oro (MB1), P.le Jonio, Vigne Nuove/Lumiere | [Bustime linea 38](https://it.busti.me/rome/rome-bus-38/) | 26/11/2026 |
| Linea 336: Conca d'Oro (MB1), Vigne Nuove/Lumiere | [Bustime linea 336](https://it.busti.me/rome/rome-bus-336/) | 26/11/2026 |
| Linea 338: Conca d'Oro (MB1), Jonio (MB1), Via della Bufalotta (Dalmistro, Mignosi…), Vigne Nuove/Lumiere | [Bustime linea 338](https://it.busti.me/rome/rome-bus-338/) | 26/11/2026 |
| Linea 341: stazione Fidene (FL1), Via della Bufalotta (Fucini, Cecchina…), Vigne Nuove/Lumiere | [Bustime linea 341](https://it.busti.me/rome/rome-bus-341/) | 26/11/2026 |
| Linea 86: Nomentana, Tor S. Giovanni, Via della Bufalotta (Dalmistro, Mignosi, Fucini…), Vigne Nuove/Lumiere; **nessuna fermata a Conca d'Oro** | [Bustime linea 86](https://it.busti.me/rome/rome-bus-86/) | 26/11/2026 |
| Orari, telefono, WhatsApp, indirizzo | `CLAUDE.md` del repo e `sito/src/consts.ts` (`HOURS`, `CONTACT`) | uguali |
| Prezzi citati (730 da 30 €/35 €, successione 600 € tutto compreso con imposte a parte, dimissioni da 15 €, tessera 30 €/anno, ISEE, pensione e NASpI gratis, prezzo colf solo su WhatsApp) | pagine del sito: `/730`, `/successioni`, `/dimissioni-online`, `/tesseramento`, `/faq`, `/colf-badanti` | già pubblicati |

## Modifiche per file

### `sito/src/pages/zone/caf-patronato-vigne-nuove.astro`
Ricerche: "caf vigne nuove" 244 (pos. 7,1), "via filoteo alberini 25" 61, "caf vigne nuove roma" 35, "patronato vigne nuove" 19, "caf via delle vigne nuove" 14, "caf via delle vigne nuove telefono" 8.
- title: prima "CAF e patronato a Vigne Nuove, Roma" → dopo **"CAF Vigne Nuove Roma e patronato: orari, telefono, indirizzo"** (60)
- description: ora con indirizzo, orari, sabato chiuso, telefono (143 caratteri).
- h1 "CAF e patronato a Vigne Nuove, Roma"; intro che risponde subito: dove siamo, aperti lun-ven, sabato chiuso.
- Nuove schede nella sezione "Come arrivare": **"Siamo in Via delle Vigne Nuove?"** (no: Via Filoteo Alberini 25 int. 10; fermata Vigne Nuove/Lumiere su Via delle Vigne Nuove a circa 6 minuti, dato già presente sul sito) e **"Orari: siete aperti oggi? E il sabato?"**.
- Scheda "Linee 86 e 336 dalla metro Conca d'Oro" → "Linee 336 e 338 dalla metro Conca d'Oro" (vedi correzione 86).
- Scheda Municipio III: elenco dei quartieri con fonte Roma Capitale.

### `zone/caf-patronato-tufello-conca-oro.astro`
Ricerche: "caf conca d'oro" 26 (pos. 11,1), "caf conca d'oro roma" 13 (8,5), "caf val melaina" 13 (7,5), "caf tufello" 9 (5,3).
- title: "CAF e patronato Tufello e Conca d'Oro" → **"CAF Conca d'Oro, Tufello e Val Melaina: patronato a Roma"** (56). Conca d'Oro prima perché ha più impressioni e posizione peggiore.
- description con indirizzo, linee dalla metro, sabato chiuso; h1 e intro riordinati (Conca d'Oro, Tufello, Val Melaina).
- Scheda "Da Conca d'Oro: linee 38, 336 e 86" → "linee 38, 336 e 338" con fonti Bustime.
- Nuove schede: "Quanto siete lontani da Tufello, Conca d'Oro e Val Melaina?" (stesso Municipio III, nessun tempo inventato, rimando al pulsante "Calcola il percorso") e "Orari: siete aperti oggi? E il sabato?".
- **Val Melaina**: era già nel titolo della pagina; ora confermato con la fonte Roma Capitale nella scheda Municipio III.

### `zone/caf-patronato-fidene-serpentara-nuovo-salario.astro`
Ricerche: "caf fidene" 22 (11,3), "caf nuovo salario" 18 (24,3), "caf colle salario" 15 (8,8), "caf colle salario roma" 14 (7,0), "caf serpentara" 6 (4,3).
- title: "CAF e patronato Fidene e Nuovo Salario" → **"CAF Fidene, Nuovo Salario, Colle Salario e Serpentara"** (53).
- description, intro, titolo trasporti e officesIntro con tutti e quattro i nomi.
- Nuove schede "Quanto siete lontani…" e "Orari…". Scheda Municipio III con fonte.
- Il nome del link "Altre zone" ora è "Fidene, Nuovo Salario, Colle Salario, Serpentara" in tutte e 5 le pagine (stesso indirizzo, stesso testo).
- **Colle Salario**: già coperto da questa pagina, ora anche nel titolo. Confermato Municipio III.

### `zone/caf-patronato-talenti-montesacro.astro` (rafforzata, pos. 15,8)
Ricerche: "caf talenti" 20 (15,8), "caf talenti roma" 6 (15,8), "patronato talenti" 5.
- title: "CAF e patronato Talenti e Montesacro" → **"CAF Talenti e Montesacro, Roma: patronato, orari e percorso"** (59).
- description con indirizzo e orari; eyebrow, intro e officesIntro con **Nuova Talenti** (quartiere del Municipio III secondo Roma Capitale); h1 "…Talenti e Montesacro, Roma".
- Scheda metro B1: "38, 336 e 86" → "38, 336 e 338" (+ fonte Bustime 338; la 338 passa anche da Jonio).
- Nuove schede "Quanto siete lontani da Talenti e Montesacro?" e "Orari…". Scheda Municipio III riscritta con fonte.
- Non ho trovato su Bustime una linea con fermate chiaramente "Talenti" verso Vigne Nuove: non l'ho scritta.

### `zone/caf-patronato-bufalotta-porta-di-roma.astro`
Ricerche: "caf bufalotta" 31 (5,4).
- title: "CAF e patronato Bufalotta e Porta di Roma" → **"CAF Bufalotta e Porta di Roma: patronato, orari e percorso"** (58).
- Nuova scheda **"Lungo Via della Bufalotta: linee 86, 338 e 341"** (verificate su Bustime, con esempi di fermata corretti per ogni linea).
- Nuove schede "Quanto siete lontani…" e "Orari…". Scheda Municipio III con fonte.

### `zone/index.astro`
- title: "Zone servite a Roma Nord" → **"CAF e patronato Roma Nord: zone servite nel Municipio III"** (57); description con i quartieri più cercati e "sabato chiuso".
- Sottotitolo con orari completi; testo "Vuoi venire in ufficio?" con "su appuntamento, lun-ven, sabato chiuso".
- Card: 86 tolta da Conca d'Oro/Talenti, aggiunte 338 e 341 dove verificate; card Talenti con "Anche Nuova Talenti".

### `contatti.astro`
Ricerche: "via filoteo alberini 25" 61 (6,7), "caf via delle vigne nuove telefono" 8, "caf numero di telefono aperti adesso", "caf flaiano" 134 (1,0).
- title: "Contatti CAF Vigne Nuove, Roma: indirizzo e orari" → **"Orari e telefono CAF Flaiano: Via Filoteo Alberini 25, Roma"** (59). Così non si fa concorrenza con la pagina zona Vigne Nuove su "caf vigne nuove".
- description con telefono, orari, sabato chiuso, "su appuntamento" (151).
- Sottotitolo con orari e numeri; "Come raggiungerci": tolto "in pochi minuti" (tempo non verificato), elenco dei quartieri del Municipio III e link alle zone servite.
- Autobus: precisato che Vigne Nuove/Lumiere è su Via delle Vigne Nuove; dalla metro B1 Conca d'Oro anche 336 e 338; da Bufalotta 86 e 341 (da Fidene).
- Nuova voce: "**Sabato e domenica:** chiusi. Il venerdì solo la mattina, 9:30-14:00."

### `faq.astro`
- title: "Domande frequenti su CAF e patronato" → **"CAF e patronato Roma: orari, prezzi e domande frequenti"** (55); description nuova (139).
- Domande nuove o rinominate (gruppo Generale): "Quali sono gli orari del CAF? A che ora aprite e chiudete?", **"Siete aperti il sabato?"**, **"Siete aperti oggi?"**, **"Qual è il numero di telefono del CAF e patronato?"**, **"Quanto costano le pratiche? C'è un listino prezzi?"** (solo prezzi già pubblicati). "Dove si trova…" ora elenca le zone del Municipio III e linka /zone.
- Gruppo Pensioni e Patronato: **"Cos'è il mandato al Patronato ENASC?"** (ricerca "mandato enasc" 36, pos. 3,9) con link a /mandato.
- 730: aggiunto "da casa a partire da 35 €" (come la pagina /730).

### `servizi/caf.astro`
Ricerche: "caf vicino a me" 346 (2,8), "caf roma" 238 (6,9), "caf" 238 (0 clic), "caf aperto vicino a me" 19, "assistenza fiscale roma" 9 (45,9).
- title: "Servizi CAF: 730, ISEE, IMU, Successioni, Contratti, Bonus" → **"CAF a Roma Vigne Nuove: 730, ISEE, IMU e successioni"** (52); description con prezzi pubblicati e sabato chiuso.
- Sottotitolo con indirizzo e "aperto dal lunedì al venerdì".
- faqs nuove: **"Dove trovo un CAF vicino a me a Roma nord?"**, **"Il CAF è aperto oggi? E il sabato?"**, **"Quanto costa fare l'ISEE al CAF?"**, **"Quanto costa la successione al CAF?"** (600 € tutto compreso, imposte e bolli a parte). Domanda 730 con "da 35 € da casa" e link /730.

### `servizi/patronato.astro`
Ricerche: "patronato vicino a me" 103 (4,6), "patronato roma" 81 (8,7), "patronato" 59, "servizio di patronato roma" 9 (35,9), "listino prezzi pratiche patronato" 4 (64), "caf consulente del lavoro vicino a me" 7, "consulente del lavoro caf roma" 6.
- title: "Servizi Patronato: pensioni, NASpI, invalidità, assegno unico" → **"Patronato a Roma Vigne Nuove: pensioni, NASpI, invalidità"** (57); description nuova (146); sottotitolo con indirizzo.
- faqs nuove: **"Dove trovo un patronato vicino a me a Roma nord?"**, **"Il patronato è aperto oggi? E il sabato?"**, **"Quanto costano le pratiche di patronato? C'è un listino prezzi?"**, **"Cos'è il mandato al Patronato ENASC?"**, **"Seguite anche colf e badanti, come un consulente del lavoro?"** (solo quello che la pagina /colf-badanti dice già; prezzo su WhatsApp).

### `servizi/index.astro`
Ricerche: "caf patronato" 81 (26,8), "caf e patronato a roma" 24 (30,0), "caf patronato roma" 61 (5,0).
- title: "Servizi CAF e Patronato Roma Nord | Centro Pratiche Flaiano" → **"CAF e patronato a Roma: tutti i servizi a Vigne Nuove"** (53); description con orari.
- Sottotitolo: corretto "e CAF UNSIC" → "è CAF UNSIC", aggiunti indirizzo e giorni di apertura.

### `servizi/servizi-vari.astro`
- title "Servizi vari: PEC…" → "Servizi vari a Roma: PEC, utenze, certificati, assicurazioni"; description con Vigne Nuove, cartelle e raccomandate SEND, sabato chiuso.

### `chi-siamo.astro`
- Paragrafo sede: elenco completo dei quartieri del Municipio III serviti, link /zone, orari.

## Proposta per il coordinatore: domande frequenti nelle pagine zona

`ZonaPage.astro` non ha né `faqs` né uno slot: senza toccarlo le pagine zona non possono avere la sezione "Domande frequenti" e i dati FAQPage. Modifica proposta (solo `sito/src/components/zone/ZonaPage.astro`, usato solo dalle 5 pagine zona):

```astro
// in alto
import JsonLdFaq from "~/components/seo/JsonLdFaq.astro";
// in Props
  faqs?: { question: string; answer: string }[];

// subito dopo <BaseLayout ...>
  {p.faqs && p.faqs.length > 0 && <JsonLdFaq slot="head" items={p.faqs} />}

// dopo la </section> della griglia, prima di </BaseLayout>
  {p.faqs && p.faqs.length > 0 && (
    <section class="section-tight" aria-labelledby="faq-zona">
      <div class="container-narrow">
        <h2 id="faq-zona" class="font-display text-2xl font-bold text-[var(--color-ink)]">Domande frequenti</h2>
        <div class="mt-4 space-y-3">
          {p.faqs.map((f) => (
            <details class="rounded-[20px] bg-[#F7F7FB] p-5">
              <summary class="cursor-pointer font-display text-base font-bold text-[var(--color-ink)]">{f.question}</summary>
              <p class="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed" set:html={f.answer} />
            </details>
          ))}
        </div>
      </div>
    </section>
  )}
```

Uso `<details>` (come `ServiceLanding.astro`) perché le risposte restano nell'HTML; poi in ogni pagina zona `const faqs = [...]` e `faqs={faqs}`. Dopo la build: controllo axe sulle 5 pagine.

Domande pronte (tutte con dati già verificati):

Comuni a tutte e 5:
- **Il CAF è aperto oggi?** Dal lunedì al giovedì 9:30-13:00 e 15:30-18:00, il venerdì 9:30-14:00. Sabato e domenica chiusi. Riceviamo su appuntamento: prenota online o chiama lo 06 9784 5429.
- **Siete aperti il sabato?** No, sabato e domenica siamo chiusi. Il venerdì siamo aperti solo la mattina, dalle 9:30 alle 14:00.
- **Qual è il numero di telefono?** Telefono 06 9784 5429, WhatsApp 371 623 0690.
- **Serve l'appuntamento?** Sì, riceviamo su appuntamento, in sede o online.

Per zona:
- Vigne Nuove: **"Il CAF è in Via delle Vigne Nuove?"** No, in Via Filoteo Alberini 25 int. 10, dentro il Centro Acquisti Flaiano; dalla fermata Vigne Nuove/Lumiere circa 6 minuti a piedi. **"C'è parcheggio?"** Sì, gratuito, nel centro acquisti e in strada.
- Conca d'Oro, Tufello, Val Melaina: **"C'è un CAF per chi abita a Val Melaina?"** Val Melaina è nel Municipio III come Vigne Nuove: il nostro ufficio è in Via Filoteo Alberini 25. **"Come arrivo dalla metro Conca d'Oro?"** Linee 38, 336 o 338 fino a Vigne Nuove/Lumiere.
- Fidene, Nuovo Salario, Colle Salario, Serpentara: **"C'è un CAF per Colle Salario e Nuovo Salario?"** Stesso Municipio III, Via Filoteo Alberini 25. **"Come arrivo da Fidene?"** Linea 341 dalla stazione di Fidene fino a Vigne Nuove.
- Talenti e Montesacro: **"C'è un CAF e patronato vicino a Talenti?"** Talenti e Nuova Talenti sono nel Municipio III, come il nostro ufficio a Vigne Nuove. **"Come arrivo da Montesacro?"** Linea 336 (fermate Tirreno/Sempione, Piazzale Adriatico) fino a Vigne Nuove.
- Bufalotta e Porta di Roma: **"Come arrivo da Porta di Roma?"** Linea 38 dal capolinea fino a Vigne Nuove/Lumiere. **"Quali autobus passano da Via della Bufalotta?"** 86, 338 e 341, tutte con fermata Vigne Nuove/Lumiere.

## Proposte per la home (`sito/src/pages/index.astro`, non toccata)

Ricerche: "caf vicino a me" 346 (2,8), "caf" 238 (2,7, **0 clic**), "caf roma" 238 (6,9), "centro pratiche flaiano" 236 (1,1), "caf patronato vicino a me" 77 (3,9).
- description attuale senza orari: proposta "CAF UNSIC e patronato ENASC a Roma Vigne Nuove, Via Filoteo Alberini 25: 730, ISEE gratis, NASpI, pensioni. Lun-ven, sabato chiuso. Tel 06 9784 5429." (circa 150 caratteri). Chi cerca "caf" o "caf vicino a me" vuole sapere se siamo aperti e dove siamo: metterlo nello snippet può alzare i clic da posizione 2-3.
- title: mantenere "CAF e Patronato Roma Vigne Nuove | Centro Pratiche Flaiano" (porta già i clic del nome).
- `homeFaq`: aggiungere "Siete aperti il sabato?" e "Siete aperti oggi?" (testi come in /faq).
- Il blocco "Dove siamo" della home può linkare /zone ("Vedi come arrivare dalla tua zona").

## Scheda Google Business: azioni consigliate (da valutare)

1. **Orari**: controllare che siano Lun-Gio 9:30-13:00 e 15:30-18:00, Ven 9:30-14:00, Sab-Dom chiuso. Inserire gli **orari speciali** già decisi: chiuso martedì 8 dicembre 2026; chiuso dal 23 dicembre 2026 al 10 gennaio 2027. Le ricerche "aperto oggi / aperti adesso" usano lo stato "Aperto ora" di Google: se la scheda sbaglia, il sito non basta.
2. **Attributi**: "su appuntamento", ingresso, parcheggio e bagno accessibili in sedia a rotelle, parcheggio gratuito (dati già sulla pagina contatti).
3. **Categorie**: principale la voce dell'elenco Google più vicina a "centro di assistenza fiscale / CAF"; secondarie quelle per patronato/servizi previdenziali e consulenza fiscale. I nomi esatti vanno scelti nel pannello: non li ho verificati.
4. **Zona servita**: aggiungere i quartieri del Municipio III più cercati (Vigne Nuove, Talenti, Conca d'Oro, Tufello, Val Melaina, Bufalotta, Porta di Roma, Fidene, Nuovo Salario, Colle Salario, Serpentara). Labaro solo se Antonio conferma che ci sono clienti da lì.
5. **Nome**: non aggiungere parole chiave al nome della scheda (le linee guida Google lo vietano e si rischia la sospensione).
6. **Domande e risposte** (se la funzione è ancora attiva sulla scheda; altrimenti stessi testi nei post): "Siete aperti il sabato?", "Serve l'appuntamento?", "Quanto costa l'ISEE?" (prima ISEE dell'anno gratis), "Quanto costa il 730?" (da 30 € in ufficio), "Dove si trova l'ingresso?" (Centro Acquisti Flaiano, interno 10), "Fate la domanda NASpI?" (sì, gratis).
7. **Servizi/prodotti** sulla scheda con i prezzi già pubblicati (730, successione, dimissioni online, tessera) e link alle pagine del sito.
8. **Link**: sito → home o /contatti; "Prenota" → /prenota.

## Dati NON verificati e lasciati fuori

- **Tempi di percorrenza** dalle zone (nessuno: solo "stesso Municipio III" e il pulsante "Calcola il percorso"). Il "circa 6 minuti a piedi" dalla fermata Vigne Nuove/Lumiere era già sul sito (fonte Moovit) e l'ho lasciato.
- **Moovit** non risponde alle richieste automatiche: non ho potuto ricontrollare le fonti Moovit esistenti né le linee 339/349 (lasciate come erano).
- Linee che partono da **Talenti** verso Vigne Nuove: non trovate su Bustime, non scritte.
- Se facciamo **SPID**, pratiche di **cittadinanza** o **permesso di soggiorno**: sul sito non c'è nessun servizio così, non ho scritto nulla (vedi idee).
- Il pulsante **"Da remoto (video o telefono)"** della pagina contatti usa `BOOKING.arcanisRemote`, che in `consts.ts` è segnato come **disattivato (404)**; la pagina risponde 200 ma è un'app che si carica dopo e non posso vedere il calendario. Stesso link in `BookingCTA.astro` e `prenota.astro` (non del mio gruppo). **Da controllare a mano**: se è disattivato, meglio puntare a WhatsApp come dice il commento in consts.
- In `info.astro` (non del mio gruppo) c'è "Comodo da Porta di Roma, Tufello e Labaro": Labaro è nel Municipio XV.
- Le FAQ di `/faq`, `/servizi/caf` e `/servizi/patronato` usano `Accordion.svelte`, che **mette la risposta nell'HTML solo quando la domanda è aperta**: Google la legge dai dati FAQPage, ma il testo visibile della pagina non la contiene. Proposta: passare a `<details>` come `ServiceLanding.astro` (modifica di componente, da decidere).

## Idee di nuovi contenuti (gruppo locale)

1. **Domande frequenti nelle pagine zona** (modifica sopra): copre "caf aperto oggi", "caf aperto sabato vicino a me", "caf via delle vigne nuove telefono", "caf val melaina", "caf colle salario roma".
2. **Pagina "Prezzi CAF e patronato"** con solo i prezzi già decisi e "preventivo su WhatsApp" per il resto. Ricerche: "listino prezzi pratiche patronato" (pos. 64), "quanto costa…" nei gruppi servizi. Serve il via di Antonio su cosa pubblicare.
3. **Labaro e Roma Nord fuori Municipio III**: niente pagina zona (Municipio XV). Se Antonio conferma clienti da Labaro/Prima Porta, aggiungere Labaro alla zona servita della scheda Google e una riga in /zone ("vengono da noi anche da…"). Ricerca: "caf labaro" 54 impressioni, pos. 7,1, 0 clic.
4. **"Dove fare lo SPID o la CIE a Roma Municipio III"**: solo se facciamo il riconoscimento SPID, oppure come guida con le fonti ufficiali (Comune di Roma per la CIE). Ricerca: "dove fare lo spid vicino a me".
5. **CAF per stranieri / cittadinanza**: solo se Antonio conferma i servizi (la pagina colf cita già il contratto di soggiorno). Ricerche: "caf per stranieri vicino a me", "caf per cittadinanza italiana vicino a me".
6. **Mandato ENASC**: la pagina `/mandato` è `noindex` ma "mandato enasc" ha 36 impressioni in pos. 3,9. Valutare una breve spiegazione indicizzabile (ora c'è la domanda in /faq e in /servizi/patronato).
