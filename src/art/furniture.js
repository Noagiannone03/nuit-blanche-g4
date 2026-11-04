// Mobilier des salles vu de face, dessiné en code.
// Chaque fonction reçoit un Graphics et le rectangle (x, y = coin haut-gauche ; w, h).
import { C } from '../ui/theme.js'; // on récupère les couleurs du jeu
import { drawDecor } from './decor.js'; // on récupère la fonction qui dessine le décor

const DRAWERS = { // un objet qui range toutes les fonctions de dessin
  // Tableau blanc avec quelques gribouillis de feutre
  whiteboard(g, x, y, w, h) { // dessine un tableau blanc
    g.fillStyle(0x9aa0a6).fillRect(x, y, w, h); // le cadre gris
    g.fillStyle(0xf4f4f0).fillRect(x + 6, y + 6, w - 12, h - 18); // la surface blanche
    g.lineStyle(2, 0x2d6cdf, 0.5); // trait bleu un peu transparent (le feutre)
    // 4 lignes de gribouillis, de plus en plus longues
    for (let i = 0; i < 4; i++) g.lineBetween(x + 24, y + 26 + i * 18, x + 24 + (w - 80) * (0.5 + 0.12 * i), y + 26 + i * 18);
    g.fillStyle(0x6d7278).fillRect(x + 10, y + h - 10, w - 20, 6); // le rebord pour poser les feutres
    g.fillStyle(C.red).fillRect(x + 30, y + h - 13, 14, 4); // un feutre rouge
    g.fillStyle(C.blue).fillRect(x + 50, y + h - 13, 14, 4); // un feutre bleu
  },

  // Tableau noir avec un circuit dessiné à la craie
  chalkboard(g, x, y, w, h) { // dessine un tableau noir
    g.fillStyle(C.woodDark).fillRect(x, y, w, h); // le cadre en bois foncé
    g.fillStyle(C.board).fillRect(x + 8, y + 8, w - 16, h - 22); // la surface verte du tableau
    g.lineStyle(2, C.chalk, 0.75); // trait couleur craie
    const cy = y + h / 2 - 6; // la hauteur du milieu du dessin
    for (let i = 0; i < 3; i++) { // on dessine 3 portes logiques
      const gx = x + 50 + i * ((w - 120) / 3); // position de cette porte
      g.strokeRect(gx, cy - 16, 40, 32); // la boîte de la porte
      g.lineBetween(gx - 26, cy - 8, gx, cy - 8); // le fil d'entrée du haut
      g.lineBetween(gx - 26, cy + 8, gx, cy + 8); // le fil d'entrée du bas
      g.lineBetween(gx + 40, cy, gx + 66, cy); // le fil de sortie
    }
    g.strokeCircle(x + w - 40, cy, 10); // le rond à la fin (une lampe)
    g.fillStyle(C.wood).fillRect(x, y + h - 14, w, 14); // le rebord en bois en bas
    g.fillStyle(0xffffff).fillRect(x + 40, y + h - 18, 18, 5); // un bâton de craie blanc
  },

  // Boîtier électrique métallique avec panneau "danger"
  electric(g, x, y, w, h) { // dessine un boîtier électrique
    g.fillStyle(C.steel).fillRect(x, y, w, h); // la boîte en métal
    g.lineStyle(2, 0x5b626c).strokeRect(x + 6, y + 6, w - 12, h - 12); // le contour de la porte
    g.fillStyle(0x5b626c).fillRect(x + w - 18, y + h / 2 - 12, 6, 24); // la poignée
    g.fillStyle(C.yellow).fillTriangle(x + w / 2, y + 22, x + w / 2 - 20, y + 56, x + w / 2 + 20, y + 56); // le triangle jaune "danger"
    g.fillStyle(0x222222).fillRect(x + w / 2 - 2, y + 32, 4, 14); // le trait du point d'exclamation
    g.fillRect(x + w / 2 - 2, y + 49, 4, 4); // le point du point d'exclamation
  },

  // Bureau en bois avec des feuilles posées dessus
  desk(g, x, y, w, h) { // dessine un bureau
    // les deux pieds du bureau
    g.fillStyle(C.woodDark).fillRect(x + 10, y + 22, 10, h - 22).fillRect(x + w - 20, y + 22, 10, h - 22);
    g.fillStyle(0x8a6440).fillRect(x + 24, y + 22, w - 48, h * 0.5); // le panneau du fond
    g.fillStyle(C.wood).fillRect(x, y, w, 24); // le plateau du bureau
    g.fillStyle(0xb88c5c).fillRect(x, y, w, 5); // le dessus du plateau, plus clair
    g.fillStyle(0xffffff).fillRect(x + 30, y - 4, 40, 8); // une feuille blanche
    g.fillStyle(0xf5f0d8).fillRect(x + 80, y - 3, 30, 7); // une autre feuille, crème
  },

  // Bureau d'élève avec clavier et souris
  keyboardDesk(g, x, y, w, h) { // dessine un bureau avec clavier
    DRAWERS.desk(g, x, y + 10, w, h - 10); // on réutilise le dessin du bureau
    g.fillStyle(0x3a3f47).fillRect(x + w / 2 - 50, y + 2, 100, 12); // le clavier gris foncé
    g.fillStyle(0x8c929b); // couleur gris clair pour les touches
    for (let i = 0; i < 8; i++) g.fillRect(x + w / 2 - 46 + i * 12, y + 4, 9, 3); // 8 touches du clavier
    g.fillStyle(0x3a3f47).fillEllipse(x + w / 2 + 70, y + 8, 14, 18); // la souris
  },

  // Écran allumé sur une table
  pc(g, x, y, w, h) { // dessine un ordi allumé
    g.fillStyle(C.wood).fillRect(x - 20, y + h - 26, w + 40, 14); // le plateau de la table
    // les deux pieds de la table
    g.fillStyle(C.woodDark).fillRect(x - 10, y + h - 12, 10, 12).fillRect(x + w, y + h - 12, 10, 12);
    g.fillStyle(0x1e2229).fillRect(x + 10, y, w - 20, h - 50); // le bord noir de l'écran
    g.fillStyle(0x3d7fd0).fillRect(x + 18, y + 8, w - 36, h - 66); // l'écran allumé en bleu
    g.fillStyle(0xffffff, 0.8); // couleur blanche un peu transparente
    // 4 lignes de texte sur l'écran
    for (let i = 0; i < 4; i++) g.fillRect(x + 28, y + 18 + i * 12, (w - 70) * (0.4 + 0.15 * i), 4);
    // le pied et le socle de l'écran
    g.fillStyle(0x1e2229).fillRect(x + w / 2 - 8, y + h - 50, 16, 16).fillRect(x + w / 2 - 30, y + h - 36, 60, 8);
  },

  // Le même PC, éteint (pas de courant)
  pcOff(g, x, y, w, h) { // dessine un ordi éteint
    g.fillStyle(C.wood).fillRect(x - 20, y + h - 26, w + 40, 14); // le plateau de la table
    // les deux pieds de la table
    g.fillStyle(C.woodDark).fillRect(x - 10, y + h - 12, 10, 12).fillRect(x + w, y + h - 12, 10, 12);
    g.fillStyle(0x1e2229).fillRect(x + 10, y, w - 20, h - 50); // le bord noir de l'écran
    g.fillStyle(0x0d0f14).fillRect(x + 18, y + 8, w - 36, h - 66); // l'écran éteint, tout noir
    // le pied et le socle de l'écran
    g.fillStyle(0x1e2229).fillRect(x + w / 2 - 8, y + h - 50, 16, 16).fillRect(x + w / 2 - 30, y + h - 36, 60, 8);
  },

  // Rangée de PC éteints
  pcRow(g, x, y, w, h) { // dessine plusieurs ordis éteints
    g.fillStyle(C.wood).fillRect(x, y + h - 30, w, 14); // la longue table
    // les deux pieds de la table
    g.fillStyle(C.woodDark).fillRect(x + 6, y + h - 16, 10, 16).fillRect(x + w - 16, y + h - 16, 10, 16);
    const n = 3; // il y a 3 écrans
    for (let i = 0; i < n; i++) { // pour chaque écran
      const sx = x + 10 + i * ((w - 20) / n); // position de l'écran
      const sw = (w - 20) / n - 14; // largeur de l'écran
      g.fillStyle(0x1e2229).fillRect(sx, y + 4, sw, h - 50); // le bord de l'écran
      g.fillStyle(0x0d0f13).fillRect(sx + 5, y + 9, sw - 10, h - 60); // l'écran éteint
      g.fillStyle(0x1e2229).fillRect(sx + sw / 2 - 5, y + h - 46, 10, 16); // le pied de l'écran
    }
  },

  // Vidéoprojecteur posé sur un chariot
  projector(g, x, y, w, h) { // dessine un vidéoprojecteur
    g.fillStyle(0x3a3f47).fillRect(x + 10, y + 34, w - 20, 10); // le plateau du chariot
    // les deux pieds du chariot
    g.fillStyle(0x2a2e34).fillRect(x + 18, y + 44, 8, h - 54).fillRect(x + w - 26, y + 44, 8, h - 54);
    g.fillStyle(0x2a2e34).fillCircle(x + 22, y + h - 6, 6).fillCircle(x + w - 22, y + h - 6, 6); // les deux roues
    g.fillStyle(0xe4e6ea).fillRoundedRect(x + w / 2 - 44, y + 4, 88, 30, 5); // la boîte du projecteur
    g.fillStyle(0x30343a).fillCircle(x + w / 2 + 24, y + 19, 10); // l'objectif (rond foncé)
    g.fillStyle(0x7fb3ff).fillCircle(x + w / 2 + 24, y + 19, 5); // le reflet bleu de l'objectif
    g.fillStyle(0x3ecf8e).fillCircle(x + w / 2 - 32, y + 12, 2.5); // le petit voyant vert
  },

  printer(g, x, y, w, h) { // dessine une imprimante
    g.fillStyle(0xcfd2d8).fillRoundedRect(x, y + 20, w, h - 20, 6); // le corps de l'imprimante
    g.fillStyle(0xa9adb5).fillRect(x + 10, y + 34, w - 20, 8); // la fente de sortie du papier
    g.fillStyle(0xffffff).fillRect(x + 22, y, w - 44, 30); // la feuille qui dépasse
    // deux lignes de texte sur la feuille
    g.lineStyle(1, 0x999999).lineBetween(x + 30, y + 8, x + w - 30, y + 8).lineBetween(x + 30, y + 14, x + w - 40, y + 14);
    g.fillStyle(0x3ecf8e).fillCircle(x + w - 18, y + h - 14, 4); // le voyant vert
  },

  // Panneau de liège avec un planning épinglé
  planning(g, x, y, w, h) { // dessine un planning
    g.fillStyle(C.woodDark).fillRect(x, y, w, h); // le cadre en bois
    g.fillStyle(0xc49a6c).fillRect(x + 6, y + 6, w - 12, h - 12); // le liège
    g.fillStyle(0xffffff).fillRect(x + 20, y + 16, w - 40, h - 32); // la feuille du planning
    const colors = [C.blue, C.green, C.yellow, C.red, 0x8e6bd6]; // les couleurs des tâches
    // chaque tâche est une barre de couleur, en escalier
    colors.forEach((c, i) => g.fillStyle(c).fillRect(x + 40 + i * 40, y + 30 + i * 18, 40 + (i % 2) * 30, 10));
    g.fillStyle(C.red).fillCircle(x + 26, y + 20, 4).fillCircle(x + w - 26, y + 20, 4); // les deux punaises rouges
  },

  // Coffre-fort avec molette
  safe(g, x, y, w, h) { // dessine un coffre-fort
    g.fillStyle(0x4a4f57).fillRoundedRect(x, y, w, h, 6); // le corps du coffre
    g.lineStyle(3, 0x30343a).strokeRoundedRect(x + 8, y + 8, w - 16, h - 16, 4); // le contour de la porte
    g.fillStyle(0xb9bec6).fillCircle(x + w / 2, y + h / 2, 20); // la grosse molette
    g.fillStyle(0x30343a).fillCircle(x + w / 2, y + h / 2, 6); // le centre de la molette
    g.fillStyle(0xb9bec6).fillRect(x + w - 24, y + h / 2 - 16, 8, 32); // la poignée
  },

  // Cahier rouge posé sur une petite table
  notebook(g, x, y, w, h) { // dessine un cahier sur une table
    g.fillStyle(C.wood).fillRect(x, y + h / 2, w, 12); // le plateau de la table
    // les deux pieds de la table
    g.fillStyle(C.woodDark).fillRect(x + 10, y + h / 2 + 12, 8, h / 2 - 12).fillRect(x + w - 18, y + h / 2 + 12, 8, h / 2 - 12);
    g.fillStyle(C.red).fillRect(x + w / 2 - 34, y + h / 2 - 10, 68, 12); // le cahier rouge
    g.fillStyle(0xffffff).fillRect(x + w / 2 - 34, y + h / 2 - 2, 68, 3); // les pages blanches
  },

  // Casier métallique avec cadenas
  locker(g, x, y, w, h) { // dessine un casier
    g.fillStyle(0x5b7da0).fillRect(x, y, w, h); // la porte bleue du casier
    g.lineStyle(2, 0x45617f).strokeRect(x + 4, y + 4, w - 8, h - 8); // le contour de la porte
    g.fillStyle(0x45617f); // couleur bleu foncé
    for (let i = 0; i < 4; i++) g.fillRect(x + 20, y + 16 + i * 8, w - 40, 3); // 4 fentes d'aération
    g.fillStyle(C.yellow).fillRoundedRect(x + w - 30, y + h / 2, 16, 18, 3); // le corps du cadenas
    g.lineStyle(3, 0xb0b5bc).strokeCircle(x + w - 22, y + h / 2, 6); // l'anneau du cadenas
  },

  // Frigo avec des feuilles aimantées
  fridge(g, x, y, w, h) { // dessine un frigo
    g.fillStyle(0xe9edf0).fillRoundedRect(x, y, w, h, 8); // le corps blanc du frigo
    g.lineStyle(2, 0xc3c9cf).lineBetween(x, y + h * 0.35, x + w, y + h * 0.35); // la séparation des deux portes
    // les deux poignées
    g.fillStyle(0xaab1b8).fillRect(x + w - 16, y + 20, 5, 30).fillRect(x + w - 16, y + h * 0.35 + 16, 5, 40);
    [[20, 60], [60, 70], [30, 110], [75, 120]].forEach(([dx, dy], i) => { // pour chaque feuille aimantée
      g.fillStyle(i % 2 ? 0xffffff : 0xfff3b0).fillRect(x + dx, y + dy, 34, 40); // la feuille, blanche ou crème
      g.fillStyle([C.red, C.blue, C.green, C.yellow][i]).fillCircle(x + dx + 17, y + dy + 4, 4); // l'aimant de couleur
    });
  },

  microwave(g, x, y, w, h) { // dessine un micro-ondes
    g.fillStyle(0x3a3a3a).fillRoundedRect(x, y, w, h, 6); // le corps du micro-ondes
    g.fillStyle(0x15181c).fillRect(x + 10, y + 10, w - 50, h - 20); // la vitre noire
    g.fillStyle(0x1b2b1f).fillRect(x + w - 34, y + 12, 26, 12); // le petit écran
    g.fillStyle(0x3dff7a).fillRect(x + w - 31, y + 16, 20, 4); // l'affichage vert de l'écran
    g.fillStyle(0x777777).fillCircle(x + w - 21, y + h - 18, 5); // le bouton rond
  },

  babyfoot(g, x, y, w, h) { // dessine un baby-foot
    // les deux pieds du baby-foot
    g.fillStyle(C.woodDark).fillRect(x + 14, y + h - 30, 12, 30).fillRect(x + w - 26, y + h - 30, 12, 30);
    g.fillStyle(0x2f6b3a).fillRect(x, y, w, h - 30); // le terrain vert
    // les lignes blanches du terrain
    g.lineStyle(2, 0xffffff, 0.6).strokeRect(x + 8, y + 8, w - 16, h - 46).lineBetween(x + w / 2, y + 8, x + w / 2, y + h - 38);
    g.lineStyle(3, 0xcfd2d8); // trait gris clair pour les barres
    for (let i = 1; i < 5; i++) g.lineBetween(x + (i * w) / 5, y - 6, x + (i * w) / 5, y + h - 24); // les 4 barres des joueurs
  },

  // Fenêtre de nuit avec la lune
  window(g, x, y, w, h) { // dessine une fenêtre la nuit
    g.fillStyle(0xf0ece2).fillRect(x, y, w, h); // le cadre clair
    g.fillStyle(0x16224a).fillRect(x + 8, y + 8, w - 16, h - 16); // le ciel bleu nuit
    g.fillStyle(0xfff6c8).fillCircle(x + w - 34, y + 34, 14); // la lune
    // trois petites étoiles
    g.fillStyle(0xffffff, 0.8).fillCircle(x + 26, y + 60, 1.5).fillCircle(x + 50, y + 30, 1.5).fillCircle(x + 34, y + 100, 1.5);
    g.fillStyle(0xf0ece2).fillRect(x + w / 2 - 3, y, 6, h).fillRect(x, y + h / 2 - 3, w, 6); // la croix qui sépare les vitres
    g.fillStyle(0x8a3b3b).fillRect(x - 10, y - 6, 14, h + 12); // le rideau rouge à gauche
  },
};

export function drawFurniture(g, type, x, y, w, h) { // fonction utilisée par les autres fichiers
  const draw = DRAWERS[type]; // on cherche la fonction de dessin du bon type
  if (draw) draw(g, x, y, w, h); // si elle existe, on dessine le meuble
  // sinon : un élément du décor (borne d'arcade, distributeur, pouf…) qui devient un objet utilisable
  // sinon on essaie le décor ; si rien ne marche, on dessine un simple rectangle en bois
  else if (!drawDecor(g, { type, x, y, w, h })) g.fillStyle(C.wood).fillRect(x, y, w, h);
}
