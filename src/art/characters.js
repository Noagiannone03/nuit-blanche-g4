// Personnages en pixel art, dessinés en code (aucune image externe).
// Chaque frame est une grille de 16 × 24 "pixels" ; un contour sombre est ajouté automatiquement.
// 3 directions (face, dos, profil) × 3 poses (immobile, pas gauche, pas droit).

const W = 16; // largeur du personnage : 16 cases
const H = 24; // hauteur du personnage : 24 cases
const PX = 2; // 1 pixel de la grille = 2 pixels à l'écran
export const FRAME_W = W * PX; // largeur d'une image à l'écran
export const FRAME_H = H * PX; // hauteur d'une image à l'écran

// L'élève : sweat rouge, jean, baskets blanches
export const PLAYER_PALETTE = { // couleurs de l'élève
  hair: 0x4a2f1f, // couleur des cheveux
  hairLight: 0x7a5236, // reflet des cheveux
  skin: 0xf2c4a0, // couleur de la peau
  skinShadow: 0xcf9878, // ombre de la peau
  eyes: 0x1a1414, // couleur des yeux
  jacket: 0xc8423b, // couleur du sweat
  jacketShadow: 0x92302b, // ombre du sweat
  detail: 0xf2e6d8, // cordons et poignets du sweat
  pants: 0x3b5b8c, // couleur du pantalon
  shoes: 0xf4f4f4, // couleur des baskets
  sole: 0x9a9a9a, // couleur des semelles
  outline: 0x1b1420, // couleur du contour
};

// Le gardien de nuit : casquette et uniforme bleu marine, insigne doré
export const GUARD_PALETTE = { // couleurs du gardien
  hair: 0x1f2a4d, // couleur de la casquette (cheveux)
  hairLight: 0x35467a, // reflet de la casquette
  skin: 0xd9a77f, // couleur de la peau
  skinShadow: 0xb0825f, // ombre de la peau
  eyes: 0x111111, // couleur des yeux
  jacket: 0x2b3a67, // couleur de l'uniforme
  jacketShadow: 0x1f2a4d, // ombre de l'uniforme
  detail: 0xe8c547, // couleur de l'insigne doré
  pants: 0x232a3d, // couleur du pantalon
  shoes: 0x151515, // couleur des chaussures
  sole: 0x333333, // couleur des semelles
  outline: 0x0c0c14, // couleur du contour
};

export const shade = (c, f) => { // fonction qui assombrit une couleur (f = force)
  const r = Math.round(((c >> 16) & 255) * f); // on assombrit la part de rouge
  const g = Math.round(((c >> 8) & 255) * f); // on assombrit la part de vert
  const b = Math.round((c & 255) * f); // on assombrit la part de bleu
  return (r << 16) | (g << 8) | b; // on recolle les trois parts en une couleur
};

const emptyGrid = () => Array.from({ length: H }, () => Array(W).fill(null)); // crée une grille vide de 16 × 24 cases

function fill(g, x, y, w, h, c) { // fonction qui colorie un rectangle de cases
  // chaque case du rectangle (dans la grille) prend la couleur c
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < H && i >= 0 && i < W) g[j][i] = c;
}

// ---------- Face / dos ----------
function legsFront(g, p, step) { // fonction qui dessine les jambes (de face)
  const lUp = step === 1 ? 1 : 0; // la jambe levée est plus courte d'un pixel
  const rUp = step === 2 ? 1 : 0; // la jambe droite levée ?
  fill(g, 5, 16, 2, 4 - lUp, p.pants); // jambe gauche (pantalon)
  fill(g, 4, 20 - lUp, 3, 1, p.shoes); // basket gauche
  fill(g, 4, 21 - lUp, 3, 1, p.sole); // semelle gauche
  fill(g, 9, 16, 2, 4 - rUp, p.pants); // jambe droite (pantalon)
  fill(g, 9, 20 - rUp, 3, 1, p.shoes); // basket droite
  fill(g, 9, 21 - rUp, 3, 1, p.sole); // semelle droite
}

