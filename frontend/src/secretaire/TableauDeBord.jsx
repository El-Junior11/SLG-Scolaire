import { Link } from "react-router-dom";
import {
  Users, School, Wallet, CreditCard, BookOpen, Award,
  FileText, AlertCircle, UserCog, ArrowUpRight, GraduationCap
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";
import { lireModule } from "../services/stockageDemonstration";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";

const cycles = ["Primaire", "Collège", "Lycée"];
const couleurs = { Primaire: "#172B50", Collège: "#D9799A", Lycée: "#26865B" };
const carte = "rounded-xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";

export default function TableauDeBord({ espace = "secretaire" }) {
  const { utilisateur } = utiliserAuthentification();
  const role = espace;
  const administration = role === "admin";

  const eleves = lireModule("eleves");
  const classes = lireModule("classes");
  const paiements = lireModule("paiements");
  const notes = lireModule("notes");

  const inscrits = role === "titulaire"
    ? eleves.filter(e => e.classe === utilisateur?.classe)
    : eleves;

  const parClasse = classes.map(c => ({
    name: c.nom,
    total: eleves.filter(e => e.classe === c.nom).length
  }));

  const parCycle = cycles.map(n => ({
    name: n,
    value: classes.filter(c => c.cycle === n)
      .reduce((a, c) => a + eleves.filter(e => e.classe === c.nom).length, 0)
  })).filter(x => x.value);

  const recettes = paiements.reduce((a, p) => a + Number(p.montant || 0), 0);

  const cartes = (administration || role === "secretaire") ? [
    ["Élèves", eleves.length, Users, "#172B50"],
    ["Classes", classes.length, School, "#540916"],
    ["Inscriptions", lireModule("inscriptions").length, FileText, "#26865B"],
    ["Utilisateurs", lireModule("utilisateurs").length, UserCog, "#D9799A"]
  ] : role === "econome" ? [
    ["Recettes", recettes.toLocaleString("fr-FR") + " Ar", Wallet, "#26865B"],
    ["Paiements", paiements.length, CreditCard, "#540916"],
    ["Impayés", lireModule("impayes").length, AlertCircle, "#D9799A"],
    ["Élèves", eleves.length, Users, "#172B50"]
  ] : [
    ["Élèves de ma classe", inscrits.length, Users, "#172B50"],
    ["Évaluations", lireModule("evaluations").length, BookOpen, "#540916"],
    ["Notes saisies", notes.filter(n =>
      inscrits.some(e => `${e.nom} ${e.prenom}` === n.eleve)
    ).length, FileText, "#26865B"],
    ["Bulletins", lireModule("bulletins").length, Award, "#D9799A"]
  ];

  const liens = administration ? [
    ["eleves", "Élèves"],
    ["classes", "Classes"],
    ["demandes", "Demandes d’accès"],
    ["/econome/tableau-de-bord", "Économat"],
    ["/titulaire/tableau-de-bord", "Espace pédagogique"]
  ] : role === "secretaire" ? [
    ["eleves", "Élèves"],
    ["classes", "Classes"],
    ["annees-scolaires", "Années scolaires"],
    ["utilisateurs", "Utilisateurs"]
  ] : role === "econome" ? [
    ["paiements", "Paiements"],
    ["eleves", "Élèves"],
    ["impayes", "Impayés"],
    ["recus", "Reçus"]
  ] : [
    ["notes", "Notes"],
    ["moyennes", "Moyennes"],
    ["classements", "Classements"],
    ["bulletins", "Bulletins"]
  ];

  return <div className="min-w-0 space-y-5 font-['Manrope']">

    {/* EN-TÊTE SIMPLE */}
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className={`text-xl font-extrabold tracking-tight sm:text-2xl ${texte}`}>
          Vue d'ensemble
        </h1>
        <p className={`mt-1 text-xs ${secondaire}`}>
          Statistiques et indicateurs de votre espace.
        </p>
      </div>
    </header>

    {/* CARTES STATISTIQUES */}
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Indicateurs statistiques">
      {cartes.map(([titre, valeur, Icone, couleur]) => (
        <div key={titre} className={`${carte} group p-4 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5`}>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${couleur}18`, color: couleur }}>
              <Icone size={19} strokeWidth={1.9} />
            </div>
            <ArrowUpRight size={15} className={secondaire} />
          </div>

          <p className={`text-[11px] font-semibold ${secondaire}`}>{titre}</p>
          <h2 className={`mt-1 break-words text-xl font-extrabold sm:text-2xl ${texte}`}>
            {valeur}
          </h2>
          <div className="mt-4 h-[3px] w-10 rounded-full" style={{ backgroundColor: couleur }} />
        </div>
      ))}
    </section>

    {/* GRAPHIQUES */}
    <div className="grid gap-4 lg:grid-cols-2">

      {/* ÉLÈVES PAR CLASSE */}
      <section className={`${carte} min-w-0 p-4 sm:p-5`}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className={`text-sm font-extrabold ${texte}`}>Élèves par classe</h2>
            <p className={`mt-1 text-[11px] ${secondaire}`}>Effectif des élèves par classe.</p>
          </div>
          <div className="rounded-xl bg-[#540916]/10 p-2.5 text-[#540916] dark:bg-[#29446D] dark:text-[#C4D7FF]">
            <School size={18} />
          </div>
        </div>

        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={parClasse} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#DCE2E9" strokeOpacity={0.6} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8792A2" }}
                axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8792A2" }}
                axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
              <Bar dataKey="total" name="Élèves" fill="#540916"
                radius={[5, 5, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* RÉPARTITION PAR CYCLE */}
      <section className={`${carte} min-w-0 p-4 sm:p-5`}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className={`text-sm font-extrabold ${texte}`}>Répartition par cycle</h2>
            <p className={`mt-1 text-[11px] ${secondaire}`}>
              Distribution des élèves par cycle scolaire.
            </p>
          </div>
          <div className="rounded-xl bg-[#540916]/10 p-2.5 text-[#540916] dark:bg-[#29446D] dark:text-[#C4D7FF]">
            <GraduationCap size={18} />
          </div>
        </div>

        <div className="h-[240px]">
          {parCycle.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={parCycle} dataKey="value" nameKey="name"
                  innerRadius={60} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                  {parCycle.map(x => <Cell key={x.name} fill={couleurs[x.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className={`flex h-full items-center justify-center text-xs ${secondaire}`}>
              Aucune donnée de cycle disponible.
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-4 border-t border-[#EAE3E5] pt-4 dark:border-[#263852]">
          {parCycle.map(x => (
            <span key={x.name} className={`flex items-center gap-2 text-[11px] ${secondaire}`}>
              <span className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: couleurs[x.name] }} />
              {x.name} : <strong className={texte}>{x.value}</strong>
            </span>
          ))}
        </div>
      </section>
    </div>

    {/* ACCÈS RAPIDE */}
    <section className={`${carte} p-4 sm:p-5`}>
      <h2 className={`text-sm font-extrabold ${texte}`}>Accès rapide</h2>
      <p className={`mb-4 mt-1 text-[11px] ${secondaire}`}>
        Accédez aux principales fonctionnalités.
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {liens.map(([url, nom]) => (
          <Link key={url} to={url.startsWith("/") ? url : `/${role}/${url}`}
            className="group flex min-h-[46px] items-center justify-between gap-2 rounded-xl border border-[#EAE3E5] bg-[#FCFAFB] px-4 py-3 text-[11px] font-bold text-[#540916] transition-all hover:border-[#540916] hover:bg-[#540916] hover:text-white dark:border-[#30415C] dark:bg-[#1B2E4A] dark:text-[#D6E4FF] dark:hover:bg-[#29446D]">
            {nom}
            <ArrowUpRight size={15}
              className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        ))}
      </div>
    </section>
  </div>;
}