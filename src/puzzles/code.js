// Assemble le code de sortie à partir des 5 énigmes.
import { solveLogic } from './logique.js';
import { runProgram } from './algorithmique.js';
import { criticalPathLength } from './planning.js';
import { solveObservation } from './observation.js';
import { servingOrder } from './ordre.js';

export const ROOM_DIGITS = {
  ventoux: solveLogic(),
  callelongue: runProgram(),
  stevictoire: criticalPathLength(),
  sormiou: solveObservation(),
};

export const CODE_ORDER = servingOrder(ROOM_DIGITS);

export const EXIT_CODE = CODE_ORDER.map((room) => ROOM_DIGITS[room]).join('');
