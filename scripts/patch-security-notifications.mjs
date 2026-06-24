import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }
function changed(name) { console.log(`[patch-security-notifications] ${name}`) }

let app = read(appPath)
let appChanged = false

if (!app.includes("const CLIENT_ID_KEY = 'mezzo_maths_admin_client_id_v1'")) {
  app = app.replace(
    "const SESSION_KEY = 'mezzo_maths_admin_session_v1'\n",
    "const SESSION_KEY = 'mezzo_maths_admin_session_v1'\nconst CLIENT_ID_KEY = 'mezzo_maths_admin_client_id_v1'\nconst LOGO_KEY = 'mezzo_maths_admin_logo_v1'\n\nfunction getClientId() {\n  let id = localStorage.getItem(CLIENT_ID_KEY)\n  if (!id) {\n    id = `client-${Date.now()}-${Math.random().toString(16).slice(2)}`\n    localStorage.setItem(CLIENT_ID_KEY, id)\n  }\n  return id\n}\n\nfunction getStoredLogoDataUrl() {\n  try {\n    return localStorage.getItem(LOGO_KEY) || ''\n  } catch {\n    return ''\n  }\n}\n"
  )
  appChanged = true
}

if (app.includes("const [email, setEmail] = useState('admin@mezzomaths.org')")) {
  app = app.replace("const [email, setEmail] = useState('admin@mezzomaths.org')", "const [email, setEmail] = useState('')")
  appChanged = true
}

if (app.includes("const [password, setPassword] = useState('Mezzo@2026')")) {
  app = app.replace("const [password, setPassword] = useState('Mezzo@2026')", "const [password, setPassword] = useState('')")
  appChanged = true
}

const revealedLoginBlock = /        <div className="demo-credentials">[\s\S]*?        <\/div>\n      <\/div>/
if (revealedLoginBlock.test(app)) {
  app = app.replace(revealedLoginBlock, `        <div className="demo-credentials secure-login-note">
          <strong>Secure staff access only</strong>
          <span>Use the email and password assigned to you by the Super Admin.</span>
          <small>Contact management if you cannot access your account.</small>
        </div>
      </div>`)
  appChanged = true
}

const plainUpdateData = `      const nextRaw = typeof updater === 'function' ? updater(previous) : updater
      const next = hasSupabaseConfig ? scrubForCloud(nextRaw) : normalizeData(nextRaw)`
const trackedUpdateData = `      const baseRaw = typeof updater === 'function' ? updater(previous) : updater
      const now = new Date().toISOString()
      const nextRaw = {
        ...baseRaw,
        settings: {
          ...(baseRaw.settings || {}),
          lastUpdatedAt: now,
          lastUpdatedBy: currentUser?.name || authUser?.email || 'System',
          lastUpdatedModule: activePage,
          lastUpdatedClientId: getClientId()
        }
      }
      const next = hasSupabaseConfig ? scrubForCloud(nextRaw) : normalizeData(nextRaw)`
if (app.includes(plainUpdateData) && !app.includes('lastUpdatedClientId: getClientId()')) {
  app = app.replace(plainUpdateData, trackedUpdateData)
  appChanged = true
}

const oldSettingsSave = `  function save(event) {
    event.preventDefault()
    updateData((previous) => ({ ...previous, settings: { ...previous.settings, ...form, openingBankBalance: toNumber(form.openingBankBalance), nextReceiptNumber: toNumber(form.nextReceiptNumber) || 1 } }))
  }`
const newSettingsSave = `  function save(event) {
    event.preventDefault()
    const logoDataUrl = getStoredLogoDataUrl() || form.logoDataUrl || data.settings.logoDataUrl || ''
    updateData((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        ...form,
        logoDataUrl,
        openingBankBalance: toNumber(form.openingBankBalance),
        nextReceiptNumber: toNumber(form.nextReceiptNumber) || 1
      }
    }))
    window.dispatchEvent(new CustomEvent('mezzo:settings-saved', { detail: { logoDataUrl } }))
  }`
if (app.includes(oldSettingsSave)) {
  app = app.replace(oldSettingsSave, newSettingsSave)
  appChanged = true
}

if (appChanged) {
  write(appPath, app)
  changed('login details hidden, settings logo preserved, updates are tagged for notifications')
}

let styles = read(stylesPath)
let stylesChanged = false
if (!styles.includes('.secure-login-note')) {
  styles += `
.secure-login-note span,
.secure-login-note small {
  background: white;
  color: #334155;
}
.notification-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}
.notification-status.success { color: var(--green); background: var(--green-soft); border-color: #bbf7d0; }
.notification-status.warning { color: var(--amber); background: var(--amber-soft); border-color: #fde68a; }
`
  stylesChanged = true
}

if (stylesChanged) {
  write(stylesPath, styles)
  changed('security and notification styles added')
}

console.log('[patch-security-notifications] ready')
