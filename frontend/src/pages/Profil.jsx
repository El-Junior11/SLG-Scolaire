import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { ROLES } from "../donnees/configuration";
import { BadgeCheck, CheckCircle2, Info, Pencil, Save, ShieldCheck, UserRound, X } from "lucide-react";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const accent = "text-[#540916] dark:text-[#93C5FD]";
const bordure = "border-[#EAE3E5] dark:border-[#263852]";
const champ = "w-full min-w-0 rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none transition-colors focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white dark:focus:border-[#60A5FA]";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors";
const principal = "bg-[#540916] text-white hover:bg-[#701326] dark:bg-[#29446D] dark:text-[#E2ECFF] dark:hover:bg-[#365582]";
const contour = "border border-[#E4E7EC] bg-white text-[#344054] hover:bg-slate-50 dark:border-[#33445E] dark:bg-[#14243D] dark:text-[#A8B7CF] dark:hover:bg-[#263852]";

function InformationCompte({ titre, valeur, Icone }) {
  return (
    <div className={`flex min-w-0 items-start gap-3 border-b py-4 last:border-b-0 ${bordure}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F8EDEF] text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]">
        <Icone size={19} strokeWidth={1.8}/>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium ${secondaire}`}>{titre}</p>
        <p className={`mt-1 break-words text-sm font-semibold ${texte}`}>{valeur}</p>
      </div>
    </div>
  );
}

function Information({ children }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-[#30415C] dark:bg-[#1B2E4A]">
      <Info size={18} className="mt-0.5 shrink-0 text-blue-600 dark:text-[#93C5FD]"/>
      <p className="min-w-0 text-xs leading-relaxed text-blue-800 dark:text-[#A8B7CF]">
        {children}
      </p>
    </div>
  );
}

