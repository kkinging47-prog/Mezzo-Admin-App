import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const logoPath = new URL('../src/logoEnhancer.js', import.meta.url)

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }
function changed(name) { console.log(`[patch-finance-v2] ${name}`) }

let app = read(appPath)
let appChanged = false

if (!app.includes('function schoolGrossBillAmount')) {
  app = app.replace(
    `function schoolExpectedAmount(school) {
  const feeAmount = school.feeType === 'flat'
    ? toNumber(school.flatRate)
    : toNumber(school.students) * toNumber(school.feePerStudent)
  const bookAmount = school.term === 'Term 1'
    ? toNumber(school.booksBought) * toNumber(school.bookUnitPrice)
    : 0
  const arrearsAmount = toNumber(school.arrears)
  return feeAmount + bookAmount + arrearsAmount
}`,
    `function schoolGrossBillAmount(school) {
  const feeAmount = school.feeType === 'flat'
    ? toNumber(school.flatRate)
    : toNumber(school.students) * toNumber(school.feePerStudent)
  const bookAmount = school.term === 'Term 1'
    ? toNumber(school.booksBought) * toNumber(school.bookUnitPrice)
    : 0
  const arrearsAmount = toNumber(school.arrears)
  return feeAmount + bookAmount + arrearsAmount
}

function schoolDiscountAmount(school) {
  const percent = Math.min(Math.max(toNumber(school.discountPercent), 0), 100)
  return schoolGrossBillAmount(school) * (percent / 100)
}

function schoolExpectedAmount(school) {
  return Math.max(schoolGrossBillAmount(school) - schoolDiscountAmount(school), 0)
}

function schoolPaymentDatesLabel(school) {
  const items = [
    school.paymentDate1 ? '1st: ' + school.paymentDate1 : '',
    school.paymentDate2 ? '2nd: ' + school.paymentDate2 : '',
    school.paymentDate3 ? '3rd: ' + school.paymentDate3 : ''
  ].filter(Boolean)
  return items.length ? items.join(' • ') : 'Not set'
}`
  )
  appChanged = true
}

if (!app.includes('function salaryBillDeductedAmount')) {
  app = app.replace(
    `function salarySchoolContribution(staff) {
  return Math.min(Math.max(toNumber(staff?.schoolPaidAmount), 0), Math.max(payrollNet(staff), 0))
}

function companySalaryBalance(staff) {
  return Math.max(payrollNet(staff) - salarySchoolContribution(staff), 0)
}

function isSchoolPaidSalary(staff) {
  return staff?.paySource === 'School' && Boolean(staff?.paidBySchoolId) && salarySchoolContribution(staff) > 0
}

function schoolSalaryCreditAmount(schoolId, staffRecords = []) {
  return staffRecords
    .filter((staff) => staff.paidBySchoolId === schoolId && staff.paySource === 'School')
    .reduce((sum, staff) => sum + salarySchoolContribution(staff), 0)
}

function salaryPayerLabel(staff, schools = [], currency = 'GHS') {
  if (!isSchoolPaidSalary(staff)) return 'Company bank/cash'
  const school = schools.find((item) => item.id === staff.paidBySchoolId)
  const schoolAmount = salarySchoolContribution(staff)
  return (school ? school.name : 'School') + ' paid ' + formatMoney(schoolAmount, currency) + '; office balance ' + formatMoney(companySalaryBalance(staff), currency)
}`,
    `function salarySchoolContribution(staff) {
  return Math.min(Math.max(toNumber(staff?.schoolPaidAmount), 0), Math.max(payrollNet(staff), 0))
}

function companySalaryBalance(staff) {
  return Math.max(payrollNet(staff) - salarySchoolContribution(staff), 0)
}

function salaryBillDeductedAmount(staff) {
  if (staff?.paySource !== 'School' || !staff?.paidBySchoolId) return 0
  return (staff.deductSalaryFromBill || 'Yes') === 'Yes' ? salarySchoolContribution(staff) : 0
}

function isSchoolPaidSalary(staff) {
  return staff?.paySource === 'School' && Boolean(staff?.paidBySchoolId) && salarySchoolContribution(staff) > 0
}

function schoolSalaryCreditAmount(schoolId, staffRecords = []) {
  return staffRecords
    .filter((staff) => staff.paidBySchoolId === schoolId && staff.paySource === 'School')
    .reduce((sum, staff) => sum + salaryBillDeductedAmount(staff), 0)
}

function salaryPayerLabel(staff, schools = [], currency = 'GHS') {
  if (!isSchoolPaidSalary(staff)) return 'Company bank/cash'
  const school = schools.find((item) => item.id === staff.paidBySchoolId)
  const schoolAmount = salarySchoolContribution(staff)
  const billDeducted = salaryBillDeductedAmount(staff)
  const deductionText = billDeducted > 0 ? 'deducted from bill' : 'not deducted from bill'
  return (school ? school.name : 'School') + ' paid ' + formatMoney(schoolAmount, currency) + ' (' + deductionText + '); office balance ' + formatMoney(companySalaryBalance(staff), currency)
}`
  )
  appChanged = true
}

