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