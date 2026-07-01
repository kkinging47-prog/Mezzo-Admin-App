import fs from 'node:fs'

const appPath = new URL('../src/App.jsx', import.meta.url)
const read = p => fs.readFileSync(p, 'utf8')
const write = (p, s) => fs.writeFileSync(p, s)
let app = read(appPath)
let changed = false

const dashboardMarker = "{visiblePage === 'Dashboard' && <Dashboard data={data} financials={financials} />}"
const schoolsMarker = "{visiblePage === 'Schools' && <SchoolsPage data={data} updateData={updateData} />}"

const pages = [
  ['Academic Term Setup', 'AcademicTermSetupPage', "{visiblePage === 'Academic Term Setup' && <AcademicTermSetupPage data={data} updateData={updateData} />}"] ,
  ['School Agreements', 'SchoolAgreementsPage', "{visiblePage === 'School Agreements' && <SchoolAgreementsPage data={data} updateData={updateData} />}"] ,
  ['Invoices', 'InvoicesPage', "{visiblePage === 'Invoices' && <InvoicesPage data={data} updateData={updateData} currentUser={currentUser} />}"] ,
  ['Country Updates', 'CountryDocumentsPage', "{visiblePage === 'Country Updates' && <CountryDocumentsPage data={data} updateData={updateData} currentUser={currentUser} />}"] ,
  ['Company Documents', 'CompanyDocumentsPage', "{visiblePage === 'Company Documents' && <CompanyDocumentsPage data={data} updateData={updateData} currentUser={currentUser} />}"] ,
  ['Monthly Salaries', 'MonthlySalariesPage', "{visiblePage === 'Monthly Salaries' && <MonthlySalariesPage data={data} updateData={updateData} currentUser={currentUser} />}"] ,
  ['Company Loans', 'CompanyLoansPage', "{visiblePage === 'Company Loans' && <CompanyLoansPage data={data} updateData={updateData} />}"] ,
  ['Financial Reports', 'FinancialReportsPage', "{visiblePage === 'Financial Reports' && <FinancialReportsPage data={data} financials={financials} />}"] ,
  ['Accounts Generator', 'AccountsExactPage', "{visiblePage === 'Accounts Generator' && <AccountsExactPage data={data} />}"] ,
  ['AI Accounts Assistant', 'AIAccountsAssistantPage', "{visiblePage === 'AI Accounts Assistant' && <AIAccountsAssistantPage data={data} />}"]
]

const linesToInsert = []
for (const [pageName, componentName, renderLine] of pages) {
  if (app.includes(`function ${componentName}(`) && !app.includes(`visiblePage === '${pageName}'`)) {
    linesToInsert.push('        ' + renderLine)
  }
}

if (linesToInsert.length) {
  if (app.includes(dashboardMarker)) {
    app = app.replace(dashboardMarker, dashboardMarker + '\n' + linesToInsert.join('\n'))
    changed = true
  } else if (app.includes(schoolsMarker)) {
    app = app.replace(schoolsMarker, linesToInsert.join('\n') + '\n        ' + schoolsMarker)
    changed = true
  }
}

if (app.includes("{visiblePage === 'Settings' && <SettingsPage") && app.includes('function StableSettingsPage(')) {
  app = app.replace(/\{visiblePage === 'Settings' && <SettingsPage[\s\S]*?\/>\}/, "{visiblePage === 'Settings' && <StableSettingsPage data={data} updateData={updateData} />}")
  changed = true
}

if (changed) {
  write(appPath, app)
  console.log('[patch-render-pages-v1] inserted missing page render conditions')
}

console.log('[patch-render-pages-v1] ready')
