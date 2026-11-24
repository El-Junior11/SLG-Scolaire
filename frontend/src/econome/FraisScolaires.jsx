import SuiviEcolage from "./SuiviEcolage";
import { Link, useSearchParams } from "react-router-dom";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import TarifsScolaires, { categoriesTarifs } from "./TarifsScolaires";
import SuiviFrais from "./SuiviFrais";
import { Wallet, CreditCard, AlertCircle } from "lucide-react";

const vues = [
  ["tarifs", "Tarifs", Wallet],
  ["paiements", "Paiements", CreditCard],
  ["impayes", "Impayés", AlertCircle]
];

export default function FraisScolaires({ categorie }) {
  const [parametres] = useSearchParams();
  const { utilisateur } = utiliserAuthentification();

  const vueDemandee = parametres.get("vue");
  const vue = vueDemandee === "recus" ? "paiements"
    : vues.some(([id]) => id === vueDemandee) ? vueDemandee : "tarifs";

  if (categorie === "ecolage") return <SuiviEcolage/>;

  const titre = categoriesTarifs[categorie] ?? "Frais de scolarité";

  return (
    <section className="flex w-full min-w-0 flex-col gap-4 pb-4">

      {/* EN-TÊTE */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold tracking-tight text-[#171717] dark:text-white sm:text-3xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {titre}
          </h1>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A8B7CF]">
            Gestion des tarifs et suivi des opérations financières.
          </p>
        </div>
      </header>

      {/* NAVIGATION */}
      <div className="w-full min-w-0 shrink-0 border-b border-[#EAE3E5] dark:border-[#263852]">
        <nav aria-label="Vues des frais scolaires"
          className="flex min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain sm:gap-3">

          {vues.map(([id, libelle, Icone]) => {
            const actif = vue === id;

            return <Link key={id}
              to={{ search: id === "tarifs" ? "" : `?vue=${id}` }}
              aria-current={actif ? "page" : undefined}
              className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border-b-[3px] px-3 py-3 text-sm font-semibold transition-colors sm:px-4 ${
                actif
                  ? "border-[#540916] text-[#540916] dark:border-[#60A5FA] dark:text-[#93C5FD]"
                  : "border-transparent text-[#667085] hover:border-slate-300 hover:text-[#171717] dark:text-[#A8B7CF] dark:hover:border-[#405574] dark:hover:text-white"
              }`}>
              <Icone size={17} strokeWidth={1.8}/>
              {libelle}
            </Link>;
          })}
        </nav>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="flex w-full min-w-0 shrink-0 flex-col">

        {vue === "tarifs" ? (
          <TarifsScolaires
            key={categorie ?? "tous"}
            categorie={categorie}
            modifiable={utilisateur?.role === "admin"}/>
        ) : (
          <SuiviFrais
            key={`${categorie ?? "tous"}-${vue}`}
            categorie={categorie}
            impayes={vue === "impayes"}/>
        )}

      </div>
    </section>
  );
}