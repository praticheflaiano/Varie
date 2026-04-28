/**
 * Single source of truth per dati ufficio Centro Pratiche Flaiano.
 * Importato da JSON-LD, Footer, Contatti, Disclaimer articolo, ecc.
 */

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
    "Centro Pratiche Flaiano: CAF UNSIC e Patronato ENASC a Roma Vigne Nuove. 730, ISEE, IMU, successioni, pensioni, NASpI, invalidita civile, assegno unico. Prenota appuntamento.",
  ogImage: "/og-default.png",
  themeColor: "#0B3D91",
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
  email: "info@praticheflaiano.it",
  whatsapp: {
    number: "+393716230690",
    link: "https://wa.me/393716230690",
    channel: "https://whatsapp.com/channel/0029VaVaZQKDDmFc54xFmA2d",
  },
  geo: {
    latitude: 41.9519,
    longitude: 12.5347,
  },
  mapsUrl: "https://maps.app.goo.gl/HBKDcNoEWpPyy9x69",
} as const;

export const HOURS = [
  { day: "Lunedi", open: "09:30", close: "13:00", afternoon: { open: "15:30", close: "18:00" } },
  { day: "Martedi", open: "09:30", close: "13:00", afternoon: { open: "15:30", close: "18:00" } },
  { day: "Mercoledi", open: "09:30", close: "13:00", afternoon: { open: "15:30", close: "18:00" } },
  { day: "Giovedi", open: "09:30", close: "13:00", afternoon: { open: "15:30", close: "18:00" } },
  { day: "Venerdi", open: "09:30", close: "14:00", afternoon: null },
  { day: "Sabato", open: null, close: null, afternoon: null },
  { day: "Domenica", open: null, close: null, afternoon: null },
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

export const BOOKING = {
  arcanisGroup: "https://link.arcanis.it/widget/group/bklXY9sZUszt8V2GpkU1",
  arcanisRemote: "https://link.arcanis.it/widget/bookings/consulenza_da_remoto",
} as const;

export const SOCIAL = {
  facebook: "https://www.facebook.com/PRATICHEFLAIANO",
  whatsappChannel: "https://whatsapp.com/channel/0029VaVaZQKDDmFc54xFmA2d",
} as const;

/** Portali esterni del Centro Pratiche Flaiano. Cross-link bidirezionale. */
export const EXTERNAL_PORTALS = {
  naspi: {
    url: "https://domandedisoccupazione.it",
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

export const NAV = [
  { label: "Home", href: "/" },
  { label: "Chi siamo", href: "/chi-siamo" },
  {
    label: "Servizi",
    href: "/servizi",
    children: [
      { label: "CAF (730, ISEE, IMU, Successioni)", href: "/servizi/caf" },
      { label: "Patronato (Pensioni, NASpI, AUU)", href: "/servizi/patronato" },
      { label: "Servizi vari (PEC, utenze, certificati)", href: "/servizi/servizi-vari" },
    ],
  },
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
export const DISCLAIMER = `Le informazioni contenute in questo articolo hanno valore puramente informativo e divulgativo e non sostituiscono la consulenza personalizzata di un professionista. Norme, importi e scadenze possono variare: verifica sempre le fonti ufficiali (Agenzia delle Entrate, INPS, Gazzetta Ufficiale) o prenota un appuntamento al Centro Pratiche Flaiano. L'articolo riporta la data di "ultimo aggiornamento" indicata in alto: dopo tale data le informazioni potrebbero non essere piu valide.`;

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
