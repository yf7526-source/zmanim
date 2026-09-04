import React, { useState } from 'react';
import { X, ChevronDown, Clock, Scale, Monitor, Languages, Timer, FileDown, Palette } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import ZmanimAlertSettings from './ZmanimAlertSettings';
import CustomZmanManager from './CustomZmanManager';
import CustomZmanimExportSheet from './CustomZmanimExportSheet';
import BottomSheetSelect from './BottomSheetSelect';
import { base44 } from '@/api/base44Client';
import { SHABBAT_ENDS_OPTIONS } from '@/lib/regionDefaults';
import useFocusTrap from '@/hooks/useFocusTrap';
import { getCalendarMonthSystem, setCalendarMonthSystem } from '@/lib/preferences';

const ZMANIM_OPINIONS = [
  {
    key: 'alot',
    label: 'Alot HaShachar',
    emoji: '🌅',
    sub: 'Dawn — first light',
    options: [
      { key: '16.1',   label: '16.1°',   sub: 'Ohr HaChaim / MGA base (most common)' },
      { key: '18',     label: '18°',     sub: 'Astronomical twilight' },
      { key: '19.8',   label: '19.8°',   sub: "Chacham Tzvi / R' Tukaczinsky" },
      { key: '72min',  label: '72 min',  sub: 'Rabbeinu Tam — fixed before Netz' },
      { key: '90min',  label: '90 min',  sub: 'Stringent Ashkenaz' },
      { key: '96min',  label: '96 min',  sub: 'Some Sephardic' },
      { key: '120min', label: '120 min', sub: 'Very stringent' },
    ],
  },
  {
    key: 'misheyakir',
    label: 'Misheyakir',
    emoji: '🕯',
    sub: 'Earliest tallit & tefillin',
    options: [
      { key: '10.2',  label: '10.2°',  sub: 'Ateret / some Rishonim (lenient)' },
      { key: '11',    label: '11°',    sub: "R' Moshe Feinstein" },
      { key: '11.5',  label: '11.5°',  sub: 'Achronim — most common' },
      { key: '60min', label: '60 min', sub: 'Baladi Yemenite' },
    ],
  },
  {
    key: 'shema',
    label: 'Sof Zman Shema',
    emoji: '📖',
    sub: 'Latest Kriat Shema',
    options: [
      { key: 'gra', label: 'GRA', sub: 'Vilna Gaon (most common)' },
      { key: 'mga', label: 'MGA', sub: 'Magen Avraham' },
      { key: 'bht', label: 'Baal HaTanya', sub: 'Shneur Zalman of Liadi' },
    ],
  },
  {
    key: 'tefilla',
    label: 'Sof Zman Tefilla',
    emoji: '🕍',
    sub: 'Latest Shacharit',
    options: [
      { key: 'gra', label: 'GRA', sub: 'Vilna Gaon (most common)' },
      { key: 'mga', label: 'MGA', sub: 'Magen Avraham' },
      { key: 'bht', label: 'Baal HaTanya', sub: 'Shneur Zalman of Liadi' },
    ],
  },
  {
    key: 'minchaGedola',
    label: 'Mincha Gedola',
    emoji: '🕐',
    sub: 'Earliest Mincha',
    options: [
      { key: 'gra', label: 'GRA', sub: 'Vilna Gaon (most common)' },
      { key: 'mga', label: 'MGA', sub: 'Magen Avraham' },
      { key: 'bht', label: 'Baal HaTanya', sub: 'Shneur Zalman of Liadi' },
    ],
  },
  {
    key: 'minchaKetana',
    label: 'Mincha Ketana',
    emoji: '🕑',
    sub: 'Preferred time for Mincha',
    options: [
      { key: 'gra', label: 'GRA', sub: 'Vilna Gaon (most common)' },
      { key: 'mga', label: 'MGA', sub: 'Magen Avraham' },
      { key: 'bht', label: 'Baal HaTanya', sub: 'Shneur Zalman of Liadi' },
    ],
  },
  {
    key: 'plagHaMincha',
    label: 'Plag HaMincha',
    emoji: '🕒',
    sub: 'Early Kabbalat Shabbat',
    options: [
      { key: 'gra', label: 'GRA', sub: 'Vilna Gaon (most common)' },
      { key: 'mga', label: 'MGA', sub: 'Magen Avraham' },
      { key: 'bht', label: 'Baal HaTanya', sub: 'Shneur Zalman of Liadi' },
    ],
  },
  {
    key: 'candleLighting',
    label: 'Candle Lighting',
    emoji: '🕍',
    sub: 'Shabbat / Yom Tov',
    options: [
      { key: '18', label: '18 min', sub: 'Ashkenaz standard (Diaspora)' },
      { key: '20', label: '20 min', sub: 'Israeli standard (outside Jerusalem)' },
      { key: '30', label: '30 min', sub: 'Mishnah Berurah' },
      { key: '40', label: '40 min', sub: 'Yerushalayim custom' },
    ],
  },
  {
    key: 'shabbatEnds',
    label: 'Shabbat Ends',
    emoji: '🌌',
    sub: 'When Shabbat / Yom Tov ends (Motzei)',
    options: SHABBAT_ENDS_OPTIONS,
  },
  {
    key: 'tzait',
    label: 'Tzait Kochavim',
    emoji: '⭐',
    sub: 'Nightfall — stars visible',
    options: [
      { key: '7.083', label: '7.083°', sub: '3 medium stars (lenient)' },
      { key: '8.5',   label: '8.5°',   sub: 'Most Ashkenaz (standard)' },
      { key: '16.1',  label: '16.1°',  sub: 'Tzait at 16.1° (stringent / Geonim)' },
      { key: '72min', label: '72 min', sub: 'Rabbeinu Tam — 72 fixed minutes after shkiah' },
    ],
  },
  {
    key: 'netz',
    label: 'Netz HaChamah',
    emoji: '☀️',
    sub: 'Sunrise',
    options: [
      { key: 'sealevel', label: 'Sea level', sub: '−0.833° horizon (standard)' },
      { key: 'elevation', label: 'Adjusted for elevation', sub: 'Earlier sunrise based on altitude' },
    ],
  },
  {
    key: 'shkiah',
    label: 'Shkiah',
    emoji: '🌇',
    sub: 'Sunset',
    options: [
      { key: 'sealevel', label: 'Sea level', sub: '−0.833° horizon (standard)' },
      { key: 'elevation', label: 'Adjusted for elevation', sub: 'Later sunset based on altitude' },
    ],
  },
  {
    key: 'chatzot',
    label: 'Chatzot',
    emoji: '🕛',
    sub: 'Halachic midday',
    options: [
      { key: 'standard', label: 'Solar noon', sub: '6 halachic hours' },
    ],
  },
  {
    key: 'chatzotNight',
    label: 'Chatzot HaLayla',
    emoji: '🌙',
    sub: 'Halachic midnight',
    options: [
      { key: 'standard', label: '6h night', sub: '6 halachic hours after sunset' },
    ],
  },
];

