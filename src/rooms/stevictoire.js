import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { TASKS } from '../puzzles/planning.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { askAnswer, decorHint, timeWaster } from './helpers.js';

// 4e énigme : les durées du planning ont été effacées ; l'imprimante de Callelongue
// les sort une fois le programme du PC résolu. Le coffre donne la clé du frigo de Garlaban.

const FRIDGE_KEY = '<p>Tu as trouvé une clé.</p>';

const ganttTable = () => {
  const known = state.hasItem('durees');
  return `<table><thead><tr><th>Tâche</th><th>Nom</th><th>Durée</th><th>Dépend de</th></tr></thead><tbody>${TASKS.map(
    (t) => `<tr><td>${t.id}</td><td>${t.name}</td><td>${known ? `${t.duration} j` : '<em>effacée</em>'}</td><td>${t.deps.join(', ') || '—'}</td></tr>`,
  ).join('')}</tbody></table>`;
};

export default {
  key: 'stevictoire',
  name: 'Salle de cours Ste Victoire',
  domain: 'Conception / gestion de projet',
  color: 0x3d2b4f,
  intro: 'Les murs sont couverts de plannings d\'anciens Cercles de projets.',
  decor: [
    { type: 'corkboard', x: 665, y: 150, w: 200, h: 120 },
    { type: 'bookshelf', x: 520, y: 180, w: 105, h: 225 },
    { type: 'coatRack', x: 35, y: 300, w: 60, h: 190 },
    { type: 'poster', x: 40, y: 150, w: 70, h: 90, color: 0xc0392b, text: 'Gantt' },
    { type: 'chairs', x: 175, y: 535, w: 150, h: 56, color: 0x7a3b3b },
    { type: 'plant', x: 860, y: 425, w: 70, h: 100 },
  ],
  objects: [
    {
      label: 'Planning au mur',
      role: 'enq',
      type: 'planning',
      x: 300, y: 210, w: 340, h: 150, color: 0xf0ead8,
      onUse() {
        const note = state.hasItem('durees')
          ? '<p><em>Tu complètes les durées avec la feuille imprimée.</em></p>'
          : '<p>Quelqu\'un a effacé la colonne des durées.</p>';
        openDialog({
          title: 'Planning du projet « Évasion »',
          body: `<p>Une tâche ne peut commencer que lorsque <strong>toutes</strong> ses dépendances sont terminées. Les tâches indépendantes avancent en parallèle.</p>${ganttTable()}${note}`,
        });
      },
    },
    {
      label: 'Coffre de l\'équipe',
      role: 'tech',
      type: 'safe',
      x: 720, y: 420, w: 140, h: 120, color: 0x6b6f80,
      onUse() {
        askAnswer({
          roomKey: 'stevictoire',
          title: 'Coffre de l\'équipe',
          body: '<p>Gravé sur le couvercle : <em>« Chemin critique »</em></p>',
          answer: ROOM_DIGITS.stevictoire,
          placeholder: 'Nombre de jours',
          success: `<p>Clic ! Le coffre s'ouvre. Dedans, une carte avec le chiffre <strong>${ROOM_DIGITS.stevictoire}</strong>.</p>${FRIDGE_KEY}`,
          onSolve: () => state.addItem('cle-frigo'),
          solvedBody: '<p>Tu as déjà pris la clé.</p>',
        });
      },
    },
    {
      label: 'Carnet du chef de projet',
      role: 'enq',
      type: 'notebook',
      x: 250, y: 470, w: 160, h: 80, color: 0xc9473f,
      onUse() {
        decorHint('stevictoire-carnet', 'Carnet du chef de projet', '<p class="hand">Le chemin critique = la plus longue chaîne de tâches dépendantes du début à la fin. C\'est lui qui fixe la durée du projet.</p>');
      },
    },
    {
      label: 'Puzzle sur la table',
      type: 'table',
      x: 460, y: 490, w: 160, h: 70, color: 0x9a7550,
      onUse() {
        timeWaster({
          title: 'Puzzle sur la table',
          intro: '<p>Un puzzle de 1000 pièces, presque fini. Il ne manque que le ciel…</p>',
          action: 'Placer quelques pièces',
          result: '<p>Toutes les pièces du ciel se ressemblent. Tu en places trois.</p>',
          minutes: 10,
        });
      },
    },
  ],
  hints: [
    'Les durées effacées sortent de l\'imprimante de Callelongue, une fois le programme du PC résolu.',
    'Calcule la date de fin au plus tôt de chaque tâche : fin = durée + la fin la plus tardive de ses dépendances.',
    'A finit à J1, B à J4, C à J3. D attend B ET C… et E n\'est pas sur le chemin le plus long.',
  ],
};
