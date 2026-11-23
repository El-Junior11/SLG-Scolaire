import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { messageErreur, requetePrivee } from "../services/authentification";

const statuts = {
  paye: "Payé",
  partiel: "Partiellement payé",
  impaye: "Non payé",
  sansTarif: "Tarif à vérifier",
  retard: "En retard",
};
const champ = "rounded-lg border border-[#E4E7EC] bg-transparent px-3 py-2 text-sm dark:border-[#33445E]";
const bouton = "rounded-lg bg-[#540916] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const moments = { avance: "En avance", retard: "En retard", delai: "Dans le délai" };
const dateCourte = date => date.split("-").reverse().join("/");
const nombre = new Intl.NumberFormat("fr-FR");

function statutEleve({ du, paye }) {
  if (du == null) return "sansTarif";
  if (paye >= du) return "paye";
  return paye > 0 ? "partiel" : "impaye";
}

function moisActuel() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMontant(montant) {
  return montant == null ? "—" : `${nombre.format(montant)} Ar`;
}

export default function SuiviEcolage() {
  const { utilisateur } = utiliserAuthentification();
  const [mois, definirMois] = useState(moisActuel);

  return <section className="space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold tracking-tight">Écolage</h1>
      {utilisateur?.role === "admin" && <Link to="/admin/configuration" className={champ}>Configurer les tarifs</Link>}
    </header>
    <label className="flex items-center gap-2 text-sm">Mois
      <input type="month" className={champ} value={mois} onChange={event => {
        if (event.target.value) definirMois(event.target.value);
      }} />
    </label>
    <SuiviMensuel key={mois} mois={mois} />
  </section>;
}

