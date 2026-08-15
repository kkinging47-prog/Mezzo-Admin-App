import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const stylesPath = new URL('../src/styles.css', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

if (!app.includes('booksPrinting: parsed.booksPrinting || null')) {
  if (app.includes("staffPortalLastSync: parsed.staffPortalLastSync || ''")) {
    app = app.replace("staffPortalLastSync: parsed.staffPortalLastSync || ''", "staffPortalLastSync: parsed.staffPortalLastSync || '',\n    booksPrinting: parsed.booksPrinting || null")
    changed = true
  } else if (app.includes('stoppedSchools: Array.isArray(parsed.stoppedSchools) ? parsed.stoppedSchools : []')) {
    app = app.replace('stoppedSchools: Array.isArray(parsed.stoppedSchools) ? parsed.stoppedSchools : []', 'stoppedSchools: Array.isArray(parsed.stoppedSchools) ? parsed.stoppedSchools : [],\n    booksPrinting: parsed.booksPrinting || null')
    changed = true
  }
}

if (!app.includes('function BooksPrintingPage(')) {
  const component = String.raw`
function defaultBooksPrintingData() {
  return {
    items: ['KG 1', 'KG 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'].map((className) => ({ className, targetQuantity: '', printedQuantity: '' })),
    costs: { binding: '', a4Box: '', toner: '', delivery: '', coverPerBook: '', workforce: '', other: '' },
    notes: ''
  }
}

function booksPrintingTotals(printing = {}) {
  const items = printing.items || []
  const costs = printing.costs || {}
  const totalToPrint = items.reduce((sum, item) => sum + toNumber(item.targetQuantity), 0)
  const quantityPrinted = items.reduce((sum, item) => sum + toNumber(item.printedQuantity), 0)
  const quantityLeft = Math.max(totalToPrint - quantityPrinted, 0)
  const coverCostTotal = toNumber(costs.coverPerBook) * quantityPrinted
  const totalInvested = toNumber(costs.binding) + toNumber(costs.a4Box) + toNumber(costs.toner) + toNumber(costs.delivery) + coverCostTotal + toNumber(costs.workforce) + toNumber(costs.other)
  const costPerBook = quantityPrinted > 0 ? totalInvested / quantityPrinted : 0
  return { totalToPrint, quantityPrinted, quantityLeft, coverCostTotal, totalInvested, costPerBook }
}

function BooksPrintingPage({ data, updateData }) {
  const savedPrinting = data.booksPrinting || defaultBooksPrintingData()
  const normalizedPrinting = {
    ...defaultBooksPrintingData(),
    ...savedPrinting,
    costs: { ...defaultBooksPrintingData().costs, ...(savedPrinting.costs || {}) }
  }
  const [printing, setPrinting] = useState(normalizedPrinting)
  const currency = data.settings.currency || 'GHS'
  const totals = booksPrintingTotals(printing)

  function updateItem(index, field, value) {
    setPrinting((previous) => ({
      ...previous,
      items: (previous.items || []).map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)
    }))
  }

  function updateCost(field, value) {
    setPrinting((previous) => ({ ...previous, costs: { ...(previous.costs || {}), [field]: value } }))
  }

  function saveBooksPrinting(event) {
    event.preventDefault()
    const payload = {
      ...printing,
      items: (printing.items || []).map((item) => ({ ...item, targetQuantity: toNumber(item.targetQuantity), printedQuantity: toNumber(item.printedQuantity) })),
      costs: Object.fromEntries(Object.entries(printing.costs || {}).map(([key, value]) => [key, toNumber(value)])),
      updatedAt: new Date().toISOString()
    }
    updateData((previous) => ({ ...previous, booksPrinting: payload }))
    setPrinting(payload)
    alert('Books printing record saved.')
  }

  return (
    <section className="page-stack books-printing-page">
      <div className="stats-grid">
        <StatCard title="Total books to print" value={totals.totalToPrint.toLocaleString()} icon={<BookOpen />} />
        <StatCard title="Quantity printed so far" value={totals.quantityPrinted.toLocaleString()} icon={<Receipt />} tone="success" />
        <StatCard title="Quantity left to print" value={totals.quantityLeft.toLocaleString()} icon={<FileText />} tone="warning" />
        <StatCard title="Total amount invested" value={formatMoney(totals.totalInvested, currency)} icon={<WalletCards />} />
        <StatCard title="Cost per book" value={formatMoney(totals.costPerBook, currency)} icon={<Calculator />} tone="success" />
      </div>

      <form className="page-stack" onSubmit={saveBooksPrinting}>
        <div className="panel dashboard-receivables-panel">
          <div className="panel-header stack-mobile">
            <div>
              <p className="eyebrow">Books printed</p>
              <h3>Quantity to print and quantity printed so far</h3>
            </div>
            <button className="primary-btn" type="submit"><Plus size={17} /> Save books printing record</button>
          </div>
          <ResponsiveTable
            columns={['Class','Number to be printed','Quantity printed so far','Quantity left']}
            rows={(printing.items || []).map((item, index) => {
              const left = Math.max(toNumber(item.targetQuantity) - toNumber(item.printedQuantity), 0)
              return [
                <strong>{item.className}</strong>,
                <input type="number" min="0" value={item.targetQuantity} onChange={(event) => updateItem(index, 'targetQuantity', event.target.value)} />,
                <input type="number" min="0" value={item.printedQuantity} onChange={(event) => updateItem(index, 'printedQuantity', event.target.value)} />,
                <span className={left > 0 ? 'amount-warning' : 'amount-success'}>{left.toLocaleString()}</span>
              ]
            })}
            empty="No class records found."
          />
        </div>

        <div className="panel dashboard-receivables-panel">
          <div className="panel-header"><div><p className="eyebrow">Printing cost</p><h3>Investment in book printing</h3></div></div>
          <div className="form-grid books-cost-grid">
            <Input label="Cost for binding" type="number" value={printing.costs.binding} onChange={(value) => updateCost('binding', value)} />
            <Input label="Cost of A4 box / paper" type="number" value={printing.costs.a4Box} onChange={(value) => updateCost('a4Box', value)} />
            <Input label="Cost of toner" type="number" value={printing.costs.toner} onChange={(value) => updateCost('toner', value)} />
            <Input label="Delivery cost" type="number" value={printing.costs.delivery} onChange={(value) => updateCost('delivery', value)} />
            <Input label="Cost of each book cover printed" type="number" value={printing.costs.coverPerBook} onChange={(value) => updateCost('coverPerBook', value)} />
            <Input label="Human workforce cost" type="number" value={printing.costs.workforce} onChange={(value) => updateCost('workforce', value)} />
            <Input label="Other printing cost" type="number" value={printing.costs.other} onChange={(value) => updateCost('other', value)} />
            <Textarea label="Notes" value={printing.notes || ''} onChange={(value) => setPrinting((previous) => ({ ...previous, notes: value }))} />
          </div>
        </div>

        <div className="panel dashboard-receivables-panel">
          <div className="panel-header"><div><p className="eyebrow">Calculation</p><h3>Cost per book summary</h3></div></div>
          <ResponsiveTable
            columns={['Item','Amount']}
            rows={[
              ['Total quantity to be printed', totals.totalToPrint.toLocaleString()],
              ['Quantity printed so far', totals.quantityPrinted.toLocaleString()],
              ['Quantity left to be printed', totals.quantityLeft.toLocaleString()],
              ['Book cover total cost', formatMoney(totals.coverCostTotal, currency)],
              ['Total amount invested in books printing', formatMoney(totals.totalInvested, currency)],
              ['Cost per book: total amount divided by quantity printed', formatMoney(totals.costPerBook, currency)]
            ]}
          />
          <div className="alert warning">Cost per book is calculated as total amount invested divided by quantity printed so far. The cover cost is calculated as cost of each cover multiplied by quantity printed so far.</div>
        </div>
      </form>
    </section>
  )
}
`
  app = app.replace('function AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {', component + '\nfunction AdminUsersPage({ data, updateData, currentUser, useSupabase = false }) {')
  changed = true
}

if (!app.includes("{ name: 'Books Printed'")) {
  if (app.includes("{ name: 'Schools', icon: School },")) {
    app = app.replace("{ name: 'Schools', icon: School },", "{ name: 'Schools', icon: School },\n    { name: 'Books Printed', icon: BookOpen },")
  } else if (app.includes("{ name: 'Dashboard', icon: BarChart3 },")) {
    app = app.replace("{ name: 'Dashboard', icon: BarChart3 },", "{ name: 'Dashboard', icon: BarChart3 },\n    { name: 'Books Printed', icon: BookOpen },")
  }
  changed = true
}

if (!app.includes("visiblePage === 'Books Printed'")) {
  app = app.replace("{visiblePage === 'Schools' && <SchoolsPage data={data} updateData={updateData} />}", "{visiblePage === 'Schools' && <SchoolsPage data={data} updateData={updateData} />}\n        {visiblePage === 'Books Printed' && <BooksPrintingPage data={data} updateData={updateData} />}")
  changed = true
}

app = app.replaceAll("'Schools', 'School Agreements'", "'Schools', 'Books Printed', 'School Agreements'")
app = app.replaceAll("'Schools', 'Marketing'", "'Schools', 'Books Printed', 'Marketing'")
app = app.replaceAll("'Schools', 'Invoices'", "'Schools', 'Books Printed', 'Invoices'")
changed = true

if (changed) write(appPath, app)

let css = read(stylesPath)
if (!css.includes('/* Books printing page */')) {
  css += String.raw`

/* Books printing page */
.books-printing-page .dashboard-receivables-panel { grid-column: 1 / -1 !important; }
.books-printing-page .responsive-table input { width: 130px; max-width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: 9px 10px; font: inherit; }
.books-cost-grid { grid-template-columns: repeat(4, minmax(170px, 1fr)) !important; }
.books-cost-grid textarea { grid-column: 1 / -1; }
@media (max-width: 1100px) { .books-cost-grid { grid-template-columns: 1fr !important; } }
`
  write(stylesPath, css)
}

console.log('[patch-books-printing-v1] ready')
