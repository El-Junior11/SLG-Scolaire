import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { api } from "./api";
let instanceAuth = null;
export function authentification() {
  if (instanceAuth) return instanceAuth;
  const configuration = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  if (Object.values(configuration).some(valeur => !valeur)) {
    throw new Error("Complétez la configuration Firebase dans frontend/.env.");
  }
  const application = getApps().length ? getApp() : initializeApp(configuration);
  instanceAuth = getAuth(application);
  return instanceAuth;
}
export async function requetePrivee(url, config = {}, compte = authentification().currentUser) {
  if (!compte) throw new Error("Veuillez vous reconnecter.");
  const jeton = await compte.getIdToken();
  const { data } = await api.request({
    ...config,
    url,
    headers: { ...config.headers, Authorization: `Bearer ${jeton}` }
  });
  return data;
}
export function messageErreur(erreur) {
  if (erreur.response?.data?.message) return erreur.response.data.message;
  if (erreur.isAxiosError) return "Impossible de joindre le backend ou requête refusée.";
  if (erreur.code === "auth/invalid-credential") return "Adresse e-mail ou mot de passe incorrect.";
  if (erreur.code === "auth/email-already-in-use") return "Cette adresse e-mail possède déjà un compte.";
  if (erreur.code === "auth/weak-password") return "Choisissez un mot de passe plus fort.";
  if (erreur.code === "auth/too-many-requests") return "Trop de tentatives. Réessayez plus tard.";
  if (erreur.code?.startsWith("auth/")) return "Erreur d'authentification Firebase.";
  return erreur.message || "Une erreur inattendue est survenue.";
}
export function destination(utilisateur) {
  if (!utilisateur?.role || !/^[a-z0-9-]+$/i.test(utilisateur.role)) {
    throw new Error("Rôle utilisateur invalide ou non attribué.");
  }
  return `/${utilisateur.role}/tableau-de-bord`;
}