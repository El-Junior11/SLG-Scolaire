<<<<<<< HEAD
import { api } from '../services/api';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { authentification, messageErreur, requetePrivee } from '../services/authentification';

export default function Inscription() {
  const [message, definirMessage] = useState('');
  const [erreur, definirErreur] = useState('');
  const [enCours, definirEnCours] = useState(false);

  const [fonctions, definirFonctions] = useState(null);

  useEffect(() => {
    const controleur = new AbortController();
    api.get('/configuration', { signal: controleur.signal })
      .then(({ data }) => definirFonctions(data.fonctions))
      .catch(cause => { if (!controleur.signal.aborted) definirErreur(messageErreur(cause)); });
    return () => controleur.abort();
  }, []);

  async function soumettre(evenement) {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget;
    const champs = new FormData(formulaire);
    const email = champs.get('email').trim();
    const motDePasse = champs.get('password');
    definirErreur('');
    definirMessage('');
    if (motDePasse !== champs.get('confirmation')) {
      definirErreur('Les mots de passe doivent correspondre.');
      return;
    }

    definirEnCours(true);
    let auth;
    try {
      auth = authentification();
      const { user } = await createUserWithEmailAndPassword(auth, email, motDePasse).catch(cause => {
        if (cause.code !== 'auth/email-already-in-use') throw cause;
        return signInWithEmailAndPassword(auth, email, motDePasse);
      });
      const { statut } = await requetePrivee('/auth/demandes', {
        method: 'POST',
        data: { nom: champs.get('nom'), fonctionId: champs.get('fonction') },
      }, user);
      if (statut === 'refuse') {
        definirMessage('Votre demande a été refusée. Contactez l’administration.');
      } else {
        definirMessage(statut === 'approuve' ? 'Votre demande est déjà approuvée.' : 'Votre demande attend l’approbation de l’administrateur.');
        if (!user.emailVerified) {
          try {
            await sendEmailVerification(user);
            definirMessage(message => `${message} Vérifiez aussi votre boîte e-mail pour confirmer votre adresse.`);
          } catch {
            definirErreur('E-mail de confirmation indisponible. Réessayez avec les mêmes identifiants.');
          }
        }
      }
      formulaire.reset();
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      try { if (auth?.currentUser) await signOut(auth); }
      finally { definirEnCours(false); }
    }
  }

  return <main className="fond-auth min-h-screen flex items-center justify-center p-5">
    <div className="carte w-full max-w-lg p-8 md:p-10">
      <h1 className="titre-page">Créer un compte</h1>
      <form className="space-y-4 mt-6" onSubmit={soumettre}>
        <label className="block">Nom complet<input className="champ" name="nom" maxLength={120} autoComplete="name" required /></label>
        <label className="block">Adresse e-mail<input className="champ" name="email" type="email" autoComplete="email" required /></label>
        <label className="block">Mot de passe<input className="champ" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        <label className="block">Confirmer le mot de passe<input className="champ" name="confirmation" type="password" autoComplete="new-password" required /></label>
        <label className="block">Fonction demandée
          <select className="champ" name="fonction" required defaultValue="">
            <option value="" disabled>{fonctions === null ? 'Chargement des fonctions…' : 'Choisir une fonction'}</option>
            {fonctions?.map(fonction => <option key={fonction.id} value={fonction.id}>{fonction.nom}</option>)}
          </select>
        </label>
        {fonctions?.length === 0 && <p>Aucune fonction ouverte aux demandes.</p>}
        {erreur && <p role="alert" className="text-red-600">{erreur}</p>}
        {message && <p role="status">{message}</p>}
        <button className="bouton w-full" disabled={enCours || !fonctions?.length}>{enCours ? 'Envoi…' : 'Envoyer la demande'}</button>
      </form>
      <Link to="/connexion" className="block mt-6 text-blue-600 font-bold">Retour à la connexion</Link>
    </div>
  </main>;
=======
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import Icone from "../components/Icone";
import { ROLES } from "../donnees/configuration";

export default function Inscription() {
  const [formulaire, definirFormulaire] = useState({
    nom: "", prenom: "", email: "", role: "",
    motDePasse: "", confirmation: ""
  });
  const [visible, definirVisible] = useState(false);
  const [visibleConfirmation, definirVisibleConfirmation] = useState(false);
  const [chargement, definirChargement] = useState(false);

  const modifier = e => {
    definirFormulaire(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const soumettre = async e => {
    e.preventDefault();
    if (formulaire.motDePasse !== formulaire.confirmation) {
      return Swal.fire({
        icon: "error",
        title: "Mots de passe différents",
        text: "Veuillez vérifier la confirmation du mot de passe.",
        confirmButtonColor: "#540916"
      });
    }

    definirChargement(true);
    try {
      await Swal.fire({
        icon: "info",
        title: "Demande simulée",
        text: "Aucune demande n'a été envoyée au backend pour le moment.",
        confirmButtonColor: "#540916"
      });
    } finally {
      definirChargement(false);
    }
  };

  const champ = "h-10 w-full rounded-lg border border-[#D1D1D1] bg-white px-3 text-[12px] font-medium text-black outline-none transition placeholder:text-[#A0A0A0] focus:border-[#540916] focus:ring-2 focus:ring-[#F5E7EB]";
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
              Rejoignez-nous !
            </h2>
            <p className="mt-2 max-w-[310px] text-[13px] leading-5 text-white">
              Créez votre compte et accédez à votre espace de gestion scolaire.
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
          <div className="mt-4">
            <div className="mx-auto w-full max-w-[370px]">

              {/* TITRE */}
              <div className="mb-3">
                <h1 className="font-editorial text-[29px] font-semibold text-[#540916] lg:text-[34px]">
                  Inscription
                </h1>
                <p className="mt-1 text-[11px] leading-5 text-black">
                  Remplissez le formulaire pour demander un accès.
                </p>
                <div className="mt-2 h-[3px] w-10 rounded-full bg-[#540916]"/>
              </div>

              <form onSubmit={soumettre} className="grid grid-cols-2 gap-x-3 gap-y-2.5">

                {/* NOM */}
                <div className="min-w-0">
                  <label htmlFor="nom" className={label}>Nom</label>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    value={formulaire.nom}
                    onChange={modifier}
                    placeholder="Votre nom"
                    autoComplete="family-name"
                    required
                    className={champ}
                  />
                </div>

                {/* PRÉNOM */}
                <div className="min-w-0">
                  <label htmlFor="prenom" className={label}>Prénom</label>
                  <input
                    id="prenom"
                    name="prenom"
                    type="text"
                    value={formulaire.prenom}
                    onChange={modifier}
                    placeholder="Votre prénom"
                    autoComplete="given-name"
                    required
                    className={champ}
                  />
                </div>

                {/* EMAIL */}
                <div className="col-span-2">
                  <label htmlFor="email" className={label}>Adresse e-mail</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formulaire.email}
                    onChange={modifier}
                    placeholder="exemple@etablissement.mg"
                    autoComplete="email"
                    required
                    className={champ}
                  />
                </div>

                {/* RÔLE */}
                <div className="col-span-2">
                  <label htmlFor="role" className={label}>Profil demandé</label>
                  <select
                    id="role"
                    name="role"
                    value={formulaire.role}
                    onChange={modifier}
                    required
                    className={`${champ} cursor-pointer ${formulaire.role ? "text-black" : "text-[#A0A0A0]"}`}
                  >
                    <option value="" disabled>Sélectionnez votre profil</option>
                    {Object.entries(ROLES).map(([valeur, nom]) => (
                      <option key={valeur} value={valeur} className="text-black">
                        {nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* MOT DE PASSE */}
                <div className="min-w-0">
                  <label htmlFor="motDePasse" className={label}>Mot de passe</label>
                  <div className="relative">
                    <input
                      id="motDePasse"
                      name="motDePasse"
                      type={visible ? "text" : "password"}
                      value={formulaire.motDePasse}
                      onChange={modifier}
                      placeholder="8 caractères min."
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className={`${champ} pr-9`}
                    />
                    <button
                      type="button"
                      onClick={() => definirVisible(!visible)}
                      aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-[#540916]"
                    >
                      <Icone nom={visible ? "EyeOff" : "Eye"} taille={15}/>
                    </button>
                  </div>
                </div>

                {/* CONFIRMATION */}
                <div className="min-w-0">
                  <label htmlFor="confirmation" className={label}>Confirmation</label>
                  <div className="relative">
                    <input
                      id="confirmation"
                      name="confirmation"
                      type={visibleConfirmation ? "text" : "password"}
                      value={formulaire.confirmation}
                      onChange={modifier}
                      placeholder="Confirmer"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className={`${champ} pr-9`}
                    />
                    <button
                      type="button"
                      onClick={() => definirVisibleConfirmation(!visibleConfirmation)}
                      aria-label={visibleConfirmation ? "Masquer la confirmation" : "Afficher la confirmation"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-[#540916]"
                    >
                      <Icone nom={visibleConfirmation ? "EyeOff" : "Eye"} taille={15}/>
                    </button>
                  </div>
                </div>

                {/* BOUTON */}
                <button
                  type="submit"
                  disabled={chargement}
                  className="col-span-2 mt-1 flex h-10 items-center justify-center gap-2 rounded-lg bg-[#540916] text-[12px] font-extrabold text-white transition hover:bg-[#74172A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chargement ? "Traitement..." : "Demander un accès"}
                  {!chargement && <Icone nom="ArrowRight" taille={15}/>}
                </button>
              </form>

              {/* CONNEXION */}
              <p className="mt-3 text-center text-[11px] text-black">
                Vous avez déjà un compte ?{" "}
                <Link to="/connexion" className="font-bold text-[#540916] hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
>>>>>>> origin/main
}
