// Sormiou — OBSERVATION VISUELLE
// Des dizaines de post-it sont éparpillés dans la salle. Le tableau dit de ne compter que les JAUNES :
// il n'y en a que 2, perdus au milieu des autres couleurs (dont l'orange, pour piéger l'œil).
// Coordonnées dans la scène (x, y), couleur, rotation en degrés.

import { PC_PASSWORD } from './algorithmique.js';

export const POSTIT_COLORS = {
  yellow: 0xffd84d,
  orange: 0xff9b3d,
  pink: 0xff7eb6,
  blue: 0x6cc8ff,
  green: 0x8ee07f,
  purple: 0xb99cff,
};

// Les 2 seuls post-it jaunes ; on peut les lire en cliquant dessus (note).
// L'un d'eux porte le mot de passe du PC de Callelongue, sans dire à quoi il sert.
const YELLOW = [
  { x: 140, y: 560, color: 'yellow', angle: -4, note: `mdp : ${PC_PASSWORD}` }, // près de la plante
  { x: 905, y: 330, color: 'yellow', angle: 3, note: 'Idée validée : on finit TOUJOURS par un commit !' }, // sur le mur de droite
];

// Les leurres : placés "au hasard", mais toujours au même endroit d'une partie à l'autre
// (générateur pseudo-aléatoire avec une graine fixe).
const DECOY_COLORS = ['orange', 'pink', 'blue', 'green', 'purple'];
function decoys(count, seed = 42) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const list = [];
  while (list.length < count) {
    const p = { x: 40 + rand() * 880, y: 150 + rand() * 470, color: DECOY_COLORS[list.length % DECOY_COLORS.length], angle: rand() * 36 - 18 };
    const nearYellow = YELLOW.some((y) => Math.hypot(y.x - p.x, y.y - p.y) < 40); // ne pas cacher un jaune
    const onUi = (p.x > 760 && p.y > 580) || (p.x > 580 && p.x < 660 && p.y > 550); // bouton retour, élève
    if (!nearYellow && !onUi) list.push(p);
  }
  return list;
}

export const POSTITS = [...decoys(48), ...YELLOW];

export const countByColor = (color) => POSTITS.filter((p) => p.color === color).length;
export const solveObservation = () => countByColor('yellow');
