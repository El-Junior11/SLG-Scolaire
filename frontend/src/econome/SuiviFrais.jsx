import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X, Save, Search, Wallet, CalendarDays, Loader2, AlertCircle, CheckCircle2, ArrowUpRight, CreditCard, Receipt } from "lucide-react";
import { messageErreur, requetePrivee } from "../services/authentification";
import Recus from "./Recus";
import { categoriesTarifs } from "./TarifsScolaires";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const bordure = "border-[#EAE3E5] dark:border-[#263852]";
const accent = "text-[#540916] dark:text-[#93C5FD]";
const champ = "h-10 w-full min-w-0 rounded-lg border border-[#E4E7EC] bg-white px-3 text-sm text-[#171717] outline-none transition-colors focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white dark:focus:border-[#60A5FA]";
const bouton = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const principal = "bg-[#540916] text-white hover:bg-[#74172A] dark:bg-[#29446D] dark:hover:bg-[#365582]";
const contour = "border border-[#E4E7EC] bg-white text-[#344054] hover:bg-slate-50 dark:border-[#33445E] dark:bg-[#14243D] dark:text-[#C4D7FF] dark:hover:bg-[#263852]";
const cellule = "whitespace-nowrap border-b border-[#EAE3E5] px-4 py-1.5 dark:border-[#263852]";
const label = "block min-w-0 space-y-1.5 text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]";
const styleErreur = "rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700 dark:border-[#405574] dark:bg-[#1B2E4A] dark:text-[#C4D7FF]";

const nombre = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 15 });
const dateCourte = date => date ? date.split("-").reverse().join("/") : "—";

