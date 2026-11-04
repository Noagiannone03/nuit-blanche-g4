import Phaser from 'phaser';
import { state } from '../state/GameState.js';
import { openDialog, closeDialog, isDialogOpen } from '../ui/dialog.js';
import { loadBoard } from '../state/leaderboard.js';
import { C, FONT_TITLE, FONT_HAND, txt, drawChalkboard, chalkButton } from '../ui/theme.js';
import { setAmbience, toggleMute, isMuted } from '../audio/sound.js';
import { net, ROLES, hostGame, joinGame, leave } from '../net/multiplayer.js';
import { createCharacter, drawPreview } from '../art/characters.js';
import { SKIN_OPTIONS, loadSkin, saveSkin, paletteFromSkin } from '../art/skins.js';
import { isTouch, toggleFullscreen } from '../ui/touch.js';

// Le menu est écrit à la craie sur un tableau noir.
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;
    setAmbience(null);
    leave(); // on revient d'une partie à 2 : on coupe la connexion
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

    const entries = [{ label: 'Nouvelle partie', action: () => this.newGame() }, { label: 'Jouer à 2 (en ligne)', action: () => this.duo() }];
    if (state.hasSave()) entries.push({ label: 'Continuer', action: () => this.continueGame() });
    entries.push({ label: 'Mon élève', action: () => this.chooseSkin() });
    entries.push({ label: 'Classement', action: () => this.showBoard() });

    // bouton son, en haut à droite du tableau
    this.muteBtn = txt(this, width - 56, 48, '', { size: 22, font: FONT_HAND, weight: '600', color: C.chalk })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.muteBtn.on('pointerdown', () => toggleMute());

    entries.forEach((e, i) => {
      chalkButton(this, width / 2, 240 + i * 58, e.label, () => !isDialogOpen() && e.action());
    });

    // plein écran (surtout utile sur téléphone), en haut à gauche du tableau
    if (this.scale.fullscreen.available) {
      txt(this, 56, 48, '⛶ plein écran', { size: 22, font: FONT_HAND, weight: '600', color: C.chalk })
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => toggleFullscreen(this)); // le plein écran doit partir d'un « pointerup »
    }

    const help = isTouch()
      ? 'Joystick : bouger  ·  ✋ : agir  ·  touche un objet pour l\'utiliser  ·  « Indice ? » en haut à droite  ·  ⏸ : pause'
      : 'Flèches / ZQSD : bouger  ·  E : interagir  ·  H : indice  ·  P : pause  ·  M : son  ·  Échap : sortir d\'une salle  ·  souris et tactile acceptés';
    txt(this, width / 2, height - 28, help, {
      size: 14, color: C.ink, weight: '700',
    }).setOrigin(0.5);
  }

  update() {
    const key = isTouch() ? '' : ' (M)';
    this.muteBtn.setText(isMuted() ? `🔇 son coupé${key}` : `🔊 son${key}`);
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

  // ---------- Partie à 2 ----------
  duo() {
    const roles = `<ul><li>${ROLES.tech.icon} <strong>Celui qui crée la partie est le ${ROLES.tech.name}</strong> : ${ROLES.tech.does}</li><li>${ROLES.enq.icon} <strong>Celui qui la rejoint est l'${ROLES.enq.name}</strong> : ${ROLES.enq.does}</li></ul><p>Le gardien, c'est pour vous deux : <strong>si l'un de vous se fait attraper, la partie est perdue.</strong> Et la porte de sortie ne s'ouvre qu'à deux.</p>`;
    openDialog({
      title: 'Jouer à 2 (en ligne)',
      body: `<p>Chacun sur son ordinateur. Vous aurez besoin l'un de l'autre :</p>${roles}<p>Ton pseudo :</p>`,
      input: { placeholder: 'Pseudo', maxLength: 16 },
      submitLabel: 'Créer une partie',
      onSubmit: (name, ui) => (name ? this.createDuo(name) : ui.feedback('Choisis un pseudo.')),
      buttons: [
        {
          label: 'Rejoindre avec un code',
          onClick: (ui) => {
            const name = ui.box.querySelector('input').value.trim();
            if (name) this.joinDuo(name);
            else ui.feedback('Choisis un pseudo.');
          },
        },
      ],
    });
  }

  /** Les deux joueurs sont connectés : chacun voit l'intro puis arrive dans le couloir. */
  waitForStart() {
    net.events.off('start');
    net.events.once('start', () => {
      net.events.off('error');
      createCharacter(this, 'mate', paletteFromSkin(net.mate.skin), true); // le coéquipier avec son skin
      closeDialog();
      this.scene.start('Intro');
    });
  }

  async createDuo(name) {
    const ui = openDialog({ title: 'Créer une partie', body: '<p>Connexion au serveur…</p>', onClose: () => !net.online && leave() });
    this.waitForStart();
    try {
      const code = await hostGame(name);
      ui.box.querySelector('div').innerHTML = `<p>Donne ce code à ton coéquipier :</p><p class="hand" style="font-size:3em;text-align:center;letter-spacing:.15em">${code}</p><p>En attente qu'il rejoigne la partie… Tu seras le ${ROLES.tech.icon} <strong>${ROLES.tech.name}</strong>.</p>`;
    } catch (e) {
      ui.feedback(e.message);
    }
  }

  joinDuo(name) {
    openDialog({
      title: 'Rejoindre une partie',
      body: `<p>Tape le code affiché chez ton coéquipier. Tu seras l'${ROLES.enq.icon} <strong>${ROLES.enq.name}</strong>.</p>`,
      input: { placeholder: 'Code (5 lettres)', maxLength: 5 },
      submitLabel: 'Rejoindre',
      onClose: () => !net.online && leave(),
      onSubmit: (code, ui) => {
        if (code.length !== 5) return ui.feedback('Le code fait 5 caractères.');
        ui.feedback('Connexion…', 'ok');
        net.events.off('error');
        net.events.on('error', (msg) => ui.feedback(msg));
        this.waitForStart();
        joinGame(code, name);
      },
    });
  }

  // ---------- Skin de l'élève ----------
  chooseSkin() {
    const skin = loadSkin();
    const wrap = document.createElement('div');
    const preview = document.createElement('canvas');
    preview.className = 'skin-preview';
    preview.setAttribute('role', 'img');
    preview.setAttribute('aria-label', 'Aperçu de ton élève');
    wrap.appendChild(preview);
    const redraw = () => drawPreview(preview, paletteFromSkin(skin));

    for (const opt of SKIN_OPTIONS) {
      const row = document.createElement('div');
      row.className = 'skin-row';
      row.innerHTML = `<span>${opt.label}</span>`;
      for (const [id, val] of opt.choices) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = typeof val === 'number' ? 'swatch' : 'swatch text';
        if (typeof val === 'number') b.style.background = `#${val.toString(16).padStart(6, '0')}`;
        else b.textContent = val;
        b.title = id;
        b.setAttribute('aria-label', `${opt.label} : ${id}`);
        b.setAttribute('aria-pressed', String(skin[opt.key] === id));
        b.addEventListener('click', () => {
          skin[opt.key] = id;
          row.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          redraw();
        });
        row.appendChild(b);
      }
      wrap.appendChild(row);
    }
    redraw();

    const random = () => {
      for (const opt of SKIN_OPTIONS) skin[opt.key] = opt.choices[Math.floor(Math.random() * opt.choices.length)][0];
      wrap.querySelectorAll('.skin-row').forEach((row, i) => {
        row.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.title === skin[SKIN_OPTIONS[i].key])));
      });
      redraw();
    };

    openDialog({
      title: 'Mon élève',
      body: wrap,
      buttons: [
        {
          label: 'Enregistrer',
          primary: true,
          onClick: () => {
            saveSkin(skin);
            createCharacter(this, 'player', paletteFromSkin(skin), true);
            closeDialog();
            this.scene.restart();
          },
        },
        { label: '🎲 Au hasard', onClick: random },
      ],
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
