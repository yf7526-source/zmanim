import React from 'react';
import { Link } from 'react-router-dom';
import { X, LayoutDashboard, MapPin, User, FileDown, Search, Bug, Map } from 'lucide-react';
import useFocusTrap from '@/hooks/useFocusTrap';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, en: 'Dashboard', he: 'לוח בקרה' },
  { to: '/saved-locations', icon: MapPin, en: 'Saved Locations', he: 'מיקומים שמורים' },
  { to: '/locations', icon: MapPin, en: 'Location Manager', he: 'ניהול מיקומים' },
  { to: '/map-picker', icon: Map, en: 'Map Picker', he: 'בורר מפה' },
  { to: '/profile', icon: User, en: 'Profile', he: 'פרופיל' },
  { to: '/export-history', icon: FileDown, en: 'Export History', he: 'היסטוריית ייצוא' },
  { to: '/search-history', icon: Search, en: 'Search History', he: 'היסטוריית חיפוש' },
  { to: '/report-issue', icon: Bug, en: 'Report Issue', he: 'דיווח על בעיה' },
];

export default function NavigationDrawer({ open, onClose, lang = 'both' }) {
  const dialogRef = useFocusTrap(open, onClose);
  if (!open) return null;
  const tr = (en, he) => lang === 'he' ? he : lang === 'en' ? en : `${en} · ${he}`;
  const side = lang === 'he' ? 'right-0' : 'left-0';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={tr('Navigation menu', 'תפריט ניווט')}
        dir={lang === 'he' ? 'rtl' : 'ltr'}
        className={`absolute top-0 bottom-0 ${side} w-80 max-w-[85vw] bg-card border-white/10 flex flex-col shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-foreground">{tr('Menu', 'תפריט')}</h2>
          <button onClick={onClose} aria-label={tr('Close menu', 'סגור תפריט')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, en, he }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-foreground/80 hover:text-foreground min-h-[44px]"
            >
              <Icon className="w-5 h-5 text-primary/70 shrink-0" />
              <span className="text-sm font-medium">{tr(en, he)}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}