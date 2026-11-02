// Ste Victoire — GESTION DE PROJET
// Durée minimale du projet = longueur du chemin critique (en jours).

export const TASKS = [
  { id: 'A', name: 'Cadrage', duration: 1, deps: [] },
  { id: 'B', name: 'Scénario', duration: 3, deps: ['A'] },
  { id: 'C', name: 'Maquettes', duration: 2, deps: ['A'] },
  { id: 'D', name: 'Développement', duration: 4, deps: ['B', 'C'] },
  { id: 'E', name: 'Affiches', duration: 1, deps: ['C'] },
];

/** Date de fin au plus tôt de chaque tâche, puis on garde la plus tardive. */
export function criticalPathLength(tasks = TASKS) {
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
  const finish = {};
  const earliestFinish = (id) => {
    if (finish[id] === undefined) {
      const t = byId[id];
      const start = Math.max(0, ...t.deps.map(earliestFinish));
      finish[id] = start + t.duration;
    }
    return finish[id];
  };
  return Math.max(...tasks.map((t) => earliestFinish(t.id)));
}
