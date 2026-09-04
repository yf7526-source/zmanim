// Holiday descriptions for the calendar event popup. Extracted from the
// JewishCalendarSheet component so the data lives in one place and is easy
// to extend without touching component code.

const EVENT_DESCRIPTIONS = {
  'rosh hashana': 'ראש השנה — The Jewish New Year. Two-day holiday marking the creation of Adam and Eve and the beginning of the Ten Days of Repentance.',
  'yom kippur': 'יום הכיפורים — The Day of Atonement. The holiest day of the year, marked by fasting and intensive prayer.',
  'sukkot': 'סוכות — Feast of Tabernacles. Seven-day festival commemorating the Israelites\' dwelling in booths in the wilderness.',
  'shmini atzeret': 'שמיני עצרת — The eighth day of assembly, a separate festival following Sukkot.',
  'simchat torah': 'שמחת תורה — Rejoicing of the Torah. Celebration marking the completion and restarting of the annual Torah reading cycle.',
  'chanukah': 'חנוכה — Festival of Lights. Eight-day commemoration of the rededication of the Second Temple.',
  'purim': 'פורים — Festival celebrating the salvation of the Jewish people in ancient Persia as told in the Book of Esther.',
  'pesach': 'פסח — Passover. Seven/eight-day festival commemorating the Exodus from Egypt.',
  'shavuot': 'שבועות — Festival of Weeks. Celebrating the giving of the Torah at Mount Sinai.',
  'tish\'a b\'av': 'תשעה באב — Fast day commemorating the destruction of both Temples in Jerusalem.',
  'tisha b\'av': 'תשעה באב — Fast day commemorating the destruction of both Temples in Jerusalem.',
  'tu bishvat': 'ט"ו בשבט — New Year of the Trees.',
  'tu b\'shvat': 'ט"ו בשבט — New Year of the Trees.',
  'rosh chodesh': 'ראש חודש — The beginning of a new Hebrew month.',
  'asara b\'tevet': 'עשרה בטבת — Fast day commemorating the siege of Jerusalem.',
  'tzom gedaliah': 'צום גדליה — Fast of Gedaliah.',
  'taanit esther': 'תענית אסתר — Fast of Esther, preceding Purim.',
  'shiva asar b\'tammuz': 'שבעה עשר בתמוז — Fast day marking the breaching of Jerusalem\'s walls.',
  '17th of tammuz': 'שבעה עשר בתמוז — Fast day marking the breaching of Jerusalem\'s walls.',
};

export function getEventDescription(title) {
  const lower = (title || '').toLowerCase();
  for (const [key, desc] of Object.entries(EVENT_DESCRIPTIONS)) {
    if (lower.includes(key)) return desc;
  }
  return null;
}