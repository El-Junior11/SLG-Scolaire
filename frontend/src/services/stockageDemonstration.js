import { DEMONSTRATION } from '../donnees/demonstration';
const prefixe='slg-demo-v1-';
export const lireModule=(cle)=>{try{const v=localStorage.getItem(prefixe+cle);return v?JSON.parse(v):structuredClone(DEMONSTRATION[cle]||[])}catch{return structuredClone(DEMONSTRATION[cle]||[])}};
export const enregistrerModule=(cle,lignes)=>localStorage.setItem(prefixe+cle,JSON.stringify(lignes));
export const reinitialiserDemonstration=()=>{Object.keys(localStorage).filter(k=>k.startsWith(prefixe)).forEach(k=>localStorage.removeItem(k));location.reload()};
