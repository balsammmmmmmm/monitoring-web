<script setup>
import { ref, computed, watch } from 'vue'
import {
  formatCurrency,
  weekCodeLabel,
  weekCodesSorted,
  deriveStatus,
  parseWeekCode
} from '../api/sheets'
import { companySheetUrl, hasWeekData, sortByCustomOrder } from '../api/company-links'

const props = defineProps({
  index: { type: Object, required: true },
  companies: { type: Array, required: true },
  currentWeekCode: { type: String, default: '' }
})

const selectedWeek = ref('all')
const groupBy = ref('week')
const unpaidOnly = ref(true)

const codes = computed(() =>
  weekCodesSorted(props.index).filter((code) => code !== props.currentWeekCode)
)

watch(
  [codes, () => props.currentWeekCode],
  () => {
    if (selectedWeek.value !== 'all' && !codes.value.includes(selectedWeek.value)) {
      selectedWeek.value = 'all'
    }
  },
  { immediate: true }
)

// Flatten every company-week that has a file. When unpaidOnly, only keep pay-open rows.
const weekRows = computed(() => {
  const rows = []
  for (const code of codes.value) {
    const weekNumber = parseWeekCode(code)?.week || 0
    const wm = props.index[code] || {}
    for (const c of props.companies) {
      if (!hasWeekData(c.name, weekNumber)) continue
      const w = wm[c.name]
      if (!w) continue
      const payOpen = !w.pay && deriveStatus(w) !== 'NO FILE'
      if (!unpaidOnly.value || payOpen) rows.push({ code, name: c.name, week: w, payOpen })
    }
  }
  return rows
})

const filteredRows = computed(() => {
  if (selectedWeek.value === 'all') return weekRows.value
  return weekRows.value.filter((r) => r.code === selectedWeek.value)
})

const totalOutstanding = computed(() =>
  filteredRows.value.reduce((s, r) => s + (r.week.checkAmt || 0), 0)
)
const totalExpenses = computed(() =>
  filteredRows.value.reduce((s, r) => s + (r.week.totalAmt || 0), 0)
)
const totalNet = computed(() => totalOutstanding.value - totalExpenses.value)

const unpaidCount = computed(() => filteredRows.value.filter((r) => r.payOpen).length)
const companyCount = computed(() => new Set(filteredRows.value.map((r) => r.name)).size)

const grouped = computed(() => {
  if (groupBy.value === 'week') {
    const groups = {}
    for (const r of filteredRows.value) {
      if (!groups[r.code]) groups[r.code] = []
      groups[r.code].push(r)
    }
    return Object.entries(groups)
      .map(([code, list]) => ({ key: code, label: weekCodeLabel(code), rows: sortByCustomOrder(list) }))
      .sort((a, b) => codes.value.indexOf(a.key) - codes.value.indexOf(b.key))
  }
  const groups = {}
  for (const r of filteredRows.value) {
    if (!groups[r.name]) groups[r.name] = []
    groups[r.name].push(r)
  }
  return sortByCustomOrder(
    Object.entries(groups).map(([name, list]) => ({ name, key: name, label: name, rows: list }))
  )
})

function groupTotal(rows) {
  return rows.reduce((s, r) => s + (r.week.checkAmt || 0), 0)
}

function statusChip(week) {
  const s = deriveStatus(week)
  const cls =
    s === 'DONE'
      ? 'border-ok/40 bg-ok-surface text-ok'
      : s === 'NO FILE'
        ? 'border-border bg-muted text-muted-foreground'
        : 'border-warn/40 bg-warn-surface text-warn'
  return { s, cls }
}

