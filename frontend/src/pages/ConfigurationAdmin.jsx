import { useEffect, useState } from "react";
import {
  Building2, Check, ChevronRight, CircleAlert, Plus, Save, Settings2,
  Users, X, Wallet, CalendarDays, Fingerprint, LayoutDashboard,
  Pencil, Loader2, MapPin, Phone, ShieldCheck, RefreshCw
} from "lucide-react";
import ConfigurationMatricule from "./ConfigurationMatricule";
import ConfigurationEcheance from "./ConfigurationEcheance";
import TarifsScolaires from "../econome/TarifsScolaires";
import ConfigurationMenu from "./ConfigurationMenu";
import { messageErreur, requetePrivee } from "../services/authentification";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const accent = "text-[#540916] dark:text-[#93C5FD]";
const bordure = "border-[#EAE3E5] dark:border-[#263852]";
const fondIcone = "bg-[#540916]/10 text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]";
const champ = "w-full min-w-0 rounded-lg border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none transition-colors focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white dark:focus:border-[#60A5FA]";
const bouton = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const principal = "bg-[#540916] text-white hover:bg-[#74172A] dark:bg-[#29446D] dark:hover:bg-[#365582]";
const contour = "border border-[#E4E7EC] bg-white text-[#344054] hover:bg-slate-50 dark:border-[#33445E] dark:bg-[#14243D] dark:text-[#C4D7FF] dark:hover:bg-[#263852]";
const label = "block min-w-0 space-y-1.5 text-sm font-semibold text-[#344054] dark:text-[#A8B7CF]";
const styleErreur = "rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700 dark:border-[#405574] dark:bg-[#1B2E4A] dark:text-[#C4D7FF]";

const champs = [
  ["nom", "Nom de l’établissement", 120],
  ["siege", "Siège ou adresse", 240],
  ["logo", "Adresse HTTPS du logo", 2048],
  ["contact", "Coordonnées", 240]
];

const ROLES = {
  econome: "Économat",
  titulaire: "Titulaire de classe"
};

const onglets = [
  ["general", "Général", Settings2],
  ["tarifs", "Tarifs scolaires", Wallet],
  ["echeances", "Échéances", CalendarDays],
  ["matricules", "Matricules", Fingerprint],
  ["navigation", "Navigation", LayoutDashboard]
];

// MODAL RÉUTILISABLE
function Modal({ titre, description, fermer, enfants, enCours, icone: Icone = Settings2 }) {
  useEffect(() => {
    function clavier(e) {
      if (e.key === "Escape" && !enCours) fermer();
    }

    const ancien = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", clavier);

    return () => {
      document.body.style.overflow = ancien;
      document.removeEventListener("keydown", clavier);
    };
  }, [fermer, enCours]);

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101828]/65 p-3 backdrop-blur-sm sm:p-5"
    onMouseDown={e => {
      if (e.target === e.currentTarget && !enCours) fermer();
    }}>

    <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-configuration"
      className={`${carte} flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden shadow-xl`}>

      <header className={`flex shrink-0 items-start justify-between gap-3 border-b p-4 sm:p-5 ${bordure}`}>
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${fondIcone}`}>
            <Icone size={22}/>
          </div>

          <div className="min-w-0">
            <h2 id="titre-modal-configuration" className={`text-lg font-bold ${texte}`}>
              {titre}
            </h2>
            <p className={`mt-1 text-xs leading-relaxed ${secondaire}`}>
              {description}
            </p>
          </div>
        </div>

        <button type="button" onClick={fermer} disabled={enCours}
          aria-label="Fermer"
          className={`shrink-0 rounded-lg p-2 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-[#263852] ${secondaire}`}>
          <X size={20}/>
        </button>
      </header>

      <div className="min-h-0 overflow-y-auto overscroll-contain">
        {enfants}
      </div>
    </div>
  </div>;
}

// MESSAGE D'ERREUR
function MessageErreur({ erreur }) {
  if (!erreur) return null;

  return <div role="alert" className={`${styleErreur} flex items-start gap-2`}>
    <CircleAlert size={17} className="mt-0.5 shrink-0"/>
    <span>{erreur}</span>
  </div>;
}

