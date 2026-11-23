import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { messageErreur, requetePrivee } from "../services/authentification";
import { categoriesTarifs } from "./TarifsScolaires";

const champ = "rounded-lg border border-[#E4E7EC] bg-transparent px-3 py-2 text-sm dark:border-[#33445E]";
const bouton = "rounded-lg bg-[#540916] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const nombre = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 15 });
const dateCourte = date => date.split("-").reverse().join("/");

export default function SuiviFrais({ categorie, impayes }) {
  const [tarifs, definirTarifs] = useState(null);
  const [tarifId, definirTarifId] = useState("");
  const [erreur, definirErreur] = useState("");

  useEffect(() => {
    const controleur = new AbortController();
    requetePrivee("/tarifs-scolaires", { signal: controleur.signal })
      .then(liste => {
        if (!Array.isArray(liste)) throw new Error("Réponse incorrecte de l’API des tarifs.");
        if (!controleur.signal.aborted) definirTarifs(liste);
      })
      .catch(cause => { if (!controleur.signal.aborted) definirErreur(messageErreur(cause)); });
    return () => controleur.abort();
  }, []);

  const options = tarifs?.filter(tarif => tarif.categorie !== "ecolage" &&
    (!categorie || tarif.categorie === categorie));
  const tarif = options?.find(entree => entree.id === tarifId);

  return <section className="space-y-4 rounded-2xl border border-[#EAE3E5] bg-white p-4 dark:border-[#263852] dark:bg-[#14243D]">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{impayes ? "Élèves avec un solde dû" : "Suivi des versements"}</h2>
      {!categorie && <Link className={champ} to="/econome/frais-scolaires/ecolage">Suivi mensuel de l’écolage</Link>}
    </div>
    {erreur && <p role="alert" className="text-red-600">{erreur}</p>}
    {!tarifs && !erreur && <p role="status">Chargement des tarifs…</p>}
    {options?.length === 0 && <p>Aucun frais configuré dans cette catégorie.</p>}
    {!!options?.length && <label className="flex flex-wrap items-center gap-2 text-sm">Frais à consulter
      <select className={champ} value={tarifId} onChange={event => definirTarifId(event.target.value)}>
        <option value="">Choisir un frais</option>
        {options.map(entree => <option key={entree.id} value={entree.id}>
          {entree.libelle} · {categoriesTarifs[entree.categorie]} · {entree.cible || "Tous les élèves"}
          {" · "}{entree.typeContribution === "nature" ? `${entree.quantite} ${entree.unite}` : `${entree.montant} Ar`}
          {entree.finPaiement && ` · ${dateCourte(entree.finPaiement)}`}
        </option>)}
      </select>
    </label>}
    {tarif && <ListeFrais key={tarif.id} tarif={tarif} impayes={impayes} />}
  </section>;
}

