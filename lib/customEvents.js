// Shared utilities for custom events: localStorage access and recurring event matching.

export function dateKey(date, tz) {
  if (tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        timeZone: tz,
      }).formatToParts(date);
      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;
      if (y && m && d) return `${y}-${m}-${d}`;
    } catch {}
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getAllCustomEvents() {
  try {
    const saved = localStorage.getItem('customEvents');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function matchesRecurrence(event, targetDate, tz) {
  if (!event.recurrence || event.recurrence === 'none') {
    return event.date === dateKey(targetDate, tz);
  }
  const eventDate = new Date(event.date + 'T00:00:00');
  const target = new Date(dateKey(targetDate, tz) + 'T00:00:00');
  if (isNaN(eventDate.getTime()) || target < eventDate) return false;
  switch (event.recurrence) {
    case 'daily':
      return true;
    case 'weekly':
      return eventDate.getDay() === target.getDay();
    case 'monthly':
      return eventDate.getDate() === target.getDate();
    default:
      return false;
  }
}

export function getCustomEventsForDate(date, tz) {
  const all = getAllCustomEvents();
  return all
    .filter(e => matchesRecurrence(e, date, tz))
    .map(e => ({ ...e, category: 'custom', hebrew: e.title }));
}

export const RECURRENCE_LABELS = {
  none: { en: 'No repeat', he: 'ללא חזרה' },
  daily: { en: 'Daily', he: 'יומי' },
  weekly: { en: 'Weekly', he: 'שבועי' },
  monthly: { en: 'Monthly', he: 'חודשי' },
};

export const REMINDER_LABELS = {
  0: { en: 'At time of event', he: 'בזמן האירוע' },
  5: { en: '5 min before', he: '5 דקות לפני' },
  10: { en: '10 min before', he: '10 דקות לפני' },
  15: { en: '15 min before', he: '15 דקות לפני' },
  30: { en: '30 min before', he: 'חצי שעה לפני' },
  60: { en: '1 hour before', he: 'שעה לפני' },
  1440: { en: '1 day before', he: 'יום לפני' },
};