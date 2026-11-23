import SuiviEcolage from "./SuiviEcolage";
import { Link, useSearchParams } from "react-router-dom";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import TarifsScolaires, { categoriesTarifs } from "./TarifsScolaires";
import Paiements from "./Paiements";
import Impayes from "./Impayes";
import Recus from "./Recus";

const vues = [
  ["tarifs", "Tarifs"],
  ["paiements", "Paiements", Paiements],
  ["impayes", "Impayés", Impayes],
  ["recus", "Reçus", Recus],
];

export default function FraisScolaires({ categorie }) {
  const [parametres] = useSearchParams();
  const [vue, , Contenu] = vues.find(([id]) => id === parametres.get("vue")) ?? vues[0];
  const { utilisateur } = utiliserAuthentification();

  if (categorie === "ecolage") return <SuiviEcolage />;

  return (
    <section className="min-w-0 space-y-4">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{categoriesTarifs[categorie] ?? "Frais de scolarité"}</h1>
      </header>
      <nav aria-label="Vues des frais scolaires" className="flex flex-wrap gap-2">
        {vues.map(([id, titre]) => (
          <Link key={id} to={{ search: id === "tarifs" ? "" : `?vue=${id}` }}
            aria-current={vue === id ? "page" : undefined}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
              vue === id ? "border-[#540916] bg-[#540916] text-white" : "border-[#EAE3E5] hover:border-[#540916]"
            }`}>
            {titre}
          </Link>
        ))}
      </nav>
      {Contenu ? (
        <>
          {categorie && <p className="text-sm text-[#667085] dark:text-[#A8B7CF]">Vue globale de l’économat</p>}
          <Contenu />
        </>
      ) : (
        <TarifsScolaires key={categorie} categorie={categorie} modifiable={utilisateur?.role === "admin"} />
      )}
    </section>
  );
}
