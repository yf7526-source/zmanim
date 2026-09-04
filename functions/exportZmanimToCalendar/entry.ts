import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireUser, isSafeString, isValidIsoDate, safeErrorResponse } from '../../shared/securityUtils.ts';

const CONNECTOR_ID = '6a31aadb4a0fc56d3ca295cc';
const MAX_ZMANIM = 30;
const MAX_LABEL_LEN = 100;
const MAX_LOCATION_LEN = 200;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user, response: authResp } = await requireUser(base44);
    if (authResp) return authResp;

    const { zmanim, date, locationName } = await req.json();

    // Validate zmanim is an array with a safe maximum
    if (!Array.isArray(zmanim) || zmanim.length === 0) {
      return Response.json({ error: 'zmanim must be a non-empty array' }, { status: 400 });
    }
    if (zmanim.length > MAX_ZMANIM) {
      return Response.json({ error: `zmanim exceeds maximum of ${MAX_ZMANIM} entries` }, { status: 400 });
    }

    // Validate locationName if provided
    const safeLocation = locationName != null
      ? (isSafeString(locationName, MAX_LOCATION_LEN) ? locationName : null)
      : '';
    if (locationName != null && safeLocation === null) {
      return Response.json({ error: 'Invalid locationName' }, { status: 400 });
    }

    // Validate each zmanim entry
    const validEntries = [];
    for (const zman of zmanim) {
      if (!zman || typeof zman !== 'object') {
        return Response.json({ error: 'Invalid zmanim entry' }, { status: 400 });
      }
      if (!isSafeString(zman.label, MAX_LABEL_LEN)) {
        return Response.json({ error: 'Invalid zmanim label' }, { status: 400 });
      }
      if (!isValidIsoDate(zman.time, 365, 730)) {
        return Response.json({ error: `Invalid or out-of-range date for "${zman.label}"` }, { status: 400 });
      }
      validEntries.push({ label: zman.label, time: zman.time });
    }

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'Google Calendar not connected', notConnected: true }, { status: 403 });
    }

    const results = [];
    for (const zman of validEntries) {
      const start = new Date(zman.time);
      const end = new Date(start.getTime() + 15 * 60000); // 15 min duration

      const event = {
        summary: `${zman.label} — ${safeLocation || 'Zmanim'}`,
        description: `Halachic time: ${zman.label}\nLocation: ${safeLocation || ''}`,
        start: { dateTime: start.toISOString(), timeZone: 'UTC' },
        end: { dateTime: end.toISOString(), timeZone: 'UTC' },
        colorId: '5', // banana yellow
      };

      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );
      const data = await res.json();
      results.push({ label: zman.label, success: res.ok, id: data.id });
    }

    return Response.json({ results });
  } catch (error) {
    return safeErrorResponse();
  }
});