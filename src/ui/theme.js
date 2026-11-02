// Identité visuelle "école la nuit" : couleurs, polices et petits composants réutilisés par toutes les scènes.

export const C = {
  ink: 0x1f2a44, // encre / texte foncé
  chalk: 0xf3f1e7, // craie
  board: 0x2f5d46, // tableau noir (vert)
  boardDark: 0x24493a,
  wood: 0xa0764a,
  woodDark: 0x6b4a2c,
  paper: 0xfdfaf1,
  red: 0xc0392b,
  blue: 0x2d6cdf,
  green: 0x2e9e5b,
  yellow: 0xf5c84c,
  wall: 0xd9cfb8,
  wainscot: 0x7fa08c,
  floorA: 0x8f8574,
  floorB: 0x857b6a,
  night: 0x0b1230,
  steel: 0x7d8590,
  muted: 0x9aa3b5,
};

export const FONT_TITLE = '"Permanent Marker", "Comic Sans MS", cursive';
export const FONT_BODY = 'Nunito, "Segoe UI", sans-serif';
export const FONT_HAND = 'Caveat, "Comic Sans MS", cursive';

export const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;

/** Texte avec les polices du thème ; `shadow` ajoute une ombre portée pour la lisibilité. */
export function txt(scene, x, y, str, { size = 16, color = C.ink, font = FONT_BODY, weight = '400', shadow = false, ...rest } = {}) {
  // marge pour l'ombre, et pour l'écriture manuscrite dont les lettres débordent un peu
  let padding = rest.padding;
  if (!padding && (shadow || font === FONT_HAND)) padding = { x: 6, y: 3 };
  const t = scene.add.text(x, y, str, { fontFamily: font, fontSize: `${size}px`, fontStyle: weight, color: hex(color), ...rest, padding });
  if (shadow) t.setShadow(2, 2, 'rgba(0,0,0,0.65)', 0, false, true);
  return t;
}

/** Fond "tableau noir" avec cadre en bois et traces de craie. */
export function drawChalkboard(scene, x, y, w, h) {
  const g = scene.add.graphics();
  g.fillStyle(C.woodDark).fillRect(x, y, w, h);
  g.fillStyle(C.board).fillRect(x + 14, y + 14, w - 28, h - 28);
  // traces de craie effacée
  for (let i = 0; i < 40; i++) {
    g.fillStyle(0xffffff, 0.02 + Math.random() * 0.03);
    g.fillEllipse(x + 30 + Math.random() * (w - 60), y + 30 + Math.random() * (h - 60), 80 + Math.random() * 160, 20 + Math.random() * 40);
  }
  // rebord pour les craies
  g.fillStyle(C.wood).fillRect(x, y + h - 14, w, 14);
  g.fillStyle(0xffffff).fillRect(x + 80, y + h - 18, 22, 5);
  g.fillStyle(C.yellow).fillRect(x + 112, y + h - 18, 16, 5);
  return g;
}

/** Bouton écrit à la craie, entouré d'un cadre ; il jaunit au survol. */
export function chalkButton(scene, x, y, label, onClick, { width = 340, height = 52, size = 26 } = {}) {
  const g = scene.add.graphics();
  const t = txt(scene, 0, 0, label, { size, font: FONT_TITLE, color: C.chalk }).setOrigin(0.5);
  const draw = (hover) => {
    g.clear();
    g.lineStyle(2, hover ? C.yellow : C.chalk, hover ? 1 : 0.7).strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    t.setColor(hex(hover ? C.yellow : C.chalk));
  };
  draw(false);
  const c = scene.add.container(x, y, [g, t]).setSize(width, height).setInteractive({ useHandCursor: true });
  c.on('pointerover', () => draw(true));
  c.on('pointerout', () => draw(false));
  c.on('pointerdown', onClick);
  return c;
}

/** Halo de lumière (texture 'light' générée au démarrage). */
export function addLight(scene, x, y, color, { scale = 1, alpha = 0.3 } = {}) {
  return scene.add.image(x, y, 'light').setTint(color).setAlpha(alpha).setScale(scale).setBlendMode('ADD');
}

/** Voile bleu nuit posé sur la scène (les lumières passent par-dessus). */
export function nightOverlay(scene, alpha = 0.38) {
  const { width, height } = scene.scale;
  return scene.add.rectangle(0, 0, width, height, C.night, alpha).setOrigin(0).setDepth(700);
}
