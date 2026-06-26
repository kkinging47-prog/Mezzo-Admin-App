import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const mainPath = new URL('../src/main.jsx', import.meta.url)

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }

let main = read(mainPath)
if (main.includes("import './logoEnhancer.js'")) {
  main = main.replace("import './logoEnhancer.js'", "// Logo enhancer disabled; logo upload now lives inside React settings.")
  write(mainPath, main)
  console.log('[patch-settings-freeze-v2] logoEnhancer import disabled')
}

let app = read(appPath)
let changed = false

if (!app.includes('function readLogoFile')) {
  app = app.replace(`function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatMoney`, `function today() {
  return new Date().toISOString().slice(0, 10)
}

function readLogoFile(file, callback) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => callback(String(reader.result || ''))
  reader.readAsDataURL(file)
}

function formatMoney`)
  changed = true
}

if (!app.includes('handleLogoUpload')) {
  app = app.replace(`  function save(event) {
    event.preventDefault()
    updateData((previous) => ({ ...previous, settings: { ...previous.settings, ...form, openingBankBalance: toNumber(form.openingBankBalance), nextReceiptNumber: toNumber(form.nextReceiptNumber) || 1 } }))
  }

  function exportData() {`, `  function handleLogoUpload(event) {
    const file = event.target.files?.[0]
    readLogoFile(file, (logoDataUrl) => setForm((previous) => ({ ...previous, logoDataUrl })))
  }

  function save(event) {
    event.preventDefault()
    updateData((previous) => ({ ...previous, settings: { ...previous.settings, ...form, openingBankBalance: toNumber(form.openingBankBalance), nextReceiptNumber: toNumber(form.nextReceiptNumber) || 1 } }))
  }

  function exportData() {`)
  changed = true
}

if (!app.includes('Official company logo')) {
  app = app.replace(`<Input label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />`, `<Input label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <label className="field full-span"><span>Official company logo</span><input type="file" accept="image/*" onChange={handleLogoUpload} /></label>
          {form.logoDataUrl && <div className="settings-logo-preview"><img src={form.logoDataUrl} alt="Company logo" /><span>Logo selected. Click Save settings to apply it.</span></div>}`)
  changed = true
}

if (changed) {
  write(appPath, app)
  console.log('[patch-settings-freeze-v2] App.jsx settings logo upload added')
}

console.log('[patch-settings-freeze-v2] ready')
