import Phaser from 'phaser'; // on charge Phaser, l'outil qui fait marcher le jeu
import { state } from '../state/GameState.js'; // on récupère l'état du jeu (salle, objets, sauvegarde…)
import { isDialogOpen, openDialog } from '../ui/dialog.js'; // outils pour savoir si une boîte est ouverte, et en ouvrir une
import { ROOMS } from '../rooms/index.js'; // la liste de toutes les salles et leurs énigmes
import { ROOM_BLOCKS } from '../data/hubLayout.js'; // la position des salles dans le couloir
import { drawFurniture } from '../art/furniture.js'; // outil pour dessiner les meubles
import { drawDecor } from '../art/decor.js'; // outil pour dessiner le décor
// on récupère couleurs, police et outils de dessin et de lumière
import { C, FONT_TITLE, hex, txt, addLight, nightOverlay } from '../ui/theme.js';
import { isPatrolActive, guardPosition } from '../state/patrol.js'; // outils pour savoir où est le gardien
import { FLASH_RADIUS } from '../config.js'; // la taille du rond de lumière du téléphone
import { sfx, setAmbience } from '../audio/sound.js'; // on récupère les bruitages et la musique de fond
import { net, ROLES, sendPresence, canUse, roleRefusal } from '../net/multiplayer.js'; // on récupère les outils du mode à 2 joueurs
import { isTouch } from '../ui/touch.js'; // outil qui détecte un écran tactile

const NUMBER_KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE']; // noms des touches 1 à 9 du clavier
const WALL_TOP = 130; // haut du mur (au-dessus : bandeau titre)
const FLOOR_Y = 400; // début du sol

// Le gardien vu depuis une salle : on l'entend d'autant plus fort qu'il est près de la porte
const GUARD_NEAR = 200; // px dans le couloir : juste devant la porte
const GUARD_HEARD = 700; // au-delà, on l'entend à peine
const GUARD_LEVELS = [ // les 3 messages possibles selon la distance du gardien
  { max: GUARD_NEAR, text: '⚠️ Le gardien est juste devant la porte ! Ne sors pas !', color: C.red }, // très proche : alerte rouge
  { max: 400, text: '👣 Le gardien se rapproche de la porte…', color: 0xd9822b }, // moyen : alerte orange
  { max: Infinity, text: '👣 Le gardien rôde, loin d\'ici', color: 0x4a5a7a }, // loin : message bleu calme
];

// Une scène générique : elle affiche la salle décrite dans src/rooms/<salle>.js, vue de face.
export class RoomScene extends Phaser.Scene { // on crée la scène d'une salle (scène = un écran du jeu)
  constructor() { // fonction lancée quand on fabrique la scène
    super('Room'); // on donne le nom « Room » à cette scène
  }

  init(data) { // init() se lance en premier, avec le nom de la salle à ouvrir
    this.def = ROOMS[data.roomKey]; // on récupère la description de la salle
    this.leaving = false; // la même instance de scène est réutilisée à chaque visite
    this.darkness = null; // pas de noir pour l'instant
    this.tickTimer = this.stepTimer = 0; // on remet les deux compteurs de sons à zéro
    this.tock = false; // tic ou tac de l'horloge : on commence par « tic »
    this.presenceTimer = 0; // compteur pour envoyer notre position au coéquipier
    const block = ROOM_BLOCKS.find((r) => r.key === data.roomKey); // on cherche cette salle dans le plan du couloir
    this.accent = block?.accent ?? C.blue; // couleur de la salle (bleu si rien n'est prévu)
    this.door = block?.door; // la porte de la salle, côté couloir
    this.guardLevel = null; // on ne sait pas encore où est le gardien
    this.heartTimer = 0; // compteur pour les battements de cœur
  }

