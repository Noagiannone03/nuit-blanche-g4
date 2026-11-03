import { state } from '../state/GameState.js';
import { openDialog } from '../ui/dialog.js';
import { PENALTY_ERROR } from '../config.js';
import { sfx } from '../audio/sound.js';
import { net, ROLES, esc } from '../net/multiplayer.js';

/**
 * Dialogue "entrer une réponse" commun à toutes les salles. body : HTML.
 * doc : le document à lire (programme, énigme…). En solo il est affiché avant body ;
 * à 2, seul l'enquêteur le voit et seul le technicien peut taper la réponse.
 * onSolve : appelé une fois l'énigme résolue, pour donner l'objet qui sert dans une autre salle.
 */
export function askAnswer({ roomKey, title, doc = '', body, answer, placeholder = 'Ta réponse', success, onSolve, solvedBody = '' }) {
  if (state.data.solved[roomKey]) {
    openDialog({ title, body: `<p><strong>✓ Déjà résolu : ${state.data.digits[roomKey]}</strong></p>${solvedBody}` });
    return;
  }
  if (net.online && net.role === 'enq') {
    const mate = `<strong>${esc(net.mate.name)}</strong> (${ROLES.tech.icon} ${ROLES.tech.name})`;
    openDialog({ title, body: `${doc}${body}<p><em>Tu n'as pas le clavier : c'est ${mate} qui tape la réponse. Dis-lui ce que tu trouves !</em></p>` });
    return;
  }
  if (net.online && doc) {
    const mate = `<strong>${esc(net.mate.name)}</strong> (${ROLES.enq.icon} ${ROLES.enq.name})`;
    doc = `<p><em>Il y a un texte ici, mais sans tes lunettes tout est flou… ${mate} doit venir te le lire.</em></p>`;
  }
  openDialog({
    title,
    body: `${doc}${body}`,
    input: { placeholder, maxLength: 12 },
    onSubmit(value, ui) {
      if (value.toUpperCase() === String(answer).toUpperCase()) {
        state.solve(roomKey, answer);
        onSolve?.();
        ui.close();
        openDialog({ title: 'Bien joué !', body: success });
        sfx.success();
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
