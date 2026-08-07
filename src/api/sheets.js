import { APP_SCRIPT_URL, USE_MOCK, TYPE_YEARS } from './config'
import { generateMockData } from './mock'

/**
 * Fetch monitoring data.
 * - When USE_MOCK is true, returns generated sample data (no network).
 * - Otherwise fetches from the Apps Script bridge via JSONP.
 * Resolves with the parsed payload object.
 *
 * @param {Object} params - optional query params ({ company, weekcode })
 * @param {Date} mockNow - used in mock mode to derive the current week
 * @returns {Promise<Object>}
 */
export function fetchMonitoring(params = {}, mockNow = new Date()) {
  if (USE_MOCK) {
    const currentWeek = isoWeekNumber(mockNow)
    return Promise.resolve(generateMockData(currentWeek))
  }

  return requestJsonp(params)
}

function requestJsonp(params, attempt = 0) {
  return new Promise((resolve, reject) => {
    const cb = `__cb${Date.now()}_${Math.floor(Math.random() * 1e6)}`
    const qs = new URLSearchParams({ ...params, callback: cb }).toString()
    const url = `${APP_SCRIPT_URL}?${qs}`

    const script = document.createElement('script')
    script.src = url
    script.async = true
    let settled = false
    let timer

    const cleanup = () => {
      clearTimeout(timer)
      delete window[cb]
      script.remove()
    }

    const fail = (message) => {
      if (settled) return
      settled = true
      cleanup()
      if (attempt < 1) {
        window.setTimeout(() => {
          requestJsonp(params, attempt + 1).then(resolve, reject)
        }, 750)
        return
      }
      reject(new Error(message))
    }

    window[cb] = (data) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(data)
    }

    script.onerror = () => fail('Failed to load data from Apps Script. Check APP_SCRIPT_URL in src/api/config.js')
    timer = window.setTimeout(() => fail('Apps Script timed out. It may be busy; please refresh and try again.'), 15000)

    document.head.appendChild(script)
  })
}

/**
 * Parse a week code like "a32", "a32t", or "w5".
 * @returns {{ type: string, week: number, suffix: string, code: string, baseCode: string } | null}
 */
export function parseWeekCode(code) {
  const raw = String(code).trim().toLowerCase()
  const m = raw.match(/^([a-z]+?)(\d+)([a-z]*)$/)
  if (!m) return null
  return {
    type: m[1].toUpperCase(),
    week: parseInt(m[2], 10),
    suffix: m[3],
    code: raw,
    baseCode: `${m[1]}${m[2]}`
  }
}

/**
 * Build a code -> company -> week index.
 * Suffixes such as "t" are normalized to their base week code.
 */
export function buildWeekCodeIndex(companies) {
  const index = {}
  for (const c of companies) {
    for (const type of ['w', 'a']) {
      for (const w of c[type] || []) {
        const parsed = parseWeekCode(w.code)
        const code = parsed?.baseCode || w.code || `${w.type.toLowerCase()}${w.week}`
        if (!index[code]) index[code] = {}
        index[code][c.name] = w
      }
    }
  }
  return index
}

/**
 * All week codes present in the data, sorted oldest year first then by week.
 */
export function weekCodesSorted(index) {
  return Object.keys(index).sort((a, b) => {
    const pa = parseWeekCode(a)
    const pb = parseWeekCode(b)
    const ya = (pa && TYPE_YEARS[pa.type]) || ''
    const yb = (pb && TYPE_YEARS[pb.type]) || ''
    if (ya !== yb) return ya.localeCompare(yb)
    return (pa?.week ?? 0) - (pb?.week ?? 0) || a.localeCompare(b)
  })
}

/**
 * The type letter (W/A/...) for the current calendar year, using TYPE_YEARS.
 * Falls back to 'A' if no match.
 */
export function currentTypeLetter() {
  const year = String(new Date().getFullYear())
  for (const [k, v] of Object.entries(TYPE_YEARS)) {
    if (v === year) return k
  }
  return 'A'
}

/**
 * Human label for a week code: "A32 · 2026"
 */
export function weekCodeLabel(code) {
  const pc = parseWeekCode(code)
  if (!pc) return code
  return `${pc.type}${pc.week} · ${TYPE_YEARS[pc.type] || '?'}`
}

/**
 * Return the status supplied by the bridge.
 */
export function deriveStatus(week) {
  if (!week) return 'NO FILE'
  return String(week.status || 'NO FILE').trim().toUpperCase()
}

export function formatCurrency(n) {
  if (n == null || isNaN(n)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(n)
}

export function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}
