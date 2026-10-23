'use client';

import { useState , useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import {Offre, getOffreBySlug } from '@/lib/offres';
import { API_URL } from '@/lib/apiUrl';
import { useLang } from '@/components/site/LangProvider';
import type { Translations } from '@/lib/i18n';

// Values sent to the backend (NIVEAU_ETUDE_CHOICES there): always French, only the labels change
const NIVEAUX_ETUDE = [
  'Licence 1', 'Licence 2', 'Licence 3',
  'Master 1', 'Master 2',
  'Cycle ingénieur 1', 'Cycle ingénieur 2', 'Cycle ingénieur 3',
  'Autre',
];

const fr = {
  // "Stage PFE" / "Stage d'été" for internships, "Poste" for jobs
  offreLabel: { job: 'Poste', pfe: 'Stage PFE', ete: 'Stage d’été', stage: 'Stage' },
  niveaux: NIVEAUX_ETUDE,
  optional: ' (facultatif)',
  tooMany: 'Trop de candidatures envoyées. Réessayez dans une heure.',
  sendError: "Erreur lors de l'envoi de votre candidature.",
  cvTooBig: 'Le CV ne doit pas dépasser 5 Mo.',
  sentTitle: 'Candidature envoyée !',
  sentText: (nom: string) => `Merci ${nom}, nous avons bien reçu votre candidature et reviendrons vers vous rapidement.`,
  offreErrorTitle: 'Impossible de charger l’offre.',
  offreErrorText: 'Elle n’est peut-être plus disponible, ou le service est momentanément inaccessible.',
  retry: 'Réessayer',
  spontaneous: 'Envoyer une candidature spontanée',
  closedTitle: 'Cette offre est clôturée.',
  closedText: 'Elle n’accepte plus de candidatures.',
  otherOffers: '← Voir les autres offres',
  s1: 'Vos informations',
  name: 'Nom',
  namePh: 'Votre nom',
  email: 'Email',
  emailPh: 'vous@exemple.com',
  phone: 'Téléphone',
  phonePh: 'Ex. +216 22 333 444',
  s2: 'Votre parcours',
  school: 'École / Université',
  schoolPh: 'Ex. ESPRIT, INSAT, ENIT...',
  level: 'Niveau d’études',
  select: 'Sélectionnez...',
  linkedin: 'Profil LinkedIn (facultatif)',
  linkedinPh: 'https://www.linkedin.com/in/votre-profil',
  from: 'Disponible à partir du',
  until: 'Jusqu’au (facultatif)',
  s3: 'Votre CV',
  cvPick: 'Cliquez pour choisir un fichier (PDF, DOC ou DOCX — 5 Mo max)',
  honeypot: 'Ne pas remplir',
  s4: 'Votre message',
  motivation: 'Motivation (facultatif)',
  motivationPh: 'Ce qui vous motive à nous rejoindre...',
  consent:
    'J’accepte que 3LM Solutions conserve et utilise les informations de ce formulaire et mon CV pendant 6 mois pour étudier ma candidature et me recontacter, y compris dans son outil interne de suivi des stagiaires, où mon CV peut être analysé avec l’aide d’une IA (la décision est toujours prise par une personne). Je peux demander leur suppression à tout moment. En savoir plus :',
  privacyLink: 'politique de confidentialité',
  sending: 'Envoi en cours...',
  loadingOffre: 'Chargement de l’offre...',
  submit: 'Envoyer ma candidature',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    offreLabel: { job: 'Job', pfe: 'Final-year internship (PFE)', ete: 'Summer internship', stage: 'Internship' },
    niveaux: [
      'Bachelor, year 1', 'Bachelor, year 2', 'Bachelor, year 3',
      'Master, year 1', 'Master, year 2',
      'Engineering school, year 1', 'Engineering school, year 2', 'Engineering school, year 3',
      'Other',
    ],
    optional: ' (optional)',
    tooMany: 'Too many applications sent. Please try again in an hour.',
    sendError: 'Your application could not be sent.',
    cvTooBig: 'Your CV must not exceed 5 MB.',
    sentTitle: 'Application sent!',
    sentText: (nom: string) => `Thank you ${nom}, we have received your application and will get back to you soon.`,
    offreErrorTitle: 'The offer could not be loaded.',
    offreErrorText: 'It may no longer be available, or the service is temporarily unreachable.',
    retry: 'Try again',
    spontaneous: 'Send an open application',
    closedTitle: 'This offer is closed.',
    closedText: 'It no longer accepts applications.',
    otherOffers: '← See other openings',
    s1: 'Your details',
    name: 'Name',
    namePh: 'Your name',
    email: 'Email',
    emailPh: 'you@example.com',
    phone: 'Phone',
    phonePh: 'E.g. +216 22 333 444',
    s2: 'Your background',
    school: 'School / University',
    schoolPh: 'E.g. ESPRIT, INSAT, ENIT...',
    level: 'Level of study',
    select: 'Select...',
    linkedin: 'LinkedIn profile (optional)',
    linkedinPh: 'https://www.linkedin.com/in/your-profile',
    from: 'Available from',
    until: 'Until (optional)',
    s3: 'Your CV',
    cvPick: 'Click to choose a file (PDF, DOC or DOCX — 5 MB max)',
    honeypot: 'Do not fill in',
    s4: 'Your message',
    motivation: 'Motivation (optional)',
    motivationPh: 'What motivates you to join us...',
    consent:
      'I agree that 3LM Solutions may keep and use the information in this form and my CV for 6 months to review my application and contact me, including in its internal intern-tracking tool, where my CV may be analyzed with the help of AI (the decision is always made by a person). I can ask for their deletion at any time. Learn more:',
    privacyLink: 'privacy policy',
    sending: 'Sending...',
    loadingOffre: 'Loading the offer...',
    submit: 'Send my application',
  },
};