  create() { // create() dessine la salle quand elle s'ouvre
    const def = this.def; // raccourci vers la description de la salle
    state.data.currentRoom = def.key; // on note qu'on est dans cette salle
    state.save(); // on sauvegarde
    this.cameras.main.fadeIn(250, 0, 0, 0); // l'écran apparaît doucement depuis le noir
    sfx.doorClose(); // la porte se referme derrière l'élève

    this.drawRoomShell(); // on dessine les murs, le sol et l'horloge

    // on écrit le nom de la salle en haut
    txt(this, 24, 56, def.name, { size: 30, font: FONT_TITLE, color: 0xffffff, shadow: true }).setDepth(750);
    // on écrit le petit texte d'arrivée
    txt(this, 26, 98, def.intro, { size: 16, color: 0xe8e0d0, wordWrap: { width: 620 } }).setDepth(750);
    // étiquette du domaine (verte avec ✓ quand l'énigme est résolue)
    const solved = state.data.solved[def.key]; // est-ce que l'énigme de cette salle est déjà résolue ?
    // on écrit le domaine (avec « résolu » si c'est fait)
    txt(this, this.scale.width - 24, 62, solved ? `✓ ${def.domain} — résolu` : def.domain, {
      // taille, couleurs (vert si résolu) et marges
      size: 14, weight: '800', color: 0xffffff, backgroundColor: hex(solved ? C.green : this.accent), padding: { x: 10, y: 4 },
    }).setOrigin(1, 0).setDepth(750); // on le colle à droite, devant le reste

    // le décor d'abord (fenêtres, étagères, chaises…), les objets des énigmes par-dessus
    for (const item of def.decor || []) this.drawDecorItem(item); // on dessine chaque élément de décor
    def.objects.forEach((obj, i) => this.drawObject(obj, i)); // on dessine chaque objet de l'énigme, numéroté

    // Décor spécifique à la salle (ex. les post-it de Sormiou)
    def.draw?.(this); // si la salle a un dessin en plus, on le fait

    // L'élève, de dos, qui regarde la salle, avec la lumière de son téléphone
    this.add.sprite(620, 588, 'player', 'up0').setScale(1.25).setDepth(600); // on affiche l'élève vu de dos, devant tout
    // à 2 : le coéquipier apparaît à côté quand il est dans la même salle
    // on prépare le coéquipier, caché pour l'instant
    this.mate = this.add.sprite(330, 588, 'mate', 'up0').setScale(1.25).setDepth(600).setVisible(false);
    // étiquette avec le nom du coéquipier, au-dessus de sa tête
    this.mateTag = txt(this, 330, 545, '', { size: 12, weight: '800', color: 0xffffff, backgroundColor: hex(0x3f8f5a), padding: { x: 5, y: 1 } })
      .setOrigin(0.5, 1) // on la centre au-dessus du coéquipier
      .setDepth(870) // on la met devant presque tout
      .setVisible(false); // cachée pour l'instant

    // Tant que la lumière n'est pas allumée (boîtier de Mont Ventoux), la salle est noire
    if (state.hasItem('lumiere')) this.lightRoom(); // si la lumière est allumée, on éclaire la salle
    else this.makeDarkness(); // sinon la salle reste dans le noir

    // bouton pour revenir au couloir (sur ordinateur on rappelle Échap)
    const back = txt(this, this.scale.width - 20, this.scale.height - 18, isTouch() ? '← couloir' : '← Échap · couloir', {
      // taille, couleurs et marges du bouton
      size: 15, weight: '800', color: C.ink, backgroundColor: hex(C.paper), padding: { x: 12, y: 7 },
    })
      .setOrigin(1, 1) // on le colle en bas à droite
      .setDepth(900) // on le met tout devant
      .setInteractive({ useHandCursor: true }); // on le rend cliquable (curseur en forme de main)
    back.on('pointerdown', () => this.leave()); // clic sur le bouton = sortir de la salle
    this.input.keyboard.on('keydown-ESC', () => this.leave()); // touche Échap = sortir de la salle

    // Le gardien continue sa ronde pendant qu'on est dans la salle : on l'entend passer
    // (dans l'en-tête : en bas de l'écran, il cacherait des indices comme les post-it de Sormiou)
    this.footsteps = txt(this, this.scale.width - 24, 96, '', { // bandeau rouge qui dit où est le gardien
      // taille, couleurs et marges du bandeau
      size: 14, weight: '800', color: 0xffffff, backgroundColor: hex(C.red), padding: { x: 10, y: 4 },
    })
      .setOrigin(1, 0) // on le colle à droite
      .setDepth(900) // on le met tout devant
      .setVisible(isPatrolActive()); // visible seulement si le gardien fait sa ronde
    // le bandeau clignote doucement, sans fin
    this.tweens.add({ targets: this.footsteps, alpha: 0.45, duration: 600, yoyo: true, repeat: -1 });
    // (même place : le gardien ne fait pas encore ses rondes tant qu'il fait noir)
    // bandeau jaune qui explique le flash du téléphone
    this.phoneTag = txt(this, this.scale.width - 24, 96, '📱 Ton flash suit la souris', {
      // taille, couleurs et marges du bandeau
      size: 14, weight: '800', color: C.ink, backgroundColor: hex(C.yellow), padding: { x: 10, y: 4 },
    })
      .setOrigin(1, 0) // on le colle à droite
      .setDepth(900) // on le met tout devant
      .setVisible(!!this.darkness); // visible seulement si la salle est dans le noir

    if (!this.scene.isActive('UI')) this.scene.launch('UI'); // si la barre du haut n'est pas lancée, on la lance
    this.scene.bringToTop('UI'); // on met la barre du haut au premier plan
  }

