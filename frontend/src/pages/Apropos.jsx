import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, School, ShieldCheck } from 'lucide-react';
import { ETABLISSEMENT } from '../donnees/configuration';

const niveaux = [
  { nom: 'Primaire', description: 'Enseignement primaire', couleur: '#172B50', icone: BookOpen },
  { nom: 'Collège', description: 'Enseignement secondaire — premier cycle', couleur: '#D9799A', icone: School },
  { nom: 'Lycée', description: 'Enseignement secondaire — second cycle', couleur: '#26865B', icone: GraduationCap }
];

export default function Apropos() {
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

    <section className="bg-[#540916] px-5 py-12 text-white sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white/90">
          <School size={14} /> Notre établissement
        </div>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          À propos de notre établissement
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
          Découvrez l'espace de présentation de {ETABLISSEMENT} et les différents niveaux d'enseignement de l'établissement.
        </p>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
            <School size={24} />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#540916]">Présentation</p>
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{ETABLISSEMENT}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Bienvenue sur la plateforme numérique de notre établissement. Cet espace est destiné à présenter les informations relatives à l'établissement et à faciliter l'accès aux différents services scolaires.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Les informations institutionnelles détaillées, notamment l'historique, la mission et les coordonnées officielles, seront publiées après validation par l'administration.
          </p>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916]">
            <ShieldCheck size={24} />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#540916]">Plateforme scolaire</p>
          <h2 className="text-xl font-extrabold text-slate-900">Un espace numérique organisé</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            La plateforme SLG-Scolaire accompagne la gestion administrative, financière et pédagogique de l'établissement à travers des espaces adaptés aux responsabilités du personnel.
          </p>
          <div className="mt-6 rounded-xl border border-[#540916]/10 bg-[#540916]/5 p-4">
            <p className="text-sm font-semibold text-[#540916]">Gestion scolaire • Administration • Pédagogie</p>
          </div>
        </aside>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#540916]">Parcours scolaire</p>
        <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Les niveaux d'enseignement</h2>
        <p className="mt-2 text-sm text-slate-500">Les trois cycles représentés dans la plateforme scolaire.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {niveaux.map(({ nom, description, couleur, icone: Icone }) => <article key={nom}
          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="h-1.5" style={{ backgroundColor: couleur }} />
          <div className="p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ backgroundColor: couleur }}>
              <Icone size={23} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">{nom}</h3>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold" style={{ color: couleur }}>
              Niveau scolaire <ArrowRight size={15} />
            </div>
          </div>
        </article>)}
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
  </main>;
}