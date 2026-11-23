import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { Search, Eye, FileDown, Printer, X, GraduationCap } from "lucide-react";
import { calculerResultats } from "../utilitaires/calculs";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { lireModule } from "../services/stockageDemonstration";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors";
const trimestres = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];
const moyenne = v => v == null || !Number.isFinite(Number(v)) ? "—" : Number(v).toFixed(2);
const normaliser = v => String(v || "").trim().toLowerCase().replace(/\s+/g, "");

export default function Bulletins() {
  const { utilisateur } = utiliserAuthentification();
  const classe = utilisateur?.classe || "";
  const [trimestre, definirTrimestre] = useState("Trimestre 1");
  const [recherche, definirRecherche] = useState("");
  const [page, definirPage] = useState(1);
  const [selection, definirSelection] = useState(null);

  const resultats = useMemo(() => calculerResultats(classe, trimestre) || [], [classe, trimestre]);
  const donnees = useMemo(() => resultats.filter(e =>
    String(e.eleve || "").toLowerCase().includes(recherche.trim().toLowerCase())
  ).sort((a, b) => String(a.eleve || "").localeCompare(String(b.eleve || ""), "fr")), [resultats, recherche]);

  const pages = Math.max(1, Math.ceil(donnees.length / 10));
  const pageActive = Math.min(page, pages);
  const visibles = donnees.slice((pageActive - 1) * 10, pageActive * 10);

  const annee = useMemo(() => {
    const annees = lireModule("annees-scolaires");
    return annees.find(a => a.statut === "Active")?.nom || "Non définie";
  }, []);

  const details = selection && Array.isArray(selection.details) ? selection.details : [];

  const telecharger = eleve => {
    if (!eleve) return;
    const doc = new jsPDF("p", "mm", "a4");
    const largeur = 210, marge = 17;
    const lignes = Array.isArray(eleve.details) ? eleve.details : [];
    let y = 20;

    const entete = () => {
      doc.setTextColor(84, 9, 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("SAINT LOUIS DE GONZAGUE MAHASOABE", largeur / 2, 19, { align: "center" });
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      doc.text("BULLETIN SCOLAIRE", largeur / 2, 27, { align: "center" });
      doc.setDrawColor(84, 9, 22);
      doc.setLineWidth(0.6);
      doc.line(marge, 33, largeur - marge, 33);
      doc.setTextColor(30, 30, 30);
    };

    entete();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Eleve : ${eleve.eleve || "—"}`, marge, 44);
    doc.text(`Classe : ${eleve.classe || classe}`, marge, 52);
    doc.text(`Trimestre : ${trimestre}`, marge, 60);
    doc.text(`Annee scolaire : ${annee}`, marge, 68);

    const enteteTableau = position => {
      doc.setFillColor(84, 9, 22);
      doc.rect(marge, position - 6, largeur - marge * 2, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("Matiere", marge + 3, position);
      doc.text("Coeff.", 133, position, { align: "center" });
      doc.text("Moyenne /20", 178, position, { align: "center" });
      doc.setTextColor(30, 30, 30);
      return position + 10;
    };

    y = enteteTableau(81);
    doc.setFont("helvetica", "normal");

    lignes.forEach((ligne, index) => {
      const nom = String(ligne.matiere || "—");
      const fragments = doc.splitTextToSize(nom, 100);
      const hauteur = Math.max(9, fragments.length * 5 + 3);

      if (y + hauteur > 255) {
        doc.addPage();
        entete();
        y = enteteTableau(43);
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 252);
        doc.rect(marge, y - 6, largeur - marge * 2, hauteur, "F");
      }

      doc.text(fragments, marge + 3, y);
      doc.text(String(ligne.coefficient ?? "—"), 133, y, { align: "center" });
      doc.text(moyenne(ligne.moyenne), 178, y, { align: "center" });
      y += hauteur;
    });

    if (y + 46 > 270) {
      doc.addPage();
      entete();
      y = 44;
    }

    doc.setDrawColor(220, 220, 220);
    doc.line(marge, y + 1, largeur - marge, y + 1);
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Moyenne generale : ${moyenne(eleve.moyenne)} / 20`, marge, y);
    doc.text(`Rang : ${eleve.rang ?? "—"}`, largeur - marge, y, { align: "right" });
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Appreciation : ........................................................................", marge, y);
    y += 19;
    doc.text("Signature : ........................................", largeur - marge, y, { align: "right" });

    const fichier = String(eleve.eleve || "eleve").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-");
    doc.save(`bulletin-${fichier}-${trimestre.replaceAll(" ", "-")}.pdf`);
  };

  const imprimer = () => {
    if (!selection) return;
    window.print();
  };

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${texte}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Bulletins scolaires
          </h1>
          <p className={`mt-1 text-sm ${secondaire}`}>Consultation et édition des bulletins · Classe {classe || "non attribuée"}</p>
        </div>
      </header>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden print:hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div>
            <h2 className={`text-base font-bold ${texte}`}>Liste des bulletins</h2>
            <p className={`mt-1 text-xs ${secondaire}`}>{donnees.length} élève(s) · {trimestre}</p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-3 p-3 md:grid-cols-2">
          <label className="relative">
            <Search size={17} className="absolute left-3 top-3 text-[#98A2B3]" />
            <input value={recherche} onChange={e => { definirRecherche(e.target.value); definirPage(1); }}
              placeholder="Rechercher un élève..." className={`${champ} pl-10`} />
          </label>
          <select aria-label="Filtrer par trimestre" value={trimestre}
            onChange={e => { definirTrimestre(e.target.value); definirPage(1); definirSelection(null); }} className={champ}>
            {trimestres.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] shadow-sm dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                {["N°", "Élève", "Classe", "Moyenne /20", "Rang", "Actions"].map(t =>
                  <th key={t} className="px-4 py-3 font-semibold">{t}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {visibles.map((e, i) => (
                <tr key={e.id || `${e.eleve}-${i}`} className="border-t border-[#EEF0F3] hover:bg-[#F8F9FC] dark:border-[#263852] dark:hover:bg-[#1B2C47]">
                  <td className={`px-4 py-3 ${secondaire}`}>{(pageActive - 1) * 10 + i + 1}</td>
                  <td className={`px-4 py-3 font-semibold ${texte}`}>{e.eleve}</td>
                  <td className={`px-4 py-3 ${texte}`}>{e.classe || classe}</td>
                  <td className={`px-4 py-3 font-bold ${texte}`}>{moyenne(e.moyenne)}</td>
                  <td className={`px-4 py-3 ${texte}`}>{e.rang ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button type="button" title="Aperçu" onClick={() => definirSelection(e)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-300"><Eye size={17} /></button>
                      <button type="button" title="Télécharger PDF" onClick={() => telecharger(e)}
                        className="rounded-lg p-2 text-[#540916] hover:bg-red-50 dark:text-[#F3A5BC]"><FileDown size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibles.length && (
                <tr><td colSpan={6} className={`px-4 py-12 text-center ${secondaire}`}>
                  <GraduationCap size={30} className="mx-auto mb-3 opacity-40" />
                  Aucun bulletin disponible pour ces critères.
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

      {selection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 print:static print:block print:bg-white print:p-0"
          onMouseDown={e => e.target === e.currentTarget && definirSelection(null)}>
          <div className="max-h-[95dvh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-[#F3F4F6] shadow-xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:bg-white print:shadow-none">
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-white p-4 print:hidden">
              <h2 className="font-bold text-slate-900">Aperçu du bulletin</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => telecharger(selection)} className={`${bouton} bg-[#540916] text-white`}>
                  <FileDown size={16} /> PDF A4
                </button>
                <button type="button" onClick={imprimer} className={`${bouton} border border-gray-300 text-slate-900`}>
                  <Printer size={16} /> Imprimer
                </button>
                <button type="button" onClick={() => definirSelection(null)} aria-label="Fermer"
                  className="rounded-lg p-2 text-slate-900 hover:bg-gray-100"><X size={19} /></button>
              </div>
            </div>

            <article id="bulletin-impression" className="mx-auto my-5 min-h-[270mm] w-full max-w-[210mm] bg-white p-6 text-slate-900 shadow-sm sm:p-10 print:m-0 print:min-h-0 print:max-w-none print:p-0 print:shadow-none">
              <header className="border-b-2 border-[#540916] pb-5 text-center">
                <h2 className="text-lg font-extrabold tracking-wide text-[#540916] sm:text-xl">SAINT LOUIS DE GONZAGUE MAHASOABE</h2>
                <p className="mt-2 text-sm font-bold uppercase">Bulletin scolaire</p>
              </header>

              <div className="my-7 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <p><strong>Élève :</strong> {selection.eleve}</p>
                <p><strong>Classe :</strong> {selection.classe || classe}</p>
                <p><strong>Trimestre :</strong> {trimestre}</p>
                <p><strong>Année scolaire :</strong> {annee}</p>
              </div>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#540916] text-white">
                    <th className="border border-[#540916] p-3 text-left">Matière</th>
                    <th className="border border-[#540916] p-3 text-center">Coeff.</th>
                    <th className="border border-[#540916] p-3 text-center">Moyenne /20</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => (
                    <tr key={`${d.matiere}-${i}`} className="even:bg-slate-50">
                      <td className="border border-slate-300 p-3">{d.matiere}</td>
                      <td className="border border-slate-300 p-3 text-center">{d.coefficient ?? "—"}</td>
                      <td className="border border-slate-300 p-3 text-center">{moyenne(d.moyenne)}</td>
                    </tr>
                  ))}
                  {!details.length && (
                    <tr><td colSpan={3} className="border border-slate-300 p-5 text-center text-slate-500">Aucune note disponible.</td></tr>
                  )}
                </tbody>
              </table>

              <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-slate-300 pt-5 text-sm font-extrabold">
                <span>Moyenne générale : {moyenne(selection.moyenne)} / 20</span>
                <span>Rang : {selection.rang ?? "—"}</span>
              </div>

              <div className="mt-12 space-y-10 text-sm">
                <p><strong>Appréciation :</strong> ................................................................................</p>
                <p className="text-right"><strong>Signature :</strong> ........................................</p>
              </div>
            </article>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body { background: white !important; }
          body * { visibility: hidden !important; }
          #bulletin-impression, #bulletin-impression * { visibility: visible !important; }
          #bulletin-impression {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
          }
          #bulletin-impression table { page-break-inside: auto; }
          #bulletin-impression tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}