  update(_, delta) { // update() tourne en boucle ; delta = temps écoulé depuis la dernière fois
    this.updateGuardWarning(); // on met à jour le bandeau du gardien
    this.updateMate(delta); // on met à jour le coéquipier
    if (!this.scene.get('UI').paused) this.roomSounds(delta); // si le jeu n'est pas en pause, on joue les sons de la salle
    if (!this.darkness) return; // salle déjà éclairée ? on s'arrête là
    if (state.hasItem('lumiere')) { // si la lumière vient d'être allumée…
      this.lightsOn(); // …on allume la salle
      return; // …et on s'arrête là
    }
    // le noir est redessiné à chaque image, troué là où pointe le flash
    const d = this.darkness; // raccourci vers le voile noir
    // on remplit de noir puis on fait un trou rond au flash
    d.clear().fill(0x05060c, 0.97).erase(this.flashBrush, this.flashPos.x, this.flashPos.y - d.y);
    this.flashGlow.setPosition(this.flashPos.x, this.flashPos.y); // la lueur du flash suit aussi
    // à 2 dans la même salle : le flash du coéquipier éclaire aussi
    const mf = this.mateHere() && net.mate.flash; // le flash du coéquipier, s'il est dans la même salle
    if (mf) d.erase(this.flashBrush, mf.x, mf.y - d.y); // si oui, on fait aussi un trou à cet endroit
    this.mateGlow.setVisible(!!mf); // on montre sa lueur seulement s'il est là
    if (mf) this.mateGlow.setPosition(mf.x, mf.y); // on place sa lueur sur son flash
  }

  mateHere() { // dit si le coéquipier est dans la même salle que nous
    return net.online && net.mate?.room === this.def.key; // vrai si on joue à 2 et qu'il est dans cette salle
  }

  /** Envoie ma salle (et mon flash) au coéquipier ; affiche le sien s'il est là. */
  updateMate(delta) { // envoie et affiche la position du coéquipier
    this.presenceTimer += delta; // on ajoute le temps écoulé au compteur
    if (this.presenceTimer > 100) { // toutes les 100 millisecondes…
      this.presenceTimer = 0; // …on remet le compteur à zéro
      const f = this.darkness && this.flashPos; // la position de notre flash, s'il fait noir
      // on envoie au coéquipier notre salle et notre flash (arrondi)
      sendPresence({ room: this.def.key, flash: f ? { x: Math.round(f.x), y: Math.round(f.y) } : null });
    }
    const here = this.mateHere(); // le coéquipier est-il ici ?
    this.mate.setVisible(here); // on montre ou cache le coéquipier
    this.mateTag.setVisible(here); // on montre ou cache son étiquette
    if (here) this.mateTag.setText(`${ROLES[net.mate.role].icon} ${net.mate.name}`); // on écrit son rôle et son nom sur l'étiquette
  }

  /** Distance (dans le couloir) entre le gardien et la porte de cette salle ; null s'il n'est pas de ronde. */
  guardDistance() { // calcule la distance entre le gardien et la porte
    if (!isPatrolActive() || !this.door) return null; // pas de ronde ou pas de porte ? pas de distance
    const p = guardPosition(); // position du gardien dans le couloir
    return Math.hypot(p.x - this.door.x, p.y - this.door.y); // on calcule la distance (comme une règle entre deux points)
  }

