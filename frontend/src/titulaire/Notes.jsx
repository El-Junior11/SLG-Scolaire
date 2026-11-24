import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Search, Eye, Pencil, Trash2, Download, FileDown, X, Save, ClipboardList } from "lucide-react";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { lireModule, enregistrerModule } from "../services/stockageDemonstration";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const champ = "w-full min-w-0 rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white dark:focus:border-[#60A5FA]";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors";
const normaliser = v => String(v || "").trim().toLowerCase().replace(/\s+/g, "");
const nomEleve = e => `${e.nom || ""} ${e.prenom || ""}`.trim();
const trimestres = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];
const colonnes = ["eleve", "matiere", "evaluation", "note", "bareme", "trimestre"];

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

export default function Notes() {
  const { utilisateur } = utiliserAuthentification();
  const classe = utilisateur?.classe || "";
  const [lignes, definirLignes] = useState([]);
  const [eleves, definirEleves] = useState([]);
  const [matieres, definirMatieres] = useState([]);
  const [evaluations, definirEvaluations] = useState([]);
  const [recherche, definirRecherche] = useState("");
  const [filtreMatiere, definirFiltreMatiere] = useState("");
  const [trimestre, definirTrimestre] = useState("Trimestre 1");
  const [page, definirPage] = useState(1);
  const [formulaire, definirFormulaire] = useState(null);
  const [selection, definirSelection] = useState(null);
  const [collective, definirCollective] = useState(false);
  const [matiereCollective, definirMatiereCollective] = useState("");
  const [evaluationCollective, definirEvaluationCollective] = useState("");
  const [valeurs, definirValeurs] = useState({});

  useEffect(() => {
    const charger = () => {
      definirLignes(lireModule("notes"));
      definirEleves(lireModule("eleves").filter(e => normaliser(e.classe) === normaliser(classe)));
      definirMatieres(lireModule("matieres").filter(m => normaliser(m.classe) === normaliser(classe)));
      definirEvaluations(lireModule("evaluations").filter(e => normaliser(e.classe) === normaliser(classe)));
    };
    charger();
    window.addEventListener("storage", charger);
    window.addEventListener("focus", charger);
    return () => {
      window.removeEventListener("storage", charger);
      window.removeEventListener("focus", charger);
    };
  }, [classe]);

  const nomsEleves = useMemo(() => new Set(eleves.map(e => normaliser(nomEleve(e)))), [eleves]);
  const notesClasse = useMemo(() => lignes.filter(n =>
    n.classe ? normaliser(n.classe) === normaliser(classe) : nomsEleves.has(normaliser(n.eleve))
  ), [lignes, classe, nomsEleves]);

  const donnees = useMemo(() => notesClasse.filter(n => {
    const correspond = [n.eleve, n.matiere, n.evaluation].some(v => String(v || "").toLowerCase().includes(recherche.trim().toLowerCase()));
    return correspond && n.trimestre === trimestre && (!filtreMatiere || n.matiere === filtreMatiere);
  }), [notesClasse, recherche, trimestre, filtreMatiere]);

  const pages = Math.max(1, Math.ceil(donnees.length / 10));
  const pageActive = Math.min(page, pages);
  const visibles = donnees.slice((pageActive - 1) * 10, pageActive * 10);
  const evaluationsMatiere = matiere => evaluations.filter(e => e.matiere === matiere);
  const enregistrer = valeurs => { enregistrerModule("notes", valeurs); definirLignes(valeurs); };
  const changer = (cle, valeur) => definirFormulaire(f => ({ ...f, [cle]: valeur }));

  const ouvrir = ligne => definirFormulaire(ligne ? { ...ligne } : {
    eleve: "", matiere: "", evaluation: "", note: "", bareme: 20, trimestre, classe
  });

  const soumettre = e => {
    e.preventDefault();
    if (!classe) return Swal.fire("Classe non attribuée", "", "warning");
    if (!nomsEleves.has(normaliser(formulaire.eleve)) || !matieres.some(m => m.nom === formulaire.matiere)) {
      return Swal.fire("Données invalides", "Sélectionnez un élève et une matière de votre classe.", "warning");
    }
    const evaluation = evaluations.find(e => e.titre === formulaire.evaluation && e.matiere === formulaire.matiere);
    if (!evaluation) return Swal.fire("Évaluation requise", "Sélectionnez une évaluation existante.", "warning");

    const note = Number(formulaire.note);
    const bareme = Number(evaluation.bareme || 20);
    if (formulaire.note === "" || !Number.isFinite(note) || note < 0 || note > bareme) {
      return Swal.fire("Note invalide", `La note doit être comprise entre 0 et ${bareme}.`, "warning");
    }

    const ligne = { ...formulaire, classe, note, bareme, trimestre: formulaire.trimestre };
    const doublon = lignes.some(n => n.id !== ligne.id && normaliser(n.eleve) === normaliser(ligne.eleve) &&
      n.matiere === ligne.matiere && n.evaluation === ligne.evaluation && n.trimestre === ligne.trimestre);
    if (doublon) return Swal.fire("Note existante", "Une note existe déjà pour cette évaluation et cet élève.", "warning");

    const valeurs = ligne.id ? lignes.map(n => n.id === ligne.id && notesClasse.some(x => x.id === n.id) ? ligne : n) :
      [{ ...ligne, id: crypto.randomUUID() }, ...lignes];
    enregistrer(valeurs);
    definirFormulaire(null);
    Swal.fire({ icon: "success", title: "Note enregistrée", timer: 1200, showConfirmButton: false });
  };

  const supprimer = async ligne => {
    const resultat = await Swal.fire({
      title: "Supprimer cette note ?", text: `${ligne.eleve} · ${ligne.matiere}`,
      icon: "warning", showCancelButton: true, confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler", confirmButtonColor: document.documentElement.classList.contains("dark") ? "#29446D" : "#B42318"
    });
    if (!resultat.isConfirmed) return;
    enregistrer(lignes.filter(n => n.id !== ligne.id));
    Swal.fire({ icon: "success", title: "Note supprimée", timer: 1200, showConfirmButton: false });
  };

  const sauvegarderCollective = () => {
    const evaluation = evaluations.find(e => e.titre === evaluationCollective && e.matiere === matiereCollective);
    if (!evaluation) return Swal.fire("Évaluation requise", "Sélectionnez une matière et une évaluation.", "warning");

    const bareme = Number(evaluation.bareme || 20);
    const nouvelles = [];
    for (const eleve of eleves) {
      const valeur = valeurs[eleve.id];
      if (valeur === undefined || valeur === "") continue;
      const note = Number(valeur);
      if (!Number.isFinite(note) || note < 0 || note > bareme) {
        return Swal.fire("Note invalide", `${nomEleve(eleve)} : note comprise entre 0 et ${bareme}.`, "warning");
      }
      nouvelles.push({
        id: crypto.randomUUID(), eleve: nomEleve(eleve), classe,
        matiere: matiereCollective, evaluation: evaluationCollective,
        note, bareme, trimestre
      });
    }

    if (!nouvelles.length) return Swal.fire("Aucune note", "Saisissez au moins une note.", "warning");

    const autres = lignes.filter(n => !nouvelles.some(x =>
      normaliser(x.eleve) === normaliser(n.eleve) && x.matiere === n.matiere &&
      x.evaluation === n.evaluation && x.trimestre === n.trimestre
    ));
    enregistrer([...autres, ...nouvelles]);
    definirCollective(false);
    definirValeurs({});
    Swal.fire({ icon: "success", title: `${nouvelles.length} note(s) enregistrée(s)`, timer: 1400, showConfirmButton: false });
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 lg:h-[calc(100dvh-145px)] lg:min-h-[420px] lg:overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${texte}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Notes</h1>
          <p className={`mt-1 text-sm ${secondaire}`}>Gestion des notes · Classe {classe || "non attribuée"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!eleves.length || !evaluations.length} onClick={() => { definirCollective(true); definirValeurs({}); }}
            className={`${bouton} border border-[#540916] text-[#540916] disabled:opacity-40 dark:border-[#405574] dark:text-[#93C5FD] dark:hover:bg-[#29446D]`}>
            <ClipboardList size={17} /> Saisie collective
          </button>
          <button type="button" disabled={!eleves.length || !evaluations.length} onClick={() => ouvrir(null)}
            className={`${bouton} bg-[#540916] text-white dark:bg-[#29446D] dark:hover:bg-[#365582] hover:bg-[#400711] disabled:opacity-40`}>
            <Plus size={17} /> Ajouter une note
          </button>
        </div>
      </header>

      <section className={`${carte} flex min-h-0 min-w-0 flex-col overflow-hidden lg:flex-1`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div>
            <h2 className={`text-base font-bold ${texte}`}>Liste des notes</h2>
            <p className={`mt-1 text-xs ${secondaire}`}>{donnees.length} note(s)</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => exporterExcel(donnees, `notes-${classe}-${trimestre}`)}
              className={`${bouton} border border-[#E4E7EC] ${texte} dark:border-[#33445E]`}><Download size={16} /> Excel</button>
            <button type="button" onClick={() => exporterPDF(donnees, colonnes, `notes-${classe}-${trimestre}`)}
              className={`${bouton} border border-[#E4E7EC] ${texte} dark:border-[#33445E]`}><FileDown size={16} /> PDF</button>
          </div>
        </div>

        <div className="grid min-w-0 shrink-0 grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="relative min-w-0">
            <Search size={17} className="absolute left-3 top-3 text-[#98A2B3]" />
            <input value={recherche} onChange={e => { definirRecherche(e.target.value); definirPage(1); }}
              placeholder="Rechercher une note..." className={`${champ} pl-10`} />
          </label>
          <select aria-label="Filtrer par matière" value={filtreMatiere}
            onChange={e => { definirFiltreMatiere(e.target.value); definirPage(1); }} className={champ}>
            <option value="">Toutes les matières</option>
            {matieres.map(m => <option key={m.id || m.nom} value={m.nom}>{m.nom}</option>)}
          </select>
          <select aria-label="Filtrer par trimestre" value={trimestre}
            onChange={e => { definirTrimestre(e.target.value); definirPage(1); }} className={champ}>
            {trimestres.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="min-h-0 min-w-0 max-h-[272px] overflow-auto overscroll-contain">
          <table className="w-full min-w-[740px] border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] shadow-sm dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                {["Élève", "Matière", "Évaluation", "Note", "Trimestre"].map(t =>
                  <th key={t} scope="col" className="h-12 whitespace-nowrap border-b border-[#EAE3E5] px-3 font-semibold dark:border-[#263852]">{t}</th>
                )}
                <th scope="col" className="sticky right-0 z-20 h-12 w-[120px] whitespace-nowrap border-b border-[#EAE3E5] bg-[#F8F9FC] px-3 text-right font-semibold dark:border-[#263852] dark:bg-[#0B172B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((n, i) => (
                <tr key={n.id || i} className="group h-14 hover:bg-[#F8F9FC] dark:hover:bg-[#1B2C47]">
                  <td className={`whitespace-nowrap border-b border-[#EEF0F3] px-3 py-2 dark:border-[#263852] font-semibold ${texte}`}>{n.eleve}</td>
                  <td className={`whitespace-nowrap border-b border-[#EEF0F3] px-3 py-2 dark:border-[#263852] ${texte}`}>{n.matiere}</td>
                  <td className={`whitespace-nowrap border-b border-[#EEF0F3] px-3 py-2 dark:border-[#263852] ${texte}`}>{n.evaluation}</td>
                  <td className={`whitespace-nowrap border-b border-[#EEF0F3] px-3 py-2 dark:border-[#263852] font-bold ${texte}`}>{n.note} / {n.bareme || 20}</td>
                  <td className={`whitespace-nowrap border-b border-[#EEF0F3] px-3 py-2 dark:border-[#263852] ${texte}`}>{n.trimestre}</td>
                  <td className="sticky right-0 z-[1] w-[120px] whitespace-nowrap border-b border-[#EEF0F3] bg-white px-3 py-2 text-right group-hover:bg-[#F8F9FC] dark:border-[#263852] dark:bg-[#14243D] dark:group-hover:bg-[#1B2C47]">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" title="Détails" onClick={() => definirSelection(n)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-[#29446D]"><Eye size={17} /></button>
                      <button type="button" title="Modifier" onClick={() => ouvrir(n)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#540916] hover:bg-red-50 dark:text-[#93C5FD] dark:hover:bg-[#29446D]"><Pencil size={17} /></button>
                      <button type="button" title="Supprimer" onClick={() => supprimer(n)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:text-[#A8B7CF] dark:hover:bg-[#29446D]"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibles.length && (
                <tr><td colSpan={6} className={`px-4 py-12 text-center ${secondaire}`}>
                  <ClipboardList size={30} className="mx-auto mb-3 opacity-40" />
                  Aucune note enregistrée pour ces critères.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#EAE3E5] p-3 dark:border-[#263852]">
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
        <Fenetre titre={formulaire.id ? "Modifier une note" : "Ajouter une note"} fermer={() => definirFormulaire(null)}>
          <form onSubmit={soumettre} className="space-y-4 p-3 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label><span className={`mb-1 block text-xs font-semibold ${texte}`}>Élève *</span>
                <select required value={formulaire.eleve} onChange={e => changer("eleve", e.target.value)} className={champ}>
                  <option value="">Sélectionner un élève</option>
                  {eleves.map(e => <option key={e.id} value={nomEleve(e)}>{nomEleve(e)}</option>)}
                </select>
              </label>
              <label><span className={`mb-1 block text-xs font-semibold ${texte}`}>Matière *</span>
                <select required value={formulaire.matiere} onChange={e => definirFormulaire(f => ({ ...f, matiere: e.target.value, evaluation: "" }))} className={champ}>
                  <option value="">Sélectionner une matière</option>
                  {matieres.map(m => <option key={m.id || m.nom} value={m.nom}>{m.nom}</option>)}
                </select>
              </label>
              <label><span className={`mb-1 block text-xs font-semibold ${texte}`}>Évaluation *</span>
                <select required value={formulaire.evaluation} onChange={e => changer("evaluation", e.target.value)} className={champ}>
                  <option value="">Sélectionner une évaluation</option>
                  {evaluationsMatiere(formulaire.matiere).map(e => <option key={e.id} value={e.titre}>{e.titre}</option>)}
                </select>
              </label>
              <label><span className={`mb-1 block text-xs font-semibold ${texte}`}>Trimestre *</span>
                <select value={formulaire.trimestre} onChange={e => changer("trimestre", e.target.value)} className={champ}>
                  {trimestres.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label><span className={`mb-1 block text-xs font-semibold ${texte}`}>Note *</span>
                <input type="number" min="0" max={evaluations.find(e => e.titre === formulaire.evaluation && e.matiere === formulaire.matiere)?.bareme || 20}
                  step="0.25" required value={formulaire.note} onChange={e => changer("note", e.target.value)} className={champ} />
              </label>
              <label><span className={`mb-1 block text-xs font-semibold ${texte}`}>Barème</span>
                <input readOnly value={evaluations.find(e => e.titre === formulaire.evaluation && e.matiere === formulaire.matiere)?.bareme || 20} className={`${champ} opacity-70`} />
              </label>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
              <button type="button" onClick={() => definirFormulaire(null)} className={`${bouton} border border-[#E4E7EC] ${texte} dark:border-[#33445E]`}>Annuler</button>
              <button type="submit" className={`${bouton} bg-[#540916] px-5 text-white dark:bg-[#29446D] dark:hover:bg-[#365582]`}><Save size={16} /> Enregistrer</button>
            </div>
          </form>
        </Fenetre>
      )}

      {collective && (
        <Fenetre titre="Saisie collective des notes" fermer={() => definirCollective(false)}>
          <div className="space-y-4 p-3 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label><span className={`mb-1 block text-xs font-semibold ${texte}`}>Matière *</span>
                <select value={matiereCollective} onChange={e => { definirMatiereCollective(e.target.value); definirEvaluationCollective(""); definirValeurs({}); }} className={champ}>
                  <option value="">Sélectionner une matière</option>
                  {matieres.map(m => <option key={m.id || m.nom} value={m.nom}>{m.nom}</option>)}
                </select>
              </label>
              <label><span className={`mb-1 block text-xs font-semibold ${texte}`}>Évaluation *</span>
                <select value={evaluationCollective} onChange={e => { definirEvaluationCollective(e.target.value); definirValeurs({}); }} className={champ}>
                  <option value="">Sélectionner une évaluation</option>
                  {evaluationsMatiere(matiereCollective).map(e => <option key={e.id} value={e.titre}>{e.titre}</option>)}
                </select>
              </label>
            </div>
            <div className="max-h-[45dvh] space-y-2 overflow-y-auto">
              {eleves.map(e => (
                <label key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#EAE3E5] p-3 dark:border-[#33445E]">
                  <span className={`text-sm font-semibold ${texte}`}>{nomEleve(e)}</span>
                  <input type="number" min="0" step="0.25"
                    max={evaluations.find(x => x.titre === evaluationCollective && x.matiere === matiereCollective)?.bareme || 20}
                    value={valeurs[e.id] ?? ""} onChange={v => definirValeurs(x => ({ ...x, [e.id]: v.target.value }))}
                    aria-label={`Note de ${nomEleve(e)}`} className={`${champ} max-w-[110px]`} />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
              <button type="button" onClick={() => definirCollective(false)} className={`${bouton} border border-[#E4E7EC] ${texte} dark:border-[#33445E]`}>Annuler</button>
              <button type="button" onClick={sauvegarderCollective} className={`${bouton} bg-[#540916] text-white dark:bg-[#29446D] dark:hover:bg-[#365582]`}><Save size={16} /> Enregistrer les notes</button>
            </div>
          </div>
        </Fenetre>
      )}

      {selection && (
        <Fenetre titre="Détails de la note" fermer={() => definirSelection(null)}>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
            {[
              ["Élève", selection.eleve], ["Matière", selection.matiere],
              ["Évaluation", selection.evaluation], ["Classe", selection.classe || classe],
              ["Note", `${selection.note} / ${selection.bareme || 20}`], ["Trimestre", selection.trimestre]
            ].map(([label, valeur]) => (
              <div key={label} className="rounded-xl bg-[#F8F9FC] p-3 dark:bg-[#0B172B]">
                <p className={`text-xs ${secondaire}`}>{label}</p>
                <p className={`mt-1 text-sm font-semibold ${texte}`}>{valeur ?? "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-[#EAE3E5] p-4 dark:border-[#263852]">
            <button type="button" onClick={() => definirSelection(null)} className={`${bouton} bg-[#540916] px-5 text-white dark:bg-[#29446D] dark:hover:bg-[#365582]`}>Fermer</button>
          </div>
        </Fenetre>
      )}
    </div>
  );
}