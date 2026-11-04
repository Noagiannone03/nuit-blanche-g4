import { PLAYER_PALETTE, shade } from './characters.js'; // on récupère des outils du fichier des personnages

// Skins de l'élève : on choisit chaque partie dans le menu (« Mon élève »).
// Le skin est gardé dans le navigateur et envoyé au coéquipier en partie à 2.
// Pas de sweat jaune : on le confondrait avec les post-it jaunes de Sormiou.

const SKIN_KEY = 'nuit-blanche-g4:skin'; // nom de la case où le navigateur garde le skin

export const SKIN_OPTIONS = [ // liste des parties qu'on peut choisir
  // choix de couleur de peau
  { key: 'skin', label: 'Peau', choices: [['clair', 0xf6d6bd], ['rose', 0xf2c4a0], ['mat', 0xd9a77f], ['brun', 0xa8704a], ['fonce', 0x6e4630]] },
  // choix de couleur de cheveux
  { key: 'hair', label: 'Cheveux', choices: [['noir', 0x1f1b22], ['brun', 0x4a2f1f], ['chatain', 0x8a5a36], ['blond', 0xd9b45a], ['roux', 0xb5532a], ['blanc', 0xe8e4dc], ['bleu', 0x3b6ea8], ['rose', 0xd56a9a], ['vert', 0x3f8f5a]] },
  { key: 'style', label: 'Coiffure', choices: [['court', 'Courts'], ['long', 'Longs'], ['bonnet', 'Bonnet']] }, // choix de coiffure
  // choix de couleur du sweat
  { key: 'jacket', label: 'Sweat', choices: [['rouge', 0xc8423b], ['bleu', 0x3b6ea8], ['vert', 0x3f8f5a], ['violet', 0x7a4fa0], ['rose', 0xd56a9a], ['orange', 0xe07b1f], ['noir', 0x2a2a30], ['gris', 0x9a9ea8], ['blanc', 0xe8e4dc], ['bordeaux', 0x7a2a3a]] },
  // choix de couleur du pantalon
  { key: 'pants', label: 'Pantalon', choices: [['jean', 0x3b5b8c], ['noir', 0x26262c], ['beige', 0xc9b48a], ['gris', 0x6c7078], ['kaki', 0x5e6b3a]] },
  // choix de couleur des baskets
  { key: 'shoes', label: 'Baskets', choices: [['blanc', 0xf4f4f4], ['noir', 0x222222], ['rouge', 0xc8423b], ['bleu', 0x3b6ea8], ['vert', 0x3f8f5a]] },
];

// tenue de l'élève par défaut
export const DEFAULT_SKIN = { skin: 'rose', hair: 'brun', style: 'court', jacket: 'rouge', pants: 'jean', shoes: 'blanc' };
// le coéquipier, s'il n'a rien choisi
// tenue du coéquipier par défaut
export const DEFAULT_MATE_SKIN = { skin: 'rose', hair: 'blond', style: 'court', jacket: 'vert', pants: 'gris', shoes: 'blanc' };

/** Garde seulement des choix qui existent (le skin du coéquipier vient du réseau). */
export function cleanSkin(skin, fallback = DEFAULT_SKIN) { // fonction qui vérifie un skin
  const out = {}; // on prépare un skin vide
  // pour chaque partie : choix valide gardé, sinon celui par défaut
  for (const o of SKIN_OPTIONS) out[o.key] = o.choices.some(([id]) => id === skin?.[o.key]) ? skin[o.key] : fallback[o.key];
  return out; // on rend le skin vérifié
}

// trouve le code couleur d'un choix
const value = (key, id) => SKIN_OPTIONS.find((o) => o.key === key).choices.find(([cid]) => cid === id)[1];
const lighten = (c, f) => { // fonction qui éclaircit une couleur
  const mix = (v) => Math.round(v + (255 - v) * f); // rapproche un morceau de couleur du blanc
  // on éclaircit le rouge, le vert et le bleu, puis on recolle
  return (mix((c >> 16) & 255) << 16) | (mix((c >> 8) & 255) << 8) | mix(c & 255);
};

/** Palette de couleurs du sprite à partir des choix du joueur. */
export function paletteFromSkin(skin) { // fonction qui fabrique les couleurs du personnage
  const s = cleanSkin(skin); // on vérifie d'abord le skin
  const jacket = value('jacket', s.jacket); // couleur du sweat choisie
  const shoes = value('shoes', s.shoes); // couleur des baskets choisie
  return { // on rend la liste des couleurs
    ...PLAYER_PALETTE, // on part des couleurs de base du joueur
    skin: value('skin', s.skin), // couleur de peau
    skinShadow: shade(value('skin', s.skin), 0.85), // peau un peu plus foncée pour l'ombre
    hair: value('hair', s.hair), // couleur des cheveux
    hairLight: lighten(value('hair', s.hair), 0.3), // cheveux un peu plus clairs pour les reflets
    jacket, // couleur du sweat
    jacketShadow: shade(jacket, 0.72), // sweat plus foncé pour l'ombre
    detail: s.jacket === 'blanc' ? 0x8a8e98 : 0xf2e6d8, // cordons visibles même sur un sweat blanc
    pants: value('pants', s.pants), // couleur du pantalon
    shoes, // couleur des baskets
    sole: s.shoes === 'blanc' ? 0x9a9a9a : shade(shoes, 0.6), // couleur de la semelle
    style: s.style, // la coiffure choisie
  };
}

export function loadSkin() { // fonction qui relit le skin sauvegardé
  try { // on essaie (si ça plante, on passe au « catch »)
    return cleanSkin(JSON.parse(localStorage.getItem(SKIN_KEY))); // on lit le skin dans le navigateur et on le vérifie
  } catch { // si la lecture a planté
    return { ...DEFAULT_SKIN }; // on rend une copie du skin par défaut
  }
}

export function saveSkin(skin) { // fonction qui sauvegarde le skin
  try { // on essaie (si ça plante, on passe au « catch »)
    localStorage.setItem(SKIN_KEY, JSON.stringify(cleanSkin(skin))); // on écrit le skin vérifié dans le navigateur
  } catch { // si la sauvegarde plante, on ne fait rien
    /* stockage indisponible : le skin vaut pour cette partie seulement */
  }
}
