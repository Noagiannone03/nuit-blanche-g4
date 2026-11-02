import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { PSEUDO_CODE, PC_PASSWORD } from '../puzzles/algorithmique.js';
import { ROOM_DIGITS } from '../puzzles/code.js';
import { PENALTY_ERROR } from '../config.js';
import { askAnswer, decorHint } from './helpers.js';

// 2e énigme : il faut le mot de passe trouvé dans le casier de Sormiou.
// Elle donne la clé de l'armoire électrique de l'amphi Mont Ventoux.
const KEY_TEXT = '<p>L\'imprimante se réveille et crache une feuille. Scotchée dessous, une petite clé avec une étiquette :</p><p class="hand">ARMOIRE ÉLECTRIQUE — AMPHI MONT VENTOUX</p>';

function openProgram() {
  askAnswer({
    roomKey: 'callelongue',
    title: 'PC du formateur — programme.algo',
    body: `<p>Le dernier fichier ouvert. Le bouton « Exécuter » est cassé : à toi de jouer le rôle de l'ordinateur.</p><pre>${PSEUDO_CODE}</pre><p>Qu'affiche ce programme ?</p>`,
    answer: ROOM_DIGITS.callelongue,
    placeholder: 'Valeur affichée',
    success: `<p>Le terminal affiche <strong>${ROOM_DIGITS.callelongue}</strong> puis : <em>« Bravo, tu ferais un bon compilateur. »</em></p>${KEY_TEXT}`,
    onSolve: () => state.addItem('cle-armoire'),
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
        if (state.hasItem('cle-armoire')) {
          openDialog({ title: 'Imprimante', body: `${KEY_TEXT}<p><em>La clé est dans ta poche.</em></p>` });
        } else {
          openDialog({ title: 'Imprimante', body: '<p>L\'imprimante est en veille. Elle attend sûrement qu\'un programme se termine sur le PC…</p>' });
        }
      },
    },
    {
      label: 'Rangée de PC éteints',
      type: 'pcRow',
      x: 780, y: 450, w: 220, h: 110, color: 0x2b2f3a,
      onUse() {
        decorHint(
          'callelongue-astuce',
          'Rangée de PC',
          '<p>Sur un écran éteint, un post-it laissé par un ancien :</p><p class="hand">Pour un algo, fais un tableau i | x<br>et remplis une ligne par tour de boucle.<br>Tour 1 : i = 1 (impair) → x = 0 − 1 = −1<br>Tour 2 : i = 2 (pair) → x = −1 + 2 = 1</p>',
        );
      },
    },
  ],
  hints: [
    'Le mot de passe du PC est rangé dans le casier de la salle Sormiou : il faut d\'abord ouvrir ce casier.',
    'Déroule la boucle : i=1 → x=-1, i=2 → x=1, i=3 → x=0… continue jusqu\'à i=5.',
  ],
};
