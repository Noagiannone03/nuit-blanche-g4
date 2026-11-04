// Décor des salles (vue de face), dessiné en code : il remplit les murs et le sol autour des objets
// des énigmes. Rien n'est cliquable. Chaque salle liste son décor dans src/rooms/<salle>.js (champ decor).
// Attention : aucun élément jaune (on compte les post-it jaunes à Sormiou).

const BOOKS = [0xb5473c, 0x3b6ea8, 0x3f8f5a, 0x7a4fa0, 0xd0d4dc, 0x8a5a35, 0xc06a8a];

const DRAWERS = {
  // Fenêtre de nuit : lune, étoiles et lumière des lampadaires de la rue
  windowNight(g, x, y, w, h) {
    g.fillStyle(0xd8d2c4).fillRect(x - 6, y - 6, w + 12, h + 12);
    g.fillStyle(0x16203a).fillRect(x, y, w, h);
    g.fillStyle(0x24345a).fillRect(x, y + h * 0.6, w, h * 0.4);
    g.fillStyle(0xf0ead0).fillCircle(x + w * 0.72, y + h * 0.25, Math.min(w, h) * 0.1);
    g.fillStyle(0xffffff, 0.8);
    for (const [sx, sy] of [[0.15, 0.15], [0.35, 0.3], [0.5, 0.1], [0.2, 0.45], [0.9, 0.5]]) g.fillRect(x + w * sx, y + h * sy, 2, 2);
    g.fillStyle(0x0d1322).fillRect(x, y + h * 0.78, w * 0.3, h * 0.22).fillRect(x + w * 0.55, y + h * 0.7, w * 0.25, h * 0.3); // immeubles
    g.fillStyle(0xd8d2c4).fillRect(x + w / 2 - 3, y, 6, h).fillRect(x, y + h / 2 - 3, w, 6);
    g.fillStyle(0xbab3a3).fillRect(x - 10, y + h + 6, w + 20, 8); // rebord
  },

  radiator(g, x, y, w, h) {
    g.fillStyle(0xe4e2dc).fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(2, 0xb8b4aa);
    for (let fx = x + 8; fx < x + w - 4; fx += 10) g.lineBetween(fx, y + 4, fx, y + h - 4);
    g.fillStyle(0x9a968c).fillRect(x + w - 6, y + h, 4, 10);
  },

  // Affiche : bandeau de couleur + lignes de texte (le titre est écrit par RoomScene)
  poster(g, x, y, w, h, color = 0x3b6ea8) {
    g.fillStyle(0x000000, 0.15).fillRect(x + 3, y + 3, w, h);
    g.fillStyle(0xf6f1e6).fillRect(x, y, w, h);
    g.fillStyle(color).fillRect(x, y, w, h * 0.3);
    g.fillStyle(0x9aa0aa);
    for (let ly = y + h * 0.42; ly < y + h - 8; ly += 9) g.fillRect(x + 8, ly, w - 16 - ((ly * 7) % 20), 3);
    g.fillStyle(0xc9473f).fillCircle(x + w / 2, y + 4, 3); // punaise
  },

  bookshelf(g, x, y, w, h) {
    g.fillStyle(0x6b4428).fillRect(x, y, w, h);
    g.fillStyle(0x4a2f1c).fillRect(x + 5, y + 5, w - 10, h - 10);
    const shelves = Math.max(2, Math.round(h / 55));
    const sh = (h - 10) / shelves;
    for (let s = 0; s < shelves; s++) {
      const sy = y + 5 + s * sh;
      let bx = x + 7;
      let i = s * 3;
      while (bx < x + w - 14) {
        const bw = 6 + ((i * 5) % 6);
        const bh = sh - 8 - ((i * 3) % 7);
        g.fillStyle(BOOKS[i % BOOKS.length]).fillRect(bx, sy + sh - 4 - bh, bw, bh);
        bx += bw + 1;
        i += 1;
      }
      g.fillStyle(0x6b4428).fillRect(x + 5, sy + sh - 4, w - 10, 4);
    }
  },

  // Rangée de chaises vues de face (dossier + assise)
  chairs(g, x, y, w, h, color = 0x3a4a6a) {
    const n = Math.max(1, Math.floor(w / 46));
    for (let i = 0; i < n; i++) {
      const cx = x + i * (w / n) + 4;
      g.fillStyle(color).fillRoundedRect(cx, y, 34, h * 0.55, 4);
      g.fillStyle(0x20242c).fillRect(cx + 2, y + h * 0.55, 30, 5);
      g.fillStyle(0x50545c).fillRect(cx + 4, y + h * 0.55 + 5, 3, h * 0.45 - 5).fillRect(cx + 27, y + h * 0.55 + 5, 3, h * 0.45 - 5);
    }
  },

  // Table d'élève avec un écran éteint
  studentPc(g, x, y, w, h) {
    g.fillStyle(0x8a6a4a).fillRect(x, y + h * 0.45, w, 8);
    g.fillStyle(0x5e4630).fillRect(x + 6, y + h * 0.45 + 8, 5, h * 0.55 - 8).fillRect(x + w - 11, y + h * 0.45 + 8, 5, h * 0.55 - 8);
    const mw = Math.min(70, w * 0.6);
    g.fillStyle(0x15171c).fillRect(x + w / 2 - mw / 2, y, mw, h * 0.36);
    g.fillStyle(0x23262e).fillRect(x + w / 2 - mw / 2 + 4, y + 4, mw - 8, h * 0.36 - 8);
    g.fillStyle(0x15171c).fillRect(x + w / 2 - 4, y + h * 0.36, 8, h * 0.09);
    g.fillStyle(0x3a3f4a).fillRect(x + w / 2 - 22, y + h * 0.45 - 4, 44, 4); // clavier
  },

  table(g, x, y, w, h) {
    g.fillStyle(0x9a7550).fillRect(x, y, w, 10);
    g.fillStyle(0x6e5236).fillRect(x + 8, y + 10, 6, h - 10).fillRect(x + w - 14, y + 10, 6, h - 10);
  },

  plant(g, x, y, w, h) {
    g.fillStyle(0x9a5a35).fillRect(x + w * 0.2, y + h * 0.6, w * 0.6, h * 0.4);
    g.fillStyle(0x7a4528).fillRect(x + w * 0.15, y + h * 0.6, w * 0.7, 6);
    g.fillStyle(0x2f7a3a);
    g.fillEllipse(x + w * 0.5, y + h * 0.3, w * 0.5, h * 0.6);
    g.fillStyle(0x3f9a4a).fillEllipse(x + w * 0.3, y + h * 0.4, w * 0.45, h * 0.35).fillEllipse(x + w * 0.72, y + h * 0.38, w * 0.45, h * 0.35);
  },

  bin(g, x, y, w, h) {
    g.fillStyle(0x5a6270).fillRect(x, y, w, h);
    g.fillStyle(0x6c7482).fillRect(x - 2, y, w + 4, 5);
    g.fillStyle(0xf0ece2).fillCircle(x + w * 0.35, y - 2, 5).fillCircle(x + w * 0.65, y - 4, 4); // papiers froissés
  },

  coatRack(g, x, y, w, h) {
    g.fillStyle(0x5e4630).fillRect(x + w / 2 - 3, y, 6, h).fillRect(x + 4, y + h - 6, w - 8, 6);
    g.fillStyle(0x2e5a8a).fillRoundedRect(x + 2, y + 10, w * 0.5, h * 0.42, 6); // veste oubliée
    g.fillStyle(0x7a3b3b).fillRoundedRect(x + w * 0.45, y + 14, w * 0.5, h * 0.3, 6); // écharpe
  },

  // Tableau de liège avec des feuilles (blanches / bleues, jamais jaunes)
  corkboard(g, x, y, w, h) {
    g.fillStyle(0x6b4428).fillRect(x - 5, y - 5, w + 10, h + 10);
    g.fillStyle(0xc49a6c).fillRect(x, y, w, h);
    const sheets = [[0.05, 0.1, 0xf6f1e6], [0.3, 0.06, 0xcfe0f4], [0.55, 0.15, 0xf6f1e6], [0.78, 0.08, 0xf2d0dc], [0.12, 0.55, 0xd6ecd6], [0.42, 0.5, 0xf6f1e6], [0.7, 0.55, 0xcfe0f4]];
    for (const [sx, sy, c] of sheets) {
      g.fillStyle(c).fillRect(x + w * sx, y + h * sy, w * 0.18, h * 0.36);
      g.fillStyle(0x9aa0aa).fillRect(x + w * sx + 4, y + h * sy + 10, w * 0.18 - 8, 2).fillRect(x + w * sx + 4, y + h * sy + 18, w * 0.12, 2);
      g.fillStyle(0xc9473f).fillCircle(x + w * (sx + 0.09), y + h * sy + 3, 2.5);
    }
  },

  flipchart(g, x, y, w, h) {
    g.fillStyle(0x6c7482).fillRect(x + w * 0.15, y + h * 0.6, 4, h * 0.4).fillRect(x + w * 0.85 - 4, y + h * 0.6, 4, h * 0.4).fillRect(x + w / 2 - 2, y + h * 0.6, 4, h * 0.4);
    g.fillStyle(0xfafafa).fillRect(x, y, w, h * 0.65);
    g.lineStyle(2, 0x3b6ea8).strokeCircle(x + w * 0.3, y + h * 0.2, 9);
    g.lineStyle(2, 0xc9473f).lineBetween(x + w * 0.45, y + h * 0.2, x + w * 0.85, y + h * 0.2).lineBetween(x + w * 0.2, y + h * 0.4, x + w * 0.8, y + h * 0.45);
    g.fillStyle(0x4a4f5a).fillRect(x - 3, y - 4, w + 6, 6);
  },

  beanbag(g, x, y, w, h) {
    g.fillStyle(0x8a3b5a).fillEllipse(x + w / 2, y + h * 0.6, w, h * 0.8);
    g.fillStyle(0xa64c70).fillEllipse(x + w * 0.45, y + h * 0.45, w * 0.7, h * 0.5);
  },

  serverRack(g, x, y, w, h) {
    g.fillStyle(0x1a1c22).fillRect(x, y, w, h);
    for (let ry = y + 8; ry < y + h - 10; ry += 16) {
      g.fillStyle(0x2c2f38).fillRect(x + 5, ry, w - 10, 12);
      g.fillStyle((ry / 16) % 3 < 1 ? 0x3dff7a : 0x4aa3ff).fillRect(x + w - 14, ry + 4, 3, 3);
    }
  },

  // Plan de travail de la cuisine avec évier, placards et cafetière
  counter(g, x, y, w, h) {
    g.fillStyle(0xd0d4dc).fillRect(x, y, w, 10);
    g.fillStyle(0x8a6a4a).fillRect(x, y + 10, w, h - 10);
    g.lineStyle(2, 0x6e5236);
    for (let cx = x; cx < x + w; cx += w / 4) g.strokeRect(cx + 4, y + 16, w / 4 - 8, h - 22);
    g.fillStyle(0xa0a6b0).fillRect(x + w * 0.6, y + 1, w * 0.18, 7); // évier
    g.fillStyle(0x8a909a).fillRect(x + w * 0.68, y - 16, 4, 16).fillRect(x + w * 0.68, y - 16, 14, 4); // robinet
    g.fillStyle(0x2a2a2a).fillRect(x + 14, y - 38, 30, 38); // cafetière
    g.fillStyle(0xc9473f).fillRect(x + 20, y - 30, 6, 4);
    g.fillStyle(0xf0ece2).fillRect(x + 52, y - 14, 12, 14); // tasses
    g.fillStyle(0x3b6ea8).fillRect(x + 68, y - 14, 12, 14);
  },

  vending(g, x, y, w, h) {
    g.fillStyle(0xb33a3a).fillRect(x, y, w, h);
    g.fillStyle(0x1d2a3a).fillRect(x + 8, y + 10, w * 0.62, h * 0.7);
    for (let ry = y + 18; ry < y + h * 0.75; ry += 22) {
      for (let rx = x + 12; rx < x + w * 0.62; rx += 14) g.fillStyle(BOOKS[(rx + ry) % BOOKS.length]).fillRect(rx, ry, 10, 14);
    }
    g.fillStyle(0xd8d8d8).fillRect(x + w * 0.75, y + 20, w * 0.15, 30);
    g.fillStyle(0x111111).fillRect(x + 8, y + h - 24, w * 0.62, 14);
  },

  arcade(g, x, y, w, h) {
    g.fillStyle(0x3a2a6a).fillRect(x, y, w, h);
    g.fillStyle(0x111122).fillRect(x + 8, y + 14, w - 16, h * 0.35);
    g.fillStyle(0x4aa3ff).fillRect(x + 14, y + 22, 10, 6);
    g.fillStyle(0xc9473f).fillRect(x + w - 26, y + 34, 8, 8);
    g.fillStyle(0x2a1e50).fillRect(x - 4, y + h * 0.5, w + 8, 12);
    g.fillStyle(0xc9473f).fillCircle(x + w * 0.35, y + h * 0.5 + 6, 4);
    g.fillStyle(0x4aa3ff).fillCircle(x + w * 0.6, y + h * 0.5 + 6, 3).fillCircle(x + w * 0.72, y + h * 0.5 + 6, 3);
  },

  backpack(g, x, y, w, h) {
    g.fillStyle(0x2e5a8a).fillRoundedRect(x, y, w, h, 8);
    g.fillStyle(0x24476e).fillRoundedRect(x + w * 0.15, y + h * 0.45, w * 0.7, h * 0.4, 5);
    g.fillStyle(0xd0d4dc).fillRect(x + w / 2 - 4, y + h * 0.55, 8, 3);
  },

  // Rangée de sièges de l'amphi (au fond)
  amphiSeats(g, x, y, w, h) {
    g.fillStyle(0x5e4630).fillRect(x, y + h - 8, w, 8);
    for (let sx = x + 4; sx < x + w - 26; sx += 30) {
      g.fillStyle(0x2b3a67).fillRoundedRect(sx, y, 26, h - 10, 4);
      g.fillStyle(0x1f2a4d).fillRect(sx + 2, y + h - 16, 22, 6);
    }
  },

  exitSign(g, x, y, w, h) {
    g.fillStyle(0x1f8a4c).fillRect(x, y, w, h);
    g.fillStyle(0xffffff).fillRect(x + 6, y + h / 2 - 2, w - 24, 4);
    g.fillTriangle(x + w - 18, y + h / 2 - 7, x + w - 18, y + h / 2 + 7, x + w - 8, y + h / 2);
  },
};

/** Dessine un élément de décor ; text (facultatif) est écrit par l'appelant. */
export function drawDecor(g, item) {
  DRAWERS[item.type]?.(g, item.x, item.y, item.w, item.h, item.color);
}
