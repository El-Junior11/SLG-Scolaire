import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Search, Eye, Plus, Pencil, Trash2, Download, FileDown, X } from "lucide-react";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors";
const normaliser = v => String(v || "").trim().toLowerCase().replace(/\s+/g, "");
const nomComplet = e => `${e.nom || ""} ${e.prenom || ""}`.trim();
const vide = { matricule: "", nom: "", prenom: "", sexe: "", naissance: "", statut: "Inscrit", responsable: "", telephone: "" };
const colonnes = ["matricule", "nom", "prenom", "classe", "sexe", "naissance", "statut", "responsable", "telephone"];

function Fenetre({ titre, fermer, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" onMouseDown={e => e.target === e.currentTarget && fermer()}>
      <div role="dialog" aria-modal="true" aria-label={titre} className={`${carte} max-h-[92dvh] w-full max-w-xl overflow-y-auto`}>
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

export default function MaClasse() {
  const { utilisateur } = utiliserAuthentification();
  const classe = utilisateur?.classe || "";
  const cle = `slg-titulaire-eleves-${utilisateur?.id || utilisateur?.email || "compte"}`;

  const [lignes, definirLignes] = useState(() => {
    try {
      const valeur = JSON.parse(localStorage.getItem(cle) || "[]");
      return Array.isArray(valeur) ? valeur : [];
    } catch { return []; }
  });
  const [recherche, definirRecherche] = useState("");
  const [sexe, definirSexe] = useState("");
  const [statut, definirStatut] = useState("");
  const [page, definirPage] = useState(1);
  const [formulaire, definirFormulaire] = useState(null);
  const [selection, definirSelection] = useState(null);

  const eleves = useMemo(() => lignes.filter(e => normaliser(e.classe) === normaliser(classe)), [lignes, classe]);
  const donnees = useMemo(() => eleves.filter(e => {
    const rechercheOK = [e.matricule, e.nom, e.prenom].some(v => String(v || "").toLowerCase().includes(recherche.trim().toLowerCase()));
    return rechercheOK && (!sexe || e.sexe === sexe) && (!statut || e.statut === statut);
  }).sort((a, b) => nomComplet(a).localeCompare(nomComplet(b), "fr")), [eleves, recherche, sexe, statut]);

  const pages = Math.max(1, Math.ceil(donnees.length / 8));
  const visibles = donnees.slice((page - 1) * 8, page * 8);
  const enregistrer = valeurs => { localStorage.setItem(cle, JSON.stringify(valeurs)); definirLignes(valeurs); };
  const filtrer = (setter, valeur) => { setter(valeur); definirPage(1); };
  const ouvrir = eleve => definirFormulaire(eleve ? { ...eleve } : { ...vide, classe });

  const soumettre = e => {
    e.preventDefault();
    if (!classe) return Swal.fire("Classe non attribuée", "Contactez l'administration.", "warning");

    const ligne = { ...formulaire, classe, matricule: formulaire.matricule.trim(), nom: formulaire.nom.trim(), prenom: formulaire.prenom.trim() };
    if (!ligne.matricule || !ligne.nom || !ligne.prenom || !ligne.sexe) {
      return Swal.fire("Champs obligatoires", "Complétez le matricule, le nom, le prénom et le sexe.", "warning");
    }
    const doublon = lignes.some(x => x.matricule?.toLowerCase() === ligne.matricule.toLowerCase() && x.id !== ligne.id);
    if (doublon) return Swal.fire("Matricule existant", "Ce matricule est déjà utilisé.", "warning");

    const valeurs = ligne.id ? lignes.map(x => x.id === ligne.id ? ligne : x) : [{ ...ligne, id: crypto.randomUUID() }, ...lignes];
    enregistrer(valeurs);
    definirFormulaire(null);
    definirPage(1);
    Swal.fire({ icon: "success", title: "Enregistrement réussi", timer: 1300, showConfirmButton: false });
  };

  const supprimer = async eleve => {
    const resultat = await Swal.fire({
      title: "Supprimer cet élève ?",
      text: nomComplet(eleve),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#B42318"
    });
    if (!resultat.isConfirmed) return;
    enregistrer(lignes.filter(x => x.id !== eleve.id));
    definirPage(p => Math.max(1, Math.min(p, Math.ceil((donnees.length - 1) / 8))));
    Swal.fire({ icon: "success", title: "Élève supprimé", timer: 1200, showConfirmButton: false });
  };

  const champs = [
    { cle: "matricule", label: "Matricule", type: "text", requis: true },
    { cle: "nom", label: "Nom", type: "text", requis: true },
    { cle: "prenom", label: "Prénom", type: "text", requis: true },
    { cle: "sexe", label: "Sexe", options: ["Féminin", "Masculin"], requis: true },
    { cle: "naissance", label: "Date de naissance", type: "date" },
    { cle: "statut", label: "Statut", options: ["Inscrit", "En attente", "Suspendu"] },
    { cle: "responsable", label: "Responsable", type: "text" },
    { cle: "telephone", label: "Téléphone", type: "tel" }
  ];

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${texte}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Ma Classe</h1>
          <p className={`mt-1 text-sm ${secondaire}`}>Gestion des élèves · Classe {classe || "non attribuée"}</p>
        </div>
        <button type="button" disabled={!classe} onClick={() => ouvrir(null)}
          className={`${bouton} bg-[#540916] text-white hover:bg-[#400711] disabled:opacity-50`}>
          <Plus size={17} /> Ajouter un élève
        </button>
      </header>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div>
            <h2 className={`text-base font-bold ${texte}`}>Liste des élèves</h2>
            <p className={`mt-1 text-xs ${secondaire}`}>{donnees.length} résultat(s)</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => exporterExcel(donnees, `eleves-${classe}`)} className={`${bouton} border border-[#E4E7EC] text-[#171717] dark:border-[#33445E] dark:text-white`}>
              <Download size={16} /> Excel
            </button>
            <button type="button" onClick={() => exporterPDF(donnees, colonnes, `eleves-${classe}`)} className={`${bouton} border border-[#E4E7EC] text-[#171717] dark:border-[#33445E] dark:text-white`}>
              <FileDown size={16} /> PDF
            </button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-3 p-3 md:grid-cols-3">
          <label className="relative">
            <Search size={17} className="absolute left-3 top-3 text-[#98A2B3]" />
            <input value={recherche} onChange={e => filtrer(definirRecherche, e.target.value)}
              placeholder="Nom, prénom ou matricule..." className={`${champ} pl-10`} />
          </label>
          <select aria-label="Filtrer par sexe" value={sexe} onChange={e => filtrer(definirSexe, e.target.value)} className={champ}>
            <option value="">Tous les sexes</option>
            <option value="Féminin">Féminin</option>
            <option value="Masculin">Masculin</option>
          </select>
          <select aria-label="Filtrer par statut" value={statut} onChange={e => filtrer(definirStatut, e.target.value)} className={champ}>
            <option value="">Tous les statuts</option>
            <option value="Inscrit">Inscrit</option>
            <option value="En attente">En attente</option>
            <option value="Suspendu">Suspendu</option>
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] shadow-sm dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                {["N°", "Matricule", "Élève", "Sexe", "Statut", "Actions"].map(t => <th key={t} className="px-4 py-3 font-semibold">{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibles.map((e, i) => (
                <tr key={e.id} className="border-t border-[#EEF0F3] hover:bg-[#F8F9FC] dark:border-[#263852] dark:hover:bg-[#1B2C47]">
                  <td className={`px-4 py-3 ${secondaire}`}>{(page - 1) * 8 + i + 1}</td>
                  <td className={`px-4 py-3 ${texte}`}>{e.matricule}</td>
                  <td className={`px-4 py-3 font-semibold ${texte}`}>{nomComplet(e)}</td>
                  <td className={`px-4 py-3 ${texte}`}>{e.sexe}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${e.statut === "Inscrit" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white"}`}>
                      {e.statut || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button type="button" title="Détails" aria-label="Voir détails" onClick={() => definirSelection(e)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-white/10"><Eye size={17} /></button>
                      <button type="button" title="Modifier" aria-label="Modifier" onClick={() => ouvrir(e)} className="rounded-lg p-2 text-[#540916] hover:bg-red-50 dark:text-[#F3A5BC] dark:hover:bg-white/10"><Pencil size={17} /></button>
                      <button type="button" title="Supprimer" aria-label="Supprimer" onClick={() => supprimer(e)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-white/10"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibles.length && (
                <tr><td colSpan={6} className={`px-4 py-12 text-center ${secondaire}`}>
                  Aucun élève enregistré ou trouvé.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-[#EAE3E5] bg-white p-3 dark:border-[#263852] dark:bg-[#14243D]">
          <span className={`text-xs ${secondaire}`}>Page {page} / {pages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => definirPage(p => p - 1)} className={`${bouton} border border-[#E4E7EC] disabled:opacity-40 dark:border-[#33445E] dark:text-white`}>Précédent</button>
            <button type="button" disabled={page >= pages} onClick={() => definirPage(p => p + 1)} className={`${bouton} border border-[#E4E7EC] disabled:opacity-40 dark:border-[#33445E] dark:text-white`}>Suivant</button>
          </div>
        </div>
      </section>

      {formulaire && (
        <Fenetre titre={formulaire.id ? "Modifier un élève" : "Ajouter un élève"} fermer={() => definirFormulaire(null)}>
          <form onSubmit={soumettre} className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {champs.map(c => (
                <label key={c.cle} className="block">
                  <span className={`mb-1.5 block text-xs font-semibold ${texte}`}>{c.label}{c.requis && " *"}</span>
                  {c.options ? (
                    <select required={c.requis} value={formulaire[c.cle] || ""} onChange={e => definirFormulaire(v => ({ ...v, [c.cle]: e.target.value }))} className={champ}>
                      <option value="">Sélectionner</option>
                      {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={c.type} required={c.requis} value={formulaire[c.cle] || ""}
                      onChange={e => definirFormulaire(v => ({ ...v, [c.cle]: e.target.value }))} className={champ} />
                  )}
                </label>
              ))}
              <label className="block">
                <span className={`mb-1.5 block text-xs font-semibold ${texte}`}>Classe</span>
                <input value={classe} readOnly className={`${champ} cursor-not-allowed opacity-70`} />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
              <button type="button" onClick={() => definirFormulaire(null)} className={`${bouton} border border-[#E4E7EC] ${texte} dark:border-[#33445E]`}>Annuler</button>
              <button type="submit" className={`${bouton} bg-[#540916] text-white hover:bg-[#400711]`}>{formulaire.id ? "Enregistrer" : "Ajouter"}</button>
            </div>
          </form>
        </Fenetre>
      )}

      {selection && (
        <Fenetre titre="Fiche de l'élève" fermer={() => definirSelection(null)}>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
            {[["Matricule", selection.matricule], ["Nom", selection.nom], ["Prénom", selection.prenom],
              ["Classe", selection.classe], ["Sexe", selection.sexe], ["Naissance", selection.naissance],
              ["Statut", selection.statut], ["Responsable", selection.responsable], ["Téléphone", selection.telephone]
            ].map(([label, valeur]) => (
              <div key={label} className="rounded-xl bg-[#F8F9FC] p-3 dark:bg-[#0B172B]">
                <p className={`text-xs ${secondaire}`}>{label}</p>
                <p className={`mt-1 text-sm font-semibold ${texte}`}>{valeur || "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-[#EAE3E5] p-4 dark:border-[#263852]">
            <button type="button" onClick={() => definirSelection(null)} className={`${bouton} bg-[#540916] text-white`}>Fermer</button>
          </div>
        </Fenetre>
      )}
    </div>
  );
}