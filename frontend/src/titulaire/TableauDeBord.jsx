import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, BookOpen, ClipboardList, FileText, GraduationCap,
  TrendingUp, ArrowUpRight, School, Award, BarChart3,
  UserRound, CalendarDays, ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";
import { lireModule } from "../services/stockageDemonstration";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";

const palettes = {
  clair: {
    principale: "#540916", primaire: "#172B50", college: "#D9799A",
    lycee: "#26865B", grille: "#E2E8F0", axe: "#64748B",
    tooltip: "#FFFFFF", bordure: "#E2E8F0", texte: "#172B50", curseur: "#F1F5F9"
  },
  sombre: {
    principale: "#93C5FD", primaire: "#60A5FA", college: "#A78BFA",
    lycee: "#34D399", grille: "#30415C", axe: "#A8B7CF",
    tooltip: "#1B2E4A", bordure: "#405574", texte: "#F1F5F9", curseur: "#263852"
  }
};

const carte = "rounded-xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const accent = "text-[#540916] dark:text-[#93C5FD]";
const policeTitre = { fontFamily: "'Playfair Display', Georgia, serif" };

const raccourcis = [
  ["ma-classe", "Ma classe", School],
  ["matieres", "Matières", BookOpen],
  ["evaluations", "Évaluations", ClipboardList],
  ["notes", "Notes", FileText],
  ["moyennes", "Moyennes", TrendingUp],
  ["classements", "Classements", Award],
  ["bulletins", "Bulletins", GraduationCap],
  ["rapports-pedagogiques", "Rapports pédagogiques", BarChart3]
];

function utiliserModeSombre() {
  const [sombre, definirSombre] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const actualiser = () => definirSombre(document.documentElement.classList.contains("dark"));
    const observateur = new MutationObserver(actualiser);
    observateur.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    actualiser();
    return () => observateur.disconnect();
  }, []);

  return sombre;
}

function CarteStatistique({ titre, valeur, Icone, couleur }) {
  return (
    <div className={`${carte} group min-w-0 p-4 transition-shadow hover:shadow-md sm:p-5`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${couleur}18`, color: couleur }}>
          <Icone size={20} strokeWidth={1.8} />
        </div>
        <ArrowUpRight size={16} className="text-slate-300 dark:text-slate-500" />
      </div>
      <p className={`text-sm font-medium ${secondaire}`}>{titre}</p>
      <h3 className={`mt-1 break-words text-xl font-bold tracking-tight sm:text-2xl ${texte}`}>
        {valeur}
      </h3>
      <div className="mt-4 h-[3px] w-10 rounded-full" style={{ backgroundColor: couleur }} />
    </div>
  );
}

function CarteIndicateur({ titre, valeur, Icone }) {
  return (
    <div className={`${carte} flex min-w-0 items-center gap-3 p-4`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#540916]/10 text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]">
        <Icone size={19} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-medium ${secondaire}`}>{titre}</p>
        <h3 className={`mt-1 break-words text-lg font-bold ${texte}`}>{valeur}</h3>
      </div>
    </div>
  );
}

