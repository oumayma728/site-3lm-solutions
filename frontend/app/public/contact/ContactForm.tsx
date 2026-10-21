'use client';

import { useState } from 'react';
import axios from 'axios';
import { useLang } from '@/components/site/LangProvider';
import type { Translations } from '@/lib/i18n';

import { API_URL } from '@/lib/apiUrl';

const fr = {
  sendError: "Erreur lors de l'envoi de votre message.",
  sentTitle: 'Message envoyé !',
  sentText: (nom: string) => `Merci ${nom}, nous avons bien reçu votre message et reviendrons vers vous rapidement.`,
  name: 'Nom',
  namePh: 'Votre nom',
  email: 'Email',
  emailPh: 'vous@entreprise.com',
  subject: 'Sujet',
  subjectPh: 'Objet de votre message',
  message: 'Message',
  messagePh: 'Décrivez votre besoin ou votre question...',
  sending: 'Envoi en cours...',
  send: 'Envoyer le message',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    sendError: 'Your message could not be sent.',
    sentTitle: 'Message sent!',
    sentText: (nom: string) => `Thank you ${nom}, we have received your message and will get back to you soon.`,
    name: 'Name',
    namePh: 'Your name',
    email: 'Email',
    emailPh: 'you@company.com',
    subject: 'Subject',
    subjectPh: 'Subject of your message',
    message: 'Message',
    messagePh: 'Describe your need or your question...',
    sending: 'Sending...',
    send: 'Send message',
  },
};

export default function ContactForm() {
  const t = T[useLang()];
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/contact/`, { nom, email, sujet, message });
      setSuccess(true);
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
      <div className="contact-card contact-success">
        <div className="contact-success-icon">✓</div>
        <h2>{t.sentTitle}</h2>
        <p>{t.sentText(nom)}</p>
      </div>
    );
  }

  return (
    <form className="contact-card" onSubmit={handleSubmit}>
      {error && <div className="contact-error">{error}</div>}

      <div className="contact-grid-2">
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
        <label htmlFor="sujet">{t.subject}</label>
        <input id="sujet" value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder={t.subjectPh} required />
      </div>

      <div className="field-group">
        <label htmlFor="message">{t.message}</label>
        <textarea id="message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.messagePh} required />
      </div>

      <button type="submit" className="contact-submit" disabled={loading}>
        {loading ? t.sending : t.send}
      </button>
    </form>
  );
}
