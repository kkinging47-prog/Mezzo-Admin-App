import fs from 'node:fs'
const appPath = new URL('../src/App.jsx', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p,s) => fs.writeFileSync(p,s)
let app = read(appPath)
let changed = false

if (app.includes('Total expenses + payroll')) {
  app = app.replace(`<StatCard title="Total expenses + payroll" value={formatMoney(financials.totalExpenses + financials.totalPayroll, currency)} icon={<FileText />} tone="danger" />`, `<StatCard title="Expenses only" value={formatMoney(financials.totalExpenses, currency)} icon={<FileText />} tone="danger" />
        <StatCard title="Salaries / payroll only" value={formatMoney(financials.totalPayroll, currency)} icon={<Users />} tone="warning" />`)
  changed = true
}

if (!app.includes('function FinancialReportsPage(')) {
  const comp = `
function FinancialReportsPage({ data, financials }) {
  const currency = data.settings.currency
  function printReport() {
    const html = '<div class="paper"><h1>' + data.settings.companyName + '</h1><h2>Financial Report - ' + today() + '</h2><table><tbody><tr><td>Total billings</td><td>' + formatMoney(financials.totalExpected, currency) + '</td></tr><tr><td>Payments received</td><td>' + formatMoney(financials.totalPaid, currency) + '</td></tr><tr><td>Payments left to collect</td><td>' + formatMoney(financials.remaining, currency) + '</td></tr><tr><td>Expenses only</td><td>' + formatMoney(financials.totalExpenses, currency) + '</td></tr><tr><td>Salaries / payroll only</td><td>' + formatMoney(financials.totalPayroll, currency) + '</td></tr><tr><td>Estimated bank position</td><td>' + formatMoney(financials.estimatedBank, currency) + '</td></tr></tbody></table><h3>Schools owing</h3><table><thead><tr><th>School</th><th>Expected</th><th>Paid</th><th>Owing</th></tr></thead><tbody>' + financials.owingSchools.map(s => '<tr><td>' + s.name + '</td><td>' + formatMoney(s.expected, currency) + '</td><td>' + formatMoney(s.paid, currency) + '</td><td>' + formatMoney(s.balance, currency) + '</td></tr>').join('') + '</tbody></table></div>'
    printHtml('Financial Report', html)
  }
  return <section className="page-stack"><div className="stats-grid"><StatCard title="Payments received" value={formatMoney(financials.totalPaid, currency)} icon={<Receipt />} /><StatCard title="Payments left" value={formatMoney(financials.remaining, currency)} icon={<Landmark />} tone="warning" /><StatCard title="Expenses only" value={formatMoney(financials.totalExpenses, currency)} icon={<FileText />} tone="danger" /><StatCard title="Salaries only" value={formatMoney(financials.totalPayroll, currency)} icon={<Users />} tone="warning" /></div><div className="panel dashboard-receivables-panel"><div className="panel-header stack-mobile"><div><p className="eyebrow">PDF report</p><h3>Financial report</h3></div><button className="primary-btn" onClick={printReport}><Download size={17}/> Download / share PDF</button></div><p className="subtext">Click the button, then choose Print or Save as PDF. You can share the saved PDF.</p><ResponsiveTable columns={['School','Expected','Paid','Owing']} rows={financials.owingSchools.map(s => [s.name, formatMoney(s.expected, currency), formatMoney(s.paid, currency), formatMoney(s.balance, currency)])} empty="No owing schools." /></div></section>
}

function AccountsGeneratorPage({ data }) {
  const [f, setF] = useState({ year: '2025', turnover: 130000, wages: 82800, printing: 18000, utilities: 6500, fuel: 8000, petty: 3500, depreciation: 3966, ppe: 68189, cash: 4187, receivables: 15000, payables: 31246, accruals: 9114, loan: 0, statedCapital: 30000, openingSurplus: -6400, capitalAllowance: 10337, wht: 5590, taxPaid: 2000 })
  const n = k => toNumber(f[k])
  const expenses = n('wages') + n('printing') + n('utilities') + n('fuel') + n('petty') + n('depreciation')
  const opProfit = n('turnover') - expenses
  const chargeable = opProfit + n('depreciation') - n('capitalAllowance') - n('wht')
  const tax = chargeable * 0.25
  const profitAfterTax = opProfit - tax
  const retained = n('openingSurplus') + profitAfterTax
  const currentAssets = n('cash') + n('receivables')
  const liabilities = n('payables') + n('accruals') + n('loan')
  const totalAssets = n('ppe') + currentAssets
  function set(k,v){ setF(o => ({...o,[k]:v})) }
  function printAccounts(){ const html = '<div class="paper"><h1>MEZZO HOUSE</h1><h2>Financial Statements for ' + f.year + '</h2><h3>Statement of Profit or Loss</h3><table><tbody><tr><td>Turnover</td><td>' + formatMoney(n('turnover'), data.settings.currency) + '</td></tr><tr><td>General & Administrative Expenses</td><td>' + formatMoney(expenses, data.settings.currency) + '</td></tr><tr><td>Profit before tax</td><td>' + formatMoney(opProfit, data.settings.currency) + '</td></tr><tr><td>Estimated tax @25%</td><td>' + formatMoney(tax, data.settings.currency) + '</td></tr><tr><td>Profit after tax</td><td>' + formatMoney(profitAfterTax, data.settings.currency) + '</td></tr></tbody></table><h3>Statement of Financial Position</h3><table><tbody><tr><td>Property, Plant and Equipment</td><td>' + formatMoney(n('ppe'), data.settings.currency) + '</td></tr><tr><td>Current assets</td><td>' + formatMoney(currentAssets, data.settings.currency) + '</td></tr><tr><td>Total assets</td><td>' + formatMoney(totalAssets, data.settings.currency) + '</td></tr><tr><td>Stated capital</td><td>' + formatMoney(n('statedCapital'), data.settings.currency) + '</td></tr><tr><td>Retained earnings</td><td>' + formatMoney(retained, data.settings.currency) + '</td></tr><tr><td>Current liabilities</td><td>' + formatMoney(liabilities, data.settings.currency) + '</td></tr></tbody></table></div>'; printHtml('Accounts ' + f.year, html) }
  return <section className="page-grid two-columns"><div className="panel form-panel"><div className="panel-header"><div><p className="eyebrow">Annual accounts</p><h3>Accounts generator</h3></div></div><div className="form-grid">{Object.keys(f).map(k => <Input key={k} label={k} type={k==='year' ? 'text' : 'number'} value={f[k]} onChange={v => set(k,v)} />)}</div></div><div className="panel wide-panel"><div className="panel-header stack-mobile"><div><p className="eyebrow">Generated values</p><h3>Financial statements preview</h3></div><button className="primary-btn" onClick={printAccounts}><Download size={17}/> Generate accounts PDF</button></div><ResponsiveTable columns={['Item','Amount']} rows={[[ 'Turnover', formatMoney(n('turnover'), data.settings.currency)], ['Expenses', formatMoney(expenses, data.settings.currency)], ['Profit after tax', formatMoney(profitAfterTax, data.settings.currency)], ['Total assets', formatMoney(totalAssets, data.settings.currency)], ['Retained earnings', formatMoney(retained, data.settings.currency)], ['Current liabilities', formatMoney(liabilities, data.settings.currency)]]} empty="No values" /></div></section>
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', comp + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (!app.includes("{ name: 'Financial Reports'")) {
  app = app.replace("{ name: 'Company Loans', icon: Landmark },", "{ name: 'Company Loans', icon: Landmark },\n    { name: 'Financial Reports', icon: BarChart3 },\n    { name: 'Accounts Generator', icon: Calculator },")
  app = app.replace("{visiblePage === 'Company Loans' && <CompanyLoansPage data={data} updateData={updateData} />}", "{visiblePage === 'Company Loans' && <CompanyLoansPage data={data} updateData={updateData} />}\n        {visiblePage === 'Financial Reports' && <FinancialReportsPage data={data} financials={financials} />}\n        {visiblePage === 'Accounts Generator' && <AccountsGeneratorPage data={data} />}")
  changed = true
}
app = app.replaceAll("'Company Loans', 'Country Updates'", "'Company Loans', 'Financial Reports', 'Accounts Generator', 'Country Updates'")
app = app.replaceAll("'Company Loans', 'Invoices', 'Country Updates'", "'Company Loans', 'Invoices', 'Financial Reports', 'Accounts Generator', 'Country Updates'")
changed = true
if (changed) write(appPath, app)
console.log('[patch-reports-accounts-v1] ready')
