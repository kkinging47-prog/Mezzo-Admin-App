import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  CreditCard,
  Download,
  FileText,
  Landmark,
  Lock,
  LogOut,
  Menu,
  Plus,
  Receipt,
  School,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  WalletCards,
  X
} from 'lucide-react'
import { hasSupabaseConfig, supabase } from './supabaseClient'

const STORAGE_KEY = 'mezzo_maths_admin_app_v1'
const SESSION_KEY = 'mezzo_maths_admin_session_v1'

const defaultData = {
  settings: {
    companyName: 'Mezzo Maths Ltd',
    appName: 'Mezzo Maths Ltd Administrative App',
    address: 'Accra, Ghana',
    phone: '',
    email: '',
    currency: 'GHS',
    receiptPrefix: 'MMA',
    nextReceiptNumber: 1,
    openingBankBalance: 0
  },
  users: [
    {
      id: 'user-super-admin',
      name: 'Super Administrator',
      email: 'admin@mezzomaths.org',
      password: 'Mezzo@2026',
      role: 'Super Admin',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-finance-admin',
      name: 'Finance Administrator',
      email: 'finance@mezzomaths.org',
      password: 'Finance@2026',
      role: 'Finance Admin',
      active: true,
      createdAt: new Date().toISOString()
    }
  ],
  schools: [
    {
      id: 'school-demo-1',
      name: 'Demo International School',
      location: 'Accra',
      contactPerson: 'Headteacher',
      phone: '',
      email: '',
      term: 'Term 1',
      academicYear: '2026/2027',
      students: 120,
      feeType: 'per_student',
      feePerStudent: 100,
      flatRate: 0,
      booksBought: 120,
      bookUnitPrice: 50,
      notes: 'Sample record. Delete or edit after deployment.',
      createdAt: new Date().toISOString()
    }
  ],
  payments: [
    {
      id: 'payment-demo-1',
      schoolId: 'school-demo-1',
      amount: 4500,
      datePaid: new Date().toISOString().slice(0, 10),
      mode: 'MoMo',
      reference: 'DEMO-MOMO-001',
      paidBy: 'Demo School Accountant',
      receivedBy: 'Finance Administrator',
      notes: 'Sample payment. Delete after deployment.',
      receiptNumber: 1,
      createdAt: new Date().toISOString()
    }
  ],
  expenses: [
    {
      id: 'expense-demo-1',
      date: new Date().toISOString().slice(0, 10),
      item: 'Demo printing expense',
      category: 'Printing',
      quantity: 1,
      unitPrice: 750,
      paidFrom: 'Bank',
      recordedBy: 'Finance Administrator',
      notes: 'Sample expense. Delete after deployment.',
      createdAt: new Date().toISOString()
    }
  ],
  staff: [
    {
      id: 'staff-demo-1',
      name: 'Demo Staff Member',
      role: 'Maths Tutor',
      department: 'Teaching',
      staffId: 'MM-001',
      bankName: '',
      bankAccount: '',
      basicSalary: 2500,
      allowances: 300,
      ssnit: 137.5,
      tax: 150,
      otherDeductions: 0,
      month: new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
      paidDate: new Date().toISOString().slice(0, 10),
      paymentMode: 'Bank Transfer',
      notes: 'Sample payslip record. Delete or edit after deployment.',
      createdAt: new Date().toISOString()
    }
  ]
}

defaultData.settings.nextReceiptNumber = 2

const APP_DATA_ID = 'main'

function normalizeData(rawData) {
  const parsed = rawData || {}
  return {
    ...defaultData,
    ...parsed,
    settings: { ...defaultData.settings, ...(parsed.settings || {}) },
    users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : defaultData.users,
    schools: Array.isArray(parsed.schools) ? parsed.schools : [],
    payments: Array.isArray(parsed.payments) ? parsed.payments : [],
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    staff: Array.isArray(parsed.staff) ? parsed.staff : []
  }
}

function scrubForCloud(appData) {
  const clean = normalizeData(appData)
  return {
    ...clean,
    users: clean.users.map(({ password, ...user }) => user)
  }
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatMoney(value, currency = 'GHS') {
  return `${currency} ${toNumber(value).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

function readStore() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return normalizeData(defaultData)
    return normalizeData(JSON.parse(stored))
  } catch (error) {
    console.error('Could not load app data', error)
    return normalizeData(defaultData)
  }
}

function schoolExpectedAmount(school) {
  const feeAmount = school.feeType === 'flat'
    ? toNumber(school.flatRate)
    : toNumber(school.students) * toNumber(school.feePerStudent)
  const bookAmount = school.term === 'Term 1'
    ? toNumber(school.booksBought) * toNumber(school.bookUnitPrice)
    : 0
  return feeAmount + bookAmount
}

function schoolPaidAmount(schoolId, payments) {
  return payments
    .filter((payment) => payment.schoolId === schoolId)
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0)
}

function expenseTotal(expense) {
  return toNumber(expense.quantity || 1) * toNumber(expense.unitPrice)
}

function payrollGross(staff) {
  return toNumber(staff.basicSalary) + toNumber(staff.allowances)
}

function payrollDeductions(staff) {
  return toNumber(staff.ssnit) + toNumber(staff.tax) + toNumber(staff.otherDeductions)
}

function payrollNet(staff) {
  return payrollGross(staff) - payrollDeductions(staff)
}

function printHtml(title, html) {
  const win = window.open('', '_blank', 'width=900,height=1000')
  if (!win) return
  win.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:Inter,Arial,sans-serif;color:#111827;margin:0;padding:28px;background:#f8fafc}
    .paper{max-width:780px;margin:0 auto;background:#fff;padding:34px;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 20px 50px rgba(15,23,42,.08)}
    .top{display:flex;justify-content:space-between;gap:22px;border-bottom:2px solid #0f172a;padding-bottom:18px;margin-bottom:22px}
    h1,h2,h3{margin:0;color:#0f172a} .muted{color:#64748b;font-size:13px;line-height:1.5} .badge{display:inline-block;padding:8px 12px;border-radius:999px;background:#ecfdf5;color:#047857;font-weight:700;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-top:18px} th,td{text-align:left;border-bottom:1px solid #e5e7eb;padding:12px} th{background:#f8fafc;color:#334155;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
    .summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}.box{padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc}.amount{font-size:24px;font-weight:800;color:#0f172a}.footer{margin-top:44px;display:flex;gap:30px;justify-content:space-between}.line{border-top:1px solid #111827;padding-top:8px;width:220px;text-align:center;color:#475569;font-size:12px}.right{text-align:right}.total{font-weight:800}.brand{font-size:28px;font-weight:900;letter-spacing:-.03em}.actions{max-width:780px;margin:18px auto;text-align:center}.print{padding:12px 18px;border:0;background:#0f172a;color:#fff;border-radius:10px;font-weight:700;cursor:pointer}
    @media print{body{background:#fff;padding:0}.paper{box-shadow:none;border:0;border-radius:0}.actions{display:none}}
  </style></head><body>${html}<div class="actions"><button class="print" onclick="window.print()">Print / Save as PDF</button></div></body></html>`)
  win.document.close()
  win.focus()
}

