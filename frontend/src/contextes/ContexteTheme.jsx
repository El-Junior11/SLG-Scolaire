import React,{createContext,useContext,useEffect,useState} from 'react';import Icone from '../components/Icone';
const Contexte=createContext(null);const CLE='slg-theme';
const themeInitial=()=>{try{const s=localStorage.getItem(CLE);if(s==='dark'||s==='light')return s}catch{}return window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light'};
export function FournisseurTheme({children}){
 const [theme,definirTheme]=useState(themeInitial);
 useEffect(()=>{document.documentElement.dataset.theme=theme;document.querySelector('meta[name=theme-color]')?.setAttribute('content',theme==='dark'?'#0a1224':'#0b2251');try{localStorage.setItem(CLE,theme)}catch{}},[theme]);
 const basculer=()=>definirTheme(t=>t==='dark'?'light':'dark');
 return <Contexte.Provider value={{theme,basculer}}>{children}</Contexte.Provider>;
}
export const utiliserTheme=()=>useContext(Contexte);
export function BoutonTheme({className=''}){const {theme,basculer}=utiliserTheme();const sombre=theme==='dark';
 return <button type="button" onClick={basculer} aria-pressed={sombre} aria-label={sombre?'Activer le mode clair':'Activer le mode sombre'} title={sombre?'Mode clair':'Mode sombre'} className={`bouton-theme ${className}`}><Icone nom={sombre?'Sun':'Moon'} taille={18}/></button>}
