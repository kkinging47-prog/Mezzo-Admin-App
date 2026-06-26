import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }
function changed(name) { console.log(`[patch-country-documents] ${name}`) }

let app = read(appPath)
let appChanged = false

if (!app.includes("const DOCUMENT_BUCKET = 'mezzo-admin-documents'")) {
  app = app.replace(
    "const APP_DATA_ID = 'main'\n",
    "const APP_DATA_ID = 'main'\nconst DOCUMENT_BUCKET = 'mezzo-admin-documents'\n"
  )
  appChanged = true
}

if (!app.includes('async function uploadDocumentFiles')) {
  app = app.replace(
    `function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatMoney`,
    `function today() {
  return new Date().toISOString().slice(0, 10)
}

function safePathPart(value = '') {
  return String(value || 'file')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file'
}

function formatBytes(size = 0) {
  const bytes = toNumber(size)
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function readDocumentFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read ' + file.name))
    reader.readAsDataURL(file)
  })
}

async function uploadDocumentFiles(fileList, folder = 'documents') {
  const files = Array.from(fileList || [])
  const uploaded = []

  for (const file of files) {
    if (!file) continue
    const cleanName = safePathPart(file.name)
    const id = uid('docfile')

    if (hasSupabaseConfig) {
      const path = folder + '/' + Date.now() + '-' + Math.random().toString(16).slice(2) + '-' + cleanName
      const { error } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        })

      if (error) {
        throw new Error('Could not upload ' + file.name + ': ' + error.message + '. Run the Supabase document storage SQL setup, then try again.')
      }

      uploaded.push({
        id,
        storage: 'supabase',
        bucket: DOCUMENT_BUCKET,
        path,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      })
    } else {
      if (file.size > 900000) {
        throw new Error(file.name + ' is too large for local demo storage. Connect Supabase Storage for company files.')
      }
      const dataUrl = await readDocumentFileAsDataUrl(file)
      uploaded.push({
        id,
        storage: 'embedded',
        dataUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      })
    }
  }

  return uploaded
}

async function downloadDocumentFile(file) {
  try {
    if (file.storage === 'supabase' && file.path) {
      const { data, error } = await supabase.storage
        .from(file.bucket || DOCUMENT_BUCKET)
        .download(file.path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name || 'document'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      return
    }

    if (file.dataUrl) {
      const a = document.createElement('a')
      a.href = file.dataUrl
      a.download = file.name || 'document'
      document.body.appendChild(a)
      a.click()
      a.remove()
      return
    }

    alert('This document cannot be downloaded because the file link is missing.')
  } catch (error) {
    alert(error.message || 'Could not download this file.')
  }
}

function formatMoney`
  )
  appChanged = true
}

if (!app.includes('countryDocs: Array.isArray(parsed.countryDocs)')) {
  app = app.replace(
    `    staff: Array.isArray(parsed.staff) ? parsed.staff : []`,
    `    staff: Array.isArray(parsed.staff) ? parsed.staff : [],
    countryDocs: Array.isArray(parsed.countryDocs) ? parsed.countryDocs : [],
    companyDocs: Array.isArray(parsed.companyDocs) ? parsed.companyDocs : []`
  )
  appChanged = true
}

if (!app.includes("'Country Updates'")) {
  app = app.replace(
    `  'Super Admin': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll', 'Admin Users', 'Settings'],
  'Finance Admin': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll'],
  'Viewer': ['Dashboard', 'Schools']`,
    `  'Super Admin': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll', 'Country Updates', 'Company Documents', 'Admin Users', 'Settings'],
  'Finance Admin': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll', 'Country Updates', 'Company Documents'],
  'Viewer': ['Dashboard', 'Schools']`
  )
  app = app.replace(
    `    { name: 'Payroll', icon: Users },
    { name: 'Admin Users', icon: ShieldCheck },`,
    `    { name: 'Payroll', icon: Users },
    { name: 'Country Updates', icon: Landmark },
    { name: 'Company Documents', icon: FileText },
    { name: 'Admin Users', icon: ShieldCheck },`
  )
  app = app.replace(
    `        {visiblePage === 'Payroll' && <PayrollPage data={data} updateData={updateData} financials={financials} />}
        {visiblePage === 'Admin Users'`,
    `        {visiblePage === 'Payroll' && <PayrollPage data={data} updateData={updateData} financials={financials} />}
        {visiblePage === 'Country Updates' && <CountryDocumentsPage data={data} updateData={updateData} currentUser={currentUser} />}
        {visiblePage === 'Company Documents' && <CompanyDocumentsPage data={data} updateData={updateData} currentUser={currentUser} />}
        {visiblePage === 'Admin Users'`
  )
  appChanged = true
}

