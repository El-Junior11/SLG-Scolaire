import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { MessageSquare, Send, X, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Icone from "../components/Icone";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";
import { api } from "../services/api";
import { destination } from "../services/authentification";
import { ETABLISSEMENT } from "../donnees/configuration";
const navigation = [
  ["Accueil", "#accueil"],
  ["À propos", "#presentation"],
  ["Cycles scolaires", "#cycles"],
  ["Fonctionnalités", "#fonctionnalites"],
  ["Contact", "#contact"]
];
const cycles = [
  {
    nom: "Primaire", niveau: "Enseignement primaire", couleur: "#172B50",
    fond: "#EAF0F8", icone: "BookOpen",
    description: "Un accompagnement attentif pour développer les connaissances fondamentales, la curiosité et le goût d'apprendre."
  },
  {
    nom: "Collège", niveau: "Enseignement secondaire", couleur: "#D9799A",
    fond: "#FCECF2", icone: "GraduationCap",
    description: "Une formation structurée pour consolider les acquis, développer l'autonomie et préparer la suite du parcours scolaire."
  },
  {
    nom: "Lycée", niveau: "Préparation à l'avenir", couleur: "#26865B",
    fond: "#E8F6EE", icone: "Award",
    description: "Un enseignement approfondi pour renforcer les compétences, préparer les examens et construire son avenir."
  }
];
const services = [
  ["Users", "Gestion des élèves", "Dossiers, inscriptions et suivi scolaire centralisés."],
  ["Wallet", "Gestion financière", "Frais, paiements, reçus et suivi des impayés."],
  ["BookOpen", "Suivi pédagogique", "Notes, moyennes, classements et bulletins scolaires."],
  ["ShieldCheck", "Espaces sécurisés", "Des interfaces adaptées à chaque responsabilité."],
  ["BarChart3", "Statistiques claires", "Tableaux de bord et rapports pour chaque service."],
  ["FileText", "Documents scolaires", "Génération et exportation de documents."]
];
const espaces = [
  { nom: "Secrétariat", icone: "ClipboardList", description: "Administration, inscriptions et gestion des élèves." },
  { nom: "Économat", icone: "Wallet", description: "Paiements, frais scolaires et suivi financier." },
  { nom: "Enseignants", icone: "BookOpen", description: "Évaluations, notes et bulletins scolaires." }
];
const initial = { nom: "", email: "", sujet: "", message: "" };
export default function Accueil() {
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


  const [menuOuvert, setMenuOuvert] = useState(false);
  const [cycleActif, setCycleActif] = useState(0);
  const fermerMenu = () => setMenuOuvert(false);
  const cycle = cycles[cycleActif];
  const [etablissement, definirEtablissement] = useState({ nom: ETABLISSEMENT });
  const { utilisateur } = utiliserAuthentification();
  const lienEspace = utilisateur ? destination(utilisateur) : "/connexion";
  const libelleEspace = utilisateur ? "Ouvrir le tableau de bord" : "Accéder à mon espace";
  const libelleConnexion = utilisateur ? "Tableau de bord" : "Se connecter";
  useEffect(() => {
    const controleur = new AbortController();
    api.get("/configuration", { signal: controleur.signal })
      .then(({ data }) => {
        if (!controleur.signal.aborted && data.etablissement?.nom) {
          definirEtablissement(data.etablissement);
        }
      })
      .catch(() => { /* L’accueil conserve le nom par défaut si l’API est indisponible. */ });
    return () => controleur.abort();
  }, []);
  return (
    <div className="min-h-screen overflow-x-clip bg-white font-sans text-[#302429]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-[#EEE5E5] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8">
          <Link to="/" onClick={fermerMenu} className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-marron text-white shadow-sm">
              {etablissement.logo
                ? <img src={etablissement.logo} alt="" referrerPolicy="no-referrer" className="h-6 w-6 object-contain" />
                : <Icone nom="GraduationCap" taille={25}/>}
            </div>
            <div className="min-w-0 leading-tight">
              <span className="block text-[12px] font-extrabold tracking-tight sm:text-[13px]">
                {etablissement.nom}
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {navigation.map(([titre, lien]) => (
              <a key={lien} href={lien}
                className="text-[12px] font-bold text-[#5C5053] transition hover:text-marron">
                {titre}
              </a>
            ))}


          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link to={lienEspace}
              className="hidden items-center gap-2 rounded-xl bg-marron px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-marron-hover sm:inline-flex">
              {libelleConnexion} <Icone nom="ArrowUpRight" taille={16}/>
            </Link>
            <button type="button" onClick={() => setMenuOuvert(!menuOuvert)}
              aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOuvert}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7EDEF] text-marron lg:hidden">
              <Icone nom={menuOuvert ? "X" : "Menu"} taille={22}/>
            </button>
          </div>
        </div>
        {menuOuvert && (
          <nav className="absolute left-0 right-0 top-full flex flex-col gap-1 border-b border-[#EEE5E5] bg-white px-5 py-4 shadow-xl lg:hidden">
            {navigation.map(([titre, lien]) => (
              <a key={lien} href={lien} onClick={fermerMenu}
                className="rounded-lg px-3 py-3 text-sm font-bold text-[#49373D] hover:bg-[#F9F2F3]">
                {titre}
              </a>
            ))}


            <Link to={lienEspace} onClick={fermerMenu}
              className="mt-2 rounded-xl bg-marron px-5 py-3 text-center text-sm font-bold text-white sm:hidden">
              {libelleConnexion}
            </Link>
          </nav>
        )}
      </header>
      {/* HERO */}
      <section id="accueil" className="scroll-mt-20 bg-[#FAF8F7]">
        <div className="mx-auto grid max-w-[1440px] lg:min-h-[490px] lg:grid-cols-[49%_51%]">
          <div className="relative min-h-[280px] overflow-hidden bg-[#E9DDDA] sm:min-h-[360px] lg:min-h-[490px]">
<img src={etablissement.photo || "/images/image.png"} alt={`Établissement ${etablissement.nom}`}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"/>
            <div className="absolute inset-0 bg-gradient-to-t from-[#27050D]/65 via-transparent to-transparent"/>
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3 sm:bottom-7 sm:left-8">
              <div className="text-white">
                <span className="text-[10px] font-bold uppercase tracking-[.2em] text-white/80">Notre établissement</span>
                <p className="mt-1 text-sm font-extrabold">{etablissement.nom}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur">
                <Icone nom="GraduationCap" taille={20}/>
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-col justify-center px-5 py-10 sm:px-10 lg:px-12 lg:py-12 xl:px-16">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-marron"/>
              <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-marron">
                Bienvenue à {etablissement.nom}
              </span>
            </div>
            <h1 className="max-w-[650px] font-editorial text-[35px] font-semibold leading-[1.12] tracking-[-.035em] text-marron sm:text-[45px] xl:text-[59px]">
              {etablissement.slogan || "Apprendre, grandir et construire son avenir."}
            </h1>
            <p className="mt-5 max-w-[560px] text-[13px] leading-7 text-[#766B6E] sm:text-[14px]">
              Bienvenue à {etablissement.nom}. Une plateforme de gestion scolaire
              moderne qui facilite l'administration, le suivi financier et
              l'accompagnement pédagogique au quotidien.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={lienEspace}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-marron px-5 py-3 text-xs font-extrabold text-white transition hover:bg-marron-hover">
                {libelleEspace} <Icone nom="ArrowUpRight" taille={17}/>
              </Link>
              <a href="#presentation"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E3CFD3] bg-white px-5 py-3 text-xs font-extrabold text-marron transition hover:bg-[#F7EDEF]">
                Découvrir notre école <Icone nom="ArrowRight" taille={16}/>
              </a>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[#E8DCDD] pt-5">
              {cycles.map((item, index) => (
                <button key={item.nom} type="button" onClick={() => {
                  setCycleActif(index);
                  document.getElementById("cycles")?.scrollIntoView({ behavior: "smooth" });
                }} className="flex min-w-0 items-center gap-2 text-left">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.couleur }}/>
                  <span className="truncate text-[11px] font-extrabold sm:text-xs">{item.nom}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* PRÉSENTATION */}
      <section id="presentation" className="scroll-mt-20 bg-white">
        <div className="mx-auto grid max-w-[1320px] items-center gap-6 px-5 py-12 md:grid-cols-2 md:gap-14 md:px-8 md:py-14">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-marron">Notre établissement</span>
            <h2 className="mt-3 max-w-[540px] font-editorial text-[29px] font-semibold leading-tight tracking-tight text-marron md:text-[39px]">
              {etablissement.nom}
            </h2>
          </div>
          <div>
            <p className="whitespace-pre-line break-words text-[13px] leading-8 text-[#746A6D] sm:text-sm">
              {etablissement.historique || `De l’enseignement primaire au lycée, ${etablissement.nom} accompagne les élèves tout au long de leur parcours scolaire.`}
            </p>
            <p className="mt-4 text-sm leading-7 text-[#746A6D]">La plateforme accompagne la gestion administrative, financière et pédagogique de l’établissement à travers des espaces adaptés aux responsabilités du personnel.</p>
          </div>
        </div>
      </section>
      {/* CYCLES SCOLAIRES */}
      <section id="cycles" className="scroll-mt-20 bg-[#F8F5F4]">
        <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-8 md:py-14">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-marron">Nos cycles scolaires</span>
              <h2 className="mt-3 font-editorial text-[30px] font-semibold tracking-tight text-marron md:text-[40px]">
                Un parcours éducatif complet.
              </h2>
              <p className="mt-3 text-[13px] text-[#786E70]">Trois niveaux d'enseignement, une même ambition éducative.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {cycles.map((item, index) => (
                <button key={item.nom} type="button" onClick={() => setCycleActif(index)}
                  aria-pressed={cycleActif === index}
                  className={`rounded-full border px-4 py-2 text-[11px] font-extrabold transition ${
                    cycleActif === index ? "border-marron bg-marron text-white" : "border-[#E6D9DB] bg-white text-[#63565A] hover:border-marron"
                  }`}>
                  {item.nom}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <div className="overflow-hidden rounded-2xl border border-[#EAE2E2] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors"
                  style={{ background: cycle.fond, color: cycle.couleur }}>
                  <Icone nom={cycle.icone} taille={28}/>
                </div>
                <span className="rounded-full px-3 py-1.5 text-[10px] font-extrabold"
                  style={{ background: cycle.fond, color: cycle.couleur }}>{cycle.nom}</span>
              </div>
              <div className="mt-8">
                <span className="text-[10px] font-extrabold uppercase tracking-[.2em]"
                  style={{ color: cycle.couleur }}>{cycle.niveau}</span>
                <h3 className="mt-3 font-editorial text-[32px] font-semibold text-[#302429] sm:text-[38px]">{cycle.nom}</h3>
                <p className="mt-3 max-w-xl text-[13px] leading-7 text-[#776D70]">{cycle.description}</p>
              </div>
              <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-[#F0E9EA]">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ background: cycle.couleur, width: `${((cycleActif + 1) / cycles.length) * 100}%` }}/>
              </div>
            </div>
            <div className="grid gap-3">
              {cycles.map((item, index) => (
                <button key={item.nom} type="button" onClick={() => setCycleActif(index)}
                  className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition-all ${
                    cycleActif === index ? "border-[#D9B8C0] bg-white shadow-sm" : "border-[#EAE2E2] bg-white/70 hover:bg-white"
                  }`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: item.fond, color: item.couleur }}>
                    <Icone nom={item.icone} taille={23}/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-extrabold">{item.nom}</h4>
                    <p className="mt-1 text-[11px] text-[#84797C]">{item.niveau}</p>
                  </div>
                  <span className="text-marron"><Icone nom="ArrowUpRight" taille={18}/></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* FONCTIONNALITÉS */}
      <section id="fonctionnalites" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-8 md:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-marron">Notre plateforme</span>
            <h2 className="mt-3 font-editorial text-[30px] font-semibold text-marron md:text-[40px]">
              Tous les outils, un seul espace.
            </h2>
            <p className="mt-3 text-[13px] leading-7 text-[#786E70]">
              Une solution numérique pensée pour simplifier le travail quotidien du personnel scolaire.
            </p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(([icone, titre, description], index) => (
              <article key={titre}
                className="group rounded-2xl border border-[#EEE5E5] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#D9B8C0] hover:shadow-[0_12px_30px_rgba(84,9,22,.07)]">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7EDEF] text-marron transition group-hover:bg-marron group-hover:text-white">
                    <Icone nom={icone} taille={23}/>
                  </div>
                  <span className="text-[11px] font-bold text-[#C9B7BB]">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-5 text-sm font-extrabold text-[#38272D]">{titre}</h3>
                <p className="mt-3 text-[12px] leading-6 text-[#817579]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      {/* ESPACES PROFESSIONNELS */}
      <section className="bg-[#FAF8F7]">
        <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-8">
          <div className="mb-7">
            <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-marron">Accès professionnels</span>
            <h2 className="mt-3 font-editorial text-[29px] font-semibold text-marron md:text-[38px]">
              Un espace adapté à chaque responsabilité.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {espaces.map((espace, index) => (
              <Link key={espace.nom} to={lienEspace}
                className="group flex items-start gap-4 rounded-2xl border border-[#EDE3E4] bg-white p-5 transition hover:border-[#D9B8C0] hover:shadow-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7EDEF] text-marron">
                  <Icone nom={espace.icone} taille={22}/>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-[#38272D]">{espace.nom}</h3>
                  <p className="mt-2 text-[12px] leading-6 text-[#817579]">{espace.description}</p>
                </div>
                <span className="text-marron transition group-hover:translate-x-1">
                  <Icone nom="ArrowUpRight" taille={17}/>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="bg-marron text-white">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center md:px-8 md:py-12">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-white/65">
              Espace de gestion scolaire
            </span>
            <h2 className="mt-3 font-editorial text-[28px] font-semibold leading-tight md:text-[38px]">
              Votre espace scolaire vous attend.
            </h2>
            <p className="mt-3 text-[13px] text-white/75">
              Connectez-vous pour accéder à vos outils de gestion.
            </p>
          </div>
          <Link to={lienEspace}
            className="inline-flex shrink-0 items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-xs font-extrabold text-marron transition hover:bg-[#F7EDEF]">
            {libelleEspace} <Icone nom="ArrowUpRight" taille={18}/>
          </Link>
        </div>
      </section>
      {/* CONTACT ET FOOTER */}
      <footer id="contact" className="scroll-mt-20 bg-marron-fonce text-white/75">
        <div className="mx-auto grid max-w-[1320px] gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-3 md:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                {etablissement.logo ? <img src={etablissement.logo} alt="" referrerPolicy="no-referrer" className="h-8 w-8 object-contain" /> : <Icone nom="GraduationCap" taille={24}/>}
              </div>
              <h2 className="break-words text-sm font-extrabold text-white">{etablissement.nom}</h2>
            </div>
            <p className="mt-4 text-sm leading-6">Plateforme de gestion administrative, financière et pédagogique.</p>
          </div>
          <div>
            <h2 className="mb-4 text-sm font-bold text-white">Navigation</h2>
            <nav className="grid gap-2 text-sm">{navigation.map(([titre, lien]) => <a key={lien} href={lien} className="hover:text-white">{titre}</a>)}<Link to={lienEspace} className="hover:text-white">{libelleConnexion}</Link></nav>
          </div>
          <div className="min-w-0">
            <h2 className="mb-4 text-sm font-bold text-white">Nous contacter</h2>
            <div className="space-y-3 text-sm">
              {etablissement.siege && <p className="flex items-start gap-2"><MapPin size={17} className="shrink-0"/><span className="whitespace-pre-line break-words min-w-0">{etablissement.siege}</span></p>}
              {etablissement.contact && <p className="flex items-start gap-2"><Phone size={17} className="shrink-0"/><span className="whitespace-pre-line break-words min-w-0">{etablissement.contact}</span></p>}
              {!etablissement.siege && !etablissement.contact && <p>Coordonnées non disponibles.</p>}
            </div>
            <button type="button" onClick={() => definirModalOuvert(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-marron"><MessageSquare size={17}/> Écrire un message</button>
            <p className="mt-2 text-xs text-white/70">Formulaire en mode démonstration.</p>
          </div>
        </div>
        <div className="border-t border-white/15 px-5 py-5 text-center text-xs">© {new Date().getFullYear()} {etablissement.nom} · Plateforme de gestion scolaire</div>
      </footer>
    {modalOuvert && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-[3px] sm:p-5"
      onMouseDown={event => { if (event.target === event.currentTarget) definirModalOuvert(false); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="titre-modal-contact"
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
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
    </div>
  );
}
