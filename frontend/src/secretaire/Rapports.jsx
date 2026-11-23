import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2, X, Save, Download, FileText, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const vide = { titre: "", type: "", date: "", description: "", contenu: "", statut: "Brouillon" };
const types = ["Administratif", "Scolarité", "Inscription", "Effectifs", "Financier", "Autre"];
const statuts = ["Brouillon", "Validé", "Archivé"];
const identifiant = r => r.id ?? r.id_rapport;

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
  if (Array.isArray(resultat?.rapports)) return resultat.rapports;
  if (Array.isArray(resultat?.data)) return resultat.data;
  if (Array.isArray(resultat?.data?.rapports)) return resultat.data.rapports;
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

function Badge({ statut }) {
  const styles = {
    Brouillon: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
    Validé: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Archivé: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[statut] || styles.Brouillon}`}>
      {statut || "Non défini"}
    </span>
  );
}

export default function Rapports() {
  const [rapports, setRapports] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState("Tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [page, setPage] = useState(1);
  const [fenetre, setFenetre] = useState(null);
  const [formulaire, setFormulaire] = useState(vide);
  const [selection, setSelection] = useState(null);
  const taillePage = 8;

  // Contrat API provisoire : adapter aux routes réelles du backend.
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const resultat = await requete("/rapports");
      setRapports(extraireListe(resultat));
    } catch (e) {
      setRapports([]);
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { setPage(1); }, [recherche, filtreType, filtreStatut]);

  const rapportsFiltres = useMemo(() => rapports.filter(r => {
    const texte = `${r.titre || ""} ${r.type || ""} ${r.description || ""}`.toLowerCase();
    return texte.includes(recherche.trim().toLowerCase())
      && (filtreType === "Tous" || r.type === filtreType)
      && (filtreStatut === "Tous" || r.statut === filtreStatut);
  }), [rapports, recherche, filtreType, filtreStatut]);

  const totalPages = Math.max(1, Math.ceil(rapportsFiltres.length / taillePage));
  const pageActive = Math.min(page, totalPages);
  const lignes = rapportsFiltres.slice((pageActive - 1) * taillePage, pageActive * taillePage);

  const ouvrirFormulaire = rapport => {
    setFormulaire(rapport ? {
      id: identifiant(rapport),
      titre: rapport.titre || "",
      type: rapport.type || "",
      date: rapport.date?.slice(0, 10) || "",
      description: rapport.description || "",
      contenu: rapport.contenu || "",
      statut: rapport.statut || "Brouillon"
    } : { ...vide });
    setFenetre("formulaire");
  };

  const enregistrer = async e => {
    e.preventDefault();
    if (!formulaire.titre.trim() || !formulaire.type || !formulaire.date) {
      Swal.fire("Champs obligatoires", "Renseignez le titre, le type et la date.", "warning");
      return;
    }

    const modification = formulaire.id != null;
    const donnees = {
      titre: formulaire.titre.trim(),
      type: formulaire.type,
      date: formulaire.date,
      description: formulaire.description.trim(),
      contenu: formulaire.contenu.trim(),
      statut: formulaire.statut
    };

    setEnCours(true);
    try {
      await requete(modification ? `/rapports/${formulaire.id}` : "/rapports", {
        method: modification ? "PUT" : "POST",
        body: JSON.stringify(donnees)
      });
      setFenetre(null);
      await charger();
      Swal.fire({ icon: "success", title: modification ? "Rapport modifié" : "Rapport créé", timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire("Enregistrement impossible", e.message, "error");
    } finally {
      setEnCours(false);
    }
  };

  const supprimer = async rapport => {
    const id = identifiant(rapport);
    if (id == null) return Swal.fire("Erreur", "Identifiant du rapport manquant.", "error");

    const confirmation = await Swal.fire({
      title: "Supprimer ce rapport ?",
      text: `« ${rapport.titre} » sera supprimé.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#B42318"
    });
    if (!confirmation.isConfirmed) return;

    try {
      await requete(`/rapports/${id}`, { method: "DELETE" });
      await charger();
      Swal.fire({ icon: "success", title: "Rapport supprimé", timer: 1400, showConfirmButton: false });
    } catch (e) {
      Swal.fire("Suppression impossible", e.message, "error");
    }
  };

  const exporter = format => {
    const donnees = rapportsFiltres.map(r => ({
      Titre: r.titre || "",
      Type: r.type || "",
      Date: r.date?.slice(0, 10) || "",
      Statut: r.statut || "",
      Description: r.description || ""
    }));
    if (!donnees.length) return Swal.fire("Aucune donnée", "Aucun rapport à exporter.", "info");
    if (format === "excel") exporterExcel(donnees, "rapports-slg");
    else exporterPDF(donnees, ["Titre", "Type", "Date", "Statut", "Description"], "rapports-slg");
  };

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Rapports administratifs</h1>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A8B7CF]">
            Gestion, consultation et suivi des rapports de l'établissement.
          </p>
        </div>
        <button onClick={() => ouvrirFormulaire(null)}
          className={`${bouton} bg-[#540916] text-white hover:bg-[#701326]`}>
          <Plus size={17}/> Nouveau rapport
        </button>
      </div>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div className="relative min-w-[180px] flex-1 sm:max-w-sm">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
            <input value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher un rapport..." className={`${champ} pl-10`}/>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={filtreType} onChange={e => setFiltreType(e.target.value)} className={`${champ} w-auto`}>
              <option value="Tous">Tous les types</option>
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} className={`${champ} w-auto`}>
              <option value="Tous">Tous les statuts</option>
              {statuts.map(s => <option key={s}>{s}</option>)}
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
                {["Titre du rapport", "Type", "Date", "Statut", "Actions"].map(t => (
                  <th key={t} className="px-5 py-3 font-bold">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAEC] dark:divide-[#263852]">
              {!chargement && !erreur && lignes.map(r => (
                <tr key={identifiant(r)} className="hover:bg-[#FAF8F9] dark:hover:bg-[#1B2C46]">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-[#171717] dark:text-white">{r.titre || "—"}</p>
                    {r.description && <p className="mt-1 max-w-xs truncate text-xs text-[#98A2B3]">{r.description}</p>}
                  </td>
                  <td className="px-5 py-3 text-[#667085] dark:text-[#A8B7CF]">{r.type || "—"}</td>
                  <td className="px-5 py-3 text-[#667085] dark:text-[#A8B7CF]">{r.date?.slice(0, 10) || "—"}</td>
                  <td className="px-5 py-3"><Badge statut={r.statut}/></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Consulter" onClick={() => { setSelection(r); setFenetre("details"); }}
                        className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:hover:bg-[#263852]"><Eye size={17}/></button>
                      <button title="Modifier" onClick={() => ouvrirFormulaire(r)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-[#263852]"><Pencil size={17}/></button>
                      <button title="Supprimer" onClick={() => supprimer(r)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-[#263852]"><Trash2 size={17}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {chargement && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#667085] dark:text-[#A8B7CF]">
              <Loader2 size={19} className="animate-spin"/> Chargement des rapports...
            </div>
          )}
          {!chargement && erreur && (
            <div className="p-10 text-center">
              <AlertCircle size={30} className="mx-auto mb-3 text-red-500"/>
              <p className="text-sm font-semibold text-red-600">Impossible de charger les rapports.</p>
              <p className="mt-2 text-xs text-[#667085] dark:text-[#A8B7CF]">{erreur}</p>
              <button onClick={charger} className={`${bouton} mt-4 bg-[#540916] text-white`}>Réessayer</button>
            </div>
          )}
          {!chargement && !erreur && !lignes.length && (
            <div className="p-12 text-center text-sm text-[#667085] dark:text-[#A8B7CF]">
              Aucun rapport disponible.
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EAE3E5] px-4 py-3 text-xs text-[#667085] dark:border-[#263852] dark:text-[#A8B7CF]">
          <span>{rapportsFiltres.length} rapport(s) · Page {pageActive} / {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={pageActive <= 1} onClick={() => setPage(p => p - 1)}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>Précédent</button>
            <button disabled={pageActive >= totalPages} onClick={() => setPage(p => p + 1)}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>Suivant</button>
          </div>
        </div>
      </section>

      {fenetre === "formulaire" && (
        <Fenetre titre={formulaire.id != null ? "Modifier le rapport" : "Nouveau rapport"}
          fermer={() => !enCours && setFenetre(null)}>
          <form onSubmit={enregistrer} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Champ label="Titre du rapport *">
                <input required value={formulaire.titre} onChange={e => setFormulaire(p => ({ ...p, titre: e.target.value }))}
                  placeholder="Titre du rapport" className={champ}/>
              </Champ>
            </div>
            <Champ label="Type de rapport *">
              <select required value={formulaire.type} onChange={e => setFormulaire(p => ({ ...p, type: e.target.value }))} className={champ}>
                <option value="">Sélectionner...</option>
                {types.map(t => <option key={t}>{t}</option>)}
              </select>
            </Champ>
            <Champ label="Date *">
              <input required type="date" value={formulaire.date}
                onChange={e => setFormulaire(p => ({ ...p, date: e.target.value }))} className={champ}/>
            </Champ>
            <Champ label="Statut">
              <select value={formulaire.statut} onChange={e => setFormulaire(p => ({ ...p, statut: e.target.value }))} className={champ}>
                {statuts.map(s => <option key={s}>{s}</option>)}
              </select>
            </Champ>
            <div className="sm:col-span-2">
              <Champ label="Description">
                <textarea rows={2} value={formulaire.description}
                  onChange={e => setFormulaire(p => ({ ...p, description: e.target.value }))}
                  className={`${champ} resize-none`} placeholder="Description du rapport"/>
              </Champ>
            </div>
            <div className="sm:col-span-2">
              <Champ label="Contenu du rapport">
                <textarea rows={6} value={formulaire.contenu}
                  onChange={e => setFormulaire(p => ({ ...p, contenu: e.target.value }))}
                  className={`${champ} resize-y`} placeholder="Rédiger le contenu du rapport..."/>
              </Champ>
            </div>
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
        <Fenetre titre="Détails du rapport" fermer={() => setFenetre(null)}>
          <div className="space-y-4">
            {[
              ["Titre", selection.titre],
              ["Type", selection.type],
              ["Date", selection.date?.slice(0, 10)],
              ["Statut", selection.statut],
              ["Description", selection.description]
            ].map(([titre, valeur]) => (
              <div key={titre} className="flex justify-between gap-4 border-b border-[#F0EAEC] py-2 text-sm dark:border-[#263852]">
                <span className="text-[#667085] dark:text-[#A8B7CF]">{titre}</span>
                <strong className="max-w-[65%] break-words text-right font-semibold text-[#171717] dark:text-white">{valeur || "—"}</strong>
              </div>
            ))}
            <div>
              <h3 className="mb-2 text-sm font-bold text-[#171717] dark:text-white">Contenu</h3>
              <div className="min-h-28 whitespace-pre-wrap rounded-xl border border-[#EAE3E5] bg-[#F9FAFB] p-4 text-sm leading-6 text-[#344054] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-[#DCE5F3]">
                {selection.contenu || "Aucun contenu renseigné."}
              </div>
            </div>
          </div>
        </Fenetre>
      )}
    </div>
  );
}