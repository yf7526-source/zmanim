import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isSafeString, safeErrorResponse } from '../../shared/securityUtils.ts';

const ALLOWED_EVENT_TYPES = new Set(['visit', 'location_search', 'gps_signin']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event_type, location_name, lat, lng, description } = await req.json().catch(() => ({}));

    if (!ALLOWED_EVENT_TYPES.has(event_type)) {
      return Response.json({ error: 'Invalid event_type' }, { status: 400 });
    }
    if (location_name != null && !isSafeString(location_name, 200)) return Response.json({ error: 'Invalid location_name' }, { status: 400 });
    if (description != null && !isSafeString(description, 1000)) return Response.json({ error: 'Invalid description' }, { status: 400 });
    if (lat != null && (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90)) return Response.json({ error: 'Invalid latitude' }, { status: 400 });
    if (lng != null && (typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180)) return Response.json({ error: 'Invalid longitude' }, { status: 400 });

    // For gps_signin events, try to attach the user's email
    let user_email = undefined;
    if (event_type === 'gps_signin') {
      try {
        const user = await base44.auth.me();
        user_email = user?.email || undefined;
      } catch {}
    }

    await base44.asServiceRole.entities.AnalyticsEvent.create({
      event_type,
      location_name: location_name || undefined,
      lat: typeof lat === 'number' ? lat : undefined,
      lng: typeof lng === 'number' ? lng : undefined,
      user_email: user_email || undefined,
      description: description || undefined,
    });

    return Response.json({ success: true });
  } catch {
    return safeErrorResponse();
  }
});