import Phaser from 'phaser'; // on charge Phaser, l'outil qui fait marcher le jeu
import { state } from '../state/GameState.js'; // on récupère l'état du jeu (heure, indices, chiffres…)
import { openDialog, closeDialog, isDialogOpen } from '../ui/dialog.js'; // outils pour ouvrir/fermer une boîte de dialogue
import { ROOMS } from '../rooms/index.js'; // la liste de toutes les salles
import { HUB_HINTS } from '../data/hubLayout.js'; // les indices du couloir
import { CODE_ORDER } from '../puzzles/code.js'; // l'ordre des chiffres du code final
import { GAME_MIN_PER_SEC, PENALTY_HINT, TOP_BAR } from '../config.js'; // réglages : vitesse du temps, pénalité, hauteur de la barre
import { C, FONT_HAND, hex, txt } from '../ui/theme.js'; // on récupère couleurs, police et outils pour écrire
import { endGame } from './endGame.js'; // fonction qui termine la partie
import { tickPatrol } from '../state/patrol.js'; // fonction qui fait bouger le gardien
import { sfx, toggleMute, isMuted } from '../audio/sound.js'; // on récupère les outils pour le son
import { net, ROLES } from '../net/multiplayer.js'; // on récupère les infos du mode à 2 joueurs
import { isTouch, toggleFullscreen, fullscreenAvailable } from '../ui/touch.js'; // outils pour le tactile et le plein écran

const DIGIT_ROOMS = ['ventoux', 'callelongue', 'stevictoire', 'sormiou']; // les 4 salles qui donnent un chiffre du code
// noms courts des salles, pour qu'ils tiennent dans les cases
const SHORT = { ventoux: 'Ventoux', callelongue: 'Callel.', stevictoire: 'Ste Vic.', sormiou: 'Sormiou' };

// Barre du haut, toujours affichée pendant la partie : horloge murale, indices, code.
// C'est aussi elle qui fait avancer le temps.
export class UIScene extends Phaser.Scene { // on crée la scène de la barre du haut (scène = un écran du jeu)
  constructor() { // fonction lancée quand on fabrique la scène
    super('UI'); // on donne le nom « UI » à cette scène
  }

  create() { // create() se lance une fois quand la scène démarre
    const { width } = this.scale; // on récupère la largeur de l'écran
    const bar = this.add.graphics(); // on prépare un pinceau pour dessiner la barre
    bar.fillStyle(0x2b2320).fillRect(0, 0, width, TOP_BAR); // on peint le fond de la barre en marron foncé
    bar.fillStyle(0x4a3a2c).fillRect(0, TOP_BAR - 4, width, 4); // on peint une bordure plus claire en bas de la barre

    // horloge murale (aiguilles) + heure en chiffres
    this.clock = this.add.graphics(); // pinceau pour dessiner l'horloge
    // texte de l'heure, à droite de l'horloge
    this.clockText = txt(this, 52, TOP_BAR / 2, '', { size: 24, weight: '800', color: 0xffffff }).setOrigin(0, 0.5);
    this.statsText = txt(this, 150, 7, '', { size: 13, weight: '700', color: 0xd8cbb8 }); // texte des indices et des erreurs
    this.playerText = txt(this, 150, 25, '', { size: 14, weight: '800', color: 0xffffff }); // texte avec le pseudo du joueur

    // 4 cases pour les chiffres du code, comme les molettes d'un cadenas
    this.slots = [0, 1, 2, 3].map((i) => { // on fabrique 4 cases, une par chiffre
      const x = 440 + i * 56; // position de la case : 56 pixels entre chaque case
      const g = this.add.graphics(); // pinceau pour dessiner la case
      // le chiffre, « ? » tant qu'on ne le connaît pas
      const digit = txt(this, x + 23, 17, '?', { size: 20, weight: '800', color: C.ink }).setOrigin(0.5);
      // petit nom de la salle sous le chiffre
      const tag = txt(this, x + 23, 36, '', { size: 9, weight: '700', color: 0x6b5d50 }).setOrigin(0.5);
      return { x, g, digit, tag }; // on garde tout ça pour plus tard
    });
    // texte qui dit si on connaît l'ordre du code
    this.orderText = txt(this, 670, TOP_BAR / 2, '', { size: 13, weight: '800', color: 0xd8cbb8 }).setOrigin(0, 0.5);

    // bouton indice en forme de post-it
    // bouton « Indice ? » (sur ordinateur on rappelle la touche H)
    const hintBtn = txt(this, width - 14, TOP_BAR / 2, isTouch() ? 'Indice ?' : 'H · Indice ?', {
      // taille, police, couleurs et marges du bouton
      size: 22, font: FONT_HAND, weight: '600', color: C.ink, backgroundColor: hex(0xffe97a), padding: { x: 10, y: 2 },
    })
      .setOrigin(1, 0.5) // on le colle à droite
      .setAngle(-3) // on le penche un peu, comme un post-it
      .setInteractive({ useHandCursor: true }); // on le rend cliquable (curseur en forme de main)
    hintBtn.on('pointerdown', () => this.showHint()); // clic sur le bouton = demander un indice
    this.input.keyboard.on('keydown-H', () => this.showHint()); // touche H = demander un indice

    // bouton pause (touche P ; Échap dans le couloir)
    const pauseBtn = txt(this, 382, TOP_BAR / 2, '⏸ P', { // bouton pause
      size: 15, weight: '800', color: 0xffffff, backgroundColor: '#4a3a2c', padding: { x: 8, y: 6 }, // taille, couleurs et marges du bouton
    })
      .setOrigin(0, 0.5) // on le place
      .setInteractive({ useHandCursor: true }); // on le rend cliquable
    pauseBtn.on('pointerdown', () => this.pause()); // clic sur le bouton = pause
    this.input.keyboard.on('keydown-P', () => this.pause()); // touche P = pause
    this.paused = false; // au début, le jeu n'est pas en pause

    this.saveTimer = 0; // compteur pour la sauvegarde automatique
    this.lastSignature = null; // mémoire de l'affichage des cases (rien pour l'instant)
    this.refresh = () => this.render(); // fonction qui redessine la barre
    this.onPenalty = () => { // fonction lancée quand le joueur reçoit une pénalité :
      sfx.error(); // bruit d'erreur
      this.cameras.main.flash(250, 220, 40, 40); // l'écran clignote en rouge
    };
    state.on('changed', this.refresh); // quand l'état du jeu change, on redessine la barre
    state.on('penalty', this.onPenalty); // quand il y a une pénalité, on fait le flash rouge
    this.events.once('shutdown', () => { // quand la scène s'arrête :
      state.off('changed', this.refresh); // on arrête d'écouter les changements
      state.off('penalty', this.onPenalty); // on arrête d'écouter les pénalités
    });
    this.render(); // on dessine la barre une première fois
  }

