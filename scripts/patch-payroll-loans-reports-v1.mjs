import fs from 'node:fs'
const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

if (!app.includes('function staffLoanBalance')) {
  app = app.replace('function payrollNet(staff) {\n  return payrollGross(staff) - payrollDeductions(staff)\n}', `function payrollNet(staff) {
  return payrollGross(staff) - payrollDeductions(staff)
}

function staffLoanBalance(staff) {
  return Math.max(toNumber(staff.loanAmount) + toNumber(staff.loanInterest) - toNumber(staff.loanPaid), 0)
}

function staffLoanMonthlyDeduction(staff) {
  return toNumber(staff.loanMonthlyDeduction)
}

function downloadStaffSalaryCsv(staffRecords = [], currency = 'GHS') {
  const headers = ['Staff name','Staff ID','Role','Net salary','MoMo number','Loan taken','Monthly deduction','Loan paid','Loan left']
  const rows = staffRecords.map((s) => [s.name || '', s.staffId || '', s.role || '', payrollNet(s), s.momoNumber || '', toNumber(s.loanAmount), toNumber(s.loanMonthlyDeduction), toNumber(s.loanPaid), staffLoanBalance(s)])
  const csv = [headers, ...rows].map((row) => row.map((cell) => '"' + String(cell).replaceAll('"', '""') + '"').join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'staff-salary-momo-loans-' + today() + '.csv'
  a.click()
  URL.revokeObjectURL(url)
}`)
  changed = true
}

if (!app.includes('momoNumber')) {
  app = app.replace(`paymentMode: 'Bank Transfer', notes: '' }`, `paymentMode: 'Bank Transfer', momoNumber: '', loanAmount: '', loanMonthlyDeduction: '', loanMonths: '', loanPaid: '', loanInterest: '', schoolDeductionMonths: '4', notes: '' }`)
  app = app.replace(`otherDeductions: toNumber(form.otherDeductions)`, `otherDeductions: toNumber(form.otherDeductions),
      loanAmount: toNumber(form.loanAmount),
      loanMonthlyDeduction: toNumber(form.loanMonthlyDeduction),
      loanMonths: toNumber(form.loanMonths),
      loanPaid: toNumber(form.loanPaid),
      loanInterest: toNumber(form.loanInterest),
      schoolDeductionMonths: toNumber(form.schoolDeductionMonths || 4)`) 
  app = app.replace(`<Input label="Bank account" value={form.bankAccount} onChange={(value) => setForm({ ...form, bankAccount: value })} />`, `<Input label="Bank account" value={form.bankAccount} onChange={(value) => setForm({ ...form, bankAccount: value })} />
          <Input label="MoMo number" value={form.momoNumber} onChange={(value) => setForm({ ...form, momoNumber: value })} />`)
  app = app.replace(`<Select label="Payment mode" value={form.paymentMode}`, `<Input label="Loan amount taken" type="number" value={form.loanAmount} onChange={(value) => setForm({ ...form, loanAmount: value })} />
          <Input label="Loan monthly deduction" type="number" value={form.loanMonthlyDeduction} onChange={(value) => setForm({ ...form, loanMonthlyDeduction: value })} />
          <Input label="Loan months" type="number" value={form.loanMonths} onChange={(value) => setForm({ ...form, loanMonths: value })} />
          <Input label="Loan amount paid" type="number" value={form.loanPaid} onChange={(value) => setForm({ ...form, loanPaid: value })} />
          <Input label="Loan interest" type="number" value={form.loanInterest} onChange={(value) => setForm({ ...form, loanInterest: value })} />
          <Input label="School salary deduction months" type="number" value={form.schoolDeductionMonths || 4} onChange={(value) => setForm({ ...form, schoolDeductionMonths: value })} />
          <Select label="Payment mode" value={form.paymentMode}`)
  app = app.replace(`<span>Net pay: <strong>{formatMoney(payrollNet(form), currency)}</strong></span>`, `<span>Net pay: <strong>{formatMoney(payrollNet(form), currency)}</strong></span>
            <span>Loan left: <strong>{formatMoney(staffLoanBalance(form), currency)}</strong></span>`) 
  changed = true
}

if (app.includes(`schoolSalaryCreditAmount(schoolId, staffRecords = [])`) && app.includes('salaryBillDeductedAmount(staff)') && !app.includes('schoolSalaryDeductionMonths')) {
  app = app.replace(`function salaryBillDeductedAmount(staff) {
  if (staff?.paySource !== 'School' || !staff?.paidBySchoolId) return 0
  return (staff.deductSalaryFromBill || 'Yes') === 'Yes' ? salarySchoolContribution(staff) : 0
}`, `function schoolSalaryDeductionMonths(staff) { return Math.max(toNumber(staff.schoolDeductionMonths || 4), 1) }

function salaryBillDeductedAmount(staff) {
  if (staff?.paySource !== 'School' || !staff?.paidBySchoolId) return 0
  const treatment = staff.deductSalaryFromBill || 'Deduct from school bill'
  return (treatment === 'Yes' || treatment === 'Deduct from school bill') ? salarySchoolContribution(staff) * schoolSalaryDeductionMonths(staff) : 0
}`)
  changed = true
}

if (!app.includes('Download salary CSV')) {
  app = app.replace(`<div className="panel-header"><div><p className="eyebrow">Payslips</p><h3>Staff salary records</h3></div></div>`, `<div className="panel-header stack-mobile"><div><p className="eyebrow">Payslips</p><h3>Staff salary records</h3></div><button className="secondary-btn" type="button" onClick={() => downloadStaffSalaryCsv(data.staff, currency)}><Download size={14} /> Download salary CSV</button></div>`)
  app = app.replace(`columns={['Staff', 'Gross', 'Deductions', 'Net Pay', 'Month', 'Action']}`, `columns={['Staff', 'MoMo', 'Gross', 'Deductions', 'Net Pay', 'Loan Left', 'Month', 'Action']}`)
  app = app.replace(`formatMoney(payrollGross(staff), currency),
             formatMoney(payrollDeductions(staff), currency),
             <strong>{formatMoney(payrollNet(staff), currency)}</strong>,
             staff.month,`, `staff.momoNumber || 'N/A',
             formatMoney(payrollGross(staff), currency),
             formatMoney(payrollDeductions(staff), currency),
             <strong>{formatMoney(payrollNet(staff), currency)}</strong>,
             formatMoney(staffLoanBalance(staff), currency),
             staff.month,`)
  changed = true
}

if (changed) write(appPath, app)
console.log('[patch-payroll-loans-reports-v1] ready')
