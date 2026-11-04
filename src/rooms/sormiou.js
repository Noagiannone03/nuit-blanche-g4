import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { POSTITS, POSTIT_COLORS } from '../puzzles/observation.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { askAnswer, decorHint, timeWaster } from './helpers.js';
import { isDialogOpen } from '../ui/dialog.js';
import { canUse, roleRefusal, ROLES } from '../net/multiplayer.js';

// 1re énigme de la chaîne, à faire dans le noir avec le flash du téléphone.
// Elle donne la clé de l'armoire électrique de l'amphi Mont Ventoux (sans le dire au joueur).
// Les 2 post-it jaunes se lisent en cliquant dessus : l'un d'eux donne le mot de passe du PC de Callelongue.
const KEY_NOTE = '<p>Tu as obtenu une clé.</p>';

/** Lire un post-it jaune (à 2 : c'est l'enquêteur qui lit). */
function readPostit(p) {
  if (isDialogOpen()) return;
  if (!canUse('enq')) {
    openDialog({ title: `Post-it jaune — ${ROLES.enq.icon} ${ROLES.enq.name}`, body: roleRefusal('enq') });
    return;
  }
  openDialog({ title: 'Post-it jaune', body: `<p class="hand">${p.note}</p>` });
}

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
      const r = scene.add.rectangle(p.x, p.y, 26, 26, POSTIT_COLORS[p.color]).setAngle(p.angle).setStrokeStyle(1, 0x000000, 0.25);
      // pas de curseur « main » : sinon le survol trahirait où sont les jaunes
      if (p.note) r.setInteractive().on('pointerdown', () => readPostit(p));
    }
  },
  decor: [
    { type: 'bookshelf', x: 18, y: 160, w: 100, h: 240 },
    { type: 'flipchart', x: 150, y: 165, w: 90, h: 230 },
    { type: 'windowNight', x: 650, y: 150, w: 110, h: 115 },
    { type: 'radiator', x: 655, y: 345, w: 100, h: 38 },
    { type: 'chairs', x: 255, y: 500, w: 210, h: 60, color: 0x3f8f5a },
    { type: 'bin', x: 515, y: 560, w: 30, h: 40 },
  ],
  objects: [
    {
      label: 'Tableau blanc',
      role: 'enq',
      type: 'whiteboard',
      x: 480, y: 200, w: 260, h: 130, color: 0xeef0f4,
      onUse() {
        openDialog({
          title: 'Tableau blanc',
          body: '<p>Compte-rendu de la réunion de 18h :</p><p class="hand">« On ne garde que les idées validées : les post-it <strong>JAUNES</strong>.<br>On notera le nombre d\'idées retenues dans le coffre. »</p>',
        });
      },
    },
    {
      label: 'Casier à code',
      role: 'tech',
      type: 'locker',
      x: 820, y: 440, w: 110, h: 150, color: 0x4f5566,
      onUse() {
        askAnswer({
          roomKey: 'sormiou',
          title: 'Casier à code',
          body: '<p>Un cadenas à un seul chiffre.</p>',
          answer: ROOM_DIGITS.sormiou,
          placeholder: 'Chiffre',
          success: `<p>Le casier s'ouvre : une étiquette porte le chiffre <strong>${ROOM_DIGITS.sormiou}</strong>.</p>${KEY_NOTE}`,
          onSolve: () => state.addItem('cle-armoire'),
          solvedBody: '<p>Tu as déjà pris la clé.</p>',
        });
      },
    },
    {
      label: 'Bureau et clavier',
      role: 'enq',
      type: 'keyboardDesk',
      x: 360, y: 450, w: 240, h: 90, color: 0x8a5a35,
      onUse() {
        decorHint('sormiou-clavier', 'Bureau', '<p>Sous le clavier, une note :</p><p class="hand">Les infos importantes sont sur les post-it JAUNES. Regarde PARTOUT : les murs, le sol, et même près de la plante !</p>');
      },
    },
    {
      label: 'Pouf',
      type: 'beanbag',
      x: 700, y: 550, w: 90, h: 60, color: 0x8a3b5a,
      onUse() {
        timeWaster({
          title: 'Pouf',
          intro: '<p>Un gros pouf moelleux. Rien qu\'une minute…</p>',
          action: 'S\'asseoir une minute',
          result: '<p>Tu te réveilles en sursaut. « Une minute », hein ?</p>',
          minutes: 20,
        });
      },
    },
  ],
  hints: [
    'Il fait noir : balaie toute la salle avec le flash de ton téléphone (il suit la souris). Ne compte que les post-it JAUNES — attention, les orange leur ressemblent.',
    'Il y en a très peu : un près de la plante, un sur le mur de droite. Et les post-it ne servent pas qu\'à être comptés : touche-les, des indices sont écrits dessus.',
  ],
};
