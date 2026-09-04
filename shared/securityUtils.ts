// Shared security utilities for backend functions.
// Centralizes auth checks and input validation to prevent duplication.

const CRLF_RE = /[\r\n]/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requireAdmin(base44) {
  let user;
  try {
    user = await base44.auth.me();
  } catch {
    return { user: null, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!user) {
    return { user: null, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (user.role !== 'admin') {
    return { user: null, response: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, response: null };
}

export async function requireUser(base44) {
  let user;
  try {
    user = await base44.auth.me();
  } catch {
    return { user: null, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!user) {
    return { user: null, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, response: null };
}

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  if (email.length > 254) return false;
  if (CRLF_RE.test(email)) return false;
  return EMAIL_RE.test(email.trim());
}

// Reject CR/LF injection in header fields; cap length.
export function sanitizeHeaderField(value, maxLength) {
  if (typeof value !== 'string') return null;
  if (value.length > maxLength) return null;
  if (CRLF_RE.test(value)) return null;
  return value;
}

export function isSafeString(value, maxLength) {
  return typeof value === 'string' && value.length <= maxLength;
}

// Validate an ISO date string is parseable and within a reasonable window.
export function isValidIsoDate(value, maxPastDays, maxFutureDays) {
  if (typeof value !== 'string') return false;
  const d = new Date(value);
  if (isNaN(d.getTime())) return false;
  const now = Date.now();
  const pastLimit = now - maxPastDays * 86400000;
  const futureLimit = now + maxFutureDays * 86400000;
  return d.getTime() >= pastLimit && d.getTime() <= futureLimit;
}

export function safeErrorResponse() {
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}