export default function SuiviFrais({ categorie, impayes }) {
  const [afficherRecus, definirAfficherRecus] = useState(false);
  const [revisionRecus, definirRevisionRecus] = useState(0);
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
      .catch(cause => {
        if (!controleur.signal.aborted) definirErreur(messageErreur(cause));
      });

    return () => controleur.abort();
  }, []);

  const options = tarifs?.filter(tarif => tarif.categorie !== "ecolage" &&
    (!categorie || tarif.categorie === categorie));

  const tarif = options?.find(entree => String(entree.id) === String(tarifId));

  return <section className={`${carte} flex w-full min-w-0 shrink-0 flex-col`}>

    {/* EN-TÊTE */}
    <header className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-b p-4 ${bordure}`}>
      <div className="min-w-0">
        <h2 className={`text-lg font-bold ${texte}`}
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {impayes ? "Élèves avec un solde dû" : "Suivi des versements"}
        </h2>
        <p className={`mt-1 text-xs ${secondaire}`}>
          {impayes
            ? "Consultation des frais scolaires non réglés."
            : "Consultation et enregistrement des versements."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!impayes && <button type="button" className={`${bouton} ${contour}`} aria-expanded={afficherRecus}
          onClick={() => definirAfficherRecus(v => !v)}>
          {afficherRecus ? <X size={16}/> : <Receipt size={16}/>}
          {afficherRecus ? "Fermer les reçus" : "Consulter les reçus"}
        </button>}
      {!categorie && <Link to="/econome/frais-scolaires/ecolage"
        className={`${bouton} ${contour} w-full sm:w-auto`}>
        <CalendarDays size={16}/>
        Suivi mensuel de l’écolage
        <ArrowUpRight size={15}/>
      </Link>}
      </div>
    </header>

    {!impayes && afficherRecus && <div className="min-w-0 shrink-0 p-3 sm:p-4">
      <p className={`mb-3 text-xs ${secondaire}`}>Reçus de tous les paiements autorisés de l’économat.</p>
      <Recus key={revisionRecus}/>
    </div>}

    {/* SÉLECTION DU TARIF */}
    <div className={`shrink-0 border-b p-3 sm:p-4 ${bordure}`}>

      {erreur && <div role="alert" className={`${styleErreur} flex items-start gap-2`}>
        <AlertCircle size={17} className="mt-0.5 shrink-0"/>
        <span>{erreur}</span>
      </div>}

      {!tarifs && !erreur && <div role="status"
        className={`flex items-center gap-2 py-3 text-sm ${secondaire}`}>
        <Loader2 size={18} className="animate-spin"/>
        Chargement des tarifs...
      </div>}

      {options?.length === 0 && <div className={`flex items-center gap-2 py-3 text-sm ${secondaire}`}>
        <AlertCircle size={18}/>
        Aucun frais configuré dans cette catégorie.
      </div>}

      {!!options?.length && <label className={label}>
        <span>Frais à consulter</span>
        <select className={`${champ} max-w-full`} value={tarifId}
          onChange={event => definirTarifId(event.target.value)}>

          <option value="">Choisir un frais</option>

          {options.map(entree => <option key={entree.id} value={entree.id}>
            {entree.libelle} · {categoriesTarifs[entree.categorie]} · {entree.cible || "Tous les élèves"}
            {" · "}{entree.typeContribution === "nature"
              ? `${entree.quantite} ${entree.unite}`
              : `${nombre.format(entree.montant)} Ar`}
            {entree.finPaiement && ` · ${dateCourte(entree.finPaiement)}`}
          </option>)}
        </select>
      </label>}
    </div>

    {/* CONTENU DU TARIF */}
    {tarif ? <ListeFrais key={tarif.id} tarif={tarif} impayes={impayes} apresVersement={() => { definirRevisionRecus(v => v + 1); if (!impayes) definirAfficherRecus(true); }}/> 
      : !!options?.length && <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-5 text-center">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#98A2B3] dark:bg-[#263852] dark:text-[#A8B7CF]">
          <Wallet size={24}/>
        </div>

        <div>
          <p className={`text-sm font-semibold ${texte}`}>
            Sélectionnez un frais scolaire
          </p>
          <p className={`mt-1 text-xs ${secondaire}`}>
            Choisissez un tarif pour consulter les élèves et leurs versements.
          </p>
        </div>
      </div>}
  </section>;
}

function ListeFrais({ tarif, impayes, apresVersement }) {
  const [resultat, definirResultat] = useState(null);
  const [niveau, definirNiveau] = useState("");
  const [recherche, definirRecherche] = useState("");
  const [erreur, definirErreur] = useState("");
  const [message, definirMessage] = useState("");
  const [revision, definirRevision] = useState(0);
  const [formulaire, definirFormulaire] = useState(null);
  const [enCours, definirEnCours] = useState(false);

  const nature = tarif.typeContribution === "nature";
  const format = valeur => valeur == null ? "—" : `${nombre.format(valeur)} ${nature ? tarif.unite :"Ar"}`;
  const base = `/frais-scolaires/${encodeURIComponent(tarif.id)}`;

  // CHARGEMENT DES DONNÉES
  useEffect(() => {
    const controleur = new AbortController();

    requetePrivee(`${base}/suivi`, { signal: controleur.signal })
      .then(suivi => {
        if (!Array.isArray(suivi?.lignes)) throw new Error("Réponse incorrecte de l’API de suivi.");
        if (!controleur.signal.aborted) definirResultat(suivi);
      })
      .catch(cause => {
        if (!controleur.signal.aborted) definirErreur(messageErreur(cause));
      });

    return () => controleur.abort();
  }, [base, revision]);

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

  // RECHERCHE ET FILTRES
  const eleves = resultat?.lignes ?? [];

  const niveaux = [...new Set(eleves.map(eleve => eleve.niveau).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));

  const lignes = eleves.filter(eleve => {
    const contenu = `${eleve.nom} ${eleve.prenom} ${eleve.classe || ""} ${eleve.matricule || ""}`.toLowerCase();

    return (!niveau || eleve.niveau === niveau) &&
      (!impayes || eleve.reste > 0) &&
      contenu.includes(recherche.trim().toLowerCase());
  });

  const selection = eleves.find(eleve => String(eleve.id) === String(formulaire?.eleveId));

  function reinitialiserFiltres() {
    definirNiveau("");
    definirRecherche("");
  }

  function ouvrirVersement(eleve) {
    definirErreur("");
    definirMessage("");

    definirFormulaire({
      eleveId: eleve.id,
      valeur: "",
      operationId: crypto.randomUUID()
    });
  }

  function fermerVersement() {
    if (enCours) return;
    definirFormulaire(null);
    definirErreur("");
  }

  // ENREGISTREMENT DU VERSEMENT
  async function enregistrer(evenement) {
    evenement.preventDefault();
    if (enCours || !selection) return;

    const valeur = Number(formulaire.valeur);

    if (!Number.isFinite(valeur) || valeur <= 0 || valeur > selection.reste ||
      (!nature && !Number.isInteger(valeur))) {
      definirErreur("Veuillez saisir une valeur valide, inférieure ou égale au reste à régler.");
      return;
    }

    definirEnCours(true);
    definirErreur("");
    definirMessage("");

    try {
      await requetePrivee(`${base}/versements`, {
        method: "POST",
        data: { ...formulaire, valeur }
      });

      definirFormulaire(null);
      definirResultat(null);
      definirRevision(valeur => valeur + 1);
      definirMessage("Versement enregistré.");
      apresVersement?.();
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <div className="flex w-full min-w-0 shrink-0 flex-col">

    {/* RECHERCHE ET FILTRES FIXES */}
    <div className={`flex shrink-0 flex-col gap-3 border-b p-3 sm:p-4 lg:flex-row lg:items-end lg:justify-between ${bordure}`}>

      <div className="min-w-0">
        <p className={`text-xs font-semibold ${secondaire}`}>
          Période de paiement
        </p>

        <div className={`mt-2 flex items-center gap-2 text-sm font-semibold ${texte}`}>
          <CalendarDays size={17} className={`shrink-0 ${accent}`}/>

          <span>
            {tarif.finPaiement
              ? tarif.debutPaiement
                ? `Du ${dateCourte(tarif.debutPaiement)} au ${dateCourte(tarif.finPaiement)}`
                : `Échéance : ${dateCourte(tarif.finPaiement)}`
              : "Échéance à configurer"}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">

        <label className={`${label} w-full sm:w-auto`}>
          <span>Niveau</span>
          <select className={`${champ} sm:min-w-[150px]`} value={niveau}
            onChange={event => definirNiveau(event.target.value)}>
            <option value="">Tous les niveaux</option>
            {niveaux.map(valeur => <option key={valeur} value={valeur}>
              {valeur}
            </option>)}
          </select>
        </label>

        <label className={`${label} w-full sm:w-[240px]`}>
          <span>Recherche</span>
          <span className="relative block">
            <Search size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
            <input type="search" className={`${champ} pl-9`}
              value={recherche}
              placeholder="Nom, classe, matricule..."
              onChange={event => definirRecherche(event.target.value)}/>
          </span>
        </label>

        {(niveau || recherche) && <button type="button"
          onClick={reinitialiserFiltres}
          title="Réinitialiser les filtres"
          aria-label="Réinitialiser les filtres"
          className={`${bouton} ${contour} h-10`}>
          <X size={16}/>
        </button>}
      </div>
    </div>

    {/* MESSAGES */}
    {erreur && !formulaire && <div role="alert"
      className={`${styleErreur} m-3 flex shrink-0 items-start gap-2`}>
      <AlertCircle size={17} className="mt-0.5 shrink-0"/>
      <span>{erreur}</span>
    </div>}

    {message && <div role="status"
      className="m-3 flex shrink-0 items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">

      <CheckCircle2 size={18} className="shrink-0"/>
      <span className="flex-1">{message}</span>

      <button type="button" onClick={() => definirMessage("")}
        aria-label="Fermer la confirmation">
        <X size={16}/>
      </button>
    </div>}

    {/* TABLEAU : SCROLL INTERNE */}
    <div className="w-full min-w-0 shrink-0 max-h-[272px] overflow-auto overscroll-contain">

      <table className="w-full min-w-[850px] border-separate border-spacing-0 text-left text-sm">

        {/* EN-TÊTE STICKY */}
        <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs font-semibold text-[#667085] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
          <tr className="h-12">

            {["Élève", "Classe", "Dû", "Reçu", "Reste", "Statut"].map(titre =>
              <th key={titre} scope="col"
                className={`whitespace-nowrap border-b px-4 font-bold ${bordure}`}>
                {titre}
              </th>
            )}

            <th scope="col"
              className={`sticky right-0 z-20 w-[85px] whitespace-nowrap border-b bg-[#F8F9FC] px-4 text-right font-bold dark:bg-[#0B172B] ${bordure}`}>
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {resultat && lignes.map(eleve => {
            const regle = eleve.reste <= 0;
            const partiel = !regle && eleve.paye > 0;
            const retard = eleve.reste > 0 && resultat.enRetard;

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

              {/* MONTANT DÛ */}
              <td className={`${cellule} font-semibold ${texte}`}>
                {format(eleve.du)}
              </td>

              {/* MONTANT REÇU */}
              <td className={`${cellule} font-semibold text-emerald-600 dark:text-emerald-300`}>
                {format(eleve.paye)}
              </td>

              {/* RESTE À PAYER */}
              <td className={`${cellule} font-bold ${regle ? texte : accent}`}>
                {format(eleve.reste)}
              </td>

              {/* STATUT */}
              <td className={cellule}>
                <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${
                  regle
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : partiel
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                      : "bg-slate-100 text-slate-600 dark:bg-[#263852] dark:text-[#A8B7CF]"
                }`}>

                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"/>
                  {regle ? "Réglé" : partiel ? "Partiel" : "Non réglé"}
                </span>

                {retard && <span className="block text-[11px] font-semibold leading-4 text-red-600 dark:text-[#93C5FD]">
                  En retard
                </span>}
              </td>

              {/* ACTIONS À DROITE */}
              <td className={`sticky right-0 z-[1] w-[85px] whitespace-nowrap border-b bg-white px-4 py-1.5 text-right group-hover:bg-[#FAF8F9] dark:bg-[#14243D] dark:group-hover:bg-[#1B2C46] ${bordure}`}>

                <div className="flex items-center justify-end">
                  {eleve.reste > 0 && <button type="button"
                    disabled={enCours}
                    onClick={() => ouvrirVersement(eleve)}
                    title="Ajouter un versement"
                    aria-label={`Ajouter un versement pour ${eleve.nom} ${eleve.prenom}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#540916]/10 text-[#540916] transition-colors hover:bg-[#540916] hover:text-white disabled:opacity-40 dark:bg-[#29446D] dark:text-[#93C5FD] dark:hover:bg-[#365582]">
                    <Plus size={18}/>
                  </button>}
                </div>
              </td>
            </tr>;
          })}

          {/* CHARGEMENT */}
          {!resultat && !erreur && <tr>
            <td colSpan={7} className="h-[224px] px-4 text-center">
              <div role="status" className={`flex items-center justify-center gap-2 text-sm ${secondaire}`}>
                <Loader2 size={19} className="animate-spin"/>
                Chargement des élèves...
              </div>
            </td>
          </tr>}

          {/* ERREUR DE CHARGEMENT */}
          {!resultat && erreur && <tr>
            <td colSpan={7} className="h-[224px] px-4 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <AlertCircle size={26} className={accent}/>

                <p className={`text-sm font-semibold ${texte}`}>
                  Impossible de charger les élèves.
                </p>

                <button type="button"
                  onClick={() => {
                    definirErreur("");
                    definirRevision(valeur => valeur + 1);
                  }}
                  className={`${bouton} ${contour} mt-2`}>
                  Réessayer
                </button>
              </div>
            </td>
          </tr>}

          {/* AUCUNE DONNÉE */}
          {resultat && !lignes.length && <tr>
            <td colSpan={7} className="h-[224px] px-4 text-center">
              <div className="flex flex-col items-center justify-center gap-2">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#98A2B3] dark:bg-[#263852] dark:text-[#A8B7CF]">
                  <Wallet size={24}/>
                </div>

                <p className={`text-sm font-semibold ${texte}`}>
                  Aucun élève trouvé
                </p>

                <p className={`text-xs ${secondaire}`}>
                  {tarif.portee === "personnalisee"
                    ? "Aucun élève correspondant au groupe et aux filtres."
                    : "Aucun élève ne correspond aux filtres."}
                </p>

                {(niveau || recherche) && <button type="button"
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
    {resultat && <footer className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs ${bordure} ${secondaire}`}>

      <span>{lignes.length} élève(s) sur {eleves.length}</span>

      {lignes.length > 4 && <span>
        Faites défiler pour consulter les autres élèves
      </span>}
    </footer>}

    {/* MODAL DE VERSEMENT */}
    {formulaire && selection && <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101828]/65 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={event => {
        if (event.target === event.currentTarget) fermerVersement();
      }}>

      <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-frais"
        className={`${carte} flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden shadow-xl`}>

        {/* EN-TÊTE DU MODAL */}
        <header className={`flex shrink-0 items-center justify-between gap-3 border-b p-4 sm:p-5 ${bordure}`}>

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]">
              <CreditCard size={22}/>
            </div>

            <div className="min-w-0">
              <h2 id="titre-modal-frais" className={`text-lg font-bold ${texte}`}>
                Ajouter un versement
              </h2>

              <p className={`mt-1 text-xs ${secondaire}`}>
                {tarif.libelle}
              </p>
            </div>
          </div>

          <button type="button" disabled={enCours}
            onClick={fermerVersement} aria-label="Fermer"
            className={`shrink-0 rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-[#263852] ${secondaire}`}>
            <X size={19}/>
          </button>
        </header>

        {/* FORMULAIRE */}
        <form onSubmit={enregistrer} className="flex min-h-0 flex-col">

          <fieldset disabled={enCours}
            className="min-h-0 min-w-0 space-y-4 overflow-y-auto p-4 sm:p-5">

            {/* INFORMATIONS DE L'ÉLÈVE */}
            <div className={`rounded-xl border bg-[#F8F9FC] p-3 dark:bg-[#1B2E4A] ${bordure}`}>
              <p className={`text-xs font-medium ${secondaire}`}>
                Élève concerné
              </p>

              <p className={`mt-1 break-words text-sm font-bold ${texte}`}>
                {selection.nom} {selection.prenom}
              </p>

              <p className={`mt-1 text-xs ${secondaire}`}>
                {selection.classe || "Classe non renseignée"}
                {selection.matricule && ` · ${selection.matricule}`}
              </p>
            </div>

            {/* RÉCAPITULATIF DU PAIEMENT */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">

              {[
                ["Montant dû", selection.du, texte],
                ["Déjà reçu", selection.paye, "text-emerald-600 dark:text-emerald-300"],
                ["Reste à régler", selection.reste, accent]
              ].map(([titre, valeur, couleur]) => <div key={titre}
                className={`min-w-0 rounded-lg border p-3 ${bordure}`}>

                <p className={`text-xs ${secondaire}`}>{titre}</p>
                <p className={`mt-1 break-words text-sm font-bold ${couleur}`}>
                  {format(valeur)}
                </p>
              </div>)}
            </div>

            {/* MONTANT OU QUANTITÉ */}
            <label className={label}>
              <span>
                {nature ? `Quantité (${tarif.unite})` : "Montant (Ar)"}
                {" "}<span className={accent}>*</span>
              </span>

              <input className={champ}
                required autoFocus type="number"
                min={nature ? "0" : "1"}
                step={nature ? "any" : "1"}
                max={selection.reste}
                placeholder={nature ? "Saisir la quantité" : "Saisir le montant"}
                value={formulaire.valeur}
                onChange={event => definirFormulaire(donnees => ({
                  ...donnees, valeur: event.target.value
                }))}/>
            </label>

            {/* SOLDE APRÈS VERSEMENT */}
            {formulaire.valeur !== "" &&
              Number(formulaire.valeur) > 0 &&
              Number(formulaire.valeur) <= selection.reste && <div
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-[#F8F9FC] p-3 dark:bg-[#1B2E4A] ${bordure}`}>

                <span className={`text-xs font-semibold ${secondaire}`}>
                  Reste après versement
                </span>

                <strong className={`text-sm ${accent}`}>
                  {format(selection.reste - Number(formulaire.valeur))}
                </strong>
              </div>}

            {/* ERREUR */}
            {erreur && <div role="alert"
              className={`${styleErreur} flex items-start gap-2`}>
              <AlertCircle size={17} className="mt-0.5 shrink-0"/>
              <span>{erreur}</span>
            </div>}
          </fieldset>

          {/* BOUTONS DU MODAL */}
          <footer className={`flex shrink-0 flex-wrap justify-end gap-2 border-t p-4 sm:p-5 ${bordure}`}>

            <button type="button" disabled={enCours}
              onClick={fermerVersement}
              className={`${bouton} ${contour} flex-1 sm:flex-none`}>
              Annuler
            </button>

            <button type="submit" disabled={enCours}
              className={`${bouton} ${principal} flex-1 sm:flex-none`}>

              {enCours
                ? <Loader2 size={16} className="animate-spin"/>
                : <Save size={16}/>}

              {enCours ? "Enregistrement..." : "Enregistrer"}
            </button>
          </footer>
        </form>
      </div>
    </div>}
  </div>;
}
