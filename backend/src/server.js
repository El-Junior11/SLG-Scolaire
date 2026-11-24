import express from 'express';
import cors from 'cors';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const { FIREBASE_PROJECT_ID, ADMIN_UID, FRONTEND_ORIGIN, PORT = 3000 } = process.env;
if (![FIREBASE_PROJECT_ID, ADMIN_UID, FRONTEND_ORIGIN].every(value => value?.trim())) {
  throw new Error('Renseignez FIREBASE_PROJECT_ID, ADMIN_UID et FRONTEND_ORIGIN dans .env.');
}

const firebase = initializeApp({
  credential: applicationDefault(),
  projectId: FIREBASE_PROJECT_ID,
});
const auth = getAuth(firebase);
const db = getFirestore(firebase);
const demandes = db.collection('accesPersonnel');
const roles = ['secretaire', 'econome', 'titulaire'];
const fonctionsDefaut = [
  { id: 'econome', nom: 'Économe', role: 'econome', active: true },
  { id: 'responsable-notes', nom: 'Responsable des notes', role: 'titulaire', active: true },
];
const etablissementDefaut = {
  nom: 'Saint Louis de Gonzague Mahasoabe', siege: '', logo: '', historique: '', contact: '',
};
const configuration = db.collection('configuration');
const fonctionsRef = configuration.doc('fonctionsPersonnel');
const etablissementRef = configuration.doc('etablissement');

function lireFonctions(document) {
  return document.data()?.liste ?? fonctionsDefaut;
}

function texte(valeur, longueur) {
  if (typeof valeur !== 'string' || valeur.trim().length > longueur) return null;
  return valeur.trim();
}
const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '32kb' }));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

function erreur(res, statut, code, message) {
  return res.status(statut).json({ code, message });
}

async function identifier(req, res, next) {
  const jeton = /^Bearer (\S+)$/i.exec(req.get('Authorization') ?? '')?.[1];
  if (!jeton) return erreur(res, 401, 'SESSION', 'Veuillez vous connecter.');
  try {
    req.identite = await auth.verifyIdToken(jeton, true);
  } catch (err) {
    if (!['auth/argument-error', 'auth/invalid-id-token', 'auth/id-token-expired',
      'auth/id-token-revoked', 'auth/user-disabled', 'auth/user-not-found'].includes(err.code)) throw err;
    return erreur(res, 401, 'SESSION', 'Session invalide. Veuillez vous reconnecter.');
  }
  next();
}

function administrateur(req, res, next) {
  if (req.identite.uid !== ADMIN_UID) {
    return erreur(res, 403, 'ADMIN', 'Accès réservé à l’administrateur.');
  }
  next();
}

app.get('/api/sante', (_req, res) => res.json({ statut: 'ok' }));
app.get('/api/configuration', async (_req, res) => {
  const [fonctions, etablissement] = await db.getAll(fonctionsRef, etablissementRef);
  res.json({
    fonctions: lireFonctions(fonctions).filter(fonction => fonction.active)
      .map(({ id, nom }) => ({ id, nom })),
    etablissement: { ...etablissementDefaut, ...etablissement.data() },
  });
});

app.get('/api/admin/configuration', identifier, administrateur, async (_req, res) => {
  const [fonctions, etablissement] = await db.getAll(fonctionsRef, etablissementRef);
  res.json({
    fonctions: lireFonctions(fonctions),
    etablissement: { ...etablissementDefaut, ...etablissement.data() },
  });
});

app.put('/api/admin/configuration/fonctions', identifier, administrateur, async (req, res) => {
  const liste = req.body?.fonctions;
  if (!Array.isArray(liste) || liste.length > 30) {
    return erreur(res, 400, 'FONCTIONS', 'Configurez au maximum 30 fonctions.');
  }
  const ids = new Set();
  const fonctions = [];
  for (const fonction of liste) {
    const { id, nom, role, active } = fonction ?? {};
    const libelle = texte(nom, 80);
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(id) || ids.has(id) ||
        !libelle || !['econome', 'titulaire'].includes(role) || typeof active !== 'boolean') {
      return erreur(res, 400, 'FONCTIONS', 'Vérifiez les noms et les droits des fonctions.');
    }
    ids.add(id);
    fonctions.push({ id, nom: libelle, role, active });
  }
  await fonctionsRef.set({ liste: fonctions });
  res.json({ fonctions });
});

app.put('/api/admin/configuration/etablissement', identifier, administrateur, async (req, res) => {
  const saisie = req.body ?? {};
  const etablissement = {
    nom: texte(saisie.nom, 120),
    siege: texte(saisie.siege, 240),
    logo: texte(saisie.logo, 2048),
    historique: texte(saisie.historique, 4000),
    contact: texte(saisie.contact, 240),
  };
  if (!etablissement.nom || Object.values(etablissement).includes(null)) {
    return erreur(res, 400, 'ETABLISSEMENT', 'Vérifiez le nom et les champs de l’établissement.');
  }
  if (etablissement.logo) {
    let url;
    try { url = new URL(etablissement.logo); } catch { /* URL invalide */ }
    if (url?.protocol !== 'https:' || url.username || url.password) {
      return erreur(res, 400, 'LOGO', 'Saisissez une adresse HTTPS publique pour le logo.');
    }
  }
  await etablissementRef.set(etablissement);
  res.json({ etablissement });
});

const menuAdminRef = configuration.doc('menuAdmin');

app.get('/api/admin/menu', identifier, administrateur, async (_req, res) => {
  const document = await menuAdminRef.get();
  res.json({ sections: document.data()?.sections ?? null });
});

app.put('/api/admin/menu', identifier, administrateur, async (req, res) => {
  const liste = req.body?.sections;
  if (!Array.isArray(liste) || liste.length > 12) {
    return erreur(res, 400, 'MENU', 'Le menu peut contenir au maximum 12 sections.');
  }
  const ids = new Set();
  const sections = [];
  for (const section of liste) {
    const { id, titre, liens } = section ?? {};
    const nom = texte(titre, 60);
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(id) || ids.has(id) ||
        !nom || !Array.isArray(liens) || liens.length > 40 ||
        liens.some(lien => typeof lien !== 'string' || lien.length > 100 ||
          !/^\/(econome|titulaire|secretaire)\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(lien))) {
      return erreur(res, 400, 'MENU', 'Vérifiez les titres et les liens des sections.');
    }
    ids.add(id);
    sections.push({ id, titre: nom, liens: [...new Set(liens)] });
  }
  await menuAdminRef.set({ sections });
  res.json({ sections });
});

