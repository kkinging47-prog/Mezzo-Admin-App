import fs from 'node:fs'

const stylesPath = new URL('../src/styles.css', import.meta.url)
let css = fs.readFileSync(stylesPath, 'utf8')

if (!css.includes('/* Books printing layout fix */')) {
  css += String.raw`

/* Books printing layout fix */
.books-printing-page .books-cost-grid {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(220px, 1fr)) !important;
  gap: 22px !important;
  align-items: start !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
}
.books-printing-page .books-cost-grid .field,
.books-printing-page .books-cost-grid label,
.books-printing-page .books-cost-grid input,
.books-printing-page .books-cost-grid textarea {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}
.books-printing-page .books-cost-grid textarea,
.books-printing-page .books-cost-grid .field:has(textarea) {
  grid-column: 1 / -1 !important;
}
.books-printing-page .books-cost-grid input {
  min-width: 0 !important;
}
@media (max-width: 1250px) {
  .books-printing-page .books-cost-grid { grid-template-columns: repeat(2, minmax(220px, 1fr)) !important; }
}
@media (max-width: 760px) {
  .books-printing-page .books-cost-grid { grid-template-columns: 1fr !important; }
}
`
  fs.writeFileSync(stylesPath, css)
}

console.log('[patch-books-printing-layout-v1] ready')
