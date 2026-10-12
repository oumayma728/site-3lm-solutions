'use client';

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import OffreForm from '@/components/OffreForm';

export default function NouveauStagePage() {
  return (
    <div className="px-8 py-10">
      <Link
        href="/admin/offre"
        className="text-xs font-mono-num text-[var(--ink-soft)] hover:text-[var(--accent-primary)] transition-colors"
      >
        ← retour aux offres
      </Link>

      <div className="mt-6 mb-8">
        <PageHeader eyebrow="Stages" title="Nouveau stage" />
      </div>

      <OffreForm type="stage" />
    </div>
  );
}