if (app.includes('const totalSchoolSalaryCredits = data.staff.reduce((sum, staff) => sum + salarySchoolContribution(staff), 0)')) {
  app = app.replace(
    'const totalSchoolSalaryCredits = data.staff.reduce((sum, staff) => sum + salarySchoolContribution(staff), 0)',
    'const totalSchoolSalaryCredits = data.staff.reduce((sum, staff) => sum + salaryBillDeductedAmount(staff), 0)'
  )
  appChanged = true
}

if (!app.includes('discountPercent:')) {
  app = app.replace(
    `    name: '', location: '', contactPerson: '', phone: '', email: '', term: 'Term 1', academicYear: '2026/2027',
    students: '', feeType: 'per_student', feePerStudent: '', flatRate: '', booksBought: '', bookUnitPrice: '', arrears: '', notes: ''`,
    `    name: '', location: '', contactPerson: '', phone: '', email: '', term: 'Term 1', academicYear: '2026/2027',
    students: '', feeType: 'per_student', feePerStudent: '', flatRate: '', booksBought: '', bookUnitPrice: '', arrears: '', discountPercent: '', paymentDate1: '', paymentDate2: '', paymentDate3: '', notes: ''`
  )
  app = app.replace(
    `      bookUnitPrice: form.term === 'Term 1' ? toNumber(form.bookUnitPrice) : 0,
      arrears: toNumber(form.arrears)`,
    `      bookUnitPrice: form.term === 'Term 1' ? toNumber(form.bookUnitPrice) : 0,
      arrears: toNumber(form.arrears),
      discountPercent: toNumber(form.discountPercent),
      paymentDate1: form.paymentDate1 || '',
      paymentDate2: form.paymentDate2 || '',
      paymentDate3: form.paymentDate3 || ''`
  )
  app = app.replace(
    `<Input label="Arrears / old balance to add to bill" type="number" value={form.arrears} onChange={(value) => setForm({ ...form, arrears: value })} />
          <Textarea label="Notes"`,
    `<Input label="Arrears / old balance to add to bill" type="number" value={form.arrears} onChange={(value) => setForm({ ...form, arrears: value })} />
          <Input label="School discount (%)" type="number" value={form.discountPercent} onChange={(value) => setForm({ ...form, discountPercent: value })} />
          <Input label="1st payment date" type="date" value={form.paymentDate1} onChange={(value) => setForm({ ...form, paymentDate1: value })} />
          <Input label="2nd payment date" type="date" value={form.paymentDate2} onChange={(value) => setForm({ ...form, paymentDate2: value })} />
          <Input label="3rd payment date" type="date" value={form.paymentDate3} onChange={(value) => setForm({ ...form, paymentDate3: value })} />
          <Textarea label="Notes"`
  )
  appChanged = true
}

