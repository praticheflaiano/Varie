/**
 * Stima il tempo di lettura in minuti (200 parole/min, italiano medio).
 */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
