<script lang="ts">
  import { leggiPdf, leggiEstrattoDiretto, leggiEstrattoLocale, NOMI_GESTIONE, type EstrattoLetto } from "~/utils/estrattoInps";
  import Attesa from "./Attesa.svelte";
  // Questionario "Stima e Calcolo della pensione".
  // Raccoglie dati e documenti PRIMA del pagamento; l'invio va all'endpoint
  // `apiUrl`. Finché non è configurato, l'ultimo passo mostra un avviso e non
  // invia nulla (nessun dato lascia il browser).

  interface Props {
    apiUrl?: string;
    /** Prezzo della stima e supplemento se l'estratto lo richiediamo noi (euro). */
    prezzo?: number;
    prezzoEstratto?: number;
    /** Sondaggio GHL "RICHIESTE CERTIFICAZIONI" (lo stesso di /certificazioni) e mandato. */
    surveyId?: string;
    mandatoUrl?: string;
    /** Funzione server che legge l'estratto con AI; se non risponde si usa la lettura locale. */
    leggiUrl?: string;
    /** Funzione server post-pagamento: rilettura completa e stima con Fable 5.2 + motore. */
    elaboraUrl?: string;
  }
  let { apiUrl = "", prezzo = 60, prezzoEstratto = 5, surveyId = "", mandatoUrl = "", leggiUrl = "", elaboraUrl = "/api/stima/elabora" }: Props = $props();
  // Sul sito pubblico le funzioni server stanno a un altro indirizzo (quello di `apiUrl`):
  // la lettura dell'estratto si chiama lì, accanto all'invio.
  const leggi = $derived(leggiUrl || apiUrl.replace(/\/invia$/, "/leggi-estratto").replace(/^$/, "/api/stima/leggi-estratto"));

  const MAX_MB = 10;
  const STEPS = ["Estratto", "Tu", "Lavoro", "Contributi", "Salute e famiglia", "Altri documenti", "Riepilogo"];

  let step = $state(0);

  // MODALITÀ PROVA: solo su localhost e sulle anteprime Vercel dei rami (mai sul sito
  // pubblico), e solo se il servizio vero non è configurato. Simula pagamento, conferma
  // dei contributi e prospetto con i dati del caso di esempio: non invia nulla.
  type Fase = "form" | "pagamento" | "rifiutato" | "conferma" | "elaborazione" | "risultato" | "prospetto";
  let fase = $state<Fase>("form");
  let demo = $state(false);
  let esempio = $state<{ input: any; esito: any } | null>(null);
  $effect(() => {
    const h = window.location.hostname;
    demo = !apiUrl && (h === "localhost" || h === "127.0.0.1" || (h.endsWith(".vercel.app") && h.includes("-git-")));
  });
  async function vaiA(f: Fase) {
    if ((f === "conferma" || f === "prospetto") && !esempio) {
      const [input, esito] = await Promise.all([
        import("../../../api/_pensione/test_regressione.input.json"),
        import("../../../api/_pensione/test_regressione.atteso.json"),
      ]);
      esempio = { input: input.default, esito: esito.default };
    }
    fase = f;
    scrollTop();
  }
  // Stima vera (rilettura con Fable 5.2 + motore di calcolo), usata dalla modalità prova dopo il pagamento simulato.
  let stima = $state<any>(null);
  let notaStima = $state("");
  async function calcolaStima() {
    const f = files.estratto;
    notaStima = "";
    if (!elaboraUrl || !f || !/\.pdf$/i.test(f.name) || f.size > 3_000_000) {
      notaStima = "La stima vera richiede un estratto in PDF fino a 3 MB: qui sotto vedi il prospetto di esempio.";
      return vaiA("prospetto");
    }
    fase = "elaborazione";
    scrollTop();
    try {
      const corpo: Record<string, unknown> = { risposte: a, pdf: inBase64(await f.arrayBuffer()) };
      if (letto && modoLettura !== "locale") corpo.prelettura_settimane = letto.totaleSettimane;
      // Allegati facoltativi: entrano solo se il totale resta entro ~3 MB (limite della funzione).
      let spazio = 3_000_000 - f.size;
      const esclusi: string[] = [];
      for (const [chiave, etichetta] of [["simulazione", "simulazione INPS"], ["busta", "busta paga o CU"]] as const) {
        const g = files[chiave];
        if (!g) continue;
        if (g.size <= spazio) { corpo[chiave] = inBase64(await g.arrayBuffer()); spazio -= g.size; }
        else esclusi.push(etichetta);
      }
      if (esclusi.length) notaStima = `Non inclusi perché troppo grandi: ${esclusi.join(", ")}.`;
      const res = await fetch(elaboraUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
      const dati = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(dati?.scenari)) {
        stima = dati;
        fase = "risultato";
        return scrollTop();
      }
      notaStima = res.status === 503
        ? "La stima vera non è ancora attiva (manca la chiave API di Anthropic su Vercel): qui sotto vedi il prospetto di esempio."
        : res.status === 422
          ? "Nel file non sono stati trovati periodi contributivi: qui sotto vedi il prospetto di esempio."
          : `La stima vera non è riuscita (errore ${res.status}): qui sotto vedi il prospetto di esempio.`;
    } catch {
      notaStima = "La stima vera non è riuscita (errore di rete o tempo scaduto): qui sotto vedi il prospetto di esempio.";
    }
    await vaiA("prospetto");
  }

  function scaricaPdf() {
    if (!stima?.pdf_base64) return;
    const bin = atob(stima.pdf_base64);
    const bytes = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "stima-pensione.pdf";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  const AFFIDABILITA: Record<string, string> = { media: "buona", "media-bassa": "discreta", bassa: "di massima", parziale: "incompleta" };
  const affid = (x: string) => AFFIDABILITA[x] ?? x;
  const MOTIVI_BUCO = [
    { v: "non-lavoravo", l: "Non lavoravo" },
    { v: "militare", l: "Servizio militare o civile" },
    { v: "studio", l: "Studiavo all'università" },
    { v: "estero", l: "Lavoravo all'estero" },
    { v: "non-accreditato", l: "Lavoravo in Italia ma non risulta" },
    { v: "altro", l: "Altro" },
  ];

  const dataIt = (d: string) => (d ? new Date(d).toLocaleDateString("it-IT") : "—");
  const euro = (n: number) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
  let errors = $state<string[]>([]);
  let sending = $state(false);
  let sendError = $state("");

  let a = $state({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    nascita: "",
    sesso: "",
    figli: "0",
    residenza: "",
    // lavoro
    situazione: "",
    continua: "",
    finoA: "",
    retribuzione: "",
    naspi: "",
    esuberi: "",
    // contributi
    mancanti: [] as string[],
    mancantiNote: "",
    // anni senza contributi trovati nell'estratto: cosa faceva il cliente
    buchi: [] as { da: number; a: number; motivo: string }[],
    precoce: "",
    // salute e famiglia
    invalidita: "",
    invaliditaPct: "",
    invaliditaData: "",
    caregiver: "",
    mansione: "",
    mansioneAnni: "",
    obiettivo: "",
    // documenti: true = l'estratto contributivo lo richiediamo noi (supplemento)
    richiediEstratto: false,
    // consensi
    privacy: false,
    salute: false,
    condizioni: false,
  });

  let files = $state<Record<string, File | null>>({
    estratto: null,
    simulazione: null,
    busta: null,
    verbale: null,
  });

  const DOCS = [
    { key: "estratto", label: "Estratto conto contributivo INPS", required: true, accept: ".pdf,.xml", hint: "Lo scarichi dal sito INPS con SPID o CIE: Fascicolo previdenziale → Estratto conto. PDF o XML." },
    { key: "simulazione", label: "Simulazione INPS \"La mia pensione futura\"", required: false, accept: ".pdf", hint: "Molto consigliata se hai contributi prima del 1996: rende l'importo più preciso." },
    { key: "busta", label: "Ultima busta paga o Certificazione Unica", required: false, accept: ".pdf,.jpg,.jpeg,.png", hint: "Serve a stimare i contributi dei prossimi anni." },
    { key: "verbale", label: "Verbale di invalidità", required: false, accept: ".pdf,.jpg,.jpeg,.png", hint: "Solo se hai un'invalidità riconosciuta." },
  ];

  const MANCANTI = [
    { v: "militare", l: "Servizio militare o civile" },
    { v: "estero", l: "Lavoro all'estero" },
    { v: "cassa", l: "Cassa professionale (es. Inarcassa, ENPAM, Cassa Forense)" },
    { v: "laurea", l: "Anni di laurea da riscattare" },
    { v: "pubblico", l: "Periodi nel pubblico impiego" },
    { v: "altro", l: "Altri periodi che non vedo nell'estratto" },
  ];

  const disoccupato = $derived(a.situazione === "disoccupato");
  const haInvalidita = $derived(a.invalidita === "civile" || a.invalidita === "pensionabile");
  const haMansione = $derived(a.mansione === "gravosa" || a.mansione === "usurante");
  const totale = $derived(prezzo + (a.richiediEstratto ? prezzoEstratto : 0));
  const price = $derived(`${totale} €`);

  // Carica lo script GHL che adatta l'altezza del sondaggio, solo quando serve.
  $effect(() => {
    if (!a.richiediEstratto || !surveyId) return;
    if (document.querySelector('script[data-ghl-embed]')) return;
    const sc = document.createElement("script");
    sc.src = "https://link.arcanis.it/js/form_embed.js";
    sc.dataset.ghlEmbed = "1";
    document.body.appendChild(sc);
  });

  function toggleMancante(v: string) {
    a.mancanti = a.mancanti.includes(v) ? a.mancanti.filter((x) => x !== v) : [...a.mancanti, v];
  }

  // Estratto letto in automatico nel browser (vedi utils/estrattoInps.ts).
  let letto = $state<(EstrattoLetto & { totaleDichiarato?: string }) | null>(null);
  let modoLettura = $state<"diretta" | "ai" | "locale" | "">("");
  let leggendo = $state(false);
  let compilati = $state<string[]>([]);
  let consensoLettura = $state(false);

  const inBase64 = (buf: ArrayBuffer) => {
    let bin = "";
    const u = new Uint8Array(buf);
    for (let k = 0; k < u.length; k += 0x8000) bin += String.fromCharCode(...u.subarray(k, k + 0x8000));
    return btoa(bin);
  };

  /** Lettura con AI sul server; null se non disponibile (si ripiega sulla lettura locale). */
  async function leggiConAi(linee: string[], f: File): Promise<EstrattoLetto | null> {
    if (!leggiUrl) return null;
    try {
      const testo = linee.join("\n");
      // Inviamo il PDF (letto con Mistral OCR); se supera ~3 MB e contiene testo, solo il testo.
      const corpo = f.size <= 3_000_000 ? { pdf: inBase64(await f.arrayBuffer()) } : testo.length > 200 ? { testo } : null;
      if (!corpo) return null;
      const res = await fetch(leggi, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
      if (!res.ok) return null;
      const dati = await res.json();
      return Array.isArray(dati?.anni) ? dati : null;
    } catch {
      return null;
    }
  }

  async function onEstratto(e: Event) {
    onFile("estratto", e);
    letto = null;
    modoLettura = "";
    compilati = [];
    const f = files.estratto;
    if (!f) return;
    if (!/\.pdf$/i.test(f.name)) {
      errors = ["Riusciamo a leggere in automatico solo il PDF: questo file lo esaminiamo noi dopo l'invio."];
      return;
    }
    leggendo = true;
    try {
      // 1) lettura diretta del testo del PDF, qui nel browser (l'estratto scaricato dal sito INPS): nessuna riga persa;
      // 2) se il PDF è una scansione o ha un'impaginazione diversa, lettura con AI sul server; 3) riserva: righe di testo.
      const pdf = await leggiPdf(f);
      const diretta = leggiEstrattoDiretto(pdf);
      const ai = diretta ? null : await leggiConAi(pdf.linee, f);
      const r = diretta ?? ai ?? leggiEstrattoLocale(pdf.linee);
      modoLettura = diretta ? "diretta" : ai ? "ai" : "locale";
      letto = r;
      const buchi: { da: number; a: number; motivo: string }[] = [];
      for (let k = 1; k < r.anni.length && buchi.length < 5; k++) {
        const da = r.anni[k - 1].anno + 1;
        const fino = r.anni[k].anno - 1;
        if (fino >= da) buchi.push({ da, a: fino, motivo: "" });
      }
      a.buchi = buchi;
      // Precompila solo i campi ancora vuoti: quello che hai già scritto non si tocca.
      const fatto: string[] = [];
      const metti = (campo: "nome" | "cognome" | "nascita" | "sesso" | "situazione" | "retribuzione", v: string, etichetta: string) => {
        if (v && !a[campo]) { a[campo] = v; fatto.push(etichetta); }
      };
      metti("nome", r.nome, "nome");
      metti("cognome", r.cognome, "cognome");
      metti("nascita", r.nascita, "data di nascita");
      metti("sesso", r.sesso, "sesso");
      metti("situazione", r.situazione, "situazione lavorativa");
      metti("retribuzione", r.ultimaRetribuzione ? String(Math.round(r.ultimaRetribuzione)) : "", "retribuzione annua");
      compilati = fatto;
    } catch {
      errors = ["Non siamo riusciti a leggere il file in automatico. Puoi proseguire: lo esaminiamo noi dopo l'invio."];
    } finally {
      leggendo = false;
    }
  }

  function onFile(key: string, e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
    if (f && f.size > MAX_MB * 1024 * 1024) {
      errors = [`Il file "${f.name}" supera i ${MAX_MB} MB.`];
      (e.currentTarget as HTMLInputElement).value = "";
      files[key] = null;
      return;
    }
    errors = [];
    files[key] = f;
  }

  function validate(s: number): string[] {
    const e: string[] = [];
    if (s === 0) {
      if (leggendo) e.push("Stiamo ancora leggendo il file: attendi qualche secondo.");
      else if (!files.estratto && !a.richiediEstratto) e.push("Carica l'estratto conto contributivo INPS oppure scegli di farlo richiedere a noi.");
    }
    if (s === 1) {
      if (!a.nome.trim() || !a.cognome.trim()) e.push("Inserisci nome e cognome.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) e.push("Inserisci un indirizzo email valido: lì ricevi il prospetto.");
      if (!a.nascita) e.push("Inserisci la data di nascita.");
      else {
        const anni = (Date.now() - new Date(a.nascita).getTime()) / 31557600000;
        if (anni < 18 || anni > 100) e.push("Controlla la data di nascita.");
      }
      if (!a.sesso) e.push("Indica il sesso: i requisiti della pensione anticipata sono diversi.");
    }
    if (s === 2) {
      if (!a.situazione) e.push("Indica la tua situazione lavorativa.");
      if (!disoccupato && a.situazione && !a.continua) e.push("Indica se pensi di continuare a lavorare.");
      if (a.continua === "data" && !a.finoA) e.push("Indica fino a quando pensi di lavorare.");
      if (disoccupato && !a.naspi) e.push("Indica la situazione della NASpI.");
    }
    if (s === 3) {
      if (!a.precoce) e.push("Rispondi alla domanda sul lavoro prima dei 19 anni.");
    }
    if (s === 4) {
      if (!a.invalidita) e.push("Rispondi alla domanda sull'invalidità.");
      if (haInvalidita && !a.invaliditaPct) e.push("Indica la percentuale di invalidità.");
      if (!a.caregiver) e.push("Rispondi alla domanda sull'assistenza a un familiare.");
      if (!a.mansione) e.push("Rispondi alla domanda sulle mansioni.");
      if (!a.obiettivo) e.push("Indica il tuo obiettivo.");
    }
    if (s === 5) {
    }
    if (s === 6) {
      if (!a.privacy || !a.condizioni) e.push("Per procedere servono l'accettazione dell'informativa privacy e delle condizioni del servizio.");
      if (!a.salute) e.push("Per valutare invalidità e assistenza a familiari serve il consenso al trattamento dei dati sulla salute.");
    }
    return e;
  }

  function next() {
    errors = validate(step);
    if (errors.length) return;
    step = Math.min(step + 1, STEPS.length - 1);
    scrollTop();
  }
  function back() {
    errors = [];
    step = Math.max(step - 1, 0);
    scrollTop();
  }
  function scrollTop() {
    document.getElementById("stima-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Invio vero: salva dati e documenti in una pratica e manda al pagamento (checkout GHL, dove si
  // applicano anche i coupon). Sulle anteprime l'endpoint è sempre attivo, per provare il flusso.
  const inviaUrl = $derived(apiUrl || (demo ? "/api/stima/invia" : ""));
  async function submit() {
    errors = validate(6);
    if (errors.length) return;
    if (!inviaUrl) return;
    const f = files.estratto;
    if (!a.richiediEstratto && (!f || !/\.pdf$/i.test(f.name) || f.size > 3_000_000)) {
      sendError = "L'estratto conto deve essere un PDF fino a 3 MB: torna al primo passo e carica il file scaricato dal sito INPS.";
      return;
    }
    sending = true;
    sendError = "";
    try {
      const corpo: Record<string, unknown> = { risposte: a };
      let spazio = 3_000_000;
      if (f && !a.richiediEstratto) {
        corpo.pdf = inBase64(await f.arrayBuffer());
        spazio -= f.size;
        if (letto && modoLettura !== "locale") corpo.prelettura_settimane = letto.totaleSettimane;
      }
      // Allegati facoltativi: entrano solo se il totale resta entro ~3 MB (limite della funzione).
      for (const chiave of ["simulazione", "busta"] as const) {
        const g = files[chiave];
        if (g && g.size <= spazio) { corpo[chiave] = inBase64(await g.arrayBuffer()); spazio -= g.size; }
      }
      const res = await fetch(inviaUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
      const data = (await res.json().catch(() => ({}))) as { next?: string; codice?: string };
      if (res.status === 429) { sendError = "Hai già inviato più richieste nell'ultima ora: riprova più tardi oppure scrivici su WhatsApp."; return; }
      if (!res.ok || !data.next || !data.codice) throw new Error(String(res.status));
      // Serve alla pagina della pratica per ritrovarla al ritorno dal pagamento.
      try { localStorage.setItem("stima-pratica", JSON.stringify({ c: data.codice, n: a.nascita, checkout: Date.now() })); } catch { /* archivio del browser non disponibile */ }
      window.location.assign(data.next);
    } catch {
      sendError = "Non siamo riusciti a inviare i dati. Riprova tra poco oppure scrivici su WhatsApp.";
    } finally {
      sending = false;
    }
  }

  const label = "block text-sm font-bold text-[#14142B] mb-1.5";
  const input = "w-full rounded-2xl border-2 border-[#E4E4EE] bg-white px-4 py-3 text-base text-[#14142B] focus:border-[#5B3DF5] focus:outline-none";
  const help = "mt-1.5 text-sm text-[#6B6B85]";
  const chip = (on: boolean) =>
    `cursor-pointer rounded-2xl border-2 px-4 py-3 text-left text-base font-semibold transition-colors ${on ? "border-[#5B3DF5] bg-[#F1EEFF] text-[#14142B]" : "border-[#E4E4EE] bg-white text-[#3F3F5A] hover:border-[#C9C9DA]"}`;
</script>

{#snippet scelta(name: string, value: string, opts: { v: string; l: string }[], set: (v: string) => void)}
  <div class="grid gap-2 sm:grid-cols-2" role="radiogroup">
    {#each opts as o}
      <label class={chip(value === o.v)}>
        <input type="radio" class="sr-only" {name} value={o.v} checked={value === o.v} onchange={() => set(o.v)} />
        {o.l}
      </label>
    {/each}
  </div>
{/snippet}

<div id="stima-form" class="scroll-mt-24 rounded-[28px] bg-[#F7F7FB] p-5 sm:p-8">
  {#if demo}
    <p class="mb-5 rounded-2xl border-2 border-dashed border-[#14142B] bg-[#D4FF4F] p-4 font-bold text-[#14142B]">ANTEPRIMA: «Invia e vai al pagamento» esegue il flusso vero (salva la pratica e porta al pagamento). «Prova rapida senza salvare», all'ultimo passo, simula tutto senza salvare né addebitare nulla.</p>
  {/if}
  {#if fase === "pagamento" || fase === "rifiutato"}
    <h2 class="mb-2 text-2xl font-extrabold text-[#14142B]">Pagamento simulato</h2>
    <p class="text-[#3F3F5A]">Qui il cliente verrà mandato alla pagina di pagamento dello store GHL. In prova scegli tu l'esito.</p>
    <dl class="mt-4 rounded-2xl bg-white p-4 text-[#14142B]">
      <div class="flex justify-between py-1"><dt>Stima e Calcolo della pensione</dt><dd class="font-semibold">{prezzo} €</dd></div>
      {#if a.richiediEstratto}<div class="flex justify-between py-1"><dt>Richiesta estratto contributivo</dt><dd class="font-semibold">{prezzoEstratto} €</dd></div>{/if}
      <div class="mt-2 flex justify-between border-t-2 border-[#E4E4EE] pt-2 text-lg font-extrabold"><dt>Totale</dt><dd>{price}</dd></div>
    </dl>
    {#if fase === "rifiutato"}
      <p class="mt-4 rounded-2xl bg-[#FFE3EC] p-4 font-semibold text-[#14142B]" role="alert">Pagamento non riuscito (simulato). I dati inseriti restano salvati: il cliente può riprovare.</p>
    {/if}
    <div class="mt-6 flex flex-wrap gap-3">
      <button type="button" class="rounded-full bg-[#5B3DF5] px-7 py-3 font-bold text-white shadow-[0_6px_0_#14142B]" onclick={() => vaiA(a.richiediEstratto ? "prospetto" : "conferma")}>Simula pagamento riuscito</button>
      <button type="button" class="rounded-full border-2 border-[#14142B] bg-white px-6 py-3 font-bold text-[#14142B]" onclick={() => vaiA("rifiutato")}>Simula pagamento rifiutato</button>
      <button type="button" class="rounded-full px-4 py-3 font-bold text-[#14142B] underline" onclick={() => vaiA("form")}>Torna al questionario</button>
    </div>
  {:else if fase === "conferma" && esempio}
    <h2 class="mb-2 text-2xl font-extrabold text-[#14142B]">Pagamento ricevuto. Controlla i tuoi contributi</h2>
    <p class="text-[#3F3F5A]">Dopo il pagamento il cliente vede quello che abbiamo letto dal suo estratto e lo conferma. {#if letto?.anni.length}<strong>Questa è la lettura automatica del file che hai caricato.</strong>{:else}<strong>In prova la tabella mostra un caso di esempio, non il file che hai caricato.</strong>{/if}</p>
    <div class="mt-4 max-h-80 overflow-auto rounded-2xl bg-white">
      <table class="w-full text-left text-sm text-[#14142B]">
        <thead class="sticky top-0 bg-[#14142B] text-white"><tr><th class="px-4 py-2">Anno</th><th class="px-4 py-2">Gestione</th><th class="px-4 py-2">Settimane</th><th class="px-4 py-2">Retribuzione</th></tr></thead>
        <tbody>
          {#if letto?.anni.length}
            {#each letto.anni as y}
              <tr class="border-t border-[#E4E4EE]"><td class="px-4 py-1.5">{y.anno}</td><td class="px-4 py-1.5">—</td><td class="px-4 py-1.5">{y.settimane}</td><td class="px-4 py-1.5">{y.imponibile ? euro(y.imponibile) : "—"}</td></tr>
            {/each}
          {:else}
          {#each esempio.input.contributi as c}
            <tr class="border-t border-[#E4E4EE]"><td class="px-4 py-1.5">{c.anno}</td><td class="px-4 py-1.5">{c.gestione ?? esempio.input.gestione_principale}</td><td class="px-4 py-1.5">{c.settimane}</td><td class="px-4 py-1.5">{euro(c.imponibile)}</td></tr>
          {/each}
          {/if}
        </tbody>
      </table>
    </div>
    <p class="mt-3 font-semibold text-[#14142B]">Totale letto: {#if letto?.anni.length}{letto.totaleSettimane} settimane.{:else}{esempio.esito.contributi_ad_oggi} ({esempio.esito.settimane_ad_oggi} settimane).{/if}</p>
    <div class="mt-6 flex flex-wrap gap-3">
      <button type="button" class="rounded-full bg-[#5B3DF5] px-7 py-3 font-bold text-white shadow-[0_6px_0_#14142B]" onclick={calcolaStima}>I dati sono corretti: calcola</button>
      <button type="button" class="rounded-full border-2 border-[#14142B] bg-white px-6 py-3 font-bold text-[#14142B]" onclick={() => vaiA("form")}>Ricomincia la prova</button>
    </div>
  {:else if fase === "elaborazione"}
    <Attesa variante="calcolo" />
  {:else if fase === "risultato" && stima}
    {@const base = stima.scenari[0].esito}
    <h2 class="mb-2 text-2xl font-extrabold text-[#14142B]">La tua stima</h2>
    <p class="text-sm text-[#6B6B85]">Estratto di {stima.estratto.intestatario || "—"}{#if stima.estratto.data_estratto}, aggiornato al {dataIt(stima.estratto.data_estratto)}{/if} · {stima.estratto.righe} righe lette · calcolo del {dataIt(stima.data_calcolo)}</p>
    {#if base.prima_uscita_pensione}
      <p class="mt-4 rounded-2xl bg-[#D4FF4F] p-4 text-lg font-extrabold text-[#14142B]">Prima uscita possibile: {base.prima_uscita_pensione.canale} dal {dataIt(base.prima_uscita_pensione.decorrenza)}</p>
    {/if}
    {#if notaStima}<p class="mt-3 rounded-2xl bg-[#FFE3EC] p-3 text-sm font-semibold text-[#14142B]">{notaStima}</p>{/if}
    {#if stima.pdf_base64}
      <div class="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-[#F1EEFF] p-4 text-[#14142B]">
        <button type="button" id="sp-scarica-pdf" class="rounded-full bg-[#5B3DF5] px-6 py-3 font-bold text-white shadow-[0_6px_0_#14142B]" onclick={scaricaPdf}>Scarica il prospetto in PDF</button>
        {#if stima.archiviato}
          <p class="text-sm">Lo ritrovi anche dopo: inquadra il QR stampato sul PDF oppure apri <a class="font-bold underline" href={stima.recupero_url}>questo link</a> e inserisci la tua data di nascita. Codice pratica: <strong>{stima.codice}</strong></p>
        {:else}
          <p class="text-sm">Salvalo ora: l'archivio per ritrovarlo in seguito non è ancora attivo.</p>
        {/if}
      </div>
    {/if}
    {#if stima.revisione_consigliata?.length}
      <p class="mt-4 rounded-2xl bg-[#FFE3EC] p-4 font-semibold text-[#14142B]">Questa stima va fatta controllare da un nostro operatore prima di prendere decisioni: {stima.revisione_consigliata.join("; ")}.</p>
    {/if}
    <div class="mt-4 rounded-2xl border-2 border-[#14142B] bg-white p-4 text-[#14142B]">
      <h3 class="text-lg font-extrabold">In breve</h3>
      <p class="mt-1">{stima.testo.sintesi}</p>
      <p class="mt-3"><strong>Uscita consigliata:</strong> {stima.testo.uscita_consigliata.canale} ({stima.testo.uscita_consigliata.scenario.toLowerCase()}). {stima.testo.uscita_consigliata.motivo}</p>
    </div>
    <p class="mt-4 text-[#14142B]">Contributi ad oggi: <strong>{base.contributi_ad_oggi}</strong> · Sistema di calcolo: <strong>{base.sistema_calcolo}</strong></p>
    {#each stima.scenari as sc}
      <h3 class="mt-6 text-xl font-extrabold text-[#14142B]">{sc.nome}</h3>
      {#if sc.motivo}<p class="mt-1 text-[#3F3F5A]">{sc.motivo}</p>{/if}
      {#if sc.note?.length}<ul class="mt-1 list-disc pl-5 text-sm text-[#3F3F5A]">{#each sc.note as n}<li>{n}</li>{/each}</ul>{/if}
      <div class="mt-2 grid gap-3">
        {#each sc.esito.canali as c}
          <div class="rounded-2xl bg-white p-4 text-[#14142B]">
            <h4 class="text-lg font-extrabold">{c.canale} <span class="text-sm font-semibold text-[#6B6B85]">· {c.stato}</span></h4>
            <dl class="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <div><dt class="text-sm text-[#6B6B85]">Maturi il diritto</dt><dd class="font-semibold">{dataIt(c.data_maturazione)}</dd></div>
              <div><dt class="text-sm text-[#6B6B85]">Primo pagamento</dt><dd class="font-semibold">{dataIt(c.decorrenza)}{#if c.eta_alla_decorrenza} · {c.eta_alla_decorrenza}{/if}</dd></div>
              {#if c.importo?.lordo_mensile_13 != null}
                <div><dt class="text-sm text-[#6B6B85]">Lordo mensile (13 mensilità)</dt><dd class="font-semibold">{euro(c.importo.lordo_mensile_13)}</dd></div>
                <div><dt class="text-sm text-[#6B6B85]">Netto stimato</dt><dd class="font-semibold">{c.importo.netto_mensile_13_stima != null ? euro(c.importo.netto_mensile_13_stima) : "—"} · stima {affid(c.importo.affidabilita)}</dd></div>
              {:else if c.importo?.indennita_mensile_lorda_12 != null}
                <div><dt class="text-sm text-[#6B6B85]">Indennità mensile lorda (12 mensilità)</dt><dd class="font-semibold">{euro(c.importo.indennita_mensile_lorda_12)} · stima {affid(c.importo.affidabilita)}</dd></div>
              {/if}
            </dl>
            {#each stima.testo.spiegazione_canali.filter((x: any) => x.canale === c.canale && x.scenario === sc.nome) as sp}<p class="mt-2">{sp.testo}</p>{/each}
            {#if c.note?.length}<ul class="mt-2 list-disc pl-5 text-sm text-[#3F3F5A]">{#each c.note as n}<li>{n}</li>{/each}</ul>{/if}
          </div>
        {/each}
      </div>
    {/each}
    {#if stima.testo.decisioni.length}
      <h3 class="mt-6 text-xl font-extrabold text-[#14142B]">Cosa decidere</h3>
      <ul class="mt-2 list-disc pl-5 text-[#14142B]">{#each stima.testo.decisioni as d}<li>{d.cosa}{#if d.entro} <strong>(entro {d.entro})</strong>{/if}</li>{/each}</ul>
    {/if}
    {#if stima.testo.dati_mancanti.length}
      <h3 class="mt-6 text-xl font-extrabold text-[#14142B]">Per una stima più precisa</h3>
      <ul class="mt-2 list-disc pl-5 text-[#14142B]">{#each stima.testo.dati_mancanti as d}<li>{d}</li>{/each}</ul>
    {/if}
    {#if stima.confronto_inps?.length}
      <h3 class="mt-6 text-xl font-extrabold text-[#14142B]">Confronto con la simulazione INPS</h3>
      <div class="mt-2 grid gap-2">
        {#each stima.confronto_inps as cf}
          <p class={`rounded-2xl p-3 text-[#14142B] ${cf.coerente ? "bg-[#E9FFA6]" : "bg-[#FFE3EC]"}`}><strong>{cf.canale}:</strong> INPS {euro(cf.importo_inps)} al mese, nostra stima {euro(cf.importo_stima)} ({cf.scarto_percento > 0 ? "+" : ""}{cf.scarto_percento}%). {cf.coerente ? "Le due stime sono coerenti." : "Lo scarto è alto: la stima va controllata."}</p>
        {/each}
      </div>
    {/if}
    {#if stima.limiti?.length || stima.parametri_non_definitivi?.length}
      <h3 class="mt-6 text-xl font-extrabold text-[#14142B]">Cosa questa stima non considera</h3>
      <ul class="mt-2 list-disc pl-5 text-[#14142B]">{#each [...(stima.limiti ?? []), ...(stima.parametri_non_definitivi ?? [])] as v}<li>{v}</li>{/each}</ul>
    {/if}
    <h3 class="mt-6 text-xl font-extrabold text-[#14142B]">Controlli e avvertenze</h3>
    <p class="mt-1 text-sm text-[#6B6B85]">Come leggere la precisione degli importi: "buona" = dati certi; "discreta" = dipende da contributi futuri o da coefficienti non ancora pubblicati; "di massima" = la parte di pensione maturata prima del 1996 è stimata; "incompleta" = manca una parte del calcolo.</p>
    <ul class="mt-2 list-disc pl-5 text-sm text-[#3F3F5A]">
      {#each [...stima.controlli, ...stima.dubbi, ...stima.testo.avvertenze, ...(base.avvisi ?? [])] as v}<li>{v}</li>{/each}
    </ul>
    <p class="mt-4 text-sm text-[#6B6B85]">Stima indicativa: non sostituisce la certificazione dell'INPS. Parametri {stima.versione_parametri}.</p>
    {#if demo}
      <p class="mt-3 rounded-xl bg-white p-3 text-sm text-[#14142B]">Solo in prova: modello {stima.modello}, {stima.uso.input_tokens} token in ingresso e {stima.uso.output_tokens} in uscita, costo stimato {stima.uso.costo_stimato_usd} $.</p>
    {/if}
    <button type="button" class="mt-6 rounded-full border-2 border-[#14142B] bg-white px-6 py-3 font-bold text-[#14142B]" onclick={() => vaiA("form")}>Ricomincia la prova</button>
  {:else if fase === "prospetto" && a.richiediEstratto}
    <h2 class="mb-2 text-2xl font-extrabold text-[#14142B]">Pagamento ricevuto. Richiediamo il tuo estratto</h2>
    <p class="text-[#3F3F5A]">Con l'opzione "richiedetelo voi" il cliente riceve questo messaggio: la stima parte quando l'ufficio carica l'estratto ottenuto dall'INPS, e il cliente viene avvisato via email per controllare i contributi.</p>
    <button type="button" class="mt-6 rounded-full border-2 border-[#14142B] bg-white px-6 py-3 font-bold text-[#14142B]" onclick={() => vaiA("form")}>Ricomincia la prova</button>
  {:else if fase === "prospetto" && esempio}
    {@const r = esempio.esito}
    <h2 class="mb-2 text-2xl font-extrabold text-[#14142B]">Il tuo prospetto (esempio)</h2>
    {#if notaStima}<p class="mb-3 rounded-2xl bg-[#FFE3EC] p-4 font-semibold text-[#14142B]">{notaStima}</p>{/if}
    <p class="text-[#3F3F5A]"><strong>Dati di esempio</strong> calcolati dal motore sul caso di prova (uomo nato il 10/03/1962, dipendente privato): servono a vedere la forma del risultato, non riguardano le risposte che hai dato.</p>
    <p class="mt-4 rounded-2xl bg-[#D4FF4F] p-4 text-lg font-extrabold text-[#14142B]">Prima uscita possibile: {r.prima_uscita_pensione.canale} dal {dataIt(r.prima_uscita_pensione.decorrenza)}</p>
    <p class="mt-3 text-[#14142B]">Contributi ad oggi: <strong>{r.contributi_ad_oggi}</strong> · Sistema di calcolo: <strong>{r.sistema_calcolo}</strong></p>
    <div class="mt-4 grid gap-3">
      {#each r.canali as c}
        <div class="rounded-2xl bg-white p-4 text-[#14142B]">
          <h3 class="text-lg font-extrabold">{c.canale}</h3>
          <dl class="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <div><dt class="text-sm text-[#6B6B85]">Maturi il diritto</dt><dd class="font-semibold">{dataIt(c.data_maturazione)}</dd></div>
            <div><dt class="text-sm text-[#6B6B85]">Primo pagamento</dt><dd class="font-semibold">{dataIt(c.decorrenza)} · {c.eta_alla_decorrenza}</dd></div>
            <div><dt class="text-sm text-[#6B6B85]">Lordo mensile (13 mensilità)</dt><dd class="font-semibold">{euro(c.importo.lordo_mensile_13)}</dd></div>
            <div><dt class="text-sm text-[#6B6B85]">Netto stimato</dt><dd class="font-semibold">{euro(c.importo.netto_mensile_13_stima)} · stima {affid(c.importo.affidabilita)}</dd></div>
          </dl>
          <ul class="mt-2 list-disc pl-5 text-sm text-[#3F3F5A]">{#each c.note as n}<li>{n}</li>{/each}</ul>
        </div>
      {/each}
    </div>
    <p class="mt-4 text-sm text-[#6B6B85]">Il prospetto vero arriverà in PDF via email, con scenari, scadenze e documenti da preparare. Parametri del motore: versione {r.versione_parametri}.</p>
    <button type="button" class="mt-6 rounded-full border-2 border-[#14142B] bg-white px-6 py-3 font-bold text-[#14142B]" onclick={() => vaiA("form")}>Ricomincia la prova</button>
  {:else}
  <ol class="mb-6 flex flex-wrap gap-2" aria-label="Passi del questionario">
    {#each STEPS as s, i}
      <li
        class={`rounded-full px-3 py-1.5 text-sm font-bold ${i === step ? "bg-[#5B3DF5] text-white" : i < step ? "bg-[#D4FF4F] text-[#14142B]" : "bg-white text-[#6B6B85]"}`}
        aria-current={i === step ? "step" : undefined}
      >
        {i + 1}. {s}
      </li>
    {/each}
  </ol>

  <form onsubmit={(e) => { e.preventDefault(); step === STEPS.length - 1 ? submit() : next(); }} novalidate>
    {#if step === 0}
      <h2 class="mb-2 text-2xl font-extrabold text-[#14142B]">Carica il tuo estratto contributivo</h2>
      <p class="mb-5 text-[#3F3F5A]">Lo leggiamo subito e compiliamo noi i dati che contiene: tu controlli e rispondi solo alle domande che restano. Per leggerlo, il contenuto dell'estratto viene inviato al nostro servizio di lettura automatica; non viene conservato in questo passo.</p>
      <fieldset class="mb-5"><legend class={label}>Hai già l'estratto conto contributivo INPS?</legend>
        <div class="grid gap-2 sm:grid-cols-2" role="radiogroup">
          <label class={chip(!a.richiediEstratto)}>
            <input type="radio" class="sr-only" name="haEstratto" checked={!a.richiediEstratto} onchange={() => (a.richiediEstratto = false)} />
            Sì, lo carico io
          </label>
          <label class={chip(a.richiediEstratto)}>
            <input type="radio" class="sr-only" name="haEstratto" checked={a.richiediEstratto} onchange={() => { a.richiediEstratto = true; files.estratto = null; letto = null; compilati = []; errors = []; }} />
            No, richiedetelo voi (+{prezzoEstratto} €)
          </label>
        </div>
      </fieldset>
      {#if a.richiediEstratto}
        <div id="richiesta-estratto" class="mb-5 rounded-2xl border-2 border-[#14142B] bg-white p-4">
          <h3 class="text-lg font-extrabold text-[#14142B]">Richiediamo noi il tuo estratto contributivo</h3>
          <p class="mt-1 text-[#3F3F5A]">Costo aggiuntivo {prezzoEstratto} €, totale {totale} €. Compila il modulo qui sotto scegliendo "estratto contributivo": la stima parte quando l'INPS ce lo rende disponibile.</p>
          <p class="mt-2 text-[#3F3F5A]"><strong>Serve un po' più di tempo:</strong> gli estratti li richiediamo la mattina, dalle 9:30 alle 13:00, nei giorni di apertura dell'ufficio. Se fai la richiesta nel pomeriggio o la sera, la stima arriva dal giorno lavorativo successivo. La consulenza con un operatore, al telefono o in chat, resta inclusa nel prezzo.</p>
          {#if mandatoUrl}<p class="mt-2"><a class="font-bold text-[#4B2FE0] underline" href={mandatoUrl} target="_blank" rel="noopener">Scarica il mandato</a></p>{/if}
          {#if surveyId}
            <iframe src={`https://link.arcanis.it/widget/survey/${surveyId}`} id={surveyId} title="Richiesta estratto contributivo INPS" scrolling="no" class="mt-3 w-full border-0" style="min-height:616px"></iframe>
          {/if}
        </div>
      {/if}
      {#if !a.richiediEstratto}
        <div class="rounded-2xl bg-white p-4">
          <label class={label} for="sp-file-estratto">Estratto conto contributivo INPS (PDF)</label>
          <label class="mb-3 flex items-start gap-3 text-[#14142B]"><input id="sp-consenso-lettura" type="checkbox" class="mt-1 size-5 accent-[#5B3DF5]" bind:checked={consensoLettura} /><span>Ho letto l'<a class="font-bold underline" href="/privacy" target="_blank" rel="noopener">informativa privacy</a> e acconsento alla lettura automatica del mio estratto.</span></label>
          <input id="sp-file-estratto" type="file" accept=".pdf,.xml" disabled={!consensoLettura} class="block w-full disabled:opacity-50 text-sm text-[#3F3F5A] file:mr-3 file:rounded-full file:border-0 file:bg-[#14142B] file:px-4 file:py-2 file:font-bold file:text-white" onchange={onEstratto} />
          <p class={help}>Lo scarichi dal sito INPS con SPID o CIE: Fascicolo previdenziale → Estratto conto. Massimo {MAX_MB} MB.</p>
          {#if leggendo}<Attesa variante="lettura" />{/if}
        </div>
        {#if letto}
          <div id="estratto-letto" class="mt-4 rounded-2xl border-2 border-[#14142B] bg-white p-4 text-[#14142B]">
            <h3 class="text-lg font-extrabold">Ecco cosa abbiamo letto</h3>
            {#if modoLettura === "locale"}
              <p class="mt-2 rounded-xl bg-[#FFE3EC] p-3 text-sm font-semibold">Lettura semplificata: il servizio di lettura completa non è disponibile in questo momento, quindi i totali qui sotto potrebbero essere incompleti. Puoi proseguire: l'estratto viene riletto per intero prima del calcolo.</p>
            {/if}
            <dl class="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <div><dt class="text-sm text-[#6B6B85]">Intestatario</dt><dd class="font-semibold">{[letto.nome, letto.cognome].filter(Boolean).join(" ") || "non trovato"}</dd></div>
              <div><dt class="text-sm text-[#6B6B85]">Codice fiscale</dt><dd class="font-semibold">{letto.codiceFiscale || "non trovato"}</dd></div>
              <div><dt class="text-sm text-[#6B6B85]">Data di nascita</dt><dd class="font-semibold">{letto.nascita ? dataIt(letto.nascita) : "non trovata"}</dd></div>
              <div><dt class="text-sm text-[#6B6B85]">Estratto aggiornato al</dt><dd class="font-semibold">{letto.dataEstratto ? dataIt(letto.dataEstratto) : "non indicato"}</dd></div>
              <div><dt class="text-sm text-[#6B6B85]">Periodi trovati</dt><dd class="font-semibold">{letto.righe.length}{#if letto.anni.length} · dal {letto.anni[0].anno} al {letto.anni[letto.anni.length - 1].anno}{/if}</dd></div>
              <div><dt class="text-sm text-[#6B6B85]">Contributi letti</dt><dd class="font-semibold">{letto.totaleSettimane} settimane (circa {Math.floor(letto.totaleSettimane / 52)} anni e {Math.round((letto.totaleSettimane % 52) / 4.33)} mesi)</dd></div>
              {#if letto.totaleDichiarato}<div><dt class="text-sm text-[#6B6B85]">Totale indicato sull'estratto</dt><dd class="font-semibold">{letto.totaleDichiarato}</dd></div>{/if}
              {#if letto.gestioni?.length}<div class="sm:col-span-2"><dt class="text-sm text-[#6B6B85]">Dove hai versato</dt><dd class="font-semibold">{letto.gestioni.map((g) => `${NOMI_GESTIONE[g.codice] ?? "Altra contribuzione"}: ${g.settimane} settimane`).join(" · ")}</dd></div>{/if}
            </dl>
            {#if modoLettura === "diretta"}
              <p class="mt-2 text-sm text-[#6B6B85]">Abbiamo letto tutte le {letto.righe.length} righe del documento direttamente dal file, qui sul tuo dispositivo.</p>
            {/if}
            {#if letto.anni.length}
              <details class="mt-3">
                <summary class="cursor-pointer font-bold text-[#4B2FE0]">Vedi il dettaglio anno per anno</summary>
                <div class="mt-2 max-h-72 overflow-auto rounded-xl border border-[#E4E4EE]">
                  <table class="w-full text-left text-sm">
                    <thead class="sticky top-0 bg-[#14142B] text-white"><tr><th class="px-3 py-2">Anno</th><th class="px-3 py-2">Settimane</th><th class="px-3 py-2">di cui figurative</th><th class="px-3 py-2">Retribuzione</th></tr></thead>
                    <tbody>
                      {#each letto.anni as y}
                        <tr class="border-t border-[#E4E4EE]"><td class="px-3 py-1.5">{y.anno}</td><td class="px-3 py-1.5">{y.settimane}</td><td class="px-3 py-1.5">{y.figurative || "—"}</td><td class="px-3 py-1.5">{y.imponibile ? euro(y.imponibile) : "—"}</td></tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </details>
            {/if}
            {#if letto.righe.some((r) => r.unita)}
              <details class="mt-3">
                <summary class="cursor-pointer font-bold text-[#4B2FE0]">Vedi tutte le righe lette</summary>
                <div class="mt-2 max-h-80 overflow-auto rounded-xl border border-[#E4E4EE]">
                  <table class="w-full text-left text-xs sm:text-sm">
                    <thead class="sticky top-0 bg-[#14142B] text-white"><tr><th class="px-2 py-2">Dal</th><th class="px-2 py-2">Al</th><th class="px-2 py-2">Tipo</th><th class="px-2 py-2">Contributi</th><th class="px-2 py-2">Retribuzione</th><th class="px-2 py-2">Azienda</th><th class="px-2 py-2">Nota</th></tr></thead>
                    <tbody>
                      {#each letto.righe as r}
                        <tr class="border-t border-[#E4E4EE] align-top"><td class="whitespace-nowrap px-2 py-1.5">{dataIt(r.dal)}</td><td class="whitespace-nowrap px-2 py-1.5">{dataIt(r.al)}</td><td class="px-2 py-1.5">{r.tipo}</td><td class="whitespace-nowrap px-2 py-1.5">{r.contributi ?? "—"} {r.contributi != null ? r.unita : ""}{#if r.contributiCalcolo != null && r.contributiCalcolo !== r.contributi}<span class="text-[#6B6B85]"> ({r.contributiCalcolo} per il calcolo)</span>{/if}</td><td class="whitespace-nowrap px-2 py-1.5">{r.importo != null ? euro(r.importo) : "—"}</td><td class="px-2 py-1.5">{r.azienda || "—"}</td><td class="px-2 py-1.5">{r.nota || ""}</td></tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </details>
            {/if}
            {#if letto.legenda?.length || letto.segnalazioni?.length}
              <div class="mt-3 rounded-xl border border-[#E4E4EE] p-3 text-sm">
                {#if letto.legenda?.length}
                  <p class="font-bold">Note riportate sull'estratto</p>
                  <ul class="mt-1 space-y-1">{#each letto.legenda as v}<li><strong>{v.codice})</strong> {v.testo}</li>{/each}</ul>
                {/if}
                {#if letto.segnalazioni?.length}
                  <p class="font-bold" class:mt-3={letto.legenda?.length}>Segnalazioni dell'INPS</p>
                  <ul class="mt-1 list-disc pl-5">{#each letto.segnalazioni as v}<li>{v}</li>{/each}</ul>
                  <p class="mt-1 text-[#6B6B85]">Ne teniamo conto: un nostro operatore le valuta insieme alla stima.</p>
                {/if}
              </div>
            {/if}
            {#if letto.avvisi.length}
              <ul class="mt-3 list-disc rounded-xl bg-[#FFE3EC] py-3 pl-8 pr-4 text-sm font-semibold">{#each letto.avvisi as v}<li>{v}</li>{/each}</ul>
            {/if}
            <p class="mt-3 text-sm text-[#6B6B85]">Controlla che i totali corrispondano al tuo estratto. Se qualcosa non torna puoi proseguire lo stesso: lo verifichiamo prima del calcolo.</p>
          </div>
        {/if}
      {/if}
    {:else if step === 1}
      {#if compilati.length}
        <p class="mb-4 rounded-2xl bg-[#D4FF4F] p-3 font-semibold text-[#14142B]">Dal tuo estratto abbiamo già compilato: {compilati.join(", ")}. Controlla e correggi se serve.</p>
      {/if}
      <h2 class="mb-5 text-2xl font-extrabold text-[#14142B]">Chi sei</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div><label class={label} for="sp-nome">Nome</label><input id="sp-nome" class={input} autocomplete="given-name" bind:value={a.nome} /></div>
        <div><label class={label} for="sp-cognome">Cognome</label><input id="sp-cognome" class={input} autocomplete="family-name" bind:value={a.cognome} /></div>
        <div><label class={label} for="sp-email">Email</label><input id="sp-email" type="email" class={input} autocomplete="email" bind:value={a.email} /><p class={help}>Qui ricevi il prospetto.</p></div>
        <div><label class={label} for="sp-tel">Cellulare (facoltativo)</label><input id="sp-tel" type="tel" class={input} autocomplete="tel" bind:value={a.telefono} /></div>
        <div><label class={label} for="sp-nascita">Data di nascita</label><input id="sp-nascita" type="date" class={input} bind:value={a.nascita} /></div>
        <div><label class={label} for="sp-figli">Figli</label>
          <select id="sp-figli" class={input} bind:value={a.figli}>
            <option value="0">Nessuno</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4 o più</option>
          </select>
        </div>
      </div>
      <fieldset class="mt-4"><legend class={label}>Sesso</legend>
        {@render scelta("sesso", a.sesso, [{ v: "F", l: "Donna" }, { v: "M", l: "Uomo" }], (v) => (a.sesso = v))}
      </fieldset>
      <fieldset class="mt-4"><legend class={label}>Dove abiti?</legend>
        {@render scelta("residenza", a.residenza, [{ v: "roma", l: "Roma" }, { v: "lazio", l: "Altro comune del Lazio" }, { v: "altra-regione", l: "Altra regione" }], (v) => (a.residenza = v))}
        <p class={help}>Serve per stimare il netto: le addizionali cambiano da comune a comune.</p>
      </fieldset>
    {:else if step === 2}
      <h2 class="mb-5 text-2xl font-extrabold text-[#14142B]">Il tuo lavoro oggi</h2>
      <fieldset><legend class={label}>Qual è la tua situazione?</legend>
        {@render scelta("situazione", a.situazione, [
          { v: "privato", l: "Dipendente privato" },
          { v: "pubblico", l: "Dipendente pubblico" },
          { v: "autonomo", l: "Artigiano o commerciante" },
          { v: "separata", l: "Partita IVA o collaboratore (gestione separata)" },
          { v: "disoccupato", l: "Disoccupato" },
          { v: "altro", l: "Altro" },
        ], (v) => (a.situazione = v))}
      </fieldset>
      {#if a.situazione && !disoccupato}
        <fieldset class="mt-5"><legend class={label}>Pensi di continuare a lavorare?</legend>
          {@render scelta("continua", a.continua, [
            { v: "pensione", l: "Sì, fino alla pensione" },
            { v: "data", l: "Sì, ma fino a una certa data" },
            { v: "no", l: "No, vorrei smettere adesso" },
          ], (v) => (a.continua = v))}
        </fieldset>
        {#if a.continua === "data"}
          <div class="mt-4 max-w-xs"><label class={label} for="sp-fino">Fino a quando?</label><input id="sp-fino" type="month" class={input} bind:value={a.finoA} /></div>
        {/if}
        <div class="mt-4 max-w-xs"><label class={label} for="sp-ral">Retribuzione o reddito lordo annuo (facoltativo)</label>
          <input id="sp-ral" type="number" inputmode="numeric" min="0" step="500" class={input} placeholder="es. 28000" bind:value={a.retribuzione} />
          <p class={help}>Se non lo sai, lo ricaviamo dall'estratto o dalla busta paga.</p>
        </div>
      {/if}
      {#if disoccupato}
        <fieldset class="mt-5"><legend class={label}>NASpI</legend>
          {@render scelta("naspi", a.naspi, [
            { v: "in-corso", l: "La sto prendendo" },
            { v: "finita", l: "È finita" },
            { v: "mai", l: "Non l'ho presa" },
          ], (v) => (a.naspi = v))}
        </fieldset>
      {/if}
      <fieldset class="mt-5"><legend class={label}>La tua azienda ha proposto uscite anticipate (isopensione, fondo di solidarietà)?</legend>
        {@render scelta("esuberi", a.esuberi, [{ v: "si", l: "Sì" }, { v: "no", l: "No" }, { v: "non-so", l: "Non so" }], (v) => (a.esuberi = v))}
      </fieldset>
    {:else if step === 3}
      <h2 class="mb-5 text-2xl font-extrabold text-[#14142B]">I tuoi contributi</h2>
      {#if a.buchi.length}
        <div class="mb-5 rounded-2xl border-2 border-[#14142B] bg-white p-4">
          <h3 class="text-lg font-extrabold text-[#14142B]">Nel tuo estratto mancano dei periodi</h3>
          <p class="mt-1 text-[#3F3F5A]">Dirci cosa facevi ci aiuta a capire se quei contributi si possono recuperare.</p>
          {#each a.buchi as b, k}
            <div class="mt-3">
              <label class={label} for={`sp-buco-${k}`}>{b.da === b.a ? `Nel ${b.da}` : `Dal ${b.da} al ${b.a}`} non risultano contributi. Cosa facevi?</label>
              <select id={`sp-buco-${k}`} class={input} bind:value={b.motivo}>
                <option value="">Scegli…</option>
                {#each MOTIVI_BUCO as m}<option value={m.v}>{m.l}</option>{/each}
              </select>
            </div>
          {/each}
        </div>
      {/if}
      <fieldset><legend class={label}>Hai periodi che potrebbero non risultare nell'estratto INPS?</legend>
        <div class="grid gap-2 sm:grid-cols-2">
          {#each MANCANTI as m}
            <label class={chip(a.mancanti.includes(m.v))}>
              <input type="checkbox" class="sr-only" checked={a.mancanti.includes(m.v)} onchange={() => toggleMancante(m.v)} />
              {m.l}
            </label>
          {/each}
        </div>
        <p class={help}>Se non hai nessuno di questi periodi, vai avanti senza selezionare nulla.</p>
      </fieldset>
      {#if a.mancanti.length}
        <div class="mt-4"><label class={label} for="sp-note">Dicci quali periodi (anni e durata)</label>
          <textarea id="sp-note" rows="3" class={input} placeholder="es. militare 12 mesi nel 1985; laurea 4 anni 1982-1986" bind:value={a.mancantiNote}></textarea>
        </div>
      {/if}
      <fieldset class="mt-5"><legend class={label}>Hai lavorato almeno 12 mesi, con contributi, prima di compiere 19 anni?</legend>
        {@render scelta("precoce", a.precoce, [{ v: "si", l: "Sì" }, { v: "no", l: "No" }, { v: "non-so", l: "Non so" }], (v) => (a.precoce = v))}
      </fieldset>
    {:else if step === 4}
      <h2 class="mb-5 text-2xl font-extrabold text-[#14142B]">Salute, famiglia e mansioni</h2>
      <p class="mb-5 text-[#3F3F5A]">Queste risposte servono a capire se hai diritto a uscite anticipate come APE sociale, lavoratori precoci o pensione di vecchiaia per invalidi.</p>
      <fieldset><legend class={label}>Hai un'invalidità riconosciuta?</legend>
        {@render scelta("invalidita", a.invalidita, [
          { v: "no", l: "No" },
          { v: "civile", l: "Sì, invalidità civile" },
          { v: "pensionabile", l: "Sì, invalidità riconosciuta dall'INPS ai fini pensionistici" },
          { v: "in-corso", l: "Domanda in corso" },
        ], (v) => (a.invalidita = v))}
      </fieldset>
      {#if haInvalidita}
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label class={label} for="sp-pct">Percentuale</label><input id="sp-pct" type="number" min="1" max="100" class={input} placeholder="es. 75" bind:value={a.invaliditaPct} /></div>
          <div><label class={label} for="sp-idata">Data del verbale (facoltativa)</label><input id="sp-idata" type="date" class={input} bind:value={a.invaliditaData} /></div>
        </div>
      {/if}
      <fieldset class="mt-5"><legend class={label}>Assisti un familiare convivente con handicap grave (legge 104, art. 3 comma 3)?</legend>
        {@render scelta("caregiver", a.caregiver, [
          { v: "no", l: "No" },
          { v: "si-6", l: "Sì, da almeno 6 mesi" },
          { v: "si-meno", l: "Sì, da meno di 6 mesi" },
        ], (v) => (a.caregiver = v))}
      </fieldset>
      <fieldset class="mt-5"><legend class={label}>Svolgi o hai svolto lavori gravosi o usuranti?</legend>
        {@render scelta("mansione", a.mansione, [
          { v: "no", l: "No" },
          { v: "gravosa", l: "Sì, mansione gravosa (es. edilizia, infermieri turnisti, autisti, pulizie)" },
          { v: "usurante", l: "Sì, lavoro usurante o notturno" },
          { v: "non-so", l: "Non so" },
        ], (v) => (a.mansione = v))}
      </fieldset>
      {#if haMansione}
        <div class="mt-4 max-w-xs"><label class={label} for="sp-manni">Per quanti degli ultimi 10 anni?</label><input id="sp-manni" type="number" min="0" max="10" class={input} bind:value={a.mansioneAnni} /></div>
      {/if}
      <fieldset class="mt-5"><legend class={label}>Qual è il tuo obiettivo?</legend>
        {@render scelta("obiettivo", a.obiettivo, [
          { v: "prima", l: "Uscire il prima possibile" },
          { v: "importo", l: "Avere l'importo più alto" },
          { v: "capire", l: "Capire tutte le possibilità" },
        ], (v) => (a.obiettivo = v))}
      </fieldset>
    {:else if step === 5}
      <h2 class="mb-2 text-2xl font-extrabold text-[#14142B]">Altri documenti</h2>
      <p class="mb-5 text-[#3F3F5A]">Sono tutti facoltativi, ma rendono la stima più precisa.</p>
      <div class="flex flex-col gap-4">
        {#each DOCS.filter((d) => d.key !== "estratto") as d}
          <div class="rounded-2xl bg-white p-4">
            <label class={label} for={`sp-file-${d.key}`}>{d.label} {#if d.required}<span class="text-[#5B3DF5]">(obbligatorio)</span>{:else}<span class="font-normal text-[#6B6B85]">(facoltativo)</span>{/if}</label>
            <input id={`sp-file-${d.key}`} type="file" accept={d.accept} class="block w-full text-sm text-[#3F3F5A] file:mr-3 file:rounded-full file:border-0 file:bg-[#14142B] file:px-4 file:py-2 file:font-bold file:text-white" onchange={(e) => onFile(d.key, e)} />
            <p class={help}>{d.hint} Massimo {MAX_MB} MB.</p>
            {#if files[d.key]}<p class="mt-1 text-sm font-semibold text-[#128C45]">Selezionato: {files[d.key]?.name}</p>{/if}
          </div>
        {/each}
      </div>
    {:else}
      <h2 class="mb-5 text-2xl font-extrabold text-[#14142B]">Riepilogo e pagamento</h2>
      <dl class="grid gap-x-6 gap-y-2 rounded-2xl bg-white p-4 text-[#14142B] sm:grid-cols-2">
        <div><dt class="text-sm text-[#6B6B85]">Nome</dt><dd class="font-semibold">{a.nome} {a.cognome}</dd></div>
        <div><dt class="text-sm text-[#6B6B85]">Email</dt><dd class="font-semibold break-all">{a.email}</dd></div>
        <div><dt class="text-sm text-[#6B6B85]">Data di nascita</dt><dd class="font-semibold">{a.nascita ? new Date(a.nascita).toLocaleDateString("it-IT") : ""}</dd></div>
        <div><dt class="text-sm text-[#6B6B85]">Documenti caricati</dt><dd class="font-semibold">{Object.values(files).filter(Boolean).length}</dd></div>
        <div><dt class="text-sm text-[#6B6B85]">Estratto contributivo</dt><dd class="font-semibold">{a.richiediEstratto ? `Lo richiediamo noi (+${prezzoEstratto} €)` : "Caricato da te"}</dd></div>
        <div><dt class="text-sm text-[#6B6B85]">Totale</dt><dd class="font-semibold">{price}</dd></div>
      </dl>
      <p class="mt-4 rounded-2xl bg-[#F1EEFF] p-4 text-[#14142B]">Al pagamento può pagare anche un'altra persona (un figlio, il coniuge) con la propria email e la propria carta: dopo il pagamento torni qui e la stima resta collegata a te.</p>
      <div class="mt-5 flex flex-col gap-3 text-[#14142B]">
        <label class="flex items-start gap-3"><input type="checkbox" class="mt-1 size-5 accent-[#5B3DF5]" bind:checked={a.privacy} /><span>Ho letto l'<a class="font-bold underline" href="/privacy" target="_blank" rel="noopener">informativa privacy</a>.</span></label>
        <label class="flex items-start gap-3"><input type="checkbox" class="mt-1 size-5 accent-[#5B3DF5]" bind:checked={a.salute} /><span>Acconsento al trattamento dei dati sulla salute che ho indicato (invalidità, assistenza a familiari), al solo scopo di elaborare la stima.</span></label>
        <label class="flex items-start gap-3"><input type="checkbox" class="mt-1 size-5 accent-[#5B3DF5]" bind:checked={a.condizioni} /><span>Accetto le condizioni del servizio: ricevo una stima indicativa, che non sostituisce la certificazione dell'INPS e non è una domanda di pensione.</span></label>
      </div>
      {#if !apiUrl && !demo}
        <p class="mt-5 rounded-2xl bg-[#FFE3EC] p-4 font-semibold text-[#14142B]">Il servizio è in fase di attivazione: l'invio dei documenti e il pagamento non sono ancora disponibili. Nessun dato è stato inviato.</p>
      {/if}
      {#if sending}<Attesa variante="invio" />{/if}
      {#if sendError}<p class="mt-5 rounded-2xl bg-[#FFE3EC] p-4 font-semibold text-[#14142B]" role="alert">{sendError}</p>{/if}
    {/if}

    {#if errors.length}
      <ul class="mt-5 rounded-2xl bg-[#FFE3EC] p-4 font-semibold text-[#14142B]" role="alert">
        {#each errors as e}<li>{e}</li>{/each}
      </ul>
    {/if}

    <div class="mt-7 flex flex-wrap items-center justify-between gap-3">
      {#if step > 0}
        <button type="button" class="rounded-full border-2 border-[#14142B] bg-white px-6 py-3 font-bold text-[#14142B] hover:bg-[#14142B] hover:text-white" onclick={back}>Indietro</button>
      {:else}<span></span>{/if}
      {#if step < STEPS.length - 1}
        <button type="submit" class="rounded-full bg-[#5B3DF5] px-7 py-3 font-bold text-white shadow-[0_6px_0_#14142B] transition-all hover:translate-y-[3px] hover:shadow-[0_3px_0_#14142B]">Avanti</button>
      {:else}
        <button type="submit" disabled={(!apiUrl && !demo) || sending} class="rounded-full bg-[#5B3DF5] px-7 py-3 font-bold text-white shadow-[0_6px_0_#14142B] transition-all hover:translate-y-[3px] hover:shadow-[0_3px_0_#14142B] disabled:cursor-not-allowed disabled:opacity-50">
          {sending ? "Invio in corso…" : `Invia e vai al pagamento (${price})`}
        </button>
        {#if demo}
          <button type="button" class="rounded-full border-2 border-dashed border-[#14142B] bg-white px-6 py-3 font-bold text-[#14142B]" onclick={() => { errors = validate(6); if (!errors.length) vaiA("pagamento"); }}>Prova rapida senza salvare</button>
        {/if}
      {/if}
    </div>
  </form>
  {/if}
</div>
