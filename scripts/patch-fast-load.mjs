import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const logoPath = new URL('../src/logoEnhancer.js', import.meta.url)

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }
function changed(name) { console.log(`[patch-fast-load] ${name}`) }

let app = read(appPath)
let appChanged = false

if (!app.includes('CLOUD_LOAD_TIMEOUT_MS')) {
  app = app.replace(
    "const APP_DATA_ID = 'main'\n",
    `const APP_DATA_ID = 'main'\nconst CLOUD_LOAD_TIMEOUT_MS = 4500\n\nfunction withTimeout(promise, ms = CLOUD_LOAD_TIMEOUT_MS, message = 'Supabase is taking longer than expected.') {\n  let timer\n  const timeout = new Promise((_, reject) => {\n    timer = setTimeout(() => reject(new Error(message)), ms)\n  })\n  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))\n}\n`
  )
  appChanged = true
}

if (app.includes('const [loadingData, setLoadingData] = useState(hasSupabaseConfig)')) {
  app = app.replace('const [loadingData, setLoadingData] = useState(hasSupabaseConfig)', 'const [loadingData, setLoadingData] = useState(false)')
  appChanged = true
}

const blockingQuery = `      const { data: row, error } = await supabase\n        .from('app_data')\n        .select('data')\n        .eq('id', APP_DATA_ID)\n        .maybeSingle()`
const timeoutQuery = `      const { data: row, error } = await withTimeout(\n        supabase\n          .from('app_data')\n          .select('data')\n          .eq('id', APP_DATA_ID)\n          .maybeSingle(),\n        CLOUD_LOAD_TIMEOUT_MS,\n        'Supabase is taking longer than expected. Opening with saved local data while it syncs.'\n      )`
if (app.includes(blockingQuery)) {
  app = app.replace(blockingQuery, timeoutQuery)
  appChanged = true
}

const oldCatchMessage = "      setSyncError(error.message || 'Could not connect to Supabase. Check your environment variables and SQL table.')"
const newCatchMessage = `      const message = error?.message || ''\n      setSyncError(message.includes('Supabase is taking longer')\n        ? 'Opening with saved data while Supabase syncs in the background. If a new record does not appear immediately, wait a moment and refresh.'\n        : message || 'Could not connect to Supabase. Check your environment variables and SQL table.'\n      )`
if (app.includes(oldCatchMessage)) {
  app = app.replace(oldCatchMessage, newCatchMessage)
  appChanged = true
}

if (app.includes('if (hasSupabaseConfig && (!authChecked || loadingData)) {')) {
  app = app.replace('if (hasSupabaseConfig && (!authChecked || loadingData)) {', 'if (hasSupabaseConfig && !authChecked) {')
  appChanged = true
}

if (appChanged) {
  write(appPath, app)
  changed('App.jsx opens from local cache and syncs Supabase in the background')
}

if (fs.existsSync(logoPath)) {
  let logo = read(logoPath)
  let logoChanged = false

  if (!logo.includes('function resizeLogoFile')) {
    logo = logo.replace(
      `function getLogo() {\n  return localStorage.getItem(LOGO_KEY) || readAppData()?.settings?.logoDataUrl || ''\n}\n`,
      `function getLogo() {\n  return localStorage.getItem(LOGO_KEY) || readAppData()?.settings?.logoDataUrl || ''\n}\n\nfunction readFileAsDataUrl(file) {\n  return new Promise((resolve) => {\n    const reader = new FileReader()\n    reader.onload = () => resolve(String(reader.result || ''))\n    reader.onerror = () => resolve('')\n    reader.readAsDataURL(file)\n  })\n}\n\nasync function resizeLogoFile(file) {\n  const originalDataUrl = await readFileAsDataUrl(file)\n  if (!originalDataUrl || file.type === 'image/svg+xml') return originalDataUrl\n\n  return new Promise((resolve) => {\n    const image = new Image()\n    image.onload = () => {\n      const maxSize = 360\n      const scale = Math.min(1, maxSize / Math.max(image.width || maxSize, image.height || maxSize))\n      const width = Math.max(1, Math.round((image.width || maxSize) * scale))\n      const height = Math.max(1, Math.round((image.height || maxSize) * scale))\n      const canvas = document.createElement('canvas')\n      canvas.width = width\n      canvas.height = height\n      const ctx = canvas.getContext('2d')\n      if (!ctx) return resolve(originalDataUrl)\n      ctx.clearRect(0, 0, width, height)\n      ctx.drawImage(image, 0, 0, width, height)\n      const compressed = canvas.toDataURL('image/webp', 0.82)\n      resolve(compressed && compressed.length < originalDataUrl.length ? compressed : originalDataUrl)\n    }\n    image.onerror = () => resolve(originalDataUrl)\n    image.src = originalDataUrl\n  })\n}\n`
    )
    logoChanged = true
  }

  const oldUploadRead = `    const reader = new FileReader()\n    reader.onload = () => saveLogo(String(reader.result || ''))\n    reader.readAsDataURL(file)\n    event.target.value = ''`
  const newUploadRead = `    resizeLogoFile(file).then((logoDataUrl) => {\n      if (logoDataUrl) saveLogo(logoDataUrl)\n    })\n    event.target.value = ''`
  if (logo.includes(oldUploadRead)) {
    logo = logo.replace(oldUploadRead, newUploadRead)
    logoChanged = true
  }

  if (logo.includes('  loadLogoFromSupabase()')) {
    logo = logo.replace('  loadLogoFromSupabase()', '  // Logo is loaded from local cached app data. Avoid an extra full Supabase fetch on every page load.')
    logoChanged = true
  }

  if (logoChanged) {
    write(logoPath, logo)
    changed('logo upload is compressed and no longer performs an extra startup Supabase fetch')
  }
}

console.log('[patch-fast-load] ready')
