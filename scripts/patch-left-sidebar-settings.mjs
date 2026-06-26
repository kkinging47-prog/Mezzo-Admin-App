import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const logoPath = new URL('../src/logoEnhancer.js', import.meta.url)

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }
function changed(name) { console.log(`[patch-left-sidebar-settings] ${name}`) }

let app = read(appPath)
let appChanged = false

if (!app.includes('sidebarCollapsed')) {
  app = app.replace(
    `  const [sidebarOpen, setSidebarOpen] = useState(false)`,
    `  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)`
  )
  app = app.replace(
    `<div className="app-shell">`,
    `<div className={\`app-shell \${sidebarCollapsed ? 'sidebar-collapsed' : ''}\`}>`
  )
  app = app.replace(
    `<button className="icon-button close-mobile" onClick={() => setSidebarOpen(false)}><X size={18} /></button>`,
    `<button className="icon-button close-mobile" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
          <button className="icon-button sidebar-collapse-btn" type="button" title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setSidebarCollapsed((value) => !value)}><Menu size={18} /></button>`
  )
  appChanged = true
}

if (appChanged) {
  write(appPath, app)
  changed('App.jsx updated with collapsible left sidebar')
}

let styles = read(stylesPath)
let stylesChanged = false

if (!styles.includes('/* Restore left collapsible sidebar layout */')) {
  styles += `

/* Restore left collapsible sidebar layout */
.app-shell {
  min-height: 100vh !important;
  display: grid !important;
  grid-template-columns: 292px minmax(0, 1fr) !important;
}

.app-shell.sidebar-collapsed {
  grid-template-columns: 88px minmax(0, 1fr) !important;
}

.sidebar {
  position: sticky !important;
  top: 0 !important;
  z-index: 50 !important;
  width: auto !important;
  height: 100vh !important;
  min-height: 100vh !important;
  max-height: 100vh !important;
  padding: 18px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  gap: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  white-space: normal !important;
  border-bottom: 0 !important;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.35) transparent;
}

.sidebar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.sidebar::-webkit-scrollbar-track { background: transparent; }
.sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 999px; }

.brand-block {
  margin-bottom: 22px !important;
  min-width: 0 !important;
  flex: 0 0 auto;
}

.brand-block p {
  display: block !important;
}

.nav-list {
  display: grid !important;
  grid-template-columns: 1fr !important;
  gap: 8px !important;
  overflow: visible !important;
  padding: 0 !important;
}

.nav-item {
  width: 100% !important;
  flex: none !important;
  justify-content: flex-start !important;
  border-radius: 14px !important;
  padding: 13px 14px !important;
  font-size: 14px !important;
}

.sidebar-footer {
  margin-top: auto !important;
  margin-left: 0 !important;
  display: grid !important;
  align-items: stretch !important;
  gap: 14px !important;
  flex: 0 0 auto;
  padding-top: 18px;
}

.user-mini {
  max-width: none !important;
  padding: 12px !important;
}

.user-mini span {
  display: block !important;
}

.logout-btn {
  width: 100% !important;
  padding: 12px !important;
  border-radius: 14px !important;
}

.sidebar-collapse-btn {
  display: grid !important;
  margin-left: auto;
  background: rgba(255,255,255,.1) !important;
  color: #fff !important;
  border: 1px solid rgba(255,255,255,.14) !important;
  flex: 0 0 auto;
}

.app-shell.sidebar-collapsed .sidebar {
  padding: 18px 12px !important;
}

.app-shell.sidebar-collapsed .brand-block {
  justify-content: center;
  gap: 0 !important;
}

.app-shell.sidebar-collapsed .brand-block > div:not(.brand-mark),
.app-shell.sidebar-collapsed .nav-item span,
.app-shell.sidebar-collapsed .user-mini > div {
  display: none !important;
}

.app-shell.sidebar-collapsed .sidebar-collapse-btn {
  margin-left: 0;
}

.app-shell.sidebar-collapsed .nav-item,
.app-shell.sidebar-collapsed .logout-btn,
.app-shell.sidebar-collapsed .user-mini {
  justify-content: center !important;
  padding-left: 12px !important;
  padding-right: 12px !important;
}

.app-shell.sidebar-collapsed .logout-btn {
  font-size: 0 !important;
}

.app-shell.sidebar-collapsed .logout-btn svg {
  width: 18px;
  height: 18px;
}

.main-content {
  min-width: 0;
  padding: 24px !important;
}

.page-stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(340px, 1fr));
  gap: 20px;
  align-items: start;
}

.page-stack > .stats-grid,
.page-stack > .alert,
.page-stack > .sync-alert {
  grid-column: 1 / -1;
}

.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
}

.page-grid.two-columns {
  grid-template-columns: minmax(340px, 430px) minmax(520px, 1fr) !important;
}

.form-panel {
  position: sticky;
  top: 18px;
}

@media (max-width: 1100px) {
  .page-stack,
  .page-grid.two-columns {
    grid-template-columns: 1fr !important;
  }
  .form-panel {
    position: static;
  }
}

@media (max-width: 820px) {
  .app-shell,
  .app-shell.sidebar-collapsed {
    display: block !important;
    grid-template-columns: none !important;
  }
  .sidebar {
    position: fixed !important;
    left: -300px !important;
    top: 0 !important;
    width: 280px !important;
    height: 100vh !important;
    min-height: 100vh !important;
    max-height: 100vh !important;
    padding: 18px !important;
    transition: left .2s ease !important;
  }
  .sidebar.open {
    left: 0 !important;
  }
  .menu-button,
  .close-mobile {
    display: grid !important;
  }
  .sidebar-collapse-btn {
    display: none !important;
  }
  .main-content {
    padding: 16px !important;
  }
}
`
  stylesChanged = true
}