function ListeFrais({ tarif, impayes }) {
  const [resultat, definirResultat] = useState(null);
  const [niveau, definirNiveau] = useState("");
  const [erreur, definirErreur] = useState("");
  const [message, definirMessage] = useState("");
  const [revision, definirRevision] = useState(0);
  const [formulaire, definirFormulaire] = useState(null);
  const [enCours, definirEnCours] = useState(false);
  const nature = tarif.typeContribution === "nature";
  const format = valeur => `${nombre.format(valeur)} ${nature ? tarif.unite : "Ar"}`;
  const base = `/frais-scolaires/${encodeURIComponent(tarif.id)}`;

  useEffect(() => {
    const controleur = new AbortController();
    requetePrivee(`${base}/suivi`, { signal: controleur.signal })
      .then(suivi => {
        if (!Array.isArray(suivi?.lignes)) throw new Error("Réponse incorrecte de l’API de suivi.");
        if (!controleur.signal.aborted) definirResultat(suivi);
      })
      .catch(cause => { if (!controleur.signal.aborted) definirErreur(messageErreur(cause)); });
    return () => controleur.abort();
  }, [base, revision]);

  const niveaux = [...new Set(resultat?.lignes.map(eleve => eleve.niveau).filter(Boolean))];
  const lignes = resultat?.lignes.filter(eleve => (!niveau || eleve.niveau === niveau) && (!impayes || eleve.reste > 0));
  const selection = resultat?.lignes.find(eleve => eleve.id === formulaire?.eleveId);

  async function enregistrer(evenement) {
    evenement.preventDefault();
    if (enCours || !selection) return;
    definirEnCours(true);
    definirErreur("");
    definirMessage("");
    try {
      await requetePrivee(`${base}/versements`, {
        method: "POST", data: { ...formulaire, valeur: Number(formulaire.valeur) },
      });
      definirFormulaire(null);
      definirResultat(null);
      definirRevision(valeur => valeur + 1);
      definirMessage("Versement enregistré.");
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p>{tarif.finPaiement ? tarif.debutPaiement
        ? `Période du ${dateCourte(tarif.debutPaiement)} au ${dateCourte(tarif.finPaiement)}`
        : `Échéance : ${dateCourte(tarif.finPaiement)}`
        : "Échéance à configurer"}</p>
      <label>Niveau{" "}
        <select className={champ} value={niveau} onChange={event => definirNiveau(event.target.value)}>
          <option value="">Tous les niveaux</option>
          {niveaux.map(valeur => <option key={valeur}>{valeur}</option>)}
        </select>
      </label>
    </div>
    {erreur && <p role="alert" className="text-red-600">{erreur}</p>}
    {message && <p role="status">{message}</p>}
    {!resultat && !erreur && <p role="status">Chargement des élèves…</p>}
    {selection && <form onSubmit={enregistrer}>
      <fieldset disabled={enCours} className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
        <legend className="px-2">Versement · {selection.nom} {selection.prenom}</legend>
        <label className="flex flex-col gap-1 text-sm">{nature ? `Quantité (${tarif.unite})` : "Montant (Ar)"}
          <input className={champ} required type="number" min={nature ? "0" : "1"}
            step={nature ? "any" : "1"} max={selection.reste} value={formulaire.valeur}
            onChange={event => definirFormulaire(donnees => ({ ...donnees, valeur: event.target.value }))} />
        </label>
        <button className={bouton}>Enregistrer</button>
        <button type="button" className={champ} onClick={() => definirFormulaire(null)}>Annuler</button>
      </fieldset>
    </form>}
    {lignes?.length === 0 && <p>{tarif.portee === "personnalisee"
      ? "Aucun élève correspondant au groupe et aux filtres."
      : "Aucun élève ne correspond aux filtres."}</p>}
    {!!lignes?.length && <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F8F9FC] dark:bg-[#0B172B]"><tr>
          {["Élève", "Classe", "Dû", "Reçu", "Reste", "Statut", "Action"]
            .map(titre => <th key={titre} scope="col" className="p-3">{titre}</th>)}
        </tr></thead>
        <tbody>{lignes.map(eleve => <tr key={eleve.id} className="border-t border-[#EAE3E5] dark:border-[#263852]">
          <td className="p-3">{eleve.nom} {eleve.prenom}{eleve.matricule && <small className="block">{eleve.matricule}</small>}</td>
          <td className="p-3">{eleve.classe || "—"}</td>
          <td className="p-3">{format(eleve.du)}</td><td className="p-3">{format(eleve.paye)}</td>
          <td className="p-3">{format(eleve.reste)}</td>
          <td className="p-3">
            <span className={`font-semibold ${eleve.reste <= 0
              ? "text-green-700 dark:text-green-400"
              : "text-red-700 dark:text-red-400"}`}>
              {eleve.reste <= 0 ? "Réglé" : eleve.paye ? "Partiel" : "Non réglé"}
            </span>
            {eleve.reste > 0 && resultat.enRetard && <span className="block font-semibold text-red-600">En retard</span>}
          </td>
          <td className="p-3">{eleve.reste > 0 && <button type="button" className={champ} disabled={enCours}
            onClick={() => definirFormulaire({ eleveId: eleve.id, valeur: "", operationId: crypto.randomUUID() })}>
            Ajouter
          </button>}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </>;
}
