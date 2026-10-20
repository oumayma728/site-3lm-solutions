
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
    getAllEquipesAdmin,
    type equipe,
} from '@/lib/equipe';

import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/ToastProvider';

export default function EquipeListPage() {
    const toast = useToast();

    const [equipes, setEquipes] = useState<equipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        getAllEquipesAdmin()
            .then(setEquipes)
            .catch(() =>
                toast.error('Impossible de charger les employés.')
            )
            .finally(() => setLoading(false));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredEquipes = equipes.filter((employee) => {
        const query = search.toLowerCase();

        return (
            employee.nom?.toLowerCase().includes(query) ||
            employee.prenom?.toLowerCase().includes(query) ||
            employee.email?.toLowerCase().includes(query) ||
            employee.poste?.toLowerCase().includes(query) ||
            employee.profil?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="mx-auto w-full max-w-6xl px-8 py-10">
            <PageHeader
                eyebrow="Équipe"
                title="Employés"
            />

            {/* Header */}
            {!loading && (
                <div className="mt-8 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-[var(--ink-soft)]">
                            {equipes.length}{' '}
                            {equipes.length === 1
                                ? 'employé'
                                : 'employés'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative w-72">
                            <input
                                type="text"
                                placeholder="Rechercher un employé..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition placeholder:text-[var(--ink-soft)] focus:border-[var(--accent-secondary)]"
                            />
                        </div>

                        {/* Add employee */}
                        <Link
                            href="/admin/equipe/nouveau"
                            className="rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-primary-hover)]"
                        >
                            + Nouvel employé
                        </Link>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-20 animate-pulse rounded-2xl bg-[var(--line)]/50"
                        />
                    ))}
                </div>
            ) : equipes.length === 0 ? (
                /* Empty state */
                <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--line)] text-lg">
                        +
                    </div>

                    <p className="mt-4 text-sm font-semibold">
                        Aucun employé
                    </p>

                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        Ajoutez votre premier membre de l’équipe.
                    </p>

                    <Link
                        href="/admin/equipe/nouveau"
                        className="mt-5 inline-flex rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-primary-hover)]"
                    >
                        Ajouter un employé
                    </Link>
                </div>
            ) : filteredEquipes.length === 0 ? (
                /* Search empty state */
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center">
                    <p className="text-sm font-medium">
                        Aucun employé trouvé
                    </p>

                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        Essayez avec un autre nom, poste ou profil.
                    </p>
                </div>
            ) : (
                /* Employee list */
                <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
                    {/* Table header */}
                    <div className="hidden grid-cols-[2fr_1.5fr_1fr_auto] items-center gap-6 border-b border-[var(--line)] bg-[var(--line)]/20 px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-soft)] md:grid">
                        <span>Employé</span>
                        <span>Poste</span>
                        <span>Profil</span>
                        <span></span>
                    </div>

                    {filteredEquipes.map((employee) => (
                        <Link
                            key={employee.id}
                            href={`/admin/equipe/${employee.id}`}
                            className="group block border-b border-[var(--line)] px-6 py-5 transition last:border-b-0 hover:bg-[var(--line)]/10"
                        >
                            <div className="grid items-center gap-4 md:grid-cols-[2fr_1.5fr_1fr_auto]">
                                {/* Employee */}
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--line)] text-xs font-semibold">
                                        {employee.prenom?.[0]}
                                        {employee.nom?.[0]}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">
                                            {employee.prenom} {employee.nom}
                                        </p>

                                        <p className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">
                                            {employee.email || 'Email non renseigné'}
                                        </p>
                                    </div>
                                </div>

                                {/* Poste */}
                                <div className="hidden md:block">
                                    <p className="truncate text-sm">
                                        {employee.poste || 'Non renseigné'}
                                    </p>
                                </div>

                                {/* Profil */}
                                <div className="hidden md:block">
                                    <span className="inline-flex rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-medium">
                                        {employee.profil}
                                    </span>
                                </div>

                                {/* Arrow */}
                                <div className="text-right">
                                    <span className="text-sm text-[var(--ink-soft)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent-secondary)]">
                                        →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