function SuiviMensuel({ mois }) {
  const [suivi, definirSuivi] = useState(null);
  const eleves = suivi?.lignes ?? [];
  const enRetard = eleve => Boolean(suivi?.echeanceDepassee && eleve.du != null && eleve.paye < eleve.du);
  const [niveau, definirNiveau] = useState("");
  const [statut, definirStatut] = useState("");
  const [chargement, definirChargement] = useState(true);
  const [revision, definirRevision] = useState(0);
  const [erreur, definirErreur] = useState("");
  const [confirmation, definirConfirmation] = useState("");
  const [formulaire, definirFormulaire] = useState(null);
  const [enCours, definirEnCours] = useState(false);

  useEffect(() => {
    const controleur = new AbortController();
    definirChargement(true);
    definirErreur("");
    requetePrivee("/ecolage", { params: { mois }, signal: controleur.signal })
      .then(resultat => {
        if (!Array.isArray(resultat?.lignes)) throw new Error("Réponse incorrecte de l’API de suivi.");
        if (!controleur.signal.aborted) definirSuivi(resultat);
      })
      .catch(cause => {
        if (!controleur.signal.aborted) {
          definirSuivi(null);
          definirErreur(messageErreur(cause));
        }
      })
      .finally(() => { if (!controleur.signal.aborted) definirChargement(false); });
    return () => controleur.abort();
  }, [mois, revision]);

  const niveaux = [...new Set(eleves.map(eleve => eleve.niveau).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
  const lignes = eleves.filter(eleve =>
    (!niveau || eleve.niveau === niveau) && (!statut || (statut === "retard" ? enRetard(eleve) : statutEleve(eleve) === statut)));
  const moisVersement = formulaire?.mois;
  const [autreSuivi, definirAutreSuivi] = useState(null);

  useEffect(() => {
    if (!moisVersement || moisVersement === mois) return;
    const controleur = new AbortController();
    definirAutreSuivi(null);
    requetePrivee("/ecolage", { params: { mois: moisVersement }, signal: controleur.signal })
      .then(resultat => {
        if (!Array.isArray(resultat?.lignes)) throw new Error("Réponse incorrecte de l’API de suivi.");
        if (!controleur.signal.aborted) definirAutreSuivi({ mois: moisVersement, lignes: resultat.lignes });
      })
      .catch(cause => {
        if (!controleur.signal.aborted) definirAutreSuivi({ mois: moisVersement, erreur: messageErreur(cause) });
      });
    return () => controleur.abort();
  }, [mois, moisVersement]);

  const suiviVersement = moisVersement === mois ? suivi
    : autreSuivi?.mois === moisVersement ? autreSuivi : null;
  const candidats = suiviVersement?.lignes ?? [];
  const selection = candidats.find(eleve => eleve.id === formulaire?.eleveId);
  const reste = selection?.du == null ? null : selection.du - selection.paye;
  const peutPayer = reste != null && reste > 0;
  const moisLisible = moisVersement && new Intl.DateTimeFormat("fr-FR", {
    month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${moisVersement}-01T00:00:00Z`));

  function ajouter(eleveId = "") {
    definirConfirmation("");
    definirErreur("");
    definirFormulaire({ eleveId, mois, montant: "", operationId: crypto.randomUUID() });
  }

  async function enregistrer(evenement) {
    evenement.preventDefault();
    if (!peutPayer || enCours) return;
    definirEnCours(true);
    definirErreur("");
    try {
      await requetePrivee("/ecolage/versements", {
        method: "POST", data: { ...formulaire, montant: Number(formulaire.montant) },
      });
      definirFormulaire(null);
      definirConfirmation(`Versement enregistré pour ${moisLisible}.`);
      definirChargement(true);
      definirRevision(valeur => valeur + 1);
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <section className="space-y-4 rounded-2xl border border-[#EAE3E5] bg-white p-4 dark:border-[#263852] dark:bg-[#14243D]">
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">Niveau
        <select className={champ} value={niveau} onChange={event => definirNiveau(event.target.value)}>
          <option value="">Tous les niveaux</option>
          {niveaux.map(valeur => <option key={valeur}>{valeur}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">Statut
        <select className={champ} value={statut} onChange={event => definirStatut(event.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(statuts).map(([id, libelle]) => <option key={id} value={id}>{libelle}</option>)}
        </select>
      </label>
      <button type="button" className={`${bouton} ml-auto`} disabled={chargement || enCours || !eleves.length}
        onClick={() => ajouter()}>Ajouter un versement</button>
    </div>
    {suivi && <p className="text-sm text-[#667085] dark:text-[#A8B7CF]">Échéance du mois : {dateCourte(suivi.echeance)}</p>}
    {erreur && <p role="alert" className="text-sm text-red-600">{erreur}</p>}
    {confirmation && <p role="status" className="text-sm">{confirmation}</p>}
    {formulaire && <form onSubmit={enregistrer}>
      <fieldset disabled={enCours || chargement} className="flex flex-wrap items-end gap-3 rounded-xl border p-4">
        <legend className="px-2 font-semibold">Ajouter un versement</legend>
        <label className="flex flex-col gap-1 text-sm">Mois concerné
          <input type="month" className={champ} required value={moisVersement}
            onChange={event => {
              const valeur = event.target.value;
              definirFormulaire(donnees => ({ ...donnees, mois: valeur, montant: "", operationId: crypto.randomUUID() }));
            }} />
        </label>
        <label className="flex flex-col gap-1 text-sm">Élève
          <select className={champ} required disabled={!suiviVersement?.lignes} value={formulaire.eleveId}
            onChange={event => definirFormulaire(valeur => ({ ...valeur, eleveId: event.target.value }))}>
            <option value="">Sélectionner un élève</option>
            {formulaire.eleveId && !selection && <option value={formulaire.eleveId} hidden>Élève sélectionné</option>}
            {candidats.map(eleve => <option key={eleve.id} value={eleve.id}>
              {eleve.nom} {eleve.prenom} · {eleve.classe}{eleve.matricule && ` · ${eleve.matricule}`}
            </option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">Montant (Ar)
          <input className={champ} type="number" required min="1" step="1"
            max={peutPayer ? reste : undefined} disabled={!peutPayer} value={formulaire.montant}
            onChange={event => definirFormulaire(valeur => ({ ...valeur, montant: event.target.value }))} />
        </label>
        {suiviVersement?.erreur && <p role="alert" className="text-sm text-red-600">{suiviVersement.erreur}</p>}
        {moisVersement && !suiviVersement && <p role="status" className="text-sm">Chargement du solde…</p>}
        {selection && <p className="py-2 text-sm">{reste == null ? "Tarif à vérifier"
          : reste <= 0 ? "Écolage déjà payé pour ce mois"
          : `Reste pour ${moisLisible} : ${formatMontant(reste)}`}</p>}
        <button className={bouton} disabled={!peutPayer}>{enCours ? "Enregistrement…" : "Enregistrer"}</button>
        <button type="button" className={champ} onClick={() => definirFormulaire(null)}>Annuler</button>
      </fieldset>
    </form>}
    {chargement ? <p role="status">Chargement des élèves…</p> : <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F8F9FC] dark:bg-[#0B172B]"><tr>
          {["Élève", "Classe", "Niveau", "Montant dû", "Versé", "Reste", "Statut", "Dernier versement", "Action"]
            .map(titre => <th key={titre} scope="col" className="px-3 py-3">{titre}</th>)}
        </tr></thead>
        <tbody>
          {lignes.map(eleve => <tr key={eleve.id} className="border-t border-[#EAE3E5] dark:border-[#263852]">
            <td className="p-3 font-semibold">{eleve.nom} {eleve.prenom}</td>
            <td className="p-3">{eleve.classe || "—"}</td>
            <td className="p-3">{eleve.niveau || "—"}</td>
            <td className="p-3">{formatMontant(eleve.du)}</td>
            <td className="p-3">{formatMontant(eleve.paye)}</td>
            <td className="p-3">{formatMontant(eleve.du == null ? null : eleve.du - eleve.paye)}</td>
            <td className="p-3">{eleve.ambigu ? "Plusieurs tarifs applicables" : statuts[statutEleve(eleve)]}
              {enRetard(eleve) && <span className="mt-1 block font-semibold text-red-600">En retard</span>}
            </td>
            <td className="p-3">{eleve.dernierVersement
              ? `${dateCourte(eleve.dernierVersement.date)} · ${moments[eleve.dernierVersement.moment]}`
              : "—"}</td>
            <td className="p-3">{eleve.du != null && eleve.paye < eleve.du &&
              <button type="button" className={champ} disabled={enCours} onClick={() => ajouter(eleve.id)}>Ajouter</button>}
            </td>
          </tr>)}
          {!lignes.length && <tr><td colSpan={9} className="p-4">
            {erreur ? "Liste indisponible." : "Aucun élève ne correspond aux filtres."}
          </td></tr>}
        </tbody>
      </table>
    </div>}
  </section>;
}
