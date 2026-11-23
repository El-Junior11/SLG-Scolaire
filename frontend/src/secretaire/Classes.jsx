import { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Eye, X, Save, Download, FileText, RefreshCw, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const cycles = ["Primaire", "Collège", "Lycée"];
const couleurs = {
  Primaire: "bg-[#EAF0F8] text-[#172B50] dark:bg-[#172B50]/40 dark:text-[#B9D2FF]",
  Collège: "bg-[#FCECF2] text-[#B84D77] dark:bg-[#D9799A]/20 dark:text-[#F5A9C5]",
  Lycée: "bg-[#E8F6EE] text-[#26865B] dark:bg-[#26865B]/20 dark:text-[#8FE0B2]"
};
const vide = { nom: "", cycle: "", niveau: "", capacite: "", description: "" };
const identifiant = c => c.id ?? c.id_classe;

async function requete(chemin, options = {}) {
  const reponse = await fetch(`${API}${chemin}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include"
  });
  if (!reponse.ok) {
    const erreur = await reponse.json().catch(() => ({}));
    throw new Error(erreur.message || erreur.error || `Erreur HTTP ${reponse.status}`);
  }
  if (reponse.status === 204) return null;
  return reponse.json();
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
      <div className={`${carte} flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-[#EAE3E5] px-5 py-4 dark:border-[#263852]">
          <h2 className="text-lg font-bold text-[#171717] dark:text-white">{titre}</h2>
          <button type="button" onClick={fermer} className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:hover:bg-[#263852]"><X size={19}/></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [cycle, setCycle] = useState("Tous");
  const [page, setPage] = useState(1);
  const [fenetre, setFenetre] = useState(null);
  const [formulaire, setFormulaire] = useState(vide);
  const [selection, setSelection] = useState(null);
  const taillePage = 8;

  // Contrat API provisoire : à adapter aux routes réelles du backend.
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const resultat = await requete("/classes");
      const donnees = Array.isArray(resultat) ? resultat : resultat?.data || resultat?.classes;
      if (!Array.isArray(donnees)) throw new Error("Format de réponse API invalide.");
      setClasses(donnees);
    } catch (e) {
      setClasses([]);
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const classesFiltrees = useMemo(() => classes.filter(c => {
    const texte = `${c.nom || ""} ${c.cycle || ""} ${c.niveau || ""}`.toLowerCase();
    return texte.includes(recherche.trim().toLowerCase()) && (cycle === "Tous" || c.cycle === cycle);
  }), [classes, recherche, cycle]);

  const totalPages = Math.max(1, Math.ceil(classesFiltrees.length / taillePage));
  const lignes = classesFiltrees.slice((Math.min(page, totalPages) - 1) * taillePage, Math.min(page, totalPages) * taillePage);

  useEffect(() => setPage(1), [recherche, cycle]);

  const ouvrirFormulaire = c => {
    setFormulaire(c ? {
      id: identifiant(c), nom: c.nom || "", cycle: c.cycle || "",
      niveau: c.niveau || "", capacite: c.capacite ?? "", description: c.description || ""
    } : { ...vide });
    setFenetre("formulaire");
  };

  const enregistrer = async e => {
    e.preventDefault();
    if (!formulaire.nom.trim() || !formulaire.cycle || !formulaire.niveau.trim()) {
      Swal.fire("Champs obligatoires", "Renseignez le nom, le cycle et le niveau.", "warning");
      return;
    }
    if (formulaire.capacite !== "" && (!Number.isInteger(Number(formulaire.capacite)) || Number(formulaire.capacite) < 1)) {
      Swal.fire("Capacité invalide", "La capacité doit être un entier positif.", "warning");
      return;
    }

    const modification = formulaire.id != null;
    const donnees = {
      nom: formulaire.nom.trim(),
      cycle: formulaire.cycle,
      niveau: formulaire.niveau.trim(),
      capacite: formulaire.capacite === "" ? null : Number(formulaire.capacite),
      description: formulaire.description.trim()
    };

    setEnCours(true);
    try {
      await requete(modification ? `/classes/${formulaire.id}` : "/classes", {
        method: modification ? "PUT" : "POST",
        body: JSON.stringify(donnees)
      });
      setFenetre(null);
      await charger();
      Swal.fire({ icon: "success", title: modification ? "Classe modifiée" : "Classe ajoutée", timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire("Erreur", e.message, "error");
    } finally {
      setEnCours(false);
    }
  };

  const supprimer = async c => {
    const id = identifiant(c);
    if (id == null) return Swal.fire("Erreur", "Identifiant de classe manquant.", "error");

    const confirmation = await Swal.fire({
      title: "Supprimer cette classe ?",
      text: `Voulez-vous supprimer « ${c.nom} » ?`,
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Supprimer", cancelButtonText: "Annuler",
      confirmButtonColor: "#B42318"
    });
    if (!confirmation.isConfirmed) return;

    try {
      await requete(`/classes/${id}`, { method: "DELETE" });
      await charger();
      Swal.fire({ icon: "success", title: "Classe supprimée", timer: 1400, showConfirmButton: false });
    } catch (e) {
      Swal.fire("Suppression impossible", e.message, "error");
    }
  };

  const exporter = type => {
    const donnees = classesFiltrees.map(c => ({
      Classe: c.nom || "",
      Cycle: c.cycle || "",
      Niveau: c.niveau || "",
      Capacité: c.capacite ?? "",
      Description: c.description || ""
    }));
    if (!donnees.length) return Swal.fire("Aucune donnée", "Aucune classe à exporter.", "info");
    if (type === "excel") exporterExcel(donnees, "classes-slg");
    else exporterPDF(donnees, ["Classe", "Cycle", "Niveau", "Capacité", "Description"], "classes-slg");
  };

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Classes</h1>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A8B7CF]">Gestion des classes et des niveaux scolaires.</p>
        </div>
        <button onClick={() => ouvrirFormulaire(null)} className={`${bouton} bg-[#540916] text-white hover:bg-[#701326]`}>
          <Plus size={17}/> Nouvelle classe
        </button>
      </div>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div className="relative min-w-[180px] flex-1 sm:max-w-sm">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher une classe..."
              className={`${champ} pl-10`}/>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={cycle} onChange={e => setCycle(e.target.value)} className={`${champ} w-auto`}>
              <option value="Tous">Tous les cycles</option>
              {cycles.map(c => <option key={c}>{c}</option>)}
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

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                {["Classe", "Cycle", "Niveau", "Capacité", "Actions"].map(t => <th key={t} className="px-5 py-3 font-bold">{t}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAEC] dark:divide-[#263852]">
              {!chargement && lignes.map(c => (
                <tr key={identifiant(c)} className="hover:bg-[#FAF8F9] dark:hover:bg-[#1B2C46]">
                  <td className="px-5 py-3 font-bold text-[#171717] dark:text-white">{c.nom || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${couleurs[c.cycle] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white"}`}>
                      {c.cycle || "Non défini"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#667085] dark:text-[#A8B7CF]">{c.niveau || "—"}</td>
                  <td className="px-5 py-3 text-[#667085] dark:text-[#A8B7CF]">{c.capacite ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Détails" onClick={() => { setSelection(c); setFenetre("details"); }}
                        className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:hover:bg-[#263852]"><Eye size={17}/></button>
                      <button title="Modifier" onClick={() => ouvrirFormulaire(c)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-[#263852]"><Pencil size={17}/></button>
                      <button title="Supprimer" onClick={() => supprimer(c)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-[#263852]"><Trash2 size={17}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {chargement && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#667085] dark:text-[#A8B7CF]">
              <Loader2 size={19} className="animate-spin"/> Chargement des classes...
            </div>
          )}
          {!chargement && erreur && (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-red-600">Impossible de charger les classes.</p>
              <p className="mt-2 text-xs text-[#667085] dark:text-[#A8B7CF]">{erreur}</p>
              <button onClick={charger} className={`${bouton} mt-4 bg-[#540916] text-white`}>Réessayer</button>
            </div>
          )}
          {!chargement && !erreur && !lignes.length && (
            <div className="p-12 text-center text-sm text-[#667085] dark:text-[#A8B7CF]">
              Aucune classe disponible.
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EAE3E5] px-4 py-3 text-xs text-[#667085] dark:border-[#263852] dark:text-[#A8B7CF]">
          <span>{classesFiltrees.length} classe(s) · Page {Math.min(page, totalPages)} / {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>Précédent</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>Suivant</button>
          </div>
        </div>
      </section>

      {fenetre === "formulaire" && (
        <Fenetre titre={formulaire.id != null ? "Modifier la classe" : "Nouvelle classe"} fermer={() => !enCours && setFenetre(null)}>
          <form onSubmit={enregistrer} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">Nom de la classe *</span>
              <input required value={formulaire.nom} onChange={e => setFormulaire(p => ({ ...p, nom: e.target.value }))}
                placeholder="Nom de la classe" className={champ}/>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">Cycle scolaire *</span>
                <select required value={formulaire.cycle} onChange={e => setFormulaire(p => ({ ...p, cycle: e.target.value }))} className={champ}>
                  <option value="">Sélectionner...</option>
                  {cycles.map(c => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">Niveau *</span>
                <input required value={formulaire.niveau} onChange={e => setFormulaire(p => ({ ...p, niveau: e.target.value }))}
                  placeholder="Niveau scolaire" className={champ}/>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">Capacité maximale</span>
                <input type="number" min="1" step="1" value={formulaire.capacite}
                  onChange={e => setFormulaire(p => ({ ...p, capacite: e.target.value }))} className={champ}/>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">Description</span>
              <textarea rows={3} value={formulaire.description}
                onChange={e => setFormulaire(p => ({ ...p, description: e.target.value }))} className={`${champ} resize-none`}/>
            </label>

            <div className="flex justify-end gap-2 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
              <button type="button" disabled={enCours} onClick={() => setFenetre(null)}
                className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>Annuler</button>
              <button type="submit" disabled={enCours} className={`${bouton} bg-[#540916] px-5 text-white hover:bg-[#701326]`}>
                {enCours ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                Enregistrer
              </button>
            </div>
          </form>
        </Fenetre>
      )}

      {fenetre === "details" && selection && (
        <Fenetre titre="Détails de la classe" fermer={() => setFenetre(null)}>
          <div className="space-y-3">
            {[
              ["Classe", selection.nom],
              ["Cycle", selection.cycle],
              ["Niveau", selection.niveau],
              ["Capacité", selection.capacite ?? "Non renseignée"],
              ["Description", selection.description || "Non renseignée"]
            ].map(([titre, valeur]) => (
              <div key={titre} className="flex justify-between gap-4 border-b border-[#F0EAEC] py-2 text-sm dark:border-[#263852]">
                <span className="text-[#667085] dark:text-[#A8B7CF]">{titre}</span>
                <strong className="max-w-[65%] text-right font-semibold text-[#171717] dark:text-white">{valeur || "—"}</strong>
              </div>
            ))}
          </div>
        </Fenetre>
      )}
    </div>
  );
}