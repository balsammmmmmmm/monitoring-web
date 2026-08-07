<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  done: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
  hint: { type: String, default: '' }
})

const R = 34
const CIRC = 2 * Math.PI * R

const pct = computed(() => {
  if (!props.total) return 0
  return Math.round((props.done / props.total) * 100)
})

const dash = computed(() => {
  const frac = Math.min(1, Math.max(0, props.total ? props.done / props.total : 0))
  return `${CIRC * frac} ${CIRC}`
})
</script>

<template>
  <div class="rounded-xl border border-border bg-card p-4 shadow-panel">
    <div class="flex items-center gap-4">
      <div class="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 84 84" class="h-20 w-20 -rotate-90">
          <circle
            cx="42" cy="42" :r="R"
            fill="none" stroke="var(--secondary)" stroke-width="7"
          />
          <circle
            cx="42" cy="42" :r="R"
            fill="none" stroke="var(--primary)" stroke-width="7"
            stroke-linecap="round"
            :stroke-dasharray="dash"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="font-mono text-lg font-semibold text-foreground">{{ pct }}%</span>
          <span class="font-mono text-[10px] text-muted-foreground">{{ done }}/{{ total }}</span>
        </div>
      </div>

      <div class="min-w-0">
        <div class="label">{{ label }}</div>
        <div v-if="hint" class="mt-1 font-mono text-xs text-muted-foreground">{{ hint }}</div>
      </div>
    </div>
  </div>
</template>