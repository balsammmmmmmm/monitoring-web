const COMPANIES = [
  'Crabs',
  "Flounder's Chowder House",
  "McGuire's Irish Pub of PENSACOLA"
]

const COMPANY_GROUPS = {
  'Company Config': [
    'Crabs',
    "Flounder's Chowder House",
    "McGuire's Irish Pub of PENSACOLA"
  ]
}

const GROUP_OF = {}
for (const [group, names] of Object.entries(COMPANY_GROUPS)) {
  for (const n of names) GROUP_OF[n] = group
}

function seededRandom(seed) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

export function generateMockData(currentWeek = 30) {
  const rand = seededRandom(20240817)
  const companies = []

  for (const name of COMPANIES) {
    const mkWeek = (week, type) => {
      const doneChance = week < currentWeek ? 0.72 : 0.28
      const active = rand() > 0.15
      const invoice = active && rand() < doneChance
      const check = active && rand() < doneChance
      const pay = active && rand() < (doneChance * 0.85)

      return {
        week,
        type,
        code: `${type.toLowerCase()}${week}`,
        invoice,
        check,
        pay,
        checkAmt: active && invoice ? Math.round(rand() * 2000 + 200) : 0,
        totalAmt: active ? Math.round(rand() * 6000 + 500) : 0,
        hours: 0
      }
    }

    const a = []
    for (let i = 1; i <= 52; i++) {
      a.push(mkWeek(i, 'A'))
    }

    companies.push({ name, group: GROUP_OF[name] || 'Company Config', w: [], a })
  }

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    count: companies.length,
    companies
  }
}