const roleAccess = {
  'Super Admin': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll', 'Admin Users', 'Settings'],
  'Finance Admin': ['Dashboard', 'Schools', 'Payments', 'Expenses', 'Payroll'],
  'Viewer': ['Dashboard', 'Schools']
}

function App() {
  const [data, setData] = useState(readStore)
  const [session, setSession] = useState(() => {
    if (hasSupabaseConfig) return null
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
  })
  const [authUser, setAuthUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(!hasSupabaseConfig)
  const [loadingData, setLoadingData] = useState(hasSupabaseConfig)
  const [syncError, setSyncError] = useState('')
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const loadCloudData = useCallback(async () => {
    if (!hasSupabaseConfig) return readStore()
    setLoadingData(true)
    setSyncError('')
    try {
      const { data: row, error } = await supabase
        .from('app_data')
        .select('data')
        .eq('id', APP_DATA_ID)
        .maybeSingle()

      if (error) throw error

      if (row?.data) {
        const cloudData = normalizeData(row.data)
        setData(cloudData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData))
        return cloudData
      }

      const starterData = scrubForCloud(defaultData)
      const { error: insertError } = await supabase
        .from('app_data')
        .upsert({ id: APP_DATA_ID, data: starterData, updated_at: new Date().toISOString() })

      if (insertError) throw insertError
      setData(starterData)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starterData))
      return starterData
    } catch (error) {
      console.error('Could not load Supabase data', error)
      setSyncError(error.message || 'Could not connect to Supabase. Check your environment variables and SQL table.')
      const localData = readStore()
      setData(localData)
      return localData
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    if (!hasSupabaseConfig) {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      else localStorage.removeItem(SESSION_KEY)
      return
    }

    let mounted = true
    supabase.auth.getSession().then(({ data: authData }) => {
      if (!mounted) return
      setSession(authData.session)
      setAuthUser(authData.session?.user || null)
      setAuthChecked(true)
      if (authData.session) loadCloudData()
      else setLoadingData(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthUser(nextSession?.user || null)
      setAuthChecked(true)
      if (nextSession) {
        loadCloudData()
      } else {
        setData(readStore())
        setLoadingData(false)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadCloudData])

  const currentUser = useMemo(() => {
    if (!session) return null
    if (hasSupabaseConfig) {
      const email = authUser?.email?.toLowerCase()
      return data.users.find((user) => user.email?.toLowerCase() === email && user.active) || null
    }
    return data.users.find((user) => user.id === session.userId && user.active) || null
  }, [session, authUser, data.users])

  const financials = useMemo(() => {
    const totalExpected = data.schools.reduce((sum, school) => sum + schoolExpectedAmount(school), 0)
    const totalStudents = data.schools.reduce((sum, school) => sum + toNumber(school.students), 0)
    const totalPaid = data.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0)
    const totalExpenses = data.expenses.reduce((sum, expense) => sum + expenseTotal(expense), 0)
    const totalPayroll = data.staff.reduce((sum, staff) => sum + payrollNet(staff), 0)
    const totalBooks = data.schools.reduce((sum, school) => sum + (school.term === 'Term 1' ? toNumber(school.booksBought) : 0), 0)
    const remaining = Math.max(totalExpected - totalPaid, 0)
    const estimatedBank = toNumber(data.settings.openingBankBalance) + totalPaid - totalExpenses - totalPayroll
    const owingSchools = data.schools
      .map((school) => {
        const expected = schoolExpectedAmount(school)
        const paid = schoolPaidAmount(school.id, data.payments)
        return { ...school, expected, paid, balance: expected - paid }
      })
      .filter((school) => school.balance > 0.009)
      .sort((a, b) => b.balance - a.balance)

    return { totalExpected, totalStudents, totalPaid, totalExpenses, totalPayroll, totalBooks, remaining, estimatedBank, owingSchools }
  }, [data])

  function updateData(updater) {
    setData((previous) => {
      const nextRaw = typeof updater === 'function' ? updater(previous) : updater
      const next = hasSupabaseConfig ? scrubForCloud(nextRaw) : normalizeData(nextRaw)

      if (hasSupabaseConfig && session) {
        supabase
          .from('app_data')
          .upsert({ id: APP_DATA_ID, data: next, updated_at: new Date().toISOString() })
          .then(({ error }) => {
            if (error) {
              console.error('Could not save Supabase data', error)
              setSyncError(error.message || 'Changes were saved locally but could not sync to Supabase.')
            } else {
              setSyncError('')
            }
          })
      }

      return next
    })
  }

  async function handleLogin(email, password) {
    setSyncError('')

    if (hasSupabaseConfig) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      })
      if (error) {
        setSyncError(error.message)
        return false
      }
      setActivePage('Dashboard')
      return true
    }

    const user = data.users.find((item) => item.email.toLowerCase() === email.toLowerCase().trim() && item.password === password && item.active)
    if (!user) return false
    setSession({ userId: user.id, loggedInAt: new Date().toISOString() })
    setActivePage('Dashboard')
    return true
  }

  async function logout() {
    if (hasSupabaseConfig) await supabase.auth.signOut()
    setSession(null)
    setAuthUser(null)
    setActivePage('Dashboard')
  }

  if (hasSupabaseConfig && (!authChecked || loadingData)) {
    return <LoadingScreen settings={data.settings} />
  }

  if (hasSupabaseConfig && session && !currentUser) {
    return <AccessDenied email={authUser?.email} onLogout={logout} settings={data.settings} />
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} settings={data.settings} useSupabase={hasSupabaseConfig} syncError={syncError} />
  }

  const allowedPages = roleAccess[currentUser.role] || roleAccess.Viewer
  const pages = [
    { name: 'Dashboard', icon: BarChart3 },
    { name: 'Schools', icon: School },
    { name: 'Payments', icon: Receipt },
    { name: 'Expenses', icon: WalletCards },
    { name: 'Payroll', icon: Users },
    { name: 'Admin Users', icon: ShieldCheck },
    { name: 'Settings', icon: Settings }
  ].filter((page) => allowedPages.includes(page.name))

  const visiblePage = allowedPages.includes(activePage) ? activePage : 'Dashboard'

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark">M</div>
          <div>
            <h1>Mezzo Maths</h1>
            <p>Administrative App</p>
          </div>
          <button className="icon-button close-mobile" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        <nav className="nav-list">
          {pages.map((page) => {
            const Icon = page.icon
            return (
              <button
                key={page.name}
                className={`nav-item ${visiblePage === page.name ? 'active' : ''}`}
                onClick={() => { setActivePage(page.name); setSidebarOpen(false) }}
              >
                <Icon size={18} />
                <span>{page.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini">
            <UserRound size={18} />
            <div>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}><LogOut size={17} /> Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)}><Menu /></button>
          <div>
            <p className="eyebrow">{data.settings.appName}</p>
            <h2>{visiblePage}</h2>
          </div>
          <div className="topbar-meta">
            <span>{today()}</span>
            <strong>{currentUser.role}</strong>
          </div>
        </header>

        {syncError && <div className="alert error sync-alert">{syncError}</div>}

        {visiblePage === 'Dashboard' && <Dashboard data={data} financials={financials} />}
        {visiblePage === 'Schools' && <SchoolsPage data={data} updateData={updateData} />}
        {visiblePage === 'Payments' && <PaymentsPage data={data} updateData={updateData} currentUser={currentUser} />}
        {visiblePage === 'Expenses' && <ExpensesPage data={data} updateData={updateData} financials={financials} currentUser={currentUser} />}
        {visiblePage === 'Payroll' && <PayrollPage data={data} updateData={updateData} financials={financials} />}
        {visiblePage === 'Admin Users' && <AdminUsersPage data={data} updateData={updateData} currentUser={currentUser} useSupabase={hasSupabaseConfig} />}
        {visiblePage === 'Settings' && <SettingsPage data={data} updateData={updateData} useSupabase={hasSupabaseConfig} syncError={syncError} />}
      </main>
    </div>
  )
}

