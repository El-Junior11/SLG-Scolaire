export const ETABLISSEMENT = 'Saint Louis de Gonzague Mahasoabe';

export const ROLES = {
  admin: 'Super Administrateur / Secrétaire',
  secretaire: 'Secrétaire',
  econome: 'Économe',
  titulaire: 'Titulaire de classe'
};

// Navigation principale
const NAVIGATION_SECRETARIAT = [
  ['gestion-scolaire', 'Gestion scolaire', 'School'],
  ['administration', 'Administration', 'UserCog'],
  ['rapports', 'Rapports administratifs', 'BarChart3']
];

export const NAVIGATION = {
  admin: [
    ['tableau-de-bord', 'Tableau de bord', 'LayoutDashboard']
  ],
  secretaire: [
    ['tableau-de-bord', 'Tableau de bord', 'LayoutDashboard'],
    ...NAVIGATION_SECRETARIAT
  ],
  econome: [
    ['tableau-de-bord', 'Tableau de bord', 'LayoutDashboard'],
    ['eleves', 'Élèves', 'Users'],
    ['gestion-financiere', 'Gestion financière', 'Wallet'],
    ['rapports-financiers', 'Rapports financiers', 'BarChart3']
  ],
  titulaire: [
    ['tableau-de-bord', 'Tableau de bord', 'LayoutDashboard'],
    ['ma-classe', 'Ma classe', 'Users'],
    ['evaluations-notes', 'Évaluations et notes', 'ClipboardList'],
    ['resultats-scolaires', 'Résultats scolaires', 'Trophy'],
    ['rapports-pedagogiques', 'Rapports pédagogiques', 'BarChart3']
  ]
};

