import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye, X, Save, Download, FileText, RefreshCw, Loader2, UserPlus } from "lucide-react";
import Swal from "sweetalert2";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";
import { messageErreur, requetePrivee } from "../services/authentification";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:focus:border-[#93C5FD] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const champsFamille = [
  ["nom_pere", "Nom du père"], ["prenom_pere", "Prénoms du père"],
  ["nom_mere", "Nom de la mère"], ["prenom_mere", "Prénoms de la mère"],
  ["nom_tuteur", "Nom du tuteur"], ["prenom_tuteur", "Prénoms du tuteur"],
];
const vide = { matricule: "", nom: "", prenom: "", sexe: "", date_naissance: "", lieu_naissance: "", adresse: "", telephone: "", classe_id: "", statut: "Non inscrit" };
const inscriptionVide = { eleve_id: "", annee_scolaire_id: "", classe_id: "", type: "Nouvelle inscription" };
const identifiant = e => e.id ?? e.id_eleve;
const idClasse = c => c.id ?? c.id_classe;
const idAnnee = a => a.id ?? a.id_annee;
function liste(resultat, cle) {
  if (Array.isArray(resultat)) return resultat;
  if (Array.isArray(resultat?.[cle])) return resultat[cle];
  if (Array.isArray(resultat?.data)) return resultat.data;
  if (Array.isArray(resultat?.data?.[cle])) return resultat.data[cle];
  throw new Error(`Format de réponse invalide pour ${cle}.`);
}
function Fenetre({ titre, fermer, children }) {
  useEffect(() => {
    const touche = e => { if (e.key === "Escape") fermer(); };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [fermer]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101828]/65 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={e => e.target === e.currentTarget && fermer()}>
      <div className={`${carte} flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden`}>
        <div className="flex shrink-0 items-center justify-between border-b border-[#EAE3E5] px-5 py-4 dark:border-[#263852]">
          <h2 className="text-lg font-bold text-[#171717] dark:text-white">{titre}</h2>
          <button type="button" onClick={fermer} className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:text-[#A8B7CF] dark:hover:bg-[#263852]">
            <X size={19}/>
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
function Champ({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">{label}</span>
      {children}
    </label>
  );
}
const formatMontant = new Intl.NumberFormat("fr-MG");
function moisScolaires(annee) {
  const debut = annee?.debut?.slice(0, 7);
  const fin = annee?.fin?.slice(0, 7);
  if (!debut || !fin) return [];
  const date = new Date(`${debut}-01T00:00:00Z`);
  const mois = [];
  while (Number.isFinite(date.getTime()) && mois.length < 24) {
    const valeur = date.toISOString().slice(0, 7);
    if (valeur > fin) break;
    mois.push(valeur);
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
  return mois;
}
const libelleMois = new Intl.DateTimeFormat("fr", { month: "long", year: "numeric", timeZone: "UTC" });
function PaiementsEleve({ eleveId, classeId, annee, encaisser = false }) {
  const [mois, setMois] = useState(() =>
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Indian/Antananarivo", year: "numeric", month: "2-digit",
    }).format(new Date())
  );
  const [situation, setSituation] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [choisis, setChoisis] = useState([]);
  const periode = encaisser ? moisScolaires(annee).join(",") : mois;
  const selection = JSON.stringify([eleveId, classeId, periode]);
  useEffect(() => {
    if (!classeId || !periode) return;
    const controleur = new AbortController();
    const params = new URLSearchParams({ classeId, mois: periode });
    if (eleveId) params.set("eleveId", eleveId);
    requetePrivee(`/eleves/situation-paiements?${params}`, { signal: controleur.signal })
      .then(data => {
        if (!controleur.signal.aborted) setSituation({ selection, data });
      })
      .catch(cause => {
        if (!controleur.signal.aborted) setErreur({ selection, texte: messageErreur(cause) });
      });
    return () => controleur.abort();
  }, [eleveId, classeId, periode, selection]);
  const data = situation?.selection === selection ? situation.data : null;
  const erreurActive = erreur?.selection === selection ? erreur.texte : "";
  const lignes = data ? [
    ...data.inscriptions.map(droit => ({ ...droit, nom: droit.libelle })),
    ...data.mensualites.map(m => ({
      ...m, id: m.mois, nom: `Écolage · ${libelleMois.format(new Date(`${m.mois}-01T00:00:00Z`))}`,
    })),
  ] : [];
  return (
    <section className="sm:col-span-2 rounded-xl border border-[#EAE3E5] p-4 dark:border-[#33445E]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="text-sm font-bold">Droits d’inscription et écolage</h3>
        {!encaisser && <Champ label="Mois d’écolage">
          <input className={champ} type="month" value={mois} onChange={e => setMois(e.target.value)} />
        </Champ>}
      </div>
      {(!classeId || !periode) && <p className="mt-3 text-sm">{encaisser ? "Choisissez une classe et une année scolaire avec des dates définies." : "Choisissez une classe et un mois."}</p>}
      {erreurActive && <p role="alert" className="mt-3 text-sm text-red-700">{erreurActive}</p>}
      {classeId && periode && !data && !erreurActive && <p role="status" className="mt-3 text-sm">Chargement des paiements…</p>}
      {data && (
        <div className="mt-3 space-y-2 text-sm">
          {data.inscriptions.length === 0 && <p>Aucun droit d’inscription applicable.</p>}
          {encaisser && (
            <div className="flex flex-wrap items-center gap-2">
              <p>Cochez les soldes encaissés aujourd’hui. Vous pouvez laisser toutes les cases vides.</p>
              <button type="button" className={bouton}
                onClick={() => setChoisis(data.mensualites.filter(m => m.du != null && m.du > m.paye).map(m => m.mois))}>
                Sélectionner tous les mois dus
              </button>
            </div>
          )}
          {lignes.map(({ id, nom, du, paye, ambigu, mois: mensualite }) => {
            const reste = du == null ? null : Math.max(0, du - paye);
            return (
              <div key={id} className="border-t border-[#EAE3E5] py-2 dark:border-[#33445E]">
                {encaisser && reste > 0 ? (
                  <label className="flex items-center gap-2 font-semibold">
                    <input type="checkbox" name={mensualite ? "mensualite" : "droit"} value={id}
                      {...(mensualite ? {
                        checked: choisis.includes(mensualite),
                        onChange: e => setChoisis(e.target.checked
                          ? [...choisis, mensualite] : choisis.filter(m => m !== mensualite)),
                      } : {})} />
                    {nom}
                  </label>
                ) : <p className="font-semibold">{nom}</p>}
                {reste === null ? (
                  <p>{ambigu ? "Plusieurs tarifs applicables. Vérifiez les tarifs d’écolage." : "Tarif à configurer."}</p>
                ) : (
                  <p>
                    Dû {formatMontant.format(du)} Ar · Payé {formatMontant.format(paye)} Ar · Reste {formatMontant.format(reste)} Ar
                    {eleveId && <span className={reste === 0 ? "ml-2 text-green-700 dark:text-green-400" : "ml-2 text-red-700 dark:text-red-400"}>
                      {reste === 0 ? "Réglé" : paye > 0 ? "Partiellement payé" : "Non payé"}
                    </span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
export default function GestionEleves({ afficherPaiements = false }) {
  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreClasse, setFiltreClasse] = useState("Tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [page, setPage] = useState(1);
  const [fenetre, setFenetre] = useState(null);
  const [formulaire, setFormulaire] = useState(vide);
  const [nouvelEleve, setNouvelEleve] = useState(false);
  const [inscription, setInscription] = useState(inscriptionVide);
  const [selection, setSelection] = useState(null);
  const taillePage = 8;
  const { utilisateur } = utiliserAuthentification();
  const peutGerer = ["admin", "secretaire", "econome"].includes(utilisateur?.role);
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const [resEleves, resClasses, resAnnees] = await Promise.all([
        requetePrivee("/eleves"),
        requetePrivee("/classes"),
        requetePrivee("/annees-scolaires")
      ]);
      setEleves(liste(resEleves, "eleves"));
      setClasses(liste(resClasses, "classes"));
      setAnnees(liste(resAnnees, "annees_scolaires"));
    } catch (e) {
      setEleves([]);
      setClasses([]);
      setAnnees([]);
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }, []);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { setPage(1); }, [recherche, filtreClasse, filtreStatut]);
  const nomClasse = e => {
    const valeur = e.classe_id ?? e.id_classe;
    return e.classe?.nom || classes.find(c => String(idClasse(c)) === String(valeur))?.nom || (typeof e.classe === "string" ? e.classe : "—");
  };
  const elevesFiltres = useMemo(() => eleves.filter(e => {
    const texte = `${e.nom || ""} ${e.prenom || ""} ${e.matricule || ""} ${nomClasse(e)}`.toLowerCase();
    const correspond = texte.includes(recherche.trim().toLowerCase());
    const classeOK = filtreClasse === "Tous" || nomClasse(e) === filtreClasse;
    const statutOK = filtreStatut === "Tous" || (e.statut || "Non inscrit") === filtreStatut;
    return correspond && classeOK && statutOK;
  }), [eleves, classes, recherche, filtreClasse, filtreStatut]);
  const totalPages = Math.max(1, Math.ceil(elevesFiltres.length / taillePage));
  const pageActive = Math.min(page, totalPages);
  const lignes = elevesFiltres.slice((pageActive - 1) * taillePage, pageActive * taillePage);
  const statuts = [...new Set(eleves.map(e => e.statut).filter(Boolean))];
  const ouvrirFormulaire = e => {
    setFormulaire(e ? {
      ...Object.fromEntries(champsFamille.map(([cle]) => [cle, e[cle] ?? ""])),
      id: identifiant(e),
      matricule: e.matricule || "",
      nom: e.nom || "",
      prenom: e.prenom || "",
      sexe: e.sexe || "",
      date_naissance: e.date_naissance?.slice(0, 10) || "",
      lieu_naissance: e.lieu_naissance || "",
      adresse: e.adresse || "",
      telephone: e.telephone || "",
      classe_id: e.classe_id ?? e.id_classe ?? "",
      statut: e.statut || "Non inscrit"
    } : { ...vide });
    setFenetre("formulaire");
  };
  const donneesEleve = {
      ...Object.fromEntries(champsFamille.map(([cle]) => [cle, (formulaire[cle] ?? "").trim()])),
      nom: formulaire.nom.trim(),
      prenom: formulaire.prenom.trim(),
      sexe: formulaire.sexe || null,
      date_naissance: formulaire.date_naissance || null,
      lieu_naissance: formulaire.lieu_naissance.trim(),
      adresse: formulaire.adresse.trim(),
      telephone: formulaire.telephone.trim(),
      classe_id: formulaire.classe_id || null
    };
  const enregistrer = async e => {
    e.preventDefault();
    if (!formulaire.nom.trim() || !formulaire.prenom.trim()) {
      Swal.fire("Champs obligatoires", "Renseignez le nom et le prénom.", "warning");
      return;
    }
    const modification = formulaire.id != null;
    const donnees = donneesEleve;
    setEnCours(true);
    try {
      await requetePrivee(modification ? `/eleves/${encodeURIComponent(formulaire.id)}` : "/eleves", {
        method: modification ? "PUT" : "POST",
        data: donnees
      });
      setFenetre(null);
      await charger();
      Swal.fire({ icon: "success", title: modification ? "Élève modifié" : "Élève ajouté", timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire("Erreur", messageErreur(e), "error");
    } finally {
      setEnCours(false);
    }
  };
  const supprimer = async eleve => {
    const id = identifiant(eleve);
    if (id == null) return Swal.fire("Erreur", "Identifiant de l'élève manquant.", "error");
    const confirmation = await Swal.fire({
      title: "Supprimer cet élève ?",
      text: `${eleve.nom || ""} ${eleve.prenom || ""}`,
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Supprimer", cancelButtonText: "Annuler",
      confirmButtonColor: document.documentElement.classList.contains("dark") ? "#29446D" : "#B42318"
    });
    if (!confirmation.isConfirmed) return;
    try {
      await requetePrivee(`/eleves/${encodeURIComponent(id)}`, { method: "DELETE" });
      await charger();
      Swal.fire({ icon: "success", title: "Élève supprimé", timer: 1400, showConfirmButton: false });
    } catch (e) {
      if (utilisateur?.role !== "admin" || e.response?.data?.code !== "ELEVE_INSCRIT") {
        Swal.fire("Suppression impossible", messageErreur(e), "error");
        return;
      }
      const confirmationTest = await Swal.fire({
        title: "Supprimer ce dossier de test ?",
        text: `${eleve.nom} ${eleve.prenom} : le dossier, ses inscriptions et ses versements seront définitivement supprimés. Tapez SUPPRIMER pour confirmer.`,
        icon: "warning",
        input: "text",
        inputPlaceholder: "SUPPRIMER",
        inputValidator: valeur => valeur !== "SUPPRIMER" && "Tapez SUPPRIMER.",
        showCancelButton: true,
        confirmButtonText: "Supprimer définitivement",
        cancelButtonText: "Annuler",
        confirmButtonColor: document.documentElement.classList.contains("dark") ? "#29446D" : "#B42318",
      });
      if (!confirmationTest.isConfirmed) return;
      try {
        await requetePrivee(`/admin/eleves/${encodeURIComponent(id)}/supprimer-test`, {
          method: "POST", data: { confirmation: confirmationTest.value },
        });
        await charger();
        Swal.fire("Dossier de test supprimé", "", "success");
      } catch (cause) {
        Swal.fire("Suppression impossible", messageErreur(cause), "error");
      }
    }
  };
  const ouvrirInscription = eleve => {
    setFormulaire({ ...vide });
    setNouvelEleve(afficherPaiements && !eleve && eleves.length === 0);
    setInscription({
      ...inscriptionVide,
      eleve_id: eleve ? String(identifiant(eleve)) : "",
      classe_id: eleve?.classe_id ?? eleve?.id_classe ?? ""
    });
    setFenetre("inscription");
  };
  const inscrire = async e => {
    e.preventDefault();
    if ((!nouvelEleve && !inscription.eleve_id) || !inscription.annee_scolaire_id || !inscription.classe_id) {
      Swal.fire("Champs obligatoires", "Sélectionnez l'élève, l'année scolaire et la classe.", "warning");
      return;
    }
    const champs = new FormData(e.currentTarget);
    setEnCours(true);
    try {
      await requetePrivee("/inscriptions", {
        method: "POST",
        data: {
          ...(nouvelEleve ? { nouvel_eleve: donneesEleve } : { eleve_id: inscription.eleve_id }),
          annee_scolaire_id: inscription.annee_scolaire_id,
          classe_id: inscription.classe_id,
          type: nouvelEleve ? "Nouvelle inscription" : inscription.type,
          reglements: { droits: champs.getAll("droit"), mois: champs.getAll("mensualite") }
        }
      });
      setFenetre(null);
      await charger();
      Swal.fire({ icon: "success", title: "Inscription enregistrée", timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire("Inscription impossible", messageErreur(e), "error");
    } finally {
      setEnCours(false);
    }
  };
  const exporter = type => {
    const donnees = elevesFiltres.map(e => ({
      Matricule: e.matricule || "",
      Nom: e.nom || "",
      Prénom: e.prenom || "",
      Sexe: e.sexe || "",
      Classe: nomClasse(e),
      Statut: e.statut || ""
    }));
    if (!donnees.length) return Swal.fire("Aucune donnée", "Aucun élève à exporter.", "info");
    if (type === "excel") exporterExcel(donnees, "eleves-slg");
    else exporterPDF(donnees, ["Matricule", "Nom", "Prénom", "Sexe", "Classe", "Statut"], "eleves-slg");
  };
  const champsIdentite = (<>
            <Champ label="Nom *">
              <input required value={formulaire.nom} onChange={e => setFormulaire(p => ({ ...p, nom: e.target.value }))}
                placeholder="Nom" className={champ}/>
            </Champ>
            <Champ label="Prénom *">
              <input required value={formulaire.prenom} onChange={e => setFormulaire(p => ({ ...p, prenom: e.target.value }))}
                placeholder="Prénom" className={champ}/>
            </Champ>
            <Champ label="Sexe">
              <select value={formulaire.sexe} onChange={e => setFormulaire(p => ({ ...p, sexe: e.target.value }))} className={champ}>
                <option value="">Sélectionner...</option>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </select>
            </Champ>
            <Champ label="Date de naissance">
              <input type="date" value={formulaire.date_naissance} onChange={e => setFormulaire(p => ({ ...p, date_naissance: e.target.value }))} className={champ}/>
            </Champ>
            <Champ label="Lieu de naissance">
              <input value={formulaire.lieu_naissance} onChange={e => setFormulaire(p => ({ ...p, lieu_naissance: e.target.value }))} className={champ}/>
            </Champ>
            <Champ label="Téléphone du parent ou du tuteur (facultatif)">
              <input type="tel" value={formulaire.telephone} onChange={e => setFormulaire(p => ({ ...p, telephone: e.target.value }))} className={champ}/>
            </Champ>
            <div className="sm:col-span-2">
              <Champ label="Adresse">
                <textarea rows={2} value={formulaire.adresse} onChange={e => setFormulaire(p => ({ ...p, adresse: e.target.value }))}
                  className={`${champ} resize-none`}/>
              </Champ>
            </div>
    {champsFamille.map(([cle, libelle]) => (
      <Champ key={cle} label={libelle}>
        <input className={champ} maxLength={120} value={formulaire[cle] ?? ""}
          onChange={e => setFormulaire(p => ({ ...p, [cle]: e.target.value }))} />
      </Champ>
    ))}
  </>);
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 lg:h-[calc(100dvh-145px)] lg:min-h-[420px]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Élèves</h1>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A8B7CF]">
            Gestion des dossiers scolaires et des inscriptions.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">
          {peutGerer && <button onClick={() => ouvrirInscription(null)} className={`${bouton} border border-[#540916] text-[#540916] hover:bg-[#F8EDEF] dark:border-[#8FA9D1] dark:text-[#A8B7CF] dark:hover:bg-[#263852]`}>
            <UserPlus size={17}/> {afficherPaiements ? "Inscrire un élève" : "Inscrire / Réinscrire"}
          </button>}
          {peutGerer && !afficherPaiements && <button onClick={() => ouvrirFormulaire(null)} className={`${bouton} bg-[#540916] text-white dark:bg-[#29446D] dark:hover:bg-[#365781] hover:bg-[#701326]`}>
            <Plus size={17}/> Nouvel élève
          </button>}
        </div>
      </div>
      <section className={`${carte} flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div className="relative w-full min-w-0 lg:max-w-sm lg:flex-1">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un élève..."
              className={`${champ} pl-10`}/>
          </div>
          <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">
            <select value={filtreClasse} onChange={e => setFiltreClasse(e.target.value)} className={`${champ} !w-auto min-w-0 max-w-full sm:max-w-[170px]`}>
              <option value="Tous">Toutes les classes</option>
              {classes.map(c => <option key={idClasse(c)} value={c.nom}>{c.nom}</option>)}
            </select>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} className={`${champ} !w-auto min-w-0 max-w-full sm:max-w-[170px]`}>
              <option value="Tous">Tous les statuts</option>
              {statuts.map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={charger} title="Actualiser" className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
              <RefreshCw size={16}/>
            </button>
            <button onClick={() => exporter("excel")} className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
              <Download size={16}/> Excel
            </button>
            <button onClick={() => exporter("pdf")} className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
              <FileText size={16}/> PDF
            </button>
          </div>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain max-h-[65dvh] lg:max-h-none">
          <table className="w-full min-w-[740px] border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                {["Matricule", "Nom et prénom", "Sexe", "Classe", "Statut"].map(t => (
                  <th key={t} scope="col" className="whitespace-nowrap px-3 py-3 font-bold sm:px-5">{t}</th>
                ))}
                <th scope="col" className="sticky right-0 z-20 w-px whitespace-nowrap bg-[#F8F9FC] px-2 py-3 text-right font-bold dark:bg-[#0B172B] sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAEC] dark:divide-[#263852]">
              {!chargement && !erreur && lignes.map(e => (
                <tr key={identifiant(e)} className="group hover:bg-[#FAF8F9] dark:hover:bg-[#1B2C46]">
                  <td className="px-3 py-3 sm:px-5 font-semibold text-[#540916] dark:text-[#93C5FD]">{e.matricule || "—"}</td>
                  <td className="px-3 py-3 sm:px-5 font-semibold text-[#171717] dark:text-white">{e.nom} {e.prenom}</td>
                  <td className="px-3 py-3 sm:px-5 text-[#667085] dark:text-[#A8B7CF]">{e.sexe || "—"}</td>
                  <td className="px-3 py-3 sm:px-5 text-[#667085] dark:text-[#A8B7CF]">{nomClasse(e)}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-[#F2F4F7] px-3 py-1 text-xs font-bold text-[#475467] dark:bg-[#263852] dark:text-[#A8B7CF]">
                      {e.statut || "Non renseigné"}
                    </span>
                  </td>
                  <td className="sticky right-0 z-[1] w-px whitespace-nowrap bg-white px-2 py-3 text-right group-hover:bg-[#FAF8F9] dark:bg-[#14243D] dark:group-hover:bg-[#1B2C46] sm:px-5">
                    <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                      <button title="Détails" onClick={() => { setSelection(e); setFenetre("details"); }}
                        className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:text-[#A8B7CF] dark:hover:bg-[#263852]"><Eye size={17}/></button>
                      {peutGerer && <button title="Modifier" onClick={() => ouvrirFormulaire(e)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-[#263852]"><Pencil size={17}/></button>}
                      {peutGerer && <button title="Inscrire / Réinscrire" onClick={() => ouvrirInscription(e)}
                        className="rounded-lg p-2 text-green-600 hover:bg-green-50 dark:text-emerald-300 dark:hover:bg-[#263852]"><UserPlus size={17}/></button>}
                      {peutGerer && <button title="Supprimer" onClick={() => supprimer(e)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-slate-300 dark:hover:bg-[#263852] sm:p-2"><Trash2 size={17}/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {chargement && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#667085] dark:text-[#A8B7CF]">
              <Loader2 size={19} className="animate-spin"/> Chargement des élèves...
            </div>
          )}
          {!chargement && erreur && (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-red-600 dark:text-slate-200">Impossible de charger les données.</p>
              <p className="mt-2 text-xs text-[#667085] dark:text-[#A8B7CF]">{erreur}</p>
              <button onClick={charger} className={`${bouton} mt-4 bg-[#540916] text-white dark:bg-[#29446D] dark:hover:bg-[#365781]`}>Réessayer</button>
            </div>
          )}
          {!chargement && !erreur && !lignes.length && (
            <div className="p-12 text-center text-sm text-[#667085] dark:text-[#A8B7CF]">
              Aucun élève disponible.
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EAE3E5] px-4 py-3 text-xs text-[#667085] dark:border-[#263852] dark:text-[#A8B7CF]">
          <span>{elevesFiltres.length} élève(s) · Page {pageActive} / {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={pageActive <= 1} onClick={() => setPage(p => p - 1)}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>Précédent</button>
            <button disabled={pageActive >= totalPages} onClick={() => setPage(p => p + 1)}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>Suivant</button>
          </div>
        </div>
      </section>
      {fenetre === "formulaire" && (
        <Fenetre titre={formulaire.id != null ? "Modifier l'élève" : "Nouvel élève"} fermer={() => !enCours && setFenetre(null)}>
          <form onSubmit={enregistrer} className="grid gap-4 sm:grid-cols-2">
            <Champ label="Matricule">
              <input value={formulaire.matricule} readOnly placeholder="Attribué à la première inscription"
                className={`${champ} bg-[#F8F9FC] dark:bg-[#14243D]`} />
            </Champ>
            {champsIdentite}
            <Champ label="Classe">
              <select value={formulaire.classe_id} onChange={e => setFormulaire(p => ({ ...p, classe_id: e.target.value }))} className={champ}>
                <option value="">Non affecté</option>
                {classes.map(c => <option key={idClasse(c)} value={idClasse(c)}>{c.nom}</option>)}
              </select>
            </Champ>
            {afficherPaiements && <PaiementsEleve eleveId={formulaire.id} classeId={formulaire.classe_id} />}
            <div className="sm:col-span-2 flex flex-wrap justify-end gap-2 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
              <button type="button" disabled={enCours} onClick={() => setFenetre(null)}
                className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>Annuler</button>
              <button type="submit" disabled={enCours} className={`${bouton} bg-[#540916] px-5 text-white dark:bg-[#29446D] dark:hover:bg-[#365781]`}>
                {enCours ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Enregistrer
              </button>
            </div>
          </form>
        </Fenetre>
      )}
      {fenetre === "inscription" && (
        <Fenetre titre={afficherPaiements ? "Inscription scolaire" : "Inscrire ou réinscrire un élève"} fermer={() => !enCours && setFenetre(null)}>
          <form onSubmit={inscrire} className="grid gap-4 sm:grid-cols-2">
            {afficherPaiements && (
              <div className="sm:col-span-2">
                <Champ label="Opération">
                  <select className={champ} value={nouvelEleve ? "nouveau" : "existant"}
                    onChange={e => {
                      const choix = e.target.value;
                      setNouvelEleve(choix === "nouveau");
                    }}>
                    <option value="nouveau">Nouvel élève et première inscription</option>
                    <option value="existant">Inscrire ou réinscrire un élève existant</option>
                  </select>
                </Champ>
              </div>
            )}
            {nouvelEleve ? champsIdentite : (
              <Champ label="Élève *">
                <select required value={inscription.eleve_id} onChange={e => {
                  const eleveId = e.target.value;
                  const eleve = eleves.find(dossier => String(identifiant(dossier)) === eleveId);
                  setInscription(p => ({ ...p, eleve_id: eleveId, classe_id: eleve?.classe_id ?? eleve?.id_classe ?? "" }));
                }} className={champ}>
                  <option value="">Sélectionner...</option>
                  {eleves.map(e => <option key={identifiant(e)} value={identifiant(e)}>{e.nom} {e.prenom} — {e.matricule || "Sans matricule"}</option>)}
                </select>
              </Champ>
            )}
            {!afficherPaiements && (
              <Champ label="Type d'inscription">
                <select value={inscription.type} onChange={e => setInscription(p => ({ ...p, type: e.target.value }))} className={champ}>
                  <option>Nouvelle inscription</option>
                  <option>Réinscription</option>
                </select>
              </Champ>
            )}
            <Champ label="Année scolaire *">
              <select required value={inscription.annee_scolaire_id} onChange={e => setInscription(p => ({ ...p, annee_scolaire_id: e.target.value }))} className={champ}>
                <option value="">Sélectionner...</option>
                {annees.map(a => <option key={idAnnee(a)} value={idAnnee(a)}>{a.nom}</option>)}
              </select>
            </Champ>
            <Champ label="Classe *">
              <select required value={inscription.classe_id} onChange={e => setInscription(p => ({ ...p, classe_id: e.target.value }))} className={champ}>
                <option value="">Sélectionner...</option>
                {classes.map(c => <option key={idClasse(c)} value={idClasse(c)}>{c.nom}</option>)}
              </select>
            </Champ>
            {afficherPaiements && <PaiementsEleve
              key={JSON.stringify([nouvelEleve, inscription.eleve_id, inscription.classe_id, inscription.annee_scolaire_id])}
              encaisser eleveId={nouvelEleve ? undefined : inscription.eleve_id} classeId={inscription.classe_id}
              annee={annees.find(a => String(idAnnee(a)) === inscription.annee_scolaire_id)} />}
            <div className="sm:col-span-2 flex flex-wrap justify-end gap-2 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
              <button type="button" disabled={enCours} onClick={() => setFenetre(null)}
                className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>Annuler</button>
              <button type="submit" disabled={enCours || (!nouvelEleve && !eleves.length) || !classes.length || !annees.length}
                className={`${bouton} bg-[#540916] px-5 text-white dark:bg-[#29446D] dark:hover:bg-[#365781]`}>
                {enCours ? <Loader2 size={16} className="animate-spin"/> : <UserPlus size={16}/>} Valider l'inscription
              </button>
            </div>
          </form>
        </Fenetre>
      )}
      {fenetre === "details" && selection && (
        <Fenetre titre="Détails de l'élève" fermer={() => setFenetre(null)}>
          <div className="space-y-2">
            {[
              ["Matricule", selection.matricule],
              ["Nom", selection.nom],
              ["Prénom", selection.prenom],
              ["Sexe", selection.sexe],
              ["Date de naissance", selection.date_naissance?.slice(0, 10)],
              ["Lieu de naissance", selection.lieu_naissance],
              ["Téléphone du parent ou du tuteur", selection.telephone],
              ...champsFamille.map(([cle, libelle]) => [libelle, selection[cle]]),
              ["Adresse", selection.adresse],
              ["Classe", nomClasse(selection)],
              ["Statut", selection.statut]
            ].map(([titre, valeur]) => (
              <div key={titre} className="flex justify-between gap-4 border-b border-[#F0EAEC] py-2 text-sm dark:border-[#263852]">
                <span className="text-[#667085] dark:text-[#A8B7CF]">{titre}</span>
                <strong className="max-w-[65%] break-words text-right font-semibold text-[#171717] dark:text-white">{valeur || "—"}</strong>
              </div>
            ))}
          </div>
        </Fenetre>
      )}
    </div>
  );
}
