<<<<<<< HEAD
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
=======
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icone from "../components/Icone";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";

export default function Connexion() {
  const [email, definirEmail] = useState("");
  const [motDePasse, definirMotDePasse] = useState("");
  const [visible, definirVisible] = useState(false);
  const [souvenir, definirSouvenir] = useState(false);
  const [erreur, definirErreur] = useState("");
  const [chargement, definirChargement] = useState(false);
  const { connexion } = utiliserAuthentification();
  const naviguer = useNavigate();

  const soumettre = async e => {
    e.preventDefault();
    definirErreur("");
    definirChargement(true);
    try {
      const utilisateur = await connexion(email, motDePasse);
      if (!utilisateur?.role) throw new Error("Impossible de déterminer votre rôle.");
      naviguer(`/${utilisateur.role}/tableau-de-bord`, { replace: true });
    } catch (err) {
      definirErreur(err.message || "Identifiants incorrects.");
    } finally {
      definirChargement(false);
    }
  };

  const champ = "h-10 w-full rounded-lg border border-[#D1D1D1] bg-white text-[12px] font-medium text-black outline-none transition placeholder:text-[#A0A0A0] focus:border-[#540916] focus:ring-2 focus:ring-[#F5E7EB]";
  const label = "mb-1 block text-[11px] font-bold text-black";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#540916] p-3 sm:p-4">

      {/* DÉCORATION */}
      <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#8D3046]/40 blur-3xl"/>
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-[#A44960]/30 blur-3xl"/>

      {/* CARTE PRINCIPALE */}
      <div className="relative grid w-full max-w-[1000px] overflow-hidden rounded-[20px] bg-white shadow-[0_25px_90px_rgba(20,0,5,0.3)] md:grid-cols-[1.05fr_1fr]">

        {/* PARTIE GAUCHE */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#74172A] via-[#540916] to-[#35050E] p-6 text-white md:flex lg:p-8">

          {/* FORMES DÉCORATIVES */}
          <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-[#A94C62]/45"/>
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#A94C62]/35"/>
          <div className="pointer-events-none absolute bottom-10 right-[-55px] h-40 w-40 rounded-full bg-[#8F2D44]/60"/>

          {/* LOGO */}
          <Link to="/" className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Icone nom="GraduationCap" taille={23}/>
            </div>
            <div>
              <p className="text-[13px] font-extrabold leading-tight text-white">
                Saint Louis de Gonzague
              </p>
              <p className="mt-1 text-[10px] font-semibold tracking-[.2em] text-white">
                MAHASOABE
              </p>
            </div>
          </Link>

          {/* MESSAGE */}
          <div className="relative z-10 mt-5">
            <div className="mb-2 h-1 w-10 rounded-full bg-[#E7A1B1]"/>
            <h2 className="font-editorial text-[35px] font-semibold leading-tight text-white lg:text-[43px]">
              Bienvenue !
            </h2>
            <p className="mt-2 max-w-[310px] text-[13px] leading-5 text-white">
              Votre espace de gestion scolaire, simple et accessible.
            </p>
          </div>

          {/* ILLUSTRATION */}
          <div className="relative z-10 mt-2 flex items-center justify-center">
            <img
              src="/images/avatar-connexion.svg"
              alt="Illustration de la plateforme scolaire"
              className="max-h-[190px] w-full max-w-[320px] object-contain drop-shadow-xl"
            />
          </div>

          {/* COPYRIGHT */}
          <p className="relative z-10 mt-3 text-[10px] text-white">
            © {new Date().getFullYear()} Saint Louis de Gonzague Mahasoabe
          </p>
        </section>

        {/* PARTIE DROITE */}
        <section className="flex flex-col bg-white px-6 py-4 text-black sm:px-8 lg:px-10">

          {/* RETOUR */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-[11px] font-bold text-black hover:underline">
              <Icone nom="ArrowLeft" taille={15}/>
              Accueil
            </Link>
            <span className="rounded-full bg-[#F8EEF0] px-3 py-1 text-[10px] font-extrabold text-black">
              SLG
            </span>
          </div>

          {/* FORMULAIRE */}
          <div className="mt-5">
            <div className="mx-auto w-full max-w-[350px]">

              {/* TITRE */}
              <div className="mb-3">
                <h1 className="font-editorial text-[32px] font-semibold text-[#540916] lg:text-[38px]">
                  Connexion
                </h1>
                <p className="mt-1 text-[12px] text-black">
                  Connectez-vous à votre espace personnel.
                </p>
                <div className="mt-2 h-[3px] w-10 rounded-full bg-[#540916]"/>
              </div>

              <form onSubmit={soumettre} className="space-y-2.5">

                {/* EMAIL */}
                <div>
                  <label htmlFor="email" className={label}>Adresse e-mail</label>
                  <div className="relative">
                    <Icone nom="Mail" taille={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]"/>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => definirEmail(e.target.value)}
                      placeholder="Votre adresse e-mail"
                      autoComplete="email"
                      required
                      className={`${champ} pl-10 pr-3`}
                    />
                  </div>
                </div>

                {/* MOT DE PASSE */}
                <div>
                  <label htmlFor="mot-de-passe" className={label}>Mot de passe</label>
                  <div className="relative">
                    <Icone nom="Lock" taille={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]"/>
                    <input
                      id="mot-de-passe"
                      type={visible ? "text" : "password"}
                      value={motDePasse}
                      onChange={e => definirMotDePasse(e.target.value)}
                      placeholder="Votre mot de passe"
                      autoComplete="current-password"
                      required
                      className={`${champ} pl-10 pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => definirVisible(!visible)}
                      aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#540916]"
                    >
                      <Icone nom={visible ? "EyeOff" : "Eye"} taille={17}/>
                    </button>
                  </div>
                </div>

                {/* OPTIONS */}
                <div className="flex items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-black">
                    <input
                      type="checkbox"
                      checked={souvenir}
                      onChange={e => definirSouvenir(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[#540916]"
                    />
                    Se souvenir de moi
                  </label>
                  <Link to="/mot-de-passe-oublie" className="text-[11px] font-bold text-[#540916] hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>

                {/* ERREUR */}
                {erreur && (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    {erreur}
                  </p>
                )}

                {/* BOUTON */}
                <button
                  type="submit"
                  disabled={chargement}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#540916] text-[12px] font-extrabold text-white transition hover:bg-[#74172A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chargement ? "Connexion..." : "Se connecter"}
                  {!chargement && <Icone nom="ArrowRight" taille={16}/>}
                </button>
              </form>

              {/* INSCRIPTION */}
              <p className="mt-3 text-center text-[12px] text-black">
                Vous n'avez pas de compte ?{" "}
                <Link to="/inscription" className="font-bold text-[#540916] hover:underline">
                  S'inscrire
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
>>>>>>> origin/main
