import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }
function changed(name) { console.log(`[patch-payroll-receivables-v2] ${name}`) }

let app = read(appPath)
let appChanged = false

// Make the salary treatment logic accept clear text options, while still supporting old Yes/No data.
if (app.includes("return (staff.deductSalaryFromBill || 'Yes') === 'Yes' ? salarySchoolContribution(staff) : 0")) {
  app = app.replace(
    "return (staff.deductSalaryFromBill || 'Yes') === 'Yes' ? salarySchoolContribution(staff) : 0",
    "const treatment = staff.deductSalaryFromBill || 'Deduct from school bill'\n  return (treatment === 'Yes' || treatment === 'Deduct from school bill') ? salarySchoolContribution(staff) : 0"
  )
  appChanged = true
}

// Use clear option labels in the payroll form.
if (app.includes(`deductSalaryFromBill: form.paySource === 'School' ? (form.deductSalaryFromBill || 'Yes') : 'No'`)) {
  app = app.replace(
    `deductSalaryFromBill: form.paySource === 'School' ? (form.deductSalaryFromBill || 'Yes') : 'No'`,
    `deductSalaryFromBill: form.paySource === 'School' ? (form.deductSalaryFromBill || 'Deduct from school bill') : 'Do not deduct from school bill'`
  )
  appChanged = true
}

if (app.includes(`schoolPaidAmount: '', deductSalaryFromBill: 'Yes', notes: '' }`)) {
  app = app.replace(
    `schoolPaidAmount: '', deductSalaryFromBill: 'Yes', notes: '' }`,
    `schoolPaidAmount: '', deductSalaryFromBill: 'Deduct from school bill', notes: '' }`
  )
  appChanged = true
}

// Replace the old Yes/No select if it already exists.
if (app.includes(`Select label="Deduct this from the school's bill?"`)) {
  app = app.replace(
    `{(form.paySource || 'Company') === 'School' && <Select label="Deduct this from the school's bill?" value={form.deductSalaryFromBill || 'Yes'} onChange={(value) => setForm({ ...form, deductSalaryFromBill: value })} options={['Yes', 'No']} />}`,
    `{(form.paySource || 'Company') === 'School' && <Select label="Salary paid by school treatment" value={form.deductSalaryFromBill || 'Deduct from school bill'} onChange={(value) => setForm({ ...form, deductSalaryFromBill: value })} options={['Deduct from school bill', 'Do not deduct from school bill']} />}
          {(form.paySource || 'Company') === 'School' && <div className="field full-span"><span>Salary treatment guide</span><div className="salary-guide">Choose <strong>Deduct from school bill</strong> when the school-paid amount must reduce what the school owes Mezzo. Choose <strong>Do not deduct from school bill</strong> when the school paid the teacher separately and it should not reduce the bill.</div></div>}`
  )
  appChanged = true
}

// If the field was not inserted by older patches, insert it after Amount paid by school.
if (!app.includes('Salary paid by school treatment') && app.includes('Amount paid by school')) {
  app = app.replace(
    `{(form.paySource || 'Company') === 'School' && <Input label="Amount paid by school" type="number" value={form.schoolPaidAmount} onChange={(value) => setForm({ ...form, schoolPaidAmount: value })} />}`,
    `{(form.paySource || 'Company') === 'School' && <Input label="Amount paid by school" type="number" value={form.schoolPaidAmount} onChange={(value) => setForm({ ...form, schoolPaidAmount: value })} />}
          {(form.paySource || 'Company') === 'School' && <Select label="Salary paid by school treatment" value={form.deductSalaryFromBill || 'Deduct from school bill'} onChange={(value) => setForm({ ...form, deductSalaryFromBill: value })} options={['Deduct from school bill', 'Do not deduct from school bill']} />}
          {(form.paySource || 'Company') === 'School' && <div className="field full-span"><span>Salary treatment guide</span><div className="salary-guide">Choose <strong>Deduct from school bill</strong> when the school-paid amount must reduce what the school owes Mezzo. Choose <strong>Do not deduct from school bill</strong> when the school paid the teacher separately and it should not reduce the bill.</div></div>}`
  )
  appChanged = true
}

// Widen dashboard receivables table by tagging its panel.
if (!app.includes('dashboard-receivables-panel')) {
  app = app.replace(
    `<div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Receivables</p>`,
    `<div className="panel dashboard-receivables-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Receivables</p>`
  )
  appChanged = true
}

if (appChanged) {
  write(appPath, app)
  changed('App.jsx updated with visible salary deduction treatment and wider receivables panel tag')
}

let styles = read(stylesPath)
let stylesChanged = false

if (!styles.includes('.dashboard-receivables-panel')) {
  styles += `

.dashboard-receivables-panel {
  grid-column: 1 / -1 !important;
}

.dashboard-receivables-panel .table-wrap {
  width: 100%;
}

.dashboard-receivables-panel table {
  min-width: 900px;
}

.salary-guide {
  padding: 12px 13px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f8fafc;
  color: #334155;
  font-size: 13px;
  line-height: 1.6;
}
`
  stylesChanged = true
}

if (stylesChanged) {
  write(stylesPath, styles)
  changed('styles.css expanded dashboard receivables horizontally and styled salary guide')
}

console.log('[patch-payroll-receivables-v2] ready')
