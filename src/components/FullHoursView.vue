<script setup>
import { ref, computed } from 'vue'
import {
  formatCurrency,
  weekCodeLabel,
  weekCodesSorted,
  parseWeekCode
} from '../api/sheets'
import { companySheetUrl, hasWeekData } from '../api/company-links'

const props = defineProps({
  index: { type: Object, required: true },
  companies: { type: Array, required: true }
})

const sortBy = ref('hours')
const sortDesc = ref(true)
const selectedCompany = ref('')

const codes = computed(() => weekCodesSorted(props.index))

const weekItems = computed(() => {
  const items = []
  for (const code of codes.value) {
    const weekNumber = parseWeekCode(code)?.week || 0
    const wm = props.index[code] || {}
    for (const name of props.companies.map((c) => c.name)) {
      if (!hasWeekData(name, weekNumber)) continue
      const w = wm[name]
      if (w) items.push({ code, week: w, name })
    }
  }
  return items
})

const companyTotals = computed(() => {
  const map = {}
  for (const it of weekItems.value) {
    const hours = it.week.hours || 0
    if (hours <= 0) continue
    if (!map[it.name]) map[it.name] = { name: it.name, hours: 0, weeks: 0, revenue: 0, lastCode: it.code }
    map[it.name].hours += hours
    map[it.name].weeks += 1
    map[it.name].revenue += it.week.checkAmt || 0
    if (codes.value.indexOf(it.code) > codes.value.indexOf(map[it.name].lastCode)) {
      map[it.name].lastCode = it.code
    }
  }
  const list = Object.values(map)
  list.sort((a, b) => {
    const key = sortBy.value
    let cmp
    if (key === 'name') cmp = a.name.localeCompare(b.name)
    else if (key === 'revenue') cmp = a.revenue - b.revenue
    else if (key === 'weeks') cmp = a.weeks - b.weeks
    else cmp = a.hours - b.hours
    return sortDesc.value ? -cmp : cmp
  })
  return list
})

const totals = computed(() => {
  let hours = 0
  let revenue = 0
  let weeks = 0
  const companiesWithHours = new Set()
  for (const it of weekItems.value) {
    if (it.week.hours > 0) {
      hours += it.week.hours
      revenue += it.week.checkAmt || 0
      weeks += 1
      companiesWithHours.add(it.name)
    }
  }
  return {
    hours,
    revenue,
    weeks,
    companies: companiesWithHours.size,
    avg: weeks ? hours / weeks : 0
  }
})

const companyWeekRows = computed(() => {
  if (!selectedCompany.value) return []
  const rows = []
  for (const it of weekItems.value) {
    if (it.name === selectedCompany.value) rows.push(it)
  }
  rows.sort((a, b) => codes.value.indexOf(a.code) - codes.value.indexOf(b.code))
  return rows
})

const selectedHours = computed(() => {
  let h = 0
  for (const r of companyWeekRows.value) h += r.week.hours || 0
  return h
})

function toggleSort(key) {
  if (sortBy.value === key) sortDesc.value = !sortDesc.value
  else {
    sortBy.value = key
    sortDesc.value = true
  }
}

function sortCls(key) {
  if (sortBy.value !== key) return ''
  return sortDesc.value ? '↓' : '↑'
}

const ICONS = {
  hours:
    '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  weeks:
    '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  revenue:
    '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v5h-5"/></svg>',
  avg:
    '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>'
}

