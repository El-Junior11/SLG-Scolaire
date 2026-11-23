import { NavLink } from "react-router-dom";
import { GraduationCap, LogOut, X, ChevronRight } from "lucide-react";
import Icone from "../components/Icone";
import { NAVIGATION, ROLES } from "../donnees/configuration";

export default function Sidebar({ role, ouvert, fermer, deconnexion }) {
  const navigation = NAVIGATION[role] || [];
  const nomRole = ROLES[role] || role || "Utilisateur";

  return (
    <>
      <button type="button" aria-label="Fermer le menu" onClick={fermer}
        className={`fixed inset-0 z-30 bg-[#0B1020]/60 backdrop-blur-[2px] transition-opacity lg:hidden ${
          ouvert ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
        }`} />

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col bg-[#540916] text-white shadow-xl transition-all duration-300 ease-in-out dark:bg-[#14243D] lg:translate-x-0 ${
        ouvert ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-[88px] shrink-0 items-center gap-3 border-b border-white/10 px-4 dark:border-[#33445E]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 dark:border-[#405574] dark:bg-[#263852]">
            <GraduationCap size={25} strokeWidth={1.8} className="text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[13px] font-extrabold tracking-tight text-white">
              Saint Louis de Gonzague
            </h2>
            <p className="mt-1 text-[11px] font-medium text-[#F3B9C7] dark:text-[#A8B7CF]">
              Mahasoabe · Scolarité
            </p>
          </div>

          <button type="button" onClick={fermer} aria-label="Fermer la navigation"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white lg:hidden">
            <X size={19} />
          </button>
        </div>

        <div className="shrink-0 px-5 pb-3 pt-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#E9A5B6] dark:text-[#8FA9D1]">
            Espace {nomRole}
          </p>
        </div>

        <nav aria-label="Navigation principale"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-4 [scrollbar-width:thin] [scrollbar-color:#94505E_transparent] dark:[scrollbar-color:#405574_transparent]">
          {navigation.map(([url, libelle, icone]) => (
            <NavLink key={url} to={`/${role}/${url}`} onClick={fermer}
              end={url === "" || url === "dashboard"}
              className={({ isActive }) => `group flex min-h-[43px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-white text-[#540916] shadow-sm dark:bg-[#263852] dark:text-white"
                  : "text-[#F1D4DC] hover:bg-white/10 hover:text-white dark:text-[#A8B7CF] dark:hover:bg-[#263852] dark:hover:text-white"
              }`}>
              {({ isActive }) => (
                <>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    isActive
                      ? "bg-[#F8EDEF] text-[#540916] dark:bg-[#344C6C] dark:text-[#93C5FD]"
                      : "text-[#E9A5B6] group-hover:text-white dark:text-[#8FA9D1] dark:group-hover:text-white"
                  }`}>
                    <Icone nom={icone} taille={18} />
                  </span>

                  <span className="min-w-0 flex-1 truncate">{libelle}</span>

                  {isActive && (
                    <ChevronRight size={15}
                      className="shrink-0 text-[#540916]/70 dark:text-[#93C5FD]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3 dark:border-[#33445E]">
          <button type="button" onClick={deconnexion}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold text-[#F1D4DC] transition-colors hover:bg-white/10 hover:text-white dark:text-[#A8B7CF] dark:hover:bg-[#263852] dark:hover:text-white">
            <span className="flex h-7 w-7 items-center justify-center">
              <LogOut size={18} />
            </span>
            <span className="flex-1 text-left">Déconnexion</span>
            <ChevronRight size={15} className="opacity-60" />
          </button>

          <div className="mt-2 border-t border-white/10 px-3 pt-3 text-center dark:border-[#33445E]">
            <p className="text-[10px] font-medium text-[#E9A5B6] dark:text-[#8FA9D1]">
              © {new Date().getFullYear()} SLG Mahasoabe
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}