  drawClock(minutes, late) { // dessine l'horloge (en rouge si on est en retard)
    const g = this.clock; // le pinceau de l'horloge
    const cx = 26; // position horizontale du centre de l'horloge
    const cy = TOP_BAR / 2 - 2; // position verticale du centre
    g.clear(); // on efface l'ancien dessin
    g.fillStyle(0xffffff).fillCircle(cx, cy, 17); // on dessine le cadran blanc
    g.lineStyle(3, late ? C.red : 0x1f2a44).strokeCircle(cx, cy, 17); // on dessine le bord (rouge si en retard)
    const hourA = ((minutes / 60) % 12) * (Math.PI / 6) - Math.PI / 2; // angle de la petite aiguille (les heures)
    const minA = (minutes % 60) * (Math.PI / 30) - Math.PI / 2; // angle de la grande aiguille (les minutes)
    g.lineStyle(3, C.ink).lineBetween(cx, cy, cx + Math.cos(hourA) * 8, cy + Math.sin(hourA) * 8); // on trace la petite aiguille
    g.lineStyle(2, C.red).lineBetween(cx, cy, cx + Math.cos(minA) * 13, cy + Math.sin(minA) * 13); // on trace la grande aiguille, en rouge
  }

  update(_, delta) { // update() tourne en boucle ; delta = temps écoulé depuis la dernière fois
    if (this.paused) return; // le temps et le gardien s'arrêtent pendant la pause
    state.data.realSeconds += delta / 1000; // on compte le vrai temps passé, en secondes
    state.addMinutes((delta / 1000) * GAME_MIN_PER_SEC); // on fait avancer l'heure du jeu
    tickPatrol(delta); // on fait bouger le gardien

    // sauvegarde automatique toutes les 5 s
    this.saveTimer += delta; // on ajoute le temps écoulé au compteur
    if (this.saveTimer > 5000) { // si plus de 5 secondes (5000 millisecondes) sont passées…
      this.saveTimer = 0; // …on remet le compteur à zéro
      state.save(); // …et on sauvegarde la partie
    }

    // à 2, c'est l'horloge de l'hôte qui décide de la fin
    if (state.isTimeUp && !state.follower) endGame(this, false, 'timeout'); // s'il est 9h00 (et qu'on est l'hôte), la partie est perdue
  }

