import Phaser from 'phaser';
import { state } from '../state/GameState.js';
import { openDialog, closeDialog, isDialogOpen } from '../ui/dialog.js';
import { ROOMS } from '../rooms/index.js';
import { HUB_HINTS } from '../data/hubLayout.js';
import { CODE_ORDER } from '../puzzles/code.js';
import { GAME_MIN_PER_SEC, PENALTY_HINT, TOP_BAR } from '../config.js';
import { C, FONT_HAND, hex, txt } from '../ui/theme.js';
import { endGame } from './endGame.js';
import { tickPatrol } from '../state/patrol.js';
import { sfx, toggleMute, isMuted } from '../audio/sound.js';

const DIGIT_ROOMS = ['ventoux', 'callelongue', 'stevictoire', 'sormiou'];
const SHORT = { ventoux: 'Ventoux', callelongue: 'Callel.', stevictoire: 'Ste Vic.', sormiou: 'Sormiou' };

// Barre du haut, toujours affichée pendant la partie : horloge murale, indices, code.
// C'est aussi elle qui fait avancer le temps.
export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    const { width } = this.scale;
    const bar = this.add.graphics();
    bar.fillStyle(0x2b2320).fillRect(0, 0, width, TOP_BAR);
    bar.fillStyle(0x4a3a2c).fillRect(0, TOP_BAR - 4, width, 4);

    // horloge murale (aiguilles) + heure en chiffres
    this.clock = this.add.graphics();
    this.clockText = txt(this, 52, TOP_BAR / 2, '', { size: 24, weight: '800', color: 0xffffff }).setOrigin(0, 0.5);
    this.statsText = txt(this, 150, 7, '', { size: 13, weight: '700', color: 0xd8cbb8 });
    this.playerText = txt(this, 150, 25, '', { size: 14, weight: '800', color: 0xffffff });

    // 4 cases pour les chiffres du code, comme les molettes d'un cadenas
    this.slots = [0, 1, 2, 3].map((i) => {
      const x = 440 + i * 56;
      const g = this.add.graphics();
      const digit = txt(this, x + 23, 17, '?', { size: 20, weight: '800', color: C.ink }).setOrigin(0.5);
      const tag = txt(this, x + 23, 36, '', { size: 9, weight: '700', color: 0x6b5d50 }).setOrigin(0.5);
      return { x, g, digit, tag };
    });
    this.orderText = txt(this, 670, TOP_BAR / 2, '', { size: 13, weight: '800', color: 0xd8cbb8 }).setOrigin(0, 0.5);

    // bouton indice en forme de post-it
    const hintBtn = txt(this, width - 14, TOP_BAR / 2, 'H · Indice ?', {
      size: 22, font: FONT_HAND, weight: '600', color: C.ink, backgroundColor: hex(0xffe97a), padding: { x: 10, y: 2 },
    })
      .setOrigin(1, 0.5)
      .setAngle(-3)
      .setInteractive({ useHandCursor: true });
    hintBtn.on('pointerdown', () => this.showHint());
    this.input.keyboard.on('keydown-H', () => this.showHint());

    // bouton pause (touche P ; Échap dans le couloir)
    const pauseBtn = txt(this, 382, TOP_BAR / 2, '⏸ P', {
      size: 15, weight: '800', color: 0xffffff, backgroundColor: '#4a3a2c', padding: { x: 8, y: 6 },
    })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.pause());
    this.input.keyboard.on('keydown-P', () => this.pause());
    this.paused = false;

    this.saveTimer = 0;
    this.lastSignature = null;
    this.refresh = () => this.render();
    this.onPenalty = () => {
      sfx.error();
      this.cameras.main.flash(250, 220, 40, 40);
    };
    state.on('changed', this.refresh);
    state.on('penalty', this.onPenalty);
    this.events.once('shutdown', () => {
      state.off('changed', this.refresh);
      state.off('penalty', this.onPenalty);
    });
    this.render();
  }

  drawClock(minutes, late) {
    const g = this.clock;
    const cx = 26;
    const cy = TOP_BAR / 2 - 2;
    g.clear();
    g.fillStyle(0xffffff).fillCircle(cx, cy, 17);
    g.lineStyle(3, late ? C.red : 0x1f2a44).strokeCircle(cx, cy, 17);
    const hourA = ((minutes / 60) % 12) * (Math.PI / 6) - Math.PI / 2;
    const minA = (minutes % 60) * (Math.PI / 30) - Math.PI / 2;
    g.lineStyle(3, C.ink).lineBetween(cx, cy, cx + Math.cos(hourA) * 8, cy + Math.sin(hourA) * 8);
    g.lineStyle(2, C.red).lineBetween(cx, cy, cx + Math.cos(minA) * 13, cy + Math.sin(minA) * 13);
  }

  update(_, delta) {
    if (this.paused) return; // le temps et le gardien s'arrêtent pendant la pause
    state.data.realSeconds += delta / 1000;
    state.addMinutes((delta / 1000) * GAME_MIN_PER_SEC);
    tickPatrol(delta);

    // sauvegarde automatique toutes les 5 s
    this.saveTimer += delta;
    if (this.saveTimer > 5000) {
      this.saveTimer = 0;
      state.save();
    }

    if (state.isTimeUp) endGame(this, false, 'timeout');
  }

  render() {
    const d = state.data;
    const late = d.minutes > 7 * 60;
    this.drawClock(d.minutes, late);
    this.clockText.setText(state.clock).setColor(hex(late ? 0xff6b5b : 0xffffff));
    const free = d.freeHints ? ` (+${d.freeHints} offert)` : '';
    this.statsText.setText(`Indices : ${d.hintsUsed}${free}   ·   Erreurs : ${d.errors}`);
    this.playerText.setText(d.playerName);

    // Les cases ne sont redessinées que si un chiffre ou l'ordre a changé
    const signature = JSON.stringify([d.digits, d.orderFound]);
    if (signature === this.lastSignature) return;
    this.lastSignature = signature;

    // Avant de connaître l'ordre : un chiffre par salle. Après : le code dans l'ordre.
    const rooms = d.orderFound ? CODE_ORDER : DIGIT_ROOMS;
    rooms.forEach((room, i) => {
      const s = this.slots[i];
      const known = d.digits[room] !== undefined;
      s.g.clear();
      s.g.fillStyle(known ? 0xe3f4e6 : 0xf1e9d6).fillRoundedRect(s.x, 4, 46, 40, 5);
      s.g.lineStyle(2, known ? C.green : 0x8a7a68).strokeRoundedRect(s.x, 4, 46, 40, 5);
      s.digit.setText(known ? String(d.digits[room]) : '?').setColor(hex(known ? C.ink : 0x9a8b7a));
      s.tag.setText(SHORT[room]);
    });
    this.orderText.setText(d.orderFound ? '✓ Ordre trouvé\n  code complet' : 'Ordre du code :\n  inconnu').setColor(hex(d.orderFound ? 0x7fe0a0 : 0xd8cbb8));
  }

  // ---------- Pause ----------
  pause() {
    if (this.paused || isDialogOpen()) return;
    this.paused = true;
    openDialog({
      title: 'Pause',
      body: `<p>Le temps est arrêté (il est <strong>${state.clock}</strong>). Ta partie est sauvegardée automatiquement : tu pourras la reprendre depuis le menu avec « Continuer ».</p>
        <table><tbody>
          <tr><td>Se déplacer</td><td>Flèches ou ZQSD, ou clic / toucher</td></tr>
          <tr><td>Entrer, utiliser</td><td>E ou Entrée · touches 1, 2, 3, 4 dans une salle</td></tr>
          <tr><td>Indice</td><td>H</td></tr>
          <tr><td>Revenir au couloir</td><td>Échap (dans une salle)</td></tr>
          <tr><td>Pause</td><td>P (ou Échap dans le couloir)</td></tr>
          <tr><td>Couper / remettre le son</td><td>M</td></tr>
        </tbody></table>`,
      buttons: [
        { label: 'Reprendre', primary: true, onClick: (ui) => ui.close() },
        {
          label: isMuted() ? '🔇 Son coupé' : '🔊 Son activé',
          onClick: (ui) => {
            ui.box.querySelectorAll('.actions button')[1].textContent = toggleMute() ? '🔇 Son coupé' : '🔊 Son activé';
          },
        },
        { label: 'Sauvegarder et quitter', onClick: () => this.quitToMenu() },
      ],
      onClose: () => {
        this.paused = false;
      },
    });
  }

  quitToMenu() {
    // on retient où était l'élève dans le couloir pour le remettre au même endroit
    const hub = this.scene.get('Hub');
    if (this.scene.isActive('Hub') && hub.player) state.data.playerPos = { x: hub.player.x, y: hub.player.y };
    state.save();
    closeDialog();
    const manager = this.game.scene;
    for (const s of manager.getScenes(true)) manager.stop(s.scene.key);
    manager.start('Menu');
  }

  showHint() {
    if (isDialogOpen()) return;
    const roomKey = state.data.currentRoom;
    const hints = roomKey ? ROOMS[roomKey].hints : HUB_HINTS;
    if (roomKey && state.data.solved[roomKey]) {
      openDialog({ title: 'Indice', body: '<p>Tu as déjà résolu l\'énigme de cette salle.</p>' });
      return;
    }
    const seen = state.data.hintsByRoom[roomKey || 'hub'] || 0;
    if (seen >= hints.length) {
      openDialog({ title: 'Indice', body: `<p>${hints[hints.length - 1]}</p><p><em>(Plus d'autre indice ici.)</em></p>` });
      return;
    }
    const cost = state.data.freeHints > 0 ? 'gratuit (carnet du gardien)' : `+${PENALTY_HINT} min`;
    openDialog({
      title: 'Besoin d\'un indice ?',
      body: `<p>Indice ${seen + 1}/${hints.length} — coût : <strong>${cost}</strong>.</p>`,
      buttons: [
        {
          label: 'Lire l\'indice',
          primary: true,
          onClick: () => {
            const h = state.useHint(roomKey || 'hub', hints);
            sfx.hint();
            openDialog({ title: `Indice ${seen + 1}`, body: `<p>${h.text}</p>` });
          },
        },
      ],
    });
  }
}
