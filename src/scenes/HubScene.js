import Phaser from 'phaser'; // on importe Phaser, l'outil qui fait marcher le jeu
import { state } from '../state/GameState.js'; // state = la mémoire de la partie (objets, salles résolues…)
import { openDialog, isDialogOpen } from '../ui/dialog.js'; // outils pour ouvrir une boîte de dialogue et savoir si elle est ouverte
// le plan du couloir : taille, départ, salles, murs, sortie
import { WORLD, START, ROOM_BLOCKS, BLOCKED, EXIT } from '../data/hubLayout.js';
import { EXIT_CODE } from '../puzzles/code.js'; // le bon code de la porte de sortie
import { PLAYER_SPEED, PENALTY_ERROR, GUARD_SIGHT } from '../config.js'; // réglages : vitesse du joueur, pénalité, vue du gardien
import { animateWalk } from '../art/characters.js'; // fonction qui anime la marche d'un personnage
import { C, FONT_TITLE, hex, txt, addLight, nightOverlay } from '../ui/theme.js'; // couleurs, police et petits outils de dessin
import { endGame } from './endGame.js'; // fonction qui termine la partie
// outils pour savoir où est le gardien et s'il fait sa ronde
import { isPatrolActive, patrolJustStarted, guardPosition } from '../state/patrol.js';
import { sfx, setAmbience } from '../audio/sound.js'; // bruitages et musique d'ambiance
import { net, ROLES, sendPresence, esc } from '../net/multiplayer.js'; // outils du jeu à 2 joueurs en réseau
import { isTouch } from '../ui/touch.js'; // fonction qui dit si l'écran est tactile

const INTERACT_RADIUS = 46; // distance (en pixels) pour pouvoir utiliser une porte
const EXIT_TEAM_RADIUS = 110; // à 2 : les deux joueurs doivent être près de la sortie

// Manette tactile (mobile) : joystick dans la zone hachurée en bas à gauche, bouton d'action sur le mur de droite
const STICK = { x: 105, y: 545, r: 62 }; // position et taille du joystick (r = rayon du rond)
const ACTION = { x: 930, y: 545, r: 27 }; // position et taille du bouton « agir »

// Le couloir : le joueur s'y déplace et entre dans les salles par leurs portes.
// Le couloir de l'école, vu de dessus : le joueur s'y déplace et entre dans les salles par leurs portes.
export class HubScene extends Phaser.Scene { // on crée la scène du couloir (scène = un écran du jeu)
  constructor() { // constructor = fonction lancée à la création de la scène
    super('Hub'); // on donne le nom 'Hub' à cette scène
  }

  create(data) { // create = fonction lancée quand on arrive dans le couloir
    state.data.currentRoom = null; // on note qu'on n'est dans aucune salle
    if (data?.fromRoom) sfx.doorClose(); // la porte de la salle se referme derrière l'élève
    // la même instance de scène est réutilisée : on repart d'un état propre
    this.frozen = false; // le joueur n'est pas bloqué
    this.target = null; // pas de destination de clic pour l'instant
    this.nearby = null; // aucune porte proche pour l'instant
    this.guard = this.torch = this.beam = null; // pas encore de gardien, ni de lampe, ni de zone de vue
    this.stepTimer = this.guardStepTimer = this.heartTimer = 0; // on remet tous les chronos à zéro
    this.stepLeft = false; // le prochain pas sera le pied droit
    this.presenceTimer = 0; // chrono pour envoyer notre position au coéquipier
    setAmbience('hub'); // on lance l'ambiance sonore du couloir
    this.cameras.main.setBackgroundColor(0x2b2622); // couleur de fond de la caméra (caméra = ce que voit l'écran)
    this.cameras.main.fadeIn(300, 0, 0, 0); // l'écran apparaît doucement depuis le noir
    this.physics.world.setBounds(WORLD.x, WORLD.y, WORLD.width, WORLD.height); // le joueur ne peut pas sortir de ces limites

    this.walls = this.physics.add.staticGroup(); // groupe de murs immobiles qui bloquent le joueur
    this.interactables = []; // liste des choses qu'on peut utiliser (portes, sortie)

    this.drawFloor(); // on dessine le sol
    for (const b of BLOCKED) this.drawBlocked(b); // on dessine chaque zone interdite
    for (const room of ROOM_BLOCKS) this.drawRoom(room); // on dessine chaque salle
    this.drawCorridorProps(); // on dessine les objets du couloir
    this.drawExit(); // on dessine la porte de sortie

    // Il fait nuit : un voile bleu, et seules quelques lumières percent
    nightOverlay(this, 0.42); // on pose un voile sombre sur tout l'écran

    // Joueur : la boîte de collision est réduite aux pieds pour qu'il "passe derrière" les meubles
    const pos = state.data.playerPos || START; // position du joueur : celle sauvegardée, sinon le départ
    // on crée le joueur, qui ne peut pas sortir de l'écran
    this.player = this.physics.add.sprite(pos.x, pos.y, 'player', 'down0').setCollideWorldBounds(true);
    this.player.body.setSize(16, 10).setOffset(8, 38); // boîte de collision : petite, au niveau des pieds
    this.physics.add.collider(this.player, this.walls); // le joueur se cogne contre les murs
    // la lampe du téléphone éclaire autour de l'élève
    // on crée la lumière autour du joueur
    this.playerLight = addLight(this, pos.x, pos.y, 0xffe9b0, { scale: 1.3, alpha: 0.4 }).setDepth(800);

    // Si le gardien fait sa ronde, il est toujours là en revenant dans le couloir.
    // Petit délai de grâce pour ne pas être attrapé pendant le fondu d'entrée.
    this.graceUntil = this.time.now + 1500; // pendant 1,5 s, le gardien ne peut pas nous attraper
    if (isPatrolActive()) this.spawnGuard(); // si une ronde est en cours, on fait apparaître le gardien
    this.onPatrolStarted = () => { // ce qu'on fait quand une ronde commence :
      this.spawnGuard(); // on fait apparaître le gardien
      sfx.distantSlam(); // bruit de porte qui claque au loin
      this.toast('👣 Le gardien commence une nouvelle ronde !'); // petit message d'alerte en haut de l'écran
    };
    this.onPatrolEnded = ({ quiet } = {}) => { // ce qu'on fait quand une ronde se termine :
      this.despawnGuard(); // on fait disparaître le gardien
      // si on n'a pas demandé le silence, on affiche un message
      if (!quiet) this.toast('Les pas s\'éloignent : le gardien est retourné dans son local… pour l\'instant.');
    };
    state.on('patrol-started', this.onPatrolStarted); // on écoute le début des rondes
    state.on('patrol-ended', this.onPatrolEnded); // on écoute la fin des rondes
    this.events.once('shutdown', () => { // quand on quitte le couloir…
      state.off('patrol-started', this.onPatrolStarted); // … on arrête d'écouter le début des rondes
      state.off('patrol-ended', this.onPatrolEnded); // … et la fin des rondes
    });

    // étiquette « E — nom de la porte » qui s'affiche près des portes
    this.prompt = txt(this, 0, 0, '', { size: 15, weight: '800', color: C.ink, backgroundColor: hex(C.paper), padding: { x: 10, y: 5 } })
      .setOrigin(0.5) // son point d'accroche est au centre
      .setDepth(1000) // affichée devant presque tout
      .setVisible(false) // cachée au début
      .setInteractive({ useHandCursor: true }); // cliquable, avec la petite main
    this.prompt.on('pointerdown', (p, x, y, e) => { // quand on clique sur l'étiquette…
      e.stopPropagation(); // on empêche le clic de faire bouger le joueur
      this.interact(); // on utilise la porte
    });

    // Contrôles : clavier (flèches + ZQSD) et clic / tactile pour se déplacer
    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,Z,Q,S,D'); // on écoute les flèches et les touches Z, Q, S, D
    this.input.keyboard.on('keydown-E', () => this.interact()); // touche E : utiliser la porte proche
    this.input.keyboard.on('keydown-ENTER', () => this.interact()); // touche Entrée : pareil
    this.input.keyboard.on('keydown-ESC', () => this.scene.get('UI').pause()); // touche Échap : mettre le jeu en pause
    this.stick = null; // pas de joystick par défaut
    if (isTouch()) this.createTouchControls(); // sur écran tactile, on ajoute la manette à l'écran
    this.input.on('pointerdown', (p) => { // quand on clique ou touche l'écran…
      // si pas de dialogue ni manette touchée, on va à cet endroit
      if (!isDialogOpen() && !this.onTouchControls(p)) this.target = { x: p.worldX, y: p.worldY };
    });

    this.createMate(); // on prépare l'affichage du coéquipier

    if (!this.scene.isActive('UI')) this.scene.launch('UI'); // si la barre d'interface n'est pas lancée, on la lance
    this.scene.bringToTop('UI'); // on met la barre d'interface au premier plan
  }

