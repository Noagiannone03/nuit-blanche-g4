import { state } from '../state/GameState.js'; // l'état de la partie (objets, temps, énigmes)
import { openDialog } from '../ui/dialog.js'; // fonction qui ouvre une boîte de dialogue
import { POSTITS, POSTIT_COLORS } from '../puzzles/observation.js'; // la liste des post-it et leurs couleurs
import { ROOM_DIGITS } from '../puzzles/code.js'; // les bons chiffres de chaque salle
import { askAnswer, decorHint, timeWaster } from './helpers.js'; // petites fonctions communes aux salles
import { isDialogOpen } from '../ui/dialog.js'; // dit si une boîte de dialogue est déjà ouverte
import { canUse, roleRefusal, ROLES } from '../net/multiplayer.js'; // outils du mode à deux joueurs

// 1re énigme de la chaîne, à faire dans le noir avec le flash du téléphone.
// Elle donne la clé de l'armoire électrique de l'amphi Mont Ventoux (sans le dire au joueur).
// Les 2 post-it jaunes se lisent en cliquant dessus : l'un d'eux donne le mot de passe du PC de Callelongue.
const KEY_NOTE = '<p>Tu as obtenu une clé.</p>'; // texte affiché quand on gagne la clé

/** Lire un post-it jaune (à 2 : c'est l'enquêteur qui lit). */
function readPostit(p) { // affiche ce qui est écrit sur un post-it jaune
  if (isDialogOpen()) return; // si une boîte est déjà ouverte, on ne fait rien
  if (!canUse('enq')) { // si ce joueur n'a pas le droit de lire (pas l'enquêteur)…
    // on lui dit que c'est le rôle de l'enquêteur
    openDialog({ title: `Post-it jaune — ${ROLES.enq.icon} ${ROLES.enq.name}`, body: roleRefusal('enq') });
    return; // et on s'arrête là
  }
  openDialog({ title: 'Post-it jaune', body: `<p class="hand">${p.note}</p>` }); // on affiche le texte du post-it
}

