'use client';

import { createContext, useContext, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LANG_COOKIE, type Lang } from '@/lib/i18n';

// The language comes from the server (root layout reads the cookie), so the first render is
// already in the right language. Client components read it with useLang().
const LangContext = createContext<Lang>('fr');

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

function saveLang(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang;
}

// FR | EN switch: stores the choice for a year, then re-renders the server pages in that language
// (client state such as a half-filled form is kept).
export function LangSwitch({ className }: { className?: string }) {
  const lang = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (next: Lang) => {
    if (next === lang || pending) return;
    saveLang(next);
    startTransition(() => router.refresh());
  };

  return (
    <div
      className={`lang-switch ${pending ? 'is-pending' : ''} ${className ?? ''}`}
      role="group"
      aria-label={lang === 'fr' ? 'Langue' : 'Language'}
    >
      {(['fr', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          aria-label={l === 'fr' ? 'Français' : 'English'}
          className={lang === l ? 'active' : ''}
          onClick={() => choose(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
