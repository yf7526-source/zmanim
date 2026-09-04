// Static validation for the Monthly Zmanim feature.
// Checks source files for intended behavior and regressions from the repair passes.
// This is a STATIC source check — it does not prove runtime browser behavior.
import fs from 'node:fs';

const issues = [];

const sheet = fs.readFileSync('src/components/MonthlyZmanimSheet.jsx', 'utf8');
const selector = fs.readFileSync('src/components/MonthlyZmanimSelector.jsx', 'utf8');
const pdf = fs.readFileSync('src/lib/monthlyZmanimPdf.js', 'utf8');
const config = fs.readFileSync('src/lib/monthlyZmanimConfig.js', 'utf8');
const pdfOpts = fs.readFileSync('src/components/PdfDownloadOptionsModal.jsx', 'utf8');

// My Columns has a real callback
if (!sheet.includes('onEditColumns')) issues.push('MonthlyZmanimSheet: onEditColumns prop missing.');
if (!sheet.includes('onEditColumns?.()')) issues.push('My Columns button does not call onEditColumns.');

// No obsolete showAll state
if (/showAll/i.test(sheet)) issues.push('MonthlyZmanimSheet: obsolete showAll state present.');

// All / None / Reset to Daily Settings
if (!selector.includes('selectAll')) issues.push('Selector: All action missing.');
if (!selector.includes('selectNone')) issues.push('Selector: None action missing.');
if (!selector.includes('resetToHome')) issues.push('Selector: Reset to Daily Settings missing.');

// Export menu contains Quick PDF / PDF Studio / CSV / Print
if (!sheet.includes('handleQuickPdf')) issues.push('Export menu: Quick PDF handler missing.');
if (!sheet.includes("tr('Quick PDF'")) issues.push('Export menu: Quick PDF label missing.');
if (!sheet.includes('PDF Studio')) issues.push('Export menu: PDF Studio missing.');
if (!sheet.includes('exportCsv')) issues.push('Export menu: CSV missing.');
if (!sheet.includes('handlePrint')) issues.push('Export menu: Print missing.');

// Print does not force RTL for all languages
if (/<html dir="rtl">/.test(sheet)) issues.push('Print forces <html dir="rtl"> for all languages.');

// Weekly hides month-system selector
if (!sheet.includes("viewMode === 'monthly'")) issues.push('Weekly: month-system selector not gated to monthly mode.');

// loadError + Retry
if (!sheet.includes('loadError')) issues.push('loadError state missing.');
if (!sheet.includes('setRetryKey')) issues.push('Retry control missing.');

// PDF error handling
if (!/Could not create PDF/.test(sheet)) issues.push('PDF error feedback missing.');

// PDF builder accepts direction/isRtl
if (!pdf.includes('isRtl')) issues.push('PDF builder does not accept isRtl.');
if (!pdf.includes('dirMode')) issues.push('PDF builder does not derive dirMode from isRtl.');
if (!pdf.includes('dir="${dirMode}"')) issues.push('PDF title does not use dirMode (hard-coded RTL).');

// No "Shown in chart" wording
if (/Shown in chart/i.test(selector)) issues.push('Selector: "Shown in chart" wording present.');
if (/Shown in chart/i.test(sheet)) issues.push('Sheet: "Shown in chart" wording present.');

// No misleading "Preferred" wording (renamed to Highlight)
if (/Preferred/i.test(selector)) issues.push('Selector: misleading "Preferred" wording present.');

// Monthly terminology uses table, not chart, in titles
if (/Monthly Zmanim Chart/i.test(sheet)) issues.push('Sheet title still says "Monthly Zmanim Chart".');
if (/Monthly Times/i.test(selector)) issues.push('Selector still says "Monthly Times".');

// Empty-column state
if (!/No zmanim columns selected/i.test(sheet)) issues.push('Empty-column state missing.');
if (!/Choose columns/i.test(sheet)) issues.push('Empty-column "Choose columns" button missing.');

