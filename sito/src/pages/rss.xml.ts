import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getVisibleArticles, articlePath } from "~/utils/articles";
import { SITE } from "~/consts";
import { getCategory } from "~/utils/categories";

export async function GET(context: APIContext) {
  const articles = await getVisibleArticles();

  return rss({
    title: `${SITE.name} - Blog`,
    description:
      "Guide, scadenze e novita normative dal CAF UNSIC e Patronato ENASC del Centro Pratiche Flaiano a Roma Vigne Nuove. Verificato, sempre con fonti ufficiali.",
    site: context.site ?? SITE.url,
    items: articles.map((a) => {
      const cat = getCategory(a.data.category);
      return {
        title: a.data.title,
        pubDate: a.data.date,
        description: a.data.meta_description,
        link: articlePath(a),
        categories: cat ? [cat.label, ...a.data.tags] : [...a.data.tags],
        author: `${SITE.name} <info@praticheflaiano.it> (${a.data.author})`,
      };
    }),
    customData: `<language>it-IT</language>`,
    stylesheet: "/rss-style.xsl",
  });
}