function LoginScreen({ onLogin, settings, useSupabase = false, syncError = '' }) {
  const [email, setEmail] = useState('admin@mezzomaths.org')
  const [password, setPassword] = useState('Mezzo@2026')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const ok = await onLogin(email, password)
    if (!ok) {
      setError(useSupabase
        ? 'Invalid Supabase email or password. Check the user in Supabase Authentication.'
        : 'Invalid email or password. Check the default login details or ask the Super Admin to reset your access.'
      )
    }
    setSubmitting(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark large">M</div>
          <div>
            <p className="eyebrow">Secure Access</p>
            <h1>{settings.appName}</h1>
            <p>Manage schools, student numbers, payments, receipts, expenditure, bank position and staff payslips.</p>
          </div>
        </div>

        <form onSubmit={submit} className="login-form">
          <label>Email address</label>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          <label>Password</label>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          {(error || syncError) && <div className="alert error">{error || syncError}</div>}
          <button className="primary-btn" type="submit" disabled={submitting}><Lock size={17} /> {submitting ? 'Signing in...' : 'Login to dashboard'}</button>
        </form>

        <div className="demo-credentials">
          <strong>{useSupabase ? 'Supabase access' : 'Default access created for you'}</strong>
          <span>Super Admin: admin@mezzomaths.org / Mezzo@2026</span>
          <span>Finance Admin: finance@mezzomaths.org / Finance@2026</span>
          <small>{useSupabase ? 'Create these users in Supabase Authentication before logging in.' : 'Change these passwords immediately after deployment.'}</small>
        </div>
      </div>
    </div>
  )
}

