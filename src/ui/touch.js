// Version mobile : on détecte un écran tactile (doigt plutôt que souris)
// pour afficher la manette à l'écran et des textes adaptés (« touche » au lieu de « appuie sur E »).

export const isTouch = () =>
  window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

// Plein écran sur TOUTE la page, pas seulement sur le canvas du jeu :
// les boîtes de dialogue (#overlay) sont à côté du canvas, sinon elles seraient invisibles
// et bloqueraient les clics.
const root = document.documentElement;

export const fullscreenAvailable = () => !!(root.requestFullscreen || root.webkitRequestFullscreen);

const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

/** Passe en plein écran (et en paysage quand le téléphone le permet), ou en sort. */
export function toggleFullscreen() {
  if (isFullscreen()) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    return;
  }
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  Promise.resolve(request.call(root, { navigationUI: 'hide' }))
    .then(() => window.screen.orientation?.lock?.('landscape'))
    .catch(() => {}); // refusé (orientation verrouillée, navigateur…) : pas grave
}
