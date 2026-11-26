// Domande frequenti degli articoli come riquadri apribili (richiesta di Antonio del 26/11/2026).
// Nella sezione "## Domande frequenti" (o "## FAQ") ogni domanda — "### Domanda?" oppure un paragrafo
// "**Domanda?**" — diventa <details class="faq-item"><summary><h3>Domanda?</h3></summary>risposta</details>.
// La risposta resta sempre nell'HTML (solo nascosta alla vista finché non si apre): Google la legge.
// I dati strutturati FAQPage li fa ArticleLayout dal testo markdown, non cambiano.
// Dopo una modifica a questo file: rm -rf sito/node_modules/.astro prima della build.

const text = (n) => (n.type === "text" ? n.value : (n.children || []).map(text).join(""));
const isEl = (n, tag) => n && n.type === "element" && n.tagName === tag;
const blank = (n) => n.type === "text" && !n.value.trim();

// Restituisce { q: h3, rest: nodo risposta nello stesso paragrafo o null }
function questionOf(n) {
  if (isEl(n, "h3") && text(n).trim().endsWith("?")) return { q: n, rest: null };
  if (isEl(n, "p")) {
    const kids = n.children || [];
    const first = kids.findIndex((c) => !blank(c));
    const head = kids[first];
    if (head && isEl(head, "strong") && text(head).trim().endsWith("?")) {
      const q = { type: "element", tagName: "h3", properties: {}, children: head.children };
      // "**Domanda?**\nRisposta" nello stesso paragrafo: il resto diventa la risposta
      let tail = kids.slice(first + 1);
      while (tail.length && (blank(tail[0]) || isEl(tail[0], "br"))) tail = tail.slice(1);
      if (tail.length && tail[0].type === "text") tail[0] = { ...tail[0], value: tail[0].value.replace(/^\s+/, "") };
      const rest = tail.length ? { type: "element", tagName: "p", properties: {}, children: tail } : null;
      return { q, rest };
    }
  }
  return null;
}

function processChildren(children) {
  const out = [];
  let i = 0;
  while (i < children.length) {
    const n = children[i];
    out.push(n);
    i++;
    if (!(isEl(n, "h2") && /^\s*(domande frequenti|faq)\b/i.test(text(n)))) continue;
    // dentro la sezione FAQ fino al prossimo h2 o hr
    while (i < children.length && !isEl(children[i], "h2") && !isEl(children[i], "hr")) {
      const found = questionOf(children[i]);
      if (!found) { out.push(children[i]); i++; continue; }
      const q = found.q;
      i++;
      const answer = found.rest ? [found.rest] : [];
      while (i < children.length && !isEl(children[i], "h2") && !isEl(children[i], "hr") && !questionOf(children[i])) {
        answer.push(children[i]);
        i++;
      }
      q.properties = { ...(q.properties || {}), className: ["faq-q"] };
      out.push({
        type: "element",
        tagName: "details",
        properties: { className: ["faq-item"] },
        children: [
          { type: "element", tagName: "summary", properties: {}, children: [q] },
          { type: "element", tagName: "div", properties: { className: ["faq-a"] }, children: answer },
        ],
      });
    }
  }
  return out;
}

export default function rehypeFaq() {
  return (tree) => {
    tree.children = processChildren(tree.children || []);
  };
}
