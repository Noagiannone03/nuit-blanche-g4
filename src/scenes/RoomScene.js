import Phaser from 'phaser';
import { state } from '../state/GameState.js';
import { isDialogOpen } from '../ui/dialog.js';
import { ROOMS } from '../rooms/index.js';
import { ROOM_BLOCKS } from '../data/hubLayout.js';
import { drawFurniture } from '../art/furniture.js';
import { C, FONT_TITLE, hex, txt, addLight, nightOverlay } from '../ui/theme.js';
import { isPatrolActive } from '../state/patrol.js';
import { FLASH_RADIUS } from '../config.js';
import { sfx, setAmbience } from '../audio/sound.js';

const NUMBER_KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
const WALL_TOP = 130; // haut du mur (au-dessus : bandeau titre)
const FLOOR_Y = 400; // début du sol

// Une scène générique : elle affiche la salle décrite dans src/rooms/<salle>.js, vue de face.
export class RoomScene extends Phaser.Scene {
  constructor() {
    super('Room');
  }

  init(data) {
    this.def = ROOMS[data.roomKey];
    this.leaving = false; // la même instance de scène est réutilisée à chaque visite
    this.darkness = null;
    this.tickTimer = this.stepTimer = 0;
    this.tock = false;
    this.accent = ROOM_BLOCKS.find((r) => r.key === data.roomKey)?.accent ?? C.blue;
  }

  create() {
    const def = this.def;
    state.data.currentRoom = def.key;
    state.save();
    this.cameras.main.fadeIn(250, 0, 0, 0);
    sfx.doorClose(); // la porte se referme derrière l'élève

    this.drawRoomShell();

    txt(this, 24, 56, def.name, { size: 30, font: FONT_TITLE, color: 0xffffff, shadow: true }).setDepth(750);
    txt(this, 26, 98, def.intro, { size: 16, color: 0xe8e0d0, wordWrap: { width: 620 } }).setDepth(750);
    // étiquette du domaine (verte avec ✓ quand l'énigme est résolue)
    const solved = state.data.solved[def.key];
    txt(this, this.scale.width - 24, 62, solved ? `✓ ${def.domain} — résolu` : def.domain, {
      size: 14, weight: '800', color: 0xffffff, backgroundColor: hex(solved ? C.green : this.accent), padding: { x: 10, y: 4 },
    }).setOrigin(1, 0).setDepth(750);

    def.objects.forEach((obj, i) => this.drawObject(obj, i));

    // Décor spécifique à la salle (ex. les post-it de Sormiou)
    def.draw?.(this);

    // L'élève, de dos, qui regarde la salle, avec la lumière de son téléphone
    this.add.sprite(620, 588, 'player', 'up0').setScale(1.25).setDepth(600);

    // Tant que le courant n'est pas rétabli (amphi Mont Ventoux), la salle est noire
    if (state.data.solved.ventoux) this.lightRoom();
    else this.makeDarkness();

    const back = txt(this, this.scale.width - 20, this.scale.height - 18, '← Échap · couloir', {
      size: 15, weight: '800', color: C.ink, backgroundColor: hex(C.paper), padding: { x: 12, y: 7 },
    })
      .setOrigin(1, 1)
      .setDepth(900)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.leave());
    this.input.keyboard.on('keydown-ESC', () => this.leave());

