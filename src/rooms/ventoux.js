import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { CIRCUIT_TEXT, lamp } from '../puzzles/logique.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { decorHint, lockedDialog } from './helpers.js';
import { PENALTY_ERROR } from '../config.js';
import { startPatrol } from '../state/patrol.js';
import { sfx } from '../audio/sound.js';

// 2e énigme : il faut la clé de l'armoire (casier de Sormiou).
// Le boîtier : trouver la combinaison qui allume la lampe (LAMPE = 1), puis lire ABC en binaire.
// Le disjoncteur général est à part : le joueur choisit s'il remet la lumière. On ne lui dit pas
// ce qui se passe ensuite : le courant revient dans toute l'école… et le gardien commence ses rondes.
// Sans courant, le PC de Callelongue reste éteint : il faudra le remettre tôt ou tard.

/** Le courant revient : il éclaire toute l'école… et réveille le gardien. */
function restorePower() {
  sfx.powerOn();
  setTimeout(() => sfx.distantSlam(), 2200); // le gardien sort de son local
  state.addItem('courant');
  state.set('guardChoice', 'alerted');
  startPatrol();
}

function openSwitchBox() {
  if (!state.hasItem('cle-armoire')) {
    lockedDialog('Boîtier électrique', '<p>Fermé à clé.</p>');
    return;
  }
  if (state.data.solved.ventoux) {
    openDialog({ title: 'Boîtier électrique', body: `<p><strong>✓ Déjà résolu : ${state.data.digits.ventoux}</strong></p>` });
    return;
  }

  // Interrupteurs, lampe et chiffre dans la même boîte. La lampe ne réagit pas toute seule :
  // on la teste (erreur = pénalité), et on tape le chiffre lu en binaire.
  const values = { A: false, B: false, C: false };
  const wrap = document.createElement('div');
  wrap.innerHTML = '<p>La clé tourne. Trois interrupteurs et une lampe. Une étiquette : <em>« ABC, lu en binaire »</em>.</p>';
  const row = document.createElement('div');
  row.className = 'switches';
  const bulb = document.createElement('div');
  bulb.className = 'lamp';
  bulb.setAttribute('role', 'img');
  bulb.setAttribute('aria-label', 'Lampe éteinte');

  const buttons = ['A', 'B', 'C'].map((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = `${key} = 0`;
    btn.addEventListener('click', () => {
      sfx.toggle();
      values[key] = !values[key];
      btn.setAttribute('aria-pressed', String(values[key]));
      btn.textContent = `${key} = ${values[key] ? 1 : 0}`;
    });
    row.appendChild(btn);
    return btn;
  });
  row.appendChild(bulb);
  wrap.appendChild(row);
  wrap.insertAdjacentHTML('beforeend', '<p>Tu peux tester la lampe (<strong>chaque essai raté coûte du temps</strong>).</p>');

  const ui = openDialog({
    title: 'Boîtier électrique',
    body: wrap,
    input: { placeholder: 'Chiffre (0-7)', maxLength: 2, numeric: true },
    onSubmit: (value) => submitDigit(value),
    buttons: [{ label: 'Tester la lampe', onClick: () => test() }],
  });

  function test() {
    if (bulb.classList.contains('on')) return;
    if (!lamp(values.A, values.B, values.C)) {
      state.penalize();
      ui.feedback(`Clac… la lampe reste éteinte. +${PENALTY_ERROR} min.`);
      return;
    }
    // Bonne combinaison : seule la lampe du boîtier s'allume (le chiffre n'est pas donné)
    sfx.success();
    bulb.classList.add('on');
    bulb.setAttribute('aria-label', 'Lampe allumée');
    buttons.forEach((b) => (b.disabled = true));
    ui.box.querySelector('.actions button')?.remove(); // plus de « Tester la lampe »
    ui.box.querySelector('input')?.focus(); // garde le curseur dans la boîte (sinon Échap ne la ferme plus)
    ui.feedback('La lampe s\'allume !', 'ok');
  }

  function submitDigit(value) {
    if (value !== String(ROOM_DIGITS.ventoux)) {
      state.penalize();
      ui.feedback(`Mauvaise réponse… l'heure tourne : +${PENALTY_ERROR} min.`);
      return;
    }
    state.solve('ventoux', ROOM_DIGITS.ventoux);
    ui.close();
    openDialog({ title: 'Bien joué !', body: `<p>Le tableau électrique affiche en grand : <strong>${ROOM_DIGITS.ventoux}</strong>.</p>` });
    sfx.success();
  }
}

