// Version mobile : on détecte un écran tactile (doigt plutôt que souris)
// pour afficher la manette à l'écran et des textes adaptés (« touche » au lieu de « appuie sur E »).

export const isTouch = () =>
  window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

/** Passe en plein écran (et en paysage quand le téléphone le permet). */
export function toggleFullscreen(scene) {
  if (scene.scale.isFullscreen) {
    scene.scale.stopFullscreen();
    return;
  }
  scene.scale.startFullscreen();
  window.screen.orientation?.lock?.('landscape').catch(() => {}); // refusé sur certains navigateurs : pas grave
}
