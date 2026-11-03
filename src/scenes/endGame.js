import { closeDialog } from '../ui/dialog.js';
import { sendEnd } from '../net/multiplayer.js';

/** Arrête toutes les scènes de jeu et affiche l'écran de fin (à 2 : chez les deux joueurs). */
export function endGame(scene, success, reason) {
  sendEnd(success, reason);
  closeDialog();
  const manager = scene.game.scene;
  for (const s of manager.getScenes(true)) manager.stop(s.scene.key);
  manager.start('End', { success, reason });
}
