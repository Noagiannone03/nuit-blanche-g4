import { openDialog } from '../ui/dialog.js';
import { CIRCUIT_TEXT, lamp } from '../puzzles/logique.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { askAnswer, decorHint } from './helpers.js';

function openSwitchBox() {
  const values = { A: false, B: false, C: false };
  const wrap = document.createElement('div');
  wrap.innerHTML = '<p>Trois interrupteurs et une lampe éteinte. Une étiquette : <em>« ABC, lu en binaire »</em>.</p>';
  const row = document.createElement('div');
  row.className = 'switches';
  const bulb = document.createElement('div');
  bulb.className = 'lamp';
  bulb.setAttribute('role', 'img');
  bulb.setAttribute('aria-label', 'Lampe éteinte');

  const refresh = () => {
    const on = lamp(values.A, values.B, values.C);
    bulb.classList.toggle('on', on);
    bulb.setAttribute('aria-label', on ? 'Lampe allumée' : 'Lampe éteinte');
  };

  for (const key of ['A', 'B', 'C']) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = `${key} = 0`;
    btn.addEventListener('click', () => {
      values[key] = !values[key];
      btn.setAttribute('aria-pressed', String(values[key]));
      btn.textContent = `${key} = ${values[key] ? 1 : 0}`;
      refresh();
    });
    row.appendChild(btn);
  }
  row.appendChild(bulb);
  wrap.appendChild(row);
  wrap.insertAdjacentHTML('beforeend', '<p>Quand la lampe s\'allume, entre le chiffre correspondant.</p>');

  askAnswer({
    roomKey: 'ventoux',
    title: 'Boîtier électrique',
    body: wrap,
    answer: ROOM_DIGITS.ventoux,
    placeholder: 'Chiffre (0-7)',
    success: `<p>Le tableau électrique se rallume et affiche en grand : <strong>${ROOM_DIGITS.ventoux}</strong>.</p><p>Un chiffre de plus pour la porte de sortie.</p>`,
  });
}

export default {
  key: 'ventoux',
  name: 'Amphi Mont Ventoux',
  domain: 'Logique',
  color: 0x24305e,
  intro: 'Le grand amphi est plongé dans le noir. Seul le tableau électrique clignote.',
  objects: [
    {
      label: 'Tableau du formateur',
      type: 'chalkboard',
      x: 300, y: 200, w: 360, h: 150, color: 0xe8e8f0,
      onUse() {
        openDialog({
          title: 'Tableau du formateur',
          body: `<p>Un schéma de circuit est resté au tableau :</p><pre>${CIRCUIT_TEXT.join('\n')}</pre>`,
        });
      },
    },
    {
      label: 'Boîtier électrique',
      type: 'electric',
      x: 720, y: 220, w: 120, h: 160, color: 0x5a5f73,
      onUse: openSwitchBox,
    },
    {
      label: 'Bureau du formateur',
      type: 'desk',
      x: 300, y: 470, w: 260, h: 90, color: 0x8a5a35,
      onUse() {
        decorHint('ventoux-memo', 'Bureau du formateur', '<p class="hand">Rappel binaire : les colonnes valent 4, 2, 1.<br>110 → 4 + 2 + 0 = 6</p>');
      },
    },
  ],
  hints: [
    'Toutes les portes doivent valoir 1 pour que la lampe s\'allume. Commence par P3 : que doit valoir B ?',
    'B = 0. Ensuite P4 impose C = 1 et P1 impose A = 1. ABC = 101 en binaire… convertis-le en décimal.',
  ],
};
