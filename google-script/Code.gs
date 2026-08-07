/**
 * MONITORING DASHBOARD - Google Apps Script bridge
 *
 * Reads the wide "w" sheet and exposes a small JSON/JSONP payload for the
 * dashboard. Regular headers are a1-a52. Headers ending in "t" (a1t-a52t)
 * are exposed as Pelican Terrace data, sourced from the Pelican Maintenance
 * block, using the same base week code (a1, a2, ...).
 */

var CONFIG = {
  SHEET_NAME: 'w',
  TERRACE_SOURCE: 'Pelican Maintenance',
  TERRACE_NAME: 'Pelican Terrace'
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {}
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME)

    if (!sheet) {
      return respond({
        ok: false,
        error: 'Sheet "' + CONFIG.SHEET_NAME + '" not found.'
      }, params.callback)
    }

    var payload = buildPayload(sheet.getDataRange().getValues(), params)
    return respond(payload, params.callback)
  } catch (err) {
    return respond({ ok: false, error: String(err) }, (e && e.parameter && e.parameter.callback) || '')
  }
}

function parseWeekCode(code) {
  var raw = String(code || '').trim().toLowerCase()
  var match = raw.match(/^([a-z]+?)(\d+)([a-z]*)$/)
  if (!match) return null

  return {
    type: match[1].toUpperCase(),
    week: parseInt(match[2], 10),
    suffix: match[3],
    code: raw,
    baseCode: match[1] + match[2]
  }
}

function buildPayload(values, params) {
  if (!values || values.length < 2) {
    return { ok: true, generatedAt: new Date().toISOString(), companies: [] }
  }

  var sections = readSections(values)
  if (!sections.length) {
    return { ok: true, generatedAt: new Date().toISOString(), companies: [] }
  }

  var companyMap = {}
  var companies = []
  var companyFilter = normalizeCompanyName(params.company).toLowerCase()
  var weekFilter = String(params.weekcode || '').trim().toLowerCase()

  sections.forEach(function (section) {
    var blocks = readCompanyBlocks(values, section.start, section.end)

    blocks.forEach(function (block) {
      var rows = block.rows
      var totalRow = rows.TOTAL
      var totalCheckRow = rows['TOTAL CHECK']
      var invoiceRow = rows.INVOICE
      var checkRow = rows.CHECK
      var payRow = rows.PAY
      var statusRow = rows.STATUS

      if (!totalRow || !invoiceRow) return

      var regularCodes = section.codes.filter(function (week) { return week.suffix !== 't' })
      var terraceCodes = section.codes.filter(function (week) { return week.suffix === 't' })
      var sources = []

      if (regularCodes.length) sources.push({ name: block.name, codes: regularCodes })
      if (block.name === CONFIG.TERRACE_SOURCE && terraceCodes.length) {
        sources.push({ name: CONFIG.TERRACE_NAME, codes: terraceCodes })
      }

      sources.forEach(function (source) {
        if (companyFilter && source.name.toLowerCase() !== companyFilter) return

        var entries = []

        source.codes.forEach(function (week) {
          if (weekFilter && week.code !== weekFilter && week.baseCode !== weekFilter) return

          entries.push({
            week: week.week,
            type: week.type,
            code: week.baseCode,
            invoice: toBool(invoiceRow[week.col]),
            check: toBool(checkRow ? checkRow[week.col] : false),
            pay: toBool(payRow ? payRow[week.col] : false),
            checkAmt: toNumber(totalCheckRow ? totalCheckRow[week.col] : 0),
            totalAmt: toNumber(totalRow[week.col]),
            hours: 0,
            status: String(statusRow ? statusRow[week.col] : '').trim().toUpperCase()
          })
        })

        if (!entries.length) return

        var key = source.name.toLowerCase()
        if (!companyMap[key]) {
          companyMap[key] = { name: source.name, w: [], a: [] }
          companies.push(companyMap[key])
        }

        entries.forEach(function (entry) {
          var target = entry.type === 'A' ? companyMap[key].a : companyMap[key].w
          target.push(entry)
        })
      })
    })
  })

  companies.forEach(function (company) {
    company.a.sort(sortByWeek)
    company.w.sort(sortByWeek)
  })

  var payload = {
    ok: true,
    generatedAt: new Date().toISOString(),
    count: companies.length,
    companies: companies
  }

  if (params.all) payload.rows = values
  return payload
}

function readWeekCodes(headerRow) {
  var result = []
  for (var col = 2; col < headerRow.length; col++) {
    var parsed = parseWeekCode(headerRow[col])
    if (parsed) {
      parsed.col = col
      result.push(parsed)
    }
  }
  return result
}

function readSections(values) {
  var headers = []

  for (var rowIndex = 0; rowIndex < values.length; rowIndex++) {
    var codes = readWeekCodes(values[rowIndex])
    if (codes.length) headers.push({ row: rowIndex, codes: codes })
  }

  return headers.map(function (header, index) {
    return {
      codes: header.codes,
      start: header.row + 1,
      end: index + 1 < headers.length ? headers[index + 1].row : values.length
    }
  })
}

function readCompanyBlocks(values, start, end) {
  var blockMap = {}
  var blocks = []

  for (var rowIndex = start; rowIndex < end; rowIndex++) {
    var row = values[rowIndex]
    var name = normalizeCompanyName(row[0])
    var label = normalizeLabel(row[1])
    if (!name || !label) continue

    var key = name.toLowerCase()
    if (!blockMap[key]) {
      blockMap[key] = { name: name, rows: {} }
      blocks.push(blockMap[key])
    }

    blockMap[key].rows[label] = row
  }

  return blocks
}

function normalizeCompanyName(value) {
  return String(value || '')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLabel(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toUpperCase()
}

function sortByWeek(a, b) {
  return a.week - b.week
}

function toBool(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return value.trim().toUpperCase() === 'TRUE'
  return !!value
}

function toNumber(value) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') {
    return parseFloat(value.replace(/[$,\s]/g, '')) || 0
  }
  return 0
}

function respond(payload, callback) {
  var output = ContentService.createTextOutput()
  var safeCallback = String(callback || '').replace(/[^A-Za-z0-9_.]/g, '')
  var json = JSON.stringify(payload)

  if (safeCallback) {
    output.setContent(safeCallback + '(' + json + ');')
    output.setMimeType(ContentService.MimeType.JAVASCRIPT)
  } else {
    output.setContent(json)
    output.setMimeType(ContentService.MimeType.JSON)
  }

  return output
}
