import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
  Plus, Search, Eye, Pencil, Trash2, Download, Upload, FileDown,
  RefreshCw, Loader2, AlertCircle, X
} from "lucide-react";
import { CONFIG_MODULES } from "../donnees/configuration";
import { exporterExcel, exporterPDF, importerExcel } from "../utilitaires/exportations";
import Modal from "./Modal";
import Formulaire from "./Formulaire";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const taillePage = 8;

// Routes provisoires : à adapter aux routes réelles du backend.
const routes = {
  eleves: "/eleves",
  classes: "/classes",
  inscriptions: "/inscriptions",
  paiements: "/paiements",
  recus: "/recus",
  utilisateurs: "/utilisateurs",
  rapports: "/rapports",
  enseignants: "/enseignants",
  notes: "/notes",
  absences: "/absences"
};

const idLigne = ligne => ligne.id ?? ligne.id_eleve ?? ligne.id_classe
  ?? ligne.id_inscription ?? ligne.id_paiement ?? ligne.id_recu
  ?? ligne.id_utilisateur ?? ligne.id_rapport ?? ligne.id_enseignant
  ?? ligne.id_note ?? ligne.id_absence;

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

function extraireListe(resultat, module) {
  if (Array.isArray(resultat)) return resultat;
  if (Array.isArray(resultat?.[module])) return resultat[module];
  if (Array.isArray(resultat?.data)) return resultat.data;
  if (Array.isArray(resultat?.data?.[module])) return resultat.data[module];
  throw new Error(`Format de réponse invalide pour le module ${module}.`);
}

function permissionsModule(resultat) {
  const p = resultat?.permissions || resultat?.data?.permissions || {};
  return {
    creer: p.creer === true,
    modifier: p.modifier === true,
    supprimer: p.supprimer === true,
    importer: p.importer === true
  };
}

function valeurTexte(valeur) {
  if (valeur == null) return "";
  if (typeof valeur === "boolean") return valeur ? "Oui" : "Non";
  if (Array.isArray(valeur)) return valeur.map(valeurTexte).join(", ");
  if (typeof valeur === "object") {
    return valeur.nom || valeur.libelle || valeur.titre || valeur.numero || "";
  }
  return String(valeur);
}

