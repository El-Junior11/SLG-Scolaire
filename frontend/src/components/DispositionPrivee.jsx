import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ClasseAdministration, utiliserAuthentification } from "../contextes/ContexteAuthentification";

import { lireModule } from "../services/stockageDemonstration";

export default function DispositionPrivee({ espace }) {
  const { utilisateur, deconnexion } = utiliserAuthentification();
  const [ouvert, definirOuvert] = useState(false);
  const naviguer = useNavigate();
  const [classe, definirClasse] = useState("");
  const roleEspace = espace ?? utilisateur.role;
  const administrateur = utilisateur.role === "admin";
  const choixClasse = administrateur && roleEspace === "titulaire";
  const classes = choixClasse
    ? [...new Set(lireModule("classes").map(entree => entree.nom).filter(Boolean))]
    : [];
  const classeActive = classes.includes(classe) ? classe : (classes[0] ?? "");

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#F8F9FC] text-[#171717] transition-colors duration-200 dark:bg-[#0B172B] dark:text-white">
      <Sidebar role={roleEspace} administrateur={administrateur} ouvert={ouvert}
        fermer={() => definirOuvert(false)}
        deconnexion={() => { deconnexion(); naviguer("/connexion"); }} />

      <div className="lg:ml-[258px] min-w-0 min-h-screen flex flex-col">
        <Navbar ouvrir={() => definirOuvert(true)} role={roleEspace} utilisateur={utilisateur} />

        <main className="flex-1 min-w-0 w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-5 py-4">
          {choixClasse ? (
            <>
              <label className="mb-4 flex flex-wrap items-center gap-3 text-sm font-semibold">
                Classe
                <select className="champ w-auto" value={classeActive}
                  disabled={!classes.length} onChange={event => definirClasse(event.target.value)}>
                  {!classes.length && <option value="">Aucune classe de démonstration</option>}
                  {classes.map(nom => <option key={nom} value={nom}>{nom}</option>)}
                </select>
              </label>
              <ClasseAdministration key={classeActive} classe={classeActive}>
                <Outlet />
              </ClasseAdministration>
            </>
          ) : <Outlet />}
        </main>

        <Footer />
      </div>
    </div>
  );
}