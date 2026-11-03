// Personnages en pixel art, dessinés en code (aucune image externe).
// Chaque frame est une grille de 16 × 24 "pixels" ; un contour sombre est ajouté automatiquement.
// 3 directions (face, dos, profil) × 3 poses (immobile, pas gauche, pas droit).

const W = 16;
const H = 24;
const PX = 2; // 1 pixel de la grille = 2 pixels à l'écran
export const FRAME_W = W * PX;
export const FRAME_H = H * PX;

// L'élève : sweat rouge, jean, baskets blanches
export const PLAYER_PALETTE = {
  hair: 0x4a2f1f,
  hairLight: 0x7a5236,
  skin: 0xf2c4a0,
  skinShadow: 0xcf9878,
  eyes: 0x1a1414,
  jacket: 0xc8423b,
  jacketShadow: 0x92302b,
  detail: 0xf2e6d8, // cordons et poignets du sweat
  pants: 0x3b5b8c,
  shoes: 0xf4f4f4,
  sole: 0x9a9a9a,
  outline: 0x1b1420,
};

// Le coéquipier (partie à 2) : sweat vert, cheveux blonds
export const MATE_PALETTE = {
  ...PLAYER_PALETTE,
  hair: 0xc99a3e,
  hairLight: 0xe8c46a,
  jacket: 0x3f8f5a,
  jacketShadow: 0x2c6a41,
  pants: 0x4a4a52,
};

// Le gardien de nuit : casquette et uniforme bleu marine, insigne doré
export const GUARD_PALETTE = {
  hair: 0x1f2a4d,
  hairLight: 0x35467a,
  skin: 0xd9a77f,
  skinShadow: 0xb0825f,
  eyes: 0x111111,
  jacket: 0x2b3a67,
  jacketShadow: 0x1f2a4d,
  detail: 0xe8c547,
  pants: 0x232a3d,
  shoes: 0x151515,
  sole: 0x333333,
  outline: 0x0c0c14,
};

const shade = (c, f) => {
  const r = Math.round(((c >> 16) & 255) * f);
  const g = Math.round(((c >> 8) & 255) * f);
  const b = Math.round((c & 255) * f);
  return (r << 16) | (g << 8) | b;
};

const emptyGrid = () => Array.from({ length: H }, () => Array(W).fill(null));

function fill(g, x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < H && i >= 0 && i < W) g[j][i] = c;
}

// ---------- Face / dos ----------
function legsFront(g, p, step) {
  const lUp = step === 1 ? 1 : 0; // la jambe levée est plus courte d'un pixel
  const rUp = step === 2 ? 1 : 0;
  fill(g, 5, 16, 2, 4 - lUp, p.pants);
  fill(g, 4, 20 - lUp, 3, 1, p.shoes);
  fill(g, 4, 21 - lUp, 3, 1, p.sole);
  fill(g, 9, 16, 2, 4 - rUp, p.pants);
  fill(g, 9, 20 - rUp, 3, 1, p.shoes);
  fill(g, 9, 21 - rUp, 3, 1, p.sole);
}

function armsFront(g, p, step) {
  // les bras se balancent à l'opposé des jambes
  const aL = step === 2 ? -1 : 0;
  const aR = step === 1 ? -1 : 0;
  for (const [x, a] of [[2, aL], [12, aR]]) {
    fill(g, x, 12 + a, 2, 4, p.jacketShadow);
    fill(g, x, 15 + a, 2, 1, p.detail);
    fill(g, x, 16 + a, 2, 1, p.skin);
  }
}

function drawFront(g, p, step) {
  legsFront(g, p, step);
  armsFront(g, p, step);
  fill(g, 4, 11, 8, 6, p.jacket);
  fill(g, 4, 16, 8, 1, p.jacketShadow);
  fill(g, 5, 14, 6, 2, p.jacketShadow); // poche ventrale
  fill(g, 6, 11, 1, 3, p.detail); // cordons de la capuche
  fill(g, 9, 11, 1, 3, p.detail);
  fill(g, 7, 10, 2, 1, p.skinShadow); // cou
  // tête
  fill(g, 4, 2, 8, 8, p.skin);
  fill(g, 4, 9, 8, 1, p.skinShadow);
  fill(g, 3, 1, 10, 3, p.hair);
  fill(g, 3, 4, 1, 4, p.hair);
  fill(g, 12, 4, 1, 4, p.hair);
  fill(g, 5, 1, 3, 1, p.hairLight);
  fill(g, 4, 4, 2, 1, p.hair);
  fill(g, 9, 4, 3, 1, p.hair);
  fill(g, 5, 6, 2, 2, p.eyes); // yeux
  fill(g, 9, 6, 2, 2, p.eyes);
  fill(g, 5, 6, 1, 1, 0xffffff); // reflets
  fill(g, 9, 6, 1, 1, 0xffffff);
  fill(g, 7, 8, 2, 1, p.skinShadow); // bouche
}