export default function ModuleMetier({ module, lectureSeule = false, filtrer }) {
  const cfg = CONFIG_MODULES[module];
  const fichier = useRef(null);

  const [lignes, definirLignes] = useState([]);
  const [permissions, definirPermissions] = useState({
    creer: false, modifier: false, supprimer: false, importer: false
  });
  const [chargement, definirChargement] = useState(true);
  const [enCours, definirEnCours] = useState(false);
  const [erreur, definirErreur] = useState("");
  const [recherche, definirRecherche] = useState("");
  const [classe, definirClasse] = useState("");
  const [tri, definirTri] = useState({ cle: "", sens: "asc" });
  const [page, definirPage] = useState(1);
  const [formulaire, definirFormulaire] = useState(null);
  const [edition, definirEdition] = useState(null);
  const [details, definirDetails] = useState(null);

  const chemin = routes[module];
  const colonnes = cfg?.colonnes || [];
  const champs = cfg?.champs || {};
  const verrouille = lectureSeule || cfg?.lectureSeule === true;

  const charger = useCallback(async () => {
    if (!chemin) {
      definirErreur(`Aucune route API configurée pour le module « ${module} ».`);
      definirLignes([]);
      definirPermissions({ creer: false, modifier: false, supprimer: false, importer: false });
      definirChargement(false);
      return;
    }

    definirChargement(true);
    definirErreur("");

    try {
      const resultat = await requete(chemin);
      definirLignes(extraireListe(resultat, module));
      definirPermissions(permissionsModule(resultat));
    } catch (e) {
      definirLignes([]);
      definirPermissions({ creer: false, modifier: false, supprimer: false, importer: false });
      definirErreur(e.message);
    } finally {
      definirChargement(false);
    }
  }, [chemin, module]);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    definirTri({ cle: module === "eleves" ? "classe" : colonnes[0] || "", sens: "asc" });
    definirRecherche("");
    definirClasse("");
    definirPage(1);
    definirFormulaire(null);
    definirEdition(null);
    definirDetails(null);
  }, [module]);

  useEffect(() => { definirPage(1); }, [recherche, classe]);

  const donnees = useMemo(() => {
    const rechercheNormalisee = recherche.trim().toLocaleLowerCase("fr");

    return lignes.filter(ligne => {
      const filtreExterne = !filtrer || filtrer(ligne);
      const filtreClasse = !classe || valeurTexte(ligne.classe) === classe;
      const filtreRecherche = !rechercheNormalisee || Object.values(ligne).some(valeur =>
        valeurTexte(valeur).toLocaleLowerCase("fr").includes(rechercheNormalisee)
      );
      return filtreExterne && filtreClasse && filtreRecherche;
    }).sort((a, b) => {
      if (!tri.cle) return 0;
      const valeurA = valeurTexte(a[tri.cle]);
      const valeurB = valeurTexte(b[tri.cle]);
      return valeurA.localeCompare(valeurB, "fr", { numeric: true })
        * (tri.sens === "asc" ? 1 : -1);
    });
  }, [lignes, filtrer, classe, recherche, tri]);

  const pages = Math.max(1, Math.ceil(donnees.length / taillePage));
  const pageActive = Math.min(page, pages);
  const visibles = donnees.slice((pageActive - 1) * taillePage, pageActive * taillePage);
  const classes = [...new Set(lignes.map(l => valeurTexte(l.classe)).filter(Boolean))].sort();
  const peutCreer = !verrouille && permissions.creer;
  const peutModifier = !verrouille && permissions.modifier;
  const peutSupprimer = !verrouille && permissions.supprimer;
  const peutImporter = !verrouille && permissions.importer;

  const changerTri = cle => {
    definirTri(v => ({
      cle,
      sens: v.cle === cle && v.sens === "asc" ? "desc" : "asc"
    }));
  };

  const ouvrir = ligne => {
    if (ligne && !peutModifier) return;
    if (!ligne && !peutCreer) return;

    definirEdition(ligne ? idLigne(ligne) : null);
    definirFormulaire(ligne
      ? { ...ligne }
      : Object.fromEntries(Object.keys(champs).map(cle => [cle, ""]))
    );
  };

  const soumettre = async e => {
    e.preventDefault();
    if (!formulaire) return;

    const modification = edition != null;
    if (modification && !peutModifier) return;
    if (!modification && !peutCreer) return;

    const donnees = Object.fromEntries(
      Object.keys(champs).map(cle => [cle, formulaire[cle] ?? ""])
    );

    definirEnCours(true);

    try {
      await requete(modification ? `${chemin}/${encodeURIComponent(edition)}` : chemin, {
        method: modification ? "PUT" : "POST",
        body: JSON.stringify(donnees)
      });

      definirFormulaire(null);
      definirEdition(null);
      await charger();

      Swal.fire({
        icon: "success",
        title: modification ? "Modification enregistrée" : "Élément ajouté",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire("Enregistrement impossible", e.message, "error");
    } finally {
      definirEnCours(false);
    }
  };

  const supprimer = async ligne => {
    if (!peutSupprimer) return;

    const id = idLigne(ligne);
    if (id == null) {
      Swal.fire("Erreur", "Identifiant de l'élément manquant.", "error");
      return;
    }

    const confirmation = await Swal.fire({
      title: "Supprimer cet élément ?",
      text: "Cette opération modifiera les données enregistrées sur le serveur.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#B42318"
    });

    if (!confirmation.isConfirmed) return;

    definirEnCours(true);

    try {
      await requete(`${chemin}/${encodeURIComponent(id)}`, { method: "DELETE" });
      await charger();
      Swal.fire({
        icon: "success",
        title: "Élément supprimé",
        timer: 1400,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire("Suppression impossible", e.message, "error");
    } finally {
      definirEnCours(false);
    }
  };

  const importer = async e => {
    const fichierExcel = e.target.files?.[0];
    e.target.value = "";
    if (!fichierExcel || !peutImporter) return;

    try {
      const donnees = await importerExcel(fichierExcel, Object.keys(champs));

      if (!Array.isArray(donnees) || !donnees.length) {
        Swal.fire("Fichier vide", "Aucune ligne valide à importer.", "warning");
        return;
      }

      const confirmation = await Swal.fire({
        title: "Confirmer l'importation ?",
        text: `${donnees.length} ligne(s) seront transmises au serveur pour validation.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Importer",
        cancelButtonText: "Annuler",
        confirmButtonColor: "#540916"
      });

      if (!confirmation.isConfirmed) return;

      definirEnCours(true);

      const resultat = await requete(`${chemin}/import`, {
        method: "POST",
        body: JSON.stringify({ lignes: donnees })
      });

      await charger();

      const ajoutees = resultat?.importees ?? resultat?.ajoutees;
      Swal.fire({
        icon: "success",
        title: "Importation terminée",
        text: ajoutees != null
          ? `${ajoutees} ligne(s) importée(s) avec succès.`
          : "Le serveur a traité le fichier."
      });
    } catch (e) {
      Swal.fire("Importation impossible", e.message, "error");
    } finally {
      definirEnCours(false);
    }
  };

  const exporter = format => {
    if (!donnees.length) {
      Swal.fire("Aucune donnée", "Aucune ligne à exporter.", "info");
      return;
    }

    const exportDonnees = donnees.map(ligne =>
      Object.fromEntries(colonnes.map(cle => [
        champs[cle] || cle,
        valeurTexte(ligne[cle])
      ]))
    );

    if (format === "excel") {
      exporterExcel(exportDonnees, `slg-${module}`);
    } else {
      exporterPDF(exportDonnees, colonnes.map(cle => champs[cle] || cle), `slg-${module}`);
    }
  };

  if (!cfg) {
    return (
      <div className={`${carte} p-8 text-center text-sm text-red-600`}>
        Configuration introuvable pour le module « {module} ».
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {cfg.titre}
          </h1>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A8B7CF]">
            {cfg.description}
          </p>
        </div>

        {peutCreer && (
          <button onClick={() => ouvrir(null)} disabled={enCours}
            className={`${bouton} bg-[#540916] px-4 py-2.5 text-white hover:bg-[#701326]`}>
            <Plus size={17}/> Ajouter
          </button>
        )}
      </div>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAE3E5] p-4 dark:border-[#263852]">
          <div className="flex min-w-[180px] flex-1 flex-wrap gap-2">
            <div className="relative min-w-[170px] flex-1 sm:max-w-sm">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
              <input value={recherche} onChange={e => definirRecherche(e.target.value)}
                placeholder="Rechercher..." className={`${champ} pl-10`}/>
            </div>

            {module === "eleves" && (
              <select value={classe} onChange={e => definirClasse(e.target.value)}
                aria-label="Filtrer par classe" className={`${champ} w-auto max-w-[190px]`}>
                <option value="">Toutes les classes</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-[#667085] dark:text-[#A8B7CF]">
              {donnees.length} résultat(s)
            </span>

            <button onClick={charger} disabled={chargement || enCours} title="Actualiser"
              className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
              <RefreshCw size={16} className={chargement ? "animate-spin" : ""}/>
            </button>

            {peutImporter && (
              <>
                <input ref={fichier} type="file" accept=".xlsx,.xls" className="hidden"
                  onChange={importer}/>
                <button onClick={() => fichier.current?.click()} disabled={enCours}
                  className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
                  <Upload size={16}/> Import
                </button>
              </>
            )}

            <button onClick={() => exporter("excel")} disabled={chargement || !!erreur}
              className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
              <Download size={16}/> Excel
            </button>

            <button onClick={() => exporter("pdf")} disabled={chargement || !!erreur}
              className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
              <FileDown size={16}/> PDF
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] text-xs uppercase text-[#667085] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
              <tr>
                {colonnes.map(cle => (
                  <th key={cle} className="px-5 py-3 font-bold">
                    <button onClick={() => changerTri(cle)}
                      className="inline-flex items-center gap-2 text-left hover:text-[#540916] dark:hover:text-white">
                      {champs[cle] || cle}
                      {tri.cle === cle && <span>{tri.sens === "asc" ? "↑" : "↓"}</span>}
                    </button>
                  </th>
                ))}
                <th className="px-5 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F0EAEC] dark:divide-[#263852]">
              {!chargement && !erreur && visibles.map((ligne, index) => (
                <tr key={idLigne(ligne) ?? index}
                  className="hover:bg-[#FAF8F9] dark:hover:bg-[#1B2C46]">
                  {colonnes.map(cle => (
                    <td key={cle} className="max-w-[260px] truncate px-5 py-3 text-[#344054] dark:text-[#DCE5F3]">
                      {valeurTexte(ligne[cle]) || "—"}
                    </td>
                  ))}

                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button title="Consulter" onClick={() => definirDetails(ligne)}
                        className="rounded-lg p-2 text-[#667085] hover:bg-gray-100 dark:hover:bg-[#263852]">
                        <Eye size={17}/>
                      </button>

                      {peutModifier && (
                        <button title="Modifier" onClick={() => ouvrir(ligne)} disabled={enCours}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-[#263852]">
                          <Pencil size={17}/>
                        </button>
                      )}

                      {peutSupprimer && (
                        <button title="Supprimer" onClick={() => supprimer(ligne)} disabled={enCours}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-[#263852]">
                          <Trash2 size={17}/>
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
              <Loader2 size={19} className="animate-spin"/> Chargement des données...
            </div>
          )}

          {!chargement && erreur && (
            <div className="p-10 text-center">
              <AlertCircle size={30} className="mx-auto mb-3 text-red-500"/>
              <p className="text-sm font-semibold text-red-600">
                Impossible de charger les données.
              </p>
              <p className="mt-2 text-xs text-[#667085] dark:text-[#A8B7CF]">{erreur}</p>
              <button onClick={charger}
                className={`${bouton} mt-4 bg-[#540916] text-white`}>
                Réessayer
              </button>
            </div>
          )}

          {!chargement && !erreur && !visibles.length && (
            <div className="p-12 text-center text-sm text-[#667085] dark:text-[#A8B7CF]">
              Aucune donnée disponible.
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EAE3E5] px-4 py-3 text-xs text-[#667085] dark:border-[#263852] dark:text-[#A8B7CF]">
          <span>{donnees.length} résultat(s) · Page {pageActive} / {pages}</span>
          <div className="flex gap-2">
            <button disabled={pageActive <= 1}
              onClick={() => definirPage(p => Math.max(1, p - 1))}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>
              Précédent
            </button>
            <button disabled={pageActive >= pages}
              onClick={() => definirPage(p => Math.min(pages, p + 1))}
              className={`${bouton} border border-[#E4E7EC] dark:border-[#33445E]`}>
              Suivant
            </button>
          </div>
        </div>
      </section>

      {formulaire && (
        <Modal titre={`${edition != null ? "Modifier" : "Ajouter"} — ${cfg.titre}`}
          fermer={() => !enCours && definirFormulaire(null)}>
          <Formulaire champs={champs} valeurs={formulaire}
            changer={definirFormulaire} envoyer={soumettre}
            annuler={() => !enCours && definirFormulaire(null)}/>
        </Modal>
      )}

      {details && (
        <Modal titre={`Détails — ${cfg.titre}`} fermer={() => definirDetails(null)}>
          <div className="space-y-2">
            {Object.keys(champs).map(cle => (
              <div key={cle}
                className="flex justify-between gap-4 border-b border-[#F0EAEC] py-2 text-sm dark:border-[#263852]">
                <span className="text-[#667085] dark:text-[#A8B7CF]">{champs[cle]}</span>
                <strong className="max-w-[65%] break-words text-right font-semibold text-[#171717] dark:text-white">
                  {valeurTexte(details[cle]) || "—"}
                </strong>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={() => definirDetails(null)}
              className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
              <X size={16}/> Fermer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}