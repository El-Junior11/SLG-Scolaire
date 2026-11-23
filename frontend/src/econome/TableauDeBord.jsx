import { Link } from "react-router-dom";
import { Users, School, Wallet, CreditCard, BookOpen, Award, FileText, AlertCircle, UserCog, ArrowUpRight, GraduationCap, LayoutDashboard } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { lireModule } from "../services/stockageDemonstration";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";

const couleurs = ["#172B50", "#D9799A", "#26865B"];
const formatNombre = n => Number(n || 0).toLocaleString("fr-FR");

export default function TableauDeBord() {
  const { utilisateur } = utiliserAuthentification();
  const role = utilisateur?.role === "admin" ? "econome" : (utilisateur?.role || "econome");
  const eleves = lireModule("eleves");
  const classes = lireModule("classes");
  const paiements = lireModule("paiements");
  const notes = lireModule("notes");

  const inscrits = role === "titulaire" ? eleves.filter(e => e.classe === utilisateur.classe) : eleves;
  const parClasse = classes.map(c => ({ name: c.nom, total: eleves.filter(e => e.classe === c.nom).length }));
  const parCycle = ["Primaire", "Collège", "Lycée"].map(n => ({
    name: n,
    value: classes.filter(c => c.cycle === n).reduce((a, c) => a + eleves.filter(e => e.classe === c.nom).length, 0)
  })).filter(x => x.value);
  const recettes = paiements.reduce((a, p) => a + Number(p.montant || 0), 0);

  const cartes = role === "secretaire" ? [
    ["Élèves", eleves.length, Users, "#172B50"],
    ["Classes", classes.length, School, "#540916"],
    ["Inscriptions", lireModule("inscriptions").length, FileText, "#26865B"],
    ["Utilisateurs", lireModule("utilisateurs").length, UserCog, "#D9799A"]
  ] : role === "econome" ? [
    ["Recettes", formatNombre(recettes) + " Ar", Wallet, "#26865B"],
    ["Paiements", paiements.length, CreditCard, "#540916"],
    ["Impayés", lireModule("impayes").length, AlertCircle, "#D9799A"],
    ["Élèves", eleves.length, Users, "#172B50"]
  ] : [
    ["Élèves de ma classe", inscrits.length, Users, "#172B50"],
    ["Évaluations", lireModule("evaluations").length, BookOpen, "#540916"],
    ["Notes saisies", notes.filter(n => inscrits.some(e => `${e.nom} ${e.prenom}` === n.eleve)).length, FileText, "#26865B"],
    ["Bulletins", lireModule("bulletins").length, Award, "#D9799A"]
  ];

  const liens = role === "secretaire" ? [
    ["eleves", "Élèves"], ["classes", "Classes"],
    ["annees-scolaires", "Années scolaires"], ["utilisateurs", "Utilisateurs"]
  ] : role === "econome" ? [
    ["frais-scolaires", "Frais de scolarité"], ["eleves", "Élèves"],
    ["frais-scolaires/ecolage", "Écolage"], ["frais-scolaires/divers", "Frais divers"]
  ] : [
    ["notes", "Notes"], ["moyennes", "Moyennes"],
    ["classements", "Classements"], ["bulletins", "Bulletins"]
  ];

  const titreRole = role === "secretaire" ? "Secrétariat" : role === "econome" ? "Économat" : "Espace titulaire";
  const carte = "rounded-2xl border border-[#EAE3E5] bg-white shadow-[0_3px_18px_rgba(30,15,20,0.035)] dark:border-[#243653] dark:bg-[#14243D]";
  const texte = "text-[#171717] dark:text-white";
  const secondaire = "text-[#687080] dark:text-[#A8B7CF]";

  return (
    <div className="min-h-full space-y-5 font-['Manrope']">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#540916] via-[#681324] to-[#35050E] p-5 text-white sm:p-7 dark:from-[#10213D] dark:via-[#172E51] dark:to-[#091529]">
        <div className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full border-[35px] border-white/[0.04]" />
        <div className="pointer-events-none absolute bottom-[-110px] right-32 h-52 w-52 rounded-full bg-white/[0.035]" />
        <div className="relative z-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              <LayoutDashboard size={12} /> Tableau de bord
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold">{titreRole}</span>
          </div>
          <h1 className="text-[25px] font-extrabold tracking-tight sm:text-[32px]">
            Bienvenue, {utilisateur?.prenom || utilisateur?.nom || "Utilisateur"}
          </h1>
          <p className="mt-2 max-w-xl text-[12px] leading-6 text-white/80 sm:text-[13px]">
            Retrouvez les informations essentielles et suivez les activités de votre espace de gestion scolaire.
          </p>
          <div className="mt-5 flex items-center gap-2 border-t border-white/15 pt-4">
            <GraduationCap size={16} className="text-white/80" />
            <span className="text-[11px] font-semibold tracking-wide text-white/85">SAINT LOUIS DE GONZAGUE MAHASOABE</span>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className={`text-[17px] font-extrabold ${texte}`}>Vue d'ensemble</h2>
          <p className={`mt-1 text-[11px] ${secondaire}`}>Indicateurs et statistiques de votre espace.</p>
        </div>
        <span className="rounded-lg border border-[#EAE3E5] bg-white px-3 py-2 text-[10px] font-bold text-[#540916] dark:border-[#243653] dark:bg-[#14243D] dark:text-[#B9CFFF]">
          Année scolaire en cours
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cartes.map(([titre, valeur, Icone, couleur]) => (
          <div key={titre} className={`${carte} group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5`}>
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${couleur}13`, color: couleur }}>
                <Icone size={19} strokeWidth={1.9} />
              </div>
              <ArrowUpRight size={15} className="text-[#A7A7A7] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-[#8090AA]" />
            </div>
            <p className={`mb-1 text-[11px] font-semibold ${secondaire}`}>{titre}</p>
            <h3 className={`break-words text-[19px] font-extrabold tracking-tight sm:text-[23px] ${texte}`}>{valeur}</h3>
            <div className="mt-4 h-[3px] w-10 rounded-full" style={{ backgroundColor: couleur }} />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${carte} min-w-0 p-4 sm:p-5`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className={`text-[14px] font-extrabold ${texte}`}>Élèves par classe</h2>
              <p className={`mt-1 text-[11px] ${secondaire}`}>Effectif des élèves inscrits dans chaque classe.</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#540916]/[0.07] text-[#540916] dark:bg-[#29446D] dark:text-[#C4D7FF]">
              <School size={17} />
            </span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={parClasse} margin={{ top: 10, right: 8, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#DCE2E9" strokeOpacity={0.55} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8792A2" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8792A2" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EAE3E5", fontSize: 11 }} cursor={{ fill: "#540916", fillOpacity: 0.035 }} />
                <Bar dataKey="total" name="Élèves" fill="#540916" radius={[5, 5, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={`${carte} min-w-0 p-4 sm:p-5`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className={`text-[14px] font-extrabold ${texte}`}>Répartition par cycle</h2>
              <p className={`mt-1 text-[11px] ${secondaire}`}>Distribution des élèves par niveau scolaire.</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#540916]/[0.07] text-[#540916] dark:bg-[#29446D] dark:text-[#C4D7FF]">
              <GraduationCap size={18} />
            </span>
          </div>
          <div className="h-[240px] w-full">
            {parCycle.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={parCycle} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                    {parCycle.map(x => <Cell key={x.name} fill={couleurs[["Primaire", "Collège", "Lycée"].indexOf(x.name)]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EAE3E5", fontSize: 11 }} />
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fill="#8792A2" fontSize="11">Total élèves</text>
                  <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" fill="#540916" fontSize="23" fontWeight="800">
                    {parCycle.reduce((a, x) => a + x.value, 0)}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={`flex h-full items-center justify-center text-[12px] ${secondaire}`}>Aucune donnée de cycle disponible.</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-[#F0EBED] pt-4 dark:border-[#243653]">
            {parCycle.map(x => (
              <span key={x.name} className={`inline-flex items-center gap-2 text-[11px] font-semibold ${secondaire}`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: couleurs[["Primaire", "Collège", "Lycée"].indexOf(x.name)] }} />
                {x.name} <strong className={texte}>{x.value}</strong>
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className={`${carte} p-4 sm:p-5`}>
        <div className="mb-4">
          <h2 className={`text-[14px] font-extrabold ${texte}`}>Accès rapide</h2>
          <p className={`mt-1 text-[11px] ${secondaire}`}>Accédez directement aux principales fonctionnalités.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {liens.map(([url, nom]) => (
            <Link key={url} to={`/${role}/${url}`} className="group flex min-h-[46px] items-center justify-between gap-2 rounded-xl border border-[#EAE3E5] bg-[#FCFAFB] px-4 py-3 text-[11px] font-bold text-[#540916] transition-all hover:border-[#540916] hover:bg-[#540916] hover:text-white dark:border-[#30415C] dark:bg-[#1B2E4A] dark:text-[#D6E4FF] dark:hover:border-[#42649A] dark:hover:bg-[#29446D]">
              <span>{nom}</span>
              <ArrowUpRight size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}