import type { APIContext } from "astro";
import { getVisibleArticles, articlePath } from "~/utils/articles";
import { SITE, CONTACT, BOOKING, TESSERAMENTO } from "~/consts";
import { CATEGORY_LIST } from "~/utils/categories";

/**
 * llms.txt - https://llmstxt.org/
 * Indice in markdown del sito per facilitare l'indicizzazione da parte degli LLM.
 */
export async function GET(_context: APIContext) {
  const articles = await getVisibleArticles();
  const baseUrl = SITE.url;

  const lines: string[] = [];
  lines.push(`# ${SITE.name}`);
  lines.push("");
  lines.push(`> ${SITE.tagline}`);
  lines.push("");
  lines.push(
    `${SITE.name} e un CAF (Centro di Assistenza Fiscale) UNSIC e un Patronato ENASC con sede a Roma, ${CONTACT.address.street}, ${CONTACT.address.postalCode} ${CONTACT.address.locality} (quartiere Vigne Nuove, Municipio III). Telefono: ${CONTACT.phone.landline}. WhatsApp: ${CONTACT.phone.mobile}. Email: ${CONTACT.email}. Prenotazioni online: ${BOOKING.arcanisGroup}. Tessera: ${TESSERAMENTO.annual.price} EUR all'anno o ${TESSERAMENTO.semester.price} EUR a semestre per nucleo familiare.`,
  );
  lines.push("");
  lines.push(`## Pagine principali`);
  lines.push("");
  lines.push(`- [Home](${baseUrl}/): hub commerciale, claim "${SITE.claim}".`);
  lines.push(`- [Chi siamo](${baseUrl}/chi-siamo): storia, credenziali UNSIC ed ENASC, valori.`);
  lines.push(`- [Servizi](${baseUrl}/servizi): hub di tutti i servizi.`);
  lines.push(`- [Servizi CAF](${baseUrl}/servizi/caf): 730, ISEE, IMU, successioni, contratti di affitto, bonus fiscali.`);
  lines.push(`- [Servizi Patronato](${baseUrl}/servizi/patronato): pensioni, NASpI, invalidita civile, Legge 104, assegno unico, maternita, ADI, RED.`);
  lines.push(`- [Servizi vari](${baseUrl}/servizi/servizi-vari): PEC, utenze, certificati, assicurazioni, comunicazioni con la PA.`);
  lines.push(`- [Tesseramento](${baseUrl}/tesseramento): vantaggi, prezzi, FAQ tessera (${TESSERAMENTO.annual.price} EUR/anno o ${TESSERAMENTO.semester.price} EUR/semestre per nucleo).`);
  lines.push(`- [Blog](${baseUrl}/blog): guide, scadenze, novita normative.`);
  lines.push(`- [FAQ](${baseUrl}/faq): domande frequenti su tutti i servizi.`);
  lines.push(`- [Prenota](${baseUrl}/prenota): calendario online appuntamenti, in sede o da remoto.`);
  lines.push(`- [Contatti](${baseUrl}/contatti): indirizzo, telefono, WhatsApp, email, mappa, orari.`);
  lines.push("");
  lines.push(`## Categorie del blog`);
  lines.push("");
  for (const cat of CATEGORY_LIST) {
    lines.push(`- [${cat.label}](${baseUrl}/blog/categoria/${cat.slug}): ${cat.description}`);
  }
  lines.push("");

  if (articles.length > 0) {
    lines.push(`## Articoli`);
    lines.push("");
    for (const a of articles) {
      lines.push(`- [${a.data.title}](${baseUrl}${articlePath(a)}): ${a.data.meta_description}`);
    }
    lines.push("");
  }

  lines.push(`## Pagine legali`);
  lines.push("");
  lines.push(`- [Privacy Policy](${baseUrl}/privacy)`);
  lines.push(`- [Cookie Policy](${baseUrl}/cookie)`);
  lines.push(`- [Note legali](${baseUrl}/note-legali)`);
  lines.push("");
  lines.push(`## Orari di apertura`);
  lines.push("");
  lines.push(`- Lunedi-Giovedi: 9:30-13:00 e 15:30-18:00`);
  lines.push(`- Venerdi: 9:30-14:00`);
  lines.push(`- Sabato e Domenica: chiuso`);
  lines.push("");
  lines.push(`## Zone servite`);
  lines.push("");
  lines.push(
    `Roma Nord - Municipio III: Vigne Nuove, Tufello, Conca d'Oro, Bufalotta, Porta di Roma, Fidene, Castel Giubileo, Serpentara, Talenti, Nuovo Salario.`,
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