if (!app.includes('function CountryDocumentsPage(')) {
  const documentComponents = `
function DocumentFileList({ files = [] }) {
  if (!files.length) return <div className="doc-empty">No file attached.</div>
  return (
    <div className="doc-file-list">
      {files.map((file) => (
        <button key={file.id || file.path || file.name} type="button" className="doc-file" onClick={() => downloadDocumentFile(file)}>
          <FileText size={15} />
          <span>{file.name || 'Document'}</span>
          <small>{formatBytes(file.size)}</small>
          <Download size={14} />
        </button>
      ))}
    </div>
  )
}

function CountryDocumentsPage({ data, updateData, currentUser }) {
  const [form, setForm] = useState({ country: 'Ghana', title: '', status: 'Active', date: today(), update: '' })
  const [files, setFiles] = useState([])
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  const records = (data.countryDocs || [])
    .filter((item) => \`${'${item.country} ${item.title} ${item.update} ${item.status}'}\`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))

  async function saveCountryUpdate(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const uploadedFiles = await uploadDocumentFiles(files, 'countries/' + safePathPart(form.country))
      const newRecord = {
        id: uid('countrydoc'),
        ...form,
        files: uploadedFiles,
        createdBy: currentUser?.name || 'Admin',
        createdAt: new Date().toISOString()
      }
      updateData((previous) => ({ ...previous, countryDocs: [newRecord, ...(previous.countryDocs || [])] }))
      setForm({ country: form.country || 'Ghana', title: '', status: 'Active', date: today(), update: '' })
      setFiles([])
      setFileInputKey((key) => key + 1)
    } catch (error) {
      alert(error.message || 'Could not save this country update.')
    } finally {
      setSaving(false)
    }
  }

  function deleteCountryUpdate(recordId) {
    if (!window.confirm('Delete this country update and its document links from the app?')) return
    updateData((previous) => ({ ...previous, countryDocs: (previous.countryDocs || []).filter((item) => item.id !== recordId) }))
  }

  return (
    <section className="page-grid two-columns">
      <div className="panel form-panel">
        <div className="panel-header"><div><p className="eyebrow">Countries</p><h3>Add country update and documents</h3></div></div>
        <form className="form-grid" onSubmit={saveCountryUpdate}>
          <Input label="Country" required value={form.country} onChange={(value) => setForm({ ...form, country: value })} placeholder="Ghana, Zambia, Nigeria..." />
          <Input label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
          <Input label="Update title" required value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Meeting, proposal, approval, trip report..." />
          <Select label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={['Active', 'Pending', 'Completed', 'On Hold']} />
          <Textarea label="Write update" value={form.update} onChange={(value) => setForm({ ...form, update: value })} />
          <label className="field full-span">
            <span>Upload country documents</span>
            <input key={fileInputKey} className="file-control" type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} />
          </label>
          {files.length > 0 && <div className="file-selection full-span">{files.length} file(s) selected: {files.map((file) => file.name).join(', ')}</div>}
          <button className="primary-btn" type="submit" disabled={saving}><Plus size={17} /> {saving ? 'Uploading...' : 'Save country update'}</button>
        </form>
      </div>

      <div className="panel wide-panel">
        <div className="panel-header stack-mobile">
          <div><p className="eyebrow">Country records</p><h3>Updates and uploaded files</h3></div>
          <div className="search-box"><Search size={16} /><input placeholder="Search country updates" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        </div>
        <div className="doc-list">
          {records.length === 0 ? <div className="empty-state">No country updates or documents uploaded yet.</div> : records.map((record) => (
            <article className="doc-card" key={record.id}>
              <div className="doc-card-head">
                <div>
                  <p className="eyebrow">{record.country}</p>
                  <h4>{record.title}</h4>
                  <span className="subtext">{record.date || 'No date'} • {record.status || 'Active'} • Added by {record.createdBy || 'Admin'}</span>
                </div>
                <button className="danger-link" onClick={() => deleteCountryUpdate(record.id)}><Trash2 size={14} /></button>
              </div>
              {record.update && <p className="doc-note">{record.update}</p>}
              <DocumentFileList files={record.files || []} />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function CompanyDocumentsPage({ data, updateData, currentUser }) {
  const [form, setForm] = useState({ title: '', category: 'General', date: today(), notes: '' })
  const [files, setFiles] = useState([])
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  const records = (data.companyDocs || [])
    .filter((item) => \`${'${item.title} ${item.category} ${item.notes}'}\`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))

  async function saveCompanyDocument(event) {
    event.preventDefault()
    if (!files.length && !form.notes.trim()) return alert('Add at least one file or write a note before saving.')
    setSaving(true)
    try {
      const uploadedFiles = await uploadDocumentFiles(files, 'company/' + safePathPart(form.category))
      const newRecord = {
        id: uid('companydoc'),
        ...form,
        files: uploadedFiles,
        createdBy: currentUser?.name || 'Admin',
        createdAt: new Date().toISOString()
      }
      updateData((previous) => ({ ...previous, companyDocs: [newRecord, ...(previous.companyDocs || [])] }))
      setForm({ title: '', category: form.category || 'General', date: today(), notes: '' })
      setFiles([])
      setFileInputKey((key) => key + 1)
    } catch (error) {
      alert(error.message || 'Could not save this company document.')
    } finally {
      setSaving(false)
    }
  }

  function deleteCompanyDocument(recordId) {
    if (!window.confirm('Delete this company document record and its file links from the app?')) return
    updateData((previous) => ({ ...previous, companyDocs: (previous.companyDocs || []).filter((item) => item.id !== recordId) }))
  }

  return (
    <section className="page-grid two-columns">
      <div className="panel form-panel">
        <div className="panel-header"><div><p className="eyebrow">Company files</p><h3>Upload company document</h3></div></div>
        <form className="form-grid" onSubmit={saveCompanyDocument}>
          <Input label="Document title" required value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Contract, proposal, report, certificate..." />
          <Select label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} options={['General', 'Legal', 'Finance', 'HR', 'Proposals', 'Contracts', 'Reports', 'Approvals']} />
          <Input label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
          <Textarea label="Notes / description" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          <label className="field full-span">
            <span>Upload company files</span>
            <input key={fileInputKey} className="file-control" type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} />
          </label>
          {files.length > 0 && <div className="file-selection full-span">{files.length} file(s) selected: {files.map((file) => file.name).join(', ')}</div>}
          <button className="primary-btn" type="submit" disabled={saving}><Plus size={17} /> {saving ? 'Uploading...' : 'Save company document'}</button>
        </form>
      </div>

      <div className="panel wide-panel">
        <div className="panel-header stack-mobile">
          <div><p className="eyebrow">Company archive</p><h3>Uploaded company documents and files</h3></div>
          <div className="search-box"><Search size={16} /><input placeholder="Search company files" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        </div>
        <div className="doc-list">
          {records.length === 0 ? <div className="empty-state">No company documents uploaded yet.</div> : records.map((record) => (
            <article className="doc-card" key={record.id}>
              <div className="doc-card-head">
                <div>
                  <p className="eyebrow">{record.category}</p>
                  <h4>{record.title}</h4>
                  <span className="subtext">{record.date || 'No date'} • Added by {record.createdBy || 'Admin'}</span>
                </div>
                <button className="danger-link" onClick={() => deleteCompanyDocument(record.id)}><Trash2 size={14} /></button>
              </div>
              {record.notes && <p className="doc-note">{record.notes}</p>}
              <DocumentFileList files={record.files || []} />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

`

  app = app.replace(
    `function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {`,
    documentComponents + `function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {`
  )
  appChanged = true
}

