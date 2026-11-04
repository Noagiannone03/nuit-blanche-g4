import Phaser from 'phaser';
import { state } from '../state/GameState.js';
import { C, FONT_HAND, FONT_TITLE, txt } from '../ui/theme.js';
import { sfx, setAmbience } from '../audio/sound.js';
import { net, ROLES } from '../net/multiplayer.js';
import { isTouch } from '../ui/touch.js';

const LINES = [
  'Lundi soir, Cercle de projets. Tout le monde est parti.',
  'Toi, tu voulais juste finir « un dernier commit »…',
  'Tu te réveilles la tête sur le clavier. L\'horloge affiche 00:00.',
  'Les portes sont verrouillées. La sortie demande un code à 4 chiffres.',
  'À 9h00, l\'école ouvre : si on te trouve ici, c\'est fini.',
  'Le courant est coupé : dans les salles, seul le flash de ton téléphone t\'éclaire.',
];

// Intro sur une page de cahier : chaque ligne s'écrit lettre par lettre.
export class IntroScene extends Phaser.Scene {
  constructor() {
    super('Intro');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x3a2f28);

    // Page de cahier : lignes bleues + marge rouge
    const g = this.add.graphics();
    g.fillStyle(C.paper).fillRect(60, 20, width - 120, height - 40);
    g.lineStyle(1, 0x9ab6e0, 0.8);
    for (let y = 90; y < height - 30; y += 34) g.lineBetween(60, y, width - 60, y);
    g.lineStyle(2, 0xe06a6a, 0.9).lineBetween(130, 20, 130, height - 20);
    g.fillStyle(0x3a2f28);
    for (let y = 60; y < height - 40; y += 60) g.fillCircle(84, y, 8);

    txt(this, 150, 34, `Journal de ${state.data.playerName}`, { size: 34, font: FONT_TITLE, color: C.blue });

    setAmbience('dark');
    // à 2 : une ligne de plus pour présenter les rôles
    this.lines = net.online
      ? [...LINES, `Ce soir, à deux : toi ${ROLES[net.role].icon} ${ROLES[net.role].name}, ${net.mate.name} ${ROLES[net.mate.role].icon} ${ROLES[net.mate.role].name}.`]
      : LINES;
    this.index = 0;
    this.typing = null;
    this.texts = this.lines.map((_, i) => txt(this, 150, 110 + i * 68, '', { size: 30, font: FONT_HAND, weight: '600', color: C.ink, wordWrap: { width: 720 } }));
    this.prompt = txt(this, width - 80, height - 46, isTouch() ? 'Touche l\'écran pour continuer →' : 'Espace pour continuer →', { size: 24, font: FONT_HAND, weight: '600', color: C.red }).setOrigin(1, 0.5);
    this.tweens.add({ targets: this.prompt, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });

    this.next();
    this.input.keyboard.on('keydown-SPACE', () => this.next());
    this.input.keyboard.on('keydown-ENTER', () => this.next());
    this.input.on('pointerdown', () => this.next());
  }

  next() {
    // une ligne est en train de s'écrire → on l'affiche d'un coup
    if (this.typing) {
      this.typing.remove();
      this.typing = null;
      this.texts[this.index - 1].setText(this.lines[this.index - 1]);
      return;
    }
    if (this.index >= this.lines.length) {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Hub'));
      return;
    }
    const line = this.lines[this.index];
    const target = this.texts[this.index];
    let n = 0;
    this.typing = this.time.addEvent({
      delay: 22,
      repeat: line.length - 1,
      callback: () => {
        n += 1;
        target.setText(line.slice(0, n));
        if (n % 2) sfx.type();
        if (n >= line.length) this.typing = null;
      },
    });
    this.index += 1;
    if (this.index === this.lines.length) this.prompt.setText(isTouch() ? 'Touche l\'écran pour commencer →' : 'Espace pour commencer →');
  }
}
