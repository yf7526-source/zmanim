export const translations = {
  en: {
    backToZmanim: 'Back to Zmanim', settings: 'Settings', settingsSubtitle: 'Manage calculation, display, calendar, and notification preferences from the main settings panel.',
    settingsSystem: 'One settings system', settingsBody: 'Use the Home settings panel so calculation and display preferences stay consistent throughout SolarZmanim.',
    openSettings: 'Open settings on Home', loading: 'Loading', siteNavigation: 'Site navigation', select: 'Select', errorLoadingTerms: 'Could not load glossary terms. Please try again.'
  },
  he: {
    backToZmanim: 'חזרה לזמנים', settings: 'הגדרות', settingsSubtitle: 'ניהול העדפות חישוב, תצוגה, לוח שנה והתראות בחלונית ההגדרות הראשית.',
    settingsSystem: 'מערכת הגדרות אחת', settingsBody: 'השתמשו בחלונית ההגדרות במסך הבית כדי שהעדפות החישוב והתצוגה יהיו אחידות בכל SolarZmanim.',
    openSettings: 'פתיחת ההגדרות במסך הבית', loading: 'טוען', siteNavigation: 'ניווט באתר', select: 'בחירה', errorLoadingTerms: 'לא ניתן לטעון את המונחים. נסו שוב.'
  }
};

export function translate(lang, key) {
  const en = translations.en[key] || key;
  const he = translations.he[key] || en;
  if (lang === 'he') return he;
  if (lang === 'both') return `${he} · ${en}`;
  return en;
}