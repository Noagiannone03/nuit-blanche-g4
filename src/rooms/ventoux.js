import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { CIRCUIT_TEXT, lamp } from '../puzzles/logique.js';
import { TASKS } from '../puzzles/planning.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { askAnswer, decorHint, lockedDialog } from './helpers.js';

// 3e énigme : il faut la clé de l'armoire (imprimante de Callelongue).
// Une fois le courant rétabli, le vidéoprojecteur affiche les durées dont Ste Victoire a besoin.

const durationsTable = () =>
  `<table><thead><tr><th>Tâche</th><th>Durée</th></tr></thead><tbody>${TASKS.map((t) => `<tr><td>${t.id} — ${t.name}</td><td>${t.duration} jour${t.duration > 1 ? 's' : ''}</td></tr>`).join('')}</tbody></table>`;

function openSwitchBox() {
  if (!state.hasItem('cle-armoire')) {
    lockedDialog('Boîtier électrique', '<p>La porte de l\'armoire est fermée à clé. Une étiquette : <em>« Clé rangée avec le matériel d\'impression. »</em></p>');
    return;
  }
  const values = { A: false, B: false, C: false };
  const wrap = document.createElement('div');
  wrap.innerHTML = '<p>La clé tourne. Trois interrupteurs et une lampe éteinte. Une étiquette : <em>« ABC, lu en binaire »</em>.</p>';
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
    success: `<p>Le courant revient dans l'amphi ! Le tableau électrique affiche en grand : <strong>${ROOM_DIGITS.ventoux}</strong>.</p><p>Au fond de la salle, le vidéoprojecteur se rallume…</p>`,
    onSolve: () => state.addItem('durees'),
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
    {
      label: 'Vidéoprojecteur',
      type: 'projector',
      x: 720, y: 480, w: 170, h: 100, color: 0x3a3f47,
      onUse() {
        if (!state.hasItem('durees')) {
          openDialog({ title: 'Vidéoprojecteur', body: '<p>Pas de courant dans l\'amphi : l\'écran reste noir.</p>' });
          return;
        }
        openDialog({
          title: 'Présentation projetée',
          body: `<p>Le vidéoprojecteur affiche la dernière diapo de ton équipe : <em>« Projet Évasion — durées des tâches »</em>.</p>${durationsTable()}<p><em>Tu prends une photo avec ton téléphone : tu pourras la consulter n'importe où.</em></p>`,
        });
      },
    },
  ],
  hints: [
    'L\'armoire électrique est fermée à clé : la clé sort de l\'imprimante de Callelongue quand tu as résolu le programme du PC.',
    'Toutes les portes doivent valoir 1 pour que la lampe s\'allume. Commence par P3 : que doit valoir B ?',
    'B = 0. Ensuite P4 impose C = 1 et P1 impose A = 1. ABC = 101 en binaire… convertis-le en décimal.',
  ],
};
