import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import TopAppBar from "../components/layout/TopAppBar";
import { LEGAL, LEGAL_DOCS } from "../config/legal";

// Documents légaux, accessibles sans être connecté (depuis l'inscription,
// la connexion ou le Profil) : /legal/mentions-legales, /legal/confidentialite,
// /legal/cgu, /legal/cookies. Les informations de l'éditeur viennent de
// config/legal.js.

const TODO = "[à compléter]";
const v = (value) => value || TODO;
const contact = () => (LEGAL.editeur.email ? <a href={`mailto:${LEGAL.editeur.email}`}>{LEGAL.editeur.email}</a> : TODO);
const dateMaj = new Date(LEGAL.miseAJour).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  );
}

function DocLink({ slug, children }) {
  return <Link to={`/legal/${slug}`}>{children}</Link>;
}

function MentionsLegales() {
  const { editeur, hebergeur } = LEGAL;
  return (
    <>
      <Section title="Éditeur du site">
        <ul>
          <li>Nom : {v(editeur.nom)}</li>
          <li>Statut : {v(editeur.statut)}</li>
          {editeur.siret && <li>SIRET : {editeur.siret}</li>}
          {editeur.adresse && <li>Adresse : {editeur.adresse}</li>}
          <li>Contact : {contact()}</li>
          <li>Directeur de la publication : {v(editeur.directeurPublication || editeur.nom)}</li>
        </ul>
      </Section>
      <Section title="Hébergeur">
        <ul>
          <li>{v(hebergeur.nom)}</li>
          <li>{v(hebergeur.adresse)}</li>
          {hebergeur.telephone && <li>Téléphone : {hebergeur.telephone}</li>}
        </ul>
      </Section>
      <Section title="Propriété intellectuelle">
        <p>
          La structure, les textes, le logo et le code de {LEGAL.site} sont protégés par le droit d'auteur. Toute reproduction sans
          autorisation de l'éditeur est interdite. Les contenus créés par les utilisateurs (séances, commentaires) restent leur propriété.
        </p>
      </Section>
      <Section title="Données personnelles">
        <p>
          Le traitement de tes données est décrit dans la <DocLink slug="confidentialite">politique de confidentialité</DocLink>.
        </p>
      </Section>
    </>
  );
}