if (!app.includes("Payment dates', 'Action'")) {
  app = app.replace(
    `columns={['School', 'Students', 'Expected', 'Paid', 'Salary credit', 'Owing', 'Action']}`,
    `columns={['School', 'Students', 'Expected', 'Discount', 'Paid', 'Salary credit', 'Owing', 'Payment dates', 'Action']}`
  )
  app = app.replace(
    `const salaryCredit = schoolSalaryCreditAmount(school.id, data.staff)
            const balance = expected - paid - salaryCredit
            return [`,
    `const salaryCredit = schoolSalaryCreditAmount(school.id, data.staff)
            const discount = schoolDiscountAmount(school)
            const balance = expected - paid - salaryCredit
            return [`
  )
  app = app.replace(
    `formatMoney(expected, data.settings.currency),
              formatMoney(paid, data.settings.currency),`,
    `formatMoney(expected, data.settings.currency),
              <span className="amount-success">{formatMoney(discount, data.settings.currency)}</span>,
              formatMoney(paid, data.settings.currency),`
  )
  app = app.replace(
    `<span className={balance > 0 ? 'amount-danger' : 'amount-success'}>{formatMoney(balance, data.settings.currency)}</span>,
              <div className="row-actions"><button onClick={() => startEdit(school)}>Edit</button><button className="danger-link" onClick={() => deleteSchool(school.id)}><Trash2 size={14} /></button></div>`,
    `<span className={balance > 0 ? 'amount-danger' : 'amount-success'}>{formatMoney(balance, data.settings.currency)}</span>,
              <span className="subtext">{schoolPaymentDatesLabel(school)}</span>,
              <div className="row-actions"><button onClick={() => startEdit(school)}>Edit</button><button className="danger-link" onClick={() => deleteSchool(school.id)}><Trash2 size={14} /></button></div>`
  )
  appChanged = true
}

if (!app.includes("Payment stage")) {
  app = app.replace(
    `const emptyPayment = { amount: '', datePaid: today(), mode: 'MoMo', reference: '', paidBy: '', notes: '' }`,
    `const emptyPayment = { amount: '', datePaid: today(), installment: '1st payment', mode: 'MoMo', reference: '', paidBy: '', notes: '' }`
  )
  app = app.replace(
    `datePaid: form.datePaid || today(),
      mode: form.mode,`,
    `datePaid: form.datePaid || today(),
      installment: form.installment || '1st payment',
      mode: form.mode,`
  )
  app = app.replace(
    `setForm({ amount: payment.amount, datePaid: payment.datePaid || today(), mode: payment.mode || 'MoMo', reference: payment.reference || '', paidBy: payment.paidBy || '', notes: payment.notes || '' })`,
    `setForm({ amount: payment.amount, datePaid: payment.datePaid || today(), installment: payment.installment || '1st payment', mode: payment.mode || 'MoMo', reference: payment.reference || '', paidBy: payment.paidBy || '', notes: payment.notes || '' })`
  )
  app = app.replace(
    `<Input label="Date paid" type="date" required value={form.datePaid} onChange={(value) => setForm({ ...form, datePaid: value })} />
          <Select label="Mode of payment"`,
    `<Input label="Date paid" type="date" required value={form.datePaid} onChange={(value) => setForm({ ...form, datePaid: value })} />
          <Select label="Payment stage" value={form.installment || '1st payment'} onChange={(value) => setForm({ ...form, installment: value })} options={['1st payment', '2nd payment', '3rd payment', 'Other payment']} />
          <Select label="Mode of payment"`
  )
  app = app.replace(
    `columns={['Receipt', 'School', 'Amount', 'Date', 'Mode', 'Action']}`,
    `columns={['Receipt', 'School', 'Amount', 'Stage', 'Date', 'Mode', 'Action']}`
  )
  app = app.replace(
    `formatMoney(payment.amount, currency),
             payment.datePaid,`,
    `formatMoney(payment.amount, currency),
             payment.installment || 'Payment',
             payment.datePaid,`
  )
  app = app.replace(
    `<tr><td>Payment on this receipt</td><td>\${formatMoney(payment.amount, settings.currency)}</td></tr>`,
    `<tr><td>Payment on this receipt (\${payment.installment || 'Payment'})</td><td>\${formatMoney(payment.amount, settings.currency)}</td></tr>`
  )
  appChanged = true
}

