<script setup>
import { ref, computed } from 'vue'
import { generatePayrollForWeek } from '../api/payroll'
import { parseWeekCode, formatCurrency } from '../api/sheets'

const props = defineProps({
  companies: { type: Array, required: true },
  currentWeekCode: { type: String, default: '' }
})

const search = ref('')
const selectedName = ref('')

const typeLetter = computed(() => {
  const pc = parseWeekCode(props.currentWeekCode)
  return (pc && pc.type) || 'A'
})

const allRows = computed(() => {
  const rows = []
  for (let w = 1; w <= 52; w++) {
    rows.push(...generatePayrollForWeek(props.companies, `${typeLetter.value.toLowerCase()}${w}`))
  }
  return rows
})

const employeeNames = computed(() => {
  const set = new Set()
  for (const r of allRows.value) set.add(r.name)
  return [...set].sort((a, b) => a.localeCompare(b))
})

const visibleNames = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return employeeNames.value
  return employeeNames.value.filter((n) => n.toLowerCase().includes(q))
})

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (q) return allRows.value.filter((r) => r.name.toLowerCase().includes(q))
  if (selectedName.value) return allRows.value.filter((r) => r.name === selectedName.value)
  return []
})

function toggleName(n) {
  selectedName.value = selectedName.value === n ? '' : n
}

const totals = computed(() => {
  let hours = 0
  let subtotal = 0
  let otSubtotal = 0
  let tips = 0
  let deductions = 0
  let total = 0
  let totalCheck = 0
  for (const r of rows.value) {
    hours += r.hours || 0
    subtotal += r.subtotal || 0
    otSubtotal += r.otSubtotal || 0
    tips += r.tips || 0
    deductions += r.deductions || 0
    total += r.total || 0
    totalCheck += r.totalCheck || 0
  }
  return { hours, subtotal, otSubtotal, tips, deductions, total, totalCheck }
})

