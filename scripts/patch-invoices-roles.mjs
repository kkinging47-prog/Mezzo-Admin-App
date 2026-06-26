import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }
function changed(name) { console.log(`[patch-invoices-roles] ${name}`) }

let app = read(appPath)
let appChanged = false

// Keep invoices in app data when cloud/local data is normalized.
if (!app.includes('invoices: Array.isArray(parsed.invoices)')) {
  app = app.replace(
    `companyDocs: Array.isArray(parsed.companyDocs) ? parsed.companyDocs : []`,
    `companyDocs: Array.isArray(parsed.companyDocs) ? parsed.companyDocs : [],
    invoices: Array.isArray(parsed.invoices) ? parsed.invoices : []`
  )
  appChanged = true
}

// Add invoice and executive/HR role permissions.
if (!app.includes("'HR/Marketing'")) {
  app = app.replace(
    `  'Super Admin': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll', 'Country Updates', 'Company Documents', 'Admin Users', 'Settings'],
  'Finance Admin': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll', 'Country Updates', 'Company Documents'],
  'Viewer': ['Dashboard', 'Schools']`,
    `  'Super Admin': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll', 'Invoices', 'Country Updates', 'Company Documents', 'Admin Users', 'Settings'],
  'Finance Admin': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll', 'Invoices', 'Country Updates', 'Company Documents'],
  'HR/Marketing': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll', 'Invoices', 'Country Updates', 'Company Documents'],
  'CEO': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll', 'Invoices', 'Country Updates', 'Company Documents'],
  'Viewer': ['Dashboard', 'Schools']`
  )
  appChanged = true
}

if (!app.includes("{ name: 'Invoices'")) {
  app = app.replace(
    `    { name: 'Payments', icon: Receipt },`,
    `    { name: 'Payments', icon: Receipt },
    { name: 'Invoices', icon: Receipt },`
  )
  app = app.replace(
    `        {visiblePage === 'Payments' && <PaymentsPage data={data} updateData={updateData} currentUser={currentUser} />}`,
    `        {visiblePage === 'Payments' && <PaymentsPage data={data} updateData={updateData} currentUser={currentUser} />}
        {visiblePage === 'Invoices' && <InvoicesPage data={data} updateData={updateData} currentUser={currentUser} />}`
  )
  appChanged = true
}

if (app.includes(`options={['Super Admin', 'Finance Admin', 'Viewer']}`)) {
  app = app.replace(
    `options={['Super Admin', 'Finance Admin', 'Viewer']}`,
    `options={['Super Admin', 'Finance Admin', 'HR/Marketing', 'CEO', 'Viewer']}`
  )
  appChanged = true
}

