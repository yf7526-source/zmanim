import React from 'react';
import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="px-4 py-8 mt-4 border-t border-white/8">
      <div className="max-w-md mx-auto flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 text-xs">
          <Link to="/about" className="text-white/50 hover:text-yellow-300 transition-colors">About</Link>
          <span className="text-white/15">·</span>
          <Link to="/contact" className="text-white/50 hover:text-yellow-300 transition-colors">Contact</Link>
          <span className="text-white/15">·</span>
          <Link to="/zmanim-guide" className="text-white/50 hover:text-yellow-300 transition-colors">Zmanim Guide</Link>
        </div>
        <p className="text-[10px] text-white/25">© {new Date().getFullYear()} SolarZmanim</p>
      </div>
    </footer>
  );
}