  /** Bandeau qui change selon que le gardien est loin, approche ou est devant la porte. */
  updateGuardWarning() { // choisit le bon message selon la distance du gardien
    const d = this.guardDistance(); // distance du gardien
    const level = d === null ? null : GUARD_LEVELS.findIndex((l) => d < l.max); // numéro du message qui correspond à cette distance
    this.footsteps.setVisible(level !== null); // on montre le bandeau seulement s'il y a un message
    if (level === this.guardLevel) return; // même message qu'avant ? rien à changer
    this.guardLevel = level; // on retient le nouveau message
    if (level === null) return; // pas de message ? on s'arrête là
    const l = GUARD_LEVELS[level]; // le message choisi
    this.footsteps.setText(l.text).setBackgroundColor(hex(l.color)); // on change le texte et la couleur du bandeau
  }

  /** Tic-tac de l'horloge murale, et pas étouffés du gardien : plus forts et plus rapprochés quand il approche. */
  roomSounds(delta) { // joue les sons de la salle
    this.tickTimer += delta; // on ajoute le temps écoulé au compteur de l'horloge
    if (this.tickTimer > 1000) { // toutes les secondes (1000 millisecondes)…
      this.tickTimer = 0; // …on remet le compteur à zéro
      this.tock = !this.tock; // on alterne entre tic et tac
      sfx.tick(this.tock); // on joue le tic ou le tac
    }
    const d = this.guardDistance(); // distance du gardien
    if (d === null) return; // pas de gardien ? pas de bruit de pas
    const near = Phaser.Math.Clamp(1 - d / GUARD_HEARD, 0, 1); // 0 = loin, 1 = contre la porte
    this.stepTimer += delta; // on ajoute le temps écoulé au compteur des pas
    if (this.stepTimer > 620 - near * 200) { // les pas sont plus rapprochés quand il est près
      this.stepTimer = 0; // on remet le compteur à zéro
      sfx.guardStep(0.05 + 0.85 * near ** 1.5, true); // bruit de pas, plus fort quand il est près
    }
    // juste devant la porte : le cœur s'emballe
    if (d < GUARD_NEAR) { // si le gardien est tout près de la porte…
      this.heartTimer += delta; // on ajoute le temps au compteur du cœur
      if (this.heartTimer > 450) { // toutes les 450 millisecondes…
        this.heartTimer = 0; // …on remet le compteur à zéro
        sfx.heartbeat(0.8); // …bruit de battement de cœur
      }
    }
  }

  // ---------- Lumière ----------
  lightRoom() { // allume la salle
    setAmbience('lit'); // on lance l'ambiance sonore « éclairée »
    nightOverlay(this, 0.22); // léger voile de nuit sur toute la salle
    addLight(this, 620, 560, 0xffe9b0, { scale: 1.6, alpha: 0.28 }).setDepth(800); // une lumière jaune douce au-dessus de l'élève
  }

  /** Voile noir sous le bandeau titre ; le flash du téléphone suit la souris (ou le doigt). */
  makeDarkness() {
    setAmbience('dark'); // on lance l'ambiance sonore « sombre »
    const { width, height } = this.scale; // on récupère la largeur et la hauteur de l'écran
    // on crée une grande image noire qui couvre la salle (sous le titre)
    this.darkness = this.add.renderTexture(0, WALL_TOP - 4, width, height - WALL_TOP + 4).setOrigin(0).setDepth(850);
    // forme ronde qui sert à « trouer » le noir
    this.flashBrush = this.make.image({ key: 'flash' }, false).setScale((FLASH_RADIUS * 2) / 256);
    // lueur jaune autour du flash
    this.flashGlow = addLight(this, 0, 0, 0xfff4d6, { scale: (FLASH_RADIUS * 2) / 256, alpha: 0.1 }).setDepth(860);
    // lueur verte pour le flash du coéquipier, cachée au début
    this.mateGlow = addLight(this, 0, 0, 0xd6fff0, { scale: (FLASH_RADIUS * 2) / 256, alpha: 0.1 }).setDepth(860).setVisible(false);
    this.flashPos = { x: width / 2, y: 330 }; // le flash commence au milieu de l'écran
    this.input.on('pointermove', (p) => (this.flashPos = { x: p.x, y: p.y })); // quand la souris bouge, le flash la suit
    this.input.on('pointerdown', (p) => (this.flashPos = { x: p.x, y: p.y })); // quand on touche l'écran, le flash va là
  }

