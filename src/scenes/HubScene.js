import Phaser from 'phaser';
import { state } from '../state/GameState.js';
import { openDialog, isDialogOpen } from '../ui/dialog.js';
import { WORLD, START, ROOM_BLOCKS, BLOCKED, EXIT } from '../data/hubLayout.js';
import { EXIT_CODE } from '../puzzles/code.js';
import { PLAYER_SPEED, PENALTY_ERROR, GUARD_SIGHT } from '../config.js';
import { animateWalk } from '../art/characters.js';
import { C, FONT_TITLE, hex, txt, addLight, nightOverlay } from '../ui/theme.js';
import { endGame } from './endGame.js';
import { isPatrolActive, patrolJustStarted, guardPosition } from '../state/patrol.js';
import { sfx, setAmbience } from '../audio/sound.js';
import { net, ROLES, sendPresence, esc } from '../net/multiplayer.js';
import { isTouch } from '../ui/touch.js';

const INTERACT_RADIUS = 46;
const EXIT_TEAM_RADIUS = 110; // à 2 : les deux joueurs doivent être près de la sortie

// Manette tactile (mobile) : joystick dans la zone hachurée en bas à gauche, bouton d'action sur le mur de droite
const STICK = { x: 105, y: 545, r: 62 };
const ACTION = { x: 930, y: 545, r: 27 };

// Le couloir : le joueur s'y déplace et entre dans les salles par leurs portes.
// Le couloir de l'école, vu de dessus : le joueur s'y déplace et entre dans les salles par leurs portes.
export class HubScene extends Phaser.Scene {
  constructor() {
    super('Hub');
  }

