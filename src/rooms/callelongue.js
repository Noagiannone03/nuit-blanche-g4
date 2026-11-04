import { state } from '../state/GameState.js'; // l'état de la partie (objets, temps, énigmes)
import { openDialog } from '../ui/dialog.js'; // fonction qui ouvre une boîte de dialogue
import { PSEUDO_CODE, PC_PASSWORD } from '../puzzles/algorithmique.js'; // le programme à lire et le mot de passe du PC
import { TASKS } from '../puzzles/planning.js'; // la liste des tâches du projet
import { ROOM_DIGITS } from '../puzzles/code.js'; // les bons chiffres de chaque salle
import { PENALTY_ERROR } from '../config.js'; // minutes perdues à chaque erreur
import { askAnswer, decorHint, timeWaster } from './helpers.js'; // petites fonctions communes aux salles
import { net, ROLES, esc } from '../net/multiplayer.js'; // outils du mode à deux joueurs

// 3e énigme : le PC ne s'allume qu'une fois le courant rétabli (énigme de Mont Ventoux résolue),
// et son mot de passe est sur un post-it jaune de Sormiou.
// Une fois le programme résolu, l'imprimante sort les durées des tâches dont Ste Victoire a besoin
// (il faut aller la chercher en cliquant sur l'imprimante).
const durationsTable = () => // fabrique un tableau HTML avec la durée de chaque tâche
  `<table><thead><tr><th>Tâche</th><th>Durée</th></tr></thead><tbody>${TASKS.map((t) => `<tr><td>${t.id} — ${t.name}</td><td>${t.duration} jour${t.duration > 1 ? 's' : ''}</td></tr>`).join('')}</tbody></table>`;
// le texte de la feuille imprimée, avec le tableau des durées
const PRINT_TEXT = () => `<p>L'imprimante se réveille et crache une feuille : <em>« Projet Évasion — durées des tâches »</em>.</p>${durationsTable()}`;

function openProgram() { // affiche le programme du PC et demande la réponse
  askAnswer({ // on demande une réponse au joueur
    roomKey: 'callelongue', // identifiant de la salle
    title: 'PC du formateur — programme.algo', // titre de la boîte
    // le document : une phrase puis le programme à dérouler
    doc: `<p>Le dernier fichier ouvert. Le bouton « Exécuter » est cassé : à toi de jouer le rôle de l'ordinateur.</p><pre>${PSEUDO_CODE}</pre>`,
    body: '<p>Qu\'affiche ce programme ?</p>', // la question
    answer: ROOM_DIGITS.callelongue, // la bonne réponse
    placeholder: 'Valeur affichée', // texte gris dans la case
    // message de victoire (et l'imprimante se réveille)
    success: `<p>Le terminal affiche <strong>${ROOM_DIGITS.callelongue}</strong> puis : <em>« Bravo, tu ferais un bon compilateur. »</em></p><p>Quelque part dans la salle, une machine se met à ronronner…</p>`,
  });
}

function openPc() { // quand on clique sur le PC du formateur
  if (!state.hasItem('courant')) { // s'il n'y a pas de courant…
    openDialog({ title: 'PC du formateur', body: '<p>L\'écran reste noir. Pas de courant.</p>' }); // écran noir
    return; // et on s'arrête là
  }
  if (state.hasItem('pc-unlocked')) { // si le PC est déjà déverrouillé…
    openProgram(); // on affiche directement le programme
    return; // et on s'arrête là
  }
  const lock = '<p>« Session Callelongue ». Il faut un mot de passe.</p>'; // texte de l'écran verrouillé
  // à 2 : seul le technicien a le clavier
  if (net.online && net.role === 'enq') { // si on joue à 2 et que je suis l'enquêteur…
    // on dit que c'est le coéquipier qui a le clavier
    openDialog({ title: 'PC du formateur — session verrouillée', body: `${lock}<p><em>C'est <strong>${esc(net.mate.name)}</strong> (${ROLES.tech.icon} ${ROLES.tech.name}) qui a le clavier.</em></p>` });
    return; // et on s'arrête là
  }
  openDialog({ // on ouvre la boîte pour taper le mot de passe
    title: 'PC du formateur — session verrouillée', // le titre
    body: lock, // le texte de l'écran verrouillé
    input: { placeholder: 'Mot de passe', maxLength: 20 }, // la case pour le mot de passe
    submitLabel: 'Se connecter', // texte du bouton pour valider
    onSubmit(value, ui) { // quand le joueur valide…
      if (value.toUpperCase() === PC_PASSWORD) { // si le mot de passe est bon (majuscules ou pas)
        state.addItem('pc-unlocked'); // on note que le PC est déverrouillé
        openProgram(); // on affiche le programme
      } else { // sinon (mauvais mot de passe)
        state.penalize(); // on ajoute des minutes de pénalité
        ui.feedback(`Mot de passe incorrect. +${PENALTY_ERROR} min.`); // on prévient le joueur
      }
    },
  });
}

