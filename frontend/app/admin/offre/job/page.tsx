'use client';

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import OffreForm from '@/components/OffreForm';

export default function NouveauPostePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <Link
        href="/admin/offre"
        className="text-xs font-mono-num text-[var(--ink-soft)] hover:text-[var(--accent-primary)] transition-colors"
      >
        ← retour aux offres
      </Link>

      <div className="mt-6 mb-8">
        <PageHeader eyebrow="Carrières" title="Nouveau poste" />
      </div>

      <OffreForm type="emploi" />
    </div>
  );
}
