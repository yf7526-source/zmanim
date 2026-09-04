import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';

const LINKS = [
  { to: '/', label: 'Home', labelHe: 'בית' },
  { to: '/zmanim-guide', label: 'Zmanim Guide', labelHe: 'מדריך זמנים' },
  { to: '/solar-calculator', label: 'Solar Calculator', labelHe: 'מחשבון שמש' },
  { to: '/glossary', label: 'Glossary', labelHe: 'מילון מונחים' },
  { to: '/about', label: 'About', labelHe: 'אודות' },
  { to: '/contact', label: 'Contact', labelHe: 'צור קשר' },
];

/**
 * Crawlable inter-page HTML links between public informational pages.
 * Renders real <a> tags (via React Router <Link>) for search engine discovery.
 */
export default function PublicPageLinks() {
  const { lang } = useLanguage();
  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  return (
    <nav className="px-4 py-6 mt-4 border-t border-white/8" aria-label={lang === 'he' ? 'ניווט באתר' : 'Site navigation'}>
      <div dir={lang === 'he' ? 'rtl' : 'ltr'} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 max-w-2xl mx-auto">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="text-xs text-white/70 hover:text-yellow-300/80 transition-colors"
          >
            {showHe && <span dir="rtl">{link.labelHe}</span>}
            {showHe && showEn && <span className="text-white/50 mx-1">·</span>}
            {showEn && <span>{link.label}</span>}
          </Link>
        ))}
      </div>
    </nav>
  );
}