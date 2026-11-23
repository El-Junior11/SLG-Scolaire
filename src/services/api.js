import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_URL_API||'/api',timeout:15000});
// Point d'intégration : adapter au backend Firebase réel (API Express ou SDK Firebase).
export const modeDemonstration=import.meta.env.VITE_MODE_DEMONSTRATION!=='false';
