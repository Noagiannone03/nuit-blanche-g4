import Phaser from 'phaser';
import { createCharacter, PLAYER_PALETTE, MATE_PALETTE, GUARD_PALETTE } from '../art/characters.js';

// Prépare tout ce qui est graphique (aucun fichier image : tout est généré en code)
// et attend le chargement des polices avant d'afficher le menu.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    createCharacter(this, 'player', PLAYER_PALETTE);
    createCharacter(this, 'mate', MATE_PALETTE);
    createCharacter(this, 'guard', GUARD_PALETTE);
    this.makeLightTexture();
    this.makeFlashTexture();

    const fonts = Promise.all([
      document.fonts.load('20px "Permanent Marker"'),
      document.fonts.load('600 20px Caveat'),
      document.fonts.load('400 20px Nunito'),
      document.fonts.load('800 20px Nunito'),
    ]);
    // si les polices ne chargent pas (hors ligne), on démarre quand même après 2,5 s
    const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
    Promise.race([fonts, timeout]).finally(() => this.scene.start('Menu'));
  }

  // Dégradé radial blanc → transparent, teinté à l'usage (lampe du gardien, écran du téléphone…)
  makeLightTexture() {
    const size = 256;
    const tex = this.textures.createCanvas('light', size, size);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }

  // Disque du flash du téléphone : plein au centre, bord adouci (sert de "gomme" dans le noir)
  makeFlashTexture() {
    const size = 256;
    const tex = this.textures.createCanvas('flash', size, size);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.6, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }
}
