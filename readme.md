# Monitoring Web Dashboard

Vue 3 + Vite + Tailwind dashboard for the wide Google Sheet in the `w` tab.

## Sheet Layout

The sheet uses six rows per company:

```text
Company | TOTAL | week values
Company | Total Check | week values
Company | INVOICE | TRUE/FALSE values
Company | CHECK | TRUE/FALSE values
Company | PAY | TRUE/FALSE values
Company | STATUS | DONE/PENDING/NO FILE values
```

Week headers are normally `a1` through `a52`. `a1t` through `a52t` are treated as
Pelican Terrace data and mapped to the same base weeks under a separate company name.

The bridge returns the sheet's `STATUS` value directly. The frontend does not derive
status from the three checkboxes. The UI's legacy amount fields are normalized so the
sheet's `TOTAL` values display as Revenue and `Total Check` values display as Expenses.

## Pay Cycles

- Weekly companies appear every week.
- The configured even-week biweekly companies appear on even weeks.
- The configured odd-week biweekly companies appear on odd weeks.
- The Unpaid view excludes the current week and defaults to Unpaid only.

The custom company order and pay-cycle lists are in `src/api/company-links.js`.

## Setup

1. In Google Sheets, open **Extensions → Apps Script**.
2. Replace `Code.gs` with `google-script/Code.gs`.
3. Deploy the web app as **Execute as: Me** and **Who has access: Anyone**.
4. Put the deployed `/exec` URL in `src/api/config.js`.
5. Run `npm install` and `npm run dev`.

The browser uses JSONP because Apps Script web apps do not provide the CORS headers
needed for a normal `fetch` request. The client retries one failed or timed-out bridge
request to handle temporary Apps Script queue errors.

## Commands

```text
npm run dev
npm run build
npm run preview
```

## Work Mode

The **Work mode** button hides the normal dashboard and opens the ledger tables in a
full-screen view. The week selector remains available, and `Esc` or **Exit work mode**
returns to the dashboard.
