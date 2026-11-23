import { useCallback, useEffect, useState } from "react";
import { Building2, CalendarDays, GraduationCap, MapPin, Save, RefreshCw, Loader2, AlertCircle, Settings2 } from "lucide-react";
import Swal from "sweetalert2";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const champ = "w-full rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#540916] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-white";
const bouton = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const initial = { nom: "", annee_scolaire_id: "", trimestres: "", cycles: [], adresse: "" };
const cyclesDisponibles = ["Primaire", "Collège", "Lycée"];

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

function Champ({ label, description, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-semibold text-[#344054] dark:text-[#DCE5F3]">{label}</label>
      {children}
      {description && <p className="mt-1.5 text-xs text-[#98A2B3] dark:text-[#8FA0B9]">{description}</p>}
    </div>
  );
}

function Section({ icone: Icone, titre, description, children }) {
  return (
    <div className="border-b border-[#F0EAEC] px-5 py-5 last:border-b-0 sm:px-6 dark:border-[#263852]">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EDEF] text-[#540916] dark:bg-[#263852] dark:text-[#C5D7F1]">
          <Icone size={19}/>
        </div>
        <div>
          <h2 className="text-base font-bold text-[#171717] dark:text-white">{titre}</h2>
          <p className="mt-0.5 text-xs text-[#667085] dark:text-[#A8B7CF]">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Parametres() {
  const [valeurs, setValeurs] = useState(initial);
  const [annees, setAnnees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [erreurAnnees, setErreurAnnees] = useState("");
  const [modifie, setModifie] = useState(false);

  // Contrat API provisoire, à aligner sur le backend réel.
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    setErreurAnnees("");
    try {
      const [resultat, resultatAnnees] = await Promise.allSettled([
        requete("/parametres"),
        requete("/annees-scolaires")
      ]);

      if (resultat.status === "rejected") throw resultat.reason;

      const brut = resultat.value;
      const parametres = brut?.parametres || brut?.data || brut || {};
      if (!parametres || typeof parametres !== "object" || Array.isArray(parametres)) {
        throw new Error("Format des paramètres invalide.");
      }

      setValeurs({
        nom: parametres.nom ?? "",
        annee_scolaire_id: parametres.annee_scolaire_id ?? "",
        trimestres: parametres.trimestres ?? "",
        cycles: Array.isArray(parametres.cycles) ? parametres.cycles : [],
        adresse: parametres.adresse ?? ""
      });
      setModifie(false);

      if (resultatAnnees.status === "fulfilled") {
        const brutAnnees = resultatAnnees.value;
        const liste = Array.isArray(brutAnnees) ? brutAnnees
          : brutAnnees?.annees_scolaires || brutAnnees?.data?.annees_scolaires || brutAnnees?.data;
        if (!Array.isArray(liste)) throw new Error("Format des années scolaires invalide.");
        setAnnees(liste);
      } else {
        setAnnees([]);
        setErreurAnnees(resultatAnnees.reason.message);
      }
    } catch (e) {
      setValeurs({ ...initial });
      setAnnees([]);
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const changer = (cle, valeur) => {
    setValeurs(v => ({ ...v, [cle]: valeur }));
    setModifie(true);
  };

  const basculerCycle = cycle => {
    setValeurs(v => ({
      ...v,
      cycles: v.cycles.includes(cycle)
        ? v.cycles.filter(c => c !== cycle)
        : [...v.cycles, cycle]
    }));
    setModifie(true);
  };

  const enregistrer = async e => {
    e.preventDefault();

    if (!valeurs.nom.trim()) {
      Swal.fire("Champ obligatoire", "Renseignez le nom de l'établissement.", "warning");
      return;
    }
    if (valeurs.trimestres !== "" && (!Number.isInteger(Number(valeurs.trimestres)) || Number(valeurs.trimestres) < 1)) {
      Swal.fire("Valeur invalide", "Le nombre de trimestres doit être un entier positif.", "warning");
      return;
    }

    const donnees = {
      nom: valeurs.nom.trim(),
      annee_scolaire_id: valeurs.annee_scolaire_id || null,
      trimestres: valeurs.trimestres === "" ? null : Number(valeurs.trimestres),
      cycles: valeurs.cycles,
      adresse: valeurs.adresse.trim()
    };

    setEnCours(true);
    try {
      await requete("/parametres", {
        method: "PUT",
        body: JSON.stringify(donnees)
      });
      setModifie(false);
      Swal.fire({
        icon: "success",
        title: "Paramètres enregistrés",
        text: "La configuration de l'établissement a été mise à jour.",
        timer: 1800,
        showConfirmButton: false
      });
      await charger();
    } catch (e) {
      Swal.fire("Enregistrement impossible", e.message, "error");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-145px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Paramètres de l'établissement
          </h1>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A8B7CF]">
            Configuration générale et organisation scolaire.
          </p>
        </div>
        <button type="button" onClick={charger} disabled={chargement || enCours}
          className={`${bouton} border border-[#E4E7EC] bg-white text-[#344054] hover:bg-gray-50 dark:border-[#33445E] dark:bg-[#14243D] dark:text-white dark:hover:bg-[#263852]`}>
          <RefreshCw size={16} className={chargement ? "animate-spin" : ""}/> Actualiser
        </button>
      </div>

      <section className={`${carte} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        {chargement ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-[#667085] dark:text-[#A8B7CF]">
            <Loader2 size={20} className="animate-spin"/> Chargement des paramètres...
          </div>
        ) : erreur ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <AlertCircle size={34} className="mb-3 text-red-500"/>
            <h2 className="text-base font-bold text-[#171717] dark:text-white">Impossible de charger les paramètres</h2>
            <p className="mt-2 text-sm text-[#667085] dark:text-[#A8B7CF]">{erreur}</p>
            <button onClick={charger} className={`${bouton} mt-5 bg-[#540916] text-white hover:bg-[#701326]`}>
              Réessayer
            </button>
          </div>
        ) : (
          <form onSubmit={enregistrer} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <Section icone={Building2} titre="Informations générales" description="Identité et localisation de l'établissement.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Champ label="Nom de l'établissement *">
                    <input required value={valeurs.nom} onChange={e => changer("nom", e.target.value)}
                      placeholder="Nom officiel de l'établissement" className={champ}/>
                  </Champ>
                  <Champ label="Localisation">
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"/>
                      <input value={valeurs.adresse} onChange={e => changer("adresse", e.target.value)}
                        placeholder="Adresse ou localisation" className={`${champ} pl-10`}/>
                    </div>
                  </Champ>
                </div>
              </Section>

              <Section icone={CalendarDays} titre="Organisation de l'année scolaire" description="Année scolaire de référence et découpage des périodes.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Champ label="Année scolaire" description="Les années scolaires sont gérées dans le module Années scolaires.">
                    <select value={valeurs.annee_scolaire_id}
                      onChange={e => changer("annee_scolaire_id", e.target.value)}
                      disabled={!!erreurAnnees} className={champ}>
                      <option value="">Aucune année sélectionnée</option>
                      {annees.map(a => {
                        const id = a.id ?? a.id_annee;
                        return <option key={id} value={id}>{a.nom}</option>;
                      })}
                    </select>
                    {erreurAnnees && <p className="mt-1.5 text-xs text-red-500">{erreurAnnees}</p>}
                  </Champ>
                  <Champ label="Nombre de trimestres">
                    <input type="number" min="1" step="1" value={valeurs.trimestres}
                      onChange={e => changer("trimestres", e.target.value)}
                      placeholder="Nombre de périodes" className={champ}/>
                  </Champ>
                </div>
              </Section>

              <Section icone={GraduationCap} titre="Cycles scolaires" description="Sélectionnez les cycles proposés par l'établissement.">
                <div className="grid gap-3 sm:grid-cols-3">
                  {cyclesDisponibles.map(cycle => {
                    const actif = valeurs.cycles.includes(cycle);
                    const couleurs = {
                      Primaire: "border-[#172B50] bg-[#172B50]/5 dark:bg-[#172B50]/30",
                      Collège: "border-[#D9799A] bg-[#D9799A]/5 dark:bg-[#D9799A]/15",
                      Lycée: "border-[#26865B] bg-[#26865B]/5 dark:bg-[#26865B]/15"
                    };
                    const points = {
                      Primaire: "bg-[#172B50]",
                      Collège: "bg-[#D9799A]",
                      Lycée: "bg-[#26865B]"
                    };
                    return (
                      <label key={cycle} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                        actif ? couleurs[cycle] : "border-[#E4E7EC] hover:bg-gray-50 dark:border-[#33445E] dark:hover:bg-[#263852]"
                      }`}>
                        <input type="checkbox" checked={actif} onChange={() => basculerCycle(cycle)}
                          className="h-4 w-4 accent-[#540916]"/>
                        <span className={`h-2.5 w-2.5 rounded-full ${points[cycle]}`}/>
                        <span className="text-sm font-semibold text-[#344054] dark:text-white">{cycle}</span>
                      </label>
                    );
                  })}
                </div>
              </Section>

              <Section icone={Settings2} titre="Gestion des paramètres" description="Les modifications sont enregistrées sur le serveur.">
                <div className="rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] px-4 py-3 text-sm text-[#667085] dark:border-[#33445E] dark:bg-[#0B172B] dark:text-[#A8B7CF]">
                  {modifie
                    ? "Des modifications n'ont pas encore été enregistrées."
                    : "Aucune modification en attente."}
                </div>
              </Section>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EAE3E5] bg-white px-5 py-4 dark:border-[#263852] dark:bg-[#14243D]">
              <span className="text-xs text-[#667085] dark:text-[#A8B7CF]">
                {modifie ? "Modifications non enregistrées" : "Configuration chargée"}
              </span>
              <div className="flex gap-2">
                <button type="button" disabled={!modifie || enCours} onClick={charger}
                  className={`${bouton} border border-[#E4E7EC] text-[#344054] dark:border-[#33445E] dark:text-white`}>
                  Annuler
                </button>
                <button type="submit" disabled={!modifie || enCours}
                  className={`${bouton} bg-[#540916] text-white hover:bg-[#701326]`}>
                  {enCours ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}