import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { PSEUDO_CODE, PC_PASSWORD } from '../puzzles/algorithmique.js';
import { TASKS } from '../puzzles/planning.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { PENALTY_ERROR } from '../config.js';
import { askAnswer, decorHint, timeWaster } from './helpers.js';
import { net, ROLES, esc } from '../net/multiplayer.js';

// 3e énigme : le PC ne s'allume qu'une fois le courant rétabli (disjoncteur de Mont Ventoux),
// et son mot de passe est sur un post-it jaune de Sormiou.
// Une fois le programme résolu, l'imprimante sort les durées des tâches dont Ste Victoire a besoin
// (il faut aller la chercher en cliquant sur l'imprimante).
const durationsTable = () =>
  `<table><thead><tr><th>Tâche</th><th>Durée</th></tr></thead><tbody>${TASKS.map((t) => `<tr><td>${t.id} — ${t.name}</td><td>${t.duration} jour${t.duration > 1 ? 's' : ''}</td></tr>`).join('')}</tbody></table>`;
const PRINT_TEXT = () => `<p>L'imprimante se réveille et crache une feuille : <em>« Projet Évasion — durées des tâches »</em>.</p>${durationsTable()}`;

function openProgram() {
  askAnswer({
    roomKey: 'callelongue',
    title: 'PC du formateur — programme.algo',
    doc: `<p>Le dernier fichier ouvert. Le bouton « Exécuter » est cassé : à toi de jouer le rôle de l'ordinateur.</p><pre>${PSEUDO_CODE}</pre>`,
    body: '<p>Qu\'affiche ce programme ?</p>',
    answer: ROOM_DIGITS.callelongue,
    placeholder: 'Valeur affichée',
    success: `<p>Le terminal affiche <strong>${ROOM_DIGITS.callelongue}</strong> puis : <em>« Bravo, tu ferais un bon compilateur. »</em></p><p>Quelque part dans la salle, une machine se met à ronronner…</p>`,
  });
}

function openPc() {
  if (!state.hasItem('courant')) {
    openDialog({ title: 'PC du formateur', body: '<p>L\'écran reste noir. Pas de courant.</p>' });
    return;
  }
  if (state.hasItem('pc-unlocked')) {
    openProgram();
    return;
  }
  const lock = '<p>« Session Callelongue ». Il faut un mot de passe.</p>';
  // à 2 : seul le technicien a le clavier
  if (net.online && net.role === 'enq') {
    openDialog({ title: 'PC du formateur — session verrouillée', body: `${lock}<p><em>C'est <strong>${esc(net.mate.name)}</strong> (${ROLES.tech.icon} ${ROLES.tech.name}) qui a le clavier.</em></p>` });
    return;
  }
  openDialog({
    title: 'PC du formateur — session verrouillée',
    body: lock,
    input: { placeholder: 'Mot de passe', maxLength: 20 },
    submitLabel: 'Se connecter',
    onSubmit(value, ui) {
      if (value.toUpperCase() === PC_PASSWORD) {
        state.addItem('pc-unlocked');
        openProgram();
      } else {
        state.penalize();
        ui.feedback(`Mot de passe incorrect. +${PENALTY_ERROR} min.`);
      }
    },
  });
}

export default {
  key: 'callelongue',
  name: 'Salle de cours Callelongue',
  domain: 'Algorithmique / code',
  color: 0x1f3b3a,
  intro: 'Des rangées d\'écrans éteints. Ça sent la poussière et le café froid.',
  decor: [
    { type: 'windowNight', x: 160, y: 150, w: 110, h: 120 },
    { type: 'radiator', x: 165, y: 336, w: 100, h: 30 },
    { type: 'poster', x: 640, y: 160, w: 80, h: 100, color: 0x2e9e5b, text: 'while(1)' },
    { type: 'poster', x: 760, y: 190, w: 80, h: 100, color: 0x3b6ea8, text: 'Git' },
    { type: 'serverRack', x: 18, y: 260, w: 66, h: 220 },
    { type: 'studentPc', x: 290, y: 420, w: 120, h: 90 },
    { type: 'chairs', x: 300, y: 520, w: 260, h: 56, color: 0x3a4a6a },
    { type: 'bin', x: 250, y: 575, w: 30, h: 40 },
  ],
  objects: [
    {
      label: 'PC du formateur',
      // écran éteint tant que le courant n'est pas rétabli
      get type() {
        return state.hasItem('courant') ? 'pc' : 'pcOff';
      },
      x: 480, y: 230, w: 200, h: 130, color: 0x111318,
      onUse: openPc,
    },
    {
      label: 'Imprimante',
      role: 'enq',
      type: 'printer',
      x: 180, y: 430, w: 150, h: 100, color: 0xcfd2dc,
      onUse() {
        if (state.data.solved.callelongue) {
          const first = !state.hasItem('durees');
          state.addItem('durees');
          openDialog({ title: 'Imprimante', body: `${PRINT_TEXT()}<p><em>${first ? 'Tu gardes la feuille sur toi.' : 'La feuille est dans ta poche.'}</em></p>` });
        } else {
          openDialog({ title: 'Imprimante', body: '<p>L\'imprimante est en veille. Elle attend sûrement qu\'un programme se termine sur le PC…</p>' });
        }
      },
    },
    {
      label: 'Rangée de PC',
      role: 'enq',
      type: 'pcRow',
      x: 780, y: 450, w: 220, h: 110, color: 0x2b2f3a,
      onUse() {
        if (!state.hasItem('courant')) {
          openDialog({ title: 'Rangée de PC', body: '<p>Les écrans sont éteints. Pas de courant.</p>' });
          return;
        }
        decorHint(
          'callelongue-astuce',
          'Rangée de PC',
          '<p>Un des PC s\'est rallumé tout seul. À l\'écran, un message laissé par un ancien :</p><pre>Pour un algo, écris la valeur de « nombre » après chaque ligne.\nUn SI n\'exécute qu\'UNE des deux branches.\nLigne 1 : nombre = 3\nLigne 2 : nombre = 3 + 2 = 5</pre>',
        );
      },
    },
    {
      label: 'PC du fond',
      type: 'studentPc',
      x: 500, y: 465, w: 120, h: 90, color: 0x15171c,
      onUse() {
        timeWaster({
          title: 'PC du fond',
          needsPower: true,
          off: '<p>Écran noir. Pas de courant.</p>',
          intro: '<p>Quelqu\'un a laissé un démineur ouvert, partie en cours…</p>',
          action: 'Finir la partie',
          result: '<p>BOUM. Tu as cliqué sur une mine au dernier coup. Évidemment.</p>',
          minutes: 10,
        });
      },
    },
  ],
  hints: [
    'Le mot de passe de la session est dans la salle Sormiou.',
    'Note la valeur de nombre après chaque ligne : 3, puis 5. 5 n\'est pas plus grand que 6 : on fait le SINON, nombre vaut 10. Continue…',
  ],
};
