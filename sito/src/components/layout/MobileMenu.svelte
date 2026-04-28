<script lang="ts">
  interface NavItem {
    label: string;
    href: string;
    children?: { label: string; href: string }[];
  }

  interface Props {
    items: NavItem[];
    bookingUrl: string;
    phoneRaw: string;
    whatsappLink: string;
  }

  let { items, bookingUrl, phoneRaw, whatsappLink }: Props = $props();

  let open = $state(false);
  let openSub = $state<number | null>(null);

  function toggle() {
    open = !open;
    if (!open) openSub = null;
    document.body.style.overflow = open ? "hidden" : "";
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape" && open) toggle();
  }
</script>

<svelte:window onkeydown={handleKey} />

<button
  type="button"
  class="md:hidden inline-flex items-center justify-center rounded-md p-2 text-[var(--color-brand-900)] hover:bg-[var(--color-brand-50)]"
  aria-expanded={open}
  aria-controls="mobile-menu-panel"
  aria-label={open ? "Chiudi menu" : "Apri menu"}
  onclick={toggle}
>
  {#if open}
    <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  {:else}
    <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  {/if}
</button>

{#if open}
  <div
    id="mobile-menu-panel"
    class="fixed inset-x-0 top-[64px] bottom-0 z-50 overflow-y-auto bg-white md:hidden"
    role="dialog"
    aria-modal="true"
    aria-label="Menu di navigazione"
  >
    <nav class="px-4 py-6">
      <ul class="space-y-1">
        {#each items as item, i}
          <li>
            {#if item.children}
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-md px-4 py-3 text-left text-lg font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]"
                aria-expanded={openSub === i}
                onclick={() => (openSub = openSub === i ? null : i)}
              >
                <span>{item.label}</span>
                <svg
                  class="size-5 transition-transform {openSub === i ? 'rotate-180' : ''}"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 0 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clip-rule="evenodd" />
                </svg>
              </button>
              {#if openSub === i}
                <ul class="ml-4 mt-1 space-y-1 border-l-2 border-[var(--color-brand-100)] pl-4">
                  <li>
                    <a href={item.href} class="block rounded px-3 py-2 text-base font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-surface-soft)]">
                      Panoramica {item.label}
                    </a>
                  </li>
                  {#each item.children as child}
                    <li>
                      <a href={child.href} class="block rounded px-3 py-2 text-base text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-soft)]">
                        {child.label}
                      </a>
                    </li>
                  {/each}
                </ul>
              {/if}
            {:else}
              <a
                href={item.href}
                class="block rounded-md px-4 py-3 text-lg font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]"
              >
                {item.label}
              </a>
            {/if}
          </li>
        {/each}
      </ul>

      <div class="mt-8 space-y-3 border-t border-[var(--color-border)] pt-6">
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener"
          class="flex items-center justify-center gap-2 rounded-md bg-[var(--color-brand-900)] px-5 py-3 text-base font-semibold text-white hover:bg-[var(--color-brand-800)]"
        >
          Prenota appuntamento
        </a>
        <div class="grid grid-cols-2 gap-3">
          <a
            href={`tel:${phoneRaw}`}
            class="flex items-center justify-center gap-2 rounded-md border border-[var(--color-brand-200)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-brand-900)] hover:border-[var(--color-brand-400)]"
          >
            Chiama
          </a>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener"
            class="flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1ebe5a]"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </nav>
  </div>
{/if}