if (!app.includes('function invoiceEscape')) {
  const invoiceComponent = String.raw`
function invoiceEscape(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function makeInvoiceNumber(dateValue = today()) {
  const parts = String(dateValue || today()).split('-')
  if (parts.length === 3) return 'MHLINV' + parts[2] + '/' + parts[1] + '/' + parts[0].slice(-2)
  return 'MHLINV' + today().replaceAll('-', '').slice(2)
}

function defaultInvoiceRows(school) {
  const students = toNumber(school?.students)
  const unitCost = school?.feeType === 'flat'
    ? (students > 0 ? toNumber(school.flatRate) / students : toNumber(school.flatRate))
    : toNumber(school?.feePerStudent)
  return [{ id: uid('invrow'), description: 'Mezzo Maths Program', students, cost: unitCost }]
}

function invoiceRowTotal(row) {
  return toNumber(row.students) * toNumber(row.cost)
}

function invoiceSubtotal(rows = []) {
  return rows.reduce((sum, row) => sum + invoiceRowTotal(row), 0)
}

function InvoicesPage({ data, updateData, currentUser }) {
  const firstSchool = data.schools[0]
  const [schoolId, setSchoolId] = useState(firstSchool?.id || '')
  const [form, setForm] = useState({
    schoolName: firstSchool?.name || '',
    location: firstSchool?.location || '',
    date: today(),
    invoiceNo: makeInvoiceNumber(today()),
    title: firstSchool ? 'INVOICE FOR MEZZO MATHS PROGRAM FOR ' + String(firstSchool.term || 'TERM').toUpperCase() + ' ' + (firstSchool.academicYear || '') + ' ACADEMIC YEAR' : 'INVOICE FOR MEZZO MATHS PROGRAM',
    taxRate: 7.5,
    terms: '60% at the end of the first month, 20% at the end of the second and third months.',
    modeOfPayment: 'Cheque into\nFBN BANK\nMezzo House\n0172030001948\nSANTA MARIA',
    note: 'Please note that the cost is termly. Also an increase in the student populace must be communicated to our office on 0245 332495 in order to present bill for programme and booklets.'
  })
  const [rows, setRows] = useState(firstSchool ? defaultInvoiceRows(firstSchool) : [])

  const selectedSchool = data.schools.find((school) => school.id === schoolId)
  const currency = data.settings.currency || 'GHS'
  const subtotal = invoiceSubtotal(rows)
  const tax = subtotal * (toNumber(form.taxRate) / 100)
  const total = subtotal + tax

  function loadSchool(nextSchoolId) {
    setSchoolId(nextSchoolId)
    const school = data.schools.find((item) => item.id === nextSchoolId)
    if (!school) return
    const nextDate = today()
    setForm((previous) => ({
      ...previous,
      schoolName: school.name || '',
      location: school.location || '',
      date: nextDate,
      invoiceNo: makeInvoiceNumber(nextDate),
      title: 'INVOICE FOR MEZZO MATHS PROGRAM FOR ' + String(school.term || 'TERM').toUpperCase() + ' ' + (school.academicYear || '') + ' ACADEMIC YEAR'
    }))
    setRows(defaultInvoiceRows(school))
  }

  function updateRow(rowId, field, value) {
    setRows((previous) => previous.map((row) => row.id === rowId ? { ...row, [field]: value } : row))
  }

  function addRow() {
    setRows((previous) => [...previous, { id: uid('invrow'), description: '', students: 0, cost: 0 }])
  }

  function removeRow(rowId) {
    setRows((previous) => previous.filter((row) => row.id !== rowId))
  }

  function generateInvoice() {
    if (!form.schoolName.trim()) return alert('Select a school or enter the school name before generating the invoice.')
    if (!rows.length) return alert('Add at least one invoice line item.')

    const invoice = {
      id: uid('invoice'),
      schoolId: selectedSchool?.id || schoolId || '',
      schoolName: form.schoolName,
      location: form.location,
      date: form.date || today(),
      invoiceNo: form.invoiceNo || makeInvoiceNumber(form.date || today()),
      title: form.title,
      rows: rows.map((row, index) => ({ ...row, item: index + 1, students: toNumber(row.students), cost: toNumber(row.cost), total: invoiceRowTotal(row) })),
      taxRate: toNumber(form.taxRate),
      subtotal,
      tax,
      total,
      terms: form.terms,
      modeOfPayment: form.modeOfPayment,
      note: form.note,
      createdBy: currentUser?.name || 'Admin',
      createdAt: new Date().toISOString()
    }

    updateData((previous) => ({ ...previous, invoices: [invoice, ...(previous.invoices || [])] }))
    printInvoice(invoice, data.settings)
  }

  return (
    <section className="page-grid two-columns invoice-page-grid">
      <div className="panel form-panel invoice-form-panel">
        <div className="panel-header"><div><p className="eyebrow">School invoices</p><h3>Generate invoice</h3></div></div>
        <div className="form-grid">
          <Select label="Select school" value={schoolId} onChange={loadSchool} options={data.schools.map((school) => [school.id, school.name])} />
          <Input label="Invoice date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value, invoiceNo: makeInvoiceNumber(value) })} />
          <Input label="School name" value={form.schoolName} onChange={(value) => setForm({ ...form, schoolName: value })} />
          <Input label="Location" value={form.location} onChange={(value) => setForm({ ...form, location: value })} />
          <Input label="Invoice number" value={form.invoiceNo} onChange={(value) => setForm({ ...form, invoiceNo: value })} />
          <Input label="Tax rate (%)" type="number" value={form.taxRate} onChange={(value) => setForm({ ...form, taxRate: value })} />
          <Textarea label="Invoice title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Textarea label="Terms of payment" value={form.terms} onChange={(value) => setForm({ ...form, terms: value })} />
          <Textarea label="Mode of payment" value={form.modeOfPayment} onChange={(value) => setForm({ ...form, modeOfPayment: value })} />
          <Textarea label="Invoice note" value={form.note} onChange={(value) => setForm({ ...form, note: value })} />
        </div>
      </div>

      <div className="panel wide-panel invoice-preview-panel">
        <div className="panel-header stack-mobile">
          <div><p className="eyebrow">Preview and edit</p><h3>Invoice items</h3></div>
          <button className="secondary-btn" type="button" onClick={addRow}><Plus size={16} /> Add item</button>
        </div>
        <div className="invoice-lines-editor">
          <div className="invoice-line-head"><span>Description</span><span>Students</span><span>Cost/head</span><span>Total</span><span></span></div>
          {rows.map((row) => (
            <div className="invoice-line-row" key={row.id}>
              <input value={row.description || ''} onChange={(event) => updateRow(row.id, 'description', event.target.value)} placeholder="e.g. Grade 1" />
              <input type="number" value={row.students ?? ''} onChange={(event) => updateRow(row.id, 'students', event.target.value)} />
              <input type="number" value={row.cost ?? ''} onChange={(event) => updateRow(row.id, 'cost', event.target.value)} />
              <strong>{formatMoney(invoiceRowTotal(row), currency)}</strong>
              <button className="danger-link" type="button" onClick={() => removeRow(row.id)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="invoice-summary-card">
          <span>Subtotal: <strong>{formatMoney(subtotal, currency)}</strong></span>
          <span>Tax ({toNumber(form.taxRate)}%): <strong>{formatMoney(tax, currency)}</strong></span>
          <span>Total Balance: <strong>{formatMoney(total, currency)}</strong></span>
        </div>
        <button className="primary-btn" type="button" onClick={generateInvoice}><Receipt size={17} /> Generate / print invoice</button>

        <div className="invoice-history">
          <h4>Generated invoices</h4>
          <ResponsiveTable
            columns={['Invoice No.', 'School', 'Date', 'Total', 'Action']}
            rows={(data.invoices || []).map((invoice) => [
              <strong>{invoice.invoiceNo}</strong>,
              invoice.schoolName,
              invoice.date,
              formatMoney(invoice.total, currency),
              <button className="secondary-btn" onClick={() => printInvoice(invoice, data.settings)}><Download size={14} /> Reprint</button>
            ])}
            empty="No invoices generated yet."
          />
        </div>
      </div>
    </section>
  )
}

function printInvoice(invoice, settings) {
  const currency = settings.currency || 'GHS'
  const logo = settings.logoDataUrl || ''
  const rowsHtml = (invoice.rows || []).map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${invoiceEscape(row.description)}</td>
      <td>${toNumber(row.students).toLocaleString()}</td>
      <td>${toNumber(row.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>${toNumber(row.total ?? invoiceRowTotal(row)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>`).join('')

  const totalStudents = (invoice.rows || []).reduce((sum, row) => sum + toNumber(row.students), 0)
  const logoHtml = logo ? `<img class="invoice-logo" src="${invoiceEscape(logo)}" alt="Mezzo House logo">` : `<div class="invoice-logo-fallback">M</div>`

  const html = `
  <div class="invoice-document">
    <div class="invoice-accent"></div>
    <div class="invoice-header">
      <div class="invoice-brand">${logoHtml}<div><h1>MEZZO HOUSE<br>LTD.</h1></div></div>
      <div class="invoice-contact">
        <strong>Post Office Box 1302</strong><br>
        Kaneshie-North, Accra.<br>
        +233 (0) 244 257 632<br>
        +233 (0) 245 332 495<br>
        mezzooffice@gmail.com<br>
        mezzohouse@yahoo.com
      </div>
    </div>

    <div class="invoice-meta">
      <div>
        <p><strong>Name</strong> : ${invoiceEscape(invoice.schoolName)}</p>
        <p><strong>Location</strong> : ${invoiceEscape(invoice.location)}</p>
        <p><strong>Date</strong> : ${invoiceEscape(invoice.date)}</p>
      </div>
      <div class="invoice-no"><strong>INVOICE NO.:</strong> ${invoiceEscape(invoice.invoiceNo)}</div>
    </div>

    <h2>${invoiceEscape(invoice.title)}</h2>

    <table class="invoice-table">
      <thead><tr><th>Item</th><th>Description</th><th>Number of students</th><th>Cost per head<br>${currency}</th><th>Total Amount<br>${currency}</th></tr></thead>
      <tbody>
        ${rowsHtml}
        <tr class="invoice-total-row"><td></td><td></td><td>${totalStudents.toLocaleString()}</td><td></td><td>${toNumber(invoice.subtotal).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td></tr>
        <tr><td>${(invoice.rows || []).length + 1}</td><td><strong>Tax (${toNumber(invoice.taxRate)}%)</strong></td><td></td><td></td><td>${toNumber(invoice.tax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
        <tr class="grand-total"><td colspan="4">Total Balance</td><td>${currency} ${toNumber(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
      </tbody>
    </table>

    <div class="invoice-terms"><strong>Terms of Payment:</strong> ${invoiceEscape(invoice.terms)}</div>
    <div class="invoice-payment"><strong>Mode of payment:</strong><br>${invoiceEscape(invoice.modeOfPayment).replace(/\n/g, '<br>')}</div>
    <p class="invoice-note"><em>${invoiceEscape(invoice.note)}</em></p>
  </div>`

  const css = `<style>
    body{background:#f4f4f4;padding:22px;font-family:Arial,Helvetica,sans-serif;color:#111827}.invoice-document{max-width:820px;margin:0 auto;background:#f5f7df;position:relative;padding:28px 30px 30px 86px;border:1px solid #7a8f2c;box-shadow:0 18px 50px rgba(0,0,0,.16);overflow:hidden}.invoice-accent{position:absolute;left:0;top:0;bottom:0;width:70px;background:linear-gradient(160deg,#8ab51e,#c6d880 38%,#8ab51e);opacity:.9}.invoice-accent:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(50deg,rgba(255,255,255,.35) 0 3px,transparent 3px 18px)}.invoice-header{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.invoice-brand{display:flex;gap:16px;align-items:center}.invoice-logo,.invoice-logo-fallback{width:95px;height:82px;object-fit:contain;background:white;border-radius:4px}.invoice-logo-fallback{display:grid;place-items:center;font-size:44px;font-weight:900;color:#123}.invoice-brand h1{font-family:Georgia,serif;font-size:32px;line-height:1.05;margin:0}.invoice-contact{text-align:right;color:#1262a3;font-size:14px;line-height:1.35}.invoice-meta{border-bottom:2px solid #111;margin:18px 0 10px;padding-bottom:10px;display:flex;justify-content:space-between;gap:16px;font-size:15px}.invoice-meta p{margin:3px 0}.invoice-no{align-self:end;font-size:15px}.invoice-document h2{text-align:center;text-decoration:underline;font-family:Georgia,serif;font-size:22px;line-height:1.25;margin:12px 0 14px}.invoice-table{width:100%;border-collapse:collapse;background:rgba(255,255,255,.18)}.invoice-table th,.invoice-table td{border:1px solid #111;padding:8px;text-align:center;font-size:14px}.invoice-table th{font-family:Georgia,serif;font-size:15px}.invoice-table td:nth-child(2),.invoice-table th:nth-child(2){text-align:left}.invoice-total-row td,.grand-total td{font-weight:800}.grand-total td{font-family:Georgia,serif;font-size:18px;text-align:right}.invoice-terms{border:1px solid #111;border-top:0;padding:8px;font-size:14px}.invoice-payment{padding:12px 8px;font-size:15px;line-height:1.35}.invoice-note{border:1px solid #111;border-top:0;margin:12px 0 0;padding:8px;font-size:13px;line-height:1.45;font-weight:700}.actions{max-width:820px;margin:16px auto;text-align:center}.print{padding:12px 18px;border:0;background:#0f172a;color:#fff;border-radius:10px;font-weight:800;cursor:pointer}@media print{body{background:#fff;padding:0}.invoice-document{box-shadow:none;margin:0;max-width:none;min-height:100vh}.actions{display:none}}
  </style>`

  const win = window.open('', '_blank', 'width=900,height=1000')
  if (!win) return alert('Please allow popups so the invoice can open for printing or saving as PDF.')
  win.document.write(`<!doctype html><html><head><title>${invoiceEscape(invoice.invoiceNo)}</title>${css}</head><body>${html}<div class="actions"><button class="print" onclick="window.print()">Print / Save as PDF</button></div></body></html>`)
  win.document.close()
  win.focus()
}

