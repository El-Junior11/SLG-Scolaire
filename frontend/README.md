# Saint Louis de Gonzague Mahasoabe — Frontend V2

Frontend React 19 + Vite 6 + Tailwind CSS 4. Application de démonstration locale (aucune connexion Firebase active).

## Installation

```bash
npm install
npm run dev
```

Vérification de compilation : `npm run build` (testée avec succès).

## Organisation

- `src/components/` : Navbar, Sidebar, Footer, composants de formulaires, tableaux, modales, graphiques et thème.
- `src/secretaire/` : pages administratives.
- `src/econome/` : pages financières.
- `src/titulaire/` : pages pédagogiques.
- `src/pages/` : accueil, contact, authentification, profil, notifications.
- `src/contextes/`, `src/services/`, `src/donnees/`, `src/utilitaires/`, `src/routes/` : logique transversale.

## Démonstration

Depuis la page Connexion, choisir un profil (Secrétaire, Économe ou Titulaire), renseigner des valeurs fictives dans les champs de connexion. Les identifiants ne sont **pas vérifiés** : ne pas saisir de vrais mots de passe.

- Thème clair/sombre persistant.
- Sidebar gauche, navigation mobile.
- Gestion des élèves, filtres, tri, inscription/réinscription.
- Tableaux adaptés en cartes sur petits écrans.
- Tableau de bord et graphiques calculés à partir des données locales.
- Paiements de démonstration créant des reçus, PDF de reçu.
- Saisie collective des notes, calcul indicatif des moyennes et rangs, bulletins A4/PDF.
- Années scolaires, trimestres présentés et simulation de passage en classe supérieure.
- Aucun module Présences.

## Limites importantes

Cette livraison est un **frontend de démonstration**, pas une solution scolaire en production. Le stockage utilise `localStorage`, sans validation serveur, sans authentification sécurisée ni synchronisation Firebase. Les calculs pédagogiques sont indicatifs (moyenne des notes par matière, puis pondération par coefficient) et doivent être validés par les règles officielles de l'établissement. Les paiements ne sont pas des transactions réelles. Les exports et écrans doivent être vérifiés avec les modèles officiels avant mise en service. Les permissions doivent être appliquées côté backend/Firebase, pas uniquement dans React.

Le projet n'inclut pas `node_modules` ni `dist` afin de garder une archive légère.
