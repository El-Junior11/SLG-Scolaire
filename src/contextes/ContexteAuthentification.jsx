import React,{createContext,useContext,useState} from 'react';
const Contexte=createContext(null);const CLE='slg-session-demo';
export function FournisseurAuthentification({children}){
 const [utilisateur,definirUtilisateur]=useState(()=>{try{return JSON.parse(sessionStorage.getItem(CLE)||'null')}catch{return null}});
 const connexion=(role)=>{const u={role,nom:role==='secretaire'?'Administration SLG':role==='econome'?'Service Économat':'Titulaire 6e A',classe:role==='titulaire'?'6e A':null};sessionStorage.setItem(CLE,JSON.stringify(u));definirUtilisateur(u);return u};
 const deconnexion=()=>{sessionStorage.removeItem(CLE);definirUtilisateur(null)};
 return <Contexte.Provider value={{utilisateur,connexion,deconnexion}}>{children}</Contexte.Provider>;
}
export const utiliserAuthentification=()=>useContext(Contexte);
