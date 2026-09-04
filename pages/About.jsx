import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';

export default function About() {
  const { lang } = useLanguage();
  const he = lang === 'he';
  return (
    <main id="main-content" dir={he ? 'rtl' : 'ltr'} className="min-h-screen px-5 py-10 max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-yellow-300/70 hover:text-yellow-300 mb-8 transition-colors">
        ← {he ? 'חזרה לזמנים' : 'Back to Zmanim'}
      </Link>

      <h1 className="text-3xl font-bold text-white mb-6 glow-text">{he ? 'אודות SolarZmanim' : 'About SolarZmanim'}</h1>

      <div className="space-y-5 text-white/70 leading-relaxed">
        <p>
          {he
            ? 'SolarZmanim הוא יישום תפילה ולוח יהודי מקיף שנועד להביא זמני הלכה מדויקים מבוססי מיקום ליהודים שומרי תורה ומצוות ברחבי העולם. בין אם אתם בבית, בדרך, או מחפשים את הרגע המדויק לקרוא קריאת שמע או להדליק נרות שבת, האפליקציה מחשבת זמנים המותאמים לקואורדינטות והגובה המדויקים שלכם.'
            : 'SolarZmanim is a comprehensive Jewish prayer-time and calendar application designed to bring accurate, location-based halachic times to observant Jews around the world. Whether you are at home, traveling, or looking for the precise moment to recite Shema or light Shabbat candles, the app calculates zmanim tailored to your exact geographic coordinates and elevation.'}
        </p>
        <p>
          {he
            ? 'האפליקציה כוללת תצוגה סולארית בזמן אמת המציגה את מיקום השמש לאורך היום, ועוזרת למשתמשים להבין באופן אינטואיטיבי היכן הם במחזור ההלכתי. היא מספקת זמנים מחושבים משירות Hebcal לצד חישובים אסטרונומיים מקומיים, ומכסה עלות השחר, משיכיר, נץ החמה, חצות, מנחה, שקיעה וצאת הכוכבים. ניתן להתאים דעות לכל חישוב — מהגר"א והמגן אברהם עד רבנו תם — כדי שהזמנים יתאמו למנהג הקהילה.'
            : 'The app features a real-time solar visualization that shows the sun\u2019s position throughout the day, helping users intuitively understand where they are in the halachic cycle. It provides calculated zmanim sourced from the Hebcal API alongside local astronomical calculations, covering Alot HaShachar, Misheyakir, Netz Hachama (sunrise), Chatzot (solar noon), Mincha, Shkiah (sunset), and Tzait Kochavim (nightfall). Users can customize opinions for each calculation \u2014 from the GRA and Magen Avraham to Rabbeinu Tam \u2014 ensuring the times match their community\u2019s practice.'}
        </p>
        <p>
          {he
            ? 'מעבר לזמנים היומיומיים, האפליקציה כוללת לוח עברי מלא עם פרשיות, חגים וספירת העומר, תרשים עונתי של אורך היום לאורך כל השנה העברית, מעקב פגות הירח עם תזמון קידוש לבנה, זיהוי מצב שבת ויום טוב, והתראות זמנים מבוססות דפדפן. היא נבנתה לכל מי ששומר הלכה וזקוק למידע זמן אמין, יפה ונגיש — מהמתפללים היומיומיים ועד רבנים הקובעים לוחות קהילתיים.'
            : 'Beyond daily zmanim, the app includes a full Hebrew calendar with parashot, holidays, and the Omer count, a seasonal daylight chart spanning the entire Hebrew year, moon phase tracking with Kiddush Levanah scheduling, Shabbat and Yom Tov mode detection, and browser-based zmanim alerts. It is built for anyone who observes Jewish law and needs reliable, beautiful, and accessible time information \u2014 from daily daveners to rabbis determining community schedules.'}
        </p>
        <p>
          {he
            ? 'SolarZmanim נבנה על ידי צוות קטן השואף לשלב אסטרונומיה מדויקת עם מסורת הלכתית, ולהנגיש זמן קדוש לכל יהודי, בכל מקום.'
            : 'SolarZmanim is built by a small team passionate about merging precise astronomy with halachic tradition, making sacred time accessible to every Jew, everywhere.'}
        </p>
        <div className="rounded-2xl bg-amber-500/10 border border-amber-400/25 p-4 text-sm text-amber-100/75">
          {he
            ? 'SolarZmanim הוא כלי חישוב מידעי, ולא פסק הלכה או הכשר רבני. פני השטח המקומיים, תנאי הראות, מנהג הקהילה והדרכה רבנית עשויים לשנות את הזמן שיש לנהוג למעשה. יש להתייעץ עם רבך להחלטות מעשיות.'
            : 'SolarZmanim is an informational calculation tool, not a halachic ruling or rabbinic certification. Local terrain, visibility, community custom, and rabbinic guidance can change the time that should be followed in practice. Consult your rabbi for practical decisions.'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-10">
        <Link to="/contact" className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-yellow-500/15 border border-yellow-400/30 hover:bg-yellow-500/25 transition-all">
          <span className="text-sm font-semibold text-yellow-300">{he ? 'צור קשר' : 'Contact Us'}</span>
        </Link>
        <Link to="/zmanim-guide" className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-500/15 border border-blue-400/30 hover:bg-blue-500/25 transition-all">
          <span className="text-sm font-semibold text-blue-300">{he ? 'מדריך זמנים' : 'Zmanim Guide'}</span>
        </Link>
      </div>
    </main>
  );
}