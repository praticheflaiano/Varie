/**
 * Parole comuni → pagine del sito. Usato dalla ricerca interna:
 * - riquadro "Forse cerchi" in /cerca (1-3 link sopra i risultati);
 * - suggerimenti mentre scrivi nella casella di ricerca (SearchBox), senza caricare Pagefind;
 * - pagine suggerite quando la ricerca non trova nulla;
 * - la prima parola di ogni voce è il "termine principale": /cerca lo cerca anche con Pagefind
 *   (es. "carta 80 euro" cerca anche "carta acquisti").
 *
 * Come scrivere le parole: minuscole, senza accenti (il confronto li toglie comunque),
 * anche con gli errori di battitura più comuni. Le parole brevi (di, a, il, per…) sono ignorate.
 * Ogni indirizzo deve esistere: pagine in sito/src/pages, articoli /blog/<slug> in content/*.
 * Controllati il 27/11/2026.
 */
export type TipoVoce = "servizio" | "calcolatore" | "guida";

export interface VoceRicerca {
  /** Varianti che la gente scrive. La prima è il termine principale. */
  parole: string[];
  titolo: string;
  url: string;
  tipo: TipoVoce;
  /** Mostra il pulsante "Prenota" (solo per i servizi che si fanno in ufficio). */
  prenota?: boolean;
}

type Link = [titolo: string, url: string, tipo: TipoVoce, prenota?: boolean];

/** Stesse parole per più pagine: la prima pagina è la più importante. */
function gruppo(parole: string[], ...links: Link[]): VoceRicerca[] {
  return links.map(([titolo, url, tipo, prenota]) => ({ parole, titolo, url, tipo, ...(prenota ? { prenota } : {}) }));
}

