import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { COMMITS, chronologicalRooms } from '../puzzles/ordre.js';
import { PENALTY_ERROR } from '../config.js';
import { ROOM_NAMES } from './names.js';
import { decorHint } from './helpers.js';
import { endGame } from '../scenes/endGame.js';

function orderSummary() {
  return `<ol>${chronologicalRooms().map((r) => `<li>${ROOM_NAMES[r]}</li>`).join('')}</ol>`;
}

function openCommits() {
  if (state.data.orderFound) {
    openDialog({ title: 'Commits triés', body: `<p>L'ordre du code de sortie :</p>${orderSummary()}` });
    return;
  }
  const expected = chronologicalRooms();
  let step = 0;

  const list = document.createElement('div');
  list.className = 'commits';
  const ui = openDialog({
    title: 'Commits imprimés sur le frigo',
    body: list,
  });
  list.insertAdjacentHTML('beforebegin', '<p>Tes commits de la soirée, dans le désordre. Clique-les <strong>du plus ancien au plus récent</strong>.</p>');

  const buttons = COMMITS.map((c) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `${c.hash}  ${c.time}  ${c.msg}`;
    btn.addEventListener('click', () => {
      if (c.room === expected[step]) {
        step += 1;
        btn.disabled = true;
        btn.classList.add('done');
        btn.textContent = `${step}. ${btn.textContent}`;
        if (step === expected.length) {
          state.data.orderFound = true;
          state.solve('garlaban');
          ui.close();
          openDialog({ title: 'L\'ordre du code !', body: `<p>Tu te souviens : tu as travaillé dans cet ordre ce soir. Les chiffres du code se lisent pareil :</p>${orderSummary()}` });
        }
      } else {
        state.penalize();
        step = 0;
        buttons.forEach((b, i) => {
          b.disabled = false;
          b.classList.remove('done');
          b.textContent = `${COMMITS[i].hash}  ${COMMITS[i].time}  ${COMMITS[i].msg}`;
        });
        ui.feedback(`Pas dans le bon ordre ! On recommence. +${PENALTY_ERROR} min.`);
      }
    });
    list.appendChild(btn);
    return btn;
  });
}

export default {
  key: 'garlaban',
  name: 'Point repas & Salle de jeux Garlaban',
  domain: 'Ordre du code',
  color: 0x4a3420,
  intro: 'Ça sent encore la pizza de 20h. Des feuilles sont collées sur le frigo.',
  objects: [
    {
      label: 'Frigo (feuilles collées)',
      type: 'fridge',
      x: 220, y: 230, w: 150, h: 200, color: 0xdfe6ea,
      onUse: openCommits,
    },
    {
      label: 'Micro-ondes',
      type: 'microwave',
      x: 480, y: 200, w: 140, h: 80, color: 0x3a3a3a,
      onUse() {
        decorHint('garlaban-microondes', 'Micro-ondes', '<p class="hand">« Le code se lit dans l\'ordre où j\'ai bossé ce soir. » — toi, à 23h59</p>');
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
    'Les feuilles du frigo sont des commits. Regarde leurs heures.',
    'Le plus ancien commit est celui de 21:47. Les chiffres du code de sortie suivent cet ordre.',
  ],
};
