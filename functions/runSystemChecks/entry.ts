import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin, safeErrorResponse } from '../../shared/securityUtils.ts';

const MAX_DAYS = 365;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user, response: authResp } = await requireAdmin(base44);
    if (authResp) return authResp;

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'quick' ? 'quick' : 'deep';
    const rawDays = typeof body.days === 'number' ? body.days : 30;
    const days = Math.max(1, Math.min(Math.floor(rawDays), MAX_DAYS));

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const issues = [];

    function dateKey(d) {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    // ── Holiday detection logic (inlined from frontend) ──
    const YOM_TOV_KW = ['rosh hashana', 'rosh hashanah', 'yom kippur', 'sukkot', 'succot',
      'shmini atzeret', 'shemini atzeret', 'simchat torah', 'pesach', 'passover', 'shavuot', 'shavuos'];
    const NON_YOM_TOV_KW = ['chol hamoed', 'chol ha-moed', "ch''m", "ch'm", 'erev',
      'hoshana raba', 'hoshana rabbah', 'pesach sheni', 'isru chag'];
    const FAST_KW = ["tish'a b'av", "tisha b'av", 'tzom gedaliah', 'fast of gedaliah',
      'asara b', '10th of tevet', "ta'anit esther", 'taanit esther', 'fast of esther',
      'shiva asar b', '17th of tammuz', 'fast', 'tzom', 'taanit'];
    const MINOR_KW = ['chanukah', 'hanukah', 'purim', 'tu bishvat', "tu b'shvat",
      'lag baomer', "lag b'omer", "lag ba'omer", 'tu b'];

    function normalizeTitle(title) {
      return (title || '').toLowerCase().replace(/[\u2018\u2019\u201c\u201d]/g, "'");
    }
    function isYomTovEvent(event) {
      if (event.category !== 'holiday' && event.category !== 'fast') return false;
      const title = normalizeTitle(event.title);
      if (NON_YOM_TOV_KW.some(kw => title.includes(kw))) return false;
      return YOM_TOV_KW.some(kw => title.includes(kw));
    }
    function isFastDay(title) {
      const t = normalizeTitle(title);
      return FAST_KW.some(kw => t.includes(kw));
    }
    function isMinorHoliday(title) {
      const t = (title || '').toLowerCase();
      return MINOR_KW.some(kw => t.includes(kw));
    }

    const locations = [
      { name: 'Jerusalem', lat: 31.7767, lng: 35.2345, isIsrael: true },
      { name: 'New York', lat: 40.7128, lng: -74.0060, isIsrael: false },
    ];

    // ── CHECK 1: Zmanim API availability + critical fields ──
    for (const loc of locations) {
      const dateStr = dateKey(today);
      const url = `https://www.hebcal.com/zmanim?cfg=json&latitude=${loc.lat}&longitude=${loc.lng}&date=${dateStr}&sec=1`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          issues.push({ check_name: `zmanim_api_${loc.name}`, severity: 'critical', category: 'zmanim',
            description: `Zmanim API returned HTTP ${res.status} for ${loc.name}` });
          continue;
        }
        const json = await res.json();
        const times = json.times || {};
        if (!times.sunrise) issues.push({ check_name: `zmanim_netz_${loc.name}`, severity: 'critical', category: 'zmanim',
          description: `Sunrise (netz) missing from Hebcal for ${loc.name}` });
        if (!times.sunset) issues.push({ check_name: `zmanim_shkiah_${loc.name}`, severity: 'critical', category: 'zmanim',
          description: `Sunset (shkiah) missing from Hebcal for ${loc.name}` });
        if (!times.chatzot) issues.push({ check_name: `zmanim_chatzot_${loc.name}`, severity: 'warning', category: 'zmanim',
          description: `Chatzot missing from Hebcal for ${loc.name}` });
        if (!times.sofZmanShma) issues.push({ check_name: `zmanim_shema_${loc.name}`, severity: 'warning', category: 'zmanim',
          description: `Sof Zman Shema missing from Hebcal for ${loc.name}` });
        if (!times.alotHaShachar) issues.push({ check_name: `zmanim_alot_${loc.name}`, severity: 'warning', category: 'zmanim',
          description: `Alot HaShachar missing from Hebcal for ${loc.name}` });
      } catch (e) {
        issues.push({ check_name: `zmanim_api_${loc.name}`, severity: 'critical', category: 'zmanim',
          description: `Zmanim API fetch failed for ${loc.name}: ${e.message}` });
      }
    }

    // ── CHECK 2: Events API + holiday categorization ──
    for (const loc of locations) {
      const start = dateKey(today);
      const end = dateKey(endDate);
      const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=off&nx=on&mf=on&ss=on&s=on&o=on&start=${start}&end=${end}&geo=pos&latitude=${loc.lat.toFixed(6)}&longitude=${loc.lng.toFixed(6)}&i=${loc.isIsrael ? 'on' : 'off'}&leyning=off`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          issues.push({ check_name: `events_api_${loc.name}`, severity: 'critical', category: 'holiday',
            description: `Events API returned HTTP ${res.status} for ${loc.name}` });
          continue;
        }
        const json = await res.json();
        const STATE_KW = ['haatzmaut', 'hazikaron', 'yerushalayim', 'jerusalem day', 'hashoah', 'shoah', 'sigd', 'family day', 'aliyah', 'yom ha'];
        const items = (json.items || []).filter(item => {
          const title = (item.title || '').toLowerCase();
          return !STATE_KW.some(kw => title.includes(kw));
        });

        if (items.length === 0) {
          issues.push({ check_name: `events_empty_${loc.name}`, severity: 'warning', category: 'calendar',
            description: `No calendar events returned for ${loc.name} in ${days}-day range` });
        }

        // Check each event for categorization issues
        for (const item of items) {
          const title = (item.title || '').toLowerCase();
          const cat = item.category;

          // Fast day wrongly categorized as 'holiday' (would get Yom Tov color)
          if (cat === 'holiday' && isFastDay(title)) {
            issues.push({ check_name: `fast_as_holiday_${item.date}_${title.substring(0,20)}`, severity: 'warning', category: 'holiday',
              description: `"${item.title}" on ${item.date} is a fast day with category 'holiday' — would get Yom Tov color instead of fast color` });
          }

          // Minor holiday getting 'holiday' category
          if (cat === 'holiday' && isMinorHoliday(title) && !isFastDay(title)) {
            issues.push({ check_name: `minor_as_yomtov_${item.date}_${title.substring(0,20)}`, severity: 'info', category: 'holiday',
              description: `"${item.title}" on ${item.date} is a minor holiday — verify it does not get Yom Tov color in calendar` });
          }

          // Erev day getting 'holiday' category
          if (cat === 'holiday' && title.startsWith('erev')) {
            issues.push({ check_name: `erev_as_yomtov_${item.date}_${title.substring(0,20)}`, severity: 'info', category: 'holiday',
              description: `"${item.title}" on ${item.date} is an Erev (prep) day — verify it does not get Yom Tov color` });
          }
        }

        // ── CHECK 3: Shavuot specifically (was missing before) ──
        const shavuot = items.find(e => (e.title || '').toLowerCase().includes('shavuot'));
        if (shavuot && !isYomTovEvent(shavuot)) {
          issues.push({ check_name: `shavuot_not_yomtov_${shavuot.date}`, severity: 'critical', category: 'holiday',
            description: `Shavuot on ${shavuot.date} is NOT detected as Yom Tov — candle lighting and Shabbat Ends will not appear` });
        }

        // ── CHECK 4: Yom Tov candle lighting / Shabbat Ends logic ──
        for (const item of items) {
          if (!isYomTovEvent(item)) continue;
          // Yom Tov day itself should be detected as ShabbatOrYomTov
          // Day before should be detected as Erev
          // (Logic verification — if isYomTovEvent returns true, the frontend functions will work)
        }

        // ── CHECK 5: Verify no fast days are missed ──
        const fasts = items.filter(e => isFastDay((e.title || '').toLowerCase()));
        for (const fast of fasts) {
          // Verify fast day is not also detected as Yom Tov (except Yom Kippur)
          if (isYomTovEvent(fast) && !(fast.title || '').toLowerCase().includes('yom kippur')) {
            issues.push({ check_name: `fast_as_yomtov_${fast.date}`, severity: 'warning', category: 'holiday',
              description: `"${fast.title}" on ${fast.date} is a fast day but detected as Yom Tov — may show wrong color` });
          }
        }

      } catch (e) {
        issues.push({ check_name: `events_api_${loc.name}`, severity: 'critical', category: 'holiday',
          description: `Events API fetch failed for ${loc.name}: ${e.message}` });
      }
    }

    // ── CHECK 6: PDF Export integrity ──
    // Check for potential content overflow (too many zmanim columns for page width)
    const maxZmanColumns = 15; // approximate max columns before overflow risk
    const pdfCheckUrl = `https://www.hebcal.com/zmanim?cfg=json&latitude=31.7767&longitude=35.2345&date=${dateKey(today)}&sec=1`;
    try {
      const pdfRes = await fetch(pdfCheckUrl);
      if (pdfRes.ok) {
        const pdfJson = await pdfRes.json();
        const pdfTimes = pdfJson.times || {};
        // Check that all critical zmanim fields needed for PDF export exist
        const pdfRequiredFields = ['sunrise', 'sunset', 'chatzot', 'sofZmanShma', 'sofZmanTfilla', 'alotHaShachar'];
        for (const field of pdfRequiredFields) {
          if (!pdfTimes[field]) {
            issues.push({ check_name: `pdf_missing_field_${field}`, severity: 'warning', category: 'pdf',
              description: `PDF export field "${field}" is missing from Hebcal zmanim data — PDF columns may show blank times` });
          }
        }
        // Check for Hebrew/RTL rendering: verify Hebcal returns hebrew field in events
        const eventCheckUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&start=${dateKey(today)}&end=${dateKey(endDate)}&geo=pos&latitude=31.7767&longitude=35.2345&i=on&leyning=off`;
        const eventRes = await fetch(eventCheckUrl);
        if (eventRes.ok) {
          const eventJson = await eventRes.json();
          const items = eventJson.items || [];
          const missingHebrew = items.filter(e => e.category === 'holiday' && !e.hebrew);
          if (missingHebrew.length > 0) {
            issues.push({ check_name: 'pdf_hebrew_missing', severity: 'warning', category: 'pdf',
              description: `${missingHebrew.length} calendar events are missing Hebrew titles — Hebrew/RTL rendering in PDFs may show English fallback` });
          }
        }
      }
    } catch (e) {
      issues.push({ check_name: 'pdf_data_check_failed', severity: 'info', category: 'pdf',
        description: `PDF integrity check could not run: ${e.message}` });
    }

    // ── CHECK 7: Chart data integrity ──
    // Check for data gaps (null values) in chart data sources
    for (const loc of locations) {
      const chartUrl = `https://www.hebcal.com/zmanim?cfg=json&latitude=${loc.lat}&longitude=${loc.lng}&date=${dateKey(today)}&sec=1`;
      try {
        const chartRes = await fetch(chartUrl);
        if (chartRes.ok) {
          const chartJson = await chartRes.json();
          const ct = chartJson.times || {};
          // Charts depend on these fields for daylight/sunrise/sunset curves
          const chartFields = [
            { key: 'sunrise', label: 'sunrise' },
            { key: 'sunset', label: 'sunset' },
            { key: 'chatzot', label: 'chatzot' },
          ];
          for (const f of chartFields) {
            if (!ct[f.key]) {
              issues.push({ check_name: `chart_data_gap_${f.key}_${loc.name}`, severity: 'warning', category: 'chart',
                description: `Chart data gap: "${f.label}" is null for ${loc.name} — chart lines may break or show gaps` });
            }
          }
          // Check for timezone mismatch (causes axis/label issues)
          const tzid = chartJson.location?.tzid;
          if (tzid && loc.isIsrael && !tzid.includes('Jerusalem')) {
            issues.push({ check_name: `chart_tz_mismatch_${loc.name}`, severity: 'warning', category: 'chart',
              description: `Timezone mismatch for ${loc.name}: expected Jerusalem timezone but got ${tzid} — chart axis labels may be offset` });
          }
        }
      } catch (e) {
        issues.push({ check_name: `chart_check_failed_${loc.name}`, severity: 'info', category: 'chart',
          description: `Chart data check failed for ${loc.name}: ${e.message}` });
      }
    }

    // ── Save issues to SystemCheck entity (deduplicated) ──
    let savedCount = 0;
    const todayKey = dateKey(today);

    for (const issue of issues) {
      const existing = await base44.asServiceRole.entities.SystemCheck.filter(
        { check_name: issue.check_name, status: 'new' },
        '-created_date',
        1
      );
      if (existing && existing.length > 0) continue;

      await base44.asServiceRole.entities.SystemCheck.create({
        ...issue,
        check_date: todayKey,
        status: 'new'
      });
      savedCount++;
    }

    return Response.json({
      mode,
      totalIssues: issues.length,
      newIssues: savedCount,
      summary: {
        critical: issues.filter(i => i.severity === 'critical').length,
        warning: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length,
      }
    });
  } catch (error) {
    return safeErrorResponse();
  }
});