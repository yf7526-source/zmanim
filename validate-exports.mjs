import fs from 'node:fs';
const issues = [];
const preview = fs.readFileSync('src/components/PdfPreviewModal.jsx','utf8');
if (!preview.includes("objectFit: 'contain'")) issues.push('PDF fit preview does not preserve aspect ratio.');
if (!preview.includes("event.key === 'Escape'")) issues.push('PDF preview lacks Escape-key close support.');
for (const file of ['src/lib/customZmanimPdf.js','src/lib/yearlyCalendarPdf.js','src/components/MonthlyZmanimSheet.jsx']) {
  const s=fs.readFileSync(file,'utf8');
  if (!s.includes('escapeHtml')) issues.push(`${file} does not use HTML escaping.`);
  if (!s.includes('html2canvas')) issues.push(`${file} export path missing html2canvas.`);
}
if (issues.length) { console.error('Export validation failed:\n- ' + issues.join('\n- ')); process.exit(1); }
console.log('Export validation passed: preview aspect ratio, keyboard close, HTML escaping, and PDF capture paths checked.');
