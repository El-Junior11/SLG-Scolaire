import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { destination } from "../services/authentification";
import DispositionPrivee from "../components/DispositionPrivee";

// Pages publiques
import Accueil from "../pages/Accueil";
import Connexion from "../pages/Connexion";
import Inscription from "../pages/Inscription";
import MotDePasseOublie from "../pages/MotDePasseOublie";

// Pages communes et administration
import Profil from "../pages/Profil";
import Notifications from "../pages/Notifications";
import ConfigurationAdmin from "../pages/ConfigurationAdmin";
import AdministrationAcces from "../pages/AdministrationAcces";

// Secrétariat
import Secretaire_TableauDeBord from "../secretaire/TableauDeBord";
import Secretaire_Eleves from "../secretaire/Eleves";
import Secretaire_Classes from "../secretaire/Classes";
import Secretaire_AnneesScolaires from "../secretaire/AnneesScolaires";
import Secretaire_Utilisateurs from "../secretaire/Utilisateurs";
import Secretaire_Rapports from "../secretaire/Rapports";
import Secretaire_Parametres from "../secretaire/Parametres";

// Économat
import Econome_TableauDeBord from "../econome/TableauDeBord";
import Econome_Eleves from "../econome/Eleves";
import Econome_Inscriptions from "../econome/Inscriptions";
import Econome_FraisScolaires from "../econome/FraisScolaires";
import Econome_RapportsFinanciers from "../econome/RapportsFinanciers";

// Espace pédagogique
import Titulaire_TableauDeBord from "../titulaire/TableauDeBord";
import Titulaire_MaClasse from "../titulaire/MaClasse";
import Titulaire_Matieres from "../titulaire/Matieres";
import Titulaire_Evaluations from "../titulaire/Evaluations";
import Titulaire_Notes from "../titulaire/Notes";
import Titulaire_Moyennes from "../titulaire/Moyennes";
import Titulaire_Classements from "../titulaire/Classements";
import Titulaire_Bulletins from "../titulaire/Bulletins";
import Titulaire_RapportsPedagogiques from "../titulaire/RapportsPedagogiques";

// Protection des routes privées
function RouteProtegee({ role, children }) {
  const { utilisateur, chargement } = utiliserAuthentification();

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#14243D]">
        <div role="status" className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#540916]/20 border-t-[#540916] dark:border-white/20 dark:border-t-white" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  if (!utilisateur) return <Navigate to="/connexion" replace />;
  if (utilisateur.role !== role && utilisateur.role !== "admin") {
    return <Navigate to={destination(utilisateur)} replace />;
  }

  return children ?? <DispositionPrivee espace={role} />;
}

// Page introuvable
function PageIntrouvable() {
  const { utilisateur } = utiliserAuthentification();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F9FC] px-5 text-center dark:bg-[#14243D]">
      <h1 className="text-7xl font-extrabold tracking-tight text-[#540916] dark:text-[#D9799A]">404</h1>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Page introuvable</h2>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link to={utilisateur ? destination(utilisateur) : "/"}
        className="mt-2 rounded-lg bg-[#540916] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#750D21]">
        {utilisateur ? "Retour au tableau de bord" : "Retour à l'accueil"}
      </Link>
    </div>
  );
}

