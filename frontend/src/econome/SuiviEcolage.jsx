import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X, Save, Search, CalendarDays, Settings2, Wallet } from "lucide-react";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { messageErreur, requetePrivee } from "../services/authentification";

const statuts = {
  paye: "Payé",
  partiel: "Partiellement payé",
  impaye: "Non payé",
  sansTarif: "Tarif à vérifier",
  retard: "En retard"
};

const moments = { avance: "En avance", retard: "En retard", delai: "Dans le délai" };
const champ = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10 dark:border-slate-600 dark:bg-slate-800 dark:text-white";
const nombre = new Intl.NumberFormat("fr-FR");
const dateCourte = date => date?.split("-").reverse().join("/") || "—";
const formatMontant = montant => montant == null ? "—" : `${nombre.format(montant)} Ar`;

function statutEleve({ du, paye }) {
  if (du == null) return "sansTarif";
  if (paye >= du) return "paye";
  return paye > 0 ? "partiel" : "impaye";
}

function moisActuel() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function badgeStatut(statut) {
  const styles = {
    paye: "bg-emerald-50 text-emerald-700",
    partiel: "bg-amber-50 text-amber-700",
    impaye: "bg-slate-100 text-slate-600",
    sansTarif: "bg-blue-50 text-blue-700",
    retard: "bg-red-50 text-red-700"
  };
  return styles[statut] || styles.impaye;
}

export default function SuiviEcolage() {
  const { utilisateur } = utiliserAuthentification();
  const [mois, definirMois] = useState(moisActuel);

  return <section className="min-w-0 space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Écolage</h1>
        <p className="mt-1 text-sm text-slate-500">Suivi mensuel des paiements de scolarité.</p>
      </div>
      {utilisateur?.role === "admin" && <Link to="/admin/configuration"
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
        <Settings2 size={16} /> Configurer les tarifs
      </Link>}
    </header>

    <SuiviMensuel key={mois} mois={mois} definirMois={definirMois} />
  </section>;
}

