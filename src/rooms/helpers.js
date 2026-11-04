import { state } from '../state/GameState.js'; // l'état de la partie (objets, temps, énigmes)
import { openDialog } from '../ui/dialog.js'; // fonction qui ouvre une boîte de dialogue
import { PENALTY_ERROR } from '../config.js'; // minutes perdues à chaque erreur
import { sfx } from '../audio/sound.js'; // les bruitages du jeu
import { net, ROLES, esc } from '../net/multiplayer.js'; // outils du mode à deux joueurs

/**
 * Dialogue "entrer une réponse" commun à toutes les salles. body : HTML.
 * doc : le document à lire (programme, énigme…). En solo il est affiché avant body ;
 * à 2, seul l'enquêteur le voit et seul le technicien peut taper la réponse.
 * onSolve : appelé une fois l'énigme résolue, pour donner l'objet qui sert dans une autre salle.
 */
// on crée la fonction askAnswer et on lit tous ses réglages d'un coup
export function askAnswer({ roomKey, title, doc = '', body, answer, placeholder = 'Ta réponse', success, onSolve, solvedBody = '' }) {
  if (state.data.solved[roomKey]) { // si l'énigme de cette salle est déjà résolue…
    // … on affiche juste le chiffre déjà trouvé
    openDialog({ title, body: `<p><strong>✓ Déjà résolu : ${state.data.digits[roomKey]}</strong></p>${solvedBody}` });
    return; // et on s'arrête là
  }
  if (net.online && net.role === 'enq') { // si on joue à 2 et que je suis l'enquêteur…
    const mate = `<strong>${esc(net.mate.name)}</strong> (${ROLES.tech.icon} ${ROLES.tech.name})`; // nom du coéquipier technicien
    // on montre le document mais sans case pour répondre
    openDialog({ title, body: `${doc}${body}<p><em>Tu n'as pas le clavier : c'est ${mate} qui tape la réponse. Dis-lui ce que tu trouves !</em></p>` });
    return; // on s'arrête là
  }
  if (net.online && doc) { // si on joue à 2 et qu'il y a un document à lire…
    const mate = `<strong>${esc(net.mate.name)}</strong> (${ROLES.enq.icon} ${ROLES.enq.name})`; // nom du coéquipier enquêteur
    // le technicien ne voit pas le texte : on le remplace par un message flou
    doc = `<p><em>Il y a un texte ici, mais sans tes lunettes tout est flou… ${mate} doit venir te le lire.</em></p>`;
  }
  openDialog({ // on ouvre la boîte de dialogue avec une case réponse
    title, // le titre de la boîte
    body: `${doc}${body}`, // le texte : document puis question
    input: { placeholder, maxLength: 12 }, // la case où taper (12 caractères max)
    onSubmit(value, ui) { // quand le joueur valide sa réponse…
      if (value.toUpperCase() === String(answer).toUpperCase()) { // si c'est la bonne réponse (majuscules ou pas)
        state.solve(roomKey, answer); // on note la salle comme résolue
        onSolve?.(); // on lance la suite prévue, s'il y en a une
        ui.close(); // on ferme la boîte
        openDialog({ title: 'Bien joué !', body: success }); // on affiche le message de victoire
        sfx.success(); // on joue le son de réussite
      } else { // sinon (mauvaise réponse)
        state.penalize(); // on ajoute des minutes de pénalité
        ui.feedback(`Mauvaise réponse… l'heure tourne : +${PENALTY_ERROR} min.`); // on prévient le joueur
      }
    },
  });
}

/** Un indice caché dans le décor : gratuit, mais compté dans les statistiques. */
export function decorHint(id, title, body) { // fonction pour un indice caché dans le décor
  state.foundDecorHint(id); // on note que cet indice a été trouvé
  openDialog({ title, body }); // on affiche l'indice
}

/** Un objet verrouillé : on explique ce qui manque et où chercher, sans pénalité. */
export function lockedDialog(title, body) { // fonction pour un objet fermé à clé
  openDialog({ title: `${title} — verrouillé`, body }); // on affiche « verrouillé » dans le titre
}

/**
 * Un équipement inutile (baby-foot, borne d'arcade…) : on peut s'en servir, mais ça fait perdre du temps.
 * needsPower : il ne marche qu'une fois le courant rétabli (sinon on affiche off).
 */
export function timeWaster({ title, intro, action, result, minutes, needsPower = false, off = '' }) { // objet qui fait perdre du temps
  if (needsPower && !state.hasItem('courant')) { // s'il faut du courant et qu'il n'y en a pas…
    openDialog({ title, body: off }); // on affiche le texte « éteint »
    return; // et on s'arrête là
  }
  openDialog({ // sinon on ouvre la boîte de dialogue
    title, // le titre de la boîte
    body: intro, // le texte de présentation
    buttons: [ // la liste des boutons
      {
        label: action, // le texte du bouton
        primary: true, // c'est le bouton principal (mis en avant)
        onClick: () => { // quand on clique dessus…
          state.addMinutes(minutes); // on ajoute des minutes à l'horloge
          state.save(); // on sauvegarde la partie
          // on affiche le résultat et l'heure qu'il est maintenant
          openDialog({ title, body: `${result}<p><em>Le temps a filé… il est déjà ${state.clock}.</em></p>` });
        },
      },
    ],
  });
}
