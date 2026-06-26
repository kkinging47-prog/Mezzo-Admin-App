import fs from 'node:fs'
const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

if (!app.includes('invoices: Array.isArray(parsed.invoices)')) {
  app = app.replace('companyDocs: Array.isArray(parsed.companyDocs) ? parsed.companyDocs : []', 'companyDocs: Array.isArray(parsed.companyDocs) ? parsed.companyDocs : [],\n    invoices: Array.isArray(parsed.invoices) ? parsed.invoices : []')
  changed = true
}

if (!app.includes('function invoiceLineTotal')) {
  app = app.replace('function formatMoney(value, currency = \'GHS\') {', `function invoiceLineTotal(row) { return toNumber(row.students) * toNumber(row.costPerHead) }
function invoiceSum(invoice) {
  const subtotal = (invoice.rows || []).reduce((s, r) => s + invoiceLineTotal(r), 0)
  const tax = subtotal * (toNumber(invoice.taxPercent) / 100)
  return { subtotal, tax, total: subtotal + tax }
}
function invoiceNumber(date = today()) {
  const p = String(date).split('-')
  return p.length === 3 ? 'MHLINV' + p[2] + '/' + p[1] + '/' + p[0].slice(-2) : 'MHLINV' + Date.now()
}
function makeInvoice(school, user) {
  const date = today(); const students = toNumber(school?.students)
  const rate = school?.feeType === 'flat' ? (students ? toNumber(school.flatRate) / students : toNumber(school?.flatRate)) : toNumber(school?.feePerStudent)
  const term = school?.term || 'Term 3'; const year = school?.academicYear || '2025/2026'
  return { id: '', schoolId: school?.id || '', schoolName: school?.name || '', location: school?.location || '', date, invoiceNo: invoiceNumber(date), title: 'INVOICE FOR MEZZO MATHS PROGRAM FOR ' + term.toUpperCase() + ' ' + year + ' ACADEMIC YEAR', rows: [{ id: uid('row'), description: term + ' Mezzo Maths Programme', students: students || '', costPerHead: rate || '' }], taxPercent: 7.5, terms: '60% at the end of the first month, 20% at the end of the second and third months.', paymentMode: 'Cheque into FBN BANK - Mezzo House - 0172030001948 - SANTA MARIA', note: 'Please note that the cost is termly.', preparedBy: user?.name || 'Admin' }
}
function printInvoice(invoice, settings) {
  const t = invoiceSum(invoice)
  const rows = (invoice.rows || []).map((r, i) => '<tr><td>' + (i + 1) + '</td><td>' + (r.description || '') + '</td><td>' + (r.students || 0) + '</td><td>' + toNumber(r.costPerHead).toLocaleString('en-GH') + '</td><td>' + invoiceLineTotal(r).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td></tr>').join('')
  const html = '<div class="paper" style="background:#eef5df;border:1px solid #6b7f2a"><div class="top"><div><h1>MEZZO HOUSE LTD.</h1><p>Name: ' + invoice.schoolName + '<br>Location: ' + invoice.location + '<br>Date: ' + invoice.date + '</p></div><div class="right"><strong>INVOICE NO.: ' + invoice.invoiceNo + '</strong><br>Post Office Box 1302<br>Kaneshie-North, Accra.<br>0244 257 632</div></div><h2 style="text-align:center;text-decoration:underline">' + invoice.title + '</h2><table><thead><tr><th>Item</th><th>Description</th><th>Students</th><th>Cost/head GH¢</th><th>Total GH¢</th></tr></thead><tbody>' + rows + '<tr class="total"><td colspan="4">Tax (' + invoice.taxPercent + '%)</td><td>' + t.tax.toLocaleString('en-GH', { minimumFractionDigits: 2 }) + '</td></tr><tr class="total"><td colspan="4">Total Balance</td><td>GH¢ ' + t.total.toLocaleString('en-GH', { minimumFractionDigits: 2 }) + '</td></tr></tbody></table><p><b>Terms of Payment:</b> ' + invoice.terms + '</p><p><b>Mode of payment:</b> ' + invoice.paymentMode + '</p><p><i>' + invoice.note + '</i></p></div>'
  printHtml('Invoice - ' + invoice.invoiceNo, html)
}
function formatMoney(value, currency = 'GHS') {`)
  changed = true
}