  /** Le courant revient pendant qu'on est dans la salle : le noir se dissipe. */
  lightsOn() { // allume la salle quand le courant revient
    const { darkness, flashGlow, mateGlow } = this; // on garde le noir et les lueurs de côté
    this.darkness = null; // il n'y a plus de noir
    this.phoneTag.setVisible(false); // on cache le bandeau du flash
    this.cameras.main.flash(300, 255, 250, 220); // l'écran clignote en blanc
    this.lightRoom(); // on allume la salle
    this.tweens.add({ // on lance une animation :
      targets: [darkness, flashGlow, mateGlow], // sur le noir et les deux lueurs
      alpha: 0, // ils deviennent transparents
      duration: 600, // en 600 millisecondes
      onComplete: () => { // quand c'est fini :
        darkness.destroy(); // on supprime le noir
        flashGlow.destroy(); // on supprime la lueur du flash
        mateGlow.destroy(); // on supprime la lueur du coéquipier
      },
    });
  }

  // Bandeau du haut, mur, soubassement, sol carrelé, horloge murale
  drawRoomShell() { // dessine les murs, le sol et l'horloge
    const { width, height } = this.scale; // on récupère la largeur et la hauteur de l'écran
    const g = this.add.graphics(); // on prépare un pinceau pour dessiner
    g.fillStyle(0x3a2f28).fillRect(0, 48, width, WALL_TOP - 48); // bandeau du titre en marron foncé
    g.fillStyle(this.accent).fillRect(0, WALL_TOP - 4, width, 4); // trait de la couleur de la salle sous le titre
    g.fillStyle(C.wall).fillRect(0, WALL_TOP, width, FLOOR_Y - WALL_TOP); // on peint le mur
    g.fillStyle(C.wainscot).fillRect(0, FLOOR_Y - 70, width, 70); // on peint le bas du mur
    g.fillStyle(0x6a8a76).fillRect(0, FLOOR_Y - 74, width, 6); // petite bande verte au-dessus du bas du mur
    const T = 40; // taille d'un carreau du sol : 40 pixels
    for (let y = FLOOR_Y; y < height; y += T) { // pour chaque rangée de carreaux…
      // …on peint les carreaux en damier (2 couleurs)
      for (let x = 0; x < width; x += T) g.fillStyle(((x + y) / T) % 2 ? C.floorA : C.floorB).fillRect(x, y, T, T);
    }
    g.fillStyle(0x000000, 0.18).fillRect(0, FLOOR_Y, width, 8); // ombre au pied du mur

    // horloge murale réglée sur l'heure du jeu
    const cx = 905; // position horizontale du centre de l'horloge
    const cy = 172; // position verticale du centre
    g.fillStyle(0xffffff).fillCircle(cx, cy, 22); // on dessine le cadran blanc
    g.lineStyle(3, C.ink).strokeCircle(cx, cy, 22); // on dessine le bord
    const m = state.data.minutes; // l'heure du jeu, en minutes
    const hourA = ((m / 60) % 12) * (Math.PI / 6) - Math.PI / 2; // angle de la petite aiguille (les heures)
    const minA = (m % 60) * (Math.PI / 30) - Math.PI / 2; // angle de la grande aiguille (les minutes)
    g.lineStyle(3, C.ink).lineBetween(cx, cy, cx + Math.cos(hourA) * 11, cy + Math.sin(hourA) * 11); // on trace la petite aiguille
    g.lineStyle(2, C.red).lineBetween(cx, cy, cx + Math.cos(minA) * 17, cy + Math.sin(minA) * 17); // on trace la grande aiguille, en rouge
  }

