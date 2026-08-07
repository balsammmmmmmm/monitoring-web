<script setup>
import { computed } from 'vue'
import { deriveStatus, formatCurrency } from '../api/sheets'
import { companySheetUrl } from '../api/company-links'

const props = defineProps({
  title: { type: String, required: true },
  tab: { type: String, default: '' },
  rows: { type: Array, required: true } // [{ name, week }]
})

const BOOL_FIELDS = [
  { key: 'invoice', label: 'Inv' },
  { key: 'check', label: 'Chk' },
  { key: 'pay', label: 'Pay' }
]

const visibleRows = computed(() => props.rows)

const subtotal = computed(() => {
  let rev = 0
  let exp = 0
  for (const r of visibleRows.value) {
    if (r.week) {
      rev += r.week.checkAmt || 0
      exp += r.week.totalAmt || 0
    }
  }
  return { rev, exp, net: rev - exp }
})

function chipCls(status) {
  if (status === 'DONE') return 'border-ok/40 bg-ok-surface text-ok'
  if (status === 'PENDING') return 'border-warn/40 bg-warn-surface text-warn'
  if (status === 'NO FILE') return 'border-border bg-muted text-muted-foreground'
  return 'border-info/40 bg-secondary text-info'
}

function rowDimmed(week) {
  return !!week && deriveStatus(week) === 'NO FILE'
}

function netCls(n) {
  if (n > 0) return 'text-money-pos'
  if (n < 0) return 'text-money-neg'
  return 'text-muted-foreground'
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
    <!-- Header bar -->
    <div class="flex items-center gap-3 border-b border-border bg-header px-4 py-3">
      <div class="h-4 w-1 rounded-full bg-[var(--gradient-rail)]"></div>
      <h2 class="text-sm font-semibold text-foreground">{{ title }}</h2>
      <span
        v-if="tab"
        class="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {{ tab }}
      </span>
      <span class="ml-auto font-mono text-[11px] text-muted-foreground">
        {{ visibleRows.length }} companies
      </span>
      <span class="font-mono text-sm font-semibold text-money-pos">
        {{ formatCurrency(subtotal.rev) }}
      </span>
    </div>

    <!-- Desktop table -->
    <div class="hidden overflow-x-auto md:block">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <th class="px-4 py-2.5 font-semibold">Company</th>
            <th class="px-3 py-2.5 text-center font-semibold">Status</th>
            <th
              v-for="f in BOOL_FIELDS"
              :key="f.key"
              class="px-2 py-2.5 text-center font-semibold"
            >
              {{ f.label }}
            </th>
            <th class="px-3 py-2.5 text-right font-semibold">Revenue</th>
            <th class="px-3 py-2.5 text-right font-semibold">Expenses</th>
            <th class="px-4 py-2.5 text-right font-semibold">Net</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(r, i) in visibleRows"
            :key="r.name"
            class="border-b border-border/50 transition-colors hover:bg-secondary/60"
            :class="[i % 2 === 1 && 'bg-zebra', rowDimmed(r.week) && 'opacity-70']"
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
            <td class="px-3 py-2 text-center">
              <span
                v-if="r.week"
                class="inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold"
                :class="chipCls(deriveStatus(r.week))"
              >
                {{ deriveStatus(r.week) }}
              </span>
              <span v-else class="font-mono text-xs text-muted-foreground/50">—</span>
            </td>
            <td
              v-for="f in BOOL_FIELDS"
              :key="f.key"
              class="px-2 py-2 text-center"
            >
              <span
                class="mx-auto inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold"
                :class="r.week ? (r.week[f.key] ? 'bg-ok text-white' : 'bg-bad text-white') : 'bg-black/70 text-white'"
                :title="f.label"
              >
                {{ r.week ? (r.week[f.key] ? '✓' : '✕') : '—' }}
              </span>
            </td>
            <td class="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
              {{ r.week ? formatCurrency(r.week.checkAmt) : '—' }}
            </td>
            <td class="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
              {{ r.week ? formatCurrency(r.week.totalAmt) : '—' }}
            </td>
            <td
              class="px-4 py-2 text-right font-mono tabular-nums"
              :class="netCls(r.week ? (r.week.checkAmt || 0) - (r.week.totalAmt || 0) : 0)"
            >
              {{ r.week ? formatCurrency((r.week.checkAmt || 0) - (r.week.totalAmt || 0)) : '—' }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-border bg-header font-mono text-sm">
            <td class="px-4 py-2.5 font-semibold text-foreground">Subtotal</td>
            <td colspan="4" class="px-3 py-2.5"></td>
            <td class="px-3 py-2.5 text-right text-money-pos">{{ formatCurrency(subtotal.rev) }}</td>
            <td class="px-3 py-2.5 text-right text-muted-foreground">{{ formatCurrency(subtotal.exp) }}</td>
            <td class="px-4 py-2.5 text-right font-semibold" :class="netCls(subtotal.net)">
              {{ formatCurrency(subtotal.net) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Mobile list -->
    <div class="divide-y divide-border/50 md:hidden">
      <div
        v-for="r in visibleRows"
        :key="r.name"
        class="flex items-center gap-3 px-4 py-3"
        :class="[rowDimmed(r.week) && 'opacity-70']"
      >
        <div class="min-w-0 flex-1">
          <a
            v-if="companySheetUrl(r.name)"
            :href="companySheetUrl(r.name)"
            target="_blank"
            rel="noopener"
            class="block truncate text-sm text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            {{ r.name }}
          </a>
          <div v-else class="truncate text-sm text-foreground">{{ r.name }}</div>
          <div class="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {{ r.week ? `${deriveStatus(r.week)} · ${formatCurrency(r.week.checkAmt)}` : 'No data' }}
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-1.5">
          <span
            v-for="f in BOOL_FIELDS"
            :key="f.key"
            class="inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold"
            :class="r.week && r.week[f.key] ? 'bg-ok text-white' : r.week ? 'bg-bad text-white' : 'bg-black/70 text-white'"
            :title="f.label"
          >
            {{ r.week && r.week[f.key] ? '✓' : r.week ? '✕' : '—' }}
          </span>
        </div>
        <span
          class="shrink-0 font-mono text-sm font-semibold"
          :class="netCls(r.week ? (r.week.checkAmt || 0) - (r.week.totalAmt || 0) : 0)"
        >
          {{ r.week ? formatCurrency((r.week.checkAmt || 0) - (r.week.totalAmt || 0)) : '—' }}
        </span>
      </div>
      <div class="flex items-center justify-between bg-header px-4 py-2.5 font-mono text-sm">
        <span class="text-muted-foreground">Subtotal</span>
        <span class="text-money-pos">{{ formatCurrency(subtotal.rev) }}</span>
      </div>
    </div>
  </div>
</template>
