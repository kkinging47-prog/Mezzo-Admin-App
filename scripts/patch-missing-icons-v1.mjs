import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
let app = fs.readFileSync(appPath, 'utf8')
let changed = false

if (app.includes('<CheckCircle2') && !app.includes('CheckCircle2,')) {
  app = app.replace('  Building2,\n', '  Building2,\n  CheckCircle2,\n')
  changed = true
}

if (changed) {
  fs.writeFileSync(appPath, app)
  console.log('[patch-missing-icons-v1] added CheckCircle2 icon import')
}

console.log('[patch-missing-icons-v1] ready')
