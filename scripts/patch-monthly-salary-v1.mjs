import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

if (!app.includes('monthlySalarySheets: Array.isArray(parsed.monthlySalarySheets)')) {
  if (app.includes('termArchives: Array.isArray(parsed.termArchives) ? parsed.termArchives : []')) {
    app = app.replace('termArchives: Array.isArray(parsed.termArchives) ? parsed.termArchives : []', 'termArchives: Array.isArray(parsed.termArchives) ? parsed.termArchives : [],\n    monthlySalarySheets: Array.isArray(parsed.monthlySalarySheets) ? parsed.monthlySalarySheets : []')
  } else if (app.includes('staff: Array.isArray(parsed.staff) ? parsed.staff : []')) {
    app = app.replace('staff: Array.isArray(parsed.staff) ? parsed.staff : []', 'staff: Array.isArray(parsed.staff) ? parsed.staff : [],\n    monthlySalarySheets: Array.isArray(parsed.monthlySalarySheets) ? parsed.monthlySalarySheets : []')
  }
  changed = true
}

if (!app.includes('function uniqueSalaryStaffList')) {
  const helpers = String.raw`
function uniqueSalaryStaffList(staffRecords = []) {
  const map = new Map()
  ;(staffRecords || []).forEach((staff) => {
    const key = staff.staffId || staff.name || staff.id
    if (!key) return
    const previous = map.get(key) || {}
    map.set(key, {
      ...previous,
      ...staff,
      id: staff.id || previous.id || uid('staffref'),
      staffKey: key,
      name: staff.name || previous.name || 'Unnamed staff',
      staffId: staff.staffId || previous.staffId || '',
      role: staff.role || previous.role || '',
      defaultAmount: payrollNet(staff) || payrollNet(previous) || toNumber(staff.basicSalary) || 0,
      momoNumber: staff.momoNumber || previous.momoNumber || staff.phone || previous.phone || '',
      paymentMode: staff.paymentMode || previous.paymentMode || 'MTN MoMo',
      paySource: staff.paySource || previous.paySource || 'Company',
      paidBySchoolId: staff.paidBySchoolId || previous.paidBySchoolId || ''
    })
  })
  return Array.from(map.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)))
}

function salarySheetTotal(sheet) {
  return (sheet.rows || []).reduce((sum, row) => sum + toNumber(row.amount), 0)
}

function printMonthlySalarySheet(sheet, settings, schools = []) {
  const currency = settings.currency || 'GHS'
  const logo = settings.logoDataUrl ? '<img src="' + String(settings.logoDataUrl).replace(/"/g, '&quot;') + '" style="width:82px;height:70px;object-fit:contain" />' : '<strong>MEZZO</strong>'
  const rowsHtml = (sheet.rows || []).map((row, index) => {
    const school = schools.find((item) => item.id === row.schoolId)
    const payer = row.paidBy === 'School' ? 'School' + (school ? ' - ' + school.name : '') : 'Company'
    return '<tr><td>' + (index + 1) + '</td><td><strong>' + (row.name || '') + '</strong><br><small>' + (row.staffId || '') + '</small></td><td>' + (row.role || '') + '</td><td>' + payer + '</td><td>' + (row.paymentMode || '') + '</td><td>' + (row.payNumber || '') + '</td><td style="text-align:right">' + formatMoney(row.amount, currency) + '</td></tr>'
  }).join('')
  const html = '<div class="paper"><div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:18px"><div>' + logo + '</div><div style="text-align:right"><h1 style="margin:0">' + (settings.companyName || 'Mezzo Maths Ltd') + '</h1><p style="margin:4px 0">Monthly Salary Payment Schedule</p></div></div><h2>' + (sheet.month || '') + '</h2><table><thead><tr><th>#</th><th>Staff</th><th>Role</th><th>Paid by</th><th>Mode</th><th>Number / Account</th><th>Amount</th></tr></thead><tbody>' + rowsHtml + '<tr class="total"><td colspan="6" style="text-align:right"><strong>Total salary for ' + (sheet.month || '') + '</strong></td><td style="text-align:right"><strong>' + formatMoney(salarySheetTotal(sheet), currency) + '</strong></td></tr></tbody></table><p><strong>Prepared by:</strong> ' + (sheet.preparedBy || 'Admin') + '</p><p><strong>Date generated:</strong> ' + today() + '</p></div>'
  printHtml('Monthly Salary Sheet - ' + (sheet.month || today()), html)
}
`
  app = app.replace('function formatMoney(value, currency = \'GHS\') {', helpers + '\nfunction formatMoney(value, currency = \'GHS\') {')
  changed = true
}

