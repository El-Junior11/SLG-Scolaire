import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icone from '../components/Icone';
import { BoutonTheme } from '../contextes/ContexteTheme';
import { utiliserAuthentification } from '../contextes/ContexteAuthentification';
import { destination, messageErreur } from '../services/authentification';

export default function Connexion() {
  const [visible, definirVisible] = useState(false);
  const [erreur, definirErreur] = useState('');
  const [enCours, definirEnCours] = useState(false);
  const { connexion } = utiliserAuthentification();
  const naviguer = useNavigate();

  async function soumettre(evenement) {
    evenement.preventDefault();
    const champs = new FormData(evenement.currentTarget);
    definirEnCours(true);
    definirErreur('');
    try {
      const profil = await connexion(champs.get('email').trim(), champs.get('motDePasse'));
      naviguer(destination(profil), { replace: true });
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <div className="fond-auth min-h-screen grid lg:grid-cols-2"><div className="hidden lg:flex bg-[#0b2c65] text-white p-16 flex-col justify-between relative overflow-hidden"><div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/10 -right-40 top-32"/><Link to="/" className="flex gap-3 items-center relative"><Icone nom="GraduationCap" taille={37}/><span className="font-extrabold">Saint Louis de Gonzague<br/>Mahasoabe</span></Link><div className="relative"><span className="text-xs font-extrabold tracking-widest text-blue-300">GESTION SCOLAIRE</span><h1 className="text-5xl leading-tight font-extrabold mt-6">Un espace pensé pour votre réussite.</h1><p className="text-blue-200 mt-6 leading-8">Accédez aux outils administratifs, financiers et pédagogiques de l'établissement.</p><div className="mt-12 grid grid-cols-3 gap-3">{[['Users','Élèves'],['BarChart3','Statistiques'],['ShieldCheck','Accès sécurisé']].map(([i,n])=><div key={n} className="rounded-xl bg-white/10 p-5"><Icone nom={i} taille={25}/><div className="text-xs mt-4">{n}</div></div>)}</div></div><div className="text-blue-300 text-xs relative">© 2026 Saint Louis de Gonzague Mahasoabe</div></div><div className="flex items-center justify-center p-6 md:p-12"><div className="w-full max-w-[430px]"><div className="flex items-center justify-between"><Link to="/" className="text-blue-600 font-bold text-sm">← Retour à l'accueil</Link><BoutonTheme/></div><div className="mt-12 mb-8"><span className="text-xs text-blue-600 font-extrabold">BIENVENUE</span><h2 className="text-3xl font-extrabold mt-3 text-[#112a5a]">Connexion à votre espace</h2><p className="texte-secondaire mt-3">Connectez-vous avec votre adresse e-mail et votre mot de passe.</p></div><form onSubmit={soumettre} className="space-y-5"><label className="block"><span className="entree-label">Adresse e-mail</span><input className="champ" type="email" name="email" autoComplete="username" placeholder="exemple@etablissement.mg" required/></label><label className="block"><span className="entree-label">Mot de passe</span><div className="relative"><input className="champ pr-12" type={visible?'text':'password'} placeholder="••••••••" name="motDePasse" autoComplete="current-password" required/><button type="button" aria-label="Afficher le mot de passe" className="absolute right-3 top-3 text-slate-400" onClick={()=>definirVisible(!visible)}><Icone nom={visible?'EyeOff':'Eye'} taille={18}/></button></div></label>{erreur && <p role="alert" className="text-sm text-red-600">{erreur}</p>}<div className="flex justify-end"><Link to="/mot-de-passe-oublie" className="text-xs text-blue-600 font-bold">Mot de passe oublié ?</Link></div><button disabled={enCours} className="bouton w-full py-3.5">{enCours ? "Connexion…" : "Se connecter"} <Icone nom="ArrowRight" taille={17}/></button></form><div className="text-sm text-center mt-7 space-y-3">
  <Link to="/inscription" className="text-blue-600 font-bold">Créer un compte</Link>
</div></div></div></div>;
}
