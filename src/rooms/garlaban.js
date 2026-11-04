import { state } from '../state/GameState.js'; // l'état de la partie (objets, temps, énigmes)
import { openDialog } from '../ui/dialog.js'; // fonction qui ouvre une boîte de dialogue
import { RIDDLE } from '../puzzles/ordre.js'; // le texte de l'énigme du repas
import { ROOM_DIGITS, CODE_ORDER, EXIT_CODE } from '../puzzles/code.js'; // les chiffres, leur ordre et le code final
import { ROOM_NAMES } from './names.js'; // le nom affiché de chaque salle
import { askAnswer, decorHint, timeWaster } from './helpers.js'; // petites fonctions communes aux salles
import { net, ROLES, esc } from '../net/multiplayer.js'; // outils du mode à deux joueurs
import { endGame } from '../scenes/endGame.js'; // fonction qui termine la partie

function orderSummary() { // fabrique la liste des salles dans l'ordre du code
  // une liste numérotée : « nom de la salle : chiffre »
  return `<ol>${CODE_ORDER.map((r) => `<li>${ROOM_NAMES[r]} : <strong>${ROOM_DIGITS[r]}</strong></li>`).join('')}</ol>`;
}

// 5e énigme : le frigo est fermé par un cadenas ; la clé est dans le coffre de Ste Victoire.
// On peut y essayer les clés qu'on a trouvées (celle du boîtier électrique ne rentre pas).
// Sur la porte, un mot de la mère : l'ordre dans lequel elle sert ses enfants donne l'ordre du code.
function openFridge() { // quand on clique sur le frigo
  if (state.hasItem('frigo-ouvert')) { // si le frigo est déjà ouvert…
    readRiddle(); // on lit directement l'énigme
    return; // et on s'arrête là
  }
  const lock = '<p>Le frigo est fermé par un petit cadenas.</p>'; // texte du cadenas
  // à 2 : c'est le technicien qui a le trousseau
  if (net.online && net.role === 'enq') { // si on joue à 2 et que je suis l'enquêteur…
    // on dit que c'est le coéquipier qui a les clés
    openDialog({ title: 'Frigo', body: `${lock}<p><em>C'est <strong>${esc(net.mate.name)}</strong> (${ROLES.tech.icon} ${ROLES.tech.name}) qui a les clés.</em></p>` });
    return; // et on s'arrête là
  }
  const keys = []; // la liste des clés qu'on peut essayer (des boutons)
  // si on a la clé du boîtier : bouton pour l'essayer (elle ne marche pas)
  // on ne dit pas d'où viennent les clés : c'est au joueur de deviner laquelle est la bonne
  if (state.hasItem('cle-armoire')) keys.push({ label: 'Essayer une clé', onClick: (ui) => ui.feedback('La clé ne rentre pas dans le cadenas.') });
  if (state.hasItem('cle-frigo')) { // si on a la clé du coffre…
    keys.push({ // on ajoute un bouton pour l'essayer
      label: state.hasItem('cle-armoire') ? 'Essayer l\'autre clé' : 'Essayer une clé', // texte du bouton
      onClick: () => { // quand on clique…
        state.addItem('frigo-ouvert'); // on note que le frigo est ouvert
        readRiddle(); // on lit l'énigme
      },
    });
  }
  openDialog({ title: 'Frigo', body: lock, buttons: keys }); // on affiche le cadenas et les boutons des clés
}

function readRiddle() { // affiche l'énigme du repas et la case réponse
  askAnswer({ // on demande une réponse au joueur
    roomKey: 'garlaban', // identifiant de la salle
    title: 'Frigo — le mot sur la porte', // titre de la boîte
    doc: RIDDLE, // le texte de l'énigme
    body: '<p>Dans quel ordre sont-ils servis ?</p>', // la question
    answer: EXIT_CODE, // la bonne réponse : le code de sortie
    placeholder: '4 chiffres, dans l\'ordre', // texte gris dans la case
    success: `<p>Tu as trouvé l'ordre du repas… et celui du code de sortie :</p>${orderSummary()}`, // message de victoire
    onSolve: () => state.set('orderFound', true), // une fois résolu : on note que l'ordre est trouvé
    solvedBody: orderSummary(), // texte si on revient après avoir résolu
  });
}

