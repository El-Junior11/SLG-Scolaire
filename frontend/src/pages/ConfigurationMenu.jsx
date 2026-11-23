import { useEffect, useState } from "react";
import { LIENS_SECTIONS_ADMIN, NAVIGATION, ROLES, SECTIONS_ADMIN_DEFAUT } from "../donnees/configuration";
import { messageErreur, requetePrivee } from "../services/authentification";

const espaces = ["econome", "titulaire", "secretaire"];

export default function ConfigurationMenu() {
  const [sections, definirSections] = useState(null);
  const [enCours, definirEnCours] = useState(false);
  const [erreur, definirErreur] = useState("");
  const [message, definirMessage] = useState("");

  useEffect(() => {
    const controleur = new AbortController();
    requetePrivee("/admin/menu", { signal: controleur.signal })
      .then(({ sections }) => definirSections(sections ?? SECTIONS_ADMIN_DEFAUT))
      .catch(cause => { if (!controleur.signal.aborted) definirErreur(messageErreur(cause)); });
    return () => controleur.abort();
  }, []);

  function modifier(id, modification) {
    definirSections(liste => liste.map(section =>
      section.id === id ? { ...section, ...modification } : section
    ));
  }

  async function enregistrer(evenement) {
    evenement.preventDefault();
    definirEnCours(true);
    definirErreur("");
    definirMessage("");
    try {
      const resultat = await requetePrivee("/admin/menu", { method: "PUT", data: { sections } });
      definirSections(resultat.sections);
      window.dispatchEvent(new CustomEvent("slg-menu-admin", { detail: resultat.sections }));
      definirMessage("Menu enregistré.");
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <form className="carte p-6 space-y-4" onSubmit={enregistrer}>
    <h2 className="text-lg font-bold">Sections du menu administrateur</h2>
    {erreur && <p role="alert" className="text-red-600">{erreur}</p>}
    {message && <p role="status">{message}</p>}
    {!sections && !erreur && <p role="status">Chargement…</p>}
    {sections && <>
      <fieldset disabled={enCours} className="space-y-4">
        {sections.map(section => <details key={section.id} className="rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">{section.titre || "Nouvelle section"}</summary>
          <div className="mt-4 space-y-4">
            <label className="block">Titre de la section
              <input className="champ" required maxLength={60} value={section.titre}
                onChange={evenement => modifier(section.id, { titre: evenement.target.value })} />
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              {espaces.map(espace => <fieldset key={espace} className="space-y-2">
                <legend className="font-semibold">{ROLES[espace]}</legend>
                {NAVIGATION[espace].map(([url]) => {
                  const chemin = `/${espace}/${url}`;
                  return <label key={chemin} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={section.liens.includes(chemin)}
                      onChange={evenement => modifier(section.id, {
                        liens: evenement.target.checked
                          ? [...section.liens, chemin]
                          : section.liens.filter(lien => lien !== chemin),
                      })} />
                    {LIENS_SECTIONS_ADMIN[chemin].libelle}
                  </label>;
                })}
              </fieldset>)}
            </div>
            <button type="button" className="bouton bouton-secondaire" onClick={() =>
              definirSections(liste => liste.filter(entree => entree.id !== section.id))
            }>Retirer la section</button>
          </div>
        </details>)}
        <div className="flex flex-wrap gap-3">
          <button type="button" className="bouton bouton-secondaire" disabled={sections.length >= 12}
            onClick={() => definirSections(liste => [...liste, { id: crypto.randomUUID(), titre: "", liens: [] }])}>
            Ajouter une section
          </button>
          <button className="bouton">{enCours ? "Enregistrement…" : "Enregistrer le menu"}</button>
        </div>
      </fieldset>
    </>}
  </form>;
}
