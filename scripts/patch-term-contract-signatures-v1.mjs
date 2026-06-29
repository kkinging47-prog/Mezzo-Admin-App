import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

if (!app.includes('termArchives: Array.isArray(parsed.termArchives)')) {
  if (app.includes('schoolAgreements: Array.isArray(parsed.schoolAgreements) ? parsed.schoolAgreements : []')) {
    app = app.replace('schoolAgreements: Array.isArray(parsed.schoolAgreements) ? parsed.schoolAgreements : []', 'schoolAgreements: Array.isArray(parsed.schoolAgreements) ? parsed.schoolAgreements : [],\n    termArchives: Array.isArray(parsed.termArchives) ? parsed.termArchives : []')
  } else if (app.includes('companyLoans: Array.isArray(parsed.companyLoans) ? parsed.companyLoans : []')) {
    app = app.replace('companyLoans: Array.isArray(parsed.companyLoans) ? parsed.companyLoans : []', 'companyLoans: Array.isArray(parsed.companyLoans) ? parsed.companyLoans : [],\n    termArchives: Array.isArray(parsed.termArchives) ? parsed.termArchives : []')
  }
  changed = true
}

if (!app.includes('function currentSchoolBalanceForRollover')) {
  const helpers = String.raw`
function currentSchoolBalanceForRollover(school, data) {
  const expected = schoolExpectedAmount(school)
  const paid = (data.payments || []).filter((payment) => payment.schoolId === school.id).reduce((sum, payment) => sum + toNumber(payment.amount), 0)
  const salaryCredit = typeof schoolSalaryCreditAmount === 'function' ? schoolSalaryCreditAmount(school.id, data.staff || []) : 0
  return Math.max(expected - paid - salaryCredit, 0)
}

function schoolBooksDefaultForTerm(school, term, defaultBookCharge) {
  if (term !== 'Term 1') return { booksBought: 0, bookUnitPrice: 0 }
  return {
    booksBought: toNumber(school.students),
    bookUnitPrice: toNumber(defaultBookCharge || school.bookUnitPrice || 0)
  }
}
`
  app = app.replace('function formatMoney(value, currency = \'GHS\') {', helpers + '\nfunction formatMoney(value, currency = \'GHS\') {')
  changed = true
}

