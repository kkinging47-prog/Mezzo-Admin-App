import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

if (!app.includes('marketingRecords: Array.isArray(parsed.marketingRecords)')) {
  if (app.includes('monthlySalarySheets: Array.isArray(parsed.monthlySalarySheets) ? parsed.monthlySalarySheets : []')) {
    app = app.replace('monthlySalarySheets: Array.isArray(parsed.monthlySalarySheets) ? parsed.monthlySalarySheets : []', 'monthlySalarySheets: Array.isArray(parsed.monthlySalarySheets) ? parsed.monthlySalarySheets : [],\n    marketingRecords: Array.isArray(parsed.marketingRecords) ? parsed.marketingRecords : [],\n    stoppedSchools: Array.isArray(parsed.stoppedSchools) ? parsed.stoppedSchools : []')
  } else if (app.includes('schoolAgreements: Array.isArray(parsed.schoolAgreements) ? parsed.schoolAgreements : []')) {
    app = app.replace('schoolAgreements: Array.isArray(parsed.schoolAgreements) ? parsed.schoolAgreements : []', 'schoolAgreements: Array.isArray(parsed.schoolAgreements) ? parsed.schoolAgreements : [],\n    marketingRecords: Array.isArray(parsed.marketingRecords) ? parsed.marketingRecords : [],\n    stoppedSchools: Array.isArray(parsed.stoppedSchools) ? parsed.stoppedSchools : []')
  }
  changed = true
}

