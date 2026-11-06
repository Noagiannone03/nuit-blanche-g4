import Phaser from 'phaser'; // on charge Phaser, l'outil qui fait marcher le jeu
import { state } from '../state/GameState.js'; // on récupère l'état du jeu (pseudo, sauvegarde…)
import { openDialog, closeDialog, isDialogOpen } from '../ui/dialog.js'; // outils pour ouvrir/fermer une boîte de dialogue
import { loadBoard } from '../state/leaderboard.js'; // outil pour lire le classement enregistré
// on récupère couleurs, polices et outils de dessin
import { C, FONT_TITLE, FONT_HAND, txt, drawChalkboard, chalkButton } from '../ui/theme.js';
import { setAmbience, toggleMute, isMuted, playMusic, stopMusic } from '../audio/sound.js'; // on récupère les outils pour le son
import { net, ROLES, hostGame, joinGame, leave } from '../net/multiplayer.js'; // on récupère les outils du mode à 2 joueurs
import { createCharacter, drawPreview } from '../art/characters.js'; // outils pour fabriquer et dessiner un personnage
import { SKIN_OPTIONS, loadSkin, saveSkin, paletteFromSkin } from '../art/skins.js'; // outils pour choisir l'apparence (skin) de l'élève
import { isTouch, toggleFullscreen, fullscreenAvailable } from '../ui/touch.js'; // outils pour le tactile et le plein écran

// Le menu est écrit à la craie sur un tableau noir.
export class MenuScene extends Phaser.Scene { // on crée la scène du menu (scène = un écran du jeu)
  constructor() { // fonction lancée quand on fabrique la scène
    super('Menu'); // on donne le nom « Menu » à cette scène
  }

  create() { // create() se lance une fois quand le menu s'affiche
    const { width, height } = this.scale; // on récupère la largeur et la hauteur de l'écran
    setAmbience(null); // on coupe la musique de fond
    playMusic(); // on lance la musique de l'écran d'accueil (elle démarre au premier clic ou à la première touche)
    this.events.once('shutdown', () => stopMusic()); // quand on quitte le menu, la musique s'arrête en fondu
    leave(); // on revient d'une partie à 2 : on coupe la connexion
    this.cameras.main.setBackgroundColor(C.wall); // couleur du fond derrière le tableau
    drawChalkboard(this, 30, 24, width - 60, height - 80); // on dessine le tableau noir

    // on écrit le grand titre, un peu penché
    txt(this, width / 2, 100, 'Nuit Blanche à G4', { size: 64, font: FONT_TITLE, color: C.chalk }).setOrigin(0.5).setAngle(-2);
    // on écrit le sous-titre en jaune
    txt(this, width / 2, 162, 'Escape game — Cercle de projets 2026 — Marseille', { size: 26, font: FONT_HAND, weight: '600', color: C.yellow }).setOrigin(0.5);
    const g = this.add.graphics(); // on prépare un pinceau pour dessiner des formes
    g.lineStyle(3, C.chalk, 0.6).lineBetween(width / 2 - 260, 188, width / 2 + 260, 188); // on trace un trait de craie sous le titre

    // L'élève et le gardien posés sur le rebord du tableau
    this.add.sprite(150, 488, 'player').setScale(3).play('player-down'); // on affiche l'élève qui marche vers le bas, en grand
    this.add.sprite(810, 488, 'guard').setScale(3).setFlipX(true).play('guard-side'); // on affiche le gardien, tourné vers la gauche
    // on écrit « toi » au-dessus de l'élève
    txt(this, 150, 395, 'toi', { size: 26, font: FONT_HAND, weight: '600', color: C.chalk }).setOrigin(0.5);
    // on écrit « le gardien » au-dessus du gardien
    txt(this, 810, 395, 'le gardien', { size: 26, font: FONT_HAND, weight: '600', color: C.chalk }).setOrigin(0.5);

    // liste des boutons du menu et ce qu'ils font
    const entries = [{ label: 'Nouvelle partie', action: () => this.newGame() }, { label: 'Jouer à 2 (en ligne)', action: () => this.duo() }];
    // s'il y a une sauvegarde, on ajoute « Continuer »
    if (state.hasSave()) entries.push({ label: 'Continuer', action: () => this.continueGame() });
    entries.push({ label: 'Mon élève', action: () => this.chooseSkin() }); // on ajoute le bouton pour changer son élève
    entries.push({ label: 'Classement', action: () => this.showBoard() }); // on ajoute le bouton du classement

    // bouton son, en haut à droite du tableau
    // texte du bouton son (rempli plus tard dans update)
    this.muteBtn = txt(this, width - 56, 48, '', { size: 22, font: FONT_HAND, weight: '600', color: C.chalk })
      .setOrigin(1, 0) // on le colle en haut à droite
      .setInteractive({ useHandCursor: true }); // on le rend cliquable (curseur en forme de main)
    this.muteBtn.on('pointerdown', () => toggleMute()); // clic dessus = couper ou remettre le son

    entries.forEach((e, i) => { // pour chaque bouton de la liste…
      // …on dessine un bouton à la craie, l'un sous l'autre
      chalkButton(this, width / 2, 240 + i * 58, e.label, () => !isDialogOpen() && e.action());
    });

    // plein écran (surtout utile sur téléphone), en haut à gauche du tableau
    if (fullscreenAvailable()) { // si l'appareil permet le plein écran…
      // …on écrit le bouton « plein écran »
      txt(this, 56, 48, '⛶ plein écran', { size: 22, font: FONT_HAND, weight: '600', color: C.chalk })
        .setInteractive({ useHandCursor: true }) // on le rend cliquable
        .on('pointerup', () => toggleFullscreen()); // le plein écran doit partir d'un « pointerup »
    }

    const help = isTouch() // texte d'aide : il change selon tactile ou clavier
      // aide pour téléphone / tablette
      ? 'Joystick : bouger  ·  ✋ : agir  ·  touche un objet pour l\'utiliser  ·  « Indice ? » en haut à droite  ·  ⏸ : pause'
      // aide pour ordinateur
      : 'Flèches / ZQSD : bouger  ·  E : interagir  ·  H : indice  ·  P : pause  ·  M : son  ·  Échap : sortir d\'une salle  ·  souris et tactile acceptés';
    txt(this, width / 2, height - 28, help, { // on écrit l'aide en bas de l'écran
      size: 14, color: C.ink, weight: '700', // taille, couleur et épaisseur du texte
    }).setOrigin(0.5); // on centre le texte
  }

