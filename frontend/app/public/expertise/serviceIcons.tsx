import type { ReactNode } from 'react';

export const serviceIcons: Record<string, ReactNode> = {
  'intelligence-artificielle': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2a3 3 0 013 3v1.17a3 3 0 011.5 5.33A3 3 0 0115 17h-1v3a2 2 0 01-4 0v-3H9a3 3 0 01-1.5-5.5A3 3 0 019 6.17V5a3 3 0 013-3z" />
    </svg>
  ),
  'analyse-donnees': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 3v18h18M7 15l4-5 3 3 5-7" />
    </svg>
  ),
  iot: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </svg>
  ),
  'devops-cloud': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M17.5 19a4.5 4.5 0 000-9 6 6 0 00-11.4-1.5A4.5 4.5 0 006.5 19h11z" />
    </svg>
  ),
  'developpement-web': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M3 9h18M8 21h8" />
    </svg>
  ),
  'developpement-mobile': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  ),
  'solutions-erp': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
      <path d="M12 11v9M4 6.5l8 4.5 8-4.5" />
    </svg>
  ),
  'community-management': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="6" r="2.3" />
      <path d="M2 20v-1a5 5 0 015-5h1a5 5 0 015 5v1M15 20v-.7a4 4 0 013-3.9" />
    </svg>
  ),
};