import { NavLink } from "react-router-dom";
import { GraduationCap, LogOut, X } from "lucide-react";
import Icone from "../components/Icone";
import { NAVIGATION, ROLES } from "../donnees/configuration";
export default function Sidebar({ role, ouvert, fermer, deconnexion }) {
  return <><button aria-label="Fermer le menu" onClick={fermer} className={`fixed inset-0 z-30 bg-slate-950/55 lg:hidden ${ouvert ? '' : 'hidden'}`}/><aside className={`sidebar-slg fixed inset-y-0 left-0 z-40 w-[258px] flex flex-col transition-transform lg:translate-x-0 ${ouvert ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10"><div className="w-11 h-11 bg-blue-500/25 rounded-xl flex items-center justify-center"><GraduationCap size={25}/></div><div className="flex-1"><div className="font-extrabold text-sm">Saint Louis de Gonzague</div><div className="text-xs text-blue-200">Mahasoabe · Scolarité</div></div><button onClick={fermer} className="lg:hidden"><X size={20}/></button></div>
    <div className="px-6 pt-5 pb-3 uppercase tracking-[.15em] text-[10px] font-bold text-blue-200">{ROLES[role]}</div><nav className="flex-1 overflow-y-auto px-3 space-y-1">{NAVIGATION[role].map(([url,libelle,icone])=><NavLink key={url} to={`/${role}/${url}`} onClick={fermer} className={({isActive})=>`sidebar-lien ${isActive ? 'sidebar-actif' : ''}`}><Icone nom={icone} taille={18}/><span>{libelle}</span></NavLink>)}</nav>
    <div className="p-4 border-t border-white/10"><div className="px-3 mb-2 text-[11px] text-blue-200">Mode démonstration · Données locales</div><button className="sidebar-lien w-full" onClick={deconnexion}><LogOut size={17}/> Déconnexion</button></div>
  </aside></>;
}