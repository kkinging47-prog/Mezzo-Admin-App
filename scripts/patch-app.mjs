import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const logoPath = new URL('../src/logoEnhancer.js', import.meta.url)

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }
function changed(name) { console.log(`[patch-app] ${name}`) }

let app = read(appPath)
if (!app.includes('function isSchoolPaidSalary')) {
  app = app.replace(
    "      paymentMode: 'Bank Transfer',\n      notes: 'Sample payslip record. Delete or edit after deployment.',",
    "      paymentMode: 'Bank Transfer',\n      paySource: 'Company',\n      paidBySchoolId: '',\n      notes: 'Sample payslip record. Delete or edit after deployment.',"
  )

  app = app.replace(
    "function payrollNet(staff) {\n  return payrollGross(staff) - payrollDeductions(staff)\n}\n",
    `function payrollNet(staff) {\n  return payrollGross(staff) - payrollDeductions(staff)\n}\n\nfunction isSchoolPaidSalary(staff) {\n  return staff?.paySource === 'School' && Boolean(staff?.paidBySchoolId)\n}\n\nfunction schoolSalaryCreditAmount(schoolId, staffRecords = []) {\n  return staffRecords\n    .filter((staff) => staff.paidBySchoolId === schoolId && staff.paySource === 'School')\n    .reduce((sum, staff) => sum + payrollNet(staff), 0)\n}\n\nfunction salaryPayerLabel(staff, schools = []) {\n  if (!isSchoolPaidSalary(staff)) return 'Company bank/cash'\n  const school = schools.find((item) => item.id === staff.paidBySchoolId)\n  return school ? school.name : 'School paid'\n}\n`
  )

  app = app.replace(
    `    const totalPayroll = data.staff.reduce((sum, staff) => sum + payrollNet(staff), 0)\n    const totalBooks = data.schools.reduce((sum, school) => sum + (school.term === 'Term 1' ? toNumber(school.booksBought) : 0), 0)\n    const remaining = Math.max(totalExpected - totalPaid, 0)\n    const estimatedBank = toNumber(data.settings.openingBankBalance) + totalPaid - totalExpenses - totalPayroll\n    const owingSchools = data.schools\n      .map((school) => {\n        const expected = schoolExpectedAmount(school)\n        const paid = schoolPaidAmount(school.id, data.payments)\n        return { ...school, expected, paid, balance: expected - paid }\n      })`,
    `    const totalPayroll = data.staff\n      .filter((staff) => !isSchoolPaidSalary(staff))\n      .reduce((sum, staff) => sum + payrollNet(staff), 0)\n    const totalSchoolSalaryCredits = data.staff\n      .filter(isSchoolPaidSalary)\n      .reduce((sum, staff) => sum + payrollNet(staff), 0)\n    const totalBooks = data.schools.reduce((sum, school) => sum + (school.term === 'Term 1' ? toNumber(school.booksBought) : 0), 0)\n    const remaining = Math.max(totalExpected - totalPaid - totalSchoolSalaryCredits, 0)\n    const estimatedBank = toNumber(data.settings.openingBankBalance) + totalPaid - totalExpenses - totalPayroll\n    const owingSchools = data.schools\n      .map((school) => {\n        const expected = schoolExpectedAmount(school)\n        const paid = schoolPaidAmount(school.id, data.payments)\n        const salaryCredit = schoolSalaryCreditAmount(school.id, data.staff)\n        return { ...school, expected, paid, salaryCredit, balance: expected - paid - salaryCredit }\n      })`
  )

  app = app.replace(
    'return { totalExpected, totalStudents, totalPaid, totalExpenses, totalPayroll, totalBooks, remaining, estimatedBank, owingSchools }',
    'return { totalExpected, totalStudents, totalPaid, totalExpenses, totalPayroll, totalSchoolSalaryCredits, totalBooks, remaining, estimatedBank, owingSchools }'
  )

  app = app.replace(
    `<StatCard title="Payments left to collect" value={formatMoney(financials.remaining, currency)} icon={<Landmark />} tone="warning" />\n        <StatCard title="Estimated bank position" value={formatMoney(financials.estimatedBank, currency)} icon={<WalletCards />} tone={financials.estimatedBank >= 0 ? 'success' : 'danger'} />`,
    `<StatCard title="Payments left to collect" value={formatMoney(financials.remaining, currency)} icon={<Landmark />} tone="warning" />\n        <StatCard title="School salary deductions" value={formatMoney(financials.totalSchoolSalaryCredits, currency)} icon={<Users />} tone="success" />\n        <StatCard title="Estimated bank position" value={formatMoney(financials.estimatedBank, currency)} icon={<WalletCards />} tone={financials.estimatedBank >= 0 ? 'success' : 'danger'} />`
  )
  app = app.replace('Total expenses + payroll', 'Expenses + company-paid payroll')

  app = app.replace(
    "columns={['School', 'Students', 'Expected', 'Paid', 'Owing']}",
    "columns={['School', 'Students', 'Expected', 'Paid', 'Salary paid by school', 'Owing']}"
  )
  app = app.replace(
    `formatMoney(school.paid, currency),\n            <span className="amount-danger">{formatMoney(school.balance, currency)}</span>`,
    `formatMoney(school.paid, currency),\n            <span className="amount-success">{formatMoney(school.salaryCredit, currency)}</span>,\n            <span className="amount-danger">{formatMoney(school.balance, currency)}</span>`
  )

  app = app.replace(
    "columns={['School', 'Students', 'Expected', 'Paid', 'Owing', 'Action']}",
    "columns={['School', 'Students', 'Expected', 'Paid', 'Salary credit', 'Owing', 'Action']}"
  )
  app = app.replace(
    `const balance = expected - paid\n            return [`,
    `const salaryCredit = schoolSalaryCreditAmount(school.id, data.staff)\n            const balance = expected - paid - salaryCredit\n            return [`
  )
  app = app.replace(
    `formatMoney(paid, data.settings.currency),\n              <span className={balance > 0 ? 'amount-danger' : 'amount-success'}>{formatMoney(balance, data.settings.currency)}</span>,`,
    `formatMoney(paid, data.settings.currency),\n              <span className="amount-success">{formatMoney(salaryCredit, data.settings.currency)}</span>,\n              <span className={balance > 0 ? 'amount-danger' : 'amount-success'}>{formatMoney(balance, data.settings.currency)}</span>,`
  )

  app = app.replace("{selectedSchool && <SchoolMiniSummary school={selectedSchool} payments={data.payments} settings={data.settings} />}", "{selectedSchool && <SchoolMiniSummary school={selectedSchool} payments={data.payments} staff={data.staff} settings={data.settings} />}")
  app = app.replace("\n    setTimeout(() => printReceipt(newPayment, selectedSchool, data.settings), 80)", '')
  app = app.replace('Save & generate receipt', 'Save payment')

  app = app.replace(
    `function SchoolMiniSummary({ school, payments, settings }) {\n  const expected = schoolExpectedAmount(school)\n  const paid = schoolPaidAmount(school.id, payments)\n  const balance = expected - paid`,
    `function SchoolMiniSummary({ school, payments, staff = [], settings }) {\n  const expected = schoolExpectedAmount(school)\n  const paid = schoolPaidAmount(school.id, payments)\n  const salaryCredit = schoolSalaryCreditAmount(school.id, staff)\n  const balance = expected - paid - salaryCredit`
  )
  app = app.replace(
    `<span>Paid: <strong>{formatMoney(paid, settings.currency)}</strong></span>\n      <span>Balance:`,
    `<span>Paid: <strong>{formatMoney(paid, settings.currency)}</strong></span>\n      <span>Salary paid by school: <strong className="amount-success">{formatMoney(salaryCredit, settings.currency)}</strong></span>\n      <span>Balance:`
  )

  app = app.replace(
    "const empty = { name: '', role: '', department: '', staffId: '', bankName: '', bankAccount: '', basicSalary: '', allowances: '', ssnit: '', tax: '', otherDeductions: '', month: new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' }), paidDate: today(), paymentMode: 'Bank Transfer', notes: '' }",
    "const empty = { name: '', role: '', department: '', staffId: '', bankName: '', bankAccount: '', basicSalary: '', allowances: '', ssnit: '', tax: '', otherDeductions: '', month: new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' }), paidDate: today(), paymentMode: 'Bank Transfer', paySource: 'Company', paidBySchoolId: '', notes: '' }"
  )
  app = app.replace(
    'otherDeductions: toNumber(form.otherDeductions)',
    "otherDeductions: toNumber(form.otherDeductions),\n      paySource: form.paySource || 'Company',\n      paidBySchoolId: form.paySource === 'School' ? form.paidBySchoolId : ''"
  )
  app = app.replace(
    `<Select label="Payment mode" value={form.paymentMode} onChange={(value) => setForm({ ...form, paymentMode: value })} options={['Bank Transfer', 'MoMo', 'Cash', 'Cheque']} />\n          <Textarea label="Notes"`,
    `<Select label="Payment mode" value={form.paymentMode} onChange={(value) => setForm({ ...form, paymentMode: value })} options={['Bank Transfer', 'MoMo', 'Cash', 'Cheque']} />\n          <Select label="Salary paid by" value={form.paySource || 'Company'} onChange={(value) => setForm({ ...form, paySource: value, paidBySchoolId: value === 'School' ? form.paidBySchoolId : '' })} options={['Company', 'School']} />\n          {(form.paySource || 'Company') === 'School' && <Select label="School that paid salary" value={form.paidBySchoolId} onChange={(value) => setForm({ ...form, paidBySchoolId: value })} options={data.schools.map((school) => [school.id, school.name])} />}\n          <Textarea label="Notes"`
  )
  app = app.replace(
    `<span>Net pay: <strong>{formatMoney(payrollNet(form), currency)}</strong></span>`,
    `<span>Net pay: <strong>{formatMoney(payrollNet(form), currency)}</strong></span>\n            <span>Paid by: <strong>{(form.paySource || 'Company') === 'School' ? 'School - deducted from balance' : 'Company bank/cash'}</strong></span>`
  )
  app = app.replace('Net payroll total', 'Company-paid net payroll')
  app = app.replace("columns={['Staff', 'Gross', 'Deductions', 'Net Pay', 'Month', 'Action']}", "columns={['Staff', 'Gross', 'Deductions', 'Net Pay', 'Paid By', 'Month', 'Action']}")
  app = app.replace(
    `<strong>{formatMoney(payrollNet(staff), currency)}</strong>,\n            staff.month,\n            <div className="row-actions"><button onClick={() => printPayslip(staff, data.settings)}>` ,
    `<strong>{formatMoney(payrollNet(staff), currency)}</strong>,\n            salaryPayerLabel(staff, data.schools),\n            staff.month,\n            <div className="row-actions"><button onClick={() => printPayslip(staff, data.settings)}>`
  )

  app = app.replace('Staff salary, SSNIT, tax and payslips</span>', 'Staff salary, SSNIT, tax and payslips</span>\n          <span>School-paid salaries deducted from balances</span>')

  app = app.replace(
    `function ResponsiveTable({ columns, rows, empty }) {\n  if (!rows || rows.length === 0) return <div className="empty-state">{empty}</div>\n  return (\n    <div className="table-wrap">`,
    `function ResponsiveTable({ columns, rows, empty, maxRows = 200 }) {\n  if (!rows || rows.length === 0) return <div className="empty-state">{empty}</div>\n  const visibleRows = rows.slice(0, maxRows)\n  return (\n    <>\n      {rows.length > maxRows && <div className="table-note">Showing the first {maxRows} of {rows.length} records to keep the page fast. Use search to narrow the list.</div>}\n      <div className="table-wrap">`
  )
  app = app.replace('rows.map((row, rowIndex)', 'visibleRows.map((row, rowIndex)')
  app = app.replace(`    </div>\n  )\n}\n\nexport default App`, `    </div>\n    </>\n  )\n}\n\nexport default App`)

  write(appPath, app)
  changed('App.jsx updated')
}

