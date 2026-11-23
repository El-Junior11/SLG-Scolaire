import { useEffect, useState } from 'react';
import { utiliserAuthentification } from '../contextes/ContexteAuthentification';
import { messageErreur, requetePrivee } from '../services/authentification';

const statuts = { en_attente: 'En attente', approuve: 'Approuvée', refuse: 'Refusée' };

function Demande({ demande, fonctions, decider, enCours }) {
  const [fonctionId, definirFonctionId] = useState(() => {
    const id = demande.fonctionAttribuee?.id ?? demande.fonctionDemandee?.id;
    return fonctions.find(fonction => fonction.id === id)?.id ?? '';
  });
  const role = fonctions.find(fonction => fonction.id === fonctionId)?.role;
  const [classe, definirClasse] = useState(demande.classe ?? '');

  return <form className="carte p-5 space-y-4" onSubmit={event => {
    event.preventDefault();
    decider(demande.uid, { statut: 'approuve', fonctionId, classe });
  }}>
    <div>
      <h2 className="font-bold">{demande.nom}</h2>
      <p className="texte-secondaire break-all">{demande.email}</p>
      <p className="mt-2 text-sm">{statuts[demande.statut]}</p>
    </div>
    <p className="texte-secondaire">Fonction demandée : {demande.fonctionDemandee?.nom ?? 'Non renseignée'}</p>
    <label className="block">Fonction attribuée
      <select className="champ" value={fonctionId} required onChange={event => definirFonctionId(event.target.value)}>
        <option value="" disabled>Choisir une fonction</option>
        {fonctions.map(fonction => <option key={fonction.id} value={fonction.id}>{fonction.nom}</option>)}
      </select>
    </label>
    {role === 'titulaire' && <label className="block">Classe
      <input className="champ" value={classe} maxLength={80} required onChange={event => definirClasse(event.target.value)} />
    </label>}
    <div className="flex flex-wrap gap-3">
      <button className="bouton" disabled={enCours || !fonctionId}>{demande.statut === 'approuve' ? 'Mettre à jour' : 'Approuver'}</button>
      {demande.statut !== 'refuse' && <button type="button" className="bouton bouton-secondaire"
        disabled={enCours} onClick={() => decider(demande.uid, { statut: 'refuse' })}>
        {demande.statut === 'approuve' ? 'Retirer l’accès' : 'Refuser'}
      </button>}
    </div>
  </form>;
}

export default function AdministrationAcces() {
  const { utilisateur } = utiliserAuthentification();
  const [fonctions, definirFonctions] = useState([]);
  const [demandes, definirDemandes] = useState([]);
  const [enCours, definirEnCours] = useState(true);
  const [erreur, definirErreur] = useState('');
  const [message, definirMessage] = useState('');

  useEffect(() => {
    const controleur = new AbortController();
    Promise.all([
      requetePrivee('/admin/demandes', { signal: controleur.signal }),
      requetePrivee('/admin/configuration', { signal: controleur.signal }),
    ]).then(([liste, configuration]) => {
      definirFonctions(configuration.fonctions.filter(fonction => fonction.active));
      definirDemandes(liste);
    })
      .catch(cause => { if (!controleur.signal.aborted) definirErreur(messageErreur(cause)); })
      .finally(() => { if (!controleur.signal.aborted) definirEnCours(false); });
    return () => controleur.abort();
  }, []);

  async function decider(uid, decision) {
    definirEnCours(true);
    definirErreur('');
    definirMessage('');
    try {
      const resultat = await requetePrivee(`/admin/demandes/${encodeURIComponent(uid)}`, { method: 'PATCH', data: decision });
      definirDemandes(liste => liste.map(demande => demande.uid === uid
        ? { ...demande, ...resultat }
        : demande));
      definirMessage('Décision enregistrée.');
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <section>
    <div className="max-w-5xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div><h1 className="titre-page">Demandes d’accès</h1><p className="texte-secondaire">{utilisateur.email}</p></div>
      </header>
      {erreur && <p role="alert" className="text-red-600 mb-4">{erreur}</p>}
      {message && <p role="status" className="mb-4">{message}</p>}
      {enCours && demandes.length === 0 && <p>Chargement…</p>}
      {!enCours && !erreur && demandes.length === 0 && <p>Aucune demande pour le moment.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {demandes.map(demande => <Demande key={demande.uid} demande={demande} fonctions={fonctions} decider={decider} enCours={enCours} />)}
      </div>
    </div>
  </section>;
}
