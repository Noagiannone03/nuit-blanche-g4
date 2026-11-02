// Sormiou — OBSERVATION VISUELLE
// Des post-it sont éparpillés dans la salle. Le tableau dit de ne compter que les JAUNES.
// Coordonnées dans la scène (x, y), couleur, rotation en degrés.

export const POSTIT_COLORS = { yellow: 0xffd84d, pink: 0xff7eb6, blue: 0x6cc8ff };

export const POSTITS = [
  { x: 120, y: 150, color: 'yellow', angle: -8 },
  { x: 165, y: 175, color: 'pink', angle: 5 },
  { x: 210, y: 140, color: 'blue', angle: -3 },
  { x: 262, y: 168, color: 'yellow', angle: 10 },
  { x: 330, y: 132, color: 'pink', angle: -12 },
  { x: 700, y: 140, color: 'yellow', angle: 4 },
  { x: 760, y: 165, color: 'blue', angle: -6 },
  { x: 820, y: 138, color: 'pink', angle: 9 },
  { x: 610, y: 470, color: 'yellow', angle: -15 }, // entre le bureau et le casier
  { x: 655, y: 492, color: 'pink', angle: 7 },
  { x: 95, y: 520, color: 'blue', angle: 12 },
  { x: 140, y: 560, color: 'yellow', angle: -4 }, // près de la plante
  { x: 880, y: 560, color: 'pink', angle: -9 },
  { x: 905, y: 330, color: 'blue', angle: 3 },
  { x: 455, y: 600, color: 'yellow', angle: 18 }, // presque caché en bas
];

export const countByColor = (color) => POSTITS.filter((p) => p.color === color).length;
export const solveObservation = () => countByColor('yellow');
