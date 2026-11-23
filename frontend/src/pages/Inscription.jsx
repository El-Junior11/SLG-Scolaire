import { api } from '../services/api';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { authentification, messageErreur, requetePrivee } from '../services/authentification';

export default function Inscription() {
  const [message, definirMessage] = useState('');
  const [erreur, definirErreur] = useState('');
  const [enCours, definirEnCours] = useState(false);

  const [fonctions, definirFonctions] = useState(null);

  useEffect(() => {
    const controleur = new AbortController();
    api.get('/configuration', { signal: controleur.signal })
      .then(({ data }) => definirFonctions(data.fonctions))
      .catch(cause => { if (!controleur.signal.aborted) definirErreur(messageErreur(cause)); });
    return () => controleur.abort();
  }, []);

  async function soumettre(evenement) {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget;
    const champs = new FormData(formulaire);
    const email = champs.get('email').trim();
    const motDePasse = champs.get('password');
    definirErreur('');
    definirMessage('');
    if (motDePasse !== champs.get('confirmation')) {
      definirErreur('Les mots de passe doivent correspondre.');
      return;
    }

    definirEnCours(true);
    let auth;
    try {
      auth = authentification();
      const { user } = await createUserWithEmailAndPassword(auth, email, motDePasse).catch(cause => {
        if (cause.code !== 'auth/email-already-in-use') throw cause;
        return signInWithEmailAndPassword(auth, email, motDePasse);
      });
      const { statut } = await requetePrivee('/auth/demandes', {
        method: 'POST',
        data: { nom: champs.get('nom'), fonctionId: champs.get('fonction') },
      }, user);
      if (statut === 'refuse') {
        definirMessage('Votre demande a été refusée. Contactez l’administration.');
      } else {
        definirMessage(statut === 'approuve' ? 'Votre demande est déjà approuvée.' : 'Votre demande attend l’approbation de l’administrateur.');
        if (!user.emailVerified) {
          try {
            await sendEmailVerification(user);
            definirMessage(message => `${message} Vérifiez aussi votre boîte e-mail pour confirmer votre adresse.`);
          } catch {
            definirErreur('E-mail de confirmation indisponible. Réessayez avec les mêmes identifiants.');
          }
        }
      }
      formulaire.reset();
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      try { if (auth?.currentUser) await signOut(auth); }
      finally { definirEnCours(false); }
    }
  }

  return <main className="fond-auth min-h-screen flex items-center justify-center p-5">
    <div className="carte w-full max-w-lg p-8 md:p-10">
      <h1 className="titre-page">Créer un compte</h1>
      <form className="space-y-4 mt-6" onSubmit={soumettre}>
        <label className="block">Nom complet<input className="champ" name="nom" maxLength={120} autoComplete="name" required /></label>
        <label className="block">Adresse e-mail<input className="champ" name="email" type="email" autoComplete="email" required /></label>
        <label className="block">Mot de passe<input className="champ" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        <label className="block">Confirmer le mot de passe<input className="champ" name="confirmation" type="password" autoComplete="new-password" required /></label>
        <label className="block">Fonction demandée
          <select className="champ" name="fonction" required defaultValue="">
            <option value="" disabled>{fonctions === null ? 'Chargement des fonctions…' : 'Choisir une fonction'}</option>
            {fonctions?.map(fonction => <option key={fonction.id} value={fonction.id}>{fonction.nom}</option>)}
          </select>
        </label>
        {fonctions?.length === 0 && <p>Aucune fonction ouverte aux demandes.</p>}
        {erreur && <p role="alert" className="text-red-600">{erreur}</p>}
        {message && <p role="status">{message}</p>}
        <button className="bouton w-full" disabled={enCours || !fonctions?.length}>{enCours ? 'Envoi…' : 'Envoyer la demande'}</button>
      </form>
      <Link to="/connexion" className="block mt-6 text-blue-600 font-bold">Retour à la connexion</Link>
    </div>
  </main>;
}
