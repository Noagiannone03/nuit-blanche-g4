import { state } from '../state/GameState.js'; // l'état de la partie (objets, temps, énigmes)
import { openDialog } from '../ui/dialog.js'; // fonction qui ouvre une boîte de dialogue
import { CIRCUIT_TEXT, lamp } from '../puzzles/logique.js'; // le schéma du circuit et le calcul de la lampe
import { ROOM_DIGITS } from '../puzzles/code.js'; // les bons chiffres de chaque salle
import { decorHint, lockedDialog } from './helpers.js'; // petites fonctions communes aux salles
import { PENALTY_ERROR } from '../config.js'; // minutes perdues à chaque erreur
import { startPatrol } from '../state/patrol.js'; // lance les rondes du gardien
import { sfx } from '../audio/sound.js'; // les bruitages du jeu

// 2e énigme : il faut la clé de l'armoire (casier de Sormiou).
// Le boîtier : trouver la combinaison qui allume la lampe (LAMPE = 1), puis lire ABC en binaire.
// Une fois l'énigme résolue, le courant revient : les appareils (PC, distributeur…) remarchent.
// Le joueur choisit ensuite d'allumer la lumière ou non :
// - lumière éteinte : il garde le flash de son téléphone, et le gardien n'est pas mentionné ;
// - lumière allumée : plus besoin du flash… mais le gardien arrive et fait sa ronde.

/** Le courant revient pour les appareils (mais pas forcément la lumière). */
function restorePower() { // remet le courant dans l'école
  sfx.powerOn(); // son du courant qui revient
  state.addItem('courant'); // on note que le courant est revenu
}

/** Le joueur allume la lumière : toute l'école s'éclaire… et le gardien arrive. */
function switchLightsOn() { // allume la lumière partout
  setTimeout(() => sfx.distantSlam(), 1200); // le gardien sort de son local
  state.addItem('lumiere'); // on note que la lumière est allumée
  state.set('guardChoice', 'alerted'); // on note que le gardien est réveillé
  startPatrol(); // le gardien commence ses rondes
}

/** Le choix : allumer la lumière ou rester dans le noir (on peut l'allumer plus tard au boîtier). */
function askLights(intro = '') { // demande au joueur s'il allume la lumière
  openDialog({ // on ouvre une boîte de dialogue
    title: 'Boîtier électrique', // le titre
    body: `${intro}<p>Un interrupteur est marqué <em>« ÉCLAIRAGE »</em>. Allumer la lumière ?</p>`, // la question
    buttons: [ // les deux choix
      {
        label: 'Allumer la lumière', // premier choix
        primary: true, // bouton principal
        onClick: () => { // quand on clique…
          switchLightsOn(); // on allume
          // on prévient que le gardien est là
          openDialog({ title: 'La lumière revient !', body: '<p>Les néons grésillent… et toute l\'école s\'allume. Plus besoin du flash de ton téléphone.</p><p><strong>Mais au loin, une porte claque : le gardien est là, et il commence sa ronde !</strong> S\'il te voit dans sa lampe torche, c\'est fini.</p>' });
        },
      },
      { label: 'Laisser éteint', onClick: (ui) => ui.close() }, // deuxième choix : on ne fait rien
    ],
  });
}

