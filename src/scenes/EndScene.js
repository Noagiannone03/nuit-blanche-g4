import Phaser from 'phaser'; // on importe Phaser, le moteur du jeu
import { state } from '../state/GameState.js'; // on importe l'état de la partie
import { computeScore, addEntry } from '../state/leaderboard.js'; // on importe le calcul du score et le classement
// on importe couleurs, polices et dessins du thème
import { C, FONT_TITLE, FONT_HAND, txt, drawChalkboard, chalkButton } from '../ui/theme.js';
import { sfx, setAmbience } from '../audio/sound.js'; // on importe les sons
import { isTouch } from '../ui/touch.js'; // on importe : l'écran est-il tactile ?

const ENDINGS = { // les différentes fins possibles
  // fin « évadé » : tampon, texte, couleur, pose
  escaped: { stamp: 'ÉVADÉ !', text: 'La porte s\'ouvre dans un déclic. Tu sors dans la nuit, ton projet sauvegardé sur une clé USB.', color: C.green, pose: 'player-down' },
  // fin « temps écoulé » : tampon, texte, couleur, pas de pose
  timeout: { stamp: 'COLLÉ !', text: '9h00 : l\'équipe pédagogique arrive… et te trouve endormi dans le couloir.', color: C.red, pose: null },
  // fin « attrapé » : tampon, texte, couleur, pose
  caught: { stamp: 'ATTRAPÉ !', text: '« Qui est là ?! » La lampe du gardien t\'éblouit. Direction le bureau de la direction… à 9h pile.', color: 0x2a4a8a, pose: 'player-down' },
  // fin « fenêtre » : tampon, texte, couleur, pose
  window: { stamp: 'ALARME !', text: 'Tu sautes par la fenêtre… et l\'alarme hurle dans tout le quartier. Demain, tout le monde saura.', color: 0xe07b1f, pose: 'player-side' },
};

const GUARD_LABEL = { alerted: 'semé', caught: 'attrapé !', null: 'pas réveillé' }; // texte affiché pour la rencontre avec le gardien

// L'écran de fin est un bulletin scolaire posé sur le tableau noir.
export class EndScene extends Phaser.Scene { // la scène de fin
  constructor() { // à la création de la scène
    super('End'); // son nom : 'End'
  }

  init(data) { // reçoit le résultat de la partie
    this.result = data; // on le garde
  }