  create(data) {
    state.data.currentRoom = null;
    if (data?.fromRoom) sfx.doorClose(); // la porte de la salle se referme derrière l'élève
    // la même instance de scène est réutilisée : on repart d'un état propre
    this.frozen = false;
    this.target = null;
    this.nearby = null;
    this.guard = this.torch = this.beam = null;
    this.stepTimer = this.guardStepTimer = this.heartTimer = 0;
    this.stepLeft = false;
    this.presenceTimer = 0;
    setAmbience('hub');
    this.cameras.main.setBackgroundColor(0x2b2622);
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.physics.world.setBounds(WORLD.x, WORLD.y, WORLD.width, WORLD.height);

    this.walls = this.physics.add.staticGroup();
    this.interactables = [];

    this.drawFloor();
    for (const b of BLOCKED) this.drawBlocked(b);
    for (const room of ROOM_BLOCKS) this.drawRoom(room);
    this.drawCorridorProps();
    this.drawExit();

    // Il fait nuit : un voile bleu, et seules quelques lumières percent
    nightOverlay(this, 0.42);

    // Joueur : la boîte de collision est réduite aux pieds pour qu'il "passe derrière" les meubles
    const pos = state.data.playerPos || START;
    this.player = this.physics.add.sprite(pos.x, pos.y, 'player', 'down0').setCollideWorldBounds(true);
    this.player.body.setSize(16, 10).setOffset(8, 38);
    this.physics.add.collider(this.player, this.walls);
    // la lampe du téléphone éclaire autour de l'élève
    this.playerLight = addLight(this, pos.x, pos.y, 0xffe9b0, { scale: 1.3, alpha: 0.4 }).setDepth(800);

    // Si le gardien fait sa ronde, il est toujours là en revenant dans le couloir.
    // Petit délai de grâce pour ne pas être attrapé pendant le fondu d'entrée.
    this.graceUntil = this.time.now + 1500;
    if (isPatrolActive()) this.spawnGuard();
    this.onPatrolStarted = () => {
      this.spawnGuard();
      sfx.distantSlam();
      this.toast('👣 Le gardien commence une nouvelle ronde !');
    };
    this.onPatrolEnded = ({ quiet } = {}) => {
      this.despawnGuard();
      if (!quiet) this.toast('Les pas s\'éloignent : le gardien est retourné dans son local… pour l\'instant.');
    };
    state.on('patrol-started', this.onPatrolStarted);
    state.on('patrol-ended', this.onPatrolEnded);
    this.events.once('shutdown', () => {
      state.off('patrol-started', this.onPatrolStarted);
      state.off('patrol-ended', this.onPatrolEnded);
    });

    this.prompt = txt(this, 0, 0, '', { size: 15, weight: '800', color: C.ink, backgroundColor: hex(C.paper), padding: { x: 10, y: 5 } })
      .setOrigin(0.5)
      .setDepth(1000)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.prompt.on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      this.interact();
    });

    // Contrôles : clavier (flèches + ZQSD) et clic / tactile pour se déplacer
    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,Z,Q,S,D');
    this.input.keyboard.on('keydown-E', () => this.interact());
    this.input.keyboard.on('keydown-ENTER', () => this.interact());
    this.input.keyboard.on('keydown-ESC', () => this.scene.get('UI').pause());
    this.stick = null;
    if (isTouch()) this.createTouchControls();
    this.input.on('pointerdown', (p) => {
      if (!isDialogOpen() && !this.onTouchControls(p)) this.target = { x: p.worldX, y: p.worldY };
    });

    this.createMate();

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.scene.bringToTop('UI');
  }

  // ---------- Manette tactile (version mobile) ----------
  createTouchControls() {
    this.input.addPointer(1); // deux doigts : un sur le joystick, un pour toucher une porte
    this.stick = { id: null, vx: 0, vy: 0 };
    const base = this.add.circle(STICK.x, STICK.y, STICK.r, 0xffffff, 0.14).setStrokeStyle(3, 0xffffff, 0.5).setDepth(1100);
    this.stickThumb = this.add.circle(STICK.x, STICK.y, 26, 0xffffff, 0.55).setDepth(1101);
    txt(this, STICK.x, STICK.y + STICK.r + 14, 'bouger', { size: 13, weight: '800', color: 0xffffff }).setOrigin(0.5).setDepth(1100).setAlpha(0.7);
    base.setInteractive(); // pour que le doigt posé dessus ne déclenche rien d'autre

    const action = this.add.circle(ACTION.x, ACTION.y, ACTION.r, C.yellow, 0.9).setStrokeStyle(3, 0xffffff).setDepth(1100).setInteractive();
    txt(this, ACTION.x, ACTION.y, '✋', { size: 24 }).setOrigin(0.5).setDepth(1101);
    txt(this, ACTION.x, ACTION.y + ACTION.r + 12, 'agir', { size: 13, weight: '800', color: 0xffffff }).setOrigin(0.5).setDepth(1100).setAlpha(0.7);
    action.on('pointerdown', () => this.interact());

    const move = (p) => {
      const dx = p.x - STICK.x;
      const dy = p.y - STICK.y;
      const len = Math.hypot(dx, dy);
      const k = len > STICK.r ? STICK.r / len : 1;
      this.stickThumb.setPosition(STICK.x + dx * k, STICK.y + dy * k);
      // petite zone morte au centre : le doigt posé sans bouger ne fait pas avancer
      this.stick.vx = len > 10 ? dx / len : 0;
      this.stick.vy = len > 10 ? dy / len : 0;
    };
    this.input.on('pointerdown', (p) => {
      if (Math.hypot(p.x - STICK.x, p.y - STICK.y) > STICK.r + 30) return;
      this.stick.id = p.id;
      move(p);
    });
    this.input.on('pointermove', (p) => p.id === this.stick.id && move(p));
    const release = (p) => {
      if (p.id !== this.stick.id) return;
      this.stick = { id: null, vx: 0, vy: 0 };
      this.stickThumb.setPosition(STICK.x, STICK.y);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
  }

  /** Vrai si le doigt est sur le joystick ou le bouton d'action (ce n'est pas un « va là-bas »). */
  onTouchControls(p) {
    if (!this.stick) return false;
    return Math.hypot(p.x - STICK.x, p.y - STICK.y) <= STICK.r + 30 || Math.hypot(p.x - ACTION.x, p.y - ACTION.y) <= ACTION.r + 10;
  }

  // ---------- Le coéquipier (partie à 2) ----------
  createMate() {
    this.mate = this.add.sprite(-100, -100, 'mate', 'down0').setVisible(false);
    this.mateTag = txt(this, 0, 0, '', { size: 12, weight: '800', color: 0xffffff, backgroundColor: hex(0x3f8f5a), padding: { x: 5, y: 1 } })
      .setOrigin(0.5, 1)
      .setDepth(999) // sous l'étiquette « E — … »
      .setVisible(false);
    // quand il est dans une salle : une étiquette sur la porte
    this.mateDoor = txt(this, 0, 0, '', { size: 12, weight: '800', color: 0xffffff, backgroundColor: hex(0x3f8f5a), padding: { x: 5, y: 2 } })
      .setOrigin(0.5)
      .setDepth(1000)
      .setVisible(false);
  }

  updateMate(delta) {
    const m = net.mate;
    if (!net.online || !m || m.x === undefined) {
      this.mate.setVisible(false);
      this.mateTag.setVisible(false);
      this.mateDoor.setVisible(false);
      return;
    }
    const label = `${ROLES[m.role].icon} ${m.name}`;
    if (m.room) {
      this.mate.setVisible(false);
      this.mateTag.setVisible(false);
      const door = ROOM_BLOCKS.find((r) => r.key === m.room)?.door;
      if (door) this.mateDoor.setText(`${label} est ici`).setPosition(door.x, door.y - 26).setVisible(true);
      return;
    }
    this.mateDoor.setVisible(false);
    if (!this.mate.visible) this.mate.setPosition(m.x, m.y).setVisible(true); // il sort d'une salle
    // on glisse vers la dernière position reçue (elle arrive 10 fois par seconde)
    const t = Math.min(1, delta / 90);
    const nx = this.mate.x + (m.x - this.mate.x) * t;
    const ny = this.mate.y + (m.y - this.mate.y) * t;
    const perSec = 1000 / delta;
    animateWalk(this.mate, 'mate', (nx - this.mate.x) * perSec, (ny - this.mate.y) * perSec);
    this.mate.setPosition(nx, ny).setDepth(ny);
    this.mateTag.setText(label).setPosition(nx, ny - 28).setVisible(true);
  }

  // ---------- Décor ----------
  drawFloor() {
    // carrelage du couloir en damier
    const g = this.add.graphics();
    const T = 30;
    for (let y = WORLD.y; y < WORLD.y + WORLD.height; y += T) {
      for (let x = WORLD.x; x < WORLD.width; x += T) {
        g.fillStyle(((x + y) / T) % 2 ? C.floorA : C.floorB).fillRect(x, y, T, T);
      }
    }
    // mur extérieur à droite
    g.fillStyle(0x4a4440).fillRect(WORLD.width, WORLD.y, this.scale.width - WORLD.width, WORLD.height);
  }

  drawBlocked(b) {
    const g = this.add.graphics();
    g.fillStyle(0x4a4440).fillRect(b.x, b.y, b.w, b.h);
    g.lineStyle(1, 0x000000, 0.12);
    for (let d = -b.h; d < b.w; d += 14) g.lineBetween(b.x + Math.max(0, d), b.y + Math.max(0, -d), b.x + Math.min(b.w, d + b.h), b.y + Math.min(b.h, b.w - d));
    this.walls.add(this.add.zone(b.x, b.y, b.w, b.h).setOrigin(0));
  }

  drawRoom(room) {
    const g = this.add.graphics();
    // murs épais puis sol de la salle
    g.fillStyle(0x5a514a).fillRect(room.x, room.y, room.w, room.h);
    const ix = room.x + 7;
    const iy = room.y + 7;
    const iw = room.w - 14;
    const ih = room.h - 14;
    if (room.decor === 'lounge') {
      g.fillStyle(0x4a5f8a).fillRect(ix, iy, iw, ih); // moquette
    } else if (room.decor === 'kitchen') {
      for (let y = iy; y < iy + ih; y += 16) for (let x = ix; x < ix + iw; x += 16) g.fillStyle(((x - ix + y - iy) / 16) % 2 ? 0xd8d8d0 : 0xc4c4bb).fillRect(x, y, Math.min(16, ix + iw - x), Math.min(16, iy + ih - y));
    } else {
      g.fillStyle(0x7a5a3c).fillRect(ix, iy, iw, ih); // parquet
      g.lineStyle(1, 0x5f4530, 0.6);
      for (let y = iy + 12; y < iy + ih; y += 12) g.lineBetween(ix, y, ix + iw, y);
    }
    this.drawDecor(g, room, ix, iy, iw, ih);
    this.walls.add(this.add.zone(room.x, room.y, room.w, room.h).setOrigin(0));

    // nom de la salle (au-dessus du voile de nuit pour rester lisible)
    const cx = room.x + room.w / 2;
    const cy = room.y + room.h / 2;
    txt(this, cx, cy, room.label, { size: 20, font: FONT_TITLE, color: 0xffffff, align: 'center', shadow: true }).setOrigin(0.5).setDepth(750);
    if (state.data.solved[room.key]) {
      txt(this, cx, cy + (room.label.includes('\n') ? 36 : 24), '✓ résolu', {
        size: 14, weight: '800', color: 0xffffff, backgroundColor: hex(C.green), padding: { x: 8, y: 2 },
      }).setOrigin(0.5).setDepth(750).setAngle(-4);
    }

    // porte en bois ; une fois le courant rétabli, un filet de lumière passe dessous
    if (state.hasItem('courant')) {
      const glow = addLight(this, room.door.x, room.door.y, 0xffd27a, { scale: 0.35, alpha: 0.5 }).setDepth(800);
      this.tweens.add({ targets: glow, alpha: 0.25, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // la porte est posée dans le mur le plus proche du point d'entrée
    const vertical = room.door.x < room.x; // porte sur le côté gauche (Callelongue)
    const doorX = vertical ? room.x + 3 : room.door.x;
    const doorY = vertical ? room.door.y : room.door.y < room.y ? room.y + 3 : room.y + room.h - 3;
    const door = this.add.rectangle(doorX, doorY, vertical ? 8 : 40, vertical ? 40 : 8, C.woodDark)
      .setStrokeStyle(2, C.wood)
      .setInteractive({ useHandCursor: true });
    door.on('pointerdown', () => (this.target = { ...room.door }));

    this.interactables.push({
      x: room.door.x,
      y: room.door.y,
      label: room.label.replace('\n', ' '),
      action: () => (room.key === 'detente' ? this.visitDetente() : this.enterRoom(room)),
    });
  }

  // Mobilier vu de dessus : rangées de l'amphi, tables et chaises, canapé…
  drawDecor(g, room, x, y, w, h) {
    const chair = 0x3a3f47;
    if (room.decor === 'amphi') {
      g.fillStyle(C.board).fillRect(x + w / 2 - 90, y + 2, 180, 8); // tableau
      g.fillStyle(C.wood).fillRect(x + w / 2 - 40, y + 18, 80, 14); // bureau du prof
      for (let r = 0; r < 4; r++) {
        g.fillStyle(C.wood).fillRect(x + 20, y + 46 + r * 28, w - 40, 9);
        g.fillStyle(chair);
        for (let sx = x + 26; sx < x + w - 30; sx += 20) g.fillRect(sx, y + 57 + r * 28, 12, 7);
      }
    } else if (room.decor === 'desks') {
      g.fillStyle(C.board).fillRect(x + 20, y + 2, Math.min(140, w - 40), 6);
      for (let dy = y + 22; dy < y + h - 22; dy += 34) {
        for (let dx = x + 18; dx < x + w - 40; dx += 56) {
          g.fillStyle(C.wood).fillRect(dx, dy, 40, 14);
          g.fillStyle(chair).fillRect(dx + 6, dy + 17, 11, 7).fillRect(dx + 23, dy + 17, 11, 7);
        }
      }
    } else if (room.decor === 'lounge') {
      g.fillStyle(0x8a3b3b).fillRoundedRect(x + 16, y + 14, w - 32, 30, 8);
      g.fillStyle(0x9e4848).fillRoundedRect(x + 22, y + 18, w - 44, 18, 6);
      g.fillStyle(C.wood).fillRoundedRect(x + w / 2 - 40, y + 70, 80, 40, 6);
      g.fillStyle(0x3f7d3a).fillCircle(x + w - 26, y + h - 26, 16);
      g.fillStyle(0x2f2a26).fillRect(x + 14, y + h - 40, 40, 26); // baby-foot / borne d'arcade
    } else if (room.decor === 'kitchen') {
      g.fillStyle(0xb9bec6).fillRect(x, y, w, 18); // plan de travail
      g.fillStyle(0xeef1f3).fillRect(x + w - 30, y, 26, 26); // frigo
      for (const [tx, ty] of [[x + 40, y + 70], [x + w - 50, y + 70], [x + 40, y + h - 36], [x + w - 50, y + h - 36]]) {
        g.fillStyle(C.wood).fillCircle(tx, ty, 16);
        g.fillStyle(chair).fillCircle(tx - 22, ty, 5).fillCircle(tx + 22, ty, 5).fillCircle(tx, ty - 22, 5).fillCircle(tx, ty + 22, 5);
      }
    }
  }

  // Distributeur, casiers et plantes dans le couloir
  drawCorridorProps() {
    const g = this.add.graphics();
    // distributeur de boissons dans le renfoncement entre l'amphi et la détente
    g.fillStyle(0xb33a3a).fillRect(598, 66, 36, 58);
    g.fillStyle(0x1d2a3a).fillRect(603, 72, 20, 34);
    g.fillStyle(0xf5c84c).fillRect(626, 74, 4, 20);
    this.walls.add(this.add.zone(598, 66, 36, 58).setOrigin(0));
    addLight(this, 616, 96, 0x9fd0ff, { scale: 0.35, alpha: 0.4 }).setDepth(800);

    // rangée de casiers le long du mur de droite
    for (let y = 300; y < 420; y += 24) {
      g.fillStyle(0x5b7da0).fillRect(878, y, 22, 22);
      g.lineStyle(1, 0x3e5a78).strokeRect(878, y, 22, 22);
      g.fillStyle(0xc9ced6).fillRect(881, y + 9, 3, 5);
    }
    this.walls.add(this.add.zone(878, 300, 22, 120).setOrigin(0));

    // plantes vertes
    for (const [px, py] of [[115, 268], [885, 625], [545, 292], [220, 450]]) {
      g.fillStyle(0x8a5a35).fillCircle(px, py, 9);
      g.fillStyle(0x3f7d3a).fillCircle(px - 5, py - 4, 8).fillCircle(px + 5, py - 5, 8).fillCircle(px, py - 10, 8);
    }

    // bancs contre le mur de l'amphi et de Callelongue (vus de dessus)
    for (const [bx, by, bw] of [[150, 234, 70], [400, 234, 90], [300, 413, 80]]) {
      g.fillStyle(0x6e5236).fillRect(bx, by, bw, 12);
      g.lineStyle(1, 0x4a3524).lineBetween(bx, by + 4, bx + bw, by + 4).lineBetween(bx, by + 8, bx + bw, by + 8);
      this.walls.add(this.add.zone(bx, by, bw, 12).setOrigin(0));
    }

    // poubelles (rondes, vues de dessus) et extincteurs rouges au pied des murs
    for (const [tx, ty] of [[640, 282], [225, 300], [440, 418]]) {
      g.fillStyle(0x4a525e).fillCircle(tx, ty, 8);
      g.fillStyle(0x2a2f38).fillCircle(tx, ty, 5);
      g.fillStyle(0xf0ece2).fillCircle(tx - 1, ty - 1, 2);
    }
    for (const [ex, ey] of [[106, 300], [595, 240], [888, 440], [678, 462]]) {
      g.fillStyle(0xc0392b).fillCircle(ex, ey, 6);
      g.fillStyle(0x222222).fillCircle(ex, ey, 2);
    }

    // affiches et panneau d'affichage sur les murs des salles
    for (const [ax, ay, color] of [[260, 296, 0x3b6ea8], [430, 296, 0xc0392b], [270, 466, 0x2e9e5b], [490, 466, 0x8e6bd6], [600, 466, 0xc06a8a]]) {
      g.fillStyle(0xf6f1e6).fillRect(ax, ay, 26, 5);
      g.fillStyle(color).fillRect(ax, ay, 8, 5);
    }
    g.fillStyle(0xc49a6c).fillRect(330, 296, 70, 5); // panneau de liège
    g.fillStyle(0xf6f1e6).fillRect(338, 296, 10, 4).fillRect(356, 296, 10, 4).fillRect(376, 296, 10, 4);

    // fontaine à eau entre Sormiou et le point repas
    g.fillStyle(0xdfe6ea).fillRect(655, 590, 28, 28);
    g.fillStyle(0x6fb6e0).fillCircle(669, 602, 8);
    this.walls.add(this.add.zone(655, 590, 28, 28).setOrigin(0));

    // chariot de ménage du gardien, garé près de son local
    g.fillStyle(0x3a6ea8).fillRect(848, 232, 30, 22);
    g.fillStyle(0xe0e0e0).fillCircle(857, 243, 6);
    g.fillStyle(0x8a5a35).fillRect(868, 236, 3, 14);
    // panneau « sol glissant » (jaune, comme dans tous les couloirs d'école)
    g.fillStyle(0xf5c84c).fillTriangle(760, 330, 772, 352, 748, 352);
    g.fillStyle(0x222222).fillRect(759, 338, 2, 8);

    // paillasson devant la sortie
    g.fillStyle(0x5a3f2c).fillRect(30, 318, 34, 54);
    g.lineStyle(1, 0x3e2b1e);
    for (let y = 322; y < 370; y += 6) g.lineBetween(32, y, 62, y);
  }

  drawExit() {
    const g = this.add.graphics();
    // porte vitrée
    g.fillStyle(0x9fb7c9).fillRect(EXIT.x - 20, EXIT.y - 36, 12, 72);
    g.lineStyle(2, 0x5f6f7c).strokeRect(EXIT.x - 20, EXIT.y - 36, 12, 72).lineBetween(EXIT.x - 20, EXIT.y, EXIT.x - 8, EXIT.y);
    // panneau vert "sortie de secours"
    const glow = addLight(this, EXIT.x + 22, EXIT.y - 62, 0x3dff7a, { scale: 0.5, alpha: 0.45 }).setDepth(800);
    txt(this, EXIT.x + 22, EXIT.y - 62, '🏃 SORTIE', { size: 13, weight: '800', color: 0xffffff, backgroundColor: hex(0x1f8a4c), padding: { x: 6, y: 3 } })
      .setOrigin(0.5)
      .setDepth(760);
    this.tweens.add({ targets: [glow], alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
    this.interactables.push({ x: EXIT.x + 10, y: EXIT.y, label: 'Porte de sortie', action: () => this.tryExit() });
  }

  // ---------- Boucle de jeu ----------
  update(_, delta) {
    // figé = on quitte le couloir (entrée dans une salle, fin de partie) : la scène va s'arrêter
    if (this.frozen) return;
    this.updateMate(delta);
    this.presenceTimer += delta;
    if (this.presenceTimer > 100) {
      this.presenceTimer = 0;
      sendPresence({ room: null, x: Math.round(this.player.x), y: Math.round(this.player.y) });
    }
    this.updateGuard(delta); // le gardien bouge même quand une boîte de dialogue est ouverte
    const body = this.player.body;
    if (isDialogOpen()) {
      body.setVelocity(0);
      animateWalk(this.player, 'player', 0, 0);
      return;
    }

    const k = this.keys;
    let vx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.Q.isDown ? 1 : 0);
    let vy = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.Z.isDown ? 1 : 0);

    if (this.stick && (this.stick.vx || this.stick.vy)) {
      vx = this.stick.vx;
      vy = this.stick.vy;
    }

    if (vx || vy) {
      this.target = null;
    } else if (this.target) {
      const dx = this.target.x - this.player.x;
      const dy = this.target.y - this.player.y;
      if (Math.hypot(dx, dy) < 6) this.target = null;
      else [vx, vy] = [dx, dy];
    }

    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(PLAYER_SPEED);
    body.setVelocity(v.x, v.y);
    animateWalk(this.player, 'player', v.x, v.y);
    this.player.setDepth(this.player.y);
    // bruit de pas, un pied après l'autre
    if (vx || vy) {
      this.stepTimer += delta;
      if (this.stepTimer > 260) {
        this.stepTimer = 0;
        this.stepLeft = !this.stepLeft;
        sfx.step(this.stepLeft);
      }
    }
    this.playerLight.setPosition(this.player.x, this.player.y + 8);

    this.updatePrompt();
  }

  updatePrompt() {
    this.nearby = this.interactables.find(
      (it) => Phaser.Math.Distance.Between(it.x, it.y, this.player.x, this.player.y) < INTERACT_RADIUS,
    );
    if (this.nearby) {
      this.prompt.setText(`${this.stick ? '👆' : 'E —'} ${this.nearby.label}`).setVisible(true);
      // on garde l'étiquette dans l'écran (la porte de sortie est collée au bord)
      const x = Phaser.Math.Clamp(this.nearby.x + 10, this.prompt.width / 2 + 4, WORLD.width - this.prompt.width / 2 - 4);
      this.prompt.setPosition(x, this.nearby.y - 38);
    } else {
      this.prompt.setVisible(false);
    }
  }

  interact() {
    if (isDialogOpen() || !this.nearby) return;
    this.nearby.action();
  }

  enterRoom(room) {
    state.data.playerPos = { x: this.player.x, y: this.player.y };
    state.save();
    this.freeze();
    sfx.doorOpen();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Room', { roomKey: room.key }));
  }

  visitDetente() {
    // Bonus : le carnet du gardien, oublié sous un coussin, rend le prochain indice gratuit
    if (!state.hasItem('carnet-gardien')) {
      state.gainFreeHint();
      state.addItem('carnet-gardien');
      openDialog({
        title: 'Salle de détente',
        body: '<p>Le canapé te fait de l\'œil… Pas le moment de se rendormir.</p><p>Sous un coussin, tu trouves un vieux carnet plein de notes sur l\'école : <strong>ton prochain indice sera gratuit</strong>.</p>',
      });
      return;
    }
    openDialog({
      title: 'Salle de détente',
      body: '<p>Le canapé te fait de l\'œil… Pas le moment de se rendormir.</p>',
    });
  }

  /** Pavé numérique de la porte : on clique les chiffres, A pour valider, B pour abandonner. */
  exitKeypad() {
    let code = '';
    const wrap = document.createElement('div');
    wrap.innerHTML = '<p>Un boîtier à 4 chiffres. Un voyant rouge clignote.</p>';
    const screen = document.createElement('div');
    screen.className = 'keypad-screen';
    screen.setAttribute('aria-live', 'polite');
    const pad = document.createElement('div');
    pad.className = 'keypad';
    wrap.append(screen, pad);
    const show = () => (screen.textContent = code.padEnd(4, '_').split('').join(' '));
    show();

    const ui = openDialog({ title: 'Porte de sortie', body: wrap, closable: false });
    const press = (k) => {
      if (k === 'B') {
        ui.close();
        return;
      }
      if (k === 'A') {
        if (code === EXIT_CODE) {
          sfx.success();
          endGame(this, true, 'escaped');
          return;
        }
        state.penalize();
        this.cameras.main.shake(250, 0.01);
        ui.feedback(`BIP ! Code refusé. +${PENALTY_ERROR} min.`);
        code = '';
        show();
        return;
      }
      if (code.length >= 4) return;
      sfx.beep(code.length);
      code += k;
      show();
    };
    for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'B', '0', 'A']) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = k;
      if (k === 'A') b.className = 'ok';
      if (k === 'B') b.className = 'cancel';
      b.setAttribute('aria-label', k === 'A' ? 'A : valider' : k === 'B' ? 'B : quitter' : k);
      b.addEventListener('click', () => press(k));
      pad.appendChild(b);
    }
    pad.insertAdjacentHTML('afterend', '<p><em>A : valider · B : quitter</em></p>');
  }

  tryExit() {
    // À 2 : la porte de secours ne s'ouvre qu'avec les deux élèves devant
    const m = net.mate;
    if (net.online && (m.room || Phaser.Math.Distance.Between(m.x, m.y, EXIT.x, EXIT.y) > EXIT_TEAM_RADIUS)) {
      openDialog({
        title: 'Porte de sortie',
        body: `<p>La barre anti-panique est bloquée : il faut que l'un tape le code pendant que l'autre pousse la porte.</p><p><strong>Attends que ${esc(m.name)} te rejoigne devant la sortie.</strong></p>`,
      });
      return;
    }
    this.exitKeypad();
  }

  // ---------- Le gardien (rondes lancées quand le courant revient) ----------
  spawnGuard() {
    if (this.guard) return;
    const p = guardPosition();
    // halo de la lampe torche + zone de repérage visible : y entrer, c'est perdu
    this.torch = addLight(this, p.x, p.y, 0xfff1c0, { scale: (GUARD_SIGHT * 2.6) / 256, alpha: 0.7 }).setDepth(800);
    this.beam = this.add.circle(p.x, p.y, GUARD_SIGHT, 0xfff1c0, 0.1).setStrokeStyle(2, 0xfff1c0, 0.35).setDepth(799);
    // dessiné au-dessus de sa lampe (profondeur 800) pour ne pas être délavé par la lumière
    this.guard = this.add.sprite(p.x, p.y, 'guard', 'down0').setDepth(810);
  }

  /** Petit message en haut du couloir qui disparaît tout seul (n'interrompt pas le jeu). */
  toast(message) {
    this.toastText?.destroy();
    const t = txt(this, WORLD.width / 2, WORLD.y + 18, message, {
      size: 15, weight: '800', color: 0xffffff, backgroundColor: hex(C.red), padding: { x: 12, y: 6 },
    }).setOrigin(0.5, 0).setDepth(1001);
    this.toastText = t;
    this.tweens.add({ targets: t, alpha: 0, delay: 2800, duration: 500, onComplete: () => t.destroy() });
  }

  despawnGuard() {
    this.guard?.destroy();
    this.torch?.destroy();
    this.beam?.destroy();
    this.guard = this.torch = this.beam = null;
  }

  updateGuard(delta) {
    if (!this.guard) return;
    const p = guardPosition();
    const moving = p.x !== this.guard.x || p.y !== this.guard.y;
    const dist = Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y);
    if (moving) this.guardSounds(delta, dist);
    // vitesse en px/s, comme pour le joueur : le déplacement d'une seule image (~1 px) est trop petit
    // et ferait croire à animateWalk que le gardien est immobile
    const perSec = 1000 / delta;
    animateWalk(this.guard, 'guard', (p.x - this.guard.x) * perSec, (p.y - this.guard.y) * perSec);
    this.guard.setPosition(p.x, p.y);
    this.torch.setPosition(p.x, p.y);
    this.beam.setPosition(p.x, p.y);
    const close = dist < GUARD_SIGHT;
    if (close && !patrolJustStarted() && this.time.now > this.graceUntil) this.caught();
  }

  /** Pas du gardien (plus forts quand il est près) et cœur qui s'emballe quand il approche. */
  guardSounds(delta, dist) {
    this.guardStepTimer += delta;
    if (this.guardStepTimer > 480) {
      this.guardStepTimer = 0;
      sfx.guardStep(Phaser.Math.Clamp(1 - dist / 650, 0.08, 1) ** 1.5);
    }
    const danger = GUARD_SIGHT * 2.5;
    if (dist < danger) {
      this.heartTimer += delta;
      if (this.heartTimer > 380 + (dist / danger) * 500) {
        this.heartTimer = 0;
        sfx.heartbeat(1 - dist / danger / 2);
      }
    }
  }

  freeze() {
    this.frozen = true;
    this.target = null;
    this.player.body.setVelocity(0);
    animateWalk(this.player, 'player', 0, 0);
  }

  caught() {
    // Repéré : game over
    this.freeze();
    sfx.caught();
    state.set('guardChoice', 'caught');
    this.cameras.main.flash(400, 255, 240, 200);
    this.time.delayedCall(700, () => endGame(this, false, 'caught'));
  }
}
