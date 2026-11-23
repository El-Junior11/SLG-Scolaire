import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import EntetePage from '../components/EntetePage';
import { utiliserAuthentification } from '../contextes/ContexteAuthentification';
import { ROLES } from '../donnees/configuration';
import { BadgeCheck, CheckCircle2, Info, Pencil, Save, ShieldCheck, UserRound, X } from 'lucide-react';

export default function Profil() {
  const { utilisateur } = utiliserAuthentification();
  const [nom, definirNom] = useState(utilisateur?.nom || '');
  const [modalOuvert, definirModalOuvert] = useState(false);

  useEffect(() => {
    definirNom(utilisateur?.nom || '');
  }, [utilisateur?.nom]);

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

  function ouvrirModal() {
    definirNom(utilisateur?.nom || '');
    definirModalOuvert(true);
  }

  function fermerModal() {
    definirNom(utilisateur?.nom || '');
    definirModalOuvert(false);
  }

  async function enregistrer(event) {
    event.preventDefault();
    if (!nom.trim()) return;

    await Swal.fire({
      title: 'Mode démonstration',
      text: "Les modifications ne sont pas transmises au backend. Votre profil reste inchangé.",
      icon: 'info',
      confirmButtonText: 'Compris',
      confirmButtonColor: '#540916'
    });
  }

  const nomActuel = utilisateur?.nom || 'Utilisateur';
  const role = ROLES[utilisateur?.role] || utilisateur?.role || 'Non défini';
  const initiales = nomActuel.trim().split(/\s+/).slice(0, 2).map(mot => mot[0]?.toUpperCase()).join('');

  return <div className="space-y-5">
    <EntetePage titre="Mon profil" description="Consultez les informations personnelles de votre compte." />

    <div className="grid gap-5 lg:grid-cols-[1.5fr_0.85fr]">
      {/* CARTE PRINCIPALE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-28 bg-gradient-to-r from-[#540916] via-[#74172A] to-[#A44960] sm:h-32">
          <div className="absolute -right-8 -top-14 h-44 w-44 rounded-full border-[25px] border-white/10" />
          <div className="absolute bottom-3 right-5 text-xs font-bold uppercase tracking-widest text-white/60">
            SLG-Scolaire
          </div>
        </div>

        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-[#F8EEF0] text-2xl font-extrabold text-[#540916] shadow-sm">
              {initiales || <UserRound size={32} />}
            </div>
            <button type="button" onClick={ouvrirModal}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#540916] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#74172A] sm:self-auto">
              <Pencil size={16} /> Modifier le profil
            </button>
          </div>

          <div className="mt-4">
            <h2 className="break-words text-xl font-extrabold text-slate-900 sm:text-2xl">{nomActuel}</h2>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#540916]/10 px-3 py-1.5 text-xs font-bold text-[#540916]">
              <BadgeCheck size={15} /> {role}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="mb-4 text-sm font-extrabold text-slate-900">Informations du compte</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-500">
                  <UserRound size={16} />
                  <span className="text-xs font-semibold">Nom affiché</span>
                </div>
                <p className="break-words text-sm font-bold text-slate-900">{nomActuel}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-500">
                  <ShieldCheck size={16} />
                  <span className="text-xs font-semibold">Rôle attribué</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{role}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INFORMATIONS */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Autorisations du compte</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Votre rôle détermine les fonctionnalités et les espaces auxquels vous pouvez accéder sur la plateforme.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} />
            Rôle : {role}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
          <p className="text-xs leading-6 text-blue-800">
            La modification des informations personnelles est actuellement en mode démonstration. Les changements ne sont pas enregistrés dans la base de données.
          </p>
        </div>
      </aside>
    </div>

    {/* MODAL */}
    {modalOuvert && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[3px]"
      onMouseDown={event => { if (event.target === event.currentTarget) fermerModal(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-profil"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#540916]">Mon compte</p>
            <h2 id="titre-modal-profil" className="text-xl font-extrabold text-slate-900">Modifier le profil</h2>
            <p className="mt-1 text-sm text-slate-500">Modifiez vos informations personnelles.</p>
          </div>
          <button type="button" onClick={fermerModal} aria-label="Fermer"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={enregistrer} className="space-y-5 p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Nom affiché <span className="text-red-500">*</span>
            </span>
            <input type="text" required maxLength={120} autoFocus
              value={nom} onChange={event => definirNom(event.target.value)}
              placeholder="Votre nom complet"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Rôle attribué</span>
            <input type="text" value={role} readOnly
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500" />
            <p className="mt-2 text-xs text-slate-500">Le rôle est défini par l'administration.</p>
          </label>

          <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <Info size={17} className="mt-0.5 shrink-0 text-blue-600" />
            <p className="text-xs leading-5 text-blue-800">
              Mode démonstration : aucune modification ne sera enregistrée.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={fermerModal}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#540916] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#74172A]">
              <Save size={16} /> Simuler la mise à jour
            </button>
          </div>
        </form>
      </div>
    </div>}
  </div>;
}