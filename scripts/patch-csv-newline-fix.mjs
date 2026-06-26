import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const app = fs.readFileSync(appPath, 'utf8')
const fixed = app.replace(/\.join\('\s+'\)/g, '.join(String.fromCharCode(10))')

if (fixed !== app) {
  fs.writeFileSync(appPath, fixed)
  console.log('[patch-csv-newline-fix] repaired broken CSV newline literal')
}

console.log('[patch-csv-newline-fix] ready')
