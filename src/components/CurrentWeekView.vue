<script setup>
import { ref, computed, watch } from 'vue'
import MetricTile from './MetricTile.vue'
import GaugeTile from './GaugeTile.vue'
import LedgerTable from './LedgerTable.vue'
import {
  formatCurrency,
  weekCodeLabel,
  weekCodesSorted,
  deriveStatus
} from '../api/sheets'
import { buildLedgerGroups, buildLedgerRows, initialWeekCode } from '../api/ledger'

const showKpis = ref(false)

const props = defineProps({
  index: { type: Object, required: true },
  companies: { type: Array, required: true },
  weekCode: { type: String, required: true }
})

const codes = computed(() => weekCodesSorted(props.index))
const selected = ref('')
const hasData = computed(() => codes.value.length > 0)

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

const rows = computed(() => buildLedgerRows(props.companies, props.index, selected.value))

const withData = computed(() => rows.value.filter((r) => r.week))

const totals = computed(() => {
  let rev = 0
  let exp = 0
  let hours = 0
  for (const r of withData.value) {
    rev += r.week.checkAmt || 0
    exp += r.week.totalAmt || 0
    hours += r.week.hours || 0
  }
  return { rev, exp, net: rev - exp, hours }
})

const doneCount = computed(() => withData.value.filter((r) => deriveStatus(r.week) === 'DONE').length)
const invoicedCount = computed(() => withData.value.filter((r) => r.week.invoice).length)
const payCount = computed(() => withData.value.filter((r) => r.week.pay).length)

const grouped = computed(() => buildLedgerGroups(props.companies, props.index, selected.value))

const ICONS = {
  revenue:
    '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v5h-5"/></svg>',
  expenses:
    '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l6 6 4-4 8 8"/><path d="M21 17h-5"/></svg>',
  margin:
    '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
}
</script>

<template>
  <div class="space-y-4">
    <!-- Week switcher -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <button
          class="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-sm text-foreground shadow-panel transition-colors hover:bg-secondary disabled:opacity-40"
          :disabled="!hasData"
          @click="step(-1)"
        >
          ‹
        </button>
        <select
          v-model="selected"
          class="min-w-44 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-sm text-foreground shadow-panel focus:border-primary focus:outline-none"
        >
          <option v-for="c in codes" :key="c" :value="c">{{ weekCodeLabel(c) }}</option>
        </select>
        <button
          class="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-sm text-foreground shadow-panel transition-colors hover:bg-secondary disabled:opacity-40"
          :disabled="!hasData"
          @click="step(1)"
        >
          ›
        </button>
        <button
          v-if="selected !== weekCode && codes.includes(weekCode)"
          class="rounded-lg border border-primary bg-primary px-3 py-1.5 font-sans text-sm font-semibold text-primary-foreground shadow-panel transition-colors hover:opacity-90"
          @click="selected = weekCode"
        >
          Back to current
        </button>
      </div>
      <span class="ml-auto flex items-center gap-3">
        <span class="font-mono text-xs text-muted-foreground">
          {{ hasData ? `${codes.length} weeks on record` : 'No week data yet.' }}
        </span>
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 font-sans text-sm font-semibold text-foreground shadow-panel transition-colors hover:bg-secondary"
          @click="showKpis = !showKpis"
        >
          <span
            class="inline-block h-2 w-2 rounded-full transition-transform"
            :class="showKpis ? 'rotate-90 bg-primary' : 'bg-muted-foreground'"
          ></span>
          {{ showKpis ? 'Hide KPI metrics' : 'Show KPI metrics' }}
        </button>
      </span>
    </div>

    <!-- KPI tiles + gauges (hidden until toggled) -->
    <template v-if="showKpis">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Revenue"
          :value="formatCurrency(totals.rev)"
          :sub="`Week ${weekCodeLabel(selected)}`"
          :icon="ICONS.revenue"
          tone="pos"
          glow
        />
        <MetricTile
          label="Expenses"
          :value="formatCurrency(totals.exp)"
          :icon="ICONS.expenses"
          tone="neutral"
        />
        <MetricTile
          label="Hours"
          :value="`${totals.hours.toLocaleString()}h`"
          :sub="`Week ${weekCodeLabel(selected)}`"
          :icon="ICONS.margin"
          tone="pos"
        />
        <MetricTile
          label="Total Net"
          :value="formatCurrency(totals.net)"
          :sub="`Week ${weekCodeLabel(selected)}`"
          :icon="ICONS.margin"
          :tone="totals.net >= 0 ? 'pos' : 'neg'"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GaugeTile label="Reports Done" :done="doneCount" :total="rows.length" hint="Bridge status is DONE" />
        <GaugeTile label="Invoiced" :done="invoicedCount" :total="rows.length" hint="Invoice flag set" />
        <GaugeTile label="Payments Settled" :done="payCount" :total="rows.length" hint="Pay flag set" />
      </div>
    </template>

    <!-- Ledger tables -->
    <LedgerTable
      v-for="g in grouped"
      :key="g.name"
      :title="g.name"
      :tab="g.tab"
      :rows="g.rows"
    />
  </div>
</template>
