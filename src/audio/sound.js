// Tous les sons du jeu sont fabriqués par le code avec la Web Audio API :
// pas de fichier audio à télécharger, pas de droits d'auteur à gérer.
// Deux briques suffisent : une note (oscillateur) et un souffle (bruit blanc filtré).

const MUTE_KEY = 'nuit-blanche-g4:mute';

let ctx = null;
let master = null;
let noiseBuffer = null;
let muted = false;
try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  /* stockage indisponible : son activé */
}

/** Crée le contexte audio au premier besoin (il démarre au premier clic ou à la première touche). */
function audio() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.8;
  master.connect(ctx.destination);
  // 2 s de bruit blanc, réutilisées pour tous les souffles
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

// Les navigateurs bloquent le son tant que le joueur n'a pas cliqué ou appuyé sur une touche
for (const type of ['pointerdown', 'keydown']) {
  window.addEventListener(type, () => audio()?.resume(), { capture: true });
}

const ready = () => audio() && ctx.state === 'running';

export const isMuted = () => muted;

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* rien */
  }
  if (audio()) master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.05);
  return muted;
}

// ---------- Briques de base ----------

/** Une note : fréquence (qui peut glisser vers `to`), durée, forme d'onde et volume. */
function tone(freq, dur, { type = 'sine', vol = 0.2, to = null, delay = 0, attack = 0.005, out = master } = {}) {
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** Un souffle : bruit blanc passé dans un filtre (grave = sourd, aigu = sifflant). */
function noise(dur, { freq = 1000, filter = 'lowpass', q = 1, vol = 0.2, delay = 0, attack = 0.003, out = master } = {}) {
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.05);
}

/** Clic métallique du pêne (la pièce de la serrure qui rentre et sort). */
function latch(delay, pitch = 1) {
  noise(0.035, { freq: 2600 * pitch, filter: 'bandpass', q: 7, vol: 0.35, delay });
  tone(900 * pitch, 0.025, { type: 'square', vol: 0.025, delay });
}

// ---------- Bruitages ----------

export const sfx = {
  /** Pas de l'élève (baskets sur le carrelage) ; on alterne pied gauche / pied droit. */
  step(left) {
    if (!ready()) return;
    noise(0.07, { freq: left ? 1400 : 1200, filter: 'bandpass', q: 1.2, vol: 0.12 });
  },

  /** Pas du gardien : chaussures lourdes ; plus forts quand il est près, étouffés derrière une porte. */
  guardStep(volume, muffled = false) {
    if (!ready() || volume <= 0.01) return;
    noise(0.12, { freq: muffled ? 260 : 500, vol: 0.35 * volume });
    tone(muffled ? 55 : 75, 0.12, { vol: 0.3 * volume, to: 45 });
  },

  /** Battement de cœur quand le gardien approche. */
  heartbeat(volume) {
    if (!ready()) return;
    tone(58, 0.13, { vol: 0.5 * volume, to: 40 });
    tone(52, 0.15, { vol: 0.4 * volume, to: 38, delay: 0.2 });
  },

  /** Porte qui s'ouvre : on baisse la poignée (clic-clac du pêne), puis la porte pivote (souffle d'air). */
  doorOpen() {
    if (!ready()) return;
    latch(0);
    latch(0.07, 0.8);
    noise(0.45, { freq: 450, vol: 0.1, delay: 0.12, attack: 0.15 });
  },

  /** Porte qui se referme : choc sourd du bois contre le cadre, puis le pêne qui claque. */
  doorClose() {
    if (!ready()) return;
    noise(0.12, { freq: 400, vol: 0.06, attack: 0.08 });
    noise(0.28, { freq: 220, vol: 0.55, delay: 0.1 });
    tone(72, 0.3, { vol: 0.45, to: 42, delay: 0.1 });
    latch(0.12, 1.1);
  },

  /** Une feuille de papier qu'on déplie (ouverture d'une boîte de dialogue). */
  paper() {
    if (!ready()) return;
    noise(0.09, { freq: 3500, filter: 'highpass', vol: 0.07 });
    noise(0.07, { freq: 2500, filter: 'highpass', vol: 0.05, delay: 0.07 });
  },

  /** Petit clic sec (bouton, interrupteur, touche). */
  click() {
    if (!ready()) return;
    noise(0.03, { freq: 2500, filter: 'bandpass', q: 3, vol: 0.25 });
    tone(1800, 0.03, { type: 'square', vol: 0.03 });
  },

  /** Interrupteur électrique : clac métallique. */
  toggle() {
    if (!ready()) return;
    noise(0.05, { freq: 1800, filter: 'bandpass', q: 4, vol: 0.35 });
    tone(140, 0.06, { type: 'square', vol: 0.06 });
  },

  /** Touche de machine à écrire (intro). */
  type() {
    if (!ready()) return;
    noise(0.025, { freq: 3000 + Math.random() * 1500, filter: 'bandpass', q: 2, vol: 0.06 });
  },

  /** Bonne réponse : petit arpège montant. */
  success() {
    if (!ready()) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.14, delay: i * 0.09 }));
  },

  /** Erreur : buzzer grave. */
  error() {
    if (!ready()) return;
    tone(110, 0.35, { type: 'square', vol: 0.07 });
    tone(104, 0.35, { type: 'square', vol: 0.07 });
  },

  /** Indice : petit "ding" de post-it. */
  hint() {
    if (!ready()) return;
    tone(880, 0.4, { type: 'sine', vol: 0.12 });
    tone(1320, 0.5, { type: 'sine', vol: 0.06, delay: 0.08 });
  },

  /** Bip d'un digicode. */
  beep(i = 0) {
    if (!ready()) return;
    tone(1200 + i * 90, 0.08, { type: 'square', vol: 0.04, delay: i * 0.1 });
  },

  /** Le courant revient : gros "clonk", puis les néons qui grésillent et s'allument. */
  powerOn() {
    if (!ready()) return;
    noise(0.3, { freq: 200, vol: 0.5 });
    tone(60, 0.5, { type: 'square', vol: 0.08, to: 50 });
    for (let i = 0; i < 4; i++) noise(0.05, { freq: 4000, filter: 'highpass', vol: 0.12, delay: 0.35 + i * 0.13 + Math.random() * 0.05 });
    tone(100, 1.4, { type: 'sawtooth', vol: 0.03, delay: 0.9, attack: 0.3 });
  },

  /** Une porte claque au loin (le gardien se réveille). */
  distantSlam() {
    if (!ready()) return;
    noise(0.6, { freq: 180, vol: 0.45, delay: 0.1 });
    tone(50, 0.6, { vol: 0.3, delay: 0.1, to: 35 });
  },

  /** Le gardien t'éclaire : choc + note qui descend. */
  caught() {
    if (!ready()) return;
    noise(0.4, { freq: 800, vol: 0.4 });
    tone(440, 0.9, { type: 'sawtooth', vol: 0.08, to: 110 });
    tone(220, 1.1, { type: 'sawtooth', vol: 0.06, to: 55, delay: 0.1 });
  },

  /** Fin réussie : petite fanfare. */
  win() {
    if (!ready()) return;
    [[523, 0], [659, 0.15], [784, 0.3], [1047, 0.45], [784, 0.6], [1047, 0.75]].forEach(([f, d]) => tone(f, 0.5, { type: 'triangle', vol: 0.14, delay: d }));
  },

  /** Fin ratée : trois notes qui descendent. */
  lose() {
    if (!ready()) return;
    [[392, 0], [349, 0.3], [262, 0.6]].forEach(([f, d]) => tone(f, 0.7, { type: 'triangle', vol: 0.13, delay: d }));
  },

  /** Alarme (fin par la fenêtre). */
  alarm() {
    if (!ready()) return;
    for (let i = 0; i < 6; i++) tone(i % 2 ? 700 : 950, 0.25, { type: 'square', vol: 0.05, delay: i * 0.25 });
  },

  /** Tic-tac de l'horloge murale. */
  tick(tock) {
    if (!ready()) return;
    noise(0.02, { freq: tock ? 2200 : 3000, filter: 'bandpass', q: 6, vol: 0.06 });
  },
};

