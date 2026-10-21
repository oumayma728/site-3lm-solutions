'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import { useLang } from '@/components/site/LangProvider';
import type { Translations } from '@/lib/i18n';
import '@/components/site/tokens.css';
import '@/components/site/Booking.css';

import { API_URL } from '@/lib/apiUrl';

const fr = {
  trust: [
    'Réponse et confirmation sous 24h ouvrées',
    'Échange avec un expert, pas un commercial générique',
    'Devis personnalisé et chiffré après l’appel',
    'Vos informations restent confidentielles',
  ],
  // Same keys as TYPE_RDV_CONFIG (lib/statusRdv.ts), which the admin uses
  types: [['appel', '📞', 'Appel téléphonique'], ['visio', '🖥️', 'Visioconférence'], ['sur_site', '📍', 'Sur site']] as [string, string, string][],
  sendError: "Erreur lors de l'envoi de votre demande.",
  sentTitle: 'Demande envoyée !',
  sentText: (prenom: string) => `Merci ${prenom}, nous avons bien reçu votre demande de rendez-vous.`,
  sentEmail: ' Un email de confirmation vient de vous être envoyé.',
  sentNoEmail: ' Notre équipe vous recontactera pour confirmer ce créneau.',
  badge: 'Ligne directe',
  h1: ['Parlons de votre ', 'projet', '.'],
  lead: 'Choisissez un créneau et décrivez brièvement votre besoin — un expert 3LM Solutions vous recontacte pour cadrer le projet avant de vous proposer un devis.',
  firstName: 'Prénom',
  firstNamePh: 'Amine',
  lastName: 'Nom',
  lastNamePh: 'Ben Salah',
  email: 'Email',
  emailPh: 'vous@entreprise.com',
  phone: 'Téléphone',
  company: 'Entreprise (facultatif)',
  companyPh: 'Nom de votre entreprise',
  date: 'Date souhaitée',
  time: 'Heure souhaitée',
  taken: 'Déjà pris ce jour-là :',
  type: 'Type de rendez-vous',
  need: 'Votre besoin (facultatif)',
  needPh: 'Décrivez brièvement votre projet ou votre besoin...',
  sending: 'Envoi en cours...',
  submit: 'Demander ce rendez-vous',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    trust: [
      'Reply and confirmation within 24 business hours',
      'A conversation with an expert, not a generic salesperson',
      'A personalized, costed quote after the call',
      'Your information stays confidential',
    ],
    types: [['appel', '📞', 'Phone call'], ['visio', '🖥️', 'Video call'], ['sur_site', '📍', 'On site']],
    sendError: 'Your request could not be sent.',
    sentTitle: 'Request sent!',
    sentText: (prenom: string) => `Thank you ${prenom}, we have received your appointment request.`,
    sentEmail: ' A confirmation email has just been sent to you.',
    sentNoEmail: ' Our team will contact you to confirm this time slot.',
    badge: 'Direct line',
    h1: ['Let’s talk about your ', 'project', '.'],
    lead: 'Pick a time slot and briefly describe your need — a 3LM Solutions expert will get back to you to scope the project before sending you a quote.',
    firstName: 'First name',
    firstNamePh: 'Amine',
    lastName: 'Last name',
    lastNamePh: 'Ben Salah',
    email: 'Email',
    emailPh: 'you@company.com',
    phone: 'Phone',
    company: 'Company (optional)',
    companyPh: 'Your company name',
    date: 'Preferred date',
    time: 'Preferred time',
    taken: 'Already booked that day:',
    type: 'Type of meeting',
    need: 'Your need (optional)',
    needPh: 'Briefly describe your project or your need...',
    sending: 'Sending...',
    submit: 'Request this appointment',
  },
};

export default function RendezVousPublicPage() {
  const t = T[useLang()];
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [entreprise, setEntreprise] = useState('');
  const [message, setMessage] = useState('');
  const [dateRdv, setDateRdv] = useState('');
  const [heureRdv, setHeureRdv] = useState('');
  const [typeRdv, setTypeRdv] = useState('appel');

  const [creneauxPris, setCreneauxPris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ emailEnvoye: boolean } | null>(null);

  useEffect(() => {
    if (!dateRdv) {
      setCreneauxPris([]);
      return;
    }
    axios
      .get(`${API_URL}/rendezvous/creneaux/?date=${dateRdv}`)
      .then((res) => setCreneauxPris(res.data.creneaux_pris || []))
      .catch(() => setCreneauxPris([]));
  }, [dateRdv]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/rendezvous/public/`, {
        prenom,
        nom,
        email,
        telephone,
        entreprise,
        message,
        date_rdv: dateRdv,
        heure_rdv: heureRdv,
        type_rdv: typeRdv,
      });
      setSuccess({ emailEnvoye: res.data.email_envoye });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
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
      <div className="site-lm">
        <SiteNavbar />
        <div className="booking-success">
          <div className="booking-success-card">
            <div className="booking-success-icon">✓</div>
            <h1>{t.sentTitle}</h1>
            <p>
              {t.sentText(prenom)}
              {success.emailEnvoye ? t.sentEmail : t.sentNoEmail}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="site-lm">
      <SiteNavbar />
      <div className="booking-page">
        <div className="booking-bg" aria-hidden="true" />
        <div className="booking-layout">
          <div className="booking-intro">
            <span className="hero-badge"><span className="dot" />{t.badge}</span>
            <h1>{t.h1[0]}<span className="gradient-text">{t.h1[1]}</span>{t.h1[2]}</h1>
            <p>{t.lead}</p>
            <ul className="booking-points">
              {t.trust.map((point) => (
                <li key={point}>
                  <span className="check">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="booking-card">
            <div className="booking-grid-2">
              <div className="field-group">
                <label htmlFor="prenom">{t.firstName}</label>
                <input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder={t.firstNamePh} required />
              </div>
              <div className="field-group">
                <label htmlFor="nom">{t.lastName}</label>
                <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder={t.lastNamePh} required />
              </div>
            </div>

            <div className="booking-grid-2">
              <div className="field-group">
                <label htmlFor="email">{t.email}</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPh} required />
              </div>
              <div className="field-group">
                <label htmlFor="telephone">{t.phone}</label>
                <input id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+216 ..." required />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="entreprise">{t.company}</label>
              <input id="entreprise" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} placeholder={t.companyPh} />
            </div>

            <div className="booking-grid-2">
              <div className="field-group">
                <label htmlFor="date_rdv">{t.date}</label>
                <input
                  id="date_rdv"
                  type="date"
                  value={dateRdv}
                  onChange={(e) => setDateRdv(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  required
                />
              </div>
              <div className="field-group">
                <label htmlFor="heure_rdv">{t.time}</label>
                <input id="heure_rdv" type="time" value={heureRdv} onChange={(e) => setHeureRdv(e.target.value)} required />
                {dateRdv && creneauxPris.length > 0 && (
                  <p className="booking-slot-hint">{t.taken} {creneauxPris.join(', ')}</p>
                )}
              </div>
            </div>

            <div className="field-group">
              <label>{t.type}</label>
              <div className="booking-type-row">
                {t.types.map(([key, icon, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTypeRdv(key)}
                    className={`booking-type-btn ${typeRdv === key ? 'active' : ''}`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="message">{t.need}</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={t.needPh}
              />
            </div>

            {error && <p className="booking-error">{error}</p>}

            <button type="submit" disabled={loading} className="booking-submit">
              {loading ? t.sending : t.submit}
            </button>
          </form>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