let styles = read(stylesPath)
if (!styles.includes('.table-note')) {
  styles = styles.replace('.salary-preview { grid-template-columns: repeat(3, 1fr); }', '.salary-preview { grid-template-columns: repeat(4, 1fr); }')
  styles = styles.replace(
    '.settings-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }',
    `.settings-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }\n.table-note { margin-bottom: 12px; padding: 10px 12px; border-radius: 12px; background: var(--blue-soft); color: #1e3a8a; font-size: 12px; font-weight: 700; }`
  )
  write(stylesPath, styles)
  changed('styles.css updated')
}

if (fs.existsSync(logoPath)) {
  let logo = read(logoPath)
  if (!logo.includes('let logoEnhancerScheduled')) {
    logo = logo.replace(
      `  const observer = new MutationObserver(() => {\n    applyLogoEverywhere()\n    injectSettingsUploader()\n  })`,
      `  let logoEnhancerScheduled = false\n  const observer = new MutationObserver(() => {\n    if (logoEnhancerScheduled) return\n    logoEnhancerScheduled = true\n    requestAnimationFrame(() => {\n      logoEnhancerScheduled = false\n      applyLogoEverywhere()\n      injectSettingsUploader()\n    })\n  })`
    )
    write(logoPath, logo)
    changed('logo enhancer debounced')
  }
}

console.log('[patch-app] ready')
