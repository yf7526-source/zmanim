import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only — this is an expensive LLM scan
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const deep = body.deep !== false;

    const SCAN_PROMPT = `You are a senior code auditor analyzing a production web app called "Solarzmanim" — a Zmanim (halachic Jewish time) management app built with React + Tailwind CSS + Base44 BaaS (backend-as-a-service).

APP ARCHITECTURE:
- Frontend: React 18 + Vite + Tailwind CSS + shadcn/ui, deployed to web/iOS/Android from one codebase
- Backend: Base44 BaaS — entities (JSON schemas), backend functions (Deno Deploy), automations
- State: React hooks (useState/useEffect), localStorage for persistence, Base44 SDK for server data
- Libraries: lucide-react (icons), recharts (charts), framer-motion (animation), react-leaflet (maps), html2canvas + jsPDF (PDF export), three.js (3D)

APP FEATURES:
1. Zmanim Calculations: Hebcal API for halachic times (sunrise, sunset, chatzot, sof zman shema/tefilla, mincha gedola/ketana, plag hamincha, tzait kochavim, alot hashachar, misheyakir). Multiple opinions: GRA, MGA, Baal HaTanya, Rabbeinu Tam with configurable degree thresholds (16.1°, 18°, 19.8°, 7.083°, 8.5°, etc.).
2. SunCircle: Canvas-based circular chart with sun/moon orbit, zmanim ring markers, dynamic sky colors by sun elevation, cottage landscape background image, stars at night, window glow.
3. PDF Exports: Monthly + weekly zmanim charts via html2canvas + jsPDF. A4 landscape, 1-inch margins, Hebrew/English bilingual, RTL layout, fixed table-layout, parsha headers, molad footers.
4. Jewish Calendar: Hebrew/Gregorian conversion, holiday detection, parsha names, molad calculations, kiddush levanah windows, Rosh Chodesh detection.
5. Weather: Open-Meteo API with LLM fallback.
6. Custom Zmanim: User-defined posekim with offset minutes from base zmanim.
7. Location Management: City picker, GPS detection, saved locations, elevation-based horizon degree offset.
8. Settings: Halachic opinion pickers, 12/24h time format, language (Hebrew/English/both), countdown timer, browser notifications, zmanim ring toggle.
9. User Events: Custom event scheduler with daily/weekly/monthly/yearly recurrence.
10. Analytics: Visit tracking, location searches, GPS sign-ins.

KNOWN COMMON BUG PATTERNS TO SCAN FOR:
- Race conditions in async useEffect (missing cancellation flags, stale state overwrites)
- Missing or incorrect useEffect dependency arrays (stale closures, missing re-runs)
- Memory leaks (intervals/subscriptions not cleaned up in useEffect return)
- Infinite render loops (state updates in effects without proper deps)
- localStorage vs server state sync issues
- Timezone mismatches between user-selected location and browser timezone
- Hebrew date conversion edge cases (leap years, Adar II, Cheshvan/Kislev variable days)
- PDF rendering: RTL text in html2canvas, canvas stretching/distortion, column overflow
- Canvas devicePixelRatio scaling on high-DPI displays
- Sun/moon orbit angle calculations (rise/set/night arc transitions)
- Realtime entity subscription updates not cleaning up
- Notification permissions and per-day firing limits
- Edge cases: polar regions (no sunrise/sunset), DST transitions, date navigation across month boundaries
- Unhandled promise rejections in async chains
- Error states not shown to user (silent .catch(() => {}))
- Entity queries without pagination loading full datasets

Task: Identify real, actionable bugs and issues across the ENTIRE app. Focus on concrete code-level problems that could affect users right now — not theoretical or stylistic ones. For each bug, you MUST provide:
- subject: clear, short title
- description: detailed description of the issue, what triggers it, and what the user experiences
- severity: "critical" (broken functionality), "warning" (minor inaccuracy/degradation), or "info" (suggestion)
- category: one of "zmanim", "holiday", "calendar", "pdf", "ui", "chart"
- fix_prompt: a SPECIFIC, copy-pasteable instruction for the Base44 AI developer telling it EXACTLY what file(s) to check and what to fix. Start with "In <file path>, ..." and describe the precise change needed.

Return at most 8 bugs, prioritized by severity (critical first). Only include bugs you are confident about.`;

    let llmRes;
    try {
      llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: SCAN_PROMPT,
        response_json_schema: {
          type: 'object',
          properties: {
            bugs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  subject: { type: 'string' },
                  description: { type: 'string' },
                  severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
                  category: { type: 'string', enum: ['zmanim', 'holiday', 'calendar', 'pdf', 'ui', 'chart'] },
                  fix_prompt: { type: 'string' },
                },
                required: ['subject', 'description', 'severity', 'category', 'fix_prompt'],
              },
            },
          },
          required: ['bugs'],
        },
      });
    } catch (llmErr) {
      return Response.json({ error: 'LLM call failed: ' + llmErr.message, raw: String(llmErr) }, { status: 500 });
    }

    const bugs = Array.isArray(llmRes?.bugs) ? llmRes.bugs : [];
    const todayKey = new Date().toISOString().split('T')[0];

    let savedCount = 0;
    let skippedCount = 0;
    const savedIssues = [];

    for (const bug of bugs) {
      const checkName = `code_scan_${bug.category}_${bug.subject.substring(0, 60).replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Deduplicate — skip if an open issue with the same check_name exists
      const existing = await base44.asServiceRole.entities.SystemCheck.filter(
        { check_name: checkName, status: 'new' },
        '-created_date',
        1
      );
      if (existing && existing.length > 0) {
        skippedCount++;
        continue;
      }

      const record = await base44.asServiceRole.entities.SystemCheck.create({
        check_name: checkName,
        severity: bug.severity,
        category: bug.category,
        description: bug.description,
        check_date: todayKey,
        status: 'new',
        fix_status: 'none',
        fix_summary: bug.fix_prompt,
        fix_mode: 'discuss',
        auto_fix_enabled: false,
      });
      savedCount++;
      savedIssues.push(record);
    }

    return Response.json({
      totalScanned: bugs.length,
      newIssues: savedCount,
      skippedDuplicates: skippedCount,
      summary: {
        critical: bugs.filter(b => b.severity === 'critical').length,
        warning: bugs.filter(b => b.severity === 'warning').length,
        info: bugs.filter(b => b.severity === 'info').length,
      },
      issues: savedIssues.map(i => ({
        id: i.id,
        check_name: i.check_name,
        severity: i.severity,
        category: i.category,
        description: i.description,
        fix_summary: i.fix_summary,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});