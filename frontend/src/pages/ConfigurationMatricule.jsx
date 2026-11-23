import { useEffect, useState } from "react";
import { messageErreur, requetePrivee } from "../services/authentification";

export default function ConfigurationMatricule() {
  const [format, definirFormat] = useState(null);
  const [enCours, definirEnCours] = useState(false);
  const [erreur, definirErreur] = useState("");
  const [message, definirMessage] = useState("");

  useEffect(() => {
    const controleur = new AbortController();
    requetePrivee("/admin/matricules", { signal: controleur.signal })
      .then(valeur => { if (!controleur.signal.aborted) definirFormat(valeur); })
      .catch(cause => { if (!controleur.signal.aborted) definirErreur(messageErreur(cause)); });
    return () => controleur.abort();
  }, []);

  function modifier(cle, valeur) {
    definirFormat(actuel => ({ ...actuel, [cle]: valeur }));
    definirMessage("");
  }

  async function enregistrer(evenement) {
    evenement.preventDefault();
    definirEnCours(true);
    definirErreur("");
    definirMessage("");
    try {
      const resultat = await requetePrivee("/admin/matricules", {
        method: "PUT", data: { ...format, chiffres: Number(format.chiffres) },
      });
      definirFormat(resultat);
      definirMessage("Format enregistré.");
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <form className="carte space-y-3 p-5" onSubmit={enregistrer}>
    <h2 className="text-lg font-bold">Format du matricule</h2>
    <p className="text-sm">Le numéro augmente à chaque première inscription, tous niveaux confondus.</p>
    {erreur && <p role="alert" className="text-red-600">{erreur}</p>}
    {message && <p role="status">{message}</p>}
    {format ? (
      <fieldset disabled={enCours} className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Préfixe facultatif
          <input className="champ block" maxLength={20} pattern="[A-Za-z0-9_\\-]*"
            value={format.prefixe} onChange={event => modifier("prefixe", event.target.value)} />
        </label>
        <label className="text-sm">Nombre minimal de chiffres
          <input className="champ block" type="number" min="1" max="10" required
            value={format.chiffres} onChange={event => modifier("chiffres", event.target.value)} />
        </label>
        <label className="text-sm">Suffixe facultatif
          <input className="champ block" maxLength={20} pattern="[A-Za-z0-9_\\-]*"
            value={format.suffixe} onChange={event => modifier("suffixe", event.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
          <p className="text-sm">Exemple <strong>{format.prefixe}{String(1).padStart(Math.min(10, Number(format.chiffres) || 1), "0")}{format.suffixe}</strong></p>
          <button className="bouton">{enCours ? "Enregistrement…" : "Enregistrer le format"}</button>
        </div>
      </fieldset>
    ) : !erreur && <p role="status">Chargement…</p>}
  </form>;
}
