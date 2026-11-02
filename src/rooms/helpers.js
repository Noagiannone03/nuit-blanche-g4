import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { PENALTY_ERROR } from '../config.js';

/**
 * Dialogue "entrer une réponse" commun à toutes les salles. body : HTML ou élément DOM.
 * onSolve : appelé une fois l'énigme résolue, pour donner l'objet qui sert dans une autre salle.
 */
export function askAnswer({ roomKey, title, body, answer, placeholder = 'Ta réponse', success, onSolve, solvedBody = '' }) {
  if (state.data.solved[roomKey]) {
    openDialog({ title, body: `<p><strong>✓ Déjà résolu : ${state.data.digits[roomKey]}</strong></p>${solvedBody}` });
    return;
  }
  openDialog({
    title,
    body,
    input: { placeholder, maxLength: 12 },
    onSubmit(value, ui) {
      if (value.toUpperCase() === String(answer).toUpperCase()) {
        state.solve(roomKey, answer);
        onSolve?.();
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

/** Un objet verrouillé : on explique ce qui manque et où chercher, sans pénalité. */
export function lockedDialog(title, body) {
  openDialog({ title: `${title} — verrouillé`, body });
}