`
  app = app.replace(
    `function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {`,
    invoiceComponent + `function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {`
  )
  appChanged = true
}

if (appChanged) {
  write(appPath, app)
  changed('App.jsx updated with invoice generator and HR/CEO permissions')
}

let styles = read(stylesPath)
let stylesChanged = false

if (!styles.includes('.invoice-lines-editor')) {
  styles += `

.invoice-page-grid {
  grid-template-columns: minmax(360px, 430px) minmax(620px, 1fr) !important;
}
.invoice-lines-editor { display: grid; gap: 9px; margin-bottom: 16px; }
.invoice-line-head,
.invoice-line-row { display: grid; grid-template-columns: 1.5fr .55fr .65fr .75fr 48px; gap: 8px; align-items: center; }
.invoice-line-head { color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; font-weight: 900; }
.invoice-line-row input { width: 100%; border: 1px solid var(--line); border-radius: 11px; padding: 10px 11px; background: #fff; }
.invoice-summary-card { display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-end; padding: 13px; border: 1px solid var(--line); border-radius: 15px; background: #f8fafc; margin-bottom: 14px; }
.invoice-summary-card span { color: #334155; font-size: 13px; }
.invoice-summary-card strong { color: #0f172a; }
.invoice-history { margin-top: 24px; }
.invoice-history h4 { margin: 0 0 12px; }
@media (max-width: 900px) {
  .invoice-line-head { display: none; }
  .invoice-line-row { grid-template-columns: 1fr 1fr; border: 1px solid var(--line); border-radius: 14px; padding: 10px; }
}
`
  stylesChanged = true
}

if (stylesChanged) {
  write(stylesPath, styles)
  changed('styles.css updated for invoice generator')
}

console.log('[patch-invoices-roles] ready')