// Configuration des modules métier
export const CONFIG_MODULES = {
  eleves: {
    titre: 'Gestion des élèves',
    description: 'Dossiers scolaires, informations et affectations',
    colonnes: ['matricule', 'nom', 'prenom', 'classe', 'sexe', 'statut'],
    champs: {
      matricule: 'Matricule',
      nom: 'Nom',
      prenom: 'Prénom',
      classe: 'Classe',
      sexe: 'Sexe',
      statut: 'Statut',
      naissance: 'Date de naissance',
      adresse: 'Adresse',
      responsable: 'Responsable légal',
      telephone: 'Téléphone'
    }
  },
  inscriptions: {
    titre: 'Inscriptions et réinscriptions',
    description: 'Suivi des admissions et affectations',
    colonnes: ['eleve', 'classe', 'annee', 'type', 'statut'],
    champs: {
      eleve: 'Élève',
      classe: 'Classe',
      annee: 'Année scolaire',
      type: 'Type',
      statut: 'Statut'
    }
  },
  classes: {
    titre: 'Gestion des classes',
    description: 'Organisation des niveaux et effectifs',
    colonnes: ['nom', 'cycle', 'niveau', 'capacite', 'titulaire'],
    champs: {
      nom: 'Nom de la classe',
      cycle: 'Cycle',
      niveau: 'Niveau',
      capacite: 'Capacité',
      titulaire: 'Titulaire'
    }
  },
  'annees-scolaires': {
    titre: 'Années scolaires',
    description: 'Périodes, trimestres et clôtures',
    colonnes: ['nom', 'debut', 'fin', 'statut'],
    champs: {
      nom: 'Année scolaire',
      debut: 'Début',
      fin: 'Fin',
      statut: 'Statut'
    }
  },
  utilisateurs: {
    titre: 'Gestion des utilisateurs',
    description: 'Comptes, rôles et affectations',
    colonnes: ['nom', 'email', 'role', 'classe', 'statut'],
    champs: {
      nom: 'Nom complet',
      email: 'Adresse e-mail',
      role: 'Rôle',
      classe: 'Classe attribuée',
      statut: 'Statut'
    }
  },
  'frais-scolaires': {
    titre: 'Frais scolaires',
    description: 'Tarifs, échéances et réductions',
    colonnes: ['libelle', 'classe', 'montant', 'echeance', 'statut'],
    champs: {
      libelle: 'Libellé',
      classe: 'Classe',
      montant: 'Montant (Ar)',
      echeance: 'Échéance',
      statut: 'Statut'
    }
  },
  paiements: {
    titre: 'Paiements',
    description: 'Encaissements et règlements échelonnés',
    colonnes: ['reference', 'eleve', 'montant', 'date', 'mode', 'statut'],
    champs: {
      reference: 'Référence',
      eleve: 'Élève',
      montant: 'Montant (Ar)',
      date: 'Date',
      mode: 'Mode de paiement',
      statut: 'Statut'
    }
  },
  impayes: {
    titre: 'Suivi des impayés',
    description: 'Soldes restants et échéances',
    colonnes: ['eleve', 'classe', 'du', 'paye', 'reste', 'echeance'],
    champs: {
      eleve: 'Élève',
      classe: 'Classe',
      du: 'Montant dû (Ar)',
      paye: 'Montant payé (Ar)',
      reste: 'Reste (Ar)',
      echeance: 'Échéance'
    }
  },
  recus: {
    titre: 'Reçus de paiement',
    description: 'Justificatifs et historique',
    colonnes: ['numero', 'eleve', 'montant', 'date', 'statut'],
    champs: {
      numero: 'N° reçu',
      eleve: 'Élève',
      montant: 'Montant (Ar)',
      date: 'Date',
      statut: 'Statut'
    }
  },
  'ma-classe': {
    titre: 'Ma classe',
    description: 'Élèves de la classe attribuée',
    colonnes: ['matricule', 'nom', 'prenom', 'classe', 'statut'],
    champs: {
      matricule: 'Matricule',
      nom: 'Nom',
      prenom: 'Prénom',
      classe: 'Classe',
      statut: 'Statut'
    },
    lectureSeule: true
  },
  matieres: {
    titre: 'Matières',
    description: 'Coefficients et barèmes pédagogiques',
    colonnes: ['nom', 'classe', 'coefficient', 'bareme'],
    champs: {
      nom: 'Matière',
      classe: 'Classe',
      coefficient: 'Coefficient',
      bareme: 'Barème'
    },
    lectureSeule: true
  },
  evaluations: {
    titre: 'Évaluations',
    description: 'Devoirs, interrogations et compositions',
    colonnes: ['titre', 'matiere', 'classe', 'date', 'coefficient', 'bareme'],
    champs: {
      titre: 'Évaluation',
      matiere: 'Matière',
      classe: 'Classe',
      date: 'Date',
      coefficient: 'Coefficient',
      bareme: 'Note maximale'
    }
  },
  notes: {
    titre: 'Gestion des notes',
    description: 'Saisie et consultation des résultats',
    colonnes: ['eleve', 'matiere', 'evaluation', 'note', 'bareme', 'trimestre'],
    champs: {
      eleve: 'Élève',
      matiere: 'Matière',
      evaluation: 'Évaluation',
      note: 'Note',
      bareme: 'Barème',
      trimestre: 'Trimestre'
    }
  },
  moyennes: {
    titre: 'Moyennes scolaires',
    description: 'Calculs et performances par trimestre',
    colonnes: ['eleve', 'classe', 'trimestre', 'moyenne', 'rang'],
    champs: {
      eleve: 'Élève',
      classe: 'Classe',
      trimestre: 'Trimestre',
      moyenne: 'Moyenne',
      rang: 'Rang'
    },
    lectureSeule: true
  },
  classements: {
    titre: 'Classements',
    description: 'Résultats et rangs des élèves',
    colonnes: ['rang', 'eleve', 'classe', 'moyenne', 'mention'],
    champs: {
      rang: 'Rang',
      eleve: 'Élève',
      classe: 'Classe',
      moyenne: 'Moyenne',
      mention: 'Mention'
    },
    lectureSeule: true
  },
  bulletins: {
    titre: 'Bulletins scolaires',
    description: 'Aperçu, édition et impression A4',
    colonnes: ['eleve', 'classe', 'trimestre', 'moyenne', 'rang', 'statut'],
    champs: {
      eleve: 'Élève',
      classe: 'Classe',
      trimestre: 'Trimestre',
      moyenne: 'Moyenne',
      rang: 'Rang',
      statut: 'Statut'
    }
  },
  rapports: {
    titre: 'Rapports administratifs',
    description: 'Synthèses et exports de l’établissement',
    colonnes: ['titre', 'periode', 'categorie', 'date'],
    champs: {
      titre: 'Titre',
      periode: 'Période',
      categorie: 'Catégorie',
      date: 'Date'
    },
    lectureSeule: true
  },
  'rapports-financiers': {
    titre: 'Rapports financiers',
    description: 'Journal de caisse et bilan des recettes',
    colonnes: ['titre', 'periode', 'categorie', 'date'],
    champs: {
      titre: 'Titre',
      periode: 'Période',
      categorie: 'Catégorie',
      date: 'Date'
    },
    lectureSeule: true
  },
  'rapports-pedagogiques': {
    titre: 'Rapports pédagogiques',
    description: 'Réussite, moyennes et classements',
    colonnes: ['titre', 'periode', 'categorie', 'date'],
    champs: {
      titre: 'Titre',
      periode: 'Période',
      categorie: 'Catégorie',
      date: 'Date'
    },
    lectureSeule: true
  }
};

