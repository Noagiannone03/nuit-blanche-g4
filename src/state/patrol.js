import { state } from './GameState.js'; // on importe l'état de la partie
import { GUARD_NODES, GUARD_EDGES, GUARD_OFFICE } from '../data/hubLayout.js'; // on importe les points et chemins du gardien
import { GUARD_SPEED, PATROL_MS, AWAY_MS } from '../config.js'; // on importe la vitesse et les durées du gardien

// La ronde du gardien vit dans l'état de la partie, pas dans la scène du couloir :
// elle continue pendant que le joueur est dans une salle, et elle est sauvegardée.
// Le gardien alterne : une ronde (PATROL_MS) puis une pause dans son local (AWAY_MS), jusqu'au matin.

const NEIGHBOURS = {}; // pour chaque point : la liste de ses voisins
for (const [a, b] of GUARD_EDGES) { // pour chaque chemin entre deux points a et b
  (NEIGHBOURS[a] ||= []).push(b); // b devient voisin de a
  (NEIGHBOURS[b] ||= []).push(a); // a devient voisin de b
}

// distance entre deux points (Math.hypot = Pythagore)
const length = (a, b) => Math.hypot(GUARD_NODES[b].x - GUARD_NODES[a].x, GUARD_NODES[b].y - GUARD_NODES[a].y);

/** Prochain point au hasard parmi les voisins, en évitant de revenir sur ses pas. */
function pickNext(from, prev) { // choisir le prochain point
  const options = NEIGHBOURS[from].filter((n) => n !== prev); // les voisins, sauf celui d'où on vient
  const list = options.length ? options : NEIGHBOURS[from]; // s'il n'y en a aucun, on garde tous les voisins
  return list[Math.floor(Math.random() * list.length)]; // on en tire un au hasard
}

export const isPatrolActive = () => state.data.guard?.phase === 'patrol'; // vrai si le gardien fait sa ronde

/** Vrai pendant les premières secondes d'une ronde : on ne se fait pas attraper à l'apparition. */
// vrai si la ronde a commencé il y a moins de 1,5 s
export const patrolJustStarted = () => isPatrolActive() && state.data.guard.timer < 1500;

export function startPatrol() { // lancer une ronde du gardien
  state.op('startPatrol'); // on signale l'action au réseau
  // le gardien part de son local vers un point voisin
  state.data.guard = { phase: 'patrol', timer: 0, from: GUARD_OFFICE, to: pickNext(GUARD_OFFICE, null), progress: 0 };
  state.save(); // on sauvegarde
  state.emit('patrol-started'); // on prévient : la ronde commence
}

/** Le gardien retourne dans son local ; quiet = pas de message (ex. quand il vient d'attraper le joueur). */
export function sendGuardAway({ quiet = false } = {}) { // renvoyer le gardien dans son local
  state.data.guard = { phase: 'away', timer: 0 }; // il est absent, chrono remis à zéro
  state.save(); // on sauvegarde
  state.emit('patrol-ended', { quiet }); // on prévient : la ronde est finie
}

/** Position actuelle du gardien entre deux points de passage. */
export function guardPosition() { // où est le gardien ?
  const g = state.data.guard; // les infos de la ronde
  const a = GUARD_NODES[g.from]; // point de départ
  const b = GUARD_NODES[g.to]; // point d'arrivée
  const t = Math.min(1, g.progress / length(g.from, g.to)); // part du trajet déjà faite (de 0 à 1)
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; // position entre les deux points
}

/** Appelé à chaque frame par la barre du haut (toujours active, et arrêtée pendant la pause). */
export function tickPatrol(delta) { // fait avancer la ronde (delta = temps depuis la dernière image)
  const g = state.data.guard; // les infos de la ronde
  if (!g) return; // pas de gardien : on arrête
  g.timer += delta; // le chrono avance
  if (g.phase === 'away') { // le gardien est dans son local ?
    if (g.timer >= AWAY_MS && !state.follower) startPatrol(); // pause finie et c'est nous qui décidons : nouvelle ronde
    return; // on s'arrête là
  }
  g.progress += (GUARD_SPEED * delta) / 1000; // il avance selon sa vitesse
  while (g.progress >= length(g.from, g.to)) { // tant qu'il a dépassé le point d'arrivée :
    g.progress -= length(g.from, g.to); // on retire la longueur du trajet fini
    const prev = g.from; // on retient d'où il vient
    g.from = g.to; // il est arrivé : c'est son nouveau départ
    g.to = pickNext(g.from, prev); // on choisit le point suivant
  }
  // à 2, c'est l'hôte qui décide quand le gardien part ou revient ; l'invité le fait seulement avancer
  if (g.timer >= PATROL_MS && !state.follower) sendGuardAway(); // ronde finie : retour au local
}
