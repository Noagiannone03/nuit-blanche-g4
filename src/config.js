// Réglages du jeu : tout l'équilibrage se fait ici.

export const GAME_WIDTH = 960; // largeur du jeu en pixels
export const GAME_HEIGHT = 640; // hauteur du jeu en pixels
export const TOP_BAR = 48; // hauteur de la barre d'interface (horloge, indices…)

// L'horloge du jeu va de 00:00 à 09:00 (540 minutes "en jeu").
export const END_MINUTES = 9 * 60; // fin du jeu à 9 h, soit 540 minutes
// Durée réelle maximale d'une partie : 20 minutes.
export const REAL_DURATION_SEC = 20 * 60; // 20 minutes réelles, en secondes
// → 1 seconde réelle = 0,45 minute en jeu
export const GAME_MIN_PER_SEC = END_MINUTES / REAL_DURATION_SEC; // minutes de jeu qui passent chaque seconde réelle

// Pénalités (en minutes de jeu)
export const PENALTY_ERROR = 20; // minutes perdues pour une mauvaise réponse
export const PENALTY_HINT = 15; // minutes perdues quand on demande un indice

// Le gardien : quand le courant revient (amphi Mont Ventoux), il enchaîne les rondes jusqu'au matin
// (durées en temps réel). S'il repère l'élève, c'est perdu.
export const GUARD_SPEED = 85; // px par seconde (le joueur : 190)
export const PATROL_MS = 40000; // durée d'une ronde
export const AWAY_MS = 30000; // pause du gardien dans son local entre deux rondes
export const GUARD_SIGHT = 120; // rayon de sa lampe torche : il repère le joueur à cette distance

// Salles plongées dans le noir tant que le courant n'est pas rétabli
export const FLASH_RADIUS = 110; // rayon éclairé par le flash du téléphone (suit la souris)

export const PLAYER_SPEED = 190; // vitesse du joueur en pixels par seconde
