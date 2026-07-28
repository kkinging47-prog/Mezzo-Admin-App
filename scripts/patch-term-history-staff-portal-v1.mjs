import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

function replaceInsideDashboard(source, transform) {
  const start = source.indexOf('function Dashboard({ data, financials }) {')
  const end = source.indexOf('\nfunction StatCard', start)
  if (start < 0 || end < 0) return source
  const before = source.slice(0, start)
  const block = source.slice(start, end)
  const after = source.slice(end)
  return before + transform(block) + after
}

if (!app.includes('staffPortalFeed: Array.isArray(parsed.staffPortalFeed)')) {
  if (app.includes('stoppedSchools: Array.isArray(parsed.stoppedSchools) ? parsed.stoppedSchools : []')) {
    app = app.replace('stoppedSchools: Array.isArray(parsed.stoppedSchools) ? parsed.stoppedSchools : []', 'stoppedSchools: Array.isArray(parsed.stoppedSchools) ? parsed.stoppedSchools : [],\n    staffPortalFeed: Array.isArray(parsed.staffPortalFeed) ? parsed.staffPortalFeed : [],\n    staffPortalLastSync: parsed.staffPortalLastSync || \'\'')
    changed = true
  }
}

if (!app.includes('function dashboardArchiveFinancials(')) {
  const helpers = String.raw`
function dashboardArchiveFinancials(archive = {}, data = {}) {
  const schools = archive.schools || []
  const payments = archive.payments || []
  const expenses = archive.expenses || []
  const staff = archive.staff || []
  const totalStudents = schools.reduce((sum, school) => sum + toNumber(school.students), 0)
  const totalExpected = schools.reduce((sum, school) => sum + schoolExpectedAmount(school), 0)
  const totalPaid = payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0)
  const totalPayroll = staff.reduce((sum, worker) => sum + payrollNet(worker), 0)
  const totalBooks = schools.reduce((sum, school) => sum + toNumber(school.booksBought), 0)
  const owingSchools = schools.map((school) => {
    const expected = schoolExpectedAmount(school)
    const paid = schoolPaidAmount(school.id, payments)
    const balance = Math.max(expected - paid, 0)
    return { ...school, expected, paid, balance }
  }).filter((school) => school.balance > 0)
  return { totalStudents, totalExpected, totalPaid, remaining: Math.max(totalExpected - totalPaid, 0), estimatedBank: totalPaid - totalExpenses - totalPayroll + toNumber(data.settings?.openingBankBalance), totalBooks, totalExpenses, totalPayroll, owingSchools }
}

function staffPortalFeedFromData(data = {}) {
  const staffList = uniqueSalaryStaffList(data.staff || [])
  return staffList.map((staff) => {
    const salaryRecords = (data.monthlySalarySheets || []).flatMap((sheet) => (sheet.rows || []).filter((row) => row.staffKey === staff.staffKey || row.staffId === staff.staffId || row.name === staff.name).map((row) => ({
      id: (sheet.id || sheet.month || 'salary') + '-' + (row.staffKey || row.staffId || row.name || ''),
      month: sheet.month,
      amount: toNumber(row.amount),
      paidBy: row.paidBy || 'Company',
      schoolId: row.schoolId || '',
      paymentMode: row.paymentMode || '',
      payNumber: row.payNumber || '',
      notes: row.notes || ''
    })))
    const school = (data.schools || []).find((item) => item.id === staff.paidBySchoolId)
    return {
      staffKey: staff.staffKey,
      staffId: staff.staffId || '',
      email: staff.email || '',
      name: staff.name || '',
      role: staff.role || '',
      phone: staff.phone || '',
      momoNumber: staff.momoNumber || '',
      paymentMode: staff.paymentMode || 'MTN MoMo',
      assignedSchoolId: staff.paidBySchoolId || '',
      assignedSchoolName: school?.name || '',
      defaultSalary: toNumber(staff.defaultAmount),
      loanTaken: toNumber(staff.loanAmount),
      loanPaid: toNumber(staff.loanPaid),
      loanBalance: Math.max(toNumber(staff.loanAmount) + toNumber(staff.loanInterest) - toNumber(staff.loanPaid), 0),
      salaryRecords
    }
  })
}
`
  app = app.replace('function Dashboard({ data, financials }) {', helpers + '\nfunction Dashboard({ data, financials }) {')
  changed = true
}

