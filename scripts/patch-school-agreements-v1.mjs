import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

if (!app.includes('schoolAgreements: Array.isArray(parsed.schoolAgreements)')) {
  if (app.includes('companyLoans: Array.isArray(parsed.companyLoans) ? parsed.companyLoans : []')) {
    app = app.replace('companyLoans: Array.isArray(parsed.companyLoans) ? parsed.companyLoans : []', 'companyLoans: Array.isArray(parsed.companyLoans) ? parsed.companyLoans : [],\n    schoolAgreements: Array.isArray(parsed.schoolAgreements) ? parsed.schoolAgreements : []')
  } else if (app.includes('invoices: Array.isArray(parsed.invoices) ? parsed.invoices : []')) {
    app = app.replace('invoices: Array.isArray(parsed.invoices) ? parsed.invoices : []', 'invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],\n    schoolAgreements: Array.isArray(parsed.schoolAgreements) ? parsed.schoolAgreements : []')
  }
  changed = true
}

if (!app.includes('function agreementHtmlSafe')) {
  const helpers = String.raw`
function agreementHtmlSafe(value = '') {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function schoolAgreementFor(records = [], schoolId = '') {
  return (records || []).find((item) => item.schoolId === schoolId) || null
}

function downloadSchoolsSummaryCsv(data) {
  const agreements = data.schoolAgreements || []
  const headers = ['School','Location','Contact person','Phone','Email','Students','Joined program','Academic year started','Term started','Amount agreed','Programme status','Still on program','Payment terms','Notes']
  const rows = (data.schools || []).map((school) => {
    const agreement = schoolAgreementFor(agreements, school.id) || {}
    return [
      school.name || '', school.location || '', school.contactPerson || '', school.phone || '', school.email || '', toNumber(school.students),
      agreement.joinedDate || '', agreement.academicYearStarted || school.academicYear || '', agreement.termStarted || school.term || '', toNumber(agreement.amountAgreed || schoolExpectedAmount(school)),
      agreement.programStatus || 'Still on program', agreement.stillOnProgram || 'Yes', agreement.paymentTerms || '', agreement.notes || school.notes || ''
    ]
  })
  const csv = [headers, ...rows].map((row) => row.map((cell) => '"' + String(cell).replaceAll('"', '""') + '"').join(',')).join(String.fromCharCode(10))
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'mezzo-schools-summary-' + today() + '.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function printSchoolContract(record, school, settings) {
  const schoolName = record.schoolName || school?.name || 'The School'
  const schoolLocation = record.schoolAddress || school?.location || ''
  const amount = formatMoney(record.amountAgreed || schoolExpectedAmount(school || {}), settings.currency || 'GHS')
  const date = record.agreementDate || today()
  const scope = record.programScope || 'KG (2) to JHS TWO (2)'
  const term = record.termStarted || school?.term || ''
  const year = record.academicYearStarted || school?.academicYear || ''
  const paymentTerms = record.paymentTerms || 'Payment shall be made in three instalments: 40% at the end of the first month of reopening, 30% at the end of the second month, and 30% at the end of the third month, or any agreement reached upon by both parties.'
  const logo = settings.logoDataUrl ? '<img src="' + agreementHtmlSafe(settings.logoDataUrl) + '" style="width:130px;height:110px;object-fit:contain" />' : '<div style="width:130px;height:110px;background:#0f2a66;color:white;display:grid;place-items:center;font-size:42px;font-weight:900;border-radius:12px">M</div>'
  const html = '<div class="contract-book">' +
    '<section class="contract-page contract-cover"><h1>MEZZO HOUSE LIMITED GHANA</h1><div class="contract-logo">' + logo + '</div><h2>CONTRACT AGREEMENT</h2><p>Between:</p><h3>MEZZO HOUSE LIMITED</h3><p>-and-</p><h3>' + agreementHtmlSafe(schoolName) + '</h3><p class="contract-date">Date: ' + agreementHtmlSafe(date) + '</p></section>' +
    '<section class="contract-page"><p>THIS AGREEMENT, made as of the day and year set out in this contract schedule.</p><h2>BETWEEN:</h2><p><strong>MEZZO HOUSE LIMITED</strong> whose corporate office is situated at No. 13 Gold Avenue Street, Old Ashongman, Accra, Ghana.</p><p>-and-</p><p><strong>' + agreementHtmlSafe(schoolName) + '</strong> whose corporate office is situated at ' + agreementHtmlSafe(schoolLocation) + ' (hereinafter referred to as “The School”).</p><h3>WHEREAS</h3><p>MEZZO HOUSE LIMITED is the sole authorised organization to operate the Mezzo Maths programme for children and schools in Ghana.</p><p>The School is desirous of obtaining the benefit of the knowledge, skills and experience of Mezzo House Limited and conducting the Mezzo Maths Programme in the school subject to the terms and conditions below.</p><h3>1. MEZZO HOUSE LTD’S OBLIGATIONS</h3><ol><li>To conduct MEZZO MATHS program for all agreed students enrolled in the School.</li><li>Provide the School with information and materials appropriate during the period of this agreement.</li><li>Provide general assistance, supervision, advice, knowhow and guidance relating to the programme.</li><li>Provide the School with opportunity to participate in promotional activities including demonstrations, seminars, media advertising and competitions.</li></ol></section>' +
    '<section class="contract-page"><h3>2. THE SCHOOL\'S OBLIGATIONS</h3><ol><li>The School, ' + agreementHtmlSafe(schoolName) + ', has agreed to run MEZZO MATHS PROGRAMME from ' + agreementHtmlSafe(scope) + '.</li><li>Grant to MEZZO HOUSE LTD. the right of entry into the School’s premises at any reasonable time for inspection, examination and supervision of MEZZO MATHS activities.</li><li>Shall pay a total sum amount of ' + agreementHtmlSafe(amount) + ' per term to MEZZO HOUSE LTD. based on the agreed student population.</li><li>Programme starts from ' + agreementHtmlSafe(term) + ' of the ' + agreementHtmlSafe(year) + ' academic year.</li><li>To promptly bring to the notice of MEZZO HOUSE LTD. any comments or criticisms received regarding the MEZZO MATHS PROGRAMME.</li><li>To incorporate the MEZZO MATHS programme in the school’s curricula and allow presentations during school functions.</li><li>Not to appoint or hire any staff or course instructors of MEZZO HOUSE LTD. for teaching Mezzo Maths after termination.</li></ol><h3>3. RESTRICTIONS ON THE SCHOOL</h3><p>The School shall not sell any MEZZO MATHS materials or render any similar programme that conflicts with the standards and Intellectual Property Rights of MEZZO HOUSE LTD. The School acknowledges that all information relating to the programme is strictly confidential.</p></section>' +
    '<section class="contract-page"><h3>4. TERMS OF PAYMENT</h3><p>' + agreementHtmlSafe(paymentTerms) + '</p><h3>5. DURATION</h3><p>For the full effectiveness and impact of the program, the agreement shall run for ' + agreementHtmlSafe(record.contractDuration || 'two academic years') + ', after which the school may continue or withdraw. The program is renewable.</p><h3>6. TERMINATION</h3><p>Without prejudice to any other rights available to MEZZO HOUSE LTD. under this Agreement or by law, MEZZO HOUSE LTD. may terminate this Agreement if the School fails to remedy a breach within 30 days of written notice. The School shall make known in written form its intention to terminate one term or 90 days ahead.</p><h3>7. CONSEQUENCES OF TERMINATION</h3><p>Upon termination or expiration, the School shall immediately pay MEZZO HOUSE LTD. the full amount of all monies due and shall not divert any business or customers from MEZZO HOUSE LTD.</p><h3>8. GOVERNING LAW & DISPUTE RESOLUTION</h3><p>This agreement shall be governed and construed in accordance with the laws of Ghana.</p></section>' +
    '<section class="contract-page"><h3>IN WITNESS WHEREOF</h3><p>The parties have hereunto set their hands and seals on the date stated above.</p><div class="contract-signatures"><div><p>SIGNED by:</p><p>Mr./Ms. .....................................................</p><p>on behalf of MEZZO HOUSE LTD.</p><p>Witness: .....................................................</p></div><div><p>SIGNED by:</p><p>Mr./Ms. .....................................................</p><p>for and on behalf of ' + agreementHtmlSafe(schoolName) + '</p><p>Witness: .....................................................</p></div></div></section>' +
  '</div>'
  printHtml('Contract Agreement - ' + schoolName, html)
}
`
  app = app.replace('function formatMoney(value, currency = \'GHS\') {', helpers + '\nfunction formatMoney(value, currency = \'GHS\') {')
  changed = true
}

