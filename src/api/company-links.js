export function normalizeCompanyName(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

const SHEET_IDS = {
  Crabs: '1rfV02W6tHKF2NoXmPxE0N4YpUru-d1gN3IGvMbmnSKw',
  "Flounder's Chowder House": '11EnXUDhtuEMkOzsICUdWDrcucakffU08HIbwjrU9Z0c',
  'Pelican Terrace': '1OoS0XUmII59ThPDIk8XL3VYgH01Kr3SFmcCK8MreynU',
  "McGuire's Irish Pub of PENSACOLA": '1c2nnn8QIUBuM_TUGzk_IbPpVywadZd_2XAw_rf1xHTA',
  "McGuire's Irish Pub of Panama City": '1DpFvR-ro-cflbpJgS4XTgzLOAlWJ8tJESMHQufDnfFI',
  'GS Gelato and Desserts': '1KyBUSgMdOpYm6ndos82vKyNAhGgISvWoHIfA9T9N7Dc',
  "McGuire's Irish Pub of Destin": '1FITgstFTJKpUbGMLxq6EqMZCzpG13C5CTELLc41dEnI',
  'VILLAGE INN': '1HaulueVGXoQ-Whk--GUFaJmGfzrOgguI89xr3-aiPO0',
  'Pelican resort': '1zdIBkFFm_ZNgXbIMNOwszceXvXS2oRfu5puW_wXvy2w',
  'Pelican Maintenance': '1OoS0XUmII59ThPDIk8XL3VYgH01Kr3SFmcCK8MreynU',
  'Home 2 Destin': '1-ADSo8WLTCrcSc6mHh-wfsnMTh57gB9lljfZ7lwIqpk',
  Embassy: '1jZvnerHMub0IonYWmMLYg0J8icQeO5vBU0K9g4MzUXw',
  'Embassy FD': '1Xm--LU_34jAPu00EMgmbYrAQ0dPLwxA_PLZGXs5BUBQ',
  'Embassy HK': '1FZ4AVFI0-pZOrrG4x1idczy5VWR20TFbGD9Iauwm-lA',
  'Andy Ds': '1kCVK9XqNYq54T6t24kvX6eV-m6pAZ0oc94jF1G5XenM',
  'HENDERSON BEACH RESORT': '1SsjW6R-QTtXLXmZMRVQFlpqeib2YMgS2w61WYg34ixU',
  Luis: '1JCzY56jXAJZRRfXLe35eYnjH-PH6hqyDiJoGiNjzDBE',
  'Tru by Hilton Fort Walton Beach': '1J4qmY0xGGgHgxvxStpGbfEAh-q4n19pl8ghz21evtv8',
  'Island FB': '116o0mdlelMCM6A6kYkpEJHclgoiu3JdWw92YD2dlN2c',
  'Island FD': '1brup09F6pEeOm0LM_oRDs4qrmwklvq2fT0lBPMRl6Ss',
  'Island HK': '1o_9WSfAs-A0T630-0HOXg_UkYZpangoXTO4ylAmH7qc',
  'Breakers FWB': '1fskHPpPbG_XAEPOcLBy71d47xZhXRGhr0Hy7-2wOrcw',
  'Anglers Beachside Bar & Grill': '1iWHYbNH_4E7HMrfO3yUOqGBnpR6GLwcRCuFeix8_1bs',
  "Pegleg Pete's": '1zjL_gPgD9kCwpaSuALONMTmD_Qedr9ylY8UxXa-5QjY',
  'Comfort Inn Miramar': '1OhgzlgLqebPA-8Vv7H1gNr1H91_ru2TL-cRPcV1Jr2Q',
  'Holiday Inn Express FWB': '1JdtAK4LRbARlbEfAqGnvaAxTYgZRRU8PmHaRE7OE3zU',
  'Seabreeze Inn': '1gBDyRDNlwrMLYt4P7CWe36VsAAqfVdnA5QMMRdaS_wU',
  'Days Inn Defuniak': '1Ftb3y27iimL3Zvfni_tg-oJ8WxQOGNkVr_-BL4kSJ6c',
  'Tru by Hilton Niceville': '12PdAWQidrQmbbYKihZI4c-swLSdWL-NmkRSEQS1oZls',
  'Hampton Inn Crestview': '1OFWxDpJgdZP4RrcTmASq0Qx5zegyjnE6SWJ8q2o7QBk',
  'Hampton Inn Niceville': '1HeuXSFNrcjWOZ-yoiG3mhXLD2TYlXSXHe3--bEkq6jI',
  'Home 2 Suites Crestview': '1uQp0eVG-pFoqFCVI7n2FgbWagBNtq37GcV2ZZWcAkqM',
  'BEAL HOUSE FWB': '1SO7mqLkumxFDogq3ZWFQnQtYshXSRAG_GIbgZ2oD4OI',
  'WYNDHAM GARDEN': '14hKkh9HL_6mBif4Sr6uqN81q48hOX3gcV_quObq6P9s',
  'The Gulf FWB': '1vY-3oYLIC94J7aK4OzWEYfuq75dg22KHrIkgoq8h0xA',
  BIJOUX: '16iMKoIB0YfJBGrlSWvasy43Q8cmZUSQIZuYoUavbxhk',
  'HIEX FWB EGLIN': '14oXu6CxFWT7uCE3y730Bjz_pknCbni5ABLHQAMCFJ4Y',
  'Home 2 FWB': '1zIvt1KafQA7jB1Dr4zERPG9jjMKkxfqkrcHXYk49Ik4'
}

const WEEKLY_COMPANIES = new Set([
  'Crabs',
  "Flounder's Chowder House",
  "McGuire's Irish Pub of PENSACOLA",
  "McGuire's Irish Pub of Panama City",
  'GS Gelato and Desserts',
  "McGuire's Irish Pub of Destin",
  'VILLAGE INN',
  'Pelican resort',
  'Pelican Maintenance',
  'Pelican Terrace',
  'Home 2 Destin',
  'Embassy',
  'Embassy FD',
  'Embassy HK',
  'Andy Ds',
  'HENDERSON BEACH RESORT'
])

export function companySheetUrl(name) {
  const id = SHEET_IDS[normalizeCompanyName(name)]
  return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : ''
}

const CUSTOM_ORDER = [
  'Crabs',
  "Flounder's Chowder House",
  "McGuire's Irish Pub of PENSACOLA",
  "McGuire's Irish Pub of Panama City",
  'GS Gelato and Desserts',
  "McGuire's Irish Pub of Destin",
  'VILLAGE INN',
  'Pelican resort',
  'Pelican Maintenance',
  'Pelican Terrace',
  'Home 2 Destin',
  'Embassy',
  'Embassy FD',
  'Embassy HK',
  'Andy Ds',
  'HENDERSON BEACH RESORT',
  'Tru by Hilton Fort Walton Beach',
  'Island FB',
  'Island FD',
  'Island HK',
  'Breakers FWB',
  'Anglers Beachside Bar & Grill',
  "Pegleg Pete's",
  'Hampton Inn & Suites Pensacola',
  'Candlewood Suites Pensacola',
  'Holiday Inn Express & Suites Destin',
  'Comfort Inn Miramar',
  'Holiday Inn Express FWB',
  'Seabreeze Inn',
  'Days Inn Defuniak',
  'Tru by Hilton Niceville',
  'Hampton Inn Crestview',
  'Hampton Inn Niceville',
  'Home 2 Suites Crestview',
  'BEAL HOUSE FWB',
  'WYNDHAM GARDEN',
  'The Gulf FWB',
  'BIJOUX',
  'HIEX FWB EGLIN',
  'Home 2 FWB',
  'Hyatt Panama City Beach'
]

const ORDER_MAP = {}
CUSTOM_ORDER.forEach((name, i) => { ORDER_MAP[name] = i })

const BIWEEKLY_EVEN = new Set([
  'Tru by Hilton Fort Walton Beach',
  'Island FB',
  'Island FD',
  'Island HK',
  'Breakers FWB',
  'Anglers Beachside Bar & Grill'
])

const BIWEEKLY_ODD = new Set([
  "Pegleg Pete's",
  'Hampton Inn & Suites Pensacola',
  'Candlewood Suites Pensacola',
  'Holiday Inn Express & Suites Destin',
  'Comfort Inn Miramar',
  'Holiday Inn Express FWB',
  'Seabreeze Inn',
  'Days Inn Defuniak',
  'Tru by Hilton Niceville',
  'Hampton Inn Crestview',
  'Hampton Inn Niceville',
  'Home 2 Suites Crestview',
  'BEAL HOUSE FWB',
  'WYNDHAM GARDEN',
  'The Gulf FWB',
  'BIJOUX',
  'HIEX FWB EGLIN',
  'Home 2 FWB',
  'Hyatt Panama City Beach'
])

export function paymentFrequency(name) {
  const normalizedName = normalizeCompanyName(name)
  if (WEEKLY_COMPANIES.has(normalizedName)) return 'Weekly'
  if (BIWEEKLY_EVEN.has(normalizedName)) return 'Biweekly (Even)'
  return 'Biweekly (Odd)'
}

export function hasWeekData(name, weekNumber) {
  const normalizedName = normalizeCompanyName(name)
  const week = Number(weekNumber)
  if (WEEKLY_COMPANIES.has(normalizedName)) return true
  if (!Number.isFinite(week) || week < 1) return false
  if (BIWEEKLY_EVEN.has(normalizedName)) return week % 2 === 0
  if (BIWEEKLY_ODD.has(normalizedName)) return week % 2 === 1
  return true
}

function itemName(item) {
  if (typeof item === 'string') return item
  return item?.name || item?.label || item?.key || ''
}

export function companyOrderIndex(name) {
  return ORDER_MAP[normalizeCompanyName(name)] ?? 999
}

export function sortByCustomOrder(companies) {
  return [...companies].sort((a, b) => {
    const orderDifference = companyOrderIndex(itemName(a)) - companyOrderIndex(itemName(b))
    return orderDifference || normalizeCompanyName(itemName(a)).localeCompare(normalizeCompanyName(itemName(b)))
  })
}
