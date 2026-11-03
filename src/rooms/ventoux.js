import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { CIRCUIT_TEXT, lamp } from '../puzzles/logique.js';
import { PC_PASSWORD } from '../puzzles/algorithmique.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { decorHint, lockedDialog } from './helpers.js';
import { PENALTY_ERROR } from '../config.js';
import { startPatrol } from '../state/patrol.js';
import { sfx } from '../audio/sound.js';

// 2e énigme : il faut la clé de l'armoire (casier de Sormiou).
// Tester la lampe avec la bonne combinaison rétablit le courant : plus besoin du flash… mais le gardien
// est alerté et commence ses rondes. On peut aussi donner le chiffre sans tester : on reste dans le noir.
// Une fois le chiffre trouvé, le vidéoprojecteur affiche le mot de passe du PC de Callelongue.

const SLIDE = `<p>Le vidéoprojecteur affiche la dernière diapo de ton équipe :</p><p class="hand">Accès salle Callelongue<br>Session : Callelongue — mdp : <strong>${PC_PASSWORD}</strong></p>`;

/** Le courant revient : il éclaire toute l'école… et réveille le gardien. */
function restorePower() {
  sfx.powerOn();
  setTimeout(() => sfx.distantSlam(), 2200); // le gardien sort de son local
  state.addItem('courant');
  state.data.guardChoice = 'alerted';
  startPatrol();
}

function openSwitchBox() {
  if (!state.hasItem('cle-armoire')) {
    lockedDialog('Boîtier électrique', '<p>La porte de l\'armoire est fermée à clé. Une étiquette : <em>« Double de la clé : casier de la salle Sormiou. »</em></p>');
    return;
  }
  const lit = state.hasItem('courant');
  if (state.data.solved.ventoux) {
    const light = lit
      ? 'La lampe est allumée, le courant est rétabli.'
      : 'Tu as laissé la lumière éteinte : le gardien dort toujours. Seul le circuit de secours (vidéoprojecteur) est réarmé.';
    openDialog({ title: 'Boîtier électrique', body: `<p><strong>✓ Déjà résolu : ${state.data.digits.ventoux}</strong></p><p>${light}</p>` });
    return;
  }

  // Interrupteurs, lampe et chiffre dans la même boîte. La lampe ne réagit pas toute seule :
  // on peut la tester (erreur = pénalité, réussite = lumière + gardien réveillé)
  // ou, si on est sûr de soi, donner directement le chiffre et rester dans le noir.
  const values = { A: lit, B: false, C: lit };
  const wrap = document.createElement('div');
  wrap.innerHTML = '<p>La clé tourne. Trois interrupteurs et une lampe. Une étiquette : <em>« ABC, lu en binaire »</em>.</p>';
  const row = document.createElement('div');
  row.className = 'switches';
  const bulb = document.createElement('div');
  bulb.className = lit ? 'lamp on' : 'lamp';
  bulb.setAttribute('role', 'img');
  bulb.setAttribute('aria-label', lit ? 'Lampe allumée' : 'Lampe éteinte');

  const buttons = ['A', 'B', 'C'].map((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.disabled = lit;
    btn.setAttribute('aria-pressed', String(values[key]));
    btn.textContent = `${key} = ${values[key] ? 1 : 0}`;
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
  wrap.insertAdjacentHTML(
    'beforeend',
    lit
      ? '<p>La lampe est allumée. Quel chiffre ouvre la suite du code ?</p>'
      : '<p>Tu peux tester la lampe (<strong>chaque essai raté coûte du temps</strong>, et la lumière risque de réveiller le gardien)… ou, si tu es sûr de toi, donner directement le chiffre et rester dans le noir.</p>',
  );

  const ui = openDialog({
    title: 'Boîtier électrique',
    body: wrap,
    input: { placeholder: 'Chiffre (0-7)', maxLength: 2, numeric: true },
    onSubmit: (value) => submitDigit(value),
    buttons: lit ? [] : [{ label: 'Tester la lampe', onClick: () => test() }],
  });

  function test() {
    if (state.hasItem('courant')) return;
    if (!lamp(values.A, values.B, values.C)) {
      state.penalize();
      ui.feedback(`Clac… la lampe reste éteinte. +${PENALTY_ERROR} min.`);
      return;
    }
    // Bonne combinaison : la lampe s'allume et le courant revient, mais le chiffre n'est pas donné
    bulb.classList.add('on');
    bulb.setAttribute('aria-label', 'Lampe allumée');
    buttons.forEach((b) => (b.disabled = true));
    ui.box.querySelector('.actions button')?.remove(); // plus de « Tester la lampe »
    ui.feedback('La lampe s\'allume ! Le courant revient dans toute l\'école… au loin, une porte claque : le gardien commence ses rondes.', 'ok');
    restorePower();
  }

  function submitDigit(value) {
    if (value !== String(ROOM_DIGITS.ventoux)) {
      state.penalize();
      ui.feedback(`Mauvaise réponse… l'heure tourne : +${PENALTY_ERROR} min.`);
      return;
    }
    state.solve('ventoux', ROOM_DIGITS.ventoux);
    ui.close();
    const dark = state.hasItem('courant')
      ? ''
      : '<p>Les néons restent éteints : <strong>le gardien n\'a rien vu</strong>. Mais le circuit de secours se réarme : au fond de l\'amphi, le vidéoprojecteur redémarre sur l\'onduleur.</p>';
    openDialog({ title: 'Bien joué !', body: `<p>Le tableau électrique affiche en grand : <strong>${ROOM_DIGITS.ventoux}</strong>.</p>${dark}` });
    sfx.success();
  }
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
          body: `<p>Un schéma de circuit est resté au tableau :</p><pre>${CIRCUIT_TEXT.join('\n')}</pre><p class="hand">Objectif : LAMPE = 1 → la lampe s'allume !<br>(1 = allumé / vrai, 0 = éteint / faux)</p>`,
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
        // il marche avec le courant… ou sur l'onduleur une fois le boîtier résolu dans le noir
        if (!state.hasItem('courant') && !state.data.solved.ventoux) {
          openDialog({ title: 'Vidéoprojecteur', body: '<p>Pas de courant dans l\'amphi : l\'écran reste noir.</p>' });
          return;
        }
        openDialog({ title: 'Présentation projetée', body: `${SLIDE}<p><em>Tu prends une photo avec ton téléphone.</em></p>` });
      },
    },
  ],
  hints: [
    'L\'armoire électrique est fermée à clé : la clé est dans le casier à code de la salle Sormiou.',
    'Le but est LAMPE = 1 : P2, P3 et P4 doivent toutes valoir 1. Commence par P3 : que doit valoir B ?',
    'B = 0. Ensuite P4 impose C = 1, et P1 impose A = 1 : A = 1, B = 0, C = 1. Lis 101 en binaire avec le mémo du bureau (colonnes 4, 2, 1). Tu peux taper le chiffre sans tester la lampe pour ne pas réveiller le gardien.',
  ],
};
