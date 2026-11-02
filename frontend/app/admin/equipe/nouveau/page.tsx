'use client';

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import EmployeForm from '@/components/EmployeForm';

export default function NouveauEmployePage() {
    return (
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
            <Link
                href="/admin/equipe"
                className="text-xs font-mono-num text-[var(--ink-soft)] hover:text-[var(--accent-primary)] transition-colors"
            >
                ←
            </Link>

            <div className="mt-6 mb-8">
                <PageHeader eyebrow="Employés" title="Nouveau employé" />
            </div>

            <EmployeForm />
        </div>
    );
}
