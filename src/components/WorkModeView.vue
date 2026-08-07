<script setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import LedgerTable from './LedgerTable.vue'
import { weekCodeLabel, weekCodesSorted } from '../api/sheets'
import { buildLedgerGroups, initialWeekCode } from '../api/ledger'

const props = defineProps({
  index: { type: Object, required: true },
  companies: { type: Array, required: true },
  weekCode: { type: String, required: true }
})

const emit = defineEmits(['exit'])

const root = ref(null)
const codes = computed(() => weekCodesSorted(props.index))
const selected = ref('')

watch(
  [codes, () => props.weekCode],
  ([availableCodes, preferredCode]) => {
    selected.value = initialWeekCode(availableCodes, preferredCode)
  },
  { immediate: true }
)

function step(dir) {
  const i = codes.value.indexOf(selected.value)
  if (i === -1) {
    selected.value = codes.value[0]
    return
  }
  const ni = Math.min(codes.value.length - 1, Math.max(0, i + dir))
  selected.value = codes.value[ni]
}

const grouped = computed(() => buildLedgerGroups(props.companies, props.index, selected.value))

function exit() {
  emit('exit')
}

function handleKeydown(event) {
  if (event.key === 'Escape') exit()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  const request = root.value?.requestFullscreen?.()
  request?.catch?.(() => {})
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (document.fullscreenElement) {
    const request = document.exitFullscreen?.()
    request?.catch?.(() => {})
  }
})
</script>

<template>
  <div ref="root" class="fixed inset-0 z-[60] overflow-auto bg-background">
    <div class="sticky inset-x-0 top-0 z-50 flex items-center gap-2 border-b border-border bg-header/95 px-3 py-2 backdrop-blur">
      <button
        class="rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        @click="step(-1)"
      >‹
      </button>
      <select
        v-model="selected"
        class="min-w-32 rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
      >
        <option v-for="c in codes" :key="c" :value="c">{{ weekCodeLabel(c) }}</option>
      </select>
      <button
        class="rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        @click="step(1)"
      >›
      </button>
      <span class="ml-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {{ weekCodeLabel(selected) }}
      </span>
      <button
        class="ml-auto rounded-md border border-bad/40 bg-bad px-3 py-1 font-sans text-xs font-semibold text-bad transition-colors hover:opacity-90"
        @click="exit"
      >
        Exit work mode
      </button>
    </div>

    <div class="space-y-3 px-3 pb-8 pt-16">
      <LedgerTable
        v-for="g in grouped"
        :key="g.name"
        :title="g.name"
        :tab="g.tab"
        :rows="g.rows"
      />
    </div>
  </div>
</template>
