import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Eye, Pencil, X, Save, RefreshCw, Loader2, UserRound, UserCheck, UserX, ShieldCheck, AlertCircle, Download, FileText } from "lucide-react";
import Swal from "sweetalert2";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const initial = { nom: "", prenom: "", email: "", telephone: "", role: "", actif: true };
const idUtilisateur = u => u.id ?? u.id_utilisateur;
const roles = [
  { valeur: "admin", label: "Administrateur" },
  { valeur: "secretaire", label: "Secrétaire" },
  { valeur: "direction", label: "Direction" },
  { valeur: "titulaire", label: "Titulaire" },
  { valeur: "enseignant", label: "Enseignant" },
  { valeur: "parent", label: "Parent" },
  { valeur: "eleve", label: "Élève" }
];
const nomRole = role => roles.find(r => r.valeur === role)?.label || role || "Non défini";

async function requete(chemin, options = {}) {
  const reponse = await fetch(`${API}${chemin}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (!reponse.ok) {
    const erreur = await reponse.json().catch(() => ({}));
    throw new Error(erreur.message || erreur.error || `Erreur HTTP ${reponse.status}`);
  }
  if (reponse.status === 204) return null;
  return reponse.json();
}

function extraireListe(resultat) {
  if (Array.isArray(resultat)) return resultat;
  if (Array.isArray(resultat?.utilisateurs)) return resultat.utilisateurs;
  if (Array.isArray(resultat?.data)) return resultat.data;
  if (Array.isArray(resultat?.data?.utilisateurs)) return resultat.data.utilisateurs;
  throw new Error("Format de réponse API invalide.");
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
          <button type="button" onClick={fermer} className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:hover:bg-[#263852]">
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

function BadgeRole({ role }) {
  const couleurs = {
    admin: "bg-[#FCE8ED] text-[#8C1833] dark:bg-[#540916]/40 dark:text-[#F5B4C5]",
    secretaire: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    direction: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    titulaire: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${couleurs[role] || "bg-gray-100 text-gray-700 dark:bg-[#263852] dark:text-[#DCE5F3]"}`}>
      {nomRole(role)}
    </span>
  );
}

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [permissions, setPermissions] = useState({ creer: false, modifier: false, gererStatut: false, attribuerRoles: false });
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState("Tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [page, setPage] = useState(1);
  const [fenetre, setFenetre] = useState(null);
  const [formulaire, setFormulaire] = useState(initial);
  const [selection, setSelection] = useState(null);
  const taillePage = 8;

  // L'API doit renvoyer les permissions effectives du compte connecté.
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const resultat = await requete("/utilisateurs");
      setUtilisateurs(extraireListe(resultat));
      const p = resultat?.permissions || {};
      setPermissions({
        creer: p.creer === true,
        modifier: p.modifier === true,
        gererStatut: p.gererStatut === true,
        attribuerRoles: p.attribuerRoles === true
      });
    } catch (e) {
      setUtilisateurs([]);
      setPermissions({ creer: false, modifier: false, gererStatut: false, attribuerRoles: false });
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { setPage(1); }, [recherche, filtreRole, filtreStatut]);

  const utilisateursFiltres = useMemo(() => utilisateurs.filter(u => {
    const texte = `${u.nom || ""} ${u.prenom || ""} ${u.email || ""} ${u.telephone || ""}`.toLowerCase();
    const correspond = texte.includes(recherche.trim().toLowerCase());
    const roleOK = filtreRole === "Tous" || u.role === filtreRole;
    const statutOK = filtreStatut === "Tous" || (filtreStatut === "Actif" ? u.actif === true : u.actif === false);
    return correspond && roleOK && statutOK;
  }), [utilisateurs, recherche, filtreRole, filtreStatut]);

  const totalPages = Math.max(1, Math.ceil(utilisateursFiltres.length / taillePage));
  const pageActive = Math.min(page, totalPages);
  const lignes = utilisateursFiltres.slice((pageActive - 1) * taillePage, pageActive * taillePage);

  const ouvrirFormulaire = utilisateur => {
    if (utilisateur && !permissions.modifier) return;
    if (!utilisateur && !permissions.creer) return;
    setFormulaire(utilisateur ? {
      id: idUtilisateur(utilisateur),
      nom: utilisateur.nom || "",
      prenom: utilisateur.prenom || "",
      email: utilisateur.email || "",
      telephone: utilisateur.telephone || "",
      role: utilisateur.role || "",
      actif: utilisateur.actif === true
    } : { ...initial });
    setFenetre("formulaire");
  };

  const enregistrer = async e => {
    e.preventDefault();
    const modification = formulaire.id != null;
    if (modification && !permissions.modifier) return;
    if (!modification && !permissions.creer) return;

    if (!formulaire.nom.trim() || !formulaire.email.trim()) {
      Swal.fire("Champs obligatoires", "Renseignez le nom et l'adresse e-mail.", "warning");
      return;
    }

    const donnees = {
      nom: formulaire.nom.trim(),
      prenom: formulaire.prenom.trim(),
      email: formulaire.email.trim(),
      telephone: formulaire.telephone.trim()
    };
    if (permissions.attribuerRoles && formulaire.role) donnees.role = formulaire.role;

    setEnCours(true);
    try {
      await requete(modification ? `/utilisateurs/${formulaire.id}` : "/utilisateurs", {
        method: modification ? "PUT" : "POST",
        body: JSON.stringify(donnees)
      });
      setFenetre(null);
      await charger();
      Swal.fire({ icon: "success", title: modification ? "Utilisateur modifié" : "Utilisateur créé", timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire("Enregistrement impossible", e.message, "error");
    } finally {
      setEnCours(false);
    }
  };

  const changerStatut = async utilisateur => {
    if (!permissions.gererStatut) return;
    const id = idUtilisateur(utilisateur);
    if (id == null) return Swal.fire("Erreur", "Identifiant utilisateur manquant.", "error");

    const actif = utilisateur.actif === true;
    const confirmation = await Swal.fire({
      title: actif ? "Désactiver ce compte ?" : "Réactiver ce compte ?",
      text: `${utilisateur.nom || ""} ${utilisateur.prenom || ""}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: actif ? "Désactiver" : "Réactiver",
      cancelButtonText: "Annuler",
      confirmButtonColor: actif ? "#B42318" : "#26865B"
    });
    if (!confirmation.isConfirmed) return;

    try {
      await requete(`/utilisateurs/${id}/statut`, {
        method: "PATCH",
        body: JSON.stringify({ actif: !actif })
      });
      await charger();
      Swal.fire({ icon: "success", title: actif ? "Compte désactivé" : "Compte réactivé", timer: 1400, showConfirmButton: false });
    } catch (e) {
      Swal.fire("Opération impossible", e.message, "error");
    }
  };

  const exporter = format => {
    const donnees = utilisateursFiltres.map(u => ({
      Nom: u.nom || "",
      Prénom: u.prenom || "",
      Email: u.email || "",
      Téléphone: u.telephone || "",
      Rôle: nomRole(u.role),
      Statut: u.actif === true ? "Actif" : "Inactif"
    }));
    if (!donnees.length) return Swal.fire("Aucune donnée", "Aucun utilisateur à exporter.", "info");
    if (format === "excel") exporterExcel(donnees, "utilisateurs-slg");
    else exporterPDF(donnees, ["Nom", "Prénom", "Email", "Téléphone", "Rôle", "Statut"], "utilisateurs-slg");
  };

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Utilisateurs</h1>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A8B7CF]">
            Consultation et gestion des comptes de l'établissement.
          </p>
        </div>
        {permissions.creer && (
          <button onClick={() => ouvrirFormulaire(null)} className={`${bouton} bg-[#540916] text-white hover:bg-[#701326]`}>
            <Plus size={17}/> Nouvel utilisateur
          </button>
        )}
      </div>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div className="relative min-w-[180px] flex-1 sm:max-w-sm">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
            <input value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher un utilisateur..." className={`${champ} pl-10`}/>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={filtreRole} onChange={e => setFiltreRole(e.target.value)} className={`${champ} w-auto max-w-[180px]`}>
              <option value="Tous">Tous les rôles</option>
              {roles.map(r => <option key={r.valeur} value={r.valeur}>{r.label}</option>)}
            </select>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} className={`${champ} w-auto`}>
              <option value="Tous">Tous les statuts</option>
              <option value="Actif">Actifs</option>
              <option value="Inactif">Inactifs</option>
            </select>
            <button onClick={charger} title="Actualiser"
              className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
              <RefreshCw size={16}/>
            </button>
            <button onClick={() => exporter("excel")}
              className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
              <Download size={16}/> Excel
            </button>
            <button onClick={() => exporter("pdf")}
              className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
              <FileText size={16}/> PDF
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                {["Utilisateur", "Email", "Téléphone", "Rôle", "Statut", "Actions"].map(t => (
                  <th key={t} className="px-5 py-3 font-bold">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAEC] dark:divide-[#263852]">
              {!chargement && !erreur && lignes.map(u => (
                <tr key={idUtilisateur(u)} className="hover:bg-[#FAF8F9] dark:hover:bg-[#1B2C46]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8EDEF] text-[#540916] dark:bg-[#263852] dark:text-[#B9D2FF]">
                        <UserRound size={17}/>
                      </div>
                      <span className="font-semibold text-[#171717] dark:text-white">{u.nom || ""} {u.prenom || ""}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[#667085] dark:text-[#A8B7CF]">{u.email || "—"}</td>
                  <td className="px-5 py-3 text-[#667085] dark:text-[#A8B7CF]">{u.telephone || "—"}</td>
                  <td className="px-5 py-3"><BadgeRole role={u.role}/></td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      u.actif === true
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}>
                      {u.actif === true ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Détails" onClick={() => { setSelection(u); setFenetre("details"); }}
                        className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:hover:bg-[#263852]"><Eye size={17}/></button>
                      {permissions.modifier && (
                        <button title="Modifier" onClick={() => ouvrirFormulaire(u)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-[#263852]"><Pencil size={17}/></button>
                      )}
                      {permissions.gererStatut && (
                        <button title={u.actif === true ? "Désactiver" : "Réactiver"} onClick={() => changerStatut(u)}
                          className={`rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#263852] ${u.actif === true ? "text-red-600" : "text-green-600"}`}>
                          {u.actif === true ? <UserX size={17}/> : <UserCheck size={17}/>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {chargement && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#667085] dark:text-[#A8B7CF]">
              <Loader2 size={19} className="animate-spin"/> Chargement des utilisateurs...
            </div>
          )}
          {!chargement && erreur && (
            <div className="p-10 text-center">
              <AlertCircle size={30} className="mx-auto mb-3 text-red-500"/>
              <p className="text-sm font-semibold text-red-600">Impossible de charger les utilisateurs.</p>
              <p className="mt-2 text-xs text-[#667085] dark:text-[#A8B7CF]">{erreur}</p>
              <button onClick={charger} className={`${bouton} mt-4 bg-[#540916] text-white`}>Réessayer</button>
            </div>
          )}
          {!chargement && !erreur && !lignes.length && (
            <div className="p-12 text-center text-sm text-[#667085] dark:text-[#A8B7CF]">
              Aucun utilisateur disponible.
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EAE3E5] px-4 py-3 text-xs text-[#667085] dark:border-[#263852] dark:text-[#A8B7CF]">
          <span>{utilisateursFiltres.length} utilisateur(s) · Page {pageActive} / {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={pageActive <= 1} onClick={() => setPage(p => p - 1)}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>Précédent</button>
            <button disabled={pageActive >= totalPages} onClick={() => setPage(p => p + 1)}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>Suivant</button>
          </div>
        </div>
      </section>

      {fenetre === "formulaire" && (
        <Fenetre titre={formulaire.id != null ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          fermer={() => !enCours && setFenetre(null)}>
          <form onSubmit={enregistrer} className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nom *">
              <input required value={formulaire.nom} onChange={e => setFormulaire(p => ({ ...p, nom: e.target.value }))}
                placeholder="Nom" className={champ}/>
            </Champ>
            <Champ label="Prénom">
              <input value={formulaire.prenom} onChange={e => setFormulaire(p => ({ ...p, prenom: e.target.value }))}
                placeholder="Prénom" className={champ}/>
            </Champ>
            <Champ label="Adresse e-mail *">
              <input required type="email" value={formulaire.email} onChange={e => setFormulaire(p => ({ ...p, email: e.target.value }))}
                placeholder="Adresse e-mail" className={champ}/>
            </Champ>
            <Champ label="Téléphone">
              <input type="tel" value={formulaire.telephone} onChange={e => setFormulaire(p => ({ ...p, telephone: e.target.value }))}
                placeholder="Numéro de téléphone" className={champ}/>
            </Champ>
            {permissions.attribuerRoles && (
              <Champ label="Rôle">
                <select value={formulaire.role} onChange={e => setFormulaire(p => ({ ...p, role: e.target.value }))} className={champ}>
                  <option value="">Sélectionner...</option>
                  {roles.map(r => <option key={r.valeur} value={r.valeur}>{r.label}</option>)}
                </select>
              </Champ>
            )}
            <div className="sm:col-span-2 flex justify-end gap-2 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
              <button type="button" disabled={enCours} onClick={() => setFenetre(null)}
                className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>Annuler</button>
              <button type="submit" disabled={enCours} className={`${bouton} bg-[#540916] px-5 text-white`}>
                {enCours ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                Enregistrer
              </button>
            </div>
          </form>
        </Fenetre>
      )}

      {fenetre === "details" && selection && (
        <Fenetre titre="Détails de l'utilisateur" fermer={() => setFenetre(null)}>
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#F9FAFB] p-4 dark:bg-[#0B172B]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8EDEF] text-[#540916] dark:bg-[#263852] dark:text-[#B9D2FF]">
              <ShieldCheck size={22}/>
            </div>
            <div>
              <p className="font-bold text-[#171717] dark:text-white">{selection.nom} {selection.prenom}</p>
              <p className="text-xs text-[#667085] dark:text-[#A8B7CF]">{nomRole(selection.role)}</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              ["Nom", selection.nom],
              ["Prénom", selection.prenom],
              ["Email", selection.email],
              ["Téléphone", selection.telephone],
              ["Rôle", nomRole(selection.role)],
              ["Statut", selection.actif === true ? "Actif" : "Inactif"]
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