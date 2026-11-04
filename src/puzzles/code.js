// Assemble le code de sortie à partir des 5 énigmes.
import { solveLogic } from './logique.js'; // calcule le chiffre de Mont Ventoux
import { runProgram } from './algorithmique.js'; // calcule le chiffre de Callelongue
import { criticalPathLength } from './planning.js'; // calcule le chiffre de Ste Victoire
import { solveObservation } from './observation.js'; // calcule le chiffre de Sormiou
import { servingOrder } from './ordre.js'; // trouve l'ordre des chiffres (énigme du repas)

export const ROOM_DIGITS = { // le chiffre trouvé dans chaque salle
  ventoux: solveLogic(), // chiffre de Mont Ventoux
  callelongue: runProgram(), // chiffre de Callelongue
  stevictoire: criticalPathLength(), // chiffre de Ste Victoire
  sormiou: solveObservation(), // chiffre de Sormiou
};

export const CODE_ORDER = servingOrder(ROOM_DIGITS); // l'ordre des salles dans le code final

export const EXIT_CODE = CODE_ORDER.map((room) => ROOM_DIGITS[room]).join(''); // on colle les 4 chiffres : le code de sortie
