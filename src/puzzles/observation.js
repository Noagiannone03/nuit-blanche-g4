// Sormiou — OBSERVATION VISUELLE
// Des dizaines de post-it sont éparpillés dans la salle. Le tableau dit de ne compter que les JAUNES :
// il n'y en a que 2, perdus au milieu des autres couleurs (dont l'orange, pour piéger l'œil).
// Coordonnées dans la scène (x, y), couleur, rotation en degrés.

import { PC_PASSWORD } from './algorithmique.js'; // on récupère le mot de passe du PC

export const POSTIT_COLORS = { // le code couleur de chaque sorte de post-it
  yellow: 0xffd84d, // jaune
  orange: 0xff9b3d, // orange
  pink: 0xff7eb6, // rose
  blue: 0x6cc8ff, // bleu
  green: 0x8ee07f, // vert
  purple: 0xb99cff, // violet
};

// Les 2 seuls post-it jaunes ; on peut les lire en cliquant dessus (note).
// L'un d'eux porte le mot de passe du PC de Callelongue, sans dire à quoi il sert.
const YELLOW = [ // la liste des post-it jaunes
  { x: 140, y: 560, color: 'yellow', angle: -4, note: `mdp : ${PC_PASSWORD}` }, // près de la plante
  { x: 905, y: 330, color: 'yellow', angle: 3, note: 'Idée validée : on finit TOUJOURS par un commit !' }, // sur le mur de droite
];

// Les leurres : placés "au hasard", mais toujours au même endroit d'une partie à l'autre
// (générateur pseudo-aléatoire avec une graine fixe).
const DECOY_COLORS = ['orange', 'pink', 'blue', 'green', 'purple']; // les couleurs des faux post-it
function decoys(count, seed = 42) { // fabrique « count » faux post-it
  let s = seed; // le point de départ du hasard (toujours le même)
  const rand = () => { // petite fonction qui donne un nombre « au hasard » entre 0 et 1
    s = (s * 16807) % 2147483647; // calcul qui mélange le nombre
    return s / 2147483647; // on le ramène entre 0 et 1
  };
  const list = []; // la liste des faux post-it, vide au début
  while (list.length < count) { // tant qu'on n'en a pas assez…
    // on crée un post-it : position, couleur et angle au hasard
    const p = { x: 40 + rand() * 880, y: 150 + rand() * 470, color: DECOY_COLORS[list.length % DECOY_COLORS.length], angle: rand() * 36 - 18 };
    const nearYellow = YELLOW.some((y) => Math.hypot(y.x - p.x, y.y - p.y) < 40); // ne pas cacher un jaune
    const onUi = (p.x > 760 && p.y > 580) || (p.x > 580 && p.x < 660 && p.y > 550); // bouton retour, élève
    if (!nearYellow && !onUi) list.push(p); // s'il ne gêne rien, on le garde
  }
  return list; // on renvoie la liste
}

export const POSTITS = [...decoys(48), ...YELLOW]; // tous les post-it : 48 faux + les jaunes

export const countByColor = (color) => POSTITS.filter((p) => p.color === color).length; // compte les post-it d'une couleur
export const solveObservation = () => countByColor('yellow'); // la réponse : le nombre de post-it jaunes
