import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ArrowLeft, ArrowRight, GraduationCap, Mail, MessageSquare, Send, ShieldCheck, X } from 'lucide-react';
import { ETABLISSEMENT } from '../donnees/configuration';

const initial = { nom: '', email: '', sujet: '', message: '' };

export default function Contact() {
  const [modalOuvert, definirModalOuvert] = useState(false);
  const [formulaire, definirFormulaire] = useState(initial);

  useEffect(() => {
    if (!modalOuvert) return;
    const ancien = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function clavier(event) {
      if (event.key === 'Escape') definirModalOuvert(false);
    }
    document.addEventListener('keydown', clavier);
    return () => {
      document.body.style.overflow = ancien;
      document.removeEventListener('keydown', clavier);
    };
  }, [modalOuvert]);

  function modifier(champ, valeur) {
    definirFormulaire(actuel => ({ ...actuel, [champ]: valeur }));
  }

  async function soumettre(event) {
    event.preventDefault();
    await Swal.fire({
      title: 'Mode démonstration',
      text: "Le formulaire a été validé, mais votre message n'a pas été envoyé. Le service d'envoi n'est pas encore configuré.",
      icon: 'info',
      confirmButtonText: 'Compris',
      confirmButtonColor: '#540916',
      customClass: { popup: 'rounded-2xl' }
    });
  }

  return <main className="min-h-screen bg-[#F8F6F7] text-slate-800">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#540916] text-white">
            <GraduationCap size={23} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[#540916] sm:text-base">Saint Louis de Gonzague</p>
            <p className="text-xs font-medium text-slate-500">Mahasoabe</p>
          </div>
        </Link>
        <Link to="/" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#540916] hover:text-[#540916]">
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Retour à l'accueil</span>
          <span className="sm:hidden">Retour</span>
        </Link>
      </div>
    </header>

    <section className="bg-[#540916] px-5 py-12 text-white sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
          <MessageSquare size={14} /> Contact
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Nous contacter</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
          Retrouvez l'espace de contact de {ETABLISSEMENT}.
        </p>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
            <Mail size={24} />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#540916]">Formulaire de contact</p>
          <h2 className="text-2xl font-extrabold text-slate-900">Vous souhaitez nous écrire ?</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
            Vous pouvez préparer votre demande à l'aide du formulaire de contact.
            Cette fonctionnalité est actuellement en mode démonstration : aucun message ne sera transmis à l'établissement.
          </p>
          <button type="button" onClick={() => definirModalOuvert(true)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#540916] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#700F20]">
            <MessageSquare size={18} /> Écrire un message <ArrowRight size={16} />
          </button>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
            <ShieldCheck size={24} />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#540916]">Informations</p>
          <h2 className="text-xl font-extrabold text-slate-900">Contact de l'établissement</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Les coordonnées officielles de l'établissement pourront être affichées ici après leur validation par l'administration.
          </p>
          <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-semibold leading-6 text-amber-800">
              Les informations de contact et le service d'envoi de messages ne sont pas encore configurés sur cette page.
            </p>
          </div>
        </aside>
      </div>
    </section>

    <footer className="border-t border-slate-200 bg-white px-5 py-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} {ETABLISSEMENT}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#540916] hover:underline">
          <ArrowLeft size={14} /> Retour à l'accueil
        </Link>
      </div>
    </footer>

    {modalOuvert && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-[3px] sm:p-5"
      onMouseDown={event => { if (event.target === event.currentTarget) definirModalOuvert(false); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-contact"
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#540916]">Contact</p>
            <h2 id="titre-modal-contact" className="text-xl font-extrabold text-slate-900">Écrire un message</h2>
            <p className="mt-1 text-sm text-slate-500">Complétez les informations ci-dessous.</p>
          </div>
          <button type="button" onClick={() => definirModalOuvert(false)} aria-label="Fermer"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={soumettre} className="min-h-0 space-y-4 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Nom complet <span className="text-red-500">*</span></span>
              <input type="text" required maxLength={120} autoComplete="name"
                value={formulaire.nom} onChange={event => modifier('nom', event.target.value)}
                placeholder="Votre nom complet"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Adresse e-mail <span className="text-red-500">*</span></span>
              <input type="email" required maxLength={254} autoComplete="email"
                value={formulaire.email} onChange={event => modifier('email', event.target.value)}
                placeholder="exemple@email.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10" />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Sujet <span className="text-red-500">*</span></span>
            <input type="text" required maxLength={160}
              value={formulaire.sujet} onChange={event => modifier('sujet', event.target.value)}
              placeholder="Objet de votre message"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Message <span className="text-red-500">*</span></span>
            <textarea required rows={5} maxLength={3000}
              value={formulaire.message} onChange={event => modifier('message', event.target.value)}
              placeholder="Rédigez votre message..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10" />
          </label>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
            Mode démonstration : ce formulaire permet uniquement de préparer un message. Aucun e-mail ne sera envoyé.
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => definirModalOuvert(false)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#540916] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#700F20]">
              <Send size={17} /> Prévisualiser l'envoi
            </button>
          </div>
        </form>
      </div>
    </div>}
  </main>;
}