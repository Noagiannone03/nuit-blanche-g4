// Callelongue — ALGORITHMIQUE / CODE
// Le joueur doit dérouler ce programme à la main et dire ce qu'il affiche.

// le programme en pseudo-code, tel qu'il est affiché au joueur (texte sur plusieurs lignes)
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
export function runProgram() { // exécute le programme et renvoie le résultat
  let nombre = 3; // nombre vaut 3
  nombre = nombre + 2; // on ajoute 2
  if (nombre > 6) nombre = nombre - 3; // si nombre est plus grand que 6, on enlève 3
  else nombre = nombre * 2; // sinon on le multiplie par 2
  nombre = nombre - 4; // on enlève 4
  if (nombre % 2 === 0) nombre = nombre / 2; // si nombre est pair, on le divise par 2
  else nombre = nombre + 1; // sinon on ajoute 1
  return nombre; // on renvoie le résultat final
}

// Mot de passe du PC, trouvé dans la salle Sormiou
export const PC_PASSWORD = 'CERCLE26'; // le mot de passe du PC
