import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { messageErreur, requetePrivee } from "../services/authentification";

export const categoriesTarifs = {
  ecolage: "Écolage",
  inscription: "Droits d’inscription",
  infrastructure: "Frais d’infrastructure",
  divers: "Frais divers",
};

const portees = {
  tous: "Tous les élèves",
  niveau: "Par niveau",
  personnalisee: "Groupe personnalisé",
};
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2 text-sm dark:border-[#33445E] dark:bg-[#0B172B]";
const montants = new Intl.NumberFormat("fr-FR");

export default function TarifsScolaires({ categorie, modifiable = false }) {
  const [tarifs, definirTarifs] = useState(null);
  const [niveaux, definirNiveaux] = useState(null);
  const [erreurNiveaux, definirErreurNiveaux] = useState("");
  const [filtre, definirFiltre] = useState(categorie ?? "");
  const [formulaire, definirFormulaire] = useState(null);
  const [enCours, definirEnCours] = useState(false);
  const [erreur, definirErreur] = useState("");
  const [message, definirMessage] = useState("");

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

  const enNature = formulaire?.categorie === "divers" && formulaire.typeContribution === "nature";
  const parNiveau = formulaire?.portee === "niveau";

  useEffect(() => {
    if (!parNiveau) return;
    const controleur = new AbortController();
    definirNiveaux(null);
    definirErreurNiveaux("");
    requetePrivee("/classes", { signal: controleur.signal })
      .then(liste => {
        if (!Array.isArray(liste)) throw new Error("Réponse incorrecte de l’API des classes.");
        const valeurs = liste.map(classe => classe.niveau?.trim()).filter(Boolean);
        if (!controleur.signal.aborted) {
          definirNiveaux([...new Set(valeurs)].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })));
        }
      })
      .catch(cause => {
        if (!controleur.signal.aborted) definirErreurNiveaux(messageErreur(cause));
      });
    return () => controleur.abort();
  }, [parNiveau]);

  const niveauExistant = formulaire?.id && formulaire.portee === "niveau"
    ? tarifs?.find(tarif => tarif.id === formulaire.id && tarif.portee === "niveau")?.cible
    : "";
  const ancienNiveau = niveauExistant && !niveaux?.includes(niveauExistant) ? niveauExistant : "";
  const niveauValide = Boolean(formulaire?.cible &&
    (niveaux?.includes(formulaire.cible) || formulaire.cible === ancienNiveau));
  const niveauIndisponible = parNiveau && !niveauValide;

  function modifier(champ, valeur) {
    definirFormulaire(tarif => ({ ...tarif, [champ]: valeur }));
  }

  async function enregistrer(evenement) {
    evenement.preventDefault();
    if (niveauIndisponible) return;
    definirEnCours(true);
    definirErreur("");
    definirMessage("");
    try {
      const { id, ...saisie } = formulaire;
      const tarif = await requetePrivee(id ? `/tarifs-scolaires/${encodeURIComponent(id)}` : "/tarifs-scolaires", {
        method: id ? "PUT" : "POST",
        data: {
          ...saisie,
          typeContribution: enNature ? "nature" : "argent",
          montant: enNature ? null : Number(saisie.montant),
          quantite: enNature ? Number(saisie.quantite) : null,
        },
      });
      definirTarifs(liste => id ? liste.map(ligne => ligne.id === id ? tarif : ligne) : [...liste, tarif]);
      definirFormulaire(null);
      definirMessage("Tarif enregistré.");
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  async function supprimer(tarif) {
    definirEnCours(true);
    try {
      const resultat = await Swal.fire({
        title: "Supprimer ce tarif ?", text: tarif.libelle, icon: "warning",
        showCancelButton: true, confirmButtonText: "Supprimer", cancelButtonText: "Annuler",
      });
      if (!resultat.isConfirmed) return;
      definirErreur("");
      definirMessage("");
      await requetePrivee(`/tarifs-scolaires/${encodeURIComponent(tarif.id)}`, { method: "DELETE" });
      definirTarifs(liste => liste.filter(ligne => ligne.id !== tarif.id));
      if (formulaire?.id === tarif.id) definirFormulaire(null);
      definirMessage("Tarif supprimé.");
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  const lignes = tarifs?.filter(tarif => !filtre || tarif.categorie === filtre)
    .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));

  return <section className="space-y-4 rounded-2xl border border-[#EAE3E5] bg-white p-5 dark:border-[#263852] dark:bg-[#14243D]">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold">Tarifs scolaires</h2>
      {!categorie && <label className="flex items-center gap-2 text-sm">
        Catégorie
        <select className={champ} value={filtre} onChange={event => definirFiltre(event.target.value)}>
          <option value="">Toutes les catégories</option>
          {Object.entries(categoriesTarifs).map(([id, libelle]) => <option key={id} value={id}>{libelle}</option>)}
        </select>
      </label>}
      {modifiable && <button type="button" className="bouton" disabled={!tarifs || enCours}
        onClick={() => definirFormulaire({ categorie: filtre || "ecolage", libelle: "", portee: "tous", cible: "", montant: "" })}>
        Ajouter un tarif
      </button>}
    </div>
    {erreur && <p role="alert" className="text-red-600">{erreur}</p>}
    {message && <p role="status">{message}</p>}
    {!tarifs && !erreur && <p role="status">Chargement des tarifs…</p>}
    {formulaire && <form className="space-y-3 rounded-xl border p-4" onSubmit={enregistrer}>
      <h3 className="font-semibold">{formulaire.id ? "Modifier le tarif" : "Nouveau tarif"}</h3>
      <fieldset disabled={enCours} className="grid gap-3 sm:grid-cols-2">
        {!categorie && <label>Catégorie<select className={champ} value={formulaire.categorie}
          onChange={event => definirFormulaire(tarif => ({ ...tarif, categorie: event.target.value, typeContribution: "argent" }))}>
          {Object.entries(categoriesTarifs).map(([id, libelle]) => <option key={id} value={id}>{libelle}</option>)}
        </select></label>}
        <label>Libellé<input className={champ} required maxLength={120} value={formulaire.libelle}
          onChange={event => modifier("libelle", event.target.value)} /></label>
        {formulaire.categorie === "divers" && <label>Type de contribution
          <select className={champ} value={formulaire.typeContribution ?? "argent"}
            onChange={event => modifier("typeContribution", event.target.value)}>
            <option value="argent">Montant en ariary</option>
            <option value="nature">Contribution en nature</option>
          </select>
        </label>}
        {enNature ? <>
          <label>Quantité<input className={champ} required type="number" min="0" step="any"
            value={formulaire.quantite ?? ""} onChange={event => modifier("quantite", event.target.value)} /></label>
          <label>Unité<input className={champ} required maxLength={40} placeholder="kg, kapoaka, sac…"
            value={formulaire.unite ?? ""} onChange={event => modifier("unite", event.target.value)} /></label>
        </> : <label>Montant (Ar)<input className={champ} required type="number" min="0" step="1"
          value={formulaire.montant ?? ""} onChange={event => modifier("montant", event.target.value)} /></label>}
        {formulaire.categorie !== "ecolage" && <>
          <label>Début de la période (facultatif)
            <input type="date" className={champ} value={formulaire.debutPaiement ?? ""}
              onChange={event => modifier("debutPaiement", event.target.value)} />
          </label>
          <label>Date limite de paiement
            <input type="date" className={champ} required min={formulaire.debutPaiement || undefined}
              value={formulaire.finPaiement ?? ""} onChange={event => modifier("finPaiement", event.target.value)} />
          </label>
        </>}
        <label>Application<select className={champ} value={formulaire.portee}
          onChange={event => definirFormulaire(tarif => ({ ...tarif, portee: event.target.value, cible: "" }))}>
          {Object.entries(portees).map(([id, libelle]) => <option key={id} value={id}>{libelle}</option>)}
        </select></label>
        {parNiveau && <label>Niveau de classe
          <select className={champ} required value={formulaire.cible} disabled={!niveaux && !ancienNiveau}
            onChange={event => modifier("cible", event.target.value)}>
            <option value="">Sélectionner un niveau</option>
            {ancienNiveau && <option value={ancienNiveau}>{ancienNiveau} (niveau enregistré)</option>}
            {niveaux?.map(niveau => <option key={niveau} value={niveau}>{niveau}</option>)}
          </select>
          {erreurNiveaux ? <span role="alert" className="text-sm text-red-600">{erreurNiveaux}</span>
            : !niveaux ? <span role="status" className="text-sm">Chargement des niveaux…</span>
            : !niveaux.length && <span className="text-sm">Ajoutez une classe avec un niveau dans Classes.</span>}
        </label>}
        {formulaire.portee === "personnalisee" && <label>Nom du groupe
          <input className={champ} required maxLength={120} value={formulaire.cible}
            onChange={event => modifier("cible", event.target.value)} />
        </label>}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button className="bouton" disabled={niveauIndisponible}>Enregistrer</button>
          <button className="bouton bouton-secondaire" type="button" onClick={() => definirFormulaire(null)}>Annuler</button>
        </div>
      </fieldset>
    </form>}
    {lignes?.length === 0 && <p>Aucun tarif configuré pour cette catégorie.</p>}
    {lignes?.length > 0 && <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F8F9FC] dark:bg-[#0B172B]"><tr>
          {["Libellé", "Catégorie", "Application", "Contribution", "Échéance", ...(modifiable ? ["Actions"] : [])]
            .map(titre => <th key={titre} scope="col" className="px-3 py-3">{titre}</th>)}
        </tr></thead>
        <tbody>{lignes.map(tarif => <tr key={tarif.id} className="border-t border-[#EAE3E5] dark:border-[#263852]">
          <td className="p-3">{tarif.libelle}</td>
          <td className="p-3">{categoriesTarifs[tarif.categorie]}</td>
          <td className="p-3">{tarif.cible || portees[tarif.portee]}</td>
          <td className="p-3">{tarif.typeContribution === "nature"
            ? `${montants.format(tarif.quantite)} ${tarif.unite}`
            : `${montants.format(tarif.montant)} Ar`}</td>
          <td className="p-3">{tarif.categorie === "ecolage" ? "Mensuelle"
            : [tarif.debutPaiement, tarif.finPaiement].filter(Boolean).map(date => date.split("-").reverse().join("/")).join(" au ") || "À configurer"}</td>
          {modifiable && <td className="p-3"><div className="flex gap-3">
            <button type="button" disabled={enCours} onClick={() => definirFormulaire(tarif)}>Modifier</button>
            <button type="button" disabled={enCours} className="text-red-600" onClick={() => supprimer(tarif)}>Supprimer</button>
          </div></td>}
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
