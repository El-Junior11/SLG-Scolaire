import { useState } from 'react';
import EntetePage from '../components/EntetePage';
import Icone from '../components/Icone';

const notificationsInitiales = [
  {
    id: 1,
    icone: 'Info',
    titre: 'Bienvenue sur SLG-Scolaire',
    description: 'Bienvenue sur la plateforme de démonstration.',
    type: 'information',
    date: 'Information générale',
    lu: false
  },
  {
    id: 2,
    icone: 'ShieldCheck',
    titre: 'Autorisations et accès',
    description: 'Vos autorisations dépendent de votre rôle.',
    type: 'securite',
    date: 'Sécurité',
    lu: false
  },
  {
    id: 3,
    icone: 'Bell',
    titre: 'Centre de notifications',
    description: 'Les notifications réelles seront connectées au backend.',
    type: 'information',
    date: 'Information générale',
    lu: false
  }
];

const stylesTypes = {
  information: {
    fond: 'bg-blue-50',
    texte: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700',
    libelle: 'Information'
  },
  securite: {
    fond: 'bg-emerald-50',
    texte: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700',
    libelle: 'Sécurité'
  }
};

export default function Notifications() {
  const [notifications, definirNotifications] = useState(notificationsInitiales);
  const [filtre, definirFiltre] = useState('toutes');
  const [recherche, definirRecherche] = useState('');

  const total = notifications.length;
  const nonLues = notifications.filter(n => !n.lu).length;
  const lues = total - nonLues;

  const liste = notifications.filter(notification => {
    const correspondFiltre = filtre === 'toutes' ||
      (filtre === 'non-lues' && !notification.lu) ||
      (filtre === 'lues' && notification.lu);

    const texte = `${notification.titre} ${notification.description}`.toLowerCase();
    return correspondFiltre && texte.includes(recherche.toLowerCase().trim());
  });

  function marquerCommeLue(id) {
    definirNotifications(liste => liste.map(n =>
      n.id === id ? { ...n, lu: true } : n
    ));
  }

  function marquerToutesCommeLues() {
    definirNotifications(liste => liste.map(n => ({ ...n, lu: true })));
  }

  return <div className="space-y-5">
    <EntetePage
      titre="Notifications"
      description="Consultez les informations et les alertes de votre espace scolaire."
    />

    {/* STATISTIQUES */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[
        { titre: 'Total notifications', valeur: total, icone: 'Bell', fond: 'bg-[#540916]/10', texte: 'text-[#540916]' },
        { titre: 'Non lues', valeur: nonLues, icone: 'Mail', fond: 'bg-amber-50', texte: 'text-amber-600' },
        { titre: 'Lues', valeur: lues, icone: 'CheckCircle2', fond: 'bg-emerald-50', texte: 'text-emerald-600' }
      ].map(stat => <div key={stat.titre} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">{stat.titre}</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{stat.valeur}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.fond} ${stat.texte}`}>
            <Icone nom={stat.icone} taille={23} />
          </div>
        </div>
      </div>)}
    </div>

    {/* LISTE */}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Centre de notifications</h2>
            <p className="mt-1 text-xs text-slate-500">
              Retrouvez les informations disponibles sur votre espace.
            </p>
          </div>
          <button type="button" onClick={marquerToutesCommeLues} disabled={nonLues === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#540916]/20 px-4 py-2.5 text-xs font-bold text-[#540916] transition hover:bg-[#540916]/5 disabled:cursor-not-allowed disabled:opacity-40">
            <Icone nom="CheckCheck" taille={17} />
            Tout marquer comme lu
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              ['toutes', 'Toutes', total],
              ['non-lues', 'Non lues', nonLues],
              ['lues', 'Lues', lues]
            ].map(([id, libelle, nombre]) => <button key={id} type="button"
              onClick={() => definirFiltre(id)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                filtre === id ? 'bg-[#540916] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {libelle} <span className="ml-1 opacity-70">{nombre}</span>
            </button>)}
          </div>

          <div className="relative w-full sm:max-w-[260px]">
            <Icone nom="Search" taille={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={recherche} onChange={e => definirRecherche(e.target.value)}
              placeholder="Rechercher une notification..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs outline-none transition focus:border-[#540916] focus:ring-2 focus:ring-[#540916]/10" />
          </div>
        </div>
      </div>

      {liste.length > 0 ? <div className="divide-y divide-slate-100">
        {liste.map(notification => {
          const style = stylesTypes[notification.type] || stylesTypes.information;

          return <article key={notification.id}
            className={`flex flex-col gap-4 p-5 transition sm:flex-row sm:items-start sm:p-6 ${
              notification.lu ? 'bg-white' : 'bg-[#540916]/[0.025]'
            }`}>
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.fond} ${style.texte}`}>
                <Icone nom={notification.icone} taille={21} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">{notification.titre}</h3>
                  {!notification.lu && <span className="h-2 w-2 rounded-full bg-[#540916]" />}
                </div>

                <p className="mt-1.5 text-sm leading-6 text-slate-600">{notification.description}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${style.badge}`}>
                    {style.libelle}
                  </span>
                  <span className="text-xs text-slate-400">{notification.date}</span>
                  <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                    notification.lu ? 'bg-slate-100 text-slate-500' : 'bg-[#540916]/10 text-[#540916]'
                  }`}>
                    {notification.lu ? 'Lue' : 'Non lue'}
                  </span>
                </div>
              </div>
            </div>

            {!notification.lu && <button type="button" onClick={() => marquerCommeLue(notification.id)}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#540916]/30 hover:text-[#540916] sm:self-center">
              <Icone nom="Check" taille={15} /> Marquer comme lue
            </button>}
          </article>;
        })}
      </div> : <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Icone nom="BellOff" taille={27} />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Aucune notification trouvée</h3>
        <p className="mt-2 text-xs text-slate-500">Aucune notification ne correspond aux critères sélectionnés.</p>
        <button type="button" onClick={() => { definirFiltre('toutes'); definirRecherche(''); }}
          className="mt-4 text-xs font-bold text-[#540916] hover:underline">
          Réinitialiser les filtres
        </button>
      </div>}
    </section>

    {/* INFORMATION */}
    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
      <Icone nom="Info" taille={18} className="mt-0.5 shrink-0 text-blue-600" />
      <p className="text-xs leading-6 text-blue-800">
        Ces notifications sont actuellement des exemples de démonstration. Les notifications réelles seront disponibles après leur intégration au backend. Le statut lu/non lu est temporaire et n'est pas enregistré.
      </p>
    </div>
  </div>;
}