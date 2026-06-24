import { hasSupabaseConfig, supabase } from './supabaseClient'

const STORAGE_KEY = 'mezzo_maths_admin_app_v1'
const LOGO_KEY = 'mezzo_maths_admin_logo_v1'
const APP_DATA_ID = 'main'

function readAppData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeAppData(nextData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData))
}

function getLogo() {
  return localStorage.getItem(LOGO_KEY) || readAppData()?.settings?.logoDataUrl || ''
}

function setLogoLocally(logoDataUrl) {
  if (logoDataUrl) localStorage.setItem(LOGO_KEY, logoDataUrl)
  else localStorage.removeItem(LOGO_KEY)

  const appData = readAppData()
  const nextData = {
    ...appData,
    settings: {
      ...(appData.settings || {}),
      logoDataUrl: logoDataUrl || ''
    }
  }
  writeAppData(nextData)
}

async function syncLogoToSupabase(logoDataUrl) {
  if (!hasSupabaseConfig) return
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData?.session) return

    const { data: row, error } = await supabase
      .from('app_data')
      .select('data')
      .eq('id', APP_DATA_ID)
      .maybeSingle()

    if (error) throw error

    const currentData = row?.data || readAppData()
    const nextData = {
      ...currentData,
      settings: {
        ...(currentData.settings || {}),
        logoDataUrl: logoDataUrl || ''
      }
    }

    const { error: saveError } = await supabase
      .from('app_data')
      .upsert({ id: APP_DATA_ID, data: nextData, updated_at: new Date().toISOString() }, { onConflict: 'id' })

    if (saveError) throw saveError
  } catch (error) {
    console.error('Could not sync logo to Supabase', error)
  }
}

async function loadLogoFromSupabase() {
  if (!hasSupabaseConfig) return
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData?.session) return

    const { data: row } = await supabase
      .from('app_data')
      .select('data')
      .eq('id', APP_DATA_ID)
      .maybeSingle()

    const cloudLogo = row?.data?.settings?.logoDataUrl
    if (cloudLogo) {
      setLogoLocally(cloudLogo)
      applyLogoEverywhere()
    }
  } catch (error) {
    console.error('Could not load logo from Supabase', error)
  }
}

function injectLogoStyles() {
  if (document.getElementById('mezzo-logo-enhancer-style')) return
  const style = document.createElement('style')
  style.id = 'mezzo-logo-enhancer-style'
  style.textContent = `
    .brand-mark.uploaded-logo-mark {
      background-color: #ffffff !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
      background-size: contain !important;
      color: transparent !important;
      overflow: hidden !important;
    }
    .logo-upload-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      margin: 0 0 16px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: #f8fafc;
    }
    .logo-upload-card h4 { margin: 0 0 5px; }
    .logo-upload-card p { margin: 0 0 12px; color: var(--muted); font-size: 13px; line-height: 1.55; }
    .logo-preview {
      width: 78px;
      height: 78px;
      border-radius: 20px;
      background: linear-gradient(135deg, #facc15, #22c55e);
      color: #0f172a;
      display: grid;
      place-items: center;
      font-size: 34px;
      font-weight: 900;
      flex: 0 0 auto;
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
    }
    .logo-preview.has-logo { background-color: #ffffff; color: transparent; box-shadow: 0 12px 30px rgba(15,23,42,.12); }
    .logo-actions { display: flex; flex-wrap: wrap; gap: 10px; }
    .logo-upload-btn input { display: none; }
    @media (max-width: 820px) { .logo-upload-card { align-items: flex-start; flex-direction: column; } }
  `
  document.head.appendChild(style)
}

