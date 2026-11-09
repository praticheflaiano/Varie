// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";

import fs from "node:fs";
import path from "node:path";

// Calcola tag e categorie "sottili" (pagine noindex) da escludere dalla sitemap.
function thinTaxonomy() {
  const root = path.resolve("../content");
  const tagCount = new Map(), catCount = new Map();
  const norm = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const walk = (d) => { if (!fs.existsSync(d)) return; for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { if (!f.startsWith("_")) walk(p); continue; }
    if (!f.endsWith(".md")) continue;
    const fm = (fs.readFileSync(p, "utf8").match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
    if (!/^status:\s*"?(published|ready)"?/m.test(fm)) continue;
    const cat = (fm.match(/^category:\s*"?([^"\n]+)"?/m) || [])[1];
    if (cat) catCount.set(cat, (catCount.get(cat) || 0) + 1);
    const tags = (fm.match(/^tags:\s*\[(.*)\]/m) || [])[1] || "";
    for (const t of tags.split(",").map((x) => x.replace(/["']/g, "").trim()).filter(Boolean)) tagCount.set(norm(t), (tagCount.get(norm(t)) || 0) + 1);
  } };
  walk(root);
  return {
    tags: new Set([...tagCount].filter(([, n]) => n < 3).map(([t]) => t)),
    cats: catCount,
  };
}
const THIN = thinTaxonomy();

const SITE_URL =
  process.env.PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://info.praticheflaiano.it";

export default defineConfig({
  site: SITE_URL,
  output: "static",
  trailingSlash: "ignore",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "viewport",
  },
  integrations: [
    mdx(),
    svelte(),
    icon({
      include: {
        heroicons: ["*"],
        lucide: ["*"],
      },
    }),
    sitemap({
      filter: (page) => {
        const p = new URL(page).pathname.replace(/\/$/, "");
        if (p === "/grazie" || p === "/404") return false;
        const t = p.match(/^\/blog\/tag\/([^/]+)$/);
        if (t && THIN.tags.has(t[1])) return false;
        const c = p.match(/^\/blog\/categoria\/([^/]+)$/);
        if (c && !THIN.cats.get(c[1])) return false;
        return true;
      },
      // stessi URL dei canonical (senza "/" finale, come serve Vercel con trailingSlash false)
      serialize: (item) => ({ ...item, url: item.url.replace(/(\.it\/.+?)\/$/, "$1") }),
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
      i18n: {
        defaultLocale: "it",
        locales: { it: "it-IT" },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    responsiveStyles: true,
  },
});
