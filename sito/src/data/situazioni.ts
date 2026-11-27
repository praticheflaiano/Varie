/**
 * Pagine "per situazione di vita" (27/11/2026): per chi non sa come si chiama la pratica
 * ma sa cosa gli è successo. Le pagine sono in src/pages/situazioni/ e usano
 * src/components/situazioni/SituazionePage.astro.
 *
 * Regole:
 * - Nessun dato nuovo. Ogni passo con un numero o una scadenza riporta la pagina del sito da cui è copiato (campo `fonte`).
 * - Le risposte delle domande frequenti sono prese dalle pagine e dagli articoli indicati nel commento accanto.
 * - Prezzi: solo quelli scritti in /prezzi (ISEE gratis, domanda NASpI gratis, invalidità primo incontro gratis).
 * - `guide` contiene gli slug degli articoli: la pagina controlla in fase di build che ogni slug esista
 *   e prende titolo e descrizione dall'articolo. Se un articolo viene tolto, la build si ferma.
 * - Quando un articolo cambia una scadenza o un importo citato qui, aggiornare anche il passo corrispondente.
 */

export interface Passo {
  t: string;
  d: string;
  fonte?: { label: string; href: string };
}
export interface Pratica {
  t: string;
  d: string;
  href: string;
}
export interface Strumento {
  t: string;
  s: string;
  href: string;
}
export interface Faq {
  question: string;
  answer: string;
}
export interface Situazione {
  slug: string;
  /** Nome breve per card, menu e briciole di pane. */
  nome: string;
  /** Una riga per la card. */
  breve: string;
  /** Title SEO (massimo 60 caratteri). */
  title: string;
  /** Description SEO (massimo 155 caratteri, con "Roma"). */
  description: string;
  h1: string;
  intro: string;
  passiTitolo: string;
  passi: Passo[];
  pratiche: Pratica[];
  strumenti: Strumento[];
  guide: string[];
  faq: Faq[];
  colori: { bg: string; fg: string; sub: string; go: string; bordo?: boolean };
}

