// Plan du couloir, reproduit d'après le plan d'évacuation du campus de Marseille.
// Coordonnées en pixels (canvas 960 × 640, sous la barre d'interface).

export const WORLD = { x: 0, y: 50, width: 900, height: 590 };

export const START = { x: 60, y: 345 };

// accent : couleur de la salle (plaque, étiquettes) ; decor : mobilier vu de dessus (voir HubScene.drawDecor)
export const ROOM_BLOCKS = [
  { key: 'ventoux', label: 'Amphi\nMont Ventoux', x: 110, y: 60, w: 480, h: 170, accent: 0x8e6bd6, decor: 'amphi', door: { x: 350, y: 250 } },
  { key: 'detente', label: 'Salle de\ndétente', x: 640, y: 60, w: 200, h: 210, accent: 0x4a7fc1, decor: 'lounge', door: { x: 740, y: 290 } },
  { key: 'callelongue', label: 'Callelongue', x: 220, y: 300, w: 310, h: 110, accent: 0x2e9e5b, decor: 'desks', door: { x: 200, y: 355 } },
  { key: 'stevictoire', label: 'Ste Victoire', x: 230, y: 470, w: 200, h: 160, accent: 0xc0392b, decor: 'desks', door: { x: 330, y: 450 } },
  { key: 'sormiou', label: 'Sormiou', x: 450, y: 470, w: 200, h: 160, accent: 0xe0a030, decor: 'desks', door: { x: 550, y: 450 } },
  { key: 'garlaban', label: 'Point repas\n+ Garlaban', x: 690, y: 450, w: 180, h: 180, accent: 0x2a9db0, decor: 'kitchen', door: { x: 780, y: 430 } },
];

// Zones hachurées du plan (sanitaires, locaux techniques) : infranchissables
export const BLOCKED = [
  { x: 0, y: 50, w: 100, h: 200 },
  { x: 0, y: 440, w: 210, h: 200 },
];

export const EXIT = { x: 22, y: 345 };

// Ronde du gardien : des points de passage dans le couloir, reliés entre eux.
// À chaque carrefour, il choisit une direction au hasard (sans faire demi-tour).
export const GUARD_NODES = {
  hautGauche: { x: 150, y: 265 },
  hautMilieu: { x: 420, y: 265 },
  hautDroite: { x: 610, y: 282 },
  detente: { x: 750, y: 295 },
  local: { x: 860, y: 300 }, // le local du gardien, près des casiers
  basDroite: { x: 860, y: 425 },
  basMilieu: { x: 610, y: 435 },
  sormiou: { x: 550, y: 440 },
  steVictoire: { x: 330, y: 440 },
  basGauche: { x: 205, y: 430 },
  callelongue: { x: 190, y: 355 },
  entree: { x: 70, y: 345 },
};

export const GUARD_EDGES = [
  ['hautGauche', 'hautMilieu'],
  ['hautMilieu', 'hautDroite'],
  ['hautDroite', 'detente'],
  ['detente', 'local'],
  ['local', 'basDroite'],
  ['basDroite', 'basMilieu'],
  ['basMilieu', 'sormiou'],
  ['sormiou', 'steVictoire'],
  ['steVictoire', 'basGauche'],
  ['basGauche', 'callelongue'],
  ['callelongue', 'hautGauche'],
  ['callelongue', 'entree'],
  ['hautDroite', 'basMilieu'],
];

export const GUARD_OFFICE = 'local';

export const HUB_HINTS = [
  'Les salles sont noires (ton flash suit la souris). Commence par la salle Sormiou : son casier donne la clé pour rétablir le courant à Mont Ventoux.',
  'La porte de sortie demande un code à 4 chiffres : un chiffre par salle de cours, lus dans l\'ordre trouvé à Garlaban.',
  'Ordre conseillé : Sormiou → Mont Ventoux → Callelongue → Ste Victoire → Point repas / Garlaban → sortie.',
];
