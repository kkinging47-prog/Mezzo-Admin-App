import { hasSupabaseConfig, supabase } from './supabaseClient'

const STORAGE_KEY = 'mezzo_maths_admin_app_v1'
const CLIENT_ID_KEY = 'mezzo_maths_admin_client_id_v1'
const NOTIFICATION_OPT_IN_KEY = 'mezzo_maths_admin_notifications_v1'
const LAST_NOTIFIED_KEY = 'mezzo_maths_admin_last_notified_update_v1'
const APP_DATA_ID = 'main'

let realtimeChannel = null
let realtimeStarting = false

function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id = `client-${Date.now()}-${Math.random().toString(16).slice(2)}`
    localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}

function readAppData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function hasNotificationSupport() {
  return typeof window !== 'undefined' && 'Notification' in window
}

function notificationPermission() {
  if (!hasNotificationSupport()) return 'unsupported'
  return Notification.permission
}

function notificationEnabled() {
  return hasNotificationSupport() && Notification.permission === 'granted' && localStorage.getItem(NOTIFICATION_OPT_IN_KEY) === 'enabled'
}

function appLogo() {
  return localStorage.getItem('mezzo_maths_admin_logo_v1') || readAppData()?.settings?.logoDataUrl || undefined
}

function updateSummary(nextData = {}) {
  const settings = nextData.settings || {}
  const module = settings.lastUpdatedModule || 'App data'
  const by = settings.lastUpdatedBy || 'Another admin'
  const friendly = {
    Dashboard: 'Dashboard data',
    Schools: 'Schools / client records',
    Payments: 'Payment records',
    Expenses: 'Expenditure records',
    Payroll: 'Payroll records',
    'Admin Users': 'Admin users',
    Settings: 'App settings'
  }[module] || module
  return `${friendly} updated by ${by}. Open the app to review the change.`
}

function sendBrowserNotification(nextData) {
  if (!notificationEnabled()) return
  const settings = nextData?.settings || {}
  const updateKey = settings.lastUpdatedAt || ''
  if (updateKey && localStorage.getItem(LAST_NOTIFIED_KEY) === updateKey) return
  if (settings.lastUpdatedClientId && settings.lastUpdatedClientId === getClientId()) return

  const title = 'Mezzo Maths Admin Update'
  const body = updateSummary(nextData)
  try {
    const notification = new Notification(title, {
      body,
      icon: appLogo(),
      tag: 'mezzo-admin-update',
      renotify: true
    })
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    if (updateKey) localStorage.setItem(LAST_NOTIFIED_KEY, updateKey)
  } catch (error) {
    console.warn('Could not show browser notification', error)
  }
}

async function requestNotifications() {
  if (!hasNotificationSupport()) {
    alert('This browser does not support web notifications. Use Chrome/Edge on Android, or install the site to your iPhone home screen if supported.')
    return
  }

  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    localStorage.setItem(NOTIFICATION_OPT_IN_KEY, 'enabled')
    new Notification('Mezzo Maths notifications enabled', {
      body: 'You will receive alerts on this device when another admin updates the app while this browser can receive notifications.',
      icon: appLogo(),
      tag: 'mezzo-admin-test'
    })
    subscribeToSupabaseUpdates()
  } else {
    localStorage.setItem(NOTIFICATION_OPT_IN_KEY, 'disabled')
    alert('Notifications were not allowed. Enable notifications for this site in your browser settings to receive alerts.')
  }
  refreshNotificationButton()
}

function statusText() {
  const permission = notificationPermission()
  if (permission === 'unsupported') return 'Notifications not supported on this browser'
  if (permission === 'granted' && localStorage.getItem(NOTIFICATION_OPT_IN_KEY) === 'enabled') return 'Phone notifications enabled on this device'
  if (permission === 'denied') return 'Notifications blocked in browser settings'
  return 'Phone notifications not enabled on this device'
}

function injectNotificationStyles() {
  if (document.getElementById('mezzo-notification-style')) return
  const style = document.createElement('style')
  style.id = 'mezzo-notification-style'
  style.textContent = `
    .notification-enable-btn.is-enabled { background: var(--green-soft) !important; color: var(--green) !important; border-color: #bbf7d0 !important; }
    .notification-status { margin-top: 10px; }
  `
  document.head.appendChild(style)
}

function refreshNotificationButton() {
  const button = document.querySelector('.notification-enable-btn')
  const status = document.querySelector('.notification-status')
  if (!button || !status) return

  const enabled = notificationEnabled()
  button.classList.toggle('is-enabled', enabled)
  button.textContent = enabled ? 'Phone notifications enabled' : 'Enable phone notifications'
  status.textContent = statusText()
  status.className = `notification-status ${enabled ? 'success' : notificationPermission() === 'denied' ? 'warning' : ''}`
}

function injectNotificationButton() {
  const actions = document.querySelector('.settings-actions')
  if (!actions || actions.querySelector('.notification-enable-btn')) return

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'secondary-btn notification-enable-btn'
  button.textContent = 'Enable phone notifications'
  button.addEventListener('click', requestNotifications)

  const status = document.createElement('div')
  status.className = 'notification-status'
  status.textContent = statusText()

  actions.appendChild(button)
  actions.parentNode.insertBefore(status, actions.nextSibling)
  refreshNotificationButton()
}

async function subscribeToSupabaseUpdates() {
  if (!hasSupabaseConfig || realtimeChannel || realtimeStarting) return
  realtimeStarting = true

  try {
    const { data } = await supabase.auth.getSession()
    if (!data?.session) {
      realtimeStarting = false
      return
    }

    realtimeChannel = supabase
      .channel('mezzo-app-data-notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_data', filter: `id=eq.${APP_DATA_ID}` },
        (payload) => {
          const nextData = payload?.new?.data
          if (!nextData) return
          sendBrowserNotification(nextData)
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('Supabase realtime notifications channel issue. Check realtime is enabled for public.app_data.')
          realtimeChannel = null
        }
      })
  } catch (error) {
    console.warn('Could not start realtime notifications', error)
    realtimeChannel = null
  } finally {
    realtimeStarting = false
  }
}

function bootNotifications() {
  injectNotificationStyles()
  injectNotificationButton()
  subscribeToSupabaseUpdates()

  if (hasSupabaseConfig) {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) subscribeToSupabaseUpdates()
    })
  }

  const observer = new MutationObserver(() => {
    injectNotificationButton()
    refreshNotificationButton()
  })
  observer.observe(document.body, { childList: true, subtree: true })

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) refreshNotificationButton()
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootNotifications)
} else {
  bootNotifications()
}
