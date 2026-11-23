import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import DispositionPrivee from "../components/DispositionPrivee";
import Accueil from "../pages/Accueil";import Apropos from "../pages/Apropos";import Contact from "../pages/Contact";
import Connexion from "../pages/Connexion";import Inscription from "../pages/Inscription";import MotDePasseOublie from "../pages/MotDePasseOublie";
import Profil from "../pages/Profil";import Notifications from "../pages/Notifications";
import Secretaire_TableauDeBord from "../secretaire/TableauDeBord";
import Secretaire_Eleves from "../secretaire/Eleves";
import Secretaire_Classes from "../secretaire/Classes";
import Secretaire_AnneesScolaires from "../secretaire/AnneesScolaires";
import Secretaire_Utilisateurs from "../secretaire/Utilisateurs";
import Secretaire_Rapports from "../secretaire/Rapports";
import Secretaire_Parametres from "../secretaire/Parametres";
import Econome_TableauDeBord from "../econome/TableauDeBord";
import Econome_Eleves from "../econome/Eleves";
import Econome_Inscriptions from "../econome/Inscriptions";
import Econome_FraisScolaires from "../econome/FraisScolaires";
import Econome_Paiements from "../econome/Paiements";
import Econome_Impayes from "../econome/Impayes";
import Econome_Recus from "../econome/Recus";
import Econome_RapportsFinanciers from "../econome/RapportsFinanciers";
import Titulaire_TableauDeBord from "../titulaire/TableauDeBord";
import Titulaire_MaClasse from "../titulaire/MaClasse";
import Titulaire_Matieres from "../titulaire/Matieres";
import Titulaire_Evaluations from "../titulaire/Evaluations";
import Titulaire_Notes from "../titulaire/Notes";
import Titulaire_Moyennes from "../titulaire/Moyennes";
import Titulaire_Classements from "../titulaire/Classements";
import Titulaire_Bulletins from "../titulaire/Bulletins";
import Titulaire_RapportsPedagogiques from "../titulaire/RapportsPedagogiques";
function RouteProtegee({role}){const {utilisateur}=utiliserAuthentification();return !utilisateur?<Navigate to="/connexion" replace/>:utilisateur.role!==role?<Navigate to={`/${utilisateur.role}/tableau-de-bord`} replace/>:<DispositionPrivee/>}
export default function RoutesApplication(){return <BrowserRouter><Routes><Route path="/" element={<Accueil/>}/><Route path="/apropos" element={<Apropos/>}/><Route path="/contact" element={<Contact/>}/><Route path="/connexion" element={<Connexion/>}/><Route path="/inscription" element={<Inscription/>}/><Route path="/mot-de-passe-oublie" element={<MotDePasseOublie/>}/>
<Route path="/secretaire" element={<RouteProtegee role="secretaire"/>}><Route index element={<Navigate to="tableau-de-bord" replace/>}/><Route path="tableau-de-bord" element={<Secretaire_TableauDeBord/>}/><Route path="profil" element={<Profil/>}/><Route path="notifications" element={<Notifications/>}/><Route path="eleves" element={<Secretaire_Eleves/>}/><Route path="classes" element={<Secretaire_Classes/>}/><Route path="annees-scolaires" element={<Secretaire_AnneesScolaires/>}/><Route path="utilisateurs" element={<Secretaire_Utilisateurs/>}/><Route path="rapports" element={<Secretaire_Rapports/>}/><Route path="parametres" element={<Secretaire_Parametres/>}/></Route><Route path="/econome" element={<RouteProtegee role="econome"/>}><Route index element={<Navigate to="tableau-de-bord" replace/>}/><Route path="tableau-de-bord" element={<Econome_TableauDeBord/>}/><Route path="profil" element={<Profil/>}/><Route path="notifications" element={<Notifications/>}/><Route path="eleves" element={<Econome_Eleves/>}/><Route path="inscriptions" element={<Econome_Inscriptions/>}/><Route path="frais-scolaires" element={<Econome_FraisScolaires/>}/><Route path="paiements" element={<Econome_Paiements/>}/><Route path="impayes" element={<Econome_Impayes/>}/><Route path="recus" element={<Econome_Recus/>}/><Route path="rapports-financiers" element={<Econome_RapportsFinanciers/>}/></Route><Route path="/titulaire" element={<RouteProtegee role="titulaire"/>}><Route index element={<Navigate to="tableau-de-bord" replace/>}/><Route path="tableau-de-bord" element={<Titulaire_TableauDeBord/>}/><Route path="profil" element={<Profil/>}/><Route path="notifications" element={<Notifications/>}/><Route path="ma-classe" element={<Titulaire_MaClasse/>}/><Route path="matieres" element={<Titulaire_Matieres/>}/><Route path="evaluations" element={<Titulaire_Evaluations/>}/><Route path="notes" element={<Titulaire_Notes/>}/><Route path="moyennes" element={<Titulaire_Moyennes/>}/><Route path="classements" element={<Titulaire_Classements/>}/><Route path="bulletins" element={<Titulaire_Bulletins/>}/><Route path="rapports-pedagogiques" element={<Titulaire_RapportsPedagogiques/>}/></Route><Route path="*" element={<div className="min-h-screen flex flex-col gap-4 items-center justify-center"><h1 className="text-5xl font-extrabold">404</h1><p>Page introuvable</p><a href="/" className="bouton">Retour à l'accueil</a></div>}/></Routes></BrowserRouter>}