function groupAnchor(g) {
  return groupBy.value === 'week' ? `unpaid-week-${g.key}` : `unpaid-company-${g.key}`
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const ICONS = {
  outstanding:
    '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  rows:
    '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>',
  companies:
    '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>'
}
</script>

<template>
  <div class="space-y-4">
    <!-- Summary tiles -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-border bg-card p-4 shadow-panel">
        <div class="flex items-center justify-between">
          <span class="label text-muted-foreground">Outstanding</span>
          <span class="text-warn" v-html="ICONS.outstanding"></span>
        </div>
        <p class="mt-1 font-mono text-2xl font-semibold tabular-nums text-warn">
          {{ formatCurrency(totalOutstanding) }}
        </p>
        <p class="mt-1 font-mono text-[11px] text-muted-foreground">sum of unpaid checkAmt</p>
      </div>

      <div class="rounded-xl border border-border bg-card p-4 shadow-panel">
        <div class="flex items-center justify-between">
          <span class="label text-muted-foreground">Unpaid rows</span>
          <span class="text-warn" v-html="ICONS.rows"></span>
        </div>
        <p class="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
          {{ filteredRows.length }}
        </p>
        <p class="mt-1 font-mono text-[11px] text-muted-foreground">company-weeks with pay open</p>
      </div>

      <div class="rounded-xl border border-border bg-card p-4 shadow-panel">
        <div class="flex items-center justify-between">
          <span class="label text-muted-foreground">Companies</span>
          <span class="text-primary" v-html="ICONS.companies"></span>
        </div>
        <p class="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
          {{ companyCount }}
        </p>
        <p class="mt-1 font-mono text-[11px] text-muted-foreground">with at least one unpaid week</p>
      </div>

      <div class="rounded-xl border border-border bg-card p-4 shadow-panel">
        <span class="label text-muted-foreground">Net exposure</span>
        <p
          class="mt-1 font-mono text-2xl font-semibold tabular-nums"
          :class="totalNet >= 0 ? 'text-money-pos' : 'text-money-neg'"
        >
          {{ totalNet >= 0 ? '+' : '' }}{{ formatCurrency(totalNet) }}
        </p>
        <p class="mt-1 font-mono text-[11px] text-muted-foreground">outstanding minus expenses</p>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="label text-muted-foreground">Week</span>
        <select
          v-model="selectedWeek"
          class="min-w-40 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-sm text-foreground shadow-panel focus:border-primary focus:outline-none"
        >
          <option value="all">All weeks</option>
          <option v-for="c in codes" :key="c" :value="c">{{ weekCodeLabel(c) }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <span class="label text-muted-foreground">Group</span>
        <div class="flex rounded-lg border border-border bg-muted p-0.5">
          <button
            v-for="g in ['company', 'week']"
            :key="g"
            class="rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors"
            :class="groupBy === g ? 'bg-card text-foreground shadow-panel' : 'text-muted-foreground hover:text-foreground'"
            @click="groupBy = g"
          >
            {{ g }}
          </button>
        </div>
      </div>

      <button
        class="ml-auto inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-sans text-sm font-semibold transition-colors"
        :class="unpaidOnly
          ? 'border-primary bg-primary text-primary-foreground shadow-panel'
          : 'border-border bg-card text-muted-foreground shadow-panel hover:text-foreground'"
        @click="unpaidOnly = !unpaidOnly"
      >
        <span
          class="inline-block h-2 w-2 rounded-full transition-transform"
          :class="unpaidOnly ? 'bg-primary-foreground' : 'bg-muted-foreground'"
        ></span>
        Unpaid only
      </button>
      <span class="font-mono text-[11px] text-muted-foreground">
        {{ unpaidCount }} unpaid · {{ filteredRows.length }} shown
      </span>
      <span
        v-if="currentWeekCode"
        class="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
        title="Current week is not yet due — finish it next week"
      >
        current week ({{ currentWeekCode.toUpperCase() }}) excluded
      </span>
    </div>

    <!-- Grouped unpaid tables -->
    <div
      v-for="g in grouped"
      :key="g.key"
      :id="groupAnchor(g)"
      class="overflow-hidden rounded-xl border border-border bg-card shadow-panel"
    >
      <div class="flex flex-wrap items-center gap-3 border-b border-border bg-header px-4 py-3">
        <div class="h-4 w-1 rounded-full bg-warn"></div>
        <h2 class="text-sm font-semibold text-foreground">{{ g.label }}</h2>
        <span class="font-mono text-[11px] text-muted-foreground">{{ g.rows.length }} open</span>
        <span class="ml-auto font-mono text-sm font-semibold text-warn">
          {{ formatCurrency(groupTotal(g.rows)) }}
        </span>
      </div>

      <div class="hidden overflow-x-auto md:block">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-border text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <th v-if="groupBy === 'company'" class="px-4 py-2.5 font-semibold">Week</th>
              <th v-else class="px-4 py-2.5 font-semibold">Company</th>
              <th class="px-3 py-2.5 text-center font-semibold">Inv</th>
              <th class="px-3 py-2.5 text-center font-semibold">Chk</th>
              <th class="px-3 py-2.5 text-center font-semibold">Pay</th>
              <th class="px-3 py-2.5 text-right font-semibold">Revenue</th>
              <th class="px-3 py-2.5 text-right font-semibold">Expenses</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in g.rows"
              :key="r.code + r.name"
              class="border-b border-border/50 transition-colors hover:bg-secondary/60"
              :class="i % 2 === 1 && 'bg-zebra'"
            >
              <td v-if="groupBy === 'company'" class="px-4 py-2 font-mono text-xs text-foreground">
                {{ weekCodeLabel(r.code) }}
              </td>
              <td v-else class="px-4 py-2 text-foreground">
                <a
                  v-if="companySheetUrl(r.name)"
                  :href="companySheetUrl(r.name)"
                  target="_blank"
                  rel="noopener"
                  class="font-sans text-sm text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  {{ r.name }}
                </a>
                <span v-else class="font-sans text-sm text-foreground">{{ r.name }}</span>
              </td>
              <td v-for="f in ['invoice', 'check', 'pay']" :key="f" class="px-3 py-2 text-center">
                <span
                  class="mx-auto inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold"
                  :class="r.week[f] ? 'bg-ok text-white' : 'bg-bad text-white'"
                >
                  {{ r.week[f] ? '✓' : '✕' }}
                </span>
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                {{ formatCurrency(r.week.checkAmt) }}
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                {{ formatCurrency(r.week.totalAmt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile list -->
      <div class="divide-y divide-border/50 md:hidden">
        <div
          v-for="r in g.rows"
          :key="r.code + r.name"
          class="flex items-center gap-3 px-4 py-3"
        >
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm text-foreground" :class="groupBy === 'company' && 'font-mono text-xs'">
              {{ groupBy === 'company' ? weekCodeLabel(r.code) : r.name }}
            </div>
            <div class="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {{ statusChip(r.week).s }} · {{ formatCurrency(r.week.checkAmt) }}
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-1.5">
            <span
              v-for="f in ['invoice', 'check', 'pay']"
              :key="f"
              class="inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold"
              :class="r.week[f] ? 'bg-ok text-white' : 'bg-bad text-white'"
            >
              {{ r.week[f] ? '✓' : '✕' }}
            </span>
          </div>
          <span class="shrink-0 font-mono text-sm font-semibold text-warn">
            {{ formatCurrency(r.week.checkAmt) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="!filteredRows.length" class="rounded-xl border border-border bg-card p-6 text-center font-mono text-sm text-muted-foreground">
      No {{ unpaidOnly ? 'unpaid' : 'company' }} rows to show.
    </div>

    <!-- Floating back-to-top button -->
    <button
      class="fixed bottom-[4.5rem] right-5 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-panel transition-all hover:scale-105 hover:bg-secondary"
      title="Back to top"
      @click="scrollToTop"
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  </div>
</template>