// BOUTONS DES FORMULAIRES
function ActionsFormulaire({ fermer, enCours }) {
  return <footer className={`flex flex-wrap justify-end gap-2 border-t pt-4 ${bordure}`}>
    <button type="button" onClick={fermer} disabled={enCours}
      className={`${bouton} ${contour} flex-1 sm:flex-none`}>
      Annuler
    </button>

    <button type="submit" disabled={enCours}
      className={`${bouton} ${principal} flex-1 sm:flex-none`}>
      {enCours ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
      {enCours ? "Enregistrement..." : "Enregistrer"}
    </button>
  </footer>;
}

// MODAL AJOUT ET MODIFICATION D'UNE FONCTION
function ModalFonction({ fonction, enregistrer, fermer, enCours, erreur }) {
  const [formulaire, definirFormulaire] = useState({ ...fonction });

  function modifier(cle, valeur) {
    definirFormulaire(etat => ({ ...etat, [cle]: valeur }));
  }

  return <Modal
    titre={fonction.nom ? "Modifier une fonction" : "Nouvelle fonction"}
    description="Définissez le rôle et la disponibilité de cette fonction."
    icone={Users} fermer={fermer} enCours={enCours}
    enfants={<form className="space-y-4 p-4 sm:p-5"
      onSubmit={e => {
        e.preventDefault();
        if (!enCours) enregistrer(formulaire);
      }}>

      <fieldset disabled={enCours} className="min-w-0 space-y-4">

        <label className={label}>
          <span>Nom de la fonction <span className={accent}>*</span></span>
          <input className={champ} value={formulaire.nom}
            maxLength={80} required autoFocus
            placeholder="Ex. : Responsable de l'économat"
            onChange={e => modifier("nom", e.target.value)}/>
        </label>

        <label className={label}>
          <span>Espace autorisé</span>
          <select className={champ} value={formulaire.role}
            onChange={e => modifier("role", e.target.value)}>
            <option value="econome">Économat</option>
            <option value="titulaire">Titulaire de classe</option>
          </select>
        </label>

        {/* INTERRUPTEUR DE DISPONIBILITÉ */}
        <label className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border bg-[#F8F9FC] p-4 dark:bg-[#1B2E4A] ${bordure}`}>
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${texte}`}>
              Disponible à l'inscription
            </p>
            <p className={`mt-1 text-xs ${secondaire}`}>
              Autoriser le personnel à demander cette fonction.
            </p>
          </div>

          <div className="relative shrink-0">
            <input type="checkbox" checked={formulaire.active}
              onChange={e => modifier("active", e.target.checked)}
              className="peer sr-only"/>

            <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-[#540916] peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 dark:bg-[#405574] dark:peer-checked:bg-[#60A5FA]"/>

            <div className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5"/>
          </div>
        </label>
      </fieldset>

      <MessageErreur erreur={erreur}/>
      <ActionsFormulaire fermer={fermer} enCours={enCours}/>
    </form>}/>;
}

// MODAL INFORMATIONS DE L'ÉTABLISSEMENT
function ModalEtablissement({ etablissement, enregistrer, fermer, enCours, erreur }) {
  const [formulaire, definirFormulaire] = useState({ ...etablissement });

  function modifier(cle, valeur) {
    definirFormulaire(etat => ({ ...etat, [cle]: valeur }));
  }

  return <Modal titre="Informations de l'établissement"
    description="Mettez à jour les informations institutionnelles."
    icone={Building2} fermer={fermer} enCours={enCours}
    enfants={<form className="space-y-4 p-4 sm:p-5"
      onSubmit={e => {
        e.preventDefault();
        if (!enCours) enregistrer(formulaire);
      }}>

      <fieldset disabled={enCours} className="grid min-w-0 gap-4 sm:grid-cols-2">

        {champs.map(([cle, libelle, taille]) => <label key={cle}
          className={`${label} ${cle === "nom" || cle === "logo" ? "sm:col-span-2" : ""}`}>

          <span>
            {libelle}
            {cle === "nom" && <span className={accent}> *</span>}
          </span>

          <input className={champ}
            value={formulaire[cle] ?? ""}
            maxLength={taille}
            required={cle === "nom"}
            type={cle === "logo" ? "url" : "text"}
            onChange={e => modifier(cle, e.target.value)}/>
        </label>)}

        <label className={`${label} sm:col-span-2`}>
          <span>Historique</span>
          <textarea rows={5} maxLength={4000}
            value={formulaire.historique ?? ""}
            placeholder="Historique de l'établissement..."
            onChange={e => modifier("historique", e.target.value)}
            className={`${champ} resize-y`}/>
        </label>
      </fieldset>

      <MessageErreur erreur={erreur}/>
      <ActionsFormulaire fermer={fermer} enCours={enCours}/>
    </form>}/>;
}

// CARTE DE CONFIGURATION
function CarteConfiguration({ icone: Icone, titre, description, badge, children, action, libelle, disabled }) {
  return <article className={`${carte} flex min-w-0 flex-col overflow-hidden`}>

    <header className={`flex items-center justify-between gap-3 border-b p-4 ${bordure}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${fondIcone}`}>
          <Icone size={20}/>
        </div>

        <h2 className={`text-sm font-bold sm:text-base ${texte}`}>
          {titre}
        </h2>
      </div>

      {badge}
    </header>

    <div className="min-w-0 flex-1 space-y-3 p-4">
      {description && <p className={`text-sm leading-relaxed ${secondaire}`}>
        {description}
      </p>}
      {children}
    </div>

    <footer className={`flex justify-end border-t p-3 sm:px-4 ${bordure}`}>
      <button type="button" onClick={action} disabled={disabled}
        className={`${bouton} ${contour} w-full sm:w-auto`}>
        {libelle}
        <ChevronRight size={16}/>
      </button>
    </footer>
  </article>;
}

// PAGE PRINCIPALE
export default function ConfigurationAdmin() {
  const [fonctions, definirFonctions] = useState([]);
  const [etablissement, definirEtablissement] = useState(null);
  const [enCours, definirEnCours] = useState(false);
  const [chargement, definirChargement] = useState(true);
  const [erreur, definirErreur] = useState("");
  const [message, definirMessage] = useState("");
  const [modal, definirModal] = useState(null);
  const [onglet, definirOnglet] = useState("general");
  const [revision, definirRevision] = useState(0);

  // CHARGEMENT DE LA CONFIGURATION
  useEffect(() => {
    const controleur = new AbortController();

    definirChargement(true);
    definirErreur("");

    requetePrivee("/admin/configuration", { signal: controleur.signal })
      .then(configuration => {
        if (controleur.signal.aborted) return;

        definirFonctions(configuration.fonctions ?? []);
        definirEtablissement(configuration.etablissement ?? null);
      })
      .catch(cause => {
        if (!controleur.signal.aborted) definirErreur(messageErreur(cause));
      })
      .finally(() => {
        if (!controleur.signal.aborted) definirChargement(false);
      });

    return () => controleur.abort();
  }, [revision]);

  function ouvrirModal(valeur) {
    definirErreur("");
    definirMessage("");
    definirModal(valeur);
  }

  function fermerModal() {
    if (enCours) return;
    definirErreur("");
    definirModal(null);
  }

  // ENREGISTREMENT
  async function enregistrer(rubrique, data) {
    if (enCours) return;

    definirEnCours(true);
    definirErreur("");
    definirMessage("");

    try {
      const resultat = await requetePrivee(`/admin/configuration/${rubrique}`, {
        method: "PUT", data
      });

      if (resultat.fonctions) definirFonctions(resultat.fonctions);
      if (resultat.etablissement) definirEtablissement(resultat.etablissement);

      definirModal(null);
      definirMessage(rubrique === "fonctions"
        ? "Fonctions enregistrées avec succès."
        : "Informations enregistrées avec succès.");
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  function enregistrerFonction(fonction) {
    const nom = fonction.nom.trim();

    if (!nom) {
      definirErreur("Veuillez renseigner le nom de la fonction.");
      return;
    }

    const fonctionValide = { ...fonction, nom };

    const nouvelles = fonctions.some(f => f.id === fonction.id)
      ? fonctions.map(f => f.id === fonction.id ? fonctionValide : f)
      : [...fonctions, fonctionValide];

    enregistrer("fonctions", { fonctions: nouvelles });
  }

  const actives = fonctions.filter(f => f.active).length;
  const inactives = fonctions.length - actives;

  return <section className="flex w-full min-w-0 flex-col gap-4">

    {/* EN-TÊTE PRINCIPAL */}
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">

      <div className="min-w-0">
        <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${texte}`}
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Configuration
        </h1>

        <p className={`mt-1 text-sm ${secondaire}`}>
          Paramètres généraux et fonctionnement de l'établissement.
        </p>
      </div>

      <button type="button" disabled={chargement || enCours}
        onClick={() => definirRevision(valeur => valeur + 1)}
        className={`${bouton} ${contour} w-full sm:w-auto`}>
        <RefreshCw size={16} className={chargement ? "animate-spin" : ""}/>
        Actualiser
      </button>
    </header>

    {/* ONGLETS DE CONFIGURATION */}
    <div className={`min-w-0 shrink-0 border-b ${bordure}`}>

      <nav aria-label="Rubriques de configuration"
        className="flex min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain sm:gap-3">

        {onglets.map(([id, libelle, Icone]) => {
          const actif = onglet === id;

          return <button key={id} type="button"
            aria-pressed={actif}
            onClick={() => definirOnglet(id)}
            className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border-b-[3px] px-3 py-3 text-sm font-semibold transition-colors sm:px-4 ${
              actif
                ? "border-[#540916] text-[#540916] dark:border-[#60A5FA] dark:text-[#93C5FD]"
                : "border-transparent text-[#667085] hover:border-slate-300 hover:text-[#171717] dark:text-[#A8B7CF] dark:hover:border-[#405574] dark:hover:text-white"
            }`}>

            <Icone size={17} strokeWidth={1.8}/>
            {libelle}
          </button>;
        })}
      </nav>
    </div>

    {/* MESSAGES */}
    {!modal && <MessageErreur erreur={erreur}/>}

    {message && <div role="status"
      className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">

      <Check size={18} className="shrink-0"/>
      <span className="flex-1">{message}</span>

      <button type="button" onClick={() => definirMessage("")}
        aria-label="Fermer la confirmation"
        className="rounded-md p-1 hover:bg-emerald-500/10">
        <X size={16}/>
      </button>
    </div>}

    {/* CONTENU DES ONGLETS */}
    <div className="min-w-0">

      {/* CONFIGURATION GÉNÉRALE */}
      <div hidden={onglet !== "general"}>

        {chargement ? <div role="status"
          className={`${carte} flex min-h-[220px] items-center justify-center gap-2 p-5 text-sm ${secondaire}`}>

          <Loader2 size={20} className="animate-spin"/>
          Chargement de la configuration...
        </div> : <div className="space-y-4">

          <div className="grid min-w-0 gap-4 xl:grid-cols-2">

            {/* ÉTABLISSEMENT */}
            <CarteConfiguration
              icone={Building2}
              titre="Établissement"
              action={() => ouvrirModal({ type: "etablissement" })}
              libelle="Modifier les informations"
              disabled={!etablissement}
              badge={<span className="shrink-0 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-[#263852] dark:text-[#A8B7CF]">
                Général
              </span>}>

              <div className="flex min-w-0 items-center gap-3">

                {etablissement?.logo ? <img src={etablissement.logo}
                  alt="Logo de l'établissement"
                  className={`h-14 w-14 shrink-0 rounded-xl border bg-white object-contain p-1 ${bordure}`}/>
                  : <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${fondIcone}`}>
                    <Building2 size={27}/>
                  </div>}

                <div className="min-w-0">
                  <h3 className={`break-words text-base font-bold ${texte}`}>
                    {etablissement?.nom || "Informations de l’établissement"}
                  </h3>

                  <p className={`mt-1 text-xs ${secondaire}`}>
                    Informations institutionnelles
                  </p>
                </div>
              </div>

              <div className={`space-y-3 border-t pt-3 ${bordure}`}>

                <div className="flex items-start gap-3">
                  <MapPin size={17} className={`mt-0.5 shrink-0 ${secondaire}`}/>
                  <div className="min-w-0">
                    <p className={`text-xs ${secondaire}`}>Adresse</p>
                    <p className={`mt-0.5 break-words text-sm font-medium ${texte}`}>
                      {etablissement?.siege || "Adresse non renseignée"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone size={16} className={`mt-0.5 shrink-0 ${secondaire}`}/>
                  <div className="min-w-0">
                    <p className={`text-xs ${secondaire}`}>Coordonnées</p>
                    <p className={`mt-0.5 break-words text-sm font-medium ${texte}`}>
                      {etablissement?.contact || "Coordonnées non renseignées"}
                    </p>
                  </div>
                </div>
              </div>
            </CarteConfiguration>

            {/* FONCTIONS DU PERSONNEL */}
            <CarteConfiguration
              icone={Users}
              titre="Fonctions du personnel"
              description="Gérez les fonctions disponibles lors des demandes d'accès du personnel."
              action={() => ouvrirModal({ type: "fonctions" })}
              libelle="Gérer les fonctions"
              badge={<span className="shrink-0 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                {actives} active(s)
              </span>}>

              <div className="grid grid-cols-3 gap-2">

                {[
                  ["Total", fonctions.length, texte],
                  ["Actives", actives, "text-emerald-600 dark:text-emerald-300"],
                  ["Inactives", inactives, secondaire]
                ].map(([libelle, valeur, couleur]) => <div key={libelle}
                  className={`min-w-0 rounded-xl border bg-[#F8F9FC] p-3 dark:bg-[#1B2E4A] ${bordure}`}>

                  <p className={`text-xs font-medium ${secondaire}`}>
                    {libelle}
                  </p>

                  <p className={`mt-1 text-xl font-bold sm:text-2xl ${couleur}`}>
                    {valeur}
                  </p>
                </div>)}
              </div>

              <div className={`flex items-start gap-2 rounded-lg border bg-[#F8F9FC] p-3 dark:bg-[#1B2E4A] ${bordure}`}>
                <ShieldCheck size={18} className={`mt-0.5 shrink-0 ${accent}`}/>
                <p className={`text-xs leading-relaxed ${secondaire}`}>
                  Les fonctions déterminent les espaces pouvant être demandés
                  par le personnel lors de l'inscription.
                </p>
              </div>
            </CarteConfiguration>
          </div>

          {/* ACCÈS RAPIDE AUX PARAMÈTRES */}
          <section className={`${carte} overflow-hidden`}>

            <header className={`flex items-center gap-3 border-b p-4 ${bordure}`}>

              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${fondIcone}`}>
                <Settings2 size={20}/>
              </div>

              <div className="min-w-0">
                <h2 className={`text-base font-bold ${texte}`}>
                  Paramètres scolaires
                </h2>
                <p className={`mt-0.5 text-xs ${secondaire}`}>
                  Accès rapide aux différentes configurations.
                </p>
              </div>
            </header>

            <div className="grid min-w-0 gap-3 p-4 sm:grid-cols-2">

              {[
                ["tarifs", "Tarifs scolaires", "Montants et contributions scolaires.", Wallet],
                ["echeances", "Échéances", "Délais et périodes de paiement.", CalendarDays],
                ["matricules", "Matricules", "Configuration des identifiants scolaires.", Fingerprint],
                ["navigation", "Navigation", "Organisation des menus de l'application.", LayoutDashboard]
              ].map(([id, titre, description, Icone]) => <button key={id}
                type="button" onClick={() => definirOnglet(id)}
                className={`group flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-[#540916]/30 hover:bg-[#FAF8F9] dark:hover:border-[#405574] dark:hover:bg-[#1B2E4A] ${bordure}`}>

                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${fondIcone}`}>
                  <Icone size={19}/>
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${texte}`}>
                    {titre}
                  </p>
                  <p className={`mt-1 text-xs ${secondaire}`}>
                    {description}
                  </p>
                </div>

                <ChevronRight size={17}
                  className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${secondaire}`}/>
              </button>)}
            </div>
          </section>
        </div>}
      </div>

      {/* TARIFS SCOLAIRES */}
      <div hidden={onglet !== "tarifs"} className="min-w-0">
        <TarifsScolaires modifiable/>
      </div>

      {/* ÉCHÉANCES */}
      <div hidden={onglet !== "echeances"} className="min-w-0">
        <ConfigurationEcheance/>
      </div>

      {/* MATRICULES */}
      <div hidden={onglet !== "matricules"} className="min-w-0">
        <ConfigurationMatricule/>
      </div>

      {/* NAVIGATION */}
      <div hidden={onglet !== "navigation"} className="min-w-0">
        <ConfigurationMenu/>
      </div>
    </div>

    {/* MODAL ÉTABLISSEMENT */}
    {modal?.type === "etablissement" && etablissement &&
      <ModalEtablissement
        etablissement={etablissement}
        enCours={enCours}
        erreur={erreur}
        fermer={fermerModal}
        enregistrer={data => enregistrer("etablissement", data)}/>}

    {/* MODAL LISTE DES FONCTIONS */}
    {modal?.type === "fonctions" && <Modal
      titre="Fonctions du personnel"
      description="Gérez les fonctions disponibles à l'inscription."
      icone={Users}
      fermer={fermerModal}
      enCours={enCours}
      enfants={<div className="space-y-4 p-4 sm:p-5">

        <MessageErreur erreur={erreur}/>

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>
            <p className={`text-sm font-bold ${texte}`}>
              {fonctions.length} fonction(s)
            </p>
            <p className={`mt-1 text-xs ${secondaire}`}>
              {actives} disponible(s) · {inactives} désactivée(s)
            </p>
          </div>

          <button type="button" disabled={fonctions.length >= 30 || enCours}
            onClick={() => ouvrirModal({
              type: "fonction",
              fonction: {
                id: crypto.randomUUID(),
                nom: "",
                role: "econome",
                active: true
              }
            })}
            className={`${bouton} ${principal} w-full sm:w-auto`}>
            <Plus size={17}/>
            Ajouter une fonction
          </button>
        </div>

        {/* TABLEAU DES FONCTIONS */}
        <div className={`min-w-0 overflow-hidden rounded-xl border ${bordure}`}>

          <div className="max-h-[272px] min-w-0 overflow-auto overscroll-contain">

            <table className="w-full min-w-[480px] border-separate border-spacing-0 text-left text-sm">

              <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs text-[#667085] dark:bg-[#0B172B] dark:text-[#A8B7CF]">

                <tr className="h-12">

                  {["Fonction", "Espace", "Statut"].map(titre =>
                    <th key={titre} scope="col"
                      className={`whitespace-nowrap border-b px-3 font-bold ${bordure}`}>
                      {titre}
                    </th>
                  )}

                  <th scope="col"
                    className={`sticky right-0 z-20 w-[80px] whitespace-nowrap border-b bg-[#F8F9FC] px-3 text-right font-bold dark:bg-[#0B172B] ${bordure}`}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {fonctions.map(f => <tr key={f.id}
                  className="group h-14 transition-colors hover:bg-[#FAF8F9] dark:hover:bg-[#1B2C46]">

                  <td className={`whitespace-nowrap border-b px-3 py-2 font-semibold ${texte} ${bordure}`}>
                    {f.nom || "Sans nom"}
                  </td>

                  <td className={`whitespace-nowrap border-b px-3 py-2 ${secondaire} ${bordure}`}>
                    {ROLES[f.role] || f.role}
                  </td>

                  <td className={`whitespace-nowrap border-b px-3 py-2 ${bordure}`}>

                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                      f.active
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-[#263852] dark:text-[#A8B7CF]"
                    }`}>

                      <span className="h-1.5 w-1.5 rounded-full bg-current"/>
                      {f.active ? "Disponible" : "Désactivée"}
                    </span>
                  </td>

                  {/* ACTIONS FIXES À DROITE */}
                  <td className={`sticky right-0 z-[1] w-[80px] whitespace-nowrap border-b bg-white px-3 py-2 text-right group-hover:bg-[#FAF8F9] dark:bg-[#14243D] dark:group-hover:bg-[#1B2C46] ${bordure}`}>

                    <div className="flex items-center justify-end">
                      <button type="button" disabled={enCours}
                        title="Modifier la fonction"
                        aria-label={`Modifier ${f.nom || "la fonction"}`}
                        onClick={() => ouvrirModal({
                          type: "fonction", fonction: f
                        })}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#540916]/10 dark:hover:bg-[#29446D] ${accent}`}>
                        <Pencil size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>)}

                {!fonctions.length && <tr>
                  <td colSpan={4} className="h-[180px] p-4 text-center">

                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${fondIcone}`}>
                        <Users size={24}/>
                      </div>

                      <p className={`text-sm font-semibold ${texte}`}>
                        Aucune fonction configurée
                      </p>

                      <p className={`text-xs ${secondaire}`}>
                        Ajoutez une fonction pour commencer.
                      </p>
                    </div>
                  </td>
                </tr>}
              </tbody>
            </table>
          </div>

          <footer className={`flex flex-wrap items-center justify-between gap-2 border-t px-3 py-3 text-xs ${bordure} ${secondaire}`}>
            <span>{fonctions.length} / 30 fonctions</span>

            {fonctions.length > 4 && <span>
              Faites défiler pour voir les autres fonctions
            </span>}
          </footer>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={fermerModal}
            className={`${bouton} ${contour}`}>
            Fermer
          </button>
        </div>
      </div>}/>}

    {/* MODAL AJOUT / MODIFICATION */}
    {modal?.type === "fonction" && <ModalFonction
      fonction={modal.fonction}
      enCours={enCours}
      erreur={erreur}
      fermer={() => ouvrirModal({ type: "fonctions" })}
      enregistrer={enregistrerFonction}/>}
  </section>;
}