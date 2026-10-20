'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';
import Logo from '../Logo';

export default function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

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
        <Link href="/" className="brand" aria-label="3LM Solutions, accueil">
          <Logo height={42} />
        </Link>

        <nav className="desktop-nav" aria-label="Navigation principale">
          <Link className={active('/') ? 'active' : ''} href="/">Accueil</Link>
          <Link href="/public/expertise" className={active('/public/expertise') ? 'active' : ''}>Services</Link>
          {/** <Link href="/public/carrieres" className="nav-careers">Carrières</Link> **/}
          <Link href="/public/nearshore" className="nav-nearshore">Nearshore</Link>
          <Link href="/public/stages" className="nav-internship">Stages 2026</Link>

        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          <Link href="/public/rendez-vous" className="nav-appointment">Prenez un rendez-vous</Link>
        </div>

        <button
          className="nav-toggle"
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          {open ? '×' : '☰'}
        </button>
      </div>

      {open && (
        <nav className="mobile-nav" aria-label="Navigation mobile">
          {/* Same links as the desktop menu, in the same order */}
          <Link href="/" className={active('/') ? 'active' : ''}>Accueil</Link>
          <Link href="/public/expertise" className={active('/public/expertise') ? 'active' : ''}>Services</Link>
          <Link href="/public/nearshore" className={`nav-nearshore ${active('/public/nearshore') ? 'active' : ''}`}>Nearshore</Link>
          <Link href="/public/stages" className={`nav-internship ${pathname.startsWith('/public/stages') ? 'active' : ''}`}>Stages 2026</Link>
          <Link href="/public/rendez-vous" className="nav-appointment">Prenez un rendez-vous</Link>
          <ThemeToggle className="theme-toggle-mobile" />
        </nav>
      )}
    </header>
  );
}