function Confidentialite() {
  return (
    <>
      <Section title="Responsable du traitement">
        <p>
          {v(LEGAL.editeur.nom)}, éditeur de {LEGAL.site} (voir les <DocLink slug="mentions-legales">mentions légales</DocLink>). Pour toute
          question sur tes données : {contact()}.
        </p>
      </Section>

      <Section title="Données collectées">
        <ul>
          <li>
            <strong>Compte</strong> : prénom, nom, adresse e-mail, mot de passe (stocké chiffré, jamais lisible), rôle, date d'inscription et
            date d'acceptation des présentes conditions.
          </li>
          <li>
            <strong>Informations physiques et de santé</strong> (facultatives) : âge, poids, taille, blessures et objectifs.
          </li>
          <li>
            <strong>Activité sportive</strong> : séances, séries réalisées (répétitions, charge, durée), commentaires, notes reçues de ton coach.
          </li>
          <li>
            <strong>Relations</strong> : coachs que tu suis ou sportifs abonnés à toi, demande de compte coach, notifications.
          </li>
          <li>
            <strong>Technique</strong> : ton adresse IP est conservée en mémoire 15 minutes au plus, pour limiter les tentatives de connexion
            et d'inscription abusives. Elle n'est pas enregistrée en base.
          </li>
        </ul>
        <p>Aucune donnée n'est vendue, ni utilisée pour de la publicité ou du profilage.</p>
      </Section>

      <Section title="Finalités et bases légales">
        <ul>
          <li>
            Créer et gérer ton compte, planifier et suivre tes séances avec tes coachs : <em>exécution du contrat</em> (CGU), RGPD art. 6.1.b.
          </li>
          <li>
            Informations de santé : <em>consentement explicite</em> (RGPD art. 9.2.a). Elles sont facultatives ; tu les retires à tout
            moment en vidant les champs de ton Profil.
          </li>
          <li>
            Sécurité du service (limitation des abus, cookie de session) : <em>intérêt légitime</em>, RGPD art. 6.1.f.
          </li>
        </ul>
      </Section>

      <Section title="Qui voit tes données">
        <ul>
          <li>
            <strong>Les coachs que tu suis</strong> (abonnement actif) : ton profil complet, tes séances, tes réalisations. Te désabonner leur
            retire cet accès.
          </li>
          <li>
            <strong>Les autres utilisateurs</strong> : seulement le prénom et le nom des comptes coach, pour pouvoir les trouver.
          </li>
          <li>
            <strong>Les administrateurs</strong> du site, pour gérer les comptes et valider les demandes de compte coach.
          </li>
          <li>
            <strong>L'hébergeur</strong> ({v(LEGAL.hebergeur.nom)}), qui stocke les données pour le compte de l'éditeur.
          </li>
          <li>
            <strong>Google</strong>, uniquement si tu choisis « Continuer avec Google » : Google reçoit ta demande de connexion et nous
            transmet ton nom et ton e-mail. Google peut transférer des données hors de l'Union européenne, sous le cadre UE–États-Unis de
            protection des données. Voir la{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
              politique de confidentialité de Google
            </a>
            .
          </li>
        </ul>
      </Section>

      <Section title="Durée de conservation">
        <ul>
          <li>Tes données sont conservées tant que ton compte existe.</li>
          <li>
            Supprimer ton compte efface immédiatement et définitivement ton profil, tes réalisations, tes notes, tes abonnements, tes
            notifications et, pour un coach, les séances et templates qu'il a créés.
          </li>
          <li>Cookie de session : 7 jours. Adresse IP de limitation des abus : 15 minutes.</li>
        </ul>
      </Section>

      <Section title="Tes droits">
        <p>Conformément au RGPD et à la loi Informatique et Libertés, tu disposes des droits suivants :</p>
        <ul>
          <li>
            <strong>Accès et portabilité</strong> : Profil › « Télécharger mes données » (fichier JSON).
          </li>
          <li>
            <strong>Rectification</strong> : modifie tes informations dans le Profil, ou écris-nous.
          </li>
          <li>
            <strong>Effacement</strong> : Profil › « Supprimer mon compte ».
          </li>
          <li>
            <strong>Retrait du consentement, opposition, limitation</strong> : à tout moment, sans effet sur les traitements passés.
          </li>
          <li>
            <strong>Directives post-mortem</strong> : tu peux nous indiquer le sort de tes données après ton décès.
          </li>
        </ul>
        <p>
          Pour exercer un droit : {contact()}. Réponse sous un mois. Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la{" "}
          <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">
            CNIL
          </a>
          .
        </p>
      </Section>

      <Section title="Sécurité">
        <p>
          Mots de passe chiffrés (bcrypt), session dans un cookie inaccessible au JavaScript, limitation des tentatives de connexion, accès
          aux données limité selon le rôle. Le site doit être servi en HTTPS.
        </p>
      </Section>

      <Section title="Mineurs">
        <p>
          Le service est ouvert dès 15 ans. Avant 15 ans, l'inscription demande l'accord d'un titulaire de l'autorité parentale (loi
          Informatique et Libertés, art. 45).
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Voir la page <DocLink slug="cookies">cookies et stockage</DocLink>.
        </p>
      </Section>
    </>
  );
}

function Cgu() {
  return (
    <>
      <Section title="1. Objet">
        <p>
          Les présentes conditions encadrent l'utilisation de {LEGAL.site}, une application de suivi de séances de sport entre sportifs et
          coachs. Créer un compte vaut acceptation de ces conditions et de la{" "}
          <DocLink slug="confidentialite">politique de confidentialité</DocLink>.
        </p>
      </Section>
      <Section title="2. Compte">
        <ul>
          <li>L'inscription est gratuite et ouverte dès 15 ans (avant, avec l'accord d'un parent).</li>
          <li>Tu fournis des informations exactes et gardes ton mot de passe confidentiel. Tu es responsable de l'usage de ton compte.</li>
          <li>
            Un compte coach est soumis à la validation d'un administrateur. Jusque-là, le compte fonctionne comme un compte sportif.
          </li>
          <li>Tu peux supprimer ton compte à tout moment depuis ton Profil.</li>
        </ul>
      </Section>
      <Section title="3. Santé et sécurité">
        <p>
          {LEGAL.site} est un outil d'organisation et de suivi. Il ne fournit <strong>aucun avis médical</strong> et ne remplace pas un
          médecin. Consulte un professionnel de santé avant de commencer ou de reprendre une activité physique, en particulier en cas de
          blessure ou de pathologie. Arrête l'exercice en cas de douleur ou de malaise. Tu pratiques sous ta propre responsabilité.
        </p>
      </Section>
      <Section title="4. Coachs">
        <p>
          Les coachs sont responsables des séances qu'ils proposent et de leur adaptation au niveau des sportifs qui les suivent. Ils
          n'utilisent les données de leurs sportifs que pour les accompagner. Supprimer un compte coach supprime les séances qu'il a
          créées, y compris pour ses sportifs.
        </p>
      </Section>
      <Section title="5. Bon usage">
        <p>
          Il est interdit de publier des contenus illicites, injurieux ou portant atteinte aux droits d'autrui, d'usurper l'identité d'une
          personne, ou de tenter de perturber le service ou d'accéder aux données d'autres utilisateurs. En cas de manquement, l'éditeur
          peut suspendre ou supprimer le compte.
        </p>
      </Section>
      <Section title="6. Disponibilité et responsabilité">
        <p>
          Le service est fourni en l'état, sans garantie de disponibilité continue. L'éditeur ne peut être tenu responsable des dommages
          liés à la pratique sportive, à une interruption du service ou à une perte de données, dans les limites permises par la loi.
        </p>
      </Section>
      <Section title="7. Modification">
        <p>
          Ces conditions peuvent évoluer. Les utilisateurs sont informés des changements importants dans l'application.
        </p>
      </Section>
      <Section title="8. Droit applicable">
        <p>
          Ces conditions sont soumises au droit français. En cas de litige, une solution amiable est recherchée en priorité ({contact()}),
          à défaut les tribunaux français sont compétents.
        </p>
      </Section>
    </>
  );
}

function Cookies() {
  return (
    <>
      <Section title="Aucun cookie publicitaire ni de mesure d'audience">
        <p>
          {LEGAL.site} n'utilise que des traceurs strictement nécessaires à son fonctionnement. Ils sont exemptés de consentement (loi
          Informatique et Libertés, art. 82 ; lignes directrices de la CNIL). C'est pourquoi aucun bandeau cookies n'est affiché.
        </p>
      </Section>
      <Section title="Cookie">
        <ul>
          <li>
            <code>session</code> : te garde connecté. Inaccessible au JavaScript de la page, expire après 7 jours ou à la déconnexion.
          </li>
        </ul>
      </Section>
      <Section title="Stockage local de ton navigateur">
        <ul>
          <li>
            <code>profil</code> : ton profil, pour afficher l'application plus vite et hors ligne. Effacé à la déconnexion.
          </li>
          <li>
            <code>theme</code> et <code>sporttrack.design</code> : mode clair/sombre et design choisis.
          </li>
          <li>
            <code>realisations-en-attente</code> : séances terminées hors ligne, envoyées dès le retour du réseau.
          </li>
          <li>Cache de l'application (service worker) : permet l'usage hors ligne. Les données de compte sont effacées à la déconnexion.</li>
        </ul>
      </Section>
      <Section title="Google">
        <p>
          Le module de connexion Google n'est chargé que lorsque tu cliques sur « Continuer avec Google ». Google peut alors déposer ses
          propres cookies, régis par sa{" "}
          <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noreferrer">
            politique cookies
          </a>
          .
        </p>
      </Section>
      <Section title="Polices">
        <p>Les polices de caractères sont hébergées avec l'application : aucune requête n'est faite à Google Fonts.</p>
      </Section>
    </>
  );
}

const CONTENT = {
  "mentions-legales": MentionsLegales,
  confidentialite: Confidentialite,
  cgu: Cgu,
  cookies: Cookies,
};

function Legal() {
  const { doc } = useParams();
  const navigate = useNavigate();
  const meta = LEGAL_DOCS.find((d) => d.slug === doc);
  if (!meta) return <Navigate to="/legal/mentions-legales" replace />;
  const Content = CONTENT[doc];

  // Ouvert directement (lien partagé) : pas d'historique, retour à l'accueil.
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  return (
    <div className="min-h-dvh">
      <TopAppBar title={meta.title} onBack={back} titleSize="sm" />
      <article className="legal-doc max-w-2xl mx-auto px-5 pb-12 flex flex-col gap-6">
        <p className="text-caption text-muted-foreground">Dernière mise à jour : {dateMaj}</p>
        <Content />
        <nav aria-label="Documents légaux" className="flex flex-wrap gap-x-4 gap-y-2 pt-4 border-t border-border">
          {LEGAL_DOCS.filter((d) => d.slug !== doc).map((d) => (
            <DocLink key={d.slug} slug={d.slug}>
              {d.title}
            </DocLink>
          ))}
        </nav>
      </article>
    </div>
  );
}

export default Legal;
