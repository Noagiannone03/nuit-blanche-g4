import { state } from './GameState.js';
import { GUARD_NODES, GUARD_EDGES, GUARD_OFFICE } from '../data/hubLayout.js';
import { GUARD_SPEED, PATROL_MS, AWAY_MS } from '../config.js';

// La ronde du gardien vit dans l'état de la partie, pas dans la scène du couloir :
// elle continue pendant que le joueur est dans une salle, et elle est sauvegardée.
// Le gardien alterne : une ronde (PATROL_MS) puis une pause dans son local (AWAY_MS), jusqu'au matin.

const NEIGHBOURS = {};
for (const [a, b] of GUARD_EDGES) {
  (NEIGHBOURS[a] ||= []).push(b);
  (NEIGHBOURS[b] ||= []).push(a);
}

const length = (a, b) => Math.hypot(GUARD_NODES[b].x - GUARD_NODES[a].x, GUARD_NODES[b].y - GUARD_NODES[a].y);

/** Prochain point au hasard parmi les voisins, en évitant de revenir sur ses pas. */
function pickNext(from, prev) {
  const options = NEIGHBOURS[from].filter((n) => n !== prev);
  const list = options.length ? options : NEIGHBOURS[from];
  return list[Math.floor(Math.random() * list.length)];
}

export const isPatrolActive = () => state.data.guard?.phase === 'patrol';

/** Vrai pendant les premières secondes d'une ronde : on ne se fait pas attraper à l'apparition. */
export const patrolJustStarted = () => isPatrolActive() && state.data.guard.timer < 1500;

export function startPatrol() {
  state.op('startPatrol');
  state.data.guard = { phase: 'patrol', timer: 0, from: GUARD_OFFICE, to: pickNext(GUARD_OFFICE, null), progress: 0 };
  state.save();
  state.emit('patrol-started');
}

/** Le gardien retourne dans son local ; quiet = pas de message (ex. quand il vient d'attraper le joueur). */
export function sendGuardAway({ quiet = false } = {}) {
  state.data.guard = { phase: 'away', timer: 0 };
  state.save();
  state.emit('patrol-ended', { quiet });
}

/** Position actuelle du gardien entre deux points de passage. */
export function guardPosition() {
  const g = state.data.guard;
  const a = GUARD_NODES[g.from];
  const b = GUARD_NODES[g.to];
  const t = Math.min(1, g.progress / length(g.from, g.to));
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Appelé à chaque frame par la barre du haut (toujours active, et arrêtée pendant la pause). */
export function tickPatrol(delta) {
  const g = state.data.guard;
  if (!g) return;
  g.timer += delta;
  if (g.phase === 'away') {
    if (g.timer >= AWAY_MS && !state.follower) startPatrol();
    return;
  }
  g.progress += (GUARD_SPEED * delta) / 1000;
  while (g.progress >= length(g.from, g.to)) {
    g.progress -= length(g.from, g.to);
    const prev = g.from;
    g.from = g.to;
    g.to = pickNext(g.from, prev);
  }
  // à 2, c'est l'hôte qui décide quand le gardien part ou revient ; l'invité le fait seulement avancer
  if (g.timer >= PATROL_MS && !state.follower) sendGuardAway();
}
