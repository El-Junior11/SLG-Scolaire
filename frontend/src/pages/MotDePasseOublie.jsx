import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { authentification, messageErreur } from '../services/authentification';

export default function MotDePasseOublie() {
  const [message, definirMessage] = useState('');
  const [enCours, definirEnCours] = useState(false);

  async function envoyer(evenement) {
    evenement.preventDefault();
    const email = new FormData(evenement.currentTarget).get('email').trim();
    definirEnCours(true);
    try {
      await sendPasswordResetEmail(authentification(), email).catch(cause => {
        if (cause.code !== 'auth/user-not-found') throw cause;
      });
      definirMessage('Si un compte correspond à cette adresse, un e-mail de réinitialisation sera envoyé.');
    } catch (cause) {
      definirMessage(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <main className="fond-auth min-h-screen flex items-center justify-center p-5">
    <div className="carte p-9 w-full max-w-md">
      <h1 className="titre-page">Mot de passe oublié ?</h1>
      <form className="mt-6" onSubmit={envoyer}>
        <label>Adresse e-mail<input className="champ" type="email" name="email" autoComplete="email" required /></label>
        <button className="bouton w-full mt-4" disabled={enCours}>Envoyer le lien</button>
      </form>
      {message && <p role="status" className="mt-4">{message}</p>}
      <Link to="/connexion" className="block text-center text-blue-600 font-bold mt-6">Retour à la connexion</Link>
    </div>
  </main>;
}
