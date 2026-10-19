'use client';

import { useState , useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import {Offre, getOffreBySlug } from '@/lib/offres';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// "Stage PFE" / "Stage d'été" for internships, "Poste" for jobs
function offreLabel(offre: Offre) {
  if (offre.type_offre !== 'stage') return 'Poste';
  if (offre.programme === 'pfe') return 'Stage PFE';
  if (offre.programme === 'ete') return 'Stage d’été';
  return 'Stage';
}

const NIVEAUX_ETUDE = [
  'Licence 1', 'Licence 2', 'Licence 3',
  'Master 1', 'Master 2',
  'Cycle ingénieur 1', 'Cycle ingénieur 2', 'Cycle ingénieur 3',
  'Autre',
];

function useOffreContext() {
  const params = useSearchParams();
  const ref = params.get('ref');
  const [offre, setOffre] = useState<Offre | null>(null);
  // Lookup that has finished ("slug#attempt"), so we know when the offer is still loading
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${ref}#${attempt}`;

  useEffect(() => {
    if (!ref) return;
    getOffreBySlug(ref)
      .then(setOffre)
      .finally(() => setLoadedKey(`${ref}#${attempt}`));
  }, [ref, attempt]);

  const offreLoading = !!ref && loadedKey !== key;
  // getOffreBySlug returns null both for a missing offer and an unreachable backend
  const offreError = !!ref && !offreLoading && (!offre || offre.slug !== ref);
  const retry = () => setAttempt((a) => a + 1);

  // Ignore an offer left over from a previous ref
  if (!offre || !ref || offreLoading || offreError) {
    return { offreContext: null, offreLoading, offreError, retry };
  }
  return {
    offreContext: { id: offre.id, label: offreLabel(offre), titre: offre.titre , idZ: offre.id, isStage: offre.type_offre === 'stage' },
    offreLoading,
    offreError,
    retry,
  };
}

export default function CandidatureForm() {
  const { offreContext, offreLoading, offreError, retry } = useOffreContext();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cv, setCv] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [consentement, setConsentement] = useState(false);
  const [ecole, setEcole] = useState('');
  const [niveauEtude, setNiveauEtude] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [disponibleDu, setDisponibleDu] = useState('');
  const [disponibleAu, setDisponibleAu] = useState('');

  // School, level and start date are required for internships (also enforced by the backend)
  const isStage = !!offreContext?.isStage;
  const today = new Date().toISOString().slice(0, 10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('nom', nom);
      formData.append('email', email);
      formData.append('telephone', telephone);
      if (cv) formData.append('cv', cv);
      formData.append('message', message);
      formData.append('ecole', ecole.trim());
      formData.append('niveau_etude', niveauEtude);
      formData.append('linkedin_url', linkedinUrl.trim());
      // Empty dates are left out: DRF rejects "" for a DateField
      if (disponibleDu) formData.append('disponible_du', disponibleDu);
      if (disponibleAu) formData.append('disponible_au', disponibleAu);
      formData.append('consentement', String(consentement));
      // Honeypot: always empty for humans
      const honeypot = (document.getElementById('site_web') as HTMLInputElement | null)?.value || '';
      formData.append('site_web', honeypot);
      if (offreContext) {
        formData.append('offre', String(offreContext.id));
        formData.append('reference', offreContext.titre);
      }

      await axios.post(`${API_URL}/candidature/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        // Rate limit (see DEFAULT_THROTTLE_RATES['candidature'] in backend settings)
        setError('Trop de candidatures envoyées. Réessayez dans une heure.');
      } else if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data;
        const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : String(data);
        setError(msg || "Erreur lors de l'envoi de votre candidature.");
      } else {
        setError("Erreur lors de l'envoi de votre candidature.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="candidature-card candidature-success">
        <div className="candidature-success-icon">✓</div>
        <h2>Candidature envoyée !</h2>
        <p>Merci {nom}, nous avons bien reçu votre candidature et reviendrons vers vous rapidement.</p>
      </div>
    );
  }

  return (
    <form className="candidature-card" onSubmit={handleSubmit}>
      {offreContext && (
        <div className="candidature-context">
          <small>{offreContext.label}</small>
          <strong>{offreContext.titre}</strong>
        </div>
      )}

      {offreError && (
        <div className="candidature-error candidature-offre-error" role="alert">
          <p>
            <strong>Impossible de charger l’offre.</strong> Elle n’est peut-être plus disponible,
            ou le service est momentanément inaccessible.
          </p>
          <div className="candidature-offre-error-actions">
            <button type="button" onClick={retry}>Réessayer</button>
            <a href="/public/candidature">Envoyer une candidature spontanée</a>
          </div>
        </div>
      )}

      {error && <div className="candidature-error">{error}</div>}

      <div className="candidature-section">
        <div className="candidature-section-head">
          <span className="candidature-section-num">01</span>
          <h2>Vos informations</h2>
        </div>
        <div className="candidature-grid-2">
          <div className="field-group">
            <label htmlFor="nom">Nom</label>
            <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" required />
          </div>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="telephone">Téléphone</label>
          <input id="telephone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Ex. +216 22 333 444" required />
        </div>
      </div>

      <div className="candidature-section">
        <div className="candidature-section-head">
          <span className="candidature-section-num">02</span>
          <h2>Votre parcours</h2>
        </div>
        <div className="candidature-grid-2">
          <div className="field-group">
            <label htmlFor="ecole">École / Université{!isStage && ' (facultatif)'}</label>
            <input id="ecole" value={ecole} onChange={(e) => setEcole(e.target.value)} placeholder="Ex. ESPRIT, INSAT, ENIT..." maxLength={200} required={isStage} />
          </div>
          <div className="field-group">
            <label htmlFor="niveau_etude">Niveau d’études{!isStage && ' (facultatif)'}</label>
            <select id="niveau_etude" value={niveauEtude} onChange={(e) => setNiveauEtude(e.target.value)} required={isStage}>
              <option value="">Sélectionnez...</option>
              {NIVEAUX_ETUDE.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="linkedin_url">Profil LinkedIn (facultatif)</label>
          <input id="linkedin_url" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://www.linkedin.com/in/votre-profil" />
        </div>
        <div className="candidature-grid-2">
          <div className="field-group">
            <label htmlFor="disponible_du">Disponible à partir du{!isStage && ' (facultatif)'}</label>
            <input id="disponible_du" type="date" value={disponibleDu} min={today} onChange={(e) => setDisponibleDu(e.target.value)} required={isStage} />
          </div>
          <div className="field-group">
            <label htmlFor="disponible_au">Jusqu’au (facultatif)</label>
            <input id="disponible_au" type="date" value={disponibleAu} min={disponibleDu || today} onChange={(e) => setDisponibleAu(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="candidature-section">
        <div className="candidature-section-head">
          <span className="candidature-section-num">03</span>
          <h2>Votre CV</h2>
        </div>
        <label htmlFor="cv" className="candidature-dropzone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v12m0-12l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
          <span>{cv ? cv.name : 'Cliquez pour choisir un fichier (PDF, DOC ou DOCX — 5 Mo max)'}</span>
          <input
            id="cv"
            type="file"
            accept=".pdf,.doc,.docx"
            required
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              // Same limit as MAX_CV_SIZE in backend/candidature/serializers.py
              if (file && file.size > 5 * 1024 * 1024) {
                setError('Le CV ne doit pas dépasser 5 Mo.');
                e.target.value = '';
                setCv(null);
                return;
              }
              setError(null);
              setCv(file);
            }}
          />
        </label>
      </div>

      {/* Honeypot: hidden from humans, bots may fill it */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}
      >
        <label htmlFor="site_web">Ne pas remplir</label>
        <input id="site_web" name="site_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="candidature-section">
        <div className="candidature-section-head">
          <span className="candidature-section-num">04</span>
          <h2>Votre message</h2>
        </div>
        <div className="field-group">
          <label htmlFor="message">Motivation (facultatif)</label>
          <textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ce qui vous motive à nous rejoindre..." />
        </div>
      </div>

      {/* If this text changes, bump CONSENTEMENT_VERSION in backend/candidature/serializers.py */}
      <label htmlFor="consentement" className="candidature-consent">
        <input
          id="consentement"
          type="checkbox"
          checked={consentement}
          onChange={(e) => setConsentement(e.target.checked)}
          required
        />
        <span>
          J’accepte que 3LM Solutions conserve et utilise les informations de ce formulaire et mon CV
          pendant 6 mois pour étudier ma candidature et me recontacter, y compris dans son outil
          interne de suivi des stagiaires, où mon CV peut être analysé avec l’aide d’une IA (la
          décision est toujours prise par une personne). Je peux demander leur suppression à tout
          moment. En savoir plus :{' '}
          <a href="/public/confidentialite#candidatures" target="_blank" rel="noopener noreferrer">
            politique de confidentialité
          </a>.
        </span>
      </label>

      <button type="submit" className="candidature-submit" disabled={loading || offreLoading || offreError || !consentement}>
        {loading ? 'Envoi en cours...' : offreLoading ? 'Chargement de l’offre...' : 'Envoyer ma candidature'}
      </button>
    </form>
  );
}
