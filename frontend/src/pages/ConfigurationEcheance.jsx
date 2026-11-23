import { useEffect, useState } from "react";
import { messageErreur, requetePrivee } from "../services/authentification";

export default function ConfigurationEcheance() {
  const [jour, definirJour] = useState(null);
  const [enCours, definirEnCours] = useState(false);
  const [erreur, definirErreur] = useState("");
  const [message, definirMessage] = useState("");

  useEffect(() => {
    const controleur = new AbortController();
    requetePrivee("/admin/echeance-ecolage", { signal: controleur.signal })
      .then(({ jour }) => { if (!controleur.signal.aborted) definirJour(jour); })
      .catch(cause => { if (!controleur.signal.aborted) definirErreur(messageErreur(cause)); });
    return () => controleur.abort();
  }, []);

  async function enregistrer(evenement) {
    evenement.preventDefault();
    definirEnCours(true);
    definirErreur("");
    definirMessage("");
    try {
      const resultat = await requetePrivee("/admin/echeance-ecolage", {
        method: "PUT", data: { jour: Number(jour) },
      });
      definirJour(resultat.jour);
      definirMessage("Échéance enregistrée.");
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <form className="carte space-y-3 p-5" onSubmit={enregistrer}>
    <h2 className="text-lg font-bold">Échéance mensuelle de l’écolage</h2>
    <p className="text-sm">Si le jour choisi dépasse la durée du mois, l’échéance tombe le dernier jour du mois.</p>
    {erreur && <p role="alert" className="text-red-600">{erreur}</p>}
    {message && <p role="status">{message}</p>}
    {jour === null ? !erreur && <p role="status">Chargement…</p> : (
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">Jour du mois
          <input className="champ block" type="number" min="1" max="31" required value={jour}
            disabled={enCours} onChange={event => definirJour(event.target.value)} />
        </label>
        <button className="bouton" disabled={enCours}>{enCours ? "Enregistrement…" : "Enregistrer l’échéance"}</button>
      </div>
    )}
  </form>;
}
