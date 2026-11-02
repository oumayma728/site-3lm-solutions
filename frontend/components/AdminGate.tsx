//verification de la session pour l'espace admin
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import PageTransition from './PageTransition';
import Logo from './Logo';
import { getToken } from '@/lib/auth';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  // Phone menu: open only for the page it was opened on, so it closes by itself on navigation
  const [menuOuvertSur, setMenuOuvertSur] = useState<string | null>(null);
  const menuOuvert = menuOuvertSur === pathname;

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace(`/public/login?next=${encodeURIComponent(pathname)}`);
      return;
    }


    setChecked(true);
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">
        Vérification de la session...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={menuOuvert} onClose={() => setMenuOuvertSur(null)} />
      {menuOuvert && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-hidden="true"
          onClick={() => setMenuOuvertSur(null)}
        />
      )}
      <main className="flex-1 bg-[var(--paper)] min-h-screen flex flex-col min-w-0">
        {/* Phone top bar: logo + menu button (the sidebar is hidden below md) */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 md:hidden">
          <Link href="/admin/dashboard" aria-label="Tableau de bord">
            <Logo height={32} style={{ '--a2': '#0e7490', '--muted': 'var(--ink-soft)' } as CSSProperties} />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOuvertSur(pathname)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOuvert}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-[var(--line)]/50"
          >
            ☰
          </button>
        </div>
        <PageTransition>{children}</PageTransition>
      </main>
      <GlobalSearch />
    </div>
  );
}
