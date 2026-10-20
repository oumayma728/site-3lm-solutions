'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEmploye, type EmployeInput } from '@/lib/equipe';
import { useToast } from '@/components/ToastProvider';


const inputClass =
    'w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent-primary)]';
const labelClass = 'block text-xs uppercase tracking-wider text-[var(--ink-soft)] font-mono-num mb-1.5';
const PROFILS = ['junior', 'senior', 'chef_de_projet'] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            {children}
        </div>
    );
}

export default function EmployeForm() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [email, setEmail] = useState('');
    const [telephone, setTelephone] = useState('');
    const [poste, setPoste] = useState('');
    const [profil, setProfil] = useState('');
    const [salaire, setSalaire] = useState('');
    const [actif, setActif] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload: EmployeInput = {
            nom,
            prenom,
            email,
            telephone,
            poste,
            profil,
            salaire,
            actif,
        };

    try {
        await createEmploye(payload);
        toast.success('Employé créé.');
        router.push('/admin/equipe');
    } catch {
        setError("Erreur lors de la création de l'employé. Vérifiez les champs et réessayez.");
    } finally {
        setLoading(false);
    }
    };

return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        <section className="space-y-5">
            <Field label="Nom">
                <input
                    className={inputClass}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                    placeholder="Ex: Dupont"
                />
            </Field>
            <Field label="Prénom">
                <input
                    className={inputClass}
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                    placeholder="Ex: Dupont"
                />
            </Field>
            <Field label="Numéro de téléphone">
                <input
                    className={inputClass}
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    required
                    placeholder="Ex: 123-456-7890"
                />
            </Field>
            <Field label="email">
                <input
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Ex: john.doe@example.com"
                />
            </Field>
            <Field label="Poste">
                <input
                    className={inputClass}
                    value={poste}
                    onChange={(e) => setPoste(e.target.value)}
                    required
                    placeholder="Ex: Développeur Frontend"
                />
            </Field>
            <Field label="Profil">
                <select
                    className={inputClass}
                    value={profil}
                    onChange={(e) => setProfil(e.target.value)}
                    required
                >
                    <option value="" disabled>Sélectionner un profil</option>
                    {PROFILS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
            </Field>
            <Field label="Salaire">
                <input
                    className={inputClass}
                    value={salaire}
                    onChange={(e) => setSalaire(e.target.value)}
                    required
                    placeholder=""
                />
            </Field>
        </section>


        {error && <p className="text-sm text-[var(--accent-brick)]">{error}</p>}

        <button
            type="submit"
            disabled={loading || !nom.trim() || !prenom.trim() || !telephone.trim() || !email.trim() || !poste.trim() || !profil.trim() || !salaire.trim()}
            className="w-full text-white py-3.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:grayscale hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--accent-primary)' }}
        >
            {loading ? 'Enregistrement...'  : 'Créer l\'employé'}
        </button>
    </form>
)};

