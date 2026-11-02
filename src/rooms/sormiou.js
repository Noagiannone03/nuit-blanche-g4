import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { POSTITS, POSTIT_COLORS } from '../puzzles/observation.js';
import { PC_PASSWORD } from '../puzzles/algorithmique.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { askAnswer, decorHint } from './helpers.js';

// 1re énigme de la chaîne : rien à apporter. Elle donne le mot de passe du PC de Callelongue.
const PASSWORD_NOTE = `<p>Collé à l'intérieur de la porte, un post-it :</p><p class="hand">Session Callelongue<br>mdp : <strong>${PC_PASSWORD}</strong></p>`;

export default {
  key: 'sormiou',
  name: 'Salle de cours Sormiou',
  domain: 'Observation visuelle',
  color: 0x2e3d24,
  intro: 'Une salle de brainstorming : il y a des post-it partout.',
  // Décor dessiné par-dessus les objets : les post-it à compter
  draw(scene) {
    // une plante verte en bas à gauche
    scene.add.rectangle(80, 585, 40, 40, 0x7a4a2a);
    scene.add.circle(80, 550, 34, 0x3f8f3a);
    for (const p of POSTITS) {
      scene.add.rectangle(p.x, p.y, 26, 26, POSTIT_COLORS[p.color]).setAngle(p.angle).setStrokeStyle(1, 0x000000, 0.25);
    }
  },
  objects: [
    {
      label: 'Tableau blanc',
      type: 'whiteboard',
      x: 480, y: 200, w: 260, h: 130, color: 0xeef0f4,
      onUse() {
        openDialog({
          title: 'Tableau blanc',
          body: '<p>Compte-rendu de la réunion de 18h :</p><p class="hand">« On ne garde que les idées validées : les post-it <strong>JAUNES</strong>.<br>Leur nombre ouvre le casier. »</p>',
        });
      },
    },
    {
      label: 'Casier à code',
      type: 'locker',
      x: 820, y: 440, w: 110, h: 150, color: 0x4f5566,
      onUse() {
        askAnswer({
          roomKey: 'sormiou',
          title: 'Casier à code',
          body: '<p>Un cadenas à un seul chiffre.</p>',
          answer: ROOM_DIGITS.sormiou,
          placeholder: 'Chiffre',
          success: `<p>Le casier s'ouvre : une étiquette porte le chiffre <strong>${ROOM_DIGITS.sormiou}</strong>.</p>${PASSWORD_NOTE}`,
          onSolve: () => state.addItem('mdp-callelongue'),
          solvedBody: PASSWORD_NOTE,
        });
      },
    },
    {
      label: 'Bureau et clavier',
      type: 'keyboardDesk',
      x: 360, y: 450, w: 240, h: 90, color: 0x8a5a35,
      onUse() {
        decorHint('sormiou-clavier', 'Bureau', '<p>Sous le clavier, une note :</p><p class="hand">Pour compter, regarde PARTOUT : les murs, le sol, et même près de la plante !</p>');
      },
    },
  ],
  hints: [
    'Ne compte que les post-it jaunes, dans toute la salle : murs, bureau, sol…',
    'Regarde bien les bords et le bas de l\'écran : certains post-it jaunes sont près de la plante et presque sous le bureau.',
  ],
};
