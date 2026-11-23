import { useMemo, useState } from "react";
import { Search, Eye, Download, FileDown, X, Trophy, Medal } from "lucide-react";
import { calculerResultats } from "../utilitaires/calculs";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors";
const trimestres = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];
const colonnes = ["rang", "eleve", "classe", "moyenne"];
const afficherMoyenne = v => v == null || !Number.isFinite(Number(v)) ? "Non calculée" : Number(v).toFixed(2);

function Fenetre({ titre, fermer, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" onMouseDown={e => e.target === e.currentTarget && fermer()}>
      <div role="dialog" aria-modal="true" aria-label={titre} className={`${carte} w-full max-w-lg overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
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

export default function Classements() {
  const { utilisateur } = utiliserAuthentification();
  const classe = utilisateur?.classe || "";
  const [trimestre, definirTrimestre] = useState("Trimestre 1");
  const [recherche, definirRecherche] = useState("");
  const [filtre, definirFiltre] = useState("");
  const [page, definirPage] = useState(1);
  const [selection, definirSelection] = useState(null);

  const resultats = useMemo(() => calculerResultats(classe, trimestre) || [], [classe, trimestre]);

  const donnees = useMemo(() => resultats.filter(ligne => {
    const correspond = [ligne.eleve, ligne.classe].some(v =>
      String(v || "").toLowerCase().includes(recherche.trim().toLowerCase())
    );
    const moyenne = ligne.moyenne == null ? null : Number(ligne.moyenne);
    const calculee = moyenne !== null && Number.isFinite(moyenne);
    return correspond && (
      !filtre ||
      (filtre === "calcules" && calculee) ||
      (filtre === "non-calcules" && !calculee) ||
      (filtre === "admis" && calculee && moyenne >= 10) ||
      (filtre === "non-admis" && calculee && moyenne < 10)
    );
  }).sort((a, b) => {
    const rangA = Number(a.rang);
    const rangB = Number(b.rang);
    return (Number.isFinite(rangA) ? rangA : Infinity) - (Number.isFinite(rangB) ? rangB : Infinity);
  }), [resultats, recherche, filtre]);

  const pages = Math.max(1, Math.ceil(donnees.length / 10));
  const pageActive = Math.min(page, pages);
  const visibles = donnees.slice((pageActive - 1) * 10, pageActive * 10);

  const changerFiltre = (setter, valeur) => {
    setter(valeur);
    definirPage(1);
  };

  const exportDonnees = donnees.map(ligne => ({
    rang: ligne.rang ?? "—",
    eleve: ligne.eleve || "—",
    classe: ligne.classe || classe,
    moyenne: afficherMoyenne(ligne.moyenne)
  }));

  const badgeRang = rang => {
    const valeur = Number(rang);
    if (![1, 2, 3].includes(valeur)) return <span className={texte}>{rang ?? "—"}</span>;

    const styles = {
      1: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      2: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
      3: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
    };

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${styles[valeur]}`}>
        <Medal size={15} /> {valeur}
      </span>
    );
  };

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <header className="shrink-0">
        <h1 className={`text-3xl font-bold tracking-tight ${texte}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Classements
        </h1>
        <p className={`mt-1 text-sm ${secondaire}`}>
          Classement automatique des élèves · Classe {classe || "non attribuée"}
        </p>
      </header>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div>
            <h2 className={`text-base font-bold ${texte}`}>Classement des élèves</h2>
            <p className={`mt-1 text-xs ${secondaire}`}>{donnees.length} élève(s) · {trimestre}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => exporterExcel(exportDonnees, `classement-${classe}-${trimestre}`)}
              className={`${bouton} border border-[#E4E7EC] ${texte} hover:bg-gray-50 dark:border-[#33445E] dark:hover:bg-[#1D304C]`}>
              <Download size={16} /> Excel
            </button>
            <button type="button" onClick={() => exporterPDF(exportDonnees, colonnes, `classement-${classe}-${trimestre}`)}
              className={`${bouton} border border-[#E4E7EC] ${texte} hover:bg-gray-50 dark:border-[#33445E] dark:hover:bg-[#1D304C]`}>
              <FileDown size={16} /> PDF
            </button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-3 p-3 md:grid-cols-3">
          <label className="relative">
            <Search size={17} className="absolute left-3 top-3 text-[#98A2B3]" />
            <input value={recherche} onChange={e => changerFiltre(definirRecherche, e.target.value)}
              placeholder="Rechercher un élève..." className={`${champ} pl-10`} />
          </label>

          <select aria-label="Filtrer par trimestre" value={trimestre}
            onChange={e => changerFiltre(definirTrimestre, e.target.value)} className={champ}>
            {trimestres.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select aria-label="Filtrer par résultat" value={filtre}
            onChange={e => changerFiltre(definirFiltre, e.target.value)} className={champ}>
            <option value="">Tous les résultats</option>
            <option value="calcules">Moyennes calculées</option>
            <option value="non-calcules">Non calculées</option>
            <option value="admis">Moyenne ≥ 10/20</option>
            <option value="non-admis">Moyenne &lt; 10/20</option>
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] shadow-sm dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                <th className="px-4 py-3 font-semibold">Rang</th>
                <th className="px-4 py-3 font-semibold">Élève</th>
                <th className="px-4 py-3 font-semibold">Classe</th>
                <th className="px-4 py-3 font-semibold">Moyenne / 20</th>
                <th className="px-4 py-3 font-semibold">Résultat</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibles.map((ligne, index) => {
                const moyenne = ligne.moyenne == null ? null : Number(ligne.moyenne);
                const calculee = moyenne !== null && Number.isFinite(moyenne);
                const admis = calculee && moyenne >= 10;

                return (
                  <tr key={ligne.id || `${ligne.eleve}-${index}`}
                    className="border-t border-[#EEF0F3] hover:bg-[#F8F9FC] dark:border-[#263852] dark:hover:bg-[#1B2C47]">
                    <td className="px-4 py-3">{badgeRang(ligne.rang)}</td>
                    <td className={`px-4 py-3 font-semibold ${texte}`}>{ligne.eleve || "—"}</td>
                    <td className={`px-4 py-3 ${texte}`}>{ligne.classe || classe}</td>
                    <td className={`px-4 py-3 font-bold ${texte}`}>{afficherMoyenne(ligne.moyenne)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        !calculee ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200" :
                        admis ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}>
                        {!calculee ? "Non calculée" : admis ? "Admis" : "Non admis"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => definirSelection(ligne)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#540916] hover:bg-[#540916]/10 dark:text-[#F3A5BC] dark:hover:bg-white/10">
                        <Eye size={16} /> Détails
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!visibles.length && (
                <tr>
                  <td colSpan={6} className={`px-4 py-12 text-center ${secondaire}`}>
                    <Trophy size={30} className="mx-auto mb-3 opacity-40" />
                    Aucun classement disponible pour ces critères.
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
              className={`${bouton} border border-[#E4E7EC] disabled:opacity-40 dark:border-[#33445E] dark:text-white`}>
              Précédent
            </button>
            <button type="button" disabled={pageActive >= pages} onClick={() => definirPage(p => Math.min(pages, p + 1))}
              className={`${bouton} border border-[#E4E7EC] disabled:opacity-40 dark:border-[#33445E] dark:text-white`}>
              Suivant
            </button>
          </div>
        </div>
      </section>

      {selection && (
        <Fenetre titre="Détails du classement" fermer={() => definirSelection(null)}>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
            {[
              ["Élève", selection.eleve],
              ["Classe", selection.classe || classe],
              ["Trimestre", trimestre],
              ["Rang", selection.rang],
              ["Moyenne / 20", afficherMoyenne(selection.moyenne)],
              ["Résultat", selection.moyenne == null ? "Non calculée" : Number(selection.moyenne) >= 10 ? "Admis" : "Non admis"]
            ].map(([label, valeur]) => (
              <div key={label} className="rounded-xl bg-[#F8F9FC] p-3 dark:bg-[#0B172B]">
                <p className={`text-xs ${secondaire}`}>{label}</p>
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