export default { // la description de la salle, utilisée par le jeu
  key: 'garlaban', // identifiant de la salle
  name: 'Point repas & Salle de jeux Garlaban', // nom affiché
  domain: 'Ordre du code', // thème de l'énigme
  color: 0x4a3420, // couleur de fond de la salle
  intro: 'Ça sent encore la pizza de 20h. Un mot est aimanté sur la porte du frigo.', // texte d'arrivée
  decor: [ // les éléments de décor (on ne peut pas cliquer dessus)
    { type: 'counter', x: 320, y: 300, w: 310, h: 100 }, // un comptoir
    { type: 'poster', x: 600, y: 150, w: 80, h: 95, color: 0x2a9db0, text: 'Menu' }, // une affiche « Menu »
    { type: 'table', x: 680, y: 450, w: 170, h: 80 }, // une table
    { type: 'chairs', x: 690, y: 500, w: 150, h: 56, color: 0x2a9db0 }, // des chaises
    { type: 'bin', x: 165, y: 570, w: 32, h: 44 }, // une poubelle
  ],
  objects: [ // les objets sur lesquels on peut cliquer
    {
      label: 'Frigo', // nom de l'objet
      type: 'fridge', // dessin utilisé : un frigo
      x: 220, y: 230, w: 150, h: 200, color: 0xdfe6ea, // position, taille et couleur
      onUse: openFridge, // quand on clique : on ouvre le frigo
    },
    {
      label: 'Micro-ondes', // nom de l'objet
      role: 'enq', // à 2 joueurs : réservé à l'enquêteur
      type: 'microwave', // dessin utilisé : un micro-ondes
      x: 480, y: 200, w: 140, h: 80, color: 0x3a3a3a, // position, taille et couleur
      onUse() { // quand on clique dessus…
        // on montre l'indice caché : XX = fille, XY = garçon
        decorHint('garlaban-microondes', 'Micro-ondes', '<p>Un magnet de cours de SVT est collé dessus :</p><p class="hand">Les hommes ont une paire de chromosomes XY, les femmes XX.<br>Donc les chromosomes féminins ont un nombre PAIR de X !</p>');
      },
    },
    {
      label: 'Baby-foot', // nom de l'objet
      type: 'babyfoot', // dessin utilisé : un baby-foot
      x: 500, y: 460, w: 220, h: 110, color: 0x2f6b3a, // position, taille et couleur
      onUse() { // quand on clique dessus…
        timeWaster({ // objet qui fait perdre du temps
          title: 'Baby-foot', // titre de la boîte
          intro: '<p>Les barres tournent bien, la balle est là…</p>', // texte de présentation
          action: 'Faire une partie', // texte du bouton
          result: '<p>Tu joues contre toi-même. Tu gagnes 10 à 9. Puis tu perds la revanche.</p>', // ce qui se passe
          minutes: 10, // minutes perdues
        });
      },
    },
    {
      label: 'Borne d\'arcade', // nom de l'objet
      type: 'arcade', // dessin utilisé : une borne d'arcade
      x: 275, y: 485, w: 80, h: 150, color: 0x3a2a6a, // position, taille et couleur
      onUse() { // quand on clique dessus…
        timeWaster({ // objet qui fait perdre du temps
          title: 'Borne d\'arcade', // titre de la boîte
          needsPower: true, // ne marche qu'avec le courant
          off: '<p>L\'écran est noir. Elle n\'est pas branchée sur une prise qui marche.</p>', // texte sans courant
          intro: '<p>« INSERT COIN »… la borne est en mode gratuit.</p>', // texte de présentation
          action: 'Battre le meilleur score', // texte du bouton
          result: '<p>GAME OVER. Encore une ? Non ! Le meilleur score n\'a pas bougé.</p>', // ce qui se passe
          minutes: 15, // minutes perdues
        });
      },
    },
    {
      label: 'Distributeur', // nom de l'objet
      type: 'vending', // dessin utilisé : un distributeur
      x: 72, y: 292, w: 100, h: 215, color: 0xb33a3a, // position, taille et couleur
      onUse() { // quand on clique dessus…
        timeWaster({ // objet qui fait perdre du temps
          title: 'Distributeur', // titre de la boîte
          needsPower: true, // ne marche qu'avec le courant
          off: '<p>Éteint. Les barres chocolatées te narguent derrière la vitre.</p>', // texte sans courant
          intro: '<p>Le distributeur ronronne. Il reste des gâteaux et des canettes.</p>', // texte de présentation
          action: 'Prendre un goûter', // texte du bouton
          // ce qui se passe
          result: '<p>La canette reste coincée. Tu secoues la machine pendant de longues minutes… elle finit par tomber.</p>',
          minutes: 8, // minutes perdues
        });
      },
    },
    {
      label: 'Fenêtre entrouverte', // nom de l'objet
      type: 'window', // dessin utilisé : une fenêtre
      x: 820, y: 240, w: 110, h: 170, color: 0x6fa8dc, // position, taille et couleur
      onUse(scene) { // quand on clique dessus…
        openDialog({ // on ouvre une boîte de dialogue
          title: 'Fenêtre entrouverte', // le titre
          // le texte : on peut sauter, mais l'alarme sonnera
          body: '<p>La fenêtre donne sur la rue. Tu pourrais sauter… mais elle est reliée à l\'alarme. Si elle sonne, la sécurité saura que quelqu\'un était là.</p>',
          buttons: [{ label: 'Sauter par la fenêtre', onClick: () => endGame(scene, false, 'window') }], // sauter = partie perdue
        });
      },
    },
  ],
  hints: [ // les indices qu'on peut demander, du plus vague au plus précis
    'La clé du frigo est dans le coffre de la salle Ste Victoire.', // indice 1
    // indice 2
    'Les 4 enfants, ce sont les 4 chiffres trouvés dans les autres salles : chaque chiffre est l\'âge d\'un enfant. Pair = fille (XX), impair = garçon (XY).',
    // indice 3 (presque la solution)
    'Les filles ont 2 et 8 ans, les garçons 3 et 5. Le 3 (plus jeune garçon) est servi 2e, entre son grand frère 5 et une sœur. Le 2 joue avec le 3, et les deux sœurs ne sont pas côte à côte.',
  ],
};
