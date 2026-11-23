import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Search, Eye, Pencil, Trash2, Download, FileDown, X, FileText } from "lucide-react";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { lireModule, enregistrerModule } from "../services/stockageDemonstration";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors";
const normaliser = v => String(v || "").trim().toLowerCase().replace(/\s+/g, "");
const trimestres = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];
const statuts = ["Brouillon", "Finalisé"];
const colonnes = ["titre", "classe", "trimestre", "date", "statut", "observations"];
const dateFR = v => v ? new Date(`${v}T00:00:00`).toLocaleDateString("fr-FR") : "—";

function Fenetre({ titre, fermer, children }) {
  useEffect(() => {
    const touche = e => { if (e.key === "Escape") fermer(); };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [fermer]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" onMouseDown={e => e.target === e.currentTarget && fermer()}>
      <div role="dialog" aria-modal="true" aria-label={titre} className={`${carte} max-h-[92dvh] w-full max-w-2xl overflow-y-auto`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EAE3E5] bg-white px-5 py-4 dark:border-[#263852] dark:bg-[#14243D]">
          <h2 className={`text-lg font-bold ${texte}`}>{titre}</h2>
          <button type="button" onClick={fermer} aria-label="Fermer" className={`rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#263852] ${texte}`}><X size={19} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function RapportsPedagogiques() {
  const { utilisateur } = utiliserAuthentification();
  const classe = utilisateur?.classe || "";
  const [lignes, definirLignes] = useState([]);
  const [recherche, definirRecherche] = useState("");
  const [filtreTrimestre, definirFiltreTrimestre] = useState("");
  const [filtreStatut, definirFiltreStatut] = useState("");
  const [page, definirPage] = useState(1);
  const [formulaire, definirFormulaire] = useState(null);
  const [selection, definirSelection] = useState(null);

  useEffect(() => {
    const charger = () => definirLignes(lireModule("rapports-pedagogiques"));
    charger();
    window.addEventListener("storage", charger);
    window.addEventListener("focus", charger);
    return () => {
      window.removeEventListener("storage", charger);
      window.removeEventListener("focus", charger);
    };
  }, []);

  const rapports = useMemo(() => lignes.filter(r =>
    normaliser(r.classe) === normaliser(classe)
  ), [lignes, classe]);

  const donnees = useMemo(() => rapports.filter(r => {
    const correspond = [r.titre, r.observations, r.date].some(v =>
      String(v || "").toLowerCase().includes(recherche.trim().toLowerCase())
    );
    return correspond && (!filtreTrimestre || r.trimestre === filtreTrimestre) &&
      (!filtreStatut || r.statut === filtreStatut);
  }).sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))), [rapports, recherche, filtreTrimestre, filtreStatut]);

  const pages = Math.max(1, Math.ceil(donnees.length / 10));
  const pageActive = Math.min(page, pages);
  const visibles = donnees.slice((pageActive - 1) * 10, pageActive * 10);

  const enregistrer = valeurs => {
    enregistrerModule("rapports-pedagogiques", valeurs);
    definirLignes(valeurs);
  };

  const ouvrir = ligne => definirFormulaire(ligne ? { ...ligne } : {
    titre: "", classe, trimestre: "Trimestre 1",
    date: new Date().toLocaleDateString("en-CA"),
    statut: "Brouillon", observations: "", recommandations: ""
  });

  const changer = (cle, valeur) => definirFormulaire(f => ({ ...f, [cle]: valeur }));

  const soumettre = e => {
    e.preventDefault();
    if (!classe) return Swal.fire("Classe non attribuée", "Contactez l'administration.", "warning");
    if (!formulaire.titre.trim() || !formulaire.date || !formulaire.observations.trim()) {
      return Swal.fire("Champs obligatoires", "Complétez le titre, la date et les observations.", "warning");
    }

    const rapport = {
      ...formulaire, titre: formulaire.titre.trim(),
      observations: formulaire.observations.trim(),
      recommandations: formulaire.recommandations.trim(),
      classe
    };

    const valeurs = rapport.id
      ? lignes.map(r => r.id === rapport.id && normaliser(r.classe) === normaliser(classe) ? rapport : r)
      : [{ ...rapport, id: crypto.randomUUID() }, ...lignes];

    enregistrer(valeurs);
    definirFormulaire(null);
    definirPage(1);
    Swal.fire({ icon: "success", title: "Rapport enregistré", timer: 1200, showConfirmButton: false });
  };

  const supprimer = async rapport => {
    const resultat = await Swal.fire({
      title: "Supprimer ce rapport ?", text: rapport.titre,
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Supprimer", cancelButtonText: "Annuler",
      confirmButtonColor: "#B42318"
    });
    if (!resultat.isConfirmed) return;
    enregistrer(lignes.filter(r => !(r.id === rapport.id && normaliser(r.classe) === normaliser(classe))));
    definirPage(1);
    Swal.fire({ icon: "success", title: "Rapport supprimé", timer: 1200, showConfirmButton: false });
  };

  const exportDonnees = donnees.map(r => ({
    titre: r.titre, classe: r.classe, trimestre: r.trimestre,
    date: dateFR(r.date), statut: r.statut, observations: r.observations
  }));

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${texte}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Rapports pédagogiques</h1>
          <p className={`mt-1 text-sm ${secondaire}`}>Suivi pédagogique · Classe {classe || "non attribuée"}</p>
        </div>
        <button type="button" disabled={!classe} onClick={() => ouvrir(null)}
          className={`${bouton} bg-[#540916] text-white hover:bg-[#400711] disabled:opacity-40`}>
          <Plus size={17} /> Ajouter un rapport
        </button>
      </header>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div>
            <h2 className={`text-base font-bold ${texte}`}>Liste des rapports</h2>
            <p className={`mt-1 text-xs ${secondaire}`}>{donnees.length} rapport(s)</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => exporterExcel(exportDonnees, `rapports-${classe}`)}
              className={`${bouton} border border-[#E4E7EC] ${texte} dark:border-[#33445E]`}>
              <Download size={16} /> Excel
            </button>
            <button type="button" onClick={() => exporterPDF(exportDonnees, colonnes, `rapports-${classe}`)}
              className={`${bouton} border border-[#E4E7EC] ${texte} dark:border-[#33445E]`}>
              <FileDown size={16} /> PDF
            </button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-3 p-3 md:grid-cols-3">
          <label className="relative">
            <Search size={17} className="absolute left-3 top-3 text-[#98A2B3]" />
            <input value={recherche} onChange={e => { definirRecherche(e.target.value); definirPage(1); }}
              placeholder="Rechercher un rapport..." className={`${champ} pl-10`} />
          </label>
          <select aria-label="Filtrer par trimestre" value={filtreTrimestre}
            onChange={e => { definirFiltreTrimestre(e.target.value); definirPage(1); }} className={champ}>
            <option value="">Tous les trimestres</option>
            {trimestres.map(t => <option key={t}>{t}</option>)}
          </select>
          <select aria-label="Filtrer par statut" value={filtreStatut}
            onChange={e => { definirFiltreStatut(e.target.value); definirPage(1); }} className={champ}>
            <option value="">Tous les statuts</option>
            {statuts.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] shadow-sm dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                {["N°", "Titre du rapport", "Trimestre", "Date", "Statut", "Actions"].map(t =>
                  <th key={t} className="px-4 py-3 font-semibold">{t}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {visibles.map((r, i) => (
                <tr key={r.id || i} className="border-t border-[#EEF0F3] hover:bg-[#F8F9FC] dark:border-[#263852] dark:hover:bg-[#1B2C47]">
                  <td className={`px-4 py-3 ${secondaire}`}>{(pageActive - 1) * 10 + i + 1}</td>
                  <td className={`px-4 py-3 font-semibold ${texte}`}>{r.titre}</td>
                  <td className={`px-4 py-3 ${texte}`}>{r.trimestre}</td>
                  <td className={`px-4 py-3 ${texte}`}>{dateFR(r.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      r.statut === "Finalisé"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}>{r.statut || "Brouillon"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button type="button" title="Détails" onClick={() => definirSelection(r)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-300"><Eye size={17} /></button>
                      <button type="button" title="Modifier" onClick={() => ouvrir(r)}
                        className="rounded-lg p-2 text-[#540916] hover:bg-red-50 dark:text-[#F3A5BC]"><Pencil size={17} /></button>
                      <button type="button" title="Supprimer" onClick={() => supprimer(r)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibles.length && (
                <tr><td colSpan={6} className={`px-4 py-12 text-center ${secondaire}`}>
                  <FileText size={30} className="mx-auto mb-3 opacity-40" />
                  Aucun rapport pédagogique enregistré ou trouvé.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-[#EAE3E5] p-3 dark:border-[#263852]">
          <span className={`text-xs ${secondaire}`}>Page {pageActive} / {pages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={pageActive <= 1} onClick={() => definirPage(p => Math.max(1, p - 1))}
              className={`${bouton} border border-[#E4E7EC] disabled:opacity-40 dark:border-[#33445E] dark:text-white`}>Précédent</button>
            <button type="button" disabled={pageActive >= pages} onClick={() => definirPage(p => Math.min(pages, p + 1))}
              className={`${bouton} border border-[#E4E7EC] disabled:opacity-40 dark:border-[#33445E] dark:text-white`}>Suivant</button>
          </div>
        </div>
      </section>

      {formulaire && (
        <Fenetre titre={formulaire.id ? "Modifier un rapport" : "Ajouter un rapport"} fermer={() => definirFormulaire(null)}>
          <form onSubmit={soumettre} className="space-y-4 p-5">
            <label className="block">
              <span className={`mb-1 block text-xs font-semibold ${texte}`}>Titre du rapport *</span>
              <input required value={formulaire.titre} onChange={e => changer("titre", e.target.value)}
                placeholder="Ex. Rapport pédagogique du premier trimestre" className={champ} />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={`mb-1 block text-xs font-semibold ${texte}`}>Classe</span>
                <input value={classe} readOnly className={`${champ} opacity-70`} />
              </label>
              <label>
                <span className={`mb-1 block text-xs font-semibold ${texte}`}>Trimestre *</span>
                <select value={formulaire.trimestre} onChange={e => changer("trimestre", e.target.value)} className={champ}>
                  {trimestres.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>
                <span className={`mb-1 block text-xs font-semibold ${texte}`}>Date *</span>
                <input type="date" required value={formulaire.date} onChange={e => changer("date", e.target.value)} className={champ} />
              </label>
              <label>
                <span className={`mb-1 block text-xs font-semibold ${texte}`}>Statut</span>
                <select value={formulaire.statut} onChange={e => changer("statut", e.target.value)} className={champ}>
                  {statuts.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>

            <label className="block">
              <span className={`mb-1 block text-xs font-semibold ${texte}`}>Observations pédagogiques *</span>
              <textarea required rows={4} value={formulaire.observations}
                onChange={e => changer("observations", e.target.value)}
                placeholder="Décrivez la progression pédagogique, les difficultés rencontrées et les résultats observés..."
                className={`${champ} resize-y`} />
            </label>

            <label className="block">
              <span className={`mb-1 block text-xs font-semibold ${texte}`}>Recommandations</span>
              <textarea rows={3} value={formulaire.recommandations}
                onChange={e => changer("recommandations", e.target.value)}
                placeholder="Actions proposées pour améliorer les résultats..."
                className={`${champ} resize-y`} />
            </label>

            <div className="flex justify-end gap-2 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
              <button type="button" onClick={() => definirFormulaire(null)}
                className={`${bouton} border border-[#E4E7EC] ${texte} dark:border-[#33445E]`}>Annuler</button>
              <button type="submit" className={`${bouton} bg-[#540916] px-5 text-white`}>Enregistrer</button>
            </div>
          </form>
        </Fenetre>
      )}

      {selection && (
        <Fenetre titre="Détails du rapport pédagogique" fermer={() => definirSelection(null)}>
          <div className="space-y-3 p-5">
            {[
              ["Titre", selection.titre],
              ["Classe", selection.classe],
              ["Trimestre", selection.trimestre],
              ["Date", dateFR(selection.date)],
              ["Statut", selection.statut],
              ["Observations pédagogiques", selection.observations],
              ["Recommandations", selection.recommandations || "Aucune"]
            ].map(([label, valeur]) => (
              <div key={label} className="rounded-xl bg-[#F8F9FC] p-3 dark:bg-[#0B172B]">
                <p className={`text-xs ${secondaire}`}>{label}</p>
                <p className={`mt-1 whitespace-pre-wrap text-sm font-semibold ${texte}`}>{valeur ?? "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-[#EAE3E5] p-4 dark:border-[#263852]">
            <button type="button" onClick={() => definirSelection(null)}
              className={`${bouton} bg-[#540916] px-5 text-white`}>Fermer</button>
          </div>
        </Fenetre>
      )}
    </div>
  );
}