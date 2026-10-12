//verification de la session pour l'espace admin
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import PageTransition from './PageTransition';
import { getToken } from '@/lib/auth';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

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
      <Sidebar />
      <main className="flex-1 bg-[var(--paper)] min-h-screen flex flex-col min-w-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <GlobalSearch />
    </div>
  );
}