function SectionHeader({ icon: IconComp, emoji, label, description }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
        {emoji ? <span className="text-base">{emoji}</span> : (IconComp ? <IconComp className="w-4 h-4 text-yellow-400/70" /> : null)}
      </div>
      <div>
        <p className="text-sm font-bold text-white/80">{label}</p>
        {description && <p className="text-xs text-white/60 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function ZmanPicker({ config, value, onChange, lang = 'both' }) {
  const [open, setOpen] = useState(false);
  const selected = config.options.find(o => o.key === value);
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 overflow-hidden">
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 text-left min-h-[44px] select-none"
      >
        <div className="flex items-center gap-3">
          <span className="text-base">{config.emoji}</span>
          <div>
            <div className="text-sm font-semibold text-white/90">{config.label}</div>
            <div className="text-xs text-white/35 mt-0.5">{config.sub}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-yellow-300 bg-yellow-500/15 px-2 py-0.5 rounded-lg">{selected?.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/60" />
        </div>
      </button>
      <BottomSheetSelect
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        options={config.options}
        onChange={onChange}
        title={config.label}
        lang={lang}
      />
    </div>
  );
}

export default function SettingsSheet({
  open, onClose,
  location, onLocationChange,
  hour12, onHour12Change,
  date, onDateChange,
  zmanimOpinions, onZmanimOpinionsChange,
  horizonConfig, onHorizonConfigChange,
  lang, onLangChange,
  showCountdown, onShowCountdownChange,
  sunTimes,
  locationTz,
  customZmanim, onCustomZmanimAdd, onCustomZmanimRemove,
  sceneStyle, onSceneStyleChange,
  showZmanimRing, onShowZmanimRingChange,
  followLocationDefaults = true, onFollowLocationDefaultsChange,
  zmanimDisplayLevel = 'simple', onZmanimDisplayLevelChange,
  showSecondaryTimes = true, onShowSecondaryTimesChange,
  secondaryZmanimDisplay = {}, onSecondaryZmanimDisplayChange,
}) {
  const [showExport, setShowExport] = useState(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [calendarSystem, setCalendarSystem] = useState(() => getCalendarMonthSystem());
  const [activeTab, setActiveTab] = useState('general');
  const dialogRef = useFocusTrap(open, onClose);
  if (!open) return null;

  const TABS = [
    { key: 'general', label: lang === 'he' ? 'כללי' : 'General', emoji: '⚙️', desc: lang === 'he' ? 'שפה, תצוגה ונוף' : 'Language, display, and scene' },
    { key: 'location', label: lang === 'he' ? 'מיקום' : 'Location', emoji: '📍', desc: lang === 'he' ? 'המיקום הפעיל' : 'Active place and context' },
    { key: 'display', label: lang === 'he' ? 'תצוגת זמנים' : 'Zmanim Display', emoji: '🖥', desc: lang === 'he' ? 'כמה זמנים לראות' : 'How many zmanim to see' },
    { key: 'calculation', label: lang === 'he' ? 'חישוב' : 'Calculation', emoji: '⚖️', desc: lang === 'he' ? 'שיטות החישוב' : 'Calculation methods' },
    { key: 'calendar', label: lang === 'he' ? 'לוח' : 'Calendar', emoji: '📅', desc: lang === 'he' ? 'העדפת חודש' : 'Month preference' },
    { key: 'alerts', label: lang === 'he' ? 'התראות' : 'Notifications', emoji: '🔔', desc: lang === 'he' ? 'התראות וחשבון' : 'Alerts and account' },
    { key: 'advanced', label: lang === 'he' ? 'מתקדם' : 'Advanced', emoji: '🛠', desc: lang === 'he' ? 'אופק ופוסקים' : 'Horizon and custom posekim' },
    { key: 'about', label: lang === 'he' ? 'אודות' : 'About', emoji: 'ℹ️', desc: lang === 'he' ? 'מידע ותמיכה' : 'Info and support' },
  ];
  const activeTabMeta = TABS.find(t => t.key === activeTab) || TABS[0];

  // Compute effective horizon offset for child components
  const effectiveHorizonOffset = horizonConfig?.mode === 'manual'
    ? { sunrise: horizonConfig.manualSunriseDeg || 0, sunset: horizonConfig.manualSunsetDeg || 0 }
    : 0;

  const opinions = ZMANIM_OPINIONS.map((config) => {
    const customOptions = (customZmanim || [])
      .filter((cz) => cz.zmanType === config.key)
      .map((cz) => ({ key: `custom_${cz.id}`, label: cz.posekName, sub: 'Custom' }));
    return {
      config: { ...config, options: [...config.options, ...customOptions] },
      value: zmanimOpinions[config.key],
      onChange: (val) => onZmanimOpinionsChange({ ...zmanimOpinions, [config.key]: val }),
    };
  });
  const summaryValue = (key) => {
    const item = opinions.find(entry => entry.config.key === key);
    return item?.config.options.find(option => option.key === item.value)?.label || '—';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        dir={lang === 'he' ? 'rtl' : 'ltr'}
        className="w-full max-w-3xl h-[85vh] rounded-3xl bg-[#0a111c] border border-white/10 flex shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar */}
        <aside className="w-40 sm:w-44 shrink-0 bg-[#0b1220] border-r border-white/8 flex flex-col">
          <div className="px-5 pt-5 pb-4 border-b border-white/8">
            <h2 id="settings-title" className="text-base font-bold text-white flex items-center gap-2">⚙️ {lang === 'he' ? 'הגדרות' : 'Settings'}</h2>
            <p className="text-[11px] text-white/40 mt-0.5">{lang === 'he' ? 'התאם אישית' : 'Customize your experience'}</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === tab.key
                    ? 'bg-yellow-500/15 border border-yellow-400/40 text-yellow-300'
                    : 'border border-transparent text-white/55 hover:bg-white/8 hover:text-white/80'
                }`}
              >
                <span className="text-sm">{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 pb-8 pt-5 space-y-6">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 -mx-6 -mt-5 mb-1 px-6 pt-5 pb-4 bg-[#0a111c] border-b border-white/8 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{activeTabMeta.emoji} {activeTabMeta.label}</h3>
              <p className="text-xs text-white/40 mt-0.5">{activeTabMeta.desc}</p>
            </div>
            <button onClick={onClose} aria-label="Close settings" className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-all">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          {activeTab === 'general' && (
          <>

          {/* ── LANGUAGE ── */}
          <section className="rounded-2xl bg-white/4 border border-white/8 p-5">
            <SectionHeader icon={Languages} emoji="🌐" label={lang === 'he' ? 'שפה' : 'Language'} description={lang === 'he' ? 'שפת הממשק' : 'UI language for zmanim names'} />
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { key: 'both', label: 'דו-לשוני', sub: 'עברית + English' },
                { key: 'he',   label: 'עברית', sub: 'Hebrew only' },
                { key: 'en',   label: 'English', sub: 'English only' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => onLangChange(opt.key)}
                  className={`py-3 px-3 rounded-xl border-2 text-center transition-all active:scale-95 ${
                    lang === opt.key
                      ? 'bg-yellow-500/20 border-yellow-400/60 text-yellow-300'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
                  }`}
                >
                  <div className="font-bold text-sm leading-snug">{opt.label}</div>
                  <div className="text-[10px] mt-1 opacity-50">{opt.sub}</div>
                </button>
              ))}
            </div>
          </section>

          {/* ── DISPLAY OPTIONS ── */}
          <section className="rounded-2xl bg-white/4 border border-white/8 p-5 space-y-4">
            <SectionHeader icon={Monitor} emoji="🖥" label={lang === 'he' ? 'תצוגה' : 'Display'} description={lang === 'he' ? 'איך תאריכים ושעות מוצגים' : 'How dates and times are shown'} />

            {/* Date navigation lives on Home, not in Settings. */}

            {/* Time format */}
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">
                <Clock className="w-3 h-3 inline mr-1.5 opacity-60" />{lang === 'he' ? 'פורמט שעה' : 'Time Format'}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[{ val: true, label: '12-hour', example: '1:30 PM' }, { val: false, label: '24-hour', example: '13:30' }].map(opt => (
                  <button
                    key={String(opt.val)}
                    onClick={() => onHour12Change(opt.val)}
                    className={`py-3 px-4 rounded-xl border-2 text-left transition-all active:scale-95 ${
                      hour12 === opt.val
                        ? 'bg-yellow-500/20 border-yellow-400/60 text-yellow-300'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
                    }`}
                  >
                    <div className="font-bold text-sm">{opt.label}</div>
                    <div className="text-xs mt-1 opacity-50 font-mono">{opt.example}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Countdown toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5">
                <Timer className="w-4 h-4 text-yellow-400/60" />
                <div>
                  <div className="text-sm font-semibold text-white/80">
                    {lang === 'he' ? 'ספירה לזמן הבא' : 'Next Zman Countdown'}
                  </div>
                  <div className="text-xs text-white/35 mt-0.5">
                    {lang === 'he' ? 'הצג ספירה לאחור במסך הראשי' : 'Show countdown on home screen'}
                  </div>
                </div>
              </div>
              <Switch
                checked={showCountdown}
                onCheckedChange={onShowCountdownChange}
              />
            </div>

          </section>

          {/* ── CIRCLE SCENE ── */}
          <section className="rounded-2xl bg-white/4 border border-white/8 p-5">
            <SectionHeader icon={Palette} emoji="🎨" label={lang === 'he' ? 'נוף המעגל' : 'Circle Scene'} description={lang === 'he' ? 'בחר עיצוב פנים המעגל' : 'Choose the interior landscape design'} />
            <div className="space-y-2">
              {[
                { key: 'stone', label: 'Stone Cottage', sub: 'Stone cottage with grass meadow & gravel path', img: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/c9530a46b_generated_image.png' },
                { key: 'oldcity', label: 'Old City Rooftops', sub: 'Jerusalem golden stone domes & terracotta roofs', img: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/15de9ad46_generated_image.png' },
                { key: 'tundra', label: 'Northern Tundra', sub: 'Vast arctic sky with snow cabin', img: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/85962a8cb_generated_image.png' },
                { key: 'desert', label: 'Desert Dunes', sub: 'Golden sand dunes with lone acacia tree', img: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/51cd0fa3b_generated_image.png' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => onSceneStyleChange(opt.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
                    sceneStyle === opt.key
                      ? 'bg-yellow-500/15 border-yellow-400/50 text-yellow-200'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
                  }`}
                >
                  <img
                    src={opt.img}
                    alt={opt.label}
                    className="w-12 h-12 rounded-full object-cover shrink-0 border border-white/20"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{opt.label}</div>
                    <div className="text-xs opacity-50 mt-0.5">{opt.sub}</div>
                  </div>
                  {sceneStyle === opt.key && <span className="text-yellow-400 text-xs font-bold shrink-0">✓</span>}
                </button>
              ))}
            </div>
            {/* Toggle: show zmanim on ring */}
            <button
              onClick={() => onShowZmanimRingChange(!showZmanimRing)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 mt-3 rounded-xl bg-white/5 border border-white/8 hover:border-white/15 transition-all"
            >
              <div className="text-left">
                <div className="font-bold text-sm text-white/80">{lang === 'he' ? 'זמנים על הטבעת' : 'Zmanim on Ring'}</div>
                <div className="text-xs text-white/40 mt-0.5">{lang === 'he' ? 'הצג תוויות וסימוני זמנים על מעגל השמש' : 'Show halachic time labels & ticks on the sun ring'}</div>
              </div>
              <span className={`w-11 h-6 rounded-full flex items-center transition-all shrink-0 ${showZmanimRing ? 'bg-yellow-500/40 justify-end' : 'bg-white/10 justify-start'}`}>
                <span className={`w-4 h-4 rounded-full transition-all ${showZmanimRing ? 'bg-yellow-300' : 'bg-white/40'}`} />
              </span>
            </button>
          </section>
          </>
          )}

          {activeTab === 'location' && (
            <section className="rounded-2xl bg-white/4 border border-white/8 p-5 space-y-3">
              <SectionHeader emoji="📍" label={lang === 'he' ? 'מיקום' : 'Location'} description={lang === 'he' ? 'המיקום הפעיל ונתוני החישוב המקומיים' : 'Active place and local calculation context'} />
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3"><span className="text-white/50">{lang === 'he' ? 'מיקום נוכחי' : 'Current location'}</span><span className="font-bold text-white/85 text-right">{location?.name || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-white/50">{lang === 'he' ? 'אזור זמן' : 'Timezone'}</span><span className="font-mono text-white/80 text-right">{locationTz || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-white/50">{lang === 'he' ? 'גובה' : 'Elevation'}</span><span className="text-white/80">{Number.isFinite(location?.elevation) ? `${location.elevation}m` : (lang === 'he' ? 'לא זמין' : 'Unavailable')}</span></div>
              </div>
              <a href="/saved-locations" className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white/75 hover:bg-white/10">{lang === 'he' ? 'מיקומים שמורים' : 'Saved locations'}</a>
              <p className="text-xs text-white/40">{lang === 'he' ? 'הגדרות אופק וגובה ידניות נמצאות במתקדם.' : 'Manual timezone, elevation, and horizon controls stay under Advanced.'}</p>
            </section>
          )}

          {activeTab === 'display' && (
            <>
            <section className="rounded-2xl bg-white/4 border border-white/8 p-5">
              <SectionHeader emoji="🖥" label={lang === 'he' ? 'תצוגת זמנים' : 'Zmanim Display'} description={lang === 'he' ? 'בחר כמה זמנים לראות. זה לא משנה את שיטת החישוב.' : 'Choose how many zmanim to see. This never changes calculation methods.'} />
              <div className="space-y-2">
                {[
                  { key: 'simple', label: lang === 'he' ? 'פשוט' : 'Simple', sub: lang === 'he' ? 'הזמנים החשובים ביותר' : 'The most important daily times' },
                  { key: 'full', label: lang === 'he' ? 'מלא' : 'Full', sub: lang === 'he' ? 'רשימה יומיומית רחבה' : 'A broader everyday list' },
                  { key: 'expert', label: lang === 'he' ? 'מומחה' : 'Expert', sub: lang === 'he' ? 'כל החישובים והפרטים המופעלים' : 'All enabled calculations and details' },
                ].map(option => (
                  <button key={option.key} onClick={() => onZmanimDisplayLevelChange?.(option.key)} className={`w-full rounded-xl border px-4 py-3 text-left ${zmanimDisplayLevel === option.key ? 'border-yellow-400/50 bg-yellow-500/15 text-yellow-200' : 'border-white/10 bg-white/5 text-white/65'}`}>
                    <span className="block text-sm font-bold">{option.label}</span><span className="block mt-0.5 text-xs opacity-60">{option.sub}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Secondary times — display-only opinions shown inline on Home */}
            <section className="rounded-2xl bg-white/4 border border-white/8 p-5">
              <SectionHeader emoji="📋" label={lang === 'he' ? 'זמנים משניים' : 'Secondary Times'} description={lang === 'he' ? 'דעות נוספות מוצגות מתחת לזמן הראשי. תצוגה בלבד — לא משנה את החישוב.' : 'Extra opinions shown under the primary time. Display only — never changes calculations.'} />
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-sm font-semibold text-white/80">{lang === 'he' ? 'הצג זמנים משניים' : 'Show secondary times'}</div>
                  <div className="text-xs text-white/35 mt-0.5">{lang === 'he' ? 'הפעלה מציגה את הדעות הנבחרות מתחת לכל זמן' : 'When on, selected opinions appear under each zman'}</div>
                </div>
                <Switch checked={showSecondaryTimes} onCheckedChange={onShowSecondaryTimesChange} />
              </div>
              {showSecondaryTimes && (
                <div className="space-y-3">
                  {ZMANIM_OPINIONS.filter(c => c.options.length > 1).map(config => {
                    const selected = secondaryZmanimDisplay[config.key] || [];
                    const toggle = (key) => {
                      const next = selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key];
                      onSecondaryZmanimDisplayChange({ ...secondaryZmanimDisplay, [config.key]: next });
                    };
                    return (
                      <div key={config.key} className="rounded-xl bg-white/5 border border-white/8 p-3">
                        <div className="text-xs font-bold text-white/70 mb-2">{config.label}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {config.options.map(opt => {
                            const on = selected.includes(opt.key);
                            return (
                              <button key={opt.key} onClick={() => toggle(opt.key)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${on ? 'bg-yellow-500/20 border-yellow-400/40 text-yellow-200' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            </>
          )}

          {activeTab === 'calendar' && (
            <section className="rounded-2xl bg-white/4 border border-white/8 p-5 space-y-4">
              <SectionHeader emoji="📅" label={lang === 'he' ? 'לוח שנה' : 'Calendar'} description={lang === 'he' ? 'העדפת חודש ומראה אירועים' : 'Month preference and event appearance'} />
              <div className="grid grid-cols-2 gap-2">
                {[{ key: 'heb', label: lang === 'he' ? 'חודש עברי' : 'Hebrew month' }, { key: 'greg', label: lang === 'he' ? 'חודש לועזי' : 'Gregorian month' }].map(option => (
                  <button key={option.key} onClick={() => setCalendarSystem(setCalendarMonthSystem(option.key))} className={`rounded-xl border px-3 py-3 text-sm font-bold ${calendarSystem === option.key ? 'border-yellow-400/50 bg-yellow-500/15 text-yellow-200' : 'border-white/10 bg-white/5 text-white/60'}`}>{option.label}</button>
                ))}
              </div>
              <p className="text-xs text-white/40">{lang === 'he' ? 'צבעי אירועים ניתנים לעריכה מתוך כפתור ההגדרות בלוח השנה.' : 'Event colors remain available from the settings button inside Calendar.'}</p>
            </section>
          )}

          {activeTab === 'about' && (
            <section className="rounded-2xl bg-white/4 border border-white/8 p-5 space-y-3">
              <SectionHeader emoji="☀️" label="SolarZmanim 1.6.0" description={lang === 'he' ? 'מידע, פרטיות ותמיכה' : 'Product information, privacy, and support'} />
              <a href="/about" className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/75">{lang === 'he' ? 'אודות SolarZmanim' : 'About SolarZmanim'}</a>
              <a href="/contact" className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/75">{lang === 'he' ? 'פרטיות ויצירת קשר' : 'Privacy & contact'}</a>
              <a href="/system-status" className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/75">{lang === 'he' ? 'אבחון מערכת' : 'Diagnostics'}</a>
              <a href="/report-issue" className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/75">{lang === 'he' ? 'דיווח על בעיה' : 'Report an issue'}</a>
            </section>
          )}

          {activeTab === 'calculation' && (
          <>

          <section className="rounded-2xl bg-cyan-500/5 border border-cyan-400/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white/85">{lang === 'he' ? 'ברירות מחדל לחישוב לפי מיקום' : 'Location calculation defaults'}</div>
                <div className="text-xs text-white/40 mt-0.5">{lang === 'he' ? 'כשהאפשרות פעילה, מעבר לעיר חדשה יכול להחיל ברירות מחדל מקומיות. שינוי ידני של זמן מכבה זאת.' : 'When enabled, a new city may apply its recommended defaults. Manually changing a calculation turns this off.'}</div>
              </div>
              <Switch checked={followLocationDefaults} onCheckedChange={onFollowLocationDefaultsChange} />
            </div>
          </section>

          {/* ── CALCULATION SETTINGS ── */}
          <section className="rounded-2xl bg-white/4 border border-white/8 p-5">
            <SectionHeader icon={Scale} emoji="⚖️" label={lang === 'he' ? 'הגדרות חישוב נוכחיות' : 'Current calculation settings'} description={lang === 'he' ? 'השיטות משפיעות על הזמנים המחושבים, לא על אילו שורות מוצגות.' : 'Methods affect calculated times, not which rows are visible.'} />
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="rounded-lg bg-white/5 p-2.5 text-white/60">Alos <strong className="float-right text-white/90">{summaryValue('alot')}</strong></div>
              <div className="rounded-lg bg-white/5 p-2.5 text-white/60">Shema <strong className="float-right text-white/90">{summaryValue('shema')}</strong></div>
              <div className="rounded-lg bg-white/5 p-2.5 text-white/60">Tzais <strong className="float-right text-white/90">{summaryValue('tzait')}</strong></div>
              <div className="rounded-lg bg-white/5 p-2.5 text-white/60">Candles <strong className="float-right text-white/90">{summaryValue('candleLighting')}</strong></div>
              <div className="col-span-2 rounded-lg bg-white/5 p-2.5 text-white/60">Elevation <strong className="float-right text-white/90">{horizonConfig?.mode === 'geometric' ? 'Automatic' : horizonConfig?.mode === 'manual' ? 'Manual' : 'Standard'}</strong></div>
            </div>
            <button onClick={() => setShowCalculationDetails(value => !value)} aria-expanded={showCalculationDetails} className="w-full rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-200">
              {showCalculationDetails ? (lang === 'he' ? 'הסתר התאמה' : 'Hide customization') : (lang === 'he' ? 'התאם חישובים' : 'Customize calculations')}
            </button>
            {showCalculationDetails && (
              <div className="space-y-2.5 mt-4">
                {opinions.map(({ config, value, onChange }) => (
                  <ZmanPicker key={config.key} config={config} value={value} onChange={onChange} lang={lang} />
                ))}
                <p className="text-xs text-white/60 text-center mt-4">{lang === 'he' ? 'היוועץ ברב לפסיקה הלכתית' : 'Consult your rabbi for halachic decisions'}</p>
              </div>
            )}
          </section>

          <CustomZmanimExportSheet
            open={showExport}
            onClose={() => setShowExport(false)}
            location={location}
            locationTz={locationTz || 'UTC'}
            zmanimOpinions={zmanimOpinions}
            customZmanim={customZmanim}
            elevation={effectiveHorizonOffset}
            horizonMode={horizonConfig?.mode || 'none'}
            hour12={hour12}
            lang={lang}
          />

          </>
          )}
          {activeTab === 'advanced' && (
          <>
          <section className="rounded-2xl bg-white/4 border border-white/8 p-5 space-y-4">
            <SectionHeader icon={Scale} emoji="📐" label={lang === 'he' ? 'אופק וגובה' : 'Horizon & Elevation'} description={lang === 'he' ? 'הגדרות טכניות שמשפיעות על החישוב' : 'Technical settings that can affect calculated times'} />

            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">
                <Scale className="w-3 h-3 inline mr-1.5 opacity-60" />{lang === 'he' ? 'אופק וגובה' : 'Horizon & Elevation'}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { key: 'none',      label: lang === 'he' ? 'רגיל' : 'Standard',  sub: 'Sea-level horizon' },
                  { key: 'geometric', label: lang === 'he' ? 'גיאומטרי' : 'Geometric', sub: `City elev: ${location?.elevation || 0}m` },
                  { key: 'manual',    label: lang === 'he' ? 'ידני' : 'Manual',    sub: 'Custom angles' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => onHorizonConfigChange({ ...horizonConfig, mode: opt.key })}
                    className={`py-3 px-3 rounded-xl border-2 text-center transition-all active:scale-95 ${
                      horizonConfig?.mode === opt.key
                        ? 'bg-yellow-500/20 border-yellow-400/60 text-yellow-300'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
                    }`}
                  >
                    <div className="font-bold text-sm leading-snug">{opt.label}</div>
                    <div className="text-[10px] mt-1 opacity-50">{opt.sub}</div>
                  </button>
                ))}
              </div>
              {/* Manual angle inputs — sunrise and sunset kept separate */}
              {horizonConfig?.mode === 'manual' && (
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase block mb-1">{lang === 'he' ? 'זריחה (°)' : 'Sunrise (°)'}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={horizonConfig.manualSunriseDeg || 0}
                      onChange={e => onHorizonConfigChange({ ...horizonConfig, manualSunriseDeg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50 transition-all [color-scheme:dark]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase block mb-1">{lang === 'he' ? 'שקיעה (°)' : 'Sunset (°)'}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={horizonConfig.manualSunsetDeg || 0}
                      onChange={e => onHorizonConfigChange({ ...horizonConfig, manualSunsetDeg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50 transition-all [color-scheme:dark]"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
              {/* Active basis display */}
              <div className="mt-3 px-3 py-2 rounded-lg bg-white/5 border border-white/8">
                <p className="text-[11px] text-white/50">
                  {horizonConfig?.mode === 'none' && (lang === 'he' ? 'בסיס: אופק גובה פני הים הרגיל' : 'Basis: Standard sea-level horizon')}
                  {horizonConfig?.mode === 'geometric' && (lang === 'he' ? `בסיס: הגבהה גיאומטרית: ${location?.elevation || 0} מטר` : `Basis: Geometric elevation: ${location?.elevation || 0}m`)}
                  {horizonConfig?.mode === 'manual' && (lang === 'he' ? `בסיס: אופק ידני: זריחה ${horizonConfig.manualSunriseDeg || 0}°, שקיעה ${horizonConfig.manualSunsetDeg || 0}°` : `Basis: Manual horizon: sunrise ${horizonConfig.manualSunriseDeg || 0}°, sunset ${horizonConfig.manualSunsetDeg || 0}°`)}
                </p>
                {horizonConfig?.mode === 'geometric' && (
                  <p className="text-[10px] text-white/60 mt-1">{lang === 'he' ? 'הגבהה גיאומטרית אינה מתחשבת בהרים, בניינים או עצים' : 'Geometric elevation does not account for mountains, buildings, or trees'}</p>
                )}
              </div>
            </div>
          </section>

          {/* ── CUSTOM POSEK ZMANIM ── */}
          <section className="rounded-2xl bg-white/4 border border-white/8 p-5">
            <SectionHeader icon={Scale} emoji="✡️" label={lang === 'he' ? 'פוסקים מותאמים אישית' : 'Custom Posekim'} description={lang === 'he' ? 'הוסף דעות משלך לכל זמן' : 'Add your own opinions to any zman'} />
            <CustomZmanManager
              customZmanim={customZmanim}
              onAdd={onCustomZmanimAdd}
              onRemove={onCustomZmanimRemove}
              lang={lang}
            />
            {customZmanim && customZmanim.length > 0 && (
              <button
                onClick={() => setShowExport(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-200 font-bold text-sm hover:bg-purple-500/25 transition-all mt-3"
              >
                <FileDown className="w-4 h-4" />
                {lang === 'he' ? 'ייצא שנת PDF' : 'Export Yearly PDF'}
              </button>
            )}
          </section>


          </>
          )}

          {activeTab === 'alerts' && (
          <>

          {/* ── ZMANIM ALERTS ── */}
          <ZmanimAlertSettings sunTimes={sunTimes} lang={lang} />

          {/* ── ACCOUNT ── */}
          <section className="rounded-2xl bg-white/5 border border-white/15 p-5">
            <SectionHeader icon={null} emoji="👤" label={lang === 'he' ? 'חשבון' : 'Account'} description={lang === 'he' ? 'לניהול הגישה לחשבון' : 'Manage your account access'} />
            <p className="mb-3 text-xs leading-relaxed text-white/60">
              {lang === 'he' ? 'למחיקה קבועה של החשבון והנתונים יש לפנות למנהל האפליקציה.' : 'To permanently delete your account and data, contact the app administrator.'}
            </p>
            <button
              onClick={() => base44.auth.logout('/')}
              className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white/80 font-bold text-sm hover:bg-white/15 transition-all min-h-[44px] select-none"
            >
              {lang === 'he' ? 'התנתקות' : 'Sign Out'}
            </button>
          </section>
          </>
          )}
        </div>
      </div>
    </div>
  );
}