import { useEffect, useState } from "react";
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
const palettes = {
  clair: {
    principale: "#540916", Primaire: "#172B50", Collège: "#D9799A",
    Lycée: "#26865B", grille: "#DCE2E9", axe: "#64748B",
    tooltip: "#FFFFFF", bordure: "#E2E8F0", texte: "#172B50", curseur: "#F1F5F9"
  },
  sombre: {
    principale: "#93C5FD", Primaire: "#60A5FA", Collège: "#A78BFA",
    Lycée: "#34D399", grille: "#30415C", axe: "#A8B7CF",
    tooltip: "#1B2E4A", bordure: "#405574", texte: "#F1F5F9", curseur: "#263852"
  }
};

const carte = "rounded-xl border border-[#EAE3E5] bg-white shadow-sm dark:border-[#263852] dark:bg-[#14243D]";
const texte = "text-[#171717] dark:text-white";
const secondaire = "text-[#667085] dark:text-[#A8B7CF]";
const accent = "text-[#540916] dark:text-[#93C5FD]";
const policeTitre = { fontFamily: "'Playfair Display', Georgia, serif" };
const iconeSection = "rounded-lg bg-[#540916]/10 p-2.5 text-[#540916] dark:bg-[#29446D] dark:text-[#93C5FD]";

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
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${couleur}18`, color: couleur }}>
          <Icone size={20} strokeWidth={1.8} />
        </div>
        <ArrowUpRight size={16} className="text-slate-300 dark:text-slate-500" />
      </div>
      <p className={`text-sm font-medium ${secondaire}`}>{titre}</p>
      <h2 className={`mt-1 break-words text-xl font-bold tracking-tight sm:text-2xl ${texte}`}>
        {valeur}
      </h2>
      <div className="mt-4 h-[3px] w-10 rounded-full" style={{ backgroundColor: couleur }} />
    </div>
  );
}

function EnteteSection({ titre, description, Icone }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className={`text-base font-bold ${texte}`}>{titre}</h2>
        <p className={`mt-1 text-xs ${secondaire}`}>{description}</p>
      </div>
      {Icone && <div className={`${iconeSection} shrink-0`}>
        <Icone size={18} strokeWidth={1.8} />
      </div>}
    </div>
  );
}

export default function TableauDeBord({ espace = "secretaire" }) {
  const { utilisateur } = utiliserAuthentification();
  const sombre = utiliserModeSombre();
  const couleurs = sombre ? palettes.sombre : palettes.clair;
  const role = espace;
  const administration = role === "admin";

  const eleves = lireModule("eleves");
  const classes = lireModule("classes");
  const paiements = lireModule("paiements");
  const notes = lireModule("notes");

  const inscrits = role === "titulaire"
    ? eleves.filter(e => e.classe === utilisateur?.classe) : eleves;

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
    ["Élèves", eleves.length, Users, couleurs.Primaire],
    ["Classes", classes.length, School, couleurs.principale],
    ["Inscriptions", lireModule("inscriptions").length, FileText, couleurs.Lycée],
    ["Utilisateurs", lireModule("utilisateurs").length, UserCog, couleurs.Collège]
  ] : role === "econome" ? [
    ["Recettes", recettes.toLocaleString("fr-FR") + " Ar", Wallet, couleurs.Lycée],
    ["Paiements", paiements.length, CreditCard, couleurs.principale],
    ["Impayés", lireModule("impayes").length, AlertCircle, couleurs.Collège],
    ["Élèves", eleves.length, Users, couleurs.Primaire]
  ] : [
    ["Élèves de ma classe", inscrits.length, Users, couleurs.Primaire],
    ["Évaluations", lireModule("evaluations").length, BookOpen, couleurs.principale],
    ["Notes saisies", notes.filter(n =>
      inscrits.some(e => `${e.nom} ${e.prenom}` === n.eleve)
    ).length, FileText, couleurs.Lycée],
    ["Bulletins", lireModule("bulletins").length, Award, couleurs.Collège]
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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${texte}`} style={policeTitre}>
            Tableau de bord
          </h1>
          <p className={`mt-1 text-sm ${secondaire}`}>
            Statistiques et indicateurs de votre espace.
          </p>
        </div>
      </header>

      {/* Statistiques */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Indicateurs statistiques">
        {cartes.map(([titre, valeur, Icone, couleur]) => (
          <CarteStatistique key={titre} titre={titre} valeur={valeur}
            Icone={Icone} couleur={couleur} />
        ))}
      </section>

      {/* Graphiques */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${carte} min-w-0 p-4 sm:p-5`}>
          <EnteteSection titre="Élèves par classe"
            description="Effectif des élèves par classe." Icone={School} />

          <div className="h-[260px]">
            {parClasse.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={parClasse} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 4" vertical={false}
                    stroke={couleurs.grille} strokeOpacity={0.7} />
                  <XAxis dataKey="name" tick={styleAxe} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={styleAxe} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={styleTooltip}
                    labelStyle={{ color: couleurs.texte }}
                    itemStyle={{ color: couleurs.texte }}
                    cursor={{ fill: couleurs.curseur }} />
                  <Bar dataKey="total" name="Élèves" fill={couleurs.principale}
                    radius={[5, 5, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={`flex h-full items-center justify-center text-sm ${secondaire}`}>
                Aucune donnée de classe disponible.
              </div>
            )}
          </div>
        </section>

        <section className={`${carte} min-w-0 p-4 sm:p-5`}>
          <EnteteSection titre="Répartition par cycle"
            description="Distribution des élèves par cycle scolaire." Icone={GraduationCap} />

          <div className="h-[240px]">
            {parCycle.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={parCycle} dataKey="value" nameKey="name"
                    innerRadius={60} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                    {parCycle.map(x => <Cell key={x.name} fill={couleurs[x.name]} />)}
                  </Pie>
                  <Tooltip contentStyle={styleTooltip}
                    labelStyle={{ color: couleurs.texte }}
                    itemStyle={{ color: couleurs.texte }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={`flex h-full items-center justify-center text-sm ${secondaire}`}>
                Aucune donnée de cycle disponible.
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 border-t border-slate-100 pt-4 dark:border-[#263852]">
            {parCycle.map(x => (
              <span key={x.name} className={`flex items-center gap-2 text-xs ${secondaire}`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: couleurs[x.name] }} />
                {x.name} : <strong className={texte}>{x.value}</strong>
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Accès rapide */}
      <section className={`${carte} p-4 sm:p-5`}>
        <EnteteSection titre="Accès rapide" description="Accédez aux principales fonctionnalités." />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {liens.map(([url, nom]) => (
            <Link key={url} to={url.startsWith("/") ? url : `/${role}/${url}`}
              className={`group flex min-h-[46px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold transition-colors hover:border-[#540916] hover:bg-[#540916] hover:text-white dark:border-[#30415C] dark:bg-[#1B2E4A] dark:hover:border-[#60A5FA] dark:hover:bg-[#29446D] dark:hover:text-white ${accent}`}>
              <span className="min-w-0">{nom}</span>
              <ArrowUpRight size={15}
                className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}