import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { IntroScene } from './scenes/IntroScene.js';
import { HubScene } from './scenes/HubScene.js';
import { RoomScene } from './scenes/RoomScene.js';
import { UIScene } from './scenes/UIScene.js';
import { EndScene } from './scenes/EndScene.js';
import { toggleMute } from './audio/sound.js';
import { net, esc } from './net/multiplayer.js';
import { endGame } from './scenes/endGame.js';
import { openDialog } from './ui/dialog.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0e0f1a',
  physics: { default: 'arcade', arcade: { debug: false } },
  // S'adapte à la taille de l'écran (ordinateur, tablette, téléphone)
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, MenuScene, IntroScene, HubScene, RoomScene, UIScene, EndScene],
});

// En développement uniquement : accès au jeu depuis la console (window.game)
if (import.meta.env.DEV) window.game = game;

// Partie à 2 : la fin de partie du coéquipier (attrapé, évadé…) vaut aussi pour nous
net.events.on('end', (success, reason) => {
  const scene = game.scene.getScenes(true).find((s) => s.scene.key !== 'End');
  if (scene) endGame(scene, success, reason);
});
net.events.on('mate-left', (name) => {
  openDialog({ title: 'Coéquipier déconnecté', body: `<p><strong>${esc(name)}</strong> a quitté la partie. Tu continues seul : tu peux maintenant tout faire.</p>` });
});

// Touche M : couper / remettre le son, partout dans le jeu
// (les touches tapées dans une boîte de dialogue n'arrivent pas jusqu'ici)
window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') toggleMute();
});
