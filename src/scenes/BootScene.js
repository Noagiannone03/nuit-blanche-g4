import Phaser from 'phaser'; // on importe Phaser, l'outil qui fait marcher le jeu
import { createCharacter, GUARD_PALETTE } from '../art/characters.js'; // outils pour dessiner les personnages et les couleurs du gardien
import { loadSkin, paletteFromSkin, DEFAULT_MATE_SKIN } from '../art/skins.js'; // outils pour lire le look (skin) choisi par le joueur

// Prépare tout ce qui est graphique (aucun fichier image : tout est généré en code)
// et attend le chargement des polices avant d'afficher le menu.
export class BootScene extends Phaser.Scene { // on crée la scène de démarrage (scène = un écran du jeu)
  constructor() { // constructor = fonction lancée à la création de la scène
    super('Boot'); // on donne le nom 'Boot' à cette scène
  }

  create() { // create = fonction lancée quand la scène démarre
    createCharacter(this, 'player', paletteFromSkin(loadSkin())); // le skin choisi dans le menu
    createCharacter(this, 'mate', paletteFromSkin(DEFAULT_MATE_SKIN)); // remplacé par celui du coéquipier
    createCharacter(this, 'guard', GUARD_PALETTE); // on dessine le gardien avec ses couleurs
    this.makeLightTexture(); // on fabrique l'image de lumière ronde
    this.makeFlashTexture(); // on fabrique l'image du flash du téléphone

    const fonts = Promise.all([ // on attend que toutes les polices d'écriture soient chargées
      document.fonts.load('20px "Permanent Marker"'), // police « Permanent Marker »
      document.fonts.load('600 20px Caveat'), // police « Caveat » (en gras moyen)
      document.fonts.load('400 20px Nunito'), // police « Nunito » normale
      document.fonts.load('800 20px Nunito'), // police « Nunito » très grasse
    ]);
    // si les polices ne chargent pas (hors ligne), on démarre quand même après 2,5 s
    const timeout = new Promise((resolve) => setTimeout(resolve, 2500)); // un minuteur qui se termine après 2,5 secondes
    Promise.race([fonts, timeout]).finally(() => this.scene.start('Menu')); // dès que le premier des deux finit, on va au menu
  }

  // Dégradé radial blanc → transparent, teinté à l'usage (lampe du gardien, écran du téléphone…)
  makeLightTexture() { // fonction qui fabrique l'image de lumière
    const size = 256; // taille de l'image : 256 pixels de côté
    const tex = this.textures.createCanvas('light', size, size); // on crée une image vide appelée 'light' où on peut dessiner
    const ctx = tex.getContext(); // ctx = le pinceau pour dessiner dans cette image
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); // dégradé en rond, du centre vers le bord
    grad.addColorStop(0, 'rgba(255,255,255,1)'); // au centre : blanc complètement visible
    grad.addColorStop(0.35, 'rgba(255,255,255,0.35)'); // un peu plus loin : blanc presque transparent
    grad.addColorStop(1, 'rgba(255,255,255,0)'); // au bord : complètement transparent
    ctx.fillStyle = grad; // on prend le dégradé comme couleur de peinture
    ctx.fillRect(0, 0, size, size); // on peint tout le carré avec ce dégradé
    tex.refresh(); // on met à jour l'image pour que le jeu la voie
  }

  // Disque du flash du téléphone : plein au centre, bord adouci (sert de "gomme" dans le noir)
  makeFlashTexture() { // fonction qui fabrique l'image du flash
    const size = 256; // taille de l'image : 256 pixels de côté
    const tex = this.textures.createCanvas('flash', size, size); // on crée une image vide appelée 'flash'
    const ctx = tex.getContext(); // ctx = le pinceau pour dessiner dans cette image
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); // dégradé en rond, du centre vers le bord
    grad.addColorStop(0, 'rgba(255,255,255,1)'); // au centre : blanc complètement visible
    grad.addColorStop(0.6, 'rgba(255,255,255,1)'); // jusqu'à 60 % du rayon : toujours blanc plein
    grad.addColorStop(1, 'rgba(255,255,255,0)'); // au bord : complètement transparent
    ctx.fillStyle = grad; // on prend le dégradé comme couleur de peinture
    ctx.fillRect(0, 0, size, size); // on peint tout le carré avec ce dégradé
    tex.refresh(); // on met à jour l'image pour que le jeu la voie
  }
}