export const SITUAZIONI: Situazione[] = [
  {
    slug: "ho-perso-il-lavoro",
    nome: "Ho perso il lavoro",
    breve: "Licenziamento, contratto finito, dimissioni per giusta causa: NASpI, ISEE corrente e aiuti.",
    title: "Ho perso il lavoro: cosa fare e cosa ti spetta a Roma",
    description: "Hai perso il lavoro? NASpI entro 68 giorni, SIISL, ISEE corrente, ADI e SFL: cosa fare passo per passo. Patronato a Roma Vigne Nuove, anche in video.",
    h1: "Ho perso il lavoro: cosa fare e cosa ti spetta",
    intro: "Perdere il lavoro mette ansia, e le scadenze arrivano subito. Qui trovi i passi da fare in ordine, le pratiche che ti servono e le nostre guide. La domanda NASpI con il nostro patronato è gratis.",
    passiTitolo: "Cosa fare, passo per passo",
    passi: [
      {
        t: "Chiedi i documenti al datore di lavoro",
        d: "Lettera di licenziamento o di fine contratto, modello UNILAV, ultime buste paga e Certificazione Unica. Se non te li dà, chiedili per iscritto.",
        fonte: { label: "Hai perso il lavoro? La checklist dei primi 7 giorni", href: "/blog/checklist-primi-7-giorni-perdita-lavoro-roma" },
      },
      {
        t: "Fai la domanda NASpI entro 68 giorni",
        d: "Il termine parte dalla fine del rapporto di lavoro. Dopo i 68 giorni la NASpI non spetta più, anche se ne avevi diritto.",
        fonte: { label: "Domanda NASpI: requisiti e 68 giorni", href: "/naspi/domanda" },
      },
      {
        t: "Entro 15 giorni completa il SIISL",
        d: "Entro 15 giorni dall'inizio della NASpI entri nella piattaforma SIISL, compili il curriculum e firmi il Patto di attivazione digitale.",
        fonte: { label: "SIISL e Patto di attivazione digitale", href: "/siisl" },
      },
      {
        t: "Se il reddito è calato, fai l'ISEE corrente",
        d: "Aggiorna l'ISEE con i redditi più recenti: serve per Assegno Unico e bonus. Da noi l'ISEE, anche corrente, è gratis.",
        fonte: { label: "ISEE corrente: quando conviene", href: "/blog/isee-corrente-quando-conviene-roma" },
      },
      {
        t: "Quando finisce la NASpI, guarda ADI e SFL",
        d: "Dopo la NASpI, a seconda della famiglia e dell'ISEE, puoi chiedere l'Assegno di inclusione o il Supporto formazione e lavoro.",
        fonte: { label: "Finita la NASpI cosa spetta?", href: "/blog/finita-naspi-cosa-spetta-adi-sfl" },
      },
    ],
    pratiche: [
      { t: "Domanda NASpI", d: "La presenta il nostro Patronato ENASC, gratis. Anche a distanza.", href: "/naspi" },
      { t: "SIISL dopo la NASpI", d: "Curriculum e Patto di attivazione digitale: lo facciamo insieme.", href: "/siisl" },
      { t: "ISEE e ISEE corrente", d: "Gratis. Redditi e CU li recuperiamo noi.", href: "/isee" },
      { t: "Dimissioni online", d: "Anche senza SPID. Valutiamo con te giusta causa e NASpI.", href: "/dimissioni-online" },
      { t: "ADI e SFL", d: "Requisiti, domanda INPS e iscrizione SIISL.", href: "/adi-sfl" },
      { t: "TFR non pagato: Fondo di garanzia", d: "Se l'azienda non paga TFR e ultimi stipendi.", href: "/naspi/fondo-garanzia-tfr" },
    ],
    strumenti: [
      { t: "Calcola la tua NASpI", s: "Importo al mese e durata, con le regole 2026", href: "/calcolo-naspi" },
      { t: "Calcola l'anticipo NASpI", s: "Se vuoi aprire un'attività: le due rate del 70% e del 30%", href: "/anticipo-naspi" },
      { t: "Calcola l'Assegno di inclusione", s: "Quanto ti spetta di ADI con le soglie 2026", href: "/calcolo-assegno-inclusione" },
    ],
    guide: [
      "checklist-primi-7-giorni-perdita-lavoro-roma",
      "dimissioni-giusta-causa-naspi",
      "isee-corrente-quando-conviene-roma",
      "finita-naspi-cosa-spetta-adi-sfl",
      "c2-storico-lazio-come-richiederlo-online",
      "naspi-2026-patronato-vs-caf-cosa-fa-cosa",
      "somma-non-imponibile-naspi-cassa-integrazione-2026",
    ],
    faq: [
      // /naspi/domanda
      { question: "Entro quando devo fare la domanda NASpI?", answer: "Entro <strong>68 giorni dalla fine del rapporto di lavoro</strong>, a pena di decadenza. In alcuni casi i 68 giorni partono più tardi: ad esempio dalla fine della maternità, della malattia o dell'infortunio indennizzati, o dalla fine del preavviso pagato." },
      // articolo ISEE corrente
      { question: "Serve l'ISEE per la NASpI?", answer: "No. La NASpI non dipende dall'ISEE e si chiede a parte, entro 68 giorni dalla fine del lavoro. L'ISEE corrente serve invece per Assegno Unico, ADI e bonus." },
      // articolo checklist primi 7 giorni
      { question: "Posso avere la NASpI se mi sono dimesso?", answer: "In linea generale no. Le eccezioni principali sono le <strong>dimissioni per giusta causa</strong> (ad esempio stipendi non pagati) e le dimissioni nel periodo protetto di maternità. Prima di dimetterti, fatti consigliare dal patronato." },
      // articolo checklist primi 7 giorni
      { question: "Dopo la NASpI cosa posso chiedere?", answer: "Dipende dalla tua famiglia e dal tuo ISEE. Le strade principali sono l'<strong>Assegno di inclusione (ADI)</strong> e il <strong>Supporto formazione e lavoro (SFL)</strong>. Se hai figli, aggiorna anche l'Assegno Unico con l'ISEE corrente." },
    ],
    colori: { bg: "#F1EEFF", fg: "#14142B", sub: "#3F3F5A", go: "#4B2FE0" },
  },
  {
    slug: "nascita-figlio",
    nome: "È nato un figlio",
    breve: "Assegno Unico, bonus nuovi nati, bonus nido, maternità e congedi: le domande da fare.",
    title: "È nato un figlio: bonus e domande da fare a Roma",
    description: "Nascita di un figlio: Assegno Unico, bonus nuovi nati entro 120 giorni, bonus nido, maternità e congedi. ISEE gratis. Patronato a Roma Vigne Nuove.",
    h1: "È nato un figlio: cosa fare e cosa ti spetta",
    intro: "Congratulazioni! Con un bambino in arrivo o appena nato ci sono alcune domande da non dimenticare, e qualcuna ha una scadenza. Qui le trovi in ordine, con i calcolatori per maternità e congedi.",
    passiTitolo: "Cosa fare, passo per passo",
    passi: [
      {
        t: "Già in gravidanza puoi chiedere l'Assegno Unico",
        d: "La domanda si può fare già dal settimo mese di gravidanza.",
        fonte: { label: "Bonus figli 2027: gli aiuti per chi ha un bambino", href: "/blog/bonus-figli-2027-aiuti-nascita-cosa-spetta" },
      },
      {
        t: "Fai l'ISEE per i minorenni",
        d: "Serve per l'importo pieno dell'Assegno Unico e per i bonus. Da noi l'ISEE è gratis.",
        fonte: { label: "Bonus nuovi nati: 1.000 euro per ogni figlio", href: "/blog/bonus-nuovi-nati-1000-euro-domanda-120-giorni" },
      },
      {
        t: "Bonus nuovi nati entro 120 giorni",
        d: "La domanda va presentata entro 120 giorni dalla nascita o dall'ingresso in famiglia. Dopo, il bonus si perde.",
        fonte: { label: "Bonus nuovi nati: domanda entro 120 giorni", href: "/blog/bonus-nuovi-nati-1000-euro-domanda-120-giorni" },
      },
      {
        t: "Senza maternità INPS: assegno del Comune entro 6 mesi",
        d: "L'assegno di maternità dei Comuni è per chi non ha la maternità INPS. A Roma si chiede a Roma Capitale, entro 6 mesi dalla nascita.",
        fonte: { label: "Assegno di maternità dei Comuni a Roma", href: "/blog/assegno-maternita-comune-2026-roma" },
      },
      {
        t: "Asilo nido: tieni le ricevute",
        d: "Il bonus nido si chiede all'INPS con le ricevute dei pagamenti dell'asilo.",
        fonte: { label: "Bonus nido: domanda e ricevute", href: "/blog/bonus-asilo-nido-2026-3600-euro-domanda-inps" },
      },
    ],
    pratiche: [
      { t: "Assegno Unico", d: "Domanda, rinnovo e variazioni, con l'ISEE giusto.", href: "/assegno-unico" },
      { t: "ISEE", d: "Gratis. Anche l'ISEE per i minorenni.", href: "/isee" },
      { t: "Bonus nido, nuovi nati e maternità", d: "Le domande INPS per la famiglia, dal patronato.", href: "/bonus-famiglia" },
      { t: "Dimissioni online", d: "Se ti dimetti nel periodo protetto di maternità.", href: "/dimissioni-online" },
    ],
    strumenti: [
      { t: "Calcola l'Assegno Unico", s: "Quanto ti spetta per figlio, con la tabella 2026", href: "/calcolo-assegno-unico" },
      { t: "Calcola maternità e congedi", s: "Le tue date e quanto prendi, all'80% e al 30%", href: "/calcolo-maternita-congedi" },
      { t: "Calcola il congedo parentale", s: "Quanti mesi ti restano e quanto ti pagano", href: "/calcolo-congedo-parentale" },
      { t: "Scopri cosa ti spetta", s: "Il test gratuito su bonus e aiuti a Roma e nel Lazio", href: "/quale-isee?modo=bonus" },
    ],
    guide: [
      "bonus-figli-2027-aiuti-nascita-cosa-spetta",
      "bonus-nuovi-nati-1000-euro-domanda-120-giorni",
      "assegno-maternita-comune-2026-roma",
      "nuovo-bonus-mamme-2026-domanda-inps-31-dicembre",
      "bonus-asilo-nido-2026-3600-euro-domanda-inps",
      "maternita-obbligatoria-5-mesi-gravidanza-a-rischio-lavori-pericolosi",
      "congedo-parentale-guida-mesi-80-per-cento-domanda",
      "assegno-unico-2026-importi-tabella-isee",
    ],
    faq: [
      // articolo bonus figli 2027
      { question: "Da quando si può chiedere l'Assegno Unico?", answer: "Già dal <strong>settimo mese di gravidanza</strong>." },
      // articolo bonus nuovi nati
      { question: "Il bonus nuovi nati ha una scadenza?", answer: "Sì: la domanda va presentata <strong>entro 120 giorni</strong> dalla nascita o dall'ingresso in famiglia. Dopo, il bonus si perde." },
      // articolo bonus nuovi nati
      { question: "Il bonus nuovi nati sostituisce l'Assegno Unico?", answer: "No, si aggiunge. L'Assegno Unico va chiesto o aggiornato a parte." },
      // articolo assegno di maternità dei Comuni
      { question: "Posso chiedere l'assegno di maternità del Comune se non ho mai lavorato?", answer: "Sì. È pensato proprio per chi non ha una maternità INPS: servono residenza, cittadinanza o permesso adatto e ISEE entro la soglia. A Roma si chiede a Roma Capitale, entro 6 mesi dalla nascita." },
    ],
    colori: { bg: "#FFE3EC", fg: "#14142B", sub: "#3F3F5A", go: "#4B2FE0" },
  },
  {
    slug: "pensione",
    nome: "Vado in pensione",
    breve: "Requisiti 2027, stima della pensione, cedolino, reversibilità, assegno sociale e APE sociale.",
    title: "Vado in pensione: cosa fare e cosa ti spetta a Roma",
    description: "Andare in pensione: requisiti 2027, controllo dei contributi, domanda, cedolino, RED e assegno sociale. Patronato ENASC a Roma Vigne Nuove, anche in video.",
    h1: "Vado in pensione: cosa fare e cosa ti spetta",
    intro: "La pensione arriva una volta sola: conviene arrivarci con i contributi controllati e le date chiare. Qui trovi i passi, le pratiche del patronato e le guide su importi, cedolino e aumenti.",
    passiTitolo: "Cosa fare, passo per passo",
    passi: [
      {
        t: "Controlla i contributi",
        d: "Parti dall'estratto conto contributivo INPS: se manca un periodo, va sistemato prima della domanda.",
        fonte: { label: "Pensioni: il servizio del patronato", href: "/pensioni" },
      },
      {
        t: "Verifica i requisiti",
        d: "Nel 2027 la pensione di vecchiaia è a 67 anni e 1 mese. Per l'anticipata servono 42 anni e 11 mesi di contributi per gli uomini e 41 anni e 11 mesi per le donne.",
        fonte: { label: "Requisiti pensione 2027", href: "/blog/requisiti-pensione-2027-vecchiaia-anticipata" },
      },
      {
        t: "Fai la domanda con il patronato",
        d: "Controlliamo i requisiti e presentiamo la domanda all'INPS per te.",
        fonte: { label: "Pensioni: il servizio del patronato", href: "/pensioni" },
      },
      {
        t: "Dopo: cedolino e modello RED",
        d: "Impara a leggere il cedolino. Se prendi una pensione legata al reddito, ogni anno l'INPS può chiederti di confermare i redditi con il modello RED.",
        fonte: { label: "Modello RED, ICRIC, ICLAV e ACC.AS/PS", href: "/blog/red-icric-iclav-accas-ps-2026-guida" },
      },
    ],
    pratiche: [
      { t: "Pensioni", d: "Controllo dei contributi, calcolo e domanda di pensione, reversibilità.", href: "/pensioni" },
      { t: "Stima e calcolo della pensione", d: "Dal tuo estratto conto INPS: date di uscita e importi stimati.", href: "/stima-pensione" },
      { t: "RED e INVCIV", d: "Le dichiarazioni INPS da non saltare.", href: "/red-invciv" },
      { t: "Pagamenti INPS: le date", d: "Quando arriva la pensione, mese per mese.", href: "/pagamenti-inps" },
    ],
    strumenti: [
      { t: "Stima la tua pensione", s: "Prospetto in PDF con date di uscita e importi stimati", href: "/stima-pensione" },
      { t: "Calcola l'assegno di vedovanza", s: "Se prendi la reversibilità: scopri se ti spetta", href: "/assegno-vedovanza" },
    ],
    guide: [
      "requisiti-pensione-2027-vecchiaia-anticipata",
      "cedolino-pensione-novembre-dicembre-2026-come-leggerlo",
      "pensione-minima-2027-quanto-aumenta",
      "rivalutazione-pensioni-2027-aumento-gennaio-fasce",
      "importo-aggiuntivo-154-euro-pensione-dicembre-2026",
      "assegno-sociale-2026-importo-requisiti-domanda",
      "pensione-reversibilita-quanto-spetta-domanda",
      "red-2026-scadenza-28-febbraio-2027-messaggio-inps-3568",
      "ape-sociale-2026-ultima-scadenza-30-novembre",
    ],
    faq: [
      // articolo requisiti pensione 2027
      { question: "Quanti anni di contributi servono per la pensione anticipata nel 2027?", answer: "<strong>42 anni e 11 mesi</strong> per gli uomini e <strong>41 anni e 11 mesi</strong> per le donne, a qualsiasi età." },
      // articolo requisiti pensione 2027
      { question: "Ho raggiunto i requisiti a dicembre 2026: valgono le vecchie regole?", answer: "Sì. Conta la data in cui hai maturato il requisito. Chi lo raggiunge entro il 31 dicembre 2026 usa i requisiti del 2026." },
      // articolo requisiti pensione 2027
      { question: "Posso ancora andare con Quota 103?", answer: "Solo se avevi i requisiti entro il 31 dicembre 2025." },
      // articolo assegno sociale 2026
      { question: "Si può avere l'assegno sociale senza contributi?", answer: "Sì: è una prestazione assistenziale, non serve aver lavorato. Contano età, residenza e reddito." },
    ],
    colori: { bg: "#5B3DF5", fg: "#FFFFFF", sub: "#F1EEFF", go: "#D4FF4F" },
  },
  {
    slug: "lutto-in-famiglia",
    nome: "È morto un familiare",
    breve: "Reversibilità, successione, 730 del defunto, volture. Ti seguiamo passo per passo.",
    title: "È morto un familiare: cosa fare, guida per Roma",
    description: "Dopo la morte di un familiare: reversibilità, dichiarazione di successione entro 12 mesi, 730 del defunto e volture. CAF e patronato a Roma Vigne Nuove.",
    h1: "È morto un familiare: cosa fare",
    intro: "Ci dispiace per la tua perdita. In questi giorni le pratiche sono l'ultima cosa a cui vuoi pensare: qui trovi cosa fare e con quali tempi, senza fretta inutile. Se vuoi, ce ne occupiamo noi.",
    passiTitolo: "Cosa fare, con calma",
    passi: [
      {
        t: "Se prendeva la pensione: chiedi la reversibilità",
        d: "Il coniuge e, in certi casi, i figli possono avere la pensione ai superstiti. L'INPS non indica una scadenza, ma conviene presentarla subito.",
        fonte: { label: "Pensione di reversibilità: a chi spetta", href: "/blog/pensione-reversibilita-quanto-spetta-domanda" },
      },
      {
        t: "Dichiarazione dei redditi del defunto",
        d: "La presenta un solo erede, a nome del defunto. I termini in corso alla data della morte o che scadono entro quattro mesi sono prorogati di sei mesi.",
        fonte: { label: "Dichiarazione dei redditi del defunto", href: "/blog/dichiarazione-redditi-defunto-730-eredi-2026" },
      },
      {
        t: "Dichiarazione di successione entro 12 mesi",
        d: "Va presentata entro 12 mesi dalla data del decesso. Se ci sono solo conti, gli eredi sono coniuge e figli ed è tutto entro 100.000 €, senza case, basta la dichiarazione di esonero per la banca.",
        fonte: { label: "Successioni: il servizio", href: "/successioni" },
      },
      {
        t: "Volture di casa e utenze",
        d: "Le volture catastali delle case sono parte della pratica di successione. Per luce e gas serve la voltura a nome di chi resta in casa.",
        fonte: { label: "Luce e gas: voltura e subentro", href: "/luce-gas" },
      },
    ],
    pratiche: [
      { t: "Dichiarazione di successione", d: "Dichiarazione, volture e documenti per la banca.", href: "/successioni" },
      { t: "Pensione di reversibilità", d: "La domanda all'INPS la presenta il nostro patronato.", href: "/pensioni" },
      { t: "730 del defunto", d: "La dichiarazione dei redditi che l'erede presenta per il defunto.", href: "/730" },
      { t: "Volture luce e gas", d: "Voltura e subentro delle forniture.", href: "/luce-gas" },
      { t: "Colf e badanti", d: "Se c'era una badante: chiusura del rapporto, TFR e comunicazione INPS.", href: "/colf-badanti" },
    ],
    strumenti: [
      { t: "Calcola le imposte di successione", s: "Quanto si paga in base a parentela e immobili", href: "/calcolo-imposte-successione" },
      { t: "Calcola l'assegno di vedovanza", s: "L'aggiunta sulla reversibilità: scopri se ti spetta", href: "/assegno-vedovanza" },
      { t: "Calcola il TFR della badante", s: "Se il rapporto di lavoro domestico si chiude", href: "/calcolo-tfr-colf-badanti" },
    ],
    guide: [
      "dichiarazione-successione-roma-documenti-tempi-costi",
      "successione-solo-conto-corrente-esonero-banca",
      "dichiarazione-redditi-defunto-730-eredi-2026",
      "pensione-reversibilita-quanto-spetta-domanda",
      "badante-morte-assistito-ape-sociale-precoci-messaggio-inps-3694",
      "licenziamento-dimissioni-colf-badante-preavviso-tfr",
    ],
    faq: [
      // /successioni
      { question: "Entro quando va presentata la dichiarazione di successione?", answer: "<strong>Entro 12 mesi dalla data del decesso.</strong> Se il termine è scaduto si può presentare lo stesso, con una sanzione che con il ravvedimento si riduce: prima lo fai, meno paghi." },
      // articolo successione solo conto corrente
      { question: "C'è solo un conto corrente sotto i 100.000 euro: serve la successione?", answer: "No, se gli eredi sono coniuge e figli (o genitori, nonni, nipoti in linea retta) e non ci sono case o terreni. Basta la dichiarazione scritta di esonero alla banca." },
      // articolo dichiarazione redditi del defunto
      { question: "Chi presenta la dichiarazione dei redditi di una persona morta?", answer: "Un solo erede, a nome del defunto, indicando il proprio codice fiscale e quello della persona deceduta. L'eventuale rimborso va agli eredi." },
      // articolo pensione di reversibilità
      { question: "La reversibilità si può chiedere anche dopo anni?", answer: "La scheda INPS non indica una scadenza per la domanda. Conviene però presentarla subito: chiedila con noi e controlliamo anche gli eventuali arretrati." },
    ],
    colori: { bg: "#FFFFFF", fg: "#14142B", sub: "#3F3F5A", go: "#4B2FE0", bordo: true },
  },
  {
    slug: "disabilita-in-famiglia",
    nome: "Disabilità in famiglia",
    breve: "Invalidità civile, legge 104, CUDE, bollo auto, ticket, caregiver: da dove partire.",
    title: "Disabilità in famiglia: invalidità, 104 e aiuti a Roma",
    description: "Invalidità civile e legge 104 a Roma: certificato medico, visita, permessi, CUDE, esenzione bollo e ticket, caregiver. Medico in sede a Vigne Nuove.",
    h1: "Disabilità in famiglia: da dove partire",
    intro: "Quando in famiglia c'è una malattia o una disabilità, i diritti ci sono ma vanno chiesti uno per uno. Si parte dal certificato medico: da noi il medico certificatore è in sede e il primo incontro è gratis.",
    passiTitolo: "Cosa fare, passo per passo",
    passi: [
      {
        t: "Il certificato medico introduttivo",
        d: "A Roma, dal 1° marzo 2026, l'invio del certificato medico introduttivo avvia da solo la pratica di invalidità e 104: non serve più una domanda separata.",
        fonte: { label: "Invalidità civile a Roma: con la riforma basta il certificato", href: "/blog/riforma-disabilita-roma-certificato-introduttivo-cosa-cambia" },
      },
      {
        t: "La visita dell'INPS",
        d: "La visita la fa l'Unità di valutazione di base dell'INPS. Poi arriva il verbale.",
        fonte: { label: "Invalidità civile a Roma: con la riforma basta il certificato", href: "/blog/riforma-disabilita-roma-certificato-introduttivo-cosa-cambia" },
      },
      {
        t: "Con il verbale chiedi i benefici",
        d: "Ogni beneficio ha la sua domanda: l'esenzione ticket alla ASL, l'esenzione del bollo alla Regione Lazio, il contrassegno CUDE, la Disability Card. Nessuno di questi è automatico.",
        fonte: { label: "Esenzione ticket per invalidità e 104 nel Lazio", href: "/blog/esenzione-ticket-invalidita-104-lazio-codici" },
      },
      {
        t: "Permessi al lavoro per chi assiste",
        d: "Con la disabilità grave (104 comma 3) chi lavora ha i permessi: 3 giorni al mese, che più familiari possono dividersi.",
        fonte: { label: "Legge 104 comma 1 o comma 3", href: "/blog/legge-104-comma-1-comma-3-differenza-benefici" },
      },
    ],
    pratiche: [
      { t: "Invalidità civile e 104", d: "Medico certificatore in sede. Primo incontro gratis.", href: "/invalidita-104" },
      { t: "Contrassegno CUDE", d: "Il contrassegno disabili: requisiti e domanda a Roma.", href: "/cude" },
      { t: "Disability Card", d: "La Carta europea della disabilità: la domanda la facciamo noi.", href: "/disability-card" },
      { t: "Caregiver familiare", d: "Permessi, congedo e aiuti per chi assiste un familiare.", href: "/caregiver" },
      { t: "RED e INVCIV", d: "ICRIC, ICLAV e ACC.AS/PS per chi prende prestazioni di invalidità.", href: "/red-invciv" },
    ],
    strumenti: [
      { t: "Calcola il bollo auto", s: "Scopri se sei esente per disabilità nel Lazio", href: "/calcolo-bollo-auto" },
    ],
    guide: [
      "riforma-disabilita-roma-certificato-introduttivo-cosa-cambia",
      "legge-104-comma-1-comma-3-differenza-benefici",
      "contrassegno-disabili-cude-novita-10-anni-riforma",
      "esenzione-bollo-auto-disabili-lazio-requisiti-domanda",
      "esenzione-ticket-invalidita-104-lazio-codici",
      "trasporto-disabili-roma-lista-attesa-2027-domanda",
      "legge-caregiver-familiare-ddl-senato-contributo",
      "bando-inps-assegni-frequenza-contributi-formativi-2026-scuola",
    ],
    faq: [
      // articolo riforma disabilità
      { question: "A Roma serve ancora la domanda di invalidità dopo il certificato?", answer: "No. Dal 1° marzo 2026 l'invio del certificato medico introduttivo avvia da solo la pratica." },
      // articolo 104 comma 1 o 3
      { question: "Con la 104 comma 1 si hanno i permessi al lavoro?", answer: "No. I permessi di 3 giorni al mese e le 2 ore al giorno spettano solo con la disabilità grave del <strong>comma 3</strong>." },
      // articolo esenzione ticket
      { question: "Con la legge 104 comma 3 non pago il ticket?", answer: "No. La 104, anche grave, non dà l'esenzione. Conta la percentuale di invalidità civile (dal 67%), una malattia riconosciuta o il reddito. L'esenzione va chiesta alla ASL di residenza con il verbale." },
      // articolo esenzione bollo auto disabili
      { question: "L'esenzione dal bollo auto è automatica con la legge 104?", answer: "No. Nel Lazio serve sempre una domanda alla Regione sul Portale del Contribuente." },
    ],
    colori: { bg: "#14142B", fg: "#FFFFFF", sub: "#D7D7E6", go: "#D4FF4F" },
  },
  {
    slug: "debiti-e-cartelle",
    nome: "Ho debiti o cartelle",
    breve: "Cartelle, rate, rottamazione, avvisi SEND, indebiti INPS, TARI: mettiamo ordine.",
    title: "Debiti e cartelle: rate e rottamazione a Roma",
    description: "Cartelle esattoriali, rate, rottamazione quinquies, avvisi SEND, indebiti INPS e TARI: cosa fare passo per passo. CAF a Roma Vigne Nuove, anche in video.",
    h1: "Ho debiti o cartelle: cosa fare",
    intro: "Una cartella o una raccomandata fanno paura, ma ignorarle è la scelta peggiore. Il primo passo è capire quanto devi e a chi. Poi si sceglie la strada: rate, rottamazione o un controllo sull'avviso.",
    passiTitolo: "Cosa fare, passo per passo",
    passi: [
      {
        t: "Ritira sempre l'avviso",
        d: "Le comunicazioni inviate con SEND hanno valore legale: se non ritiri l'atto, il debito non sparisce. Da noi stampiamo l'atto SEND e ti spieghiamo cosa fare.",
        fonte: { label: "Raccomandata SEND", href: "/raccomandata-send" },
      },
      {
        t: "Scopri quanto devi",
        d: "Con lo SPID scarichiamo insieme l'estratto di ruolo, con tutte le cartelle a tuo nome.",
        fonte: { label: "Cartelle e rateizzazione", href: "/cartelle-rateizzazione" },
      },
      {
        t: "Chiedi le rate",
        d: "Per le richieste del 2025 e 2026, con debiti fino a 120.000 € si ottengono fino a 84 rate mensili con una dichiarazione di difficoltà. Il piano decade con 8 rate non pagate, anche non di seguito.",
        fonte: { label: "Cartelle e rateizzazione", href: "/cartelle-rateizzazione" },
      },
      {
        t: "Hai la rottamazione? Non saltare due rate",
        d: "Nella rottamazione quinquies si decade con due rate non pagate o pagate in parte.",
        fonte: { label: "Rottamazione quinquies: le rate del 2027", href: "/blog/rottamazione-quinquies-rate-2027-scadenze" },
      },
    ],
    pratiche: [
      { t: "Cartelle e rate", d: "Estratto di ruolo, rateizzazione, piani decaduti.", href: "/cartelle-rateizzazione" },
      { t: "Raccomandate SEND", d: "Ti stampiamo l'atto e ti spieghiamo cosa fare.", href: "/raccomandata-send" },
      { t: "IMU e TARI", d: "Avvisi AMA, esenzione TARI e ravvedimento.", href: "/imu-tari" },
    ],
    strumenti: [],
    guide: [
      "rottamazione-quinquies-2026",
      "rottamazione-quinquies-rate-2027-scadenze",
      "rottamazione-quinquies-terza-rata-30-novembre-2026",
      "definizione-agevolata-roma-capitale-imu-tari-30-novembre-2026",
      "indebiti-inps-send-notifica-digitale-2027-messaggio-3801",
      "tari-roma-esenzione-bonus-sociale-riduzioni",
    ],
    faq: [
      // /cartelle-rateizzazione
      { question: "In quante rate posso pagare una cartella?", answer: "Per le richieste presentate nel 2025 e nel 2026, con debiti fino a 120.000 € si ottengono <strong>fino a 84 rate mensili</strong> con una dichiarazione di temporanea difficoltà. Documentando la difficoltà si può arrivare a 120 rate (D.Lgs. 110/2024)." },
      // articolo rottamazione quinquies rate 2027
      { question: "Ho saltato la rata del 30 novembre 2026: ho perso la rottamazione?", answer: "Non ancora: si decade con <strong>due rate</strong> non pagate o pagate in parte. Ma non hai più margine: chiedi subito come rimetterti in pari prima della scadenza successiva." },
      // articolo indebiti INPS e SEND
      { question: "Se non ritiro l'atto SEND, il debito sparisce?", answer: "No. Le comunicazioni inviate con SEND hanno valore legale. Ritira subito l'atto per conoscere importo e scadenze." },
      // /cartelle-rateizzazione
      { question: "Posso chiedere le rate da solo?", answer: "Sì, online nell'area riservata dell'Agenzia delle Entrate-Riscossione. Se preferisci, controlliamo prima il debito e scegliamo insieme il piano." },
    ],
    colori: { bg: "#D4FF4F", fg: "#14142B", sub: "#14142B", go: "#14142B" },
  },
  {
    slug: "poco-reddito",
    nome: "Ho poco reddito",
    breve: "ISEE, Assegno di inclusione, Carta Acquisti, bonus bollette, TARI: gli aiuti che ci sono.",
    title: "Ho poco reddito: aiuti e bonus a Roma",
    description: "Reddito basso? ISEE gratis, Assegno di inclusione, Carta Acquisti, Carta Dedicata a te, bonus bollette e TARI ridotta. CAF a Roma Vigne Nuove.",
    h1: "Ho poco reddito: che aiuti ci sono",
    intro: "Quando i soldi non bastano, molti aiuti partono da un solo documento: l'ISEE. Da noi è gratis. Qui trovi gli aiuti principali e il test per scoprire quelli giusti per te.",
    passiTitolo: "Cosa fare, passo per passo",
    passi: [
      {
        t: "Fai l'ISEE",
        d: "È la chiave per quasi tutti gli aiuti. Da noi l'ISEE è gratis, anche quello corrente.",
        fonte: { label: "Prezzi", href: "/prezzi" },
      },
      {
        t: "Il bonus bollette arriva da solo",
        d: "Non c'è un modulo: arriva in automatico se presenti la DSU e l'ISEE è entro la soglia. Le bollette devono essere intestate a qualcuno del nucleo.",
        fonte: { label: "Bonus bollette 2027", href: "/blog/bonus-bollette-2027-isee-luce-gas-acqua" },
      },
      {
        t: "Controlla l'Assegno di inclusione",
        d: "L'ADI è per i nuclei con minori, persone con disabilità, over 60 o persone in condizione di svantaggio, con ISEE sotto la soglia.",
        fonte: { label: "Hai perso il lavoro? La checklist dei primi 7 giorni", href: "/blog/checklist-primi-7-giorni-perdita-lavoro-roma" },
      },
      {
        t: "Over 65 o bambini sotto 3 anni: Carta Acquisti",
        d: "Si chiede con il modulo all'ufficio postale, con documento d'identità e ISEE valido.",
        fonte: { label: "Carta Acquisti 2026", href: "/blog/carta-acquisti-2026-80-euro-differenza-carta-dedicata-a-te" },
      },
      {
        t: "A Roma: TARI più leggera",
        d: "Con l'ISEE c'è il bonus sociale rifiuti, il 25% di sconto sulla TARI l'anno dopo la DSU. Con ISEE molto basso conviene guardare anche l'esenzione.",
        fonte: { label: "Bonus bollette 2027", href: "/blog/bonus-bollette-2027-isee-luce-gas-acqua" },
      },
    ],
    pratiche: [
      { t: "ISEE", d: "Gratis, in ufficio o in videochiamata.", href: "/isee" },
      { t: "ADI e SFL", d: "Requisiti, domanda INPS e iscrizione SIISL.", href: "/adi-sfl" },
      { t: "IMU e TARI", d: "Esenzione e riduzioni TARI a Roma.", href: "/imu-tari" },
      { t: "Luce e gas", d: "Controllo della bolletta e bonus sociale.", href: "/luce-gas" },
      { t: "Pensioni e assegno sociale", d: "Per chi è anziano e ha redditi bassi.", href: "/pensioni" },
    ],
    strumenti: [
      { t: "Scopri cosa ti spetta", s: "Il test gratuito su bonus e aiuti a Roma e nel Lazio", href: "/quale-isee?modo=bonus" },
      { t: "Calcola l'Assegno di inclusione", s: "Quanto ti spetta di ADI con le soglie 2026", href: "/calcolo-assegno-inclusione" },
    ],
    guide: [
      "isee-2027-documenti-quando-rinnovare-roma",
      "assegno-di-inclusione-2027-isee-rinnovo",
      "carta-acquisti-2026-80-euro-differenza-carta-dedicata-a-te",
      "carta-dedicata-a-te-2026-2027-scadenza-16-dicembre",
      "bonus-bollette-2027-isee-luce-gas-acqua",
      "tari-roma-esenzione-bonus-sociale-riduzioni",
      "assegno-sociale-2026-importo-requisiti-domanda",
    ],
    faq: [
      // /prezzi
      { question: "Quanto costa fare l'ISEE?", answer: "<strong>Da noi l'ISEE è gratis</strong>, anche l'ISEE corrente. Redditi e CU li recuperiamo noi online." },
      // articolo bonus bollette 2027
      { question: "Il bonus bollette va chiesto?", answer: "No. Arriva in automatico se presenti la DSU e l'ISEE è entro la soglia. Non c'è un modulo da compilare." },
      // articolo Carta Acquisti
      { question: "Ho la Carta Dedicata a te, posso avere anche la Carta Acquisti?", answer: "No: la Carta Dedicata a te non spetta alle famiglie in cui qualcuno prende già la Carta Acquisti, secondo il decreto del 24 giugno 2026." },
      // articolo assegno sociale
      { question: "Si può avere l'assegno sociale senza contributi?", answer: "Sì: è una prestazione assistenziale, non serve aver lavorato. Contano età, residenza e reddito." },
    ],
    colori: { bg: "#F7F7FB", fg: "#14142B", sub: "#3F3F5A", go: "#4B2FE0" },
  },
];

export const getSituazione = (slug: string) => SITUAZIONI.find((s) => s.slug === slug);
