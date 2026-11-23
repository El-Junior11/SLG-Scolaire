import Swal from "sweetalert2";
import { useEffect, useMemo, useState } from "react";
import { Search, Eye, Download, FileDown, X, BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { enregistrerModule, lireModule } from "../services/stockageDemonstration";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors";
const normaliser = v => String(v || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, "");
const colonnesExport = ["nom", "classe", "coefficient", "bareme"];

function Fenetre({ titre, fermer, children }) {
  useEffect(() => {
    const echap = e => { if (e.key === "Escape") fermer(); };
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [fermer]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" onMouseDown={e => e.target === e.currentTarget && fermer()}>
      <div role="dialog" aria-modal="true" aria-label={titre} className={`${carte} max-h-[92dvh] w-full max-w-lg overflow-y-auto`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EAE3E5] bg-white px-5 py-4 dark:border-[#263852] dark:bg-[#14243D]">
          <h2 className={`text-lg font-bold ${texte}`}>{titre}</h2>
          <button type="button" onClick={fermer} aria-label="Fermer" className={`rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#263852] ${texte}`}>
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Matieres() {
  const { utilisateur } = utiliserAuthentification();
  const classe = utilisateur?.classe || "";

  const [matieres, definirMatieres] = useState([]);
  const [evaluations, definirEvaluations] = useState([]);
  const [recherche, definirRecherche] = useState("");
  const [page, definirPage] = useState(1);
  const [selection, definirSelection] = useState(null);
  const [formulaire, definirFormulaire] = useState(null);

  const appartientClasse = ligne => Boolean(classe) && normaliser(ligne.classe) === normaliser(classe);

  useEffect(() => {
    const charger = () => {
      definirMatieres(lireModule("matieres").filter(m => classe && normaliser(m.classe) === normaliser(classe)));
      definirEvaluations(lireModule("evaluations").filter(e => classe && normaliser(e.classe) === normaliser(classe)));
    };

    charger();
    window.addEventListener("storage", charger);
    window.addEventListener("focus", charger);
    return () => {
      window.removeEventListener("storage", charger);
      window.removeEventListener("focus", charger);
    };
  }, [classe]);

  const donnees = useMemo(() => matieres.filter(m =>
    normaliser(m.nom).includes(normaliser(recherche))
  ).sort((a, b) => String(a.nom || "").localeCompare(String(b.nom || ""), "fr")), [matieres, recherche]);

  const pages = Math.max(1, Math.ceil(donnees.length / 10));
  const pageActive = Math.min(page, pages);
  const visibles = donnees.slice((pageActive - 1) * 10, pageActive * 10);

  const nombreEvaluations = matiere => evaluations.filter(e =>
    normaliser(e.matiere) === normaliser(matiere)
  ).length;

  function possedeResultats(matiere) {
    return lireModule("evaluations").some(ligne =>
      appartientClasse(ligne) && normaliser(ligne.matiere) === normaliser(matiere.nom)
    ) || lireModule("notes").some(ligne =>
      (!ligne.classe || appartientClasse(ligne)) &&
      normaliser(ligne.matiere) === normaliser(matiere.nom)
    );
  }

  function sauvegarder(lignes) {
    try {
      enregistrerModule("matieres", lignes);
      definirMatieres(lignes.filter(appartientClasse));
      return true;
    } catch {
      Swal.fire("Enregistrement impossible", "Le navigateur n’a pas pu enregistrer les matières.", "error");
      return false;
    }
  }

  function enregistrer(evenement) {
    evenement.preventDefault();
    if (!classe) return;
    const { originale, nom: saisie, coefficient: coef, bareme: maximum } = formulaire;
    const nom = saisie.trim();
    const coefficient = Number(coef);
    const bareme = Number(maximum);
    if (!nom || !Number.isFinite(coefficient) || coefficient <= 0 ||
        !Number.isFinite(bareme) || bareme <= 0) {
      Swal.fire("Vérifiez les champs", "Le nom est requis. Le coefficient et le barème doivent être positifs.", "warning");
      return;
    }
    const lignes = lireModule("matieres");
    const index = originale ? lignes.findIndex(ligne =>
      appartientClasse(ligne) && (originale.id ? ligne.id === originale.id : ligne.nom === originale.nom)
    ) : -1;
    if (originale && index < 0) {
      Swal.fire("Matière introuvable", "Rechargez la liste avant de modifier cette matière.", "warning");
      return;
    }
    if (lignes.some((ligne, rang) => rang !== index && appartientClasse(ligne) &&
        normaliser(ligne.nom) === normaliser(nom))) {
      Swal.fire("Matière déjà présente", "Ce nom est déjà utilisé dans cette classe.", "warning");
      return;
    }
    if (originale && nom !== originale.nom && possedeResultats(originale)) {
      Swal.fire("Matière utilisée", "Cette matière est associée à des notes ou évaluations. Le coefficient et le barème restent modifiables.", "warning");
      return;
    }
    if (originale) lignes[index] = { ...lignes[index], nom, coefficient, bareme };
    else lignes.push({ id: crypto.randomUUID(), nom, classe, coefficient, bareme });
    if (sauvegarder(lignes)) {
      definirFormulaire(null);
      definirPage(1);
    }
  }

  async function supprimer(matiere) {
    const confirmation = await Swal.fire({
      title: "Supprimer cette matière ?", text: matiere.nom, icon: "warning",
      showCancelButton: true, confirmButtonText: "Supprimer", cancelButtonText: "Annuler",
    });
    if (!confirmation.isConfirmed) return;
    if (possedeResultats(matiere)) {
      Swal.fire("Matière utilisée", "Cette matière est associée à des notes ou évaluations.", "warning");
      return;
    }
    sauvegarder(lireModule("matieres").filter(ligne => !(
      appartientClasse(ligne) && (matiere.id ? ligne.id === matiere.id : ligne.nom === matiere.nom)
    )));
  }

  const exportDonnees = donnees.map(m => ({
    nom: m.nom,
    classe: m.classe,
    coefficient: m.coefficient,
    bareme: m.bareme
  }));

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <header className="shrink-0">
        <h1 className={`text-3xl font-bold tracking-tight ${texte}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Matières
        </h1>
        <p className={`mt-1 text-sm ${secondaire}`}>
          Gestion des matières · Classe {classe || "non attribuée"}
        </p>
      </header>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div>
            <h2 className={`text-base font-bold ${texte}`}>Liste des matières</h2>
            <p className={`mt-1 text-xs ${secondaire}`}>{donnees.length} matière(s)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!classe}
              onClick={() => definirFormulaire({ nom: "", coefficient: "1", bareme: "20" })}
              className={`${bouton} bg-[#540916] text-white disabled:opacity-50`}>
              <Plus size={17} /> Nouvelle matière
            </button>
            <button type="button" onClick={() => exporterExcel(exportDonnees, `matieres-${classe}`)}
              className={`${bouton} border border-[#E4E7EC] ${texte} hover:bg-gray-50 dark:border-[#33445E] dark:hover:bg-[#1D304C]`}>
              <Download size={16} /> Excel
            </button>
            <button type="button" onClick={() => exporterPDF(exportDonnees, colonnesExport, `matieres-${classe}`)}
              className={`${bouton} border border-[#E4E7EC] ${texte} hover:bg-gray-50 dark:border-[#33445E] dark:hover:bg-[#1D304C]`}>
              <FileDown size={16} /> PDF
            </button>
          </div>
        </div>

        <div className="shrink-0 p-3">
          <label className="relative block max-w-md">
            <Search size={17} className="absolute left-3 top-3 text-[#98A2B3]" />
            <input value={recherche} onChange={e => { definirRecherche(e.target.value); definirPage(1); }}
              placeholder="Rechercher une matière..." className={`${champ} pl-10`} />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] shadow-sm dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                <th className="px-4 py-3 font-semibold">N°</th>
                <th className="px-4 py-3 font-semibold">Matière</th>
                <th className="px-4 py-3 font-semibold">Classe</th>
                <th className="px-4 py-3 font-semibold">Coefficient</th>
                <th className="px-4 py-3 font-semibold">Barème</th>
                <th className="px-4 py-3 font-semibold">Évaluations</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((m, i) => (
                <tr key={m.id || `${m.nom}-${i}`} className="border-t border-[#EEF0F3] hover:bg-[#F8F9FC] dark:border-[#263852] dark:hover:bg-[#1B2C47]">
                  <td className={`px-4 py-3 ${secondaire}`}>{(pageActive - 1) * 10 + i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#540916]/10 text-[#540916] dark:bg-[#D9799A]/15 dark:text-[#F3A5BC]">
                        <BookOpen size={17} />
                      </div>
                      <span className={`font-semibold ${texte}`}>{m.nom || "—"}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${texte}`}>{m.classe || "—"}</td>
                  <td className={`px-4 py-3 ${texte}`}>{m.coefficient ?? "—"}</td>
                  <td className={`px-4 py-3 ${texte}`}>{m.bareme ?? "—"}</td>
                  <td className={`px-4 py-3 ${texte}`}>{nombreEvaluations(m.nom)}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => definirSelection(m)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#540916] hover:bg-[#540916]/10 dark:text-[#F3A5BC] dark:hover:bg-white/10">
                      <Eye size={16} /> Détails
                    </button>
                    <button type="button" aria-label={`Modifier ${m.nom}`} title="Modifier"
                      onClick={() => definirFormulaire({ originale: m, nom: m.nom, coefficient: m.coefficient ?? "", bareme: m.bareme ?? "" })}
                      className="rounded-lg p-2 text-[#540916] hover:bg-[#540916]/10 dark:text-[#F3A5BC]"><Pencil size={16} /></button>
                    <button type="button" aria-label={`Supprimer ${m.nom}`} title="Supprimer"
                      onClick={() => supprimer(m)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}

              {!visibles.length && (
                <tr>
                  <td colSpan={7} className={`px-4 py-12 text-center ${secondaire}`}>
                    <BookOpen size={30} className="mx-auto mb-3 opacity-40" />
                    {recherche ? "Aucune matière ne correspond à votre recherche." : "Aucune matière enregistrée pour votre classe."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-[#EAE3E5] bg-white p-3 dark:border-[#263852] dark:bg-[#14243D]">
          <span className={`text-xs ${secondaire}`}>Page {pageActive} / {pages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={pageActive <= 1} onClick={() => definirPage(p => Math.max(1, p - 1))}
              className={`${bouton} border border-[#E4E7EC] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#33445E] dark:text-white`}>
              Précédent
            </button>
            <button type="button" disabled={pageActive >= pages} onClick={() => definirPage(p => Math.min(pages, p + 1))}
              className={`${bouton} border border-[#E4E7EC] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#33445E] dark:text-white`}>
              Suivant
            </button>
          </div>
        </div>
      </section>

      {formulaire && (
        <Fenetre titre={formulaire.originale ? "Modifier la matière" : "Nouvelle matière"}
          fermer={() => definirFormulaire(null)}>
          <form className="space-y-4 p-5" onSubmit={enregistrer}>
            <p className={secondaire}>Classe {classe}</p>
            {[
              ["nom", "Nom de la matière", "text"],
              ["coefficient", "Coefficient", "number"],
              ["bareme", "Barème", "number"],
            ].map(([cle, titre, type]) => (
              <label className="block" key={cle}>{titre}
                <input className={champ} type={type} step={type === "number" ? "any" : undefined}
                  maxLength={type === "text" ? 120 : undefined} required value={formulaire[cle]}
                  onChange={evenement => definirFormulaire(valeur => ({ ...valeur, [cle]: evenement.target.value }))} />
              </label>
            ))}
            <button className={`${bouton} bg-[#540916] text-white`}>Enregistrer</button>
          </form>
        </Fenetre>
      )}

      {selection && (
        <Fenetre titre="Détails de la matière" fermer={() => definirSelection(null)}>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
            {[
              ["Matière", selection.nom],
              ["Classe", selection.classe],
              ["Coefficient", selection.coefficient],
              ["Barème", selection.bareme],
              ["Évaluations", nombreEvaluations(selection.nom)]
            ].map(([libelle, valeur]) => (
              <div key={libelle} className="rounded-xl bg-[#F8F9FC] p-3 dark:bg-[#0B172B]">
                <p className={`text-xs ${secondaire}`}>{libelle}</p>
                <p className={`mt-1 text-sm font-semibold ${texte}`}>{valeur ?? "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-[#EAE3E5] p-4 dark:border-[#263852]">
            <button type="button" onClick={() => definirSelection(null)}
              className={`${bouton} bg-[#540916] px-5 text-white hover:bg-[#400711]`}>
              Fermer
            </button>
          </div>
        </Fenetre>
      )}
    </div>
  );
}