import { useEffect, useState } from 'react';
import { Building2, Check, ChevronRight, CircleAlert, ClipboardList, Plus, Save, Settings2, ShieldCheck, Users, X } from 'lucide-react';
import ConfigurationMatricule from './ConfigurationMatricule';
import ConfigurationEcheance from './ConfigurationEcheance';
import TarifsScolaires from '../econome/TarifsScolaires';
import ConfigurationMenu from './ConfigurationMenu';
import { messageErreur, requetePrivee } from '../services/authentification';

const champs = [
  ['nom', 'Nom de l’établissement', 120],
  ['siege', 'Siège ou adresse', 240],
  ['logo', 'Adresse HTTPS du logo', 2048],
  ['contact', 'Coordonnées', 240]
];

const ROLES = {
  econome: 'Économat',
  titulaire: 'Titulaire de classe'
};

function Modal({ titre, description, fermer, enfants, enCours }) {
  useEffect(() => {
    function clavier(e) { if (e.key === 'Escape' && !enCours) fermer(); }
    const ancien = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', clavier);
    return () => {
      document.body.style.overflow = ancien;
      document.removeEventListener('keydown', clavier);
    };
  }, [fermer, enCours]);

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-[3px] sm:p-5"
    onMouseDown={e => { if (e.target === e.currentTarget && !enCours) fermer(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-configuration"
      className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#540916]">Configuration</p>
          <h2 id="titre-modal-configuration" className="text-xl font-extrabold text-slate-900">{titre}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <button type="button" onClick={fermer} disabled={enCours} aria-label="Fermer"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{enfants}</div>
    </div>
  </div>;
}

function ModalFonction({ fonction, enregistrer, fermer, enCours }) {
  const [formulaire, definirFormulaire] = useState({ ...fonction });
  function modifier(cle, valeur) { definirFormulaire(etat => ({ ...etat, [cle]: valeur })); }

  return <Modal titre={fonction.nom ? 'Modifier une fonction' : 'Nouvelle fonction'}
    description="Définissez le rôle et la disponibilité de cette fonction." fermer={fermer} enCours={enCours}
    enfants={<form className="space-y-5 p-5 sm:p-6" onSubmit={e => { e.preventDefault(); enregistrer(formulaire); }}>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Nom de la fonction <span className="text-red-500">*</span></span>
        <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#540916]"
          value={formulaire.nom} maxLength={80} required placeholder="Ex. : Responsable de l'économat"
          onChange={e => modifier('nom', e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Espace autorisé</span>
        <select value={formulaire.role} onChange={e => modifier('role', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#540916]">
          <option value="econome">Économat</option>
          <option value="titulaire">Titulaire de classe</option>
        </select>
      </label>
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Disponible à l'inscription</p>
          <p className="mt-1 text-xs text-slate-500">Autoriser le personnel à demander cette fonction.</p>
        </div>
        <input type="checkbox" checked={formulaire.active}
          onChange={e => modifier('active', e.target.checked)}
          className="h-5 w-5 accent-[#540916]" />
      </label>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button type="button" onClick={fermer} disabled={enCours}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Annuler
        </button>
        <button disabled={enCours} className="inline-flex items-center gap-2 rounded-xl bg-[#540916] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#700F20] disabled:opacity-50">
          <Save size={16} />{enCours ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>} />;
}

function ModalEtablissement({ etablissement, enregistrer, fermer, enCours }) {
  const [formulaire, definirFormulaire] = useState({ ...etablissement });
  function modifier(cle, valeur) { definirFormulaire(etat => ({ ...etat, [cle]: valeur })); }

  return <Modal titre="Informations de l'établissement"
    description="Mettez à jour les informations institutionnelles." fermer={fermer} enCours={enCours}
    enfants={<form className="space-y-4 p-5 sm:p-6" onSubmit={e => { e.preventDefault(); enregistrer(formulaire); }}>
      {champs.map(([cle, libelle, taille]) => <label key={cle} className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">
          {libelle}{cle === 'nom' && <span className="text-red-500"> *</span>}
        </span>
        <input value={formulaire[cle] ?? ''} maxLength={taille} required={cle === 'nom'}
          type={cle === 'logo' ? 'url' : 'text'}
          onChange={e => modifier(cle, e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#540916]" />
      </label>)}
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Historique</span>
        <textarea rows={5} maxLength={4000} value={formulaire.historique ?? ''}
          onChange={e => modifier('historique', e.target.value)}
          className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#540916]" />
      </label>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button type="button" onClick={fermer} disabled={enCours}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Annuler
        </button>
        <button disabled={enCours} className="inline-flex items-center gap-2 rounded-xl bg-[#540916] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#700F20] disabled:opacity-50">
          <Save size={16} />{enCours ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>} />;
}

export default function ConfigurationAdmin() {
  const [fonctions, definirFonctions] = useState([]);
  const [etablissement, definirEtablissement] = useState(null);
  const [enCours, definirEnCours] = useState(false);
  const [chargement, definirChargement] = useState(true);
  const [erreur, definirErreur] = useState('');
  const [message, definirMessage] = useState('');
  const [modal, definirModal] = useState(null);

  useEffect(() => {
    const controleur = new AbortController();
    requetePrivee('/admin/configuration', { signal: controleur.signal })
      .then(configuration => {
        if (controleur.signal.aborted) return;
        definirFonctions(configuration.fonctions ?? []);
        definirEtablissement(configuration.etablissement ?? null);
      })
      .catch(cause => { if (!controleur.signal.aborted) definirErreur(messageErreur(cause)); })
      .finally(() => { if (!controleur.signal.aborted) definirChargement(false); });
    return () => controleur.abort();
  }, []);

  async function enregistrer(rubrique, data) {
    definirEnCours(true);
    definirErreur('');
    definirMessage('');
    try {
      const resultat = await requetePrivee(`/admin/configuration/${rubrique}`, { method: 'PUT', data });
      if (resultat.fonctions) definirFonctions(resultat.fonctions);
      if (resultat.etablissement) definirEtablissement(resultat.etablissement);
      definirModal(null);
      definirMessage(rubrique === 'fonctions' ? 'Fonctions enregistrées avec succès.' : 'Informations enregistrées avec succès.');
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  function enregistrerFonction(fonction) {
    const nouvelles = fonctions.some(f => f.id === fonction.id)
      ? fonctions.map(f => f.id === fonction.id ? fonction : f)
      : [...fonctions, fonction];
    enregistrer('fonctions', { fonctions: nouvelles });
  }

  const actives = fonctions.filter(f => f.active).length;

  return <section className="mx-auto w-full max-w-7xl space-y-6 pb-8">
    <header>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#540916]">Administration générale</p>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Configuration</h1>
      <p className="mt-1 text-sm text-slate-500">Paramétrez les informations et le fonctionnement de l'établissement.</p>
    </header>

    {erreur && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <CircleAlert size={18} className="shrink-0" />{erreur}
    </div>}
    {message && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
      <Check size={18} />{message}
    </div>}

    {chargement ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Chargement de la configuration...</div>
      : <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
              <Building2 size={23} />
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Établissement</span>
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-900">{etablissement?.nom || 'Informations de l’établissement'}</h2>
          <p className="mt-2 text-sm text-slate-500">{etablissement?.siege || 'Adresse non renseignée'}</p>
          <p className="mt-1 text-sm text-slate-500">{etablissement?.contact || 'Coordonnées non renseignées'}</p>
          <button type="button" onClick={() => definirModal({ type: 'etablissement' })} disabled={!etablissement}
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#540916] hover:underline disabled:opacity-50">
            Modifier les informations <ChevronRight size={17} />
          </button>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
              <Users size={23} />
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{actives} active(s)</span>
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-900">Fonctions du personnel</h2>
          <p className="mt-2 text-sm text-slate-500">{fonctions.length} fonction(s) configurée(s) pour les demandes d'accès.</p>
          <button type="button" onClick={() => definirModal({ type: 'fonctions' })}
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#540916] hover:underline">
            Gérer les fonctions <ChevronRight size={17} />
          </button>
        </article>
      </div>}

    <div className="space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
          <Settings2 size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Paramètres scolaires</h2>
          <p className="text-xs text-slate-500">Tarifs, échéances, matricules et navigation.</p>
        </div>
      </div>
      <TarifsScolaires modifiable />
      <ConfigurationEcheance />
      <ConfigurationMatricule />
      <ConfigurationMenu />
    </div>

    {modal?.type === 'etablissement' && etablissement && <ModalEtablissement
      etablissement={etablissement} enCours={enCours}
      fermer={() => definirModal(null)}
      enregistrer={data => enregistrer('etablissement', data)} />}

    {modal?.type === 'fonctions' && <Modal titre="Fonctions du personnel"
      description="Consultez et modifiez les fonctions disponibles à l'inscription."
      fermer={() => definirModal(null)} enCours={enCours}
      enfants={<div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{fonctions.length} fonction(s)</p>
          <button type="button" disabled={fonctions.length >= 30}
            onClick={() => definirModal({ type: 'fonction', fonction: { id: crypto.randomUUID(), nom: '', role: 'econome', active: true } })}
            className="inline-flex items-center gap-2 rounded-xl bg-[#540916] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
            <Plus size={16} /> Ajouter
          </button>
        </div>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {fonctions.map(f => <div key={f.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-semibold text-slate-800">{f.nom || 'Sans nom'}</p>
              <p className="mt-1 text-xs text-slate-500">{ROLES[f.role] || f.role}</p>
              <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${f.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {f.active ? 'Disponible' : 'Désactivée'}
              </span>
            </div>
            <button type="button" onClick={() => definirModal({ type: 'fonction', fonction: f })}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#540916] hover:bg-slate-50">
              Modifier
            </button>
          </div>)}
        </div>
      </div>} />}

    {modal?.type === 'fonction' && <ModalFonction
      fonction={modal.fonction} enCours={enCours}
      fermer={() => definirModal({ type: 'fonctions' })}
      enregistrer={enregistrerFonction} />}
  </section>;
}