export default { // la description de la salle, utilisée par le jeu
  key: 'callelongue', // identifiant de la salle
  name: 'Salle de cours Callelongue', // nom affiché
  domain: 'Algorithmique / code', // matière de l'énigme
  color: 0x1f3b3a, // couleur de fond de la salle
  intro: 'Des rangées d\'écrans éteints. Ça sent la poussière et le café froid.', // texte d'arrivée
  decor: [ // les éléments de décor (on ne peut pas cliquer dessus)
    { type: 'windowNight', x: 160, y: 150, w: 110, h: 120 }, // une fenêtre de nuit
    { type: 'radiator', x: 165, y: 336, w: 100, h: 30 }, // un radiateur
    { type: 'poster', x: 640, y: 160, w: 80, h: 100, color: 0x2e9e5b, text: 'while(1)' }, // une affiche « while(1) »
    { type: 'poster', x: 760, y: 190, w: 80, h: 100, color: 0x3b6ea8, text: 'Git' }, // une affiche « Git »
    { type: 'serverRack', x: 18, y: 260, w: 66, h: 220 }, // une armoire de serveurs
    { type: 'studentPc', x: 290, y: 420, w: 120, h: 90 }, // un PC d'élève
    { type: 'chairs', x: 300, y: 520, w: 260, h: 56, color: 0x3a4a6a }, // des chaises
    { type: 'bin', x: 250, y: 575, w: 30, h: 40 }, // une poubelle
  ],
  objects: [ // les objets sur lesquels on peut cliquer
    {
      label: 'PC du formateur', // nom de l'objet
      // écran éteint tant que le courant n'est pas rétabli
      get type() { // le dessin change selon le courant
        return state.hasItem('courant') ? 'pc' : 'pcOff'; // allumé s'il y a du courant, sinon éteint
      },
      x: 480, y: 230, w: 200, h: 130, color: 0x111318, // position, taille et couleur
      onUse: openPc, // quand on clique : on ouvre le PC
    },
    {
      label: 'Imprimante', // nom de l'objet
      role: 'enq', // à 2 joueurs : réservé à l'enquêteur
      type: 'printer', // dessin utilisé : une imprimante
      x: 180, y: 430, w: 150, h: 100, color: 0xcfd2dc, // position, taille et couleur
      onUse() { // quand on clique dessus…
        if (state.data.solved.callelongue) { // si le programme du PC est résolu…
          const first = !state.hasItem('durees'); // vrai si c'est la première fois qu'on prend la feuille
          state.addItem('durees'); // le joueur garde la feuille des durées
          // on montre la feuille imprimée
          openDialog({ title: 'Imprimante', body: `${PRINT_TEXT()}<p><em>${first ? 'Tu gardes la feuille sur toi.' : 'La feuille est dans ta poche.'}</em></p>` });
        } else { // sinon…
          // l'imprimante attend
          openDialog({ title: 'Imprimante', body: '<p>L\'imprimante est en veille. Elle attend sûrement qu\'un programme se termine sur le PC…</p>' });
        }
      },
    },
    {
      label: 'Rangée de PC', // nom de l'objet
      role: 'enq', // à 2 joueurs : réservé à l'enquêteur
      type: 'pcRow', // dessin utilisé : une rangée de PC
      x: 780, y: 450, w: 220, h: 110, color: 0x2b2f3a, // position, taille et couleur
      onUse() { // quand on clique dessus…
        if (!state.hasItem('courant')) { // s'il n'y a pas de courant…
          openDialog({ title: 'Rangée de PC', body: '<p>Les écrans sont éteints. Pas de courant.</p>' }); // écrans éteints
          return; // et on s'arrête là
        }
        decorHint( // on montre l'indice caché
          'callelongue-astuce', // identifiant de l'indice
          'Rangée de PC', // titre de la boîte
          // le texte de l'indice : comment dérouler un programme
          '<p>Un des PC s\'est rallumé tout seul. À l\'écran, un message laissé par un ancien :</p><pre class="wrap">Pour un algo, écris la valeur de « nombre » après chaque ligne.\nUn SI n\'exécute qu\'UNE des deux branches.\nLigne 1 : nombre = 3\nLigne 2 : nombre = 3 + 2 = 5</pre>',
        );
      },
    },
    {
      label: 'PC du fond', // nom de l'objet
      type: 'studentPc', // dessin utilisé : un PC d'élève
      x: 500, y: 465, w: 120, h: 90, color: 0x15171c, // position, taille et couleur
      onUse() { // quand on clique dessus…
        timeWaster({ // objet qui fait perdre du temps
          title: 'PC du fond', // titre de la boîte
          needsPower: true, // ne marche qu'avec le courant
          off: '<p>Écran noir. Pas de courant.</p>', // texte sans courant
          intro: '<p>Quelqu\'un a laissé un démineur ouvert, partie en cours…</p>', // texte de présentation
          action: 'Finir la partie', // texte du bouton
          result: '<p>BOUM. Tu as cliqué sur une mine au dernier coup. Évidemment.</p>', // ce qui se passe
          minutes: 10, // minutes perdues
        });
      },
    },
  ],
  hints: [ // les indices qu'on peut demander, du plus vague au plus précis
    'Le mot de passe de la session est dans la salle Sormiou.', // indice 1
    // indice 2 : comment commencer à dérouler le programme
    'Note la valeur de nombre après chaque ligne : 3, puis 5. 5 n\'est pas plus grand que 6 : on fait le SINON, nombre vaut 10. Continue…',
  ],
};
