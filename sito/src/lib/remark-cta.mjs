// Trasforma in un grande pulsante i rimandi a calcolatori e documenti scaricabili.
// Uso negli articoli (markdown): una citazione con UN solo link a uno strumento, es.
//   > **Calcola subito:** con il nostro [calcolatore del bollo auto](/calcolo-bollo-auto) scopri se sei esente.
// Diventa: pulsante viola con il testo del link come titolo e il resto come sottotitolo.
// Comprende gli strumenti NASpI del sito: /calcolo-naspi (già coperto da /calcolo-*), anticipo, scadenze della domanda, verifica Fondo di garanzia.
const TOOL = /^(\/calcolo-[a-z0-9-]+|\/assegno-vedovanza|\/calcolatore[a-z0-9-]*|\/guide\/[^\s]+\.pdf|\/[^\s]+\.pdf|\/anticipo-naspi|\/naspi\/(domanda|fondo-garanzia-tfr))(#.*)?$/i;

const BOOK = /^(\/prenota|https:\/\/link\.arcanis\.it\/widget\/(booking|group)\/[A-Za-z0-9]+)(#.*)?$/i;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const text = (n) => (n.type === "text" || n.type === "inlineCode" ? n.value : (n.children || []).map(text).join(""));

function links(n, out = []) {
  if (n.type === "link") out.push(n);
  for (const c of n.children || []) links(c, out);
  return out;
}

const ICON_CALC = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#14142B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h8"/></svg>';
const ICON_PDF = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#14142B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>';
const ICON_CAL = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#14142B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M9 15l2 2 4-4"/></svg>';
const ARROW = '<svg class="cta-tool-go" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

export default function remarkCta() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((c) => {
        if (c.type === "blockquote") {
          const ls = links(c);
          if (ls.length === 1 && (TOOL.test(ls[0].url) || BOOK.test(ls[0].url))) {
            const isBook = BOOK.test(ls[0].url);
            const l = ls[0];
            const title = text(l).trim();
            const full = text(c).replace(/\s+/g, " ").trim();
            const i = full.indexOf(title);
            let sub = (i >= 0 ? full.slice(i + title.length) : "").replace(/^[\s,.;:–-]+/, "").trim();
            const isPdf = /\.pdf(#.*)?$/i.test(l.url);
            if (!sub) sub = isBook ? "In ufficio a Vigne Nuove o in videochiamata" : isPdf ? "Scarica il PDF" : "Gratis, ci vuole un minuto";
            sub = sub.charAt(0).toUpperCase() + sub.slice(1);
            const label = title.charAt(0).toUpperCase() + title.slice(1);
            const attrs = isPdf ? ' download target="_blank" rel="noopener"' : "";
            return {
              type: "html",
              value: `<p class="cta-tool-wrap"><a class="cta-tool" href="${esc(l.url)}"${attrs}><span class="cta-tool-ico">${isBook ? ICON_CAL : isPdf ? ICON_PDF : ICON_CALC}</span><span class="cta-tool-txt"><span class="cta-tool-t">${esc(isPdf || isBook ? label : "Apri il " + title)}</span><span class="cta-tool-s">${esc(sub)}</span></span>${ARROW}</a></p>`,
            };
          }
        }
        walk(c);
        return c;
      });
    };
    walk(tree);
  };
}