if (!app.includes('deductSalaryFromBill')) {
  app = app.replace(
    `schoolPaidAmount: '', notes: '' }`,
    `schoolPaidAmount: '', deductSalaryFromBill: 'Yes', notes: '' }`
  )
  app = app.replace(
    `schoolPaidAmount: form.paySource === 'School' ? toNumber(form.schoolPaidAmount) : 0`,
    `schoolPaidAmount: form.paySource === 'School' ? toNumber(form.schoolPaidAmount) : 0,
      deductSalaryFromBill: form.paySource === 'School' ? (form.deductSalaryFromBill || 'Yes') : 'No'`
  )
  app = app.replace(
    `{(form.paySource || 'Company') === 'School' && <Input label="Amount paid by school" type="number" value={form.schoolPaidAmount} onChange={(value) => setForm({ ...form, schoolPaidAmount: value })} />}`,
    `{(form.paySource || 'Company') === 'School' && <Input label="Amount paid by school" type="number" value={form.schoolPaidAmount} onChange={(value) => setForm({ ...form, schoolPaidAmount: value })} />}
          {(form.paySource || 'Company') === 'School' && <Select label="Deduct this from the school's bill?" value={form.deductSalaryFromBill || 'Yes'} onChange={(value) => setForm({ ...form, deductSalaryFromBill: value })} options={['Yes', 'No']} />}`
  )
  app = app.replace(
    `<span>Office pays balance: <strong>{formatMoney(companySalaryBalance(form), currency)}</strong></span>`,
    `<span>Office pays balance: <strong>{formatMoney(companySalaryBalance(form), currency)}</strong></span>
            <span>Bill deduction: <strong>{formatMoney(salaryBillDeductedAmount(form), currency)}</strong></span>`
  )
  appChanged = true
}

if (!app.includes('Gross bill:')) {
  app = app.replace(
    `<span>Expected bill: <strong>{formatMoney(expected, settings.currency)}</strong></span>
      {toNumber(school.arrears) > 0 && <span>Arrears included:`,
    `<span>Gross bill: <strong>{formatMoney(schoolGrossBillAmount(school), settings.currency)}</strong></span>
      {toNumber(school.discountPercent) > 0 && <span>School discount: <strong className="amount-success">{toNumber(school.discountPercent)}% / {formatMoney(schoolDiscountAmount(school), settings.currency)}</strong></span>}
      <span>Expected after discount: <strong>{formatMoney(expected, settings.currency)}</strong></span>
      {toNumber(school.arrears) > 0 && <span>Arrears included:`
  )
  appChanged = true
}

