// Plan du couloir, reproduit d'après le plan d'évacuation du campus de Marseille.
// Coordonnées en pixels (canvas 960 × 640, sous la barre d'interface).

export const WORLD = { x: 0, y: 50, width: 900, height: 590 }; // zone où l'on peut marcher (position et taille)

export const START = { x: 60, y: 345 }; // endroit où l'élève apparaît au début

// accent : couleur de la salle (plaque, étiquettes) ; decor : mobilier vu de dessus (voir HubScene.drawDecor)
export const ROOM_BLOCKS = [ // liste des salles du couloir
  // amphi Mont Ventoux : place, taille, couleur, porte
  { key: 'ventoux', label: 'Amphi\nMont Ventoux', x: 110, y: 60, w: 480, h: 170, accent: 0x8e6bd6, decor: 'amphi', door: { x: 350, y: 250 } },
  // salle de détente : place, taille, couleur, porte
  { key: 'detente', label: 'Salle de\ndétente', x: 640, y: 60, w: 200, h: 210, accent: 0x4a7fc1, decor: 'lounge', door: { x: 740, y: 290 } },
  // salle Callelongue : place, taille, couleur, porte
  { key: 'callelongue', label: 'Callelongue', x: 220, y: 300, w: 310, h: 110, accent: 0x2e9e5b, decor: 'desks', door: { x: 200, y: 355 } },
  // salle Ste Victoire : place, taille, couleur, porte
  { key: 'stevictoire', label: 'Ste Victoire', x: 230, y: 470, w: 200, h: 160, accent: 0xc0392b, decor: 'desks', door: { x: 330, y: 450 } },
  // salle Sormiou : place, taille, couleur, porte
  { key: 'sormiou', label: 'Sormiou', x: 450, y: 470, w: 200, h: 160, accent: 0xe0a030, decor: 'desks', door: { x: 550, y: 450 } },
  // point repas Garlaban : place, taille, couleur, porte
  { key: 'garlaban', label: 'Point repas\n+ Garlaban', x: 690, y: 450, w: 180, h: 180, accent: 0x2a9db0, decor: 'kitchen', door: { x: 780, y: 430 } },
];

// Zones hachurées du plan (sanitaires, locaux techniques) : infranchissables
export const BLOCKED = [ // liste des zones interdites
  { x: 0, y: 50, w: 100, h: 200 }, // zone interdite en haut à gauche
  { x: 0, y: 440, w: 210, h: 200 }, // zone interdite en bas à gauche
];

export const EXIT = { x: 22, y: 345 }; // position de la porte de sortie

// Ronde du gardien : des points de passage dans le couloir, reliés entre eux.
// À chaque carrefour, il choisit une direction au hasard (sans faire demi-tour).
export const GUARD_NODES = { // liste des points de passage du gardien
  hautGauche: { x: 150, y: 265 }, // point en haut à gauche
  hautMilieu: { x: 420, y: 265 }, // point en haut au milieu
  hautDroite: { x: 610, y: 282 }, // point en haut à droite
  detente: { x: 750, y: 295 }, // point devant la salle de détente
  local: { x: 860, y: 300 }, // le local du gardien, près des casiers
  basDroite: { x: 860, y: 425 }, // point en bas à droite
  basMilieu: { x: 610, y: 435 }, // point en bas au milieu
  sormiou: { x: 550, y: 440 }, // point devant Sormiou
  steVictoire: { x: 330, y: 440 }, // point devant Ste Victoire
  basGauche: { x: 205, y: 430 }, // point en bas à gauche
  callelongue: { x: 190, y: 355 }, // point devant Callelongue
  entree: { x: 70, y: 345 }, // point près de l'entrée
};

export const GUARD_EDGES = [ // liste des chemins entre deux points
  ['hautGauche', 'hautMilieu'], // haut gauche ↔ haut milieu
  ['hautMilieu', 'hautDroite'], // haut milieu ↔ haut droite
  ['hautDroite', 'detente'], // haut droite ↔ détente
  ['detente', 'local'], // détente ↔ local
  ['local', 'basDroite'], // local ↔ bas droite
  ['basDroite', 'basMilieu'], // bas droite ↔ bas milieu
  ['basMilieu', 'sormiou'], // bas milieu ↔ Sormiou
  ['sormiou', 'steVictoire'], // Sormiou ↔ Ste Victoire
  ['steVictoire', 'basGauche'], // Ste Victoire ↔ bas gauche
  ['basGauche', 'callelongue'], // bas gauche ↔ Callelongue
  ['callelongue', 'hautGauche'], // Callelongue ↔ haut gauche
  ['callelongue', 'entree'], // Callelongue ↔ entrée
  ['hautDroite', 'basMilieu'], // haut droite ↔ bas milieu (raccourci)
];

export const GUARD_OFFICE = 'local'; // le point de départ du gardien : son local

export const HUB_HINTS = [ // liste des indices du couloir
  // indice 1 : par où commencer
  'Les salles sont noires (ton flash suit la souris). Commence par la salle Sormiou : son casier donne la clé pour rétablir le courant à Mont Ventoux.',
  // indice 2 : le code de la sortie
  'La porte de sortie demande un code à 4 chiffres : un chiffre par salle de cours, lus dans l\'ordre trouvé à Garlaban.',
  // indice 3 : l'ordre des salles
  'Ordre conseillé : Sormiou → Mont Ventoux → Callelongue → Ste Victoire → Point repas / Garlaban → sortie.',
];
