import { useState } from "react";
import {
  Bell, BellOff, Mail, CheckCircle2, CheckCheck,
  Check, Search, Info, ShieldCheck
} from "lucide-react";

const notificationsInitiales = [
  {
    id: 1, icone: Info, titre: "Bienvenue sur SLG-Scolaire",
    description: "Bienvenue sur la plateforme de démonstration.",
    type: "information", date: "Information générale", lu: false
  },
  {
    id: 2, icone: ShieldCheck, titre: "Autorisations et accès",
    description: "Vos autorisations dépendent de votre rôle.",
    type: "securite", date: "Sécurité", lu: false
  },
  {
    id: 3, icone: Bell, titre: "Centre de notifications",
    description: "Les notifications réelles seront connectées au backend.",
    type: "information", date: "Information générale", lu: false
  }
];

const carte = "rounded-xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const accent = "text-[#540916] dark:text-[#93C5FD]";
const bouton = "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const stylesTypes = {
  information: {
    fond: "bg-blue-50 dark:bg-blue-500/10",
    texte: "text-blue-600 dark:text-blue-300",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    libelle: "Information"
  },
  securite: {
    fond: "bg-emerald-50 dark:bg-emerald-500/10",
    texte: "text-emerald-600 dark:text-emerald-300",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    libelle: "Sécurité"
  }
};