// ---------- Ambiances (sons de fond en boucle) ----------

let ambience = null; // { name, gain, nodes }

/**
 * Change le fond sonore, avec un fondu.
 * 'hub' : le couloir vide (ventilation, bourdonnement grave) ; 'dark' : salle sans courant (presque le silence) ;
 * 'lit' : salle éclairée (grésillement des néons) ; null : silence.
 */
export function setAmbience(name) {
  if (ambience?.name === name) return;
  if (!audio()) return;
  const t = ctx.currentTime;
  if (ambience) {
    const old = ambience;
    old.gain.gain.cancelScheduledValues(t);
    old.gain.gain.setTargetAtTime(0, t, 0.3);
    setTimeout(() => old.nodes.forEach((n) => n.stop()), 2000);
  }
  ambience = null;
  if (!name) return;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.setTargetAtTime(1, t, 0.6);
  gain.connect(master);
  const nodes = [];

  // souffle de la ventilation (bruit filtré très grave), présent partout
  const air = ctx.createBufferSource();
  air.buffer = noiseBuffer;
  air.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = 'lowpass';
  airFilter.frequency.value = name === 'dark' ? 220 : 380;
  const airGain = ctx.createGain();
  airGain.gain.value = name === 'dark' ? 0.05 : 0.07;
  air.connect(airFilter).connect(airGain).connect(gain);
  nodes.push(air);

  // bourdonnement grave du bâtiment la nuit (deux notes légèrement décalées = ça "respire")
  for (const f of name === 'dark' ? [41, 41.3] : [55, 55.4]) {
    const o = ctx.createOscillator();
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0.035;
    o.connect(g).connect(gain);
    nodes.push(o);
  }

  // néons : grésillement à 100 Hz, assez discret
  if (name === 'lit') {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 100;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1200;
    f.Q.value = 4;
    const g = ctx.createGain();
    g.gain.value = 0.012;
    o.connect(f).connect(g).connect(gain);
    nodes.push(o);
  }

  nodes.forEach((n) => n.start());
  ambience = { name, gain, nodes };
}
