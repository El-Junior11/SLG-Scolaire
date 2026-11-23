import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { browserLocalPersistence, browserSessionPersistence, setPersistence } from "firebase/auth";
import Icone from "../components/Icone";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { authentification, destination, messageErreur } from "../services/authentification";

export default function Connexion() {
  const [visible, definirVisible] = useState(false);
  const [souvenir, definirSouvenir] = useState(false);
  const [erreur, definirErreur] = useState("");
  const [chargement, definirChargement] = useState(false);
  const { connexion } = utiliserAuthentification();
  const naviguer = useNavigate();

  async function soumettre(evenement) {
    evenement.preventDefault();
    const champs = new FormData(evenement.currentTarget);
    definirErreur("");
    definirChargement(true);
    try {
      await setPersistence(authentification(), souvenir ? browserLocalPersistence : browserSessionPersistence);
      const profil = await connexion(champs.get("email").trim(), champs.get("motDePasse"));
      naviguer(destination(profil), { replace: true });
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirChargement(false);
    }
  }

  const champ = "h-10 w-full rounded-lg border border-[#D1D1D1] bg-white text-[12px] font-medium text-black outline-none transition placeholder:text-[#A0A0A0] focus:border-[#540916] focus:ring-2 focus:ring-[#F5E7EB]";
  const label = "mb-1 block text-[11px] font-bold text-black";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#540916] p-3 sm:p-4">
      <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#8D3046]/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-[#A44960]/30 blur-3xl" />
      <div className="relative grid w-full max-w-[1000px] overflow-hidden rounded-[20px] bg-white shadow-[0_25px_90px_rgba(20,0,5,0.3)] md:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#74172A] via-[#540916] to-[#35050E] p-6 text-white md:flex lg:p-8">
          <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-[#A94C62]/45" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#A94C62]/35" />
          <div className="pointer-events-none absolute bottom-10 right-[-55px] h-40 w-40 rounded-full bg-[#8F2D44]/60" />
          <Link to="/" className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Icone nom="GraduationCap" taille={23} />
            </div>
            <div>
              <p className="text-[13px] font-extrabold leading-tight text-white">Saint Louis de Gonzague</p>
              <p className="mt-1 text-[10px] font-semibold tracking-[.2em] text-white">MAHASOABE</p>
            </div>
          </Link>
          <div className="relative z-10 mt-5">
            <div className="mb-2 h-1 w-10 rounded-full bg-[#E7A1B1]" />
            <h2 className="font-editorial text-[35px] font-semibold leading-tight text-white lg:text-[43px]">
              Bienvenue !
            </h2>
            <p className="mt-2 max-w-[310px] text-[13px] leading-5 text-white">
              Votre espace de gestion scolaire, simple et accessible.
            </p>
          </div>
          <div className="relative z-10 mt-2 flex items-center justify-center">
            <img src="/images/avatar-connexion.svg" alt="Illustration de la plateforme scolaire"
              className="max-h-[190px] w-full max-w-[320px] object-contain drop-shadow-xl" />
          </div>
          <p className="relative z-10 mt-3 text-[10px] text-white">
            © {new Date().getFullYear()} Saint Louis de Gonzague Mahasoabe
          </p>
        </section>

        <section className="flex flex-col bg-white px-6 py-4 text-black sm:px-8 lg:px-10">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-[11px] font-bold text-black hover:underline">
              <Icone nom="ArrowLeft" taille={15} /> Accueil
            </Link>
            <span className="rounded-full bg-[#F8EEF0] px-3 py-1 text-[10px] font-extrabold text-black">SLG</span>
          </div>
          <div className="mt-5">
            <div className="mx-auto w-full max-w-[350px]">
              <div className="mb-3">
                <h1 className="font-editorial text-[32px] font-semibold text-[#540916] lg:text-[38px]">Connexion</h1>
                <p className="mt-1 text-[12px] text-black">Connectez-vous à votre espace personnel.</p>
                <div className="mt-2 h-[3px] w-10 rounded-full bg-[#540916]" />
              </div>
              <form onSubmit={soumettre} className="space-y-2.5">
                <div>
                  <label htmlFor="email" className={label}>Adresse e-mail</label>
                  <div className="relative">
                    <Icone nom="Mail" taille={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
                    <input id="email" name="email" type="email" placeholder="Votre adresse e-mail"
                      autoComplete="username" required className={`${champ} pl-10 pr-3`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="mot-de-passe" className={label}>Mot de passe</label>
                  <div className="relative">
                    <Icone nom="Lock" taille={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
                    <input id="mot-de-passe" name="motDePasse" type={visible ? "text" : "password"}
                      placeholder="Votre mot de passe" autoComplete="current-password" required
                      className={`${champ} pl-10 pr-11`} />
                    <button type="button" onClick={() => definirVisible(!visible)}
                      aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#540916]">
                      <Icone nom={visible ? "EyeOff" : "Eye"} taille={17} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-black">
                    <input type="checkbox" checked={souvenir} onChange={event => definirSouvenir(event.target.checked)}
                      className="h-3.5 w-3.5 accent-[#540916]" />
                    Se souvenir de moi
                  </label>
                  <Link to="/mot-de-passe-oublie" className="text-[11px] font-bold text-[#540916] hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                {erreur && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700">{erreur}</p>}
                <button type="submit" disabled={chargement}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#540916] text-[12px] font-extrabold text-white transition hover:bg-[#74172A] disabled:cursor-not-allowed disabled:opacity-60">
                  {chargement ? "Connexion…" : "Se connecter"}
                  {!chargement && <Icone nom="ArrowRight" taille={16} />}
                </button>
              </form>
              <p className="mt-3 text-center text-[12px] text-black">
                Vous n'avez pas de compte ?{" "}
                <Link to="/inscription" className="font-bold text-[#540916] hover:underline">Créer un compte</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
