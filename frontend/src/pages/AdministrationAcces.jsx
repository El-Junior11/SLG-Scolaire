import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Clock3, Search, ShieldCheck, UserCheck, UserRound, UserX, Users, X } from 'lucide-react';
import { utiliserAuthentification } from '../contextes/ContexteAuthentification';
import { messageErreur, requetePrivee } from '../services/authentification';

const STATUTS = {
  en_attente: { texte: 'En attente', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  approuve: { texte: 'Approuvée', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  refuse: { texte: 'Refusée', style: 'bg-red-50 text-red-700 border-red-200' }
};

function BadgeStatut({ statut }) {
  const info = STATUTS[statut] || STATUTS.en_attente;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${info.style}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />{info.texte}
  </span>;
}

function ModalDemande({ demande, fonctions, fermer, decider, enCours }) {
  const idInitial = demande.fonctionAttribuee?.id ?? demande.fonctionDemandee?.id;
  const [fonctionId, definirFonctionId] = useState(() => fonctions.find(f => f.id === idInitial)?.id ?? '');
  const [classe, definirClasse] = useState(demande.classe ?? '');
  const role = fonctions.find(f => f.id === fonctionId)?.role;

  useEffect(() => {
    function clavier(event) { if (event.key === 'Escape' && !enCours) fermer(); }
    document.addEventListener('keydown', clavier);
    const ancien = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', clavier); document.body.style.overflow = ancien; };
  }, [fermer, enCours]);

  function soumettre(event) {
    event.preventDefault();
    if (!fonctionId || (role === 'titulaire' && !classe.trim())) return;
    decider(demande.uid, { statut: 'approuve', fonctionId, classe: role === 'titulaire' ? classe.trim() : '' });
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[3px]"
    onMouseDown={event => { if (event.target === event.currentTarget && !enCours) fermer(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-demande"
      className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-[#540916]/10 px-3 py-1.5 text-xs font-bold text-[#540916]">
            <ShieldCheck size={14} /> GESTION DES ACCÈS
          </div>
          <h2 id="titre-modal-demande" className="text-xl font-bold text-slate-900">
            {demande.statut === 'approuve' ? 'Modifier les autorisations' : 'Traiter la demande'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Définissez les autorisations du membre du personnel.</p>
        </div>
        <button type="button" onClick={fermer} disabled={enCours} aria-label="Fermer"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"><X size={20} /></button>
      </div>

      <form onSubmit={soumettre} className="space-y-5 p-6">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
            <UserRound size={22} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{demande.nom || 'Utilisateur'}</p>
            <p className="break-all text-xs text-slate-500">{demande.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-500">Statut actuel</span>
          <BadgeStatut statut={demande.statut} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-slate-700">Fonction demandée</p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            {demande.fonctionDemandee?.nom ?? 'Non renseignée'}
          </p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Fonction attribuée <span className="text-red-500">*</span></span>
          <div className="relative">
            <select value={fonctionId} required onChange={event => definirFonctionId(event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10">
              <option value="" disabled>Choisir une fonction</option>
              {fonctions.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            <ChevronDown size={17} className="pointer-events-none absolute right-3 top-3.5 text-slate-400" />
          </div>
        </label>

        {role === 'titulaire' && <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Classe attribuée <span className="text-red-500">*</span></span>
          <input value={classe} onChange={event => definirClasse(event.target.value)} maxLength={80} required
            placeholder="Ex. : 6ème A" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10" />
        </label>}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={fermer} disabled={enCours}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            Annuler
          </button>
          <button type="submit" disabled={enCours || !fonctionId}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#540916] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#700F20] disabled:cursor-not-allowed disabled:opacity-50">
            <Check size={17} />{enCours ? 'Enregistrement...' : demande.statut === 'approuve' ? 'Enregistrer' : 'Approuver'}
          </button>
        </div>
      </form>
    </div>
  </div>;
}

export default function AdministrationAcces() {
  const { utilisateur } = utiliserAuthentification();
  const [fonctions, definirFonctions] = useState([]);
  const [demandes, definirDemandes] = useState([]);
  const [enCours, definirEnCours] = useState(true);
  const [erreur, definirErreur] = useState('');
  const [message, definirMessage] = useState('');
  const [recherche, definirRecherche] = useState('');
  const [filtre, definirFiltre] = useState('tous');
  const [selection, definirSelection] = useState(null);

  useEffect(() => {
    const controleur = new AbortController();
    Promise.all([
      requetePrivee('/admin/demandes', { signal: controleur.signal }),
      requetePrivee('/admin/configuration', { signal: controleur.signal })
    ]).then(([liste, configuration]) => {
      if (controleur.signal.aborted) return;
      definirFonctions((configuration.fonctions ?? []).filter(f => f.active));
      definirDemandes(liste);
    }).catch(cause => {
      if (!controleur.signal.aborted) definirErreur(messageErreur(cause));
    }).finally(() => {
      if (!controleur.signal.aborted) definirEnCours(false);
    });
    return () => controleur.abort();
  }, []);

  const statistiques = useMemo(() => ({
    total: demandes.length,
    attente: demandes.filter(d => d.statut === 'en_attente').length,
    approuve: demandes.filter(d => d.statut === 'approuve').length,
    refuse: demandes.filter(d => d.statut === 'refuse').length
  }), [demandes]);

  const demandesFiltrees = useMemo(() => demandes.filter(d => {
    const texte = `${d.nom ?? ''} ${d.email ?? ''} ${d.fonctionDemandee?.nom ?? ''}`.toLowerCase();
    return (filtre === 'tous' || d.statut === filtre) && texte.includes(recherche.toLowerCase().trim());
  }), [demandes, filtre, recherche]);

  async function decider(uid, decision) {
    definirEnCours(true);
    definirErreur('');
    definirMessage('');
    try {
      const resultat = await requetePrivee(`/admin/demandes/${encodeURIComponent(uid)}`, {
        method: 'PATCH', data: decision
      });
      definirDemandes(liste => liste.map(d => d.uid === uid ? { ...d, ...resultat } : d));
      definirSelection(null);
      definirMessage(decision.statut === 'refuse' ? 'Accès refusé ou retiré avec succès.' : 'Autorisations enregistrées avec succès.');
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  function refuser(demande) {
    const texte = demande.statut === 'approuve'
      ? `Retirer l'accès de ${demande.nom} ?`
      : `Refuser la demande de ${demande.nom} ?`;
    if (window.confirm(texte)) decider(demande.uid, { statut: 'refuse' });
  }

  const cartes = [
    { titre: 'Total des demandes', valeur: statistiques.total, icone: Users, fond: 'bg-slate-100', couleur: 'text-slate-700' },
    { titre: 'En attente', valeur: statistiques.attente, icone: Clock3, fond: 'bg-amber-50', couleur: 'text-amber-700' },
    { titre: 'Approuvées', valeur: statistiques.approuve, icone: UserCheck, fond: 'bg-emerald-50', couleur: 'text-emerald-700' },
    { titre: 'Refusées', valeur: statistiques.refuse, icone: UserX, fond: 'bg-red-50', couleur: 'text-red-700' }
  ];

  return <section className="mx-auto w-full max-w-7xl space-y-6 pb-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#540916]">Administration</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Demandes d'accès</h1>
        <p className="mt-1 text-sm text-slate-500">Gérez les demandes et les autorisations du personnel.</p>
      </div>
      <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 sm:flex">
        <ShieldCheck size={17} className="text-[#540916]" />
        <span className="max-w-48 truncate">{utilisateur?.email}</span>
      </div>
    </header>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cartes.map(({ titre, valeur, icone: Icone, fond, couleur }) => <div key={titre}
        className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${fond} ${couleur}`}><Icone size={20} /></div>
        <p className="text-2xl font-extrabold text-slate-900">{valeur}</p>
        <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{titre}</p>
      </div>)}
    </div>

    {erreur && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erreur}</div>}
    {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="font-bold text-slate-900">Liste des demandes</h2>
          <p className="text-xs text-slate-500">{demandesFiltrees.length} résultat(s)</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-3 text-slate-400" />
            <input value={recherche} onChange={event => definirRecherche(event.target.value)}
              placeholder="Rechercher..." aria-label="Rechercher une demande"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#540916] sm:w-56" />
          </div>
          <div className="relative">
            <select value={filtre} onChange={event => definirFiltre(event.target.value)}
              aria-label="Filtrer par statut"
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-[#540916] sm:w-40">
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="approuve">Approuvées</option>
              <option value="refuse">Refusées</option>
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-3 text-slate-400" />
          </div>
        </div>
      </div>

      {enCours && demandes.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">Chargement des demandes...</div>
        : demandesFiltrees.length === 0 ? <div className="flex flex-col items-center py-14 text-center">
          <div className="mb-3 rounded-2xl bg-slate-100 p-4 text-slate-400"><Users size={27} /></div>
          <p className="font-semibold text-slate-700">Aucune demande trouvée</p>
          <p className="mt-1 text-sm text-slate-500">Aucune demande ne correspond à vos critères.</p>
        </div> : <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Personnel</th>
                  <th className="px-5 py-4 font-semibold">Fonction demandée</th>
                  <th className="px-5 py-4 font-semibold">Statut</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {demandesFiltrees.map(d => <tr key={d.uid} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#540916]/10 font-bold text-[#540916]">
                        {(d.nom || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{d.nom || 'Utilisateur'}</p>
                        <p className="break-all text-xs text-slate-500">{d.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{d.fonctionDemandee?.nom || 'Non renseignée'}</td>
                  <td className="px-5 py-4"><BadgeStatut statut={d.statut} /></td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => definirSelection(d)} disabled={enCours}
                        className="rounded-lg bg-[#540916]/10 px-3 py-2 text-xs font-bold text-[#540916] transition hover:bg-[#540916]/20">
                        {d.statut === 'approuve' ? 'Modifier' : 'Examiner'}
                      </button>
                      {d.statut !== 'refuse' && <button type="button" onClick={() => refuser(d)} disabled={enCours}
                        className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                        {d.statut === 'approuve' ? 'Retirer' : 'Refuser'}
                      </button>}
                    </div>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {demandesFiltrees.map(d => <div key={d.uid} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{d.nom || 'Utilisateur'}</p>
                  <p className="break-all text-xs text-slate-500">{d.email}</p>
                </div>
                <BadgeStatut statut={d.statut} />
              </div>
              <p className="text-sm text-slate-600">Fonction : <span className="font-semibold">{d.fonctionDemandee?.nom || 'Non renseignée'}</span></p>
              <div className="flex gap-2">
                <button type="button" onClick={() => definirSelection(d)} disabled={enCours}
                  className="flex-1 rounded-lg bg-[#540916] px-3 py-2.5 text-xs font-bold text-white">
                  {d.statut === 'approuve' ? 'Modifier' : 'Examiner'}
                </button>
                {d.statut !== 'refuse' && <button type="button" onClick={() => refuser(d)} disabled={enCours}
                  className="rounded-lg border border-red-200 px-3 py-2.5 text-xs font-semibold text-red-600">
                  {d.statut === 'approuve' ? 'Retirer' : 'Refuser'}
                </button>}
              </div>
            </div>)}
          </div>
        </>}
    </div>

    {selection && <ModalDemande demande={selection} fonctions={fonctions}
      fermer={() => definirSelection(null)} decider={decider} enCours={enCours} />}
  </section>;
}