app.get('/api/auth/moi', identifier, async (req, res) => {
  const { uid, email, email_verified: emailVerifie } = req.identite;
  if (uid === ADMIN_UID) {
    return res.json({ uid, email, nom: 'Administration', role: 'admin' });
  }
  const profil = (await demandes.doc(uid).get()).data();
  if (!profil) return erreur(res, 403, 'DEMANDE_ABSENTE', 'Veuillez envoyer une demande d’accès.');
  if (profil.statut === 'refuse') return erreur(res, 403, 'REFUSE', 'Votre demande d’accès a été refusée.');
  if (profil.statut !== 'approuve' || !roles.includes(profil.role)) {
    return erreur(res, 403, 'ATTENTE', 'Votre demande attend l’approbation de l’administrateur.');
  }
  if (!emailVerifie || email !== profil.email) {
    return erreur(res, 403, 'EMAIL', 'Vérifiez l’adresse e-mail utilisée pour votre demande.');
  }
  res.json({ uid, email, nom: profil.nom, role: profil.role, classe: profil.classe ?? null });
});

app.post('/api/auth/demandes', identifier, async (req, res) => {
  const { uid, email } = req.identite;
  const nom = typeof req.body?.nom === 'string' ? req.body.nom.trim() : '';
  if (uid === ADMIN_UID || !email || !nom || nom.length > 120) {
    return erreur(res, 400, 'DEMANDE', 'Saisissez un nom complet valide.');
  }
  const ref = demandes.doc(uid);
  const statut = await db.runTransaction(async (transaction) => {
    const profil = await transaction.get(ref);
    if (profil.exists && (profil.data().statut !== 'en_attente' || profil.data().fonctionDemandee)) {
      return profil.data().statut;
    }
    const fonction = lireFonctions(await transaction.get(fonctionsRef))
      .find(entree => entree.active && entree.id === req.body?.fonctionId);
    if (!fonction) return null;
    const fonctionDemandee = { id: fonction.id, nom: fonction.nom };
    if (profil.exists) transaction.update(ref, { fonctionDemandee });
    else transaction.create(ref, {
      nom, email, fonctionDemandee, statut: 'en_attente', creeLe: FieldValue.serverTimestamp(),
    });
    return 'en_attente';
  });
  if (!statut) return erreur(res, 400, 'FONCTION', 'Choisissez une fonction disponible.');
  res.json({ statut });
});

app.get('/api/admin/demandes', identifier, administrateur, async (_req, res) => {
  const resultat = await demandes.orderBy('creeLe', 'desc').get();
  res.json(resultat.docs.map(doc => ({ ...doc.data(), uid: doc.id })));
});

app.patch('/api/admin/demandes/:uid', identifier, administrateur, async (req, res) => {
  const { uid } = req.params;
  const { statut, fonctionId, classe } = req.body ?? {};
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || uid === ADMIN_UID ||
      !['approuve', 'refuse'].includes(statut)) {
    return erreur(res, 400, 'DECISION', 'Vérifiez le statut de la demande.');
  }
  const ref = demandes.doc(uid);
  const resultat = await db.runTransaction(async transaction => {
    if (!(await transaction.get(ref)).exists) return 'absente';
    const approuve = statut === 'approuve';
    const fonction = approuve ? lireFonctions(await transaction.get(fonctionsRef))
      .find(entree => entree.active && entree.id === fonctionId) : null;
    if (approuve && !fonction) return 'fonction';
    const classeAttribuee = fonction?.role === 'titulaire' ? texte(classe, 80) : null;
    if (fonction?.role === 'titulaire' && !classeAttribuee) return 'classe';
    const decision = {
      statut,
      role: fonction?.role ?? null,
      fonctionAttribuee: fonction ? { id: fonction.id, nom: fonction.nom } : null,
      classe: classeAttribuee,
    };
    transaction.update(ref, { ...decision, decideLe: FieldValue.serverTimestamp() });
    return decision;
  });
  if (resultat === 'absente') return erreur(res, 404, 'INTROUVABLE', 'Demande introuvable.');
  if (resultat === 'fonction') return erreur(res, 400, 'FONCTION', 'Choisissez une fonction active.');
  if (resultat === 'classe') return erreur(res, 400, 'CLASSE', 'Indiquez la classe attribuée.');
  res.json(resultat);
});

const classes = db.collection('classes');
const cyclesScolaires = ['Primaire', 'Collège', 'Lycée'];
const idClasseValide = id => /^[A-Za-z0-9_-]{1,128}$/.test(id);

function autoriserGestionEleves(req, res, next) {
  return autoriserGestionScolaire(req, res, next, true);
}

async function autoriserGestionScolaire(req, res, next, gestionEleves = false) {
  const { uid, email, email_verified: emailVerifie } = req.identite;
  if (uid === ADMIN_UID) return next();

  const profil = (await demandes.doc(uid).get()).data();
  if (emailVerifie && profil && profil.email === email &&
      profil.statut === 'approuve' && (profil.role === 'secretaire' ||
        (profil.role === 'econome' && (req.method === 'GET' || gestionEleves === true)))) {
    return next();
  }

  return erreur(res, 403, 'ACCES_SCOLAIRE', 'Vous ne disposez pas des droits pour cette opération.');
}

function validerClasse(body) {
  const { nom, cycle, niveau, capacite = null, description = '' } = body ?? {};
  const nomValide = texte(nom, 120);
  const niveauValide = texte(niveau, 120);
  const descriptionValide = texte(description, 2000);
  if (!nomValide || !niveauValide || !cyclesScolaires.includes(cycle) ||
      descriptionValide === null ||
      (capacite !== null && (!Number.isSafeInteger(capacite) || capacite < 1))) {
    return null;
  }
  return { nom: nomValide, cycle, niveau: niveauValide, capacite, description: descriptionValide };
}

const routeClasses = express.Router();
routeClasses.use(identifier, autoriserGestionScolaire);
routeClasses.param('id', (_req, res, next, id) => {
  if (!idClasseValide(id)) return erreur(res, 400, 'CLASSE_ID', 'Identifiant de classe invalide.');
  next();
});

routeClasses.get('/', async (_req, res) => {
  const resultat = await classes.get();
  const liste = resultat.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  liste.sort((a, b) => String(a.nom ?? '').localeCompare(String(b.nom ?? ''), 'fr', { numeric: true }));
  res.json(liste);
});

routeClasses.post('/', async (req, res) => {
  const classe = validerClasse(req.body);
  if (!classe) return erreur(res, 400, 'CLASSE_INVALIDE', 'Vérifiez le nom, le cycle, le niveau et la capacité.');
  const ref = await classes.add(classe);
  res.status(201).json({ ...classe, id: ref.id });
});

routeClasses.put('/:id', async (req, res) => {
  const classe = validerClasse(req.body);
  if (!classe) return erreur(res, 400, 'CLASSE_INVALIDE', 'Vérifiez le nom, le cycle, le niveau et la capacité.');
  const ref = classes.doc(req.params.id);
  const existe = await db.runTransaction(async transaction => {
    if (!(await transaction.get(ref)).exists) return false;
    transaction.update(ref, classe);
    return true;
  });
  if (!existe) return erreur(res, 404, 'CLASSE_ABSENTE', 'Classe introuvable.');
  res.json({ ...classe, id: ref.id });
});

