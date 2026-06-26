import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

if (!app.includes('const [showPassword, setShowPassword]')) {
  app = app.replace(
    `const [submitting, setSubmitting] = useState(false)`,
    `const [submitting, setSubmitting] = useState(false)\n  const [showPassword, setShowPassword] = useState(false)`
  )
  changed = true
}

if (!app.includes('login-password-row')) {
  app = app.replace(
    `<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />`,
    `<div className="login-password-row"><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button></div>`
  )
  changed = true
}

if (!app.includes('function StableSettingsPage(')) {
  const stableSettings = String.raw`
function StableSettingsPage({ data, updateData }) {
  const [form, setForm] = useState(() => ({ ...data.settings }))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm({ ...data.settings })
  }, [data.settings])

  function updateField(field, value) {
    setForm((old) => ({ ...old, [field]: value }))
    setSaved(false)
  }

  function uploadLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateField('logoDataUrl', String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function save(event) {
    event.preventDefault()
    updateData((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        ...form,
        openingBankBalance: toNumber(form.openingBankBalance),
        nextReceiptNumber: toNumber(form.nextReceiptNumber) || 1
      }
    }))
    setSaved(true)
  }

  return (
    <section className="page-grid two-columns settings-safe-page">
      <div className="panel form-panel">
        <div className="panel-header"><div><p className="eyebrow">Settings</p><h3>Company and app settings</h3></div></div>
        <form className="form-grid" onSubmit={save}>
          <Input label="Company name" value={form.companyName || ''} onChange={(value) => updateField('companyName', value)} />
          <Input label="App name" value={form.appName || ''} onChange={(value) => updateField('appName', value)} />
          <Input label="Address" value={form.address || ''} onChange={(value) => updateField('address', value)} />
          <Input label="Phone" value={form.phone || ''} onChange={(value) => updateField('phone', value)} />
          <Input label="Email" value={form.email || ''} onChange={(value) => updateField('email', value)} />
          <Input label="Currency" value={form.currency || 'GHS'} onChange={(value) => updateField('currency', value)} />
          <Input label="Receipt prefix" value={form.receiptPrefix || 'MMA'} onChange={(value) => updateField('receiptPrefix', value)} />
          <Input label="Next receipt number" type="number" value={form.nextReceiptNumber || 1} onChange={(value) => updateField('nextReceiptNumber', value)} />
          <Input label="Opening bank balance" type="number" value={form.openingBankBalance || 0} onChange={(value) => updateField('openingBankBalance', value)} />
          <label className="field full-span"><span>Official company logo</span><input type="file" accept="image/*" onChange={uploadLogo} /></label>
          {form.logoDataUrl && <div className="settings-logo-preview full-span"><img src={form.logoDataUrl} alt="Company logo" /><span>Logo loaded. Click Save settings to apply.</span></div>}
          <div className="form-actions full-span"><button className="primary-btn" type="submit"><Settings size={17} /> Save settings</button></div>
        </form>
        {saved && <div className="alert success">Settings saved successfully.</div>}
      </div>
      <div className="panel wide-panel">
        <div className="panel-header"><div><p className="eyebrow">Stability fix</p><h3>Lightweight settings page</h3></div></div>
        <p className="subtext">This settings page avoids the old heavy logo watcher, so it should open without freezing. The logo will still show on the login page and printed documents after saving.</p>
        <ResponsiveTable columns={['Setting','Value']} rows={[
          ['Company', form.companyName || 'Not set'],
          ['App name', form.appName || 'Not set'],
          ['Currency', form.currency || 'GHS'],
          ['Receipt prefix', form.receiptPrefix || 'MMA'],
          ['Next receipt number', form.nextReceiptNumber || 1],
          ['Opening bank balance', formatMoney(form.openingBankBalance || 0, form.currency || 'GHS')]
        ]} />
      </div>
    </section>
  )
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', stableSettings + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (app.includes("{visiblePage === 'Settings' && <SettingsPage")) {
  app = app.replace(/\{visiblePage === 'Settings' && <SettingsPage[\s\S]*?\/>\}/, "{visiblePage === 'Settings' && <StableSettingsPage data={data} updateData={updateData} />}")
  changed = true
}

if (!app.includes('function AIAccountsAssistantPage(')) {
  const assistant = String.raw`
function accountsYearFromDate(value) {
  const text = String(value || '')
  const match = text.match(/20\d{2}/)
  return match ? match[0] : ''
}

function analyzeAccountsYear(data, year) {
  const y = String(year || '')
  const payments = (data.payments || []).filter((p) => accountsYearFromDate(p.datePaid || p.createdAt) === y)
  const expenses = (data.expenses || []).filter((e) => accountsYearFromDate(e.date || e.createdAt) === y)
  const payroll = (data.staff || []).filter((s) => accountsYearFromDate(s.paidDate || s.month || s.createdAt) === y || String(s.month || '').includes(y))
  const loans = data.companyLoans || []
  const turnoverCash = payments.reduce((sum, p) => sum + toNumber(p.amount), 0)
  const schoolExpected = (data.schools || []).reduce((sum, s) => sum + schoolExpectedAmount(s), 0)
  const paidAll = (data.payments || []).reduce((sum, p) => sum + toNumber(p.amount), 0)
  const receivables = Math.max(schoolExpected - paidAll, 0)
  const wages = payroll.reduce((sum, s) => sum + payrollNet(s), 0)
  const expensesOnly = expenses.reduce((sum, e) => sum + expenseTotal(e), 0)
  const loanBalance = loans.reduce((sum, l) => sum + (typeof companyLoanLeft === 'function' ? companyLoanLeft(l) : Math.max(toNumber(l.amountTaken) + toNumber(l.interest) - toNumber(l.amountPaid), 0)), 0)
  const estimatedCash = toNumber(data.settings.openingBankBalance) + paidAll - (data.expenses || []).reduce((sum, e) => sum + expenseTotal(e), 0) - (data.staff || []).reduce((sum, s) => sum + payrollNet(s), 0)
  const turnoverRecommended = Math.max(turnoverCash + receivables, schoolExpected, turnoverCash)
  const depreciation = Math.round(turnoverRecommended * 0.03)
  const adminExpenses = wages + expensesOnly + depreciation
  const profitBeforeTax = turnoverRecommended - adminExpenses
  const taxEstimate = Math.max(profitBeforeTax * 0.25, 0)
  return { year: y, turnoverCash, receivables, turnoverRecommended, wages, expensesOnly, depreciation, adminExpenses, profitBeforeTax, taxEstimate, profitAfterTax: profitBeforeTax - taxEstimate, loanBalance, estimatedCash, schoolExpected, paymentCount: payments.length, expenseCount: expenses.length, payrollCount: payroll.length }
}

function printAIAccountsDraft(analysis, data, notes) {
  const currency = data.settings.currency || 'GHS'
  const html = '<div class="paper"><h1>' + (data.settings.companyName || 'MEZZO HOUSE') + '</h1><h2>AI-Assisted Professional Accounts Draft for ' + analysis.year + '</h2><p>This draft follows the structure of the uploaded 2025 accounts document. Review figures, supporting documents, tax treatment, and classifications with a qualified accountant before GRA submission.</p><h3>AI Review Summary</h3><table><tbody><tr><td>Recommended turnover</td><td>' + formatMoney(analysis.turnoverRecommended, currency) + '</td></tr><tr><td>Wages / payroll</td><td>' + formatMoney(analysis.wages, currency) + '</td></tr><tr><td>Other expenses</td><td>' + formatMoney(analysis.expensesOnly, currency) + '</td></tr><tr><td>Estimated depreciation</td><td>' + formatMoney(analysis.depreciation, currency) + '</td></tr><tr><td>Estimated profit before tax</td><td>' + formatMoney(analysis.profitBeforeTax, currency) + '</td></tr><tr><td>Estimated tax @25%</td><td>' + formatMoney(analysis.taxEstimate, currency) + '</td></tr><tr><td>Estimated profit after tax</td><td>' + formatMoney(analysis.profitAfterTax, currency) + '</td></tr><tr><td>Receivables / owings</td><td>' + formatMoney(analysis.receivables, currency) + '</td></tr><tr><td>Company loan balance</td><td>' + formatMoney(analysis.loanBalance, currency) + '</td></tr></tbody></table><h3>Professional Checks Before GRA Submission</h3><ul><li>Confirm turnover with invoices, receipts, bank statements and receivables.</li><li>Confirm expenses with receipts and categorize them exactly as the 2025 accounts notes.</li><li>Confirm capital allowance classes and asset register.</li><li>Confirm WHT certificates, tax payments, payables, accruals and outstanding loans.</li><li>Use the Accounts Generator after review to print the final financial statements.</li></ul><h3>Admin Notes</h3><p>' + (notes || 'No notes entered.') + '</p></div>'
  printHtml('AI Accounts Review ' + analysis.year, html)
}

function AIAccountsAssistantPage({ data }) {
  const yearOptions = Array.from(new Set([
    String(new Date().getFullYear()),
    ...((data.payments || []).map((p) => accountsYearFromDate(p.datePaid || p.createdAt)).filter(Boolean)),
    ...((data.expenses || []).map((e) => accountsYearFromDate(e.date || e.createdAt)).filter(Boolean)),
    ...((data.staff || []).map((s) => accountsYearFromDate(s.paidDate || s.month || s.createdAt)).filter(Boolean))
  ])).sort().reverse()
  const [year, setYear] = useState(yearOptions[0] || String(new Date().getFullYear()))
  const [notes, setNotes] = useState('')
  const analysis = useMemo(() => analyzeAccountsYear(data, year), [data, year])
  return (
    <section className="page-stack ai-accounts-page">
      <div className="panel dashboard-receivables-panel">
        <div className="panel-header stack-mobile"><div><p className="eyebrow">AI accounts assistant</p><h3>Analyse selected year and prepare GRA-style accounts</h3></div><button className="primary-btn" type="button" onClick={() => printAIAccountsDraft(analysis, data, notes)}><Download size={17}/> Download AI review PDF</button></div>
        <div className="form-grid ai-assistant-controls"><Select label="Select financial year" value={year} onChange={setYear} options={yearOptions.length ? yearOptions : [year]} /><Textarea label="Notes for accountant / GRA review" value={notes} onChange={setNotes} /></div>
        <div className="alert warning">This assistant analyses your selected year and produces a professional draft based on the 2025 accounts format. A qualified accountant should review and approve final accounts before GRA submission.</div>
      </div>
      <div className="stats-grid">
        <StatCard title="Recommended turnover" value={formatMoney(analysis.turnoverRecommended, data.settings.currency)} icon={<Calculator />} />
        <StatCard title="Payroll / wages" value={formatMoney(analysis.wages, data.settings.currency)} icon={<Users />} tone="warning" />
        <StatCard title="Other expenses" value={formatMoney(analysis.expensesOnly, data.settings.currency)} icon={<FileText />} tone="danger" />
        <StatCard title="Estimated tax" value={formatMoney(analysis.taxEstimate, data.settings.currency)} icon={<Landmark />} tone="warning" />
      </div>
      <div className="panel dashboard-receivables-panel">
        <div className="panel-header"><div><p className="eyebrow">Analysis</p><h3>Values the assistant will use</h3></div></div>
        <ResponsiveTable columns={['Area','Value','Professional note']} rows={[
          ['Income / turnover', formatMoney(analysis.turnoverRecommended, data.settings.currency), 'Built from payments, receivables and school billing. Confirm against invoices and bank statement.'],
          ['Receivables / owings', formatMoney(analysis.receivables, data.settings.currency), 'Used as owings/receivables in the accounts notes.'],
          ['Wages', formatMoney(analysis.wages, data.settings.currency), 'Payroll records for selected year. Confirm SSNIT, PAYE and salary support.'],
          ['Other expenses', formatMoney(analysis.expensesOnly, data.settings.currency), 'Expense records for selected year. Confirm categories and receipts.'],
          ['Depreciation estimate', formatMoney(analysis.depreciation, data.settings.currency), 'Assistant estimate only. Replace with asset register depreciation.'],
          ['Company loans', formatMoney(analysis.loanBalance, data.settings.currency), 'Outstanding company loan balance from Company Loans page.'],
          ['Estimated cash/bank', formatMoney(analysis.estimatedCash, data.settings.currency), 'Compare with bank statement and cash book.']
        ]} />
      </div>
    </section>
  )
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', assistant + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (!app.includes("{ name: 'AI Accounts Assistant'")) {
  app = app.replace("{ name: 'Accounts Generator', icon: Calculator },", "{ name: 'Accounts Generator', icon: Calculator },\n    { name: 'AI Accounts Assistant', icon: FileText },")
  app = app.replace("{visiblePage === 'Accounts Generator' && <AccountsExactPage data={data} />}", "{visiblePage === 'Accounts Generator' && <AccountsExactPage data={data} />}\n        {visiblePage === 'AI Accounts Assistant' && <AIAccountsAssistantPage data={data} />}")
  changed = true
}

app = app.replaceAll("'Accounts Generator', 'Country Updates'", "'Accounts Generator', 'AI Accounts Assistant', 'Country Updates'")
app = app.replaceAll("'Accounts Generator', 'Invoices'", "'Accounts Generator', 'AI Accounts Assistant', 'Invoices'")
changed = true

if (changed) write(appPath, app)

let css = read(stylesPath)
if (!css.includes('/* Stability and wide session layout v1 */')) {
  css += String.raw`

/* Stability and wide session layout v1 */
.login-password-row { display:flex; gap:8px; align-items:center; }
.login-password-row input { flex:1; }
.login-password-row button { border:1px solid var(--line); background:#f8fafc; border-radius:12px; padding:0 14px; font-weight:800; height:44px; cursor:pointer; }
.main-content { overflow-x:auto; }
.page-grid.two-columns { grid-template-columns: minmax(520px, .85fr) minmax(820px, 1.45fr) !important; align-items:start; }
.wide-panel { min-width:0; overflow-x:auto; }
.wide-panel .table-wrap { width:100%; overflow-x:auto; }
.form-panel .form-grid { grid-template-columns: repeat(2, minmax(220px, 1fr)) !important; }
.form-panel .full-span, .form-panel textarea, .field.full-span { grid-column: 1 / -1; }
.settings-safe-page .form-panel { position: static !important; }
.settings-logo-preview { display:flex; align-items:center; gap:12px; padding:12px; border:1px solid var(--line); border-radius:14px; background:#f8fafc; }
.settings-logo-preview img { width:74px; height:74px; object-fit:contain; border-radius:12px; background:#fff; border:1px solid var(--line); }
.ai-assistant-controls { grid-template-columns: 260px minmax(360px, 1fr) !important; align-items:start; }
@media (max-width: 1200px) { .page-grid.two-columns { grid-template-columns: 1fr !important; } .form-panel .form-grid { grid-template-columns: 1fr !important; } }
`
  write(stylesPath, css)
}

console.log('[patch-ai-login-settings-layout-v1] ready')