if (!app.includes('function MarketingPage(')) {
  const component = String.raw`
function MarketingPage({ data, updateData, currentUser }) {
  const emptyMarketing = {
    dateReached: today(), schoolName: '', location: '', contactPerson: '', contactPhone: '', marketingLead: currentUser?.name || '', discussionStatus: 'Ongoing', agreementReached: '', nextFollowUp: '', notes: ''
  }
  const emptyStopped = {
    schoolId: '', schoolName: '', location: '', joinedDate: '', stoppedDate: today(), stoppedTerm: '', stoppedAcademicYear: '', reason: '', contactPerson: '', outstandingBalance: '', notes: ''
  }
  const [marketingForm, setMarketingForm] = useState(emptyMarketing)
  const [stoppedForm, setStoppedForm] = useState(emptyStopped)
  const [editingMarketingId, setEditingMarketingId] = useState(null)
  const [editingStoppedId, setEditingStoppedId] = useState(null)
  const currency = data.settings.currency || 'GHS'

  function saveMarketing(event) {
    event.preventDefault()
    const payload = { ...marketingForm, updatedAt: new Date().toISOString() }
    updateData((previous) => {
      const existing = previous.marketingRecords || []
      if (editingMarketingId) return { ...previous, marketingRecords: existing.map((item) => item.id === editingMarketingId ? { ...item, ...payload } : item) }
      return { ...previous, marketingRecords: [{ id: uid('marketing'), createdAt: new Date().toISOString(), ...payload }, ...existing] }
    })
    setEditingMarketingId(null)
    setMarketingForm(emptyMarketing)
  }

  function chooseStoppedSchool(schoolId) {
    const school = data.schools.find((item) => item.id === schoolId)
    const agreement = (data.schoolAgreements || []).find((item) => item.schoolId === schoolId)
    setStoppedForm({
      ...stoppedForm,
      schoolId,
      schoolName: school?.name || '',
      location: school?.location || '',
      contactPerson: school?.contactPerson || '',
      joinedDate: agreement?.joinedDate || '',
      stoppedTerm: school?.term || '',
      stoppedAcademicYear: school?.academicYear || '',
      outstandingBalance: school ? currentSchoolBalanceForRollover(school, data) : ''
    })
  }

  function saveStopped(event) {
    event.preventDefault()
    const payload = { ...stoppedForm, outstandingBalance: toNumber(stoppedForm.outstandingBalance), updatedAt: new Date().toISOString() }
    updateData((previous) => {
      const existing = previous.stoppedSchools || []
      if (editingStoppedId) return { ...previous, stoppedSchools: existing.map((item) => item.id === editingStoppedId ? { ...item, ...payload } : item) }
      return { ...previous, stoppedSchools: [{ id: uid('stopped'), createdAt: new Date().toISOString(), ...payload }, ...existing] }
    })
    setEditingStoppedId(null)
    setStoppedForm(emptyStopped)
  }

  function editMarketing(item) {
    setEditingMarketingId(item.id)
    setMarketingForm({ ...emptyMarketing, ...item })
  }

  function editStopped(item) {
    setEditingStoppedId(item.id)
    setStoppedForm({ ...emptyStopped, ...item })
  }

  function deleteMarketing(id) {
    if (!window.confirm('Delete this marketing record?')) return
    updateData((previous) => ({ ...previous, marketingRecords: (previous.marketingRecords || []).filter((item) => item.id !== id) }))
  }

  function deleteStopped(id) {
    if (!window.confirm('Delete this stopped school record?')) return
    updateData((previous) => ({ ...previous, stoppedSchools: (previous.stoppedSchools || []).filter((item) => item.id !== id) }))
  }

  const marketingStats = (data.marketingRecords || []).reduce((acc, item) => {
    acc.total += 1
    acc[item.discussionStatus] = (acc[item.discussionStatus] || 0) + 1
    return acc
  }, { total: 0 })

  return (
    <section className="page-stack marketing-page">
      <div className="stats-grid">
        <StatCard title="Schools reached" value={marketingStats.total || 0} icon={<School />} />
        <StatCard title="Ongoing discussions" value={marketingStats.Ongoing || 0} icon={<FileText />} tone="warning" />
        <StatCard title="Completed discussions" value={marketingStats.Completed || 0} icon={<CheckCircle2 />} tone="success" />
        <StatCard title="Rejected discussions" value={marketingStats.Rejected || 0} icon={<X />} tone="danger" />
        <StatCard title="Stopped schools" value={(data.stoppedSchools || []).length} icon={<Building2 />} tone="danger" />
      </div>

      <div className="panel dashboard-receivables-panel">
        <div className="panel-header"><div><p className="eyebrow">Marketing</p><h3>{editingMarketingId ? 'Edit reached school' : 'Add school reached for marketing'}</h3></div></div>
        <form className="form-grid marketing-wide-form" onSubmit={saveMarketing}>
          <Input label="Date reached" type="date" value={marketingForm.dateReached} onChange={(value) => setMarketingForm({ ...marketingForm, dateReached: value })} />
          <Input label="Name of school" required value={marketingForm.schoolName} onChange={(value) => setMarketingForm({ ...marketingForm, schoolName: value })} />
          <Input label="Location" value={marketingForm.location} onChange={(value) => setMarketingForm({ ...marketingForm, location: value })} />
          <Input label="Contact person" value={marketingForm.contactPerson} onChange={(value) => setMarketingForm({ ...marketingForm, contactPerson: value })} />
          <Input label="Contact phone" value={marketingForm.contactPhone} onChange={(value) => setMarketingForm({ ...marketingForm, contactPhone: value })} />
          <Input label="Marketing led by" value={marketingForm.marketingLead} onChange={(value) => setMarketingForm({ ...marketingForm, marketingLead: value })} />
          <Select label="Discussion status" value={marketingForm.discussionStatus} onChange={(value) => setMarketingForm({ ...marketingForm, discussionStatus: value })} options={['Ongoing', 'Completed', 'Rejected']} />
          <Input label="Next follow-up date" type="date" value={marketingForm.nextFollowUp} onChange={(value) => setMarketingForm({ ...marketingForm, nextFollowUp: value })} />
          <Textarea label="Agreement reached" value={marketingForm.agreementReached} onChange={(value) => setMarketingForm({ ...marketingForm, agreementReached: value })} />
          <Textarea label="Notes" value={marketingForm.notes} onChange={(value) => setMarketingForm({ ...marketingForm, notes: value })} />
          <div className="form-actions full-span"><button className="primary-btn" type="submit"><Plus size={17}/> {editingMarketingId ? 'Update marketing record' : 'Save marketing record'}</button>{editingMarketingId && <button type="button" className="secondary-btn" onClick={() => { setEditingMarketingId(null); setMarketingForm(emptyMarketing) }}>Cancel</button>}</div>
        </form>
      </div>

      <div className="panel dashboard-receivables-panel">
        <div className="panel-header"><div><p className="eyebrow">Marketing records</p><h3>Schools reached and discussion status</h3></div></div>
        <ResponsiveTable columns={['School','Location','Contact','Led by','Status','Agreement reached','Action']} rows={(data.marketingRecords || []).map((item) => [<strong>{item.schoolName}</strong>, item.location || 'N/A', item.contactPerson || item.contactPhone || 'N/A', item.marketingLead || 'N/A', <span className={`pill ${item.discussionStatus === 'Completed' ? 'success' : item.discussionStatus === 'Rejected' ? 'danger' : 'warning'}`}>{item.discussionStatus}</span>, item.agreementReached || 'N/A', <div className="row-actions"><button onClick={() => editMarketing(item)}>Edit</button><button className="danger-link" onClick={() => deleteMarketing(item.id)}><Trash2 size={14}/></button></div>])} empty="No marketing records saved yet." />
      </div>

      <div className="panel dashboard-receivables-panel">
        <div className="panel-header"><div><p className="eyebrow">Stopped programme</p><h3>{editingStoppedId ? 'Edit stopped school' : 'Record school that stopped the programme'}</h3></div></div>
        <form className="form-grid marketing-wide-form" onSubmit={saveStopped}>
          <Select label="Select existing school" value={stoppedForm.schoolId} onChange={chooseStoppedSchool} options={['', ...data.schools.map((school) => [school.id, school.name])]} />
          <Input label="School name" required value={stoppedForm.schoolName} onChange={(value) => setStoppedForm({ ...stoppedForm, schoolName: value })} />
          <Input label="Location" value={stoppedForm.location} onChange={(value) => setStoppedForm({ ...stoppedForm, location: value })} />
          <Input label="Contact person" value={stoppedForm.contactPerson} onChange={(value) => setStoppedForm({ ...stoppedForm, contactPerson: value })} />
          <Input label="When they joined" type="date" value={stoppedForm.joinedDate} onChange={(value) => setStoppedForm({ ...stoppedForm, joinedDate: value })} />
          <Input label="When they stopped" type="date" value={stoppedForm.stoppedDate} onChange={(value) => setStoppedForm({ ...stoppedForm, stoppedDate: value })} />
          <Input label="Term stopped" value={stoppedForm.stoppedTerm} onChange={(value) => setStoppedForm({ ...stoppedForm, stoppedTerm: value })} />
          <Input label="Academic year stopped" value={stoppedForm.stoppedAcademicYear} onChange={(value) => setStoppedForm({ ...stoppedForm, stoppedAcademicYear: value })} />
          <Input label="Outstanding balance" type="number" value={stoppedForm.outstandingBalance} onChange={(value) => setStoppedForm({ ...stoppedForm, outstandingBalance: value })} />
          <Textarea label="Reason for stopping" value={stoppedForm.reason} onChange={(value) => setStoppedForm({ ...stoppedForm, reason: value })} />
          <Textarea label="Notes / follow-up action" value={stoppedForm.notes} onChange={(value) => setStoppedForm({ ...stoppedForm, notes: value })} />
          <div className="form-actions full-span"><button className="primary-btn" type="submit"><Plus size={17}/> {editingStoppedId ? 'Update stopped school' : 'Save stopped school'}</button>{editingStoppedId && <button type="button" className="secondary-btn" onClick={() => { setEditingStoppedId(null); setStoppedForm(emptyStopped) }}>Cancel</button>}</div>
        </form>
      </div>

      <div className="panel dashboard-receivables-panel">
        <div className="panel-header"><div><p className="eyebrow">Stopped records</p><h3>Schools that stopped the programme</h3></div></div>
        <ResponsiveTable columns={['School','Joined','Stopped','Reason','Outstanding','Action']} rows={(data.stoppedSchools || []).map((item) => [<strong>{item.schoolName}</strong>, item.joinedDate || 'N/A', item.stoppedDate || 'N/A', item.reason || 'N/A', formatMoney(item.outstandingBalance, currency), <div className="row-actions"><button onClick={() => editStopped(item)}>Edit</button><button className="danger-link" onClick={() => deleteStopped(item.id)}><Trash2 size={14}/></button></div>])} empty="No stopped school records saved yet." />
      </div>
    </section>
  )
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', component + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (!app.includes("{ name: 'Marketing'")) {
  if (app.includes("{ name: 'School Agreements', icon: FileText },")) {
    app = app.replace("{ name: 'School Agreements', icon: FileText },", "{ name: 'School Agreements', icon: FileText },\n    { name: 'Marketing', icon: FileText },")
  } else {
    app = app.replace("{ name: 'Schools', icon: School },", "{ name: 'Schools', icon: School },\n    { name: 'Marketing', icon: FileText },")
  }
  changed = true
}

if (!app.includes("visiblePage === 'Marketing'")) {
  app = app.replace("{visiblePage === 'Schools' && <SchoolsPage data={data} updateData={updateData} />}", "{visiblePage === 'Schools' && <SchoolsPage data={data} updateData={updateData} />}\n        {visiblePage === 'Marketing' && <MarketingPage data={data} updateData={updateData} currentUser={currentUser} />}")
  changed = true
}

app = app.replaceAll("'School Agreements', 'Invoices'", "'School Agreements', 'Marketing', 'Invoices'")
app = app.replaceAll("'Schools', 'School Agreements'", "'Schools', 'School Agreements', 'Marketing'")
app = app.replaceAll("'Schools', 'Invoices'", "'Schools', 'Marketing', 'Invoices'")
changed = true

if (changed) write(appPath, app)

let css = read(stylesPath)
if (!css.includes('/* Marketing and stopped schools page */')) {
  css += String.raw`

/* Marketing and stopped schools page */
.marketing-page .dashboard-receivables-panel { grid-column: 1 / -1 !important; }
.marketing-wide-form { grid-template-columns: repeat(4, minmax(180px, 1fr)) !important; }
.marketing-wide-form textarea,
.marketing-wide-form .full-span { grid-column: 1 / -1; }
.pill.warning { background:#fef3c7; color:#92400e; }
@media (max-width: 1100px) { .marketing-wide-form { grid-template-columns: 1fr !important; } }
`
  write(stylesPath, css)
}

console.log('[patch-marketing-stopped-v1] ready')
