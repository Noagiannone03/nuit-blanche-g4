// Garlaban / Point repas — ORDRE DU CODE
// Les 4 chiffres trouvés dans les salles sont 4 enfants. Leur valeur = leur âge.
// Pair = fille (XX : un nombre pair de X), impair = garçon (XY).
// La mère les sert toujours dans le même ordre : c'est l'ordre du code de sortie.

export const RIDDLE = `<p class="hand">C'est l'heure de manger !</p>
<p>La mère sert ses enfants toujours dans le même ordre, et chacun s'assoit à sa place dans l'ordre du service :</p>
<ul>
  <li>La grande sœur s'est disputée avec sa petite sœur, qui a touché à son maquillage : elles sont toujours en colère.</li>
  <li>Le deuxième servi est le plus jeune garçon : il s'assoit toujours à côté de son grand frère et d'une de ses sœurs.</li>
  <li>Les deux plus jeunes passent leur temps ensemble : ils adorent jouer ensemble.</li>
</ul>`;

const isGirl = (age) => age % 2 === 0;

/** Toutes les façons de ranger une liste (4 enfants → 24 ordres). */
function permutations(list) {
  if (list.length <= 1) return [list];
  return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [x, ...rest]));
}

/**
 * Ordre de service qui respecte toutes les règles de l'énoncé.
 * digits : { salle: chiffre }. On teste les 24 ordres et on vérifie qu'un seul convient.
 */
export function servingOrder(digits) {
  const rooms = Object.keys(digits);
  const age = (r) => digits[r];
  const girls = rooms.filter((r) => isGirl(age(r)));
  const boys = rooms.filter((r) => !isGirl(age(r)));
  const youngest = (list) => list.reduce((a, b) => (age(a) < age(b) ? a : b));

  const [first, second] = [...rooms].sort((a, b) => age(a) - age(b)); // les deux plus jeunes
  const nextTo = (o, x, y) => Math.abs(o.indexOf(x) - o.indexOf(y)) === 1;

  const valid = permutations(rooms).filter((o) => {
    const neighbours = [o[0], o[2]]; // ceux qui sont assis à côté du 2e servi
    return (
      !nextTo(o, girls[0], girls[1]) && // les deux sœurs fâchées ne sont pas côte à côte
      o[1] === youngest(boys) &&
      neighbours.some((r) => !isGirl(age(r)) && age(r) > age(o[1])) && // son grand frère
      neighbours.some((r) => isGirl(age(r))) && // une de ses sœurs
      nextTo(o, first, second) // les deux plus jeunes, ensemble
    );
  });
  if (valid.length !== 1) throw new Error(`L'énigme du repas a ${valid.length} solutions au lieu d'une`);
  return valid[0];
}