function armsFront(g, p, step) { // fonction qui dessine les bras (de face)
  // les bras se balancent à l'opposé des jambes
  const aL = step === 2 ? -1 : 0; // bras gauche levé si pas droit
  const aR = step === 1 ? -1 : 0; // bras droit levé si pas gauche
  for (const [x, a] of [[2, aL], [12, aR]]) { // pour le bras gauche puis le bras droit
    fill(g, x, 12 + a, 2, 4, p.jacketShadow); // on dessine la manche
    fill(g, x, 15 + a, 2, 1, p.detail); // on dessine le poignet
    fill(g, x, 16 + a, 2, 1, p.skin); // on dessine la main
  }
}

function drawFront(g, p, step) { // fonction qui dessine le personnage de face
  legsFront(g, p, step); // on dessine les jambes
  armsFront(g, p, step); // on dessine les bras
  fill(g, 4, 11, 8, 6, p.jacket); // on dessine le corps du sweat
  fill(g, 4, 16, 8, 1, p.jacketShadow); // ombre en bas du sweat
  fill(g, 5, 14, 6, 2, p.jacketShadow); // poche ventrale
  fill(g, 6, 11, 1, 3, p.detail); // cordons de la capuche
  fill(g, 9, 11, 1, 3, p.detail); // deuxième cordon
  fill(g, 7, 10, 2, 1, p.skinShadow); // cou
  // tête
  fill(g, 4, 2, 8, 8, p.skin); // on dessine le visage
  fill(g, 4, 9, 8, 1, p.skinShadow); // ombre sous le menton
  fill(g, 3, 1, 10, 3, p.hair); // cheveux sur le haut de la tête
  fill(g, 3, 4, 1, 4, p.hair); // mèche sur le côté gauche
  fill(g, 12, 4, 1, 4, p.hair); // mèche sur le côté droit
  fill(g, 5, 1, 3, 1, p.hairLight); // reflet dans les cheveux
  fill(g, 4, 4, 2, 1, p.hair); // frange à gauche
  fill(g, 9, 4, 3, 1, p.hair); // frange à droite
  fill(g, 5, 6, 2, 2, p.eyes); // yeux
  fill(g, 9, 6, 2, 2, p.eyes); // œil droit
  fill(g, 5, 6, 1, 1, 0xffffff); // reflets
  fill(g, 9, 6, 1, 1, 0xffffff); // reflet de l'œil droit
  fill(g, 7, 8, 2, 1, p.skinShadow); // bouche
  if (p.style === 'long') { // si les cheveux sont longs
    fill(g, 2, 3, 2, 9, p.hair); // cheveux longs à gauche
    fill(g, 12, 3, 2, 9, p.hair); // cheveux longs à droite
  } else if (p.style === 'bonnet') { // sinon, si c'est un bonnet
    fill(g, 3, 0, 10, 3, p.jacketShadow); // on dessine le bonnet
    fill(g, 3, 3, 10, 1, p.detail); // on dessine le bord du bonnet
  }
}

function drawBack(g, p, step) { // fonction qui dessine le personnage de dos
  legsFront(g, p, step); // on dessine les jambes
  armsFront(g, p, step); // on dessine les bras
  fill(g, 4, 11, 8, 6, p.jacket); // on dessine le corps du sweat
  fill(g, 4, 16, 8, 1, p.jacketShadow); // ombre en bas du sweat
  fill(g, 5, 11, 6, 3, p.jacketShadow); // capuche
  fill(g, 7, 10, 2, 1, p.skinShadow); // on dessine le cou
  fill(g, 3, 1, 10, 9, p.hair); // on dessine l'arrière des cheveux
  fill(g, 5, 1, 4, 1, p.hairLight); // reflet dans les cheveux
  if (p.style === 'long') fill(g, 2, 3, 12, 9, p.hair); // cheveux longs : on les dessine plus grands
  else if (p.style === 'bonnet') { // sinon, si c'est un bonnet
    fill(g, 3, 0, 10, 4, p.jacketShadow); // on dessine le bonnet
    fill(g, 3, 4, 10, 1, p.detail); // on dessine le bord du bonnet
  }
}

