import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

if (!app.includes('function AccountsExactPage(')) {
  const component = String.raw`
function AccountsExactPage({ data }) {
  const [f, setF] = useState({
    entityName: 'MEZZO HOUSE', businessName: 'MEZZO MATHS', year: '2025', reportEndDate: '31 DECEMBER 2025', reportEndDateLong: '31 December, 2025',
    auditorName: 'M & J Consult', auditorAddress: 'Adjacent Central University\nMataheko - Accra', auditorEmail: 'mandjconsult7@gmail.com', auditorPhone1: '+233-244.443.918', auditorPhone2: '+233-302.321.871',
    director1: 'Peter Akoto', director2: 'David Afriyie', entityDescription: 'Mezzo House is a limited liability company into academic service provider (basically mathematics toturials) and it is domiciled in Ghana.', natureOfBusiness: 'The nature of business is a limited by shares',
    turnover: 130000, wages: 82800, printingStationery: 18000, utilities: 6500, fuel: 8000, pettyExpenses: 3500, depreciation: 3966, financeCost: 0, taxExpense: -1182,
    openingSurplus: -6400, dividendProposed: 0, statedCapital: 30000, capitalSurplus: 0, additionalShares: 0, revaluationSurplus: 0,
    ppe: 68189, receivables: 0, owings: 15000, cashBank: 4187, cashHand: 0, taxation: 0, payables: 31246, accruals: 9114, loan: 0,
    computersCostBF: 20377, motorCostBF: 9468, furnitureCostBF: 2051, officeCostBF: 3700, computersAdditions: 0, motorAdditions: 0, furnitureAdditions: 0, officeAdditions: 0,
    computersDepBF: 537, motorDepBF: 4435, furnitureDepBF: 199, officeDepBF: 1592, computersDepYear: 509, motorDepYear: 2367, furnitureDepYear: 164, officeDepYear: 925,
    class1WdvBF: 5172, class2WdvBF: 22537, class3WdvBF: 7537, class4WdvBF: 0, class1CostBase: 0, class2CostBase: 0, class3CostBase: 0, class4CostBase: 0, class1Rate: 40, class2Rate: 30, class3Rate: 20, class4Rate: 10,
    wht: 5590, priorTaxBalance: 0, currentTaxPayment: 2000, authorisedShares: 100000, issuedShares: 30000, issuedForCash: 30000
  })
  const currency = data.settings.currency || 'GHS'
  const money = (value) => formatMoney(value, currency).replace('GHS', 'GH¢')
  const n = (key) => toNumber(f[key])
  const set = (key, value) => setF(old => ({ ...old, [key]: value }))
  const adminExpenses = n('wages') + n('printingStationery') + n('utilities') + n('fuel') + n('pettyExpenses') + n('depreciation')
  const operatingBeforeFinance = n('turnover') - adminExpenses
  const operatingAfterFinance = operatingBeforeFinance - n('financeCost')
  const profitAfterTax = operatingAfterFinance - n('taxExpense')
  const closingSurplus = n('openingSurplus') + profitAfterTax - n('dividendProposed')
  const currentAssets = n('receivables') + n('cashBank') + n('cashHand')
  const totalAssets = n('ppe') + currentAssets - n('taxation')
  const currentLiabilities = n('payables') + n('accruals') + n('loan')
  const equityTotal = n('statedCapital') + closingSurplus + n('capitalSurplus')
  const capBase1 = n('class1WdvBF') + n('class1CostBase')
  const capBase2 = n('class2WdvBF') + n('class2CostBase')
  const capBase3 = n('class3WdvBF') + n('class3CostBase')
  const capBase4 = n('class4WdvBF') + n('class4CostBase')
  const capAllow1 = capBase1 * n('class1Rate') / 100
  const capAllow2 = capBase2 * n('class2Rate') / 100
  const capAllow3 = capBase3 * n('class3Rate') / 100
  const capAllow4 = capBase4 * n('class4Rate') / 100
  const capitalAllowance = capAllow1 + capAllow2 + capAllow3 + capAllow4
  const chargeableIncome = operatingBeforeFinance + n('depreciation') - capitalAllowance - n('wht')
  const computedTax = chargeableIncome * 0.25
  const ppeCostTotal = n('computersCostBF') + n('motorCostBF') + n('furnitureCostBF') + n('officeCostBF') + n('computersAdditions') + n('motorAdditions') + n('furnitureAdditions') + n('officeAdditions')
  const ppeDepTotal = n('computersDepBF') + n('motorDepBF') + n('furnitureDepBF') + n('officeDepBF') + n('computersDepYear') + n('motorDepYear') + n('furnitureDepYear') + n('officeDepYear')
  const ppeNBV = ppeCostTotal - ppeDepTotal
  const inputFields = [
    ['entityName','Company name'], ['businessName','Business name on certificate'], ['year','Reporting year'], ['reportEndDate','Report end date heading'], ['director1','Director 1'], ['director2','Director 2'],
    ['turnover','Turnover / income from fees'], ['wages','Wages'], ['printingStationery','Printing & stationery'], ['utilities','Utilities'], ['fuel','Fuel'], ['pettyExpenses','Petty office expenses'], ['depreciation','Depreciation'], ['financeCost','Finance cost'], ['taxExpense','Income tax expense / credit'],
    ['openingSurplus','Opening income surplus'], ['dividendProposed','Dividend proposed'], ['statedCapital','Stated capital'], ['ppe','Property, plant & equipment shown on SFP'], ['receivables','Receivables on SFP'], ['owings','Owings note'], ['cashBank','Cash at bank'], ['cashHand','Cash at hand'], ['taxation','Taxation liability'], ['payables','Payables'], ['accruals','Accruals'], ['loan','Loan'],
    ['computersCostBF','Computers cost b/f'], ['motorCostBF','Motor vehicle cost b/f'], ['furnitureCostBF','Furniture & fittings cost b/f'], ['officeCostBF','Office equipment cost b/f'], ['computersDepBF','Computers depreciation b/f'], ['motorDepBF','Motor depreciation b/f'], ['furnitureDepBF','Furniture depreciation b/f'], ['officeDepBF','Office depreciation b/f'], ['computersDepYear','Computers depreciation for year'], ['motorDepYear','Motor depreciation for year'], ['furnitureDepYear','Furniture depreciation for year'], ['officeDepYear','Office equipment depreciation for year'],
    ['class1WdvBF','Capital allowance Class 1 WDV b/f'], ['class2WdvBF','Class 2 WDV b/f'], ['class3WdvBF','Class 3 WDV b/f'], ['class4WdvBF','Class 4 WDV b/f'], ['class1Rate','Class 1 rate %'], ['class2Rate','Class 2 rate %'], ['class3Rate','Class 3 rate %'], ['class4Rate','Class 4 rate %'], ['wht','WHT'], ['currentTaxPayment','Tax payment for the year'], ['authorisedShares','Authorised shares'], ['issuedShares','Issued shares'], ['issuedForCash','Issued for cash']
  ]
  function row(label, value, bold = false) { return '<tr class="' + (bold ? 'acc-bold' : '') + '"><td>' + label + '</td><td>' + value + '</td></tr>' }
  function three(label, a, b, c, d, bold = false) { return '<tr class="' + (bold ? 'acc-bold' : '') + '"><td>' + label + '</td><td>' + a + '</td><td>' + b + '</td><td>' + c + '</td><td>' + d + '</td></tr>' }
  function printAccounts() {
    const html = '<div class="accounts-book">' +
      '<section class="acc-page acc-cover"><h1>' + f.entityName + '</h1><h2>FINANCIAL STATEMENTS<br>FOR THE REPORTING PERIOD ENDING<br>' + f.reportEndDate + '</h2><div class="auditor-block"><b>AUDITORS & BUSINESS ADVISORS</b><br>' + f.auditorName + '<br>' + f.auditorAddress.replace(/\\n/g, '<br>') + '<br>' + f.auditorEmail + '<br>' + f.auditorPhone1 + '<br>' + f.auditorPhone2 + '</div></section>' +
      '<section class="acc-page"><h2>CONTENTS</h2><table>' + row('DIRECTORS CERTIFICATE','1') + row("AUDITOR\'S REPORT",'2') + row("THE PROPRIETOR\'S RESPONSIBILITY STATEMENT",'3') + row('STATEMENT OF FINANCIAL POSITION','4') + row('STATEMENT OF PROFIT OR LOSS AND OTHER COMPREHENSIVE INCOME','5') + row('NOTES TO THE FINANCIAL STATEMENTS','6-13') + '</table></section>' +
      '<section class="acc-page"><h1>' + f.businessName + '</h1><h2>FINANCIAL STATEMENTS FOR THE YEAR ENDED ' + f.reportEndDateLong + '</h2><h3>DIRECTORS CERTIFICATE</h3><p>We hereby certify that all the information provided by us for the preparation of these Financial Accounts are correct and reliable. In the light of the above, the attached Statement of the Financial Position and the State of Comprehensive Income are true and fair Account of the business operation for the year ended ' + f.reportEndDateLong + '.</p><div class="sig-grid"><div>' + f.director1 + '<br><b>(Director)</b><br>Date</div><div>' + f.director2 + '<br><b>(Director)</b><br>Date</div></div></section>' +
      '<section class="acc-page"><h1>' + f.entityName + '</h1><h2>STATEMENT OF FINANCIAL POSITION AS AT ' + f.reportEndDate + '</h2><table>' + row('Property, Plant and Equipment', money(n('ppe'))) + row('Receivables', money(n('receivables'))) + row('Cash and Cash Equivalent', money(n('cashBank') + n('cashHand'))) + row('Total Current Assets', money(currentAssets), true) + row('Taxation', money(n('taxation'))) + row('Net Current Asset', money(currentAssets - n('taxation')), true) + row('TOTAL ASSETS', money(totalAssets), true) + row('STATED CAPITAL', money(n('statedCapital'))) + row('RETAINED EARNINGS', money(closingSurplus)) + row('Capital & Reserve', money(equityTotal), true) + row('PAYABLES', money(n('payables'))) + row('ACCRUALS', money(n('accruals'))) + row('LOAN', money(n('loan'))) + row('TOTAL EQUITY & CURRENT LIABILITIES', money(equityTotal + currentLiabilities), true) + '</table></section>' +
      '<section class="acc-page"><h1>' + f.entityName + '</h1><h2>STATEMENT OF PROFIT OR LOSS AND OTHER COMPREHENSIVE INCOME<br>FOR THE YEAR ENDING ' + f.reportEndDateLong + '</h2><table>' + row('Turnover', money(n('turnover'))) + row('Gross profit', money(n('turnover')), true) + row('Selling, General & Adm. Expenses', money(adminExpenses)) + row('Profit from Operating Activities before Finance cost', money(operatingBeforeFinance), true) + row('Finance cost', money(n('financeCost'))) + row('Profit from Operating Activities After Finance cost', money(operatingAfterFinance), true) + row('Income tax expense / credit', money(n('taxExpense'))) + row('Profit after Income tax Expense transferred to Income Surplus Account', money(profitAfterTax), true) + '</table></section>' +
      '<section class="acc-page"><h1>' + f.entityName + '</h1><h2>INCOME SURPLUS ACCOUNT FOR THE REPORTING PERIOD ENDED ' + f.reportEndDate + '</h2><table>' + row('Balance at 1 January', money(n('openingSurplus'))) + row('Profit for the year', money(profitAfterTax)) + row('Less Dividend Proposed', money(n('dividendProposed'))) + row('Balance at 31 December ' + f.year, money(closingSurplus), true) + '</table><h2>STATEMENT OF CHANGES IN EQUITY AS AT THE REPORTING PERIOD ENDING ' + f.reportEndDate + '</h2><table><tr><th></th><th>Stated Capital</th><th>Capital Surplus</th><th>Income Surplus</th><th>Total</th></tr>' + three('Balance as at 1 January', money(n('statedCapital')), money(n('capitalSurplus')), money(n('openingSurplus')), money(n('statedCapital') + n('capitalSurplus') + n('openingSurplus'))) + three('Profit after Income Tax Expense', '-', '-', money(profitAfterTax), money(profitAfterTax)) + three('Dividend proposed','-','-', money(n('dividendProposed')), money(n('dividendProposed'))) + three('Revaluation surplus','-', money(n('revaluationSurplus')), '-', money(n('revaluationSurplus'))) + three('Balance as at 31 December', money(n('statedCapital')), money(n('capitalSurplus')), money(closingSurplus), money(equityTotal), true) + '</table></section>' +
      '<section class="acc-page"><h1>' + f.entityName + '</h1><h2>NOTES TO THE FINANCIAL STATEMENTS FOR THE REPORTING PERIOD ENDING ' + f.reportEndDate + '</h2><h3>1. REPORTING ENTITY</h3><p>' + f.entityDescription + '</p><h3>2. NATURE OF BUSINESS</h3><p>' + f.natureOfBusiness + '</p><h3>3. SIGNIFICANT ACCOUNTING POLICIES</h3><p>The financial statements are prepared on the historical cost convention and presented in Ghana cedis. Property and equipment is stated at historical cost less accumulated depreciation. Trade receivables and payables are stated at their face values.</p></section>' +
      '<section class="acc-page"><h1>' + f.entityName + '</h1><h2>NOTES TO THE FINANCIAL STATEMENTS</h2><h3>4. GENERAL & ADMINISTRATIVE EXPENSES</h3><table>' + row('Wages', money(n('wages'))) + row('Printing & Stationery', money(n('printingStationery'))) + row('Utilities', money(n('utilities'))) + row('Fuel', money(n('fuel'))) + row('Petty Expenses for office', money(n('pettyExpenses'))) + row('Depreciation', money(n('depreciation'))) + row('', money(adminExpenses), true) + '</table><h3>5. Finance cost</h3><table>' + row('Finance cost', money(n('financeCost'))) + '</table></section>' +
      '<section class="acc-page"><h1>' + f.entityName + '</h1><h2>NOTES TO THE FINANCIAL STATEMENTS</h2><h3>6. PROPERTY, PLANT AND EQUIPMENT</h3><table><tr><th></th><th>Computers</th><th>Motor Vehicle</th><th>Furniture & Fittings</th><th>Office Equipment</th><th>Total</th></tr><tr><td>Balance at 1 January</td><td>' + money(n('computersCostBF')) + '</td><td>' + money(n('motorCostBF')) + '</td><td>' + money(n('furnitureCostBF')) + '</td><td>' + money(n('officeCostBF')) + '</td><td>' + money(n('computersCostBF')+n('motorCostBF')+n('furnitureCostBF')+n('officeCostBF')) + '</td></tr><tr><td>Acquisition/(Disposals)</td><td>' + money(n('computersAdditions')) + '</td><td>' + money(n('motorAdditions')) + '</td><td>' + money(n('furnitureAdditions')) + '</td><td>' + money(n('officeAdditions')) + '</td><td>' + money(n('computersAdditions')+n('motorAdditions')+n('furnitureAdditions')+n('officeAdditions')) + '</td></tr><tr class="acc-bold"><td>31 DECEMBER</td><td>' + money(n('computersCostBF')+n('computersAdditions')) + '</td><td>' + money(n('motorCostBF')+n('motorAdditions')) + '</td><td>' + money(n('furnitureCostBF')+n('furnitureAdditions')) + '</td><td>' + money(n('officeCostBF')+n('officeAdditions')) + '</td><td>' + money(ppeCostTotal) + '</td></tr><tr><td>Depreciation b/f</td><td>' + money(n('computersDepBF')) + '</td><td>' + money(n('motorDepBF')) + '</td><td>' + money(n('furnitureDepBF')) + '</td><td>' + money(n('officeDepBF')) + '</td><td>' + money(n('computersDepBF')+n('motorDepBF')+n('furnitureDepBF')+n('officeDepBF')) + '</td></tr><tr><td>For the year</td><td>' + money(n('computersDepYear')) + '</td><td>' + money(n('motorDepYear')) + '</td><td>' + money(n('furnitureDepYear')) + '</td><td>' + money(n('officeDepYear')) + '</td><td>' + money(n('computersDepYear')+n('motorDepYear')+n('furnitureDepYear')+n('officeDepYear')) + '</td></tr><tr class="acc-bold"><td>Net Book Value as at 31 DECEMBER</td><td colspan="5">' + money(ppeNBV) + '</td></tr></table></section>' +
      '<section class="acc-page"><h2>COMPUTATION OF CAPITAL ALLOWANCE FOR ' + f.year + ' YEAR OF ASSESSMENT</h2><table><tr><th></th><th>CLASS 1</th><th>CLASS 2</th><th>CLASS 3</th><th>CLASS 4</th><th>TOTAL</th></tr><tr><td>WDV B/F</td><td>' + money(n('class1WdvBF')) + '</td><td>' + money(n('class2WdvBF')) + '</td><td>' + money(n('class3WdvBF')) + '</td><td>' + money(n('class4WdvBF')) + '</td><td>' + money(n('class1WdvBF')+n('class2WdvBF')+n('class3WdvBF')+n('class4WdvBF')) + '</td></tr><tr><td>CAPITAL ALLOWANCE</td><td>' + money(capAllow1) + '</td><td>' + money(capAllow2) + '</td><td>' + money(capAllow3) + '</td><td>' + money(capAllow4) + '</td><td>' + money(capitalAllowance) + '</td></tr><tr class="acc-bold"><td>WDV C/F</td><td>' + money(capBase1-capAllow1) + '</td><td>' + money(capBase2-capAllow2) + '</td><td>' + money(capBase3-capAllow3) + '</td><td>' + money(capBase4-capAllow4) + '</td><td>' + money((capBase1+capBase2+capBase3+capBase4)-capitalAllowance) + '</td></tr></table><h3>8. Receivables</h3><table>' + row('OWINGS', money(n('owings')), true) + '</table></section>' +
      '<section class="acc-page"><h3>9. Cash & cash Equivalent</h3><table>' + row('Cash @Bank', money(n('cashBank'))) + row('Cash @Hand', money(n('cashHand'))) + row('', money(n('cashBank')+n('cashHand')), true) + '</table><h3>10. TAXATION</h3><table><tr><th></th><th>Balance 1 Jan</th><th>Charge for the yr</th><th>Payment for the yr</th><th>Balance 31 Dec.</th></tr><tr><td>' + f.year + '</td><td>' + money(n('priorTaxBalance')) + '</td><td>' + money(computedTax) + '</td><td>' + money(n('currentTaxPayment')) + '</td><td>' + money(computedTax - n('currentTaxPayment')) + '</td></tr></table><h3>11. STATED CAPITAL</h3><p>The company is registered with an Authorised Capital of ' + n('authorisedShares').toLocaleString('en-GH') + ' Ordinary shares of no par value.</p><table><tr><th></th><th>No. of Shares</th><th>Value</th></tr><tr><td>Issued for cash consideration</td><td>' + n('issuedShares').toLocaleString('en-GH') + '</td><td>' + money(n('issuedForCash')) + '</td></tr></table></section>' +
      '<section class="acc-page"><h2>COMPUTATION OF CHARGEABLE INCOME AND INCOME TAX FOR ' + f.year + ' YEAR OF ASSESSMENT</h2><table>' + row('PROFIT AS PER STATEMENT OF PROFIT OR LOSS', money(operatingBeforeFinance)) + row('ADD: DEPRECIATION', money(n('depreciation'))) + row('LESS: CAPITAL ALLOWANCE', money(capitalAllowance)) + row('WHT', money(n('wht'))) + row('CHARGEABLE INCOME', money(chargeableIncome), true) + row('INCOME TAX @25%', money(computedTax), true) + '</table></section>' +
      '</div>'
    printHtml('Financial Statements ' + f.year, html)
  }
  return <section className="page-grid two-columns accounts-exact-page"><div className="panel form-panel"><div className="panel-header"><div><p className="eyebrow">Exact annual accounts</p><h3>Values needed to generate accounts</h3></div></div><div className="alert info">These fields follow the uploaded Mezzo 2025 Accounts format: financial position, profit/loss, income surplus, equity changes, PPE schedule, capital allowance, taxation and notes.</div><div className="form-grid">{inputFields.map(([key, label]) => <Input key={key} label={label} type={['entityName','businessName','year','reportEndDate','reportEndDateLong','director1','director2'].includes(key) ? 'text' : 'number'} value={f[key]} onChange={value => set(key, value)} />)}</div></div><div className="panel wide-panel"><div className="panel-header stack-mobile"><div><p className="eyebrow">Preview</p><h3>Generated account totals</h3></div><button className="primary-btn" type="button" onClick={printAccounts}><Download size={17}/> Generate exact accounts PDF</button></div><ResponsiveTable columns={['Section','Generated value']} rows={[[ 'Turnover', money(n('turnover')) ], [ 'Administrative expenses', money(adminExpenses) ], [ 'Profit after tax', money(profitAfterTax) ], [ 'Closing income surplus', money(closingSurplus) ], [ 'Total assets', money(totalAssets) ], [ 'Equity plus current liabilities', money(equityTotal + currentLiabilities) ], [ 'Capital allowance', money(capitalAllowance) ], [ 'Chargeable income', money(chargeableIncome) ]]} empty="No values" /></div></section>
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', component + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (app.includes("{visiblePage === 'Accounts Generator' && <AccountsGeneratorPage data={data} />}")) {
  app = app.replace("{visiblePage === 'Accounts Generator' && <AccountsGeneratorPage data={data} />}", "{visiblePage === 'Accounts Generator' && <AccountsExactPage data={data} />}")
  changed = true
}

if (changed) write(appPath, app)

let css = read(stylesPath)
if (!css.includes('.accounts-book')) {
  css += String.raw`
.accounts-book { background:#fff; }
.accounts-book .acc-page { max-width: 820px; min-height: 1080px; margin: 0 auto 18px; padding: 44px 56px; background: #fff; color:#111; page-break-after: always; font-family: Arial, sans-serif; }
.accounts-book h1 { text-align:center; font-size: 28px; margin: 0 0 10px; }
.accounts-book h2 { text-align:center; font-size: 18px; line-height:1.35; margin: 8px 0 20px; }
.accounts-book h3 { font-size: 16px; text-decoration: underline; margin-top: 22px; }
.accounts-book table { width:100%; border-collapse: collapse; margin: 12px 0 22px; }
.accounts-book td, .accounts-book th { border-bottom: 1px solid #111; padding: 7px 8px; text-align:right; vertical-align:top; }
.accounts-book td:first-child, .accounts-book th:first-child { text-align:left; }
.accounts-book .acc-bold td { font-weight: 900; border-bottom: 3px double #111; }
.accounts-book .acc-cover { display:flex; flex-direction:column; justify-content:center; text-align:center; }
.accounts-book .auditor-block { margin-top: 60px; line-height: 1.6; }
.accounts-book .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap: 40px; margin-top: 45px; text-align:center; }
.accounts-exact-page .form-grid { max-height: 72vh; overflow-y:auto; padding-right: 6px; }
`
  write(stylesPath, css)
}

console.log('[patch-accounts-exact-v1] ready')
