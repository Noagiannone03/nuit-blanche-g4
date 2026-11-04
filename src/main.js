import Phaser from 'phaser'; // on importe Phaser, l'outil qui fait marcher le jeu
import { GAME_WIDTH, GAME_HEIGHT } from './config.js'; // on récupère la largeur et la hauteur du jeu
import { BootScene } from './scenes/BootScene.js'; // on importe la scène de démarrage (scène = un écran du jeu)
import { MenuScene } from './scenes/MenuScene.js'; // on importe l'écran du menu
import { IntroScene } from './scenes/IntroScene.js'; // on importe l'écran d'introduction
import { HubScene } from './scenes/HubScene.js'; // on importe l'écran du couloir
import { RoomScene } from './scenes/RoomScene.js'; // on importe l'écran des salles
import { UIScene } from './scenes/UIScene.js'; // on importe la barre d'interface (horloge, indices…)
import { EndScene } from './scenes/EndScene.js'; // on importe l'écran de fin
import { toggleMute } from './audio/sound.js'; // fonction pour couper ou remettre le son
import { net, esc } from './net/multiplayer.js'; // outils du jeu à 2 joueurs en réseau
import { endGame } from './scenes/endGame.js'; // fonction qui termine la partie
import { openDialog } from './ui/dialog.js'; // fonction qui ouvre une boîte de dialogue

const game = new Phaser.Game({ // on crée le jeu avec ses réglages
  type: Phaser.AUTO, // Phaser choisit tout seul la meilleure façon de dessiner
  parent: 'game', // le jeu s'affiche dans la balise HTML d'id 'game'
  width: GAME_WIDTH, // largeur du jeu en pixels
  height: GAME_HEIGHT, // hauteur du jeu en pixels
  backgroundColor: '#0e0f1a', // couleur du fond (bleu nuit très foncé)
  physics: { default: 'arcade', arcade: { debug: false } }, // physique simple pour les déplacements et collisions
  // S'adapte à la taille de l'écran (ordinateur, tablette, téléphone)
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, // FIT = agrandit sans déformer, CENTER_BOTH = centré
  scene: [BootScene, MenuScene, IntroScene, HubScene, RoomScene, UIScene, EndScene], // liste de tous les écrans du jeu, dans l'ordre
});

// En développement uniquement : accès au jeu depuis la console (window.game)
if (import.meta.env.DEV) window.game = game; // en mode test, on peut taper « game » dans la console

// Partie à 2 : la fin de partie du coéquipier (attrapé, évadé…) vaut aussi pour nous
net.events.on('end', (success, reason) => { // quand le coéquipier annonce la fin de partie…
  const scene = game.scene.getScenes(true).find((s) => s.scene.key !== 'End'); // on cherche un écran actif qui n'est pas l'écran de fin
  if (scene) endGame(scene, success, reason); // s'il y en a un, on termine la partie nous aussi
});
net.events.on('mate-left', (name) => { // quand le coéquipier quitte la partie…
  // on affiche un message : le coéquipier est parti
  openDialog({ title: 'Coéquipier déconnecté', body: `<p><strong>${esc(name)}</strong> a quitté la partie. Tu continues seul : tu peux maintenant tout faire.</p>` });
});

// Touche M : couper / remettre le son, partout dans le jeu
// (les touches tapées dans une boîte de dialogue n'arrivent pas jusqu'ici)
window.addEventListener('keydown', (e) => { // on écoute chaque touche appuyée sur le clavier
  if (e.key === 'm' || e.key === 'M') toggleMute(); // si c'est la touche M, on coupe ou remet le son
});
