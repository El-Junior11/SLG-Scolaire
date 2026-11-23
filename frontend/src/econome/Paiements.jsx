import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Eye, X, Save, Download, FileText, RefreshCw,
  Loader2, Receipt, CalendarDays, AlertCircle, CreditCard
} from "lucide-react";
import Swal from "sweetalert2";
import { exporterExcel, exporterPDF } from "../utilitaires/exportations";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const modes = ["Espèces", "Mobile Money", "Virement bancaire", "Chèque"];
const formulaireVide = { eleve_id: "", montant: "", mode: "", date: "", observation: "" };
const idPaiement = p => p.id ?? p.id_paiement;
const idEleve = e => e.id ?? e.id_eleve;

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

function extraireListe(resultat, cle) {
  if (Array.isArray(resultat)) return resultat;
  if (Array.isArray(resultat?.[cle])) return resultat[cle];
  if (Array.isArray(resultat?.data)) return resultat.data;
  if (Array.isArray(resultat?.data?.[cle])) return resultat.data[cle];
  throw new Error(`Format de réponse invalide : ${cle}.`);
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
    Validé: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "En attente": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    Annulé: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    Rejeté: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[statut] || "bg-gray-100 text-gray-700 dark:bg-[#263852] dark:text-gray-200"}`}>
      {statut || "Non renseigné"}
    </span>
  );
}

export default function Paiements() {
  const [paiements, setPaiements] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [chargementEleves, setChargementEleves] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [erreurEleves, setErreurEleves] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreMode, setFiltreMode] = useState("Tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [filtreDate, setFiltreDate] = useState("");
  const [page, setPage] = useState(1);
  const [fenetre, setFenetre] = useState(null);
  const [formulaire, setFormulaire] = useState(formulaireVide);
  const [selection, setSelection] = useState(null);
  const taillePage = 8;

  // Contrat API provisoire : à adapter aux routes réelles du backend.
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const resultat = await requete("/paiements");
      setPaiements(extraireListe(resultat, "paiements"));
    } catch (e) {
      setPaiements([]);
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  const chargerEleves = useCallback(async () => {
    setChargementEleves(true);
    setErreurEleves("");
    try {
      const resultat = await requete("/eleves");
      setEleves(extraireListe(resultat, "eleves"));
    } catch (e) {
      setEleves([]);
      setErreurEleves(e.message);
    } finally {
      setChargementEleves(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { setPage(1); }, [recherche, filtreMode, filtreStatut, filtreDate]);

  const nomEleve = p => {
    if (typeof p.eleve === "string") return p.eleve;
    if (p.eleve && typeof p.eleve === "object") {
      return `${p.eleve.nom || ""} ${p.eleve.prenom || ""}`.trim() || "—";
    }
    const id = p.eleve_id ?? p.id_eleve;
    const trouve = eleves.find(e => String(idEleve(e)) === String(id));
    return trouve ? `${trouve.nom || ""} ${trouve.prenom || ""}`.trim() : "—";
  };

  const paiementsFiltres = useMemo(() => paiements.filter(p => {
    const texte = `${p.reference || ""} ${nomEleve(p)} ${p.mode || ""}`.toLowerCase();
    const correspond = texte.includes(recherche.trim().toLowerCase());
    const modeOK = filtreMode === "Tous" || p.mode === filtreMode;
    const statutOK = filtreStatut === "Tous" || p.statut === filtreStatut;
    const dateOK = !filtreDate || String(p.date || "").slice(0, 10) === filtreDate;
    return correspond && modeOK && statutOK && dateOK;
  }), [paiements, eleves, recherche, filtreMode, filtreStatut, filtreDate]);

  const totalPages = Math.max(1, Math.ceil(paiementsFiltres.length / taillePage));
  const pageActive = Math.min(page, totalPages);
  const lignes = paiementsFiltres.slice((pageActive - 1) * taillePage, pageActive * taillePage);
  const statuts = [...new Set(paiements.map(p => p.statut).filter(Boolean))];

  const ouvrirPaiement = async () => {
    setFormulaire({ ...formulaireVide });
    setFenetre("paiement");
    await chargerEleves();
  };

  const enregistrer = async e => {
    e.preventDefault();
    const montant = Number(formulaire.montant);

    if (!formulaire.eleve_id || !formulaire.mode || !formulaire.date) {
      Swal.fire("Champs obligatoires", "Renseignez l'élève, le mode et la date du paiement.", "warning");
      return;
    }
    if (!Number.isFinite(montant) || montant <= 0 || !Number.isInteger(montant)) {
      Swal.fire("Montant invalide", "Le montant doit être un entier positif en ariary.", "warning");
      return;
    }

    const confirmation = await Swal.fire({
      title: "Confirmer le paiement ?",
      html: `Montant : <strong>${montant.toLocaleString("fr-FR")} Ar</strong><br/>Cette opération sera enregistrée sur le serveur.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirmer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#540916"
    });
    if (!confirmation.isConfirmed) return;

    setEnCours(true);
    try {
      await requete("/paiements", {
        method: "POST",
        body: JSON.stringify({
          eleve_id: formulaire.eleve_id,
          montant,
          mode: formulaire.mode,
          date: formulaire.date,
          observation: formulaire.observation.trim()
        })
      });
      setFenetre(null);
      await charger();
      Swal.fire({
        icon: "success",
        title: "Paiement enregistré",
        text: "Le paiement a été transmis et enregistré par le serveur.",
        timer: 1800,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire("Paiement non enregistré", e.message, "error");
    } finally {
      setEnCours(false);
    }
  };

  const consulterRecu = async paiement => {
    const id = idPaiement(paiement);
    if (id == null) return Swal.fire("Erreur", "Identifiant du paiement manquant.", "error");

    try {
      const reponse = await fetch(`${API}/paiements/${encodeURIComponent(id)}/recu`, {
        credentials: "include",
        headers: { Accept: "application/pdf" }
      });
      if (!reponse.ok) {
        const erreur = await reponse.json().catch(() => ({}));
        throw new Error(erreur.message || erreur.error || `Erreur HTTP ${reponse.status}`);
      }
      const type = reponse.headers.get("content-type") || "";
      if (!type.includes("application/pdf")) throw new Error("Le serveur n'a pas retourné un reçu PDF.");
      const fichier = await reponse.blob();
      const url = URL.createObjectURL(fichier);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `recu-paiement-${id}.pdf`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      Swal.fire("Reçu indisponible", e.message, "error");
    }
  };

  const exporter = format => {
    const donnees = paiementsFiltres.map(p => ({
      Référence: p.reference || "",
      Élève: nomEleve(p),
      Montant: p.montant ?? "",
      Mode: p.mode || "",
      Date: String(p.date || "").slice(0, 10),
      Statut: p.statut || ""
    }));
    if (!donnees.length) return Swal.fire("Aucune donnée", "Aucun paiement à exporter.", "info");
    if (format === "excel") exporterExcel(donnees, "paiements-slg");
    else exporterPDF(donnees, ["Référence", "Élève", "Montant", "Mode", "Date", "Statut"], "paiements-slg");
  };

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Paiements</h1>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A8B7CF]">
            Enregistrement et suivi des paiements scolaires.
          </p>
        </div>
        <button onClick={ouvrirPaiement} className={`${bouton} bg-[#540916] text-white hover:bg-[#701326]`}>
          <Plus size={17}/> Nouveau paiement
        </button>
      </div>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div className="relative min-w-[180px] flex-1 sm:max-w-sm">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
            <input value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Élève ou référence..." className={`${champ} pl-10`}/>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={filtreMode} onChange={e => setFiltreMode(e.target.value)} className={`${champ} w-auto max-w-[175px]`}>
              <option value="Tous">Tous les modes</option>
              {modes.map(m => <option key={m}>{m}</option>)}
            </select>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} className={`${champ} w-auto max-w-[165px]`}>
              <option value="Tous">Tous les statuts</option>
              {statuts.map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="relative">
              <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
              <input type="date" value={filtreDate} onChange={e => setFiltreDate(e.target.value)}
                title="Filtrer par date" className={`${champ} w-auto pl-9`}/>
            </div>
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
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                {["Référence", "Élève", "Montant", "Mode", "Date", "Statut", "Actions"].map(t => (
                  <th key={t} className="px-5 py-3 font-bold">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAEC] dark:divide-[#263852]">
              {!chargement && !erreur && lignes.map(p => (
                <tr key={idPaiement(p)} className="hover:bg-[#FAF8F9] dark:hover:bg-[#1B2C46]">
                  <td className="px-5 py-3 font-semibold text-[#540916] dark:text-[#93C5FD]">{p.reference || "—"}</td>
                  <td className="px-5 py-3 font-semibold text-[#171717] dark:text-white">{nomEleve(p)}</td>
                  <td className="px-5 py-3 font-bold text-[#171717] dark:text-white">
                    {Number(p.montant || 0).toLocaleString("fr-FR")} Ar
                  </td>
                  <td className="px-5 py-3 text-[#667085] dark:text-[#A8B7CF]">{p.mode || "—"}</td>
                  <td className="px-5 py-3 text-[#667085] dark:text-[#A8B7CF]">{String(p.date || "").slice(0, 10) || "—"}</td>
                  <td className="px-5 py-3"><Badge statut={p.statut}/></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Détails" onClick={() => { setSelection(p); setFenetre("details"); }}
                        className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:hover:bg-[#263852]">
                        <Eye size={17}/>
                      </button>
                      {p.statut === "Validé" && (
                        <button title="Télécharger le reçu" onClick={() => consulterRecu(p)}
                          className="rounded-lg p-2 text-green-600 hover:bg-green-50 dark:hover:bg-[#263852]">
                          <Receipt size={17}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {chargement && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#667085] dark:text-[#A8B7CF]">
              <Loader2 size={19} className="animate-spin"/> Chargement des paiements...
            </div>
          )}
          {!chargement && erreur && (
            <div className="p-10 text-center">
              <AlertCircle size={30} className="mx-auto mb-3 text-red-500"/>
              <p className="text-sm font-semibold text-red-600">Impossible de charger les paiements.</p>
              <p className="mt-2 text-xs text-[#667085] dark:text-[#A8B7CF]">{erreur}</p>
              <button onClick={charger} className={`${bouton} mt-4 bg-[#540916] text-white`}>Réessayer</button>
            </div>
          )}
          {!chargement && !erreur && !lignes.length && (
            <div className="p-12 text-center text-sm text-[#667085] dark:text-[#A8B7CF]">
              Aucun paiement disponible.
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EAE3E5] px-4 py-3 text-xs text-[#667085] dark:border-[#263852] dark:text-[#A8B7CF]">
          <span>{paiementsFiltres.length} paiement(s) · Page {pageActive} / {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={pageActive <= 1} onClick={() => setPage(p => p - 1)}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>Précédent</button>
            <button disabled={pageActive >= totalPages} onClick={() => setPage(p => p + 1)}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>Suivant</button>
          </div>
        </div>
      </section>

      {fenetre === "paiement" && (
        <Fenetre titre="Enregistrer un paiement" fermer={() => !enCours && setFenetre(null)}>
          <form onSubmit={enregistrer} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Champ label="Élève *">
                <select required value={formulaire.eleve_id}
                  onChange={e => setFormulaire(p => ({ ...p, eleve_id: e.target.value }))}
                  disabled={chargementEleves || !!erreurEleves} className={champ}>
                  <option value="">Sélectionner un élève...</option>
                  {eleves.map(e => (
                    <option key={idEleve(e)} value={idEleve(e)}>
                      {e.nom} {e.prenom} {e.matricule ? `— ${e.matricule}` : ""}
                    </option>
                  ))}
                </select>
              </Champ>
              {chargementEleves && <p className="mt-1.5 text-xs text-[#667085]">Chargement des élèves...</p>}
              {erreurEleves && <p className="mt-1.5 text-xs text-red-500">{erreurEleves}</p>}
              {!chargementEleves && !erreurEleves && !eleves.length && (
                <p className="mt-1.5 text-xs text-amber-600">Aucun élève disponible.</p>
              )}
            </div>

            <Champ label="Montant (Ar) *">
              <input required type="number" min="1" step="1" value={formulaire.montant}
                onChange={e => setFormulaire(p => ({ ...p, montant: e.target.value }))}
                placeholder="Montant en ariary" className={champ}/>
            </Champ>

            <Champ label="Mode de paiement *">
              <select required value={formulaire.mode}
                onChange={e => setFormulaire(p => ({ ...p, mode: e.target.value }))} className={champ}>
                <option value="">Sélectionner...</option>
                {modes.map(m => <option key={m}>{m}</option>)}
              </select>
            </Champ>

            <Champ label="Date du paiement *">
              <input required type="date" value={formulaire.date}
                onChange={e => setFormulaire(p => ({ ...p, date: e.target.value }))} className={champ}/>
            </Champ>

            <div className="sm:col-span-2">
              <Champ label="Observation">
                <textarea rows={3} value={formulaire.observation}
                  onChange={e => setFormulaire(p => ({ ...p, observation: e.target.value }))}
                  placeholder="Observation facultative..." className={`${champ} resize-none`}/>
              </Champ>
            </div>

            <div className="sm:col-span-2 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-xs leading-5 text-[#667085] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <CreditCard size={16} className="mb-1"/>
              La référence du paiement et le numéro du reçu seront générés par le backend.
              Un reçu ne sera disponible qu'après validation du paiement.
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
              <button type="button" disabled={enCours} onClick={() => setFenetre(null)}
                className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
                Annuler
              </button>
              <button type="submit" disabled={enCours || chargementEleves || !!erreurEleves || !eleves.length}
                className={`${bouton} bg-[#540916] px-5 text-white hover:bg-[#701326]`}>
                {enCours ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                Enregistrer le paiement
              </button>
            </div>
          </form>
        </Fenetre>
      )}

      {fenetre === "details" && selection && (
        <Fenetre titre="Détails du paiement" fermer={() => setFenetre(null)}>
          <div className="space-y-2">
            {[
              ["Référence", selection.reference],
              ["Élève", nomEleve(selection)],
              ["Montant", selection.montant == null ? "" : `${Number(selection.montant).toLocaleString("fr-FR")} Ar`],
              ["Mode de paiement", selection.mode],
              ["Date", String(selection.date || "").slice(0, 10)],
              ["Statut", selection.statut],
              ["Observation", selection.observation]
            ].map(([titre, valeur]) => (
              <div key={titre} className="flex justify-between gap-4 border-b border-[#F0EAEC] py-2 text-sm dark:border-[#263852]">
                <span className="text-[#667085] dark:text-[#A8B7CF]">{titre}</span>
                <strong className="max-w-[65%] break-words text-right font-semibold text-[#171717] dark:text-white">
                  {valeur || "—"}
                </strong>
              </div>
            ))}
          </div>
          {selection.statut === "Validé" && (
            <div className="mt-5 flex justify-end">
              <button onClick={() => consulterRecu(selection)}
                className={`${bouton} bg-[#540916] text-white hover:bg-[#701326]`}>
                <Receipt size={17}/> Télécharger le reçu
              </button>
            </div>
          )}
        </Fenetre>
      )}
    </div>
  );
}