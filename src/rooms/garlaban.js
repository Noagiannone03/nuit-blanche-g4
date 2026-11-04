import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { RIDDLE } from '../puzzles/ordre.js';
import { ROOM_DIGITS, CODE_ORDER, EXIT_CODE } from '../puzzles/code.js';
import { ROOM_NAMES } from './names.js';
import { askAnswer, decorHint, lockedDialog } from './helpers.js';
import { endGame } from '../scenes/endGame.js';

function orderSummary() {
  return `<ol>${CODE_ORDER.map((r) => `<li>${ROOM_NAMES[r]} : <strong>${ROOM_DIGITS[r]}</strong></li>`).join('')}</ol>`;
}

// 5e énigme : le frigo est fermé par un cadenas ; la clé est dans le coffre de Ste Victoire.
// Sur la porte, un mot de la mère : l'ordre dans lequel elle sert ses enfants donne l'ordre du code.
function openFridge() {
  if (!state.hasItem('cle-frigo')) {
    lockedDialog('Frigo', '<p>Le frigo est fermé par un petit cadenas. Une étiquette :</p><p class="hand">Frigo de l\'équipe Évasion — la clé est dans notre coffre !</p>');
    return;
  }
  askAnswer({
    roomKey: 'garlaban',
    title: 'Frigo — le mot sur la porte',
    doc: RIDDLE,
    body: '<p>Dans quel ordre sont-ils servis ?</p>',
    answer: EXIT_CODE,
    placeholder: '4 chiffres, dans l\'ordre',
    success: `<p>Tu as trouvé l'ordre du repas… et celui du code de sortie :</p>${orderSummary()}`,
    onSolve: () => state.set('orderFound', true),
    solvedBody: orderSummary(),
  });
}

export default {
  key: 'garlaban',
  name: 'Point repas & Salle de jeux Garlaban',
  domain: 'Ordre du code',
  color: 0x4a3420,
  intro: 'Ça sent encore la pizza de 20h. Un mot est aimanté sur la porte du frigo.',
  decor: [
    { type: 'counter', x: 320, y: 300, w: 310, h: 100 },
    { type: 'vending', x: 22, y: 185, w: 100, h: 215 },
    { type: 'poster', x: 600, y: 150, w: 80, h: 95, color: 0x2a9db0, text: 'Menu' },
    { type: 'arcade', x: 235, y: 410, w: 80, h: 150 },
    { type: 'table', x: 680, y: 450, w: 170, h: 80 },
    { type: 'chairs', x: 690, y: 500, w: 150, h: 56, color: 0x2a9db0 },
    { type: 'bin', x: 165, y: 570, w: 32, h: 44 },
  ],
  objects: [
    {
      label: 'Frigo',
      type: 'fridge',
      x: 220, y: 230, w: 150, h: 200, color: 0xdfe6ea,
      onUse: openFridge,
    },
    {
      label: 'Micro-ondes',
      role: 'enq',
      type: 'microwave',
      x: 480, y: 200, w: 140, h: 80, color: 0x3a3a3a,
      onUse() {
        decorHint('garlaban-microondes', 'Micro-ondes', '<p>Un magnet de cours de SVT est collé dessus :</p><p class="hand">Les hommes ont une paire de chromosomes XY, les femmes XX.<br>Donc les chromosomes féminins ont un nombre PAIR de X !</p>');
      },
    },
    {
      label: 'Baby-foot',
      type: 'babyfoot',
      x: 500, y: 460, w: 220, h: 110, color: 0x2f6b3a,
      onUse() {
        openDialog({ title: 'Baby-foot', body: '<p>Pas le temps pour une partie… quoique. Non. Vraiment pas.</p>' });
      },
    },
    {
      label: 'Fenêtre entrouverte',
      type: 'window',
      x: 820, y: 240, w: 110, h: 170, color: 0x6fa8dc,
      onUse(scene) {
        openDialog({
          title: 'Fenêtre entrouverte',
          body: '<p>La fenêtre donne sur la rue. Tu pourrais sauter… mais elle est reliée à l\'alarme. Si elle sonne, la sécurité saura que quelqu\'un était là.</p>',
          buttons: [{ label: 'Sauter par la fenêtre', onClick: () => endGame(scene, false, 'window') }],
        });
      },
    },
  ],
  hints: [
    'La clé du frigo est dans le coffre de la salle Ste Victoire.',
    'Les 4 enfants, ce sont les 4 chiffres trouvés dans les autres salles : chaque chiffre est l\'âge d\'un enfant. Pair = fille (XX), impair = garçon (XY).',
    'Les filles ont 2 et 8 ans, les garçons 3 et 5. Le 3 (plus jeune garçon) est servi 2e, entre son grand frère 5 et une sœur. Le 2 joue avec le 3, et les deux sœurs ne sont pas côte à côte.',
  ],
};
