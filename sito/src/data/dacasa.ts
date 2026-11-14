/**
 * Dati del blocco "Fallo da casa" (componente ui/DaCasa.astro), 14/11/2026.
 * Decisioni di Antonio (14/11/2026): si paga DOPO il nostro controllo dei documenti e prima dell'invio
 * (link per pagare con carta); 730 online "a partire da 35 €"; successione 600 € con acconto 150 €.
 * Prezzi: SOLO quelli scritti qui. Il blocco, i dati strutturati (JsonLdService) e le FAQ delle pagine
 * leggono da questo file, cosi non possono andare fuori sincrono.
 * Se "moduloUrl" manca, il pulsante "Inizia ora" apre WhatsApp con il testo "Vorrei fare da casa: <servizio>".
 * Non promettere videochiamata prenotabile online ne firma a distanza.
 */
import { CONTACT } from "~/consts";

export type DaCasaSlug = "isee" | "assegno-unico" | "730" | "dimissioni" | "successioni";

export interface DaCasaPasso { t: string; d: string }
export interface DaCasaFonte { label: string; href: string }

export interface DaCasaDati {
  slug: DaCasaSlug;
  /** id della sezione in /cosa-portare (link "Lista completa") */
  cosaPortareId: string;
  titolo: string;
  /** Nome del servizio nel messaggio WhatsApp: "Vorrei fare da casa: <waNome>" */
  waNome: string;
  /** Badge stagionale (es. "Dal 1° gennaio 2027") */
  badge?: string;
  lead: string;
  prezzo: {
    /** Cifra grande */
    value: string;
    /** Piccola scritta sopra la cifra (es. "a partire da") */
    prefisso?: string;
    /** Riga sotto la cifra (es. "15 € con la tessera") */
    sotto?: string;
    /** Altre righe di prezzo gia pubblicate */
    righe?: string[];
    nota?: string;
  };
  include: string[];
  documenti: string[];
  passi: DaCasaPasso[];
  /** Modulo GHL o ancora della pagina (passo 1). Se manca: WhatsApp precompilato. */
  moduloUrl?: string;
  moduloLabel?: string;
  /** Modulo GHL "Carica i documenti" (passo 2) */
  documentiUrl?: string;
  /** Titolo del riquadro sotto i passi: "Prima di pagare" (default) o "Prima di iniziare" */
  primaTitolo?: string;
  /** Frasi del riquadro; se manca si usano le 4 frasi standard */
  prima?: string[];
  /** Avvertenze del servizio, in italiano semplice */
  limiti?: string[];
  fonti: DaCasaFonte[];
  /** Offerte per JsonLdService (solo online) */
  offerte: { name: string; price: number }[];
}

export const WA_DA_CASA = (nome: string) =>
  `${CONTACT.whatsapp.link}?text=${encodeURIComponent("Vorrei fare da casa: " + nome)}`;

/** Le 4 frasi standard del riquadro "Prima di pagare". */
export const PRIMA_STANDARD = [
  "Paghi solo dopo il nostro controllo dei documenti: ti mandiamo il link per pagare con carta.",
  "Dopo il pagamento ricevi la ricevuta.",
  "Se mancano documenti ti scriviamo prima, su WhatsApp, e non ti chiediamo il pagamento.",
  "L'importo della prestazione (assegno, rimborso) lo decide l'ente, INPS o Agenzia delle Entrate: non lo promettiamo.",
];

const FIRMA = "La firma la fai tu, in ufficio in pochi minuti o come ti indichiamo.";

const P_MODULO: DaCasaPasso = { t: "Compili il modulo", d: "Due o tre minuti: i tuoi dati, cosa ti serve e il consenso alla privacy." };
const P_DOC: DaCasaPasso = { t: "Mandi i documenti dal telefono", d: "Foto o PDF, anche in più volte. Se manca qualcosa ti scriviamo su WhatsApp." };
const P_CONTROLLO: DaCasaPasso = { t: "Controlliamo e ti confermiamo il prezzo", d: "Un operatore guarda i documenti e ti dice se la pratica si può fare e quanto costa." };
const P_PAGA: DaCasaPasso = { t: "Ti mandiamo il link per pagare con carta", d: "Solo dopo il controllo e prima dell'invio. Se qualcosa non va, non hai pagato niente." };
const P_FIRMA = (dettaglio: string): DaCasaPasso => ({ t: "Firma e invio", d: `${dettaglio} Poi inviamo noi e ti mandiamo la ricevuta su WhatsApp.` });

