// Mont Ventoux — LOGIQUE
// Un circuit de portes logiques allume une lampe. Une seule combinaison
// des interrupteurs A, B, C fonctionne ; sa valeur binaire (ABC) donne le chiffre.

export const CIRCUIT_TEXT = [
  'P1 = A OU B',
  'P2 = NON (A ET B)',
  'P3 = NON B',
  'P4 = C ET P1',
  'LAMPE = P2 ET P3 ET P4',
];

export function lamp(a, b, c) {
  const p1 = a || b;
  const p2 = !(a && b);
  const p3 = !b;
  const p4 = c && p1;
  return p2 && p3 && p4;
}

/** Cherche la combinaison qui allume la lampe et la convertit en décimal. */
export function solveLogic() {
  for (let n = 0; n < 8; n++) {
    const a = Boolean(n & 4);
    const b = Boolean(n & 2);
    const c = Boolean(n & 1);
    if (lamp(a, b, c)) return n;
  }
  return null;
}
