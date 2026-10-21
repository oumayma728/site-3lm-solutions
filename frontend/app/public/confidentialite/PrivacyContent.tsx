import type { Lang } from '@/lib/i18n';

// The policy text in each language. The French version is the reference: if you change it,
// update the English one too (and the date in page.tsx).

export const EMAIL = 'contact@3lmsolutions.net';

export const SOMMAIRE: Record<Lang, { id: string; titre: string }[]> = {
  fr: [
    { id: 'responsable', titre: 'Responsable du traitement' },
    { id: 'donnees', titre: 'Données collectées' },
    { id: 'candidatures', titre: 'Candidatures' },
    { id: 'conservation', titre: 'Durée de conservation' },
    { id: 'destinataires', titre: 'Destinataires' },
    { id: 'cookies', titre: 'Cookies et stockage local' },
    { id: 'securite', titre: 'Sécurité' },
    { id: 'droits', titre: 'Vos droits' },
  ],
  en: [
    { id: 'responsable', titre: 'Data controller' },
    { id: 'donnees', titre: 'Data we collect' },
    { id: 'candidatures', titre: 'Job applications' },
    { id: 'conservation', titre: 'Retention period' },
    { id: 'destinataires', titre: 'Recipients' },
    { id: 'cookies', titre: 'Cookies and local storage' },
    { id: 'securite', titre: 'Security' },
    { id: 'droits', titre: 'Your rights' },
  ],
};

export function PrivacyFr() {
  return (
    <>
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
          <li>votre préférence de thème (clair ou sombre) et de langue (français ou anglais) ;</li>
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
    </>
  );
}