/** Le disjoncteur général : remettre la lumière ou non, c'est le choix du joueur. */
function openBreaker() {
  if (state.hasItem('courant')) {
    openDialog({ title: 'Disjoncteur général', body: '<p>Le levier est en position haute. Les néons bourdonnent.</p>' });
    return;
  }
  if (!state.hasItem('cle-armoire')) {
    lockedDialog('Disjoncteur général', '<p>Fermé à clé.</p>');
    return;
  }
  openDialog({
    title: 'Disjoncteur général',
    body: '<p>Un gros levier rouge, en position basse. Une étiquette : <em>« GÉNÉRAL »</em>.</p>',
    buttons: [
      {
        label: 'Remonter le levier',
        primary: true,
        onClick: (ui) => {
          ui.close();
          restorePower();
          openDialog({ title: 'Disjoncteur général', body: '<p><strong>Clac !</strong> Les néons grésillent… et toute l\'école s\'allume.</p>' });
        },
      },
    ],
  });
}

export default {
  key: 'ventoux',
  name: 'Amphi Mont Ventoux',
  domain: 'Logique',
  color: 0x24305e,
  intro: 'Le grand amphi est plongé dans le noir. Seul le tableau électrique clignote.',
  decor: [
    { type: 'windowNight', x: 515, y: 150, w: 115, h: 120 },
    { type: 'radiator', x: 520, y: 345, w: 105, h: 38 },
    { type: 'exitSign', x: 20, y: 150, w: 70, h: 26 },
    { type: 'amphiSeats', x: 15, y: 404, w: 150, h: 46 },
    { type: 'amphiSeats', x: 445, y: 404, w: 180, h: 46 },
    { type: 'bin', x: 40, y: 560, w: 34, h: 44 },
    { type: 'plant', x: 690, y: 430, w: 64, h: 95 },
    { type: 'backpack', x: 470, y: 570, w: 40, h: 46 },
  ],
  objects: [
    {
      label: 'Tableau du formateur',
      role: 'enq',
      type: 'chalkboard',
      x: 300, y: 200, w: 360, h: 150, color: 0xe8e8f0,
      onUse() {
        openDialog({
          title: 'Tableau du formateur',
          body: `<p>Un schéma de circuit est resté au tableau :</p><pre>${CIRCUIT_TEXT.join('\n')}</pre><p class="hand">Objectif : LAMPE = 1 → la lampe s'allume !<br>(1 = allumé / vrai, 0 = éteint / faux)</p>`,
        });
      },
    },
    {
      label: 'Boîtier électrique',
      role: 'tech',
      type: 'electric',
      x: 720, y: 220, w: 120, h: 160, color: 0x5a5f73,
      onUse: openSwitchBox,
    },
    {
      label: 'Bureau du formateur',
      role: 'enq',
      type: 'desk',
      x: 300, y: 470, w: 260, h: 90, color: 0x8a5a35,
      onUse() {
        decorHint('ventoux-memo', 'Bureau du formateur', '<p class="hand">Rappel binaire : les colonnes valent 4, 2, 1.<br>110 → 4 + 2 + 0 = 6</p>');
      },
    },
    {
      label: 'Disjoncteur général',
      role: 'tech',
      type: 'breaker',
      x: 860, y: 400, w: 72, h: 100, color: 0x6c7482,
      onUse: openBreaker,
    },
  ],
  hints: [
    'L\'armoire électrique est fermée à clé : la clé est dans le casier à code de la salle Sormiou.',
    'Le but est LAMPE = 1 : P2, P3 et P4 doivent toutes valoir 1. Commence par P3 : que doit valoir B ?',
    'B = 0. Ensuite P4 impose C = 1, et P1 impose A = 1 : A = 1, B = 0, C = 1. Lis 101 en binaire avec le mémo du bureau (colonnes 4, 2, 1).',
  ],
};
