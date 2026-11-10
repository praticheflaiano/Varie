/**
 * Single source of truth per dati ufficio Centro Pratiche Flaiano.
 * Importato da JSON-LD, Footer, Contatti, Disclaimer articolo, ecc.
 */

/** Indirizzo pubblico del portale NASpI (vedi nota in EXTERNAL_PORTALS). */
export const NASPI_URL = "https://domandedisoccupazione.it";

export const SITE = {
  name: "Centro Pratiche Flaiano",
  shortName: "Pratiche Flaiano",
  legalName: "Centro Pratiche Flaiano",
  url:
    import.meta.env.PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://praticheflaiano.it",
  locale: "it-IT",
  language: "it",
  claim: "Risparmia tempo, ci pensiamo noi",
  tagline:
    "CAF UNSIC e Patronato ENASC a Roma Nord. Servizi fiscali, previdenziali e amministrativi per famiglie, lavoratori e pensionati.",
  defaultDescription:
    "Centro Pratiche Flaiano: CAF UNSIC e Patronato ENASC a Roma Vigne Nuove. 730, ISEE, IMU, successioni, pensioni, NASpI, invalidità civile, assegno unico. Prenota appuntamento.",
  ogImage: "/og-default.png",
  themeColor: "#5B3DF5",
} as const;

export const CONTACT = {
  address: {
    street: "Via Filoteo Alberini 25, int. 10",
    locality: "Roma",
    postalCode: "00139",
    region: "RM",
    country: "IT",
    countryCode: "IT",
    landmark: "Centro Acquisti Flaiano - quartiere Vigne Nuove",
    municipality: "Municipio III Montesacro",
  },
  phone: {
    landline: "+39 06 9784 5429",
    landlineRaw: "+390697845429",
    mobile: "+39 371 6230 690",
    mobileRaw: "+393716230690",
  },
  email: "praticheflaiano@gmail.com",
  whatsapp: {
    number: "+393716230690",
    link: "https://wa.me/393716230690",
    channel: "https://whatsapp.com/channel/0029VaVaZQKDDmFc54xFmA2d",
  },
  geo: {
    latitude: 41.9599639,
    longitude: 12.539951,
  },
  mapsUrl: "https://maps.app.goo.gl/HBKDcNoEWpPyy9x69",
} as const;

export const HOURS = [
  { day: "Lunedì", open: "09:30", close: "13:00", afternoon: { open: "15:30", close: "18:00" } },
  { day: "Martedì", open: "09:30", close: "13:00", afternoon: { open: "15:30", close: "18:00" } },
  { day: "Mercoledì", open: "09:30", close: "13:00", afternoon: { open: "15:30", close: "18:00" } },
  { day: "Giovedì", open: "09:30", close: "13:00", afternoon: { open: "15:30", close: "18:00" } },
  { day: "Venerdì", open: "09:30", close: "14:00", afternoon: null },
  { day: "Sabato", open: null, close: null, afternoon: null },
  { day: "Domenica", open: null, close: null, afternoon: null },
] as const;

/**
 * Chiusure straordinarie (confermate da Antonio il 10/11/2026). Date in formato AAAA-MM-GG, estremi compresi.
 * Usate da: avviso in cima al sito, stato "aperti ora", pagina contatti, dati strutturati.
 * "avviso" = quanti giorni prima mostrare l'avviso in cima alle pagine.
 */
export const CLOSURES = [
  { from: "2026-12-08", to: "2026-12-08", avviso: 7, testo: "Martedì 8 dicembre siamo chiusi.", breve: "8 dicembre 2026" },
  { from: "2026-12-23", to: "2027-01-10", avviso: 14, testo: "Chiusi per le feste dal 23 dicembre al 10 gennaio. Riapriamo lunedì 11 gennaio.", breve: "dal 23 dicembre 2026 al 10 gennaio 2027 (riapriamo lunedì 11 gennaio)" },
] as const;

/** Schema.org openingHoursSpecification format */
export const HOURS_SCHEMA = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    opens: "09:30",
    closes: "13:00",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    opens: "15:30",
    closes: "18:00",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Friday"],
    opens: "09:30",
    closes: "14:00",
  },
] as const;

/** Valutazione Google verificata il 10/11/2026 (5,0 con 298 recensioni). Aggiornare a mano. */
export const REVIEWS = { rating: "5,0", label: "oltre 290 recensioni" } as const;

export const BOOKING = {
  arcanisGroup: "https://link.arcanis.it/widget/group/bklXY9sZUszt8V2GpkU1",
  /** Calendario GHL "Consulenza da remoto" disattivato (404): finché non viene riattivato si prenota via WhatsApp. */
  arcanisRemote: "https://link.arcanis.it/widget/booking/B5HBTQ8m4c7Ab5Ok0zIH",
} as const;

export const SOCIAL = {
  facebook: "https://www.facebook.com/PRATICHEFLAIANO",
  whatsappChannel: "https://whatsapp.com/channel/0029VaVaZQKDDmFc54xFmA2d",
} as const;

/** Portali esterni del Centro Pratiche Flaiano. Cross-link bidirezionale. */
export const EXTERNAL_PORTALS = {
  naspi: {
    url: NASPI_URL,
    label: "Portale NASpI",
    description:
      "Calcolatore NASpI, anticipo, OCR documenti INPS, 30+ guide su disoccupazione, dimissioni, DIS-COLL.",
  },
} as const;

