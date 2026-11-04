// Identité visuelle "école la nuit" : couleurs, polices et petits composants réutilisés par toutes les scènes.
import { sfx } from '../audio/sound.js'; // on récupère les bruitages du jeu

export const C = { // liste des couleurs du jeu (codes couleur)
  ink: 0x1f2a44, // encre / texte foncé
  chalk: 0xf3f1e7, // craie
  board: 0x2f5d46, // tableau noir (vert)
  boardDark: 0x24493a, // vert foncé du tableau
  wood: 0xa0764a, // couleur du bois
  woodDark: 0x6b4a2c, // bois foncé
  paper: 0xfdfaf1, // couleur du papier
  red: 0xc0392b, // rouge
  blue: 0x2d6cdf, // bleu
  green: 0x2e9e5b, // vert
  yellow: 0xf5c84c, // jaune
  wall: 0xd9cfb8, // couleur des murs
  wainscot: 0x7fa08c, // bas des murs (lambris)
  floorA: 0x8f8574, // carrelage du sol, case claire
  floorB: 0x857b6a, // carrelage du sol, case foncée
  night: 0x0b1230, // bleu de la nuit
  steel: 0x7d8590, // gris métal
  muted: 0x9aa3b5, // gris bleuté discret
};

export const FONT_TITLE = '"Permanent Marker", "Comic Sans MS", cursive'; // police des titres (style feutre)
export const FONT_BODY = 'Nunito, "Segoe UI", sans-serif'; // police du texte normal
export const FONT_HAND = 'Caveat, "Comic Sans MS", cursive'; // police écriture à la main

export const hex = (c) => `#${c.toString(16).padStart(6, '0')}`; // transforme un code couleur en texte « #rrggbb »

/** Texte avec les polices du thème ; `shadow` ajoute une ombre portée pour la lisibilité. */
// fonction qui écrit un texte à l'écran
export function txt(scene, x, y, str, { size = 16, color = C.ink, font = FONT_BODY, weight = '400', shadow = false, ...rest } = {}) {
  // marge pour l'ombre, et pour l'écriture manuscrite dont les lettres débordent un peu
  let padding = rest.padding; // on prend la marge donnée, s'il y en a une
  if (!padding && (shadow || font === FONT_HAND)) padding = { x: 6, y: 3 }; // sinon, petite marge si ombre ou écriture à la main
  // on crée le texte avec la police, la taille et la couleur
  const t = scene.add.text(x, y, str, { fontFamily: font, fontSize: `${size}px`, fontStyle: weight, color: hex(color), ...rest, padding });
  if (shadow) t.setShadow(2, 2, 'rgba(0,0,0,0.65)', 0, false, true); // si demandé, on ajoute une ombre noire
  return t; // on rend le texte créé
}

/** Fond "tableau noir" avec cadre en bois et traces de craie. */
export function drawChalkboard(scene, x, y, w, h) { // fonction qui dessine un tableau noir
  const g = scene.add.graphics(); // on prend un « crayon » pour dessiner
  g.fillStyle(C.woodDark).fillRect(x, y, w, h); // on peint le cadre en bois
  g.fillStyle(C.board).fillRect(x + 14, y + 14, w - 28, h - 28); // on peint le tableau vert à l'intérieur
  // traces de craie effacée
  for (let i = 0; i < 40; i++) { // on répète 40 fois
    g.fillStyle(0xffffff, 0.02 + Math.random() * 0.03); // blanc presque transparent, un peu au hasard
    // on dessine une tache ovale au hasard
    g.fillEllipse(x + 30 + Math.random() * (w - 60), y + 30 + Math.random() * (h - 60), 80 + Math.random() * 160, 20 + Math.random() * 40);
  }
  // rebord pour les craies
  g.fillStyle(C.wood).fillRect(x, y + h - 14, w, 14); // on peint le rebord en bois en bas
  g.fillStyle(0xffffff).fillRect(x + 80, y + h - 18, 22, 5); // une craie blanche sur le rebord
  g.fillStyle(C.yellow).fillRect(x + 112, y + h - 18, 16, 5); // une craie jaune sur le rebord
  return g; // on rend le dessin
}

/** Bouton écrit à la craie, entouré d'un cadre ; il jaunit au survol. */
// fonction qui crée un bouton style craie
export function chalkButton(scene, x, y, label, onClick, { width = 340, height = 52, size = 26 } = {}) {
  const g = scene.add.graphics(); // on prend un « crayon » pour le cadre
  const t = txt(scene, 0, 0, label, { size, font: FONT_TITLE, color: C.chalk }).setOrigin(0.5); // on écrit le texte du bouton, centré
  const draw = (hover) => { // petite fonction qui dessine le bouton
    g.clear(); // on efface l'ancien dessin
    // on trace le cadre, jaune si la souris est dessus
    g.lineStyle(2, hover ? C.yellow : C.chalk, hover ? 1 : 0.7).strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    t.setColor(hex(hover ? C.yellow : C.chalk)); // le texte devient jaune si la souris est dessus
  };
  draw(false); // on dessine le bouton une première fois
  // on regroupe cadre et texte, et on le rend cliquable
  const c = scene.add.container(x, y, [g, t]).setSize(width, height).setInteractive({ useHandCursor: true });
  c.on('pointerover', () => draw(true)); // souris dessus : le bouton devient jaune
  c.on('pointerout', () => draw(false)); // souris partie : le bouton redevient blanc
  c.on('pointerdown', () => { // quand on clique sur le bouton
    sfx.click(); // on joue le bruit de clic
    onClick(); // on lance l'action du bouton
  });
  return c; // on rend le bouton
}

/** Halo de lumière (texture 'light' générée au démarrage). */
export function addLight(scene, x, y, color, { scale = 1, alpha = 0.3 } = {}) { // fonction qui ajoute un halo de lumière
  // on pose l'image de lumière, colorée et transparente
  return scene.add.image(x, y, 'light').setTint(color).setAlpha(alpha).setScale(scale).setBlendMode('ADD');
}

/** Voile bleu nuit posé sur la scène (les lumières passent par-dessus). */
export function nightOverlay(scene, alpha = 0.38) { // fonction qui assombrit l'écran en bleu nuit
  const { width, height } = scene.scale; // on récupère la taille de l'écran
  // on pose un rectangle bleu transparent par-dessus tout
  return scene.add.rectangle(0, 0, width, height, C.night, alpha).setOrigin(0).setDepth(700);
}