  drawDecorItem(item) { // dessine un élément de décor
    drawDecor(this.add.graphics(), item); // on dessine l'élément
    // s'il a un texte, on l'écrit en blanc en haut de l'élément
    if (item.text) txt(this, item.x + item.w / 2, item.y + item.h * 0.15, item.text, { size: 13, weight: '800', color: 0xffffff }).setOrigin(0.5);
  }

  // Un objet = un meuble dessiné + une étiquette en papier ; surbrillance jaune au survol
  drawObject(obj, i) { // dessine un objet de l'énigme (i = son numéro)
    const x = obj.x - obj.w / 2; // bord gauche de l'objet
    const y = obj.y - obj.h / 2; // bord du haut de l'objet
    drawFurniture(this.add.graphics(), obj.type, x, y, obj.w, obj.h); // on dessine le meuble

    const highlight = this.add.graphics().setDepth(740).setVisible(false); // cadre jaune autour de l'objet, caché au début
    // on trace le cadre jaune aux coins arrondis
    highlight.lineStyle(3, C.yellow, 1).strokeRoundedRect(x - 8, y - 8, obj.w + 16, obj.h + 16, 8);
    this.tweens.add({ targets: highlight, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 }); // le cadre clignote doucement, sans fin

    // à 2 : l'icône du rôle qui peut utiliser l'objet (🔧 technicien, 🔍 enquêteur)
    const role = net.online && obj.role ? ` ${ROLES[obj.role].icon}` : ''; // à 2 : l'icône du rôle qui peut l'utiliser, sinon rien
    const label = txt(this, obj.x, y + obj.h + 18, `${i + 1} · ${obj.label}${role}`, { // étiquette avec le numéro et le nom de l'objet
      // taille, couleurs et marges de l'étiquette
      size: 14, weight: '800', color: C.ink, backgroundColor: hex(C.paper), padding: { x: 8, y: 3 },
    })
      .setOrigin(0.5) // on la centre
      .setDepth(750) // on la met devant
      .setAngle(i % 2 ? 1.5 : -1.5); // on la penche un peu, une sur deux dans l'autre sens

    const zone = this.add.zone(obj.x, obj.y, obj.w, obj.h).setInteractive({ useHandCursor: true }); // zone cliquable invisible sur l'objet
    for (const target of [zone, label.setInteractive({ useHandCursor: true })]) { // pour la zone et pour l'étiquette :
      target.on('pointerover', () => { // quand la souris passe dessus :
        highlight.setVisible(true); // on montre le cadre jaune
        label.setBackgroundColor(hex(C.yellow)); // l'étiquette devient jaune
      });
      target.on('pointerout', () => { // quand la souris s'en va :
        highlight.setVisible(false); // on cache le cadre jaune
        label.setBackgroundColor(hex(C.paper)); // l'étiquette redevient papier
      });
      target.on('pointerdown', () => this.use(obj)); // clic = utiliser l'objet
    }
    // la touche avec son numéro utilise aussi l'objet
    if (NUMBER_KEYS[i]) this.input.keyboard.on(`keydown-${NUMBER_KEYS[i]}`, () => this.use(obj));
  }

  use(obj) { // quand le joueur utilise un objet
    if (isDialogOpen()) return; // une boîte est déjà ouverte ? on ne fait rien
    if (!canUse(obj.role)) { // si notre rôle n'a pas le droit d'utiliser cet objet…
      // …on affiche une boîte qui explique pourquoi
      openDialog({ title: `${obj.label} — ${ROLES[obj.role].icon} ${ROLES[obj.role].name}`, body: roleRefusal(obj.role) });
      return; // on s'arrête là
    }
    obj.onUse(this); // on lance l'action propre à cet objet
  }

  leave() { // sortir de la salle
    if (isDialogOpen() || this.leaving) return; // boîte ouverte ou déjà en train de sortir ? rien
    this.leaving = true; // on note qu'on est en train de sortir
    state.data.currentRoom = null; // on n'est plus dans aucune salle
    state.save(); // on sauvegarde
    sfx.doorOpen(); // bruit de porte qui s'ouvre
    this.cameras.main.fadeOut(200, 0, 0, 0); // l'écran devient noir en 200 millisecondes
    // une fois tout noir, on retourne dans le couloir (scène Hub)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Hub', { fromRoom: true }));
  }
}