  update() { // update() tourne en boucle, plusieurs fois par seconde
    const key = isTouch() ? '' : ' (M)'; // sur ordinateur on rappelle la touche M
    this.muteBtn.setText(isMuted() ? `🔇 son coupé${key}` : `🔊 son${key}`); // on met à jour le texte du bouton son
  }

  newGame() { // quand on clique sur « Nouvelle partie »
    openDialog({ // on ouvre une boîte de dialogue
      title: 'Nouvelle partie', // titre de la boîte
      body: '<p>Écris ton pseudo pour le classement.</p>', // texte affiché dans la boîte
      input: { placeholder: 'Pseudo', maxLength: 16 }, // une case pour écrire son pseudo (16 lettres max)
      submitLabel: 'Commencer', // texte du bouton de validation
      onSubmit: (value, ui) => { // quand le joueur valide :
        if (!value) return ui.feedback('Choisis un pseudo.'); // pas de pseudo ? on affiche un message d'erreur
        ui.close(); // on ferme la boîte
        state.reset(value); // on remet le jeu à zéro avec ce pseudo
        this.scene.start('Intro'); // on lance l'intro
      },
    });
  }

  // ---------- Partie à 2 ----------
  duo() { // quand on clique sur « Jouer à 2 »
    // texte HTML qui explique les deux rôles (HTML = langage des pages web)
    const roles = `<ul><li>${ROLES.tech.icon} <strong>Celui qui crée la partie est le ${ROLES.tech.name}</strong> : ${ROLES.tech.does}</li><li>${ROLES.enq.icon} <strong>Celui qui la rejoint est l'${ROLES.enq.name}</strong> : ${ROLES.enq.does}</li></ul><p>Le gardien, c'est pour vous deux : <strong>si l'un de vous se fait attraper, la partie est perdue.</strong> Et la porte de sortie ne s'ouvre qu'à deux.</p>`;
    openDialog({ // on ouvre une boîte de dialogue
      title: 'Jouer à 2 (en ligne)', // titre de la boîte
      // texte de la boîte, avec l'explication des rôles
      body: `<p>Chacun sur son ordinateur. Vous aurez besoin l'un de l'autre :</p>${roles}<p>Ton pseudo :</p>`,
      input: { placeholder: 'Pseudo', maxLength: 16 }, // case pour écrire son pseudo
      submitLabel: 'Créer une partie', // texte du bouton principal
      // si pseudo écrit : on crée la partie, sinon erreur
      onSubmit: (name, ui) => (name ? this.createDuo(name) : ui.feedback('Choisis un pseudo.')),
      buttons: [ // liste des autres boutons
        {
          label: 'Rejoindre avec un code', // texte du bouton
          onClick: (ui) => { // quand on clique dessus :
            const name = ui.box.querySelector('input').value.trim(); // on lit le pseudo écrit dans la case
            if (name) this.joinDuo(name); // si il y a un pseudo, on rejoint une partie
            else ui.feedback('Choisis un pseudo.'); // sinon on affiche une erreur
          },
        },
      ],
    });
  }