function EnteteSection({ titre, description, lien }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className={`text-base font-bold ${texte}`}>{titre}</h2>
        {description && <p className={`mt-1 text-xs ${secondaire}`}>{description}</p>}
      </div>
      {lien && (
        <Link to={lien} className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold hover:underline ${accent}`}>
          Voir tout <ChevronRight size={15} />
        </Link>
      )}
    </div>
  );
}

export default function TableauDeBord() {
  const { utilisateur } = utiliserAuthentification();
  const sombre = utiliserModeSombre();
  const couleurs = sombre ? palettes.sombre : palettes.clair;
  const classe = utilisateur?.classe;

  const eleves = lireModule("eleves").filter(e => e.classe === classe);
  const matieres = lireModule("matieres").filter(m => m.classe === classe);
  const evaluations = lireModule("evaluations").filter(e => e.classe === classe);
  const moyennes = lireModule("moyennes").filter(m => m.classe === classe);
  const bulletins = lireModule("bulletins").filter(b => b.classe === classe);

  const nomsEleves = new Set(eleves.map(e => `${e.nom} ${e.prenom}`));
  const notes = lireModule("notes").filter(n => nomsEleves.has(n.eleve));
  const filles = eleves.filter(e => e.sexe === "Féminin").length;
  const garcons = eleves.filter(e => e.sexe === "Masculin").length;

  const repartitionSexe = [
    { name: "Filles", value: filles, color: couleurs.college },
    { name: "Garçons", value: garcons, color: couleurs.primaire }
  ].filter(x => x.value > 0);

  const moyenneGenerale = moyennes.length
    ? moyennes.reduce((s, m) => s + Number(m.moyenne || 0), 0) / moyennes.length : null;

  const reussite = moyennes.length
    ? moyennes.filter(m => Number(m.moyenne) >= 10).length / moyennes.length * 100 : null;

  const parTrimestre = ["Trimestre 1", "Trimestre 2", "Trimestre 3"].map(nom => {
    const lignes = moyennes.filter(m => m.trimestre === nom);
    return {
      name: nom.replace("Trimestre ", "T"),
      moyenne: lignes.length
        ? Number((lignes.reduce((s, m) => s + Number(m.moyenne || 0), 0) / lignes.length).toFixed(2))
        : null
    };
  }).filter(x => x.moyenne !== null);

  const statistiques = [
    { titre: "Élèves de ma classe", valeur: eleves.length, icone: Users, couleur: couleurs.primaire },
    { titre: "Matières", valeur: matieres.length, icone: BookOpen, couleur: couleurs.principale },
    { titre: "Évaluations", valeur: evaluations.length, icone: ClipboardList, couleur: couleurs.lycee },
    { titre: "Notes saisies", valeur: notes.length, icone: FileText, couleur: couleurs.college }
  ];

  const indicateurs = [
    ["Moyenne générale", moyenneGenerale === null ? "—" : `${moyenneGenerale.toFixed(2)}/20`, TrendingUp],
    ["Taux de réussite", reussite === null ? "—" : `${reussite.toFixed(1)} %`, Award],
    ["Filles", filles, UserRound],
    ["Garçons", garcons, Users]
  ];

  const derniersResultats = [...moyennes]
    .sort((a, b) => Number(b.moyenne || 0) - Number(a.moyenne || 0)).slice(0, 5);

  const dernieresEvaluations = [...evaluations]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 5);

  const styleTooltip = {
    backgroundColor: couleurs.tooltip,
    border: `1px solid ${couleurs.bordure}`,
    borderRadius: 8, fontSize: 12,
    fontFamily: "inherit", color: couleurs.texte,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  };

  const styleAxe = { fontSize: 11, fill: couleurs.axe, fontFamily: "inherit" };

  return (
    <div className="min-w-0 space-y-5">

      {/* En-tête */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${texte}`} style={policeTitre}>
            Tableau de bord
          </h1>
          <p className={`mt-1 text-sm ${secondaire}`}>
            Statistiques et suivi pédagogique de votre classe.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg border border-[#EAE3E5] bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-[#263852] dark:bg-[#14243D] dark:text-slate-200">
          <School size={17} className={accent} />
          <span>Classe : {classe || "Non attribuée"}</span>
        </div>
      </header>

      {/* Statistiques principales */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Statistiques de la classe">
        {statistiques.map(stat => (
          <CarteStatistique key={stat.titre} titre={stat.titre} valeur={stat.valeur}
            Icone={stat.icone} couleur={stat.couleur} />
        ))}
      </section>

      {/* Indicateurs pédagogiques */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Indicateurs pédagogiques">
        {indicateurs.map(([titre, valeur, Icone]) => (
          <CarteIndicateur key={titre} titre={titre} valeur={valeur} Icone={Icone} />
        ))}
      </section>

      {/* Graphiques */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${carte} min-w-0 p-4 sm:p-5`}>
          <EnteteSection titre="Évolution des moyennes"
            description="Moyenne générale de la classe par trimestre." />

          <div className="h-[250px]">
            {parTrimestre.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={parTrimestre} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 4" vertical={false} stroke={couleurs.grille} />
                  <XAxis dataKey="name" tick={styleAxe} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 20]} tick={styleAxe} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={styleTooltip}
                    labelStyle={{ color: couleurs.texte }}
                    itemStyle={{ color: couleurs.texte }}
                    cursor={{ fill: couleurs.curseur }} />
                  <Bar dataKey="moyenne" name="Moyenne /20" fill={couleurs.principale}
                    radius={[5, 5, 0, 0]} maxBarSize={55} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={`flex h-full items-center justify-center text-sm ${secondaire}`}>
                Aucune moyenne disponible.
              </div>
            )}
          </div>
        </section>

        <section className={`${carte} min-w-0 p-4 sm:p-5`}>
          <EnteteSection titre="Répartition des élèves"
            description="Effectif des filles et des garçons." />

          <div className="h-[235px]">
            {repartitionSexe.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={repartitionSexe} dataKey="value" nameKey="name"
                    innerRadius={60} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                    {repartitionSexe.map(x => <Cell key={x.name} fill={x.color} />)}
                  </Pie>
                  <Tooltip contentStyle={styleTooltip}
                    labelStyle={{ color: couleurs.texte }}
                    itemStyle={{ color: couleurs.texte }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={`flex h-full items-center justify-center text-sm ${secondaire}`}>
                Aucun élève disponible.
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-5 border-t border-slate-100 pt-4 dark:border-[#263852]">
            {repartitionSexe.map(x => (
              <span key={x.name} className={`flex items-center gap-2 text-xs ${secondaire}`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: x.color }} />
                {x.name} : <strong className={texte}>{x.value}</strong>
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Résultats et évaluations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${carte} min-w-0 p-4 sm:p-5`}>
          <EnteteSection titre="Résultats des élèves" lien="/titulaire/moyennes" />

          <div className="space-y-2">
            {derniersResultats.length ? derniersResultats.map(m => {
              const reussi = Number(m.moyenne) >= 10;
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-3 dark:border-[#30415C] dark:bg-[#1B2E4A]">
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${texte}`}>{m.eleve}</p>
                    <p className={`mt-1 text-xs ${secondaire}`}>{m.trimestre}</p>
                  </div>
                  <span className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
                    reussi
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-red-50 text-red-700 dark:bg-slate-700 dark:text-slate-200"
                  }`}>
                    {Number(m.moyenne).toFixed(2)}/20
                  </span>
                </div>
              );
            }) : (
              <div className={`py-10 text-center text-sm ${secondaire}`}>
                Aucun résultat disponible.
              </div>
            )}
          </div>
        </section>

        <section className={`${carte} min-w-0 p-4 sm:p-5`}>
          <EnteteSection titre="Évaluations récentes" lien="/titulaire/evaluations" />

          <div className="space-y-2">
            {dernieresEvaluations.length ? dernieresEvaluations.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-3 dark:border-[#30415C] dark:bg-[#1B2E4A]">
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${texte}`}>{e.titre}</p>
                  <p className={`mt-1 text-xs ${secondaire}`}>{e.matiere}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 text-xs ${secondaire}`}>
                  <CalendarDays size={14} /> {e.date || "—"}
                </span>
              </div>
            )) : (
              <div className={`py-10 text-center text-sm ${secondaire}`}>
                Aucune évaluation disponible.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Accès rapide */}
      <section className={`${carte} p-4 sm:p-5`}>
        <EnteteSection titre="Accès rapide"
          description="Accédez directement aux fonctionnalités pédagogiques." />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {raccourcis.map(([url, nom, Icone]) => (
            <Link key={url} to={`/titulaire/${url}`}
              className="group flex min-h-[75px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-[#540916]/40 hover:bg-[#540916]/5 dark:border-[#30415C] dark:bg-[#1B2E4A] dark:hover:border-[#60A5FA] dark:hover:bg-[#29446D]">
              <div className="flex items-center justify-between">
                <Icone size={19} className={accent} />
                <ArrowUpRight size={15}
                  className="text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <span className={`mt-3 text-sm font-semibold ${texte}`}>{nom}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}