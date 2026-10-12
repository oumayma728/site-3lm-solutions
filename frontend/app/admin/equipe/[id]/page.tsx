'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  getEquipeById,
  updateEmploye,
  type equipe,
} from '@/lib/equipe';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/ToastProvider';

const PROFILS = ['Junior', 'Senior', 'Chef de projet'] as const;

const inputClass =
  'w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent-primary)]';
const labelClass = 'block text-xs uppercase tracking-wider text-[var(--ink-soft)] font-mono-num mb-1.5';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function initialsOf(employee: equipe) {
  return `${employee.prenom?.[0] ?? ''}${employee.nom?.[0] ?? ''}`.toUpperCase();
}

export default function EmployeeDetailPage() {
  const toast = useToast();
  const { id } = useParams<{ id: string }>();

  const [employee, setEmployee] = useState<equipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<equipe>>({});

  useEffect(() => {
    getEquipeById(id)
      .then((data) => {
        setEmployee(data);
        setFormData(data);
      })
      .catch(() => toast.error("Impossible de charger l'employé."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startEditing = () => {
    if (employee) setFormData(employee);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!employee) return;
    setSaving(true);
    try {
      const updated = await updateEmploye(employee.id, {
        ...formData,
        salaire: formData.salaire != null ? String(formData.salaire) : undefined,
      });
      setEmployee(updated);
      setFormData(updated);
      setEditing(false);
      toast.success('Employé mis à jour.');
    } catch {
      toast.error("Erreur lors de la mise à jour de l'employé.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-8 py-10 max-w-3xl">
      <Link
        href="/admin/equipe"
        className="text-xs font-mono-num text-[var(--ink-soft)] hover:text-[var(--accent-primary)] transition-colors"
      >
        ← retour aux employés
      </Link>

      <div className="mt-6 mb-8 flex items-start justify-between gap-4">
        <PageHeader eyebrow="Équipe" title={employee ? `${employee.prenom} ${employee.nom}` : 'Employé'} />

        {!loading && employee && (
          <button
            type="button"
            onClick={() => (editing ? setEditing(false) : startEditing())}
            className="shrink-0 text-sm font-medium px-4 py-2 rounded-lg border border-[var(--line)] transition-colors hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)]"
          >
            {editing ? 'Annuler' : 'Modifier'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-[var(--line)]/50 animate-pulse" />
          ))}
        </div>
      ) : !employee ? (
        <p className="text-sm text-[var(--ink-soft)]">Employé introuvable.</p>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-8 rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold shrink-0"
              style={{ backgroundImage: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
            >
              {initialsOf(employee)}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold truncate">{employee.prenom} {employee.nom}</p>
              <p className="text-sm text-[var(--ink-soft)] truncate">{employee.poste || 'Poste non renseigné'}</p>
            </div>
            <span className="ml-auto shrink-0 inline-flex rounded-full border border-[var(--line)] px-3 py-1 text-xs font-medium">
              {employee.profil}
            </span>
          </div>

          {editing ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <Field label="Nom">
                  <input
                    className={inputClass}
                    value={formData.nom || ''}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </Field>
                <Field label="Prénom">
                  <input
                    className={inputClass}
                    value={formData.prenom || ''}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    className={inputClass}
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Field>
                <Field label="Téléphone">
                  <input
                    className={inputClass}
                    value={formData.telephone || ''}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </Field>
                <Field label="Poste">
                  <input
                    className={inputClass}
                    value={formData.poste || ''}
                    onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                  />
                </Field>
                <Field label="Profil">
                  <select
                    className={inputClass}
                    value={formData.profil || ''}
                    onChange={(e) => setFormData({ ...formData, profil: e.target.value })}
                  >
                    {PROFILS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Salaire">
                  <input
                    className={inputClass}
                    value={formData.salaire ?? ''}
                    onChange={(e) => setFormData({ ...formData, salaire: e.target.value as unknown as number })}
                  />
                </Field>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full text-white py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 hover:shadow-lg hover:-translate-y-0.5"
                style={{ backgroundImage: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] divide-y divide-[var(--line)]">
              {[
                { label: 'Email', value: employee.email },
                { label: 'Téléphone', value: employee.telephone },
                { label: 'Poste', value: employee.poste },
                { label: 'Profil', value: employee.profil },
                { label: 'Salaire', value: employee.salaire != null ? `${employee.salaire} DT` : null },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-4">
                  <span className={labelClass + ' mb-0'}>{row.label}</span>
                  <span className="text-sm font-medium">{row.value || 'Non renseigné'}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