if (!app.includes('function SchoolAgreementsPage(')) {
  const component = String.raw`
function SchoolAgreementsPage({ data, updateData }) {
  const empty = { schoolId: '', schoolName: '', schoolAddress: '', joinedDate: today(), agreementDate: today(), amountAgreed: '', academicYearStarted: '2026/2027', termStarted: 'Term 1', programScope: 'KG (2) to JHS TWO (2)', stillOnProgram: 'Yes', programStatus: 'Still on program', contractDuration: 'two academic years', paymentTerms: 'Payment shall be made in three instalments: 40% at the end of the first month of reopening, 30% at the end of the second month, and 30% at the end of the third month, or any agreement reached upon by both parties.', notes: '' }
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const currency = data.settings.currency || 'GHS'

  function chooseSchool(schoolId) {
    const school = data.schools.find((item) => item.id === schoolId)
    const existing = schoolAgreementFor(data.schoolAgreements, schoolId)
    if (existing) {
      setEditingId(existing.id)
      setForm({ ...empty, ...existing })
      return
    }
    setEditingId(null)
    setForm({ ...empty, schoolId, schoolName: school?.name || '', schoolAddress: school?.location || '', amountAgreed: school ? schoolExpectedAmount(school) : '', academicYearStarted: school?.academicYear || empty.academicYearStarted, termStarted: school?.term || empty.termStarted })
  }

  function save(event) {
    event.preventDefault()
    const payload = { ...form, amountAgreed: toNumber(form.amountAgreed), updatedAt: new Date().toISOString() }
    updateData((previous) => {
      const existing = previous.schoolAgreements || []
      if (editingId) return { ...previous, schoolAgreements: existing.map((item) => item.id === editingId ? { ...item, ...payload } : item) }
      return { ...previous, schoolAgreements: [{ id: uid('agreement'), createdAt: new Date().toISOString(), ...payload }, ...existing] }
    })
    setEditingId(null)
    setForm(empty)
  }

  function editAgreement(item) {
    setEditingId(item.id)
    setForm({ ...empty, ...item })
  }

  function deleteAgreement(id) {
    if (!window.confirm('Delete this school programme record?')) return
    updateData((previous) => ({ ...previous, schoolAgreements: (previous.schoolAgreements || []).filter((item) => item.id !== id) }))
  }

  function generateContractFromForm() {
    if (!form.schoolName) return alert('Select a school or type the school name first.')
    const school = data.schools.find((item) => item.id === form.schoolId)
    printSchoolContract(form, school, data.settings)
  }

  return (
    <section className="page-grid two-columns school-agreements-page">
      <div className="panel form-panel">
        <div className="panel-header"><div><p className="eyebrow">Schools</p><h3>{editingId ? 'Edit programme agreement' : 'School programme details'}</h3></div></div>
        <form className="form-grid" onSubmit={save}>
          <Select label="Select school" value={form.schoolId} onChange={chooseSchool} options={['', ...data.schools.map((school) => [school.id, school.name])]} />
          <Input label="School name" value={form.schoolName} onChange={(value) => setForm({ ...form, schoolName: value })} />
          <Input label="School address / location" value={form.schoolAddress} onChange={(value) => setForm({ ...form, schoolAddress: value })} />
          <Input label="Date school joined program" type="date" value={form.joinedDate} onChange={(value) => setForm({ ...form, joinedDate: value })} />
          <Input label="Contract agreement date" type="date" value={form.agreementDate} onChange={(value) => setForm({ ...form, agreementDate: value })} />
          <Input label="Amount agreed per term" type="number" value={form.amountAgreed} onChange={(value) => setForm({ ...form, amountAgreed: value })} />
          <Input label="Academic year started" value={form.academicYearStarted} onChange={(value) => setForm({ ...form, academicYearStarted: value })} />
          <Select label="Term started" value={form.termStarted} onChange={(value) => setForm({ ...form, termStarted: value })} options={['Term 1', 'Term 2', 'Term 3']} />
          <Input label="Programme scope" value={form.programScope} onChange={(value) => setForm({ ...form, programScope: value })} />
          <Select label="Still on program?" value={form.stillOnProgram} onChange={(value) => setForm({ ...form, stillOnProgram: value, programStatus: value === 'Yes' ? 'Still on program' : 'Not on program' })} options={['Yes', 'No']} />
          <Select label="Programme status" value={form.programStatus} onChange={(value) => setForm({ ...form, programStatus: value })} options={['Still on program', 'Not on program', 'Suspended', 'Completed', 'Pending renewal']} />
          <Input label="Contract duration" value={form.contractDuration} onChange={(value) => setForm({ ...form, contractDuration: value })} />
          <Textarea label="Payment terms" value={form.paymentTerms} onChange={(value) => setForm({ ...form, paymentTerms: value })} />
          <Textarea label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          <div className="form-actions full-span"><button className="primary-btn" type="submit"><Plus size={17}/> {editingId ? 'Update school info' : 'Save school info'}</button><button className="secondary-btn" type="button" onClick={generateContractFromForm}><FileText size={17}/> Generate contract</button>{editingId && <button className="secondary-btn" type="button" onClick={() => { setEditingId(null); setForm(empty) }}>Cancel</button>}</div>
        </form>
      </div>

      <div className="panel wide-panel">
        <div className="panel-header stack-mobile"><div><p className="eyebrow">School database</p><h3>Programme records and contracts</h3></div><button className="secondary-btn" type="button" onClick={() => downloadSchoolsSummaryCsv(data)}><Download size={17}/> Download all schools summary</button></div>
        <ResponsiveTable columns={['School','Joined','Academic year','Term','Amount','Status','Action']} rows={(data.schoolAgreements || []).map((item) => {
          const school = data.schools.find((s) => s.id === item.schoolId)
          return [<strong>{item.schoolName || school?.name}</strong>, item.joinedDate || 'N/A', item.academicYearStarted || 'N/A', item.termStarted || 'N/A', formatMoney(item.amountAgreed, currency), item.programStatus || item.stillOnProgram || 'N/A', <div className="row-actions"><button onClick={() => editAgreement(item)}>Edit</button><button onClick={() => printSchoolContract(item, school, data.settings)}>Contract</button><button className="danger-link" onClick={() => deleteAgreement(item.id)}><Trash2 size={14}/></button></div>]
        })} empty="No school programme records saved yet." />
      </div>
    </section>
  )
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', component + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (!app.includes("{ name: 'School Agreements'")) {
  if (app.includes("{ name: 'Schools', icon: School },\n    { name: 'Invoices'")) {
    app = app.replace("{ name: 'Schools', icon: School },\n    { name: 'Invoices'", "{ name: 'Schools', icon: School },\n    { name: 'School Agreements', icon: FileText },\n    { name: 'Invoices'")
  } else {
    app = app.replace("{ name: 'Schools', icon: School },", "{ name: 'Schools', icon: School },\n    { name: 'School Agreements', icon: FileText },")
  }
  changed = true
}

if (!app.includes("visiblePage === 'School Agreements'")) {
  app = app.replace("{visiblePage === 'Schools' && <SchoolsPage data={data} updateData={updateData} />}", "{visiblePage === 'Schools' && <SchoolsPage data={data} updateData={updateData} />}\n        {visiblePage === 'School Agreements' && <SchoolAgreementsPage data={data} updateData={updateData} />}")
  changed = true
}

app = app.replaceAll("'Schools', 'Invoices'", "'Schools', 'School Agreements', 'Invoices'")
app = app.replaceAll("'Schools', 'Payments'", "'Schools', 'School Agreements', 'Payments'")
changed = true

if (app.includes('<div className="brand-mark">M</div>')) {
  app = app.replace('<div className="brand-mark">M</div>', '<div className="brand-mark">{data.settings.logoDataUrl ? <img src={data.settings.logoDataUrl} alt="Mezzo logo" /> : \'M\'}</div>')
  changed = true
}

if (changed) write(appPath, app)

let css = read(stylesPath)
if (!css.includes('/* School agreements and top-first page layout */')) {
  css += String.raw`

/* School agreements and top-first page layout */
.brand-mark { overflow:hidden; }
.brand-mark img { width:100%; height:100%; object-fit:contain; border-radius:inherit; display:block; }
.school-agreements-page .form-panel { position: static !important; }
.school-agreements-page .wide-panel { min-width: 0; }
.page-grid.two-columns:not(.invoice-page-grid):not(.accounts-exact-page) { grid-template-columns: 1fr !important; }
.page-grid.two-columns:not(.invoice-page-grid):not(.accounts-exact-page) .form-panel { position: static !important; order: 1; }
.page-grid.two-columns:not(.invoice-page-grid):not(.accounts-exact-page) .wide-panel { order: 2; width:100%; }
@media (min-width: 1000px) { .school-agreements-page .form-grid { grid-template-columns: repeat(4, minmax(180px, 1fr)) !important; } }
.contract-book .contract-page { max-width: 820px; min-height: 1080px; margin: 0 auto 18px; padding: 44px 56px; background:#fff; color:#111; page-break-after: always; font-family: Arial, sans-serif; border:1px solid #e5e7eb; }
.contract-book .contract-cover { text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.contract-book h1 { background:#315d7a; color:#fff; padding:12px; text-align:center; font-size:28px; margin:0 0 20px; width:100%; }
.contract-book h2 { text-align:center; font-size:26px; margin:18px 0; }
.contract-book h3 { font-size:18px; margin:16px 0 8px; }
.contract-book p, .contract-book li { font-size:14px; line-height:1.7; }
.contract-book .contract-logo { margin:28px 0; }
.contract-book .contract-date { margin-top:48px; font-weight:800; }
.contract-book .contract-signatures { display:grid; grid-template-columns:1fr 1fr; gap:38px; margin-top:40px; }
`
  write(stylesPath, css)
}

console.log('[patch-school-agreements-v1] ready')