function drawBack(g, p, step) {
  legsFront(g, p, step);
  armsFront(g, p, step);
  fill(g, 4, 11, 8, 6, p.jacket);
  fill(g, 4, 16, 8, 1, p.jacketShadow);
  fill(g, 5, 11, 6, 3, p.jacketShadow); // capuche
  fill(g, 7, 10, 2, 1, p.skinShadow);
  fill(g, 3, 1, 10, 9, p.hair);
  fill(g, 5, 1, 4, 1, p.hairLight);
}

// ---------- Profil (vers la droite ; la gauche = miroir) ----------
function drawSide(g, p, step) {
  if (step === 0) {
    fill(g, 6, 16, 4, 4, p.pants);
    fill(g, 6, 20, 5, 1, p.shoes);
    fill(g, 6, 21, 5, 1, p.sole);
  } else {
    // jambe avant / arrière ; la plus proche est plus claire
    const near = step === 1 ? 9 : 4;
    const far = step === 1 ? 4 : 9;
    fill(g, far, 16, 3, 4, shade(p.pants, 0.65));
    fill(g, far, 20, 3, 1, shade(p.shoes, 0.7));
    fill(g, far, 21, 3, 1, p.sole);
    fill(g, near, 16, 3, 4, p.pants);
    fill(g, near, 20, 4, 1, p.shoes);
    fill(g, near, 21, 4, 1, p.sole);
  }
  fill(g, 3, 11, 2, 5, p.jacketShadow); // sac à dos
  fill(g, 3, 12, 2, 1, p.detail);
  fill(g, 5, 11, 6, 6, p.jacket);
  fill(g, 5, 16, 6, 1, p.jacketShadow);
  const ax = step === 1 ? 6 : step === 2 ? 9 : 7;
  fill(g, ax, 12, 2, 4, p.jacketShadow);
  fill(g, ax, 15, 2, 1, p.detail);
  fill(g, ax, 16, 2, 1, p.skin);
  fill(g, 7, 10, 2, 1, p.skinShadow);
  fill(g, 5, 2, 7, 8, p.skin);
  fill(g, 5, 9, 7, 1, p.skinShadow);
  fill(g, 4, 1, 7, 3, p.hair);
  fill(g, 4, 4, 3, 5, p.hair);
  fill(g, 6, 1, 3, 1, p.hairLight);
  fill(g, 10, 6, 1, 2, p.eyes);
  fill(g, 12, 6, 1, 1, p.skin); // nez
  fill(g, 10, 8, 1, 1, p.skinShadow);
}

/** Ajoute un contour d'un pixel autour du personnage. */
function withOutline(g, color) {
  const out = emptyGrid();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (g[y][x] !== null) {
        out[y][x] = g[y][x];
        continue;
      }
      const neighbours = [g[y - 1]?.[x], g[y + 1]?.[x], g[y][x - 1], g[y][x + 1]];
      if (neighbours.some((n) => n !== null && n !== undefined)) out[y][x] = color;
    }
  }
  return out;
}

const DRAWERS = { down: drawFront, up: drawBack, side: drawSide };
const FRAMES = ['down', 'up', 'side'].flatMap((dir) => [0, 1, 2].map((step) => [dir, step]));

/** Crée la feuille de sprites `key` et ses animations `key-down`, `key-up`, `key-side`. */
export function createCharacter(scene, key, palette) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, FRAME_W * FRAMES.length, FRAME_H);
  const ctx = tex.getContext();

  FRAMES.forEach(([dir, step], i) => {
    const g = emptyGrid();
    DRAWERS[dir](g, palette, step);
    const pixels = withOutline(g, palette.outline);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (pixels[y][x] === null) continue;
        ctx.fillStyle = `#${pixels[y][x].toString(16).padStart(6, '0')}`;
        ctx.fillRect(i * FRAME_W + x * PX, y * PX, PX, PX);
      }
    }
    tex.add(`${dir}${step}`, 0, i * FRAME_W, 0, FRAME_W, FRAME_H);
  });
  tex.refresh();
  tex.setFilter(1); // 1 = NEAREST : pixels nets quand on agrandit le sprite

  for (const dir of ['down', 'up', 'side']) {
    scene.anims.create({
      key: `${key}-${dir}`,
      frames: [0, 1, 0, 2].map((s) => ({ key, frame: `${dir}${s}` })),
      frameRate: 8,
      repeat: -1,
    });
  }
}

/** Choisit l'animation selon la vitesse (vx, vy) ; immobile → pose de repos. */
export function animateWalk(sprite, key, vx, vy) {
  if (Math.abs(vx) < 1 && Math.abs(vy) < 1) {
    sprite.anims.stop();
    sprite.setFrame(`${sprite.facing || 'down'}0`);
    return;
  }
  let dir;
  if (Math.abs(vx) > Math.abs(vy)) {
    dir = 'side';
    sprite.setFlipX(vx < 0);
  } else {
    dir = vy < 0 ? 'up' : 'down';
  }
  sprite.facing = dir;
  sprite.anims.play(`${key}-${dir}`, true);
}
