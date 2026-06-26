import fs from 'node:fs'

const stylesPath = new URL('../src/styles.css', import.meta.url)

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }
function changed(name) { console.log(`[patch-horizontal-layout] ${name}`) }

let styles = read(stylesPath)

if (!styles.includes('/* Horizontal admin layout */')) {
  styles += `

/* Horizontal admin layout */
.app-shell {
  display: block !important;
  grid-template-columns: none !important;
}

.sidebar {
  position: sticky !important;
  top: 0 !important;
  z-index: 60 !important;
  min-height: auto !important;
  max-height: none !important;
  height: auto !important;
  width: 100% !important;
  padding: 12px 18px !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 16px !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  white-space: nowrap !important;
  border-bottom: 1px solid rgba(255,255,255,.12);
}

.brand-block {
  margin-bottom: 0 !important;
  flex: 0 0 auto;
  min-width: max-content;
}

.brand-block h1 {
  font-size: 15px !important;
}

.brand-block p {
  display: none;
}

.nav-list {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 8px !important;
  min-width: 0;
  flex: 1 1 auto;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.35) transparent;
}

.nav-list::-webkit-scrollbar,
.sidebar::-webkit-scrollbar {
  height: 7px;
  width: 7px;
}

.nav-list::-webkit-scrollbar-track,
.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.nav-list::-webkit-scrollbar-thumb,
.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.28);
  border-radius: 999px;
}

.nav-item {
  width: auto !important;
  flex: 0 0 auto;
  padding: 10px 12px !important;
  border-radius: 999px !important;
  font-size: 13px;
}

.sidebar-footer {
  margin-top: 0 !important;
  margin-left: auto !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  flex: 0 0 auto;
}

.user-mini {
  padding: 8px 10px !important;
  max-width: 190px;
}

.user-mini span {
  display: none !important;
}

.logout-btn {
  width: auto !important;
  padding: 10px 12px !important;
  border-radius: 999px !important;
}

.main-content {
  padding: 20px 22px 26px !important;
}

.topbar {
  margin-bottom: 18px !important;
}

.topbar h2 {
  font-size: 26px !important;
}

@media (max-width: 820px) {
  .app-shell { display: block !important; }
  .sidebar {
    position: sticky !important;
    left: auto !important;
    top: 0 !important;
    width: 100% !important;
    min-height: auto !important;
    flex-direction: row !important;
    align-items: center !important;
    padding: 10px 12px !important;
    transition: none !important;
  }
  .sidebar.open { left: auto !important; }
  .menu-button,
  .close-mobile {
    display: none !important;
  }
  .brand-block {
    min-width: 54px;
    gap: 8px !important;
  }
  .brand-block h1,
  .sidebar-footer,
  .topbar-meta {
    display: none !important;
  }
  .nav-list {
    flex: 1 1 auto;
    width: auto;
  }
  .nav-item span {
    display: none;
  }
  .nav-item svg {
    margin: 0;
  }
  .main-content {
    padding: 16px !important;
  }
}
`

  write(stylesPath, styles)
  changed('styles.css updated to horizontal navigation and wider content area')
}

console.log('[patch-horizontal-layout] ready')
