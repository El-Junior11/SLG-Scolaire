import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { utiliserAuthentification } from "../contextes/ContexteAuthentification";

export default function DispositionPrivee() {
  const { utilisateur, deconnexion } = utiliserAuthentification();
  const [ouvert, definirOuvert] = useState(false);
  const naviguer = useNavigate();

  return (
    <div className="min-h-screen w-full overflow-x-clip">
      <Sidebar role={utilisateur.role} ouvert={ouvert} fermer={() => definirOuvert(false)}
        deconnexion={() => { deconnexion(); naviguer("/connexion"); }} />
      <div className="lg:ml-[258px] min-w-0 min-h-screen flex flex-col">
        <Navbar ouvrir={() => definirOuvert(true)} role={utilisateur.role} utilisateur={utilisateur} />
        <main className="flex-1 min-w-0 w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-5 py-4">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}