if (!app.includes('function MonthlySalariesPage(')) {
  const component = String.raw`
function MonthlySalariesPage({ data, updateData, currentUser }) {
  const staffList = useMemo(() => uniqueSalaryStaffList(data.staff || []), [data.staff])
  const monthOptions = ['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026', 'January 2027', 'February 2027', 'March 2027', 'April 2027', 'May 2027', 'June 2027', 'July 2027', 'August 2027', 'September 2027', 'October 2027', 'November 2027', 'December 2027']
  const [month, setMonth] = useState(monthOptions[new Date().getMonth()] || 'January 2026')
  const [rows, setRows] = useState([])
  const [editingId, setEditingId] = useState(null)
  const currency = data.settings.currency || 'GHS'

  useEffect(() => {
    const existing = (data.monthlySalarySheets || []).find((sheet) => sheet.month === month)
    if (existing) {
      setRows(existing.rows || [])
      setEditingId(existing.id)
      return
    }
    setRows(staffList.map((staff) => ({
      id: uid('salaryrow'),
      staffKey: staff.staffKey,
      staffId: staff.staffId || '',
      name: staff.name || '',
      role: staff.role || '',
      paidBy: staff.paySource === 'School' ? 'School' : 'Company',
      schoolId: staff.paidBySchoolId || '',
      amount: staff.defaultAmount || 0,
      paymentMode: staff.paymentMode || 'MTN MoMo',
      payNumber: staff.momoNumber || '',
      notes: ''
    })))
    setEditingId(null)
  }, [month, staffList, data.monthlySalarySheets])

  function updateRow(rowId, field, value) {
    setRows((previous) => previous.map((row) => row.id === rowId ? { ...row, [field]: value } : row))
  }

  function saveSheet() {
    const payload = {
      id: editingId || uid('salarysheet'),
      month,
      rows: rows.map((row) => ({ ...row, amount: toNumber(row.amount) })),
      total: rows.reduce((sum, row) => sum + toNumber(row.amount), 0),
      preparedBy: currentUser?.name || 'Admin',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    updateData((previous) => ({
      ...previous,
      monthlySalarySheets: [payload, ...(previous.monthlySalarySheets || []).filter((sheet) => sheet.id !== payload.id)]
    }))
    setEditingId(payload.id)
  }

  function saveAndPrint() {
    const payload = {
      id: editingId || uid('salarysheet'),
      month,
      rows: rows.map((row) => ({ ...row, amount: toNumber(row.amount) })),
      total: rows.reduce((sum, row) => sum + toNumber(row.amount), 0),
      preparedBy: currentUser?.name || 'Admin',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    updateData((previous) => ({
      ...previous,
      monthlySalarySheets: [payload, ...(previous.monthlySalarySheets || []).filter((sheet) => sheet.id !== payload.id)]
    }))
    setEditingId(payload.id)
    printMonthlySalarySheet(payload, data.settings, data.schools || [])
  }

  function editSheet(sheet) {
    setMonth(sheet.month)
    setRows(sheet.rows || [])
    setEditingId(sheet.id)
  }

  const total = rows.reduce((sum, row) => sum + toNumber(row.amount), 0)

  return (
    <section className="page-stack monthly-salary-page">
      <div className="panel dashboard-receivables-panel">
        <div className="panel-header stack-mobile"><div><p className="eyebrow">Salary</p><h3>Monthly salary payment sheet</h3></div><div className="form-actions"><button className="secondary-btn" type="button" onClick={saveSheet}><Plus size={16}/> Save month</button><button className="primary-btn" type="button" onClick={saveAndPrint}><Download size={16}/> Generate PDF</button></div></div>
        <div className="form-grid salary-month-controls"><Select label="Select month" value={month} onChange={setMonth} options={monthOptions} /><div className="salary-total-card"><span>Total salary for selected month</span><strong>{formatMoney(total, currency)}</strong></div></div>
      </div>

      <div className="panel dashboard-receivables-panel">
        <div className="panel-header"><div><p className="eyebrow">Staff list</p><h3>Confirm or edit salary details</h3></div></div>
        <div className="salary-sheet-table">
          <table>
            <thead><tr><th>Staff</th><th>Paid by</th><th>School</th><th>Amount</th><th>Payment mode</th><th>Number to be paid to</th><th>Notes</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.name}</strong><br/><small>{row.staffId || row.role}</small></td>
                  <td><Select label="" value={row.paidBy || 'Company'} onChange={(value) => updateRow(row.id, 'paidBy', value)} options={['Company', 'School']} /></td>
                  <td><Select label="" value={row.schoolId || ''} onChange={(value) => updateRow(row.id, 'schoolId', value)} options={['', ...data.schools.map((school) => [school.id, school.name])]} /></td>
                  <td><Input label="" type="number" value={row.amount} onChange={(value) => updateRow(row.id, 'amount', value)} /></td>
                  <td><Select label="" value={row.paymentMode || 'MTN MoMo'} onChange={(value) => updateRow(row.id, 'paymentMode', value)} options={['MTN MoMo', 'Telecel Cash', 'Bank Transfer', 'Cash', 'Cheque']} /></td>
                  <td><Input label="" value={row.payNumber || ''} onChange={(value) => updateRow(row.id, 'payNumber', value)} placeholder="MoMo number / account" /></td>
                  <td><Input label="" value={row.notes || ''} onChange={(value) => updateRow(row.id, 'notes', value)} placeholder="Optional" /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="7" className="empty-cell">No staff salary records found. Add staff first under Payroll.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel dashboard-receivables-panel">
        <div className="panel-header"><div><p className="eyebrow">Saved months</p><h3>Salary sheets already created</h3></div></div>
        <ResponsiveTable columns={['Month','Staff count','Total','Prepared by','Action']} rows={(data.monthlySalarySheets || []).map((sheet) => [sheet.month, (sheet.rows || []).length, formatMoney(sheet.total || salarySheetTotal(sheet), currency), sheet.preparedBy || 'Admin', <div className="row-actions"><button onClick={() => editSheet(sheet)}>Edit</button><button onClick={() => printMonthlySalarySheet(sheet, data.settings, data.schools || [])}>PDF</button></div>])} empty="No monthly salary sheets saved yet." />
      </div>
    </section>
  )
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', component + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (!app.includes("{ name: 'Monthly Salaries'")) {
  app = app.replace("{ name: 'Payroll', icon: Users },", "{ name: 'Payroll', icon: Users },\n    { name: 'Monthly Salaries', icon: WalletCards },")
  changed = true
}

if (!app.includes("visiblePage === 'Monthly Salaries'")) {
  app = app.replace("{visiblePage === 'Payroll' && <PayrollPage data={data} updateData={updateData} financials={financials} />}", "{visiblePage === 'Payroll' && <PayrollPage data={data} updateData={updateData} financials={financials} />}\n        {visiblePage === 'Monthly Salaries' && <MonthlySalariesPage data={data} updateData={updateData} currentUser={currentUser} />}")
  changed = true
}

app = app.replaceAll("'Payroll', 'Company Loans'", "'Payroll', 'Monthly Salaries', 'Company Loans'")
changed = true

if (changed) write(appPath, app)

let css = read(stylesPath)
if (!css.includes('/* Monthly salary sheet */')) {
  css += String.raw`

/* Monthly salary sheet */
.salary-month-controls { grid-template-columns: 280px minmax(280px, 1fr) !important; align-items:end; }
.salary-total-card { border:1px solid var(--line); border-radius:16px; background:#f8fafc; padding:13px 15px; display:grid; gap:6px; }
.salary-total-card span { color:#64748b; font-size:12px; font-weight:800; }
.salary-total-card strong { font-size:24px; color:var(--text); }
.salary-sheet-table { overflow-x:auto; width:100%; }
.salary-sheet-table table { min-width:1180px; width:100%; border-collapse:collapse; }
.salary-sheet-table th, .salary-sheet-table td { padding:10px; border-bottom:1px solid var(--line); vertical-align:middle; text-align:left; }
.salary-sheet-table th { color:#475569; font-size:12px; text-transform:uppercase; letter-spacing:.04em; background:#f8fafc; }
.salary-sheet-table .field { margin:0; }
.salary-sheet-table input, .salary-sheet-table select { min-height:40px; }
.empty-cell { text-align:center !important; color:#64748b; padding:24px !important; }
`
  write(stylesPath, css)
}

console.log('[patch-monthly-salary-v1] ready')