function applyLogoEverywhere() {
  const logo = getLogo()
  document.querySelectorAll('.brand-mark').forEach((mark) => {
    if (logo) {
      mark.classList.add('uploaded-logo-mark')
      mark.textContent = ''
      mark.style.backgroundImage = `url("${logo}")`
    } else {
      mark.classList.remove('uploaded-logo-mark')
      mark.style.backgroundImage = ''
      if (!mark.textContent.trim()) mark.textContent = 'M'
    }
  })

  const preview = document.querySelector('.logo-preview')
  if (preview) {
    if (logo) {
      preview.classList.add('has-logo')
      preview.textContent = ''
      preview.style.backgroundImage = `url("${logo}")`
    } else {
      preview.classList.remove('has-logo')
      preview.textContent = 'M'
      preview.style.backgroundImage = ''
    }
  }
}

async function saveLogo(logoDataUrl) {
  setLogoLocally(logoDataUrl)
  applyLogoEverywhere()
  await syncLogoToSupabase(logoDataUrl)
}

function injectSettingsUploader() {
  const panels = [...document.querySelectorAll('.panel')]
  const settingsPanel = panels.find((panel) => panel.textContent.includes('App settings') && panel.querySelector('form.form-grid'))
  if (!settingsPanel || settingsPanel.querySelector('.logo-upload-card')) return

  const form = settingsPanel.querySelector('form.form-grid')
  const card = document.createElement('div')
  card.className = 'logo-upload-card'
  card.innerHTML = `
    <div class="logo-preview">M</div>
    <div>
      <h4>Official logo</h4>
      <p>Upload the Mezzo Maths logo once. It will be used on the login page, sidebar, receipts and staff payslips.</p>
      <div class="logo-actions">
        <label class="primary-btn logo-upload-btn">Upload logo<input type="file" accept="image/*"></label>
        <button type="button" class="secondary-btn logo-remove-btn">Remove logo</button>
      </div>
    </div>
  `
  form.parentNode.insertBefore(card, form)

  const input = card.querySelector('input[type="file"]')
  input.addEventListener('change', (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => saveLogo(String(reader.result || ''))
    reader.readAsDataURL(file)
    event.target.value = ''
  })

  card.querySelector('.logo-remove-btn').addEventListener('click', () => {
    if (confirm('Remove the uploaded logo?')) saveLogo('')
  })

  form.addEventListener('submit', () => {
    const logo = getLogo()
    if (logo) setTimeout(() => syncLogoToSupabase(logo), 1200)
  }, true)

  applyLogoEverywhere()
}

function patchPrintWindows() {
  if (window.__mezzoLogoWindowPatch) return
  window.__mezzoLogoWindowPatch = true
  const originalOpen = window.open.bind(window)

  window.open = (...args) => {
    const openedWindow = originalOpen(...args)
    const logo = getLogo()
    if (!openedWindow || !logo || openedWindow.__mezzoLogoPatched) return openedWindow
    openedWindow.__mezzoLogoPatched = true

    const originalWrite = openedWindow.document.write.bind(openedWindow.document)
    openedWindow.document.write = (html) => {
      if (typeof html === 'string' && html.includes('<style>')) {
        const safeLogo = logo.replace(/"/g, '&quot;')
        let nextHtml = html.replace('<style>', '<style>.print-logo{width:82px;height:82px;object-fit:contain;border-radius:14px;background:white;margin-bottom:8px;}')
        if (!nextHtml.includes('class="print-logo"')) {
          nextHtml = nextHtml.replace('<div class="right">', `<div class="right"><img class="print-logo" src="${safeLogo}" alt="Mezzo Maths logo"><br>`)
        }
        originalWrite(nextHtml)
        return
      }
      originalWrite(html)
    }
    return openedWindow
  }
}

function bootLogoEnhancer() {
  injectLogoStyles()
  patchPrintWindows()
  applyLogoEverywhere()
  injectSettingsUploader()
  loadLogoFromSupabase()

  const observer = new MutationObserver(() => {
    applyLogoEverywhere()
    injectSettingsUploader()
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootLogoEnhancer)
} else {
  bootLogoEnhancer()
}
