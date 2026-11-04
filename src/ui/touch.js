// Version mobile : on détecte un écran tactile (doigt plutôt que souris)
// pour afficher la manette à l'écran et des textes adaptés (« touche » au lieu de « appuie sur E »).

export const isTouch = () => // fonction qui répond vrai si l'écran est tactile
  // vrai si pointeur imprécis (doigt), ou points tactiles, ou événement tactile
  window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

// Plein écran sur TOUTE la page, pas seulement sur le canvas du jeu :
// les boîtes de dialogue (#overlay) sont à côté du canvas, sinon elles seraient invisibles
// et bloqueraient les clics.
const root = document.documentElement; // root = toute la page web

// vrai si le navigateur sait passer en plein écran
export const fullscreenAvailable = () => !!(root.requestFullscreen || root.webkitRequestFullscreen);

const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement); // vrai si on est déjà en plein écran

/** Passe en plein écran (et en paysage quand le téléphone le permet), ou en sort. */
export function toggleFullscreen() { // fonction pour entrer ou sortir du plein écran
  if (isFullscreen()) { // si on est déjà en plein écran…
    (document.exitFullscreen || document.webkitExitFullscreen).call(document); // … on en sort (deux noms selon le navigateur)
    return; // et on s'arrête là
  }
  const request = root.requestFullscreen || root.webkitRequestFullscreen; // on prend la fonction plein écran du navigateur
  Promise.resolve(request.call(root, { navigationUI: 'hide' })) // on demande le plein écran, en cachant les barres du navigateur
    .then(() => window.screen.orientation?.lock?.('landscape')) // ensuite, on essaie de tourner l'écran en paysage
    .catch(() => {}); // refusé (orientation verrouillée, navigateur…) : pas grave
}
