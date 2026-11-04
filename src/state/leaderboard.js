// Classement local (navigateur). Pour un classement partagé entre plusieurs
// machines, il faudra un petit backend (ex. Supabase / Firebase) : voir backlog.

const BOARD_KEY = 'nuit-blanche-g4:leaderboard'; // nom du classement dans localStorage (la mémoire du navigateur)
const MAX_ENTRIES = 10; // on garde 10 scores au maximum

/** Score sur 1000 : on part de 1000 et on retire le temps, les indices et les erreurs. */
export function computeScore({ success, minutes, hintsUsed, errors }) { // calcule le score de la partie
  if (!success) return 0; // partie perdue : 0 point
  return Math.max(0, Math.round(1000 - minutes - hintsUsed * 50 - errors * 30)); // 1000 moins temps, indices et erreurs (jamais sous 0)
}

export function loadBoard() { // lit le classement
  try { // on essaie :
    return JSON.parse(localStorage.getItem(BOARD_KEY)) || []; // on lit le classement, sinon liste vide
  } catch { // si ça rate :
    return []; // liste vide
  }
}

export function addEntry(entry) { // ajoute un score au classement
  const board = [...loadBoard(), entry] // les anciens scores + le nouveau
    .sort((a, b) => b.score - a.score || a.realSeconds - b.realSeconds) // tri : meilleur score d'abord, puis le plus rapide
    .slice(0, MAX_ENTRIES); // on garde les 10 premiers
  try { // on essaie :
    localStorage.setItem(BOARD_KEY, JSON.stringify(board)); // on enregistre le classement dans le navigateur
  } catch { // si ça rate :
    /* stockage indisponible */
  }
  return board; // on renvoie le classement
}
