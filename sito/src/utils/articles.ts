import { getCollection, type CollectionEntry } from "astro:content";

export type Article = CollectionEntry<"articles">;

const PUBLIC_STATUS = new Set(["ready", "published"]);

/**
 * Restituisce gli articoli visibili in produzione.
 * In dev (o con SHOW_DRAFTS=true) include anche draft/review/fact-checked/seo-optimized.
 */
export async function getVisibleArticles(): Promise<Article[]> {
  const showDrafts =
    import.meta.env.DEV ||
    process.env.SHOW_DRAFTS === "true" ||
    import.meta.env.SHOW_DRAFTS === "true";

  const all = await getCollection("articles");
  const filtered = showDrafts
    ? all
    : all.filter((a) => PUBLIC_STATUS.has(a.data.status));

  return filtered.sort(
    (a, b) =>
      new Date(b.data.last_updated ?? b.data.date).getTime() -
      new Date(a.data.last_updated ?? a.data.date).getTime(),
  );
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const articles = await getVisibleArticles();
  return articles.find((a) => a.data.slug === slug);
}

export async function getArticlesByCategory(category: string): Promise<Article[]> {
  const articles = await getVisibleArticles();
  return articles.filter((a) => a.data.category === category);
}

export async function getArticlesByTag(tag: string): Promise<Article[]> {
  const articles = await getVisibleArticles();
  return articles.filter((a) => a.data.tags.includes(tag));
}

/**
 * Articoli correlati: stessa categoria, poi tag overlap, ordinati per data.
 */
export async function getRelatedArticles(
  current: Article,
  limit = 3,
): Promise<Article[]> {
  const all = await getVisibleArticles();
  const others = all.filter((a) => a.id !== current.id);

  const scored = others.map((a) => {
    let score = 0;
    if (a.data.category === current.data.category) score += 10;
    const tagOverlap = a.data.tags.filter((t) =>
      current.data.tags.includes(t),
    ).length;
    score += tagOverlap * 2;
    return { article: a, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.article);
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const articles = await getVisibleArticles();
  const counts = new Map<string, number>();
  for (const a of articles) {
    for (const t of a.data.tags) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function articlePath(article: Article): string {
  return `/blog/${article.data.slug}`;
}