type OffreLabels = typeof fr.offreLabel;

function offreLabel(offre: Offre, labels: OffreLabels) {
  if (offre.type_offre !== 'stage') return labels.job;
  if (offre.programme === 'pfe') return labels.pfe;
  if (offre.programme === 'ete') return labels.ete;
  return labels.stage;
}

function useOffreContext(labels: OffreLabels) {
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
    offreContext: { id: offre.id, label: offreLabel(offre, labels), titre: offre.titre , idZ: offre.id, isStage: offre.type_offre === 'stage', cloturee: offre.cloturee },
    offreLoading,
    offreError,
    retry,
  };
}

export default function CandidatureForm() {
  const t = T[useLang()];
  const { offreContext, offreLoading, offreError, retry } = useOffreContext(t.offreLabel);

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
  const optional = isStage ? '' : t.optional;
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
        // Rate limits: per IP (DEFAULT_THROTTLE_RATES['candidature']) or per offer (CANDIDATURES_PAR_OFFRE_MAX).
        // The server's message says which one applies.
        const detail = (err.response.data as { detail?: string } | undefined)?.detail;
        setError(detail && !detail.startsWith('Request was throttled') ? detail : t.tooMany);
      } else if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data;
        const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : String(data);
        setError(msg || t.sendError);
      } else {
        setError(t.sendError);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="candidature-card candidature-success">
        <div className="candidature-success-icon">✓</div>
        <h2>{t.sentTitle}</h2>
        <p>{t.sentText(nom)}</p>
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
            <strong>{t.offreErrorTitle}</strong> {t.offreErrorText}
          </p>
          <div className="candidature-offre-error-actions">
            <button type="button" onClick={retry}>{t.retry}</button>
            <a href="/public/candidature">{t.spontaneous}</a>
          </div>
        </div>
      )}

      {offreContext?.cloturee && (
        <div className="candidature-error candidature-offre-error" role="alert">
          <p>
            <strong>{t.closedTitle}</strong> {t.closedText}
          </p>
          <div className="candidature-offre-error-actions">
            <a href={offreContext.isStage ? '/public/stages' : '/public/carrieres'}>{t.otherOffers}</a>
            <a href="/public/candidature">{t.spontaneous}</a>
          </div>
        </div>
      )}

      {error && <div className="candidature-error">{error}</div>}

      <div className="candidature-section">
        <div className="candidature-section-head">
          <span className="candidature-section-num">01</span>
          <h2>{t.s1}</h2>
        </div>
        <div className="candidature-grid-2">
          <div className="field-group">
            <label htmlFor="nom">{t.name}</label>
            <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder={t.namePh} required />
          </div>
          <div className="field-group">
            <label htmlFor="email">{t.email}</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPh} required />
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="telephone">{t.phone}</label>
          <input id="telephone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder={t.phonePh} required />
        </div>
      </div>

      <div className="candidature-section">
        <div className="candidature-section-head">
          <span className="candidature-section-num">02</span>
          <h2>{t.s2}</h2>
        </div>
        <div className="candidature-grid-2">
          <div className="field-group">
            <label htmlFor="ecole">{t.school}{optional}</label>
            <input id="ecole" value={ecole} onChange={(e) => setEcole(e.target.value)} placeholder={t.schoolPh} maxLength={200} required={isStage} />
          </div>
          <div className="field-group">
            <label htmlFor="niveau_etude">{t.level}{optional}</label>
            <select id="niveau_etude" value={niveauEtude} onChange={(e) => setNiveauEtude(e.target.value)} required={isStage}>
              <option value="">{t.select}</option>
              {NIVEAUX_ETUDE.map((n, i) => <option key={n} value={n}>{t.niveaux[i]}</option>)}
            </select>
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="linkedin_url">{t.linkedin}</label>
          <input id="linkedin_url" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder={t.linkedinPh} />
        </div>
        <div className="candidature-grid-2">
          <div className="field-group">
            <label htmlFor="disponible_du">{t.from}{optional}</label>
            <input id="disponible_du" type="date" value={disponibleDu} min={today} onChange={(e) => setDisponibleDu(e.target.value)} required={isStage} />
          </div>
          <div className="field-group">
            <label htmlFor="disponible_au">{t.until}</label>
            <input id="disponible_au" type="date" value={disponibleAu} min={disponibleDu || today} onChange={(e) => setDisponibleAu(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="candidature-section">
        <div className="candidature-section-head">
          <span className="candidature-section-num">03</span>
          <h2>{t.s3}</h2>
        </div>
        <label htmlFor="cv" className="candidature-dropzone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v12m0-12l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
          <span>{cv ? cv.name : t.cvPick}</span>
          <input
            id="cv"
            type="file"
            accept=".pdf,.doc,.docx"
            required
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              // Same limit as MAX_CV_SIZE in backend/candidature/serializers.py
              if (file && file.size > 5 * 1024 * 1024) {
                setError(t.cvTooBig);
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
        <label htmlFor="site_web">{t.honeypot}</label>
        <input id="site_web" name="site_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="candidature-section">
        <div className="candidature-section-head">
          <span className="candidature-section-num">04</span>
          <h2>{t.s4}</h2>
        </div>
        <div className="field-group">
          <label htmlFor="message">{t.motivation}</label>
          <textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.motivationPh} />
        </div>
      </div>

      {/* If this text changes (in either language), bump CONSENTEMENT_VERSION in backend/candidature/serializers.py */}
      <label htmlFor="consentement" className="candidature-consent">
        <input
          id="consentement"
          type="checkbox"
          checked={consentement}
          onChange={(e) => setConsentement(e.target.checked)}
          required
        />
        <span>
          {t.consent}{' '}
          <a href="/public/confidentialite#candidatures" target="_blank" rel="noopener noreferrer">
            {t.privacyLink}
          </a>.
        </span>
      </label>

      <button type="submit" className="candidature-submit" disabled={loading || offreLoading || offreError || !consentement || !!offreContext?.cloturee}>
        {loading ? t.sending : offreLoading ? t.loadingOffre : t.submit}
      </button>
    </form>
  );
}
