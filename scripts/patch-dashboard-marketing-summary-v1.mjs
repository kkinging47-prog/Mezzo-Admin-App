import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

if (!app.includes('weeklyMarketingRecords')) {
  app = app.replace(
    `function Dashboard({ data, financials }) {
  const currency = data.settings.currency
  return (`,
    `function Dashboard({ data, financials }) {
  const currency = data.settings.currency
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
  return (`
  )
  changed = true
}

if (!app.includes('dashboard-marketing-summary')) {
  app = app.replace(
    `      </div>

      <div className="panel">`,
    `      </div>

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
            <span className={\`pill \${record.discussionStatus === 'Completed' ? 'success' : record.discussionStatus === 'Rejected' ? 'danger' : 'warning'}\`}>{record.discussionStatus || 'Ongoing'}</span>,
            record.agreementReached || (record.nextFollowUp ? 'Follow-up: ' + record.nextFollowUp : record.notes || 'N/A')
          ])}
          empty="No marketing activity recorded in the last 7 days."
        />
      </div>

      <div className="panel">`
  )
  changed = true
}

if (changed) write(appPath, app)

let css = read(stylesPath)
if (!css.includes('/* Weekly marketing dashboard summary */')) {
  css += String.raw`

/* Weekly marketing dashboard summary */
.dashboard-marketing-summary { grid-column: 1 / -1 !important; }
.marketing-summary-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:12px; margin-bottom:14px; }
.marketing-summary-grid > div { border:1px solid var(--line); border-radius:14px; background:#f8fafc; padding:13px 14px; display:grid; gap:5px; }
.marketing-summary-grid span { color:#64748b; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
.marketing-summary-grid strong { font-size:24px; color:var(--text); }
`
  write(stylesPath, css)
}

console.log('[patch-dashboard-marketing-summary-v1] ready')
