import { useEffect, useState } from "react";
import Recus from "./Recus";
import { Link } from "react-router-dom";
import { Plus, X, Save, Search, CalendarDays, Settings2, Wallet, Loader2, AlertCircle, CheckCircle2, Eye, Receipt } from "lucide-react";
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
const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const bordure = "border-[#EAE3E5] dark:border-[#263852]";
const accent = "text-[#540916] dark:text-[#93C5FD]";
const champ = "h-10 w-full min-w-0 rounded-lg border border-[#E4E7EC] bg-white px-3 text-sm text-[#171717] outline-none transition-colors focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white dark:focus:border-[#60A5FA] dark:[color-scheme:dark]";
const bouton = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const principal = "bg-[#540916] text-white hover:bg-[#74172A] dark:bg-[#29446D] dark:hover:bg-[#365582]";
const contour = "border border-[#E4E7EC] bg-white text-[#344054] hover:bg-slate-50 dark:border-[#33445E] dark:bg-[#14243D] dark:text-[#C4D7FF] dark:hover:bg-[#263852]";
const cellule = "whitespace-nowrap border-b border-[#EAE3E5] px-4 py-1.5 dark:border-[#263852]";
const label = "block min-w-0 space-y-1.5 text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]";
const styleErreur = "rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700 dark:border-[#405574] dark:bg-[#1B2E4A] dark:text-[#C4D7FF]";

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
    paye: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    partiel: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    impaye: "bg-slate-100 text-slate-600 dark:bg-[#263852] dark:text-[#A8B7CF]",
    sansTarif: "bg-blue-50 text-blue-700 dark:bg-[#29446D] dark:text-[#93C5FD]",
    retard: "bg-red-50 text-red-700 dark:bg-[#263852] dark:text-[#C4D7FF]"
  };
  return styles[statut] || styles.impaye;
}

