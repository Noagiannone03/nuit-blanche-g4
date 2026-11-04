import Phaser from 'phaser'; // on charge Phaser, l'outil qui fait marcher le jeu
import { state } from '../state/GameState.js'; // on récupère l'état du jeu (pseudo, sauvegarde…)
import { C, FONT_HAND, FONT_TITLE, txt } from '../ui/theme.js'; // on récupère les couleurs, les polices et l'outil pour écrire
import { sfx, setAmbience } from '../audio/sound.js'; // on récupère les bruitages et la musique de fond
import { net, ROLES } from '../net/multiplayer.js'; // on récupère les infos du mode à 2 joueurs
import { isTouch } from '../ui/touch.js'; // on récupère l'outil qui détecte un écran tactile

const LINES = [ // liste des phrases de l'histoire, affichées une par une
  'Lundi soir, Cercle de projets. Tout le monde est parti.', // phrase 1 de l'histoire
  'Toi, tu voulais juste finir « un dernier commit »…', // phrase 2 de l'histoire
  'Tu te réveilles la tête sur le clavier. L\'horloge affiche 00:00.', // phrase 3 de l'histoire
  'Les portes sont verrouillées. La sortie demande un code à 4 chiffres.', // phrase 4 de l'histoire
  'À 9h00, l\'école ouvre : si on te trouve ici, c\'est fini.', // phrase 5 de l'histoire
  'Le courant est coupé : dans les salles, seul le flash de ton téléphone t\'éclaire.', // phrase 6 de l'histoire
];

// Intro sur une page de cahier : chaque ligne s'écrit lettre par lettre.
export class IntroScene extends Phaser.Scene { // on crée la scène d'intro (scène = un écran du jeu)
  constructor() { // fonction lancée quand on fabrique la scène
    super('Intro'); // on donne le nom « Intro » à cette scène
  }

  create() { // create() se lance une fois quand la scène démarre
    const { width, height } = this.scale; // on récupère la largeur et la hauteur de l'écran
    this.cameras.main.setBackgroundColor(0x3a2f28); // on met un fond marron foncé

    // Page de cahier : lignes bleues + marge rouge
    const g = this.add.graphics(); // on prépare un pinceau pour dessiner des formes
    g.fillStyle(C.paper).fillRect(60, 20, width - 120, height - 40); // on dessine la feuille de papier
    g.lineStyle(1, 0x9ab6e0, 0.8); // on choisit un trait fin bleu clair
    // on trace les lignes bleues du cahier, tous les 34 pixels
    for (let y = 90; y < height - 30; y += 34) g.lineBetween(60, y, width - 60, y);
    g.lineStyle(2, 0xe06a6a, 0.9).lineBetween(130, 20, 130, height - 20); // on trace la marge rouge à gauche
    g.fillStyle(0x3a2f28); // on choisit la couleur du fond pour les trous
    for (let y = 60; y < height - 40; y += 60) g.fillCircle(84, y, 8); // on dessine les trous du cahier, tous les 60 pixels

    // on écrit le titre avec le pseudo du joueur
    txt(this, 150, 34, `Journal de ${state.data.playerName}`, { size: 34, font: FONT_TITLE, color: C.blue });

    setAmbience('dark'); // on lance l'ambiance sonore « sombre »
    // à 2 : une ligne de plus pour présenter les rôles
    this.lines = net.online // si on joue à 2 en ligne…
      // …on ajoute une phrase qui présente les deux rôles
      ? [...LINES, `Ce soir, à deux : toi ${ROLES[net.role].icon} ${ROLES[net.role].name}, ${net.mate.name} ${ROLES[net.mate.role].icon} ${ROLES[net.mate.role].name}.`]
      : LINES; // …sinon on garde juste les phrases normales
    this.index = 0; // numéro de la prochaine phrase à écrire
    this.typing = null; // aucune phrase n'est en train de s'écrire pour l'instant
    // on crée un texte vide pour chaque phrase, l'un sous l'autre
    this.texts = this.lines.map((_, i) => txt(this, 150, 110 + i * 68, '', { size: 30, font: FONT_HAND, weight: '600', color: C.ink, wordWrap: { width: 720 } }));
    // petit texte en bas à droite pour dire comment continuer
    this.prompt = txt(this, width - 80, height - 46, isTouch() ? 'Touche l\'écran pour continuer →' : 'Espace pour continuer →', { size: 24, font: FONT_HAND, weight: '600', color: C.red }).setOrigin(1, 0.5);
    this.tweens.add({ targets: this.prompt, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 }); // le texte clignote doucement, sans fin

    this.next(); // on commence à écrire la première phrase
    this.input.keyboard.on('keydown-SPACE', () => this.next()); // touche Espace = passer à la suite
    this.input.keyboard.on('keydown-ENTER', () => this.next()); // touche Entrée = passer à la suite
    this.input.on('pointerdown', () => this.next()); // clic ou toucher l'écran = passer à la suite
  }

  next() { // fonction appelée à chaque fois que le joueur veut avancer
    // une ligne est en train de s'écrire → on l'affiche d'un coup
    if (this.typing) { // si une phrase est en train de s'écrire…
      this.typing.remove(); // on arrête l'écriture lettre par lettre
      this.typing = null; // plus rien ne s'écrit
      this.texts[this.index - 1].setText(this.lines[this.index - 1]); // on affiche la phrase entière d'un coup
      return; // on s'arrête là pour cette fois
    }
    if (this.index >= this.lines.length) { // si toutes les phrases sont déjà écrites…
      this.cameras.main.fadeOut(400, 0, 0, 0); // l'écran devient noir en 400 millisecondes
      // une fois tout noir, on va dans le couloir (scène Hub)
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Hub'));
      return; // on s'arrête là
    }
    const line = this.lines[this.index]; // la phrase à écrire maintenant
    const target = this.texts[this.index]; // le texte où on va l'écrire
    let n = 0; // compteur de lettres déjà écrites
    this.typing = this.time.addEvent({ // on lance un minuteur qui se répète
      delay: 22, // toutes les 22 millisecondes
      repeat: line.length - 1, // autant de fois qu'il y a de lettres
      callback: () => { // à chaque fois, on fait ceci :
        n += 1; // une lettre de plus
        target.setText(line.slice(0, n)); // on affiche le début de la phrase jusqu'à cette lettre
        if (n % 2) sfx.type(); // une lettre sur deux, petit bruit de machine à écrire
        if (n >= line.length) this.typing = null; // phrase finie : plus rien ne s'écrit
      },
    });
    this.index += 1; // on passe à la phrase suivante
    // si c'était la dernière phrase, on écrit « pour commencer » au lieu de « pour continuer »
    if (this.index === this.lines.length) this.prompt.setText(isTouch() ? 'Touche l\'écran pour commencer →' : 'Espace pour commencer →');
  }
}