// Sous-menus de navigation
export const GROUPES_NAVIGATION = {
  'gestion-scolaire': [
    ['eleves', 'Élèves'],
    ['inscriptions', 'Inscriptions'],
    ['classes', 'Classes'],
    ['annees-scolaires', 'Années scolaires']
  ],
  administration: [
    ['utilisateurs', 'Utilisateurs'],
    ['demandes', 'Demandes d’accès']
  ],
  'gestion-eleves': [
    ['eleves', 'Élèves'],
    ['inscriptions', 'Inscriptions']
  ],
  'gestion-financiere': [
    ['frais-scolaires', 'Frais scolaires'],
    ['frais-scolaires/ecolage', 'Écolage'],
    ['frais-scolaires/inscription', 'Droits d’inscription'],
    ['frais-scolaires/infrastructure', 'Infrastructure'],
    ['frais-scolaires/divers', 'Frais divers']
  ],
  'ma-classe': [
    ['ma-classe', 'Élèves de la classe'],
    ['matieres', 'Matières']
  ],
  'evaluations-notes': [
    ['evaluations', 'Évaluations'],
    ['notes', 'Notes']
  ],
  'resultats-scolaires': [
    ['moyennes', 'Moyennes'],
    ['classements', 'Classements'],
    ['bulletins', 'Bulletins']
  ]
};

// Liens historiques conservés pour la compatibilité
const NAVIGATION_HISTORIQUE = {
  admin: [
    ['eleves', 'Élèves', 'Users'],
    ['inscriptions', 'Inscriptions', 'ClipboardList'],
    ['classes', 'Classes', 'School'],
    ['annees-scolaires', 'Années scolaires', 'CalendarDays'],
    ['utilisateurs', 'Utilisateurs', 'UserCog'],
    ['demandes', 'Demandes d’accès', 'UserCog'],
    ['rapports', 'Rapports administratifs', 'BarChart3']
  ],
  secretaire: [
    ['eleves', 'Élèves', 'Users'],
    ['inscriptions', 'Inscriptions', 'ClipboardList'],
    ['classes', 'Classes', 'School'],
    ['annees-scolaires', 'Années scolaires', 'CalendarDays'],
    ['utilisateurs', 'Utilisateurs', 'UserCog'],
    ['demandes', 'Demandes d’accès', 'UserCog'],
    ['parametres', 'Paramètres', 'Settings']
  ],
  econome: [
    ['eleves', 'Élèves', 'Users'],
    ['inscriptions', 'Inscriptions', 'ClipboardList'],
    ['frais-scolaires', 'Frais de scolarité', 'Wallet'],
    ['frais-scolaires/ecolage', 'Écolage', 'Wallet'],
    ['frais-scolaires/inscription', 'Droits d’inscription', 'ClipboardList'],
    ['frais-scolaires/infrastructure', 'Frais d’infrastructure', 'FileText'],
    ['frais-scolaires/divers', 'Frais divers', 'FileText']
  ],
  titulaire: [
    ['matieres', 'Matières', 'BookOpen'],
    ['evaluations', 'Évaluations', 'ClipboardList'],
    ['notes', 'Notes', 'Pencil'],
    ['moyennes', 'Moyennes', 'Calculator'],
    ['classements', 'Classements', 'Trophy'],
    ['bulletins', 'Bulletins', 'FileText']
  ]
};

const LIENS_HISTORIQUES = Object.fromEntries(
  Object.entries(NAVIGATION_HISTORIQUE).flatMap(([espace, liens]) =>
    liens.map(([url, libelle, icone]) => [
      `/${espace}/${url}`, { espace, libelle, icone }
    ])
  )
);

// Éléments exclus des sections du Super Administrateur
const MENUS_EXCLUS = [
  'tableau-de-bord', 'configuration', 'parametres',
  'mon-compte', 'profil', 'notifications'
];

// Sections du Super Administrateur
export const SECTIONS_ADMIN_DEFAUT = [
  ['secretaire', 'Secrétariat'],
  ['econome', 'Économat'],
  ['titulaire', 'Espace pédagogique']
].map(([espace, titre]) => ({
  id: espace,
  titre,
  liens: NAVIGATION[espace]
    .filter(([url]) => !MENUS_EXCLUS.includes(url))
    .map(([url]) => `/${espace}/${url}`)
}));

// Catalogue des liens disponibles pour les sections administratives
export const LIENS_SECTIONS_ADMIN = {
  ...LIENS_HISTORIQUES,
  ...Object.fromEntries(
    ['secretaire', 'econome', 'titulaire'].flatMap(espace =>
      NAVIGATION[espace]
        .filter(([url]) => !MENUS_EXCLUS.includes(url))
        .map(([url, libelle, icone]) => [
          `/${espace}/${url}`, { espace, libelle, icone }
        ])
    )
  )
};