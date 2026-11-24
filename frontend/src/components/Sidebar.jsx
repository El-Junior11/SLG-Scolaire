import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { GraduationCap, LogOut, X, ChevronRight } from "lucide-react";
import { requetePrivee } from "../services/authentification";
import Icone from "./Icone";
import { NAVIGATION, ROLES, GROUPES_NAVIGATION, SECTIONS_ADMIN_DEFAUT, LIENS_SECTIONS_ADMIN } from "../donnees/configuration";

const ICONES = {
  eleves: "Users", inscriptions: "ClipboardList", classes: "School",
  "annees-scolaires": "CalendarDays", utilisateurs: "UserCog",
  demandes: "UserCog", "frais-scolaires": "Wallet",
  "ma-classe": "Users", matieres: "BookOpen", evaluations: "ClipboardList",
  notes: "Pencil", moyennes: "Calculator", classements: "Trophy", bulletins: "FileText"
};

const EXCLUS = ["tableau-de-bord", "configuration", "mon-compte", "profil", "parametres", "notifications"];

export default function Sidebar({ role, administrateur, ouvert, fermer, deconnexion }) {
  const location = useLocation();
  const [sections, definirSections] = useState(SECTIONS_ADMIN_DEFAUT);
  const [menusOuverts, definirMenusOuverts] = useState({});
  const nomRole = administrateur ? "Super Administrateur" : ROLES[role] || role || "Utilisateur";

  useEffect(() => {
    if (!administrateur) return;
    const controleur = new AbortController();
    requetePrivee("/admin/menu", { signal: controleur.signal })
      .then(({ sections }) => {
        if (!controleur.signal.aborted) definirSections(sections ?? SECTIONS_ADMIN_DEFAUT);
      }).catch(() => {});
    const actualiser = evenement => definirSections(evenement.detail ?? SECTIONS_ADMIN_DEFAUT);
    window.addEventListener("slg-menu-admin", actualiser);
    return () => {
      controleur.abort();
      window.removeEventListener("slg-menu-admin", actualiser);
    };
  }, [administrateur]);

  const construireLien = (espace, chemin) => {
    const base = administrateur && espace === "secretaire" ? "admin" : espace;
    return `/${base}/${chemin}`;
  };

  const basculer = (id, etat) => definirMenusOuverts(prev => ({ ...prev, [id]: !etat }));

  const styleLien = actif => `group flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
    actif ? "bg-white text-[#540916] dark:bg-[#263852] dark:text-white"
      : "text-[#F1D4DC] hover:bg-white/10 hover:text-white dark:text-[#A8B7CF] dark:hover:bg-[#263852]"
  }`;

  const afficherLien = (url, libelle, icone, secondaire = false) => (
    <NavLink key={url} to={url} end onClick={fermer}
      className={({ isActive }) => `${styleLien(isActive)} ${secondaire ? "min-h-[34px] text-[12px]" : ""}`}>
      {({ isActive }) => (
        <>
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${isActive ? "text-[#540916] dark:text-white" : "text-[#E9A5B6] dark:text-[#8FA9D1]"}`}>
            <Icone nom={icone || "FileText"} taille={secondaire ? 15 : 18} />
          </span>
          <span className="min-w-0 flex-1 truncate">{libelle}</span>
          {isActive && <ChevronRight size={14} />}
        </>
      )}
    </NavLink>
  );

  const afficherMenu = (espace, chemin, libelle, icone) => {
    const groupe = GROUPES_NAVIGATION[chemin];
    const id = `${espace}/${chemin}`;
    if (!groupe) return afficherLien(construireLien(espace, chemin), libelle, icone);

    const enfants = groupe.filter(([url]) => url !== "demandes" || administrateur);
    const actif = enfants.some(([url]) => location.pathname === construireLien(espace, url));
    const developpe = menusOuverts[id] ?? actif;

    return (
      <div key={id}>
        <button type="button" aria-expanded={developpe} onClick={() => basculer(id, developpe)}
          className={`${styleLien(false)} text-left ${actif ? "bg-white/10" : ""}`}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[#E9A5B6] dark:text-[#8FA9D1]">
            <Icone nom={icone} taille={18} />
          </span>
          <span className="min-w-0 flex-1 truncate">{libelle}</span>
          <ChevronRight size={14} className={`shrink-0 transition-transform ${developpe ? "rotate-90" : ""}`} />
        </button>
        {developpe && (
          <div className="my-1 ml-5 space-y-0.5 border-l border-white/20 pl-2">
            {enfants.map(([url, titre]) =>
              afficherLien(construireLien(espace, url), titre, ICONES[url] || ICONES[url.split("/")[0]], true)
            )}
          </div>
        )}
      </div>
    );
  };

  const afficherSection = (espace, titre, icone) => {
    const section = sections.find(item => item.id === espace);
    if (!section) return null;

    const autorises = new Set(section.liens || []);
    const liens = (NAVIGATION[espace] || []).filter(([url]) => {
      if (EXCLUS.includes(url)) return false;
      if (autorises.has(`/${espace}/${url}`)) return true;
      return (GROUPES_NAVIGATION[url] || []).some(([enfant]) => autorises.has(`/${espace}/${enfant}`));
    });

    if (!liens.length) return null;

    const actif = liens.some(([url]) =>
      location.pathname === construireLien(espace, url) ||
      (GROUPES_NAVIGATION[url] || []).some(([enfant]) => location.pathname === construireLien(espace, enfant))
    );
    const id = `section-${espace}`;
    const developpe = menusOuverts[id] ?? actif;

    return (
      <div key={id}>
        <button type="button" aria-expanded={developpe} onClick={() => basculer(id, developpe)}
          className={`${styleLien(false)} text-left`}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[#E9A5B6] dark:text-[#8FA9D1]">
            <Icone nom={icone} taille={19} />
          </span>
          <span className="flex-1">{titre}</span>
          <ChevronRight size={15} className={`transition-transform ${developpe ? "rotate-90" : ""}`} />
        </button>
        {developpe && (
          <div className="my-1 ml-3 space-y-1 border-l border-white/20 pl-2">
            {liens.map(([url, libelle, icone]) => afficherMenu(espace, url, libelle, icone))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <button type="button" aria-label="Fermer le menu" onClick={fermer}
        className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] transition-opacity lg:hidden ${
          ouvert ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
        }`} />

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col bg-[#540916] text-white shadow-xl transition-transform duration-300 dark:bg-[#14243D] lg:translate-x-0 ${
        ouvert ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-[88px] shrink-0 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
            <GraduationCap size={25} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[13px] font-extrabold">Saint Louis de Gonzague</h2>
            <p className="mt-1 text-[11px] text-[#F3B9C7] dark:text-[#A8B7CF]">Mahasoabe · Scolarité</p>
          </div>
          <button type="button" onClick={fermer} aria-label="Fermer la navigation"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/10 lg:hidden">
            <X size={19} />
          </button>
        </div>

        <div className="px-5 pb-3 pt-5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#E9A5B6] dark:text-[#8FA9D1]">
            {nomRole}
          </p>
        </div>

        <nav aria-label="Navigation principale" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
          {administrateur ? (
            <>
              {afficherLien("/admin/tableau-de-bord", "Tableau de bord", "LayoutDashboard")}
              <div className="my-3 border-t border-white/10" />
              {afficherSection("secretaire", "Secrétariat", "ClipboardList")}
              {afficherSection("econome", "Économat", "Wallet")}
              {afficherSection("titulaire", "Espace pédagogique", "BookOpen")}
            </>
          ) : (
            (NAVIGATION[role] || []).map(([url, libelle, icone]) =>
              afficherMenu(role, url, libelle, icone)
            )
          )}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <button type="button" onClick={deconnexion} className={`${styleLien(false)} text-left`}>
            <span className="flex h-6 w-6 items-center justify-center"><LogOut size={18} /></span>
            <span className="flex-1">Déconnexion</span>
            <ChevronRight size={14} className="opacity-60" />
          </button>
          <div className="mt-2 border-t border-white/10 px-3 pt-3 text-center">
            <p className="text-[10px] text-[#E9A5B6] dark:text-[#8FA9D1]">
              © {new Date().getFullYear()} SLG Mahasoabe
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}