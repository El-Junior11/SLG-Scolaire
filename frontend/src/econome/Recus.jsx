import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Printer, FileDown, Eye, X, RefreshCw, Loader2,
  Receipt, CalendarDays, AlertCircle, CheckCircle2
} from "lucide-react";
import Swal from "sweetalert2";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const champ = "h-10 w-full min-w-0 rounded-xl border border-[#E4E7EC] bg-white px-3 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white dark:focus:border-[#60A5FA]";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const bordure = "border-[#EAE3E5] dark:border-[#263852]";
const principal = "bg-[#540916] text-white hover:bg-[#701326] dark:bg-[#29446D] dark:hover:bg-[#365582]";
const contour = "border border-[#E4E7EC] bg-white text-[#344054] hover:bg-slate-50 dark:border-[#33445E] dark:bg-[#14243D] dark:text-white dark:hover:bg-[#263852]";

const idRecu = r => r.id ?? r.id_recu;
const dateCourte = valeur => valeur ? String(valeur).slice(0, 10) : "—";
const montantAr = valeur => valeur == null || valeur === "" ? "—" : `${Number(valeur).toLocaleString("fr-FR")} Ar`;

async function requete(chemin, options = {}) {
  const reponse = await fetch(`${API}${chemin}`, {
    ...options, credentials: "include",
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

function alerte(titre, message, icon = "error") {
  const sombre = document.documentElement.classList.contains("dark");
  return Swal.fire({
    title: titre, text: message, icon,
    confirmButtonColor: sombre ? "#29446D" : "#540916",
    background: sombre ? "#14243D" : "#FFFFFF",
    color: sombre ? "#F1F5F9" : "#171717"
  });
}

function Badge({ statut }) {
  const styles = {
    "Émis": "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    "Annulé": "bg-red-50 text-red-700 dark:bg-[#263852] dark:text-[#C4D7FF]",
    "En attente": "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
  };

  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold ${styles[statut] || "bg-slate-100 text-slate-600 dark:bg-[#263852] dark:text-[#A8B7CF]"}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current"/>
    {statut || "Non renseigné"}
  </span>;
}

function Fenetre({ titre, fermer, children }) {
  useEffect(() => {
    const ancien = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const touche = e => { if (e.key === "Escape") fermer(); };
    window.addEventListener("keydown", touche);
    return () => {
      window.removeEventListener("keydown", touche);
      document.body.style.overflow = ancien;
    };
  }, [fermer]);

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101828]/65 p-3 backdrop-blur-sm sm:p-5"
    onMouseDown={e => e.target === e.currentTarget && fermer()}>
    <div role="dialog" aria-modal="true" aria-labelledby="titre-apercu-recu"
      className={`${carte} flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden shadow-xl`}>

      <header className={`flex shrink-0 items-center justify-between gap-3 border-b px-4 py-4 sm:px-5 ${bordure}`}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]">
            <Receipt size={20}/>
          </div>
          <h2 id="titre-apercu-recu" className={`text-lg font-bold ${texte}`}>{titre}</h2>
        </div>

        <button type="button" onClick={fermer} aria-label="Fermer"
          className={`rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-[#263852] ${secondaire}`}>
          <X size={19}/>
        </button>
      </header>

      <div className="min-h-0 overflow-y-auto p-4 sm:p-5">{children}</div>
    </div>
  </div>;
}

export default function Recus() {
  const [recus, setRecus] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [telechargement, setTelechargement] = useState(null);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [filtreDate, setFiltreDate] = useState("");
  const [selection, setSelection] = useState(null);

  // CHARGEMENT DES REÇUS
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

  // RECHERCHE ET FILTRES
  const recusFiltres = useMemo(() => recus.filter(r => {
    const contenu = `${r.numero || ""} ${nomEleve(r)} ${r.reference || ""} ${r.reference_paiement || ""}`.toLowerCase();
    const rechercheOK = contenu.includes(recherche.trim().toLowerCase());
    const statutOK = filtreStatut === "Tous" || r.statut === filtreStatut;
    const dateOK = !filtreDate || dateCourte(r.date) === filtreDate;
    return rechercheOK && statutOK && dateOK;
  }), [recus, recherche, filtreStatut, filtreDate]);

  const statuts = [...new Set(recus.map(r => r.statut).filter(Boolean))];

  function reinitialiserFiltres() {
    setRecherche("");
    setFiltreDate("");
    setFiltreStatut("Tous");
  }

  // RÉCUPÉRATION DU PDF
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

  // TÉLÉCHARGEMENT
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
      await alerte("Téléchargement impossible", e.message);
    } finally {
      setTelechargement(null);
    }
  };

  // IMPRESSION
  const imprimer = async recu => {
    const id = idRecu(recu);
    if (id == null || recu.statut !== "Émis") return;

    const fenetre = window.open("", "_blank");

    if (!fenetre) {
      await alerte("Impression bloquée", "Autorisez les fenêtres contextuelles pour imprimer le reçu.", "warning");
      return;
    }

    fenetre.document.title = "Impression du reçu";
    fenetre.document.body.textContent = "Chargement du reçu PDF...";
    setTelechargement(id);

    try {
      const fichier = await obtenirPDF(recu);
      const url = URL.createObjectURL(fichier);
      fenetre.location.replace(url);
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (e) {
      fenetre.close();
      await alerte("Impression impossible", e.message);
    } finally {
      setTelechargement(null);
    }
  };

  return <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 overflow-hidden">

    {/* EN-TÊTE */}
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${texte}`}
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Reçus de paiement
        </h1>
        <p className={`mt-1 text-sm ${secondaire}`}>
          Consultation, téléchargement et impression des reçus officiels.
        </p>
      </div>

      <button type="button" onClick={charger} disabled={chargement}
        className={`${bouton} ${contour} w-full sm:w-auto`}>
        <RefreshCw size={16} className={chargement ? "animate-spin" : ""}/>
        Actualiser
      </button>
    </header>

    {/* CARTE PRINCIPALE */}
    <section className={`${carte} flex min-h-0 min-w-0 flex-col overflow-hidden`}>

      {/* RECHERCHE ET FILTRES FIXES */}
      <div className={`flex shrink-0 flex-col gap-3 border-b p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between ${bordure}`}>

        <div className="relative w-full min-w-0 lg:max-w-sm lg:flex-1">
          <Search size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
          <input type="search" value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Numéro, élève ou référence..."
            aria-label="Rechercher un reçu"
            className={`${champ} pl-10`}/>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">

          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
            aria-label="Filtrer par statut"
            className={`${champ} !w-auto max-w-full`}>
            <option value="Tous">Tous les statuts</option>
            {statuts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="relative min-w-0">
            <CalendarDays size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
            <input type="date" value={filtreDate}
              onChange={e => setFiltreDate(e.target.value)}
              title="Filtrer par date"
              aria-label="Filtrer par date"
              className={`${champ} !w-auto max-w-full pl-9 dark:[color-scheme:dark]`}/>
          </div>

          {(recherche || filtreDate || filtreStatut !== "Tous") && (
            <button type="button" onClick={reinitialiserFiltres}
              className={`${bouton} ${contour}`}>
              <X size={15}/> Effacer
            </button>
          )}
        </div>
      </div>

      {/* TABLEAU : 4 LIGNES VISIBLES ET SCROLL INTERNE */}
      <div className="min-h-0 min-w-0 max-h-[272px] overflow-auto overscroll-contain">

        <table className="w-full min-w-[800px] border-separate border-spacing-0 text-left text-sm">

          {/* EN-TÊTE STICKY */}
          <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs font-semibold text-[#667085] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
            <tr className="h-12">
              {["N° de reçu", "Élève", "Montant", "Date", "Statut"].map(t => (
                <th key={t} scope="col"
                  className={`whitespace-nowrap border-b px-4 font-bold ${bordure}`}>
                  {t}
                </th>
              ))}

              <th scope="col"
                className={`sticky right-0 z-20 w-[135px] whitespace-nowrap border-b bg-[#F8F9FC] px-4 text-right font-bold dark:bg-[#0B172B] ${bordure}`}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {!chargement && !erreur && recusFiltres.map(r => (
              <tr key={idRecu(r)}
                className="group h-14 transition-colors hover:bg-[#FAF8F9] dark:hover:bg-[#1B2C46]">

                <td className={`whitespace-nowrap border-b px-4 py-2 font-semibold text-[#540916] dark:text-[#93C5FD] ${bordure}`}>
                  {r.numero || "—"}
                </td>

                <td className={`whitespace-nowrap border-b px-4 py-2 font-semibold ${texte} ${bordure}`}>
                  {nomEleve(r)}
                </td>

                <td className={`whitespace-nowrap border-b px-4 py-2 font-bold ${texte} ${bordure}`}>
                  {montantAr(r.montant)}
                </td>

                <td className={`whitespace-nowrap border-b px-4 py-2 ${secondaire} ${bordure}`}>
                  {dateCourte(r.date)}
                </td>

                <td className={`whitespace-nowrap border-b px-4 py-2 ${bordure}`}>
                  <Badge statut={r.statut}/>
                </td>

                {/* ACTIONS STICKY À DROITE */}
                <td className={`sticky right-0 z-[1] w-[135px] whitespace-nowrap border-b bg-white px-3 py-2 text-right group-hover:bg-[#FAF8F9] dark:bg-[#14243D] dark:group-hover:bg-[#1B2C46] ${bordure}`}>

                  <div className="flex items-center justify-end gap-1">

                    <button type="button" title="Consulter"
                      aria-label={`Consulter le reçu ${r.numero || ""}`}
                      onClick={() => setSelection(r)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#667085] transition-colors hover:bg-slate-100 dark:text-[#A8B7CF] dark:hover:bg-[#263852]">
                      <Eye size={17}/>
                    </button>

                    {r.statut === "Émis" && <>
                      <button type="button" title="Télécharger le PDF"
                        aria-label={`Télécharger le reçu ${r.numero || ""}`}
                        disabled={telechargement !== null}
                        onClick={() => telecharger(r)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#93C5FD] dark:hover:bg-[#29446D]">
                        {telechargement === idRecu(r)
                          ? <Loader2 size={16} className="animate-spin"/>
                          : <FileDown size={17}/>}
                      </button>

                      <button type="button" title="Imprimer"
                        aria-label={`Imprimer le reçu ${r.numero || ""}`}
                        disabled={telechargement !== null}
                        onClick={() => imprimer(r)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10">
                        <Printer size={17}/>
                      </button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* CHARGEMENT */}
        {chargement && <div role="status"
          className={`flex min-h-[180px] items-center justify-center gap-2 p-6 text-sm ${secondaire}`}>
          <Loader2 size={19} className="animate-spin"/>
          Chargement des reçus...
        </div>}

        {/* ERREUR */}
        {!chargement && erreur && <div role="alert"
          className="flex min-h-[180px] flex-col items-center justify-center p-5 text-center">

          <AlertCircle size={28} className="mb-3 text-red-500 dark:text-[#93C5FD]"/>
          <p className="text-sm font-semibold text-red-600 dark:text-[#C4D7FF]">
            Impossible de charger les reçus.
          </p>
          <p className={`mt-2 text-xs ${secondaire}`}>{erreur}</p>

          <button type="button" onClick={charger}
            className={`${bouton} ${principal} mt-4`}>
            <RefreshCw size={15}/> Réessayer
          </button>
        </div>}

        {/* AUCUNE DONNÉE */}
        {!chargement && !erreur && !recusFiltres.length && (
          <div className="flex min-h-[180px] flex-col items-center justify-center p-5 text-center">

            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#98A2B3] dark:bg-[#263852] dark:text-[#A8B7CF]">
              <Receipt size={25}/>
            </div>

            <p className={`text-sm font-semibold ${texte}`}>
              Aucun reçu disponible
            </p>

            <p className={`mt-1 text-xs ${secondaire}`}>
              {recus.length
                ? "Aucun reçu ne correspond aux critères sélectionnés."
                : "Les reçus apparaîtront ici après leur création par le serveur."}
            </p>

            {recus.length > 0 && (
              <button type="button" onClick={reinitialiserFiltres}
                className="mt-3 text-xs font-semibold text-[#540916] hover:underline dark:text-[#93C5FD]">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* PIED DU TABLEAU FIXE */}
      <footer className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs ${bordure} ${secondaire}`}>
        <span>
          {recusFiltres.length} reçu(s) sur {recus.length}
        </span>

        {recusFiltres.length > 4 && (
          <span className="text-[#98A2B3] dark:text-[#A8B7CF]">
            Faites défiler pour consulter les autres reçus
          </span>
        )}
      </footer>
    </section>

    {/* MODAL APERÇU DU REÇU */}
    {selection && (
      <Fenetre titre="Aperçu du reçu" fermer={() => setSelection(null)}>

        <div className={`overflow-hidden rounded-xl border bg-white dark:bg-[#0B172B] ${bordure}`}>

          {/* EN-TÊTE DU REÇU */}
          <div className="border-b-2 border-[#540916] px-4 py-5 text-center dark:border-[#405574]">

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EDEF] text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]">
              <Receipt size={24}/>
            </div>

            <h2 className="font-bold uppercase tracking-wide text-[#540916] dark:text-[#C4D7FF]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Saint Louis de Gonzague Mahasoabe
            </h2>

            <p className={`mt-2 text-xs font-semibold uppercase tracking-wider ${secondaire}`}>
              Reçu de paiement
            </p>
          </div>

          {/* INFORMATIONS DU REÇU */}
          <div className="px-4 py-3 sm:px-5">
            {[
              ["Numéro du reçu", selection.numero],
              ["Référence du paiement", selection.reference_paiement || selection.reference],
              ["Élève", nomEleve(selection)],
              ["Date", dateCourte(selection.date)],
              ["Montant", montantAr(selection.montant)],
              ["Statut", selection.statut]
            ].map(([titre, valeur]) => (
              <div key={titre}
                className={`flex items-start justify-between gap-3 border-b py-3 text-sm last:border-b-0 ${bordure}`}>

                <span className={secondaire}>{titre}</span>

                <strong className={`max-w-[60%] break-words text-right ${texte}`}>
                  {titre === "Statut"
                    ? <Badge statut={valeur}/>
                    : valeur || "—"}
                </strong>
              </div>
            ))}
          </div>

          {selection.statut === "Émis" && (
            <div className="flex items-center justify-center gap-2 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 size={16}/> Reçu émis
            </div>
          )}
        </div>

        <p className={`mt-3 text-xs leading-relaxed ${secondaire}`}>
          Cet aperçu présente les informations transmises par le serveur.
          Le document officiel à imprimer est le PDF généré par le backend.
        </p>

        {/* ACTIONS DU MODAL */}
        <div className="mt-4 flex flex-wrap justify-end gap-2">

          <button type="button" onClick={() => setSelection(null)}
            className={`${bouton} ${contour} flex-1 sm:flex-none`}>
            Fermer
          </button>

          {selection.statut === "Émis" && <>
            <button type="button" onClick={() => imprimer(selection)}
              disabled={telechargement !== null}
              className={`${bouton} ${contour} flex-1 sm:flex-none`}>
              <Printer size={16}/> Imprimer
            </button>

            <button type="button" onClick={() => telecharger(selection)}
              disabled={telechargement !== null}
              className={`${bouton} ${principal} w-full sm:w-auto`}>
              {telechargement === idRecu(selection)
                ? <Loader2 size={16} className="animate-spin"/>
                : <FileDown size={16}/>}
              Télécharger PDF
            </button>
          </>}
        </div>
      </Fenetre>
    )}
  </div>;
}