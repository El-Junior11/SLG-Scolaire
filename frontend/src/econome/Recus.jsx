import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Printer, FileDown, Eye, X, RefreshCw, Loader2,
  Receipt, CalendarDays, AlertCircle, CheckCircle2
} from "lucide-react";
import Swal from "sweetalert2";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const idRecu = r => r.id ?? r.id_recu;
const dateCourte = valeur => valeur ? String(valeur).slice(0, 10) : "—";
const montantAr = valeur => valeur == null || valeur === "" ? "—" : `${Number(valeur).toLocaleString("fr-FR")} Ar`;

async function requete(chemin, options = {}) {
  const reponse = await fetch(`${API}${chemin}`, {
    ...options,
    credentials: "include",
    headers: { Accept: "application/json", ...options.headers }
  });
  if (!reponse.ok) {
    const erreur = await reponse.json().catch(() => ({}));
    throw new Error(erreur.message || erreur.error || `Erreur HTTP ${reponse.status}`);
  }
  if (reponse.status === 204) return null;
  return reponse.json();
}

function extraireListe(resultat) {
  if (Array.isArray(resultat)) return resultat;
  if (Array.isArray(resultat?.recus)) return resultat.recus;
  if (Array.isArray(resultat?.data)) return resultat.data;
  if (Array.isArray(resultat?.data?.recus)) return resultat.data.recus;
  throw new Error("Format de réponse API invalide pour les reçus.");
}

function nomEleve(recu) {
  if (typeof recu.eleve === "string") return recu.eleve;
  if (recu.eleve && typeof recu.eleve === "object") {
    return `${recu.eleve.nom || ""} ${recu.eleve.prenom || ""}`.trim() || "—";
  }
  return recu.nom_eleve || "—";
}

