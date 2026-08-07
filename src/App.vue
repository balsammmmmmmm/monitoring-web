<script setup>
import { ref, computed, onMounted } from 'vue'
import CurrentWeekView from './components/CurrentWeekView.vue'
import FullHoursView from './components/FullHoursView.vue'
import UnpaidView from './components/UnpaidView.vue'
import PayrollView from './components/PayrollView.vue'
import WorkModeView from './components/WorkModeView.vue'
import {
  fetchMonitoring,
  isoWeekNumber,
  buildWeekCodeIndex,
  currentTypeLetter,
  formatCurrency
} from './api/sheets'
import { APP_SCRIPT_URL, USE_MOCK } from './api/config'
import { hasWeekData, sortByCustomOrder } from './api/company-links'

const companies = ref([])
const loading = ref(true)
const error = ref('')
const view = ref('current')
const workMode = ref(false)

const TABS = [
  { id: 'current', label: 'Current Week' },
  { id: 'hours', label: 'Full Hours' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'payroll', label: 'Payroll', disabled: true }
]

const weekIndex = computed(() => buildWeekCodeIndex(companies.value))

const currentWeekCode = computed(() => {
  const type = currentTypeLetter().toLowerCase()
  return `${type}${Math.min(52, Math.max(1, isoWeekNumber(new Date())))}`
})

const netTotal = computed(() => {
  const wm = weekIndex.value[currentWeekCode.value] || {}
  const weekNumber = isoWeekNumber(new Date())
  let net = 0
  for (const c of companies.value) {
    const w = wm[c.name]
    if (w && hasWeekData(c.name, weekNumber)) net += (w.checkAmt || 0) - (w.totalAmt || 0)
  }
  return net
})

const activityIcon =
  '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'

function normalizeName(c) {
  return { ...c, name: c.name.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'") }
}

function swapAmts(w) {
  return { ...w, checkAmt: w.totalAmt, totalAmt: w.checkAmt }
}

onMounted(async () => {
  if (!USE_MOCK && (!APP_SCRIPT_URL || APP_SCRIPT_URL.startsWith('PASTE_'))) {
    error.value =
      'Set APP_SCRIPT_URL in src/api/config.js to your deployed Apps Script web app URL.'
    loading.value = false
    return
  }
  try {
    const data = await fetchMonitoring()
    if (data && data.ok) {
      const swapped = (data.companies || []).map(normalizeName).map((c) => ({
        ...c,
        w: (c.w || []).map(swapAmts),
        a: (c.a || []).map(swapAmts)
      }))
      companies.value = sortByCustomOrder(swapped)
    } else {
      error.value = (data && data.error) || 'Unknown error from the bridge.'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Sticky header -->
    <header v-if="!workMode" class="sticky top-0 z-40 border-b border-border bg-header/95 backdrop-blur">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <span v-html="activityIcon"></span>
          </span>
          <div>
            <h1 class="text-base font-semibold tracking-tight text-foreground">Ledger Ops</h1>
            <p class="font-mono text-[11px] text-muted-foreground">
              Week <span class="text-foreground">{{ currentWeekCode.toUpperCase() }}</span> ·
              {{ companies.length }} companies
              <span class="ml-1 inline-flex items-center gap-1 text-ok">
                <span class="h-1.5 w-1.5 animate-pulse-live rounded-full bg-ok"></span>
                live
              </span>
            </p>
          </div>
        </div>

        <span
          v-if="USE_MOCK"
          class="rounded border border-warn/40 bg-warn-surface px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-warn"
          title="Using generated sample data"
        >
          mock
        </span>

        <nav class="ml-auto flex rounded-lg border border-border bg-muted p-0.5">
          <button
            v-for="t in TABS"
            :key="t.id"
            class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
            :class="[
              t.disabled
                ? 'cursor-not-allowed text-muted-foreground/40 line-through decoration-muted-foreground/40'
                : view === t.id
                  ? 'bg-card text-foreground shadow-panel'
                  : 'text-muted-foreground hover:text-foreground'
            ]"
            :disabled="t.disabled"
            @click="!t.disabled && (view = t.id)"
          >
            {{ t.label }}
          </button>
        </nav>

        <div class="hidden items-center gap-2 sm:flex">
          <span class="label">Net</span>
          <span
            class="font-mono text-lg font-semibold"
            :class="netTotal >= 0 ? 'text-money-pos' : 'text-money-neg'"
          >
            {{ netTotal >= 0 ? '+' : '' }}{{ formatCurrency(netTotal) }}
          </span>
        </div>

        <button
          class="rounded-lg border border-primary bg-primary px-3 py-1.5 font-sans text-sm font-semibold text-primary-foreground shadow-panel transition-colors hover:opacity-90"
          title="Fullscreen ledger tables only"
          @click="workMode = true"
        >
          Work mode
        </button>
      </div>
    </header>

    <WorkModeView
      v-if="workMode && !loading && !error && companies.length"
      :index="weekIndex"
      :companies="companies"
      :week-code="currentWeekCode"
      @exit="workMode = false"
    />

    <main v-else class="mx-auto max-w-6xl px-4 py-5">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center gap-3 rounded-xl border border-border bg-card p-6 font-mono text-sm text-muted-foreground">
        <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        Loading ledger data…
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-xl border border-bad/40 bg-bad-surface p-4 text-sm text-bad">
        <p class="font-semibold">Unable to load data</p>
        <p class="mt-1 font-mono text-xs">{{ error }}</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!companies.length" class="rounded-xl border border-border bg-card p-6 font-mono text-sm text-muted-foreground">
        No company data found.
      </div>

      <!-- Content -->
      <CurrentWeekView
        v-if="view === 'current'"
        :index="weekIndex"
        :companies="companies"
        :week-code="currentWeekCode"
      />
      <FullHoursView
        v-else-if="view === 'hours'"
        :index="weekIndex"
        :companies="companies"
      />
      <UnpaidView
        v-else-if="view === 'unpaid'"
        :index="weekIndex"
        :companies="companies"
        :current-week-code="currentWeekCode"
      />
      <PayrollView
        v-else
        :companies="companies"
        :current-week-code="currentWeekCode"
      />
    </main>
  </div>
</template>