export default function RoutesApplication() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================== PAGES PUBLIQUES ==================== */}
        <Route path="/" element={<Accueil />} />
        <Route path="/apropos" element={<Navigate to="/#presentation" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
        <Route path="/connexion" element={<Connexion key="personnel" />} />
        <Route path="/connexion-admin" element={<Navigate to="/connexion" replace />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />

        {/* ==================== SUPER ADMIN / SECRÉTAIRE ==================== */}
        <Route path="/admin" element={<RouteProtegee role="admin" />}>
          <Route index element={<Navigate to="tableau-de-bord" replace />} />
          <Route path="tableau-de-bord" element={<Secretaire_TableauDeBord espace="admin" />} />

          {/* Gestion scolaire */}
          <Route path="gestion-scolaire" element={<Navigate to="/admin/eleves" replace />} />
          <Route path="eleves" element={<Secretaire_Eleves />} />
          <Route path="inscriptions" element={<Econome_Inscriptions />} />
          <Route path="classes" element={<Secretaire_Classes />} />
          <Route path="annees-scolaires" element={<Secretaire_AnneesScolaires />} />

          {/* Administration */}
          <Route path="administration" element={<Navigate to="/admin/utilisateurs" replace />} />
          <Route path="utilisateurs" element={<Secretaire_Utilisateurs />} />
          <Route path="demandes" element={<AdministrationAcces />} />

          {/* Rapports administratifs */}
          <Route path="rapports" element={<Secretaire_Rapports />} />

          {/* Paramètres accessibles depuis la Navbar */}
          <Route path="configuration" element={<ConfigurationAdmin />} />
          <Route path="parametres" element={<Navigate to="/admin/configuration" replace />} />

          {/* Profil et notifications */}
          <Route path="profil" element={<Profil />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="mon-compte" element={<Navigate to="/admin/profil" replace />} />
        </Route>

        {/* ==================== SECRÉTARIAT ==================== */}
        <Route path="/secretaire" element={<RouteProtegee role="secretaire" />}>
          <Route index element={<Navigate to="tableau-de-bord" replace />} />
          <Route path="tableau-de-bord" element={<Secretaire_TableauDeBord />} />

          {/* Gestion scolaire */}
          <Route path="gestion-scolaire" element={<Navigate to="/secretaire/eleves" replace />} />
          <Route path="eleves" element={<Secretaire_Eleves />} />
          <Route path="inscriptions" element={<Econome_Inscriptions />} />
          <Route path="classes" element={<Secretaire_Classes />} />
          <Route path="annees-scolaires" element={<Secretaire_AnneesScolaires />} />

          {/* Administration */}
          <Route path="administration" element={<Navigate to="/secretaire/utilisateurs" replace />} />
          <Route path="utilisateurs" element={<Secretaire_Utilisateurs />} />
          <Route path="demandes" element={<Navigate to="/admin/demandes" replace />} />

          {/* Rapports et paramètres */}
          <Route path="rapports" element={<Secretaire_Rapports />} />
          <Route path="parametres" element={<Secretaire_Parametres />} />
          <Route path="configuration" element={<Navigate to="/secretaire/parametres" replace />} />

          {/* Profil et notifications */}
          <Route path="profil" element={<Profil />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="mon-compte" element={<Navigate to="/secretaire/profil" replace />} />
        </Route>

        {/* ==================== ÉCONOMAT ==================== */}
        <Route path="/econome" element={<RouteProtegee role="econome" />}>
          <Route index element={<Navigate to="tableau-de-bord" replace />} />
          <Route path="tableau-de-bord" element={<Econome_TableauDeBord />} />

          {/* Gestion des élèves */}
          <Route path="gestion-eleves" element={<Navigate to="/econome/eleves" replace />} />
          <Route path="eleves" element={<Econome_Eleves />} />
          <Route path="inscriptions" element={<Econome_Inscriptions />} />

          {/* Gestion financière */}
          <Route path="gestion-financiere" element={<Navigate to="/econome/frais-scolaires" replace />} />
          <Route path="frais-scolaires" element={<Econome_FraisScolaires />} />
          <Route path="frais-scolaires/ecolage" element={<Econome_FraisScolaires categorie="ecolage" />} />
          <Route path="frais-scolaires/inscription" element={<Econome_FraisScolaires categorie="inscription" />} />
          <Route path="frais-scolaires/infrastructure" element={<Econome_FraisScolaires categorie="infrastructure" />} />
          <Route path="frais-scolaires/divers" element={<Econome_FraisScolaires categorie="divers" />} />

          {/* Paiements, impayés et reçus */}
          <Route path="paiements" element={<Navigate to="/econome/frais-scolaires?vue=paiements" replace />} />
          <Route path="impayes" element={<Navigate to="/econome/frais-scolaires?vue=impayes" replace />} />
          <Route path="recus" element={<Navigate to="/econome/frais-scolaires?vue=recus" replace />} />

          {/* Rapports financiers */}
          <Route path="rapports-financiers" element={<Econome_RapportsFinanciers />} />

          {/* Profil et notifications */}
          <Route path="profil" element={<Profil />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ==================== ESPACE PÉDAGOGIQUE ==================== */}
        <Route path="/titulaire" element={<RouteProtegee role="titulaire" />}>
          <Route index element={<Navigate to="tableau-de-bord" replace />} />
          <Route path="tableau-de-bord" element={<Titulaire_TableauDeBord />} />

          {/* Ma classe */}
          <Route path="ma-classe" element={<Titulaire_MaClasse />} />
          <Route path="matieres" element={<Titulaire_Matieres />} />

          {/* Évaluations et notes */}
          <Route path="evaluations-notes" element={<Navigate to="/titulaire/evaluations" replace />} />
          <Route path="evaluations" element={<Titulaire_Evaluations />} />
          <Route path="notes" element={<Titulaire_Notes />} />

          {/* Résultats scolaires */}
          <Route path="resultats-scolaires" element={<Navigate to="/titulaire/moyennes" replace />} />
          <Route path="moyennes" element={<Titulaire_Moyennes />} />
          <Route path="classements" element={<Titulaire_Classements />} />
          <Route path="bulletins" element={<Titulaire_Bulletins />} />

          {/* Rapports pédagogiques */}
          <Route path="rapports-pedagogiques" element={<Titulaire_RapportsPedagogiques />} />

          {/* Profil et notifications */}
          <Route path="profil" element={<Profil />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ==================== PAGE 404 ==================== */}
        <Route path="*" element={<PageIntrouvable />} />
      </Routes>
    </BrowserRouter>
  );
}