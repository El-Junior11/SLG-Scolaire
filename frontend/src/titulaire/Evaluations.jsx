import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Search, Eye, Pencil, Trash2, Download, FileDown, X, ClipboardList } from "lucide-react";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { lireModule, enregistrerModule } from "../services/stockageDemonstration";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const champ = "w-full min-w-0 rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white dark:focus:border-[#60A5FA]";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors";
const normaliser = v => String(v || "").trim().toLowerCase().replace(/\s+/g, "");
const vide = { titre: "", matiere: "", date: "", coefficient: 1, bareme: 20 };
const colonnes = ["titre", "matiere", "classe", "date", "coefficient", "bareme"];
const dateFR = v => v ? new Date(`${v}T00:00:00`).toLocaleDateString("fr-FR") : "—";

function Fenetre({ titre, fermer, children }) {
  useEffect(() => {
    const touche = e => { if (e.key === "Escape") fermer(); };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [fermer]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" onMouseDown={e => e.target === e.currentTarget && fermer()}>
      <div role="dialog" aria-modal="true" aria-label={titre} className={`${carte} max-h-[92dvh] w-full max-w-xl overflow-y-auto`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EAE3E5] bg-white px-5 py-4 dark:border-[#263852] dark:bg-[#14243D]">
          <h2 className={`text-lg font-bold ${texte}`}>{titre}</h2>
          <button type="button" onClick={fermer} aria-label="Fermer" className={`rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#263852] ${texte}`}><X size={19} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Evaluations() {
  const { utilisateur } = utiliserAuthentification();
  const classe = utilisateur?.classe || "";
  const [lignes, definirLignes] = useState([]);
  const [matieres, definirMatieres] = useState([]);
  const [recherche, definirRecherche] = useState("");
  const [filtreMatiere, definirFiltreMatiere] = useState("");
  const [page, definirPage] = useState(1);
  const [formulaire, definirFormulaire] = useState(null);
  const [selection, definirSelection] = useState(null);

  useEffect(() => {
    const charger = () => {
      definirLignes(lireModule("evaluations"));
      definirMatieres(lireModule("matieres").filter(m => normaliser(m.classe) === normaliser(classe)));
    };
    charger();
    window.addEventListener("storage", charger);
    window.addEventListener("focus", charger);
    return () => {
      window.removeEventListener("storage", charger);
      window.removeEventListener("focus", charger);
    };
  }, [classe]);

  const evaluations = useMemo(() => lignes.filter(e => normaliser(e.classe) === normaliser(classe)), [lignes, classe]);
  const donnees = useMemo(() => evaluations.filter(e => {
    const correspond = [e.titre, e.matiere, e.date].some(v => String(v || "").toLowerCase().includes(recherche.trim().toLowerCase()));
    return correspond && (!filtreMatiere || e.matiere === filtreMatiere);
  }).sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))), [evaluations, recherche, filtreMatiere]);

  const pages = Math.max(1, Math.ceil(donnees.length / 10));
  const pageActive = Math.min(page, pages);
  const visibles = donnees.slice((pageActive - 1) * 10, pageActive * 10);

  const enregistrer = valeurs => { enregistrerModule("evaluations", valeurs); definirLignes(valeurs); };
  const ouvrir = ligne => definirFormulaire(ligne ? { ...ligne } : { ...vide, classe });
  const changer = (cle, valeur) => definirFormulaire(v => ({ ...v, [cle]: valeur }));

  const soumettre = e => {
    e.preventDefault();
    if (!classe) return Swal.fire("Classe non attribuée", "Contactez l'administration.", "warning");
    const matiere = matieres.find(m => m.nom === formulaire.matiere);
    if (!matiere) return Swal.fire("Matière invalide", "Sélectionnez une matière de votre classe.", "warning");

    const coefficient = Number(formulaire.coefficient);
    const bareme = Number(formulaire.bareme);
    if (!formulaire.titre.trim() || !formulaire.date || !Number.isFinite(coefficient) || coefficient <= 0 || !Number.isFinite(bareme) || bareme <= 0) {
      return Swal.fire("Données invalides", "Vérifiez le titre, la date, le coefficient et le barème.", "warning");
    }

    const ligne = { ...formulaire, titre: formulaire.titre.trim(), classe, coefficient, bareme };
    const valeurs = ligne.id ? lignes.map(x => x.id === ligne.id && normaliser(x.classe) === normaliser(classe) ? ligne : x) : [{ ...ligne, id: crypto.randomUUID() }, ...lignes];
    enregistrer(valeurs);
    definirFormulaire(null);
    definirPage(1);
    Swal.fire({ icon: "success", title: "Évaluation enregistrée", timer: 1200, showConfirmButton: false });
  };

  const supprimer = async ligne => {
    const resultat = await Swal.fire({
      title: "Supprimer cette évaluation ?",
      text: ligne.titre,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#B42318"
    });
    if (!resultat.isConfirmed) return;
    enregistrer(lignes.filter(x => !(x.id === ligne.id && normaliser(x.classe) === normaliser(classe))));
    definirPage(1);
    Swal.fire({ icon: "success", title: "Évaluation supprimée", timer: 1200, showConfirmButton: false });
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 lg:h-[calc(100dvh-145px)] lg:min-h-[420px]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${texte}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Évaluations</h1>
          <p className={`mt-1 text-sm ${secondaire}`}>Gestion des évaluations · Classe {classe || "non attribuée"}</p>
        </div>
        <button type="button" disabled={!classe || !matieres.length} onClick={() => ouvrir(null)}
          className={`${bouton} bg-[#540916] text-white hover:bg-[#400711] dark:bg-[#29446D] dark:hover:bg-[#365582] disabled:cursor-not-allowed disabled:opacity-50`}>
          <Plus size={17} /> Ajouter une évaluation
        </button>
      </header>

      <section className={`${carte} flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div>
            <h2 className={`text-base font-bold ${texte}`}>Liste des évaluations</h2>
            <p className={`mt-1 text-xs ${secondaire}`}>{donnees.length} résultat(s)</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => exporterExcel(donnees, `evaluations-${classe}`)}
              className={`${bouton} border border-[#E4E7EC] ${texte} hover:bg-gray-50 dark:border-[#33445E] dark:hover:bg-[#1D304C]`}>
              <Download size={16} /> Excel
            </button>
            <button type="button" onClick={() => exporterPDF(donnees, colonnes, `evaluations-${classe}`)}
              className={`${bouton} border border-[#E4E7EC] ${texte} hover:bg-gray-50 dark:border-[#33445E] dark:hover:bg-[#1D304C]`}>
              <FileDown size={16} /> PDF
            </button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-3 p-3 md:grid-cols-2">
          <label className="relative">
            <Search size={17} className="absolute left-3 top-3 text-[#98A2B3]" />
            <input value={recherche} onChange={e => { definirRecherche(e.target.value); definirPage(1); }}
              placeholder="Rechercher une évaluation..." className={`${champ} pl-10`} />
          </label>
          <select aria-label="Filtrer par matière" value={filtreMatiere}
            onChange={e => { definirFiltreMatiere(e.target.value); definirPage(1); }} className={champ}>
            <option value="">Toutes les matières</option>
            {matieres.map(m => <option key={m.id || m.nom} value={m.nom}>{m.nom}</option>)}
          </select>
        </div>

        <div className="min-h-0 min-w-0 max-h-[272px] overflow-auto overscroll-contain">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] shadow-sm dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                {["N°", "Évaluation", "Matière", "Date", "Coefficient", "Barème"].map(t => (
                  <th key={t} scope="col" className="h-12 whitespace-nowrap border-b border-[#EAE3E5] px-3 py-2 font-semibold dark:border-[#263852]">{t}</th>
                ))}
                <th scope="col" className="sticky right-0 z-20 h-12 w-[120px] whitespace-nowrap border-b border-[#EAE3E5] bg-[#F8F9FC] px-3 text-right font-semibold dark:border-[#263852] dark:bg-[#0B172B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((ligne, i) => (
                <tr key={ligne.id} className="group h-14 hover:bg-[#F8F9FC] dark:hover:bg-[#1B2C47]">
                  <td className={`whitespace-nowrap border-b border-[#EEF0F3] px-3 py-2 dark:border-[#263852] ${secondaire}`}>{(pageActive - 1) * 10 + i + 1}</td>
                  <td className={`whitespace-nowrap border-b border-[#EEF0F3] px-3 py-2 font-semibold dark:border-[#263852] ${texte}`}>{ligne.titre}</td>
                  <td className={`whitespace-nowrap border-b border-[#EEF0F3] px-3 py-2 dark:border-[#263852] ${texte}`}>{ligne.matiere}</td>
                  <td className={`whitespace-nowrap border-b border-[#EEF0F3] px-3 py-2 dark:border-[#263852] ${texte}`}>{dateFR(ligne.date)}</td>
                  <td className={`whitespace-nowrap border-b border-[#EEF0F3] px-3 py-2 dark:border-[#263852] ${texte}`}>{ligne.coefficient}</td>
                  <td className={`whitespace-nowrap border-b border-[#EEF0F3] px-3 py-2 dark:border-[#263852] ${texte}`}>{ligne.bareme}</td>
                  <td className="sticky right-0 z-[1] w-[120px] whitespace-nowrap border-b border-[#EEF0F3] bg-white px-3 py-2 group-hover:bg-[#F8F9FC] dark:border-[#263852] dark:bg-[#14243D] dark:group-hover:bg-[#1B2C47]">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" title="Détails" onClick={() => definirSelection(ligne)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-white/10"><Eye size={17} /></button>
                      <button type="button" title="Modifier" onClick={() => ouvrir(ligne)} className="rounded-lg p-2 text-[#540916] hover:bg-red-50 dark:text-[#93C5FD] dark:hover:bg-white/10"><Pencil size={17} /></button>
                      <button type="button" title="Supprimer" onClick={() => supprimer(ligne)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-[#A8B7CF] dark:hover:bg-white/10"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibles.length && (
                <tr><td colSpan={7} className={`px-4 py-12 text-center ${secondaire}`}>
                  <ClipboardList size={30} className="mx-auto mb-3 opacity-40" />
                  Aucune évaluation enregistrée ou trouvée.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#EAE3E5] bg-white p-3 dark:border-[#263852] dark:bg-[#14243D]">
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
        <Fenetre titre={formulaire.id ? "Modifier une évaluation" : "Ajouter une évaluation"} fermer={() => definirFormulaire(null)}>
          <form onSubmit={soumettre} className="space-y-4 p-5">
            <label className="block">
              <span className={`mb-1.5 block text-xs font-semibold ${texte}`}>Titre de l'évaluation *</span>
              <input required value={formulaire.titre} onChange={e => changer("titre", e.target.value)}
                placeholder="Ex. Composition 1" className={champ} />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={`mb-1.5 block text-xs font-semibold ${texte}`}>Matière *</span>
                <select required value={formulaire.matiere} onChange={e => changer("matiere", e.target.value)} className={champ}>
                  <option value="">Sélectionner une matière</option>
                  {matieres.map(m => <option key={m.id || m.nom} value={m.nom}>{m.nom}</option>)}
                </select>
              </label>
              <label className="block">
                <span className={`mb-1.5 block text-xs font-semibold ${texte}`}>Classe</span>
                <input value={classe} readOnly className={`${champ} cursor-not-allowed opacity-70`} />
              </label>
              <label className="block">
                <span className={`mb-1.5 block text-xs font-semibold ${texte}`}>Date *</span>
                <input type="date" required value={formulaire.date} onChange={e => changer("date", e.target.value)} className={champ} />
              </label>
              <label className="block">
                <span className={`mb-1.5 block text-xs font-semibold ${texte}`}>Coefficient *</span>
                <input type="number" min="0.1" step="0.1" required value={formulaire.coefficient}
                  onChange={e => changer("coefficient", e.target.value)} className={champ} />
              </label>
              <label className="block">
                <span className={`mb-1.5 block text-xs font-semibold ${texte}`}>Barème *</span>
                <input type="number" min="1" step="0.5" required value={formulaire.bareme}
                  onChange={e => changer("bareme", e.target.value)} className={champ} />
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
              <button type="button" onClick={() => definirFormulaire(null)} className={`${bouton} border border-[#E4E7EC] ${texte} dark:border-[#33445E]`}>Annuler</button>
              <button type="submit" className={`${bouton} bg-[#540916] px-5 text-white hover:bg-[#400711] dark:bg-[#29446D] dark:hover:bg-[#365582]`}>Enregistrer</button>
            </div>
          </form>
        </Fenetre>
      )}

      {selection && (
        <Fenetre titre="Détails de l'évaluation" fermer={() => definirSelection(null)}>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
            {[
              ["Évaluation", selection.titre],
              ["Matière", selection.matiere],
              ["Classe", selection.classe],
              ["Date", dateFR(selection.date)],
              ["Coefficient", selection.coefficient],
              ["Barème", selection.bareme]
            ].map(([label, valeur]) => (
              <div key={label} className="rounded-xl bg-[#F8F9FC] p-3 dark:bg-[#0B172B]">
                <p className={`text-xs ${secondaire}`}>{label}</p>
                <p className={`mt-1 text-sm font-semibold ${texte}`}>{valeur ?? "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-[#EAE3E5] p-4 dark:border-[#263852]">
            <button type="button" onClick={() => definirSelection(null)} className={`${bouton} bg-[#540916] px-5 text-white dark:bg-[#29446D]`}>Fermer</button>
          </div>
        </Fenetre>
      )}
    </div>
  );
}