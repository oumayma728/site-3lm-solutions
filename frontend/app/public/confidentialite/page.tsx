import Link from 'next/link';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './confidentialite.css';

export const metadata = {
  title: 'Politique de confidentialité',
  description:
    'Comment 3LM Solutions collecte, utilise et protège vos données personnelles : candidatures, demandes de contact, rendez-vous et assistant IA.',
};

const EMAIL = 'contact@3lmsolutions.net';
const MISE_A_JOUR = '19 octobre 2026';

const sommaire = [
  { id: 'responsable', titre: 'Responsable du traitement' },
  { id: 'donnees', titre: 'Données collectées' },
  { id: 'candidatures', titre: 'Candidatures' },
  { id: 'conservation', titre: 'Durée de conservation' },
  { id: 'destinataires', titre: 'Destinataires' },
  { id: 'cookies', titre: 'Cookies et stockage local' },
  { id: 'securite', titre: 'Sécurité' },
  { id: 'droits', titre: 'Vos droits' },
];

export default function ConfidentialitePage() {
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="privacy-page">
        <div className="privacy-bg" aria-hidden="true" />

        <section className="privacy-hero">
          <span className="hero-badge"><span className="dot" />Données personnelles</span>
          <h1>Politique de <span className="gradient-text">confidentialité</span></h1>
          <p>
            Ce que nous collectons, pourquoi, combien de temps nous le gardons et comment
            exercer vos droits — en clair.
          </p>
          <small>Dernière mise à jour : {MISE_A_JOUR}</small>
        </section>

        <div className="privacy-layout">
          <nav className="privacy-toc" aria-label="Sommaire">
            <strong>Sommaire</strong>
            <ol>
              {sommaire.map((s) => (
                <li key={s.id}><a href={`#${s.id}`}>{s.titre}</a></li>
              ))}
            </ol>
          </nav>

          <article className="privacy-content">
            <section id="responsable">
              <h2>1. Responsable du traitement</h2>
              <p>
                Les données collectées sur ce site sont traitées par <strong>3LM Solutions</strong>,
                basée à Ariana, Tunisie. Pour toute question relative à vos données, écrivez-nous
                à <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
              </p>
            </section>

            <section id="donnees">
              <h2>2. Données collectées</h2>
              <p>Nous ne collectons que les informations que vous nous transmettez volontairement :</p>
              <div className="privacy-table" role="table">
                <div role="row" className="privacy-row privacy-row-head">
                  <span role="columnheader">Formulaire</span>
                  <span role="columnheader">Données</span>
                  <span role="columnheader">Finalité</span>
                </div>
                <div role="row" className="privacy-row">
                  <span role="cell">Candidature</span>
                  <span role="cell">Nom, email, téléphone, CV, message, offre visée, école, niveau d’études, disponibilités, profil LinkedIn</span>
                  <span role="cell">Étudier votre candidature, vous recontacter et, si vous êtes retenu(e), préparer votre arrivée</span>
                </div>
                <div role="row" className="privacy-row">
                  <span role="cell">Contact</span>
                  <span role="cell">Nom, email, sujet, message</span>
                  <span role="cell">Répondre à votre demande</span>
                </div>
                <div role="row" className="privacy-row">
                  <span role="cell">Rendez-vous et devis</span>
                  <span role="cell">Nom, prénom, entreprise, email, téléphone, message, créneau choisi</span>
                  <span role="cell">Organiser l’échange et préparer une proposition</span>
                </div>
                <div role="row" className="privacy-row">
                  <span role="cell">Assistant IA</span>
                  <span role="cell">Messages échangés avec l’assistant</span>
                  <span role="cell">Répondre à vos questions sur nos services</span>
                </div>
              </div>
              <p>
                Nous ne vendons pas vos données et ne les utilisons pas à des fins publicitaires.
                Évitez de transmettre des informations sensibles (santé, opinions, données
                bancaires…) dans les champs libres ou à l’assistant IA.
              </p>
            </section>

            <section id="candidatures">
              <h2>3. Candidatures</h2>
              <p>
                Lorsque vous postulez, nous vous demandons votre accord explicite via une case à
                cocher. Nous enregistrons la date de cet accord et la version du texte accepté,
                afin de pouvoir en justifier.
              </p>
              <p>
                Votre candidature et votre CV ne sont consultés que par les personnes de 3LM
                Solutions en charge du recrutement. Vous pouvez retirer votre consentement à tout
                moment : votre candidature est alors supprimée.
              </p>
              <p>
                <strong>Outil interne de suivi des stagiaires.</strong> Si votre candidature est
                présélectionnée, elle est transmise, avec votre CV, à notre outil interne de gestion
                des stagiaires, utilisé par la même équipe.
              </p>
              <p>
                <strong>Analyse assistée par IA.</strong> Dans cet outil, un membre de l’équipe peut
                demander une analyse de votre CV : son texte et votre message de motivation sont
                transmis à notre fournisseur d’IA, qui les compare aux projets en cours et propose
                une note indicative, les compétences repérées, des points forts et des points à
                approfondir. Cette analyse est une aide à la lecture :{' '}
                <strong>aucune décision n’est prise automatiquement</strong>, l’acceptation ou le refus
                de votre candidature est toujours décidé par une personne de l’équipe.
              </p>
              <p>
                Nous vous informons de la décision par email. Si vous êtes retenu(e), vous recevez
                un lien personnel pour créer votre compte stagiaire.
              </p>
            </section>

            <section id="conservation">
              <h2>4. Durée de conservation</h2>
              <ul>
                <li>
                  <strong>Candidatures et CV : 6 mois</strong> à compter de leur réception, puis
                  supprimés automatiquement, sur ce site comme dans notre outil interne — sauf si
                  vous êtes recruté(e) ou si vous nous demandez une suppression plus tôt.
                </li>
                <li>
                  <strong>Si vous êtes recruté(e) :</strong> les informations utiles à votre stage
                  (nom, email, école, type et dates de stage) sont conservées dans votre compte
                  stagiaire le temps du stage et des démarches administratives qui en découlent
                  (convention, attestation).
                </li>
                <li>
                  <strong>Demandes de contact, rendez-vous et devis :</strong> le temps nécessaire
                  au traitement de votre demande et au suivi de la relation commerciale qui en découle.
                </li>
                <li>
                  <strong>Conversations avec l’assistant IA :</strong> le temps nécessaire à la
                  continuité de la conversation et à l’amélioration de nos réponses.
                </li>
              </ul>
            </section>

            <section id="destinataires">
              <h2>5. Destinataires</h2>
              <p>
                Vos données sont destinées à l’équipe de 3LM Solutions. Certains prestataires
                techniques y accèdent uniquement pour faire fonctionner le service :
              </p>
              <ul>
                <li><strong>Notre hébergeur</strong>, qui stocke le site et sa base de données ;</li>
                <li><strong>Notre messagerie</strong>, par laquelle nous recevons vos candidatures et demandes ;</li>
                <li>
                  <strong>Anthropic</strong>, fournisseur des modèles d’IA que nous utilisons : il reçoit
                  les messages que vous écrivez à l’assistant, pour générer ses réponses, et, pour les
                  candidatures présélectionnées, le texte du CV et du message de motivation lorsqu’une
                  analyse est demandée (voir « Candidatures »).
                </li>
              </ul>
            </section>

            <section id="cookies">
              <h2>6. Cookies et stockage local</h2>
              <p>
                Ce site n’utilise <strong>aucun cookie publicitaire ni outil de mesure d’audience</strong>.
                Votre navigateur conserve uniquement :
              </p>
              <ul>
                <li>votre préférence de thème (clair ou sombre) ;</li>
                <li>un identifiant de conversation, pour retrouver votre échange avec l’assistant IA ;</li>
                <li>pour les membres de l’équipe uniquement, un jeton de connexion à l’espace interne.</li>
              </ul>
              <p>Vous pouvez effacer ces éléments à tout moment depuis les réglages de votre navigateur.</p>
            </section>

            <section id="securite">
              <h2>7. Sécurité</h2>
              <p>
                L’accès aux candidatures et aux demandes est réservé aux membres de l’équipe,
                via un espace protégé par identifiant et mot de passe. Nous limitons l’accès aux
                seules personnes qui en ont besoin.
              </p>
            </section>

            <section id="droits">
              <h2>8. Vos droits</h2>
              <p>
                Conformément à la loi organique n° 2004-63 du 27 juillet 2004 relative à la
                protection des données à caractère personnel, vous pouvez à tout moment :
              </p>
              <ul>
                <li>accéder aux données vous concernant ;</li>
                <li>les faire rectifier si elles sont inexactes ;</li>
                <li>demander leur suppression ou retirer votre consentement ;</li>
                <li>vous opposer à leur traitement pour un motif légitime.</li>
              </ul>
              <div className="privacy-contact">
                <div>
                  <strong>Exercer vos droits</strong>
                  <p>Écrivez-nous en précisant votre demande. Nous vous répondons dans les meilleurs délais.</p>
                </div>
                <a href={`mailto:${EMAIL}?subject=Données personnelles`} className="gradient-button">
                  {EMAIL}
                </a>
              </div>
              <p className="privacy-note">
                Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir
                l’Instance Nationale de Protection des Données Personnelles (INPDP).
              </p>
            </section>

            <p className="privacy-back">
              <Link href="/">← Retour à l’accueil</Link>
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
