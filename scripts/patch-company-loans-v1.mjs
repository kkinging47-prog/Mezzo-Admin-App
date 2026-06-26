import fs from 'node:fs'
const appPath = new URL('../src/App.jsx', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p,s) => fs.writeFileSync(p,s)
let app = read(appPath)
let changed = false

if (!app.includes('companyLoans: Array.isArray(parsed.companyLoans)')) {
  app = app.replace('invoices: Array.isArray(parsed.invoices) ? parsed.invoices : []', 'invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],\n    companyLoans: Array.isArray(parsed.companyLoans) ? parsed.companyLoans : []')
  changed = true
}

if (!app.includes('function CompanyLoansPage(')) {
  const comp = `
function companyLoanTotal(loan) { return toNumber(loan.amountTaken) + toNumber(loan.interest) }
function companyLoanLeft(loan) { return Math.max(companyLoanTotal(loan) - toNumber(loan.amountPaid), 0) }
function CompanyLoansPage({ data, updateData }) {
  const empty = { lender: '', purpose: '', dateTaken: today(), amountTaken: '', interest: '', monthlyPayment: '', months: '', amountPaid: '', notes: '' }
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const currency = data.settings.currency
  function save(event) { event.preventDefault(); const payload = { ...form, amountTaken: toNumber(form.amountTaken), interest: toNumber(form.interest), monthlyPayment: toNumber(form.monthlyPayment), months: toNumber(form.months), amountPaid: toNumber(form.amountPaid) }; updateData(p => editingId ? { ...p, companyLoans: p.companyLoans.map(x => x.id === editingId ? { ...x, ...payload } : x) } : { ...p, companyLoans: [{ id: uid('companyloan'), createdAt: new Date().toISOString(), ...payload }, ...(p.companyLoans || [])] }); setEditingId(null); setForm(empty) }
  function edit(loan) { setEditingId(loan.id); setForm({ ...empty, ...loan }) }
  function remove(id) { if (!confirm('Delete this company loan record?')) return; updateData(p => ({ ...p, companyLoans: (p.companyLoans || []).filter(x => x.id !== id) })) }
  return <section className="page-grid two-columns"><div className="panel form-panel"><div className="panel-header"><div><p className="eyebrow">Company loans</p><h3>{editingId ? 'Edit company loan' : 'Record company loan'}</h3></div></div><form className="form-grid" onSubmit={save}><Input label="Lender / institution" required value={form.lender} onChange={v => setForm({ ...form, lender: v })} /><Input label="Purpose" value={form.purpose} onChange={v => setForm({ ...form, purpose: v })} /><Input label="Date taken" type="date" value={form.dateTaken} onChange={v => setForm({ ...form, dateTaken: v })} /><Input label="Amount taken" type="number" value={form.amountTaken} onChange={v => setForm({ ...form, amountTaken: v })} /><Input label="Interest" type="number" value={form.interest} onChange={v => setForm({ ...form, interest: v })} /><Input label="Monthly payment" type="number" value={form.monthlyPayment} onChange={v => setForm({ ...form, monthlyPayment: v })} /><Input label="Number of months" type="number" value={form.months} onChange={v => setForm({ ...form, months: v })} /><Input label="Amount paid" type="number" value={form.amountPaid} onChange={v => setForm({ ...form, amountPaid: v })} /><Textarea label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} /><div className="form-actions"><button className="primary-btn" type="submit"><Plus size={17}/> {editingId ? 'Update loan' : 'Save loan'}</button>{editingId && <button className="secondary-btn" type="button" onClick={() => { setEditingId(null); setForm(empty) }}>Cancel</button>}</div></form></div><div className="panel wide-panel"><div className="panel-header"><div><p className="eyebrow">Loans</p><h3>Company loan payments</h3></div></div><ResponsiveTable columns={['Lender','Taken','Interest','Monthly','Paid','Left','Action']} rows={(data.companyLoans || []).map(l => [<strong>{l.lender}</strong>, formatMoney(l.amountTaken, currency), formatMoney(l.interest, currency), formatMoney(l.monthlyPayment, currency), formatMoney(l.amountPaid, currency), <strong>{formatMoney(companyLoanLeft(l), currency)}</strong>, <div className="row-actions"><button onClick={() => edit(l)}>Edit</button><button className="danger-link" onClick={() => remove(l.id)}><Trash2 size={14}/></button></div>])} empty="No company loans recorded yet." /></div></section>
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', comp + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (!app.includes("{ name: 'Company Loans'")) {
  app = app.replace("{ name: 'Payroll', icon: Users },", "{ name: 'Payroll', icon: Users },\n    { name: 'Company Loans', icon: Landmark },")
  app = app.replace("{visiblePage === 'Payroll' && <PayrollPage data={data} updateData={updateData} financials={financials} />}", "{visiblePage === 'Payroll' && <PayrollPage data={data} updateData={updateData} financials={financials} />}\n        {visiblePage === 'Company Loans' && <CompanyLoansPage data={data} updateData={updateData} />}")
  changed = true
}

app = app.replaceAll("'Payroll', 'Country Updates'", "'Payroll', 'Company Loans', 'Country Updates'")
app = app.replaceAll("'Payroll', 'Invoices', 'Country Updates'", "'Payroll', 'Company Loans', 'Invoices', 'Country Updates'")
changed = true
if (changed) write(appPath, app)
console.log('[patch-company-loans-v1] ready')
