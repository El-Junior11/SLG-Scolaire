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
