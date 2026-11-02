'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import OffreForm from '@/components/OffreForm';
import { getOffreBySlug, type Offre } from '@/lib/offres';

export default function ModifierOffrePage() {
  const { slug } = useParams<{ slug: string }>();
  // undefined = loading, null = not found / unreachable
  const [offre, setOffre] = useState<Offre | null | undefined>(undefined);

  useEffect(() => {
    // Logged-in requests also see archived offers, so they can be edited too
    getOffreBySlug(slug).then(setOffre);
  }, [slug]);

  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-10">
      <Link
        href="/admin/offre"
        className="text-xs font-mono-num text-[var(--ink-soft)] hover:text-[var(--accent-primary)] transition-colors"
      >
        ← retour aux offres
      </Link>

      <div className="mt-6 mb-8">
        <PageHeader
          eyebrow={offre?.type_offre === 'stage' ? 'Stages' : 'Offres'}
          title={offre ? `Modifier « ${offre.titre} »` : 'Modifier l’offre'}
        />
      </div>

      {offre === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--line)]/50" />)}
        </div>
      ) : offre === null ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center text-sm text-[var(--ink-soft)]">
          Offre introuvable. Elle a peut-être été supprimée.{' '}
          <Link href="/admin/offre" className="underline">Revenir à la liste</Link>
        </div>
      ) : (
        // key: a fresh form if another offer is opened
        <OffreForm key={offre.slug} type={offre.type_offre} offre={offre} />
      )}
    </div>
  );
}
