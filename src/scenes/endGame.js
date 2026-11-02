import { closeDialog } from '../ui/dialog.js';

/** Arrête toutes les scènes de jeu et affiche l'écran de fin. */
export function endGame(scene, success, reason) {
  closeDialog();
  const manager = scene.game.scene;
  for (const s of manager.getScenes(true)) manager.stop(s.scene.key);
  manager.start('End', { success, reason });
}
