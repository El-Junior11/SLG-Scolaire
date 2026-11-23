import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { authentification, messageErreur } from '../services/authentification';

export default function MotDePasseOublie() {
  const [message, definirMessage] = useState('');
  const [erreur, definirErreur] = useState('');
  const [enCours, definirEnCours] = useState(false);

  async function envoyer(evenement) {
    evenement.preventDefault();
    const email = new FormData(evenement.currentTarget).get('email').trim();
    definirEnCours(true);
    definirMessage('');
    definirErreur('');

    try {
      await sendPasswordResetEmail(authentification(), email).catch(cause => {
        if (cause.code !== 'auth/user-not-found') throw cause;
      });
      definirMessage('Si un compte correspond à cette adresse, un e-mail de réinitialisation sera envoyé.');
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#540916] p-4 sm:p-6">
    <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#A44960]/30 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#A44960]/25 blur-3xl" />

    <div className="relative w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-[0_25px_80px_rgba(20,0,5,0.25)]">
      <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#540916] text-white">
              <GraduationCap size={23} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[#540916]">Saint Louis de Gonzague</p>
              <p className="text-xs font-semibold text-slate-500">Mahasoabe</p>
            </div>
          </Link>
          <span className="shrink-0 rounded-full bg-[#540916]/5 px-3 py-1.5 text-[11px] font-extrabold text-[#540916]">
            SLG
          </span>
        </div>
      </div>

      <div className="px-6 py-7 sm:px-8 sm:py-8">
        <Link to="/connexion" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#540916]">
          <ArrowLeft size={15} /> Retour à la connexion
        </Link>

        <div className="mb-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#540916]/10 text-[#540916]">
            <KeyRound size={27} />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#540916]">Récupération de compte</p>
          <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#540916]">
            Mot de passe oublié ?
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Saisissez l'adresse e-mail associée à votre compte. Vous recevrez les instructions pour réinitialiser votre mot de passe.
          </p>
        </div>

        <form onSubmit={envoyer} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-700">
              Adresse e-mail <span className="text-red-500">*</span>
            </span>
            <div className="relative">
              <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" name="email" autoComplete="email" required autoFocus
                placeholder="exemple@etablissement.mg" disabled={enCours}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10 disabled:opacity-60" />
            </div>
          </label>

          {message && <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="text-sm leading-6 text-emerald-800">{message}</p>
          </div>}

          {erreur && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {erreur}
          </div>}

          <button type="submit" disabled={enCours}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#540916] text-sm font-bold text-white transition hover:bg-[#74172A] disabled:cursor-not-allowed disabled:opacity-60">
            {enCours ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            {!enCours && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#540916]" />
          <p className="text-xs leading-5 text-slate-600">
            Pour protéger votre compte, nous ne confirmons pas si une adresse e-mail est enregistrée sur la plateforme.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Vous vous souvenez de votre mot de passe ?{' '}
          <Link to="/connexion" className="font-bold text-[#540916] hover:underline">
            Se connecter
          </Link>
        </p>
      </div>

      <footer className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center sm:px-8">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Saint Louis de Gonzague Mahasoabe
        </p>
      </footer>
    </div>
  </main>;
}