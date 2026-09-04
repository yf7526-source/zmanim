import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const home = read('src/pages/Home.jsx');
const monthly = read('src/components/MonthlyZmanimSheet.jsx');
const vite = read('vite.config.js');
const app = read('src/App.jsx');
const commandCenter = read('src/components/DesktopCommandCenter.jsx');
const commandPalette = read('src/components/DesktopCommandPalette.jsx');

const checks = [
  ['Home renders SunCircle', home.includes('<SunCircle')],
  ['Home renders ZmanimCard', home.includes('<ZmanimCard')],
  ['Home renders NextZmanCountdown', home.includes('<NextZmanCountdown')],
  ['Settings accessible from Home', home.includes('<SettingsSheet')],
  ['Monthly Zmanim accessible from Home', home.includes('<MonthlyZmanimSheet')],
  ['Calendar accessible from Home', home.includes('<JewishCalendarSheet')],
  ['responsive scroll container', home.includes('overflow-y-auto')],
  ['desktop CSV export', monthly.includes('function exportCsv()') && monthly.includes('FileSpreadsheet')],
  ['desktop density toggle', monthly.includes('denseTable')],
  ['PDF chunk', vite.includes("return 'pdf-tools'")],
  ['chart chunk', vite.includes("return 'charts'")],
  ['no dead comparison route', !app.includes('path="/compare"')],
  ['no dead display route', !app.includes('path="/display"')],
  ['desktop controls have no removed routes', !commandCenter.includes('to="/compare"') && !commandCenter.includes('to="/display"')],
  ['command palette has no removed routes', !commandPalette.includes("navigate('/compare')")],
];
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error('Desktop validation failed:');
  for (const [name] of failed) console.error(` - ${name}`);
  process.exit(1);
}
console.log(`Desktop validation passed: ${checks.length} checks.`);