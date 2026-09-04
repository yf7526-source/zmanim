import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';

export default function ZmanimGuide() {
  const { lang } = useLanguage();
  const he = lang === 'he';
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.HalachicTerm.list('order', 50)
      .then(setTerms)
      .catch(() => setTerms([]))
      .finally(() => setLoading(false));
  }, []);

  const intro = he ? [
    'זמנים (זמן ביחיד) הם הזמנים ההלכתיים המדויקים המנחים את שמירת היום היהודי. מהרגע המוקדם ביותר להנחת טלית ותפילין ועד זמן אחרון לקריאת שמע, כל זמן נגזר ממיקום השמש ביחס לאופק. מכיוון שזמנים אלו תלויים לחלוטין במיקום הגיאוגרפי, הגובה והעונה, הם משתנים מדי יום ושונים מעיר לעיר. חישוב זמנים מדויק דורש נתונים אסטרונומיים מדויקים יחד עם הגדרות הלכתיות שנדונו וחודדו על ידי רבנים ואסטרונומים במשך מאות שנים.',
    'היום ההלכתי מתחיל בצאת הכוכבים, לא בחצות הלילה. עלות השחר מסמן את הופעת האור הראשונה באופק המזרחי והוא הזמן המוקדם ביותר למצוות מסוימות. משיכיר הוא הרגע שבו יש מספיק אור להבחין בין תכלת (חוט כחול) ללבן, הזמן המוקדם להנחת טלית ותפילין. נץ החמה הוא רגע הופעת קצה השמש מעל האופק — הזמן שבו יש לקרוא קריאת שמע לראשונה לדעת הגר"א. חצות הוא אמצע היום השמשי, נקודת אמצע בין הנץ לשקיעה, והזמן האחרון לקריאת שמע של שחרית לדעות מסוימות.',
    'אחר הצהריים מביא את מנחה גדולה, הזמן המוקדם לתפילת מנחה, המחושב כחצי שעה זמנית לאחר חצות. מנחה קטנה, הזמן הרצוי למנחה, מתחיל בתשע וחצי שעות זמניות לתוך היום. שקיעה מסמנת את המעבר מיום ללילה, וצאת הכוכבים — כאשר שלושה כוכבים בינוניים נראים — מסמנת את תחילת הלילה ההלכתי ואת זמן מעריב, הבדלה וסיום שבת ויום טוב.',
    'שעה זמנית מחושבת על ידי חלוקת פרק האור (מהנץ עד שקיעה) לשנים עשר חלקים שווים. שתי שיטות החישוב העיקריות הן הגר"א (הגאון מווילנה), המודד מהנץ עד שקיעה, והמגן אברהם, המודד מעלות השחר עד צאת הכוכבים. קהילות שונות נוהגות לפי דעות שונות, והאפליקציה מאפשרת לבחור את המנהג התואם לכם.',
  ] : [
    'Zmanim (זמנים, singular zman) are the specific halachic times that govern Jewish daily observance. From the earliest moment one may don tallit and tefillin to the latest time to recite the Shema, each zman is derived from the sun\u2019s position relative to the horizon. Because these times depend entirely on geographic location, elevation, and season, they shift every day and differ from city to city. Accurate zmanim calculation requires precise astronomical data combined with halachic definitions that have been debated and refined by rabbis and astronomers for centuries.',
    'The halachic day begins at nightfall, not midnight. Alot HaShachar (dawn) marks the first appearance of light on the eastern horizon and is the earliest time for certain mitzvot. Misheyakir is the point at which there is enough light to distinguish between techelet (blue thread) and white, the earliest time to wear tallit and tefillin. Netz Hachama (sunrise) is when the sun\u2019s upper edge appears above the horizon \u2014 the time by which Shema must first be recited according to the GRA. Chatzot (midday) is the solar noon, the midpoint between sunrise and sunset, and the latest time for the morning Shema according to some opinions.',
    'The afternoon brings Mincha Gedolah, the earliest time for the afternoon prayer, calculated as half a shaah zmanit (proportional hour) after chatzot. Mincha Ketanah, the preferred time for Mincha, begins at nine and a half shaot zmaniot into the day. Shkiah (sunset) marks the transition from day to night, and Tzait Kochavim (nightfall) \u2014 when three medium stars are visible \u2014 marks the beginning of the halachic night and the time for Maariv, Havdalah, and the end of Shabbat and Yom Tov.',
    'A shaah zmanit, or proportional hour, is calculated by dividing the daylight period (from sunrise to sunset) into twelve equal parts. The two primary calculation systems are the GRA (Vilna Gaon), which measures from sunrise to sunset, and the Magen Avraham (MGA), which measures from alot hashachar to tzait kochavim. Different communities follow different opinions, and our app lets you select the custom that matches your practice.',
  ];

  const methodology = he ? [
    ['נתונים עיקריים', 'ערכי הספק היומיים מגיעים משירות הזמנים של Hebcal. דעות נוספות נגזרות מזוויות שקיעה מתועדות, היסטים בדקות קבועות, או נוסחאות שעה זמנית.'],
    ['בטיחות אזור זמן', 'תאריכים ושעות מוצגות נפתרים באזור הזמן IANA של המיקום הנבחר. פערי שעון קיץ נדחים במקום להזיז את השעה המבוקשת בשקט.'],
    ['גובה ואופק', 'גובה גיאומטרי והתאמות אופק ידניות הם בלעדיים הדדית, למניעת הפעלת אותה תיקון פעמיים. גובה גיאומטרי אינו ממדל בניינים, עצים, רכסים או ראות ראשונה בפועל.'],
    ['דעות', 'גר"א, מגן אברהם, בעל התניא, רבנו תם, הדלקת נרות ובחירות צאת הכוכבים מייצגות שיטות חישוב שונות. תווית אינה פסק שהשיטה מתאימה לכל קהילה.'],
    ['קווי רוחב גבוהים', 'זוויות בין השמשות מסוימות אינן מתרחשות בתאריכים מסוימים בקווי רוחב גבוהים. האפליקציה עשויה להציג זמן לא זמין במקום להמציא מעבר. יש לשאול רב מוסמך איזו שיטה חלופית להשתמש.'],
    ['אימות', 'בדיקות רגרסיה אוטומטיות מכסות המרת תאריך עברי, התהפכות חודש, גבולות שעון קיץ, סדר שמש, גבולות ירח, אימות קלט ואצוות ספק ל־180 יום. עם זאת, יש להשוות תוצאות ייצור עם לוח מקומי מהימן לפני שימוש קהילתי.'],
  ] : [
    ['Primary data', 'Daily provider values come from the Hebcal zmanim service. Additional opinions are derived from documented solar depression angles, fixed-minute offsets, or proportional-hour formulas.'],
    ['Timezone safety', 'Dates and displayed times are resolved in the selected location\u2019s IANA timezone. Daylight-saving gaps are rejected instead of silently shifting the requested wall time.'],
    ['Elevation and horizon', 'Geometric elevation and manual horizon adjustments are mutually exclusive, preventing the same correction from being applied twice. Geometric elevation does not model nearby buildings, trees, ridges, or actual first visibility.'],
    ['Opinions', 'GRA, Magen Avraham, Baal HaTanya, Rabbeinu Tam, candle-lighting, and nightfall choices represent different calculation methods. A label is not a ruling that the method is appropriate for every community.'],
    ['High latitudes', 'Some twilight angles do not occur on certain dates at high latitudes. The app may show an unavailable time rather than inventing a crossing. Ask a competent rabbi which alternate method to use.'],
    ['Verification', 'Automated regression checks cover Hebrew-date conversion, month rollover, daylight-saving boundaries, solar ordering, lunar bounds, input validation, and 180-day provider batching. Production results should still be compared with a trusted local calendar before communal use.'],
  ];

  return (
    <div className="min-h-screen px-5 py-10 max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-yellow-300/70 hover:text-yellow-300 mb-8 transition-colors">
        ← {he ? 'חזרה לזמנים' : 'Back to Zmanim'}
      </Link>

      <h1 className="text-3xl font-bold text-white mb-6 glow-text">{he ? 'מדריך זמנים: הבנת זמני הלכה' : 'Zmanim Guide: Understanding Halachic Times'}</h1>

      <div className="space-y-5 text-white/70 leading-relaxed mb-10">
        {intro.map((p, i) => <p key={i}>{p}</p>)}
      </div>

      <section className="mb-10" aria-labelledby="methodology-heading">
        <h2 id="methodology-heading" className="text-xl font-bold text-white/90 mb-4">{he ? 'מתודולוגיית חישוב ומגבלות' : 'Calculation Methodology & Limitations'}</h2>
        <div className="space-y-3">
          {methodology.map(([title, description]) => (
            <div key={title} className="rounded-2xl bg-white/4 border border-white/10 p-4">
              <h3 className="text-sm font-bold text-yellow-300 mb-1">{title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-white/50">
          {he ? 'הפניה טכנית: ' : 'Technical reference: '}
          <a className="text-blue-300 hover:text-blue-200 underline underline-offset-2" href="https://www.hebcal.com/home/1663/zmanim-halachic-times-api" target="_blank" rel="noreferrer">
            {he ? 'תיעוד Hebcal Zmanim API' : 'Hebcal Zmanim API documentation'}
          </a>.
        </p>
      </section>

      {loading ? (
        <div className="text-center text-white/40 py-8">{he ? 'טוען מונחים…' : 'Loading terms…'}</div>
      ) : terms.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold text-white/80 mb-4">{he ? 'הגדרות זמני הלכה' : 'Halachic Time Definitions'}</h2>
          <div className="space-y-3">
            {terms.map((t) => (
              <div key={t.id} className="rounded-2xl bg-white/4 border border-white/10 p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-yellow-300">{t.term}</h3>
                  {t.source && <span className="text-xs text-white/30">{t.source}</span>}
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-10 grid grid-cols-2 gap-3">
        <Link to="/about" className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-yellow-500/15 border border-yellow-400/30 hover:bg-yellow-500/25 transition-all">
          <span className="text-sm font-semibold text-yellow-300">{he ? 'אודות' : 'About'}</span>
        </Link>
        <Link to="/contact" className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-500/15 border border-blue-400/30 hover:bg-blue-500/25 transition-all">
          <span className="text-sm font-semibold text-blue-300">{he ? 'צור קשר' : 'Contact'}</span>
        </Link>
      </div>
    </div>
  );
}