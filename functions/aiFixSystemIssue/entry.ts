import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const ADMIN_EMAILS = ['y553231838@gmail.com', 'yf7526@gmail.com'];

const APP_CONTEXT = `
You are the AI engine for a production Jewish Zmanim (prayer times) and calendar web app.
The app is built with React + Tailwind CSS + Vite, hosted on Base44 (backend-as-a-service).

## Architecture
- Frontend: React 18, Tailwind CSS, shadcn/ui components (in @/components/ui/), lucide-react icons
- Charts: recharts (line, area, bar, composed charts)
- PDF: jspdf + html2canvas for export
- Maps: react-leaflet for location visualization
- Animations: framer-motion
- State: React hooks + localStorage for persistence
- Backend: Base44 SDK (base44.entities.EntityName for CRUD, base44.functions.invoke for backend calls)
- Auth: Base44 AuthProvider, ProtectedRoute for gated pages

## Key Source Files
- src/pages/Home.jsx — main dashboard, solar visualization, zmanim display, location management
- src/pages/Dashboard.jsx — admin dashboard with Messages, Analytics, System Health, AI Fix tabs
- src/components/ZmanimCard.jsx — prayer times card with expandable halachic opinions
- src/components/JewishCalendarSheet.jsx — Hebrew/Gregorian calendar grid with holiday coloring
- src/components/DayZmanimDetail.jsx — daily zmanim detail modal with PDF export
- src/components/MonthlyZmanimSheet.jsx — monthly/weekly zmanim table + PDF export
- src/components/SunCircle.jsx — solar arc visualization showing sun position
- src/components/SettingsSheet.jsx — halachic opinion configuration (Alot, Tzait, MGA/GRA, etc.)
- src/components/CityPicker.jsx — location selection with GPS and favorites
- src/components/AnalyticsTab.jsx — analytics dashboard with charts and map
- src/components/SystemHealthTab.jsx — system health monitoring
- src/components/AiFixTab.jsx — AI fix chat interface (this is where you live)
- src/components/CalendarSettingsPanel.jsx — calendar color customization
- src/components/CustomZmanManager.jsx — custom zmanim definitions
- src/components/PdfPreviewModal.jsx — PDF preview with zoom controls
- src/components/PdfDownloadOptionsModal.jsx — PDF format/options selector
- src/components/DaylightChart.jsx — yearly daylight duration chart
- src/components/HebrewYearSeasonalChart.jsx — Hebrew year seasonal patterns
- src/components/YearlyMoonChart.jsx — monthly lunar data visualization
- src/components/ZmanOpinionTracker.jsx — yearly zmanim comparison
- src/lib/hebcalApi.js — Hebcal API integration (zmanim + holiday events)
- src/lib/sunCalc.js — local solar calculations, Hebrew date conversion
- src/lib/holidayDetection.js — Yom Tov / fast day / Erev detection logic
- src/lib/timezone.js — timezone-aware time formatting
- src/lib/customEvents.js — custom event recurrence matching
- src/lib/geocoding.js — location search and geocoding
- src/App.jsx — router with auth-protected routes

## Entities (database)
- SystemCheck — health check issues (severity, category, fix_status)
- ContactMessage — contact form submissions
- SavedLocation — user's saved locations
- SearchHistory — location search tracking
- AnalyticsEvent — visit and search events
- CustomZman — user-defined zmanim
- UserEvent — custom calendar events
- BugReport — user-submitted bug reports
- HalachicTerm — glossary terms
- PdfExportHistory — PDF export logs

## Backend Functions
- aiFixSystemIssue (you) — AI-powered code analysis and fix generation
- runSystemChecks — automated health monitoring
- sendEmailReply — admin email replies via Gmail
- exportZmanimToCalendar — Google Calendar sync
- submitContactMessage — contact form handler
- trackEvent — analytics tracking
- sendAnalyticsSummary — monthly report emails

## Design System
- Dark theme with gold accents (hsl variables in src/index.css)
- Glass morphism effects (.glass, .glass-strong classes)
- Glow effects (.glow-gold, .glow-sun, .glow-text)
- Fonts: Heebo (heading), Inter (body)
- Tailwind classes: bg-background, text-foreground, bg-primary, text-primary, border-border
- Card hover: .card-hover class
- Responsive: mobile-first, safe-area padding for iOS

## Coding Conventions
- Every component exported as default, named same as file
- Icons from lucide-react only
- shadcn/ui from @/components/ui/
- Import alias: @/ (never relative src/ paths)
- Tailwind classes as literal strings (no dynamic class names)
- Entity SDK: base44.entities.EntityName.list/filter/create/update/delete

## Capabilities
You can analyze bugs, propose fixes, design new features, create entire components,
refactor code, suggest architectural improvements, and research halachic or technical topics.
When creating new features, provide complete, production-ready code that follows the conventions above.
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { issue_id, mode = 'discuss', free_form_description, attempt = 1, step = 'preview' } = body;

    if (!issue_id && !free_form_description) {
      return Response.json({ error: 'Either issue_id or free_form_description is required' }, { status: 400 });
    }

    // The running function cannot write to or deploy the app source tree.
    // Approval records intent but must never claim that generated code was applied.
    if (step === 'apply') {
      if (!issue_id) return Response.json({ error: 'issue_id required for apply step' }, { status: 400 });
      const issue = await base44.asServiceRole.entities.SystemCheck.get(issue_id);
      if (!issue) return Response.json({ error: 'Issue not found' }, { status: 404 });
      await base44.asServiceRole.entities.SystemCheck.update(issue_id, {
        fix_status: 'fixing',
        fix_mode: mode,
        fix_summary: body.fix_summary || issue.fix_summary || 'Proposal approved; source change and deployment still required',
      });
      return Response.json({
        status: 'approved_pending_deployment',
        mode,
        attempt,
        issue_id,
        message: 'Proposal approved. Apply the generated code to the source repository, verify it, and deploy before marking this issue fixed.',
      });
    }

    // ── REJECT step: admin rejected the preview ──
    if (step === 'reject') {
      if (!issue_id) return Response.json({ error: 'issue_id required for reject step' }, { status: 400 });
      await base44.asServiceRole.entities.SystemCheck.update(issue_id, {
        fix_status: 'none',
        fix_summary: body.reason || 'Preview rejected by admin — issue remains open',
      });
      return Response.json({ status: 'rejected', issue_id });
    }

    // Fetch the issue if issue_id provided
    let issue = null;
    if (issue_id) {
      issue = await base44.asServiceRole.entities.SystemCheck.get(issue_id);
      if (!issue) return Response.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Build the prompt for the LLM
    const issueContext = issue
      ? `Detected Issue:\n  Category: ${issue.category}\n  Severity: ${issue.severity}\n  Description: ${issue.description}\n  Check Name: ${issue.check_name}`
      : `Free-form bug report from admin:\n  "${free_form_description}"`;

    const modeInstruction = mode === 'create'
      ? `CREATE MODE: You are building a NEW feature, component, or capability for the app.
    The admin has described what they want. Design and implement it fully.

    Provide:
    1. ANALYSIS: What the feature does, how it fits into the existing app architecture
    2. FILE: The exact file path where the new code should live (e.g. src/components/NewFeature.jsx)
    3. FIX_DESCRIPTION: A clear summary of what you're building — the component structure, props, state, key logic
    4. CODE_AFTER: The COMPLETE, production-ready code for the new file. Follow all conventions:
       - Export default, named same as file
       - Use Tailwind classes (literal strings only)
       - Icons from lucide-react
       - shadcn/ui from @/components/ui/
       - Import alias @/ (never relative src/ paths)
       - Responsive design (mobile + desktop)
       - Match the dark gold-accent theme
    5. VERIFICATION: How to test and verify the feature works
    6. RISKS: Edge cases, performance considerations, or integration concerns
    7. CONFIDENCE: high/medium/low

    If the feature requires changes to multiple files (e.g. a new route in App.jsx),
    include those changes in CODE_AFTER with clear file separators like:
    // === FILE: src/App.jsx ===
    // === FILE: src/components/NewFeature.jsx ===

    Be thorough. Write complete, working code — not pseudocode or fragments.`
      : mode === 'working'
      ? `WORKING MODE (PREVIEW STEP): Generate a proposed fix for admin review BEFORE applying.
    Provide:
    1. ROOT_CAUSE: What is causing this issue
    2. FIX_FILE: Which source file needs to change (exact path)
    3. FIX_DESCRIPTION: Exactly what to change (function name, what to add/remove/modify)
    4. CODE_BEFORE: The current code that needs changing (exact snippet from the file)
    5. CODE_AFTER: The corrected code block (the full replacement)
    6. VERIFICATION: How to verify the fix works
    7. CONFIDENCE: high/medium/low
    The admin will review this preview and approve before the fix is applied.`
      : `DISCUSS MODE: You are analyzing and suggesting a fix WITHOUT applying. Provide:
    1. ANALYSIS: What is likely causing this issue
    2. SUGGESTED_FILE: Which source file probably needs attention
    3. SUGGESTED_FIX: What change you recommend (describe the approach)
    4. CODE_SUGGESTION: Example code snippet showing the fix
    5. RISKS: Any risks or edge cases to watch for
    6. QUESTIONS: Any clarifying questions before applying`;

    const prompt = `${APP_CONTEXT}

