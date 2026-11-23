import { Link, useLocation } from "react-router-dom";
import { Bell, Menu, UserRound, ChevronDown } from "lucide-react";
import { BoutonTheme } from "../contextes/ContexteTheme";

export default function Navbar({ ouvrir, role, utilisateur }) {
  const location = useLocation();
  const base = `/${String(role || "").toLowerCase()}`;
  const nom = utilisateur?.nom || "Utilisateur";
  const initiales = nom.split(" ").filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();
  const actif = chemin => location.pathname === `${base}/${chemin}`;

  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-[#EAE3E5] bg-white px-4 shadow-sm dark:border-[#263852] dark:bg-[#14243D] md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="Ouvrir le menu" onClick={ouvrir}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#540916] transition hover:bg-[#F8EDEF] dark:text-[#F3A5BC] dark:hover:bg-[#263852] lg:hidden">
          <Menu size={22} />
        </button>

        <div className="hidden h-9 w-1 rounded-full bg-[#540916] dark:bg-[#D9799A] sm:block" />

        <div className="min-w-0">
          <h1 className="truncate text-sm font-extrabold tracking-tight text-[#171717] dark:text-white md:text-base">
            Gestion de scolarité
          </h1>
          <p className="hidden truncate text-xs text-[#667085] dark:text-[#A8B7CF] sm:block">
            Espace {role || "Utilisateur"} <span className="mx-1.5 text-[#D0D5DD]">•</span> Saint Louis de Gonzague
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <BoutonTheme />

        <Link to={`${base}/notifications`} aria-label="Notifications"
          title="Notifications"
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
            actif("notifications")
              ? "bg-[#F8EDEF] text-[#540916] dark:bg-[#263852] dark:text-[#F3A5BC]"
              : "text-[#667085] hover:bg-[#F8F9FC] hover:text-[#540916] dark:text-[#A8B7CF] dark:hover:bg-[#263852]"
          }`}>
          <Bell size={19} />
        </Link>

        <span className="hidden h-7 w-px bg-[#EAE3E5] dark:bg-[#33445E] sm:block" />

        <Link to={`${base}/profil`} title="Mon profil"
          className={`flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-[#F8F9FC] dark:hover:bg-[#263852] ${
            actif("profil") ? "bg-[#F8EDEF] dark:bg-[#263852]" : ""
          }`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#540916] text-xs font-extrabold text-white">
            {initiales || <UserRound size={18} />}
          </span>

          <span className="hidden min-w-0 text-left lg:block">
            <span className="block max-w-[150px] truncate text-xs font-bold text-[#171717] dark:text-white">{nom}</span>
            <span className="block text-[11px] text-[#667085] dark:text-[#A8B7CF]">{role || "Utilisateur"}</span>
          </span>

          <ChevronDown size={15} className="hidden text-[#98A2B3] lg:block" />
        </Link>
      </div>
    </header>
  );
}