// Décor des salles (vue de face), dessiné en code : il remplit les murs et le sol autour des objets
// des énigmes. Rien n'est cliquable. Chaque salle liste son décor dans src/rooms/<salle>.js (champ decor).
// Attention : aucun élément jaune (on compte les post-it jaunes à Sormiou).

const BOOKS = [0xb5473c, 0x3b6ea8, 0x3f8f5a, 0x7a4fa0, 0xd0d4dc, 0x8a5a35, 0xc06a8a]; // liste des couleurs des livres

const DRAWERS = { // un objet qui range toutes les fonctions de dessin
  // Fenêtre de nuit : lune, étoiles et lumière des lampadaires de la rue
  windowNight(g, x, y, w, h) { // dessine une fenêtre la nuit
    g.fillStyle(0xd8d2c4).fillRect(x - 6, y - 6, w + 12, h + 12); // on peint le cadre clair de la fenêtre
    g.fillStyle(0x16203a).fillRect(x, y, w, h); // on peint le ciel bleu nuit
    g.fillStyle(0x24345a).fillRect(x, y + h * 0.6, w, h * 0.4); // le bas du ciel, un peu plus clair
    g.fillStyle(0xf0ead0).fillCircle(x + w * 0.72, y + h * 0.25, Math.min(w, h) * 0.1); // on dessine la lune ronde
    g.fillStyle(0xffffff, 0.8); // couleur blanche un peu transparente
    // on pose 5 petites étoiles à des places fixes
    for (const [sx, sy] of [[0.15, 0.15], [0.35, 0.3], [0.5, 0.1], [0.2, 0.45], [0.9, 0.5]]) g.fillRect(x + w * sx, y + h * sy, 2, 2);
    g.fillStyle(0x0d1322).fillRect(x, y + h * 0.78, w * 0.3, h * 0.22).fillRect(x + w * 0.55, y + h * 0.7, w * 0.25, h * 0.3); // immeubles
    g.fillStyle(0xd8d2c4).fillRect(x + w / 2 - 3, y, 6, h).fillRect(x, y + h / 2 - 3, w, 6); // la croix qui sépare les vitres
    g.fillStyle(0xbab3a3).fillRect(x - 10, y + h + 6, w + 20, 8); // rebord
  },

  radiator(g, x, y, w, h) { // dessine un radiateur
    g.fillStyle(0xe4e2dc).fillRoundedRect(x, y, w, h, 4); // le corps du radiateur, coins arrondis
    g.lineStyle(2, 0xb8b4aa); // trait gris de 2 pixels
    for (let fx = x + 8; fx < x + w - 4; fx += 10) g.lineBetween(fx, y + 4, fx, y + h - 4); // les lamelles verticales
    g.fillStyle(0x9a968c).fillRect(x + w - 6, y + h, 4, 10); // le petit tuyau en bas
  },

  // Affiche : bandeau de couleur + lignes de texte (le titre est écrit par RoomScene)
  poster(g, x, y, w, h, color = 0x3b6ea8) { // dessine une affiche (bleue par défaut)
    g.fillStyle(0x000000, 0.15).fillRect(x + 3, y + 3, w, h); // l'ombre légère derrière l'affiche
    g.fillStyle(0xf6f1e6).fillRect(x, y, w, h); // le papier blanc cassé
    g.fillStyle(color).fillRect(x, y, w, h * 0.3); // le bandeau de couleur en haut
    g.fillStyle(0x9aa0aa); // couleur grise pour les lignes de texte
    for (let ly = y + h * 0.42; ly < y + h - 8; ly += 9) g.fillRect(x + 8, ly, w - 16 - ((ly * 7) % 20), 3); // fausses lignes de texte
    g.fillStyle(0xc9473f).fillCircle(x + w / 2, y + 4, 3); // punaise
  },

  bookshelf(g, x, y, w, h) { // dessine une étagère avec des livres
    g.fillStyle(0x6b4428).fillRect(x, y, w, h); // on peint le cadre en bois de l'étagère
    g.fillStyle(0x4a2f1c).fillRect(x + 5, y + 5, w - 10, h - 10); // le fond plus sombre
    const shelves = Math.max(2, Math.round(h / 55)); // nombre de planches (au moins 2)
    const sh = (h - 10) / shelves; // hauteur d'une planche
    for (let s = 0; s < shelves; s++) { // pour chaque planche
      const sy = y + 5 + s * sh; // le haut de cette planche
      let bx = x + 7; // position du premier livre
      let i = s * 3; // numéro du livre (change d'une planche à l'autre)
      while (bx < x + w - 14) { // tant qu'il reste de la place
        const bw = 6 + ((i * 5) % 6); // largeur du livre, varie un peu
        const bh = sh - 8 - ((i * 3) % 7); // hauteur du livre, varie un peu
        g.fillStyle(BOOKS[i % BOOKS.length]).fillRect(bx, sy + sh - 4 - bh, bw, bh); // on dessine le livre en couleur
        bx += bw + 1; // on avance pour le livre suivant
        i += 1; // livre suivant
      }
      g.fillStyle(0x6b4428).fillRect(x + 5, sy + sh - 4, w - 10, 4); // la planche en bois sous les livres
    }
  },

  // Rangée de chaises vues de face (dossier + assise)
  chairs(g, x, y, w, h, color = 0x3a4a6a) { // dessine plusieurs chaises côte à côte
    const n = Math.max(1, Math.floor(w / 46)); // combien de chaises tiennent dans la largeur
    for (let i = 0; i < n; i++) { // pour chaque chaise
      const cx = x + i * (w / n) + 4; // position horizontale de la chaise
      g.fillStyle(color).fillRoundedRect(cx, y, 34, h * 0.55, 4); // le dossier de la chaise
      g.fillStyle(0x20242c).fillRect(cx + 2, y + h * 0.55, 30, 5); // l'assise
      // les deux pieds de la chaise
      g.fillStyle(0x50545c).fillRect(cx + 4, y + h * 0.55 + 5, 3, h * 0.45 - 5).fillRect(cx + 27, y + h * 0.55 + 5, 3, h * 0.45 - 5);
    }
  },

  // Table d'élève avec un écran éteint
  studentPc(g, x, y, w, h) { // dessine une table avec un ordi éteint
    g.fillStyle(0x8a6a4a).fillRect(x, y + h * 0.45, w, 8); // le plateau de la table
    // les deux pieds de la table
    g.fillStyle(0x5e4630).fillRect(x + 6, y + h * 0.45 + 8, 5, h * 0.55 - 8).fillRect(x + w - 11, y + h * 0.45 + 8, 5, h * 0.55 - 8);
    const mw = Math.min(70, w * 0.6); // largeur de l'écran (70 max)
    g.fillStyle(0x15171c).fillRect(x + w / 2 - mw / 2, y, mw, h * 0.36); // le bord noir de l'écran
    g.fillStyle(0x23262e).fillRect(x + w / 2 - mw / 2 + 4, y + 4, mw - 8, h * 0.36 - 8); // l'écran éteint, gris foncé
    g.fillStyle(0x15171c).fillRect(x + w / 2 - 4, y + h * 0.36, 8, h * 0.09); // le pied de l'écran
    g.fillStyle(0x3a3f4a).fillRect(x + w / 2 - 22, y + h * 0.45 - 4, 44, 4); // clavier
  },

  table(g, x, y, w, h) { // dessine une table simple
    g.fillStyle(0x9a7550).fillRect(x, y, w, 10); // le plateau en bois
    g.fillStyle(0x6e5236).fillRect(x + 8, y + 10, 6, h - 10).fillRect(x + w - 14, y + 10, 6, h - 10); // les deux pieds
  },

  plant(g, x, y, w, h) { // dessine une plante en pot
    g.fillStyle(0x9a5a35).fillRect(x + w * 0.2, y + h * 0.6, w * 0.6, h * 0.4); // le pot en terre
    g.fillStyle(0x7a4528).fillRect(x + w * 0.15, y + h * 0.6, w * 0.7, 6); // le bord du pot
    g.fillStyle(0x2f7a3a); // couleur vert foncé
    g.fillEllipse(x + w * 0.5, y + h * 0.3, w * 0.5, h * 0.6); // le feuillage du milieu
    // deux touffes de feuilles plus claires, à gauche et à droite
    g.fillStyle(0x3f9a4a).fillEllipse(x + w * 0.3, y + h * 0.4, w * 0.45, h * 0.35).fillEllipse(x + w * 0.72, y + h * 0.38, w * 0.45, h * 0.35);
  },

  bin(g, x, y, w, h) { // dessine une poubelle
    g.fillStyle(0x5a6270).fillRect(x, y, w, h); // le corps de la poubelle
    g.fillStyle(0x6c7482).fillRect(x - 2, y, w + 4, 5); // le rebord du haut
    g.fillStyle(0xf0ece2).fillCircle(x + w * 0.35, y - 2, 5).fillCircle(x + w * 0.65, y - 4, 4); // papiers froissés
  },

  coatRack(g, x, y, w, h) { // dessine un porte-manteau
    g.fillStyle(0x5e4630).fillRect(x + w / 2 - 3, y, 6, h).fillRect(x + 4, y + h - 6, w - 8, 6); // le mât et le pied
    g.fillStyle(0x2e5a8a).fillRoundedRect(x + 2, y + 10, w * 0.5, h * 0.42, 6); // veste oubliée
    g.fillStyle(0x7a3b3b).fillRoundedRect(x + w * 0.45, y + 14, w * 0.5, h * 0.3, 6); // écharpe
  },

  // Tableau de liège avec des feuilles (blanches / bleues, jamais jaunes)
  corkboard(g, x, y, w, h) { // dessine un tableau de liège
    g.fillStyle(0x6b4428).fillRect(x - 5, y - 5, w + 10, h + 10); // le cadre en bois
    g.fillStyle(0xc49a6c).fillRect(x, y, w, h); // le liège marron clair
    // liste des feuilles : position (en part de la taille) et couleur
    const sheets = [[0.05, 0.1, 0xf6f1e6], [0.3, 0.06, 0xcfe0f4], [0.55, 0.15, 0xf6f1e6], [0.78, 0.08, 0xf2d0dc], [0.12, 0.55, 0xd6ecd6], [0.42, 0.5, 0xf6f1e6], [0.7, 0.55, 0xcfe0f4]];
    for (const [sx, sy, c] of sheets) { // pour chaque feuille
      g.fillStyle(c).fillRect(x + w * sx, y + h * sy, w * 0.18, h * 0.36); // on dessine la feuille
      // deux lignes grises comme du texte
      g.fillStyle(0x9aa0aa).fillRect(x + w * sx + 4, y + h * sy + 10, w * 0.18 - 8, 2).fillRect(x + w * sx + 4, y + h * sy + 18, w * 0.12, 2);
      g.fillStyle(0xc9473f).fillCircle(x + w * (sx + 0.09), y + h * sy + 3, 2.5); // la punaise rouge
    }
  },

  flipchart(g, x, y, w, h) { // dessine un tableau à feuilles sur pieds
    // les trois pieds du chevalet
    g.fillStyle(0x6c7482).fillRect(x + w * 0.15, y + h * 0.6, 4, h * 0.4).fillRect(x + w * 0.85 - 4, y + h * 0.6, 4, h * 0.4).fillRect(x + w / 2 - 2, y + h * 0.6, 4, h * 0.4);
    g.fillStyle(0xfafafa).fillRect(x, y, w, h * 0.65); // la grande feuille blanche
    g.lineStyle(2, 0x3b6ea8).strokeCircle(x + w * 0.3, y + h * 0.2, 9); // un rond bleu dessiné
    // deux traits rouges dessinés
    g.lineStyle(2, 0xc9473f).lineBetween(x + w * 0.45, y + h * 0.2, x + w * 0.85, y + h * 0.2).lineBetween(x + w * 0.2, y + h * 0.4, x + w * 0.8, y + h * 0.45);
    g.fillStyle(0x4a4f5a).fillRect(x - 3, y - 4, w + 6, 6); // la barre qui tient les feuilles
  },

  beanbag(g, x, y, w, h) { // dessine un pouf
    g.fillStyle(0x8a3b5a).fillEllipse(x + w / 2, y + h * 0.6, w, h * 0.8); // le gros ovale du pouf
    g.fillStyle(0xa64c70).fillEllipse(x + w * 0.45, y + h * 0.45, w * 0.7, h * 0.5); // le dessus, plus clair
  },

  serverRack(g, x, y, w, h) { // dessine une armoire à serveurs
    g.fillStyle(0x1a1c22).fillRect(x, y, w, h); // la grande armoire noire
    for (let ry = y + 8; ry < y + h - 10; ry += 16) { // un serveur tous les 16 pixels
      g.fillStyle(0x2c2f38).fillRect(x + 5, ry, w - 10, 12); // le serveur gris
      g.fillStyle((ry / 16) % 3 < 1 ? 0x3dff7a : 0x4aa3ff).fillRect(x + w - 14, ry + 4, 3, 3); // petite lumière verte ou bleue
    }
  },

  // Plan de travail de la cuisine avec évier, placards et cafetière
  counter(g, x, y, w, h) { // dessine le plan de travail
    g.fillStyle(0xd0d4dc).fillRect(x, y, w, 10); // le dessus gris clair
    g.fillStyle(0x8a6a4a).fillRect(x, y + 10, w, h - 10); // le meuble en bois dessous
    g.lineStyle(2, 0x6e5236); // trait marron foncé
    for (let cx = x; cx < x + w; cx += w / 4) g.strokeRect(cx + 4, y + 16, w / 4 - 8, h - 22); // les 4 portes de placard
    g.fillStyle(0xa0a6b0).fillRect(x + w * 0.6, y + 1, w * 0.18, 7); // évier
    g.fillStyle(0x8a909a).fillRect(x + w * 0.68, y - 16, 4, 16).fillRect(x + w * 0.68, y - 16, 14, 4); // robinet
    g.fillStyle(0x2a2a2a).fillRect(x + 14, y - 38, 30, 38); // cafetière
    g.fillStyle(0xc9473f).fillRect(x + 20, y - 30, 6, 4); // le petit voyant rouge de la cafetière
    g.fillStyle(0xf0ece2).fillRect(x + 52, y - 14, 12, 14); // tasses
    g.fillStyle(0x3b6ea8).fillRect(x + 68, y - 14, 12, 14); // la deuxième tasse, bleue
  },

  vending(g, x, y, w, h) { // dessine un distributeur de boissons
    g.fillStyle(0xb33a3a).fillRect(x, y, w, h); // le corps rouge de la machine
    g.fillStyle(0x1d2a3a).fillRect(x + 8, y + 10, w * 0.62, h * 0.7); // la vitre sombre
    for (let ry = y + 18; ry < y + h * 0.75; ry += 22) { // chaque rangée de produits
      // les produits de couleur, alignés dans la rangée
      for (let rx = x + 12; rx < x + w * 0.62; rx += 14) g.fillStyle(BOOKS[(rx + ry) % BOOKS.length]).fillRect(rx, ry, 10, 14);
    }
    g.fillStyle(0xd8d8d8).fillRect(x + w * 0.75, y + 20, w * 0.15, 30); // la fente pour les pièces
    g.fillStyle(0x111111).fillRect(x + 8, y + h - 24, w * 0.62, 14); // la trappe où tombe la boisson
  },

  arcade(g, x, y, w, h) { // dessine une borne d'arcade
    g.fillStyle(0x3a2a6a).fillRect(x, y, w, h); // le meuble violet
    g.fillStyle(0x111122).fillRect(x + 8, y + 14, w - 16, h * 0.35); // l'écran noir
    g.fillStyle(0x4aa3ff).fillRect(x + 14, y + 22, 10, 6); // un petit dessin bleu sur l'écran
    g.fillStyle(0xc9473f).fillRect(x + w - 26, y + 34, 8, 8); // un petit dessin rouge sur l'écran
    g.fillStyle(0x2a1e50).fillRect(x - 4, y + h * 0.5, w + 8, 12); // le tableau de commandes
    g.fillStyle(0xc9473f).fillCircle(x + w * 0.35, y + h * 0.5 + 6, 4); // le joystick rouge
    g.fillStyle(0x4aa3ff).fillCircle(x + w * 0.6, y + h * 0.5 + 6, 3).fillCircle(x + w * 0.72, y + h * 0.5 + 6, 3); // deux boutons bleus
  },

  backpack(g, x, y, w, h) { // dessine un sac à dos
    g.fillStyle(0x2e5a8a).fillRoundedRect(x, y, w, h, 8); // le sac bleu, coins arrondis
    g.fillStyle(0x24476e).fillRoundedRect(x + w * 0.15, y + h * 0.45, w * 0.7, h * 0.4, 5); // la poche de devant
    g.fillStyle(0xd0d4dc).fillRect(x + w / 2 - 4, y + h * 0.55, 8, 3); // la fermeture éclair
  },

  // Rangée de sièges de l'amphi (au fond)
  amphiSeats(g, x, y, w, h) { // dessine les sièges de l'amphi
    g.fillStyle(0x5e4630).fillRect(x, y + h - 8, w, 8); // la marche en bois en bas
    for (let sx = x + 4; sx < x + w - 26; sx += 30) { // un siège tous les 30 pixels
      g.fillStyle(0x2b3a67).fillRoundedRect(sx, y, 26, h - 10, 4); // le dossier du siège
      g.fillStyle(0x1f2a4d).fillRect(sx + 2, y + h - 16, 22, 6); // l'assise du siège
    }
  },

  exitSign(g, x, y, w, h) { // dessine le panneau vert "sortie"
    g.fillStyle(0x1f8a4c).fillRect(x, y, w, h); // le fond vert
    g.fillStyle(0xffffff).fillRect(x + 6, y + h / 2 - 2, w - 24, 4); // le trait blanc de la flèche
    g.fillTriangle(x + w - 18, y + h / 2 - 7, x + w - 18, y + h / 2 + 7, x + w - 8, y + h / 2); // la pointe de la flèche
  },
};

/** Dessine un élément de décor ; text (facultatif) est écrit par l'appelant. Renvoie false si le type n'existe pas. */
export function drawDecor(g, item) { // fonction utilisée par les autres fichiers
  const draw = DRAWERS[item.type]; // on cherche la fonction de dessin du bon type
  draw?.(g, item.x, item.y, item.w, item.h, item.color); // si elle existe, on la lance
  return !!draw; // on dit si on a trouvé (vrai) ou pas (faux)
}