  /** Les deux joueurs sont connectés : chacun voit l'intro puis arrive dans le couloir. */
  waitForStart() { // prépare ce qu'il faut faire quand la partie à 2 démarre
    net.events.off('start'); // on enlève l'ancienne attente, s'il y en avait une
    net.events.once('start', () => { // quand le signal « start » arrive (une seule fois) :
      net.events.off('error'); // on n'écoute plus les erreurs
      createCharacter(this, 'mate', paletteFromSkin(net.mate.skin), true); // le coéquipier avec son skin
      closeDialog(); // on ferme la boîte de dialogue
      this.scene.start('Intro'); // on lance l'intro
    });
  }

  async createDuo(name) { // crée une partie à 2 (async = peut attendre le serveur)
    // on ouvre une boîte « Connexion au serveur… » ; si on la ferme sans partenaire, on se déconnecte
    const ui = openDialog({ title: 'Créer une partie', body: '<p>Connexion au serveur…</p>', onClose: () => !net.online && leave() });
    this.waitForStart(); // on se prépare au départ de la partie
    try { // on essaie (try) ce qui suit :
      const code = await hostGame(name); // on attend que le serveur nous donne un code
      // on affiche le code à donner au coéquipier
      ui.box.querySelector('div').innerHTML = `<p>Donne ce code à ton coéquipier :</p><p class="hand" style="font-size:3em;text-align:center;letter-spacing:.15em">${code}</p><p>En attente qu'il rejoigne la partie… Tu seras le ${ROLES.tech.icon} <strong>${ROLES.tech.name}</strong>.</p>`;
    } catch (e) { // si ça rate (catch) :
      ui.feedback(e.message); // on affiche le message d'erreur
    }
  }

  joinDuo(name) { // rejoindre la partie d'un ami
    openDialog({ // on ouvre une boîte de dialogue
      title: 'Rejoindre une partie', // titre de la boîte
      // texte qui explique quoi faire
      body: `<p>Tape le code affiché chez ton coéquipier. Tu seras l'${ROLES.enq.icon} <strong>${ROLES.enq.name}</strong>.</p>`,
      input: { placeholder: 'Code (5 lettres)', maxLength: 5 }, // case pour taper le code (5 lettres)
      submitLabel: 'Rejoindre', // texte du bouton
      onClose: () => !net.online && leave(), // si on ferme sans être connecté, on se déconnecte
      onSubmit: (code, ui) => { // quand le joueur valide le code :
        if (code.length !== 5) return ui.feedback('Le code fait 5 caractères.'); // le code n'a pas 5 lettres ? message d'erreur
        ui.feedback('Connexion…', 'ok'); // on affiche « Connexion… »
        net.events.off('error'); // on enlève les anciennes écoutes d'erreur
        net.events.on('error', (msg) => ui.feedback(msg)); // si une erreur arrive, on l'affiche
        this.waitForStart(); // on se prépare au départ de la partie
        joinGame(code, name); // on envoie le code et le pseudo au serveur
      },
    });
  }