    // Le gardien continue sa ronde pendant qu'on est dans la salle : on l'entend passer
    // (dans l'en-tête : en bas de l'écran, il cacherait des indices comme les post-it de Sormiou)
    this.footsteps = txt(this, this.scale.width - 24, 96, '👣 Le gardien rôde dans le couloir !', {
      size: 14, weight: '800', color: 0xffffff, backgroundColor: hex(C.red), padding: { x: 10, y: 4 },
    })
      .setOrigin(1, 0)
      .setDepth(900)
      .setVisible(isPatrolActive());
    this.tweens.add({ targets: this.footsteps, alpha: 0.45, duration: 600, yoyo: true, repeat: -1 });
    // (même place : le gardien ne fait pas encore ses rondes tant qu'il fait noir)
    this.phoneTag = txt(this, this.scale.width - 24, 96, '📱 Ton flash suit la souris', {
      size: 14, weight: '800', color: C.ink, backgroundColor: hex(C.yellow), padding: { x: 10, y: 4 },
    })
      .setOrigin(1, 0)
      .setDepth(900)
      .setVisible(!!this.darkness);

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.scene.bringToTop('UI');
  }

  update(_, delta) {
    this.footsteps.setVisible(isPatrolActive());
    if (!this.scene.get('UI').paused) this.roomSounds(delta);
    if (!this.darkness) return;
    if (state.data.solved.ventoux) {
      this.lightsOn();
      return;
    }
    // le noir est redessiné à chaque image, troué là où pointe le flash
    const d = this.darkness;
    d.clear().fill(0x05060c, 0.97).erase(this.flashBrush, this.flashPos.x, this.flashPos.y - d.y);
    this.flashGlow.setPosition(this.flashPos.x, this.flashPos.y);
  }

  /** Tic-tac de l'horloge murale, et pas étouffés du gardien qui passe dans le couloir. */
  roomSounds(delta) {
    this.tickTimer += delta;
    if (this.tickTimer > 1000) {
      this.tickTimer = 0;
      this.tock = !this.tock;
      sfx.tick(this.tock);
    }
    if (!isPatrolActive()) return;
    this.stepTimer += delta;
    if (this.stepTimer > 520) {
      this.stepTimer = 0;
      sfx.guardStep(0.45, true);
    }
  }

  // ---------- Lumière ----------
  lightRoom() {
    setAmbience('lit');
    nightOverlay(this, 0.22);
    addLight(this, 620, 560, 0xffe9b0, { scale: 1.6, alpha: 0.28 }).setDepth(800);
  }

  /** Voile noir sous le bandeau titre ; le flash du téléphone suit la souris (ou le doigt). */
  makeDarkness() {
    setAmbience('dark');
    const { width, height } = this.scale;
    this.darkness = this.add.renderTexture(0, WALL_TOP - 4, width, height - WALL_TOP + 4).setOrigin(0).setDepth(850);
    this.flashBrush = this.make.image({ key: 'flash' }, false).setScale((FLASH_RADIUS * 2) / 256);
    this.flashGlow = addLight(this, 0, 0, 0xfff4d6, { scale: (FLASH_RADIUS * 2) / 256, alpha: 0.1 }).setDepth(860);
    this.flashPos = { x: width / 2, y: 330 };
    this.input.on('pointermove', (p) => (this.flashPos = { x: p.x, y: p.y }));
    this.input.on('pointerdown', (p) => (this.flashPos = { x: p.x, y: p.y }));
  }

  /** Le courant revient pendant qu'on est dans la salle : le noir se dissipe. */
  lightsOn() {
    const { darkness, flashGlow } = this;
    this.darkness = null;
    this.phoneTag.setVisible(false);
    this.cameras.main.flash(300, 255, 250, 220);
    this.lightRoom();
    this.tweens.add({
      targets: [darkness, flashGlow],
      alpha: 0,
      duration: 600,
      onComplete: () => {
        darkness.destroy();
        flashGlow.destroy();
      },
    });
  }

  // Bandeau du haut, mur, soubassement, sol carrelé, horloge murale
  drawRoomShell() {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillStyle(0x3a2f28).fillRect(0, 48, width, WALL_TOP - 48);
    g.fillStyle(this.accent).fillRect(0, WALL_TOP - 4, width, 4);
    g.fillStyle(C.wall).fillRect(0, WALL_TOP, width, FLOOR_Y - WALL_TOP);
    g.fillStyle(C.wainscot).fillRect(0, FLOOR_Y - 70, width, 70);
    g.fillStyle(0x6a8a76).fillRect(0, FLOOR_Y - 74, width, 6);
    const T = 40;
    for (let y = FLOOR_Y; y < height; y += T) {
      for (let x = 0; x < width; x += T) g.fillStyle(((x + y) / T) % 2 ? C.floorA : C.floorB).fillRect(x, y, T, T);
    }
    g.fillStyle(0x000000, 0.18).fillRect(0, FLOOR_Y, width, 8); // ombre au pied du mur

    // horloge murale réglée sur l'heure du jeu
    const cx = 905;
    const cy = 172;
    g.fillStyle(0xffffff).fillCircle(cx, cy, 22);
    g.lineStyle(3, C.ink).strokeCircle(cx, cy, 22);
    const m = state.data.minutes;
    const hourA = ((m / 60) % 12) * (Math.PI / 6) - Math.PI / 2;
    const minA = (m % 60) * (Math.PI / 30) - Math.PI / 2;
    g.lineStyle(3, C.ink).lineBetween(cx, cy, cx + Math.cos(hourA) * 11, cy + Math.sin(hourA) * 11);
    g.lineStyle(2, C.red).lineBetween(cx, cy, cx + Math.cos(minA) * 17, cy + Math.sin(minA) * 17);
  }

  // Un objet = un meuble dessiné + une étiquette en papier ; surbrillance jaune au survol
  drawObject(obj, i) {
    const x = obj.x - obj.w / 2;
    const y = obj.y - obj.h / 2;
    drawFurniture(this.add.graphics(), obj.type, x, y, obj.w, obj.h);

    const highlight = this.add.graphics().setDepth(740).setVisible(false);
    highlight.lineStyle(3, C.yellow, 1).strokeRoundedRect(x - 8, y - 8, obj.w + 16, obj.h + 16, 8);
    this.tweens.add({ targets: highlight, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });

    const label = txt(this, obj.x, y + obj.h + 18, `${i + 1} · ${obj.label}`, {
      size: 14, weight: '800', color: C.ink, backgroundColor: hex(C.paper), padding: { x: 8, y: 3 },
    })
      .setOrigin(0.5)
      .setDepth(750)
      .setAngle(i % 2 ? 1.5 : -1.5);

    const zone = this.add.zone(obj.x, obj.y, obj.w, obj.h).setInteractive({ useHandCursor: true });
    for (const target of [zone, label.setInteractive({ useHandCursor: true })]) {
      target.on('pointerover', () => {
        highlight.setVisible(true);
        label.setBackgroundColor(hex(C.yellow));
      });
      target.on('pointerout', () => {
        highlight.setVisible(false);
        label.setBackgroundColor(hex(C.paper));
      });
      target.on('pointerdown', () => this.use(obj));
    }
    if (NUMBER_KEYS[i]) this.input.keyboard.on(`keydown-${NUMBER_KEYS[i]}`, () => this.use(obj));
  }

  use(obj) {
    if (isDialogOpen()) return;
    obj.onUse(this);
  }

  leave() {
    if (isDialogOpen() || this.leaving) return;
    this.leaving = true;
    state.data.currentRoom = null;
    state.save();
    sfx.doorOpen();
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Hub', { fromRoom: true }));
  }
}