  // ---------- Manette tactile (version mobile) ----------
  createTouchControls() { // fonction qui crée la manette tactile
    this.input.addPointer(1); // deux doigts : un sur le joystick, un pour toucher une porte
    this.stick = { id: null, vx: 0, vy: 0 }; // le joystick : pas de doigt dessus, pas de mouvement
    // le grand rond du joystick
    const base = this.add.circle(STICK.x, STICK.y, STICK.r, 0xffffff, 0.14).setStrokeStyle(3, 0xffffff, 0.5).setDepth(1100);
    this.stickThumb = this.add.circle(STICK.x, STICK.y, 26, 0xffffff, 0.55).setDepth(1101); // le petit rond qu'on bouge avec le doigt
    // le mot « bouger » sous le joystick
    txt(this, STICK.x, STICK.y + STICK.r + 14, 'bouger', { size: 13, weight: '800', color: 0xffffff }).setOrigin(0.5).setDepth(1100).setAlpha(0.7);
    base.setInteractive(); // pour que le doigt posé dessus ne déclenche rien d'autre

    // le bouton jaune « agir », qu'on peut toucher
    const action = this.add.circle(ACTION.x, ACTION.y, ACTION.r, C.yellow, 0.9).setStrokeStyle(3, 0xffffff).setDepth(1100).setInteractive();
    txt(this, ACTION.x, ACTION.y, '✋', { size: 24 }).setOrigin(0.5).setDepth(1101); // une petite main dessinée sur le bouton
    // le mot « agir » sous le bouton
    txt(this, ACTION.x, ACTION.y + ACTION.r + 12, 'agir', { size: 13, weight: '800', color: 0xffffff }).setOrigin(0.5).setDepth(1100).setAlpha(0.7);
    action.on('pointerdown', () => this.interact()); // toucher le bouton = utiliser la porte proche

    const move = (p) => { // fonction qui bouge le joystick selon le doigt
      const dx = p.x - STICK.x; // écart horizontal entre le doigt et le centre
      const dy = p.y - STICK.y; // écart vertical entre le doigt et le centre
      const len = Math.hypot(dx, dy); // distance entre le doigt et le centre
      const k = len > STICK.r ? STICK.r / len : 1; // si le doigt sort du rond, on le ramène au bord
      this.stickThumb.setPosition(STICK.x + dx * k, STICK.y + dy * k); // on place le petit rond sous le doigt
      // petite zone morte au centre : le doigt posé sans bouger ne fait pas avancer
      this.stick.vx = len > 10 ? dx / len : 0; // direction gauche/droite (0 si trop près du centre)
      this.stick.vy = len > 10 ? dy / len : 0; // direction haut/bas (0 si trop près du centre)
    };
    this.input.on('pointerdown', (p) => { // quand un doigt touche l'écran…
      if (Math.hypot(p.x - STICK.x, p.y - STICK.y) > STICK.r + 30) return; // s'il est loin du joystick, on ne fait rien
      this.stick.id = p.id; // on retient quel doigt tient le joystick
      move(p); // on bouge le joystick
    });
    this.input.on('pointermove', (p) => p.id === this.stick.id && move(p)); // quand ce même doigt glisse, on bouge le joystick
    const release = (p) => { // fonction quand on lève le doigt
      if (p.id !== this.stick.id) return; // si ce n'est pas le doigt du joystick, on ignore
      this.stick = { id: null, vx: 0, vy: 0 }; // le joystick ne bouge plus
      this.stickThumb.setPosition(STICK.x, STICK.y); // le petit rond revient au centre
    };
    this.input.on('pointerup', release); // quand le doigt se lève, on relâche
    this.input.on('pointerupoutside', release); // pareil si le doigt se lève hors de l'écran
  }

