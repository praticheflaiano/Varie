#!/usr/bin/env node
/**
 * Mirror dei contenuti markdown da ../content -> .content-mirror
 *
 * Necessario in CI/build: il loader Content Collections puo' leggere
 * da fuori il project root in dev, ma su Vercel monorepo conviene
 * avere i file dentro la cartella di progetto per build deterministica.
 *
 * In dev locale e' opzionale: il loader fallback su ../content.
 *
 * Esclude la cartella _templates (template, non articoli).
 */
const NASPI_URL = "https://domandedisoccupazione.it";
import { cp, mkdir, rm, stat, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const sourceDir = resolve(projectRoot, "..", "content");
const targetDir = resolve(projectRoot, ".content-mirror");

// Box CTA contestuale inserito negli articoli (prima della terza sezione H2).
// Solo prezzi gia pubblicati sul sito.
const INLINE_CTA = {
  "730-redditi": { t: "Il 730 lo facciamo noi", d: "Da 30 €, in ufficio a Vigne Nuove o da casa. Se torni l'anno dopo il prezzo non cambia.", h: "/730", b: "Scopri il 730" },
  "detrazioni-deduzioni": { t: "Non perdere nessuna detrazione", d: "Controlliamo spese e ricevute e le mettiamo nel 730. Da 30 €.", h: "/730", b: "Fai il 730 con noi" },
  "isee-dsu": { t: "L'ISEE da noi è gratis", d: "Redditi e CU li recuperiamo noi. In ufficio o in videochiamata.", h: "/isee", b: "Fai l'ISEE gratis" },
  "bonus-fiscali": { t: "Per quasi ogni bonus serve l'ISEE", d: "Da noi è gratis e ti diciamo a quali aiuti hai diritto.", h: "/isee", b: "Fai l'ISEE gratis" },
  "assegno-unico": { t: "Assegno Unico senza pensieri", d: "Domanda e variazioni da 10 € con la tessera, ISEE gratis.", h: "/assegno-unico", b: "Scopri come funziona" },
  "naspi-disoccupazione": { t: "Hai perso il lavoro?", d: "La domanda NASpI da noi è gratis. Non perdere i giorni.", h: "/naspi", b: "Chiedi la NASpI" },
  "imu-tributi-locali": { t: "IMU e TARI: controlliamo noi", d: "Calcolo, F24, avvisi AMA e richieste di esenzione.", h: "/prenota", b: "Prenota un appuntamento" },
  "red-invciv-accas": { t: "Dichiarazioni INPS: le inviamo noi", d: "RED, ICRIC, ICLAV e ACC.AS/PS senza rischiare la pensione.", h: "/pensioni", b: "Patronato pensioni" },
  "pensioni": { t: "Quando puoi andare in pensione?", d: "Controlliamo il tuo estratto contributivo e ti diciamo le strade possibili.", h: "/pensioni", b: "Patronato pensioni" },
  "invalidita-civile": { t: "Invalidità e 104 in un solo posto", d: "Medico certificatore e patronato nello stesso ufficio. Il primo incontro è gratis.", h: "/invalidita-104", b: "Scopri come funziona" },
  "successioni-volture": { t: "Successione: ti seguiamo noi", d: "Dichiarazione, volture e pratiche con banche e catasto.", h: "/successioni", b: "Scopri il servizio" },
  "lavoro-domestico": { t: "Colf e badanti in regola", d: "Assunzione, contributi e chiusura del rapporto all'INPS.", h: "/colf-badanti", b: "Scopri il servizio" },
  "iva": { t: "Partita IVA e dichiarazioni", d: "Ti diciamo cosa ti serve e quanto costa prima di iniziare.", h: "/prenota", b: "Prenota un appuntamento" },
};
const ctaHtml = (c) =>
  `<aside class="cta-inline"><p class="cta-inline__t">${c.t}</p><p class="cta-inline__d">${c.d}</p><p class="cta-inline__a"><a href="${c.h}">${c.b} →</a> <a href="https://wa.me/393716230690" class="cta-inline__alt" rel="noopener">Scrivici su WhatsApp</a></p></aside>`;

async function main() {
  if (!existsSync(sourceDir)) {
    console.warn(`[sync-content] Sorgente non trovata: ${sourceDir}`);
    console.warn("[sync-content] Skip mirror.");
    return;
  }

  const sourceStat = await stat(sourceDir);
  if (!sourceStat.isDirectory()) {
    throw new Error(`[sync-content] ${sourceDir} non e' una directory`);
  }

  if (existsSync(targetDir)) {
    await rm(targetDir, { recursive: true, force: true });
  }
  await mkdir(targetDir, { recursive: true });

  await cp(sourceDir, targetDir, {
    recursive: true,
    filter: (src) => {
      // Escludi template e file di sistema
      if (src.includes("/_templates")) return false;
      if (src.includes("/.git/")) return false;
      if (src.endsWith(".DS_Store")) return false;
      return true;
    },
  });

  // Rimuove i commenti HTML (report SEO/fact-check interni) e corregge
  // i link interni scritti come percorsi ai file .md del repo.
  const slugs = {};
  const files = [];
  for (const e of await readdir(targetDir, { recursive: true })) {
    if (!e.endsWith(".md")) continue;
    const full = resolve(targetDir, e);
    const txt = await readFile(full, "utf8");
    const m = txt.match(/^slug:\s*"?([^"\n]+)"?/m);
    if (m) slugs[e.split("/").pop()] = m[1].trim();
    files.push([full, txt]);
  }
  for (const [full, txt] of files) {
    let out = txt.replace(/<!--[\s\S]*?-->/g, "");
    // link assoluti al vecchio blog -> percorsi interni del sito
    out = out.replace(/https:\/\/(?:www\.)?praticheflaiano\.it\/blog\//g, "/blog/");
    // voci di elenco che puntano ad articoli non ancora pubblicati
    out = out.replace(/^[ \t]*[-*][^\n]*\[DA PUBBLICARE[^\n]*\n/gim, "");
    // portale NASpI: indirizzo funzionante finche il DNS del dominio non punta a Vercel
    out = out.replace(/https:\/\/(?:www\.)?domandedisoccupazione\.it/g, NASPI_URL);
    // email unica del centro (quella pubblicata sul sito)
    out = out.replace(/info@praticheflaiano\.it/g, "praticheflaiano@gmail.com");
    out = out.replace(/\]\(\/content\/[^)]*?\/([^/)]+\.md)\)/g, (all, file) =>
      slugs[file] ? `](/blog/${slugs[file]})` : all,
    );
    // un solo H1 per pagina: il titolo lo stampa il layout, quindi si toglie il "# Titolo" iniziale
    out = out.replace(/^(---\n[\s\S]*?\n---\n\s*)# [^\n]*\n/, "$1");
    // box di invito all'azione dopo la seconda sezione, in base alla categoria
    const cat = (out.match(/^category:\s*"?([^"\n]+)"?/m) || [])[1];
    const cta = INLINE_CTA[cat];
    if (cta) {
      let n = 0;
      out = out.replace(/^## [^\n]*$/gm, (h) => {
        n += 1;
        return n === 3 ? `${ctaHtml(cta)}\n\n${h}` : h;
      });
    }
    if (out !== txt) await writeFile(full, out);
  }

  console.log(`[sync-content] OK: ${sourceDir} -> ${targetDir}`);
}

main().catch((err) => {
  console.error("[sync-content] ERRORE:", err);
  process.exit(1);
});
