// Callelongue — ALGORITHMIQUE / CODE
// Le joueur doit dérouler ce programme à la main et dire ce qu'il affiche.

export const PSEUDO_CODE = `x ← 0
POUR i DE 1 À 5 FAIRE
    SI i est pair ALORS
        x ← x + i
    SINON
        x ← x - 1
    FIN SI
FIN POUR
AFFICHER x`;

// Le même programme en JavaScript : la réponse attendue est calculée, pas recopiée.
export function runProgram() {
  let x = 0;
  for (let i = 1; i <= 5; i++) {
    if (i % 2 === 0) x = x + i;
    else x = x - 1;
  }
  return x;
}

// Mot de passe du PC, trouvé dans la salle Sormiou
export const PC_PASSWORD = 'CERCLE26';
