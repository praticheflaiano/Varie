// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";

const SITE_URL =
  process.env.PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://praticheflaiano.it";

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
