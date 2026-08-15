import fs from 'node:fs'

const stylesPath = new URL('../src/styles.css', import.meta.url)
let css = fs.readFileSync(stylesPath, 'utf8')

if (!css.includes('/* Compact no-horizontal-scroll layout */')) {
  css += String.raw`

/* Compact no-horizontal-scroll layout */
.main-content { padding: 18px !important; }
.page-stack { gap: 14px !important; }
.panel { padding: 14px !important; border-radius: 18px !important; }
.panel-header { gap: 10px !important; margin-bottom: 12px !important; }
.panel-header h3 { font-size: 18px !important; }
.stats-grid { gap: 10px !important; }
.stat-card { min-height: 88px !important; padding: 12px !important; gap: 10px !important; border-radius: 17px !important; }
.stat-icon { width: 36px !important; height: 36px !important; border-radius: 12px !important; }
.stat-card p { font-size: 11px !important; margin-bottom: 6px !important; }
.stat-card strong { font-size: clamp(15px, 1.5vw, 21px) !important; }
.form-grid { gap: 10px !important; }
.field { gap: 5px !important; }
.field span { font-size: 11px !important; }
.field input, .field select, .field textarea { padding: 9px 10px !important; border-radius: 10px !important; min-height: 38px; }
.primary-btn, .secondary-btn, .danger-btn { padding: 9px 12px !important; border-radius: 11px !important; font-size: 12px !important; }
.table-wrap { overflow-x: visible !important; max-width: 100% !important; }
table { width: 100% !important; table-layout: fixed !important; }
th, td { padding: 7px 5px !important; font-size: 11.5px !important; line-height: 1.25 !important; white-space: normal !important; overflow-wrap: anywhere !important; word-break: break-word !important; vertical-align: top !important; }
th { font-size: 9px !important; letter-spacing: .035em !important; }
td strong { font-size: 12px !important; }
.subtext { font-size: 10.5px !important; margin-top: 2px !important; }
.row-actions { gap: 4px !important; }
.row-actions button, .danger-link { padding: 5px 6px !important; font-size: 10.5px !important; border-radius: 8px !important; }
.pill { padding: 4px 7px !important; font-size: 10px !important; line-height: 1.15 !important; }
.search-box { min-width: 180px !important; padding: 0 9px !important; }
.search-box input { padding: 9px 0 !important; }
.books-printing-page .responsive-table input,
.responsive-table input,
.table-wrap input,
.table-wrap select { width: 100% !important; min-width: 0 !important; padding: 6px 7px !important; font-size: 11px !important; }
@media (min-width: 821px) {
  .app-shell { grid-template-columns: 250px 1fr !important; }
  .sidebar { padding: 16px !important; }
  .nav-item { padding: 10px 11px !important; gap: 9px !important; font-size: 13px !important; }
  .brand-block { margin-bottom: 18px !important; }
}
@media (max-width: 1180px) {
  .stats-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
}
@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .table-wrap { overflow-x: auto !important; }
  table { table-layout: auto !important; }
}
`
  fs.writeFileSync(stylesPath, css)
}

console.log('[patch-compact-layout-v1] ready')