function num(v, dec = 2) {
  return Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

const totalKeys = ['hours', 'subtotal', 'otSubtotal', 'tips', 'deductions', 'total', 'totalCheck']

const COLUMNS = [
  { key: 'weekCode', label: 'Week', align: 'left', format: (r) => r.weekCode },
  { key: 'name', label: 'Name', align: 'left', format: (r) => r.name },
  { key: 'company', label: 'Company', align: 'left', format: (r) => r.company },
  { key: 'invoice', label: 'Inv', align: 'right', format: (r) => r.invoice },
  { key: 'payStart', label: 'Pay Start', align: 'left', format: (r) => r.payStart },
  { key: 'payEnd', label: 'Pay End', align: 'left', format: (r) => r.payEnd },
  { key: 'department', label: 'Dept', align: 'left', format: (r) => r.department },
  { key: 'hours', label: 'Hours', align: 'right', format: (r) => num(r.hours) },
  { key: 'rate', label: 'Rate', align: 'right', format: (r) => num(r.rate) },
  { key: 'subtotal', label: 'Subtotal', align: 'right', format: (r) => formatCurrency(r.subtotal) },
  { key: 'otHrs', label: 'OT Hrs', align: 'right', format: (r) => num(r.otHrs) },
  { key: 'otRate', label: 'OT Rate', align: 'right', format: (r) => num(r.otRate) },
  { key: 'otSubtotal', label: 'OT Sub', align: 'right', format: (r) => formatCurrency(r.otSubtotal) },
  { key: 'tips', label: 'Tips', align: 'right', format: (r) => formatCurrency(r.tips) },
  { key: 'deductions', label: 'Deductions', align: 'right', format: (r) => formatCurrency(r.deductions) },
  { key: 'total', label: 'Total', align: 'right', format: (r) => formatCurrency(r.total) },
  { key: 'totalCheck', label: 'Total Check', align: 'right', format: (r) => formatCurrency(r.totalCheck) },
  { key: 'fee', label: 'Fee', align: 'right', format: (r) => r.fee },
  { key: 'status', label: 'Status', align: 'left', format: (r) => r.status }
]

const totalCols = computed(() => COLUMNS.filter((c) => totalKeys.includes(c.key)))
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <input
        v-model="search"
        type="search"
        placeholder="Search by name…"
        class="min-w-48 rounded-lg border border-border bg-card px-3 py-1.5 font-sans text-sm text-foreground shadow-panel placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      <button
        v-if="selectedName"
        class="rounded-lg border border-primary bg-primary px-3 py-1.5 font-sans text-sm font-semibold text-primary-foreground shadow-panel transition-colors hover:opacity-90"
        @click="selectedName = ''"
      >
        Clear filter
      </button>
      <span class="ml-auto font-mono text-xs text-muted-foreground">
        {{ visibleNames.length }} employees{{ selectedName ? ` · ${selectedName}` : '' }}
      </span>
    </div>

    <!-- Clickable employee names -->
    <div class="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
      <div class="flex items-center gap-3 border-b border-border bg-header px-4 py-3">
        <div class="h-4 w-1 rounded-full bg-[var(--gradient-rail)]"></div>
        <h2 class="text-sm font-semibold text-foreground">Employees</h2>
        <span
          class="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {{ visibleNames.length }}
        </span>
      </div>
      <div class="scrollbar-thin flex max-h-56 flex-wrap gap-1.5 overflow-y-auto p-3">
        <button
          v-for="n in visibleNames"
          :key="n"
          class="rounded-md border px-2 py-1 font-sans text-xs transition-colors"
          :class="
            selectedName === n
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-muted text-foreground hover:bg-secondary'
          "
          @click="toggleName(n)"
        >
          {{ n }}
        </button>
        <div v-if="!visibleNames.length" class="px-1 py-2 font-mono text-xs text-muted-foreground">
          No employees match "{{ search }}"
        </div>
      </div>
    </div>

    <!-- Payroll table -->
    <div class="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
      <div class="flex items-center gap-3 border-b border-border bg-header px-4 py-3">
        <div class="h-4 w-1 rounded-full bg-[var(--gradient-rail)]"></div>
        <h2 class="text-sm font-semibold text-foreground">Payroll</h2>
        <span
          class="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {{ rows.length }} records
        </span>
      </div>

      <div v-if="!rows.length" class="p-6 font-mono text-sm text-muted-foreground">
        {{ search ? `No payroll info found for "${search}".` : 'Select an employee or search by name to see payroll info.' }}
      </div>

      <div v-else class="overflow-x-auto scrollbar-thin">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-border text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <th
                v-for="c in COLUMNS"
                :key="c.key"
                class="whitespace-nowrap px-2.5 py-2.5 font-semibold"
                :class="c.align === 'right' ? 'text-right' : 'text-left'"
              >
                {{ c.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in rows"
              :key="`${r.company}-${r.name}-${r.weekCode}`"
              class="border-b border-border/50 transition-colors hover:bg-secondary/60"
              :class="i % 2 === 1 && 'bg-zebra'"
            >
              <td
                v-for="c in COLUMNS"
                :key="c.key"
                class="whitespace-nowrap px-2.5 py-1.5 font-mono tabular-nums text-foreground"
                :class="c.align === 'right' ? 'text-right' : 'text-left'"
              >
                {{ c.format(r) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-border bg-header font-mono text-xs">
              <td class="px-2.5 py-2 font-semibold text-foreground" :colspan="COLUMNS.length - totalCols.length">
                Totals · {{ rows.length }} records
              </td>
              <td
                v-for="c in totalCols"
                :key="c.key"
                class="whitespace-nowrap px-2.5 py-2 tabular-nums"
                :class="[
                  c.align === 'right' ? 'text-right' : 'text-left',
                  c.key === 'total' ? 'font-semibold text-money-pos' : c.key === 'totalCheck' ? 'font-semibold text-foreground' : 'text-muted-foreground'
                ]"
              >
                <template v-if="c.key === 'hours'">{{ num(totals.hours) }}</template>
                <template v-else-if="c.key === 'subtotal'">{{ formatCurrency(totals.subtotal) }}</template>
                <template v-else-if="c.key === 'otSubtotal'">{{ formatCurrency(totals.otSubtotal) }}</template>
                <template v-else-if="c.key === 'tips'">{{ formatCurrency(totals.tips) }}</template>
                <template v-else-if="c.key === 'deductions'">{{ formatCurrency(totals.deductions) }}</template>
                <template v-else-if="c.key === 'total'">{{ formatCurrency(totals.total) }}</template>
                <template v-else-if="c.key === 'totalCheck'">{{ formatCurrency(totals.totalCheck) }}</template>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>
