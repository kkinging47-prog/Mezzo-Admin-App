import fs from 'node:fs'
const appPath = new URL('../src/App.jsx', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p,s) => fs.writeFileSync(p,s)
let app = read(appPath)
let changed = false

if (app.includes('function ExpensesPage(') && !app.includes('editingExpenseId')) {
  app = app.replace("const [form, setForm] = useState({ date: today(), item: '', category: '', quantity: 1, unitPrice: '', paidFrom: 'Bank', notes: '' })", "const [form, setForm] = useState({ date: today(), item: '', category: '', quantity: 1, unitPrice: '', paidFrom: 'Bank', notes: '' })\n  const [editingExpenseId, setEditingExpenseId] = useState(null)")
  app = app.replace("updateData((previous) => ({ ...previous, expenses: [{ id: uid('expense'), createdAt: new Date().toISOString(), ...payload }, ...previous.expenses] }))\n    setForm({ date: today(), item: '', category: '', quantity: 1, unitPrice: '', paidFrom: 'Bank', notes: '' })", "updateData((previous) => editingExpenseId ? ({ ...previous, expenses: previous.expenses.map((expense) => expense.id === editingExpenseId ? { ...expense, ...payload } : expense) }) : ({ ...previous, expenses: [{ id: uid('expense'), createdAt: new Date().toISOString(), ...payload }, ...previous.expenses] }))\n    setEditingExpenseId(null)\n    setForm({ date: today(), item: '', category: '', quantity: 1, unitPrice: '', paidFrom: 'Bank', notes: '' })")
  app = app.replace("function deleteExpense(id) {", "function editExpense(expense) {\n    setEditingExpenseId(expense.id)\n    setForm({ date: expense.date || today(), item: expense.item || '', category: expense.category || '', quantity: expense.quantity || 1, unitPrice: expense.unitPrice || '', paidFrom: expense.paidFrom || 'Bank', notes: expense.notes || '' })\n  }\n\n  function deleteExpense(id) {")
  app = app.replace("<h3>Record expense</h3>", "<h3>{editingExpenseId ? 'Edit expense' : 'Record expense'}</h3>")
  app = app.replace("<Plus size={17} /> Save expense", "<Plus size={17} /> {editingExpenseId ? 'Update expense' : 'Save expense'}")
  app = app.replace("<button className=\"danger-link\" onClick={() => deleteExpense(expense.id)}><Trash2 size={14} /></button>", "<div className=\"row-actions\"><button onClick={() => editExpense(expense)}>Edit</button><button className=\"danger-link\" onClick={() => deleteExpense(expense.id)}><Trash2 size={14} /></button></div>")
  changed = true
}

if (changed) write(appPath, app)
console.log('[patch-expense-edit-v1] ready')
