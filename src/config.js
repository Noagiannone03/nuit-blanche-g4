// Réglages du jeu : tout l'équilibrage se fait ici.

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;
export const TOP_BAR = 48; // hauteur de la barre d'interface (horloge, indices…)

// L'horloge du jeu va de 00:00 à 09:00 (540 minutes "en jeu").
export const END_MINUTES = 9 * 60;
// Durée réelle maximale d'une partie : 20 minutes.
export const REAL_DURATION_SEC = 20 * 60;
// → 1 seconde réelle = 0,45 minute en jeu
export const GAME_MIN_PER_SEC = END_MINUTES / REAL_DURATION_SEC;

// Pénalités (en minutes de jeu)
export const PENALTY_ERROR = 20;
export const PENALTY_HINT = 15;

// Embranchement : la ronde du gardien
export const GUARD_TIME = 3 * 60; // à 03:00
// Après 03:00, le gardien enchaîne les rondes jusqu'au matin (durées en temps réel)
export const GUARD_SPEED = 85; // px par seconde (le joueur : 190)
export const PATROL_MS = 40000; // durée d'une ronde
export const AWAY_MS = 30000; // pause du gardien dans son local entre deux rondes
export const GUARD_SIGHT = 65; // distance à laquelle il repère le joueur
export const HIDE_COST = 45; // se cacher fait perdre 45 min…
export const CAUGHT_COST = 60; // …se faire repérer en coûte 60

export const PLAYER_SPEED = 190;