  create() { // dessine l'écran de fin
    const { width, height } = this.scale; // largeur et hauteur de l'écran
    const d = state.data; // raccourci vers les données de la partie
    const ending = ENDINGS[this.result.reason]; // la fin qui correspond au résultat
    // calcul du score
    const score = computeScore({ success: this.result.success, minutes: d.minutes, hintsUsed: d.hintsUsed, errors: d.errors });
    // temps réel écrit « X min YY s »
    const real = `${Math.floor(d.realSeconds / 60)} min ${String(Math.floor(d.realSeconds % 60)).padStart(2, '0')} s`;

    // Enregistre la partie dans le classement puis efface la sauvegarde
    const board = addEntry({ // on ajoute la partie au classement
      name: d.playerName, // prénom
      score, // score
      clock: state.clock, // heure de fin
      hints: d.hintsUsed, // nombre d'indices
      realSeconds: Math.round(d.realSeconds), // temps réel arrondi
      success: this.result.success, // gagné ou non
    });
    if (!state.online) state.clearSave(); // à 2, rien n'a été sauvegardé : on garde la partie solo

    setAmbience(null); // on coupe le son d'ambiance
    if (this.result.reason === 'escaped') sfx.win(); // évadé : son de victoire
    else if (this.result.reason === 'window') sfx.alarm(); // fenêtre : son d'alarme
    // sinon son de défaite (un peu plus tard si attrapé)
    else this.time.delayedCall(this.result.reason === 'caught' ? 600 : 0, () => sfx.lose());

    this.cameras.main.setBackgroundColor(C.wall); // couleur du fond
    this.cameras.main.fadeIn(500, 0, 0, 0); // l'écran apparaît en fondu depuis le noir
    drawChalkboard(this, 20, 16, width - 40, height - 32); // on dessine le tableau noir
    // texte de la fin, centré en haut
    txt(this, width / 2, 56, ending.text, { size: 26, font: FONT_HAND, weight: '600', color: C.chalk, align: 'center', wordWrap: { width: 820 } }).setOrigin(0.5);

    // Le bulletin
    const px = 200; // position x du bulletin
    const py = 100; // position y du bulletin
    const pw = 460; // largeur du bulletin
    const ph = 390; // hauteur du bulletin
    const g = this.add.graphics(); // on prend un pinceau pour dessiner
    g.fillStyle(0x000000, 0.25).fillRect(px + 6, py + 6, pw, ph); // ombre du bulletin
    g.fillStyle(C.paper).fillRect(px, py, pw, ph); // fond en papier
    g.fillStyle(C.blue).fillRect(px, py, pw, 46); // bande bleue en haut
    // titre avec le prénom
    txt(this, px + pw / 2, py + 23, `BULLETIN DE SORTIE — ${d.playerName}`, { size: 18, weight: '800', color: 0xffffff }).setOrigin(0.5);

    const rows = [ // lignes du bulletin : [titre, valeur]
      ['Heure de fin', state.clock], // heure de fin
      ['Temps réel', real], // temps réel
      ['Indices demandés', String(d.hintsUsed)], // nombre d'indices demandés
      ['Indices du décor', String(d.decorHints.length)], // nombre d'indices trouvés dans le décor
      ['Erreurs', String(d.errors)], // nombre d'erreurs
      ['Rencontre avec le gardien', GUARD_LABEL[d.guardChoice]], // ce qui s'est passé avec le gardien
      ['Énigmes résolues', `${Object.keys(d.solved).length} / 5`], // énigmes résolues sur 5
    ];
    rows.forEach(([k, v], i) => { // pour chaque ligne (i = son numéro)
      const y = py + 62 + i * 32; // hauteur de la ligne
      g.lineStyle(1, 0x9ab6e0).lineBetween(px + 16, y + 26, px + pw - 16, y + 26); // trait de séparation
      txt(this, px + 22, y, k, { size: 15, weight: '700', color: 0x55607a }); // le titre à gauche
      txt(this, px + 250, y - 6, v, { size: 26, font: FONT_HAND, weight: '600', color: C.blue }); // la valeur à droite, écrite à la main
    });
    txt(this, px + 22, py + ph - 70, 'Note finale', { size: 17, weight: '800', color: C.ink }); // écrit « Note finale »
    // le score sur 1000, en rouge
    txt(this, px + 250, py + ph - 84, `${score} / 1000`, { size: 44, font: FONT_HAND, weight: '600', color: C.red });

    // Tampon, sur le tableau au-dessus de l'élève
    // le tampon (ÉVADÉ !, COLLÉ !…)
    const stamp = txt(this, 115, 300, ending.stamp, { size: 36, font: FONT_TITLE, color: ending.color, padding: { x: 10, y: 4 } })
      .setOrigin(0.5) // centré
      .setAngle(-12) // penché
      .setAlpha(0); // invisible au début
    stamp.setStroke('#ffffff', 3); // contour blanc
    // animation : le tampon apparaît en tombant
    this.tweens.add({ targets: stamp, alpha: 1, scale: { from: 1.8, to: 1 }, delay: 500, duration: 250, ease: 'Back.out' });

    // Classement sur un post-it
    const nx = 700; // position x du post-it
    const ny = 120; // position y du post-it
    const note = this.add.graphics(); // un pinceau pour le post-it
    note.fillStyle(0xffe97a).fillRect(nx, ny, 210, 230); // carré jaune
    txt(this, nx + 105, ny + 24, 'Top 5', { size: 30, font: FONT_HAND, weight: '600', color: C.ink }).setOrigin(0.5); // titre « Top 5 »
    board.slice(0, 5).forEach((e, i) => { // les 5 meilleurs : pour chacun
      // rang et prénom (10 lettres max)
      txt(this, nx + 16, ny + 52 + i * 34, `${i + 1}. ${e.name.slice(0, 10)}`, { size: 24, font: FONT_HAND, weight: '600', color: C.ink });
      // score à droite (vert si gagné)
      txt(this, nx + 196, ny + 52 + i * 34, String(e.score), { size: 24, font: FONT_HAND, weight: '600', color: e.success ? C.green : 0x8a7a68 }).setOrigin(1, 0);
    });

    const sprite = this.add.sprite(110, 430, 'player', 'down0').setScale(3); // le personnage, en grand
    if (ending.pose) sprite.play(ending.pose); // s'il a une pose, on l'anime
    else sprite.setAngle(90).setY(470); // endormi par terre…

    // bouton de retour au menu
    chalkButton(this, width / 2 - 20, 548, isTouch() ? 'Retour au menu' : 'Entrée · retour au menu', () => this.scene.start('Menu'), { width: 360, size: 24 });
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Menu')); // touche Entrée : retour au menu
  }
}
