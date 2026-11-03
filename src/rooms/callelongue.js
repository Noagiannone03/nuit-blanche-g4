import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { PSEUDO_CODE, PC_PASSWORD } from '../puzzles/algorithmique.js';
import { TASKS } from '../puzzles/planning.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { PENALTY_ERROR } from '../config.js';
import { askAnswer, decorHint } from './helpers.js';
import { net, ROLES, esc } from '../net/multiplayer.js';

// 3e énigme : il faut le mot de passe projeté dans l'amphi Mont Ventoux (une fois le courant rétabli).
// L'imprimante sort alors les durées des tâches dont Ste Victoire a besoin.
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
    success: `<p>Le terminal affiche <strong>${ROOM_DIGITS.callelongue}</strong> puis : <em>« Bravo, tu ferais un bon compilateur. »</em></p>${PRINT_TEXT()}<p><em>Tu gardes la feuille sur toi.</em></p>`,
    onSolve: () => state.addItem('durees'),
  });
}

function openPc() {
  if (state.hasItem('pc-unlocked')) {
    openProgram();
    return;
  }
  const lock = '<p>« Session Callelongue ». Il faut un mot de passe.</p><p>Un post-it sur l\'écran : <em>« Le mdp ? Sur la dernière diapo de notre présentation, dans l\'amphi. »</em></p>';
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
  intro: 'Les écrans sont en veille. Un seul PC est resté allumé.',
  objects: [
    {
      label: 'PC du formateur',
      type: 'pc',
      x: 480, y: 230, w: 200, h: 130, color: 0x111318,
      onUse: openPc,
    },
    {
      label: 'Imprimante',
      role: 'enq',
      type: 'printer',
      x: 180, y: 430, w: 150, h: 100, color: 0xcfd2dc,
      onUse() {
        if (state.hasItem('durees')) {
          openDialog({ title: 'Imprimante', body: `${PRINT_TEXT()}<p><em>La feuille est dans ta poche.</em></p>` });
        } else {
          openDialog({ title: 'Imprimante', body: '<p>L\'imprimante est en veille. Elle attend sûrement qu\'un programme se termine sur le PC…</p>' });
        }
      },
    },
    {
      label: 'Rangée de PC éteints',
      role: 'enq',
      type: 'pcRow',
      x: 780, y: 450, w: 220, h: 110, color: 0x2b2f3a,
      onUse() {
        decorHint(
          'callelongue-astuce',
          'Rangée de PC',
          '<p>Sur un écran éteint, un post-it laissé par un ancien :</p><p class="hand">Pour un algo, écris la valeur de « nombre » après chaque ligne.<br>Un SI n\'exécute qu\'UNE des deux branches.<br>Ligne 1 : nombre = 3<br>Ligne 2 : nombre = 3 + 2 = 5</p>',
        );
      },
    },
  ],
  hints: [
    'Le mot de passe du PC est projeté dans l\'amphi Mont Ventoux : il s\'allume une fois le boîtier électrique résolu.',
    'Note la valeur de nombre après chaque ligne : 3, puis 5. 5 n\'est pas plus grand que 6 : on fait le SINON, nombre vaut 10. Continue…',
  ],
};
