'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOffre, type OffreInput } from '@/lib/offres';
import { useToast } from '@/components/ToastProvider';
import { DEPARTEMENTS, modeleOffre, type ChampsOffre, type ProgrammeStage } from '@/lib/modelesOffres';

function linesToList(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

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

export default function OffreForm({ type }: { type: 'emploi' | 'stage' }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [programme, setProgramme] = useState<ProgrammeStage>('pfe');
  // Département choisi dans la liste, ou « autre » (saisie libre, sans modèle).
  const [choixDepartement, setChoixDepartement] = useState('');
  // Les champs démarrent avec la partie formelle du modèle (sans département).
  const [champs, setChamps] = useState<ChampsOffre>(() => modeleOffre(type, 'pfe', null));
  // Vrai dès qu'un champ est modifié à la main : le modèle ne l'écrase plus sans confirmation.
  const [modifie, setModifie] = useState(false);
  const [actif, setActif] = useState(true);

  const {
    titre, departement, location, contractType, experience, description,
    aboutRole, responsibilities, qualifications, benefits, skills,
  } = champs;

  const set = (cle: keyof ChampsOffre) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setChamps((c) => ({ ...c, [cle]: e.target.value }));
    setModifie(true);
  };

  const appliquerModele = (prog: ProgrammeStage, dep: string) => {
    if (modifie && !window.confirm('Remplacer vos modifications par le modèle ?')) return false;
    setChamps(modeleOffre(type, prog, dep && dep !== 'autre' ? dep : null));
    setModifie(false);
    return true;
  };

  const changerProgramme = (p: ProgrammeStage) => {
    if (p !== programme && appliquerModele(p, choixDepartement)) setProgramme(p);
  };

  const changerDepartement = (dep: string) => {
    if (dep === 'autre') {
      // Saisie libre : on garde le contenu actuel, seul le nom du département est à écrire.
      setChoixDepartement('autre');
      setChamps((c) => ({ ...c, departement: '' }));
      return;
    }
    if (appliquerModele(programme, dep)) setChoixDepartement(dep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: OffreInput = {
      titre,
      type_offre: type,
      programme: type === 'stage' ? programme : '',
      departement,
      location,
      contract_type: contractType,
      experience,
      description,
      about_role: linesToList(aboutRole),
      responsibilities: linesToList(responsibilities),
      qualifications: linesToList(qualifications),
      benefits: linesToList(benefits),
      skills: linesToList(skills),
      actif,
    };

    try {
      await createOffre(payload);
      toast.success(type === 'stage' ? 'Stage publié.' : 'Poste publié.');
      router.push('/admin/offre');
    } catch {
      setError("Erreur lors de la création de l'offre. Vérifiez les champs et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      <section className="space-y-5">
        <p className="text-sm text-[var(--ink-soft)]">
          Choisissez {type === 'stage' ? 'le programme et ' : ''}le département : le formulaire est pré-rempli avec
          un modèle formel. Relisez et ajustez avant de publier.
        </p>

        {type === 'stage' && (
          <Field label="Programme">
            <div className="flex gap-2">
              {(['ete', 'pfe'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => changerProgramme(p)}
                  className="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg border transition-all duration-200"
                  style={
                    programme === p
                      ? {
                          backgroundColor: 'var(--accent-primary)',
                          color: '#fff',
                          borderColor: 'transparent',
                        }
                      : { borderColor: 'var(--line)' }
                  }
                >
                  {p === 'ete' ? "Stage d'été" : 'Stage PFE'}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Département">
          <select
            className={inputClass}
            value={choixDepartement}
            onChange={(e) => changerDepartement(e.target.value)}
          >
            <option value="" disabled>
              Choisir un département
            </option>
            {DEPARTEMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            <option value="autre">Autre…</option>
          </select>
          {choixDepartement === 'autre' && (
            <input
              className={`${inputClass} mt-2`}
              value={departement}
              onChange={set('departement')}
              placeholder="Nom du département"
              required
            />
          )}
        </Field>

        <Field label="Titre du poste">
          <input
            className={inputClass}
            value={titre}
            onChange={set('titre')}
            required
            placeholder={type === 'stage' ? 'Ex: Stage PFE — Développement Web' : 'Ex: Ingénieur DevOps'}
          />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Localisation">
            <input className={inputClass} value={location} onChange={set('location')} placeholder="Ex: Ariana, Tunisie" />
          </Field>
          <Field label="Type de contrat">
            <input className={inputClass} value={contractType} onChange={set('contractType')} placeholder="Ex: Temps plein" />
          </Field>
          <Field label="Expérience">
            <input className={inputClass} value={experience} onChange={set('experience')} placeholder="Ex: 2-3 ans" />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            className={inputClass}
            rows={3}
            value={description}
            onChange={set('description')}
            required
            placeholder="Résumé court affiché sur la liste des offres."
          />
        </Field>
      </section>

      <section className="space-y-5">
        <p className="text-xs uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
          Détails — une ligne par élément
        </p>

        <Field label="À propos du poste">
          <textarea
            className={`${inputClass} resize-none`}
            rows={4}
            value={aboutRole}
            onChange={set('aboutRole')}
            placeholder={'Un paragraphe par ligne...'}
          />
        </Field>

        <Field label="Responsabilités principales">
          <textarea
            className={`${inputClass} resize-none`}
            rows={4}
            value={responsibilities}
            onChange={set('responsibilities')}
            placeholder={'Une responsabilité par ligne...'}
          />
        </Field>

        <Field label="Qualifications requises">
          <textarea
            className={`${inputClass} resize-none`}
            rows={5}
            value={qualifications}
            onChange={set('qualifications')}
            placeholder={'Une qualification par ligne...'}
          />
        </Field>

        <Field label="Ce que nous offrons">
          <textarea
            className={`${inputClass} resize-none`}
            rows={4}
            value={benefits}
            onChange={set('benefits')}
            placeholder={'Un avantage par ligne...'}
          />
        </Field>

        <Field label="Compétences recherchées">
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={skills}
            onChange={set('skills')}
            placeholder={'Une compétence par ligne (Ex: React)...'}
          />
        </Field>
      </section>

      <section className="flex items-center gap-2.5">
        <input
          id="actif"
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="actif" className="text-sm">
          Publier immédiatement (visible sur le site public)
        </label>
      </section>

      {choixDepartement && modifie && (
        <button
          type="button"
          onClick={() => appliquerModele(programme, choixDepartement)}
          className="text-sm underline text-[var(--ink-soft)] hover:text-[var(--accent-primary)]"
        >
          Réinitialiser avec le modèle
        </button>
      )}

      {error && <p className="text-sm text-[var(--accent-brick)]">{error}</p>}

      <button
        type="submit"
        disabled={loading || !titre.trim() || !description.trim()}
        className="w-full text-white py-3.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:grayscale hover:shadow-lg hover:-translate-y-0.5"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      >
        {loading ? 'Publication en cours...' : type === 'stage' ? 'Publier le stage' : 'Publier le poste'}
      </button>
    </form>
  );
}
