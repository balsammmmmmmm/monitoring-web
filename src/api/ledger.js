import { parseWeekCode } from './sheets'
import { hasWeekData, paymentFrequency, sortByCustomOrder } from './company-links'

const GROUPS = ['Weekly', 'Biweekly (Even)', 'Biweekly (Odd)']

export function selectedWeekNumber(code) {
  return parseWeekCode(code)?.week || 0
}

export function buildLedgerRows(companies, index, code) {
  const weekNumber = selectedWeekNumber(code)
  const weekMap = index[code] || {}

  return companies.map((company) => ({
    name: company.name,
    week: hasWeekData(company.name, weekNumber) ? weekMap[company.name] || null : null
  }))
}

export function buildLedgerGroups(companies, index, code) {
  const rows = buildLedgerRows(companies, index, code)
  const groups = Object.fromEntries(GROUPS.map((name) => [name, []]))

  for (const row of rows) {
    groups[paymentFrequency(row.name)].push(row)
  }

  const activeGroup = selectedWeekNumber(code) % 2 === 0 ? 'Biweekly (Even)' : 'Biweekly (Odd)'

  return ['Weekly', activeGroup]
    .filter((name) => groups[name].length > 0)
    .map((name) => ({
      name,
      tab: name === 'Weekly' ? 'W' : name === 'Biweekly (Even)' ? 'BE' : 'BO',
      rows: sortByCustomOrder(groups[name])
    }))
}

export function initialWeekCode(codes, preferred) {
  return codes.includes(preferred) ? preferred : codes[0] || preferred
}
