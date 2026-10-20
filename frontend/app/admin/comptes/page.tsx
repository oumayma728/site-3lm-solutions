'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/ToastProvider';
import {
  createCompte, getComptes, getMoi, messageErreur, updateCompte,
  type Compte, type Moi,
} from '@/lib/comptes';

const inputClass =
  'w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent-primary)]';
const labelClass = 'mb-1.5 block text-xs font-medium text-[var(--ink-soft)]';
const btnSecondaire =
  'rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-40';

// Strong random password to hand over to the new member (they can be given a new one later)
function genererMotDePasse() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_!';
  const valeurs = crypto.getRandomValues(new Uint32Array(16));
  return Array.from(valeurs, (v) => chars[v % chars.length]).join('');
}

function nomComplet(c: Pick<Compte, 'first_name' | 'last_name' | 'username'>) {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || c.username;
}

function derniereConnexion(iso: string | null) {
  if (!iso) return 'Jamais connecté';
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

const VIDE = { username: '', first_name: '', last_name: '', email: '', password: '', is_superuser: false };

function MotDePasseField({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex gap-2">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className={`${inputClass} font-mono-num`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
      />
      <button type="button" className={btnSecondaire} onClick={() => setVisible((v) => !v)}>
        {visible ? 'Masquer' : 'Afficher'}
      </button>
      <button
        type="button"
        className={btnSecondaire}
        onClick={() => { onChange(genererMotDePasse()); setVisible(true); }}
      >
        Générer
      </button>
    </div>
  );
}

export default function ComptesPage() {
  const toast = useToast();
  const [moi, setMoi] = useState<Moi | null>(null);
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [loading, setLoading] = useState(true);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    getMoi()
      .then(async (m) => {
        setMoi(m);
        if (m.is_superuser) setComptes(await getComptes());
      })
      .catch(() => toast.error('Impossible de charger les comptes.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remplacer = (c: Compte) => setComptes((list) => list.map((x) => (x.id === c.id ? c : x)));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnregistrement(true);
    setErreur(null);
    try {
      const cree = await createCompte(form);
      setComptes((list) => [cree, ...list]);
      toast.success(`Compte « ${cree.username} » créé. Transmettez-lui son mot de passe.`);
      setForm(VIDE);
      setOuvert(false);
    } catch (err) {
      setErreur(messageErreur(err, 'Impossible de créer le compte.'));
    } finally {
      setEnregistrement(false);
    }
  };

  const modifier = async (c: Compte, data: Partial<Compte>, succes: string) => {
    setActionId(c.id);
    try {
      remplacer(await updateCompte(c.id, data));
      toast.success(succes);
    } catch (err) {
      toast.error(messageErreur(err, 'Modification impossible.'));
    } finally {
      setActionId(null);
    }
  };

  const handleReset = async (c: Compte) => {
    setActionId(c.id);
    try {
      remplacer(await updateCompte(c.id, { password: nouveauMdp }));
      toast.success(`Mot de passe de ${nomComplet(c)} changé. Ses sessions ouvertes sont fermées.`);
      setResetId(null);
      setNouveauMdp('');
    } catch (err) {
      toast.error(messageErreur(err, 'Mot de passe refusé.'));
    } finally {
      setActionId(null);
    }
  };

  if (!loading && moi && !moi.is_superuser) {
    return (
      <div className="mx-auto w-full max-w-4xl px-8 py-10">
        <PageHeader eyebrow="Espace équipe" title="Accès & comptes" />
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center text-sm text-[var(--ink-soft)]">
          Cette page est réservée aux administrateurs. Demandez à un administrateur de créer ou modifier un compte.
        </div>
      </div>
    );
  }

  const actifs = comptes.filter((c) => c.is_active).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      <PageHeader
        eyebrow="Espace équipe"
        title="Accès & comptes"
        action={
          !ouvert && (
            <button
              type="button"
              onClick={() => { setOuvert(true); setErreur(null); }}
              className="btn-press rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-[var(--shadow-glow)]"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              + Nouveau compte
            </button>
          )
        }
      />
      <p className="-mt-4 mb-8 max-w-2xl text-sm text-[var(--ink-soft)]">
        Les personnes qui peuvent se connecter à l’espace équipe. Un <strong className="text-[var(--ink)]">administrateur</strong> peut
        en plus gérer les comptes. Un compte n’est jamais supprimé : désactivez-le, la personne est déconnectée immédiatement.
      </p>

      {ouvert && (
        <form onSubmit={handleCreate} className="mb-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <h2 className="mb-5 text-base font-semibold">Nouveau compte</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="prenom">Prénom</label>
              <input id="prenom" className={inputClass} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass} htmlFor="nom">Nom</label>
              <input id="nom" className={inputClass} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass} htmlFor="identifiant">Identifiant de connexion *</label>
              <input id="identifiant" className={inputClass} value={form.username} required autoComplete="off"
                onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="ex. sarra.b" />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">E-mail</label>
              <input id="email" type="email" className={inputClass} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="prenom@3lmsolutions.net" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="mdp">Mot de passe * (8 caractères minimum)</label>
              <MotDePasseField id="mdp" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
              <p className="mt-1.5 text-xs text-[var(--ink-soft)]">
                Transmettez-le à la personne par un canal privé. Vous pourrez le réinitialiser à tout moment.
              </p>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--line)] p-4">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={form.is_superuser}
              onChange={(e) => setForm({ ...form, is_superuser: e.target.checked })} />
            <span>
              <span className="block text-sm font-medium">Administrateur</span>
              <span className="block text-xs text-[var(--ink-soft)]">
                Peut créer, modifier et désactiver les comptes, et gérer l’équipe. À réserver aux responsables.
              </span>
            </span>
          </label>

          {erreur && <p className="mt-4 text-sm text-[var(--accent-brick)]">{erreur}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className="rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)]"
              onClick={() => { setOuvert(false); setForm(VIDE); }}>
              Annuler
            </button>
            <button type="submit" disabled={enregistrement}
              className="btn-press rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-primary)' }}>
              {enregistrement ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--line)]/50" />)}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-xs font-medium text-[var(--ink-soft)]">
            <span>{comptes.length} compte{comptes.length > 1 ? 's' : ''}</span>
            <span>{actifs} actif{actifs > 1 ? 's' : ''}</span>
          </div>

          {comptes.map((c) => {
            const estMoi = c.id === moi?.id;
            const occupe = actionId === c.id;
            return (
              <div key={c.id} className={`border-b border-[var(--line)] px-5 py-4 last:border-0 ${c.is_active ? '' : 'bg-[var(--paper)]'}`}>
                <div className="flex flex-wrap items-center gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: c.is_active ? (c.is_superuser ? 'var(--accent-primary)' : 'var(--ink-soft)') : 'var(--line)' }}
                  >
                    {nomComplet(c).split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`flex flex-wrap items-center gap-2 text-sm font-medium ${c.is_active ? '' : 'text-[var(--ink-soft)]'}`}>
                      {nomComplet(c)}
                      {estMoi && <span className="text-xs font-normal text-[var(--ink-soft)]">(vous)</span>}
                      {c.is_superuser && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ color: 'var(--accent-primary)', background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' }}>
                          Administrateur
                        </span>
                      )}
                      {!c.is_active && (
                        <span className="rounded-full bg-[var(--line)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ink-soft)]">
                          Désactivé
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">
                      <span className="font-mono-num">{c.username}</span>
                      {c.email && ` · ${c.email}`}
                      {' · '}
                      {derniereConnexion(c.last_login)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={btnSecondaire} disabled={occupe || !c.is_active}
                      onClick={() => { setResetId(resetId === c.id ? null : c.id); setNouveauMdp(''); }}>
                      Mot de passe
                    </button>
                    <button type="button" className={btnSecondaire} disabled={occupe || estMoi || !c.is_active}
                      title={estMoi ? 'Vous ne pouvez pas retirer vos propres droits' : undefined}
                      onClick={() => {
                        if (!c.is_superuser && !window.confirm(`Donner les droits d’administrateur à ${nomComplet(c)} ?`)) return;
                        modifier(c, { is_superuser: !c.is_superuser },
                          c.is_superuser ? `${nomComplet(c)} n’est plus administrateur.` : `${nomComplet(c)} est maintenant administrateur.`);
                      }}>
                      {c.is_superuser ? 'Retirer admin' : 'Rendre admin'}
                    </button>
                    <button type="button" disabled={occupe || estMoi}
                      title={estMoi ? 'Vous ne pouvez pas désactiver votre propre compte' : undefined}
                      className={c.is_active
                        ? `${btnSecondaire} hover:!border-[var(--accent-brick)] hover:!text-[var(--accent-brick)]`
                        : btnSecondaire}
                      onClick={() => {
                        if (c.is_active && !window.confirm(`Désactiver le compte de ${nomComplet(c)} ? La personne sera déconnectée immédiatement.`)) return;
                        modifier(c, { is_active: !c.is_active },
                          c.is_active ? `Compte de ${nomComplet(c)} désactivé.` : `Compte de ${nomComplet(c)} réactivé.`);
                      }}>
                      {c.is_active ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </div>
                </div>

                {resetId === c.id && (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleReset(c); }}
                    className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4"
                  >
                    <label className={labelClass} htmlFor={`mdp-${c.id}`}>
                      Nouveau mot de passe pour {nomComplet(c)}
                    </label>
                    <MotDePasseField id={`mdp-${c.id}`} value={nouveauMdp} onChange={setNouveauMdp} />
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" className="px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)]" onClick={() => setResetId(null)}>
                        Annuler
                      </button>
                      <button type="submit" disabled={occupe || nouveauMdp.length < 8}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: 'var(--accent-primary)' }}>
                        Enregistrer
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
