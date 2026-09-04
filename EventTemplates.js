// Predefined event templates for quick selection in CustomEventEditor.
// Each template provides default title, optional time, and reminder setting.
export const EVENT_TEMPLATES = [
  { icon: '🕯️', title: { en: 'Candle Lighting', he: 'הדלקת נרות' }, time: null, reminder: true },
  { icon: '🍷', title: { en: 'Havdalah', he: 'הבדלה' }, time: null, reminder: true },
  { icon: '📅', title: { en: 'Yahrtzeit', he: 'יארצייט' }, time: null, reminder: true },
  { icon: '🎂', title: { en: 'Birthday', he: 'יום הולדת' }, time: null, reminder: false },
  { icon: '💍', title: { en: 'Anniversary', he: 'יום נישואין' }, time: null, reminder: false },
  { icon: '📚', title: { en: 'Siyum', he: 'סיום' }, time: null, reminder: true },
  { icon: '🍽️', title: { en: 'Seudah', he: 'סעודה' }, time: null, reminder: false },
  { icon: '⛪', title: { en: 'Bar/Bat Mitzvah', he: 'בר/בת מצווה' }, time: null, reminder: true },
  { icon: '🍼', title: { en: 'Brit Milah', he: 'ברית מילה' }, time: '08:00', reminder: true },
  { icon: '🗣️', title: { en: 'Shiur', he: 'שיעור' }, time: '20:30', reminder: true },
  { icon: '🤝', title: { en: 'Meeting', he: 'פגישה' }, time: null, reminder: true },
  { icon: '🏥', title: { en: 'Appointment', he: 'תור' }, time: null, reminder: true },
  { icon: '✈️', title: { en: 'Travel', he: 'נסיעה' }, time: null, reminder: true },
  { icon: '🎯', title: { en: 'Reminder', he: 'תזכורת' }, time: null, reminder: true },
];

export function getTemplateLabel(tpl, lang) {
  if (lang === 'he') return tpl.title.he;
  if (lang === 'en') return tpl.title.en;
  return `${tpl.title.en} · ${tpl.title.he}`;
}