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
import { cp, mkdir, rm, stat } from "node:fs/promises";
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

  console.log(`[sync-content] OK: ${sourceDir} -> ${targetDir}`);
}

main().catch((err) => {
  console.error("[sync-content] ERRORE:", err);
  process.exit(1);
});
