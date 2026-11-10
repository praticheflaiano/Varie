import type { APIContext } from "astro";
import { getVisibleArticles, articlePath } from "~/utils/articles";
import { SITE, CONTACT, BOOKING, TESSERAMENTO, EXTERNAL_PORTALS } from "~/consts";
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
    `${SITE.name} (Pratiche Flaiano) e un CAF (Centro di Assistenza Fiscale) UNSIC e un Patronato ENASC con sede a Roma, ${CONTACT.address.street}, ${CONTACT.address.postalCode} ${CONTACT.address.locality} (quartiere Vigne Nuove, Municipio III). Telefono: ${CONTACT.phone.landline}. WhatsApp: ${CONTACT.phone.mobile}. Email: ${CONTACT.email}. Prenotazioni online: ${BOOKING.arcanisGroup}. Tessera: ${TESSERAMENTO.annual.price} EUR all'anno o ${TESSERAMENTO.semester.price} EUR a semestre per nucleo familiare.`,
  );
  lines.push("");
  lines.push(`## Servizi principali e prezzi`);
  lines.push("");
  lines.push(`- [ISEE](${baseUrl}/isee): calcolo ISEE e invio DSU, gratuito. Redditi e CU li recupera il CAF. Anche in videochiamata o online.`);
  lines.push(`- [Calcolo imposte di successione](${baseUrl}/calcolo-imposte-successione): calcolatore gratuito di imposta di successione per erede, ipotecaria, catastale, tasse e bollo, secondo la guida dell'Agenzia delle Entrate dal 2025.`);
  lines.push(`- [Quale ISEE ti serve](${baseUrl}/quale-isee): test gratuito che indica quale ISEE chiedere (ordinario, minorenni, università, sociosanitario, nucleo ristretto, residenze RSA, corrente) e quali documenti preparare.`);
  lines.push(`- [Modello 730](${baseUrl}/730): da 30 EUR; per chi torna l'anno dopo il prezzo resta invariato. Anche da remoto.`);
  lines.push(`- [Domanda NASpI](${baseUrl}/naspi): domanda di disoccupazione all'INPS tramite patronato, gratuita. Calcolatore e guide su ${EXTERNAL_PORTALS.naspi.url}.`);
  lines.push(`- [Assegno Unico](${baseUrl}/assegno-unico): domanda 15 EUR in ufficio, 19 EUR online; tesserati 10 EUR in ufficio, 15 EUR online. ISEE gratuito.`);
  lines.push(`- [Invalidita civile e Legge 104](${baseUrl}/invalidita-104): medico certificatore e patronato nello stesso ufficio; primo incontro gratuito.`);
  lines.push(`- [Successioni](${baseUrl}/successioni): dichiarazione di successione, volture catastali, conti e beni ereditari.`);
  lines.push(`- [Pensioni](${baseUrl}/pensioni): controllo dell'estratto contributivo, calcolo delle date di uscita, domanda di pensione (vecchiaia, anticipata, APE sociale, reversibilita) tramite patronato.`);
  lines.push(`- [ADI e SFL](${baseUrl}/adi-sfl): Assegno di inclusione e Supporto formazione e lavoro: verifica requisiti, ISEE gratuito, domanda INPS e iscrizione SIISL.`);
  lines.push(`- [Dimissioni online](${baseUrl}/dimissioni-online): dimissioni volontarie, per giusta causa e revoca tramite patronato, anche senza SPID; verifica del diritto alla NASpI.`);
  lines.push(`- [Colf e badanti](${baseUrl}/colf-badanti): assunzione e comunicazioni INPS, contributi trimestrali, variazioni e cessazione del rapporto di lavoro domestico.`);
  lines.push(`- [Contratti d'affitto](${baseUrl}/contratti-affitto): registrazione dei contratti di locazione, cedolare secca, proroghe, subentri e risoluzioni all'Agenzia delle Entrate.`);
  lines.push(`- [IMU e TARI](${baseUrl}/imu-tari): calcolo IMU con F24 pronto, esenzione TARI a Roma con ISEE fino a 6.500 EUR, controllo avvisi AMA, variazioni e ravvedimento.`);
  lines.push(`- [Bonus famiglia](${baseUrl}/bonus-famiglia): bonus nuovi nati 1.000 EUR (domanda entro 120 giorni), bonus asilo nido fino a 3.600 EUR, maternita e congedi, con ISEE minorenni gratuito.`);
  lines.push(`- [Modello RED e INVCIV](${baseUrl}/red-invciv): invio all'INPS di RED, ICRIC, ICLAV e ACC.AS/PS per pensionati e invalidi civili.`);
  lines.push(`- [Cartelle e rateizzazione](${baseUrl}/cartelle-rateizzazione): estratto di ruolo, rateizzazione delle cartelle AdER fino a 84 rate per debiti fino a 120.000 EUR, piani decaduti e definizioni agevolate.`);
  lines.push(`- [Raccomandate SEND](${baseUrl}/raccomandata-send): punto di ritiro SEND a Vigne Nuove, stampa dell'atto notificato (la prima gratis, poi 1,40 EUR + IVA) e consulenza su multe, cartelle, TARI e avvisi INPS; comunicazione del conducente via PEC a 15 EUR.`);
  lines.push(`- [Richiesta online](${baseUrl}/richiesta): modulo per inviare la richiesta e i documenti, il centro richiama.`);
  lines.push("");
  lines.push(`Come prenotare: [pagina prenota](${baseUrl}/prenota) (in ufficio, in videochiamata o richiesta online), telefono ${CONTACT.phone.landline}, WhatsApp ${CONTACT.phone.mobile}.`);
  lines.push("");
  lines.push(`## Pagine principali`);
  lines.push("");
  lines.push(`- [Home](${baseUrl}/): hub commerciale, claim "${SITE.claim}".`);
  lines.push(`- [Chi siamo](${baseUrl}/chi-siamo): storia, credenziali UNSIC ed ENASC, valori.`);
  lines.push(`- [Servizi](${baseUrl}/servizi): hub di tutti i servizi.`);
  lines.push(`- [Servizi CAF](${baseUrl}/servizi/caf): 730, ISEE, IMU, successioni, contratti di affitto, bonus fiscali.`);
  lines.push(`- [Servizi Patronato](${baseUrl}/servizi/patronato): pensioni, NASpI, invalidita civile, Legge 104, assegno unico, maternita, ADI, RED.`);
  lines.push(`- [Servizi vari](${baseUrl}/servizi/servizi-vari): PEC, utenze, certificati, assicurazioni, comunicazioni con la PA.`);
  lines.push(`- [Tesseramento](${baseUrl}/tesseramento): consulenze gratuite, appuntamenti prioritari, sconti sulle pratiche (${TESSERAMENTO.annual.price} EUR/anno o ${TESSERAMENTO.semester.price} EUR/semestre per nucleo familiare).`);
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
