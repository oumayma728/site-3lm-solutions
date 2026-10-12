import Link from 'next/link';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import ProgramSwitcher from './ProgramSwitcher';
import { parcours } from './stagesData';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './stages.css';
import {getOffres} from '@/lib/offres';
export const revalidate = 86400;
export const metadata = {
  title: 'Stages 2026',
  description:
    "Rejoignez 3LM Solutions pour un stage d'été ou de fin d'études : projets réels, mentorat dédié, technologies modernes.",
};

const offre = [
  'Un mentor dédié, pas juste un tuteur sur le papier',
  'Des projets réels, jamais un exercice fictif',
  'Un environnement flexible et une équipe accessible',
  'Une possibilité d’évolution au sein de l’entreprise selon les opportunités',
];

const recherche = [
  'De la curiosité et l’envie sincère d’apprendre',
  'Des bases solides en programmation',
  'La capacité à devenir autonome progressivement',
  'Un bon esprit d’équipe et une communication professionnelle',
];

export default async function StagesPage() {
  const offresStages = await getOffres('stage');
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="stages-page">
        <div className="stages-bg" aria-hidden="true" />

        <section className="stages-hero">
          <span className="hero-badge"><span className="dot" />Stages 2026</span>
          <h1>Apprenez en construisant, <span className="gradient-text">pas en observant</span>.</h1>
          <p>Deux formats de stage, des projets réels dès le premier jour, et une équipe qui vous laisse vraiment contribuer.</p>
        </section>

        <section className="stages-programmes">
          <ProgramSwitcher offres={offresStages} />
        </section>

        <section className="stages-parcours">
          <div className="section-marker"><span />Votre parcours</div>
          <div className="section-heading">
            <h2>Ce à quoi ressemble un stage chez nous.</h2>
          </div>
          <div className="parcours-line">
            {parcours.map((p) => (
              <div className="parcours-step" key={p.num}>
                <span className="parcours-num">{p.num}</span>
                <h3>{p.titre}</h3>
                <p>{p.texte}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="stages-fit">
          <div className="fit-col">
            <h3>Ce qu&rsquo;on vous offre</h3>
            <ul>
              {offre.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <div className="fit-col fit-col-accent">
            <h3>Ce qu&rsquo;on recherche</h3>
            <ul>
              {recherche.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </section>

        <section className="home-contact-strip">
          <div>
            <div className="section-marker"><span />Une question sur le programme ?</div>
            <h2>Parlons de votre profil.</h2>
            <p>Pas encore sûr du format qui vous correspond ? Écrivez-nous, on vous oriente.</p>
          </div>
          <Link href="/public/contact" className="gradient-button">Nous contacter →</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