  render() { // redessine toute la barre du haut
    const d = state.data; // raccourci vers les données du jeu
    const late = d.minutes > 7 * 60; // en retard si on a passé 7 heures du matin
    this.drawClock(d.minutes, late); // on dessine l'horloge
    this.clockText.setText(state.clock).setColor(hex(late ? 0xff6b5b : 0xffffff)); // on écrit l'heure (en rouge si en retard)
    const free = d.freeHints ? ` (+${d.freeHints} offert)` : ''; // texte des indices gratuits, s'il y en a
    this.statsText.setText(`Indices : ${d.hintsUsed}${free}   ·   Erreurs : ${d.errors}`); // on écrit le nombre d'indices et d'erreurs
    // on écrit le pseudo (et le rôle si on joue à 2)
    this.playerText.setText(net.online ? `${ROLES[net.role].icon} ${ROLES[net.role].name} · ${d.playerName}` : d.playerName);

    // Les cases ne sont redessinées que si un chiffre ou l'ordre a changé
    const signature = JSON.stringify([d.digits, d.orderFound]); // on résume les chiffres et l'ordre en un seul texte
    if (signature === this.lastSignature) return; // rien n'a changé ? on s'arrête là
    this.lastSignature = signature; // on retient ce résumé pour la prochaine fois

    // Avant de connaître l'ordre : un chiffre par salle. Après : le code dans l'ordre.
    const rooms = d.orderFound ? CODE_ORDER : DIGIT_ROOMS; // les salles à afficher, dans le bon ordre
    rooms.forEach((room, i) => { // pour chaque salle (i = numéro de la case) :
      const s = this.slots[i]; // la case qui correspond
      const known = d.digits[room] !== undefined; // est-ce qu'on connaît déjà ce chiffre ?
      s.g.clear(); // on efface la case
      s.g.fillStyle(known ? 0xe3f4e6 : 0xf1e9d6).fillRoundedRect(s.x, 4, 46, 40, 5); // on peint le fond (vert clair si chiffre connu)
      s.g.lineStyle(2, known ? C.green : 0x8a7a68).strokeRoundedRect(s.x, 4, 46, 40, 5); // on trace le bord (vert si chiffre connu)
      // on écrit le chiffre, ou « ? » si inconnu
      s.digit.setText(known ? String(d.digits[room]) : '?').setColor(hex(known ? C.ink : 0x9a8b7a));
      s.tag.setText(SHORT[room]); // on écrit le petit nom de la salle
    });
    // on écrit si l'ordre du code est trouvé (en vert) ou non
    this.orderText.setText(d.orderFound ? '✓ Ordre trouvé\n  code complet' : 'Ordre du code :\n  inconnu').setColor(hex(d.orderFound ? 0x7fe0a0 : 0xd8cbb8));
  }

  // ---------- Pause ----------
  pause() { // met le jeu en pause et montre l'aide
    if (this.paused || isDialogOpen()) return; // déjà en pause ou une boîte ouverte ? on ne fait rien
    // à 2, le temps ne s'arrête pas (le coéquipier continue de jouer)
    this.paused = !net.online; // on arrête le temps seulement si on joue seul
    const intro = net.online // texte du début : différent si on joue à 2 ou seul
      // texte HTML pour le mode à 2 (HTML = langage des pages web)
      ? `<p><strong>Partie à 2 : le temps continue</strong> (il est ${state.clock}). Une partie à 2 n'est pas sauvegardée.</p><p>Ton rôle : ${ROLES[net.role].icon} <strong>${ROLES[net.role].name}</strong>. ${ROLES[net.role].does}</p>`
      // texte HTML pour le mode seul
      : `<p>Le temps est arrêté (il est <strong>${state.clock}</strong>). Ta partie est sauvegardée automatiquement : tu pourras la reprendre depuis le menu avec « Continuer ».</p>`;
    openDialog({ // on ouvre la boîte de pause
      title: 'Pause', // titre de la boîte
      // contenu : le texte du début, puis un tableau HTML avec toutes les touches
      body: `${intro}
        <table><tbody>
          <tr><td>Sur téléphone / tablette</td><td>joystick en bas à gauche pour bouger, ✋ pour agir, toucher un objet pour l'utiliser, « Indice ? » en haut à droite</td></tr>
          <tr><td>Se déplacer</td><td>Flèches ou ZQSD, ou clic / toucher</td></tr>
          <tr><td>Entrer, utiliser</td><td>E ou Entrée · touches 1, 2, 3, 4 dans une salle</td></tr>
          <tr><td>Indice</td><td>H</td></tr>
          <tr><td>Revenir au couloir</td><td>Échap (dans une salle)</td></tr>
          <tr><td>Pause</td><td>P (ou Échap dans le couloir)</td></tr>
          <tr><td>Couper / remettre le son</td><td>M</td></tr>
        </tbody></table>`,
      buttons: [ // liste des boutons
        { label: 'Reprendre', primary: true, onClick: (ui) => ui.close() }, // bouton « Reprendre » : ferme la boîte
        {
          label: isMuted() ? '🔇 Son coupé' : '🔊 Son activé', // texte selon que le son est coupé ou non
          onClick: (ui) => { // quand on clique :
            // on coupe/remet le son et on change le texte du bouton
            ui.box.querySelectorAll('.actions button')[1].textContent = toggleMute() ? '🔇 Son coupé' : '🔊 Son activé';
          },
        },
        // bouton plein écran, seulement si c'est possible
        ...(fullscreenAvailable() ? [{ label: '⛶ Plein écran', onClick: () => toggleFullscreen() }] : []),
        // bouton pour quitter vers le menu
        { label: net.online ? 'Quitter la partie' : 'Sauvegarder et quitter', onClick: () => this.quitToMenu() },
      ],
      onClose: () => { // quand la boîte se ferme :
        this.paused = false; // on enlève la pause
      },
    });
  }

