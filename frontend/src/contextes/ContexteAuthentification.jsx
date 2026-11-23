import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { authentification, requetePrivee } from "../services/authentification";
const Contexte = createContext(null);
export function FournisseurAuthentification({ children }) {
  const [utilisateur, definirUtilisateur] = useState(null);
  const [chargement, definirChargement] = useState(true);
  const operationManuelle = useRef(false);
  const versionSession = useRef(0);
  useEffect(() => {
    let actif = true;
    let arreter;
    try {
      const auth = authentification();
      arreter = onAuthStateChanged(auth, async compte => {
        if (operationManuelle.current) return;
        const version = ++versionSession.current;
        definirChargement(true);
        if (!compte) {
          if (actif && version === versionSession.current) {
            definirUtilisateur(null);
            definirChargement(false);
          }
          return;
        }
        try {
          const profil = await requetePrivee("/auth/moi", {}, compte);
          if (actif && version === versionSession.current && auth.currentUser?.uid === compte.uid) {
            definirUtilisateur(profil);
          }
        } catch (erreur) {
          if (actif && version === versionSession.current) {
            console.error("Profil utilisateur inaccessible :", erreur);
            definirUtilisateur(null);
          }
        } finally {
          if (actif && version === versionSession.current) definirChargement(false);
        }
      }, erreur => {
        console.error("Erreur Firebase :", erreur);
        if (actif) {
          definirUtilisateur(null);
          definirChargement(false);
        }
      });
    } catch (erreur) {
      console.error("Initialisation Firebase impossible :", erreur);
      definirChargement(false);
    }
    return () => {
      actif = false;
      arreter?.();
    };
  }, []);
  async function connexion(email, motDePasse) {
    operationManuelle.current = true;
    ++versionSession.current;
    definirChargement(true);
    definirUtilisateur(null);
    try {
      const auth = authentification();
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), motDePasse);
      try {
        const profil = await requetePrivee("/auth/moi", {}, user);
        if (!profil || !profil.role) throw new Error("Profil ou rôle introuvable dans le backend.");
        definirUtilisateur(profil);
        return profil;
      } catch (erreur) {
        await signOut(auth);
        throw erreur;
      }
    } finally {
      operationManuelle.current = false;
      definirChargement(false);
    }
  }
  async function deconnexion() {
    operationManuelle.current = true;
    ++versionSession.current;
    definirUtilisateur(null);
    try {
      await signOut(authentification());
    } finally {
      operationManuelle.current = false;
      definirChargement(false);
    }
  }
  async function actualiserProfil() {
    const compte = authentification().currentUser;
    if (!compte) {
      definirUtilisateur(null);
      return null;
    }
    const profil = await requetePrivee("/auth/moi", {}, compte);
    definirUtilisateur(profil);
    return profil;
  }
  return (
    <Contexte.Provider value={{ utilisateur, chargement, connexion, deconnexion, actualiserProfil }}>
      {children}
    </Contexte.Provider>
  );
}
export const utiliserAuthentification = () => useContext(Contexte);