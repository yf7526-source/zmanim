import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin, safeErrorResponse } from '../../shared/securityUtils.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user, response: authResp } = await requireAdmin(base44);
    if (authResp) return authResp;

    // Fetch all analytics events (paginate if needed)
    let allEvents = [];
    let skip = 0;
    const limit = 500;
    while (true) {
      const batch = await base44.asServiceRole.entities.AnalyticsEvent.list('-created_date', limit, skip);
      allEvents = allEvents.concat(batch);
      if (batch.length < limit) break;
      skip += limit;
      if (skip > 5000) break; // safety cap
    }

    // Determine the past month range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let visitCount = 0;
    let locationSearchCount = 0;
    const locCounts = {};

    for (const ev of allEvents) {
      if (!ev.created_date) continue;
      const d = new Date(ev.created_date);
      if (d < monthStart || d > monthEnd) continue;

      if (ev.event_type === 'visit') {
        visitCount++;
      } else if (ev.event_type === 'location_search') {
        locationSearchCount++;
        if (ev.location_name) {
          locCounts[ev.location_name] = (locCounts[ev.location_name] || 0) + 1;
        }
      }
    }

    const topLocations = Object.entries(locCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Build daily visit series for the month
    const dailyVisits = [];
    const cursor = new Date(monthStart);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= monthEnd) {
      let count = 0;
      for (const ev of allEvents) {
        if (ev.event_type === 'visit' && ev.created_date) {
          const d = new Date(ev.created_date);
          if (d.toDateString() === cursor.toDateString()) count++;
        }
      }
      dailyVisits.push({ date: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Build email body
    const locLines = topLocations.length > 0
      ? topLocations.map(([name, count], i) => `  ${i + 1}. ${name} — ${count} searches`).join('\n')
      : '  No location searches recorded.';

    const dailyLines = dailyVisits.map(d => `  ${d.date}: ${d.count} visits`).join('\n');

    const subject = `Zmanim Analytics Summary — ${monthName}`;
    const body = `Hello,

Here is your monthly analytics summary for ${monthName}:

📊 Overview
  Total Visits: ${visitCount}
  Location Searches: ${locationSearchCount}

🏆 Top 10 Searched Cities
${locLines}

📅 Daily Visit Breakdown
${dailyLines}

— Zmanim Analytics`;

    // Send via Gmail connector
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('gmail');
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'Gmail not connected' }, { status: 403 });
    }

    // Get sender address
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();
    const fromAddress = profile.emailAddress || 'me';

    const ADMIN_EMAIL = 'y553231838@gmail.com';

    // Build RFC 2822 message
    const lines = [
      `From: ${fromAddress}`,
      `To: ${ADMIN_EMAIL}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      btoa(unescape(encodeURIComponent(body))),
    ];
    const raw = btoa(unescape(encodeURIComponent(lines.join('\r\n'))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!sendRes.ok) {
      return Response.json({ error: 'Failed to send email' }, { status: sendRes.status });
    }

    return Response.json({ success: true, month: monthName, visitCount, locationSearchCount });
  } catch (error) {
    return safeErrorResponse();
  }
});