  /** Vrai si le doigt est sur le joystick ou le bouton d'action (ce n'est pas un « va là-bas »). */
  onTouchControls(p) { // fonction : le doigt est-il sur la manette ?
    if (!this.stick) return false; // pas de manette : réponse non
    // oui si le doigt est près du joystick ou du bouton
    return Math.hypot(p.x - STICK.x, p.y - STICK.y) <= STICK.r + 30 || Math.hypot(p.x - ACTION.x, p.y - ACTION.y) <= ACTION.r + 10;
  }

  // ---------- Le coéquipier (partie à 2) ----------
  createMate() { // fonction qui prépare l'affichage du coéquipier
    this.mate = this.add.sprite(-100, -100, 'mate', 'down0').setVisible(false); // le personnage du coéquipier, caché hors de l'écran
    // étiquette verte avec son nom, au-dessus de sa tête
    this.mateTag = txt(this, 0, 0, '', { size: 12, weight: '800', color: 0xffffff, backgroundColor: hex(0x3f8f5a), padding: { x: 5, y: 1 } })
      .setOrigin(0.5, 1) // accrochée par le bas au milieu
      .setDepth(999) // sous l'étiquette « E — … »
      .setVisible(false); // cachée au début
    // quand il est dans une salle : une étiquette sur la porte
    // étiquette verte affichée sur une porte
    this.mateDoor = txt(this, 0, 0, '', { size: 12, weight: '800', color: 0xffffff, backgroundColor: hex(0x3f8f5a), padding: { x: 5, y: 2 } })
      .setOrigin(0.5) // accrochée au centre
      .setDepth(1000) // affichée devant presque tout
      .setVisible(false); // cachée au début
  }

  updateMate(delta) { // fonction qui met à jour le coéquipier à chaque image
    const m = net.mate; // m = les infos reçues sur le coéquipier
    if (!net.online || !m || m.x === undefined) { // pas en ligne, pas de coéquipier, ou position inconnue :
      this.mate.setVisible(false); // on cache le coéquipier
      this.mateTag.setVisible(false); // on cache son étiquette
      this.mateDoor.setVisible(false); // on cache l'étiquette de porte
      return; // et on s'arrête là
    }
    const label = `${ROLES[m.role].icon} ${m.name}`; // texte : son icône de rôle + son nom
    if (m.room) { // s'il est dans une salle…
      this.mate.setVisible(false); // on cache son personnage
      this.mateTag.setVisible(false); // on cache son étiquette
      const door = ROOM_BLOCKS.find((r) => r.key === m.room)?.door; // on cherche la porte de sa salle
      // on écrit « … est ici » sur cette porte
      if (door) this.mateDoor.setText(`${label} est ici`).setPosition(door.x, door.y - 26).setVisible(true);
      return; // et on s'arrête là
    }
    this.mateDoor.setVisible(false); // il est dans le couloir : on cache l'étiquette de porte
    if (!this.mate.visible) this.mate.setPosition(m.x, m.y).setVisible(true); // il sort d'une salle
    // on glisse vers la dernière position reçue (elle arrive 10 fois par seconde)
    const t = Math.min(1, delta / 90); // t = part du chemin à faire pendant cette image (max 1)
    const nx = this.mate.x + (m.x - this.mate.x) * t; // nouvelle position horizontale, un peu plus proche
    const ny = this.mate.y + (m.y - this.mate.y) * t; // nouvelle position verticale, un peu plus proche
    const perSec = 1000 / delta; // nombre d'images par seconde
    animateWalk(this.mate, 'mate', (nx - this.mate.x) * perSec, (ny - this.mate.y) * perSec); // on anime sa marche selon sa vitesse
    this.mate.setPosition(nx, ny).setDepth(ny); // on le déplace ; plus il est bas, plus il passe devant
    this.mateTag.setText(label).setPosition(nx, ny - 28).setVisible(true); // son étiquette suit au-dessus de sa tête
  }

  // ---------- Décor ----------
  drawFloor() { // fonction qui dessine le sol
    // carrelage du couloir en damier
    const g = this.add.graphics(); // g = un pinceau pour dessiner des formes
    const T = 30; // T = taille d'un carreau (30 pixels)
    for (let y = WORLD.y; y < WORLD.y + WORLD.height; y += T) { // pour chaque ligne de carreaux…
      for (let x = WORLD.x; x < WORLD.width; x += T) { // … et chaque carreau de la ligne
        g.fillStyle(((x + y) / T) % 2 ? C.floorA : C.floorB).fillRect(x, y, T, T); // un carreau sur deux est plus clair ou plus foncé
      }
    }
    // mur extérieur à droite
    g.fillStyle(0x4a4440).fillRect(WORLD.width, WORLD.y, this.scale.width - WORLD.width, WORLD.height); // on peint le mur gris à droite
  }

  drawBlocked(b) { // fonction qui dessine une zone interdite (b = la zone)
    const g = this.add.graphics(); // g = un pinceau pour dessiner des formes
    g.fillStyle(0x4a4440).fillRect(b.x, b.y, b.w, b.h); // on remplit la zone en gris
    g.lineStyle(1, 0x000000, 0.12); // traits fins noirs presque transparents
    // on trace des rayures en diagonale
    for (let d = -b.h; d < b.w; d += 14) g.lineBetween(b.x + Math.max(0, d), b.y + Math.max(0, -d), b.x + Math.min(b.w, d + b.h), b.y + Math.min(b.h, b.w - d));
    this.walls.add(this.add.zone(b.x, b.y, b.w, b.h).setOrigin(0)); // on ajoute un mur invisible pour bloquer le joueur
  }

