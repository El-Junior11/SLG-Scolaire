import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2, X, Save, Wallet, Search, Info, AlertCircle } from "lucide-react";
import { messageErreur, requetePrivee } from "../services/authentification";

export const categoriesTarifs = {
  ecolage: "Écolage",
  inscription: "Droits d’inscription",
  infrastructure: "Frais d’infrastructure",
  divers: "Frais divers"
};

const portees = {
  tous: "Tous les élèves",
  niveau: "Par niveau",
  personnalisee: "Groupe personnalisé"
};

const champ = "w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#540916] dark:focus:border-[#60A5FA] focus:ring-2 focus:ring-[#540916]/10 dark:focus:ring-blue-400/10 dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const label = "block space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200";
const montants = new Intl.NumberFormat("fr-FR");

export default function TarifsScolaires({ categorie, modifiable = false }) {
  const [tarifs, definirTarifs] = useState(null);
  const [niveaux, definirNiveaux] = useState(null);
  const [erreurNiveaux, definirErreurNiveaux] = useState("");
  const [filtre, definirFiltre] = useState(categorie ?? "");
  const [recherche, definirRecherche] = useState("");
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

  useEffect(() => {
    if (!formulaire) return;
    const ancien = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function clavier(event) {
      if (event.key === "Escape" && !enCours) definirFormulaire(null);
    }
    document.addEventListener("keydown", clavier);
    return () => {
      document.body.style.overflow = ancien;
      document.removeEventListener("keydown", clavier);
    };
  }, [formulaire, enCours]);

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

  function ajouter() {
    definirErreur("");
    definirMessage("");
    definirFormulaire({
      categorie: categorie || filtre || "ecolage",
      libelle: "",
      portee: "tous",
      cible: "",
      montant: ""
    });
  }

  function editer(tarif) {
    definirErreur("");
    definirMessage("");
    definirFormulaire({ ...tarif });
  }

  function fermer() {
    if (enCours) return;
    definirFormulaire(null);
  }

  async function enregistrer(evenement) {
    evenement.preventDefault();
    if (niveauIndisponible) return;
    definirEnCours(true);
    definirErreur("");
    definirMessage("");

    try {
      const { id, ...saisie } = formulaire;
      const tarif = await requetePrivee(
        id ? `/tarifs-scolaires/${encodeURIComponent(id)}` : "/tarifs-scolaires",
        {
          method: id ? "PUT" : "POST",
          data: {
            ...saisie,
            typeContribution: enNature ? "nature" : "argent",
            montant: enNature ? null : Number(saisie.montant),
            quantite: enNature ? Number(saisie.quantite) : null
          }
        }
      );

      definirTarifs(liste => id
        ? liste.map(ligne => ligne.id === id ? tarif : ligne)
        : [...liste, tarif]
      );
      definirFormulaire(null);
      definirMessage(id ? "Tarif modifié avec succès." : "Tarif ajouté avec succès.");
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  async function supprimer(tarif) {
    const resultat = await Swal.fire({
      title: "Supprimer ce tarif ?",
      text: tarif.libelle,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: document.documentElement.classList.contains("dark") ? "#29446D" : "#DC2626",
      background: document.documentElement.classList.contains("dark") ? "#14243D" : "#FFFFFF",
      color: document.documentElement.classList.contains("dark") ? "#F1F5F9" : "#171717",
      cancelButtonColor: "#64748B"
    });
    if (!resultat.isConfirmed) return;

    definirEnCours(true);
    definirErreur("");
    definirMessage("");

    try {
      await requetePrivee(`/tarifs-scolaires/${encodeURIComponent(tarif.id)}`, { method: "DELETE" });
      definirTarifs(liste => liste.filter(ligne => ligne.id !== tarif.id));
      definirMessage("Tarif supprimé avec succès.");
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  const lignes = tarifs?.filter(tarif =>
    (!filtre || tarif.categorie === filtre) &&
    `${tarif.libelle} ${categoriesTarifs[tarif.categorie]} ${tarif.cible || ""}`
      .toLowerCase().includes(recherche.toLowerCase().trim())
  ).sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));

  return <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]">

    {/* EN-TÊTE */}
    <div className="flex shrink-0 flex-col gap-3 border-b border-slate-100 p-4 dark:border-[#263852] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Tarifs scolaires</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-[#A8B7CF]">
          {tarifs ? `${lignes.length} tarif(s) affiché(s)` : "Chargement des tarifs…"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" value={recherche} onChange={event => definirRecherche(event.target.value)}
            placeholder="Rechercher..." aria-label="Rechercher un tarif"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#540916] dark:focus:border-[#60A5FA] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white sm:w-44" />
        </div>

        {!categorie && <select value={filtre} onChange={event => definirFiltre(event.target.value)}
          aria-label="Filtrer par catégorie"
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#540916] dark:focus:border-[#60A5FA] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white">
          <option value="">Toutes les catégories</option>
          {Object.entries(categoriesTarifs).map(([id, libelle]) =>
            <option key={id} value={id}>{libelle}</option>
          )}
        </select>}

        {modifiable && <button type="button" onClick={ajouter} disabled={!tarifs || enCours}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#540916] px-4 text-xs font-bold text-white transition hover:bg-[#74172A] dark:bg-[#29446D] dark:hover:bg-[#365781] disabled:opacity-50">
          <Plus size={17} /> Ajouter un tarif
        </button>}
      </div>
    </div>

    {/* MESSAGES */}
    {erreur && !formulaire && <p role="alert" className="m-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-[#1B2E4A] dark:text-[#C4D7FF]">{erreur}</p>}
    {message && <p role="status" className="m-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</p>}
    {!tarifs && !erreur && <p role="status" className="p-6 text-sm text-slate-500 dark:text-[#A8B7CF]">Chargement des tarifs…</p>}

    {/* TABLEAU */}
    {lignes?.length === 0 && <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
      <Wallet size={28} className="mb-3 text-slate-300" />
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Aucun tarif trouvé</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-[#A8B7CF]">Aucun tarif ne correspond aux critères sélectionnés.</p>
    </div>}

    {lignes?.length > 0 && <div className="min-h-0 min-w-0 max-h-[272px] overflow-auto overscroll-contain">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
        <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs font-semibold text-slate-600 dark:bg-[#0B172B] dark:text-[#A8B7CF]">
          <tr>
            <th className="h-12 px-4 py-2">Libellé</th>
            <th className="h-12 px-4 py-2">Catégorie</th>
            <th className="h-12 px-4 py-2">Application</th>
            <th className="h-12 px-4 py-2">Contribution</th>
            <th className="h-12 px-4 py-2">Échéance</th>
            {modifiable && <th className="sticky right-0 z-20 h-12 w-px whitespace-nowrap bg-[#F8F9FC] px-4 py-2 text-right dark:bg-[#0B172B]">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {lignes.map(tarif => <tr key={tarif.id} className="group h-14 transition hover:bg-slate-50 dark:hover:bg-[#1B2E4A]">
            <td className="px-4 py-2 font-semibold text-slate-900 dark:text-white">{tarif.libelle}</td>
            <td className="px-4 py-2">
              <span className="inline-flex rounded-md bg-[#540916]/5 px-2.5 py-1 text-xs font-medium text-[#540916] dark:bg-white/10 dark:text-white">
                {categoriesTarifs[tarif.categorie] || tarif.categorie}
              </span>
            </td>
            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
              {tarif.cible || portees[tarif.portee]}
            </td>
            <td className="px-4 py-2 font-semibold text-slate-800 dark:text-white">
              {tarif.typeContribution === "nature"
                ? `${montants.format(tarif.quantite)} ${tarif.unite}`
                : `${montants.format(tarif.montant)} Ar`}
            </td>
            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
              {tarif.categorie === "ecolage" ? "Mensuelle"
                : [tarif.debutPaiement, tarif.finPaiement].filter(Boolean)
                  .map(date => date.split("-").reverse().join("/")).join(" au ") || "À configurer"}
            </td>

            {modifiable && <td className="sticky right-0 z-[1] w-px whitespace-nowrap bg-white px-4 py-2 text-right group-hover:bg-slate-50 dark:bg-[#14243D] dark:group-hover:bg-[#1B2E4A]">
              <div className="flex items-center justify-end gap-1.5">
                <button type="button" onClick={() => editer(tarif)} disabled={enCours}
                  title="Modifier" aria-label={`Modifier ${tarif.libelle}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#540916] transition hover:bg-[#540916]/10 dark:text-[#93C5FD] dark:hover:bg-[#29446D] disabled:opacity-40">
                  <Pencil size={16} />
                </button>
                <button type="button" onClick={() => supprimer(tarif)} disabled={enCours}
                  title="Supprimer" aria-label={`Supprimer ${tarif.libelle}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 dark:text-[#A8B7CF] dark:hover:bg-[#263852] disabled:opacity-40">
                  <Trash2 size={16} />
                </button>
              </div>
            </td>}
          </tr>)}
        </tbody>
      </table>
    </div>}

    {/* MODAL AJOUT / MODIFICATION */}
    {formulaire && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={event => { if (event.target === event.currentTarget) fermer(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-tarif"
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#14243D]">

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-[#263852] sm:px-6">
          <div>
            <h3 id="titre-modal-tarif" className="text-lg font-bold text-slate-900 dark:text-white">
              {formulaire.id ? "Modifier le tarif" : "Ajouter un tarif"}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#A8B7CF]">Renseignez les informations du tarif scolaire.</p>
          </div>
          <button type="button" onClick={fermer} disabled={enCours} aria-label="Fermer"
            className="rounded-lg p-2 text-slate-500 dark:text-[#A8B7CF] hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={enregistrer} className="min-h-0 overflow-y-auto">
          <fieldset disabled={enCours} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {!categorie && <label className={label}>
              <span>Catégorie <span className="text-red-500 dark:text-[#93C5FD]">*</span></span>
              <select className={champ} value={formulaire.categorie}
                onChange={event => definirFormulaire(tarif => ({
                  ...tarif, categorie: event.target.value, typeContribution: "argent"
                }))}>
                {Object.entries(categoriesTarifs).map(([id, libelle]) =>
                  <option key={id} value={id}>{libelle}</option>
                )}
              </select>
            </label>}

            <label className={label}>
              <span>Libellé <span className="text-red-500 dark:text-[#93C5FD]">*</span></span>
              <input className={champ} required maxLength={120} value={formulaire.libelle}
                placeholder="Ex. : Droit d'inscription"
                onChange={event => modifier("libelle", event.target.value)} />
            </label>

            {formulaire.categorie === "divers" && <label className={label}>
              <span>Type de contribution</span>
              <select className={champ} value={formulaire.typeContribution ?? "argent"}
                onChange={event => modifier("typeContribution", event.target.value)}>
                <option value="argent">Montant en ariary</option>
                <option value="nature">Contribution en nature</option>
              </select>
            </label>}

            {enNature ? <>
              <label className={label}>
                <span>Quantité <span className="text-red-500 dark:text-[#93C5FD]">*</span></span>
                <input className={champ} required type="number" min="0" step="any"
                  value={formulaire.quantite ?? ""}
                  onChange={event => modifier("quantite", event.target.value)} />
              </label>
              <label className={label}>
                <span>Unité <span className="text-red-500 dark:text-[#93C5FD]">*</span></span>
                <input className={champ} required maxLength={40} placeholder="kg, kapoaka, sac…"
                  value={formulaire.unite ?? ""}
                  onChange={event => modifier("unite", event.target.value)} />
              </label>
            </> : <label className={label}>
              <span>Montant (Ar) <span className="text-red-500 dark:text-[#93C5FD]">*</span></span>
              <input className={champ} required type="number" min="0" step="1"
                value={formulaire.montant ?? ""}
                onChange={event => modifier("montant", event.target.value)} />
            </label>}

            {formulaire.categorie !== "ecolage" && <>
              <label className={label}>
                <span>Début de la période (facultatif)</span>
                <input type="date" className={champ} value={formulaire.debutPaiement ?? ""}
                  onChange={event => modifier("debutPaiement", event.target.value)} />
              </label>
              <label className={label}>
                <span>Date limite de paiement <span className="text-red-500 dark:text-[#93C5FD]">*</span></span>
                <input type="date" className={champ} required min={formulaire.debutPaiement || undefined}
                  value={formulaire.finPaiement ?? ""}
                  onChange={event => modifier("finPaiement", event.target.value)} />
              </label>
            </>}

            <label className={label}>
              <span>Application</span>
              <select className={champ} value={formulaire.portee}
                onChange={event => definirFormulaire(tarif => ({
                  ...tarif, portee: event.target.value, cible: ""
                }))}>
                {Object.entries(portees).map(([id, libelle]) =>
                  <option key={id} value={id}>{libelle}</option>
                )}
              </select>
            </label>

            {parNiveau && <label className={label}>
              <span>Niveau de classe <span className="text-red-500 dark:text-[#93C5FD]">*</span></span>
              <select className={champ} required value={formulaire.cible}
                disabled={!niveaux && !ancienNiveau}
                onChange={event => modifier("cible", event.target.value)}>
                <option value="">Sélectionner un niveau</option>
                {ancienNiveau && <option value={ancienNiveau}>{ancienNiveau} (niveau enregistré)</option>}
                {niveaux?.map(niveau => <option key={niveau} value={niveau}>{niveau}</option>)}
              </select>
              {erreurNiveaux ? <span role="alert" className="text-xs text-red-600 dark:text-[#C4D7FF]">{erreurNiveaux}</span>
                : !niveaux ? <span role="status" className="text-xs text-slate-500 dark:text-[#A8B7CF]">Chargement des niveaux…</span>
                : !niveaux.length && <span className="text-xs text-amber-600">Ajoutez une classe avec un niveau dans Classes.</span>}
            </label>}

            {formulaire.portee === "personnalisee" && <label className={label}>
              <span>Nom du groupe <span className="text-red-500 dark:text-[#93C5FD]">*</span></span>
              <input className={champ} required maxLength={120} value={formulaire.cible}
                onChange={event => modifier("cible", event.target.value)} />
            </label>}

            {erreur && <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-[#1B2E4A] dark:text-[#C4D7FF] sm:col-span-2">
              <AlertCircle size={17} className="mt-0.5 shrink-0" /> {erreur}
            </div>}
          </fieldset>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-[#263852] sm:px-6">
            <button type="button" onClick={fermer} disabled={enCours}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#33445E] dark:text-slate-300">
              Annuler
            </button>
            <button type="submit" disabled={enCours || niveauIndisponible}
              className="inline-flex items-center gap-2 rounded-lg bg-[#540916] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#74172A] dark:bg-[#29446D] dark:hover:bg-[#365781] disabled:opacity-50">
              <Save size={16} /> {enCours ? "Enregistrement…" : formulaire.id ? "Enregistrer les modifications" : "Ajouter le tarif"}
            </button>
          </div>
        </form>
      </div>
    </div>}
  </section>;
}