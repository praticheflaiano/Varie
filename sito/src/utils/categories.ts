/**
 * Mapping delle 13 categorie ufficiali -> metadati di presentazione.
 * Allineato con docs/topic-taxonomy.md e con le directory esistenti in content/.
 */

export type CategorySlug =
  | "730-redditi"
  | "iva"
  | "isee-dsu"
  | "bonus-fiscali"
  | "assegno-unico"
  | "naspi-disoccupazione"
  | "pensioni"
  | "invalidita-civile"
  | "successioni-volture"
  | "imu-tributi-locali"
  | "red-invciv-accas"
  | "detrazioni-deduzioni"
  | "lavoro-domestico";

export interface CategoryMeta {
  slug: CategorySlug;
  label: string;
  description: string;
  icon: string;
  color: string;
  area: "caf" | "patronato" | "vari";
}

export const CATEGORIES: Record<CategorySlug, CategoryMeta> = {
  "730-redditi": {
    slug: "730-redditi",
    label: "730 e Redditi",
    description:
      "Dichiarazione dei redditi, modello 730, oneri detraibili e deducibili, scadenze fiscali.",
    icon: "heroicons:document-text",
    color: "#1e5bc6",
    area: "caf",
  },
  iva: {
    slug: "iva",
    label: "IVA",
    description:
      "Dichiarazione IVA, regimi speciali, scadenze e adempimenti per partite IVA.",
    icon: "heroicons:calculator",
    color: "#0e3d8a",
    area: "caf",
  },
  "isee-dsu": {
    slug: "isee-dsu",
    label: "ISEE e DSU",
    description:
      "Indicatore della Situazione Economica Equivalente, DSU, ISEE corrente, ISEE universitario.",
    icon: "heroicons:chart-bar-square",
    color: "#0f766e",
    area: "caf",
  },
  "bonus-fiscali": {
    slug: "bonus-fiscali",
    label: "Bonus fiscali",
    description:
      "Bonus ristrutturazione, ecobonus, bonus mobili, agevolazioni edilizie e detrazioni.",
    icon: "heroicons:gift",
    color: "#d98800",
    area: "caf",
  },
  "assegno-unico": {
    slug: "assegno-unico",
    label: "Assegno Unico",
    description:
      "Assegno Unico Universale per i figli a carico: importi, ISEE, domanda INPS.",
    icon: "heroicons:user-group",
    color: "#16a34a",
    area: "patronato",
  },
  "naspi-disoccupazione": {
    slug: "naspi-disoccupazione",
    label: "NASpI e Disoccupazione",
    description:
      "Indennita di disoccupazione NASpI, requisiti, durata, importi, dimissioni online.",
    icon: "heroicons:briefcase",
    color: "#b91c1c",
    area: "patronato",
  },
  pensioni: {
    slug: "pensioni",
    label: "Pensioni",
    description:
      "Pensione di vecchiaia, anticipata, opzione donna, Quota 103, Ape sociale, ricongiunzioni.",
    icon: "heroicons:identification",
    color: "#7c3aed",
    area: "patronato",
  },
  "invalidita-civile": {
    slug: "invalidita-civile",
    label: "Invalidita civile",
    description:
      "Invalidita civile, Legge 104, indennita di accompagnamento, riconoscimento handicap.",
    icon: "heroicons:heart",
    color: "#db2777",
    area: "patronato",
  },
  "successioni-volture": {
    slug: "successioni-volture",
    label: "Successioni e Volture",
    description:
      "Dichiarazione di successione, voltura catastale, imposta successioni e donazioni.",
    icon: "heroicons:document-duplicate",
    color: "#0e3d8a",
    area: "caf",
  },
  "imu-tributi-locali": {
    slug: "imu-tributi-locali",
    label: "IMU e Tributi Locali",
    description:
      "IMU, TARI, calcolo, esenzioni, ravvedimento operoso, modello F24.",
    icon: "heroicons:home-modern",
    color: "#1e5bc6",
    area: "caf",
  },
  "red-invciv-accas": {
    slug: "red-invciv-accas",
    label: "RED, INVCIV, ACCAS",
    description:
      "Modello RED, INVCIV per invalidi civili, ACCAS/PS pensionati: dichiarazioni reddituali INPS.",
    icon: "heroicons:clipboard-document-list",
    color: "#7c3aed",
    area: "patronato",
  },
  "detrazioni-deduzioni": {
    slug: "detrazioni-deduzioni",
    label: "Detrazioni e Deduzioni",
    description:
      "Spese sanitarie, mutui, istruzione, sport, animali: tutte le detrazioni IRPEF.",
    icon: "heroicons:receipt-percent",
    color: "#d98800",
    area: "caf",
  },
  "lavoro-domestico": {
    slug: "lavoro-domestico",
    label: "Lavoro domestico",
    description:
      "Colf, badanti, baby sitter: contratti, contributi INPS, dimissioni, deduzioni fiscali.",
    icon: "heroicons:home",
    color: "#0f766e",
    area: "patronato",
  },
};

export const CATEGORY_LIST: CategoryMeta[] = Object.values(CATEGORIES);

export function getCategory(slug: string): CategoryMeta | undefined {
  return CATEGORIES[slug as CategorySlug];
}

export function getCategoryLabel(slug: string): string {
  return CATEGORIES[slug as CategorySlug]?.label ?? slug;
}
