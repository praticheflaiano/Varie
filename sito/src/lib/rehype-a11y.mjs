// Accessibilita degli articoli (regola del 24/11/2026): vale per tutto il markdown.
// - le caselle delle liste "- [ ]" ricevono un nome per i lettori di schermo;
// - le tabelle si possono scorrere da tastiera;
// - le intestazioni di tabella vuote diventano celle normali.
import { visit } from "unist-util-visit";
export default function rehypeA11y() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "input" && node.properties?.type === "checkbox" && !node.properties.ariaLabel) {
        node.properties.ariaLabel = "Da preparare";
      }
      if (node.tagName === "table" && node.properties && node.properties.tabIndex == null) {
        node.properties.tabIndex = 0; // le tabelle larghe scorrono anche da tastiera
      }
      if (node.tagName === "th" && !(node.children || []).some((c) => c.type !== "text" || c.value.trim())) {
        node.tagName = "td";
      }
    });
  };
}