function openSwitchBox() { // ouvre le boîtier électrique
  if (!state.hasItem('cle-armoire')) { // si le joueur n'a pas encore la clé…
    lockedDialog('Boîtier électrique', '<p>Fermé à clé.</p>'); // on dit que c'est fermé
    return; // et on s'arrête là
  }
  if (state.data.solved.ventoux) { // si l'énigme est déjà résolue…
    const solved = `<p><strong>✓ Déjà résolu : ${state.data.digits.ventoux}</strong></p>`; // le chiffre déjà trouvé
    if (state.hasItem('lumiere')) openDialog({ title: 'Boîtier électrique', body: solved }); // lumière déjà allumée : rien à choisir
    else askLights(solved); // sinon : on peut encore choisir d'allumer
    return; // et on s'arrête là
  }

  // Interrupteurs, lampe et chiffre dans la même boîte. La lampe ne réagit pas toute seule :
  // on la teste (erreur = pénalité), et on tape le chiffre lu en binaire.
  const values = { A: false, B: false, C: false }; // les 3 interrupteurs, tous éteints au départ
  const wrap = document.createElement('div'); // une boîte HTML qui contiendra tout
  // le texte d'explication en haut de la boîte
  wrap.innerHTML = '<p>La clé tourne. Trois interrupteurs et une lampe. Une étiquette : <em>« ABC, lu en binaire »</em>.</p>';
  const row = document.createElement('div'); // une ligne pour les interrupteurs
  row.className = 'switches'; // on lui donne le style « switches »
  const bulb = document.createElement('div'); // la lampe
  bulb.className = 'lamp'; // on lui donne le style « lamp »
  bulb.setAttribute('role', 'img'); // pour les lecteurs d'écran : c'est une image
  bulb.setAttribute('aria-label', 'Lampe éteinte'); // texte lu par les lecteurs d'écran

  const buttons = ['A', 'B', 'C'].map((key) => { // on crée un bouton pour chaque interrupteur
    const btn = document.createElement('button'); // un nouveau bouton
    btn.type = 'button'; // simple bouton (n'envoie pas de formulaire)
    btn.setAttribute('aria-pressed', 'false'); // il n'est pas appuyé au départ
    btn.textContent = `${key} = 0`; // texte affiché : « A = 0 »
    btn.addEventListener('click', () => { // quand on clique sur le bouton…
      sfx.toggle(); // son de l'interrupteur
      values[key] = !values[key]; // on inverse l'interrupteur (0 ↔ 1)
      btn.setAttribute('aria-pressed', String(values[key])); // on met à jour l'état appuyé
      btn.textContent = `${key} = ${values[key] ? 1 : 0}`; // on affiche la nouvelle valeur
    });
    row.appendChild(btn); // on ajoute le bouton dans la ligne
    return btn; // on garde le bouton dans la liste
  });
  row.appendChild(bulb); // on ajoute la lampe au bout de la ligne
  wrap.appendChild(row); // on met la ligne dans la boîte
  // on ajoute un texte sous les interrupteurs
  wrap.insertAdjacentHTML('beforeend', '<p>Tu peux tester la lampe (<strong>chaque essai raté coûte du temps</strong>).</p>');

  const ui = openDialog({ // on ouvre la boîte de dialogue
    title: 'Boîtier électrique', // le titre
    body: wrap, // le contenu : interrupteurs et lampe
    input: { placeholder: 'Chiffre (0-7)', maxLength: 2, numeric: true }, // la case pour taper le chiffre
    onSubmit: (value) => submitDigit(value), // quand on valide : on vérifie le chiffre
    buttons: [{ label: 'Tester la lampe', onClick: () => test() }], // bouton pour tester la lampe
  });

  function test() { // teste si la lampe s'allume
    if (bulb.classList.contains('on')) return; // si elle est déjà allumée, on ne fait rien
    if (!lamp(values.A, values.B, values.C)) { // si la combinaison n'allume pas la lampe…
      state.penalize(); // on ajoute des minutes de pénalité
      ui.feedback(`Clac… la lampe reste éteinte. +${PENALTY_ERROR} min.`); // on prévient le joueur
      return; // et on s'arrête là
    }
    // Bonne combinaison : seule la lampe du boîtier s'allume (le chiffre n'est pas donné)
    sfx.success(); // son de réussite
    bulb.classList.add('on'); // on allume la lampe
    bulb.setAttribute('aria-label', 'Lampe allumée'); // texte pour les lecteurs d'écran
    buttons.forEach((b) => (b.disabled = true)); // on bloque les interrupteurs
    ui.box.querySelector('.actions button')?.remove(); // plus de « Tester la lampe »
    ui.box.querySelector('input')?.focus(); // garde le curseur dans la boîte (sinon Échap ne la ferme plus)
    ui.feedback('La lampe s\'allume !', 'ok'); // message de réussite
  }

  function submitDigit(value) { // vérifie le chiffre tapé par le joueur
    if (value !== String(ROOM_DIGITS.ventoux)) { // si ce n'est pas le bon chiffre…
      state.penalize(); // on ajoute des minutes de pénalité
      ui.feedback(`Mauvaise réponse… l'heure tourne : +${PENALTY_ERROR} min.`); // on prévient le joueur
      return; // et on s'arrête là
    }
    state.solve('ventoux', ROOM_DIGITS.ventoux); // on note la salle comme résolue
    ui.close(); // on ferme la boîte
    sfx.success(); // son de réussite
    restorePower(); // le courant revient pour les appareils
    // on affiche le chiffre gagné, puis on demande pour la lumière
    askLights(`<p>Le tableau électrique affiche en grand : <strong>${ROOM_DIGITS.ventoux}</strong>.</p><p><strong>Le courant est rétabli !</strong> Les appareils de l'école se remettent à ronronner.</p>`);
  }
}

