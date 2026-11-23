<<<<<<< HEAD
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { authentification, requetePrivee } from '../services/authentification';

const Contexte = createContext(null);

export function FournisseurAuthentification({ children }) {
  const [utilisateur, definirUtilisateur] = useState(null);
  const [chargement, definirChargement] = useState(true);
  const operationManuelle = useRef(false);

  useEffect(() => {
    let actif = true;
    let arreter;
    try {
      const auth = authentification();
      arreter = onAuthStateChanged(auth, async compte => {
        if (operationManuelle.current) return;
        let profil = null;
        try {
          if (compte) profil = await requetePrivee('/auth/moi', {}, compte);
        } catch {
          // Le profil reste inaccessible tant que le serveur refuse cette session.
        }
        if (actif && !operationManuelle.current && auth.currentUser === compte) {
          definirUtilisateur(profil);
          definirChargement(false);
        }
      });
    } catch {
      definirChargement(false);
    }
    return () => { actif = false; arreter?.(); };
  }, []);

  async function connexion(email, motDePasse) {
    operationManuelle.current = true;
    try {
      const auth = authentification();
      definirUtilisateur(null);
      const { user } = await signInWithEmailAndPassword(auth, email, motDePasse);
      try {
        const profil = await requetePrivee('/auth/moi', {}, user);
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
    definirUtilisateur(null);
    await signOut(authentification());
  }

  return <Contexte.Provider value={{ utilisateur, chargement, connexion, deconnexion }}>
    {children}
  </Contexte.Provider>;
}

export const utiliserAuthentification = () => useContext(Contexte);
=======
import React, { createContext, useContext, useState } from "react";

const Contexte = createContext(null);
const CLE = "slg-session-demo";

const COMPTES_DEMO = [
  { email: "secretaire@slg.mg", motDePasse: "SLG2026!", role: "secretaire", nom: "Administration SLG" },
  { email: "econome@slg.mg", motDePasse: "SLG2026!", role: "econome", nom: "Service Économat" },
  { email: "titulaire@slg.mg", motDePasse: "SLG2026!", role: "titulaire", nom: "Titulaire 6e A", classe: "6e A" }
];

export function FournisseurAuthentification({ children }) {
  const [utilisateur, definirUtilisateur] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(CLE) || "null");
    } catch {
      return null;
    }
  });

  const connexion = async (email, motDePasse) => {
    const compte = COMPTES_DEMO.find(c =>
      c.email.toLowerCase() === email.trim().toLowerCase() &&
      c.motDePasse === motDePasse
    );

    if (!compte) throw new Error("Adresse e-mail ou mot de passe incorrect.");

    const utilisateurConnecte = {
      email: compte.email,
      role: compte.role,
      nom: compte.nom,
      classe: compte.classe || null
    };

    sessionStorage.setItem(CLE, JSON.stringify(utilisateurConnecte));
    definirUtilisateur(utilisateurConnecte);
    return utilisateurConnecte;
  };

  const deconnexion = () => {
    sessionStorage.removeItem(CLE);
    definirUtilisateur(null);
  };

  return (
    <Contexte.Provider value={{ utilisateur, connexion, deconnexion }}>
      {children}
    </Contexte.Provider>
  );
}

export const utiliserAuthentification = () => useContext(Contexte);
>>>>>>> origin/main