if (app.includes('const balance = Math.max(expected - totalPaid - salaryCredit, 0)') && !app.includes('const discount = school ? schoolDiscountAmount(school) : 0')) {
  app = app.replace(
    `const salaryCredit = school ? schoolSalaryCreditAmount(school.id, staff) : 0
  const balance = Math.max(expected - totalPaid - salaryCredit, 0)
  const arrears = school ? toNumber(school.arrears) : 0`,
    `const salaryCredit = school ? schoolSalaryCreditAmount(school.id, staff) : 0
  const discount = school ? schoolDiscountAmount(school) : 0
  const grossBill = school ? schoolGrossBillAmount(school) : expected
  const balance = Math.max(expected - totalPaid - salaryCredit, 0)
  const arrears = school ? toNumber(school.arrears) : 0`
  )
  app = app.replace(
    `<div class="box"><div class="muted">Total bill</div><h3>\${formatMoney(expected, settings.currency)}</h3><div class="muted">Arrears included: \${formatMoney(arrears, settings.currency)}</div></div>`,
    `<div class="box"><div class="muted">Gross bill</div><h3>\${formatMoney(grossBill, settings.currency)}</h3><div class="muted">Arrears included: \${formatMoney(arrears, settings.currency)}</div></div>
      <div class="box"><div class="muted">School discount</div><h3>\${formatMoney(discount, settings.currency)}</h3><div class="muted">Expected after discount: \${formatMoney(expected, settings.currency)}</div></div>`
  )
  appChanged = true
}

if (appChanged) {
  write(appPath, app)
  changed('App.jsx updated with discounts, payment stages, payment dates, and salary deduction modes')
}

let styles = read(stylesPath)
let stylesChanged = false

if (!styles.includes('scrollbar-color: rgba(255,255,255,.35) transparent')) {
  styles = styles.replace(
    `.sidebar { background: #0f172a; color: white; padding: 22px; display: flex; flex-direction: column; position: sticky; top: 0; min-height: 100vh; }`,
    `.sidebar { background: #0f172a; color: white; padding: 22px; display: flex; flex-direction: column; position: sticky; top: 0; min-height: 100vh; max-height: 100vh; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.35) transparent; }`
  )
  styles += `
.sidebar::-webkit-scrollbar { width: 8px; }
.sidebar::-webkit-scrollbar-track { background: transparent; }
.sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 999px; }
`
  stylesChanged = true
}

if (stylesChanged) {
  write(stylesPath, styles)
  changed('styles.css updated with sidebar scroll')
}

if (fs.existsSync(logoPath)) {
  let logo = read(logoPath)
  let logoChanged = false

  const oldPanelLookup = `  const panels = [...document.querySelectorAll('.panel')]
  const settingsPanel = panels.find((panel) => panel.textContent.includes('App settings') && panel.querySelector('form.form-grid'))
  if (!settingsPanel || settingsPanel.querySelector('.logo-upload-card')) return`
  const newPanelLookup = `  const activeTitle = document.querySelector('.topbar h2')?.textContent?.trim()
  if (activeTitle && activeTitle !== 'Settings') return
  const panels = [...document.querySelectorAll('.panel')]
  const settingsPanel = panels.find((panel) => panel.querySelector('.panel-header h3')?.textContent?.trim() === 'App settings' && panel.querySelector('form.form-grid'))
  if (!settingsPanel || settingsPanel.querySelector('.logo-upload-card')) return`
  if (logo.includes(oldPanelLookup)) {
    logo = logo.replace(oldPanelLookup, newPanelLookup)
    logoChanged = true
  }

  const oldSubmitSync = `
  form.addEventListener('submit', () => {
    const logo = getLogo()
    if (logo) setTimeout(() => syncLogoToSupabase(logo), 1200)
  }, true)
`
  if (logo.includes(oldSubmitSync)) {
    logo = logo.replace(oldSubmitSync, '\n')
    logoChanged = true
  }

  if (!logo.includes('window.__mezzoLogoEnhancerBooted')) {
    logo = logo.replace(
      `function bootLogoEnhancer() {
  injectLogoStyles()`,
      `function bootLogoEnhancer() {
  if (window.__mezzoLogoEnhancerBooted) return
  window.__mezzoLogoEnhancerBooted = true
  injectLogoStyles()`
    )
    logoChanged = true
  }

  if (logoChanged) {
    write(logoPath, logo)
    changed('logo enhancer made lighter to prevent Settings freeze')
  }
}

console.log('[patch-finance-v2] ready')
