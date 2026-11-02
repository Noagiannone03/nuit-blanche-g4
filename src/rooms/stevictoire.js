import { openDialog } from '../ui/dialog.js';
import { TASKS } from '../puzzles/planning.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { askAnswer, decorHint } from './helpers.js';

const ganttTable = () =>
  `<table><thead><tr><th>Tâche</th><th>Nom</th><th>Durée</th><th>Dépend de</th></tr></thead><tbody>${TASKS.map(
    (t) => `<tr><td>${t.id}</td><td>${t.name}</td><td>${t.duration} j</td><td>${t.deps.join(', ') || '—'}</td></tr>`,
  ).join('')}</tbody></table>`;

export default {
  key: 'stevictoire',
  name: 'Salle de cours Ste Victoire',
  domain: 'Conception / gestion de projet',
  color: 0x3d2b4f,
  intro: 'Les murs sont couverts de plannings d\'anciens Cercles de projets.',
  objects: [
    {
      label: 'Planning au mur',
      type: 'planning',
      x: 300, y: 210, w: 340, h: 150, color: 0xf0ead8,
      onUse() {
        openDialog({
          title: 'Planning du projet « Évasion »',
          body: `<p>Une tâche ne peut commencer que lorsque <strong>toutes</strong> ses dépendances sont terminées. Les tâches indépendantes avancent en parallèle.</p>${ganttTable()}`,
        });
      },
    },
    {
      label: 'Coffre de l\'équipe',
      type: 'safe',
      x: 720, y: 420, w: 140, h: 120, color: 0x6b6f80,
      onUse() {
        askAnswer({
          roomKey: 'stevictoire',
          title: 'Coffre de l\'équipe',
          body: `<p>Gravé sur le couvercle : <em>« Combien de jours, au minimum, pour livrer le projet du mur ? »</em></p>`,
          answer: ROOM_DIGITS.stevictoire,
          placeholder: 'Nombre de jours',
          success: `<p>Clic ! Le coffre s'ouvre. Dedans, une carte avec le chiffre <strong>${ROOM_DIGITS.stevictoire}</strong>.</p>`,
        });
      },
    },
    {
      label: 'Carnet du chef de projet',
      type: 'notebook',
      x: 250, y: 470, w: 160, h: 80, color: 0xc9473f,
      onUse() {
        decorHint('stevictoire-carnet', 'Carnet du chef de projet', '<p class="hand">Le chemin critique = la plus longue chaîne de tâches dépendantes du début à la fin. C\'est lui qui fixe la durée du projet.</p>');
      },
    },
  ],
  hints: [
    'Calcule la date de fin au plus tôt de chaque tâche : fin = durée + la fin la plus tardive de ses dépendances.',
    'A finit à J1, B à J4, C à J3. D attend B ET C… et E n\'est pas sur le chemin le plus long.',
  ],
};