function LoadingScreen({ settings }) {
  return (
    <div className="login-page">
      <div className="login-card compact">
        <div className="login-brand">
          <div className="brand-mark large">M</div>
          <div>
            <p className="eyebrow">Connecting to Supabase</p>
            <h1>{settings.appName}</h1>
            <p>Loading secure admin data...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccessDenied({ email, onLogout, settings }) {
  return (
    <div className="login-page">
      <div className="login-card compact">
        <div className="login-brand">
          <div className="brand-mark large">M</div>
          <div>
            <p className="eyebrow">Access not assigned</p>
            <h1>{settings.appName}</h1>
            <p>The Supabase login worked, but {email || 'this email'} has not been added to the app's Admin Users list or the account is disabled.</p>
          </div>
        </div>
        <div className="alert warning">Ask a Super Admin to add this email in the Admin Users page, or add it inside the app_data seed in Supabase.</div>
        <button className="primary-btn" onClick={onLogout}><LogOut size={17} /> Logout</button>
      </div>
    </div>
  )
}

function Dashboard({ data, financials }) {
  const currency = data.settings.currency
  return (
    <section className="page-stack">
      <div className="stats-grid">
        <StatCard title="Schools onboard" value={data.schools.length} icon={<Building2 />} />
        <StatCard title="Students captured" value={financials.totalStudents.toLocaleString()} icon={<Users />} />
        <StatCard title="Total expected" value={formatMoney(financials.totalExpected, currency)} icon={<Calculator />} />
        <StatCard title="Total paid" value={formatMoney(financials.totalPaid, currency)} icon={<CreditCard />} />
        <StatCard title="Payments left to collect" value={formatMoney(financials.remaining, currency)} icon={<Landmark />} tone="warning" />
        <StatCard title="Estimated bank position" value={formatMoney(financials.estimatedBank, currency)} icon={<WalletCards />} tone={financials.estimatedBank >= 0 ? 'success' : 'danger'} />
        <StatCard title="Books bought - Term 1" value={financials.totalBooks.toLocaleString()} icon={<BookOpen />} />
        <StatCard title="Total expenses + payroll" value={formatMoney(financials.totalExpenses + financials.totalPayroll, currency)} icon={<FileText />} tone="danger" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Receivables</p>
            <h3>Schools owing and amount owed</h3>
          </div>
          <span className="pill">{financials.owingSchools.length} schools owing</span>
        </div>
        <ResponsiveTable
          columns={['School', 'Students', 'Expected', 'Paid', 'Owing']}
          rows={financials.owingSchools.map((school) => [
            <strong>{school.name}</strong>,
            toNumber(school.students).toLocaleString(),
            formatMoney(school.expected, currency),
            formatMoney(school.paid, currency),
            <span className="amount-danger">{formatMoney(school.balance, currency)}</span>
          ])}
          empty="No owing school yet."
        />
      </div>
    </section>
  )
}

function StatCard({ title, value, icon, tone = '' }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function SchoolsPage({ data, updateData }) {
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const emptySchool = {
    name: '', location: '', contactPerson: '', phone: '', email: '', term: 'Term 1', academicYear: '2026/2027',
    students: '', feeType: 'per_student', feePerStudent: '', flatRate: '', booksBought: '', bookUnitPrice: '', notes: ''
  }
  const [form, setForm] = useState(emptySchool)

  const filteredSchools = data.schools.filter((school) => `${school.name} ${school.location} ${school.contactPerson}`.toLowerCase().includes(query.toLowerCase()))

  function startEdit(school) {
    setEditingId(school.id)
    setForm({ ...emptySchool, ...school })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptySchool)
  }

  function saveSchool(event) {
    event.preventDefault()
    const payload = {
      ...form,
      students: toNumber(form.students),
      feePerStudent: toNumber(form.feePerStudent),
      flatRate: toNumber(form.flatRate),
      booksBought: form.term === 'Term 1' ? toNumber(form.booksBought) : 0,
      bookUnitPrice: form.term === 'Term 1' ? toNumber(form.bookUnitPrice) : 0
    }

    updateData((previous) => {
      if (editingId) {
        return { ...previous, schools: previous.schools.map((school) => school.id === editingId ? { ...school, ...payload } : school) }
      }
      return { ...previous, schools: [{ id: uid('school'), createdAt: new Date().toISOString(), ...payload }, ...previous.schools] }
    })
    resetForm()
  }

  function deleteSchool(schoolId) {
    const confirmed = window.confirm('Delete this school and all payment records attached to it?')
    if (!confirmed) return
    updateData((previous) => ({
      ...previous,
      schools: previous.schools.filter((school) => school.id !== schoolId),
      payments: previous.payments.filter((payment) => payment.schoolId !== schoolId)
    }))
  }

  return (
    <section className="page-grid two-columns">
      <div className="panel form-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Client setup</p>
            <h3>{editingId ? 'Edit school/client' : 'Add new school/client'}</h3>
          </div>
        </div>
        <form className="form-grid" onSubmit={saveSchool}>
          <Input label="School name" value={form.name} required onChange={(value) => setForm({ ...form, name: value })} />
          <Input label="Location" value={form.location} onChange={(value) => setForm({ ...form, location: value })} />
          <Input label="Contact person" value={form.contactPerson} onChange={(value) => setForm({ ...form, contactPerson: value })} />
          <Input label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <Select label="Term" value={form.term} onChange={(value) => setForm({ ...form, term: value })} options={['Term 1', 'Term 2', 'Term 3']} />
          <Input label="Academic year" value={form.academicYear} onChange={(value) => setForm({ ...form, academicYear: value })} />
          <Input label="Number of students" type="number" value={form.students} required onChange={(value) => setForm({ ...form, students: value })} />
          <Select label="Fee type" value={form.feeType} onChange={(value) => setForm({ ...form, feeType: value })} options={[['per_student', 'Per student'], ['flat', 'Flat rate']]} />
          {form.feeType === 'per_student' ? (
            <Input label="Amount per student" type="number" value={form.feePerStudent} onChange={(value) => setForm({ ...form, feePerStudent: value })} />
          ) : (
            <Input label="Flat amount" type="number" value={form.flatRate} onChange={(value) => setForm({ ...form, flatRate: value })} />
          )}
          {form.term === 'Term 1' && (
            <>
              <Input label="Books bought - Term 1 only" type="number" value={form.booksBought} onChange={(value) => setForm({ ...form, booksBought: value })} />
              <Input label="Book unit price" type="number" value={form.bookUnitPrice} onChange={(value) => setForm({ ...form, bookUnitPrice: value })} />
            </>
          )}
          <Textarea label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          <div className="form-actions">
            <button className="primary-btn" type="submit"><Plus size={17} /> {editingId ? 'Update school' : 'Save school'}</button>
            {editingId && <button className="secondary-btn" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="panel wide-panel">
        <div className="panel-header stack-mobile">
          <div>
            <p className="eyebrow">School records</p>
            <h3>Clients onboard</h3>
          </div>
          <div className="search-box"><Search size={16} /><input placeholder="Search schools" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        </div>
        <ResponsiveTable
          columns={['School', 'Students', 'Expected', 'Paid', 'Owing', 'Action']}
          rows={filteredSchools.map((school) => {
            const expected = schoolExpectedAmount(school)
            const paid = schoolPaidAmount(school.id, data.payments)
            const balance = expected - paid
            return [
              <div><strong>{school.name}</strong><span className="subtext">{school.location || 'No location'} • {school.term}</span></div>,
              toNumber(school.students).toLocaleString(),
              formatMoney(expected, data.settings.currency),
              formatMoney(paid, data.settings.currency),
              <span className={balance > 0 ? 'amount-danger' : 'amount-success'}>{formatMoney(balance, data.settings.currency)}</span>,
              <div className="row-actions"><button onClick={() => startEdit(school)}>Edit</button><button className="danger-link" onClick={() => deleteSchool(school.id)}><Trash2 size={14} /></button></div>
            ]
          })}
          empty="No schools recorded yet."
        />
      </div>
    </section>
  )
}

function PaymentsPage({ data, updateData, currentUser }) {
  const [schoolId, setSchoolId] = useState(data.schools[0]?.id || '')
  const [form, setForm] = useState({ amount: '', datePaid: today(), mode: 'MoMo', reference: '', paidBy: '', notes: '' })
  const [query, setQuery] = useState('')

  const selectedSchool = data.schools.find((school) => school.id === schoolId)
  const currency = data.settings.currency
  const paymentsWithSchool = data.payments
    .map((payment) => ({ ...payment, school: data.schools.find((school) => school.id === payment.schoolId) }))
    .filter((payment) => `${payment.school?.name || ''} ${payment.paidBy} ${payment.reference}`.toLowerCase().includes(query.toLowerCase()))

  function savePayment(event) {
    event.preventDefault()
    if (!schoolId) return
    const receiptNumber = data.settings.nextReceiptNumber || 1
    const newPayment = {
      id: uid('payment'),
      schoolId,
      amount: toNumber(form.amount),
      datePaid: form.datePaid || today(),
      mode: form.mode,
      reference: form.reference,
      paidBy: form.paidBy,
      receivedBy: currentUser.name,
      notes: form.notes,
      receiptNumber,
      createdAt: new Date().toISOString()
    }
    updateData((previous) => ({
      ...previous,
      settings: { ...previous.settings, nextReceiptNumber: receiptNumber + 1 },
      payments: [newPayment, ...previous.payments]
    }))
    setForm({ amount: '', datePaid: today(), mode: 'MoMo', reference: '', paidBy: '', notes: '' })
    setTimeout(() => printReceipt(newPayment, selectedSchool, data.settings), 80)
  }

  function deletePayment(paymentId) {
    if (!window.confirm('Delete this payment record?')) return
    updateData((previous) => ({ ...previous, payments: previous.payments.filter((payment) => payment.id !== paymentId) }))
  }

  return (
    <section className="page-grid two-columns">
      <div className="panel form-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Record payment</p>
            <h3>Enter school payment</h3>
          </div>
        </div>
        <form className="form-grid" onSubmit={savePayment}>
          <Select label="School" value={schoolId} onChange={setSchoolId} options={data.schools.map((school) => [school.id, school.name])} />
          {selectedSchool && <SchoolMiniSummary school={selectedSchool} payments={data.payments} settings={data.settings} />}
          <Input label="Amount paid" type="number" required value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} />
          <Input label="Date paid" type="date" required value={form.datePaid} onChange={(value) => setForm({ ...form, datePaid: value })} />
          <Select label="Mode of payment" value={form.mode} onChange={(value) => setForm({ ...form, mode: value, reference: '' })} options={['MoMo', 'Cheque', 'Cash', 'Bank Transfer']} />
          {form.mode === 'Cheque' && <Input label="Cheque number" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />}
          {form.mode === 'MoMo' && <Input label="MoMo transaction ID" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />}
          {form.mode === 'Bank Transfer' && <Input label="Bank reference" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />}
          {form.mode === 'Cash' && <Input label="Cash receipt/reference" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />}
          <Input label="Paid by" value={form.paidBy} onChange={(value) => setForm({ ...form, paidBy: value })} />
          <Textarea label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          <div className="form-actions">
            <button className="primary-btn" type="submit"><Receipt size={17} /> Save & generate receipt</button>
          </div>
        </form>
      </div>

      <div className="panel wide-panel">
        <div className="panel-header stack-mobile">
          <div>
            <p className="eyebrow">Receipts</p>
            <h3>Payment history</h3>
          </div>
          <div className="search-box"><Search size={16} /><input placeholder="Search payments" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        </div>
        <ResponsiveTable
          columns={['Receipt', 'School', 'Amount', 'Date', 'Mode', 'Action']}
          rows={paymentsWithSchool.map((payment) => [
            <strong>{receiptNo(payment, data.settings)}</strong>,
            payment.school?.name || 'Deleted school',
            formatMoney(payment.amount, currency),
            payment.datePaid,
            <div>{payment.mode}<span className="subtext">{payment.reference}</span></div>,
            <div className="row-actions"><button onClick={() => printReceipt(payment, payment.school, data.settings)}><Download size={14} /> Receipt</button><button className="danger-link" onClick={() => deletePayment(payment.id)}><Trash2 size={14} /></button></div>
          ])}
          empty="No payment records yet."
        />
      </div>
    </section>
  )
}

function SchoolMiniSummary({ school, payments, settings }) {
  const expected = schoolExpectedAmount(school)
  const paid = schoolPaidAmount(school.id, payments)
  const balance = expected - paid
  return (
    <div className="mini-summary">
      <span>Expected: <strong>{formatMoney(expected, settings.currency)}</strong></span>
      <span>Paid: <strong>{formatMoney(paid, settings.currency)}</strong></span>
      <span>Balance: <strong className={balance > 0 ? 'amount-danger' : 'amount-success'}>{formatMoney(balance, settings.currency)}</strong></span>
    </div>
  )
}

function receiptNo(payment, settings) {
  const year = new Date(payment.datePaid || payment.createdAt || Date.now()).getFullYear()
  return `${settings.receiptPrefix || 'MMA'}-${year}-${String(payment.receiptNumber || 1).padStart(4, '0')}`
}

function printReceipt(payment, school, settings) {
  const html = `<div class="paper">
    <div class="top">
      <div><div class="brand">${settings.companyName}</div><div class="muted">${settings.address || ''}<br>${settings.phone || ''} ${settings.email || ''}</div></div>
      <div class="right"><span class="badge">OFFICIAL RECEIPT</span><h2>${receiptNo(payment, settings)}</h2><div class="muted">Date: ${payment.datePaid}</div></div>
    </div>
    <div class="summary">
      <div class="box"><div class="muted">Received from</div><h3>${payment.paidBy || school?.name || 'Client'}</h3></div>
      <div class="box"><div class="muted">School / Client</div><h3>${school?.name || 'Deleted school record'}</h3></div>
      <div class="box"><div class="muted">Payment mode</div><h3>${payment.mode}</h3><div class="muted">${payment.reference || 'No reference provided'}</div></div>
      <div class="box"><div class="muted">Amount received</div><div class="amount">${formatMoney(payment.amount, settings.currency)}</div></div>
    </div>
    <table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody><tr><td>Payment toward Mezzo Maths school account</td><td>${formatMoney(payment.amount, settings.currency)}</td></tr></tbody></table>
    <p class="muted">Notes: ${payment.notes || 'N/A'}</p>
    <div class="footer"><div class="line">Received by: ${payment.receivedBy || ''}</div><div class="line">Authorised signature</div></div>
  </div>`
  printHtml(`Receipt ${receiptNo(payment, settings)}`, html)
}

function ExpensesPage({ data, updateData, financials, currentUser }) {
  const [form, setForm] = useState({ date: today(), item: '', category: '', quantity: 1, unitPrice: '', paidFrom: 'Bank', notes: '' })
  const [query, setQuery] = useState('')
  const currency = data.settings.currency
  const filtered = data.expenses.filter((expense) => `${expense.item} ${expense.category} ${expense.paidFrom}`.toLowerCase().includes(query.toLowerCase()))

  function saveExpense(event) {
    event.preventDefault()
    const payload = { ...form, quantity: toNumber(form.quantity || 1), unitPrice: toNumber(form.unitPrice), recordedBy: currentUser.name }
    updateData((previous) => ({ ...previous, expenses: [{ id: uid('expense'), createdAt: new Date().toISOString(), ...payload }, ...previous.expenses] }))
    setForm({ date: today(), item: '', category: '', quantity: 1, unitPrice: '', paidFrom: 'Bank', notes: '' })
  }

  function deleteExpense(id) {
    if (!window.confirm('Delete this expenditure record?')) return
    updateData((previous) => ({ ...previous, expenses: previous.expenses.filter((expense) => expense.id !== id) }))
  }

  return (
    <section className="page-grid two-columns">
      <div className="panel form-panel">
        <div className="panel-header">
          <div><p className="eyebrow">Expenditure</p><h3>Record expense</h3></div>
        </div>
        <form className="form-grid" onSubmit={saveExpense}>
          <Input label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
          <Input label="Item" required value={form.item} onChange={(value) => setForm({ ...form, item: value })} />
          <Input label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} placeholder="Transport, Printing, Feeding..." />
          <Input label="Quantity / amount" type="number" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
          <Input label="Price / unit cost" type="number" required value={form.unitPrice} onChange={(value) => setForm({ ...form, unitPrice: value })} />
          <Select label="Paid from" value={form.paidFrom} onChange={(value) => setForm({ ...form, paidFrom: value })} options={['Bank', 'Cash', 'MoMo']} />
          <Textarea label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          <button className="primary-btn" type="submit"><Plus size={17} /> Save expense</button>
        </form>
      </div>

      <div className="panel wide-panel">
        <div className="mini-finance-row">
          <StatCard title="Total expenditure" value={formatMoney(financials.totalExpenses, currency)} icon={<WalletCards />} tone="danger" />
          <StatCard title="Estimated bank after expenses & payroll" value={formatMoney(financials.estimatedBank, currency)} icon={<Landmark />} tone={financials.estimatedBank >= 0 ? 'success' : 'danger'} />
        </div>
        <div className="panel-header stack-mobile">
          <div><p className="eyebrow">Expense log</p><h3>All expenses</h3></div>
          <div className="search-box"><Search size={16} /><input placeholder="Search expenses" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        </div>
        <ResponsiveTable
          columns={['Date', 'Item', 'Qty', 'Price', 'Total', 'Action']}
          rows={filtered.map((expense) => [
            expense.date,
            <div><strong>{expense.item}</strong><span className="subtext">{expense.category || 'Uncategorised'} • {expense.paidFrom}</span></div>,
            toNumber(expense.quantity || 1).toLocaleString(),
            formatMoney(expense.unitPrice, currency),
            formatMoney(expenseTotal(expense), currency),
            <button className="danger-link" onClick={() => deleteExpense(expense.id)}><Trash2 size={14} /></button>
          ])}
          empty="No expenses recorded yet."
        />
      </div>
    </section>
  )
}

function PayrollPage({ data, updateData, financials }) {
  const [editingId, setEditingId] = useState(null)
  const empty = { name: '', role: '', department: '', staffId: '', bankName: '', bankAccount: '', basicSalary: '', allowances: '', ssnit: '', tax: '', otherDeductions: '', month: new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' }), paidDate: today(), paymentMode: 'Bank Transfer', notes: '' }
  const [form, setForm] = useState(empty)
  const currency = data.settings.currency

  function saveStaff(event) {
    event.preventDefault()
    const payload = {
      ...form,
      basicSalary: toNumber(form.basicSalary),
      allowances: toNumber(form.allowances),
      ssnit: toNumber(form.ssnit),
      tax: toNumber(form.tax),
      otherDeductions: toNumber(form.otherDeductions)
    }
    updateData((previous) => {
      if (editingId) return { ...previous, staff: previous.staff.map((staff) => staff.id === editingId ? { ...staff, ...payload } : staff) }
      return { ...previous, staff: [{ id: uid('staff'), createdAt: new Date().toISOString(), ...payload }, ...previous.staff] }
    })
    setEditingId(null)
    setForm(empty)
  }

  function edit(staff) {
    setEditingId(staff.id)
    setForm({ ...empty, ...staff })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function deleteStaff(id) {
    if (!window.confirm('Delete this payroll record?')) return
    updateData((previous) => ({ ...previous, staff: previous.staff.filter((staff) => staff.id !== id) }))
  }

  return (
    <section className="page-grid two-columns">
      <div className="panel form-panel">
        <div className="panel-header"><div><p className="eyebrow">Payroll</p><h3>{editingId ? 'Edit staff salary record' : 'Add staff salary record'}</h3></div></div>
        <form className="form-grid" onSubmit={saveStaff}>
          <Input label="Staff name" required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Input label="Staff ID" value={form.staffId} onChange={(value) => setForm({ ...form, staffId: value })} />
          <Input label="Position / role" value={form.role} onChange={(value) => setForm({ ...form, role: value })} />
          <Input label="Department" value={form.department} onChange={(value) => setForm({ ...form, department: value })} />
          <Input label="Month" value={form.month} onChange={(value) => setForm({ ...form, month: value })} />
          <Input label="Paid date" type="date" value={form.paidDate} onChange={(value) => setForm({ ...form, paidDate: value })} />
          <Input label="Basic salary" type="number" value={form.basicSalary} onChange={(value) => setForm({ ...form, basicSalary: value })} />
          <Input label="Allowances" type="number" value={form.allowances} onChange={(value) => setForm({ ...form, allowances: value })} />
          <Input label="SSNIT deduction" type="number" value={form.ssnit} onChange={(value) => setForm({ ...form, ssnit: value })} />
          <Input label="PAYE / tax" type="number" value={form.tax} onChange={(value) => setForm({ ...form, tax: value })} />
          <Input label="Other deductions" type="number" value={form.otherDeductions} onChange={(value) => setForm({ ...form, otherDeductions: value })} />
          <Input label="Bank name" value={form.bankName} onChange={(value) => setForm({ ...form, bankName: value })} />
          <Input label="Bank account" value={form.bankAccount} onChange={(value) => setForm({ ...form, bankAccount: value })} />
          <Select label="Payment mode" value={form.paymentMode} onChange={(value) => setForm({ ...form, paymentMode: value })} options={['Bank Transfer', 'MoMo', 'Cash', 'Cheque']} />
          <Textarea label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          <div className="salary-preview">
            <span>Gross: <strong>{formatMoney(payrollGross(form), currency)}</strong></span>
            <span>Deductions: <strong>{formatMoney(payrollDeductions(form), currency)}</strong></span>
            <span>Net pay: <strong>{formatMoney(payrollNet(form), currency)}</strong></span>
          </div>
          <div className="form-actions"><button className="primary-btn" type="submit"><Plus size={17} /> Save payroll</button>{editingId && <button className="secondary-btn" type="button" onClick={() => { setEditingId(null); setForm(empty) }}>Cancel</button>}</div>
        </form>
      </div>

      <div className="panel wide-panel">
        <div className="mini-finance-row"><StatCard title="Net payroll total" value={formatMoney(financials.totalPayroll, currency)} icon={<Users />} tone="warning" /></div>
        <div className="panel-header"><div><p className="eyebrow">Payslips</p><h3>Staff salary records</h3></div></div>
        <ResponsiveTable
          columns={['Staff', 'Gross', 'Deductions', 'Net Pay', 'Month', 'Action']}
          rows={data.staff.map((staff) => [
            <div><strong>{staff.name}</strong><span className="subtext">{staff.role || 'No role'} • {staff.department || 'No department'}</span></div>,
            formatMoney(payrollGross(staff), currency),
            formatMoney(payrollDeductions(staff), currency),
            <strong>{formatMoney(payrollNet(staff), currency)}</strong>,
            staff.month,
            <div className="row-actions"><button onClick={() => printPayslip(staff, data.settings)}><Download size={14} /> Payslip</button><button onClick={() => edit(staff)}>Edit</button><button className="danger-link" onClick={() => deleteStaff(staff.id)}><Trash2 size={14} /></button></div>
          ])}
          empty="No payroll records yet."
        />
      </div>
    </section>
  )
}

function printPayslip(staff, settings) {
  const html = `<div class="paper">
    <div class="top">
      <div><div class="brand">${settings.companyName}</div><div class="muted">${settings.address || ''}<br>${settings.phone || ''} ${settings.email || ''}</div></div>
      <div class="right"><span class="badge">PAYSLIP</span><h2>${staff.month}</h2><div class="muted">Payment date: ${staff.paidDate || 'N/A'}</div></div>
    </div>
    <div class="summary">
      <div class="box"><div class="muted">Employee</div><h3>${staff.name}</h3><div class="muted">Staff ID: ${staff.staffId || 'N/A'}</div></div>
      <div class="box"><div class="muted">Position</div><h3>${staff.role || 'N/A'}</h3><div class="muted">Department: ${staff.department || 'N/A'}</div></div>
      <div class="box"><div class="muted">Bank</div><h3>${staff.bankName || 'N/A'}</h3><div class="muted">Account: ${staff.bankAccount || 'N/A'}</div></div>
      <div class="box"><div class="muted">Net pay</div><div class="amount">${formatMoney(payrollNet(staff), settings.currency)}</div></div>
    </div>
    <table><thead><tr><th>Earnings</th><th>Amount</th></tr></thead><tbody><tr><td>Basic Salary</td><td>${formatMoney(staff.basicSalary, settings.currency)}</td></tr><tr><td>Allowances</td><td>${formatMoney(staff.allowances, settings.currency)}</td></tr><tr class="total"><td>Gross Salary</td><td>${formatMoney(payrollGross(staff), settings.currency)}</td></tr></tbody></table>
    <table><thead><tr><th>Deductions</th><th>Amount</th></tr></thead><tbody><tr><td>SSNIT</td><td>${formatMoney(staff.ssnit, settings.currency)}</td></tr><tr><td>PAYE / Tax</td><td>${formatMoney(staff.tax, settings.currency)}</td></tr><tr><td>Other Deductions</td><td>${formatMoney(staff.otherDeductions, settings.currency)}</td></tr><tr class="total"><td>Total Deductions</td><td>${formatMoney(payrollDeductions(staff), settings.currency)}</td></tr></tbody></table>
    <p class="muted">Notes: ${staff.notes || 'N/A'}</p>
    <div class="footer"><div class="line">Employee signature</div><div class="line">Authorised by management</div></div>
  </div>`
  printHtml(`Payslip - ${staff.name}`, html)
}

function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Finance Admin', active: true })

  function saveUser(event) {
    event.preventDefault()
    const payload = {
      id: uid('user'),
      createdAt: new Date().toISOString(),
      name: form.name,
      email: form.email.toLowerCase().trim(),
      role: form.role,
      active: true
    }
    if (!useSupabase) payload.password = form.password
    updateData((previous) => ({ ...previous, users: [payload, ...previous.users] }))
    setForm({ name: '', email: '', password: '', role: 'Finance Admin', active: true })
  }

  function toggleUser(userId) {
    if (userId === currentUser.id) return alert('You cannot disable your own account while logged in.')
    updateData((previous) => ({ ...previous, users: previous.users.map((user) => user.id === userId ? { ...user, active: !user.active } : user) }))
  }

  function deleteUser(userId) {
    if (userId === currentUser.id) return alert('You cannot delete your own account while logged in.')
    if (!window.confirm('Delete this admin user?')) return
    updateData((previous) => ({ ...previous, users: previous.users.filter((user) => user.id !== userId) }))
  }

  return (
    <section className="page-grid two-columns">
      <div className="panel form-panel">
        <div className="panel-header"><div><p className="eyebrow">Access control</p><h3>Create admin user</h3></div></div>
        <form className="form-grid" onSubmit={saveUser}>
          <Input label="Full name" required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Input label="Email" type="email" required value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          {!useSupabase && <Input label="Password" required value={form.password} onChange={(value) => setForm({ ...form, password: value })} placeholder="Create a strong password" />}
          <Select label="Role" value={form.role} onChange={(value) => setForm({ ...form, role: value })} options={['Super Admin', 'Finance Admin', 'Viewer']} />
          <button className="primary-btn" type="submit"><ShieldCheck size={17} /> Create user</button>
        </form>
        <div className="alert warning">{useSupabase ? 'This page assigns app roles only. Create the matching email and password in Supabase Authentication → Users first, then add the same email here.' : 'Local demo mode keeps passwords in browser storage. Connect Supabase for real multi-user login.'}</div>
      </div>

      <div className="panel wide-panel">
        <div className="panel-header"><div><p className="eyebrow">Users</p><h3>Admin access list</h3></div></div>
        <ResponsiveTable
          columns={['Name', 'Email', 'Role', 'Status', 'Action']}
          rows={data.users.map((user) => [
            <strong>{user.name}</strong>,
            user.email,
            user.role,
            <span className={`pill ${user.active ? 'success' : 'danger'}`}>{user.active ? 'Active' : 'Disabled'}</span>,
            <div className="row-actions"><button onClick={() => toggleUser(user.id)}>{user.active ? 'Disable' : 'Enable'}</button><button className="danger-link" onClick={() => deleteUser(user.id)}><Trash2 size={14} /></button></div>
          ])}
          empty="No users yet."
        />
      </div>
    </section>
  )
}

function SettingsPage({ data, updateData, useSupabase = false, syncError = '' }) {
  const [form, setForm] = useState(data.settings)

  useEffect(() => setForm(data.settings), [data.settings])

  function save(event) {
    event.preventDefault()
    updateData((previous) => ({ ...previous, settings: { ...previous.settings, ...form, openingBankBalance: toNumber(form.openingBankBalance), nextReceiptNumber: toNumber(form.nextReceiptNumber) || 1 } }))
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mezzo-admin-backup-${today()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function resetDemoData() {
    if (!window.confirm(useSupabase ? 'This will reset the shared Supabase app data to the default sample data. Continue?' : 'This will reset all local app data to the default sample data. Continue?')) return
    if (useSupabase) {
      updateData(scrubForCloud(defaultData))
      return
    }
    localStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }

  return (
    <section className="page-grid two-columns">
      <div className="panel form-panel">
        <div className="panel-header"><div><p className="eyebrow">Company setup</p><h3>App settings</h3></div></div>
        <form className="form-grid" onSubmit={save}>
          <Input label="Company name" value={form.companyName} onChange={(value) => setForm({ ...form, companyName: value })} />
          <Input label="App name" value={form.appName} onChange={(value) => setForm({ ...form, appName: value })} />
          <Input label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
          <Input label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <Input label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <Input label="Currency" value={form.currency} onChange={(value) => setForm({ ...form, currency: value })} />
          <Input label="Opening bank balance" type="number" value={form.openingBankBalance} onChange={(value) => setForm({ ...form, openingBankBalance: value })} />
          <Input label="Receipt prefix" value={form.receiptPrefix} onChange={(value) => setForm({ ...form, receiptPrefix: value })} />
          <Input label="Next receipt number" type="number" value={form.nextReceiptNumber} onChange={(value) => setForm({ ...form, nextReceiptNumber: value })} />
          <button className="primary-btn" type="submit"><Settings size={17} /> Save settings</button>
        </form>
      </div>
      <div className="panel wide-panel">
        <div className="panel-header"><div><p className="eyebrow">Data management</p><h3>Backup and notes</h3></div></div>
        <div className="settings-actions">
          <button className="secondary-btn" onClick={exportData}><Download size={17} /> Export JSON backup</button>
          <button className="danger-btn" onClick={resetDemoData}><Trash2 size={17} /> {useSupabase ? 'Reset cloud data' : 'Reset local data'}</button>
        </div>
        <div className="alert info">
          {useSupabase ? 'Supabase is connected. Records are saved to your shared Supabase project and backed up locally in this browser.' : 'This version is currently in local demo mode. Add Supabase environment variables to save all records in the cloud for multiple admins.'}
        </div>
        {syncError && <div className="alert error">{syncError}</div>}
        <div className="feature-list">
          <h4>Included modules</h4>
          <span>Admin login and role access</span>
          <span>Schools/clients onboard</span>
          <span>Student count and billing</span>
          <span>Term 1 books bought</span>
          <span>Payments and receipt printing</span>
          <span>Owing schools dashboard</span>
          <span>Expenditure tracking</span>
          <span>Estimated bank position</span>
          <span>Staff salary, SSNIT, tax and payslips</span>
        </div>
      </div>
    </section>
  )
}

function Input({ label, value, onChange, type = 'text', required = false, placeholder = '' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value ?? ''} placeholder={placeholder} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="field full-span">
      <span>{label}</span>
      <textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} rows="3" />
    </label>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        {options.length === 0 && <option value="">No option available</option>}
        {options.map((option) => {
          const val = Array.isArray(option) ? option[0] : option
          const text = Array.isArray(option) ? option[1] : option
          return <option key={val} value={val}>{text}</option>
        })}
      </select>
    </label>
  )
}

function ResponsiveTable({ columns, rows, empty }) {
  if (!rows || rows.length === 0) return <div className="empty-state">{empty}</div>
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} data-label={columns[cellIndex]}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

export default App
