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

// Ronde du gardien : il longe le couloir central
export const GUARD_PATH = [
  { x: 880, y: 265 },
  { x: 120, y: 265 },
  { x: 120, y: 430 },
  { x: 880, y: 430 },
];

export const HUB_HINTS = [
  'La porte de sortie demande un code à 4 chiffres : chacune des 4 salles de cours en cache un.',
  'L\'ordre des chiffres se trouve au Point repas / Garlaban.',
];