app = replaceInsideDashboard(app, (dashboard) => {
  let block = dashboard
  if (block.includes('const weeklyFollowUps = weeklyMarketingRecords.filter((record) => Boolean(record.nextFollowUp)).length') && !block.includes('dashboardTermOptions')) {
    block = block.replace(
      '  const weeklyFollowUps = weeklyMarketingRecords.filter((record) => Boolean(record.nextFollowUp)).length\n  return (',
      `  const weeklyFollowUps = weeklyMarketingRecords.filter((record) => Boolean(record.nextFollowUp)).length
  const currentAcademicYear = data.schools?.[0]?.academicYear || 'Current academic year'
  const currentTerm = data.schools?.[0]?.term || 'Current term'
  const dashboardTermOptions = [
    { key: 'current', label: 'Current: ' + currentAcademicYear + ' - ' + currentTerm },
    ...(data.termArchives || []).map((archive) => ({ key: archive.id, label: (archive.previousAcademicYear || 'Archived year') + ' - ' + (archive.previousTerm || 'Archived term'), archive }))
  ]
  const [dashboardTermKey, setDashboardTermKey] = useState('current')
  const selectedDashboardTerm = dashboardTermOptions.find((item) => item.key === dashboardTermKey) || dashboardTermOptions[0]
  const viewFinancials = selectedDashboardTerm?.archive ? dashboardArchiveFinancials(selectedDashboardTerm.archive, data) : financials
  return (`
    )
    changed = true
  }
  const financialReplacements = [
    ['financials.totalStudents.toLocaleString()', 'viewFinancials.totalStudents.toLocaleString()'],
    ['formatMoney(financials.totalExpected, currency)', 'formatMoney(viewFinancials.totalExpected, currency)'],
    ['formatMoney(financials.totalPaid, currency)', 'formatMoney(viewFinancials.totalPaid, currency)'],
    ['formatMoney(financials.remaining, currency)', 'formatMoney(viewFinancials.remaining, currency)'],
    ['formatMoney(financials.estimatedBank, currency)', 'formatMoney(viewFinancials.estimatedBank, currency)'],
    ['financials.estimatedBank >= 0', 'viewFinancials.estimatedBank >= 0'],
    ['financials.totalBooks.toLocaleString()', 'viewFinancials.totalBooks.toLocaleString()'],
    ['formatMoney(financials.totalExpenses + financials.totalPayroll, currency)', 'formatMoney(viewFinancials.totalExpenses + viewFinancials.totalPayroll, currency)'],
    ['financials.owingSchools.length', 'viewFinancials.owingSchools.length'],
    ['financials.owingSchools.map((school) => [', 'viewFinancials.owingSchools.map((school) => [']
  ]
  for (const [from, to] of financialReplacements) {
    if (block.includes(from)) {
      block = block.replaceAll(from, to)
      changed = true
    }
  }
  return block
})

if (!app.includes('dashboard-term-selector')) {
  app = app.replace(
    '<div className="panel dashboard-marketing-summary">',
    `<div className="panel dashboard-term-selector">
        <div className="panel-header stack-mobile">
          <div><p className="eyebrow">Dashboard view</p><h3>Select academic year and term to display</h3></div>
          <Select label="" value={dashboardTermKey} onChange={setDashboardTermKey} options={dashboardTermOptions.map((item) => [item.key, item.label])} />
        </div>
        {selectedDashboardTerm?.archive && <div className="alert warning">You are viewing archived records from a previous term. The current term remains unchanged.</div>}
      </div>

      <div className="panel dashboard-marketing-summary">`
  )
  changed = true
}

if (app.includes("const [form, setForm] = useState({ academicYear: '2026/2027', term: 'Term 1', defaultBookCharge: '', note: '' })") && !app.includes('selectedSchoolIds')) {
  app = app.replace(
    "  const [form, setForm] = useState({ academicYear: '2026/2027', term: 'Term 1', defaultBookCharge: '', note: '' })\n  const currency = data.settings.currency || 'GHS'",
    `  const [form, setForm] = useState({ academicYear: '2026/2027', term: 'Term 1', defaultBookCharge: '', note: '' })
  const [selectedSchoolIds, setSelectedSchoolIds] = useState((data.schools || []).map((school) => school.id))
  const currency = data.settings.currency || 'GHS'
  useEffect(() => {
    const liveIds = (data.schools || []).map((school) => school.id)
    setSelectedSchoolIds((previous) => previous.length ? previous.filter((id) => liveIds.includes(id)) : liveIds)
  }, [data.schools.length])

  function toggleSchoolRollover(schoolId, checked) {
    setSelectedSchoolIds((previous) => checked ? Array.from(new Set([...previous, schoolId])) : previous.filter((id) => id !== schoolId))
  }

  function selectAllSchoolsForRollover() {
    setSelectedSchoolIds((data.schools || []).map((school) => school.id))
  }

  function clearSchoolsForRollover() {
    setSelectedSchoolIds([])
  }`
  )
  changed = true
}

