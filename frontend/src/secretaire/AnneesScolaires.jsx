import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Pencil, Trash2, Search, Eye, ArrowRightLeft, Download, FileText, X, Save, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";
import { lireModule, enregistrerModule } from "../services/stockageDemonstration";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors";
const trimestres = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];
const vide = { nom: "", debut: "", fin: "", statut: "Préparation" };
const normaliser = v => String(v || "").trim().toLowerCase().replace(/\s+/g, "");

function Fenetre({ titre, fermer, children }) {
  useEffect(() => {
    const touche = e => { if (e.key === "Escape") fermer(); };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [fermer]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101828]/65 p-3 backdrop-blur-sm sm:p-5" onMouseDown={e => e.target === e.currentTarget && fermer()}>
      <div className={`${carte} flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden`}>
        <div className="flex shrink-0 items-center justify-between border-b border-[#EAE3E5] px-5 py-4 dark:border-[#263852]">
          <h2 className="text-lg font-bold text-[#171717] dark:text-white">{titre}</h2>
          <button type="button" onClick={fermer} className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:hover:bg-[#263852]"><X size={19}/></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default function AnneesScolaires() {
  const [annees, setAnnees] = useState(() => lireModule("annees-scolaires") || []);
  const [eleves, setEleves] = useState(() => lireModule("eleves") || []);
  const [classes] = useState(() => lireModule("classes") || []);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("Tous");
  const [page, setPage] = useState(1);
  const [onglet, setOnglet] = useState("annees");
  const [fenetre, setFenetre] = useState(null);
  const [formulaire, setFormulaire] = useState(vide);
  const [selection, setSelection] = useState(null);
  const [passage, setPassage] = useState({ annee: "", source: "", destination: "" });
  const [periodes, setPeriodes] = useState({});
  const taillePage = 8;

  const sauvegarderAnnees = donnees => {
    enregistrerModule("annees-scolaires", donnees);
    setAnnees(donnees);
  };

  const anneesFiltrees = useMemo(() => annees.filter(a => {
    const texte = `${a.nom || ""} ${a.statut || ""}`.toLowerCase();
    return texte.includes(recherche.toLowerCase()) && (filtre === "Tous" || a.statut === filtre);
  }), [annees, recherche, filtre]);

  const totalPages = Math.max(1, Math.ceil(anneesFiltrees.length / taillePage));
  const lignes = anneesFiltrees.slice((page - 1) * taillePage, page * taillePage);

  useEffect(() => setPage(1), [recherche, filtre]);

  const ouvrirFormulaire = annee => {
    setFormulaire(annee ? { ...vide, ...annee } : { ...vide });
    setFenetre("formulaire");
  };

  const enregistrer = e => {
    e.preventDefault();
    const nom = formulaire.nom.trim();
    if (!nom || !formulaire.debut || !formulaire.fin) {
      Swal.fire("Champs obligatoires", "Veuillez renseigner le nom et les dates.", "warning");
      return;
    }
    if (formulaire.fin < formulaire.debut) {
      Swal.fire("Dates invalides", "La date de fin doit être postérieure à la date de début.", "warning");
      return;
    }
    if (annees.some(a => normaliser(a.nom) === normaliser(nom) && String(a.id) !== String(formulaire.id))) {
      Swal.fire("Année existante", "Cette année scolaire existe déjà.", "warning");
      return;
    }

    const objet = { ...formulaire, nom, id: formulaire.id || `annee-${Date.now()}` };
    const donnees = formulaire.id ? annees.map(a => String(a.id) === String(formulaire.id) ? objet : a) : [...annees, objet];
    sauvegarderAnnees(donnees);
    setFenetre(null);
    Swal.fire({ icon: "success", title: "Enregistrement effectué", timer: 1400, showConfirmButton: false });
  };

  const supprimer = async annee => {
    const confirmation = await Swal.fire({
      title: "Supprimer cette année ?",
      text: `L'année ${annee.nom} sera supprimée de la liste.`,
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Supprimer", cancelButtonText: "Annuler",
      confirmButtonColor: "#B42318"
    });
    if (!confirmation.isConfirmed) return;
    sauvegarderAnnees(annees.filter(a => String(a.id) !== String(annee.id)));
    Swal.fire({ icon: "success", title: "Année supprimée", timer: 1300, showConfirmButton: false });
  };

  const activer = async annee => {
    const confirmation = await Swal.fire({
      title: "Activer cette année scolaire ?",
      text: "Les autres années seront marquées comme terminées.",
      icon: "question", showCancelButton: true,
      confirmButtonText: "Activer", cancelButtonText: "Annuler",
      confirmButtonColor: "#540916"
    });
    if (!confirmation.isConfirmed) return;
    sauvegarderAnnees(annees.map(a => ({
      ...a, statut: String(a.id) === String(annee.id) ? "Active" : "Terminée"
    })));
    Swal.fire({ icon: "success", title: "Année scolaire activée", timer: 1400, showConfirmButton: false });
  };

  const exporter = type => {
    const donnees = anneesFiltrees.map(a => ({
      "Année scolaire": a.nom,
      "Début": a.debut || "",
      "Fin": a.fin || "",
      "Statut": a.statut || ""
    }));
    if (!donnees.length) return;
    if (type === "excel") exporterExcel(donnees, "annees-scolaires");
    else exporterPDF(donnees, ["Année scolaire", "Début", "Fin", "Statut"], "annees-scolaires");
  };

  const executerPassage = async () => {
    if (!passage.annee || !passage.source || !passage.destination || normaliser(passage.source) === normaliser(passage.destination)) return;
    const concernes = eleves.filter(e => normaliser(e.classe) === normaliser(passage.source));
    if (!concernes.length) {
      Swal.fire("Aucun élève", "Aucun élève trouvé dans la classe d'origine.", "info");
      return;
    }

    const confirmation = await Swal.fire({
      title: "Confirmer le passage ?",
      html: `<b>${concernes.length} élève(s)</b> seront déplacés vers la classe sélectionnée.<br><br>Cette opération modifie les affectations locales et ne constitue pas une clôture officielle.`,
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Confirmer le passage", cancelButtonText: "Annuler",
      confirmButtonColor: "#540916"
    });
    if (!confirmation.isConfirmed) return;

    const donnees = eleves.map(e => normaliser(e.classe) === normaliser(passage.source) ? { ...e, classe: passage.destination } : e);
    enregistrerModule("eleves", donnees);
    setEleves(donnees);
    Swal.fire({ icon: "success", title: "Passage effectué", text: `${concernes.length} élève(s) mis à jour.` });
  };

  const listeClasses = [...new Set(classes.map(c => c.nom).filter(Boolean))];

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Années scolaires</h1>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A8B7CF]">Gestion des années, trimestres et passages de classe.</p>
        </div>
        {onglet === "annees" && (
          <button onClick={() => ouvrirFormulaire(null)} className={`${bouton} bg-[#540916] text-white hover:bg-[#701326]`}>
            <Plus size={17}/> Nouvelle année
          </button>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-b border-[#EAE3E5] pb-2 dark:border-[#263852]">
        {[
          ["annees", "Années scolaires", CalendarDays],
          ["trimestres", "Trimestres", FileText],
          ["passages", "Passage de classe", ArrowRightLeft]
        ].map(([id, titre, Icon]) => (
          <button key={id} onClick={() => setOnglet(id)}
            className={`${bouton} ${onglet === id ? "bg-[#540916] text-white dark:bg-[#263852]" : "text-[#667085] hover:bg-gray-100 dark:text-[#A8B7CF] dark:hover:bg-[#263852]"}`}>
            <Icon size={16}/>{titre}
          </button>
        ))}
      </div>

      {onglet === "annees" && (
        <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
            <div className="relative min-w-[190px] flex-1 sm:max-w-sm">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
              <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher une année..."
                className={`${champ} pl-10`}/>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={filtre} onChange={e => setFiltre(e.target.value)} className={`${champ} w-auto`}>
                {["Tous", "Préparation", "Active", "Terminée"].map(x => <option key={x}>{x}</option>)}
              </select>
              <button onClick={() => exporter("excel")} className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}><Download size={16}/> Excel</button>
              <button onClick={() => exporter("pdf")} className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}><FileText size={16}/> PDF</button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
                <tr>
                  {["Année scolaire", "Date de début", "Date de fin", "Statut", "Actions"].map(t => <th key={t} className="px-5 py-3 font-bold">{t}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAEC] dark:divide-[#263852]">
                {lignes.map(a => (
                  <tr key={a.id} className="hover:bg-[#FAF8F9] dark:hover:bg-[#1B2C46]">
                    <td className="px-5 py-3 font-semibold text-[#171717] dark:text-white">{a.nom}</td>
                    <td className="px-5 py-3 text-[#667085] dark:text-[#A8B7CF]">{a.debut || "—"}</td>
                    <td className="px-5 py-3 text-[#667085] dark:text-[#A8B7CF]">{a.fin || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        a.statut === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                        a.statut === "Terminée" ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}>{a.statut || "Préparation"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button title="Détails" onClick={() => { setSelection(a); setFenetre("details"); }}
                          className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:hover:bg-[#263852]"><Eye size={17}/></button>
                        <button title="Modifier" onClick={() => ouvrirFormulaire(a)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-[#263852]"><Pencil size={17}/></button>
                        {a.statut !== "Active" && (
                          <button title="Activer" onClick={() => activer(a)}
                            className="rounded-lg p-2 text-green-600 hover:bg-green-50 dark:hover:bg-[#263852]"><CheckCircle2 size={17}/></button>
                        )}
                        <button title="Supprimer" onClick={() => supprimer(a)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-[#263852]"><Trash2 size={17}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!lignes.length && <div className="p-12 text-center text-sm text-[#667085]">Aucune année scolaire trouvée.</div>}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EAE3E5] px-4 py-3 text-xs text-[#667085] dark:border-[#263852] dark:text-[#A8B7CF]">
            <span>{anneesFiltrees.length} résultat(s) · Page {Math.min(page, totalPages)} / {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={`${bouton} border border-[#E4E7EC] disabled:opacity-40 dark:border-[#33445E]`}>Précédent</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={`${bouton} border border-[#E4E7EC] disabled:opacity-40 dark:border-[#33445E]`}>Suivant</button>
            </div>
          </div>
        </section>
      )}

      {onglet === "trimestres" && (
        <section className={`${carte} min-h-0 flex-1 overflow-y-auto p-5`}>
          <h2 className="mb-1 text-lg font-bold text-[#171717] dark:text-white">Périodes trimestrielles</h2>
          <p className="mb-5 text-sm text-[#667085] dark:text-[#A8B7CF]">Les trois trimestres de l'année scolaire.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {trimestres.map((t, i) => (
              <div key={t} className="rounded-xl border border-[#EAE3E5] p-4 dark:border-[#33445E]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EDEF] font-bold text-[#540916] dark:bg-[#263852] dark:text-white">{i + 1}</span>
                  <CalendarDays size={19} className="text-[#98A2B3]"/>
                </div>
                <h3 className="mb-3 font-bold text-[#171717] dark:text-white">{t}</h3>
                <p className="text-xs leading-6 text-[#667085] dark:text-[#A8B7CF]">
                  Les dates de début et de fin seront configurables après intégration du backend.
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {onglet === "passages" && (
        <section className={`${carte} min-h-0 flex-1 overflow-y-auto p-5`}>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#171717] dark:text-white">Passage en classe supérieure</h2>
            <p className="mt-1 text-sm text-[#667085] dark:text-[#A8B7CF]">
              Modifier les affectations des élèves. Cette opération locale ne constitue pas une clôture officielle.
            </p>
          </div>

          <div className="grid max-w-4xl gap-4 md:grid-cols-3">
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">Année scolaire</span>
              <select value={passage.annee} onChange={e => setPassage(p => ({ ...p, annee: e.target.value }))} className={champ}>
                <option value="">Sélectionner...</option>
                {annees.map(a => <option key={a.id} value={a.nom}>{a.nom}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">Classe d'origine</span>
              <select value={passage.source} onChange={e => setPassage(p => ({ ...p, source: e.target.value }))} className={champ}>
                <option value="">Sélectionner...</option>
                {listeClasses.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">Classe de destination</span>
              <select value={passage.destination} onChange={e => setPassage(p => ({ ...p, destination: e.target.value }))} className={champ}>
                <option value="">Sélectionner...</option>
                {listeClasses.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>

          {passage.source && (
            <div className="mt-5 max-w-4xl rounded-xl border border-[#EAE3E5] bg-[#F8F9FC] p-4 text-sm dark:border-[#33445E] dark:bg-[#0B172B]">
              <strong className="text-[#171717] dark:text-white">
                {eleves.filter(e => normaliser(e.classe) === normaliser(passage.source)).length} élève(s) concerné(s)
              </strong>
              <p className="mt-1 text-xs text-[#667085] dark:text-[#A8B7CF]">Vérifiez les classes avant de confirmer.</p>
            </div>
          )}

          <button onClick={executerPassage}
            disabled={!passage.annee || !passage.source || !passage.destination || normaliser(passage.source) === normaliser(passage.destination)}
            className={`${bouton} mt-5 bg-[#540916] px-5 py-3 text-white hover:bg-[#701326] disabled:cursor-not-allowed disabled:opacity-40`}>
            <ArrowRightLeft size={17}/> Confirmer le passage
          </button>
        </section>
      )}

      {fenetre === "formulaire" && (
        <Fenetre titre={formulaire.id ? "Modifier l'année scolaire" : "Nouvelle année scolaire"} fermer={() => setFenetre(null)}>
          <form onSubmit={enregistrer} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">Année scolaire *</span>
              <input required value={formulaire.nom} onChange={e => setFormulaire(p => ({ ...p, nom: e.target.value }))}
                placeholder="Ex. 2026-2027" className={champ}/>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Date de début", "debut"],
                ["Date de fin", "fin"]
              ].map(([titre, cle]) => (
                <label key={cle}>
                  <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">{titre} *</span>
                  <input type="date" required value={formulaire[cle] || ""}
                    onChange={e => setFormulaire(p => ({ ...p, [cle]: e.target.value }))} className={champ}/>
                </label>
              ))}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#344054] dark:text-[#A8B7CF]">Statut</span>
              <select value={formulaire.statut} onChange={e => setFormulaire(p => ({ ...p, statut: e.target.value }))} className={champ}>
                {["Préparation", "Active", "Terminée"].map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <div className="flex justify-end gap-2 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
              <button type="button" onClick={() => setFenetre(null)} className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>Annuler</button>
              <button type="submit" className={`${bouton} bg-[#540916] px-5 text-white hover:bg-[#701326]`}><Save size={16}/> Enregistrer</button>
            </div>
          </form>
        </Fenetre>
      )}

      {fenetre === "details" && selection && (
        <Fenetre titre="Détails de l'année scolaire" fermer={() => setFenetre(null)}>
          <div className="space-y-3">
            {[
              ["Année scolaire", selection.nom],
              ["Date de début", selection.debut || "Non renseignée"],
              ["Date de fin", selection.fin || "Non renseignée"],
              ["Statut", selection.statut || "Préparation"]
            ].map(([titre, valeur]) => (
              <div key={titre} className="flex justify-between gap-4 border-b border-[#F0EAEC] py-2 text-sm dark:border-[#263852]">
                <span className="text-[#667085] dark:text-[#A8B7CF]">{titre}</span>
                <strong className="text-right text-[#171717] dark:text-white">{valeur}</strong>
              </div>
            ))}
          </div>
        </Fenetre>
      )}
    </div>
  );
}