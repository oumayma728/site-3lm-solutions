import type { Metadata } from 'next';
import { getLang } from '@/lib/i18n-server';

// The page itself is a client component ('use client'), so its title is declared here.
// Without it, it inherited the home page's title and search engines showed it instead of the home.
const META = {
  fr: {
    title: 'Prendre rendez-vous',
    description:
      'Réservez un échange avec un expert 3LM Solutions : choisissez un créneau, décrivez votre besoin, et recevez une proposition chiffrée.',
  },
  en: {
    title: 'Book a call',
    description:
      'Book a call with a 3LM Solutions expert: pick a time slot, describe your needs, and receive a costed proposal.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return META[await getLang()];
}

export default function RendezVousLayout({ children }: { children: React.ReactNode }) {
  return children;
}
