import fs from 'node:fs';
const home = fs.readFileSync(new URL('../src/pages/Home.jsx', import.meta.url), 'utf8');
const zmanimCard = fs.readFileSync(new URL('../src/components/ZmanimCard.jsx', import.meta.url), 'utf8');
const weatherBadge = fs.readFileSync(new URL('../src/components/WeatherBadge.jsx', import.meta.url), 'utf8');
const shaahZmanitBox = fs.readFileSync(new URL('../src/components/ShaahZmanitBox.jsx', import.meta.url), 'utf8');
const chartsSheetExists = fs.existsSync(new URL('../src/components/ChartsSheet.jsx', import.meta.url));
const shaahClockExists = fs.existsSync(new URL('../src/components/ShaahZmanitClock.jsx', import.meta.url));

const checks = [
  // ── Preserved components ──
  ['SunCircle preserved', home.includes('<SunCircle')],
  ['ZmanimCard preserved', home.includes('<ZmanimCard')],
  ['NextZmanCountdown preserved', home.includes('<NextZmanCountdown')],
  ['CustomEventCard preserved', home.includes('<CustomEventCard')],
  ['ZmanimNotifier preserved', home.includes('<ZmanimNotifier')],
  ['Settings accessible', home.includes('<SettingsSheet')],
  ['Calendar accessible', home.includes('<JewishCalendarSheet')],
  ['Monthly Zmanim accessible', home.includes('<MonthlyZmanimSheet')],
  ['ShaahZmanitBox preserved', home.includes('<ShaahZmanitBox')],
  ['WeatherBadge preserved', home.includes('<WeatherBadge')],

  // ── New Home design ──
  ['ChartsSheet component exists', chartsSheetExists],
  ['ChartsSheet rendered on Home', home.includes('<ChartsSheet')],
  ['Charts button opens sheet', home.includes('setShowChartsSheet(true)')],
  ['SunCircle appears before Next Zman', home.indexOf('<SunCircle') < home.indexOf('<NextZmanCountdown')],
  ['Calendar top shortcut present', home.includes('setShowJewishCalendar(true)')],
  ['Monthly top shortcut present', home.includes('setShowMonthlySelector(true)')],
  ['Settings top shortcut present', home.includes('setShowSettings(true)')],

  // ── Secondary opinions architecture ──
  ['Secondary opinions passed to ZmanimCard', home.includes('showSecondaryTimes') && home.includes('secondaryZmanimDisplay')],
  ['ZmanimCard renders secondary opinions', zmanimCard.includes('secondaryOpinions')],
  ['Settings has secondary times toggle', home.includes('onShowSecondaryTimesChange')],

  // ── Shaah Zmanit clocks ──
  ['ShaahZmanitClock component exists', shaahClockExists],
  ['ShaahZmanitBox uses clock visual', shaahZmanitBox.includes('ShaahZmanitClock')],

  // ── Weather conditional ──
  ['WeatherBadge disappears on failure', weatherBadge.includes('return null') && !weatherBadge.includes('Weather unavailable')],

  // ── Charts moved off Home ──
  ['No direct YearlyMoonChart on Home', !home.includes('<YearlyMoonChart')],
  ['No direct HebrewYearSeasonalChart on Home', !home.includes('<HebrewYearSeasonalChart')],
  ['No direct DaylightChart on Home', !home.includes('<DaylightChart')],
  ['No direct ZmanOpinionTracker on Home', !home.includes('<ZmanOpinionTracker')],

  // ── Existing checks preserved ──
  ['responsive mobile layout', home.includes('overflow-y-auto')],
  ['Hebrew/English support', home.includes("lang === 'he'")],
  ['ZmanimCard rows not dead buttons', zmanimCard.includes('RowTag')],
  ['Three display levels are wired', home.includes('zmanimDisplayLevel') && zmanimCard.includes("displayLevel === 'expert'")],
  ['Calculation methods remain separate', zmanimCard.includes('zmanimOpinions') && zmanimCard.includes('displayLevel')],
  ['No dead community route', !home.includes('/community')],
  ['No dead compare route', !home.includes('/compare')],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? '✅' : '❌'} ${name}`); if (!ok) failed++; }
if (failed) { console.error(`\n${failed} home-experience check(s) failed.`); process.exit(1); }
console.log(`\nAll ${checks.length} home-experience checks passed.`);