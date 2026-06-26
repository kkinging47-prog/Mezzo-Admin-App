import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }
function changed(name) { console.log(`[patch-finance-v2-fix] ${name}`) }

let app = read(appPath)
let appChanged = false

if (!app.includes('School discount (%)')) {
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

if (!app.includes("Deduct this from the school's bill?")) {
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

if (appChanged) {
  write(appPath, app)
  changed('App.jsx form fields repaired')
}

console.log('[patch-finance-v2-fix] ready')
