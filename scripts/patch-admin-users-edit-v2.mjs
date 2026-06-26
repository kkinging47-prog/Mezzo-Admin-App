import fs from 'node:fs'
const appPath = new URL('../src/App.jsx', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p,s) => fs.writeFileSync(p,s)
let app = read(appPath)
let changed = false

if (app.includes('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {') && !app.includes('editingUserId')) {
  app = app.replace("const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Finance Admin', active: true })", "const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Finance Admin', active: true })\n  const [editingUserId, setEditingUserId] = useState(null)")
  app = app.replace("updateData((previous) => ({ ...previous, users: [payload, ...previous.users] }))\n    setForm({ name: '', email: '', password: '', role: 'Finance Admin', active: true })", "updateData((previous) => editingUserId ? ({ ...previous, users: previous.users.map((user) => user.id === editingUserId ? { ...user, ...payload } : user) }) : ({ ...previous, users: [payload, ...previous.users] }))\n    setEditingUserId(null)\n    setForm({ name: '', email: '', password: '', role: 'Finance Admin', active: true })")
  app = app.replace("function toggleUser(userId) {", "function editUser(user) {\n    setEditingUserId(user.id)\n    setForm({ name: user.name || '', email: user.email || '', password: '', role: user.role || 'Finance Admin', active: user.active !== false })\n  }\n\n  function toggleUser(userId) {")
  app = app.replace("Create admin user</h3>", "{editingUserId ? 'Edit admin user' : 'Create admin user'}</h3>")
  app = app.replace("<ShieldCheck size={17} /> Create user", "<ShieldCheck size={17} /> {editingUserId ? 'Update user' : 'Create user'}")
  app = app.replace("<div className=\"row-actions\"><button onClick={() => toggleUser(user.id)}>", "<div className=\"row-actions\"><button onClick={() => editUser(user)}>Edit</button><button onClick={() => toggleUser(user.id)}>")
  changed = true
}

if (changed) write(appPath, app)
console.log('[patch-admin-users-edit-v2] ready')
