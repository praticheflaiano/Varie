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
    if (out !== txt) await writeFile(full, out);
  }

  console.log(`[sync-content] OK: ${sourceDir} -> ${targetDir}`);
}

main().catch((err) => {
  console.error("[sync-content] ERRORE:", err);
  process.exit(1);
});
