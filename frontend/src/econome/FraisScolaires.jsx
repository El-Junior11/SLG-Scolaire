import SuiviEcolage from "./SuiviEcolage";
import { Link, useSearchParams } from "react-router-dom";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import TarifsScolaires, { categoriesTarifs } from "./TarifsScolaires";
import SuiviFrais from "./SuiviFrais";
import Recus from "./Recus";
import Icone from "../components/Icone";

const vues = [
  ["tarifs", "Tarifs", null, "Wallet"],
  ["paiements", "Paiements", SuiviFrais, "CreditCard"],
  ["impayes", "Impayés", SuiviFrais, "AlertCircle"],
  ["recus", "Reçus", Recus, "Receipt"]
];

export default function FraisScolaires({ categorie }) {
  const [parametres] = useSearchParams();
  const [vue, , Contenu] = vues.find(([id]) => id === parametres.get("vue")) ?? vues[0];
  const { utilisateur } = utiliserAuthentification();

  if (categorie === "ecolage") return <SuiviEcolage />;

  const titre = categoriesTarifs[categorie] ?? "Frais de scolarité";

  return <section className="min-w-0 space-y-5">
    {/* EN-TÊTE */}
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
          <Icone nom="Wallet" taille={22} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {titre}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Gestion des tarifs et suivi des opérations financières
          </p>
        </div>
      </div>
    </header>

    {/* ONGLETS */}
    <div className="border-b border-slate-200">
      <nav aria-label="Vues des frais scolaires"
        className="flex items-center gap-1 overflow-x-auto sm:gap-5">
        {vues.map(([id, libelle, , icone]) => {
          const actif = vue === id;

          return <Link key={id}
            to={{ search: id === "tarifs" ? "" : `?vue=${id}` }}
            aria-current={actif ? "page" : undefined}
            className={`relative inline-flex shrink-0 items-center justify-center gap-2 border-b-[3px] px-3 py-3 text-sm font-semibold transition sm:px-4 ${
              actif
                ? "border-[#540916] text-[#540916]"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}>
            <Icone nom={icone} taille={17} />
            {libelle}
          </Link>;
        })}
      </nav>
    </div>

    {/* CONTENU */}
    <div className="min-w-0">
      {Contenu ? <>
        {categorie && vue === "recus" && <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700">
          <Icone nom="Info" taille={16} />
          <span>Les reçus sont affichés dans la vue globale de l'économat.</span>
        </div>}

        <Contenu key={`${categorie ?? "tous"}-${vue}`}
          categorie={categorie}
          impayes={vue === "impayes"} />
      </> : <TarifsScolaires key={categorie}
        categorie={categorie}
        modifiable={utilisateur?.role === "admin"} />}
    </div>
  </section>;
}