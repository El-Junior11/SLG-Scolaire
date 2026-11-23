export const DEMONSTRATION={
 eleves:[{id:'e1',matricule:'SLG-26001',nom:'Rakoto',prenom:'Aina',classe:'6e A',sexe:'Féminin',statut:'Inscrit',naissance:'2013-04-12',responsable:'Mme Rakoto',telephone:'034 00 000 01'},{id:'e2',matricule:'SLG-26002',nom:'Randria',prenom:'Lucas',classe:'5e A',sexe:'Masculin',statut:'Inscrit'},{id:'e3',matricule:'SLG-26003',nom:'Rasoa',prenom:'Miora',classe:'6e A',sexe:'Féminin',statut:'Inscrit'},{id:'e4',matricule:'SLG-26004',nom:'Rabe',prenom:'Tiana',classe:'3e A',sexe:'Masculin',statut:'Inscrit'}],
 inscriptions:[{id:'i1',eleve:'Rakoto Aina',classe:'6e A',annee:'2026-2027',type:'Nouvelle inscription',statut:'Validée'},{id:'i2',eleve:'Randria Lucas',classe:'5e A',annee:'2026-2027',type:'Réinscription',statut:'Validée'}],
 classes:[{id:'c1',nom:'6e A',cycle:'Collège',niveau:'6e',capacite:40,titulaire:'Mme R.'},{id:'c2',nom:'5e A',cycle:'Collège',niveau:'5e',capacite:40,titulaire:'M. T.'},{id:'c3',nom:'3e A',cycle:'Collège',niveau:'3e',capacite:35,titulaire:'Mme N.'}],
 'annees-scolaires':[{id:'a1',nom:'2026-2027',debut:'2026-09-01',fin:'2027-07-15',statut:'Active'}],
 utilisateurs:[{id:'u1',nom:'Administration SLG',email:'admin@demo.local',role:'Secrétaire',classe:'—',statut:'Actif'},{id:'u2',nom:'Économe SLG',email:'econome@demo.local',role:'Économe',classe:'—',statut:'Actif'},{id:'u3',nom:'Titulaire SLG',email:'titulaire@demo.local',role:'Titulaire',classe:'6e A',statut:'Actif'}],
 'frais-scolaires':[{id:'f1',libelle:'Scolarité trimestrielle',classe:'6e A',montant:120000,echeance:'2026-12-15',statut:'Actif'}],
 paiements:[{id:'p1',reference:'PAY-001',eleve:'Rakoto Aina',montant:60000,date:'2026-11-18',mode:'Espèces',statut:'Validé'},{id:'p2',reference:'PAY-002',eleve:'Randria Lucas',montant:120000,date:'2026-11-19',mode:'Mobile Money',statut:'Validé'}],
 impayes:[{id:'im1',eleve:'Rakoto Aina',classe:'6e A',du:120000,paye:60000,reste:60000,echeance:'2026-12-15'}],
 recus:[{id:'r1',numero:'REC-001',eleve:'Rakoto Aina',montant:60000,date:'2026-11-18',statut:'Émis'}],
 matieres:[{id:'m1',nom:'Mathématiques',classe:'6e A',coefficient:4,bareme:20},{id:'m2',nom:'Français',classe:'6e A',coefficient:3,bareme:20},{id:'m3',nom:'Histoire-Géographie',classe:'6e A',coefficient:2,bareme:20}],
 evaluations:[{id:'ev1',titre:'Composition 1',matiere:'Mathématiques',classe:'6e A',date:'2026-11-15',coefficient:2,bareme:20}],
 notes:[{id:'n1',eleve:'Rakoto Aina',matiere:'Mathématiques',evaluation:'Composition 1',note:17,bareme:20,trimestre:'Trimestre 1'},{id:'n2',eleve:'Rasoa Miora',matiere:'Mathématiques',evaluation:'Composition 1',note:14,bareme:20,trimestre:'Trimestre 1'}],
 moyennes:[{id:'mo1',eleve:'Rakoto Aina',classe:'6e A',trimestre:'Trimestre 1',moyenne:16.85,rang:1},{id:'mo2',eleve:'Rasoa Miora',classe:'6e A',trimestre:'Trimestre 1',moyenne:14.2,rang:2}],
 classements:[{id:'cl1',rang:1,eleve:'Rakoto Aina',classe:'6e A',moyenne:16.85,mention:'Très bien'},{id:'cl2',rang:2,eleve:'Rasoa Miora',classe:'6e A',moyenne:14.2,mention:'Bien'}],
 bulletins:[{id:'b1',eleve:'Rakoto Aina',classe:'6e A',trimestre:'Trimestre 1',moyenne:16.85,rang:1,statut:'Brouillon'}],
 rapports:[{id:'ra1',titre:'Effectifs par classe',periode:'2026-2027',categorie:'Administratif',date:'2026-11-20'}],
 'rapports-financiers':[{id:'rf1',titre:'Journal de caisse',periode:'Novembre 2026',categorie:'Financier',date:'2026-11-20'}],
 'rapports-pedagogiques':[{id:'rp1',titre:'Résultats trimestriels',periode:'Trimestre 1',categorie:'Pédagogique',date:'2026-11-20'}]
};
DEMONSTRATION['ma-classe']=DEMONSTRATION.eleves.filter(e=>e.classe==='6e A');