export const ZONE_SERVITE = [
  { name: "Vigne Nuove", primary: true },
  { name: "Tufello", primary: true },
  { name: "Conca d'Oro", primary: true },
  { name: "Bufalotta", primary: true },
  { name: "Porta di Roma", primary: true },
  { name: "Fidene", primary: false },
  { name: "Castel Giubileo", primary: false },
  { name: "Serpentara", primary: false },
  { name: "Talenti", primary: false },
  { name: "Nuovo Salario", primary: false },
] as const;

export const TESSERAMENTO = {
  annual: { price: 30, label: "Annuale", validity: "12 mesi", recommended: true },
  semester: { price: 20, label: "Semestrale", validity: "6 mesi", recommended: false },
  scope: "Per tutto il nucleo familiare",
  currency: "EUR",
} as const;

/** Le 6 pagine servizio-funnel (collegate a calendari e form GHL). */
export const LANDING = [
  { label: "ISEE", href: "/isee", tag: "0 €" },
  { label: "Modello 730", href: "/730", tag: "da 30 €" },
  { label: "Invalidità e 104", href: "/invalidita-104", tag: "1° incontro gratis" },
  { label: "NASpI", href: "/naspi", tag: "Domanda gratis" },
  { label: "Assegno Unico", href: "/assegno-unico", tag: "da 10 €" },
  { label: "Successioni", href: "/successioni", tag: "" },
  { label: "Pensioni", href: "/pensioni", tag: "" },
  { label: "ADI e SFL", href: "/adi-sfl", tag: "" },
  { label: "Dimissioni online", href: "/dimissioni-online", tag: "" },
  { label: "Colf e badanti", href: "/colf-badanti", tag: "" },
  { label: "Contratti d'affitto", href: "/contratti-affitto", tag: "" },
  { label: "IMU e TARI", href: "/imu-tari", tag: "" },
  { label: "Bonus famiglia", href: "/bonus-famiglia", tag: "" },
  { label: "RED e INVCIV", href: "/red-invciv", tag: "" },
  { label: "Cartelle e rate", href: "/cartelle-rateizzazione", tag: "" },
  { label: "Raccomandate SEND", href: "/raccomandata-send", tag: "" },
  { label: "Luce e gas", href: "/luce-gas", tag: "" },
] as const;

/** Richiesta online (form GHL) e calendario generale GHL sul dominio principale. */
export const GHL = {
  richiesta: "/richiesta",
  prenotazioniFunnel: "https://praticheflaiano.it/prenotazioni918656",
  tesseraFunnel: "/richiesta",
} as const;

export const NAV = [
  { label: "Home", href: "/" },
  {
    label: "Servizi",
    href: "/servizi",
    children: [
      { label: "ISEE", href: "/isee" },
      { label: "Modello 730", href: "/730" },
      { label: "NASpI", href: "/naspi" },
      { label: "Assegno Unico", href: "/assegno-unico" },
      { label: "Invalidità e 104", href: "/invalidita-104" },
      { label: "Successioni", href: "/successioni" },
      { label: "Pensioni", href: "/pensioni" },
      { label: "ADI e SFL", href: "/adi-sfl" },
      { label: "Dimissioni online", href: "/dimissioni-online" },
      { label: "Colf e badanti", href: "/colf-badanti" },
      { label: "Contratti d'affitto", href: "/contratti-affitto" },
      { label: "Tutti i servizi CAF", href: "/servizi/caf" },
      { label: "Tutti i servizi Patronato", href: "/servizi/patronato" },
      { label: "Servizi vari", href: "/servizi/servizi-vari" },
    ],
  },
  { label: "Chi siamo", href: "/chi-siamo" },
  { label: "Tesseramento", href: "/tesseramento" },
  { label: "Blog", href: "/blog" },
  {
    label: "Disoccupazione",
    href: "https://domandedisoccupazione.it",
    external: true,
  },
  { label: "FAQ", href: "/faq" },
  { label: "Contatti", href: "/contatti" },
] as const;

/** Disclaimer obbligatorio sotto ogni articolo (regola ZERO invenzioni). */
export const DISCLAIMER = `Le informazioni contenute in questo articolo hanno valore puramente informativo e divulgativo e non sostituiscono la consulenza personalizzata di un professionista. Norme, importi e scadenze possono variare: verifica sempre le fonti ufficiali (Agenzia delle Entrate, INPS, Gazzetta Ufficiale) o prenota un appuntamento al Centro Pratiche Flaiano. L'articolo riporta la data di "ultimo aggiornamento" indicata in alto: dopo tale data le informazioni potrebbero non essere più valide.`;

export const ORG_CREDENTIALS = {
  caf: {
    network: "UNSIC",
    fullName: "UNSIC - Unione Nazionale Sindacale Italiana Cisal",
    role: "CAF (Centro di Assistenza Fiscale)",
  },
  patronato: {
    network: "ENASC",
    fullName: "ENASC - Ente Nazionale di Assistenza Sociale ai Cittadini",
    role: "Patronato",
  },
  legalReferences: [
    "D.Lgs. 9 luglio 1997, n. 241 - art. 32 e ss. (CAF)",
    "Legge 30 marzo 2001, n. 152 (Patronati)",
  ],
} as const;
