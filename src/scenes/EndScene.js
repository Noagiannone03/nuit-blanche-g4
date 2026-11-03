import Phaser from 'phaser';
import { state } from '../state/GameState.js';
import { computeScore, addEntry } from '../state/leaderboard.js';
import { C, FONT_TITLE, FONT_HAND, txt, drawChalkboard, chalkButton } from '../ui/theme.js';
import { sfx, setAmbience } from '../audio/sound.js';

const ENDINGS = {
  escaped: { stamp: 'ÉVADÉ !', text: 'La porte s\'ouvre dans un déclic. Tu sors dans la nuit, ton projet sauvegardé sur une clé USB.', color: C.green, pose: 'player-down' },
  timeout: { stamp: 'COLLÉ !', text: '9h00 : l\'équipe pédagogique arrive… et te trouve endormi dans le couloir.', color: C.red, pose: null },
  caught: { stamp: 'ATTRAPÉ !', text: '« Qui est là ?! » La lampe du gardien t\'éblouit. Direction le bureau de la direction… à 9h pile.', color: 0x2a4a8a, pose: 'player-down' },
  window: { stamp: 'ALARME !', text: 'Tu sautes par la fenêtre… et l\'alarme hurle dans tout le quartier. Demain, tout le monde saura.', color: 0xe07b1f, pose: 'player-side' },
};

const GUARD_LABEL = { alerted: 'semé', caught: 'attrapé !', null: 'pas réveillé' };

// L'écran de fin est un bulletin scolaire posé sur le tableau noir.
export class EndScene extends Phaser.Scene {
  constructor() {
    super('End');
  }

  init(data) {
    this.result = data;
  }

  create() {
    const { width, height } = this.scale;
    const d = state.data;
    const ending = ENDINGS[this.result.reason];
    const score = computeScore({ success: this.result.success, minutes: d.minutes, hintsUsed: d.hintsUsed, errors: d.errors });
    const real = `${Math.floor(d.realSeconds / 60)} min ${String(Math.floor(d.realSeconds % 60)).padStart(2, '0')} s`;

    // Enregistre la partie dans le classement puis efface la sauvegarde
    const board = addEntry({
      name: d.playerName,
      score,
      clock: state.clock,
      hints: d.hintsUsed,
      realSeconds: Math.round(d.realSeconds),
      success: this.result.success,
    });
    state.clearSave();

    setAmbience(null);
    if (this.result.reason === 'escaped') sfx.win();
    else if (this.result.reason === 'window') sfx.alarm();
    else this.time.delayedCall(this.result.reason === 'caught' ? 600 : 0, () => sfx.lose());

    this.cameras.main.setBackgroundColor(C.wall);
    this.cameras.main.fadeIn(500, 0, 0, 0);
    drawChalkboard(this, 20, 16, width - 40, height - 32);
    txt(this, width / 2, 56, ending.text, { size: 26, font: FONT_HAND, weight: '600', color: C.chalk, align: 'center', wordWrap: { width: 820 } }).setOrigin(0.5);

    // Le bulletin
    const px = 200;
    const py = 100;
    const pw = 460;
    const ph = 390;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRect(px + 6, py + 6, pw, ph);
    g.fillStyle(C.paper).fillRect(px, py, pw, ph);
    g.fillStyle(C.blue).fillRect(px, py, pw, 46);
    txt(this, px + pw / 2, py + 23, `BULLETIN DE SORTIE — ${d.playerName}`, { size: 18, weight: '800', color: 0xffffff }).setOrigin(0.5);

    const rows = [
      ['Heure de fin', state.clock],
      ['Temps réel', real],
      ['Indices demandés', String(d.hintsUsed)],
      ['Indices du décor', String(d.decorHints.length)],
      ['Erreurs', String(d.errors)],
      ['Rencontre avec le gardien', GUARD_LABEL[d.guardChoice]],
      ['Énigmes résolues', `${Object.keys(d.solved).length} / 5`],
    ];
    rows.forEach(([k, v], i) => {
      const y = py + 62 + i * 32;
      g.lineStyle(1, 0x9ab6e0).lineBetween(px + 16, y + 26, px + pw - 16, y + 26);
      txt(this, px + 22, y, k, { size: 15, weight: '700', color: 0x55607a });
      txt(this, px + 250, y - 6, v, { size: 26, font: FONT_HAND, weight: '600', color: C.blue });
    });
    txt(this, px + 22, py + ph - 70, 'Note finale', { size: 17, weight: '800', color: C.ink });
    txt(this, px + 250, py + ph - 84, `${score} / 1000`, { size: 44, font: FONT_HAND, weight: '600', color: C.red });

    // Tampon, sur le tableau au-dessus de l'élève
    const stamp = txt(this, 115, 300, ending.stamp, { size: 36, font: FONT_TITLE, color: ending.color, padding: { x: 10, y: 4 } })
      .setOrigin(0.5)
      .setAngle(-12)
      .setAlpha(0);
    stamp.setStroke('#ffffff', 3);
    this.tweens.add({ targets: stamp, alpha: 1, scale: { from: 1.8, to: 1 }, delay: 500, duration: 250, ease: 'Back.out' });

    // Classement sur un post-it
    const nx = 700;
    const ny = 120;
    const note = this.add.graphics();
    note.fillStyle(0xffe97a).fillRect(nx, ny, 210, 230);
    txt(this, nx + 105, ny + 24, 'Top 5', { size: 30, font: FONT_HAND, weight: '600', color: C.ink }).setOrigin(0.5);
    board.slice(0, 5).forEach((e, i) => {
      txt(this, nx + 16, ny + 52 + i * 34, `${i + 1}. ${e.name.slice(0, 10)}`, { size: 24, font: FONT_HAND, weight: '600', color: C.ink });
      txt(this, nx + 196, ny + 52 + i * 34, String(e.score), { size: 24, font: FONT_HAND, weight: '600', color: e.success ? C.green : 0x8a7a68 }).setOrigin(1, 0);
    });

    const sprite = this.add.sprite(110, 430, 'player', 'down0').setScale(3);
    if (ending.pose) sprite.play(ending.pose);
    else sprite.setAngle(90).setY(470); // endormi par terre…

    chalkButton(this, width / 2 - 20, 548, 'Entrée · retour au menu', () => this.scene.start('Menu'), { width: 360, size: 24 });
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Menu'));
  }
}
