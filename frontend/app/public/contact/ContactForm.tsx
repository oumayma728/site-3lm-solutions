'use client';

import { useState } from 'react';
import axios from 'axios';

import { API_URL } from '@/lib/apiUrl';

export default function ContactForm() {
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
        setError(msg || "Erreur lors de l'envoi de votre message.");
      } else {
        setError("Erreur lors de l'envoi de votre message.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="contact-card contact-success">
        <div className="contact-success-icon">✓</div>
        <h2>Message envoyé !</h2>
        <p>Merci {nom}, nous avons bien reçu votre message et reviendrons vers vous rapidement.</p>
      </div>
    );
  }

  return (
    <form className="contact-card" onSubmit={handleSubmit}>
      {error && <div className="contact-error">{error}</div>}

      <div className="contact-grid-2">
        <div className="field-group">
          <label htmlFor="nom">Nom</label>
          <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" required />
        </div>
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.com" required />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="sujet">Sujet</label>
        <input id="sujet" value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Objet de votre message" required />
      </div>

      <div className="field-group">
        <label htmlFor="message">Message</label>
        <textarea id="message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Décrivez votre besoin ou votre question..." required />
      </div>

      <button type="submit" className="contact-submit" disabled={loading}>
        {loading ? 'Envoi en cours...' : 'Envoyer le message'}
      </button>
    </form>
  );
}
