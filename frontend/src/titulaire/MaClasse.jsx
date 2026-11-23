import ModuleMetier from "../components/ModuleMetier";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
export default function MaClasse(){const {utilisateur}=utiliserAuthentification();return <ModuleMetier module="ma-classe" filtrer={l=>l.classe===utilisateur.classe}/>;}