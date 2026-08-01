import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

if (!app.includes('function AcademicYearDashboard(')) {
  const component = String.raw`
function dashboardSchoolArrearsAmount(school = {}) {
  return toNumber(school.arrears || school.arrearsBalance || school.previousBalance || school.balanceBroughtForward || 0)
}

function dashboardTermOnlyExpectedAmount(school = {}) {
  const total = schoolExpectedAmount(school)
  const arrears = dashboardSchoolArrearsAmount(school)
  return Math.max(total - arrears, 0)
}

function dashboardSourcesForAcademicYears(data = {}) {
  const sources = []
  const currentGroups = new Map()
  ;(data.schools || []).forEach((school) => {
    const academicYear = school.academicYear || 'Current academic year'
    const term = school.term || 'Current term'
    const key = academicYear + '|' + term
    if (!currentGroups.has(key)) {
      currentGroups.set(key, { key: 'current-' + key, type: 'current', academicYear, term, label: academicYear + ' - ' + term + ' (Current)', schools: [], payments: data.payments || [], expenses: data.expenses || [], staff: data.staff || [] })
    }
    currentGroups.get(key).schools.push(school)
  })
  currentGroups.forEach((value) => sources.push(value))
  ;(data.termArchives || []).forEach((archive, index) => {
    const academicYear = archive.previousAcademicYear || archive.academicYear || 'Archived academic year'
    const term = archive.previousTerm || archive.term || 'Archived term'
    sources.push({ key: archive.id || 'archive-' + index, type: 'archive', academicYear, term, label: academicYear + ' - ' + term + ' (Archive)', schools: archive.schools || [], payments: archive.payments || [], expenses: archive.expenses || [], staff: archive.staff || [] })
  })
  return sources
}

function buildAcademicYearDashboardView(data = {}, selectedYear = '', selectedTerm = 'All Terms') {
  const sources = dashboardSourcesForAcademicYears(data).filter((source) => {
    const yearMatches = !selectedYear || source.academicYear === selectedYear
    const termMatches = selectedTerm === 'All Terms' || source.term === selectedTerm
    return yearMatches && termMatches
  })
  const rows = []
  let totalStudents = 0
  let termExpected = 0
  let arrearsBroughtForward = 0
  let totalPaid = 0
  let totalBooks = 0
  let totalExpenses = 0
  let totalPayroll = 0
  sources.forEach((source) => {
    const schoolIds = new Set((source.schools || []).map((school) => school.id))
    const payments = (source.payments || []).filter((payment) => schoolIds.has(payment.schoolId))
    const paidBySchool = new Map()
    payments.forEach((payment) => paidBySchool.set(payment.schoolId, (paidBySchool.get(payment.schoolId) || 0) + toNumber(payment.amount)))
    totalPaid += payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0)
    totalExpenses += (source.expenses || []).reduce((sum, expense) => sum + toNumber(expense.amount), 0)
    totalPayroll += (source.staff || []).reduce((sum, worker) => sum + payrollNet(worker), 0)
    ;(source.schools || []).forEach((school) => {
      const arrears = dashboardSchoolArrearsAmount(school)
      const currentCharge = dashboardTermOnlyExpectedAmount(school)
      const totalBill = currentCharge + arrears
      const paid = paidBySchool.get(school.id) || 0
      const balance = Math.max(totalBill - paid, 0)
      totalStudents += toNumber(school.students)
      termExpected += currentCharge
      arrearsBroughtForward += arrears
      totalBooks += toNumber(school.booksBought)
      rows.push({ source: source.label, school, currentCharge, arrears, totalBill, paid, balance })
    })
  })
  return { sources, rows, totalStudents, termExpected, arrearsBroughtForward, totalExpected: termExpected + arrearsBroughtForward, totalPaid, remaining: Math.max(termExpected + arrearsBroughtForward - totalPaid, 0), estimatedBank: totalPaid - totalExpenses - totalPayroll + toNumber(data.settings?.openingBankBalance), totalBooks, totalExpenses, totalPayroll, owingSchools: rows.filter((row) => row.balance > 0) }
}

function AcademicYearDashboard({ data, financials }) {
  const currency = data.settings.currency
  const sources = useMemo(() => dashboardSourcesForAcademicYears(data), [data])
  const academicYears = useMemo(() => Array.from(new Set(sources.map((source) => source.academicYear))).filter(Boolean), [sources])
  const defaultYear = academicYears[0] || 'Current academic year'
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(defaultYear)
  const activeAcademicYear = academicYears.includes(selectedAcademicYear) ? selectedAcademicYear : defaultYear
  const termOptions = useMemo(() => ['All Terms', ...Array.from(new Set(sources.filter((source) => source.academicYear === activeAcademicYear).map((source) => source.term))).filter(Boolean)], [sources, activeAcademicYear])
  const [selectedTerm, setSelectedTerm] = useState('All Terms')
  const activeTerm = termOptions.includes(selectedTerm) ? selectedTerm : 'All Terms'
  const view = useMemo(() => buildAcademicYearDashboardView(data, activeAcademicYear, activeTerm), [data, activeAcademicYear, activeTerm])

  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  const weeklyMarketingRecords = (data.marketingRecords || []).filter((record) => {
    const recordDate = new Date(record.dateReached || record.createdAt || record.updatedAt || 0)
    return !Number.isNaN(recordDate.getTime()) && recordDate >= weekAgo && recordDate <= now
  })
  const weeklyCompleted = weeklyMarketingRecords.filter((record) => record.discussionStatus === 'Completed').length
  const weeklyOngoing = weeklyMarketingRecords.filter((record) => record.discussionStatus === 'Ongoing').length
  const weeklyRejected = weeklyMarketingRecords.filter((record) => record.discussionStatus === 'Rejected').length
  const weeklyFollowUps = weeklyMarketingRecords.filter((record) => Boolean(record.nextFollowUp)).length

  return (
    <section className="page-stack academic-year-dashboard">
      <div className="panel dashboard-year-selector">
        <div className="panel-header stack-mobile">
          <div>
            <p className="eyebrow">Dashboard view</p>
            <h3>Select academic year and term</h3>
            <p className="subtext">This separates the current year charges from arrears brought forward from previous years.</p>
          </div>
          <div className="dashboard-year-fields">
            <Select label="Academic year" value={activeAcademicYear} onChange={setSelectedAcademicYear} options={academicYears.length ? academicYears : [defaultYear]} />
            <Select label="Term" value={activeTerm} onChange={setSelectedTerm} options={termOptions} />
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Schools in selected view" value={view.rows.length} icon={<Building2 />} />
        <StatCard title="Students captured" value={view.totalStudents.toLocaleString()} icon={<Users />} />
        <StatCard title="Current year/term charges" value={formatMoney(view.termExpected, currency)} icon={<Calculator />} />
        <StatCard title="Arrears brought forward" value={formatMoney(view.arrearsBroughtForward, currency)} icon={<Landmark />} tone="warning" />
        <StatCard title="Payments received" value={formatMoney(view.totalPaid, currency)} icon={<CreditCard />} />
        <StatCard title="Total balance in view" value={formatMoney(view.remaining, currency)} icon={<WalletCards />} tone={view.remaining > 0 ? 'warning' : 'success'} />
        <StatCard title="Books bought" value={view.totalBooks.toLocaleString()} icon={<BookOpen />} />
        <StatCard title="Expenses + payroll" value={formatMoney(view.totalExpenses + view.totalPayroll, currency)} icon={<FileText />} tone="danger" />
      </div>

      <div className="panel dashboard-year-breakdown">
        <div className="panel-header stack-mobile">
          <div>
            <p className="eyebrow">Academic year breakdown</p>
            <h3>{activeAcademicYear} • {activeTerm}</h3>
          </div>
          <span className="pill">{view.sources.length} record source(s)</span>
        </div>
        <ResponsiveTable
          columns={['Source','School','Current year/term charges','Arrears from previous year','Total bill','Paid in selected records','Balance']}
          rows={view.rows.map((row) => [
            row.source,
            <strong>{row.school.name}</strong>,
            formatMoney(row.currentCharge, currency),
            <span className="amount-warning">{formatMoney(row.arrears, currency)}</span>,
            formatMoney(row.totalBill, currency),
            formatMoney(row.paid, currency),
            <span className={row.balance > 0 ? 'amount-danger' : 'amount-success'}>{formatMoney(row.balance, currency)}</span>
          ])}
          empty="No records found for the selected academic year and term."
        />
      </div>

      <div className="panel dashboard-marketing-summary">
        <div className="panel-header stack-mobile">
          <div>
            <p className="eyebrow">Weekly marketing summary</p>
            <h3>Marketing activity in the last 7 days</h3>
          </div>
          <span className="pill">Visible to all dashboard users</span>
        </div>
        <div className="marketing-summary-grid">
          <div><span>Schools reached</span><strong>{weeklyMarketingRecords.length}</strong></div>
          <div><span>Ongoing</span><strong>{weeklyOngoing}</strong></div>
          <div><span>Completed</span><strong>{weeklyCompleted}</strong></div>
          <div><span>Rejected</span><strong>{weeklyRejected}</strong></div>
          <div><span>Follow-ups set</span><strong>{weeklyFollowUps}</strong></div>
        </div>
        <ResponsiveTable
          columns={['School', 'Location', 'Led by', 'Status', 'Agreement / next step']}
          rows={weeklyMarketingRecords.slice(0, 8).map((record) => [
            <strong>{record.schoolName}</strong>,
            record.location || 'N/A',
            record.marketingLead || 'N/A',
            <span className={'pill ' + (record.discussionStatus === 'Completed' ? 'success' : record.discussionStatus === 'Rejected' ? 'danger' : 'warning')}>{record.discussionStatus || 'Ongoing'}</span>,
            record.agreementReached || (record.nextFollowUp ? 'Follow-up: ' + record.nextFollowUp : record.notes || 'N/A')
          ])}
          empty="No marketing activity recorded in the last 7 days."
        />
      </div>
    </section>
  )
}
`
  app = app.replace('function Dashboard({ data, financials }) {', component + '\nfunction Dashboard({ data, financials }) {')
  changed = true
}

if (app.includes("{visiblePage === 'Dashboard' && <Dashboard data={data} financials={financials} />}")) {
  app = app.replaceAll("{visiblePage === 'Dashboard' && <Dashboard data={data} financials={financials} />}", "{visiblePage === 'Dashboard' && <AcademicYearDashboard data={data} financials={financials} />}")
  changed = true
}

if (changed) write(appPath, app)

let css = read(stylesPath)
if (!css.includes('/* Academic year dashboard selector */')) {
  css += String.raw`

/* Academic year dashboard selector */
.academic-year-dashboard .dashboard-year-selector,
.academic-year-dashboard .dashboard-year-breakdown,
.academic-year-dashboard .dashboard-marketing-summary { grid-column: 1 / -1 !important; }
.dashboard-year-fields { display:grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap:12px; align-items:end; min-width:460px; }
.dashboard-year-fields .field { margin:0; }
.amount-warning { color:#92400e; font-weight:800; }
.amount-success { color:#047857; font-weight:800; }
@media (max-width: 900px) { .dashboard-year-fields { grid-template-columns:1fr; min-width:0; width:100%; } }
`
  write(stylesPath, css)
}

console.log('[patch-dashboard-academic-year-view-v1] ready')