export const VOCI_RICERCA: VoceRicerca[] = [
  // Lavoro e disoccupazione
  ...gruppo(
    ["naspi", "disoccupazione", "sussidio di disoccupazione", "sussidio", "indennita di disoccupazione", "ho perso il lavoro", "perso il lavoro", "licenziato", "licenziata", "fine contratto", "nasp", "naspy", "naspi domanda", "disocupazione", "disoccupazzione", "disoccupata", "disoccupato"],
    ["NASpI: la domanda di disoccupazione", "/naspi", "servizio", true],
    ["Calcolo NASpI: quanto ti spetta e per quanto", "/calcolo-naspi", "calcolatore"],
  ),
  // "calcolo naspi" & simili: prima il calcolatore, poi la pagina del servizio (27/11/2026)
  ...gruppo(["calcolo naspi", "calcolare naspi", "naspi calcolo", "calcolatore naspi", "simulatore naspi", "simulazione naspi", "quanto prendo naspi", "quanto spetta naspi", "importo naspi", "stima naspi"], ["Calcolo NASpI: quanto ti spetta e per quanto", "/calcolo-naspi", "calcolatore"]),
  ...gruppo(["anticipo naspi", "calcolo anticipo naspi", "naspi anticipata", "naspi in un unica soluzione", "aprire partita iva con la naspi"], ["Anticipo NASpI: calcolo delle due rate", "/anticipo-naspi", "calcolatore"]),
  ...gruppo(["quando arriva la naspi", "pagamento naspi", "naspi non arrivata", "naspi pagamento"], ["Quando arriva la NASpI", "/naspi/pagamento", "guida"]),
  ...gruppo(["ricorso naspi", "naspi respinta", "naspi rifiutata", "rigetto naspi"], ["Ricorso NASpI", "/naspi/ricorso", "guida"]),
  ...gruppo(["did", "did online", "immediata disponibilita", "dichiarazione di immediata disponibilita"], ["DID online: la dichiarazione di immediata disponibilità", "/naspi/did", "guida"]),
  ...gruppo(["lavorare con la naspi", "nuovo lavoro naspi", "naspi com", "naspi e lavoro"], ["Lavorare durante la NASpI", "/naspi/nuovo-lavoro", "guida"]),
  ...gruppo(["siisl", "patto di attivazione digitale", "pad naspi"], ["SIISL: il patto di attivazione digitale", "/siisl", "servizio"]),
  ...gruppo(["fondo di garanzia", "tfr non pagato", "stipendi non pagati", "azienda fallita", "fallimento"], ["Fondo di garanzia INPS: TFR e stipendi non pagati", "/naspi/fondo-garanzia-tfr", "guida"]),
  ...gruppo(
    ["dimissioni", "dimissioni online", "licenziarsi", "mi licenzio", "dimettersi", "dimettermi", "dare le dimissioni", "dimissioni giusta causa", "dimisioni", "dimmissioni"],
    ["Dimissioni online: le facciamo noi", "/dimissioni-online", "servizio", true],
  ),

  // Assegno di inclusione e carte
  ...gruppo(
    ["assegno di inclusione", "adi", "reddito di cittadinanza", "reddito cittadinanza", "rdc", "sfl", "supporto formazione lavoro", "supporto per la formazione e il lavoro", "assegno inclusione"],
    ["Assegno di inclusione e SFL: la domanda", "/adi-sfl", "servizio", true],
    ["Calcolo Assegno di inclusione: quanto spetta", "/calcolo-assegno-inclusione", "calcolatore"],
  ),
  ...gruppo(["calcolo assegno di inclusione", "calcolo adi", "calcolatore adi", "simulatore adi", "quanto spetta adi", "importo adi", "importo assegno di inclusione"], ["Calcolo Assegno di inclusione: quanto spetta", "/calcolo-assegno-inclusione", "calcolatore"]),
  ...gruppo(
    ["carta acquisti", "carta 80 euro", "80 euro", "social card", "socialcard", "carta sociale", "carta acquisto", "carta 40 euro"],
    ["Carta Acquisti: 80 euro ogni due mesi", "/blog/carta-acquisti-2026-80-euro-differenza-carta-dedicata-a-te", "guida"],
  ),
  ...gruppo(
    ["carta dedicata a te", "carta dedicata", "carta 500 euro", "500 euro", "carta del comune"],
    ["Carta Dedicata a te: 500 euro", "/blog/carta-dedicata-a-te-2026-2027-scadenza-16-dicembre", "guida"],
  ),

  // Bollette
  ...gruppo(
    ["bonus bollette", "bonus luce", "bonus gas", "bonus acqua", "bonus sociale", "bonus energia", "bonus bolletta", "bonus luce e gas", "sconto bollette"],
    ["Bonus bollette: luce, gas e acqua", "/blog/bonus-bollette-2027-isee-luce-gas-acqua", "guida"],
    ["Controllo bollette luce e gas, gratis", "/luce-gas", "servizio", true],
  ),
  ...gruppo(["bollette", "bolletta", "bolletta luce", "bolletta gas", "luce e gas", "luce gas", "bolletta alta", "cambiare fornitore", "luce", "gas"], ["Controllo bollette luce e gas, gratis", "/luce-gas", "servizio", true]),

  // 730 e tasse
  ...gruppo(
    ["730", "modello 730", "dichiarazione dei redditi", "dichiarazione redditi", "precompilata", "730 precompilato", "dichiarazione precompilata", "rimborso irpef", "modello redditi", "redditi pf", "unico", "740", "dichiarazzione dei redditi", "dichiarazione dei reddito"],
    ["Modello 730: la dichiarazione dei redditi", "/730", "servizio", true],
    ["Guida al 730: documenti e scadenze", "/blog/guida-730-2026-documenti-scadenze", "guida"],
  ),
  ...gruppo(["spese mediche", "detrazioni", "spese detraibili", "scontrini farmacia", "detrazione"], ["Detrazioni spese mediche nel 730", "/blog/detrazioni-spese-mediche-730-2026-guida-completa", "guida"], ["Modello 730: la dichiarazione dei redditi", "/730", "servizio", true]),
  ...gruppo(
    ["tari", "imu", "rifiuti", "tassa rifiuti", "tassa sui rifiuti", "ama", "tasi", "seconda casa", "avviso ama", "f24 imu", "tassa casa"],
    ["IMU e TARI: calcolo, F24 ed esenzioni", "/imu-tari", "servizio", true],
  ),
  ...gruppo(
    ["cartelle", "cartella esattoriale", "cartelle esattoriali", "rottamazione", "rottamazione quinquies", "debiti", "debito", "agenzia riscossione", "agenzia delle entrate riscossione", "ader", "equitalia", "rateizzazione", "rateizzare", "rateizzare debiti"],
    ["Cartelle esattoriali e rateizzazione", "/cartelle-rateizzazione", "servizio", true],
    ["Rottamazione quinquies: come funziona", "/blog/rottamazione-quinquies-2026", "guida"],
  ),
  ...gruppo(["contratto affitto", "contratto di affitto", "affitto", "locazione", "registrazione contratto", "cedolare secca"], ["Contratti d'affitto: la registrazione", "/contratti-affitto", "servizio", true]),
  ...gruppo(["canone rai", "rai", "canone tv", "esenzione canone"], ["Esenzione canone RAI", "/blog/canone-rai-2027-esenzione-over-75-non-detenzione", "guida"]),
  ...gruppo(["scadenze", "scadenza", "scadenziario", "calendario fiscale"], ["Scadenze fiscali e INPS", "/scadenze", "servizio"]),

  // ISEE
  ...gruppo(
    ["isee", "dsu", "dichiarazione sostitutiva unica", "isse", "iseee", "isee 2027", "isee universitario", "isee minorenni", "isee sociosanitario", "rinnovo isee", "fare isee"],
    ["ISEE gratis: lo facciamo noi", "/isee", "servizio", true],
    ["Quale ISEE ti serve: il test", "/quale-isee", "calcolatore"],
  ),
  ...gruppo(["isee corrente", "isee aggiornato", "isee dopo licenziamento"], ["ISEE corrente: quando conviene", "/blog/isee-corrente-quando-conviene-roma", "guida"], ["ISEE gratis: lo facciamo noi", "/isee", "servizio", true]),
  ...gruppo(["giacenza media", "saldo e giacenza", "giacenza"], ["Giacenza media ISEE: come si calcola", "/blog/giacenza-media-isee-2027-come-calcolarla-dove-trovarla", "guida"]),

  // Famiglia
  ...gruppo(
    ["assegno unico", "auu", "assegno unico universale", "assegno per i figli", "assegno figli", "assegno unico figli"],
    ["Assegno Unico: la domanda", "/assegno-unico", "servizio", true],
    ["Calcolo Assegno Unico: quanto spetta per figlio", "/calcolo-assegno-unico", "calcolatore"],
  ),
  ...gruppo(["calcolo assegno unico", "calcolatore assegno unico", "simulatore assegno unico", "simulazione assegno unico", "quanto spetta assegno unico", "importo assegno unico", "tabella assegno unico"], ["Calcolo Assegno Unico: quanto spetta per figlio", "/calcolo-assegno-unico", "calcolatore"]),
  ...gruppo(
    ["maternita", "maternita obbligatoria", "congedo di maternita", "gravidanza a rischio", "maternita anticipata", "paternita", "congedo di paternita", "indennita di maternita"],
    ["Calcolo maternità e congedi: date e importi", "/calcolo-maternita-congedi", "calcolatore"],
    ["Maternità obbligatoria: i 5 mesi", "/blog/maternita-obbligatoria-5-mesi-gravidanza-a-rischio-lavori-pericolosi", "guida"],
  ),
  ...gruppo(["calcolo maternita", "calcolo paternita", "calcolatore maternita", "simulatore maternita", "date maternita"], ["Calcolo maternità e congedi: date e importi", "/calcolo-maternita-congedi", "calcolatore"]),
  ...gruppo(
    ["congedo parentale", "congedo", "maternita facoltativa", "astensione facoltativa", "facoltativa"],
    ["Calcolo congedo parentale: mesi e importo", "/calcolo-congedo-parentale", "calcolatore"],
    ["Congedo parentale: quanti mesi e come si chiede", "/blog/congedo-parentale-guida-mesi-80-per-cento-domanda", "guida"],
  ),
  ...gruppo(["calcolo congedo parentale", "calcolatore congedo parentale", "simulatore congedo parentale"], ["Calcolo congedo parentale: mesi e importo", "/calcolo-congedo-parentale", "calcolatore"]),
  ...gruppo(
    ["bonus nido", "bonus asilo nido", "asilo nido", "nido", "bonus asilo"],
    ["Bonus nido: domanda e ricevute", "/blog/bonus-asilo-nido-2026-3600-euro-domanda-inps", "guida"],
    ["Bonus nido, nuovi nati e maternità: la domanda", "/bonus-famiglia", "servizio", true],
  ),
  ...gruppo(
    ["bonus nuovi nati", "bonus nascita", "bonus 1000 euro", "bonus bebe", "bonus neonato", "nuovi nati", "bonus figli"],
    ["Bonus nuovi nati: 1.000 euro per ogni figlio", "/blog/bonus-nuovi-nati-1000-euro-domanda-120-giorni", "guida"],
    ["Bonus nido, nuovi nati e maternità: la domanda", "/bonus-famiglia", "servizio", true],
  ),
  ...gruppo(["bonus mamme", "bonus mamma", "bonus mamme lavoratrici"], ["Nuovo bonus mamme", "/blog/nuovo-bonus-mamme-2026-domanda-inps-31-dicembre", "guida"]),
  ...gruppo(["assegno di maternita del comune", "assegno maternita comune", "maternita comune"], ["Assegno di maternità dei Comuni", "/blog/assegno-maternita-comune-2026-roma", "guida"]),
  ...gruppo(
    ["colf", "badante", "badanti", "lavoro domestico", "domestica", "babysitter", "baby sitter", "assumere badante", "contributi colf", "assumere colf"],
    ["Colf e badanti: assunzione e contributi", "/colf-badanti", "servizio", true],
    ["Calcolo costo colf e badante", "/calcolo-costo-colf-badante", "calcolatore"],
  ),
  ...gruppo(["costo colf", "costo badante", "calcolo colf", "calcolo badante", "calcolo stipendio badante", "calcolo contributi colf", "quanto costa una badante", "stipendio badante"], ["Calcolo costo colf e badante", "/calcolo-costo-colf-badante", "calcolatore"]),
  ...gruppo(["tfr colf", "calcolo tfr colf", "calcolo tfr badante", "tfr badante", "liquidazione badante", "liquidazione colf"], ["Calcolo TFR colf e badanti", "/calcolo-tfr-colf-badanti", "calcolatore"]),

  // Pensioni
  ...gruppo(["pensione minima", "minimo pensione", "trattamento minimo", "integrazione al minimo", "minima"], ["Pensione minima 2027: importo e aumenti", "/blog/pensione-minima-2027-quanto-aumenta", "guida"]),
  ...gruppo(
    ["pensione di reversibilita", "reversibilita", "reversibile", "pensione del marito", "pensione della moglie", "reversibilta", "riversibilita", "pensione ai superstiti"],
    ["Pensione di reversibilità: quanto spetta", "/blog/pensione-reversibilita-quanto-spetta-domanda", "guida"],
    ["Pensioni: il patronato", "/pensioni", "servizio", true],
  ),
  ...gruppo(["assegno di vedovanza", "vedovanza", "vedova", "vedovo"], ["Assegno di vedovanza: ti spetta?", "/assegno-vedovanza", "calcolatore"]),
  ...gruppo(["assegno sociale", "pensione sociale"], ["Assegno sociale: importo e requisiti", "/blog/assegno-sociale-2026-importo-requisiti-domanda", "guida"]),
  ...gruppo(["cedolino", "cedolino pensione", "cedolino inps", "cedolini", "obis m"], ["Cedolino della pensione: come leggerlo", "/blog/cedolino-pensione-novembre-dicembre-2026-come-leggerlo", "guida"]),
  ...gruppo(["154 euro", "importo aggiuntivo", "bonus 154", "tredicesima", "tredicesima pensione"], ["Bonus 154,94 euro sulla pensione di dicembre", "/blog/importo-aggiuntivo-154-euro-pensione-dicembre-2026", "guida"]),
  ...gruppo(["aumento pensioni", "rivalutazione", "rivalutazione pensioni", "perequazione"], ["Rivalutazione pensioni 2027", "/blog/rivalutazione-pensioni-2027-aumento-gennaio-fasce", "guida"]),
  ...gruppo(["ape sociale", "ape"], ["APE sociale: la domanda", "/blog/ape-sociale-2026-ultima-scadenza-30-novembre", "guida"]),
  ...gruppo(
    ["pensione", "pensioni", "andare in pensione", "quando vado in pensione", "calcolo pensione", "stima pensione", "simulatore pensione", "simulazione pensione", "calcolatore pensione", "pensione anticipata", "pensione di vecchiaia", "requisiti pensione", "ecocert", "estratto contributivo", "estratto conto inps", "contributi inps"],
    ["Pensioni: il patronato", "/pensioni", "servizio", true],
    ["Stima della pensione dall'estratto INPS", "/stima-pensione", "calcolatore"],
    ["Requisiti pensione 2027", "/blog/requisiti-pensione-2027-vecchiaia-anticipata", "guida"],
  ),
  ...gruppo(["red", "modello red", "icric", "iclav", "accas", "invciv", "dichiarazione reddituale"], ["Modello RED, ICRIC, ICLAV e ACC.AS/PS", "/red-invciv", "servizio", true]),
  ...gruppo(["pagamenti inps", "quando paga inps", "date pagamento inps", "calendario pagamenti"], ["Pagamenti INPS del mese", "/pagamenti-inps", "servizio"]),

  // Invalidità e disabilità
  ...gruppo(
    ["104", "legge 104", "l104", "handicap", "invalidita", "invalidita civile", "accompagnamento", "accompagno", "indennita di accompagnamento", "disabilita", "disabile", "verbale invalidita", "pensione di invalidita", "aggravamento", "invalidi", "invalido"],
    ["Invalidità civile e legge 104", "/invalidita-104", "servizio", true],
    ["Legge 104 comma 1 o comma 3: che differenza c'è", "/blog/legge-104-comma-1-comma-3-differenza-benefici", "guida"],
  ),
  ...gruppo(["comma 3", "104 comma 3", "comma 1", "104 grave", "articolo 3 comma 3"], ["Legge 104 comma 1 o comma 3: che differenza c'è", "/blog/legge-104-comma-1-comma-3-differenza-benefici", "guida"]),
  ...gruppo(
    ["caregiver", "caregiver familiare", "care giver", "assisto un familiare", "assistere un familiare", "familiare disabile"],
    ["Caregiver familiare: permessi e aiuti", "/caregiver", "servizio", true],
    ["Legge sul caregiver familiare", "/blog/legge-caregiver-familiare-ddl-senato-contributo", "guida"],
  ),
  ...gruppo(
    ["cude", "contrassegno", "contrassegno disabili", "pass disabili", "tagliando disabili", "parcheggio disabili", "permesso disabili"],
    ["CUDE: il contrassegno disabili", "/cude", "servizio", true],
    ["Contrassegno CUDE: cosa cambia", "/blog/contrassegno-disabili-cude-novita-10-anni-riforma", "guida"],
  ),
  ...gruppo(["disability card", "carta europea disabilita", "carta disabilita"], ["Disability Card: chi può averla", "/disability-card", "servizio"]),
  ...gruppo(["esenzione ticket", "ticket", "codice esenzione"], ["Esenzione ticket per invalidità e 104", "/blog/esenzione-ticket-invalidita-104-lazio-codici", "guida"]),
  ...gruppo(["trasporto disabili", "trasporto disabili roma"], ["Trasporto disabili a Roma", "/blog/trasporto-disabili-roma-lista-attesa-2027-domanda", "guida"]),

  // Successioni
  ...gruppo(
    ["successione", "successioni", "eredita", "eredi", "erede", "dichiarazione di successione", "morto un familiare", "e morto", "morto", "morta", "deceduto", "decesso", "defunto", "voltura", "volture", "succesione"],
    ["Successione: ce ne occupiamo noi", "/successioni", "servizio", true],
    ["Calcolo imposte di successione", "/calcolo-imposte-successione", "calcolatore"],
  ),
  ...gruppo(["calcolo successione", "calcolo imposte successione", "imposte di successione", "tasse di successione", "imposta di successione", "calcolatore successione"], ["Calcolo imposte di successione", "/calcolo-imposte-successione", "calcolatore"]),

  // Auto e documenti
  ...gruppo(
    ["bollo auto", "bollo", "calcolo bollo", "calcolo bollo auto", "tassa automobilistica", "esenzione bollo", "bollo disabili", "bollo 80 kw", "bollo macchina"],
    ["Calcolo bollo auto Lazio ed esenzioni", "/calcolo-bollo-auto", "calcolatore"],
    ["Esenzione bollo auto per disabili nel Lazio", "/blog/esenzione-bollo-auto-disabili-lazio-requisiti-domanda", "guida"],
  ),
  ...gruppo(
    ["carta d identita", "carta di identita", "carta identita", "cie", "carta d identita elettronica", "documento di identita", "carta identita cartacea"],
    ["Carta d'identità cartacea: cosa cambia", "/blog/carta-identita-cartacea-31-gennaio-2027-cie-open-day-roma", "guida"],
  ),
  ...gruppo(
    ["send", "raccomandata", "avviso send", "notifica digitale", "raccomandata online", "avviso di giacenza", "raccomandata send"],
    ["Raccomandata SEND: la ritiriamo noi", "/raccomandata-send", "servizio", true],
  ),
  ...gruppo(["pec", "posta certificata", "posta elettronica certificata", "cambio residenza", "utenze", "certificati"], ["Servizi vari: PEC, utenze, certificati", "/servizi/servizi-vari", "servizio", true]),

  // Ufficio
  ...gruppo(
    ["orari", "caf aperto", "aperto", "aperti", "orario", "dove siete", "indirizzo", "telefono", "numero di telefono", "sabato", "aperto sabato", "come arrivare", "dove si trova", "chiuso", "contatti", "numero"],
    ["Orari, indirizzo e telefono", "/info", "servizio"],
  ),
  ...gruppo(
    ["prezzi", "prezzo", "quanto costa", "costo", "costi", "tariffe", "tariffa", "quanto si paga", "gratis", "listino", "quanto costano"],
    ["Prezzi dei servizi", "/prezzi", "servizio"],
  ),
  ...gruppo(
    ["prenotare", "prenota", "prenotazione", "appuntamento", "fissare un appuntamento", "prendere appuntamento", "prenotarsi"],
    ["Prenota un appuntamento", "/prenota", "servizio"],
  ),
  ...gruppo(["documenti", "cosa portare", "che documenti servono", "documenti da portare"], ["Documenti da portare per ogni pratica", "/cosa-portare", "servizio"]),
  ...gruppo(["tessera", "tesseramento", "iscrizione", "associarsi"], ["Tessera: 30 euro l'anno per la famiglia", "/tesseramento", "servizio"]),

  // Calcolatori: tenere IN FONDO. A parità di punti vince la voce che viene prima, quindi
  // "calcolo naspi" porta a /calcolo-naspi e "calcolo" da solo (o "quanto mi spetta") a /calcolatori.
  ...gruppo(
    ["calcolatori", "calcolatore", "calcolatori gratuiti", "calcolo", "calcolare", "calcola", "simulatore", "simulazione", "quanto mi spetta", "quanto prendo", "quanto spetta", "stima", "calcolo online", "calcolatore online"],
    ["Calcolatori gratuiti: tutti gli strumenti", "/calcolatori", "calcolatore"],
  ),
];

/** Pagine mostrate quando la ricerca non trova nulla e nessuna parola somiglia a quelle sopra. */
export const SUGGERITE_DEFAULT: VoceRicerca[] = [
  { parole: [], titolo: "ISEE gratis: lo facciamo noi", url: "/isee", tipo: "servizio", prenota: true },
  { parole: [], titolo: "Prezzi dei servizi", url: "/prezzi", tipo: "servizio" },
  { parole: [], titolo: "Prenota un appuntamento", url: "/prenota", tipo: "servizio" },
  { parole: [], titolo: "Orari, indirizzo e telefono", url: "/info", tipo: "servizio" },
];
