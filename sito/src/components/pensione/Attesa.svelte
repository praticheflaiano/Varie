<script lang="ts">
  // Riquadro di attesa della stima pensione: foglio "letto" da una riga luminosa, passi che si
  // spuntano, tempo trascorso. Lettura e calcolo sono una sola richiesta al server, che non
  // comunica l'avanzamento: i passi avanzano sulle durate misurate nelle prove e l'ultimo resta
  // acceso finché l'attesa non finisce. Niente percentuali inventate.
  import { onMount } from "svelte";

  type Variante = "lettura" | "invio" | "calcolo";
  interface Props {
    variante: Variante;
    /** Se indicato, il riquadro parte nascosto e si accende/spegne con un evento della finestra
     *  (`new CustomEvent(evento, { detail: true | false })`): serve alle pagine senza Svelte. */
    evento?: string;
  }
  let { variante, evento = "" }: Props = $props();

  const TESTI: Record<Variante, { titolo: string; durata: string; nota: string; passi: [string, number][] }> = {
    lettura: {
      titolo: "Stiamo leggendo il tuo estratto",
      durata: "Di solito bastano 20-30 secondi",
      nota: "Puoi restare su questa pagina: i dati letti compaiono qui sotto.",
      passi: [["Carichiamo il file", 3], ["Leggiamo le pagine", 9], ["Riconosciamo periodi e settimane", 0]],
    },
    invio: {
      titolo: "Stiamo salvando la tua richiesta",
      durata: "Pochi secondi",
      nota: "Non chiudere la pagina: tra un attimo passi al pagamento.",
      passi: [["Prepariamo i documenti", 2], ["Li salviamo nell'archivio riservato", 6], ["Ti portiamo al pagamento", 0]],
    },
    calcolo: {
      titolo: "Stiamo calcolando la tua stima",
      durata: "Di solito servono da 2 a 5 minuti",
      nota: "Tieni aperta questa pagina. Se la chiudi non perdi nulla: la stima la ritrovi riaprendo questo indirizzo.",
      passi: [["Rileggiamo l'estratto riga per riga", 50], ["Calcoliamo date e importi di ogni strada", 25], ["Confrontiamo le alternative", 30], ["Scriviamo il prospetto", 0]],
    },
  };
  const t = $derived(TESTI[variante]);

  let attiva = $state(false);
  let secondi = $state(0);
  let timer: ReturnType<typeof setInterval> | undefined;
  const corrente = $derived.by(() => {
    let somma = 0;
    for (let i = 0; i < t.passi.length - 1; i++) {
      somma += t.passi[i][1];
      if (secondi < somma) return i;
    }
    return t.passi.length - 1;
  });
  const trascorso = $derived(`${Math.floor(secondi / 60)}:${String(secondi % 60).padStart(2, "0")}`);

  function accendi(si: boolean) {
    if (si === attiva) return;
    attiva = si;
    clearInterval(timer);
    if (si) {
      secondi = 0;
      timer = setInterval(() => (secondi += 1), 1000);
    }
  }
  onMount(() => {
    if (!evento) {
      accendi(true);
      return () => clearInterval(timer);
    }
    const ascolta = (e: Event) => accendi(Boolean((e as CustomEvent).detail));
    window.addEventListener(evento, ascolta);
    if ((window as unknown as { stimaAttesa?: boolean }).stimaAttesa) accendi(true);
    return () => { window.removeEventListener(evento, ascolta); clearInterval(timer); };
  });
</script>

{#if attiva}
  <div class="attesa" role="status" aria-live="polite">
    <div class="foglio" aria-hidden="true">
      <span class="riga corta"></span><span class="riga"></span><span class="riga"></span><span class="riga media"></span><span class="riga"></span><span class="riga corta"></span>
      <span class="luce"></span>
    </div>
    <div class="testo">
      <p class="titolo">{t.titolo}</p>
      <p class="durata">{t.durata}<span aria-hidden="true">&nbsp;· trascorso {trascorso}</span></p>
      <ol class="passi">
        {#each t.passi as p, i}
          <li class={i < corrente ? "fatto" : i === corrente ? "ora" : "dopo"}>
            <span class="segno" aria-hidden="true">{#if i < corrente}✓{:else if i === corrente}<span class="giro"></span>{/if}</span>
            <span>{p[0]}{#if i < corrente}<span class="sr-only"> (fatto)</span>{:else if i === corrente}<span class="sr-only"> (in corso)</span>{/if}</span>
          </li>
        {/each}
      </ol>
      <p class="nota">{t.nota}</p>
    </div>
  </div>
{/if}

<style>
  .attesa { display: flex; gap: 20px; align-items: flex-start; margin-top: 16px; padding: 20px; border: 2px solid #14142b; border-radius: 24px; background: #fff; color: #14142b; box-shadow: 0 6px 0 #14142b; }
  .foglio { position: relative; flex: none; width: 76px; height: 98px; padding: 14px 12px; border: 2px solid #14142b; border-radius: 10px; background: #f7f7fb; overflow: hidden; display: flex; flex-direction: column; gap: 8px; }
  .riga { display: block; height: 6px; border-radius: 3px; background: #c9c9da; }
  .riga.corta { width: 55%; }
  .riga.media { width: 80%; }
  .luce { position: absolute; left: 0; right: 0; top: 0; height: 26px; background: linear-gradient(180deg, rgba(91, 61, 245, 0) 0%, rgba(91, 61, 245, 0.35) 70%, #5b3df5 100%); border-bottom: 3px solid #d4ff4f; animation: scorri 1.8s ease-in-out infinite; }
  .testo { min-width: 0; flex: 1; }
  .titolo { font-size: 1.25rem; font-weight: 800; line-height: 1.2; }
  .durata { margin-top: 4px; font-size: 0.9rem; font-weight: 600; color: #4b2fe0; font-variant-numeric: tabular-nums; }
  .passi { margin-top: 12px; display: grid; gap: 8px; }
  .passi li { display: flex; align-items: center; gap: 10px; font-weight: 600; }
  .passi li.dopo { color: #8a8aa3; font-weight: 500; }
  .passi li.ora { font-weight: 800; }
  .segno { flex: none; width: 24px; height: 24px; border-radius: 999px; display: grid; place-items: center; font-size: 0.85rem; font-weight: 800; border: 2px solid #c9c9da; }
  .fatto .segno { background: #d4ff4f; border-color: #14142b; }
  .ora .segno { border-color: #5b3df5; }
  .giro { width: 12px; height: 12px; border-radius: 999px; border: 3px solid #5b3df5; border-top-color: transparent; animation: gira 0.8s linear infinite; }
  .nota { margin-top: 12px; font-size: 0.9rem; color: #3f3f5a; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @keyframes scorri { 0% { transform: translateY(-26px); } 100% { transform: translateY(98px); } }
  @keyframes gira { to { transform: rotate(360deg); } }
  @media (max-width: 480px) { .attesa { flex-direction: column; align-items: center; } .testo { width: 100%; } }
  @media (prefers-reduced-motion: reduce) {
    .luce { animation: none; top: 36px; }
    .giro { animation: none; border-top-color: #5b3df5; }
  }
</style>