if (!app.includes('function AcademicTermSetupPage(')) {
  const component = String.raw`
function AcademicTermSetupPage({ data, updateData }) {
  const [form, setForm] = useState({ academicYear: '2026/2027', term: 'Term 1', defaultBookCharge: '', note: '' })
  const currency = data.settings.currency || 'GHS'
  const preview = (data.schools || []).map((school) => ({
    school,
    balance: currentSchoolBalanceForRollover(school, data),
    books: schoolBooksDefaultForTerm(school, form.term, form.defaultBookCharge)
  }))

  function startNewTerm() {
    if (!window.confirm('Start ' + form.academicYear + ' ' + form.term + '? Current payments will be archived and reset to zero. Balances will become arrears.')) return
    const snapshot = {
      id: uid('termarchive'),
      archivedAt: new Date().toISOString(),
      previousAcademicYear: data.schools?.[0]?.academicYear || '',
      previousTerm: data.schools?.[0]?.term || '',
      newAcademicYear: form.academicYear,
      newTerm: form.term,
      payments: data.payments || [],
      schools: (data.schools || []).map((school) => ({ ...school, arrearsBalance: currentSchoolBalanceForRollover(school, data) })),
      note: form.note || ''
    }

    updateData((previous) => ({
      ...previous,
      payments: [],
      termArchives: [snapshot, ...(previous.termArchives || [])],
      schools: (previous.schools || []).map((school) => {
        const arrears = currentSchoolBalanceForRollover(school, previous)
        const books = schoolBooksDefaultForTerm(school, form.term, form.defaultBookCharge)
        return {
          ...school,
          academicYear: form.academicYear,
          term: form.term,
          arrears,
          booksBought: books.booksBought,
          bookUnitPrice: books.bookUnitPrice
        }
      })
    }))
  }

  return (
    <section className="page-grid two-columns term-setup-page">
      <div className="panel form-panel">
        <div className="panel-header"><div><p className="eyebrow">Academic year</p><h3>Start new academic year / term</h3></div></div>
        <div className="form-grid">
          <Select label="Academic year" value={form.academicYear} onChange={(value) => setForm({ ...form, academicYear: value })} options={['2026/2027', '2027/2028', '2028/2029', '2029/2030']} />
          <Select label="Term" value={form.term} onChange={(value) => setForm({ ...form, term: value })} options={['Term 1', 'Term 2', 'Term 3']} />
          <Input label="Default book charge for Term 1" type="number" value={form.defaultBookCharge} onChange={(value) => setForm({ ...form, defaultBookCharge: value })} />
          <Textarea label="Rollover note" value={form.note} onChange={(value) => setForm({ ...form, note: value })} />
        </div>
        <div className="alert warning">When you start a new term, current payments are archived and reset to zero. Each school’s current balance becomes arrears for the new term. For Term 1, the book quantity is set from student population and the book charge is added.</div>
        <button className="primary-btn" type="button" onClick={startNewTerm}><BookOpen size={17}/> Start selected term</button>
      </div>
      <div className="panel wide-panel">
        <div className="panel-header"><div><p className="eyebrow">Preview</p><h3>Arrears and book purchases before rollover</h3></div></div>
        <ResponsiveTable columns={['School','Current balance to arrears','New academic year','New term','Books qty','Book charge']} rows={preview.map(({ school, balance, books }) => [school.name, formatMoney(balance, currency), form.academicYear, form.term, books.booksBought, formatMoney(books.bookUnitPrice, currency)])} empty="No schools found." />
      </div>
    </section>
  )
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', component + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (!app.includes("{ name: 'Academic Term Setup'")) {
  app = app.replace("{ name: 'Dashboard', icon: BarChart3 },", "{ name: 'Dashboard', icon: BarChart3 },\n    { name: 'Academic Term Setup', icon: BookOpen },")
  changed = true
}
if (!app.includes("visiblePage === 'Academic Term Setup'")) {
  app = app.replace("{visiblePage === 'Dashboard' && <DashboardPage data={data} financials={financials} />}", "{visiblePage === 'Dashboard' && <DashboardPage data={data} financials={financials} />}\n        {visiblePage === 'Academic Term Setup' && <AcademicTermSetupPage data={data} updateData={updateData} />}")
  changed = true
}
app = app.replaceAll("'Dashboard', 'Schools'", "'Dashboard', 'Academic Term Setup', 'Schools'")
app = app.replaceAll("'Dashboard', 'Academic Year', 'Schools'", "'Dashboard', 'Academic Term Setup', 'Schools'")
changed = true

if (!app.includes('function printSchoolContractWithSummary')) {
  const contractV2 = String.raw`
function agreementAmountLine(record, school, settings) {
  const currency = settings.currency || 'GHS'
  const billingType = record.billingType || 'Per term'
  const perChild = toNumber(record.amountPerChild)
  const perTerm = toNumber(record.amountPerTerm || record.amountAgreed || schoolExpectedAmount(school || {}))
  const books = toNumber(record.booksCharge)
  const main = billingType === 'Per child'
    ? formatMoney(perChild, currency) + ' per child per term'
    : formatMoney(perTerm, currency) + ' per term'
  const bookText = books > 0 ? ' and workbooks at ' + formatMoney(books, currency) + ' per child for the year' : ''
  return main + bookText
}

function printSchoolContractWithSummary(record, school, settings) {
  const schoolName = record.schoolName || school?.name || 'The School'
  const schoolLocation = record.schoolAddress || school?.location || ''
  const date = record.agreementDate || today()
  const scope = record.programScope || 'KG (2) to JHS TWO (2)'
  const term = record.termStarted || school?.term || ''
  const year = record.academicYearStarted || school?.academicYear || ''
  const amountLine = agreementAmountLine(record, school, settings)
  const paymentTerms = record.paymentTerms || 'Payment shall be made in three instalments: 50% at the end of the first month of reopening, 25% at the end of the second month, and 25% at the end of the third month, or any agreement reached upon by both parties.'
  const logo = settings.logoDataUrl ? '<img src="' + agreementHtmlSafe(settings.logoDataUrl) + '" style="width:130px;height:110px;object-fit:contain" />' : '<div style="width:130px;height:110px;background:#0f2a66;color:white;display:grid;place-items:center;font-size:32px;font-weight:900;border-radius:12px">Mezzo</div>'
  const signature = settings.contractSignatureDataUrl || settings.ceoSignatureDataUrl || settings.adminSignatureDataUrl
  const signatureHtml = signature ? '<img src="' + agreementHtmlSafe(signature) + '" style="height:64px;max-width:220px;object-fit:contain;display:block;margin-bottom:6px" />' : '<div style="height:64px"></div>'
  const html = '<div class="contract-book">' +
    '<section class="contract-page contract-summary-page"><h1>SIMPLE CONTRACT SUMMARY</h1><h2>' + agreementHtmlSafe(schoolName) + ' and Mezzo House Limited</h2><p>This first page explains the agreement in simple terms. The full binding contract follows after this summary.</p><table><tbody><tr><td>School</td><td>' + agreementHtmlSafe(schoolName) + '</td></tr><tr><td>Location</td><td>' + agreementHtmlSafe(schoolLocation) + '</td></tr><tr><td>Date</td><td>' + agreementHtmlSafe(date) + '</td></tr><tr><td>Programme starts</td><td>' + agreementHtmlSafe(term + ' - ' + year) + '</td></tr><tr><td>Classes covered</td><td>' + agreementHtmlSafe(scope) + '</td></tr><tr><td>Amount agreed</td><td>' + agreementHtmlSafe(amountLine) + '</td></tr><tr><td>Payment terms</td><td>' + agreementHtmlSafe(paymentTerms) + '</td></tr></tbody></table><ol><li>Mezzo House Limited will run the Mezzo Maths programme in the school and provide support, supervision and programme materials.</li><li>The school will allow Mezzo to operate the programme and will pay the agreed fees.</li><li>The school should not copy, sell, or use Mezzo Maths materials outside the agreed programme.</li><li>The agreement is intended to run for two academic years and can be renewed.</li><li>If the school wants to end the programme, it should give one term or 90 days written notice.</li><li>Any money owed to Mezzo must be paid when the agreement ends.</li></ol></section>' +
    '<section class="contract-page contract-cover"><h1>MEZZO HOUSE LIMITED GHANA</h1><div class="contract-logo">' + logo + '</div><h2>CONTRACT AGREEMENT</h2><p>Between:</p><h3>MEZZO HOUSE LIMITED</h3><p>-and-</p><h3>' + agreementHtmlSafe(schoolName) + '</h3><p class="contract-date">Date: ' + agreementHtmlSafe(date) + '</p></section>' +
    '<section class="contract-page"><p>THIS AGREEMENT, made as of the day and year set out in this contract schedule.</p><h2>BETWEEN:</h2><p><strong>MEZZO HOUSE LIMITED</strong> whose corporate office is situated at No. 13 Gold Avenue Street, Old Ashongman, Accra, Ghana.</p><p>-and-</p><p><strong>' + agreementHtmlSafe(schoolName) + '</strong> whose corporate office is situated at ' + agreementHtmlSafe(schoolLocation) + ' (hereinafter referred to as “The School”).</p><h3>WHEREAS</h3><p>MEZZO HOUSE LIMITED is the sole authorised organization to operate the Mezzo Maths programme for children and schools in Ghana.</p><p>The School is desirous of obtaining the benefit of the knowledge, skills and experience of Mezzo House Limited and conducting the Mezzo Maths Programme in the school subject to the terms and conditions below.</p><h3>1. MEZZO HOUSE LTD’S OBLIGATIONS</h3><ol><li>To conduct MEZZO MATHS program for all agreed students enrolled in the School.</li><li>Provide the School with information and materials appropriate during the period of this agreement.</li><li>Provide general assistance, supervision, advice, knowhow and guidance relating to the programme.</li><li>Provide the School with opportunity to participate in promotional activities including demonstrations, seminars, media advertising and competitions.</li></ol></section>' +
    '<section class="contract-page"><h3>2. THE SCHOOL\'S OBLIGATIONS</h3><ol><li>The School, ' + agreementHtmlSafe(schoolName) + ', has agreed to run MEZZO MATHS PROGRAMME from ' + agreementHtmlSafe(scope) + '.</li><li>Grant to MEZZO HOUSE LTD. the right of entry into the School’s premises at any reasonable time for inspection, examination and supervision of MEZZO MATHS activities.</li><li>Shall pay ' + agreementHtmlSafe(amountLine) + ' to MEZZO HOUSE LTD. based on the agreed student population.</li><li>Programme starts from ' + agreementHtmlSafe(term) + ' of the ' + agreementHtmlSafe(year) + ' academic year.</li><li>To promptly bring to the notice of MEZZO HOUSE LTD. any comments or criticisms received regarding the MEZZO MATHS PROGRAMME.</li><li>To incorporate the MEZZO MATHS programme in the school’s curricula and allow presentations during school functions.</li><li>Not to appoint or hire any staff or course instructors of MEZZO HOUSE LTD. for teaching Mezzo Maths after termination.</li></ol><h3>3. RESTRICTIONS ON THE SCHOOL</h3><p>The School shall not sell any MEZZO MATHS materials or render any similar programme that conflicts with the standards and Intellectual Property Rights of MEZZO HOUSE LTD. The School acknowledges that all information relating to the programme is strictly confidential.</p></section>' +
    '<section class="contract-page"><h3>4. TERMS OF PAYMENT</h3><p>' + agreementHtmlSafe(paymentTerms) + '</p><h3>5. DURATION</h3><p>For the effect and impact of the program, the agreement shall run for ' + agreementHtmlSafe(record.contractDuration || 'two academic years') + ', after which the school may continue or withdraw. The program is renewable.</p><h3>6. TERMINATION</h3><p>Without prejudice to any other rights available to MEZZO HOUSE LTD. under this Agreement or by law, MEZZO HOUSE LTD. may terminate this Agreement if the School fails to remedy a breach within 30 days of written notice. The School shall make known in written form its intention to terminate one term or 90 days ahead.</p><h3>7. CONSEQUENCES OF TERMINATION</h3><p>Upon termination or expiration, the School shall immediately pay MEZZO HOUSE LTD. the full amount of all monies due and shall not divert any business or customers from MEZZO HOUSE LTD.</p><h3>8. GOVERNING LAW & DISPUTE RESOLUTION</h3><p>This agreement shall be governed and construed in accordance with the laws of Ghana.</p></section>' +
    '<section class="contract-page"><h3>IN WITNESS WHEREOF</h3><p>The parties have hereunto set their hands and seals on the date stated above.</p><div class="contract-signatures"><div>' + signatureHtml + '<p>SIGNED by:</p><p>Mr./Ms. .....................................................</p><p>on behalf of MEZZO HOUSE LTD.</p><p>Witness: .....................................................</p></div><div><div style="height:64px"></div><p>SIGNED by:</p><p>Mr./Ms. .....................................................</p><p>for and on behalf of ' + agreementHtmlSafe(schoolName) + '</p><p>Witness: .....................................................</p></div></div></section>' +
  '</div>'
  printHtml('Contract Agreement - ' + schoolName, html)
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', contractV2 + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (app.includes('printSchoolContract(form, school, data.settings)')) {
  app = app.replaceAll('printSchoolContract(form, school, data.settings)', 'printSchoolContractWithSummary(form, school, data.settings)')
  changed = true
}
if (app.includes('printSchoolContract(item, school, data.settings)')) {
  app = app.replaceAll('printSchoolContract(item, school, data.settings)', 'printSchoolContractWithSummary(item, school, data.settings)')
  changed = true
}

if (!app.includes('Billing type')) {
  app = app.replace("amountAgreed: '', academicYearStarted:", "billingType: 'Per term', amountPerChild: '', amountPerTerm: '', booksCharge: '', amountAgreed: '', academicYearStarted:")
  app = app.replace('40% at the end of the first month of reopening, 30% at the end of the second month, and 30% at the end of the third month', '50% at the end of the first month of reopening, 25% at the end of the second month, and 25% at the end of the third month')
  app = app.replace('amountAgreed: school ? schoolExpectedAmount(school) : \'\', academicYearStarted:', "billingType: 'Per term', amountPerTerm: school ? schoolExpectedAmount(school) : '', amountPerChild: school?.feePerStudent || '', booksCharge: school?.bookUnitPrice || '', amountAgreed: school ? schoolExpectedAmount(school) : '', academicYearStarted:")
  app = app.replace('const payload = { ...form, amountAgreed: toNumber(form.amountAgreed), updatedAt: new Date().toISOString() }', "const payload = { ...form, amountAgreed: toNumber(form.amountAgreed || form.amountPerTerm), amountPerChild: toNumber(form.amountPerChild), amountPerTerm: toNumber(form.amountPerTerm || form.amountAgreed), booksCharge: toNumber(form.booksCharge), updatedAt: new Date().toISOString() }")
  app = app.replace('<Input label="Amount agreed per term" type="number" value={form.amountAgreed} onChange={(value) => setForm({ ...form, amountAgreed: value })} />', '<Select label="Billing type" value={form.billingType || \'Per term\'} onChange={(value) => setForm({ ...form, billingType: value })} options={[\'Per term\', \'Per child\']} />\n          <Input label="Amount per child" type="number" value={form.amountPerChild} onChange={(value) => setForm({ ...form, amountPerChild: value })} />\n          <Input label="Amount per term" type="number" value={form.amountPerTerm || form.amountAgreed} onChange={(value) => setForm({ ...form, amountPerTerm: value, amountAgreed: value })} />\n          <Input label="Books charge per child" type="number" value={form.booksCharge} onChange={(value) => setForm({ ...form, booksCharge: value })} />')
  changed = true
}

if (app.includes('function uploadLogo(event)') && !app.includes('function uploadSignature(')) {
  app = app.replace("  function uploadLogo(event) {\n    const file = event.target.files?.[0]\n    if (!file) return\n    const reader = new FileReader()\n    reader.onload = () => updateField('logoDataUrl', String(reader.result || ''))\n    reader.readAsDataURL(file)\n  }", "  function uploadLogo(event) {\n    const file = event.target.files?.[0]\n    if (!file) return\n    const reader = new FileReader()\n    reader.onload = () => updateField('logoDataUrl', String(reader.result || ''))\n    reader.readAsDataURL(file)\n  }\n\n  function uploadSignature(event, field) {\n    const file = event.target.files?.[0]\n    if (!file) return\n    const reader = new FileReader()\n    reader.onload = () => updateField(field, String(reader.result || ''))\n    reader.readAsDataURL(file)\n  }")
  app = app.replace('<label className="field full-span"><span>Official company logo</span><input type="file" accept="image/*" onChange={uploadLogo} /></label>', '<label className="field full-span"><span>Official company logo</span><input type="file" accept="image/*" onChange={uploadLogo} /></label>\n          <label className="field"><span>CEO / Director signature</span><input type="file" accept="image/*" onChange={(event) => uploadSignature(event, \'ceoSignatureDataUrl\')} /></label>\n          <label className="field"><span>HR signature</span><input type="file" accept="image/*" onChange={(event) => uploadSignature(event, \'hrSignatureDataUrl\')} /></label>\n          <label className="field"><span>Finance signature</span><input type="file" accept="image/*" onChange={(event) => uploadSignature(event, \'financeSignatureDataUrl\')} /></label>\n          <label className="field"><span>Contract / Admin signature</span><input type="file" accept="image/*" onChange={(event) => uploadSignature(event, \'contractSignatureDataUrl\')} /></label>')
  app = app.replace('{form.logoDataUrl && <div className="settings-logo-preview full-span"><img src={form.logoDataUrl} alt="Company logo" /><span>Logo loaded. Click Save settings to apply.</span></div>}', '{form.logoDataUrl && <div className="settings-logo-preview full-span"><img src={form.logoDataUrl} alt="Company logo" /><span>Logo loaded. Click Save settings to apply.</span></div>}\n          {(form.ceoSignatureDataUrl || form.hrSignatureDataUrl || form.financeSignatureDataUrl || form.contractSignatureDataUrl) && <div className="settings-signatures-preview full-span">{form.ceoSignatureDataUrl && <span><img src={form.ceoSignatureDataUrl} alt="CEO signature" />CEO</span>}{form.hrSignatureDataUrl && <span><img src={form.hrSignatureDataUrl} alt="HR signature" />HR</span>}{form.financeSignatureDataUrl && <span><img src={form.financeSignatureDataUrl} alt="Finance signature" />Finance</span>}{form.contractSignatureDataUrl && <span><img src={form.contractSignatureDataUrl} alt="Contract signature" />Contract</span>}</div>}')
  changed = true
}

if (app.includes('<div className="brand-mark">M</div>')) {
  app = app.replace('<div className="brand-mark">M</div>', '<div className="brand-mark">{data.settings.logoDataUrl || (typeof window !== \'undefined\' && window.localStorage.getItem(\'mezzo_maths_admin_logo_v1\')) ? <img src={data.settings.logoDataUrl || window.localStorage.getItem(\'mezzo_maths_admin_logo_v1\')} alt="Mezzo logo" /> : \'Mezzo\'}</div>')
  changed = true
}
if (app.includes("{data.settings.logoDataUrl ? <img src={data.settings.logoDataUrl} alt=\"Mezzo logo\" /> : 'M'}")) {
  app = app.replace("{data.settings.logoDataUrl ? <img src={data.settings.logoDataUrl} alt=\"Mezzo logo\" /> : 'M'}", "{data.settings.logoDataUrl || (typeof window !== 'undefined' && window.localStorage.getItem('mezzo_maths_admin_logo_v1')) ? <img src={data.settings.logoDataUrl || window.localStorage.getItem('mezzo_maths_admin_logo_v1')} alt=\"Mezzo logo\" /> : 'Mezzo'}")
  changed = true
}

if (changed) write(appPath, app)

let css = read(stylesPath)
if (!css.includes('/* Term rollover and signatures */')) {
  css += String.raw`

/* Term rollover and signatures */
.settings-signatures-preview { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:10px; padding:12px; border:1px solid var(--line); border-radius:14px; background:#f8fafc; }
.settings-signatures-preview span { display:grid; gap:6px; font-size:12px; font-weight:800; color:#334155; }
.settings-signatures-preview img { height:54px; width:100%; object-fit:contain; background:white; border:1px solid var(--line); border-radius:10px; }
.term-setup-page .wide-panel table { min-width: 900px; }
.contract-summary-page table { width:100%; border-collapse:collapse; margin:18px 0; }
.contract-summary-page td { border:1px solid #111; padding:9px; vertical-align:top; }
.contract-summary-page td:first-child { font-weight:900; width:200px; }
`
  write(stylesPath, css)
}

console.log('[patch-term-contract-signatures-v1] ready')
