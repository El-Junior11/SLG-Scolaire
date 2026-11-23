export const ETABLISSEMENT='Saint Louis de Gonzague Mahasoabe';
export const ROLES={admin:"Administrateur",secretaire:'Secrétaire',econome:'Économe',titulaire:'Titulaire de classe'};
export const NAVIGATION={
 admin:[
  ['tableau-de-bord','Tableau de bord','LayoutDashboard'],
  ['eleves','Élèves','Users'],
  ['classes','Classes','School'],
  ['annees-scolaires','Années scolaires','CalendarDays'],
  ['rapports','Rapports','BarChart3'],
  ['demandes','Demandes d’accès','UserCog'],
  ['configuration','Configuration','Settings'],
 ],
 secretaire:[['tableau-de-bord','Tableau de bord','LayoutDashboard'],['eleves','Élèves','Users'],['classes','Classes','School'],['annees-scolaires','Années scolaires','CalendarDays'],['utilisateurs','Utilisateurs','UserCog'],['rapports','Rapports','BarChart3'],['parametres','Paramètres','Settings']],
 econome:[['tableau-de-bord','Tableau de bord','LayoutDashboard'],['eleves','Élèves','Users'],['inscriptions','Inscriptions','ClipboardList'],['frais-scolaires','Frais de scolarité','Wallet'],['frais-scolaires/ecolage','Écolage','Wallet'],['frais-scolaires/inscription','Droits d’inscription','ClipboardList'],['frais-scolaires/infrastructure','Frais d’infrastructure','FileText'],['frais-scolaires/divers','Frais divers','FileText'],['rapports-financiers','Rapports financiers','BarChart3']],
 titulaire:[['tableau-de-bord','Tableau de bord','LayoutDashboard'],['ma-classe','Ma classe','Users'],['matieres','Matières','BookOpen'],['evaluations','Évaluations','ClipboardList'],['notes','Notes','Pencil'],['moyennes','Moyennes','Calculator'],['classements','Classements','Trophy'],['bulletins','Bulletins','FileText'],['rapports-pedagogiques','Rapports pédagogiques','BarChart3']]
};
export const CONFIG_MODULES={
 eleves:{titre:'Gestion des élèves',description:'Dossiers scolaires, informations et affectations',colonnes:['matricule','nom','prenom','classe','sexe','statut'],champs:{matricule:'Matricule',nom:'Nom',prenom:'Prénom',classe:'Classe',sexe:'Sexe',statut:'Statut',naissance:'Date de naissance',adresse:'Adresse',responsable:'Responsable légal',telephone:'Téléphone'}},
 inscriptions:{titre:'Inscriptions et réinscriptions',description:'Suivi des admissions et affectations',colonnes:['eleve','classe','annee','type','statut'],champs:{eleve:'Élève',classe:'Classe',annee:'Année scolaire',type:'Type',statut:'Statut'}},
 classes:{titre:'Gestion des classes',description:'Organisation des niveaux et effectifs',colonnes:['nom','cycle','niveau','capacite','titulaire'],champs:{nom:'Nom de la classe',cycle:'Cycle',niveau:'Niveau',capacite:'Capacité',titulaire:'Titulaire'}},
 'annees-scolaires':{titre:'Années scolaires',description:'Périodes, trimestres et clôtures',colonnes:['nom','debut','fin','statut'],champs:{nom:'Année scolaire',debut:'Début',fin:'Fin',statut:'Statut'}},
 utilisateurs:{titre:'Gestion des utilisateurs',description:'Comptes, rôles et affectations',colonnes:['nom','email','role','classe','statut'],champs:{nom:'Nom complet',email:'Adresse e-mail',role:'Rôle',classe:'Classe attribuée',statut:'Statut'}},
 'frais-scolaires':{titre:'Frais scolaires',description:'Tarifs, échéances et réductions',colonnes:['libelle','classe','montant','echeance','statut'],champs:{libelle:'Libellé',classe:'Classe',montant:'Montant (Ar)',echeance:'Échéance',statut:'Statut'}},
 paiements:{titre:'Paiements',description:'Encaissements et règlements échelonnés',colonnes:['reference','eleve','montant','date','mode','statut'],champs:{reference:'Référence',eleve:'Élève',montant:'Montant (Ar)',date:'Date',mode:'Mode de paiement',statut:'Statut'}},
 impayes:{titre:'Suivi des impayés',description:'Soldes restants et échéances',colonnes:['eleve','classe','du','paye','reste','echeance'],champs:{eleve:'Élève',classe:'Classe',du:'Montant dû (Ar)',paye:'Montant payé (Ar)',reste:'Reste (Ar)',echeance:'Échéance'}},
 recus:{titre:'Reçus de paiement',description:'Justificatifs et historique',colonnes:['numero','eleve','montant','date','statut'],champs:{numero:'N° reçu',eleve:'Élève',montant:'Montant (Ar)',date:'Date',statut:'Statut'}},
 'ma-classe':{titre:'Ma classe',description:'Élèves de la classe attribuée',colonnes:['matricule','nom','prenom','classe','statut'],champs:{matricule:'Matricule',nom:'Nom',prenom:'Prénom',classe:'Classe',statut:'Statut'},lectureSeule:true},
 matieres:{titre:'Matières',description:'Coefficients et barèmes pédagogiques',colonnes:['nom','classe','coefficient','bareme'],champs:{nom:'Matière',classe:'Classe',coefficient:'Coefficient',bareme:'Barème'},lectureSeule:true},
 evaluations:{titre:'Évaluations',description:'Devoirs, interrogations et compositions',colonnes:['titre','matiere','classe','date','coefficient','bareme'],champs:{titre:'Évaluation',matiere:'Matière',classe:'Classe',date:'Date',coefficient:'Coefficient',bareme:'Note maximale'}},
 notes:{titre:'Gestion des notes',description:'Saisie et consultation des résultats',colonnes:['eleve','matiere','evaluation','note','bareme','trimestre'],champs:{eleve:'Élève',matiere:'Matière',evaluation:'Évaluation',note:'Note',bareme:'Barème',trimestre:'Trimestre'}},
 moyennes:{titre:'Moyennes scolaires',description:'Calculs et performances par trimestre',colonnes:['eleve','classe','trimestre','moyenne','rang'],champs:{eleve:'Élève',classe:'Classe',trimestre:'Trimestre',moyenne:'Moyenne',rang:'Rang'},lectureSeule:true},
 classements:{titre:'Classements',description:'Résultats et rangs des élèves',colonnes:['rang','eleve','classe','moyenne','mention'],champs:{rang:'Rang',eleve:'Élève',classe:'Classe',moyenne:'Moyenne',mention:'Mention'},lectureSeule:true},
 bulletins:{titre:'Bulletins scolaires',description:'Aperçu, édition et impression A4',colonnes:['eleve','classe','trimestre','moyenne','rang','statut'],champs:{eleve:'Élève',classe:'Classe',trimestre:'Trimestre',moyenne:'Moyenne',rang:'Rang',statut:'Statut'}},
 rapports:{titre:'Rapports administratifs',description:'Synthèses et exports de l’établissement',colonnes:['titre','periode','categorie','date'],champs:{titre:'Titre',periode:'Période',categorie:'Catégorie',date:'Date'},lectureSeule:true},
 'rapports-financiers':{titre:'Rapports financiers',description:'Journal de caisse et bilan des recettes',colonnes:['titre','periode','categorie','date'],champs:{titre:'Titre',periode:'Période',categorie:'Catégorie',date:'Date'},lectureSeule:true},
 'rapports-pedagogiques':{titre:'Rapports pédagogiques',description:'Réussite, moyennes et classements',colonnes:['titre','periode','categorie','date'],champs:{titre:'Titre',periode:'Période',categorie:'Catégorie',date:'Date'},lectureSeule:true}
};

export const SECTIONS_ADMIN_DEFAUT = [
  ['econome', 'Économat'],
  ['titulaire', 'Espace pédagogique'],
  ['secretaire', 'Secrétariat'],
].map(([espace, titre]) => ({
  id: espace,
  titre,
  liens: NAVIGATION[espace].map(([url]) => `/${espace}/${url}`),
}));

export const LIENS_SECTIONS_ADMIN = Object.fromEntries(
  ['econome', 'titulaire', 'secretaire'].flatMap(espace =>
    NAVIGATION[espace].map(([url, libelle, icone]) => [
      `/${espace}/${url}`, { espace, libelle, icone },
    ])
  )
);
