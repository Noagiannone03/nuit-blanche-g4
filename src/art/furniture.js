// Mobilier des salles vu de face, dessiné en code.
// Chaque fonction reçoit un Graphics et le rectangle (x, y = coin haut-gauche ; w, h).
import { C } from '../ui/theme.js';

const DRAWERS = {
  // Tableau blanc avec quelques gribouillis de feutre
  whiteboard(g, x, y, w, h) {
    g.fillStyle(0x9aa0a6).fillRect(x, y, w, h);
    g.fillStyle(0xf4f4f0).fillRect(x + 6, y + 6, w - 12, h - 18);
    g.lineStyle(2, 0x2d6cdf, 0.5);
    for (let i = 0; i < 4; i++) g.lineBetween(x + 24, y + 26 + i * 18, x + 24 + (w - 80) * (0.5 + 0.12 * i), y + 26 + i * 18);
    g.fillStyle(0x6d7278).fillRect(x + 10, y + h - 10, w - 20, 6);
    g.fillStyle(C.red).fillRect(x + 30, y + h - 13, 14, 4);
    g.fillStyle(C.blue).fillRect(x + 50, y + h - 13, 14, 4);
  },

  // Tableau noir avec un circuit dessiné à la craie
  chalkboard(g, x, y, w, h) {
    g.fillStyle(C.woodDark).fillRect(x, y, w, h);
    g.fillStyle(C.board).fillRect(x + 8, y + 8, w - 16, h - 22);
    g.lineStyle(2, C.chalk, 0.75);
    const cy = y + h / 2 - 6;
    for (let i = 0; i < 3; i++) {
      const gx = x + 50 + i * ((w - 120) / 3);
      g.strokeRect(gx, cy - 16, 40, 32);
      g.lineBetween(gx - 26, cy - 8, gx, cy - 8);
      g.lineBetween(gx - 26, cy + 8, gx, cy + 8);
      g.lineBetween(gx + 40, cy, gx + 66, cy);
    }
    g.strokeCircle(x + w - 40, cy, 10);
    g.fillStyle(C.wood).fillRect(x, y + h - 14, w, 14);
    g.fillStyle(0xffffff).fillRect(x + 40, y + h - 18, 18, 5);
  },

  // Boîtier électrique métallique avec panneau "danger"
  electric(g, x, y, w, h) {
    g.fillStyle(C.steel).fillRect(x, y, w, h);
    g.lineStyle(2, 0x5b626c).strokeRect(x + 6, y + 6, w - 12, h - 12);
    g.fillStyle(0x5b626c).fillRect(x + w - 18, y + h / 2 - 12, 6, 24);
    g.fillStyle(C.yellow).fillTriangle(x + w / 2, y + 22, x + w / 2 - 20, y + 56, x + w / 2 + 20, y + 56);
    g.fillStyle(0x222222).fillRect(x + w / 2 - 2, y + 32, 4, 14);
    g.fillRect(x + w / 2 - 2, y + 49, 4, 4);
  },

  // Bureau en bois avec des feuilles posées dessus
  desk(g, x, y, w, h) {
    g.fillStyle(C.woodDark).fillRect(x + 10, y + 22, 10, h - 22).fillRect(x + w - 20, y + 22, 10, h - 22);
    g.fillStyle(0x8a6440).fillRect(x + 24, y + 22, w - 48, h * 0.5);
    g.fillStyle(C.wood).fillRect(x, y, w, 24);
    g.fillStyle(0xb88c5c).fillRect(x, y, w, 5);
    g.fillStyle(0xffffff).fillRect(x + 30, y - 4, 40, 8);
    g.fillStyle(0xf5f0d8).fillRect(x + 80, y - 3, 30, 7);
  },

  // Bureau d'élève avec clavier et souris
  keyboardDesk(g, x, y, w, h) {
    DRAWERS.desk(g, x, y + 10, w, h - 10);
    g.fillStyle(0x3a3f47).fillRect(x + w / 2 - 50, y + 2, 100, 12);
    g.fillStyle(0x8c929b);
    for (let i = 0; i < 8; i++) g.fillRect(x + w / 2 - 46 + i * 12, y + 4, 9, 3);
    g.fillStyle(0x3a3f47).fillEllipse(x + w / 2 + 70, y + 8, 14, 18);
  },

  // Écran allumé sur une table
  pc(g, x, y, w, h) {
    g.fillStyle(C.wood).fillRect(x - 20, y + h - 26, w + 40, 14);
    g.fillStyle(C.woodDark).fillRect(x - 10, y + h - 12, 10, 12).fillRect(x + w, y + h - 12, 10, 12);
    g.fillStyle(0x1e2229).fillRect(x + 10, y, w - 20, h - 50);
    g.fillStyle(0x3d7fd0).fillRect(x + 18, y + 8, w - 36, h - 66);
    g.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 4; i++) g.fillRect(x + 28, y + 18 + i * 12, (w - 70) * (0.4 + 0.15 * i), 4);
    g.fillStyle(0x1e2229).fillRect(x + w / 2 - 8, y + h - 50, 16, 16).fillRect(x + w / 2 - 30, y + h - 36, 60, 8);
  },

  // Rangée de PC éteints
  pcRow(g, x, y, w, h) {
    g.fillStyle(C.wood).fillRect(x, y + h - 30, w, 14);
    g.fillStyle(C.woodDark).fillRect(x + 6, y + h - 16, 10, 16).fillRect(x + w - 16, y + h - 16, 10, 16);
    const n = 3;
    for (let i = 0; i < n; i++) {
      const sx = x + 10 + i * ((w - 20) / n);
      const sw = (w - 20) / n - 14;
      g.fillStyle(0x1e2229).fillRect(sx, y + 4, sw, h - 50);
      g.fillStyle(0x0d0f13).fillRect(sx + 5, y + 9, sw - 10, h - 60);
      g.fillStyle(0x1e2229).fillRect(sx + sw / 2 - 5, y + h - 46, 10, 16);
    }
  },

  // Vidéoprojecteur posé sur un chariot
  projector(g, x, y, w, h) {
    g.fillStyle(0x3a3f47).fillRect(x + 10, y + 34, w - 20, 10);
    g.fillStyle(0x2a2e34).fillRect(x + 18, y + 44, 8, h - 54).fillRect(x + w - 26, y + 44, 8, h - 54);
    g.fillStyle(0x2a2e34).fillCircle(x + 22, y + h - 6, 6).fillCircle(x + w - 22, y + h - 6, 6);
    g.fillStyle(0xe4e6ea).fillRoundedRect(x + w / 2 - 44, y + 4, 88, 30, 5);
    g.fillStyle(0x30343a).fillCircle(x + w / 2 + 24, y + 19, 10);
    g.fillStyle(0x7fb3ff).fillCircle(x + w / 2 + 24, y + 19, 5);
    g.fillStyle(0x3ecf8e).fillCircle(x + w / 2 - 32, y + 12, 2.5);
  },

  printer(g, x, y, w, h) {
    g.fillStyle(0xcfd2d8).fillRoundedRect(x, y + 20, w, h - 20, 6);
    g.fillStyle(0xa9adb5).fillRect(x + 10, y + 34, w - 20, 8);
    g.fillStyle(0xffffff).fillRect(x + 22, y, w - 44, 30);
    g.lineStyle(1, 0x999999).lineBetween(x + 30, y + 8, x + w - 30, y + 8).lineBetween(x + 30, y + 14, x + w - 40, y + 14);
    g.fillStyle(0x3ecf8e).fillCircle(x + w - 18, y + h - 14, 4);
  },

  // Panneau de liège avec un planning épinglé
  planning(g, x, y, w, h) {
    g.fillStyle(C.woodDark).fillRect(x, y, w, h);
    g.fillStyle(0xc49a6c).fillRect(x + 6, y + 6, w - 12, h - 12);
    g.fillStyle(0xffffff).fillRect(x + 20, y + 16, w - 40, h - 32);
    const colors = [C.blue, C.green, C.yellow, C.red, 0x8e6bd6];
    colors.forEach((c, i) => g.fillStyle(c).fillRect(x + 40 + i * 40, y + 30 + i * 18, 40 + (i % 2) * 30, 10));
    g.fillStyle(C.red).fillCircle(x + 26, y + 20, 4).fillCircle(x + w - 26, y + 20, 4);
  },

  // Coffre-fort avec molette
  safe(g, x, y, w, h) {
    g.fillStyle(0x4a4f57).fillRoundedRect(x, y, w, h, 6);
    g.lineStyle(3, 0x30343a).strokeRoundedRect(x + 8, y + 8, w - 16, h - 16, 4);
    g.fillStyle(0xb9bec6).fillCircle(x + w / 2, y + h / 2, 20);
    g.fillStyle(0x30343a).fillCircle(x + w / 2, y + h / 2, 6);
    g.fillStyle(0xb9bec6).fillRect(x + w - 24, y + h / 2 - 16, 8, 32);
  },

  // Cahier rouge posé sur une petite table
  notebook(g, x, y, w, h) {
    g.fillStyle(C.wood).fillRect(x, y + h / 2, w, 12);
    g.fillStyle(C.woodDark).fillRect(x + 10, y + h / 2 + 12, 8, h / 2 - 12).fillRect(x + w - 18, y + h / 2 + 12, 8, h / 2 - 12);
    g.fillStyle(C.red).fillRect(x + w / 2 - 34, y + h / 2 - 10, 68, 12);
    g.fillStyle(0xffffff).fillRect(x + w / 2 - 34, y + h / 2 - 2, 68, 3);
  },

  // Casier métallique avec cadenas
  locker(g, x, y, w, h) {
    g.fillStyle(0x5b7da0).fillRect(x, y, w, h);
    g.lineStyle(2, 0x45617f).strokeRect(x + 4, y + 4, w - 8, h - 8);
    g.fillStyle(0x45617f);
    for (let i = 0; i < 4; i++) g.fillRect(x + 20, y + 16 + i * 8, w - 40, 3);
    g.fillStyle(C.yellow).fillRoundedRect(x + w - 30, y + h / 2, 16, 18, 3);
    g.lineStyle(3, 0xb0b5bc).strokeCircle(x + w - 22, y + h / 2, 6);
  },

  // Frigo avec des feuilles aimantées
  fridge(g, x, y, w, h) {
    g.fillStyle(0xe9edf0).fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(2, 0xc3c9cf).lineBetween(x, y + h * 0.35, x + w, y + h * 0.35);
    g.fillStyle(0xaab1b8).fillRect(x + w - 16, y + 20, 5, 30).fillRect(x + w - 16, y + h * 0.35 + 16, 5, 40);
    [[20, 60], [60, 70], [30, 110], [75, 120]].forEach(([dx, dy], i) => {
      g.fillStyle(i % 2 ? 0xffffff : 0xfff3b0).fillRect(x + dx, y + dy, 34, 40);
      g.fillStyle([C.red, C.blue, C.green, C.yellow][i]).fillCircle(x + dx + 17, y + dy + 4, 4);
    });
  },

  microwave(g, x, y, w, h) {
    g.fillStyle(0x3a3a3a).fillRoundedRect(x, y, w, h, 6);
    g.fillStyle(0x15181c).fillRect(x + 10, y + 10, w - 50, h - 20);
    g.fillStyle(0x1b2b1f).fillRect(x + w - 34, y + 12, 26, 12);
    g.fillStyle(0x3dff7a).fillRect(x + w - 31, y + 16, 20, 4);
    g.fillStyle(0x777777).fillCircle(x + w - 21, y + h - 18, 5);
  },

  babyfoot(g, x, y, w, h) {
    g.fillStyle(C.woodDark).fillRect(x + 14, y + h - 30, 12, 30).fillRect(x + w - 26, y + h - 30, 12, 30);
    g.fillStyle(0x2f6b3a).fillRect(x, y, w, h - 30);
    g.lineStyle(2, 0xffffff, 0.6).strokeRect(x + 8, y + 8, w - 16, h - 46).lineBetween(x + w / 2, y + 8, x + w / 2, y + h - 38);
    g.lineStyle(3, 0xcfd2d8);
    for (let i = 1; i < 5; i++) g.lineBetween(x + (i * w) / 5, y - 6, x + (i * w) / 5, y + h - 24);
  },

  // Fenêtre de nuit avec la lune
  window(g, x, y, w, h) {
    g.fillStyle(0xf0ece2).fillRect(x, y, w, h);
    g.fillStyle(0x16224a).fillRect(x + 8, y + 8, w - 16, h - 16);
    g.fillStyle(0xfff6c8).fillCircle(x + w - 34, y + 34, 14);
    g.fillStyle(0xffffff, 0.8).fillCircle(x + 26, y + 60, 1.5).fillCircle(x + 50, y + 30, 1.5).fillCircle(x + 34, y + 100, 1.5);
    g.fillStyle(0xf0ece2).fillRect(x + w / 2 - 3, y, 6, h).fillRect(x, y + h / 2 - 3, w, 6);
    g.fillStyle(0x8a3b3b).fillRect(x - 10, y - 6, 14, h + 12);
  },
};

export function drawFurniture(g, type, x, y, w, h) {
  const draw = DRAWERS[type];
  if (draw) draw(g, x, y, w, h);
  else g.fillStyle(C.wood).fillRect(x, y, w, h);
}