export function PrivacyEn() {
  return (
    <>
      <p className="privacy-note">
        This English version is provided for convenience. In case of any difference, the French
        version of this policy prevails.
      </p>

      <section id="responsable">
        <h2>1. Data controller</h2>
        <p>
          The data collected on this site is processed by <strong>3LM Solutions</strong>, based
          in Ariana, Tunisia. For any question about your data, write to us
          at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
      </section>

      <section id="donnees">
        <h2>2. Data we collect</h2>
        <p>We only collect the information you choose to send us:</p>
        <div className="privacy-table" role="table">
          <div role="row" className="privacy-row privacy-row-head">
            <span role="columnheader">Form</span>
            <span role="columnheader">Data</span>
            <span role="columnheader">Purpose</span>
          </div>
          <div role="row" className="privacy-row">
            <span role="cell">Job application</span>
            <span role="cell">Name, email, phone, CV, message, position applied for, school, level of study, availability, LinkedIn profile</span>
            <span role="cell">Review your application, contact you and, if you are selected, prepare your arrival</span>
          </div>
          <div role="row" className="privacy-row">
            <span role="cell">Contact</span>
            <span role="cell">Name, email, subject, message</span>
            <span role="cell">Answer your request</span>
          </div>
          <div role="row" className="privacy-row">
            <span role="cell">Appointments and quotes</span>
            <span role="cell">Last name, first name, company, email, phone, message, chosen time slot</span>
            <span role="cell">Organize the meeting and prepare a proposal</span>
          </div>
          <div role="row" className="privacy-row">
            <span role="cell">AI assistant</span>
            <span role="cell">Messages exchanged with the assistant</span>
            <span role="cell">Answer your questions about our services</span>
          </div>
        </div>
        <p>
          We do not sell your data and do not use it for advertising. Please avoid sending
          sensitive information (health, opinions, banking details…) in free-text fields or to
          the AI assistant.
        </p>
      </section>

      <section id="candidatures">
        <h2>3. Job applications</h2>
        <p>
          When you apply, we ask for your explicit consent through a checkbox. We record the date
          of this consent and the version of the text you accepted, so that we can prove it.
        </p>
        <p>
          Your application and CV are only viewed by the people at 3LM Solutions in charge of
          recruitment. You can withdraw your consent at any time: your application is then deleted.
        </p>
        <p>
          <strong>Internal intern-tracking tool.</strong> If your application is shortlisted, it is
          sent, together with your CV, to our internal intern-management tool, used by the same team.
        </p>
        <p>
          <strong>AI-assisted review.</strong> In this tool, a team member may request an analysis
          of your CV: its text and your motivation message are sent to our AI provider, which
          compares them with ongoing projects and suggests an indicative score, the skills it
          identified, strengths and points to explore further. This analysis is a reading aid:{' '}
          <strong>no decision is made automatically</strong> — accepting or rejecting your
          application is always decided by a person on the team.
        </p>
        <p>
          We inform you of the decision by email. If you are selected, you receive a personal
          link to create your intern account.
        </p>
      </section>

      <section id="conservation">
        <h2>4. Retention period</h2>
        <ul>
          <li>
            <strong>Applications and CVs: 6 months</strong> from receipt, then deleted
            automatically, on this site as well as in our internal tool — unless you are hired or
            ask us to delete them earlier.
          </li>
          <li>
            <strong>If you are hired:</strong> the information needed for your internship (name,
            email, school, internship type and dates) is kept in your intern account for the
            duration of the internship and the related administrative steps (agreement, certificate).
          </li>
          <li>
            <strong>Contact, appointment and quote requests:</strong> for as long as needed to handle
            your request and the business relationship that follows.
          </li>
          <li>
            <strong>Conversations with the AI assistant:</strong> for as long as needed to keep the
            conversation going and improve our answers.
          </li>
        </ul>
      </section>

      <section id="destinataires">
        <h2>5. Recipients</h2>
        <p>
          Your data is intended for the 3LM Solutions team. Some technical providers access it
          only to run the service:
        </p>
        <ul>
          <li><strong>Our hosting provider</strong>, which stores the site and its database;</li>
          <li><strong>Our email provider</strong>, through which we receive your applications and requests;</li>
          <li>
            <strong>Anthropic</strong>, provider of the AI models we use: it receives the messages
            you write to the assistant, to generate its answers, and, for shortlisted applications,
            the text of the CV and motivation message when an analysis is requested (see “Job
            applications”).
          </li>
        </ul>
      </section>

      <section id="cookies">
        <h2>6. Cookies and local storage</h2>
        <p>
          This site uses <strong>no advertising cookies and no audience-measurement tools</strong>.
          Your browser only keeps:
        </p>
        <ul>
          <li>your theme (light or dark) and language (French or English) preferences;</li>
          <li>a conversation identifier, to resume your exchange with the AI assistant;</li>
          <li>for team members only, a login token for the internal workspace.</li>
        </ul>
        <p>You can clear these at any time from your browser settings.</p>
      </section>

      <section id="securite">
        <h2>7. Security</h2>
        <p>
          Access to applications and requests is restricted to team members, through a workspace
          protected by a username and password. We limit access to the people who need it.
        </p>
      </section>

      <section id="droits">
        <h2>8. Your rights</h2>
        <p>
          Under Organic Law No. 2004-63 of 27 July 2004 on the protection of personal data, you
          may at any time:
        </p>
        <ul>
          <li>access the data concerning you;</li>
          <li>have it corrected if it is inaccurate;</li>
          <li>request its deletion or withdraw your consent;</li>
          <li>object to its processing on legitimate grounds.</li>
        </ul>
        <div className="privacy-contact">
          <div>
            <strong>Exercise your rights</strong>
            <p>Write to us describing your request. We will reply as soon as possible.</p>
          </div>
          <a href={`mailto:${EMAIL}?subject=Personal data`} className="gradient-button">
            {EMAIL}
          </a>
        </div>
        <p className="privacy-note">
          If you believe your rights are not being respected, you can contact the Tunisian
          personal data protection authority, the Instance Nationale de Protection des Données
          Personnelles (INPDP).
        </p>
      </section>
    </>
  );
}