if (stylesChanged) {
  write(stylesPath, styles)
  changed('styles.css restored left sidebar, added collapse mode, and arranged page panels horizontally')
}

if (fs.existsSync(logoPath)) {
  let logo = read(logoPath)
  let logoChanged = false

  const oldBoot = /function bootLogoEnhancer\(\) \{[\s\S]*?\n\}\n\nif \(document\.readyState === 'loading'\) \{/
  const newBoot = `function bootLogoEnhancer() {
  if (window.__mezzoLogoEnhancerBooted) return
  window.__mezzoLogoEnhancerBooted = true

  injectLogoStyles()
  patchPrintWindows()

  const run = () => {
    try {
      applyLogoEverywhere()
      injectSettingsUploader()
    } catch (error) {
      console.warn('Logo enhancer skipped a cycle', error)
    }
  }

  let timer = null
  const schedule = () => {
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(run, 80)
  }

  run()
  document.addEventListener('click', schedule, true)
  window.addEventListener('mezzo:settings-saved', schedule)
  window.addEventListener('resize', schedule)
}

if (document.readyState === 'loading') {`

  if (oldBoot.test(logo)) {
    logo = logo.replace(oldBoot, newBoot)
    logoChanged = true
  }

  if (logo.includes(`const panels = [...document.querySelectorAll('.panel')]
  const settingsPanel = panels.find((panel) => panel.textContent.includes('App settings') && panel.querySelector('form.form-grid'))`)) {
    logo = logo.replace(
      `const panels = [...document.querySelectorAll('.panel')]
  const settingsPanel = panels.find((panel) => panel.textContent.includes('App settings') && panel.querySelector('form.form-grid'))`,
      `const activeTitle = document.querySelector('.topbar h2')?.textContent?.trim()
  if (activeTitle && activeTitle !== 'Settings') return
  const panels = [...document.querySelectorAll('.panel')]
  const settingsPanel = panels.find((panel) => panel.querySelector('.panel-header h3')?.textContent?.trim() === 'App settings' && panel.querySelector('form.form-grid'))`
    )
    logoChanged = true
  }

  const oldCloudLogoCall = `
  loadLogoFromSupabase()
`
  if (logo.includes(oldCloudLogoCall)) {
    logo = logo.replace(oldCloudLogoCall, `
  // Cloud logo is loaded through cached app settings to avoid freezing Settings.
`)
    logoChanged = true
  }

  if (logo.includes('async function // Cloud logo')) {
    logo = logo.replace(/async function \/\/ Cloud logo[^\n]*\n\s*\{/g, 'async function loadLogoFromSupabase() {')
    logoChanged = true
  }

  if (logoChanged) {
    write(logoPath, logo)
    changed('logoEnhancer.js changed to event-based checks; mutation observer removed to stop Settings freeze')
  }
}

console.log('[patch-left-sidebar-settings] ready')