// ---------- Profil (vers la droite ; la gauche = miroir) ----------
function drawSide(g, p, step) { // fonction qui dessine le personnage de profil
  if (step === 0) { // si le personnage ne marche pas
    fill(g, 6, 16, 4, 4, p.pants); // on dessine les jambes
    fill(g, 6, 20, 5, 1, p.shoes); // on dessine la basket
    fill(g, 6, 21, 5, 1, p.sole); // on dessine la semelle
  } else { // sinon (il marche)
    // jambe avant / arrière ; la plus proche est plus claire
    const near = step === 1 ? 9 : 4; // place de la jambe proche
    const far = step === 1 ? 4 : 9; // place de la jambe lointaine
    fill(g, far, 16, 3, 4, shade(p.pants, 0.65)); // jambe lointaine, plus sombre
    fill(g, far, 20, 3, 1, shade(p.shoes, 0.7)); // basket lointaine, plus sombre
    fill(g, far, 21, 3, 1, p.sole); // semelle lointaine
    fill(g, near, 16, 3, 4, p.pants); // jambe proche
    fill(g, near, 20, 4, 1, p.shoes); // basket proche
    fill(g, near, 21, 4, 1, p.sole); // semelle proche
  }
  fill(g, 3, 11, 2, 5, p.jacketShadow); // sac à dos
  fill(g, 3, 12, 2, 1, p.detail); // bretelle du sac
  fill(g, 5, 11, 6, 6, p.jacket); // corps du sweat
  fill(g, 5, 16, 6, 1, p.jacketShadow); // ombre en bas du sweat
  const ax = step === 1 ? 6 : step === 2 ? 9 : 7; // place du bras selon le pas
  fill(g, ax, 12, 2, 4, p.jacketShadow); // on dessine la manche
  fill(g, ax, 15, 2, 1, p.detail); // on dessine le poignet
  fill(g, ax, 16, 2, 1, p.skin); // on dessine la main
  fill(g, 7, 10, 2, 1, p.skinShadow); // on dessine le cou
  fill(g, 5, 2, 7, 8, p.skin); // on dessine le visage
  fill(g, 5, 9, 7, 1, p.skinShadow); // ombre sous le menton
  fill(g, 4, 1, 7, 3, p.hair); // cheveux sur le haut de la tête
  fill(g, 4, 4, 3, 5, p.hair); // cheveux à l'arrière de la tête
  fill(g, 6, 1, 3, 1, p.hairLight); // reflet dans les cheveux
  fill(g, 10, 6, 1, 2, p.eyes); // on dessine l'œil
  fill(g, 12, 6, 1, 1, p.skin); // nez
  fill(g, 10, 8, 1, 1, p.skinShadow); // on dessine la bouche
  if (p.style === 'long') fill(g, 3, 3, 4, 9, p.hair); // cheveux longs : on les dessine dans le dos
  else if (p.style === 'bonnet') { // sinon, si c'est un bonnet
    fill(g, 4, 0, 8, 3, p.jacketShadow); // on dessine le bonnet
    fill(g, 4, 3, 8, 1, p.detail); // on dessine le bord du bonnet
  }
}

/** Ajoute un contour d'un pixel autour du personnage. */
function withOutline(g, color) { // fonction qui ajoute un contour
  const out = emptyGrid(); // on prépare une grille vide
  for (let y = 0; y < H; y++) { // pour chaque ligne de la grille
    for (let x = 0; x < W; x++) { // pour chaque case de la ligne
      if (g[y][x] !== null) { // si la case est déjà coloriée
        out[y][x] = g[y][x]; // on la recopie telle quelle
        continue; // on passe à la case suivante
      }
      const neighbours = [g[y - 1]?.[x], g[y + 1]?.[x], g[y][x - 1], g[y][x + 1]]; // on regarde les 4 cases voisines
      // si une voisine est coloriée, cette case devient contour
      if (neighbours.some((n) => n !== null && n !== undefined)) out[y][x] = color;
    }
  }
  return out; // on rend la grille avec le contour
}

const DRAWERS = { down: drawFront, up: drawBack, side: drawSide }; // quelle fonction dessine quelle direction
const FRAMES = ['down', 'up', 'side'].flatMap((dir) => [0, 1, 2].map((step) => [dir, step])); // liste des 9 images : 3 directions × 3 poses

