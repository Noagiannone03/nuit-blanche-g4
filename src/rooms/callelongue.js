import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { PSEUDO_CODE, PC_PASSWORD } from '../puzzles/algorithmique.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { PENALTY_ERROR } from '../config.js';
import { askAnswer, decorHint } from './helpers.js';

function openProgram() {
  askAnswer({
    roomKey: 'callelongue',
    title: 'PC du formateur — programme.algo',
    body: `<p>Le dernier fichier ouvert. Le bouton « Exécuter » est cassé : à toi de jouer le rôle de l'ordinateur.</p><pre>${PSEUDO_CODE}</pre><p>Qu'affiche ce programme ?</p>`,
    answer: ROOM_DIGITS.callelongue,
    placeholder: 'Valeur affichée',
    success: `<p>Le terminal affiche <strong>${ROOM_DIGITS.callelongue}</strong> puis : <em>« Bravo, tu ferais un bon compilateur. »</em></p>`,
  });
}

function openPc() {
  if (state.hasItem('pc-unlocked')) {
    openProgram();
    return;
  }
  openDialog({
    title: 'PC du formateur — session verrouillée',
    body: '<p>« Session Callelongue ». Il faut un mot de passe.</p>',
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
      type: 'printer',
      x: 180, y: 430, w: 150, h: 100, color: 0xcfd2dc,
      onUse() {
        decorHint('callelongue-memo', 'Imprimante', '<p>Une feuille oubliée dans le bac :</p><p class="hand">i % 2 == 0 → i est pair.<br>Astuce : fais un tableau avec une colonne i et une colonne x.</p>');
      },
    },
    {
      label: 'Rangée de PC éteints',
      type: 'pcRow',
      x: 780, y: 450, w: 220, h: 110, color: 0x2b2f3a,
      onUse() {
        openDialog({ title: 'Rangée de PC', body: '<p>Tous éteints. Sur un écran, un post-it : « Le mot de passe est dans la salle d\'à côté… pense aux post-it ! »</p>' });
      },
    },
  ],
  hints: [
    'Le mot de passe du PC est caché dans la salle Sormiou. Fouille les objets du bureau.',
    'Déroule la boucle : i=1 → x=-1, i=2 → x=1, i=3 → x=0… continue jusqu\'à i=5.',
  ],
};