if (app.includes('payments: data.payments || [],\n      schools: (data.schools || []).map((school) => ({ ...school, arrearsBalance: currentSchoolBalanceForRollover(school, data) })),') && !app.includes('expenses: data.expenses || []')) {
  app = app.replace(
    'payments: data.payments || [],\n      schools: (data.schools || []).map((school) => ({ ...school, arrearsBalance: currentSchoolBalanceForRollover(school, data) })),',
    'payments: data.payments || [],\n      expenses: data.expenses || [],\n      staff: data.staff || [],\n      monthlySalarySheets: data.monthlySalarySheets || [],\n      schools: (data.schools || []).map((school) => ({ ...school, arrearsBalance: currentSchoolBalanceForRollover(school, data) })),')
  changed = true
}

if (app.includes('payments: [],\n      termArchives: [snapshot, ...(previous.termArchives || [])],\n      schools: (previous.schools || []).map((school) => {')) {
  app = app.replace(
    'payments: [],\n      termArchives: [snapshot, ...(previous.termArchives || [])],\n      schools: (previous.schools || []).map((school) => {',
    `payments: [],
      termArchives: [snapshot, ...(previous.termArchives || [])],
      stoppedSchools: [
        ...(previous.schools || []).filter((school) => !selectedSchoolIds.includes(school.id)).map((school) => ({
          id: uid('stopped'),
          createdAt: new Date().toISOString(),
          schoolId: school.id,
          schoolName: school.name,
          location: school.location || '',
          contactPerson: school.contactPerson || '',
          joinedDate: school.joinedDate || '',
          stoppedDate: today(),
          stoppedTerm: school.term || '',
          stoppedAcademicYear: school.academicYear || '',
          reason: 'Did not roll over into ' + form.academicYear + ' ' + form.term,
          outstandingBalance: currentSchoolBalanceForRollover(school, previous),
          notes: form.note || ''
        })),
        ...(previous.stoppedSchools || [])
      ],
      schools: (previous.schools || []).filter((school) => selectedSchoolIds.includes(school.id)).map((school) => {`
  )
  changed = true
}

if (app.includes('<div className="panel-header"><div><p className="eyebrow">Preview</p><h3>Arrears and book purchases before rollover</h3></div></div>')) {
  app = app.replace(
    '<div className="panel-header"><div><p className="eyebrow">Preview</p><h3>Arrears and book purchases before rollover</h3></div></div>',
    '<div className="panel-header stack-mobile"><div><p className="eyebrow">Preview</p><h3>Select schools to roll over</h3></div><div className="form-actions"><button className="secondary-btn" type="button" onClick={selectAllSchoolsForRollover}>Select all</button><button className="secondary-btn" type="button" onClick={clearSchoolsForRollover}>Clear all</button></div></div>'
  )
  changed = true
}

if (app.includes("columns={['School','Current balance to arrears','New academic year','New term','Books qty','Book charge']} rows={preview.map(({ school, balance, books }) => [school.name, formatMoney(balance, currency), form.academicYear, form.term, books.booksBought, formatMoney(books.bookUnitPrice, currency)])}")) {
  app = app.replace(
    "columns={['School','Current balance to arrears','New academic year','New term','Books qty','Book charge']} rows={preview.map(({ school, balance, books }) => [school.name, formatMoney(balance, currency), form.academicYear, form.term, books.booksBought, formatMoney(books.bookUnitPrice, currency)])}",
    "columns={['Roll over','School','Current balance to arrears','New academic year','New term','Books qty','Book charge']} rows={preview.map(({ school, balance, books }) => [<input type=\"checkbox\" checked={selectedSchoolIds.includes(school.id)} onChange={(event) => toggleSchoolRollover(school.id, event.target.checked)} />, school.name, formatMoney(balance, currency), form.academicYear, form.term, books.booksBought, formatMoney(books.bookUnitPrice, currency)])}"
  )
  changed = true
}

