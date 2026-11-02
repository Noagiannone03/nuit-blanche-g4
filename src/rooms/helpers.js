import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { PENALTY_ERROR } from '../config.js';

/** Dialogue "entrer une réponse" commun à toutes les salles. body : HTML ou élément DOM. */
export function askAnswer({ roomKey, title, body, answer, placeholder = 'Ta réponse', success }) {
  if (state.data.solved[roomKey]) {
    openDialog({ title, body: `<p><strong>✓ Déjà résolu : ${state.data.digits[roomKey]}</strong></p>` });
    return;
  }
  openDialog({
    title,
    body,
    input: { placeholder, maxLength: 12 },
    onSubmit(value, ui) {
      if (value.toUpperCase() === String(answer).toUpperCase()) {
        state.solve(roomKey, answer);
        ui.close();
        openDialog({ title: 'Bien joué !', body: success });
      } else {
        state.penalize();
        ui.feedback(`Mauvaise réponse… l'heure tourne : +${PENALTY_ERROR} min.`);
      }
    },
  });
}

/** Un indice caché dans le décor : gratuit, mais compté dans les statistiques. */
export function decorHint(id, title, body) {
  state.foundDecorHint(id);
  openDialog({ title, body });
}
