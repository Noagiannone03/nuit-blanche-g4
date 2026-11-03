// Callelongue — ALGORITHMIQUE / CODE
// Le joueur doit dérouler ce programme à la main et dire ce qu'il affiche.

export const PSEUDO_CODE = `DEBUT
    nombre ← 3
    nombre ← nombre + 2
    SI nombre > 6 ALORS
        nombre ← nombre - 3
    SINON
        nombre ← nombre × 2
    FIN SI
    nombre ← nombre - 4
    SI nombre est pair ALORS
        nombre ← nombre / 2
    SINON
        nombre ← nombre + 1
    FIN SI
    AFFICHER nombre
FIN`;

// Le même programme en JavaScript : la réponse attendue est calculée, pas recopiée.
export function runProgram() {
  let nombre = 3;
  nombre = nombre + 2;
  if (nombre > 6) nombre = nombre - 3;
  else nombre = nombre * 2;
  nombre = nombre - 4;
  if (nombre % 2 === 0) nombre = nombre / 2;
  else nombre = nombre + 1;
  return nombre;
}

// Mot de passe du PC, trouvé dans la salle Sormiou
export const PC_PASSWORD = 'CERCLE26';