  drawRoom(room) { // fonction qui dessine une salle
    const g = this.add.graphics(); // g = un pinceau pour dessiner des formes
    // murs épais puis sol de la salle
    g.fillStyle(0x5a514a).fillRect(room.x, room.y, room.w, room.h); // on peint le rectangle des murs
    const ix = room.x + 7; // début du sol à gauche (après le mur de 7 px)
    const iy = room.y + 7; // début du sol en haut
    const iw = room.w - 14; // largeur du sol (sans les murs)
    const ih = room.h - 14; // hauteur du sol (sans les murs)
    if (room.decor === 'lounge') { // si c'est la salle de détente…
      g.fillStyle(0x4a5f8a).fillRect(ix, iy, iw, ih); // moquette
    } else if (room.decor === 'kitchen') { // sinon, si c'est la cuisine…
      // carrelage en damier gris clair et gris
      for (let y = iy; y < iy + ih; y += 16) for (let x = ix; x < ix + iw; x += 16) g.fillStyle(((x - ix + y - iy) / 16) % 2 ? 0xd8d8d0 : 0xc4c4bb).fillRect(x, y, Math.min(16, ix + iw - x), Math.min(16, iy + ih - y));
    } else { // sinon (salle normale)…
      g.fillStyle(0x7a5a3c).fillRect(ix, iy, iw, ih); // parquet
      g.lineStyle(1, 0x5f4530, 0.6); // traits fins marron pour les lattes
      for (let y = iy + 12; y < iy + ih; y += 12) g.lineBetween(ix, y, ix + iw, y); // une ligne tous les 12 pixels
    }
    this.drawDecor(g, room, ix, iy, iw, ih); // on dessine les meubles de la salle
    this.walls.add(this.add.zone(room.x, room.y, room.w, room.h).setOrigin(0)); // mur invisible : on ne peut pas traverser la salle

    // nom de la salle (au-dessus du voile de nuit pour rester lisible)
    const cx = room.x + room.w / 2; // centre horizontal de la salle
    const cy = room.y + room.h / 2; // centre vertical de la salle
    // on écrit le nom de la salle au centre
    txt(this, cx, cy, room.label, { size: 20, font: FONT_TITLE, color: 0xffffff, align: 'center', shadow: true }).setOrigin(0.5).setDepth(750);
    if (state.data.solved[room.key]) { // si la salle est déjà résolue…
      // on ajoute « ✓ résolu » sous le nom (plus bas si 2 lignes)
      txt(this, cx, cy + (room.label.includes('\n') ? 36 : 24), '✓ résolu', {
        // texte blanc, gras, sur fond vert
        size: 14, weight: '800', color: 0xffffff, backgroundColor: hex(C.green), padding: { x: 8, y: 2 },
      }).setOrigin(0.5).setDepth(750).setAngle(-4); // centré, au premier plan, un peu penché
    }

    // porte en bois ; une fois la lumière allumée, un filet de lumière passe dessous
    if (state.hasItem('lumiere')) { // si le joueur a allumé la lumière…
      // petite lumière jaune sous la porte
      const glow = addLight(this, room.door.x, room.door.y, 0xffd27a, { scale: 0.35, alpha: 0.5 }).setDepth(800);
      // la lumière clignote doucement, sans fin
      this.tweens.add({ targets: glow, alpha: 0.25, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // la porte est posée dans le mur le plus proche du point d'entrée
    const vertical = room.door.x < room.x; // porte sur le côté gauche (Callelongue)
    const doorX = vertical ? room.x + 3 : room.door.x; // position horizontale de la porte
    // position verticale de la porte (en haut ou en bas)
    const doorY = vertical ? room.door.y : room.door.y < room.y ? room.y + 3 : room.y + room.h - 3;
    // on dessine la porte : un rectangle en bois
    const door = this.add.rectangle(doorX, doorY, vertical ? 8 : 40, vertical ? 40 : 8, C.woodDark)
      .setStrokeStyle(2, C.wood) // avec un contour marron clair
      .setInteractive({ useHandCursor: true }); // cliquable, avec la petite main
    door.on('pointerdown', () => (this.target = { ...room.door })); // cliquer la porte = le joueur marche jusqu'à elle

    this.interactables.push({ // on ajoute la porte à la liste des choses utilisables
      x: room.door.x, // position horizontale du point d'entrée
      y: room.door.y, // position verticale du point d'entrée
      label: room.label.replace('\n', ' '), // nom affiché, sur une seule ligne
      // action : détente = message, sinon on entre dans la salle
      action: () => (room.key === 'detente' ? this.visitDetente() : this.enterRoom(room)),
    });
  }

  // Mobilier vu de dessus : rangées de l'amphi, tables et chaises, canapé…
  drawDecor(g, room, x, y, w, h) { // fonction qui dessine les meubles d'une salle
    const chair = 0x3a3f47; // couleur des chaises (gris foncé)
    if (room.decor === 'amphi') { // si c'est l'amphi…
      g.fillStyle(C.board).fillRect(x + w / 2 - 90, y + 2, 180, 8); // tableau
      g.fillStyle(C.wood).fillRect(x + w / 2 - 40, y + 18, 80, 14); // bureau du prof
      for (let r = 0; r < 4; r++) { // 4 rangées de bancs
        g.fillStyle(C.wood).fillRect(x + 20, y + 46 + r * 28, w - 40, 9); // une longue table
        g.fillStyle(chair); // couleur des chaises
        for (let sx = x + 26; sx < x + w - 30; sx += 20) g.fillRect(sx, y + 57 + r * 28, 12, 7); // une chaise tous les 20 pixels
      }
    } else if (room.decor === 'desks') { // sinon, si c'est une salle de classe…
      g.fillStyle(C.board).fillRect(x + 20, y + 2, Math.min(140, w - 40), 6); // le tableau en haut
      for (let dy = y + 22; dy < y + h - 22; dy += 34) { // pour chaque rangée de tables…
        for (let dx = x + 18; dx < x + w - 40; dx += 56) { // … et chaque table de la rangée
          g.fillStyle(C.wood).fillRect(dx, dy, 40, 14); // la table en bois
          g.fillStyle(chair).fillRect(dx + 6, dy + 17, 11, 7).fillRect(dx + 23, dy + 17, 11, 7); // deux chaises derrière la table
        }
      }
    } else if (room.decor === 'lounge') { // sinon, si c'est la salle de détente…
      g.fillStyle(0x8a3b3b).fillRoundedRect(x + 16, y + 14, w - 32, 30, 8); // le dossier du canapé
      g.fillStyle(0x9e4848).fillRoundedRect(x + 22, y + 18, w - 44, 18, 6); // l'assise du canapé
      g.fillStyle(C.wood).fillRoundedRect(x + w / 2 - 40, y + 70, 80, 40, 6); // la table basse
      g.fillStyle(0x3f7d3a).fillCircle(x + w - 26, y + h - 26, 16); // une plante verte dans le coin
      g.fillStyle(0x2f2a26).fillRect(x + 14, y + h - 40, 40, 26); // baby-foot / borne d'arcade
    } else if (room.decor === 'kitchen') { // sinon, si c'est la cuisine…
      g.fillStyle(0xb9bec6).fillRect(x, y, w, 18); // plan de travail
      g.fillStyle(0xeef1f3).fillRect(x + w - 30, y, 26, 26); // frigo
      // pour chacune des 4 tables rondes…
      for (const [tx, ty] of [[x + 40, y + 70], [x + w - 50, y + 70], [x + 40, y + h - 36], [x + w - 50, y + h - 36]]) {
        g.fillStyle(C.wood).fillCircle(tx, ty, 16); // la table ronde en bois
        // 4 chaises autour de la table
        g.fillStyle(chair).fillCircle(tx - 22, ty, 5).fillCircle(tx + 22, ty, 5).fillCircle(tx, ty - 22, 5).fillCircle(tx, ty + 22, 5);
      }
    }
  }

  // Distributeur, casiers et plantes dans le couloir
  drawCorridorProps() { // fonction qui dessine les objets du couloir
    const g = this.add.graphics(); // g = un pinceau pour dessiner des formes
    // distributeur de boissons dans le renfoncement entre l'amphi et la détente
    g.fillStyle(0xb33a3a).fillRect(598, 66, 36, 58); // le corps rouge du distributeur
    g.fillStyle(0x1d2a3a).fillRect(603, 72, 20, 34); // la vitre sombre
    g.fillStyle(0xf5c84c).fillRect(626, 74, 4, 20); // la fente à pièces jaune
    this.walls.add(this.add.zone(598, 66, 36, 58).setOrigin(0)); // mur invisible : on ne traverse pas le distributeur
    addLight(this, 616, 96, 0x9fd0ff, { scale: 0.35, alpha: 0.4 }).setDepth(800); // petite lumière bleue de la vitre

    // rangée de casiers le long du mur de droite
    for (let y = 300; y < 420; y += 24) { // un casier tous les 24 pixels
      g.fillStyle(0x5b7da0).fillRect(878, y, 22, 22); // la porte bleue du casier
      g.lineStyle(1, 0x3e5a78).strokeRect(878, y, 22, 22); // son contour plus foncé
      g.fillStyle(0xc9ced6).fillRect(881, y + 9, 3, 5); // la poignée grise
    }
    this.walls.add(this.add.zone(878, 300, 22, 120).setOrigin(0)); // mur invisible devant les casiers

    // plantes vertes
    for (const [px, py] of [[115, 268], [885, 625], [545, 292], [220, 450]]) { // pour chaque plante (position x, y)…
      g.fillStyle(0x8a5a35).fillCircle(px, py, 9); // le pot marron
      // 3 ronds verts pour les feuilles
      g.fillStyle(0x3f7d3a).fillCircle(px - 5, py - 4, 8).fillCircle(px + 5, py - 5, 8).fillCircle(px, py - 10, 8);
    }

    // bancs contre le mur de l'amphi et de Callelongue (vus de dessus)
    for (const [bx, by, bw] of [[150, 234, 70], [400, 234, 90], [300, 413, 80]]) { // pour chaque banc (position et longueur)…
      g.fillStyle(0x6e5236).fillRect(bx, by, bw, 12); // la planche du banc
      // deux traits pour les lattes
      g.lineStyle(1, 0x4a3524).lineBetween(bx, by + 4, bx + bw, by + 4).lineBetween(bx, by + 8, bx + bw, by + 8);
      this.walls.add(this.add.zone(bx, by, bw, 12).setOrigin(0)); // mur invisible : on ne traverse pas le banc
    }

    // poubelles (rondes, vues de dessus) et extincteurs rouges au pied des murs
    for (const [tx, ty] of [[640, 282], [225, 300], [440, 418]]) { // pour chaque poubelle…
      g.fillStyle(0x4a525e).fillCircle(tx, ty, 8); // le bord gris
      g.fillStyle(0x2a2f38).fillCircle(tx, ty, 5); // l'intérieur sombre
      g.fillStyle(0xf0ece2).fillCircle(tx - 1, ty - 1, 2); // un petit papier blanc dedans
    }
    for (const [ex, ey] of [[106, 300], [595, 240], [888, 440], [678, 462]]) { // pour chaque extincteur…
      g.fillStyle(0xc0392b).fillCircle(ex, ey, 6); // le rond rouge
      g.fillStyle(0x222222).fillCircle(ex, ey, 2); // le bouchon noir
    }

    // affiches et panneau d'affichage sur les murs des salles
    // pour chaque affiche (position et couleur)…
    for (const [ax, ay, color] of [[260, 296, 0x3b6ea8], [430, 296, 0xc0392b], [270, 466, 0x2e9e5b], [490, 466, 0x8e6bd6], [600, 466, 0xc06a8a]]) {
      g.fillStyle(0xf6f1e6).fillRect(ax, ay, 26, 5); // la feuille blanche
      g.fillStyle(color).fillRect(ax, ay, 8, 5); // une bande de couleur
    }
    g.fillStyle(0xc49a6c).fillRect(330, 296, 70, 5); // panneau de liège
    g.fillStyle(0xf6f1e6).fillRect(338, 296, 10, 4).fillRect(356, 296, 10, 4).fillRect(376, 296, 10, 4); // 3 petites feuilles punaisées

    // fontaine à eau entre Sormiou et le point repas
    g.fillStyle(0xdfe6ea).fillRect(655, 590, 28, 28); // le carré blanc de la fontaine
    g.fillStyle(0x6fb6e0).fillCircle(669, 602, 8); // l'eau bleue
    this.walls.add(this.add.zone(655, 590, 28, 28).setOrigin(0)); // mur invisible : on ne traverse pas la fontaine

    // chariot de ménage du gardien, garé près de son local
    g.fillStyle(0x3a6ea8).fillRect(848, 232, 30, 22); // le chariot bleu
    g.fillStyle(0xe0e0e0).fillCircle(857, 243, 6); // le seau gris
    g.fillStyle(0x8a5a35).fillRect(868, 236, 3, 14); // le manche du balai
    // panneau « sol glissant » (jaune, comme dans tous les couloirs d'école)
    g.fillStyle(0xf5c84c).fillTriangle(760, 330, 772, 352, 748, 352); // triangle jaune du panneau
    g.fillStyle(0x222222).fillRect(759, 338, 2, 8); // le trait noir du point d'exclamation

    // paillasson devant la sortie
    g.fillStyle(0x5a3f2c).fillRect(30, 318, 34, 54); // le tapis marron
    g.lineStyle(1, 0x3e2b1e); // traits plus foncés
    for (let y = 322; y < 370; y += 6) g.lineBetween(32, y, 62, y); // une rayure tous les 6 pixels
  }

  drawExit() { // fonction qui dessine la porte de sortie
    const g = this.add.graphics(); // g = un pinceau pour dessiner des formes
    // porte vitrée
    g.fillStyle(0x9fb7c9).fillRect(EXIT.x - 20, EXIT.y - 36, 12, 72); // la vitre bleu clair
    // le cadre gris et la barre au milieu
    g.lineStyle(2, 0x5f6f7c).strokeRect(EXIT.x - 20, EXIT.y - 36, 12, 72).lineBetween(EXIT.x - 20, EXIT.y, EXIT.x - 8, EXIT.y);
    // panneau vert "sortie de secours"
    // lumière verte autour du panneau
    const glow = addLight(this, EXIT.x + 22, EXIT.y - 62, 0x3dff7a, { scale: 0.5, alpha: 0.45 }).setDepth(800);
    // le panneau vert « SORTIE »
    txt(this, EXIT.x + 22, EXIT.y - 62, '🏃 SORTIE', { size: 13, weight: '800', color: 0xffffff, backgroundColor: hex(0x1f8a4c), padding: { x: 6, y: 3 } })
      .setOrigin(0.5) // accroché au centre
      .setDepth(760); // au premier plan
    this.tweens.add({ targets: [glow], alpha: 0.2, duration: 900, yoyo: true, repeat: -1 }); // la lumière verte clignote sans fin
    // on ajoute la sortie à la liste des choses utilisables
    this.interactables.push({ x: EXIT.x + 10, y: EXIT.y, label: 'Porte de sortie', action: () => this.tryExit() });
  }

  // ---------- Boucle de jeu ----------
  update(_, delta) { // update = fonction lancée à chaque image (environ 60 fois par seconde)
    // figé = on quitte le couloir (entrée dans une salle, fin de partie) : la scène va s'arrêter
    if (this.frozen) return; // si le joueur est bloqué, on ne fait rien
    this.updateMate(delta); // on met à jour le coéquipier
    this.presenceTimer += delta; // on ajoute le temps passé au chrono
    if (this.presenceTimer > 100) { // toutes les 100 millisecondes…
      this.presenceTimer = 0; // on remet le chrono à zéro
      sendPresence({ room: null, x: Math.round(this.player.x), y: Math.round(this.player.y) }); // on envoie notre position au coéquipier
    }
    this.updateGuard(delta); // le gardien bouge même quand une boîte de dialogue est ouverte
    const body = this.player.body; // body = la partie « physique » du joueur
    if (isDialogOpen()) { // si une boîte de dialogue est ouverte…
      body.setVelocity(0); // le joueur s'arrête
      animateWalk(this.player, 'player', 0, 0); // il reste immobile (pas d'animation de marche)
      return; // et on s'arrête là
    }

    const k = this.keys; // k = les touches du clavier
    // direction gauche/droite : +1 droite, -1 gauche, 0 rien
    let vx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.Q.isDown ? 1 : 0);
    let vy = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.Z.isDown ? 1 : 0); // direction haut/bas : +1 bas, -1 haut, 0 rien

    if (this.stick && (this.stick.vx || this.stick.vy)) { // si on utilise le joystick…
      vx = this.stick.vx; // on prend sa direction gauche/droite
      vy = this.stick.vy; // on prend sa direction haut/bas
    }

    if (vx || vy) { // si on bouge au clavier ou au joystick…
      this.target = null; // on oublie la destination du clic
    } else if (this.target) { // sinon, si on a cliqué quelque part…
      const dx = this.target.x - this.player.x; // écart horizontal jusqu'à la destination
      const dy = this.target.y - this.player.y; // écart vertical jusqu'à la destination
      if (Math.hypot(dx, dy) < 6) this.target = null; // arrivé (moins de 6 px) : plus de destination
      else [vx, vy] = [dx, dy]; // sinon on avance vers elle
    }

    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(PLAYER_SPEED); // vitesse finale : la direction, à la bonne vitesse
    body.setVelocity(v.x, v.y); // on donne cette vitesse au joueur
    animateWalk(this.player, 'player', v.x, v.y); // on anime sa marche
    this.player.setDepth(this.player.y); // plus il est bas, plus il passe devant les objets
    // bruit de pas, un pied après l'autre
    if (vx || vy) { // si le joueur bouge…
      this.stepTimer += delta; // on ajoute le temps passé au chrono des pas
      if (this.stepTimer > 260) { // toutes les 260 millisecondes…
        this.stepTimer = 0; // on remet le chrono à zéro
        this.stepLeft = !this.stepLeft; // on change de pied
        sfx.step(this.stepLeft); // on joue le bruit de pas
      }
    }
    this.playerLight.setPosition(this.player.x, this.player.y + 8); // la lumière suit le joueur

    this.updatePrompt(); // on regarde s'il y a une porte proche
  }

  updatePrompt() { // fonction qui affiche l'étiquette près d'une porte
    this.nearby = this.interactables.find( // on cherche une chose utilisable assez proche du joueur
      // test : distance plus petite que la limite
      (it) => Phaser.Math.Distance.Between(it.x, it.y, this.player.x, this.player.y) < INTERACT_RADIUS,
    );
    if (this.nearby) { // s'il y en a une…
      // on écrit l'étiquette (👆 sur tactile, E sur clavier)
      this.prompt.setText(`${this.stick ? '👆' : 'E —'} ${this.nearby.label}`).setVisible(true);
      // on garde l'étiquette dans l'écran (la porte de sortie est collée au bord)
      // on calcule une position qui ne sort pas de l'écran
      const x = Phaser.Math.Clamp(this.nearby.x + 10, this.prompt.width / 2 + 4, WORLD.width - this.prompt.width / 2 - 4);
      this.prompt.setPosition(x, this.nearby.y - 38); // on place l'étiquette au-dessus de la porte
    } else { // sinon…
      this.prompt.setVisible(false); // on cache l'étiquette
    }
  }

  interact() { // fonction pour utiliser la chose proche
    if (isDialogOpen() || !this.nearby) return; // si un dialogue est ouvert ou rien de proche, on ne fait rien
    this.nearby.action(); // on lance l'action de la chose (ex : entrer)
  }

  enterRoom(room) { // fonction pour entrer dans une salle
    state.data.playerPos = { x: this.player.x, y: this.player.y }; // on retient où est le joueur dans le couloir
    state.save(); // on sauvegarde la partie
    this.freeze(); // on bloque le joueur
    sfx.doorOpen(); // bruit de porte qui s'ouvre
    this.cameras.main.fadeOut(220, 0, 0, 0); // l'écran devient noir doucement
    // une fois tout noir, on lance l'écran de la salle
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Room', { roomKey: room.key }));
  }

  visitDetente() { // fonction quand on va dans la salle de détente
    // Bonus : le carnet du gardien, oublié sous un coussin, rend le prochain indice gratuit
    if (!state.hasItem('carnet-gardien')) { // si on n'a pas encore le carnet du gardien…
      state.gainFreeHint(); // on gagne un indice gratuit
      state.addItem('carnet-gardien'); // on ajoute le carnet à nos objets
      openDialog({ // on ouvre une boîte de dialogue
        title: 'Salle de détente', // titre de la boîte
        // texte de la boîte (en HTML)
        body: '<p>Le canapé te fait de l\'œil… Pas le moment de se rendormir.</p><p>Sous un coussin, tu trouves un vieux carnet plein de notes sur l\'école : <strong>ton prochain indice sera gratuit</strong>.</p>',
      });
      return; // et on s'arrête là
    }
    openDialog({ // sinon, on ouvre une boîte de dialogue
      title: 'Salle de détente', // titre de la boîte
      body: '<p>Le canapé te fait de l\'œil… Pas le moment de se rendormir.</p>', // texte de la boîte (en HTML)
    });
  }

  /** Pavé numérique de la porte : on clique les chiffres, A pour valider, B pour abandonner. */
  exitKeypad() { // fonction qui affiche le pavé à code de la sortie
    let code = ''; // code = les chiffres tapés (vide au début)
    const wrap = document.createElement('div'); // on crée un bloc HTML pour tout le contenu
    wrap.innerHTML = '<p>Un boîtier à 4 chiffres. Un voyant rouge clignote.</p>'; // on y met une phrase d'explication
    const screen = document.createElement('div'); // on crée l'écran du pavé
    screen.className = 'keypad-screen'; // on lui donne son style (classe CSS = style de la page)
    screen.setAttribute('aria-live', 'polite'); // un lecteur d'écran lira les changements (accessibilité)
    const pad = document.createElement('div'); // on crée la zone des boutons
    pad.className = 'keypad'; // on lui donne son style
    wrap.append(screen, pad); // on met l'écran et les boutons dans le bloc
    // fonction qui affiche le code, avec _ pour les cases vides
    const show = () => (screen.textContent = code.padEnd(4, '_').split('').join(' '));
    show(); // on affiche le code une première fois

    // on ouvre la boîte de dialogue, sans croix pour fermer
    const ui = openDialog({ title: 'Porte de sortie', body: wrap, closable: false });
    const press = (k) => { // fonction lancée quand on appuie sur une touche k
      if (k === 'B') { // touche B…
        ui.close(); // … on ferme le pavé
        return; // et on s'arrête là
      }
      if (k === 'A') { // touche A (valider)…
        if (code === EXIT_CODE) { // si le code est bon…
          sfx.success(); // son de réussite
          endGame(this, true, 'escaped'); // on termine la partie : gagné, on s'est évadé
          return; // et on s'arrête là
        }
        state.penalize(); // mauvais code : on perd du temps
        this.cameras.main.shake(250, 0.01); // l'écran tremble
        ui.feedback(`BIP ! Code refusé. +${PENALTY_ERROR} min.`); // message d'erreur avec la pénalité
        code = ''; // on efface le code tapé
        show(); // on met à jour l'écran du pavé
        return; // et on s'arrête là
      }
      if (code.length >= 4) return; // déjà 4 chiffres : on ignore la touche
      sfx.beep(code.length); // petit bip
      code += k; // on ajoute le chiffre au code
      show(); // on met à jour l'écran du pavé
    };
    for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'B', '0', 'A']) { // pour chaque touche du pavé…
      const b = document.createElement('button'); // on crée un bouton
      b.type = 'button'; // bouton simple (n'envoie pas de formulaire)
      b.textContent = k; // on écrit la touche dessus
      if (k === 'A') b.className = 'ok'; // style spécial pour A (valider)
      if (k === 'B') b.className = 'cancel'; // style spécial pour B (quitter)
      b.setAttribute('aria-label', k === 'A' ? 'A : valider' : k === 'B' ? 'B : quitter' : k); // nom lu par les lecteurs d'écran
      b.addEventListener('click', () => press(k)); // cliquer le bouton = appuyer sur la touche
      pad.appendChild(b); // on ajoute le bouton au pavé
    }
    pad.insertAdjacentHTML('afterend', '<p><em>A : valider · B : quitter</em></p>'); // on ajoute une phrase d'aide sous le pavé
  }

  tryExit() { // fonction quand on essaie la porte de sortie
    // À 2 : la porte de secours ne s'ouvre qu'avec les deux élèves devant
    const m = net.mate; // m = les infos sur le coéquipier
    // à 2 : si le coéquipier est dans une salle ou trop loin…
    if (net.online && (m.room || Phaser.Math.Distance.Between(m.x, m.y, EXIT.x, EXIT.y) > EXIT_TEAM_RADIUS)) {
      openDialog({ // on ouvre une boîte de dialogue
        title: 'Porte de sortie', // titre de la boîte
        // texte de la boîte (en HTML, avec le nom du coéquipier)
        body: `<p>La barre anti-panique est bloquée : il faut que l'un tape le code pendant que l'autre pousse la porte.</p><p><strong>Attends que ${esc(m.name)} te rejoigne devant la sortie.</strong></p>`,
      });
      return; // et on s'arrête là
    }
    this.exitKeypad(); // sinon, on affiche le pavé à code
  }

  // ---------- Le gardien (rondes lancées quand le courant revient) ----------
  spawnGuard() { // fonction qui fait apparaître le gardien
    if (this.guard) return; // s'il est déjà là, on ne fait rien
    const p = guardPosition(); // p = la position actuelle du gardien
    // halo de la lampe torche + zone de repérage visible : y entrer, c'est perdu
    // la lumière de sa lampe torche
    this.torch = addLight(this, p.x, p.y, 0xfff1c0, { scale: (GUARD_SIGHT * 2.6) / 256, alpha: 0.7 }).setDepth(800);
    // le rond qui montre jusqu'où il voit
    this.beam = this.add.circle(p.x, p.y, GUARD_SIGHT, 0xfff1c0, 0.1).setStrokeStyle(2, 0xfff1c0, 0.35).setDepth(799);
    // dessiné au-dessus de sa lampe (profondeur 800) pour ne pas être délavé par la lumière
    this.guard = this.add.sprite(p.x, p.y, 'guard', 'down0').setDepth(810); // le personnage du gardien
  }

  /** Petit message en haut du couloir qui disparaît tout seul (n'interrompt pas le jeu). */
  toast(message) { // fonction qui affiche un petit message (message = le texte)
    this.toastText?.destroy(); // on efface l'ancien message s'il y en a un
    const t = txt(this, WORLD.width / 2, WORLD.y + 18, message, { // on crée le texte en haut du couloir
      size: 15, weight: '800', color: 0xffffff, backgroundColor: hex(C.red), padding: { x: 12, y: 6 }, // texte blanc, gras, sur fond rouge
    }).setOrigin(0.5, 0).setDepth(1001); // accroché en haut au milieu, au premier plan
    this.toastText = t; // on retient ce message
    // il devient transparent après 2,8 s puis est supprimé
    this.tweens.add({ targets: t, alpha: 0, delay: 2800, duration: 500, onComplete: () => t.destroy() });
  }

  despawnGuard() { // fonction qui fait disparaître le gardien
    this.guard?.destroy(); // on supprime le gardien s'il existe
    this.torch?.destroy(); // on supprime sa lampe
    this.beam?.destroy(); // on supprime le rond de vue
    this.guard = this.torch = this.beam = null; // on vide les trois variables
  }

  updateGuard(delta) { // fonction qui fait bouger le gardien à chaque image
    if (!this.guard) return; // pas de gardien : on ne fait rien
    const p = guardPosition(); // p = la nouvelle position du gardien
    const moving = p.x !== this.guard.x || p.y !== this.guard.y; // vrai si sa position a changé
    const dist = Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y); // distance entre le gardien et le joueur
    if (moving) this.guardSounds(delta, dist); // s'il marche, on joue ses bruits
    // vitesse en px/s, comme pour le joueur : le déplacement d'une seule image (~1 px) est trop petit
    // et ferait croire à animateWalk que le gardien est immobile
    const perSec = 1000 / delta; // nombre d'images par seconde
    animateWalk(this.guard, 'guard', (p.x - this.guard.x) * perSec, (p.y - this.guard.y) * perSec); // on anime sa marche selon sa vitesse
    this.guard.setPosition(p.x, p.y); // on déplace le gardien
    this.torch.setPosition(p.x, p.y); // sa lampe le suit
    this.beam.setPosition(p.x, p.y); // son rond de vue le suit
    const close = dist < GUARD_SIGHT; // vrai si le joueur est trop près
    // trop près, ronde déjà lancée et fin du délai : attrapé !
    if (close && !patrolJustStarted() && this.time.now > this.graceUntil) this.caught();
  }

  /** Pas du gardien (plus forts quand il est près) et cœur qui s'emballe quand il approche. */
  guardSounds(delta, dist) { // fonction qui joue les bruits du gardien
    this.guardStepTimer += delta; // on ajoute le temps passé au chrono de ses pas
    if (this.guardStepTimer > 480) { // toutes les 480 millisecondes…
      this.guardStepTimer = 0; // on remet le chrono à zéro
      sfx.guardStep(Phaser.Math.Clamp(1 - dist / 650, 0.08, 1) ** 1.5); // bruit de pas, plus fort quand il est proche
    }
    const danger = GUARD_SIGHT * 2.5; // distance de danger : 2,5 fois sa vue
    if (dist < danger) { // s'il est dans la zone de danger…
      this.heartTimer += delta; // on ajoute le temps au chrono du cœur
      if (this.heartTimer > 380 + (dist / danger) * 500) { // plus il est proche, plus le cœur bat vite
        this.heartTimer = 0; // on remet le chrono à zéro
        sfx.heartbeat(1 - dist / danger / 2); // bruit de battement de cœur
      }
    }
  }

  freeze() { // fonction qui bloque le joueur
    this.frozen = true; // on note que le joueur est bloqué
    this.target = null; // on oublie la destination du clic
    this.player.body.setVelocity(0); // le joueur s'arrête
    animateWalk(this.player, 'player', 0, 0); // il reste immobile
  }

  caught() { // fonction quand le gardien nous attrape
    // Repéré : game over
    this.freeze(); // on bloque le joueur
    sfx.caught(); // son « attrapé »
    state.set('guardChoice', 'caught'); // on note dans la partie qu'on a été attrapé
    this.cameras.main.flash(400, 255, 240, 200); // l'écran clignote en blanc
    this.time.delayedCall(700, () => endGame(this, false, 'caught')); // après 0,7 s, on termine la partie : perdu
  }
}
