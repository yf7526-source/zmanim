import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isSafeString, isValidEmail, sanitizeHeaderField, safeErrorResponse } from '../../shared/securityUtils.ts';

function encodeUtf8Base64(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function buildRawMessage(from, to, subject, text, replyTo) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: =?UTF-8?B?${encodeUtf8Base64(subject)}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodeUtf8Base64(text),
  ];
  return encodeUtf8Base64(lines.join('\r\n'))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function notifyConnectedGmail(base44, contact) {
  let accessToken;
  try {
    const conn = await base44.asServiceRole.connectors.getConnection('gmail');
    accessToken = conn?.accessToken;
  } catch {
    return { sent: false, reason: 'gmail_not_connected' };
  }
  if (!accessToken) return { sent: false, reason: 'gmail_not_connected' };

  const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) return { sent: false, reason: 'gmail_profile_failed' };

  const profile = await profileRes.json().catch(() => ({}));
  const connectedEmail = profile?.emailAddress;
  if (!isValidEmail(connectedEmail)) return { sent: false, reason: 'gmail_profile_invalid' };

  const safeName = sanitizeHeaderField(contact.name, 100) || 'Website visitor';
  const safeEmail = contact.email.trim();
  const subject = `New SolarZmanim contact message from ${safeName}`;
  const body = [
    'A new Contact Us message was submitted on SolarZmanim.',
    '',
    `Name: ${contact.name}`,
    `Email: ${safeEmail}`,
    '',
    'Message:',
    contact.message,
    '',
    `Contact message ID: ${contact.id}`,
    '',
    'You can also open the SolarZmanim admin dashboard to review and reply.',
  ].join('\n');

  const raw = buildRawMessage(connectedEmail, connectedEmail, subject, body, safeEmail);
  const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!sendRes.ok) return { sent: false, reason: 'gmail_send_failed' };
  return { sent: true };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, message } = await req.json().catch(() => ({}));
    if (!isSafeString(name, 100) || !name.trim()) return Response.json({ error: 'Invalid name' }, { status: 400 });
    if (!isValidEmail(email)) return Response.json({ error: 'Invalid email' }, { status: 400 });
    if (!isSafeString(message, 5000) || !message.trim()) return Response.json({ error: 'Invalid message' }, { status: 400 });

    const record = await base44.asServiceRole.entities.ContactMessage.create({
      name: name.trim(), email: email.trim(), message: message.trim(), status: 'new',
    });

    // The database record is the source of truth. Gmail notification is best-effort so
    // a disconnected/temporary Gmail failure never loses the visitor's message.
    let notification = { sent: false, reason: 'not_attempted' };
    try {
      notification = await notifyConnectedGmail(base44, {
        id: record.id,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
    } catch {
      notification = { sent: false, reason: 'gmail_notification_failed' };
    }

    return Response.json({
      success: true,
      id: record.id,
      gmailNotificationSent: notification.sent,
      notificationStatus: notification.sent ? 'sent' : notification.reason,
    });
  } catch {
    return safeErrorResponse();
  }
});