function SuiviMensuel({ mois, definirMois }) {
  const [suivi, definirSuivi] = useState(null);
  const [niveau, definirNiveau] = useState("");
  const [statut, definirStatut] = useState("");
  const [recherche, definirRecherche] = useState("");
  const [chargement, definirChargement] = useState(true);
  const [revision, definirRevision] = useState(0);
  const [erreur, definirErreur] = useState("");
  const [confirmation, definirConfirmation] = useState("");
  const [formulaire, definirFormulaire] = useState(null);
  const [enCours, definirEnCours] = useState(false);
  const [autreSuivi, definirAutreSuivi] = useState(null);

  const eleves = suivi?.lignes ?? [];
  const enRetard = eleve => Boolean(suivi?.echeanceDepassee && eleve.du != null && eleve.paye < eleve.du);

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

  useEffect(() => {
    if (!formulaire) return;
    const ancien = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const clavier = event => { if (event.key === "Escape" && !enCours) definirFormulaire(null); };
    document.addEventListener("keydown", clavier);
    return () => {
      document.body.style.overflow = ancien;
      document.removeEventListener("keydown", clavier);
    };
  }, [Boolean(formulaire), enCours]);

  const niveaux = [...new Set(eleves.map(eleve => eleve.niveau).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));

  const lignes = eleves.filter(eleve => {
    const correspond = `${eleve.nom} ${eleve.prenom} ${eleve.classe || ""} ${eleve.matricule || ""}`.toLowerCase();
    return (!niveau || eleve.niveau === niveau) &&
      (!statut || (statut === "retard" ? enRetard(eleve) : statutEleve(eleve) === statut)) &&
      correspond.includes(recherche.toLowerCase().trim());
  });

  const moisVersement = formulaire?.mois;

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
    month: "long", year: "numeric", timeZone: "UTC"
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
        method: "POST",
        data: { ...formulaire, montant: Number(formulaire.montant) }
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

  return <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
    {/* FILTRES */}
    <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4 dark:border-slate-700">
      <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Mois</span>
        <input type="month" className={champ} value={mois}
          onChange={event => { if (event.target.value) definirMois(event.target.value); }} />
      </label>

      <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <span>Niveau</span>
        <select className={champ} value={niveau} onChange={event => definirNiveau(event.target.value)}>
          <option value="">Tous les niveaux</option>
          {niveaux.map(valeur => <option key={valeur} value={valeur}>{valeur}</option>)}
        </select>
      </label>

      <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <span>Statut</span>
        <select className={champ} value={statut} onChange={event => definirStatut(event.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(statuts).map(([id, libelle]) =>
            <option key={id} value={id}>{libelle}</option>
          )}
        </select>
      </label>

      <label className="relative min-w-[180px] flex-1 space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <span>Recherche</span>
        <span className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" className={`${champ} pl-9`} value={recherche}
            placeholder="Nom, classe, matricule..."
            onChange={event => definirRecherche(event.target.value)} />
        </span>
      </label>

      <button type="button" disabled={chargement || enCours || !eleves.length}
        onClick={() => ajouter()}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#540916] px-4 text-sm font-semibold text-white hover:bg-[#74172A] disabled:opacity-50">
        <Plus size={17} /> Ajouter un versement
      </button>
    </div>

    {suivi && <div className="border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-700">
      Échéance du mois : <span className="font-semibold text-slate-700 dark:text-slate-200">{dateCourte(suivi.echeance)}</span>
      <span className="ml-3">{lignes.length} élève(s)</span>
    </div>}

    {erreur && !formulaire && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}
    {confirmation && <p role="status" className="m-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{confirmation}</p>}

    {/* TABLEAU */}
    {chargement ? <p role="status" className="p-6 text-sm text-slate-500">Chargement des élèves…</p>
      : <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {["Élève", "Classe", "Niveau", "Montant dû", "Versé", "Reste", "Statut", "Dernier versement", "Action"]
                .map(titre => <th key={titre} scope="col" className="px-4 py-3">{titre}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {lignes.map(eleve => {
              const statutActuel = statutEleve(eleve);
              const retard = enRetard(eleve);
              return <tr key={eleve.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {eleve.nom} {eleve.prenom}
                  {eleve.matricule && <span className="mt-0.5 block text-xs font-normal text-slate-400">{eleve.matricule}</span>}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{eleve.classe || "—"}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{eleve.niveau || "—"}</td>
                <td className="px-4 py-3 font-medium">{formatMontant(eleve.du)}</td>
                <td className="px-4 py-3 font-medium">{formatMontant(eleve.paye)}</td>
                <td className="px-4 py-3 font-semibold">{formatMontant(eleve.du == null ? null : eleve.du - eleve.paye)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${badgeStatut(statutActuel)}`}>
                    {eleve.ambigu ? "Plusieurs tarifs applicables" : statuts[statutActuel]}
                  </span>
                  {retard && <span className="mt-1 block text-xs font-semibold text-red-600">En retard</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {eleve.dernierVersement
                    ? `${dateCourte(eleve.dernierVersement.date)} · ${moments[eleve.dernierVersement.moment]}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  {eleve.du != null && eleve.paye < eleve.du && <button type="button"
                    disabled={enCours} onClick={() => ajouter(eleve.id)}
                    title="Ajouter un versement" aria-label={`Ajouter un versement pour ${eleve.nom} ${eleve.prenom}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#540916] hover:bg-[#540916]/10 disabled:opacity-40">
                    <Plus size={17} />
                  </button>}
                </td>
              </tr>;
            })}
            {!lignes.length && <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
              {erreur ? "Liste indisponible." : "Aucun élève ne correspond aux filtres."}
            </td></tr>}
          </tbody>
        </table>
      </div>}

    {/* MODAL VERSEMENT */}
    {formulaire && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
      onMouseDown={event => { if (event.target === event.currentTarget && !enCours) definirFormulaire(null); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-versement"
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <div>
            <h2 id="titre-modal-versement" className="text-lg font-bold text-slate-900 dark:text-white">Ajouter un versement</h2>
            <p className="mt-1 text-xs text-slate-500">Enregistrer un paiement d'écolage.</p>
          </div>
          <button type="button" disabled={enCours} onClick={() => definirFormulaire(null)} aria-label="Fermer"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={19} />
          </button>
        </header>

        <form onSubmit={enregistrer}>
          <fieldset disabled={enCours || chargement} className="grid gap-4 p-5 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <span>Mois concerné</span>
              <input type="month" required className={champ} value={moisVersement}
                onChange={event => definirFormulaire(donnees => ({
                  ...donnees, mois: event.target.value, montant: "", operationId: crypto.randomUUID()
                }))} />
            </label>

            <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <span>Élève</span>
              <select className={champ} required disabled={!suiviVersement?.lignes}
                value={formulaire.eleveId}
                onChange={event => definirFormulaire(valeur => ({ ...valeur, eleveId: event.target.value }))}>
                <option value="">Sélectionner un élève</option>
                {formulaire.eleveId && !selection && <option value={formulaire.eleveId} hidden>Élève sélectionné</option>}
                {candidats.map(eleve => <option key={eleve.id} value={eleve.id}>
                  {eleve.nom} {eleve.prenom} · {eleve.classe}{eleve.matricule && ` · ${eleve.matricule}`}
                </option>)}
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <span>Montant (Ar)</span>
              <input className={champ} type="number" required min="1" step="1"
                max={peutPayer ? reste : undefined} disabled={!peutPayer}
                value={formulaire.montant}
                onChange={event => definirFormulaire(valeur => ({ ...valeur, montant: event.target.value }))} />
            </label>

            <div className="flex items-end">
              <div className="w-full rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Reste à payer</p>
                <p className="mt-1 text-lg font-bold text-[#540916] dark:text-white">{formatMontant(reste)}</p>
              </div>
            </div>

            {suiviVersement?.erreur && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{suiviVersement.erreur}</p>}
            {moisVersement && !suiviVersement && <p role="status" className="text-sm text-slate-500 sm:col-span-2">Chargement du solde…</p>}
            {selection && !peutPayer && <p className="text-sm text-amber-700 sm:col-span-2">
              {reste == null ? "Tarif à vérifier" : "Écolage déjà payé pour ce mois."}
            </p>}
            {erreur && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{erreur}</p>}
          </fieldset>

          <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-700">
            <button type="button" disabled={enCours} onClick={() => definirFormulaire(null)}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={enCours || chargement || !peutPayer}
              className="inline-flex items-center gap-2 rounded-lg bg-[#540916] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#74172A] disabled:opacity-50">
              <Save size={16} /> {enCours ? "Enregistrement…" : "Enregistrer le versement"}
            </button>
          </footer>
        </form>
      </div>
    </div>}
  </section>;
}