export default function Profil() {
  const { utilisateur } = utiliserAuthentification();
  const [nom, definirNom] = useState(utilisateur?.nom || "");
  const [modalOuvert, definirModalOuvert] = useState(false);

  useEffect(() => {
    definirNom(utilisateur?.nom || "");
  }, [utilisateur?.nom]);

  useEffect(() => {
    if (!modalOuvert) return;
    const ancien = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function clavier(event) {
      if (event.key === "Escape") definirModalOuvert(false);
    }

    document.addEventListener("keydown", clavier);
    return () => {
      document.body.style.overflow = ancien;
      document.removeEventListener("keydown", clavier);
    };
  }, [modalOuvert]);

  function ouvrirModal() {
    definirNom(utilisateur?.nom || "");
    definirModalOuvert(true);
  }

  function fermerModal() {
    definirNom(utilisateur?.nom || "");
    definirModalOuvert(false);
  }

  async function enregistrer(event) {
    event.preventDefault();
    if (!nom.trim()) return;

    const sombre = document.documentElement.classList.contains("dark");

    await Swal.fire({
      title: "Mode démonstration",
      text: "Les modifications ne sont pas transmises au backend. Votre profil reste inchangé.",
      icon: "info",
      confirmButtonText: "Compris",
      confirmButtonColor: sombre ? "#29446D" : "#540916",
      background: sombre ? "#14243D" : "#FFFFFF",
      color: sombre ? "#F1F5F9" : "#171717"
    });
  }

  const nomActuel = utilisateur?.nom || "Utilisateur";
  const role = ROLES[utilisateur?.role] || utilisateur?.role || "Non défini";
  const initiales = nomActuel.trim().split(/\s+/).slice(0, 2)
    .map(mot => mot[0]?.toUpperCase()).join("");

  return (
    <div className="min-w-0 space-y-4">

      {/* EN-TÊTE */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className={`text-3xl font-bold tracking-tight ${texte}`}
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Mon profil
          </h1>
          <p className={`mt-1 text-sm ${secondaire}`}>
            Consultez et gérez les informations de votre compte.
          </p>
        </div>

        <button type="button" onClick={ouvrirModal}
          className={`${bouton} ${principal} w-full sm:w-auto`}>
          <Pencil size={16}/> Modifier le profil
        </button>
      </header>

      {/* CONTENU PRINCIPAL */}
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">

        {/* PROFIL UTILISATEUR */}
        <section className={`${carte} min-w-0 overflow-hidden`}>

          <div className={`flex flex-col items-start gap-4 border-b p-5 sm:flex-row sm:items-center ${bordure}`}>

            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#EAE3E5] bg-[#F8EDEF] text-2xl font-bold text-[#540916] dark:border-[#405574] dark:bg-[#29446D] dark:text-[#C4D7FF]">
              {initiales || <UserRound size={32} strokeWidth={1.7}/>}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className={`break-words text-xl font-bold tracking-tight ${texte}`}>
                {nomActuel}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[#540916]/10 px-2.5 py-1.5 text-xs font-semibold text-[#540916] dark:bg-[#29446D] dark:text-[#C4D7FF]">
                  <BadgeCheck size={15} className="shrink-0"/>
                  <span className="break-words">{role}</span>
                </span>
              </div>

              <p className={`mt-2 text-xs ${secondaire}`}>
                Saint Louis de Gonzague Mahasoabe
              </p>
            </div>
          </div>

          {/* INFORMATIONS PERSONNELLES */}
          <div className="p-4 sm:p-5">
            <h3 className={`text-base font-bold ${texte}`}>
              Informations du compte
            </h3>
            <p className={`mt-1 text-xs ${secondaire}`}>
              Informations associées à votre profil utilisateur.
            </p>

            <div className="mt-2">
              <InformationCompte titre="Nom affiché" valeur={nomActuel} Icone={UserRound}/>
              <InformationCompte titre="Rôle attribué" valeur={role} Icone={ShieldCheck}/>
            </div>
          </div>
        </section>

        {/* AUTORISATIONS */}
        <aside className="min-w-0 space-y-4">
          <section className={`${carte} p-4 sm:p-5`}>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]">
                <ShieldCheck size={22} strokeWidth={1.8}/>
              </div>

              <div className="min-w-0">
                <h3 className={`text-base font-bold ${texte}`}>
                  Autorisations du compte
                </h3>
                <p className={`mt-1 text-xs ${secondaire}`}>
                  Gestion des droits et des accès.
                </p>
              </div>
            </div>

            <p className={`mt-4 text-sm leading-relaxed ${secondaire}`}>
              Votre rôle détermine les fonctionnalités et les espaces auxquels vous pouvez accéder sur la plateforme.
            </p>

            <div className="mt-4 flex min-w-0 items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <CheckCircle2 size={19} className="shrink-0 text-emerald-600 dark:text-emerald-300"/>
              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                  Rôle attribué
                </p>
                <p className="mt-0.5 break-words text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {role}
                </p>
              </div>
            </div>
          </section>

          <Information>
            La modification des informations personnelles est actuellement en mode démonstration.
            Les changements ne sont pas enregistrés dans la base de données.
          </Information>
        </aside>
      </div>

      {/* MODAL DE MODIFICATION */}
      {modalOuvert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101828]/65 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={event => event.target === event.currentTarget && fermerModal()}>

          <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-profil"
            className={`${carte} flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden shadow-xl`}>

            {/* EN-TÊTE MODAL */}
            <header className={`flex shrink-0 items-start justify-between gap-3 border-b p-4 sm:p-5 ${bordure}`}>
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#540916]/10 text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]">
                  <Pencil size={18}/>
                </div>

                <div className="min-w-0">
                  <h2 id="titre-modal-profil" className={`text-lg font-bold ${texte}`}>
                    Modifier le profil
                  </h2>
                  <p className={`mt-1 text-xs ${secondaire}`}>
                    Modifiez vos informations personnelles.
                  </p>
                </div>
              </div>

              <button type="button" onClick={fermerModal} aria-label="Fermer"
                className={`shrink-0 rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-[#263852] ${secondaire}`}>
                <X size={19}/>
              </button>
            </header>

            {/* FORMULAIRE */}
            <form onSubmit={enregistrer} className="min-h-0 overflow-y-auto">
              <div className="space-y-4 p-4 sm:p-5">

                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">
                    Nom affiché <span className={accent}>*</span>
                  </span>

                  <input type="text" required maxLength={120} autoFocus
                    value={nom} onChange={event => definirNom(event.target.value)}
                    placeholder="Votre nom complet" className={champ}/>
                </label>

                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">
                    Rôle attribué
                  </span>

                  <div className="relative">
                    <ShieldCheck size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>

                    <input type="text" value={role} readOnly
                      className="w-full min-w-0 cursor-not-allowed rounded-xl border border-[#E4E7EC] bg-[#F8F9FC] py-2.5 pl-10 pr-3 text-sm text-[#667085] outline-none dark:border-[#33445E] dark:bg-[#1B2E4A] dark:text-[#A8B7CF]"/>
                  </div>

                  <p className={`mt-2 text-xs ${secondaire}`}>
                    Le rôle est défini par l'administration.
                  </p>
                </label>

                <Information>
                  Mode démonstration : aucune modification ne sera enregistrée.
                </Information>
              </div>

              {/* ACTIONS MODAL */}
              <footer className={`flex flex-wrap justify-end gap-2 border-t p-4 sm:p-5 ${bordure}`}>
                <button type="button" onClick={fermerModal}
                  className={`${bouton} ${contour} flex-1 sm:flex-none`}>
                  Annuler
                </button>

                <button type="submit" disabled={!nom.trim()}
                  className={`${bouton} ${principal} flex-1 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none`}>
                  <Save size={16}/> Simuler la mise à jour
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}