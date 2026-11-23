import { Link } from "react-router-dom";
import {
  Users, BookOpen, ClipboardList, FileText, GraduationCap,
  TrendingUp, ArrowUpRight, School, Award, BarChart3,
  UserRound, CalendarDays
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";
import { lireModule } from "../services/stockageDemonstration";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";

const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const couleurPrincipale = "#540916";

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

export default function TableauDeBord() {
  const { utilisateur } = utiliserAuthentification();
  const classe = utilisateur?.classe;
  const nomTitulaire = [utilisateur?.prenom, utilisateur?.nom].filter(Boolean).join(" ") || "Titulaire";

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
    { name: "Filles", value: filles, color: "#D9799A" },
    { name: "Garçons", value: garcons, color: "#172B50" }
  ].filter(x => x.value > 0);

  const moyenneGenerale = moyennes.length
    ? moyennes.reduce((s, m) => s + Number(m.moyenne || 0), 0) / moyennes.length
    : null;

  const reussite = moyennes.length
    ? (moyennes.filter(m => Number(m.moyenne) >= 10).length / moyennes.length) * 100
    : null;

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
    { titre: "Élèves de ma classe", valeur: eleves.length, icone: Users, couleur: "#172B50" },
    { titre: "Matières", valeur: matieres.length, icone: BookOpen, couleur: "#540916" },
    { titre: "Évaluations", valeur: evaluations.length, icone: ClipboardList, couleur: "#26865B" },
    { titre: "Notes saisies", valeur: notes.length, icone: FileText, couleur: "#D9799A" }
  ];

  const derniersResultats = [...moyennes]
    .sort((a, b) => Number(b.moyenne || 0) - Number(a.moyenne || 0))
    .slice(0, 5);

  return (
    <div className="space-y-5 font-['Manrope']">
      {/* EN-TÊTE */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#540916] to-[#35050E] p-5 text-white sm:p-7 dark:from-[#142B4D] dark:to-[#091629]">
        <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full border-[30px] border-white/5" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold">
            <GraduationCap size={14} /> ESPACE TITULAIRE
          </span>
          <h1 className="mt-4 text-[24px] font-extrabold tracking-tight sm:text-[30px]">
            Bienvenue, {nomTitulaire}
          </h1>
          <p className="mt-2 text-[12px] text-white/80">
            Suivez les résultats et les activités pédagogiques de votre classe.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/15 pt-4">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-[11px] font-bold">
              <School size={15} /> Classe : {classe || "Non attribuée"}
            </span>
            <span className="inline-flex items-center gap-2 text-[11px] text-white/80">
              <Users size={15} /> {eleves.length} élèves
            </span>
          </div>
        </div>
      </section>

      {/* STATISTIQUES */}
      <div>
        <h2 className={`text-[17px] font-extrabold ${texte}`}>Vue d'ensemble</h2>
        <p className={`mt-1 text-[11px] ${secondaire}`}>Indicateurs de votre classe.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statistiques.map(({ titre, valeur, icone: Icone, couleur }) => (
          <div key={titre} className={`${carte} p-4 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${couleur}18`, color: couleur }}>
                <Icone size={19} />
              </div>
              <ArrowUpRight size={15} className={secondaire} />
            </div>
            <p className={`text-[11px] font-semibold ${secondaire}`}>{titre}</p>
            <h3 className={`mt-1 text-[24px] font-extrabold ${texte}`}>{valeur}</h3>
            <div className="mt-4 h-[3px] w-10 rounded-full" style={{ backgroundColor: couleur }} />
          </div>
        ))}
      </div>

      {/* INDICATEURS PÉDAGOGIQUES */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Moyenne générale", moyenneGenerale === null ? "—" : `${moyenneGenerale.toFixed(2)}/20`, TrendingUp],
          ["Taux de réussite", reussite === null ? "—" : `${reussite.toFixed(1)} %`, Award],
          ["Filles", filles, UserRound],
          ["Garçons", garcons, Users]
        ].map(([titre, valeur, Icone]) => (
          <div key={titre} className={`${carte} flex items-center gap-3 p-4`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#540916]/10 text-[#540916] dark:bg-[#29446D] dark:text-[#C4D7FF]">
              <Icone size={19} />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold ${secondaire}`}>{titre}</p>
              <h3 className={`mt-1 break-words text-[17px] font-extrabold ${texte}`}>{valeur}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* GRAPHIQUES */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${carte} min-w-0 p-4 sm:p-5`}>
          <h2 className={`text-[14px] font-extrabold ${texte}`}>Évolution des moyennes</h2>
          <p className={`mb-5 mt-1 text-[11px] ${secondaire}`}>Moyenne de la classe par trimestre.</p>
          <div className="h-[250px]">
            {parTrimestre.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={parTrimestre} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#DCE2E9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8792A2" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 10, fill: "#8792A2" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                  <Bar dataKey="moyenne" name="Moyenne /20" fill={couleurPrincipale} radius={[5, 5, 0, 0]} maxBarSize={55} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={`flex h-full items-center justify-center text-[12px] ${secondaire}`}>
                Aucune moyenne disponible.
              </div>
            )}
          </div>
        </section>

        <section className={`${carte} min-w-0 p-4 sm:p-5`}>
          <h2 className={`text-[14px] font-extrabold ${texte}`}>Répartition des élèves</h2>
          <p className={`mt-1 text-[11px] ${secondaire}`}>Effectif filles et garçons.</p>
          <div className="h-[235px]">
            {repartitionSexe.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={repartitionSexe} dataKey="value" nameKey="name" innerRadius={60} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                    {repartitionSexe.map(x => <Cell key={x.name} fill={x.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={`flex h-full items-center justify-center text-[12px] ${secondaire}`}>
                Aucun élève disponible.
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-5 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
            {repartitionSexe.map(x => (
              <span key={x.name} className={`flex items-center gap-2 text-[11px] ${secondaire}`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: x.color }} />
                {x.name} : <strong className={texte}>{x.value}</strong>
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* RÉSULTATS ET ÉVALUATIONS */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${carte} p-4 sm:p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-[14px] font-extrabold ${texte}`}>Résultats des élèves</h2>
            <Link to="/titulaire/moyennes" className="text-[11px] font-bold text-[#540916] dark:text-[#C4D7FF]">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {derniersResultats.length ? derniersResultats.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#EAE3E5] p-3 dark:border-[#30415C]">
                <div className="min-w-0">
                  <p className={`truncate text-[11px] font-bold ${texte}`}>{m.eleve}</p>
                  <p className={`mt-1 text-[10px] ${secondaire}`}>{m.trimestre}</p>
                </div>
                <span className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-extrabold ${
                  Number(m.moyenne) >= 10
                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                }`}>
                  {Number(m.moyenne).toFixed(2)}/20
                </span>
              </div>
            )) : (
              <p className={`py-8 text-center text-[12px] ${secondaire}`}>Aucun résultat disponible.</p>
            )}
          </div>
        </section>

        <section className={`${carte} p-4 sm:p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-[14px] font-extrabold ${texte}`}>Évaluations</h2>
            <Link to="/titulaire/evaluations" className="text-[11px] font-bold text-[#540916] dark:text-[#C4D7FF]">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {evaluations.length ? [...evaluations].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 5).map(e => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#EAE3E5] p-3 dark:border-[#30415C]">
                <div className="min-w-0">
                  <p className={`truncate text-[11px] font-bold ${texte}`}>{e.titre}</p>
                  <p className={`mt-1 text-[10px] ${secondaire}`}>{e.matiere}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 text-[10px] ${secondaire}`}>
                  <CalendarDays size={13} /> {e.date || "—"}
                </span>
              </div>
            )) : (
              <p className={`py-8 text-center text-[12px] ${secondaire}`}>Aucune évaluation disponible.</p>
            )}
          </div>
        </section>
      </div>

      {/* ACCÈS RAPIDE */}
      <section className={`${carte} p-4 sm:p-5`}>
        <h2 className={`text-[14px] font-extrabold ${texte}`}>Accès rapide</h2>
        <p className={`mb-4 mt-1 text-[11px] ${secondaire}`}>Gestion pédagogique de votre classe.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {raccourcis.map(([url, nom, Icone]) => (
            <Link key={url} to={`/titulaire/${url}`}
              className="group flex min-h-[78px] flex-col justify-between rounded-xl border border-[#EAE3E5] bg-[#FCFAFB] p-3 transition-all hover:border-[#540916] hover:bg-[#540916] hover:text-white dark:border-[#30415C] dark:bg-[#1B2E4A] dark:text-white dark:hover:bg-[#29446D]">
              <div className="flex items-center justify-between">
                <Icone size={18} className="text-[#540916] group-hover:text-white dark:text-[#C4D7FF]" />
                <ArrowUpRight size={14} className="opacity-50" />
              </div>
              <span className="mt-3 text-[11px] font-bold">{nom}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}