'use client';

import { useState , useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import {Offre, getOffreBySlug } from '@/lib/offres';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

function useOffreContext() {
  const params = useSearchParams();
  const ref = params.get('ref');
  const [offre, setOffre] = useState<Offre | null>(null);

  useEffect(() => {
    if (!ref) {
      setOffre(null);
      return;
    }
    getOffreBySlug(ref).then(setOffre);
  }, [ref]);

  if (!offre) return null;
  return { id: offre.id, label: offre.type_offre === 'stage' ? 'Stage' : 'Poste', titre: offre.titre , idZ: offre.id };
}

export default function CandidatureForm() {
  const offreContext = useOffreContext();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cv, setCv] = useState<File | null>(null);
  const [message, setMessage] = useState('');

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
      console.log("offreContext:", offreContext);
  console.log("job title:", offreContext?.titre);
      if (offreContext) {
        formData.append('offre', String(offreContext.id));
        formData.append('reference', offreContext.titre);
      }

      await axios.post(`${API_URL}/candidature/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
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
          <input id="telephone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Votre numéro de téléphone" required />
        </div>
      </div>

      <div className="candidature-section">
        <div className="candidature-section-head">
          <span className="candidature-section-num">02</span>
          <h2>Votre CV</h2>
        </div>
        <label htmlFor="cv" className="candidature-dropzone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v12m0-12l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
          <span>{cv ? cv.name : 'Cliquez pour choisir un fichier (PDF, DOC)'}</span>
          <input id="cv" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files?.[0] || null)} required />
        </label>
      </div>

      <div className="candidature-section">
        <div className="candidature-section-head">
          <span className="candidature-section-num">03</span>
          <h2>Votre message</h2>
        </div>
        <div className="field-group">
          <label htmlFor="message">Motivation (facultatif)</label>
          <textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ce qui vous motive à nous rejoindre..." />
        </div>
      </div>

      <button type="submit" className="candidature-submit" disabled={loading}>
        {loading ? 'Envoi en cours...' : 'Envoyer ma candidature'}
      </button>
    </form>
  );
}
