import assert from 'node:assert/strict';
import {
  getMoonPhase, getSunPosition, getSunTimes, hebrewToGregorian, toHebrewDate,
} from '../src/lib/sunCalc.js';
import { formatTimeInTz, makeWallTimeDate, toDateOnly } from '../src/lib/timezone.js';
import { navigateHebrewMonth } from '../src/lib/monthlyZmanimHelpers.js';
import { fetchHebcalZmanimRange } from '../src/lib/hebcalApi.js';

const roshHashana5787 = hebrewToGregorian(5787, 7, 1);
assert.ok(roshHashana5787 instanceof Date && !Number.isNaN(roshHashana5787.getTime()));
assert.equal(toDateOnly(roshHashana5787, 'UTC'), '2026-09-12');
assert.deepEqual(
  (({ year, month, day }) => ({ year, month, day }))(toHebrewDate(new Date('2026-09-12T12:00:00Z'))),
  { year: 5787, month: 7, day: 1 },
);

assert.deepEqual(navigateHebrewMonth(5786, 6, 1), { year: 5787, month: 7 });
assert.deepEqual(navigateHebrewMonth(5787, 7, -1), { year: 5786, month: 6 });
assert.deepEqual(navigateHebrewMonth(5787, 12, 1), { year: 5787, month: 13 });
assert.deepEqual(navigateHebrewMonth(5787, 13, 1), { year: 5787, month: 1 });

const skippedDstTime = makeWallTimeDate('2026-03-08', '02:30', 'America/New_York');
assert.equal(skippedDstTime, null);
const normalWallTime = makeWallTimeDate('2026-03-08', '01:30', 'America/New_York');
assert.ok(normalWallTime);
assert.match(formatTimeInTz(normalWallTime, 'America/New_York', false), /^01:30$/);
const repeatedDstTime = makeWallTimeDate('2026-11-01', '01:30', 'America/New_York');
assert.equal(repeatedDstTime?.toISOString(), '2026-11-01T05:30:00.000Z');
assert.equal(makeWallTimeDate('2026-02-30', '12:00', 'UTC'), null);
assert.equal(makeWallTimeDate('2026-01-01', '24:00', 'UTC'), null);

for (const iso of ['1995-01-01T00:00:00Z', '2000-01-06T18:14:00Z', '2026-08-25T12:00:00Z']) {
  const moon = getMoonPhase(new Date(iso));
  assert.ok(moon.phaseIndex >= 0 && moon.phaseIndex <= 7);
  assert.ok(moon.phase >= 0 && moon.phase < 29.53058867);
  assert.ok(moon.illumination >= 0 && moon.illumination <= 100);
}

const jerusalem = { lat: 31.7767, lng: 35.2345 };
const date = new Date('2026-08-25T12:00:00Z');
const position = getSunPosition(date, jerusalem.lat, jerusalem.lng);
assert.ok(Number.isFinite(position.altitude) && position.altitude > 50 && position.altitude < 90);
const times = getSunTimes(date, jerusalem.lat, jerusalem.lng);
assert.ok(times.netz instanceof Date && times.shkiah instanceof Date && times.netz < times.shkiah);

for (const sample of [
  { name: 'New York winter', date: '2026-01-15T12:00:00Z', lat: 40.7128, lng: -74.006 },
  { name: 'London spring', date: '2026-04-15T12:00:00Z', lat: 51.5072, lng: -0.1276 },
  { name: 'Jerusalem summer', date: '2026-07-15T12:00:00Z', lat: 31.7767, lng: 35.2345 },
  { name: 'Sydney autumn', date: '2026-04-15T12:00:00Z', lat: -33.8688, lng: 151.2093 },
]) {
  const result = getSunTimes(new Date(sample.date), sample.lat, sample.lng);
  assert.ok(result?.netz instanceof Date, `${sample.name}: sunrise missing`);
  assert.ok(result?.shkiah instanceof Date, `${sample.name}: sunset missing`);
  assert.ok(result.netz < result.chatzot && result.chatzot < result.shkiah, `${sample.name}: solar order invalid`);
  assert.ok(result.shema_gra < result.tefilla_gra, `${sample.name}: morning zmanim order invalid`);
  assert.ok(result.minchaGedola_gra < result.minchaKetana_gra, `${sample.name}: mincha order invalid`);
  assert.ok(result.minchaKetana_gra < result.plagHaMincha_gra, `${sample.name}: plag order invalid`);
}

const tromsoMidsummer = getSunTimes(new Date('2026-06-21T12:00:00Z'), 69.6492, 18.9553);
assert.equal(tromsoMidsummer.netz, null);
assert.equal(tromsoMidsummer.shkiah, null);

const originalFetch = globalThis.fetch;
const rangeCalls = [];
const rangeController = new AbortController();
globalThis.fetch = async (url, options = {}) => {
  const parsed = new URL(url);
  rangeCalls.push(parsed);
  assert.equal(options.signal, rangeController.signal);
  const start = parsed.searchParams.get('start');
  const end = parsed.searchParams.get('end');
  return {
    ok: true,
    json: async () => ({
      location: { tzid: 'Asia/Jerusalem' },
      times: { sunrise: { [start]: `${start}T06:00:00+03:00`, [end]: `${end}T06:01:00+03:00` } },
    }),
  };
};
try {
  await assert.rejects(() => fetchHebcalZmanimRange('2026-12-31', '2026-01-01', jerusalem.lat, jerusalem.lng));
  await assert.rejects(() => fetchHebcalZmanimRange('2026-01-01', '2026-01-02', 91, jerusalem.lng));
  const range = await fetchHebcalZmanimRange('2026-01-01', '2026-12-31', jerusalem.lat, jerusalem.lng, 0, null, rangeController.signal);
  assert.equal(rangeCalls.length, 3);
  assert.equal(rangeCalls[0].searchParams.get('end'), '2026-06-29');
  assert.ok(range.timesByDate['2026-01-01'].sunrise instanceof Date);
  assert.equal(range.tzid, 'Asia/Jerusalem');
} finally {
  globalThis.fetch = originalFetch;
}

console.log('Core validation passed: dates, DST, lunar/solar calculations, and range API chunking.');
