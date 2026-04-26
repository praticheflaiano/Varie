import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Content Layer: gli articoli vivono in ../content/ (workflow editoriale invariato).
 * In CI/build deterministica, scripts/sync-content.mjs crea .content-mirror/.
 * Se il mirror esiste, ha priorita; altrimenti loader fallback su ../content.
 */
const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const mirrorPath = resolve(projectRoot, "..", ".content-mirror");
const sourcePath = resolve(projectRoot, "..", "..", "content");

const articlesBase = existsSync(mirrorPath) ? mirrorPath : sourcePath;

const CATEGORY_ENUM = z.enum([
  "730-redditi",
  "iva",
  "isee-dsu",
  "bonus-fiscali",
  "assegno-unico",
  "naspi-disoccupazione",
  "pensioni",
  "invalidita-civile",
  "successioni-volture",
  "imu-tributi-locali",
  "red-invciv-accas",
  "detrazioni-deduzioni",
  "lavoro-domestico",
]);

const STATUS_ENUM = z.enum([
  "draft",
  "review",
  "fact-checked",
  "seo-optimized",
  "ready",
  "published",
]);

const TYPE_ENUM = z.enum(["informativo", "scadenza", "guida", "novita"]);

const articles = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: articlesBase,
    // Esclude template e file di stato/system
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ""),
  }),
  schema: z.object({
    title: z.string().min(1).max(120),
    slug: z.string().regex(/^[a-z0-9-]+$/, "Slug deve essere kebab-case"),
    date: z.coerce.date(),
    last_updated: z.coerce.date().optional(),
    category: CATEGORY_ENUM,
    tags: z.array(z.string()).min(1).max(8),
    meta_description: z.string().min(50).max(180),
    author: z.string().default("Redazione Centro Pratiche Flaiano"),
    sources: z.array(z.string()).optional().default([]),
    status: STATUS_ENUM.default("draft"),
    type: TYPE_ENUM.default("informativo"),
    deadline: z.coerce.date().optional(),
    image: z.string().optional(),
    image_alt: z.string().optional(),
  }),
});

export const collections = { articles };