  quitToMenu() { // quitte la partie et revient au menu
    // on retient où était l'élève dans le couloir pour le remettre au même endroit
    const hub = this.scene.get('Hub'); // on récupère la scène du couloir
    // si on est dans le couloir, on retient la position de l'élève
    if (this.scene.isActive('Hub') && hub.player) state.data.playerPos = { x: hub.player.x, y: hub.player.y };
    state.save(); // on sauvegarde
    closeDialog(); // on ferme la boîte de dialogue
    const manager = this.game.scene; // le chef qui gère toutes les scènes
    for (const s of manager.getScenes(true)) manager.stop(s.scene.key); // on arrête toutes les scènes en cours
    manager.start('Menu'); // on lance le menu
  }

  showHint() { // montre un indice au joueur
    if (isDialogOpen()) return; // une boîte est déjà ouverte ? on ne fait rien
    const roomKey = state.data.currentRoom; // la salle où on est (vide si on est dans le couloir)
    const key = roomKey || 'hub'; // le nom de l'endroit : la salle, ou « hub » = couloir
    const hints = roomKey ? ROOMS[roomKey].hints : HUB_HINTS; // les indices de la salle, ou ceux du couloir
    const seen = state.data.hintsByRoom[key] || 0; // combien d'indices on a déjà lus ici
    // les indices déjà lus restent consultables, gratuitement
    const previous = seen // s'il y a des indices déjà lus…
      ? `<ol>${hints.slice(0, seen).map((h) => `<li>${h}</li>`).join('')}</ol>` // …on en fait une liste numérotée HTML
      : ''; // …sinon rien
    if (seen >= hints.length) { // si on a déjà lu tous les indices :
      openDialog({ title: 'Indices', body: `${previous}<p><em>(Plus d'autre indice ici.)</em></p>` }); // on dit qu'il n'y en a plus
      return; // on s'arrête là
    }
    // prix de l'indice : gratuit ou des minutes en plus
    const cost = state.data.freeHints > 0 ? 'gratuit (carnet)' : `+${PENALTY_HINT} min`;
    const intro = seen ? `<p>Indices déjà lus :</p>${previous}` : ''; // rappel des indices déjà lus, s'il y en a
    openDialog({ // on ouvre la boîte d'indice
      title: 'Besoin d\'un indice ?', // titre de la boîte
      // texte : numéro de l'indice et son prix
      body: `${intro}<p>Indice ${seen + 1}/${hints.length} — coût : <strong>${cost}</strong>.</p>`,
      buttons: [ // liste des boutons
        {
          label: seen ? 'Lire l\'indice suivant' : 'Lire l\'indice', // texte du bouton
          primary: true, // c'est le bouton principal
          onClick: () => { // quand on clique :
            const h = state.useHint(key, hints); // on prend l'indice (et on paye son prix)
            sfx.hint(); // petit bruit d'indice
            openDialog({ title: `Indice ${seen + 1}`, body: `<p>${h.text}</p>` }); // on affiche l'indice dans une nouvelle boîte
          },
        },
      ],
    });
  }
}
