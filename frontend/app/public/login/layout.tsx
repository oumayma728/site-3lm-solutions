import type { Metadata } from 'next';

// Page de connexion de l'équipe : accessible par son URL (ou via /admin, qui y redirige),
// mais jamais listée par les moteurs de recherche. La page elle-même est un composant
// client ('use client') : ses métadonnées doivent donc être déclarées ici.
export const metadata: Metadata = {
  title: 'Connexion — Espace équipe',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