export default { // la description de la salle, utilisée par le jeu
  key: 'sormiou', // identifiant de la salle
  name: 'Salle de cours Sormiou', // nom affiché
  domain: 'Observation visuelle', // matière de l'énigme
  color: 0x2e3d24, // couleur de fond de la salle
  intro: 'Une salle de brainstorming : il y a des post-it partout.', // texte d'arrivée
  // Décor dessiné par-dessus les objets : les post-it à compter
  draw(scene) { // dessine des choses en plus dans la salle
    // une plante verte en bas à gauche
    scene.add.rectangle(80, 585, 40, 40, 0x7a4a2a); // le pot (carré marron)
    scene.add.circle(80, 550, 34, 0x3f8f3a); // les feuilles (rond vert)
    for (const p of POSTITS) { // pour chaque post-it de la liste…
      // on dessine un carré de la bonne couleur, penché, avec un petit contour
      const r = scene.add.rectangle(p.x, p.y, 26, 26, POSTIT_COLORS[p.color]).setAngle(p.angle).setStrokeStyle(1, 0x000000, 0.25);
      // pas de curseur « main » : sinon le survol trahirait où sont les jaunes
      if (p.note) r.setInteractive().on('pointerdown', () => readPostit(p)); // s'il a un texte : on peut cliquer pour le lire
    }
  },
  decor: [ // les éléments de décor (on ne peut pas cliquer dessus)
    { type: 'bookshelf', x: 18, y: 160, w: 100, h: 240 }, // une bibliothèque
    { type: 'flipchart', x: 150, y: 165, w: 90, h: 230 }, // un tableau à feuilles (paperboard)
    { type: 'windowNight', x: 650, y: 150, w: 110, h: 115 }, // une fenêtre de nuit
    { type: 'radiator', x: 655, y: 345, w: 100, h: 38 }, // un radiateur
    { type: 'chairs', x: 255, y: 500, w: 210, h: 60, color: 0x3f8f5a }, // des chaises
    { type: 'bin', x: 515, y: 560, w: 30, h: 40 }, // une poubelle
  ],
  objects: [ // les objets sur lesquels on peut cliquer
    {
      label: 'Tableau blanc', // nom de l'objet
      role: 'enq', // à 2 joueurs : réservé à l'enquêteur
      type: 'whiteboard', // dessin utilisé : un tableau blanc
      x: 480, y: 200, w: 260, h: 130, color: 0xeef0f4, // position, taille et couleur
      onUse() { // quand on clique dessus…
        openDialog({ // on ouvre une boîte de dialogue
          title: 'Tableau blanc', // le titre
          // le texte : il ne faut compter que les post-it jaunes
          body: '<p>Compte-rendu de la réunion de 18h :</p><p class="hand">« On ne garde que les idées validées : les post-it <strong>JAUNES</strong>.<br>On notera le nombre d\'idées retenues dans le coffre. »</p>',
        });
      },
    },
    {
      label: 'Casier à code', // nom de l'objet
      role: 'tech', // à 2 joueurs : réservé au technicien
      type: 'locker', // dessin utilisé : un casier
      x: 820, y: 440, w: 110, h: 150, color: 0x4f5566, // position, taille et couleur
      onUse() { // quand on clique dessus…
        askAnswer({ // on demande une réponse au joueur
          roomKey: 'sormiou', // identifiant de la salle
          title: 'Casier à code', // titre de la boîte
          body: '<p>Un cadenas à un seul chiffre.</p>', // la question
          answer: ROOM_DIGITS.sormiou, // la bonne réponse
          placeholder: 'Chiffre', // texte gris dans la case
          // message de victoire (avec la clé)
          success: `<p>Le casier s'ouvre : une étiquette porte le chiffre <strong>${ROOM_DIGITS.sormiou}</strong>.</p>${KEY_NOTE}`,
          onSolve: () => state.addItem('cle-armoire'), // une fois résolu : le joueur reçoit la clé de l'armoire
          solvedBody: '<p>Tu as déjà pris la clé.</p>', // texte si on revient après avoir résolu
        });
      },
    },
    {
      label: 'Bureau et clavier', // nom de l'objet
      role: 'enq', // à 2 joueurs : réservé à l'enquêteur
      type: 'keyboardDesk', // dessin utilisé : un bureau avec clavier
      x: 360, y: 450, w: 240, h: 90, color: 0x8a5a35, // position, taille et couleur
      onUse() { // quand on clique dessus…
        // on montre l'indice caché : chercher les post-it jaunes partout
        decorHint('sormiou-clavier', 'Bureau', '<p>Sous le clavier, une note :</p><p class="hand">Les infos importantes sont sur les post-it JAUNES : clique dessus pour les lire. Regarde PARTOUT : les murs, le sol, et même près de la plante !</p>');
      },
    },
    {
      label: 'Pouf', // nom de l'objet
      type: 'beanbag', // dessin utilisé : un pouf
      x: 700, y: 550, w: 90, h: 60, color: 0x8a3b5a, // position, taille et couleur
      onUse() { // quand on clique dessus…
        timeWaster({ // objet qui fait perdre du temps
          title: 'Pouf', // titre de la boîte
          intro: '<p>Un gros pouf moelleux. Rien qu\'une minute…</p>', // texte de présentation
          action: 'S\'asseoir une minute', // texte du bouton
          result: '<p>Tu te réveilles en sursaut. « Une minute », hein ?</p>', // ce qui se passe
          minutes: 20, // minutes perdues
        });
      },
    },
  ],
  hints: [ // les indices qu'on peut demander, du plus vague au plus précis
    // indice 1
    'Il fait noir : balaie toute la salle avec le flash de ton téléphone (il suit la souris). Ne compte que les post-it JAUNES — attention, les orange leur ressemblent. Tu peux cliquer sur les post-it jaunes pour lire ce qui est écrit dessus.',
    // indice 2
    'Il y en a très peu : un près de la plante, un sur le mur de droite. Et les post-it ne servent pas qu\'à être comptés : clique sur les post-it jaunes pour lire leur contenu, des indices sont écrits dessus.',
  ],
};
