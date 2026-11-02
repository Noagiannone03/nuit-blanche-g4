// Boîte de dialogue HTML posée au-dessus du canvas Phaser.
// On passe par du HTML (et pas par Phaser) pour avoir de vrais champs de saisie,
// la navigation au clavier (Tab / Entrée / Échap) et le clavier virtuel sur mobile.

let current = null;

export function isDialogOpen() {
  return current !== null;
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
export function openDialog({
  title,
  body = '',
  input = null,
  submitLabel = 'Valider',
  onSubmit,
  buttons = [],
  closable = true,
  onClose,
}) {
  closeDialog();

  const overlay = document.getElementById('overlay');
  const box = document.createElement('div');
  box.className = 'dialog';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'dialog-title');

  const h2 = document.createElement('h2');
  h2.id = 'dialog-title';
  h2.textContent = title;
  box.appendChild(h2);

  const content = document.createElement('div');
  if (typeof body === 'string') content.innerHTML = body;
  else content.appendChild(body);
  box.appendChild(content);

  const feedback = document.createElement('div');
  feedback.className = 'feedback';
  feedback.setAttribute('role', 'status');

  const ui = {
    box,
    close: closeDialog,
    feedback(msg, kind = 'error') {
      feedback.textContent = msg;
      feedback.className = `feedback ${kind}`;
    },
  };

  let field = null;
  if (input) {
    const form = document.createElement('form');
    field = document.createElement('input');
    field.type = 'text';
    field.autocomplete = 'off';
    field.placeholder = input.placeholder || '';
    field.setAttribute('aria-label', input.placeholder || title);
    if (input.maxLength) field.maxLength = input.maxLength;
    if (input.numeric) field.inputMode = 'numeric';
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'primary';
    submit.textContent = submitLabel;
    form.append(field, submit);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      onSubmit?.(field.value.trim(), ui);
      if (current && field.isConnected) field.select();
    });
    box.appendChild(form);
  }

  box.appendChild(feedback);

  const actions = document.createElement('div');
  actions.className = 'actions';
  for (const b of buttons) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = b.label;
    if (b.primary) btn.className = 'primary';
    btn.addEventListener('click', () => b.onClick(ui));
    actions.appendChild(btn);
  }
  if (closable) {
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Fermer (Échap)';
    close.addEventListener('click', closeDialog);
    actions.appendChild(close);
  }
  if (actions.children.length) box.appendChild(actions);

  // Les touches tapées dans la boîte ne doivent pas arriver jusqu'à Phaser
  // (sinon taper "e" dans un champ ferait entrer dans une salle…)
  box.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape' && closable) closeDialog();
  });

  overlay.innerHTML = '';
  overlay.appendChild(box);
  overlay.classList.add('open');
  current = { onClose };

  // focus différé : sinon la touche qui a ouvert la boîte ("2", "e"…) s'écrit dans le champ
  setTimeout(() => (field || box.querySelector('button'))?.focus(), 0);
  return ui;
}

export function closeDialog() {
  if (!current) return;
  const overlay = document.getElementById('overlay');
  overlay.classList.remove('open');
  overlay.innerHTML = '';
  const cb = current.onClose;
  current = null;
  cb?.();
  document.querySelector('#game canvas')?.focus();
}
