import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { api } from './api';

export function authentification() {
  const configuration = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  if (Object.values(configuration).some(valeur => !valeur)) {
    throw new Error('Complétez la configuration Firebase dans frontend/.env.');
  }
  return getAuth(initializeApp(configuration));
}

export async function requetePrivee(url, config = {}, compte = authentification().currentUser) {
  if (!compte) throw new Error('Veuillez vous reconnecter.');
  const jeton = await compte.getIdToken();
  const { data } = await api.request({
    ...config,
    url,
    headers: { Authorization: `Bearer ${jeton}` },
  });
  return data;
}

export function messageErreur(erreur) {
  if (erreur.response?.data?.message) return erreur.response.data.message;
  if (erreur.isAxiosError) return 'Impossible de joindre le backend. Vérifiez que le serveur est démarré.';
  if (erreur.code === 'auth/weak-password') return 'Choisissez un mot de passe plus fort.';
  if (erreur.code === 'auth/too-many-requests') return 'Trop de tentatives. Réessayez plus tard.';
  if (erreur.code?.startsWith('auth/')) return 'Firebase a refusé la demande. Vérifiez vos identifiants et la configuration.';
  return erreur.message;
}

export function destination(utilisateur) {
  return `/${utilisateur.role}/tableau-de-bord`;
}
