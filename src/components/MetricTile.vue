<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  sub: { type: String, default: '' },
  icon: { type: String, default: '' }, // inline SVG path markup
  tone: { type: String, default: 'neutral' }, // neutral | pos | neg | warn
  glow: { type: Boolean, default: false }
})

const toneClass = computed(() => {
  const map = {
    neutral: 'text-foreground',
    pos: 'text-money-pos',
    neg: 'text-money-neg',
    warn: 'text-warn'
  }
  return map[props.tone] || 'text-foreground'
})
</script>

<template>
  <div
    class="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-panel"
    :class="glow && 'shadow-glow'"
  >
    <div v-if="glow" class="pointer-events-none absolute inset-0 bg-[var(--gradient-glow)]"></div>

    <div class="flex items-start justify-between">
      <span class="label">{{ label }}</span>
      <span
        v-if="icon"
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"
        v-html="icon"
      ></span>
    </div>

    <div class="mt-2 font-mono text-2xl font-semibold tracking-tight" :class="toneClass">
      {{ value }}
    </div>

    <div v-if="sub" class="mt-1 font-mono text-[11px] text-muted-foreground">{{ sub }}</div>
  </div>
</template>