if (!app.includes('function InvoicesPage(')) {
  const comp = `
function InvoicesPage({ data, updateData, currentUser }) {
  const [schoolId, setSchoolId] = useState('')
  const [invoice, setInvoice] = useState(() => makeInvoice(null, currentUser))
  const totals = invoiceSum(invoice)
  function choose(id) { const school = data.schools.find(s => s.id === id); setSchoolId(id); setInvoice(makeInvoice(school, currentUser)) }
  function field(k, v) { setInvoice(o => ({ ...o, [k]: v })) }
  function row(i, k, v) { setInvoice(o => ({ ...o, rows: o.rows.map((r, x) => x === i ? { ...r, [k]: v } : r) })) }
  function save() { const t = invoiceSum(invoice); const saved = { ...invoice, id: invoice.id || uid('invoice'), schoolId, subtotal: t.subtotal, tax: t.tax, total: t.total, createdAt: invoice.createdAt || new Date().toISOString() }; updateData(p => ({ ...p, invoices: [saved, ...(p.invoices || []).filter(x => x.id !== saved.id)] })); setInvoice(saved); printInvoice(saved, data.settings) }
  return <section className="page-grid two-columns"><div className="panel form-panel"><div className="panel-header"><div><p className="eyebrow">Invoices</p><h3>School invoice</h3></div></div><div className="form-grid"><Select label="Select school" value={schoolId} onChange={choose} options={['', ...data.schools.map(s => [s.id, s.name])]} /><Input label="Date" type="date" value={invoice.date} onChange={v => field('date', v)} /><Input label="School name" value={invoice.schoolName} onChange={v => field('schoolName', v)} /><Input label="Location" value={invoice.location} onChange={v => field('location', v)} /><Input label="Invoice no." value={invoice.invoiceNo} onChange={v => field('invoiceNo', v)} /><Input label="Tax %" type="number" value={invoice.taxPercent} onChange={v => field('taxPercent', v)} /><Textarea label="Invoice heading" value={invoice.title} onChange={v => field('title', v)} /><Textarea label="Terms" value={invoice.terms} onChange={v => field('terms', v)} /><Textarea label="Mode of payment" value={invoice.paymentMode} onChange={v => field('paymentMode', v)} /></div><div className="alert info">Review or edit the school details before generating.</div></div><div className="panel wide-panel"><div className="panel-header"><div><p className="eyebrow">Items</p><h3>Bill details</h3></div><button className="secondary-btn" onClick={() => field('rows', [...invoice.rows, { id: uid('row'), description: '', students: '', costPerHead: '' }])}>Add item</button></div><div className="invoice-mini-lines">{invoice.rows.map((r, i) => <div className="invoice-mini-row" key={r.id || i}><Input label="Description" value={r.description} onChange={v => row(i, 'description', v)} /><Input label="Students" type="number" value={r.students} onChange={v => row(i, 'students', v)} /><Input label="Cost/head" type="number" value={r.costPerHead} onChange={v => row(i, 'costPerHead', v)} /><strong>{formatMoney(invoiceLineTotal(r), data.settings.currency)}</strong></div>)}</div><div className="invoice-summary-card"><span>Subtotal: <strong>{formatMoney(totals.subtotal, data.settings.currency)}</strong></span><span>Tax: <strong>{formatMoney(totals.tax, data.settings.currency)}</strong></span><span>Total: <strong>{formatMoney(totals.total, data.settings.currency)}</strong></span></div><button className="primary-btn" onClick={save}><Receipt size={17}/> Save & generate invoice</button><ResponsiveTable columns={['Invoice', 'School', 'Total', 'Action']} rows={(data.invoices || []).map(x => [x.invoiceNo, x.schoolName, formatMoney(x.total, data.settings.currency), <button onClick={() => printInvoice(x, data.settings)}>Print</button>])} empty="No invoices yet." /></div></section>
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', comp + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

app = app.replace(/const roleAccess = \{[\s\S]*?\n\}/, "const roleAccess = {\n  'Super Admin': ['Dashboard', 'Schools', 'Invoices', 'Payments', 'Expenses', 'Payroll', 'Country Updates', 'Company Documents', 'Admin Users', 'Settings'],\n  'CEO': ['Dashboard', 'Schools', 'Invoices', 'Payments', 'Expenses', 'Payroll', 'Country Updates', 'Company Documents', 'Settings'],\n  'HR/Marketing': ['Dashboard', 'Schools', 'Invoices', 'Payments', 'Expenses', 'Payroll', 'Country Updates', 'Company Documents'],\n  'Finance Admin': ['Dashboard', 'Schools', 'Invoices', 'Payments', 'Expenses', 'Payroll', 'Country Updates', 'Company Documents'],\n  'Viewer': ['Dashboard', 'Schools']\n}")
app = app.replace("{ name: 'Schools', icon: School },\n    { name: 'Payments', icon: Receipt },", "{ name: 'Schools', icon: School },\n    { name: 'Invoices', icon: FileText },\n    { name: 'Payments', icon: Receipt },")
app = app.replace("{visiblePage === 'Schools' && <SchoolsPage data={data} updateData={updateData} />}\n        {visiblePage === 'Payments'", "{visiblePage === 'Schools' && <SchoolsPage data={data} updateData={updateData} />}\n        {visiblePage === 'Invoices' && <InvoicesPage data={data} updateData={updateData} currentUser={currentUser} />}\n        {visiblePage === 'Payments'")
app = app.replace("options={['Super Admin', 'Finance Admin', 'Viewer']}", "options={['Super Admin', 'CEO', 'HR/Marketing', 'Finance Admin', 'Viewer']}")
changed = true

if (changed) { write(appPath, app); console.log('[patch-invoices-roles-v3] App.jsx updated') }
let css = read(stylesPath)
if (!css.includes('.invoice-mini-row')) {
  css += '\n.invoice-mini-lines{display:grid;gap:10px;margin-bottom:14px}.invoice-mini-row{display:grid;grid-template-columns:1fr 120px 120px 150px;gap:10px;align-items:end;padding:12px;border:1px solid var(--line);border-radius:14px;background:#f8fafc}.invoice-summary-card{display:flex;gap:14px;flex-wrap:wrap;justify-content:flex-end;margin:14px 0;padding:12px;border:1px solid var(--line);border-radius:14px;background:#f8fafc}@media(max-width:1000px){.invoice-mini-row{grid-template-columns:1fr 1fr}}\n'
  write(stylesPath, css)
}
console.log('[patch-invoices-roles-v3] ready')
