// Shared config for notifiable zmanim — keys MUST match sunTimes object keys
export const NOTIFIABLE_ZMANIM = [
  { key: 'alot_16_1',        label: 'Alot HaShachar',    labelHe: 'עלות השחר',       emoji: '🌅' },
  { key: 'misheyakir_11_5',  label: 'Misheyakir',         labelHe: 'משיכיר',          emoji: '📿' },
  { key: 'netz',             label: 'Netz (Sunrise)',     labelHe: 'נץ החמה',         emoji: '🌄' },
  { key: 'shema_gra',        label: 'Sof Zman Shema',    labelHe: 'סוף זמן שמע',     emoji: '📖' },
  { key: 'tefilla_gra',      label: 'Sof Zman Tefilla',  labelHe: 'סוף זמן תפילה',   emoji: '🕍' },
  { key: 'chatzot',          label: 'Chatzot',            labelHe: 'חצות',            emoji: '☀️' },
  { key: 'minchaGedola_gra', label: 'Mincha Gedola',     labelHe: 'מנחה גדולה',      emoji: '🕌' },
  { key: 'minchaKetana_gra', label: 'Mincha Ketana',     labelHe: 'מנחה קטנה',       emoji: '🕗' },
  { key: 'plagHaMincha_gra', label: 'Plag HaMincha',     labelHe: 'פלג המנחה',       emoji: '🌇' },
  { key: 'shkiah',           label: 'Shkiah (Sunset)',    labelHe: 'שקיעה',           emoji: '🌆' },
  { key: 'tzait_8_5',        label: 'Tzait Kochavim',    labelHe: 'צאת הכוכבים',     emoji: '⭐' },
  { key: 'chatzotNight',     label: 'Chatzot HaLayla',   labelHe: 'חצות הלילה',      emoji: '🌙' },
];

export const NOTIFIER_STORAGE_KEY = 'zmanimNotifierPrefs';

export const LEAD_TIME_OPTIONS = [5, 10, 15, 20, 30, 60];

export function loadNotifierPrefs() {
  try {
    const s = localStorage.getItem(NOTIFIER_STORAGE_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      // Migrate old keys to new ones
      const migrated = { ...parsed };
      if (migrated.selected) {
        migrated.selected = migrated.selected.map(k => {
          if (k === 'sofZmanShma') return 'shema_gra';
          if (k === 'sofZmanTfilla') return 'tefilla_gra';
          if (k === 'minchaGedola') return 'minchaGedola_gra';
          if (k === 'tzait') return 'tzait_8_5';
          return k;
        });
      }
      return migrated;
    }
  } catch {}
  return { enabled: false, leadMinutes: 10, selected: ['shema_gra', 'shkiah'], sound: true };
}

export function saveNotifierPrefs(p) {
  try { localStorage.setItem(NOTIFIER_STORAGE_KEY, JSON.stringify(p)); } catch {}
}