export const DACASA: Record<DaCasaSlug, DaCasaDati> = {
  isee: {
    slug: "isee",
    cosaPortareId: "isee",
    titolo: "ISEE 2027 da casa",
    waNome: "ISEE 2027",
    badge: "Dal 1° gennaio 2027",
    lead: "Modulo e documenti dal telefono, senza code. Redditi e CU li recuperiamo noi. Puoi scriverci già adesso: ti diciamo cosa preparare e partiamo dal 1° gennaio 2027.",
    prezzo: { value: "Gratis", nota: "Nessun pagamento online. Se la DSU va rifatta perché mancavano dati importanti, valgono le regole scritte nelle domande frequenti." },
    include: [
      "Controllo dei documenti prima di iniziare",
      "Recupero di redditi e CU da parte nostra",
      "Compilazione della DSU e invio all'INPS",
      "Avviso su WhatsApp quando l'ISEE è pronto",
    ],
    documenti: [
      "Documento d'identità tuo e codici fiscali di tutta la famiglia",
      "Saldo al 31/12 e giacenza media di ogni conto, libretto e carta",
      "Contratto d'affitto registrato, se sei in affitto",
      "Buoni postali, titoli, fondi e polizze vita",
      "Dati di case e terreni e mutuo residuo al 31/12",
      "Targhe di auto e moto da 500 cc in su",
    ],
    passi: [
      P_MODULO,
      P_DOC,
      { t: "Controlliamo i documenti", d: "Un operatore guarda tutto e ti scrive se manca qualcosa." },
      { t: "Non paghi niente", d: "L'ISEE da noi è gratis: non c'è nessun link di pagamento." },
      { t: "Firma e invio", d: "La DSU la firma il dichiarante, cioè tu: la firmi in ufficio in pochi minuti. Poi la inviamo all'INPS e ti scriviamo su WhatsApp." },
    ],
    primaTitolo: "Prima di iniziare",
    prima: [
      "Non paghi niente: la prima DSU dell'anno è gratis.",
      "Se mancano documenti ti scriviamo prima di inviare.",
      "La DSU la firma il dichiarante, cioè tu: la firmi in ufficio in pochi minuti.",
      "I valori dell'ISEE li calcola l'INPS dai dati della DSU: noi non promettiamo importi.",
    ],
    limiti: ["Se i genitori non vivono insieme o lo studente vive fuori casa, dillo subito: possono servire dati di altri familiari."],
    fonti: [
      { label: "INPS - Portale unico ISEE", href: "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.Portale-unico-ISEE.html" },
    ],
    offerte: [],
  },

  "assegno-unico": {
    slug: "assegno-unico",
    cosaPortareId: "assegno-unico",
    titolo: "Assegno Unico da casa",
    waNome: "Assegno Unico",
    lead: "Domanda, rinnovo o variazione dal telefono. L'ISEE che serve è gratis e lo facciamo nello stesso pacchetto.",
    prezzo: { value: "19 €", sotto: "15 € con la tessera", nota: "Il pacchetto con l'ISEE costa solo la domanda: l'ISEE è gratis. Paghi dopo il controllo dei documenti." },
    include: [
      "Pacchetto ISEE + Assegno Unico: l'ISEE è gratis",
      "Controllo dei documenti prima dell'invio",
      "Domanda, rinnovo o variazione inviata all'INPS",
      "Ricevuta su WhatsApp",
    ],
    documenti: [
      "Documenti e codici fiscali di genitori e figli",
      "IBAN su cui ricevere l'assegno",
      "I documenti per l'ISEE (lista nella pagina ISEE)",
      "Eventuale certificato di disabilità del figlio",
      "Permesso di soggiorno, se non sei cittadino italiano o dell'Unione europea",
    ],
    passi: [P_MODULO, P_DOC, P_CONTROLLO, P_PAGA, P_FIRMA(FIRMA)],
    limiti: ["Quanto ti spetta lo decide l'INPS in base all'ISEE, ai figli e alla loro età: noi non promettiamo importi."],
    fonti: [
      { label: "INPS - Assegno Unico e Universale", href: "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.assegno-unico-e-universale-per-i-figli-a-carico-55984.assegno-unico-e-universale-per-i-figli-a-carico.html" },
    ],
    offerte: [
      { name: "Domanda online", price: 19 },
      { name: "Domanda online per tesserati", price: 15 },
    ],
  },

  "730": {
    slug: "730",
    cosaPortareId: "730",
    titolo: "730 da casa",
    waNome: "730",
    lead: "Mandi le spese dal telefono, noi scarichiamo CU e precompilato e controlliamo ogni detrazione. In ufficio il 730 resta da 30 €.",
    prezzo: {
      prefisso: "a partire da",
      value: "35 €",
      nota: "Il prezzo preciso dipende dalla tua situazione e te lo confermiamo dopo il controllo dei documenti, prima di pagare. In ufficio resta da 30 €.",
    },
    include: [
      "Controllo di ricevute, spese e familiari a carico",
      "CU e precompilato scaricati da noi",
      "Compilazione e invio del 730 all'Agenzia delle Entrate",
      "Ricevuta su WhatsApp",
    ],
    documenti: [
      "Documento e codice fiscale tuo, del coniuge e dei familiari a carico",
      "Tessera sanitaria",
      "Ricevute e scontrini: spese mediche, farmacia, scuola, università, sport dei figli",
      "Interessi del mutuo, assicurazioni, bonifici e fatture per lavori in casa",
      "Contratto d'affitto, se sei in affitto",
      "IBAN per il rimborso",
    ],
    passi: [
      P_MODULO,
      P_DOC,
      { t: "Li controlliamo e ti confermiamo il prezzo", d: "Un operatore guarda i documenti e ti dice il prezzo preciso, a partire da 35 €." },
      P_PAGA,
      P_FIRMA("La delega per accedere alla tua dichiarazione e il modello 730-1 li firmi tu, in ufficio in pochi minuti o come ti indichiamo."),
    ],
    limiti: [
      "La delega e il modello 730-1 (scelta di 8, 5 e 2 per mille) vanno firmati da te: noi non possiamo firmare al posto tuo.",
      "Le date del 730/2027 non sono ancora ufficiali: aggiorniamo la pagina appena l'Agenzia delle Entrate le pubblica.",
    ],
    fonti: [
      { label: "Agenzia delle Entrate - Quando e come presentare il 730", href: "https://www.agenziaentrate.gov.it/portale/quando-e-come-presentare-il-730-2026" },
    ],
    offerte: [{ name: "Modello 730 online (a partire da)", price: 35 }],
  },

  dimissioni: {
    slug: "dimissioni",
    cosaPortareId: "dimissioni",
    titolo: "Dimissioni online da casa",
    waNome: "dimissioni online",
    lead: "Compili il mandato in 10 minuti, anche senza SPID e da tutta Italia. Il modulo qui sotto è lo stesso di sempre e comprende già il pagamento con carta.",
    prezzo: {
      value: "25 €",
      sotto: "20 € con la tessera",
      righe: ["Revoca entro 7 giorni: 5 €"],
      nota: "Prezzo online o senza SPID. Con il tuo SPID in ufficio: 15 € con la tessera, 20 € senza.",
    },
    include: [
      "Verifica dei dati e calcolo della data di decorrenza",
      "Invio delle dimissioni al Ministero del Lavoro",
      "Ricevuta via email",
      "Assistenza su WhatsApp",
    ],
    documenti: [
      "Documento d'identità e codice fiscale",
      "Nome e codice fiscale o partita IVA dell'azienda (in busta paga)",
      "Data di inizio del rapporto e data di decorrenza delle dimissioni",
      "PEC o email dell'azienda, se ce l'hai",
      "Ultima busta paga e contratto, per calcolare il preavviso",
    ],
    passi: [
      { t: "Compili il mandato", d: "Online in 10 minuti: i tuoi dati, quelli dell'azienda, le date e il documento." },
      { t: "Paghi con carta nel modulo", d: "Il pagamento è nello stesso modulo del mandato. Ricevi la ricevuta del pagamento." },
      { t: "Controlliamo", d: "Verifichiamo i dati, il tipo di dimissioni e la decorrenza con il preavviso giusto." },
      { t: "Se qualcosa non torna ti chiamiamo", d: "Ti avvisiamo prima di inviare." },
      { t: "Inviamo e ti mandiamo la ricevuta", d: "Trasmettiamo al Ministero del Lavoro e ti mandiamo la ricevuta via email." },
    ],
    moduloUrl: "#mandato",
    moduloLabel: "Compila il mandato",
    primaTitolo: "Prima di pagare",
    prima: [
      "Il pagamento con carta è nel modulo del mandato: ricevi la ricevuta.",
      "Se qualcosa non torna ti chiamiamo prima di inviare.",
      "Dimissioni e revoca si fanno solo online (D.Lgs. 151/2015): se ci ripensi hai 7 giorni per revocare, a 5 €.",
    ],
    limiti: [
      "Lavoro domestico, periodo di prova e pubblico impiego seguono altre procedure. In gravidanza o con un figlio sotto i 3 anni le dimissioni vanno convalidate all'Ispettorato del lavoro: in questi casi ti diciamo noi come procedere, senza costi.",
    ],
    fonti: [
      { label: "Ministero del Lavoro - Dimissioni volontarie", href: "https://www.lavoro.gov.it/strumenti-e-servizi/Dimissioni-volontarie/Pagine/default" },
    ],
    offerte: [
      { name: "Dimissioni online o senza SPID, tesserati", price: 20 },
      { name: "Dimissioni online o senza SPID, non tesserati", price: 25 },
    ],
  },

  successioni: {
    slug: "successioni",
    cosaPortareId: "successioni",
    titolo: "Successione da casa",
    waNome: "successione",
    lead: "Rispondi alla pre-valutazione, carica i documenti dal telefono e noi pensiamo a dichiarazione, volture e carte per la banca.",
    prezzo: {
      value: "600 €",
      sotto: "tutto compreso",
      righe: ["Acconto di 150 € alla consegna dei documenti", "Saldo alla consegna della pratica"],
      nota: "Imposte e bolli dello Stato sono a parte e te li mostriamo prima della firma. Solo per casi particolari, con molte proprietà, facciamo un preventivo scritto.",
    },
    include: [
      "Dichiarazione di successione",
      "Volture catastali delle case",
      "Documenti per lo svincolo in banca",
      "Un solo referente per tutta la pratica",
    ],
    documenti: [
      "Certificato di morte o data e luogo del decesso",
      "Documenti e codici fiscali degli eredi",
      "Testamento, se c'è",
      "Indirizzi di case e terreni (le visure le facciamo noi)",
      "Banche e Poste dove il defunto aveva conti o libretti",
    ],
    passi: [
      { t: "Compili la pre-valutazione", d: "Poche domande: ti diciamo se la dichiarazione serve, entro quando e quali documenti preparare." },
      { t: "Carichi i documenti dal telefono", d: "Foto o PDF nel modulo \"Carica i documenti\", oppure su WhatsApp." },
      { t: "Controlliamo e ti confermiamo il prezzo", d: "È 600 € tutto compreso; il preventivo scritto serve solo nei casi particolari con molte proprietà." },
      { t: "Ti mandiamo il link per l'acconto", d: "L'acconto di 150 € si paga con carta, solo dopo il controllo dei documenti." },
      P_FIRMA("Prima della firma ti mostriamo quote e imposte voce per voce. " + FIRMA),
    ],
    moduloUrl: "#verifica",
    moduloLabel: "Compila la pre-valutazione",
    documentiUrl: "https://link.arcanis.it/widget/form/3xkSAVCqTF0Rdqh652QV",
    primaTitolo: "Prima di pagare",
    prima: [
      "Paghi solo dopo il nostro controllo dei documenti, con un link per pagare con carta. Ricevi la ricevuta.",
      "Se mancano documenti ti scriviamo prima, su WhatsApp, e non ti chiediamo l'acconto.",
      "Se la pratica non si può fare, l'acconto ti viene restituito meno 49 € di spese di gestione.",
      "Imposte e bolli dello Stato sono a parte e te li diciamo prima della firma.",
    ],
    limiti: ["La dichiarazione va presentata entro 12 mesi dal decesso: se sei già in ritardo scrivici subito."],
    fonti: [
      { label: "Agenzia delle Entrate - Dichiarazione di successione", href: "https://www.agenziaentrate.gov.it/portale/schede/dichiarazioni/dichiarazione-di-successione/cosa-dichiarazioni-successione" },
    ],
    offerte: [],
  },
};
