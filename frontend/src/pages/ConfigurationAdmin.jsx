import ConfigurationEcheance from "./ConfigurationEcheance";
import TarifsScolaires from "../econome/TarifsScolaires";
import ConfigurationMenu from "./ConfigurationMenu";
import { useEffect, useState } from 'react';
import { messageErreur, requetePrivee } from '../services/authentification';

const champs = [
  ['nom', 'Nom de l’établissement', 120],
  ['siege', 'Siège ou adresse', 240],
  ['logo', 'Adresse HTTPS du logo', 2048],
  ['contact', 'Coordonnées', 240],
];

export default function ConfigurationAdmin() {
  const [fonctions, definirFonctions] = useState([]);
  const [etablissement, definirEtablissement] = useState(null);
  const [enCours, definirEnCours] = useState(false);
  const [erreur, definirErreur] = useState('');
  const [message, definirMessage] = useState('');

  useEffect(() => {
    const controleur = new AbortController();
    requetePrivee('/admin/configuration', { signal: controleur.signal })
      .then(configuration => {
        definirFonctions(configuration.fonctions);
        definirEtablissement(configuration.etablissement);
      })
      .catch(cause => { if (!controleur.signal.aborted) definirErreur(messageErreur(cause)); });
    return () => controleur.abort();
  }, []);

  function modifierFonction(id, modification) {
    definirFonctions(liste => liste.map(fonction => fonction.id === id
      ? { ...fonction, ...modification }
      : fonction));
  }

  function ajouterFonction() {
    definirFonctions(liste => [...liste, {
      id: crypto.randomUUID(), nom: '', role: 'econome', active: true,
    }]);
  }

  async function enregistrer(evenement, rubrique, data) {
    evenement.preventDefault();
    definirEnCours(true);
    definirErreur('');
    definirMessage('');
    try {
      const resultat = await requetePrivee(`/admin/configuration/${rubrique}`, { method: 'PUT', data });
      if (resultat.fonctions) definirFonctions(resultat.fonctions);
      if (resultat.etablissement) definirEtablissement(resultat.etablissement);
      definirMessage(rubrique === 'fonctions' ? 'Fonctions enregistrées.' : 'Établissement enregistré.');
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <section className="space-y-5">
    <h1 className="titre-page">Configuration</h1>
    <TarifsScolaires modifiable />
    <ConfigurationEcheance />
    <ConfigurationMenu />
    {erreur && <p role="alert" className="text-red-600">{erreur}</p>}
    {message && <p role="status">{message}</p>}
    {!etablissement && !erreur && <p role="status">Chargement…</p>}
    {etablissement && <>
      <form className="carte p-6 space-y-4" onSubmit={event => enregistrer(event, 'fonctions', { fonctions })}>
        <h2 className="text-lg font-bold">Fonctions proposées à l’inscription</h2>
        {fonctions.map(fonction => <fieldset key={fonction.id} className="border rounded-xl p-4 grid gap-4 sm:grid-cols-2">
          <label>Nom de la fonction<input className="champ" required maxLength={80} value={fonction.nom}
            onChange={event => modifierFonction(fonction.id, { nom: event.target.value })} /></label>
          <label>Espace autorisé<select className="champ" value={fonction.role}
            onChange={event => modifierFonction(fonction.id, { role: event.target.value })}>
            <option value="econome">Économat</option><option value="titulaire">Saisie des notes</option>
          </select></label>
          <label><input type="checkbox" className="mr-2" checked={fonction.active}
            onChange={event => modifierFonction(fonction.id, { active: event.target.checked })} /> Disponible à l’inscription</label>
        </fieldset>)}
        <div className="flex flex-wrap gap-3">
          <button type="button" className="bouton bouton-secondaire" disabled={enCours || fonctions.length >= 30} onClick={ajouterFonction}>Ajouter une fonction</button>
          <button className="bouton" disabled={enCours}>Enregistrer les fonctions</button>
        </div>
      </form>
      <form className="carte p-6 space-y-4" onSubmit={event => enregistrer(event, 'etablissement', etablissement)}>
        <h2 className="text-lg font-bold">Établissement</h2>
        {champs.map(([cle, libelle, taille]) => <label className="block" key={cle}>{libelle}
          <input className="champ" value={etablissement[cle]} maxLength={taille} required={cle === 'nom'}
            type={cle === 'logo' ? 'url' : 'text'}
            onChange={event => definirEtablissement(valeur => ({ ...valeur, [cle]: event.target.value }))} />
        </label>)}
        <label className="block">Historique<textarea className="champ" rows={5} maxLength={4000}
          value={etablissement.historique}
          onChange={event => definirEtablissement(valeur => ({ ...valeur, historique: event.target.value }))} /></label>
        <button className="bouton" disabled={enCours}>Enregistrer l’établissement</button>
      </form>
    </>}
  </section>;
}
