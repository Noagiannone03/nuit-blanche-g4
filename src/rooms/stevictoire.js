import { state } from '../state/GameState.js'; // l'état de la partie (objets, temps, énigmes)
import { openDialog } from '../ui/dialog.js'; // fonction qui ouvre une boîte de dialogue
import { TASKS } from '../puzzles/planning.js'; // la liste des tâches du projet
import { ROOM_DIGITS } from '../puzzles/code.js'; // les bons chiffres de chaque salle
import { askAnswer, decorHint, timeWaster } from './helpers.js'; // petites fonctions communes aux salles

// 4e énigme : les durées du planning ont été effacées ; l'imprimante de Callelongue
// les sort une fois le programme du PC résolu. Le coffre donne la clé du frigo de Garlaban.

const FRIDGE_KEY = '<p>Tu as trouvé une clé.</p>'; // texte affiché quand on gagne la clé

const ganttTable = () => { // fabrique le tableau HTML du planning
  const known = state.hasItem('durees'); // vrai si le joueur a la feuille des durées
  // le tableau : une ligne par tâche (durée cachée si on n'a pas la feuille)
  return `<table><thead><tr><th>Tâche</th><th>Nom</th><th>Durée</th><th>Dépend de</th></tr></thead><tbody>${TASKS.map(
    (t) => `<tr><td>${t.id}</td><td>${t.name}</td><td>${known ? `${t.duration} j` : '<em>effacée</em>'}</td><td>${t.deps.join(', ') || '—'}</td></tr>`,
  ).join('')}</tbody></table>`;
};

export default { // la description de la salle, utilisée par le jeu
  key: 'stevictoire', // identifiant de la salle
  name: 'Salle de cours Ste Victoire', // nom affiché
  domain: 'Conception / gestion de projet', // matière de l'énigme
  color: 0x3d2b4f, // couleur de fond de la salle
  intro: 'Les murs sont couverts de plannings d\'anciens Cercles de projets.', // texte d'arrivée
  decor: [ // les éléments de décor (on ne peut pas cliquer dessus)
    { type: 'corkboard', x: 665, y: 150, w: 200, h: 120 }, // un tableau en liège
    { type: 'bookshelf', x: 520, y: 180, w: 105, h: 225 }, // une bibliothèque
    { type: 'coatRack', x: 35, y: 300, w: 60, h: 190 }, // un porte-manteau
    { type: 'poster', x: 40, y: 150, w: 70, h: 90, color: 0xc0392b, text: 'Gantt' }, // une affiche « Gantt »
    { type: 'chairs', x: 175, y: 535, w: 150, h: 56, color: 0x7a3b3b }, // des chaises
    { type: 'plant', x: 860, y: 425, w: 70, h: 100 }, // une plante
  ],
  objects: [ // les objets sur lesquels on peut cliquer
    {
      label: 'Planning au mur', // nom de l'objet
      role: 'enq', // à 2 joueurs : réservé à l'enquêteur
      type: 'planning', // dessin utilisé : un planning
      x: 300, y: 210, w: 340, h: 150, color: 0xf0ead8, // position, taille et couleur
      onUse() { // quand on clique dessus…
        const note = state.hasItem('durees') // si le joueur a la feuille des durées…
          ? '<p><em>Tu complètes les durées avec la feuille imprimée.</em></p>' // … ce texte
          : '<p>Quelqu\'un a effacé la colonne des durées.</p>'; // sinon celui-ci
        openDialog({ // on ouvre une boîte de dialogue
          title: 'Planning du projet « Évasion »', // le titre
          // le texte : la règle des dépendances, puis le tableau et la note
          body: `<p>Une tâche ne peut commencer que lorsque <strong>toutes</strong> ses dépendances sont terminées. Les tâches indépendantes avancent en parallèle.</p>${ganttTable()}${note}`,
        });
      },
    },
    {
      label: 'Coffre de l\'équipe', // nom de l'objet
      role: 'tech', // à 2 joueurs : réservé au technicien
      type: 'safe', // dessin utilisé : un coffre-fort
      x: 720, y: 420, w: 140, h: 120, color: 0x6b6f80, // position, taille et couleur
      onUse() { // quand on clique dessus…
        askAnswer({ // on demande une réponse au joueur
          roomKey: 'stevictoire', // identifiant de la salle
          title: 'Coffre de l\'équipe', // titre de la boîte
          body: '<p>Gravé sur le couvercle : <em>« Chemin critique »</em></p>', // la question
          answer: ROOM_DIGITS.stevictoire, // la bonne réponse
          placeholder: 'Nombre de jours', // texte gris dans la case
          // message de victoire (avec la clé du frigo)
          success: `<p>Clic ! Le coffre s'ouvre. Dedans, une carte avec le chiffre <strong>${ROOM_DIGITS.stevictoire}</strong>.</p>${FRIDGE_KEY}`,
          onSolve: () => state.addItem('cle-frigo'), // une fois résolu : le joueur reçoit la clé du frigo
          solvedBody: '<p>Tu as déjà pris la clé.</p>', // texte si on revient après avoir résolu
        });
      },
    },
    {
      label: 'Carnet du chef de projet', // nom de l'objet
      role: 'enq', // à 2 joueurs : réservé à l'enquêteur
      type: 'notebook', // dessin utilisé : un carnet
      x: 250, y: 470, w: 160, h: 80, color: 0xc9473f, // position, taille et couleur
      onUse() { // quand on clique dessus…
        // on montre l'indice caché : ce qu'est le chemin critique
        decorHint('stevictoire-carnet', 'Carnet du chef de projet', '<p class="hand">Le chemin critique = la plus longue chaîne de tâches dépendantes du début à la fin. C\'est lui qui fixe la durée du projet.</p>');
      },
    },
    {
      label: 'Puzzle sur la table', // nom de l'objet
      type: 'table', // dessin utilisé : une table
      x: 460, y: 490, w: 160, h: 70, color: 0x9a7550, // position, taille et couleur
      onUse() { // quand on clique dessus…
        timeWaster({ // objet qui fait perdre du temps
          title: 'Puzzle sur la table', // titre de la boîte
          intro: '<p>Un puzzle de 1000 pièces, presque fini. Il ne manque que le ciel…</p>', // texte de présentation
          action: 'Placer quelques pièces', // texte du bouton
          result: '<p>Toutes les pièces du ciel se ressemblent. Tu en places trois.</p>', // ce qui se passe
          minutes: 10, // minutes perdues
        });
      },
    },
  ],
  hints: [ // les indices qu'on peut demander, du plus vague au plus précis
    'Les durées effacées sortent de l\'imprimante de Callelongue, une fois le programme du PC résolu.', // indice 1
    'Calcule la date de fin au plus tôt de chaque tâche : fin = durée + la fin la plus tardive de ses dépendances.', // indice 2
    'A finit à J1, B à J4, C à J3. D attend B ET C… et E n\'est pas sur le chemin le plus long.', // indice 3 (presque la solution)
  ],
};
