// Ste Victoire — GESTION DE PROJET
// Durée minimale du projet = longueur du chemin critique (en jours).

export const TASKS = [ // la liste des tâches du projet
  { id: 'A', name: 'Cadrage', duration: 1, deps: [] }, // tâche A : 1 jour, ne dépend de rien
  { id: 'B', name: 'Scénario', duration: 3, deps: ['A'] }, // tâche B : 3 jours, après A
  { id: 'C', name: 'Maquettes', duration: 2, deps: ['A'] }, // tâche C : 2 jours, après A
  { id: 'D', name: 'Développement', duration: 4, deps: ['B', 'C'] }, // tâche D : 4 jours, après B et C
  { id: 'E', name: 'Affiches', duration: 1, deps: ['C'] }, // tâche E : 1 jour, après C
];

/** Date de fin au plus tôt de chaque tâche, puis on garde la plus tardive. */
export function criticalPathLength(tasks = TASKS) { // calcule la durée totale minimale du projet
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t])); // pour retrouver une tâche par sa lettre
  const finish = {}; // on garde ici le jour de fin déjà calculé de chaque tâche
  const earliestFinish = (id) => { // calcule le jour de fin au plus tôt d'une tâche
    if (finish[id] === undefined) { // si on ne l'a pas encore calculé…
      const t = byId[id]; // on récupère la tâche
      const start = Math.max(0, ...t.deps.map(earliestFinish)); // elle commence quand sa dépendance la plus lente finit
      finish[id] = start + t.duration; // fin = début + durée
    }
    return finish[id]; // on renvoie le jour de fin
  };
  return Math.max(...tasks.map((t) => earliestFinish(t.id))); // la tâche qui finit le plus tard donne la durée du projet
}