if (!app.includes('function StaffPortalLinkPage(')) {
  const component = String.raw`
function StaffPortalLinkPage({ data, updateData, useSupabase }) {
  const [status, setStatus] = useState('')
  const feed = useMemo(() => staffPortalFeedFromData(data), [data])
  const missingEmails = feed.filter((staff) => !staff.email).length
  const salaryRecordCount = feed.reduce((sum, staff) => sum + staff.salaryRecords.length, 0)

  function saveBridgeFeed() {
    updateData((previous) => ({ ...previous, staffPortalFeed: staffPortalFeedFromData(previous), staffPortalLastSync: new Date().toISOString() }))
    setStatus('Staff portal feed saved inside the admin database. The staff portal can read this after it is connected to the same Supabase project.')
  }

  async function syncPortalTables() {
    if (!useSupabase) return alert('Supabase is not connected. Add the Supabase URL and anon key first.')
    const latestFeed = staffPortalFeedFromData(data)
    const profiles = latestFeed.map((staff) => ({
      staff_key: staff.staffKey,
      staff_id: staff.staffId,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      phone: staff.phone,
      momo_number: staff.momoNumber,
      payment_mode: staff.paymentMode,
      assigned_school_id: staff.assignedSchoolId,
      assigned_school_name: staff.assignedSchoolName,
      default_salary: staff.defaultSalary,
      loan_balance: staff.loanBalance,
      profile_data: staff,
      updated_at: new Date().toISOString()
    }))
    const salaryRows = latestFeed.flatMap((staff) => staff.salaryRecords.map((salary) => ({
      id: salary.id,
      staff_key: staff.staffKey,
      staff_id: staff.staffId,
      email: staff.email,
      staff_name: staff.name,
      month: salary.month,
      amount: salary.amount,
      paid_by: salary.paidBy,
      school_id: salary.schoolId,
      payment_mode: salary.paymentMode,
      pay_number: salary.payNumber,
      record_data: salary,
      updated_at: new Date().toISOString()
    })))
    const profileResult = await supabase.from('staff_portal_profiles').upsert(profiles, { onConflict: 'staff_key' })
    if (profileResult.error) return alert(profileResult.error.message)
    if (salaryRows.length) {
      const salaryResult = await supabase.from('staff_portal_salary_records').upsert(salaryRows, { onConflict: 'id' })
      if (salaryResult.error) return alert(salaryResult.error.message)
    }
    saveBridgeFeed()
    setStatus('Staff portal tables synced successfully. Staff can see their own data after the Staff Portal app uses these tables.')
  }

  return (
    <section className="page-stack staff-portal-link-page">
      <div className="stats-grid">
        <StatCard title="Staff ready for portal" value={feed.length} icon={<Users />} />
        <StatCard title="Salary records linked" value={salaryRecordCount} icon={<WalletCards />} />
        <StatCard title="Missing emails" value={missingEmails} icon={<ShieldCheck />} tone={missingEmails ? 'warning' : 'success'} />
      </div>
      <div className="panel dashboard-receivables-panel">
        <div className="panel-header stack-mobile"><div><p className="eyebrow">Staff Portal</p><h3>Admin-to-Staff Portal data bridge</h3></div><div className="form-actions"><button className="secondary-btn" type="button" onClick={saveBridgeFeed}>Save bridge feed</button><button className="primary-btn" type="button" onClick={syncPortalTables}>Sync Supabase tables</button></div></div>
        <div className="alert warning">Before using table sync, run <strong>supabase/staff-portal-link.sql</strong> in Supabase SQL Editor. The separate Staff Portal app must also use the same Supabase URL and anon key.</div>
        {status && <div className="alert success">{status}</div>}
        <ResponsiveTable columns={['Staff','Email','Role','MoMo','Salary records','Portal status']} rows={feed.map((staff) => [<strong>{staff.name}</strong>, staff.email || <span className="amount-danger">Missing email</span>, staff.role || 'N/A', staff.momoNumber || 'N/A', staff.salaryRecords.length, staff.email ? 'Ready' : 'Add email before staff login'])} empty="No staff records found." />
      </div>
    </section>
  )
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', component + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (!app.includes("{ name: 'Staff Portal Link'")) {
  app = app.replace("{ name: 'Monthly Salaries', icon: WalletCards },", "{ name: 'Monthly Salaries', icon: WalletCards },\n    { name: 'Staff Portal Link', icon: ShieldCheck },")
  changed = true
}
if (!app.includes("visiblePage === 'Staff Portal Link'")) {
  app = app.replace("{visiblePage === 'Monthly Salaries' && <MonthlySalariesPage data={data} updateData={updateData} currentUser={currentUser} />}", "{visiblePage === 'Monthly Salaries' && <MonthlySalariesPage data={data} updateData={updateData} currentUser={currentUser} />}\n        {visiblePage === 'Staff Portal Link' && <StaffPortalLinkPage data={data} updateData={updateData} useSupabase={hasSupabaseConfig} />}")
  changed = true
}
app = app.replaceAll("'Monthly Salaries', 'Company Loans'", "'Monthly Salaries', 'Staff Portal Link', 'Company Loans'")
app = app.replaceAll("'Payroll', 'Monthly Salaries'", "'Payroll', 'Monthly Salaries', 'Staff Portal Link'")
changed = true

if (changed) write(appPath, app)

let css = read(stylesPath)
if (!css.includes('/* Term history and staff portal bridge */')) {
  css += String.raw`

/* Term history and staff portal bridge */
.dashboard-term-selector { grid-column: 1 / -1 !important; }
.dashboard-term-selector .field { min-width: 280px; margin: 0; }
.term-setup-page input[type="checkbox"] { width:20px; height:20px; accent-color:#1d4ed8; }
.staff-portal-link-page .dashboard-receivables-panel { grid-column: 1 / -1 !important; }
`
  write(stylesPath, css)
}

console.log('[patch-term-history-staff-portal-v1] ready')
