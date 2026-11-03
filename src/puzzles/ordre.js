// Garlaban / Point repas — ORDRE DU CODE
// Les commits imprimés de l'élève : triés du plus ancien au plus récent,
// ils donnent l'ordre dans lequel lire les chiffres des salles.

export const COMMITS = [
  { hash: 'a3f9c1e', time: '23:12', msg: 'fix(ventoux): circuit du tableau électrique', room: 'ventoux' },
  { hash: '7b21d04', time: '22:30', msg: 'feat(callelongue): algo du PC', room: 'callelongue' },
  { hash: 'e90c5aa', time: '23:58', msg: 'docs(ste-victoire): Gantt du projet', room: 'stevictoire' },
  { hash: '41dd7f2', time: '21:47', msg: 'style(sormiou): tri des post-it, premier commit de la soirée', room: 'sormiou' },
];

export function chronologicalRooms(commits = COMMITS) {
  return [...commits].sort((a, b) => a.time.localeCompare(b.time)).map((c) => c.room);
}
