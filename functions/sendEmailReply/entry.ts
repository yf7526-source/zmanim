import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin, isValidEmail, sanitizeHeaderField, isSafeString, safeErrorResponse } from '../../shared/securityUtils.ts';

// Minimal RFC 2822 message builder with proper base64url encoding for Gmail API
function buildRawMessage(from, to, subject, text) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(text))),
  ];
  return btoa(unescape(encodeURIComponent(lines.join('\r\n'))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user, response: authResp } = await requireAdmin(base44);
    if (authResp) return authResp;

    const { to, subject, body, recipientName } = await req.json();

    // Validate required string fields
    if (!isValidEmail(to)) {
      return Response.json({ error: 'Invalid recipient email' }, { status: 400 });
    }
    const safeSubject = sanitizeHeaderField(subject, 200);
    if (safeSubject === null) {
      return Response.json({ error: 'Invalid subject' }, { status: 400 });
    }
    if (!isSafeString(body, 10000)) {
      return Response.json({ error: 'Invalid body' }, { status: 400 });
    }
    const safeRecipientName = recipientName != null ? (isSafeString(recipientName, 100) ? recipientName : null) : null;
    if (recipientName != null && safeRecipientName === null) {
      return Response.json({ error: 'Invalid recipient name' }, { status: 400 });
    }

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('gmail');
      accessToken = conn?.accessToken;
    } catch {
      return Response.json({ error: 'Gmail not connected', notConnected: true }, { status: 403 });
    }

    if (!accessToken) {
      return Response.json({ error: 'Gmail not connected', notConnected: true }, { status: 403 });
    }

    // Get the connected account's email address for the From header
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      return Response.json({ error: 'Could not read Gmail profile' }, { status: profileRes.status });
    }
    const profile = await profileRes.json();
    const fromAddress = profile.emailAddress || 'me';

    const emailBody = safeRecipientName
      ? `Hi ${safeRecipientName},\n\n${body}\n\nBest regards,\nThe Zmanim Team`
      : `${body}\n\nBest regards,\nThe Zmanim Team`;

    const raw = buildRawMessage(fromAddress, to.trim(), safeSubject, emailBody);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      return Response.json({ error: 'Failed to send email' }, { status: res.status });
    }

    return Response.json({ success: true });
  } catch (error) {
    return safeErrorResponse();
  }
});