  // ---------- Skin de l'élève ----------
  chooseSkin() { // ouvre la fenêtre pour choisir l'apparence de l'élève
    const skin = loadSkin(); // on lit l'apparence enregistrée
    const wrap = document.createElement('div'); // on crée une boîte qui contiendra tout
    const preview = document.createElement('canvas'); // on crée une zone de dessin pour l'aperçu
    preview.className = 'skin-preview'; // on lui donne un style (classe CSS = style de page web)
    preview.setAttribute('role', 'img'); // on dit que c'est une image (pour l'accessibilité)
    preview.setAttribute('aria-label', 'Aperçu de ton élève'); // description de l'image pour les lecteurs d'écran
    wrap.appendChild(preview); // on met l'aperçu dans la boîte
    const redraw = () => drawPreview(preview, paletteFromSkin(skin)); // petite fonction qui redessine l'aperçu

    for (const opt of SKIN_OPTIONS) { // pour chaque partie à choisir (cheveux, haut…) :
      const row = document.createElement('div'); // on crée une ligne
      row.className = 'skin-row'; // on lui donne un style
      row.innerHTML = `<span>${opt.label}</span>`; // on écrit le nom de la partie au début de la ligne
      for (const [id, val] of opt.choices) { // pour chaque choix possible :
        const b = document.createElement('button'); // on crée un bouton
        b.type = 'button'; // c'est un simple bouton (pas un envoi de formulaire)
        b.className = typeof val === 'number' ? 'swatch' : 'swatch text'; // carré de couleur si c'est une couleur, sinon texte
        // si c'est une couleur, on colore le bouton
        if (typeof val === 'number') b.style.background = `#${val.toString(16).padStart(6, '0')}`;
        else b.textContent = val; // sinon on écrit le texte dans le bouton
        b.title = id; // on garde le nom du choix
        b.setAttribute('aria-label', `${opt.label} : ${id}`); // description pour les lecteurs d'écran
        b.setAttribute('aria-pressed', String(skin[opt.key] === id)); // on marque le bouton s'il est le choix actuel
        b.addEventListener('click', () => { // quand on clique sur ce bouton :
          skin[opt.key] = id; // on retient ce choix
          // seul ce bouton est marqué comme choisi dans la ligne
          row.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          redraw(); // on redessine l'aperçu
        });
        row.appendChild(b); // on ajoute le bouton à la ligne
      }
      wrap.appendChild(row); // on ajoute la ligne à la boîte
    }
    redraw(); // on dessine l'aperçu une première fois

    const random = () => { // fonction pour tirer une apparence au hasard
      // pour chaque partie, on choisit un choix au hasard
      for (const opt of SKIN_OPTIONS) skin[opt.key] = opt.choices[Math.floor(Math.random() * opt.choices.length)][0];
      wrap.querySelectorAll('.skin-row').forEach((row, i) => { // pour chaque ligne de boutons :
        // on marque le bouton qui correspond au tirage
        row.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.title === skin[SKIN_OPTIONS[i].key])));
      });
      redraw(); // on redessine l'aperçu
    };

    openDialog({ // on ouvre la boîte de dialogue
      title: 'Mon élève', // titre de la boîte
      body: wrap, // contenu : la boîte qu'on vient de fabriquer
      buttons: [ // liste des boutons
        {
          label: 'Enregistrer', // texte du bouton
          primary: true, // c'est le bouton principal (mis en avant)
          onClick: () => { // quand on clique :
            saveSkin(skin); // on enregistre l'apparence
            createCharacter(this, 'player', paletteFromSkin(skin), true); // on refabrique le personnage avec ces couleurs
            closeDialog(); // on ferme la boîte
            this.scene.restart(); // on relance le menu pour voir le nouvel élève
          },
        },
        { label: '🎲 Au hasard', onClick: random }, // bouton pour tirer au hasard
      ],
    });
  }

  continueGame() { // quand on clique sur « Continuer »
    state.load(); // on charge la sauvegarde
    this.scene.start('Hub'); // on va dans le couloir (scène Hub)
  }

  showBoard() { // quand on clique sur « Classement »
    const board = loadBoard(); // on lit le classement enregistré
    const rows = board.length // s'il y a des parties enregistrées…
      // …on fabrique une ligne de tableau HTML par partie
      ? board.map((e, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(e.name)}</td><td>${e.score}</td><td>${e.clock}</td><td>${e.hints}</td><td>${e.success ? 'Évadé' : 'Échec'}</td></tr>`).join('')
      : '<tr><td colspan="6">Aucune partie pour l\'instant.</td></tr>'; // …sinon une seule ligne « Aucune partie »
    openDialog({ // on ouvre une boîte de dialogue
      title: 'Classement', // titre de la boîte
      // contenu : un tableau HTML avec les lignes du classement
      body: `<table><thead><tr><th>#</th><th>Pseudo</th><th>Score</th><th>Heure</th><th>Indices</th><th>Résultat</th></tr></thead><tbody>${rows}</tbody></table>`,
    });
  }
}

export function escapeHtml(s) { // rend un texte sûr à afficher dans une page web
  // on remplace les caractères spéciaux (& < > " ') par des codes sans danger
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
