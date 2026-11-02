// Classement local (navigateur). Pour un classement partagé entre plusieurs
// machines, il faudra un petit backend (ex. Supabase / Firebase) : voir backlog.

const BOARD_KEY = 'nuit-blanche-g4:leaderboard';
const MAX_ENTRIES = 10;

/** Score sur 1000 : on part de 1000 et on retire le temps, les indices et les erreurs. */
export function computeScore({ success, minutes, hintsUsed, errors }) {
  if (!success) return 0;
  return Math.max(0, Math.round(1000 - minutes - hintsUsed * 50 - errors * 30));
}

export function loadBoard() {
  try {
    return JSON.parse(localStorage.getItem(BOARD_KEY)) || [];
  } catch {
    return [];
  }
}

export function addEntry(entry) {
  const board = [...loadBoard(), entry]
    .sort((a, b) => b.score - a.score || a.realSeconds - b.realSeconds)
    .slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(BOARD_KEY, JSON.stringify(board));
  } catch {
    /* stockage indisponible */
  }
  return board;
}