function yearOf(code) {
  return weekCodeLabel(code).split('·').pop().trim()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Summary tiles -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-border bg-card p-4 shadow-panel">
        <div class="flex items-center justify-between">
          <span class="label text-muted-foreground">Total hours</span>
          <span class="text-primary" v-html="ICONS.hours"></span>
        </div>
        <p class="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
          {{ Math.round(totals.hours).toLocaleString('en-US') }}
        </p>
        <p class="mt-1 font-mono text-[11px] text-muted-foreground">
          {{ totals.weeks }} recorded weeks
        </p>
      </div>

      <div class="rounded-xl border border-border bg-card p-4 shadow-panel">
        <div class="flex items-center justify-between">
          <span class="label text-muted-foreground">Companies with hours</span>
          <span class="text-primary" v-html="ICONS.weeks"></span>
        </div>
        <p class="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
          {{ totals.companies }}
        </p>
        <p class="mt-1 font-mono text-[11px] text-muted-foreground">
          of {{ companies.length }} total
        </p>
      </div>

      <div class="rounded-xl border border-border bg-card p-4 shadow-panel">
        <div class="flex items-center justify-between">
          <span class="label text-muted-foreground">Revenue on hours</span>
          <span class="text-money-pos" v-html="ICONS.revenue"></span>
        </div>
        <p class="mt-1 font-mono text-2xl font-semibold tabular-nums text-money-pos">
          {{ formatCurrency(totals.revenue) }}
        </p>
        <p class="mt-1 font-mono text-[11px] text-muted-foreground">
          checkAmt across recorded hours
        </p>
      </div>

      <div class="rounded-xl border border-border bg-card p-4 shadow-panel">
        <div class="flex items-center justify-between">
          <span class="label text-muted-foreground">Avg hours / week</span>
          <span class="text-primary" v-html="ICONS.avg"></span>
        </div>
        <p class="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
          {{ totals.avg.toFixed(1) }}
        </p>
        <p class="mt-1 font-mono text-[11px] text-muted-foreground">across all companies</p>
      </div>
    </div>

    <!-- Company totals table -->
    <div class="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
      <div class="flex flex-wrap items-center gap-3 border-b border-border bg-header px-4 py-3">
        <div class="h-4 w-1 rounded-full bg-[var(--gradient-rail)]"></div>
        <h2 class="text-sm font-semibold text-foreground">Company hours</h2>
        <span class="ml-auto font-mono text-[11px] text-muted-foreground">
          {{ companyTotals.length }} companies with hours
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-border text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <th class="cursor-pointer select-none px-4 py-2.5 font-semibold hover:text-foreground" @click="toggleSort('name')">
                Company {{ sortCls('name') }}
              </th>
              <th class="cursor-pointer select-none px-3 py-2.5 text-right font-semibold hover:text-foreground" @click="toggleSort('weeks')">
                Weeks {{ sortCls('weeks') }}
              </th>
              <th class="cursor-pointer select-none px-3 py-2.5 text-right font-semibold hover:text-foreground" @click="toggleSort('hours')">
                Hours {{ sortCls('hours') }}
              </th>
              <th class="cursor-pointer select-none px-3 py-2.5 text-right font-semibold hover:text-foreground" @click="toggleSort('revenue')">
                Revenue {{ sortCls('revenue') }}
              </th>
              <th class="px-4 py-2.5 text-right font-semibold">Last week</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in companyTotals"
              :key="r.name"
              class="border-b border-border/50 transition-colors hover:bg-secondary/60"
              :class="i % 2 === 1 && 'bg-zebra'"
            >
              <td class="px-4 py-2 text-foreground">
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
              <td class="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{{ r.weeks }}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums font-semibold text-foreground">
                {{ Math.round(r.hours).toLocaleString('en-US') }}
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                {{ formatCurrency(r.revenue) }}
              </td>
              <td class="px-4 py-2 text-right font-mono tabular-nums text-muted-foreground">
                {{ weekCodeLabel(r.lastCode) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Per-company drill-down -->
    <div class="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
      <div class="flex flex-wrap items-center gap-3 border-b border-border bg-header px-4 py-3">
        <div class="h-4 w-1 rounded-full bg-[var(--gradient-rail)]"></div>
        <h2 class="text-sm font-semibold text-foreground">Weekly hours</h2>
        <select
          v-model="selectedCompany"
          class="ml-auto min-w-52 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-sm text-foreground shadow-panel focus:border-primary focus:outline-none"
        >
          <option value="">Select a company…</option>
          <option v-for="r in companyTotals" :key="r.name" :value="r.name">{{ r.name }}</option>
        </select>
      </div>

      <div v-if="selectedCompany" class="overflow-x-auto">
        <div class="flex items-center gap-4 border-b border-border bg-zebra px-4 py-2 font-mono text-[11px] text-muted-foreground">
          <span>{{ selectedCompany }}</span>
          <span class="ml-auto">
            {{ companyWeekRows.length }} weeks · {{ Math.round(selectedHours).toLocaleString('en-US') }} hours total
          </span>
        </div>
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-border text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <th class="px-4 py-2.5 font-semibold">Week</th>
              <th class="px-3 py-2.5 text-right font-semibold">Hours</th>
              <th class="px-3 py-2.5 text-right font-semibold">Revenue</th>
              <th class="px-3 py-2.5 text-right font-semibold">Expenses</th>
              <th class="px-4 py-2.5 text-right font-semibold">Net</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in companyWeekRows"
              :key="r.code"
              class="border-b border-border/50"
              :class="i % 2 === 1 && 'bg-zebra'"
            >
              <td class="px-4 py-2 font-mono text-xs text-foreground">
                {{ weekCodeLabel(r.code) }}
                <span class="ml-1 text-muted-foreground">{{ yearOf(r.code) }}</span>
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums font-semibold text-foreground">
                {{ r.week.hours || 0 }}
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                {{ formatCurrency(r.week.checkAmt) }}
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                {{ formatCurrency(r.week.totalAmt) }}
              </td>
              <td class="px-4 py-2 text-right font-mono tabular-nums text-muted-foreground">
                {{ formatCurrency((r.week.checkAmt || 0) - (r.week.totalAmt || 0)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="px-4 py-6 text-center font-mono text-sm text-muted-foreground">
        Select a company to inspect its hours week by week.
      </div>
    </div>
  </div>
</template>
