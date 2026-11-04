// Boîte de dialogue HTML posée au-dessus du canvas Phaser.
// On passe par du HTML (et pas par Phaser) pour avoir de vrais champs de saisie,
// la navigation au clavier (Tab / Entrée / Échap) et le clavier virtuel sur mobile.

import { sfx } from '../audio/sound.js'; // on importe les sons

let current = null; // la boîte ouverte en ce moment (null = aucune)

export function isDialogOpen() { // une boîte est-elle ouverte ?
  return current !== null; // vrai si oui
}

/**
 * @param {object} opts
 * @param {string} opts.title
 * @param {string|Node} [opts.body]       HTML ou élément DOM
 * @param {object} [opts.input]           { placeholder, maxLength, numeric } → affiche un champ
 * @param {Function} [opts.onSubmit]      (valeur, ui) appelé à la validation du champ
 * @param {Array} [opts.buttons]          [{ label, primary, onClick(ui) }]
 * @param {boolean} [opts.closable=true]  bouton Fermer + touche Échap
 * @param {Function} [opts.onClose]
 */
export function openDialog({ // ouvre une boîte de dialogue avec ces options :
  title, // le titre
  body = '', // le contenu (vide par défaut)
  input = null, // le champ de saisie (aucun par défaut)
  submitLabel = 'Valider', // texte du bouton valider
  onSubmit, // fonction appelée à la validation
  buttons = [], // boutons en plus (aucun par défaut)
  closable = true, // peut-on la fermer ? oui par défaut
  onClose, // fonction appelée à la fermeture
}) {
  closeDialog(); // on ferme l'ancienne boîte

  const overlay = document.getElementById('overlay'); // le calque HTML posé au-dessus du jeu
  const box = document.createElement('div'); // on crée la boîte (une div)
  box.className = 'dialog'; // on lui donne son style
  box.setAttribute('role', 'dialog'); // pour les lecteurs d'écran : c'est un dialogue
  box.setAttribute('aria-modal', 'true'); // elle bloque le reste de la page
  box.setAttribute('aria-labelledby', 'dialog-title'); // son titre est l'élément dialog-title

  const h2 = document.createElement('h2'); // on crée le titre
  h2.id = 'dialog-title'; // son identifiant
  h2.textContent = title; // son texte
  box.appendChild(h2); // on le met dans la boîte

  const content = document.createElement('div'); // zone pour le contenu
  if (typeof body === 'string') content.innerHTML = body; // si c'est du texte, on le met en HTML
  else content.appendChild(body); // sinon on ajoute l'élément tel quel
  box.appendChild(content); // on met la zone dans la boîte

  const feedback = document.createElement('div'); // zone pour les messages (erreur, bravo…)
  feedback.className = 'feedback'; // son style
  feedback.setAttribute('role', 'status'); // lue à voix haute par les lecteurs d'écran

  const ui = { // outils donnés aux autres fonctions :
    box, // la boîte
    close: closeDialog, // pour fermer
    feedback(msg, kind = 'error') { // pour afficher un message
      feedback.textContent = msg; // on écrit le message
      feedback.className = `feedback ${kind}`; // on change son style (erreur…)
    },
  };

  let field = null; // le champ de saisie (aucun au début)
  if (input) { // si on veut un champ :
    const form = document.createElement('form'); // on crée un formulaire
    field = document.createElement('input'); // on crée le champ
    field.type = 'text'; // champ de texte
    field.autocomplete = 'off'; // pas de suggestions du navigateur
    field.placeholder = input.placeholder || ''; // texte gris d'exemple
    field.setAttribute('aria-label', input.placeholder || title); // nom du champ pour les lecteurs d'écran
    if (input.maxLength) field.maxLength = input.maxLength; // longueur maximale, si elle est donnée
    if (input.numeric) field.inputMode = 'numeric'; // chiffres : clavier numérique sur mobile
    const submit = document.createElement('button'); // on crée le bouton valider
    submit.type = 'submit'; // bouton qui envoie le formulaire
    submit.className = 'primary'; // style principal
    submit.textContent = submitLabel; // son texte
    form.append(field, submit); // on met le champ et le bouton dans le formulaire
    form.addEventListener('submit', (e) => { // à l'envoi du formulaire :
      e.preventDefault(); // on empêche la page de se recharger
      onSubmit?.(field.value.trim(), ui); // on donne le texte tapé (sans espaces autour)
      if (current && field.isConnected) field.select(); // boîte encore là : on resélectionne le texte
    });
    box.appendChild(form); // on met le formulaire dans la boîte
  }

  box.appendChild(feedback); // on ajoute la zone de messages

  const actions = document.createElement('div'); // zone pour les boutons
  actions.className = 'actions'; // son style
  for (const b of buttons) { // pour chaque bouton demandé :
    const btn = document.createElement('button'); // on crée un bouton
    btn.type = 'button'; // simple bouton (pas d'envoi)
    btn.textContent = b.label; // son texte
    if (b.primary) btn.className = 'primary'; // bouton principal : style spécial
    btn.addEventListener('click', () => { // au clic :
      sfx.click(); // petit son
      b.onClick(ui); // on lance son action
    });
    actions.appendChild(btn); // on l'ajoute à la zone
  }
  if (closable) { // si on peut fermer :
    const close = document.createElement('button'); // on crée le bouton Fermer
    close.type = 'button'; // simple bouton (pas d'envoi)
    close.textContent = 'Fermer (Échap)'; // son texte
    close.addEventListener('click', closeDialog); // au clic : on ferme
    actions.appendChild(close); // on l'ajoute à la zone
  }
  if (actions.children.length) box.appendChild(actions); // s'il y a des boutons, on ajoute la zone

  // Les touches tapées dans la boîte ne doivent pas arriver jusqu'à Phaser
  // (sinon taper "e" dans un champ ferait entrer dans une salle…)
  box.addEventListener('keydown', (e) => { // quand une touche est appuyée dans la boîte :
    e.stopPropagation(); // on ne la passe pas au jeu
    if (e.key === 'Escape' && closable) closeDialog(); // Échap : on ferme (si c'est permis)
  });

  sfx.paper(); // bruit de papier
  overlay.innerHTML = ''; // on vide le calque
  overlay.appendChild(box); // on y met la boîte
  overlay.classList.add('open'); // on affiche le calque
  current = { onClose }; // on retient la boîte ouverte

  // focus différé : sinon la touche qui a ouvert la boîte ("2", "e"…) s'écrit dans le champ
  setTimeout(() => (field || box.querySelector('button'))?.focus(), 0); // on met le curseur dans le champ (ou le 1er bouton)
  return ui; // on renvoie les outils
}

export function closeDialog() { // ferme la boîte
  if (!current) return; // rien d'ouvert : on arrête
  const overlay = document.getElementById('overlay'); // le calque HTML
  overlay.classList.remove('open'); // on cache le calque
  overlay.innerHTML = ''; // on le vide
  const cb = current.onClose; // on garde la fonction de fermeture
  current = null; // plus de boîte ouverte
  cb?.(); // on l'appelle, si elle existe
  document.querySelector('#game canvas')?.focus(); // on redonne le clavier au jeu
}