if (appChanged) {
  write(appPath, app)
  changed('App.jsx updated with country updates and company document archive')
}

let styles = read(stylesPath)
if (!styles.includes('.doc-card')) {
  styles += `
.doc-list { display: grid; gap: 14px; }
.doc-card { border: 1px solid var(--line); border-radius: 18px; background: #fff; padding: 16px; box-shadow: 0 10px 28px rgba(15,23,42,.05); }
.doc-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 10px; }
.doc-card h4 { margin: 4px 0 4px; font-size: 18px; letter-spacing: -.02em; }
.doc-note { color: #334155; line-height: 1.65; margin: 12px 0; white-space: pre-wrap; }
.doc-file-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.doc-file { display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--line); background: #f8fafc; color: #1e293b; padding: 9px 11px; border-radius: 12px; font-weight: 800; font-size: 12px; }
.doc-file small { color: var(--muted); font-weight: 700; }
.doc-empty { color: var(--muted); background: #f8fafc; border: 1px dashed var(--line); padding: 12px; border-radius: 12px; font-size: 13px; }
.file-control { padding: 10px; background: #fff; border: 1px solid var(--line); border-radius: 12px; }
.file-selection { padding: 11px 12px; border-radius: 12px; background: var(--blue-soft); color: #1e3a8a; font-size: 12px; font-weight: 800; }
`
  write(stylesPath, styles)
  changed('styles.css updated with document archive styles')
}

console.log('[patch-country-documents] ready')
