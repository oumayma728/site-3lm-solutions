'use client';

import { useEffect, useState } from 'react';
import { useLang } from './LangProvider';

const STORAGE_KEY = 'theme';

const LABELS = {
  fr: { toDark: 'Activer le mode sombre', toLight: 'Activer le mode clair', dark: 'Mode sombre', light: 'Mode clair' },
  en: { toDark: 'Switch to dark mode', toLight: 'Switch to light mode', dark: 'Dark mode', light: 'Light mode' },
};

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);
  const l = LABELS[useLang()];

  useEffect(() => {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTheme(current);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  };

  if (!mounted) {
    return <span className={`theme-toggle ${className ?? ''}`} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${className ?? ''}`}
      onClick={toggle}
      aria-label={theme === 'light' ? l.toDark : l.toLight}
      title={theme === 'light' ? l.dark : l.light}
    >
      {theme === 'light' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" />
        </svg>
      )}
    </button>
  );
}
