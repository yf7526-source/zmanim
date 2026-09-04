import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const home = read('src/pages/Home.jsx');
const selector = read('src/components/MonthlyZmanimSelector.jsx');
const cal = read('src/components/JewishCalendarSheet.jsx');
const settings = read('src/components/SettingsSheet.jsx');
const colors = read('src/components/CalendarSettingsPanel.jsx');
const dayCell = read('src/components/calendar/CalendarDayCell.jsx');
const pdf = read('src/lib/yearlyCalendarPdf.js');
const monthly = read('src/components/MonthlyZmanimSheet.jsx');
const checks = [
  ['12/24-hour preference persists', home.includes('PREF_KEYS.hour12')],
  ['location defaults never overwrite after user customization', home.includes('followLocationDefaults') && settings.includes('Location calculation defaults')],
  ['Monthly Zmanim follows Daily settings by default', selector.includes('Follow my Daily Zmanim settings') && selector.includes('getMonthlyFollowMain')],
  ['Calendar and Monthly Times share month-system preference', cal.includes('getCalendarMonthSystem') && monthly.includes('getCalendarMonthSystem')],
  ['Calendar uses shared holiday classifier', cal.includes('categorizeHebcalEvent')],
  ['Yearly PDF uses shared holiday classifier', pdf.includes('categorizeHebcalEvent')],
  ['Calendar reports unavailable live holiday data instead of erasing silently', cal.includes('holidayDataStatus') && cal.includes('Live holiday data is temporarily unavailable')],
  ['Calendar grid prioritizes one primary event label', dayCell.includes('prioritizedEvents.slice(0, 1)')],
  ['Calendar colors apply to grid and monthly table', colors.includes('Calendar grid') && colors.includes('Monthly Zmanim table rows')],
  ['Date control removed from Settings', !settings.includes('type="date"')],
  ['Advanced calculation controls separated', settings.includes("key: 'advanced'")],
  ['Display levels are separate from calculation controls', settings.includes("key: 'display'") && settings.includes("key: 'calculation'")],
  ['Detailed calculations are collapsed by default', settings.includes('showCalculationDetails') && settings.includes('Customize calculations')],
  ['Monthly table uses clearer My Columns label', monthly.includes('My Columns')],
];
let failed=0;
for (const [name, ok] of checks) { console.log(`${ok?'✓':'✗'} ${name}`); if(!ok) failed++; }
if(failed){ console.error(`\n${failed} settings/calendar validation(s) failed.`); process.exit(1);}
console.log(`\nAll ${checks.length} settings/calendar checks passed.`);