function Badge({ statut }) {
  const styles = {
    "Émis": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "Annulé": "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "En attente": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[statut] || "bg-gray-100 text-gray-700 dark:bg-[#263852] dark:text-gray-200"}`}>
      {statut || "Non renseigné"}
    </span>
  );
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

export default function Recus() {
  const [recus, setRecus] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [telechargement, setTelechargement] = useState(null);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [filtreDate, setFiltreDate] = useState("");
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState(null);
  const taillePage = 8;

  // Contrat API provisoire : GET /recus et GET /recus/:id/pdf.
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const resultat = await requete("/recus");
      setRecus(extraireListe(resultat));
    } catch (e) {
      setRecus([]);
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { setPage(1); }, [recherche, filtreStatut, filtreDate]);

  const recusFiltres = useMemo(() => recus.filter(r => {
    const texte = `${r.numero || ""} ${nomEleve(r)} ${r.reference || ""} ${r.reference_paiement || ""}`.toLowerCase();
    const rechercheOK = texte.includes(recherche.trim().toLowerCase());
    const statutOK = filtreStatut === "Tous" || r.statut === filtreStatut;
    const dateOK = !filtreDate || dateCourte(r.date) === filtreDate;
    return rechercheOK && statutOK && dateOK;
  }), [recus, recherche, filtreStatut, filtreDate]);

  const statuts = [...new Set(recus.map(r => r.statut).filter(Boolean))];
  const totalPages = Math.max(1, Math.ceil(recusFiltres.length / taillePage));
  const pageActive = Math.min(page, totalPages);
  const lignes = recusFiltres.slice((pageActive - 1) * taillePage, pageActive * taillePage);

  const obtenirPDF = async recu => {
    const id = idRecu(recu);
    if (id == null) throw new Error("Identifiant du reçu manquant.");

    const reponse = await fetch(`${API}/recus/${encodeURIComponent(id)}/pdf`, {
      credentials: "include",
      headers: { Accept: "application/pdf" }
    });

    if (!reponse.ok) {
      const erreur = await reponse.json().catch(() => ({}));
      throw new Error(erreur.message || erreur.error || `Erreur HTTP ${reponse.status}`);
    }

    const type = reponse.headers.get("content-type") || "";
    if (!type.includes("application/pdf")) {
      throw new Error("Le serveur n'a pas retourné un document PDF.");
    }

    return reponse.blob();
  };

  const telecharger = async recu => {
    const id = idRecu(recu);
    if (id == null || recu.statut !== "Émis") return;

    setTelechargement(id);
    try {
      const fichier = await obtenirPDF(recu);
      const url = URL.createObjectURL(fichier);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `${String(recu.numero || `recu-${id}`).replace(/[^\w.-]/g, "_")}.pdf`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      Swal.fire("Téléchargement impossible", e.message, "error");
    } finally {
      setTelechargement(null);
    }
  };

  const imprimer = async recu => {
    const id = idRecu(recu);
    if (id == null || recu.statut !== "Émis") return;

    // Ouvrir une fenêtre immédiatement pour éviter le blocage des pop-ups.
    const fenetre = window.open("", "_blank");
    if (!fenetre) {
      Swal.fire("Impression bloquée", "Autorisez les fenêtres contextuelles pour imprimer le reçu.", "warning");
      return;
    }

    fenetre.document.title = "Impression du reçu";
    fenetre.document.body.textContent = "Chargement du reçu PDF...";

    setTelechargement(id);
    try {
      const fichier = await obtenirPDF(recu);
      const url = URL.createObjectURL(fichier);
      fenetre.location.replace(url);
      // Le navigateur affiche le PDF ; l'utilisateur peut ensuite lancer l'impression.
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (e) {
      fenetre.close();
      Swal.fire("Impression impossible", e.message, "error");
    } finally {
      setTelechargement(null);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Reçus de paiement
          </h1>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A8B7CF]">
            Consultation, téléchargement et impression des reçus officiels.
          </p>
        </div>
        <button onClick={charger} disabled={chargement}
          className={`${bouton} border border-[#E4E7EC] bg-white text-[#344054] hover:bg-gray-50 dark:border-[#33445E] dark:bg-[#14243D] dark:text-white dark:hover:bg-[#263852]`}>
          <RefreshCw size={16} className={chargement ? "animate-spin" : ""}/> Actualiser
        </button>
      </div>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div className="relative min-w-[180px] flex-1 sm:max-w-sm">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
            <input value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Numéro, élève ou référence..." className={`${champ} pl-10`}/>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
              className={`${champ} w-auto max-w-[180px]`}>
              <option value="Tous">Tous les statuts</option>
              {statuts.map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="relative">
              <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
              <input type="date" value={filtreDate} onChange={e => setFiltreDate(e.target.value)}
                title="Filtrer par date" className={`${champ} w-auto pl-9`}/>
            </div>
            {(recherche || filtreDate || filtreStatut !== "Tous") && (
              <button onClick={() => { setRecherche(""); setFiltreDate(""); setFiltreStatut("Tous"); }}
                className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
                <X size={15}/> Effacer
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                {["N° de reçu", "Élève", "Montant", "Date", "Statut", "Actions"].map(t => (
                  <th key={t} className="px-5 py-3 font-bold">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAEC] dark:divide-[#263852]">
              {!chargement && !erreur && lignes.map(r => (
                <tr key={idRecu(r)} className="hover:bg-[#FAF8F9] dark:hover:bg-[#1B2C46]">
                  <td className="px-5 py-3 font-semibold text-[#540916] dark:text-[#93C5FD]">
                    {r.numero || "—"}
                  </td>
                  <td className="px-5 py-3 font-semibold text-[#171717] dark:text-white">
                    {nomEleve(r)}
                  </td>
                  <td className="px-5 py-3 font-bold text-[#171717] dark:text-white">
                    {montantAr(r.montant)}
                  </td>
                  <td className="px-5 py-3 text-[#667085] dark:text-[#A8B7CF]">
                    {dateCourte(r.date)}
                  </td>
                  <td className="px-5 py-3"><Badge statut={r.statut}/></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Consulter" onClick={() => setSelection(r)}
                        className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:hover:bg-[#263852]">
                        <Eye size={17}/>
                      </button>
                      {r.statut === "Émis" && (
                        <>
                          <button title="Télécharger le PDF" disabled={telechargement === idRecu(r)}
                            onClick={() => telecharger(r)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-[#263852]">
                            <FileDown size={17}/>
                          </button>
                          <button title="Imprimer" disabled={telechargement === idRecu(r)}
                            onClick={() => imprimer(r)}
                            className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:hover:bg-[#263852]">
                            <Printer size={17}/>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {chargement && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#667085] dark:text-[#A8B7CF]">
              <Loader2 size={19} className="animate-spin"/> Chargement des reçus...
            </div>
          )}

          {!chargement && erreur && (
            <div className="p-10 text-center">
              <AlertCircle size={30} className="mx-auto mb-3 text-red-500"/>
              <p className="text-sm font-semibold text-red-600">Impossible de charger les reçus.</p>
              <p className="mt-2 text-xs text-[#667085] dark:text-[#A8B7CF]">{erreur}</p>
              <button onClick={charger} className={`${bouton} mt-4 bg-[#540916] text-white`}>
                Réessayer
              </button>
            </div>
          )}

          {!chargement && !erreur && !lignes.length && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Receipt size={34} className="mb-3 text-[#98A2B3]"/>
              <p className="text-sm font-semibold text-[#344054] dark:text-white">Aucun reçu disponible</p>
              <p className="mt-1 text-xs text-[#98A2B3]">
                Les reçus apparaîtront ici après leur création par le serveur.
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EAE3E5] px-4 py-3 text-xs text-[#667085] dark:border-[#263852] dark:text-[#A8B7CF]">
          <span>{recusFiltres.length} reçu(s) · Page {pageActive} / {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={pageActive <= 1} onClick={() => setPage(p => p - 1)}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>
              Précédent
            </button>
            <button disabled={pageActive >= totalPages} onClick={() => setPage(p => p + 1)}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>
              Suivant
            </button>
          </div>
        </div>
      </section>

      {selection && (
        <Fenetre titre="Aperçu du reçu" fermer={() => setSelection(null)}>
          <div className="overflow-hidden rounded-xl border border-[#EAE3E5] bg-white text-[#171717] shadow-sm">
            <div className="border-b-2 border-[#540916] px-5 py-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8EDEF] text-[#540916]">
                <Receipt size={24}/>
              </div>
              <h2 className="font-bold uppercase tracking-wide text-[#540916]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Saint Louis de Gonzague Mahasoabe
              </h2>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#667085]">
                Reçu de paiement
              </p>
            </div>

            <div className="space-y-1 px-5 py-5">
              {[
                ["Numéro du reçu", selection.numero],
                ["Référence du paiement", selection.reference_paiement || selection.reference],
                ["Élève", nomEleve(selection)],
                ["Date", dateCourte(selection.date)],
                ["Montant", montantAr(selection.montant)],
                ["Statut", selection.statut]
              ].map(([titre, valeur]) => (
                <div key={titre} className="flex justify-between gap-4 border-b border-[#F0EAEC] py-3 text-sm">
                  <span className="text-[#667085]">{titre}</span>
                  <strong className="max-w-[65%] break-words text-right text-[#171717]">
                    {valeur || "—"}
                  </strong>
                </div>
              ))}
            </div>

            {selection.statut === "Émis" && (
              <div className="flex items-center justify-center gap-2 bg-[#F0FDF4] px-4 py-3 text-xs font-semibold text-[#15803D]">
                <CheckCircle2 size={16}/> Reçu émis
              </div>
            )}
          </div>

          <p className="mt-3 text-xs leading-5 text-[#667085] dark:text-[#A8B7CF]">
            Cet aperçu présente les informations transmises par le serveur.
            Le document officiel à imprimer est le PDF généré par le backend.
          </p>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button onClick={() => setSelection(null)}
              className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
              Fermer
            </button>
            {selection.statut === "Émis" && (
              <>
                <button onClick={() => imprimer(selection)} disabled={telechargement != null}
                  className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
                  <Printer size={16}/> Imprimer
                </button>
                <button onClick={() => telecharger(selection)} disabled={telechargement != null}
                  className={`${bouton} bg-[#540916] text-white hover:bg-[#701326]`}>
                  <FileDown size={16}/> Télécharger PDF
                </button>
              </>
            )}
          </div>
        </Fenetre>
      )}
    </div>
  );
}