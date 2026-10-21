'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { LangSwitch, useLang } from './LangProvider';
import type { Translations } from '@/lib/i18n';
import './Navbar.css';
import Logo from '../Logo';

const fr = {
  home: 'Accueil',
  services: 'Services',
  internships: 'Stages 2026',
  appointment: 'Prenez un rendez-vous',
  brandLabel: '3LM Solutions, accueil',
  mainNav: 'Navigation principale',
  mobileNav: 'Navigation mobile',
  openMenu: 'Ouvrir le menu',
  closeMenu: 'Fermer le menu',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    home: 'Home',
    services: 'Services',
    internships: 'Internships 2026',
    appointment: 'Book a call',
    brandLabel: '3LM Solutions, home',
    mainNav: 'Main navigation',
    mobileNav: 'Mobile navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
};

export default function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const t = T[useLang()];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const active = (p: string) => pathname === p;

  return (
    <header className={`navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="nav-wrap">
        <Link href="/" className="brand" aria-label={t.brandLabel}>
          <Logo height={42} />
        </Link>

        <nav className="desktop-nav" aria-label={t.mainNav}>
          <Link className={active('/') ? 'active' : ''} href="/">{t.home}</Link>
          <Link href="/public/expertise" className={active('/public/expertise') ? 'active' : ''}>{t.services}</Link>
          {/** <Link href="/public/carrieres" className="nav-careers">Carrières</Link> **/}
          <Link href="/public/nearshore" className="nav-nearshore">Nearshore</Link>
          <Link href="/public/stages" className="nav-internship">{t.internships}</Link>

        </nav>

        <div className="nav-actions">
          <LangSwitch />
          <ThemeToggle />
          <Link href="/public/rendez-vous" className="nav-appointment">{t.appointment}</Link>
        </div>

        <button
          className="nav-toggle"
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t.closeMenu : t.openMenu}
          aria-expanded={open}
        >
          {open ? '×' : '☰'}
        </button>
      </div>

      {open && (
        <nav className="mobile-nav" aria-label={t.mobileNav}>
          {/* Same links as the desktop menu, in the same order */}
          <Link href="/" className={active('/') ? 'active' : ''}>{t.home}</Link>
          <Link href="/public/expertise" className={active('/public/expertise') ? 'active' : ''}>{t.services}</Link>
          <Link href="/public/nearshore" className={`nav-nearshore ${active('/public/nearshore') ? 'active' : ''}`}>Nearshore</Link>
          <Link href="/public/stages" className={`nav-internship ${pathname.startsWith('/public/stages') ? 'active' : ''}`}>{t.internships}</Link>
          <Link href="/public/rendez-vous" className="nav-appointment">{t.appointment}</Link>
          <div className="mobile-nav-tools">
            <LangSwitch />
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}