${issueContext}

${modeInstruction}

Respond in structured plain text with the section headers above. Be concise but specific.`;

    // Mark issue as "fixing" if working mode
    if (issue && mode === 'working') {
      await base44.asServiceRole.entities.SystemCheck.update(issue_id, {
        fix_status: 'fixing',
        fix_attempts: attempt,
        fix_mode: mode,
      });
    }

    // Use Claude Sonnet for high-capability code generation
    // Enable web search for create mode so the AI can research halachic/technical topics
    const useWebSearch = mode === 'create';
    const model = useWebSearch ? 'gemini_3_1_pro' : 'claude_sonnet_4_6';

    // Call the LLM with a high-capability model
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model,
      add_context_from_internet: useWebSearch,
      response_json_schema: {
        type: 'object',
        properties: {
          analysis: { type: 'string' },
          file: { type: 'string' },
          fix_description: { type: 'string' },
          code_before: { type: 'string' },
          code_after: { type: 'string' },
          code_snippet: { type: 'string' },
          verification: { type: 'string' },
          risks: { type: 'string' },
          confidence: { type: 'string' },
          can_fix: { type: 'boolean' },
        },
        required: ['analysis', 'fix_description', 'can_fix'],
      },
    });

    const result = llmResponse.data || llmResponse;
    const canFix = result.can_fix !== false;
    const summary = result.fix_description || result.analysis || 'No details returned';

    // Create mode: always return as preview for admin review
    if (mode === 'create') {
      return Response.json({
        status: 'preview',
        mode: 'create',
        attempt,
        can_fix: canFix,
        confidence: result.confidence || 'unknown',
        analysis: result.analysis,
        file: result.file || '',
        fix_description: result.fix_description,
        code_before: result.code_before || '',
        code_after: result.code_after || result.code_snippet || '',
        verification: result.verification || '',
        risks: result.risks || '',
        issue_id: issue_id || null,
      });
    }

    // In working mode: return as PREVIEW — do NOT mark as fixed yet
    // Admin must review and approve via step='apply'
    if (mode === 'working') {
      if (!canFix) {
        if (attempt < 3) {
          return Response.json({
            status: 'retrying',
            attempt,
            max_attempts: 3,
            message: `AI could not generate a fix on attempt ${attempt}. Retrying with different approach...`,
            partial_analysis: result.analysis,
          });
        }
        // Mark as failed after 3 attempts
        if (issue) {
          await base44.asServiceRole.entities.SystemCheck.update(issue_id, {
            fix_status: 'failed',
            fix_attempts: attempt,
            fix_mode: mode,
            fix_summary: `AI unable to fix after ${attempt} attempts. Escalating to manual review.`,
          });
        }
        return Response.json({
          status: 'failed',
          mode,
          attempt,
          can_fix: false,
          analysis: result.analysis,
          issue_id: issue_id || null,
        });
      }

      // Return preview — waiting for admin approval
      if (issue) {
        await base44.asServiceRole.entities.SystemCheck.update(issue_id, {
          fix_status: 'fixing',
          fix_attempts: attempt,
          fix_mode: mode,
          fix_summary: 'Preview generated — waiting for admin approval',
        });
      }

      return Response.json({
        status: 'preview',
        mode,
        attempt,
        can_fix: canFix,
        confidence: result.confidence || 'unknown',
        analysis: result.analysis,
        file: result.file || '',
        fix_description: result.fix_description,
        code_before: result.code_before || '',
        code_after: result.code_after || result.code_snippet || '',
        verification: result.verification || '',
        risks: result.risks || '',
        issue_id: issue_id || null,
      });
    }

    // Discuss mode — just return analysis, no status change
    return Response.json({
      status: 'none',
      mode: 'discuss',
      attempt,
      can_fix: canFix,
      confidence: result.confidence || 'unknown',
      analysis: result.analysis,
      file: result.file || '',
      fix_description: result.fix_description,
      code_snippet: result.code_snippet || result.code_suggestion || '',
      verification: result.verification || '',
      risks: result.risks || '',
      issue_id: issue_id || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});