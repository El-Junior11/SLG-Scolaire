import { lireModule, enregistrerModule } from "./stockageDemonstration";

export const lireBulletins = () => lireModule("bulletins");

export const cleBulletin = (eleveId, anneeId, trimestre) =>
  JSON.stringify([String(eleveId), String(anneeId), trimestre]);

export function archiverBulletins(resultats, annee, trimestre) {
  if (!annee?.id || !annee.nom) {
    throw new Error("Une année scolaire active avec identifiant est requise.");
  }

  const archives = lireBulletins();
  const nouveaux = [];

  for (const e of resultats) {
    if (e.id == null || e.moyenne == null || !Number.isFinite(e.moyenne)) continue;

    const id = cleBulletin(e.id, annee.id, trimestre);

    if (archives.some(b => b.id === id) || nouveaux.some(b => b.id === id)) continue;

    nouveaux.push({
      ...structuredClone(e),
      id,
      eleveId: e.id,
      anneeId: annee.id,
      annee: annee.nom,
      trimestre,
      dateValidation: new Date().toISOString(),
      statut: "valide"
    });
  }

  enregistrerModule("bulletins", [...archives, ...nouveaux]);
  return nouveaux.length;
}