<script lang="ts">
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
  }
  let { apiUrl = "", prezzo = 60, prezzoEstratto = 5, surveyId = "", mandatoUrl = "" }: Props = $props();

  const MAX_MB = 10;
  const STEPS = ["Tu", "Lavoro", "Contributi", "Salute e famiglia", "Documenti", "Riepilogo"];

  let step = $state(0);
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
      if (!a.nome.trim() || !a.cognome.trim()) e.push("Inserisci nome e cognome.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) e.push("Inserisci un indirizzo email valido: lì ricevi il prospetto.");
      if (!a.nascita) e.push("Inserisci la data di nascita.");
      else {
        const anni = (Date.now() - new Date(a.nascita).getTime()) / 31557600000;
        if (anni < 18 || anni > 100) e.push("Controlla la data di nascita.");
      }
      if (!a.sesso) e.push("Indica il sesso: i requisiti della pensione anticipata sono diversi.");
    }
    if (s === 1) {
      if (!a.situazione) e.push("Indica la tua situazione lavorativa.");
      if (!disoccupato && a.situazione && !a.continua) e.push("Indica se pensi di continuare a lavorare.");
      if (a.continua === "data" && !a.finoA) e.push("Indica fino a quando pensi di lavorare.");
      if (disoccupato && !a.naspi) e.push("Indica la situazione della NASpI.");
    }
    if (s === 2) {
      if (!a.precoce) e.push("Rispondi alla domanda sul lavoro prima dei 19 anni.");
    }
    if (s === 3) {
      if (!a.invalidita) e.push("Rispondi alla domanda sull'invalidità.");
      if (haInvalidita && !a.invaliditaPct) e.push("Indica la percentuale di invalidità.");
      if (!a.caregiver) e.push("Rispondi alla domanda sull'assistenza a un familiare.");
      if (!a.mansione) e.push("Rispondi alla domanda sulle mansioni.");
      if (!a.obiettivo) e.push("Indica il tuo obiettivo.");
    }
    if (s === 4) {
      if (!files.estratto && !a.richiediEstratto) e.push("Carica l'estratto conto contributivo INPS oppure scegli di farlo richiedere a noi.");
    }
    if (s === 5) {
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

  async function submit() {
    errors = validate(5);
    if (errors.length || !apiUrl) return;
    sending = true;
    sendError = "";
    try {
      const body = new FormData();
      body.append("risposte", JSON.stringify(a));
      for (const [k, f] of Object.entries(files)) if (f) body.append(k, f, f.name);
      const res = await fetch(apiUrl, { method: "POST", body });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { next?: string };
      if (!data.next) throw new Error("risposta incompleta");
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
    {:else if step === 1}
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
    {:else if step === 2}
      <h2 class="mb-5 text-2xl font-extrabold text-[#14142B]">I tuoi contributi</h2>
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
    {:else if step === 3}
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
    {:else if step === 4}
      <h2 class="mb-5 text-2xl font-extrabold text-[#14142B]">I documenti</h2>
      <fieldset class="mb-5"><legend class={label}>Hai già l'estratto conto contributivo INPS?</legend>
        <div class="grid gap-2 sm:grid-cols-2" role="radiogroup">
          <label class={chip(!a.richiediEstratto)}>
            <input type="radio" class="sr-only" name="haEstratto" checked={!a.richiediEstratto} onchange={() => (a.richiediEstratto = false)} />
            Sì, lo carico io
          </label>
          <label class={chip(a.richiediEstratto)}>
            <input type="radio" class="sr-only" name="haEstratto" checked={a.richiediEstratto} onchange={() => { a.richiediEstratto = true; files.estratto = null; errors = []; }} />
            No, richiedetelo voi (+{prezzoEstratto} €)
          </label>
        </div>
      </fieldset>
      {#if a.richiediEstratto}
        <div id="richiesta-estratto" class="mb-5 rounded-2xl border-2 border-[#14142B] bg-white p-4">
          <h3 class="text-lg font-extrabold text-[#14142B]">Richiediamo noi il tuo estratto contributivo</h3>
          <p class="mt-1 text-[#3F3F5A]">Costo aggiuntivo {prezzoEstratto} €, totale {totale} €. Compila il modulo qui sotto scegliendo "estratto contributivo": la stima parte quando l'INPS ce lo rende disponibile.</p>
          {#if mandatoUrl}<p class="mt-2"><a class="font-bold text-[#4B2FE0] underline" href={mandatoUrl} target="_blank" rel="noopener">Scarica il mandato</a></p>{/if}
          {#if surveyId}
            <iframe src={`https://link.arcanis.it/widget/survey/${surveyId}`} id={surveyId} title="Richiesta estratto contributivo INPS" scrolling="no" class="mt-3 w-full border-0" style="min-height:616px"></iframe>
          {/if}
        </div>
      {/if}
      <div class="flex flex-col gap-4">
        {#each DOCS.filter((d) => !(a.richiediEstratto && d.key === "estratto")) as d}
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
      <div class="mt-5 flex flex-col gap-3 text-[#14142B]">
        <label class="flex items-start gap-3"><input type="checkbox" class="mt-1 size-5 accent-[#5B3DF5]" bind:checked={a.privacy} /><span>Ho letto l'<a class="font-bold underline" href="/privacy" target="_blank" rel="noopener">informativa privacy</a>.</span></label>
        <label class="flex items-start gap-3"><input type="checkbox" class="mt-1 size-5 accent-[#5B3DF5]" bind:checked={a.salute} /><span>Acconsento al trattamento dei dati sulla salute che ho indicato (invalidità, assistenza a familiari), al solo scopo di elaborare la stima.</span></label>
        <label class="flex items-start gap-3"><input type="checkbox" class="mt-1 size-5 accent-[#5B3DF5]" bind:checked={a.condizioni} /><span>Accetto le condizioni del servizio: ricevo una stima indicativa, che non sostituisce la certificazione dell'INPS e non è una domanda di pensione.</span></label>
      </div>
      {#if !apiUrl}
        <p class="mt-5 rounded-2xl bg-[#FFE3EC] p-4 font-semibold text-[#14142B]">Il servizio è in fase di attivazione: l'invio dei documenti e il pagamento non sono ancora disponibili. Nessun dato è stato inviato.</p>
      {/if}
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
        <button type="submit" disabled={!apiUrl || sending} class="rounded-full bg-[#5B3DF5] px-7 py-3 font-bold text-white shadow-[0_6px_0_#14142B] transition-all hover:translate-y-[3px] hover:shadow-[0_3px_0_#14142B] disabled:cursor-not-allowed disabled:opacity-50">
          {sending ? "Invio in corso…" : `Invia e vai al pagamento (${price})`}
        </button>
      {/if}
    </div>
  </form>
</div>