function CarteStatistique({ titre, valeur, Icone, couleur }) {
  return (
    <div className={`${carte} flex min-w-0 items-center justify-between gap-3 p-4 sm:p-5`}>
      <div className="min-w-0">
        <p className={`text-xs font-medium sm:text-sm ${secondaire}`}>{titre}</p>
        <p className={`mt-1 text-2xl font-bold tracking-tight ${texte}`}>{valeur}</p>
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${couleur}`}>
        <Icone size={21} strokeWidth={1.8}/>
      </div>
    </div>
  );
}

export default function Notifications() {
  const [notifications, definirNotifications] = useState(notificationsInitiales);
  const [filtre, definirFiltre] = useState("toutes");
  const [recherche, definirRecherche] = useState("");

  const total = notifications.length;
  const nonLues = notifications.filter(n => !n.lu).length;
  const lues = total - nonLues;

  const liste = notifications.filter(notification => {
    const correspondFiltre = filtre === "toutes" ||
      (filtre === "non-lues" && !notification.lu) ||
      (filtre === "lues" && notification.lu);

    const contenu = `${notification.titre} ${notification.description}`.toLowerCase();
    return correspondFiltre && contenu.includes(recherche.toLowerCase().trim());
  });

  function marquerCommeLue(id) {
    definirNotifications(liste => liste.map(n => n.id === id ? { ...n, lu: true } : n));
  }

  function marquerToutesCommeLues() {
    definirNotifications(liste => liste.map(n => ({ ...n, lu: true })));
  }

  const statistiques = [
    {
      titre: "Total notifications", valeur: total, Icone: Bell,
      couleur: "bg-[#540916]/10 text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]"
    },
    {
      titre: "Non lues", valeur: nonLues, Icone: Mail,
      couleur: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
    },
    {
      titre: "Lues", valeur: lues, Icone: CheckCircle2,
      couleur: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
    }
  ];

  return (
    <div className="min-w-0 space-y-4">

      {/* EN-TÊTE */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${texte}`}
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Notifications
          </h1>
          <p className={`mt-1 text-sm ${secondaire}`}>
            Consultez les informations et les alertes de votre espace scolaire.
          </p>
        </div>

        <button type="button" onClick={marquerToutesCommeLues} disabled={nonLues === 0}
          className={`${bouton} w-full border border-[#EAE3E5] bg-white text-[#540916] hover:border-[#540916] hover:bg-[#540916]/5 dark:border-[#30415C] dark:bg-[#14243D] dark:text-[#93C5FD] dark:hover:border-[#60A5FA] dark:hover:bg-[#29446D] sm:w-auto`}>
          <CheckCheck size={17}/> Tout marquer comme lu
        </button>
      </header>

      {/* STATISTIQUES */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Statistiques des notifications">
        {statistiques.map(stat => (
          <CarteStatistique key={stat.titre} {...stat}/>
        ))}
      </section>

      {/* CENTRE DE NOTIFICATIONS */}
      <section className={`${carte} min-w-0 overflow-hidden`}>

        {/* FILTRES ET RECHERCHE */}
        <div className="flex flex-col gap-3 border-b border-[#EAE3E5] p-3 dark:border-[#263852] sm:p-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {[
              ["toutes", "Toutes", total],
              ["non-lues", "Non lues", nonLues],
              ["lues", "Lues", lues]
            ].map(([id, libelle, nombre]) => (
              <button key={id} type="button" onClick={() => definirFiltre(id)}
                aria-pressed={filtre === id}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  filtre === id
                    ? "bg-[#540916] text-white dark:bg-[#29446D] dark:text-[#C4D7FF]"
                    : "text-[#667085] hover:bg-slate-100 dark:text-[#A8B7CF] dark:hover:bg-[#1B2E4A]"
                }`}>
                {libelle}
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                  filtre === id
                    ? "bg-white/20 text-white dark:bg-[#405574] dark:text-[#D6E4FF]"
                    : "bg-slate-100 text-slate-500 dark:bg-[#263852] dark:text-[#A8B7CF]"
                }`}>
                  {nombre}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full min-w-0 lg:max-w-[290px]">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
            <input type="search" value={recherche}
              onChange={e => definirRecherche(e.target.value)}
              placeholder="Rechercher une notification..."
              aria-label="Rechercher une notification"
              className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-10 pr-3 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#98A2B3] focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white dark:focus:border-[#60A5FA]"/>
          </div>
        </div>

        {/* LISTE DES NOTIFICATIONS */}
        {liste.length > 0 ? (
          <div className="divide-y divide-[#EAE3E5] dark:divide-[#263852]">
            {liste.map(notification => {
              const style = stylesTypes[notification.type] || stylesTypes.information;
              const Icone = notification.icone;

              return (
                <article key={notification.id}
                  className={`group relative flex min-w-0 flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${
                    notification.lu
                      ? "bg-white hover:bg-slate-50 dark:bg-[#14243D] dark:hover:bg-[#1B2E4A]"
                      : "bg-[#540916]/[0.025] hover:bg-[#540916]/5 dark:bg-[#1B2E4A] dark:hover:bg-[#213653]"
                  }`}>

                  {!notification.lu && (
                    <span className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#540916] dark:bg-[#60A5FA]"/>
                  )}

                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">

                    {/* ICÔNE */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${style.fond} ${style.texte}`}>
                      <Icone size={21} strokeWidth={1.8}/>
                    </div>

                    {/* CONTENU */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`break-words text-sm font-bold sm:text-base ${texte}`}>
                          {notification.titre}
                        </h3>

                        {!notification.lu && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#540916] dark:bg-[#60A5FA]"/>
                        )}
                      </div>

                      <p className={`mt-1 break-words text-sm leading-relaxed ${secondaire}`}>
                        {notification.description}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${style.badge}`}>
                          {style.libelle}
                        </span>

                        <span className={`text-xs ${secondaire}`}>
                          {notification.date}
                        </span>

                        <span className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                          notification.lu
                            ? "bg-slate-100 text-slate-500 dark:bg-[#263852] dark:text-[#A8B7CF]"
                            : "bg-[#540916]/10 text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]"
                        }`}>
                          {notification.lu ? "Lue" : "Non lue"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION */}
                  <div className="flex shrink-0 items-center justify-end sm:min-w-[155px]">
                    {!notification.lu ? (
                      <button type="button" onClick={() => marquerCommeLue(notification.id)}
                        title="Marquer comme lue"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-white px-3 py-2 text-xs font-semibold text-[#667085] transition-colors hover:border-[#540916]/40 hover:text-[#540916] dark:border-[#405574] dark:bg-[#14243D] dark:text-[#C4D7FF] dark:hover:border-[#60A5FA] dark:hover:bg-[#29446D]">
                        <Check size={15}/> Marquer comme lue
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                        <CheckCheck size={16}/> Déjà lue
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 py-10 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-[#263852] dark:text-[#A8B7CF]">
              <BellOff size={25} strokeWidth={1.7}/>
            </div>

            <h3 className={`text-base font-bold ${texte}`}>
              Aucune notification trouvée
            </h3>

            <p className={`mt-1 max-w-sm text-sm ${secondaire}`}>
              Aucune notification ne correspond aux critères sélectionnés.
            </p>

            <button type="button"
              onClick={() => { definirFiltre("toutes"); definirRecherche(""); }}
              className={`mt-4 text-sm font-semibold hover:underline ${accent}`}>
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* PIED DE LISTE */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EAE3E5] px-4 py-3 dark:border-[#263852]">
          <span className={`text-xs ${secondaire}`}>
            {liste.length} notification(s) sur {total}
          </span>

          <span className={`flex items-center gap-2 text-xs ${secondaire}`}>
            <span className="h-2 w-2 rounded-full bg-[#540916] dark:bg-[#60A5FA]"/>
            {nonLues} non lue(s)
          </span>
        </footer>
      </section>

      {/* INFORMATION DE DÉMONSTRATION */}
      <div className="flex min-w-0 items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 dark:border-[#30415C] dark:bg-[#14243D]">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600 dark:text-[#93C5FD]"/>

        <div className="min-w-0">
          <p className="text-xs font-semibold text-blue-800 dark:text-[#C4D7FF]">
            Mode démonstration
          </p>
          <p className="mt-1 text-xs leading-relaxed text-blue-700 dark:text-[#A8B7CF]">
            Les notifications réelles seront disponibles après leur intégration au backend.
            Le statut lu/non lu est temporaire et n'est pas enregistré.
          </p>
        </div>
      </div>
    </div>
  );
}