/** Dessine une pose du personnage sur un canvas 2D, à l'échelle `scale`. */
function paintFrame(ctx, palette, dir, step, ox, scale) { // fonction qui peint une pose à l'écran
  const g = emptyGrid(); // on prépare une grille vide
  DRAWERS[dir](g, palette, step); // on dessine la pose dans la grille
  const pixels = withOutline(g, palette.outline); // on ajoute le contour
  for (let y = 0; y < H; y++) { // pour chaque ligne de la grille
    for (let x = 0; x < W; x++) { // pour chaque case de la ligne
      if (pixels[y][x] === null) continue; // case vide : on passe à la suivante
      ctx.fillStyle = `#${pixels[y][x].toString(16).padStart(6, '0')}`; // on choisit la couleur de la case
      ctx.fillRect(ox + x * scale, y * scale, scale, scale); // on peint un carré à l'écran
    }
  }
}

/** Aperçu de face, de profil et de dos (choix du skin dans le menu). */
export function drawPreview(canvas, palette, scale = 5) { // fonction qui montre l'aperçu du personnage dans le menu
  canvas.width = W * scale * 3 + scale * 8; // largeur de la zone de dessin
  canvas.height = H * scale; // hauteur de la zone de dessin
  const ctx = canvas.getContext('2d'); // on prend le « pinceau » de la zone de dessin
  // on peint face, profil et dos, côte à côte
  ['down', 'side', 'up'].forEach((dir, i) => paintFrame(ctx, palette, dir, 0, i * (W + 4) * scale, scale));
}

/**
 * Crée la feuille de sprites `key` et ses animations `key-down`, `key-up`, `key-side`.
 * force : la recrée (changement de skin).
 */
export function createCharacter(scene, key, palette, force = false) { // fonction qui fabrique les images du personnage
  if (scene.textures.exists(key)) { // si les images existent déjà
    if (!force) return; // pas obligé de les refaire : on arrête
    for (const dir of ['down', 'up', 'side']) scene.anims.remove(`${key}-${dir}`); // on supprime les anciennes animations
    scene.textures.remove(key); // on supprime les anciennes images
  }
  const tex = scene.textures.createCanvas(key, FRAME_W * FRAMES.length, FRAME_H); // on crée une grande image vide pour les 9 poses
  const ctx = tex.getContext(); // on prend le « pinceau » de cette image

  FRAMES.forEach(([dir, step], i) => { // pour chacune des 9 poses
    paintFrame(ctx, palette, dir, step, i * FRAME_W, PX); // on peint la pose à sa place
    tex.add(`${dir}${step}`, 0, i * FRAME_W, 0, FRAME_W, FRAME_H); // on donne un nom à cette pose
  });
  tex.refresh(); // on met à jour l'image
  tex.setFilter(1); // 1 = NEAREST : pixels nets quand on agrandit le sprite

  for (const dir of ['down', 'up', 'side']) { // pour chaque direction
    scene.anims.create({ // on crée une animation de marche
      key: `${key}-${dir}`, // nom de l'animation
      frames: [0, 1, 0, 2].map((s) => ({ key, frame: `${dir}${s}` })), // ordre des poses : repos, pas, repos, autre pas
      frameRate: 8, // 8 images par seconde
      repeat: -1, // -1 = se répète sans fin
    });
  }
}

/** Choisit l'animation selon la vitesse (vx, vy) ; immobile → pose de repos. */
export function animateWalk(sprite, key, vx, vy) { // fonction qui choisit l'animation de marche
  if (Math.abs(vx) < 1 && Math.abs(vy) < 1) { // si le personnage ne bouge presque pas
    sprite.anims.stop(); // on arrête l'animation
    sprite.setFrame(`${sprite.facing || 'down'}0`); // on montre la pose de repos
    return; // on s'arrête là
  }
  let dir; // on prépare la direction
  if (Math.abs(vx) > Math.abs(vy)) { // s'il va plus vite à l'horizontale
    dir = 'side'; // on prend la vue de profil
    sprite.setFlipX(vx < 0); // vers la gauche : on retourne l'image (miroir)
  } else { // sinon (il va surtout en haut ou en bas)
    dir = vy < 0 ? 'up' : 'down'; // vers le haut : dos, vers le bas : face
  }
  sprite.facing = dir; // on retient la direction
  sprite.anims.play(`${key}-${dir}`, true); // on joue l'animation de cette direction
}