export default { // la description de la salle, utilisée par le jeu
  key: 'ventoux', // identifiant de la salle
  name: 'Amphi Mont Ventoux', // nom affiché
  domain: 'Logique', // matière de l'énigme
  color: 0x24305e, // couleur de fond de la salle
  intro: 'Le grand amphi est plongé dans le noir. Seul le tableau électrique clignote.', // texte d'arrivée
  decor: [ // les éléments de décor (on ne peut pas cliquer dessus)
    { type: 'windowNight', x: 515, y: 150, w: 115, h: 120 }, // une fenêtre de nuit
    { type: 'radiator', x: 520, y: 345, w: 105, h: 38 }, // un radiateur
    { type: 'exitSign', x: 20, y: 150, w: 70, h: 26 }, // un panneau « sortie »
    { type: 'amphiSeats', x: 15, y: 404, w: 150, h: 46 }, // des sièges d'amphi
    { type: 'amphiSeats', x: 445, y: 404, w: 180, h: 46 }, // d'autres sièges d'amphi
    { type: 'bin', x: 40, y: 560, w: 34, h: 44 }, // une poubelle
    { type: 'plant', x: 690, y: 430, w: 64, h: 95 }, // une plante
    { type: 'backpack', x: 470, y: 570, w: 40, h: 46 }, // un sac à dos
  ],
  objects: [ // les objets sur lesquels on peut cliquer
    {
      label: 'Tableau du formateur', // nom de l'objet
      role: 'enq', // à 2 joueurs : réservé à l'enquêteur
      type: 'chalkboard', // dessin utilisé : un tableau noir
      x: 300, y: 200, w: 360, h: 150, color: 0xe8e8f0, // position, taille et couleur
      onUse() { // quand on clique dessus…
        openDialog({ // on ouvre une boîte de dialogue
          title: 'Tableau du formateur', // le titre
          // le texte : le schéma du circuit et l'objectif
          body: `<p>Un schéma de circuit est resté au tableau :</p><pre>${CIRCUIT_TEXT.join('\n')}</pre><p class="hand">Objectif : LAMPE = 1 → la lampe s'allume !<br>(1 = allumé / vrai, 0 = éteint / faux)</p>`,
        });
      },
    },
    {
      label: 'Boîtier électrique', // nom de l'objet
      role: 'tech', // à 2 joueurs : réservé au technicien
      type: 'electric', // dessin utilisé : un boîtier électrique
      x: 720, y: 220, w: 120, h: 160, color: 0x5a5f73, // position, taille et couleur
      onUse: openSwitchBox, // quand on clique : on ouvre le boîtier
    },
    {
      label: 'Bureau du formateur', // nom de l'objet
      role: 'enq', // à 2 joueurs : réservé à l'enquêteur
      type: 'desk', // dessin utilisé : un bureau
      x: 300, y: 470, w: 260, h: 90, color: 0x8a5a35, // position, taille et couleur
      onUse() { // quand on clique dessus…
        // on montre l'indice caché : le mémo sur le binaire
        decorHint('ventoux-memo', 'Bureau du formateur', '<p class="hand">Rappel binaire : les colonnes valent 4, 2, 1.<br>110 → 4 + 2 + 0 = 6</p>');
      },
    },
  ],
  hints: [ // les indices qu'on peut demander, du plus vague au plus précis
    'L\'armoire électrique est fermée à clé : la clé est dans le casier à code de la salle Sormiou.', // indice 1
    'Le but est LAMPE = 1 : P2, P3 et P4 doivent toutes valoir 1. Commence par P3 : que doit valoir B ?', // indice 2
    // indice 3 (presque la solution)
    'B = 0. Ensuite P4 impose C = 1, et P1 impose A = 1 : A = 1, B = 0, C = 1. Lis 101 en binaire avec le mémo du bureau (colonnes 4, 2, 1).',
  ],
};
