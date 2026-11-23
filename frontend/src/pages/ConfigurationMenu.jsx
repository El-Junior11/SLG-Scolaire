import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Info, LayoutPanelLeft, Pencil, Plus, Save, Settings2, Trash2, X } from 'lucide-react';
import { LIENS_SECTIONS_ADMIN, NAVIGATION, ROLES, SECTIONS_ADMIN_DEFAUT } from '../donnees/configuration';
import { messageErreur, requetePrivee } from '../services/authentification';

const espaces = ['econome', 'titulaire', 'secretaire'];
const couleur = '#540916';

function Modal({ titre, description, fermer, enfants, enCours }) {
  useEffect(() => {
    const ancien = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function clavier(e) { if (e.key === 'Escape' && !enCours) fermer(); }
    document.addEventListener('keydown', clavier);
    return () => {
      document.body.style.overflow = ancien;
      document.removeEventListener('keydown', clavier);
    };
  }, [fermer, enCours]);

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-[3px] sm:p-5"
    onMouseDown={e => { if (e.target === e.currentTarget && !enCours) fermer(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-menu"
      className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#540916]">Navigation</p>
          <h2 id="titre-modal-menu" className="text-xl font-extrabold text-slate-900">{titre}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <button type="button" onClick={fermer} disabled={enCours} aria-label="Fermer"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{enfants}</div>
    </div>
  </div>;
}

export default function ConfigurationMenu() {
  const [sections, definirSections] = useState(null);
  const [brouillon, definirBrouillon] = useState(null);
  const [modalOuvert, definirModalOuvert] = useState(false);
  const [sectionOuverte, definirSectionOuverte] = useState(null);
  const [enCours, definirEnCours] = useState(false);
  const [chargement, definirChargement] = useState(true);
  const [erreur, definirErreur] = useState('');
  const [message, definirMessage] = useState('');

  useEffect(() => {
    const controleur = new AbortController();
    requetePrivee('/admin/menu', { signal: controleur.signal })
      .then(({ sections }) => {
        if (!controleur.signal.aborted) definirSections(sections ?? SECTIONS_ADMIN_DEFAUT);
      })
      .catch(cause => {
        if (!controleur.signal.aborted) definirErreur(messageErreur(cause));
      })
      .finally(() => {
        if (!controleur.signal.aborted) definirChargement(false);
      });
    return () => controleur.abort();
  }, []);

  function ouvrirModal() {
    definirBrouillon(sections.map(s => ({ ...s, liens: [...s.liens] })));
    definirSectionOuverte(null);
    definirErreur('');
    definirMessage('');
    definirModalOuvert(true);
  }

  function fermerModal() {
    if (enCours) return;
    definirModalOuvert(false);
    definirBrouillon(null);
  }

  function modifier(id, modification) {
    definirBrouillon(liste => liste.map(section =>
      section.id === id ? { ...section, ...modification } : section
    ));
  }

  function ajouterSection() {
    const id = crypto.randomUUID();
    definirBrouillon(liste => [...liste, { id, titre: '', liens: [] }]);
    definirSectionOuverte(id);
  }

  function retirerSection(id) {
    definirBrouillon(liste => liste.filter(section => section.id !== id));
    if (sectionOuverte === id) definirSectionOuverte(null);
  }

  function modifierLien(section, chemin, actif) {
    modifier(section.id, {
      liens: actif
        ? [...section.liens, chemin]
        : section.liens.filter(lien => lien !== chemin)
    });
  }

  async function enregistrer(evenement) {
    evenement.preventDefault();
    definirEnCours(true);
    definirErreur('');
    definirMessage('');

    try {
      const resultat = await requetePrivee('/admin/menu', {
        method: 'PUT',
        data: { sections: brouillon }
      });
      definirSections(resultat.sections);
      window.dispatchEvent(new CustomEvent('slg-menu-admin', { detail: resultat.sections }));
      definirModalOuvert(false);
      definirBrouillon(null);
      definirMessage('Configuration du menu enregistrée avec succès.');
    } catch (cause) {
      definirErreur(messageErreur(cause));
    } finally {
      definirEnCours(false);
    }
  }

  const nombreLiens = sections?.reduce((total, section) => total + section.liens.length, 0) ?? 0;

  return <section className="space-y-4">
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
            <LayoutPanelLeft size={24} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Sections du menu administrateur</h2>
            <p className="mt-1 text-sm text-slate-500">
              Organisez les sections et les liens complémentaires du menu.
            </p>
          </div>
        </div>
        <button type="button" onClick={ouvrirModal} disabled={chargement || !sections}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#540916] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#700F20] disabled:cursor-not-allowed disabled:opacity-50">
          <Pencil size={16} /> Configurer le menu
        </button>
      </div>

      <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
        {chargement ? <p role="status" className="text-sm text-slate-500">Chargement du menu...</p>
          : !sections ? <p className="text-sm text-slate-500">Configuration indisponible.</p>
          : <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sections configurées</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{sections.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Liens configurés</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{nombreLiens}</p>
            </div>
          </div>}

        {sections && sections.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(section => <div key={section.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-800">{section.titre || 'Sans titre'}</p>
            <p className="mt-1 text-xs text-slate-500">{section.liens.length} lien(s)</p>
          </div>)}
        </div>}
      </div>

      <div className="flex items-start gap-3 border-t border-blue-100 bg-blue-50/60 px-5 py-4 sm:px-6">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-sm leading-6 text-blue-800">
          Ces sections sont des raccourcis complémentaires du menu administrateur.
          Les menus principaux des espaces Secrétaire, Économe et Titulaire restent définis dans la configuration générale.
        </p>
      </div>
    </div>

    {message && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
      <Check size={18} />{message}
    </div>}

    {erreur && !modalOuvert && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erreur}</p>}

    {modalOuvert && brouillon && <Modal
      titre="Configurer les sections"
      description="Ajoutez, modifiez ou retirez les sections du menu administrateur."
      fermer={fermerModal} enCours={enCours}
      enfants={<form onSubmit={enregistrer} className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-600">{brouillon.length} section(s)</p>
          <button type="button" onClick={ajouterSection} disabled={enCours || brouillon.length >= 12}
            className="inline-flex items-center gap-2 rounded-xl border border-[#540916]/20 bg-[#540916]/5 px-3 py-2 text-xs font-bold text-[#540916] hover:bg-[#540916]/10 disabled:opacity-50">
            <Plus size={16} /> Ajouter une section
          </button>
        </div>

        {brouillon.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          Aucune section configurée. Cliquez sur « Ajouter une section ».
        </div>}

        {brouillon.map(section => <div key={section.id} className="overflow-hidden rounded-xl border border-slate-200">
          <button type="button" onClick={() => definirSectionOuverte(sectionOuverte === section.id ? null : section.id)}
            className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100">
            <div className="flex items-center gap-3">
              <Settings2 size={18} className="text-[#540916]" />
              <div>
                <p className="text-sm font-bold text-slate-800">{section.titre || 'Nouvelle section'}</p>
                <p className="text-xs text-slate-500">{section.liens.length} lien(s) sélectionné(s)</p>
              </div>
            </div>
            <ChevronDown size={18} className={`text-slate-400 transition ${sectionOuverte === section.id ? 'rotate-180' : ''}`} />
          </button>

          {sectionOuverte === section.id && <div className="space-y-5 border-t border-slate-200 p-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Titre de la section <span className="text-red-500">*</span></span>
              <input value={section.titre} required maxLength={60} disabled={enCours}
                onChange={e => modifier(section.id, { titre: e.target.value })}
                placeholder="Ex. : Gestion pédagogique"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#540916]" />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              {espaces.map(espace => <fieldset key={espace} className="rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-xs font-bold text-[#540916]">{ROLES[espace]}</legend>
                <div className="space-y-2">
                  {NAVIGATION[espace].map(([url, libelle]) => {
                    const chemin = `/${espace}/${url}`;
                    const info = LIENS_SECTIONS_ADMIN[chemin];
                    return <label key={chemin} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-xs text-slate-700 hover:bg-slate-50">
                      <input type="checkbox" checked={section.liens.includes(chemin)} disabled={enCours}
                        onChange={e => modifierLien(section, chemin, e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#540916]" />
                      <span>{info?.libelle || libelle}</span>
                    </label>;
                  })}
                </div>
              </fieldset>)}
            </div>

            <button type="button" onClick={() => retirerSection(section.id)} disabled={enCours}
              className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
              <Trash2 size={15} /> Retirer cette section
            </button>
          </div>}
        </div>)}

        {erreur && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{erreur}</p>}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={fermerModal} disabled={enCours}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Annuler
          </button>
          <button type="submit" disabled={enCours}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#540916] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#700F20] disabled:opacity-50">
            <Save size={16} />{enCours ? 'Enregistrement...' : 'Enregistrer le menu'}
          </button>
        </div>
      </form>} />}
  </section>;
}