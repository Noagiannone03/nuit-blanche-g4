// Mont Ventoux — LOGIQUE
// Un circuit de portes logiques allume une lampe. Une seule combinaison
// des interrupteurs A, B, C fonctionne ; sa valeur binaire (ABC) donne le chiffre.

export const CIRCUIT_TEXT = [ // le schéma du circuit, ligne par ligne, affiché au tableau
  'P1 = A OU B', // porte 1 : vraie si A ou B est vrai
  'P2 = NON (A ET B)', // porte 2 : vraie sauf si A et B sont vrais
  'P3 = NON B', // porte 3 : l'inverse de B
  'P4 = C ET P1', // porte 4 : vraie si C et P1 sont vrais
  'LAMPE = P2 ET P3 ET P4', // la lampe s'allume si les 3 portes sont vraies
];

export function lamp(a, b, c) { // dit si la lampe s'allume pour ces interrupteurs
  const p1 = a || b; // P1 = A OU B
  const p2 = !(a && b); // P2 = NON (A ET B)
  const p3 = !b; // P3 = NON B
  const p4 = c && p1; // P4 = C ET P1
  return p2 && p3 && p4; // vrai seulement si P2, P3 et P4 sont vrais
}

/** Cherche la combinaison qui allume la lampe et la convertit en décimal. */
export function solveLogic() { // trouve le chiffre de la salle
  for (let n = 0; n < 8; n++) { // on essaie les 8 nombres de 0 à 7
    const a = Boolean(n & 4); // A = le bit qui vaut 4
    const b = Boolean(n & 2); // B = le bit qui vaut 2
    const c = Boolean(n & 1); // C = le bit qui vaut 1
    if (lamp(a, b, c)) return n; // si la lampe s'allume, ce nombre est la réponse
  }
  return null; // aucune combinaison ne marche (ne devrait pas arriver)
}