routeClasses.delete('/:id', async (req, res) => {
  const ref = classes.doc(req.params.id);
  const supprime = await db.runTransaction(async transaction => {
    const dossiers = await transaction.get(eleves.where('classe_id', '==', ref.id).limit(1));
    const historique = await transaction.get(inscriptions.where('classe_id', '==', ref.id).limit(1));
    if (!dossiers.empty || !historique.empty) return false;
    transaction.delete(ref);
    return true;
  });
  if (!supprime) return erreur(res, 409, 'CLASSE_UTILISEE', 'Cette classe est utilisée par des dossiers ou des inscriptions.');
  res.status(204).end();
});

app.use('/api/classes', routeClasses);

const eleves = db.collection('eleves');
const annees = db.collection('anneesScolaires');
const inscriptions = db.collection('inscriptions');
const identifiantValide = valeur => typeof valeur === 'string' && idClasseValide(valeur);

function dateValide(valeur) {
  if (typeof valeur !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const date = new Date(valeur);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === valeur;
}

function validerEleve(body) {
  const donnees = body ?? {};
  const { sexe = null, date_naissance = null, classe_id = null } = donnees;
  const eleve = {
    nom: texte(donnees.nom, 120),
    prenom: texte(donnees.prenom, 120),
    lieu_naissance: texte(donnees.lieu_naissance ?? '', 120),
    adresse: texte(donnees.adresse ?? '', 240),
    telephone: texte(donnees.telephone ?? '', 50),
  };
  for (const champ of ['nom_pere', 'prenom_pere', 'nom_mere', 'prenom_mere', 'nom_tuteur', 'prenom_tuteur']) {
    if (Object.hasOwn(donnees, champ)) eleve[champ] = texte(donnees[champ], 120);
  }
  if (!eleve.nom || !eleve.prenom || Object.values(eleve).includes(null) ||
      (sexe !== null && !['Masculin', 'Féminin'].includes(sexe)) ||
      (date_naissance !== null && !dateValide(date_naissance)) ||
      (classe_id !== null && !identifiantValide(classe_id))) return null;
  return { ...eleve, sexe, date_naissance, classe_id };
}

function listeScolaire(collection) {
  return async (_req, res) => {
    const resultat = await collection.get();
    res.json(resultat.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  };
}

app.get('/api/eleves', identifier, autoriserGestionScolaire, listeScolaire(eleves));

async function enregistrerEleve(req, res) {
  const modification = req.method === 'PUT';
  const eleve = validerEleve(req.body);
  if (!eleve || (modification && !identifiantValide(req.params.id))) {
    return erreur(res, 400, 'ELEVE_INVALIDE', 'Vérifiez les champs du dossier de l’élève.');
  }
  const ref = modification ? eleves.doc(req.params.id) : eleves.doc();
  const resultat = await db.runTransaction(async transaction => {
    const courant = modification ? await transaction.get(ref) : null;
    if (modification && !courant.exists) return 'absent';
    if (eleve.classe_id && !(await transaction.get(classes.doc(eleve.classe_id))).exists) return 'classe';
    if (modification) transaction.update(ref, eleve);
    else transaction.create(ref, { ...eleve, matricule: '', statut: 'Non inscrit' });
    return 'ok';
  });
  if (resultat === 'absent') return erreur(res, 404, 'ELEVE_ABSENT', 'Élève introuvable.');
  if (resultat === 'classe') return erreur(res, 400, 'CLASSE_ABSENTE', 'Choisissez une classe existante.');
  res.status(modification ? 200 : 201).json({ id: ref.id });
}

app.post('/api/eleves', identifier, autoriserGestionEleves, enregistrerEleve);
app.put('/api/eleves/:id', identifier, autoriserGestionEleves, enregistrerEleve);
app.delete('/api/eleves/:id', identifier, autoriserGestionEleves, async (req, res) => {
  if (!identifiantValide(req.params.id)) return erreur(res, 400, 'ELEVE_ID', 'Identifiant invalide.');
  const ref = eleves.doc(req.params.id);
  const supprime = await db.runTransaction(async transaction => {
    const historique = await transaction.get(inscriptions.where('eleve_id', '==', ref.id).limit(1));
    const paiementsEcolage = await transaction.get(versementsEcolage.where('eleveId', '==', ref.id).limit(1));
    const paiementsFrais = await transaction.get(versementsFrais.where('eleveId', '==', ref.id).limit(1));
    if (!historique.empty || !paiementsEcolage.empty || !paiementsFrais.empty) return false;
    transaction.delete(ref);
    return true;
  });
  if (!supprime) return erreur(res, 409, 'ELEVE_INSCRIT', 'Cet élève possède un historique d’inscription ou de versement.');
  res.status(204).end();
});

app.post('/api/admin/eleves/:id/supprimer-test', identifier, administrateur, async (req, res) => {
  if (!identifiantValide(req.params.id) || req.body?.confirmation !== 'SUPPRIMER') {
    return erreur(res, 400, 'CONFIRMATION', 'Confirmez la suppression du dossier de test.');
  }
  const ref = eleves.doc(req.params.id);
  const resultat = await db.runTransaction(async transaction => {
    if (!(await transaction.get(ref)).exists) return 'absent';
    const limite = 450;
    const documents = [];
    for (const [collection, champ] of [
      [inscriptions, 'eleve_id'], [suiviEcolage, 'eleveId'], [versementsEcolage, 'eleveId'],
      [suiviFrais, 'eleveId'], [versementsFrais, 'eleveId'],
    ]) {
      const resultat = await transaction.get(collection.where(champ, '==', ref.id).limit(limite + 1));
      if (documents.length + resultat.size > limite) return 'limite';
      documents.push(...resultat.docs);
    }
    for (const document of documents) transaction.delete(document.ref);
    transaction.delete(ref);
    return 'ok';
  });
  if (resultat === 'absent') return erreur(res, 404, 'ELEVE_ABSENT', 'Élève introuvable.');
  if (resultat === 'limite') return erreur(res, 409, 'DOSSIER_VOLUMINEUX', 'Le dossier contient trop d’entrées pour cette suppression.');
  res.status(204).end();
});

app.get('/api/annees-scolaires', identifier, autoriserGestionScolaire, listeScolaire(annees));
app.put('/api/annees-scolaires/:id', identifier, autoriserGestionScolaire, async (req, res) => {
  const { nom, debut, fin, statut } = req.body ?? {};
  const libelle = texte(nom, 80);
  if (!identifiantValide(req.params.id) || !libelle || !dateValide(debut) || !dateValide(fin) ||
      fin < debut || !['Préparation', 'Active', 'Terminée'].includes(statut)) {
    return erreur(res, 400, 'ANNEE_INVALIDE', 'Vérifiez le nom, les dates et le statut de l’année.');
  }
  await annees.doc(req.params.id).set({ nom: libelle, debut, fin, statut });
  res.status(204).end();
});
app.delete('/api/annees-scolaires/:id', identifier, autoriserGestionScolaire, async (req, res) => {
  if (!identifiantValide(req.params.id)) return erreur(res, 400, 'ANNEE_ID', 'Identifiant invalide.');
  const ref = annees.doc(req.params.id);
  const supprime = await db.runTransaction(async transaction => {
    const historique = await transaction.get(inscriptions.where('annee_scolaire_id', '==', ref.id).limit(1));
    if (!historique.empty) return false;
    transaction.delete(ref);
    return true;
  });
  if (!supprime) return erreur(res, 409, 'ANNEE_UTILISEE', 'Cette année contient des inscriptions.');
  res.status(204).end();
});

app.patch('/api/annees-scolaires/:id/activation', identifier, autoriserGestionScolaire, async (req, res) => {
  if (!identifiantValide(req.params.id)) return erreur(res, 400, 'ANNEE_ID', 'Identifiant invalide.');
  const activee = await db.runTransaction(async transaction => {
    const resultat = await transaction.get(annees);
    if (!resultat.docs.some(doc => doc.id === req.params.id)) return false;
    for (const doc of resultat.docs) {
      transaction.update(doc.ref, { statut: doc.id === req.params.id ? 'Active' : 'Terminée' });
    }
    return true;
  });
  if (!activee) return erreur(res, 404, 'ANNEE_ABSENTE', 'Année introuvable.');
  res.status(204).end();
});

const formatMatriculeRef = configuration.doc('formatMatricule');
const compteurMatriculeRef = configuration.doc('compteurMatricule');
const formatMatriculeDefaut = { prefixe: 'SLG-', suffixe: '', chiffres: 5 };

function formatMatricule(document) {
  return document.data() ?? formatMatriculeDefaut;
}

app.get('/api/admin/matricules', identifier, administrateur, async (_req, res) => {
  res.json(formatMatricule(await formatMatriculeRef.get()));
});

app.put('/api/admin/matricules', identifier, administrateur, async (req, res) => {
  const { prefixe, suffixe, chiffres } = req.body ?? {};
  const segment = valeur => typeof valeur === 'string' && /^[A-Za-z0-9_-]{0,20}$/.test(valeur);
  if (!segment(prefixe) || !segment(suffixe) || !Number.isInteger(chiffres) || chiffres < 1 || chiffres > 10) {
    return erreur(res, 400, 'FORMAT_MATRICULE', 'Utilisez 1 à 10 chiffres et uniquement des lettres, chiffres, tirets ou soulignements dans le préfixe et le suffixe.');
  }
  const format = { prefixe, suffixe, chiffres };
  await formatMatriculeRef.set(format);
  res.json(format);
});

async function attribuerMatricule(transaction) {
  const [reglage, compteur] = await transaction.getAll(formatMatriculeRef, compteurMatriculeRef);
  const { prefixe, suffixe, chiffres } = formatMatricule(reglage);
  let numero = compteur.data()?.dernierNumero ?? 0;
  for (let tentative = 0; tentative < 100; tentative++) {
    numero++;
    if (!Number.isSafeInteger(numero)) return null;
    const matricule = `${prefixe}${String(numero).padStart(chiffres, '0')}${suffixe}`;
    const existe = await transaction.get(eleves.where('matricule', '==', matricule).limit(1));
    if (existe.empty) return { numero, matricule };
  }
  return null;
}

app.post('/api/inscriptions', identifier, autoriserGestionEleves, async (req, res) => {
  const { eleve_id, annee_scolaire_id, classe_id, type, nouvel_eleve, reglements } = req.body ?? {};
  const creation = nouvel_eleve !== undefined;
  const nouveau = creation ? validerEleve({ ...nouvel_eleve, classe_id }) : null;
  if (![annee_scolaire_id, classe_id].every(identifiantValide) ||
      (creation ? !nouveau || eleve_id !== undefined || type !== 'Nouvelle inscription' : !identifiantValide(eleve_id)) ||
      !['Nouvelle inscription', 'Réinscription'].includes(type)) {
    return erreur(res, 400, 'INSCRIPTION_INVALIDE', 'Choisissez un élève, une année et une classe.');
  }

  const droits = reglements?.droits ?? [];
  const moisEcolage = reglements?.mois ?? [];
  if (!Array.isArray(droits) || droits.length > 30 || !droits.every(identifiantValide) ||
      new Set(droits).size !== droits.length || !Array.isArray(moisEcolage) ||
      moisEcolage.length > 24 || !moisEcolage.every(moisValide) ||
      new Set(moisEcolage).size !== moisEcolage.length) {
    return erreur(res, 400, 'REGLEMENTS_INVALIDES', 'Vérifiez les tarifs et les mois sélectionnés.');
  }
  const dateVersement = calendrierEcolage.format(new Date());
  const eleve = creation ? eleves.doc() : eleves.doc(eleve_id);
  const ref = inscriptions.doc(JSON.stringify([eleve.id, annee_scolaire_id]));
  const result = await db.runTransaction(async transaction => {
    const [dossier, annee, classe, inscription] = await transaction.getAll(
      eleve, annees.doc(annee_scolaire_id), classes.doc(classe_id), ref
    );
    if ((!creation && !dossier.exists) || !annee.exists || !classe.exists) return 'absent';
    if (inscription.exists) return 'doublon';
    const matriculeExistant = String(dossier.data()?.matricule ?? '');
    const attribution = matriculeExistant.trim() ? null : await attribuerMatricule(transaction);
    if (!matriculeExistant.trim() && !attribution) return 'matricule';
    const matricule = attribution?.matricule ?? matriculeExistant;
    const dossierEleve = nouveau ?? dossier.data();
    const classeChoisie = classe.data();
    const paiements = [];
    for (const tarifId of droits) {
      const solde = suiviFrais.doc(JSON.stringify([tarifId, eleve.id]));
      const [tarifDoc, suivi] = await transaction.getAll(tarifsScolaires.doc(tarifId), solde);
      const tarif = tarifDoc.data();
      if (tarif?.categorie !== 'inscription' ||
          (!suivi.exists && !tarifApplicable(tarif, dossierEleve, classeChoisie))) return 'tarif';
      if (droitGeneral(tarif) && cycleAvecDroit((await transaction.get(droitsInscription)).docs, classeChoisie)) return 'tarif';
      const du = suivi.data()?.du ?? tarif.montant;
      const valeur = du - (suivi.data()?.paye ?? 0);
      if (!Number.isSafeInteger(valeur) || valeur < 0) return 'tarif';
      if (!valeur) continue;
      const suiviRegle = { tarifId, eleveId: eleve.id, du, paye: du };
      paiements.push({
        solde, suiviRegle, versement: versementsFrais.doc(),
        donnees: { tarifId, eleveId: eleve.id, valeur },
      });
    }
    if (moisEcolage.length) {
      const { debut, fin } = annee.data();
      if (!dateValide(debut) || !dateValide(fin) || moisEcolage.some(mois =>
        mois < debut.slice(0, 7) || mois > fin.slice(0, 7))) return 'mois';
      const [tarifs, reglage] = await Promise.all([
        transaction.get(tarifsEcolage), transaction.get(echeanceEcolageRef),
      ]);
      const tarif = trouverTarifEcolage(tarifs.docs, classeChoisie.niveau);
      for (const mois of moisEcolage) {
        const solde = suiviEcolage.doc(`${mois}_${eleve.id}`);
        const suivi = (await transaction.get(solde)).data();
        const du = suivi?.du ?? tarif.du;
        const montant = du - (suivi?.paye ?? 0);
        if (du == null || !Number.isSafeInteger(montant) || montant < 0) return 'tarif';
        if (!montant) continue;
        const echeance = echeanceMensuelle(mois, lireJourEcheance(reglage));
        const moment = dateVersement < `${mois}-01` ? 'avance' : dateVersement > echeance ? 'retard' : 'delai';
        paiements.push({
          solde, versement: versementsEcolage.doc(),
          suiviRegle: { mois, eleveId: eleve.id, du, paye: du, dernierVersement: { date: dateVersement, moment } },
          donnees: { mois, eleveId: eleve.id, montant, echeance, date: dateVersement, moment },
        });
      }
    }
    for (const { solde, suiviRegle, versement, donnees } of paiements) {
      transaction.set(solde, suiviRegle);
      transaction.create(versement, { ...donnees, saisiPar: req.identite.uid, creeLe: FieldValue.serverTimestamp() });
    }
    if (attribution) transaction.set(compteurMatriculeRef, { dernierNumero: attribution.numero });
    transaction.create(ref, { eleve_id: eleve.id, annee_scolaire_id, classe_id, type: !creation && matriculeExistant.trim() ? 'Réinscription' : type, creeLe: FieldValue.serverTimestamp() });
    if (creation) transaction.create(eleve, { ...nouveau, matricule, statut: 'Inscrit' });
    else transaction.update(eleve, { classe_id, statut: 'Inscrit', ...(attribution ? { matricule } : {}) });
    return { matricule };
  });
  if (result === 'mois') return erreur(res, 400, 'MOIS_INSCRIPTION', 'Les mois doivent appartenir à l’année scolaire choisie.');
  if (result === 'tarif') return erreur(res, 409, 'TARIF_INSCRIPTION', 'Un règlement sélectionné ne correspond plus au tarif applicable.');
  if (result === 'absent') return erreur(res, 404, 'INSCRIPTION_ABSENTE', 'Élève, année ou classe introuvable.');
  if (result === 'doublon') return erreur(res, 409, 'INSCRIPTION_EXISTANTE', 'Cet élève est déjà inscrit pour cette année.');
  if (result === 'matricule') return erreur(res, 409, 'MATRICULE_INDISPONIBLE', 'Impossible de trouver un matricule libre. Vérifiez le format dans Configuration.');
  res.status(201).json({ id: ref.id, matricule: result.matricule });
});

const tarifsScolaires = db.collection('tarifsScolaires');
const suiviFrais = db.collection('suiviFraisScolaires');
const versementsFrais = db.collection('versementsFraisScolaires');
const categoriesTarifs = ['ecolage', 'inscription', 'infrastructure', 'divers'];

app.get('/api/tarifs-scolaires', identifier, autoriserGestionScolaire, listeScolaire(tarifsScolaires));

async function enregistrerTarif(req, res) {
  const { categorie, portee, cible, montant, typeContribution = 'argent', quantite, unite } = req.body ?? {};
  const libelle = texte(req.body?.libelle, 120);
  const beneficiaires = portee === 'tous' ? '' : texte(cible, 120);
  const modification = req.method === 'PUT';
  const debutPaiement = categorie === 'ecolage' ? '' : (req.body?.debutPaiement ?? '');
  const finPaiement = categorie === 'ecolage' ? '' : (req.body?.finPaiement ?? '');
  if ((debutPaiement && !dateValide(debutPaiement)) || (finPaiement && !dateValide(finPaiement)) ||
      (debutPaiement && (!finPaiement || debutPaiement > finPaiement)) ||
      typeof debutPaiement !== 'string' || typeof finPaiement !== 'string') {
    return erreur(res, 400, 'PERIODE_TARIF', 'Indiquez une date limite et vérifiez l’ordre des dates.');
  }
  const enNature = typeContribution === 'nature';
  const uniteValide = enNature ? texte(unite, 40) : null;
  const contributionValide = enNature
    ? categorie === 'divers' && Number.isFinite(quantite) && quantite > 0 && quantite <= Number.MAX_SAFE_INTEGER && Boolean(uniteValide)
    : typeContribution === 'argent' && Number.isSafeInteger(montant) && montant >= 0;
  if (!categoriesTarifs.includes(categorie) || !libelle ||
      !['tous', 'niveau', 'personnalisee', 'cycle'].includes(portee) ||
      (portee === 'cycle' && (categorie !== 'inscription' || !cyclesScolaires.includes(beneficiaires))) ||
      (portee !== 'tous' && !beneficiaires) || !contributionValide || (modification && !identifiantValide(req.params.id))) {
    return erreur(res, 400, 'TARIF_INVALIDE', 'Vérifiez la catégorie, le libellé, la contribution et l’application du tarif.');
  }
  const tarif = {
    categorie, libelle, portee, cible: beneficiaires, typeContribution, debutPaiement, finPaiement,
    montant: enNature ? null : montant,
    quantite: enNature ? quantite : null,
    unite: uniteValide,
  };
  const ref = modification ? tarifsScolaires.doc(req.params.id) : tarifsScolaires.doc();
  if (modification) {
    const resultat = await db.runTransaction(async transaction => {
      const courant = await transaction.get(ref);
      if (!courant.exists) return 'absent';
      const precedent = courant.data();
      const champs = ['categorie', 'portee', 'cible', 'typeContribution', 'montant', 'quantite', 'unite'];
      const modifie = champs.some(cle => (precedent[cle] ?? (cle === 'typeContribution' ? 'argent' : null)) !== tarif[cle]);
      if (modifie) {
        const historique = await transaction.get(versementsFrais.where('tarifId', '==', ref.id).limit(1));
        if (!historique.empty) return 'utilise';
      }
      transaction.update(ref, tarif);
      return 'ok';
    });
    if (resultat === 'absent') return erreur(res, 404, 'TARIF_ABSENT', 'Ce tarif n’existe plus.');
    if (resultat === 'utilise') return erreur(res, 409, 'TARIF_UTILISE', 'Ce tarif a déjà des versements. Créez un nouveau tarif pour changer le montant ou les bénéficiaires.');
  } else {
    await ref.create(tarif);
  }
  res.status(modification ? 200 : 201).json({ ...tarif, id: ref.id });
}

app.post('/api/tarifs-scolaires', identifier, administrateur, enregistrerTarif);
app.put('/api/tarifs-scolaires/grille', identifier, administrateur, async (req, res) => {
  const { categorie, lignes, debutPaiement = '', finPaiement = '' } = req.body ?? {};
  if (!['ecolage', 'inscription'].includes(categorie) || !Array.isArray(lignes) ||
      !lignes.length || lignes.length > 100 || lignes.some(ligne =>
        !texte(ligne?.cible, 120) || !Number.isSafeInteger(ligne.montant) || ligne.montant < 0) ||
      new Set(lignes.map(ligne => normaliserNiveau(ligne.cible))).size !== lignes.length ||
      (debutPaiement && (!dateValide(debutPaiement) || !finPaiement || debutPaiement > finPaiement)) ||
      (finPaiement && !dateValide(finPaiement))) {
    return erreur(res, 400, 'GRILLE_TARIFS', 'Vérifiez les montants, les cibles et la période.');
  }
  const mensualite = categorie === 'ecolage';
  const portee = mensualite ? 'niveau' : 'cycle';
  const resultat = await db.runTransaction(async transaction => {
    const [existants, listeClasses] = await Promise.all([
      transaction.get(tarifsScolaires.where('categorie', '==', categorie)),
      mensualite ? transaction.get(classes) : null,
    ]);
    const cibles = mensualite ? listeClasses.docs.map(doc => doc.data().niveau) : cyclesScolaires;
    const changements = [];
    for (const { cible, montant } of lignes) {
      const cle = normaliserNiveau(cible);
      const cibleValide = cibles.find(valeur => normaliserNiveau(valeur) === cle);
      if (!cibleValide) return { erreur: `Cible inconnue : ${cible}.` };
      const correspondances = existants.docs.filter(doc =>
        doc.data().portee === portee && normaliserNiveau(doc.data().cible) === cle);
      if (correspondances.length > 1) return { erreur: `Plusieurs tarifs existent pour ${cible}. Vérifiez-les dans la liste.` };
      const ancien = correspondances[0];
      if (!mensualite && ancien && ancien.data().montant !== montant) {
        const historique = await transaction.get(versementsFrais.where('tarifId', '==', ancien.id).limit(1));
        if (!historique.empty) return { erreur: `Le tarif de ${cible} a déjà des versements. Son montant est conservé.` };
      }
      const ref = ancien?.ref ?? tarifsScolaires.doc();
      const tarif = { categorie, portee, cible: cibleValide, montant,
        libelle: ancien?.data().libelle ?? (mensualite ? 'Écolage' : 'Droits d’inscription'),
        typeContribution: 'argent', quantite: null, unite: null,
        debutPaiement: mensualite ? '' : finPaiement ? debutPaiement : ancien?.data().debutPaiement ?? '',
        finPaiement: mensualite ? '' : finPaiement || ancien?.data().finPaiement || '' };
      changements.push({ ref, tarif });
    }
    for (const { ref, tarif } of changements) transaction.set(ref, tarif, { merge: true });
    return { tarifs: changements.map(({ ref, tarif }) => ({ ...tarif, id: ref.id })) };
  });
  if (resultat.erreur) return erreur(res, 409, 'GRILLE_TARIFS', resultat.erreur);
  return res.json(resultat.tarifs);
});

app.put('/api/tarifs-scolaires/:id', identifier, administrateur, enregistrerTarif);
app.delete('/api/tarifs-scolaires/:id', identifier, administrateur, async (req, res) => {
  if (!identifiantValide(req.params.id)) return erreur(res, 400, 'TARIF_ID', 'Identifiant de tarif invalide.');
  const ref = tarifsScolaires.doc(req.params.id);
  const supprime = await db.runTransaction(async transaction => {
    const historique = await transaction.get(versementsFrais.where('tarifId', '==', ref.id).limit(1));
    if (!historique.empty) return false;
    transaction.delete(ref);
    return true;
  });
  if (!supprime) return erreur(res, 409, 'TARIF_UTILISE', 'Ce tarif a déjà des versements enregistrés.');
  res.status(204).end();
});

const suiviEcolage = db.collection('suiviEcolage');
const versementsEcolage = db.collection('versementsEcolage');
const tarifsEcolage = tarifsScolaires.where('categorie', '==', 'ecolage');
const moisValide = mois => typeof mois === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(mois);
const normaliserNiveau = valeur => String(valeur ?? '').normalize('NFD')
  .replace(/\p{Diacritic}|\s/gu, '').toLowerCase().replace(/^(\d+)eme$/, '$1e');

const echeanceEcolageRef = configuration.doc('echeanceEcolage');
const calendrierEcolage = new Intl.DateTimeFormat('fr-CA', {
  timeZone: 'Indian/Antananarivo', year: 'numeric', month: '2-digit', day: '2-digit',
});

function echeanceMensuelle(mois, jour) {
  const [annee, numeroMois] = mois.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(annee, numeroMois, 0);
  return `${mois}-${String(Math.min(jour, date.getUTCDate())).padStart(2, '0')}`;
}

function lireJourEcheance(document) {
  return document.data()?.jour ?? 10;
}

app.get('/api/admin/echeance-ecolage', identifier, administrateur, async (_req, res) => {
  res.json({ jour: lireJourEcheance(await echeanceEcolageRef.get()) });
});

app.put('/api/admin/echeance-ecolage', identifier, administrateur, async (req, res) => {
  const { jour } = req.body ?? {};
  if (!Number.isInteger(jour) || jour < 1 || jour > 31) {
    return erreur(res, 400, 'ECHEANCE', 'Choisissez un jour entre 1 et 31.');
  }
  await echeanceEcolageRef.set({ jour });
  res.json({ jour });
});

async function autoriserEncaissement(req, res, next) {
  const { uid, email, email_verified: emailVerifie } = req.identite;
  if (uid === ADMIN_UID) return next();
  const profil = (await demandes.doc(uid).get()).data();
  if (emailVerifie && profil?.email === email && profil?.statut === 'approuve' && profil.role === 'econome') {
    return next();
  }
  return erreur(res, 403, 'ECOLAGE_ACCES', 'Accès réservé à l’administration et à l’économat.');
}

function trouverTarifEcolage(documents, niveau) {
  const tarifs = documents.map(doc => doc.data()).filter(tarif =>
    tarif.typeContribution !== 'nature' && Number.isSafeInteger(tarif.montant) && tarif.montant >= 0
  );
  const cibles = tarifs.filter(tarif => niveau && tarif.portee === 'niveau' &&
    normaliserNiveau(tarif.cible) === normaliserNiveau(niveau));
  const choix = cibles.length ? cibles : tarifs.filter(tarif => tarif.portee === 'tous');
  return { du: choix.length === 1 ? choix[0].montant : null, ambigu: choix.length > 1 };
}

app.get('/api/ecolage', identifier, autoriserEncaissement, async (req, res) => {
  const { mois } = req.query;
  if (!moisValide(mois)) return erreur(res, 400, 'MOIS', 'Choisissez un mois valide.');
  const [dossiers, listeClasses, tarifs, suivis, reglage] = await Promise.all([
    eleves.get(), classes.get(), tarifsEcolage.get(), suiviEcolage.where('mois', '==', mois).get(), echeanceEcolageRef.get(),
  ]);
  const aujourdhui = calendrierEcolage.format(new Date());
  const echeance = echeanceMensuelle(mois, lireJourEcheance(reglage));
  const classesParId = new Map(listeClasses.docs.map(doc => [doc.id, doc.data()]));
  const suivisParEleve = new Map(suivis.docs.map(doc => [doc.data().eleveId, doc.data()]));
  const lignes = dossiers.docs.map(doc => {
    const eleve = doc.data();
    const classe = classesParId.get(eleve.classe_id);
    const niveau = classe?.niveau ?? '';
    const suivi = suivisParEleve.get(doc.id);
    const tarif = trouverTarifEcolage(tarifs.docs, niveau);
    return {
      id: doc.id, nom: eleve.nom, prenom: eleve.prenom, matricule: eleve.matricule ?? '',
      classe: classe?.nom ?? '', niveau, du: suivi?.du ?? (classe ? tarif.du : null),
      paye: suivi?.paye ?? 0, dernierVersement: suivi?.dernierVersement ?? null, ambigu: !suivi && Boolean(classe) && tarif.ambigu,
    };
  });
  lignes.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'));
  res.json({ lignes, echeance, echeanceDepassee: aujourdhui > echeance });
});

app.post('/api/ecolage/versements', identifier, autoriserEncaissement, async (req, res) => {
  const { mois, eleveId, montant, operationId } = req.body ?? {};
  if (!moisValide(mois) || !identifiantValide(eleveId) ||
      !identifiantValide(operationId) || !Number.isSafeInteger(montant) || montant <= 0) {
    return erreur(res, 400, 'VERSEMENT', 'Vérifiez le mois, l’élève et le montant du versement.');
  }
  const suiviRef = suiviEcolage.doc(`${mois}_${eleveId}`);
  const versementRef = versementsEcolage.doc(operationId);
  const dateVersement = calendrierEcolage.format(new Date());
  const resultat = await db.runTransaction(async transaction => {
    const precedent = await transaction.get(versementRef);
    if (precedent.exists) {
      const versement = precedent.data();
      return versement.mois === mois && versement.eleveId === eleveId && versement.montant === montant
        ? 'ok' : 'operation';
    }
    const [dossier, suivi, reglage] = await transaction.getAll(eleves.doc(eleveId), suiviRef, echeanceEcolageRef);
    if (!dossier.exists) return 'eleve';
    const eleve = dossier.data();
    let du = suivi.data()?.du;
    const paye = suivi.data()?.paye ?? 0;
    if (du == null) {
      if (!identifiantValide(eleve.classe_id)) return 'tarif';
      const classe = await transaction.get(classes.doc(eleve.classe_id));
      if (!classe.exists) return 'tarif';
      const tarifs = await transaction.get(tarifsEcolage);
      du = trouverTarifEcolage(tarifs.docs, classe.data().niveau).du;
    }
    if (du == null) return 'tarif';
    if (montant > du - paye) return 'solde';
    const echeance = echeanceMensuelle(mois, lireJourEcheance(reglage));
    const moment = dateVersement < `${mois}-01` ? 'avance'
      : dateVersement > echeance ? 'retard' : 'delai';
    const dernierVersement = { date: dateVersement, moment };
    transaction.set(suiviRef, { mois, eleveId, du, paye: paye + montant, dernierVersement });
    transaction.create(versementRef, {
      mois, eleveId, montant, echeance, date: dateVersement, moment, saisiPar: req.identite.uid, creeLe: FieldValue.serverTimestamp(),
    });
    return 'ok';
  });
  if (resultat === 'eleve') return erreur(res, 404, 'ELEVE_ABSENT', 'Élève introuvable.');
  if (resultat === 'tarif') return erreur(res, 409, 'TARIF_ECOLAGE', 'Configurez un tarif d’écolage unique applicable à cet élève.');
  if (resultat === 'solde') return erreur(res, 409, 'SOLDE_ECOLAGE', 'Le montant dépasse le reste à payer. Actualisez la liste.');
  if (resultat === 'operation') return erreur(res, 409, 'OPERATION', 'Ce versement a déjà été traité avec des informations différentes.');
  res.status(201).json({ id: operationId });
});

function tarifApplicable(tarif, eleve, classe) {
  if (tarif.portee === 'tous') return true;
  if (tarif.portee === 'cycle') return Boolean(classe?.cycle) &&
    normaliserNiveau(classe.cycle) === normaliserNiveau(tarif.cible);
  if (tarif.portee === 'niveau') {
    return Boolean(classe?.niveau) && normaliserNiveau(classe.niveau) === normaliserNiveau(tarif.cible);
  }
  return tarif.portee === 'personnalisee' && Array.isArray(eleve.groupes) &&
    eleve.groupes.some(groupe => normaliserNiveau(groupe) === normaliserNiveau(tarif.cible));
}

const droitGeneral = tarif => tarif.categorie === 'inscription' && tarif.portee === 'tous';
const droitsInscription = tarifsScolaires.where('categorie', '==', 'inscription');

function cycleAvecDroit(documents, classe) {
  return documents.some(doc => doc.data().portee === 'cycle' && tarifApplicable(doc.data(), null, classe));
}

app.get('/api/eleves/situation-paiements', identifier, autoriserEncaissement, async (req, res) => {
  const { eleveId, classeId, mois } = req.query;
  const moisDemandes = typeof mois === 'string' ? mois.split(',') : [];
  if (!identifiantValide(classeId) || !moisDemandes.length || moisDemandes.length > 24 ||
      !moisDemandes.every(moisValide) ||
      (eleveId !== undefined && !identifiantValide(eleveId))) {
    return erreur(res, 400, 'SITUATION_PAIEMENTS', 'Choisissez une classe et un mois valides.');
  }

  const [classeDoc, eleveDoc, droits, tarifs, suiviMensuel, suivisFrais] = await Promise.all([
    classes.doc(classeId).get(),
    eleveId ? eleves.doc(eleveId).get() : null,
    droitsInscription.get(),
    tarifsEcolage.get(),
    eleveId ? db.getAll(...moisDemandes.map(m => suiviEcolage.doc(`${m}_${eleveId}`))) : [],
    eleveId ? suiviFrais.where('eleveId', '==', eleveId).get() : null,
  ]);
  if (!classeDoc.exists || (eleveDoc && !eleveDoc.exists)) {
    return erreur(res, 404, 'DOSSIER_ABSENT', 'Classe ou élève introuvable.');
  }

  const classe = classeDoc.data();
  const eleve = eleveDoc?.data() ?? {};
  const suivis = new Map((suivisFrais?.docs ?? []).map(doc => [doc.data().tarifId, doc.data()]));
  const droitParCycle = cycleAvecDroit(droits.docs, classe);
  const inscriptions = droits.docs.flatMap(doc => {
    const tarif = doc.data();
    const suivi = suivis.get(doc.id);
    if (droitParCycle && tarif.portee === 'tous') return [];
    if (!suivi && !tarifApplicable(tarif, eleve, classe)) return [];
    return [{
      id: doc.id,
      libelle: tarif.libelle,
      du: suivi?.du ?? tarif.montant,
      paye: suivi?.paye ?? 0,
    }];
  });
  const tarif = trouverTarifEcolage(tarifs.docs, classe.niveau);
  const mensualites = moisDemandes.map((mois, index) => {
    const suivi = suiviMensuel[index]?.data();
    return { mois, du: suivi?.du ?? tarif.du, paye: suivi?.paye ?? 0, ambigu: !suivi && tarif.ambigu };
  });
  return res.json({ inscriptions, ecolage: mensualites[0], mensualites });
});

app.get('/api/frais-scolaires/:tarifId/suivi', identifier, autoriserEncaissement, async (req, res) => {
  const { tarifId } = req.params;
  if (!identifiantValide(tarifId)) return erreur(res, 400, 'TARIF_ID', 'Identifiant invalide.');
  const [document, dossiers, listeClasses, suivis] = await Promise.all([
    tarifsScolaires.doc(tarifId).get(), eleves.get(), classes.get(),
    suiviFrais.where('tarifId', '==', tarifId).get(),
  ]);
  const tarif = document.data();
  if (!tarif || tarif.categorie === 'ecolage') return erreur(res, 404, 'TARIF_ABSENT', 'Choisissez un frais existant hors écolage.');
  const droitsParCycle = droitGeneral(tarif) ? (await droitsInscription.get()).docs : [];
  const classeParId = new Map(listeClasses.docs.map(doc => [doc.id, doc.data()]));
  const suiviParEleve = new Map(suivis.docs.map(doc => [doc.data().eleveId, doc.data()]));
  const lignes = [];
  for (const doc of dossiers.docs) {
    const eleve = doc.data();
    const classe = classeParId.get(eleve.classe_id);
    const suivi = suiviParEleve.get(doc.id);
    if (!suivi && (!tarifApplicable(tarif, eleve, classe) || cycleAvecDroit(droitsParCycle, classe))) continue;
    const du = suivi?.du ?? (tarif.typeContribution === 'nature' ? tarif.quantite : tarif.montant);
    const paye = suivi?.paye ?? 0;
    const reste = Math.max(0, tarif.typeContribution === 'nature' ? Number((du - paye).toPrecision(15)) : du - paye);
    lignes.push({
      id: doc.id, nom: eleve.nom, prenom: eleve.prenom, matricule: eleve.matricule ?? '',
      classe: classe?.nom ?? '', niveau: classe?.niveau ?? '', du, paye, reste,
    });
  }
  lignes.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'));
  res.json({ lignes, enRetard: Boolean(tarif.finPaiement && calendrierEcolage.format(new Date()) > tarif.finPaiement) });
});

app.post('/api/frais-scolaires/:tarifId/versements', identifier, autoriserEncaissement, async (req, res) => {
  const { tarifId } = req.params;
  const { eleveId, operationId, valeur } = req.body ?? {};
  if (![tarifId, eleveId, operationId].every(identifiantValide) || !Number.isFinite(valeur) || valeur <= 0) {
    return erreur(res, 400, 'VERSEMENT', 'Vérifiez l’élève et la valeur du versement.');
  }
  const versement = versementsFrais.doc(operationId);
  const solde = suiviFrais.doc(JSON.stringify([tarifId, eleveId]));
  const resultat = await db.runTransaction(async transaction => {
    const [ancien, document, dossier, suivi] = await transaction.getAll(
      versement, tarifsScolaires.doc(tarifId), eleves.doc(eleveId), solde);
    if (ancien.exists) {
      const precedent = ancien.data();
      return precedent.tarifId === tarifId && precedent.eleveId === eleveId && precedent.valeur === valeur
        ? 'ok' : 'operation';
    }
    const tarif = document.data();
    const eleve = dossier.data();
    if (!tarif || tarif.categorie === 'ecolage' || !eleve) return 'absent';
    if (!suivi.exists) {
      const classe = identifiantValide(eleve.classe_id)
        ? (await transaction.get(classes.doc(eleve.classe_id))).data() : null;
      if (!tarifApplicable(tarif, eleve, classe) || (droitGeneral(tarif) &&
          cycleAvecDroit((await transaction.get(droitsInscription)).docs, classe))) return 'cible';
    }
    const nature = tarif.typeContribution === 'nature';
    if (!nature && !Number.isSafeInteger(valeur)) return 'invalide';
    const du = suivi.data()?.du ?? (nature ? tarif.quantite : tarif.montant);
    const total = (suivi.data()?.paye ?? 0) + valeur;
    const paye = nature ? Number(total.toPrecision(15)) : total;
    if (paye > du || paye <= (suivi.data()?.paye ?? 0)) return 'solde';
    transaction.set(solde, { tarifId, eleveId, du, paye });
    transaction.create(versement, { tarifId, eleveId, valeur, saisiPar: req.identite.uid, creeLe: FieldValue.serverTimestamp() });
    return 'ok';
  });
  if (resultat !== 'ok') {
    const messages = { operation: 'Versement déjà traité avec d’autres données.', absent: 'Tarif ou élève introuvable.',
      cible: 'Ce tarif ne s’applique pas à cet élève.', invalide: 'Saisissez un montant entier en ariary.',
      solde: 'Vérifiez la valeur du versement et le reste dû.' };
    return erreur(res, 409, 'VERSEMENT', messages[resultat]);
  }
  res.status(201).json({ id: operationId });
});

app.use((err, _req, res, _next) => {
  if (err.status === 400 || err.status === 413) {
    return erreur(res, err.status, 'REQUETE', 'Requête invalide ou trop volumineuse.');
  }
  console.error(err.code ?? err.name, err.message);
  erreur(res, 500, 'SERVEUR', 'Service momentanément indisponible.');
});

await auth.getUser(ADMIN_UID);
await demandes.limit(1).get();
app.listen(Number(PORT), process.env.HOST || '127.0.0.1', () => console.log(`API sur le port ${PORT}`));