// Invalid saved key filtering
if (!selector.includes("filter(k => allKeys.has(k))")) issues.push('Selector: invalid saved key filtering missing.');

// PDF title no longer says "Daily Zmanim"
if (/Daily Zmanim/.test(pdf)) issues.push('PDF title still says "Daily Zmanim".');

// Follow Daily Settings wording (renamed from Use Standard Columns)
if (/Use Standard Columns/i.test(selector)) issues.push('Selector: old "Use Standard Columns" wording present.');
if (!/Follow my Daily Zmanim settings/i.test(selector)) issues.push('Selector: "Follow my Daily Zmanim settings" wording missing.');

// Highlight help text
if (!/Highlighted columns appear more prominently/i.test(selector)) issues.push('Selector: highlight help text missing.');

// PDF Studio starts from current columns + explanatory text
if (!/Using your current Monthly Zmanim columns/i.test(pdfOpts)) issues.push('PDF Studio: "Using your current Monthly Zmanim columns" text missing.');

// Estimated pages wording
if (!/Estimated pages/i.test(pdfOpts)) issues.push('PDF Studio: "Estimated pages" wording missing.');
if (!/Actual page count may vary/i.test(pdfOpts)) issues.push('PDF Studio: "Actual page count may vary" text missing.');

// Config no longer says "chart"
if (/chart column/i.test(config)) issues.push('Config: "chart column" terminology present.');

// ── Export repair checks (PDF/Print/CSV direction, Excel-friendliness, freshness) ──

// UTF-8 BOM present in CSV export (Excel Hebrew recognition)
if (!/\\uFEFF/.test(sheet)) issues.push('CSV: UTF-8 BOM (\\uFEFF) missing for Excel-friendly export.');

// CSV escape function present (quotes + inner-quote doubling)
if (!/replace\(\s*\/"\s*\/g/.test(sheet)) issues.push('CSV: value escape function (inner quote doubling) missing.');

// CSV includes an Events column
if (!/eventHeader|'Events'|'אירועים'/.test(sheet)) issues.push('CSV: Events column missing.');

// CSV uses lang-aware headers (columnLabelEn imported)
if (!/columnLabelEn/.test(sheet)) issues.push('CSV: columnLabelEn import missing for lang-aware headers.');

// CSV not hidden on mobile (export menu fits viewport)
if (!/max-w-\[calc\(100vw-2\.5rem\)\]/.test(sheet)) issues.push('Export menu: mobile max-width constraint missing.');

// Quick PDF uses current table columns (not stale saved state)
if (!/quickKeys\s*=\s*effectiveVisibleKeys/.test(sheet)) issues.push('Quick PDF: does not use current effectiveVisibleKeys.');

// PDF builder filters invalid/stale keys against current column definitions
if (!/filterKeys\.has\(s\.key\)/.test(pdf)) issues.push('PDF builder: stale/invalid key filtering missing.');

// Print uses current language direction (not unconditional RTL)
if (!/printDir/.test(sheet)) issues.push('Print: does not derive direction from language.');
if (!/lang !== 'en'/.test(sheet)) issues.push('Print: language check for direction missing.');

// Filenames include Monthly/Weekly + location
if (!/SolarZmanim-Monthly/.test(pdf)) issues.push('PDF: Monthly filename missing SolarZmanim-Monthly prefix.');
if (!/SolarZmanim-Weekly/.test(pdf)) issues.push('PDF: Weekly filename missing SolarZmanim-Weekly prefix.');
if (!/SolarZmanim-\$\{modeLabel\}/.test(sheet)) issues.push('CSV: filename missing Monthly/Weekly mode label.');

// CSV download revokes object URL (memory cleanup)
if (!/URL\.revokeObjectURL\(url\)/.test(sheet)) issues.push('CSV: object URL revocation missing.');

if (issues.length) {
  console.error('Monthly Zmanim validation failed:\n- ' + issues.join('\n- '));
  process.exit(1);
}
console.log('Monthly Zmanim validation passed: buttons, columns, export, direction, terminology, error states, and key cleanup checked.');