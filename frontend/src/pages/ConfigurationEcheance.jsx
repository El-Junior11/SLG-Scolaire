import { useEffect, useState } from 'react';
import { CalendarClock, CalendarDays, CheckCircle2, Info, Pencil, Save, X } from 'lucide-react';
import { messageErreur, requetePrivee } from '../services/authentification';

export default function ConfigurationEcheance() {
  const [jour, definirJour] = useState(null);
  const [nouveauJour, definirNouveauJour] = useState('');
  const [modalOuvert, definirModalOuvert] = useState(false);
  const [enCours, definirEnCours] = useState(false);
  const [chargement, definirChargement] = useState(true);
  const [erreur, definirErreur] = useState('');
  const [message, definirMessage] = useState('');

  useEffect(() => {
    const controleur = new AbortController();
    requetePrivee('/admin/echeance-ecolage', { signal: controleur.signal })
      .then(({ jour }) => {
        if (!controleur.signal.aborted) definirJour(jour);
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
      if (event.key === 'Escape' && !enCours) definirModalOuvert(false);
    }
    document.addEventListener('keydown', clavier);
    return () => {
      document.body.style.overflow = ancien;
      document.removeEventListener('keydown', clavier);
    };
  }, [modalOuvert, enCours]);

  function ouvrirModal() {
    definirNouveauJour(String(jour));
    definirErreur('');
    definirMessage('');
    definirModalOuvert(true);
  }

  async function enregistrer(event) {
    event.preventDefault();
    const valeur = Number(nouveauJour);
    if (!Number.isInteger(valeur) || valeur < 1 || valeur > 31) {
      definirErreur('Veuillez choisir un jour compris entre 1 et 31.');
      return;
    }

    definirEnCours(true);
    definirErreur('');
    definirMessage('');
    try {
      const resultat = await requetePrivee('/admin/echeance-ecolage', {
        method: 'PUT', data: { jour: valeur }
      });
      definirJour(resultat.jour);
      definirModalOuvert(false);
      definirMessage('Échéance mensuelle enregistrée avec succès.');
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
            <CalendarClock size={24} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Échéance mensuelle de l'écolage</h2>
            <p className="mt-1 text-sm text-slate-500">Définissez la date limite de paiement de chaque mois.</p>
          </div>
        </div>
        <button type="button" onClick={ouvrirModal} disabled={chargement || jour === null}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#540916] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#700F20] disabled:cursor-not-allowed disabled:opacity-50">
          <Pencil size={16} /> Modifier l'échéance
        </button>
      </div>

      <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
        {chargement ? <p className="text-sm text-slate-500">Chargement de l'échéance...</p>
          : jour === null ? <p className="text-sm text-slate-500">Échéance indisponible.</p>
          : <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#540916]/15 bg-[#540916]/5">
              <span className="text-3xl font-extrabold text-[#540916]">{jour}</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Échéance actuelle</p>
              <p className="mt-1 text-lg font-bold text-slate-900">Le {jour} de chaque mois</p>
              <p className="mt-1 text-xs text-slate-500">Date limite mensuelle de paiement de l'écolage.</p>
            </div>
          </div>}
      </div>

      <div className="flex items-start gap-3 border-t border-blue-100 bg-blue-50/60 px-5 py-4 sm:px-6">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-sm leading-6 text-blue-800">
          Si le jour choisi dépasse le nombre de jours du mois, l'échéance est automatiquement fixée au dernier jour du mois.
        </p>
      </div>
    </div>

    {message && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
      <CheckCircle2 size={18} />{message}
    </div>}
    {erreur && !modalOuvert && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erreur}</p>}

    {modalOuvert && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[3px]"
      onMouseDown={event => { if (event.target === event.currentTarget && !enCours) definirModalOuvert(false); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-echeance"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-[#540916]/10 px-3 py-1.5 text-xs font-bold text-[#540916]">
              <CalendarDays size={14} /> CONFIGURATION
            </div>
            <h3 id="titre-modal-echeance" className="text-xl font-extrabold text-slate-900">Modifier l'échéance</h3>
            <p className="mt-1 text-sm text-slate-500">Choisissez le jour limite de paiement mensuel.</p>
          </div>
          <button type="button" onClick={() => definirModalOuvert(false)} disabled={enCours} aria-label="Fermer"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </header>

        <form onSubmit={enregistrer} className="space-y-5 p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Jour du mois <span className="text-red-500">*</span></span>
            <input type="number" min="1" max="31" step="1" required autoFocus
              value={nouveauJour} disabled={enCours}
              onChange={event => definirNouveauJour(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10"
              placeholder="Ex. : 10" />
            <p className="mt-2 text-xs text-slate-500">Valeur autorisée : entre 1 et 31.</p>
          </label>

          {erreur && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}

          <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
            <Info size={16} className="shrink-0" />
            <span>Exemple : si vous choisissez le 31, l'échéance sera le 28 ou 29 février selon l'année.</span>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={() => definirModalOuvert(false)} disabled={enCours}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={enCours}
              className="inline-flex items-center gap-2 rounded-xl bg-[#540916] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#700F20] disabled:opacity-50">
              <Save size={16} />{enCours ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>}
  </section>;
}