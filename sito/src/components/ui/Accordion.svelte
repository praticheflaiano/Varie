<script lang="ts">
  interface Item {
    question: string;
    answer: string;
  }

  interface Props {
    items: Item[];
    multipleOpen?: boolean;
  }

  let { items, multipleOpen = false }: Props = $props();

  let openIndices = $state<Set<number>>(new Set());

  function toggle(index: number) {
    if (openIndices.has(index)) {
      openIndices.delete(index);
    } else {
      if (!multipleOpen) openIndices.clear();
      openIndices.add(index);
    }
    openIndices = new Set(openIndices);
  }
</script>

<div class="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)]">
  {#each items as item, i}
    {@const isOpen = openIndices.has(i)}
    <div>
      <h3>
        <button
          type="button"
          class="flex w-full items-start justify-between gap-4 px-6 py-5 text-left font-display text-lg font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] focus-visible:bg-[var(--color-surface-soft)]"
          aria-expanded={isOpen}
          aria-controls={`accordion-panel-${i}`}
          id={`accordion-trigger-${i}`}
          onclick={() => toggle(i)}
        >
          <span>{item.question}</span>
          <svg
            class="mt-1 size-5 shrink-0 text-[var(--color-brand-600)] transition-transform duration-200"
            class:rotate-180={isOpen}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 0 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </h3>
      {#if isOpen}
        <div
          id={`accordion-panel-${i}`}
          role="region"
          aria-labelledby={`accordion-trigger-${i}`}
          class="px-6 pb-5 -mt-1 text-[var(--color-ink-soft)] leading-relaxed"
        >
          {@html item.answer}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .rotate-180 {
    transform: rotate(180deg);
  }
</style>
