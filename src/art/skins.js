import { PLAYER_PALETTE, shade } from './characters.js';

// Skins de l'élève : on choisit chaque partie dans le menu (« Mon élève »).
// Le skin est gardé dans le navigateur et envoyé au coéquipier en partie à 2.
// Pas de sweat jaune : on le confondrait avec les post-it jaunes de Sormiou.

const SKIN_KEY = 'nuit-blanche-g4:skin';

export const SKIN_OPTIONS = [
  { key: 'skin', label: 'Peau', choices: [['clair', 0xf6d6bd], ['rose', 0xf2c4a0], ['mat', 0xd9a77f], ['brun', 0xa8704a], ['fonce', 0x6e4630]] },
  { key: 'hair', label: 'Cheveux', choices: [['noir', 0x1f1b22], ['brun', 0x4a2f1f], ['chatain', 0x8a5a36], ['blond', 0xd9b45a], ['roux', 0xb5532a], ['blanc', 0xe8e4dc], ['bleu', 0x3b6ea8], ['rose', 0xd56a9a], ['vert', 0x3f8f5a]] },
  { key: 'style', label: 'Coiffure', choices: [['court', 'Courts'], ['long', 'Longs'], ['bonnet', 'Bonnet']] },
  { key: 'jacket', label: 'Sweat', choices: [['rouge', 0xc8423b], ['bleu', 0x3b6ea8], ['vert', 0x3f8f5a], ['violet', 0x7a4fa0], ['rose', 0xd56a9a], ['orange', 0xe07b1f], ['noir', 0x2a2a30], ['gris', 0x9a9ea8], ['blanc', 0xe8e4dc], ['bordeaux', 0x7a2a3a]] },
  { key: 'pants', label: 'Pantalon', choices: [['jean', 0x3b5b8c], ['noir', 0x26262c], ['beige', 0xc9b48a], ['gris', 0x6c7078], ['kaki', 0x5e6b3a]] },
  { key: 'shoes', label: 'Baskets', choices: [['blanc', 0xf4f4f4], ['noir', 0x222222], ['rouge', 0xc8423b], ['bleu', 0x3b6ea8], ['vert', 0x3f8f5a]] },
];

export const DEFAULT_SKIN = { skin: 'rose', hair: 'brun', style: 'court', jacket: 'rouge', pants: 'jean', shoes: 'blanc' };
// le coéquipier, s'il n'a rien choisi
export const DEFAULT_MATE_SKIN = { skin: 'rose', hair: 'blond', style: 'court', jacket: 'vert', pants: 'gris', shoes: 'blanc' };

/** Garde seulement des choix qui existent (le skin du coéquipier vient du réseau). */
export function cleanSkin(skin, fallback = DEFAULT_SKIN) {
  const out = {};
  for (const o of SKIN_OPTIONS) out[o.key] = o.choices.some(([id]) => id === skin?.[o.key]) ? skin[o.key] : fallback[o.key];
  return out;
}

const value = (key, id) => SKIN_OPTIONS.find((o) => o.key === key).choices.find(([cid]) => cid === id)[1];
const lighten = (c, f) => {
  const mix = (v) => Math.round(v + (255 - v) * f);
  return (mix((c >> 16) & 255) << 16) | (mix((c >> 8) & 255) << 8) | mix(c & 255);
};

/** Palette de couleurs du sprite à partir des choix du joueur. */
export function paletteFromSkin(skin) {
  const s = cleanSkin(skin);
  const jacket = value('jacket', s.jacket);
  const shoes = value('shoes', s.shoes);
  return {
    ...PLAYER_PALETTE,
    skin: value('skin', s.skin),
    skinShadow: shade(value('skin', s.skin), 0.85),
    hair: value('hair', s.hair),
    hairLight: lighten(value('hair', s.hair), 0.3),
    jacket,
    jacketShadow: shade(jacket, 0.72),
    detail: s.jacket === 'blanc' ? 0x8a8e98 : 0xf2e6d8, // cordons visibles même sur un sweat blanc
    pants: value('pants', s.pants),
    shoes,
    sole: s.shoes === 'blanc' ? 0x9a9a9a : shade(shoes, 0.6),
    style: s.style,
  };
}

export function loadSkin() {
  try {
    return cleanSkin(JSON.parse(localStorage.getItem(SKIN_KEY)));
  } catch {
    return { ...DEFAULT_SKIN };
  }
}

export function saveSkin(skin) {
  try {
    localStorage.setItem(SKIN_KEY, JSON.stringify(cleanSkin(skin)));
  } catch {
    /* stockage indisponible : le skin vaut pour cette partie seulement */
  }
}