export default function SuiviEcolage() {
  const { utilisateur } = utiliserAuthentification();
  const [mois, definirMois] = useState(moisActuel);

  return <section className="flex w-full min-w-0 flex-col gap-4 shrink-0">

    {/* EN-TÊTE FIXE */}
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${texte}`}
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Écolage
        </h1>
        <p className={`mt-1 text-sm ${secondaire}`}>
          Suivi mensuel des paiements de scolarité.
        </p>
      </div>

      {utilisateur?.role === "admin" && <Link to="/admin/configuration"
        className={`${bouton} ${contour} w-full sm:w-auto`}>
        <Settings2 size={16}/> Configurer les tarifs
      </Link>}
    </header>

    <SuiviMensuel key={mois} mois={mois} definirMois={definirMois}/>
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
  const [details, definirDetails] = useState(null);
  const [afficherRecus, definirAfficherRecus] = useState(false);
  useEffect(() => {
    if (!details) return;
    const fermer = e => { if (e.key === "Escape") definirDetails(null); };
    document.addEventListener("keydown", fermer);
    return () => document.removeEventListener("keydown", fermer);
  }, [details]);

  const eleves = suivi?.lignes ?? [];
  const enRetard = eleve => Boolean(suivi?.echeanceDepassee && eleve.du != null && eleve.paye < eleve.du);

  // CHARGEMENT DES DONNÉES
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
      .finally(() => {
        if (!controleur.signal.aborted) definirChargement(false);
      });

    return () => controleur.abort();
  }, [mois, revision]);

  // GESTION DU MODAL
  useEffect(() => {
    if (!formulaire) return;
    const ancien = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const clavier = event => {
      if (event.key === "Escape" && !enCours) definirFormulaire(null);
    };

    document.addEventListener("keydown", clavier);
    return () => {
      document.body.style.overflow = ancien;
      document.removeEventListener("keydown", clavier);
    };
  }, [Boolean(formulaire), enCours]);

  // FILTRES
  const niveaux = [...new Set(eleves.map(eleve => eleve.niveau).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "fr", { numeric: true }));

  const lignes = eleves.filter(eleve => {
    const correspond = `${eleve.nom} ${eleve.prenom} ${eleve.classe || ""} ${eleve.matricule || ""}`.toLowerCase();
    return (!niveau || String(eleve.niveau) === niveau) &&
      (!statut || (statut === "retard" ? enRetard(eleve) : statutEleve(eleve) === statut)) &&
      correspond.includes(recherche.toLowerCase().trim());
  });

  const moisVersement = formulaire?.mois;

  // CHARGEMENT DU SOLDE D'UN AUTRE MOIS
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
        if (!controleur.signal.aborted) definirAutreSuivi({
          mois: moisVersement, erreur: messageErreur(cause)
        });
      });

    return () => controleur.abort();
  }, [mois, moisVersement]);

  const suiviVersement = moisVersement === mois ? suivi
    : autreSuivi?.mois === moisVersement ? autreSuivi : null;

  const candidats = suiviVersement?.lignes ?? [];
  const selection = candidats.find(eleve => String(eleve.id) === String(formulaire?.eleveId));
  const reste = selection?.du == null ? null : selection.du - selection.paye;
  const peutPayer = reste != null && reste > 0 && !selection?.ambigu;

  const moisLisible = moisVersement && new Intl.DateTimeFormat("fr-FR", {
    month: "long", year: "numeric", timeZone: "UTC"
  }).format(new Date(`${moisVersement}-01T00:00:00Z`));

  function ajouter(eleveId = "") {
    definirConfirmation("");
    definirErreur("");
    definirFormulaire({ eleveId, mois, montant: "", operationId: crypto.randomUUID() });
  }

  function reinitialiserFiltres() {
    definirNiveau("");
    definirStatut("");
    definirRecherche("");
  }

  // ENREGISTREMENT DU VERSEMENT
  async function enregistrer(evenement) {
    evenement.preventDefault();
    if (!peutPayer || enCours) return;

    const montant = Number(formulaire.montant);

    if (!Number.isInteger(montant) || montant <= 0 || montant > reste) {
      definirErreur("Veuillez saisir un montant valide, inférieur ou égal au reste à payer.");
      return;
    }

    definirEnCours(true);
    definirErreur("");

    try {
      await requetePrivee("/ecolage/versements", {
        method: "POST",
        data: { ...formulaire, montant }
      });

      definirFormulaire(null);
      definirConfirmation(`Versement enregistré pour ${moisLisible}.`);
      definirAfficherRecus(true);
      definirChargement(true);
      definirRevision(valeur => valeur + 1);
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <section className={`${carte} flex w-full min-w-0 shrink-0 flex-col overflow-hidden`}>

    {/* FILTRES FIXES */}
    <div className={`shrink-0 border-b p-3 sm:p-4 ${bordure}`}>
      <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 2xl:grid-cols-[150px_150px_170px_minmax(150px,1fr)_auto]">

        <label className={label}>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14}/> Mois
          </span>
          <input type="month" className={champ} value={mois}
            onChange={event => {
              if (event.target.value) definirMois(event.target.value);
            }}/>
        </label>

        <label className={label}>
          <span>Niveau</span>
          <select className={champ} value={niveau}
            onChange={event => definirNiveau(event.target.value)}>
            <option value="">Tous les niveaux</option>
            {niveaux.map(valeur => <option key={valeur} value={valeur}>{valeur}</option>)}
          </select>
        </label>

        <label className={label}>
          <span>Statut</span>
          <select className={champ} value={statut}
            onChange={event => definirStatut(event.target.value)}>
            <option value="">Tous les statuts</option>
            {Object.entries(statuts).map(([id, libelle]) =>
              <option key={id} value={id}>{libelle}</option>
            )}
          </select>
        </label>

        <label className={label}>
          <span>Recherche</span>
          <span className="relative block">
            <Search size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
            <input type="search" className={`${champ} pl-9`}
              value={recherche} placeholder="Nom, classe, matricule..."
              onChange={event => definirRecherche(event.target.value)}/>
          </span>
        </label>

        <button type="button" disabled={chargement || enCours || !eleves.some(e => e.du != null && e.paye < e.du && !e.ambigu)}
          onClick={() => ajouter()}
          className={`${bouton} ${principal} h-10 whitespace-nowrap sm:col-span-2 2xl:col-span-1`}>
          <Plus size={17}/> Ajouter un versement
        </button>
      </div>
    </div>

    <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 ${bordure}`}>
      <span className={`text-xs ${secondaire}`}>Paiements et justificatifs</span>
      <button type="button" aria-expanded={afficherRecus} onClick={() => definirAfficherRecus(v => !v)} className={`${bouton} ${contour}`}><Receipt size={16}/> {afficherRecus ? "Masquer les reçus" : "Consulter les reçus"}</button>
    </div>
    {/* INFORMATIONS DU MOIS */}
    {suivi && <div className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-3 text-xs ${bordure} ${secondaire}`}>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-2">
          <CalendarDays size={15} className={accent}/>
          Échéance du mois :
          <strong className={texte}>{dateCourte(suivi.echeance)}</strong>
        </span>

        <span>{lignes.length} élève(s)</span>
      </div>

      {(niveau || statut || recherche) && <button type="button"
        onClick={reinitialiserFiltres}
        className={`inline-flex items-center gap-1 font-semibold hover:underline ${accent}`}>
        <X size={14}/> Effacer les filtres
      </button>}
    </div>}

    {/* MESSAGES */}
    {erreur && !formulaire && <div role="alert"
      className={`${styleErreur} m-3 flex shrink-0 items-start gap-2`}>
      <AlertCircle size={17} className="mt-0.5 shrink-0"/>
      <span>{erreur}</span>
    </div>}

    {confirmation && <div role="status"
      className="m-3 flex shrink-0 items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
      <CheckCircle2 size={18} className="shrink-0"/>
      <span className="flex-1">{confirmation}</span>
      <button type="button" onClick={() => definirConfirmation("")}
        aria-label="Fermer la confirmation">
        <X size={16}/>
      </button>
    </div>}

    {/* TABLEAU : SCROLL VERTICAL ET HORIZONTAL */}
    <div className="w-full min-w-0 shrink-0 max-h-[272px] overflow-auto overscroll-contain">

      <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">

        {/* EN-TÊTE FIXE */}
        <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs font-semibold text-[#667085] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
          <tr className="h-12">
            {["Élève", "Classe", "Niveau", "Montant dû", "Versé", "Reste", "Statut", "Dernier versement"]
              .map(titre => <th key={titre} scope="col"
                className={`whitespace-nowrap border-b px-4 font-bold ${bordure}`}>
                {titre}
              </th>)}

            <th scope="col"
              className={`sticky right-0 z-20 w-[155px] whitespace-nowrap border-b bg-[#F8F9FC] px-4 text-right font-bold dark:bg-[#0B172B] ${bordure}`}>
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {!chargement && lignes.map(eleve => {
            const statutActuel = statutEleve(eleve);
            const retard = enRetard(eleve);

            return <tr key={eleve.id}
              className="group h-14 transition-colors hover:bg-[#FAF8F9] dark:hover:bg-[#1B2C46]">

              {/* ÉLÈVE */}
              <td className={`${cellule} font-semibold ${texte}`}>
                <div className="leading-5">
                  {eleve.nom} {eleve.prenom}
                </div>
                {eleve.matricule && <span className={`block text-xs font-normal leading-4 ${secondaire}`}>
                  {eleve.matricule}
                </span>}
              </td>

              {/* CLASSE */}
              <td className={`${cellule} ${secondaire}`}>
                {eleve.classe || "—"}
              </td>

              {/* NIVEAU */}
              <td className={`${cellule} ${secondaire}`}>
                {eleve.niveau || "—"}
              </td>

              {/* MONTANT DÛ */}
              <td className={`${cellule} font-semibold ${texte}`}>
                {formatMontant(eleve.du)}
              </td>

              {/* MONTANT VERSÉ */}
              <td className={`${cellule} font-semibold text-emerald-600 dark:text-emerald-300`}>
                {formatMontant(eleve.paye)}
              </td>

              {/* RESTE */}
              <td className={`${cellule} font-bold ${eleve.du != null && eleve.du > eleve.paye ? accent : texte}`}>
                {formatMontant(eleve.du == null ? null : eleve.du - eleve.paye)}
              </td>

              {/* STATUT */}
              <td className={cellule}>
                <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${badgeStatut(statutActuel)}`}>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"/>
                  {eleve.ambigu ? "Plusieurs tarifs applicables" : statuts[statutActuel]}
                </span>

                {retard && <span className="block text-[11px] font-semibold leading-4 text-red-600 dark:text-[#93C5FD]">
                  En retard
                </span>}
              </td>

              {/* DERNIER VERSEMENT */}
              <td className={`${cellule} text-xs ${secondaire}`}>
                {eleve.dernierVersement
                  ? `${dateCourte(eleve.dernierVersement.date)} · ${moments[eleve.dernierVersement.moment]}`
                  : "—"}
              </td>

              {/* ACTIONS STICKY À DROITE */}
              <td className={`sticky right-0 z-[1] w-[155px] whitespace-nowrap border-b bg-white px-4 py-1.5 text-right group-hover:bg-[#FAF8F9] dark:bg-[#14243D] dark:group-hover:bg-[#1B2C46] ${bordure}`}>
                <div className="flex items-center justify-end gap-2">

                  <button type="button" onClick={() => definirDetails(eleve)} title="Voir le détail" aria-label={`Voir le détail de ${eleve.nom} ${eleve.prenom}`} className={`${bouton} ${contour} h-8 !px-2 !py-0`}><Eye size={16}/> Voir</button>
                  {eleve.du != null && eleve.paye < eleve.du && !eleve.ambigu && <button type="button"
                    disabled={enCours} onClick={() => ajouter(eleve.id)}
                    title="Ajouter un versement"
                    aria-label={`Ajouter un versement pour ${eleve.nom} ${eleve.prenom}`}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold bg-[#540916]/10 text-[#540916] transition-colors hover:bg-[#540916] hover:text-white disabled:opacity-40 dark:bg-[#29446D] dark:text-[#93C5FD] dark:hover:bg-[#365582]">
                    <Plus size={16}/> Payer
                  </button>}
                </div>
              </td>
            </tr>;
          })}

          {/* CHARGEMENT */}
          {chargement && <tr>
            <td colSpan={9} className="h-[224px] px-4 text-center">
              <div role="status" className={`flex items-center justify-center gap-2 text-sm ${secondaire}`}>
                <Loader2 size={19} className="animate-spin"/>
                Chargement des élèves...
              </div>
            </td>
          </tr>}

          {/* AUCUNE DONNÉE */}
          {!chargement && !lignes.length && <tr>
            <td colSpan={9} className="h-[224px] px-4 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#98A2B3] dark:bg-[#263852] dark:text-[#A8B7CF]">
                  <Wallet size={24}/>
                </div>

                <p className={`text-sm font-semibold ${texte}`}>
                  {erreur ? "Liste indisponible." : "Aucun élève trouvé"}
                </p>

                <p className={`text-xs ${secondaire}`}>
                  {erreur
                    ? "Impossible de récupérer les données."
                    : "Aucun élève ne correspond aux filtres sélectionnés."}
                </p>

                {!erreur && (niveau || statut || recherche) && <button type="button"
                  onClick={reinitialiserFiltres}
                  className={`mt-1 text-xs font-semibold hover:underline ${accent}`}>
                  Réinitialiser les filtres
                </button>}
              </div>
            </td>
          </tr>}
        </tbody>
      </table>
    </div>

    {/* PIED DU TABLEAU FIXE */}
    <footer className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs ${bordure} ${secondaire}`}>
      <span>{lignes.length} élève(s) sur {eleves.length}</span>

      {lignes.length > 4 && <span>
        Faites défiler pour consulter les autres élèves
      </span>}
    </footer>

    {afficherRecus && <div className="min-w-0 border-t p-3 sm:p-4 dark:border-[#263852]"><p className={`mb-3 text-xs ${secondaire}`}>Reçus disponibles dans l’économat, toutes catégories confondues.</p><Recus key={revision}/></div>}
    {details && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101828]/65 p-3" onMouseDown={e => { if (e.target === e.currentTarget) definirDetails(null); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="titre-details-ecolage" className={`${carte} w-full max-w-lg max-h-[92dvh] overflow-auto p-5`}>
        <header className="flex items-center justify-between gap-3"><h2 id="titre-details-ecolage" className={`text-lg font-bold ${texte}`}>Détails de l’écolage</h2><button type="button" autoFocus aria-label="Fermer" onClick={() => definirDetails(null)} className={`${bouton} ${contour}`}><X size={18}/></button></header>
        <p className={`mt-4 font-semibold ${texte}`}>{details.nom} {details.prenom}</p><p className={`text-sm ${secondaire}`}>{details.classe || "—"} · {mois}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3">{[["Matricule", details.matricule || "—"], ["Statut", details.ambigu ? "Plusieurs tarifs applicables" : statuts[statutEleve(details)]], ["Montant dû", formatMontant(details.du)], ["Versé", formatMontant(details.paye)], ["Reste", formatMontant(details.du == null ? null : details.du - details.paye)], ["Dernier versement", dateCourte(details.dernierVersement?.date)]].map(([titre, valeur]) => <div key={titre} className={`rounded-lg border p-3 ${bordure}`}><dt className={`text-xs ${secondaire}`}>{titre}</dt><dd className={`mt-1 break-words text-sm font-semibold ${texte}`}>{valeur}</dd></div>)}</dl>
        <footer className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" className={`${bouton} ${contour}`} onClick={() => { definirDetails(null); definirAfficherRecus(true); }}><Receipt size={16}/> Liste des reçus</button>{details.du != null && details.paye < details.du && !details.ambigu && <button type="button" className={`${bouton} ${principal}`} onClick={() => { ajouter(details.id); definirDetails(null); }}><Plus size={16}/> Payer</button>}</footer>
      </div>
    </div>}
    {/* MODAL DE VERSEMENT */}
    {formulaire && <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101828]/65 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !enCours) definirFormulaire(null);
      }}>

      <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-versement"
        className={`${carte} flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden shadow-xl`}>

        {/* EN-TÊTE DU MODAL */}
        <header className={`flex shrink-0 items-center justify-between gap-3 border-b p-4 sm:p-5 ${bordure}`}>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]">
              <Wallet size={22}/>
            </div>

            <div className="min-w-0">
              <h2 id="titre-modal-versement" className={`text-lg font-bold ${texte}`}>
                Ajouter un versement
              </h2>
              <p className={`mt-1 text-xs ${secondaire}`}>
                Enregistrer un paiement d'écolage.
              </p>
            </div>
          </div>

          <button type="button" disabled={enCours}
            onClick={() => definirFormulaire(null)} aria-label="Fermer"
            className={`shrink-0 rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-[#263852] ${secondaire}`}>
            <X size={19}/>
          </button>
        </header>

        {/* FORMULAIRE */}
        <form onSubmit={enregistrer} className="flex min-h-0 flex-col">

          <fieldset disabled={enCours || chargement}
            className="grid min-h-0 min-w-0 gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">

            {/* MOIS CONCERNÉ */}
            <label className={label}>
              <span>Mois concerné <span className={accent}>*</span></span>
              <input type="month" required className={champ} value={moisVersement}
                onChange={event => definirFormulaire(donnees => ({
                  ...donnees,
                  mois: event.target.value,
                  montant: "",
                  operationId: crypto.randomUUID()
                }))}/>
            </label>

            {/* ÉLÈVE */}
            <label className={label}>
              <span>Élève <span className={accent}>*</span></span>
              <select className={champ} required disabled={!suiviVersement?.lignes}
                value={formulaire.eleveId}
                onChange={event => definirFormulaire(valeur => ({
                  ...valeur, eleveId: event.target.value, montant: "", operationId: crypto.randomUUID()
                }))}>

                <option value="">Sélectionner un élève</option>

                {formulaire.eleveId && !selection &&
                  <option value={formulaire.eleveId} hidden>Élève sélectionné</option>}

                {candidats.map(eleve => <option key={eleve.id} value={eleve.id}>
                  {eleve.nom} {eleve.prenom} · {eleve.classe}
                  {eleve.matricule && ` · ${eleve.matricule}`}
                </option>)}
              </select>
            </label>

            {/* MONTANT */}
            <label className={label}>
              <span>Montant (Ar) <span className={accent}>*</span></span>
              <input className={`${champ} disabled:cursor-not-allowed disabled:opacity-50`}
                type="number" required min="1" step="1"
                max={peutPayer ? reste : undefined}
                disabled={!peutPayer}
                placeholder="Saisir le montant"
                value={formulaire.montant}
                onChange={event => definirFormulaire(valeur => ({
                  ...valeur, montant: event.target.value
                }))}/>
            </label>

            {/* RESTE À PAYER */}
            <div className="flex min-w-0 items-end">
              <div className={`w-full rounded-xl border bg-[#F8F9FC] px-4 py-3 dark:bg-[#1B2E4A] ${bordure}`}>
                <p className={`text-xs font-medium ${secondaire}`}>
                  Reste à payer
                </p>
                <p className={`mt-1 text-lg font-bold ${accent}`}>
                  {formatMontant(reste)}
                </p>
              </div>
            </div>

            {/* ERREUR DE CHARGEMENT DU SOLDE */}
            {suiviVersement?.erreur && <p role="alert"
              className={`${styleErreur} sm:col-span-2`}>
              {suiviVersement.erreur}
            </p>}

            {/* CHARGEMENT DU SOLDE */}
            {moisVersement && !suiviVersement && <p role="status"
              className={`flex items-center gap-2 text-sm sm:col-span-2 ${secondaire}`}>
              <Loader2 size={16} className="animate-spin"/>
              Chargement du solde...
            </p>}

            {/* INFORMATION SUR LE SOLDE */}
            {selection && !peutPayer && <div
              className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 sm:col-span-2">
              <AlertCircle size={17} className="mt-0.5 shrink-0"/>
              <span>
                {reste == null || selection.ambigu ? "Tarif à vérifier" : "Écolage déjà payé pour ce mois."}
              </span>
            </div>}

            {/* ERREUR D'ENREGISTREMENT */}
            {erreur && <div role="alert"
              className={`${styleErreur} flex items-start gap-2 sm:col-span-2`}>
              <AlertCircle size={17} className="mt-0.5 shrink-0"/>
              <span>{erreur}</span>
            </div>}
          </fieldset>

          {/* ACTIONS DU MODAL */}
          <footer className={`flex shrink-0 flex-wrap justify-end gap-2 border-t p-4 sm:p-5 ${bordure}`}>

            <button type="button" disabled={enCours}
              onClick={() => definirFormulaire(null)}
              className={`${bouton} ${contour} flex-1 sm:flex-none`}>
              Annuler
            </button>

            <button type="submit"
              disabled={enCours || chargement || !peutPayer}
              className={`${bouton} ${principal} flex-1 sm:flex-none`}>
              {enCours ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
              {enCours ? "Enregistrement..." : "Enregistrer le versement"}
            </button>
          </footer>
        </form>
      </div>
    </div>}
  </section>;
}
