import Phaser from 'phaser';
import { state } from '../state/GameState.js';
import { openDialog, isDialogOpen } from '../ui/dialog.js';
import { loadBoard } from '../state/leaderboard.js';
import { C, FONT_TITLE, FONT_HAND, txt, drawChalkboard, chalkButton } from '../ui/theme.js';

// Le menu est écrit à la craie sur un tableau noir.
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(C.wall);
    drawChalkboard(this, 30, 24, width - 60, height - 80);

    txt(this, width / 2, 100, 'Nuit Blanche à G4', { size: 64, font: FONT_TITLE, color: C.chalk }).setOrigin(0.5).setAngle(-2);
    txt(this, width / 2, 162, 'Escape game — Cercle de projets 2026 — Marseille', { size: 26, font: FONT_HAND, weight: '600', color: C.yellow }).setOrigin(0.5);
    const g = this.add.graphics();
    g.lineStyle(3, C.chalk, 0.6).lineBetween(width / 2 - 260, 188, width / 2 + 260, 188);

    // L'élève et le gardien posés sur le rebord du tableau
    this.add.sprite(150, 488, 'player').setScale(3).play('player-down');
    this.add.sprite(810, 488, 'guard').setScale(3).setFlipX(true).play('guard-side');
    txt(this, 150, 395, 'toi', { size: 26, font: FONT_HAND, weight: '600', color: C.chalk }).setOrigin(0.5);
    txt(this, 810, 395, 'le gardien', { size: 26, font: FONT_HAND, weight: '600', color: C.chalk }).setOrigin(0.5);

    const entries = [{ label: '1. Nouvelle partie', key: 'ONE', action: () => this.newGame() }];
    if (state.hasSave()) entries.push({ label: '2. Continuer', key: 'TWO', action: () => this.continueGame() });
    entries.push({ label: '3. Classement', key: 'THREE', action: () => this.showBoard() });

    entries.forEach((e, i) => {
      chalkButton(this, width / 2, 260 + i * 70, e.label, () => !isDialogOpen() && e.action());
      this.input.keyboard.on(`keydown-${e.key}`, () => !isDialogOpen() && e.action());
    });

    txt(this, width / 2, height - 28, 'Flèches / ZQSD : bouger  ·  E : interagir  ·  H : indice  ·  P : pause  ·  Échap : sortir d\'une salle  ·  souris et tactile acceptés', {
      size: 14, color: C.ink, weight: '700',
    }).setOrigin(0.5);
  }

  newGame() {
    openDialog({
      title: 'Nouvelle partie',
      body: '<p>Écris ton pseudo pour le classement.</p>',
      input: { placeholder: 'Pseudo', maxLength: 16 },
      submitLabel: 'Commencer',
      onSubmit: (value, ui) => {
        if (!value) return ui.feedback('Choisis un pseudo.');
        ui.close();
        state.reset(value);
        this.scene.start('Intro');
      },
    });
  }

  continueGame() {
    state.load();
    this.scene.start('Hub');
  }

  showBoard() {
    const board = loadBoard();
    const rows = board.length
      ? board.map((e, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(e.name)}</td><td>${e.score}</td><td>${e.clock}</td><td>${e.hints}</td><td>${e.success ? 'Évadé' : 'Échec'}</td></tr>`).join('')
      : '<tr><td colspan="6">Aucune partie pour l\'instant.</td></tr>';
    openDialog({
      title: 'Classement',
      body: `<table><thead><tr><th>#</th><th>Pseudo</th><th>Score</th><th>Heure</th><th>Indices</th><th>Résultat</th></tr></thead><tbody>${rows}</tbody></table>`,
    });
  }
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
