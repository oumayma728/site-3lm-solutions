'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Client, ModeTarification } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import ClientPicker from '@/components/ClientPicker';

// Les deux modes de chiffrage possibles — voir le commentaire détaillé sur
// ModeTarification dans lib/types.ts. Affichés comme deux cartes cliquables
// dans le formulaire, juste avant le bouton de création.
const MODES: { value: ModeTarification; titre: string; description: string }[] = [
  {
    value: 'estimation_ia',
    titre: 'Estimation IA',
    description: "L'IA calcule un prix par ligne à partir d'un tarif journalier par profil (comportement habituel).",
  },
  {
    value: 'cout_reel',
    titre: 'Coût réel + marge',
    description: "L'IA estime juste l'équipe nécessaire (aucun prix par ligne) — vous saisirez ensuite le coût réel payé, et la marge sera ajoutée automatiquement.",
  },
];

const EXEMPLES_BESOINS = [
  {
    label: 'Site vitrine',
    text: 'Site vitrine 5 pages, formulaire contact, design responsive, hébergement 1 an, livraison sous 3 semaines.',
  },
  {
    label: 'App mobile',
    text: 'Application mobile iOS/Android, authentification, notifications push, tableau de bord admin, budget ~15 000 €.',
  },
  {
    label: 'Formation',
    text: 'Formation Excel avancé pour 12 personnes, 2 jours sur site, supports PDF inclus, certification interne.',
  },
];

function StepBadge({ n }: { n: number }) {
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold text-white shrink-0"
      style={{ backgroundColor: 'var(--accent-primary)' }}
    >
      {n}
    </span>
  );
}

function NouveauDevisForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClient = searchParams.get('client') ?? '';

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(preselectedClient);
  const [besoins, setBesoins] = useState('');
  // Mode de chiffrage choisi pour ce devis — 'estimation_ia' par défaut,
  // modifiable ici avant création (et changeable plus tard, voir DevisPreview).
  const [modeTarification, setModeTarification] = useState<ModeTarification>('estimation_ia');
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/clients/')
      .then((res) => setClients(res.data))
      .catch(() => setError('Impossible de charger les clients.'))
      .finally(() => setLoadingClients(false));
  }, []);

  const selectedClient = clients.find((c) => String(c.id) === clientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/devis/', {
        client: clientId,
        besoins_client: besoins,
        mode_tarification: modeTarification,
      });
      router.push(`/admin/devis/${res.data.id}?generer=1`);
    } catch {
      setError('Erreur lors de la création du devis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full px-8 py-10 max-w-3xl">
      <Link
        href="/admin/devis"
        className="text-xs font-mono-num text-[var(--ink-soft)] hover:text-[var(--accent-primary)] transition-colors"
      >
        ← retour au registre
      </Link>

      <div className="mt-6 mb-8">
        <PageHeader eyebrow="Assistant IA" title="Nouveau devis" />
        <p className="text-sm text-[var(--ink-soft)] -mt-4">
          Décrivez les besoins du client — l&apos;assistant générera automatiquement le devis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sélection client */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <StepBadge n={1} />
            <span className="text-xs uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
              Client
            </span>
          </div>
          <ClientPicker
            clients={clients}
            loading={loadingClients}
            selectedId={clientId}
            onSelect={setClientId}
            locked={Boolean(preselectedClient)}
          />
        </section>

        {/* Besoins */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <StepBadge n={2} />
            <label htmlFor="besoins" className="text-xs uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
              Besoins du client
            </label>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {EXEMPLES_BESOINS.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setBesoins(ex.text)}
                className="text-xs rounded-full border border-[var(--line)] px-3 py-1.5 hover:text-white transition-all duration-200"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundImage = 'none';
                  e.currentTarget.style.borderColor = 'var(--line)';
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>

          <textarea
            id="besoins"
            value={besoins}
            onChange={(e) => setBesoins(e.target.value)}
            required
            rows={8}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none resize-none leading-relaxed transition-colors focus:border-[var(--accent-primary)]"
            style={{ boxShadow: 'none' }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,92,231,0.15)')}
            onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
            placeholder="Notes prises pendant l'appel : besoins, contraintes, délais, budget indicatif..."
          />
          <p className="text-xs text-[var(--ink-soft)] mt-2 font-mono-num">
            {besoins.length} caractères · Plus le contexte est détaillé, meilleur sera le devis
          </p>
        </section>

        {/* Mode de chiffrage — voir le commentaire sur MODES en haut du fichier */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <StepBadge n={3} />
            <span className="text-xs uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
              Mode de chiffrage
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MODES.map((m) => {
              const active = modeTarification === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setModeTarification(m.value)}
                  className="text-left rounded-lg border p-4 transition-colors"
                  style={
                    active
                      ? { borderColor: 'var(--accent-primary)', background: '#FFF6F3' }
                      : { borderColor: 'var(--line)' }
                  }
                >
                  <p className="text-sm font-semibold mb-1">{m.titre}</p>
                  <p className="text-xs text-[var(--ink-soft)] leading-relaxed">{m.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {error && <p className="text-sm text-[var(--accent-brick)]">{error}</p>}

        {/* Récap + submit */}
        <section className="rounded-xl bg-[var(--surface)] border border-[var(--line)] p-6">
          <div className="flex items-center gap-2 mb-3">
            <StepBadge n={4} />
            <p className="text-xs uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">Lancement</p>
          </div>
          {selectedClient ? (
            <p className="text-sm mb-4">
              Devis pour{' '}
              <span className="font-medium">
                {selectedClient.nom}
                {selectedClient.entreprise ? ` — ${selectedClient.entreprise}` : ''}
              </span>
            </p>
          ) : (
            <p className="text-sm text-[var(--accent-brick)] mb-4">Sélectionnez un client pour continuer.</p>
          )}

          <button
            type="submit"
            disabled={loading || !clientId || !besoins.trim()}
            className="w-full text-white py-3.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            {loading ? (
              'Création en cours...'
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Créer et générer avec l&apos;IA
              </>
            )}
          </button>
        </section>
      </form>
    </div>
  );
}

export default function NouveauDevisPage() {
  return (
    <Suspense fallback={null}>
      <NouveauDevisForm />
    </Suspense>
  );
}