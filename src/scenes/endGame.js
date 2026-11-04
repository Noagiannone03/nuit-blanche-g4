import { closeDialog } from '../ui/dialog.js'; // on récupère la fonction qui ferme la boîte de dialogue
import { sendEnd } from '../net/multiplayer.js'; // on récupère la fonction qui prévient le coéquipier de la fin

/** Arrête toutes les scènes de jeu et affiche l'écran de fin (à 2 : chez les deux joueurs). */
export function endGame(scene, success, reason) { // fonction de fin : scene = écran actuel, success = gagné ou non
  sendEnd(success, reason); // on prévient l'autre joueur que la partie est finie
  closeDialog(); // on ferme la boîte de dialogue si elle est ouverte
  const manager = scene.game.scene; // manager = le chef qui gère toutes les scènes (écrans du jeu)
  for (const s of manager.getScenes(true)) manager.stop(s.scene.key); // on arrête chaque scène qui tourne encore
  manager.start('End', { success, reason }); // on lance l'écran de fin en lui disant si on a gagné
}
