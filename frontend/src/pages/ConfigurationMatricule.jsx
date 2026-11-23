import { useEffect, useState } from 'react';
import { CheckCircle2, Hash, Info, Pencil, Save, X } from 'lucide-react';
import { messageErreur, requetePrivee } from '../services/authentification';

function apercuMatricule(format) {
  if (!format) return '—';
  const chiffres = Math.min(10, Math.max(1, Number(format.chiffres) || 1));
  return `${format.prefixe ?? ''}${String(1).padStart(chiffres, '0')}${format.suffixe ?? ''}`;
}

export default function ConfigurationMatricule() {
  const [format, definirFormat] = useState(null);
  const [formulaire, definirFormulaire] = useState(null);
  const [modalOuvert, definirModalOuvert] = useState(false);
  const [enCours, definirEnCours] = useState(false);
  const [chargement, definirChargement] = useState(true);
  const [erreur, definirErreur] = useState('');
  const [message, definirMessage] = useState('');

  useEffect(() => {
    const controleur = new AbortController();
    requetePrivee('/admin/matricules', { signal: controleur.signal })
      .then(valeur => {
        if (!controleur.signal.aborted) definirFormat(valeur);
      })
      .catch(cause => {
        if (!controleur.signal.aborted) definirErreur(messageErreur(cause));
      })
      .finally(() => {
        if (!controleur.signal.aborted) definirChargement(false);
      });
    return () => controleur.abort();
  }, []);

  useEffect(() => {
    if (!modalOuvert) return;
    const ancien = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function clavier(event) {
      if (event.key === 'Escape' && !enCours) fermerModal();
    }
    document.addEventListener('keydown', clavier);
    return () => {
      document.body.style.overflow = ancien;
      document.removeEventListener('keydown', clavier);
    };
  }, [modalOuvert, enCours]);

  function ouvrirModal() {
    if (!format) return;
    definirFormulaire({ ...format });
    definirErreur('');
    definirMessage('');
    definirModalOuvert(true);
  }

  function fermerModal() {
    if (enCours) return;
    definirModalOuvert(false);
    definirFormulaire(null);
  }

  function modifier(cle, valeur) {
    definirFormulaire(actuel => ({ ...actuel, [cle]: valeur }));
    definirErreur('');
  }

  async function enregistrer(event) {
    event.preventDefault();
    if (!formulaire) return;

    const chiffres = Number(formulaire.chiffres);
    if (!Number.isInteger(chiffres) || chiffres < 1 || chiffres > 10) {
      definirErreur('Le nombre de chiffres doit être compris entre 1 et 10.');
      return;
    }

    definirEnCours(true);
    definirErreur('');
    definirMessage('');

    try {
      const resultat = await requetePrivee('/admin/matricules', {
        method: 'PUT',
        data: { ...formulaire, chiffres }
      });
      definirFormat(resultat);
      definirModalOuvert(false);
      definirFormulaire(null);
      definirMessage('Format du matricule enregistré avec succès.');
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  return <section className="space-y-4">
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
            <Hash size={24} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Format du matricule</h2>
            <p className="mt-1 text-sm text-slate-500">
              Personnalisez le format des numéros d'identification des élèves.
            </p>
          </div>
        </div>

        <button type="button" onClick={ouvrirModal} disabled={chargement || !format}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#540916] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#700F20] disabled:cursor-not-allowed disabled:opacity-50">
          <Pencil size={16} /> Modifier le format
        </button>
      </div>

      <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
        {chargement ? <p role="status" className="text-sm text-slate-500">Chargement du format...</p>
          : !format ? <p className="text-sm text-slate-500">Format indisponible.</p>
          : <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Préfixe</p>
              <p className="mt-2 break-all text-lg font-extrabold text-slate-900">{format.prefixe || 'Aucun'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre de chiffres</p>
              <p className="mt-2 text-lg font-extrabold text-slate-900">{format.chiffres}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suffixe</p>
              <p className="mt-2 break-all text-lg font-extrabold text-slate-900">{format.suffixe || 'Aucun'}</p>
            </div>
          </div>}

        {format && <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#540916]/10 bg-[#540916]/5 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#540916]">Aperçu du matricule</p>
            <p className="mt-1 text-xs text-slate-500">Exemple de format avec le numéro 1</p>
          </div>
          <span className="max-w-full break-all rounded-lg bg-white px-4 py-2 font-mono text-lg font-extrabold tracking-wider text-[#540916] shadow-sm">
            {apercuMatricule(format)}
          </span>
        </div>}
      </div>

      <div className="flex items-start gap-3 border-t border-blue-100 bg-blue-50/60 px-5 py-4 sm:px-6">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-sm leading-6 text-blue-800">
          Le numéro de matricule augmente à chaque première inscription, tous niveaux confondus.
          La modification du format ne réinitialise pas la numérotation.
        </p>
      </div>
    </div>

    {message && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
      <CheckCircle2 size={18} />{message}
    </div>}

    {erreur && !modalOuvert && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erreur}</p>}

    {modalOuvert && formulaire && <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[3px]"
      onMouseDown={event => { if (event.target === event.currentTarget) fermerModal(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-matricule"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-[#540916]/10 px-3 py-1.5 text-xs font-bold text-[#540916]">
              <Hash size={14} /> CONFIGURATION
            </div>
            <h3 id="titre-modal-matricule" className="text-xl font-extrabold text-slate-900">
              Modifier le format du matricule
            </h3>
            <p className="mt-1 text-sm text-slate-500">Définissez la structure des matricules scolaires.</p>
          </div>
          <button type="button" onClick={fermerModal} disabled={enCours} aria-label="Fermer"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={enregistrer} className="min-h-0 space-y-5 overflow-y-auto p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Préfixe facultatif</span>
            <input type="text" maxLength={20} pattern="[A-Za-z0-9_-]*"
              value={formulaire.prefixe ?? ''} disabled={enCours}
              onChange={event => modifier('prefixe', event.target.value)}
              placeholder="Ex. : SLG-"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10" />
            <p className="mt-1.5 text-xs text-slate-500">Lettres, chiffres, tirets et underscores uniquement.</p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Nombre minimal de chiffres <span className="text-red-500">*</span></span>
            <input type="number" min="1" max="10" step="1" required
              value={formulaire.chiffres} disabled={enCours}
              onChange={event => modifier('chiffres', event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10" />
            <p className="mt-1.5 text-xs text-slate-500">Entre 1 et 10 chiffres.</p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Suffixe facultatif</span>
            <input type="text" maxLength={20} pattern="[A-Za-z0-9_-]*"
              value={formulaire.suffixe ?? ''} disabled={enCours}
              onChange={event => modifier('suffixe', event.target.value)}
              placeholder="Ex. : -SLG"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10" />
          </label>

          <div className="rounded-xl border border-[#540916]/15 bg-[#540916]/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#540916]">Aperçu en temps réel</p>
            <p className="mt-2 break-all font-mono text-xl font-extrabold tracking-wider text-[#540916]">
              {apercuMatricule(formulaire)}
            </p>
          </div>

          {erreur && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={fermerModal} disabled={enCours}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={enCours}
              className="inline-flex items-center gap-2 rounded-xl bg-[#540916] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#700F20] disabled:opacity-50">
              <Save size={16} />{enCours ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>}
  </section>;
}