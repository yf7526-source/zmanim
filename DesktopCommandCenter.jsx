import React from 'react';
import LanguageToggle from '@/components/LanguageToggle';
import { Link } from 'react-router-dom';
import {
  Calendar, ChevronLeft, ChevronRight, Command, MapPin, Moon, Search,
  Settings, Sun, TableProperties, RotateCcw,
  CloudSun, CircleGauge
} from 'lucide-react';

function fmtTime(value, tz, hour12 = true) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '—';
  try {
    return value.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12,
    });
  } catch {
    return '—';
  }
}

const RailButton = ({ icon: Icon, label, hint, onClick, to }) => {
  const cls = 'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-white/70 hover:text-white hover:bg-white/8 border border-transparent hover:border-white/10 transition-all';
  const content = <><Icon className="w-4 h-4 text-yellow-300/85 shrink-0"/><span className="text-xs font-semibold flex-1">{label}</span>{hint && <span className="text-[10px] text-white/30 font-mono">{hint}</span>}</>;
  return to ? <Link className={cls} to={to}>{content}</Link> : <button type="button" className={cls} onClick={onClick}>{content}</button>;
};

export default function DesktopCommandCenter({
  location,
  date,
  sunTimes,
  moonPhase,
  locationTz,
  hour12,
  displayMode,
  presentationMode,
  recentLocations = [],
  largeText = false,
  onLargeText,
  onRecentLocation,
  onPresentationMode,
  onToggleMode,
  onLocation,
  onSearch,
  onCalendar,
  onMonthly,
  onSettings,
  onWeather,
  onMoon,
  onPrevDay,
  onNextDay,
  onToday,
  onCommand,
}) {
  const illumination = Number.isFinite(moonPhase?.illumination) ? Math.round(moonPhase.illumination * 100) : null;
  return (
    <>
      <aside className="hidden xl:flex fixed left-0 top-0 bottom-0 z-30 w-[248px] flex-col border-r border-white/8 bg-[#08111d]/92 backdrop-blur-xl px-3 pt-6 pb-5 overflow-y-auto">
        <div className="px-3 mb-5">
          <div className="flex items-center gap-2 text-yellow-300 font-black tracking-tight"><Sun className="w-5 h-5"/> SolarZmanim</div>
          <div className="text-[10px] text-white/35 mt-1">Desktop command center</div>
        </div>

        <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-3 mb-3">
          <button type="button" onClick={onLocation} className="w-full text-left group">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/35"><MapPin className="w-3 h-3"/> Location</div>
            <div className="mt-1 text-sm font-bold text-yellow-200 truncate group-hover:text-yellow-100">{location?.name || 'Select location'}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{locationTz || 'Timezone resolving…'}</div>
          </button>
        </div>

        {recentLocations.length > 1 && <>
          <div className="px-2 text-[10px] uppercase tracking-widest text-white/30 mb-2">Recent places</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {recentLocations.filter(item => item.name !== location?.name).slice(0, 3).map(item => (
              <button key={item.name} type="button" onClick={() => onRecentLocation?.(item)} className="max-w-full truncate rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/55 hover:text-yellow-200 hover:border-yellow-400/20">{item.name}</button>
            ))}
          </div>
        </>}

        <div className="space-y-1">
          <RailButton icon={RotateCcw} label="Today" hint="T" onClick={onToday}/>
          <RailButton icon={Calendar} label="Calendar" hint="C" onClick={onCalendar}/>
          <RailButton icon={TableProperties} label="Monthly Zmanim" onClick={onMonthly}/>
          <RailButton icon={MapPin} label="Location" onClick={onLocation}/>
          <RailButton icon={Search} label="Search" hint="/" onClick={onSearch}/>
          <RailButton icon={Command} label="More tools" hint="Ctrl K" onClick={onCommand}/>
          <RailButton icon={Settings} label="Settings" hint="S" onClick={onSettings}/>
        </div>

        <div className="h-px bg-white/8 my-4"/>
        <div className="px-2 text-[10px] uppercase tracking-widest text-white/30 mb-2">Date navigation</div>
        <div className="grid grid-cols-3 gap-1">
          <button type="button" onClick={onPrevDay} className="min-h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center" aria-label="Previous day"><ChevronLeft className="w-4 h-4"/></button>
          <button type="button" onClick={onToday} className="min-h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center" aria-label="Today"><RotateCcw className="w-4 h-4"/></button>
          <button type="button" onClick={onNextDay} className="min-h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center" aria-label="Next day"><ChevronRight className="w-4 h-4"/></button>
        </div>
        <div className="text-center text-[11px] text-white/45 mt-2">{date?.toLocaleDateString?.('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>

        <div className="h-px bg-white/8 my-4"/>
        <div className="px-2 text-[10px] uppercase tracking-widest text-white/30 mb-2">Language</div>
        <div className="mb-4"><LanguageToggle /></div>
        <div className="px-2 text-[10px] uppercase tracking-widest text-white/30 mb-2">Presentation</div>
        <div className="grid grid-cols-3 gap-1 mb-4">
          {['original','visual','classic'].map(mode => <button key={mode} type="button" onClick={() => onPresentationMode?.(mode)} className={`rounded-xl px-2 py-2 text-xs font-bold capitalize border ${presentationMode === mode ? 'bg-yellow-400/15 border-yellow-400/30 text-yellow-200' : 'bg-white/5 border-white/8 text-white/45 hover:text-white/75'}`}>{mode}</button>)}
        </div>
        <button type="button" onClick={onLargeText} className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-xs font-bold ${largeText ? 'border-yellow-400/30 bg-yellow-400/15 text-yellow-200' : 'border-white/8 bg-white/5 text-white/50 hover:text-white/75'}`}>{largeText ? 'Large text: On' : 'Large text: Off'}</button>

        <div className="mt-auto pt-5">
          <button type="button" onClick={onToggleMode} className="w-full rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3 py-2.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/10">
            {`${displayMode ? displayMode[0].toUpperCase() + displayMode.slice(1) : 'Simple'} view · Change`}
          </button>
        </div>
      </aside>

      <aside className="hidden xl:flex fixed right-0 top-0 bottom-0 z-30 w-[248px] flex-col border-l border-white/8 bg-[#08111d]/92 backdrop-blur-xl px-3 pt-6 pb-5 overflow-y-auto">
        <div className="px-2 text-[10px] uppercase tracking-widest text-white/30 mb-3">Today at a glance</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/5 border border-white/8 p-3"><div className="text-[10px] text-white/35">Sunrise</div><div className="text-sm font-bold text-yellow-200 mt-1 tabular-nums">{fmtTime(sunTimes?.netz, locationTz, hour12)}</div></div>
          <div className="rounded-xl bg-white/5 border border-white/8 p-3"><div className="text-[10px] text-white/35">Sunset</div><div className="text-sm font-bold text-orange-200 mt-1 tabular-nums">{fmtTime(sunTimes?.shkiah, locationTz, hour12)}</div></div>
          <div className="rounded-xl bg-white/5 border border-white/8 p-3"><div className="text-[10px] text-white/35">Midday</div><div className="text-sm font-bold text-cyan-200 mt-1 tabular-nums">{fmtTime(sunTimes?.chatzot, locationTz, hour12)}</div></div>
          <div className="rounded-xl bg-white/5 border border-white/8 p-3"><div className="text-[10px] text-white/35">Moon</div><div className="text-sm font-bold text-blue-200 mt-1">{illumination == null ? '—' : `${illumination}%`}</div></div>
        </div>

        <div className="h-px bg-white/8 my-4"/>
        <div className="px-2 text-[10px] uppercase tracking-widest text-white/30 mb-2">Quick tools</div>
        <div className="space-y-1">
          <RailButton icon={CloudSun} label="Weather" onClick={onWeather}/>
          <RailButton icon={Moon} label="Sun & Moon" hint="M" onClick={onMoon}/>
          <RailButton icon={CircleGauge} label="System status" to="/system-status"/>
        </div>

        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.035] p-3">
          <div className="text-[10px] uppercase tracking-widest text-white/30">Desktop tip</div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/45">Press <span className="font-mono text-white/70">Ctrl/Cmd + K</span> anywhere on Home to search tools and commands.</p>
        </div>
      </aside>
    </>
  );
}