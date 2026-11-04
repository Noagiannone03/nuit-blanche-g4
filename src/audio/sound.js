// Tous les sons du jeu sont fabriqués par le code avec la Web Audio API :
// pas de fichier audio à télécharger, pas de droits d'auteur à gérer.
// Deux briques suffisent : une note (oscillateur) et un souffle (bruit blanc filtré).

const MUTE_KEY = 'nuit-blanche-g4:mute'; // nom de la case où le navigateur retient « son coupé »

let ctx = null; // le contexte audio (la « table de mixage »), vide au début
let master = null; // le bouton de volume général, vide au début
let noiseBuffer = null; // le bruit blanc enregistré, vide au début
let muted = false; // au départ, le son n'est pas coupé
try { // on essaie (si ça plante, on passe au « catch »)
  muted = localStorage.getItem(MUTE_KEY) === '1'; // on relit si le joueur avait coupé le son
} catch { // si la lecture a planté, on ne fait rien
  /* stockage indisponible : son activé */
}

/** Crée le contexte audio au premier besoin (il démarre au premier clic ou à la première touche). */
function audio() { // fonction qui prépare le son
  if (ctx) return ctx; // si c'est déjà prêt, on le rend tout de suite
  const AudioCtx = window.AudioContext || window.webkitAudioContext; // on cherche l'outil audio du navigateur
  if (!AudioCtx) return null; // pas d'outil audio : on abandonne
  ctx = new AudioCtx(); // on crée la table de mixage
  master = ctx.createGain(); // on crée le bouton de volume général
  master.gain.value = muted ? 0 : 0.8; // volume à 0 si coupé, sinon à 0.8
  master.connect(ctx.destination); // on branche le volume sur les haut-parleurs
  // 2 s de bruit blanc, réutilisées pour tous les souffles
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); // on prépare une boîte de 2 secondes de son
  const data = noiseBuffer.getChannelData(0); // on récupère la liste des valeurs du son
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1; // on remplit avec des valeurs au hasard (bruit)
  return ctx; // on rend la table de mixage
}

// Les navigateurs bloquent le son tant que le joueur n'a pas cliqué ou appuyé sur une touche
for (const type of ['pointerdown', 'keydown']) { // pour un clic de souris et pour une touche
  window.addEventListener(type, () => audio()?.resume(), { capture: true }); // au premier geste, on réveille le son
}

const ready = () => audio() && ctx.state === 'running'; // vrai si le son existe et tourne

export const isMuted = () => muted; // dit si le son est coupé

export function toggleMute() { // fonction qui coupe ou remet le son
  muted = !muted; // on inverse : coupé devient actif, et l'inverse
  try { // on essaie de sauvegarder le choix
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); // on écrit « 1 » (coupé) ou « 0 » dans le navigateur
  } catch { // si la sauvegarde plante, on ne fait rien
    /* rien */
  }
  if (audio()) master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.05); // on baisse ou monte le volume en douceur
  return muted; // on rend le nouvel état
}

// ---------- Briques de base ----------

/** Une note : fréquence (qui peut glisser vers `to`), durée, forme d'onde et volume. */
// fonction qui joue une note
function tone(freq, dur, { type = 'sine', vol = 0.2, to = null, delay = 0, attack = 0.005, out = master } = {}) {
  const t = ctx.currentTime + delay; // moment où la note commence
  const osc = ctx.createOscillator(); // oscillateur = petite machine qui fabrique un son
  const g = ctx.createGain(); // on crée un bouton de volume pour cette note
  osc.type = type; // on choisit la forme du son (doux, carré…)
  osc.frequency.setValueAtTime(freq, t); // on règle la hauteur de la note
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur); // si demandé, la note glisse vers une autre hauteur
  g.gain.setValueAtTime(0, t); // la note commence en silence
  g.gain.linearRampToValueAtTime(vol, t + attack); // le volume monte très vite
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur); // puis le volume descend jusqu'à presque rien
  osc.connect(g).connect(out); // on branche : machine → volume → sortie
  osc.start(t); // on lance la note
  osc.stop(t + dur + 0.05); // on arrête la note un peu après la fin
}

/** Un souffle : bruit blanc passé dans un filtre (grave = sourd, aigu = sifflant). */
// fonction qui joue un souffle
function noise(dur, { freq = 1000, filter = 'lowpass', q = 1, vol = 0.2, delay = 0, attack = 0.003, out = master } = {}) {
  const t = ctx.currentTime + delay; // moment où le souffle commence
  const src = ctx.createBufferSource(); // on crée un lecteur de son enregistré
  src.buffer = noiseBuffer; // on lui donne le bruit blanc à lire
  const f = ctx.createBiquadFilter(); // filtre = tamis qui garde seulement certains sons
  f.type = filter; // on choisit le genre de filtre
  f.frequency.value = freq; // on règle quelle hauteur le filtre laisse passer
  f.Q.value = q; // on règle la précision du filtre
  const g = ctx.createGain(); // on crée un bouton de volume pour ce souffle
  g.gain.setValueAtTime(0, t); // le souffle commence en silence
  g.gain.linearRampToValueAtTime(vol, t + attack); // le volume monte très vite
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur); // puis le volume descend jusqu'à presque rien
  src.connect(f).connect(g).connect(out); // on branche : bruit → filtre → volume → sortie
  src.start(t, Math.random() * 1.5); // on lance le bruit à un endroit au hasard
  src.stop(t + dur + 0.05); // on arrête le souffle un peu après la fin
}

/** Clic métallique du pêne (la pièce de la serrure qui rentre et sort). */
function latch(delay, pitch = 1) { // fonction : clic de serrure
  noise(0.035, { freq: 2600 * pitch, filter: 'bandpass', q: 7, vol: 0.35, delay }); // un petit souffle métallique aigu
  tone(900 * pitch, 0.025, { type: 'square', vol: 0.025, delay }); // plus une petite note sèche
}

// ---------- Bruitages ----------

export const sfx = { // on range tous les bruitages dans un objet
  /** Pas de l'élève (baskets sur le carrelage) ; on alterne pied gauche / pied droit. */
  step(left) { // bruit d'un pas de l'élève
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    noise(0.07, { freq: left ? 1400 : 1200, filter: 'bandpass', q: 1.2, vol: 0.12 }); // petit souffle, un peu différent selon le pied
  },

  /** Pas du gardien : chaussures lourdes ; plus forts quand il est près, étouffés derrière une porte. */
  guardStep(volume, muffled = false) { // bruit d'un pas du gardien
    if (!ready() || volume <= 0.01) return; // son pas prêt ou trop loin : on arrête
    noise(0.12, { freq: muffled ? 260 : 500, vol: 0.35 * volume }); // souffle grave, plus sourd derrière une porte
    tone(muffled ? 55 : 75, 0.12, { vol: 0.3 * volume, to: 45 }); // plus une note grave qui descend
  },

  /** Battement de cœur quand le gardien approche. */
  heartbeat(volume) { // bruit d'un battement de cœur
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    tone(58, 0.13, { vol: 0.5 * volume, to: 40 }); // premier « boum » grave
    tone(52, 0.15, { vol: 0.4 * volume, to: 38, delay: 0.2 }); // second « boum » juste après
  },

  /** Porte qui s'ouvre : on baisse la poignée (clic-clac du pêne), puis la porte pivote (souffle d'air). */
  doorOpen() { // bruit d'une porte qui s'ouvre
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    latch(0); // premier clic de serrure
    latch(0.07, 0.8); // second clic, un peu plus grave
    noise(0.45, { freq: 450, vol: 0.1, delay: 0.12, attack: 0.15 }); // souffle d'air de la porte qui tourne
  },

  /** Porte qui se referme : choc sourd du bois contre le cadre, puis le pêne qui claque. */
  doorClose() { // bruit d'une porte qui se ferme
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    noise(0.12, { freq: 400, vol: 0.06, attack: 0.08 }); // petit souffle de la porte qui arrive
    noise(0.28, { freq: 220, vol: 0.55, delay: 0.1 }); // gros choc sourd
    tone(72, 0.3, { vol: 0.45, to: 42, delay: 0.1 }); // note grave qui descend avec le choc
    latch(0.12, 1.1); // clic de serrure à la fin
  },

  /** Une feuille de papier qu'on déplie (ouverture d'une boîte de dialogue). */
  paper() { // bruit de papier
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    noise(0.09, { freq: 3500, filter: 'highpass', vol: 0.07 }); // premier froissement aigu
    noise(0.07, { freq: 2500, filter: 'highpass', vol: 0.05, delay: 0.07 }); // second froissement juste après
  },

  /** Petit clic sec (bouton, interrupteur, touche). */
  click() { // bruit d'un petit clic
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    noise(0.03, { freq: 2500, filter: 'bandpass', q: 3, vol: 0.25 }); // petit souffle sec
    tone(1800, 0.03, { type: 'square', vol: 0.03 }); // plus une note très courte
  },

  /** Interrupteur électrique : clac métallique. */
  toggle() { // bruit d'interrupteur
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    noise(0.05, { freq: 1800, filter: 'bandpass', q: 4, vol: 0.35 }); // souffle métallique
    tone(140, 0.06, { type: 'square', vol: 0.06 }); // plus une note grave et courte
  },

  /** Touche de machine à écrire (intro). */
  type() { // bruit de machine à écrire
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    noise(0.025, { freq: 3000 + Math.random() * 1500, filter: 'bandpass', q: 2, vol: 0.06 }); // tout petit souffle, hauteur au hasard
  },

  /** Bonne réponse : petit arpège montant. */
  success() { // son de bonne réponse
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    // quatre notes qui montent, l'une après l'autre
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.14, delay: i * 0.09 }));
  },

  /** Erreur : buzzer grave. */
  error() { // son d'erreur
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    tone(110, 0.35, { type: 'square', vol: 0.07 }); // note grave et râpeuse
    tone(104, 0.35, { type: 'square', vol: 0.07 }); // deuxième note presque pareille (ça grince)
  },

  /** Indice : petit "ding" de post-it. */
  hint() { // son d'indice
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    tone(880, 0.4, { type: 'sine', vol: 0.12 }); // un « ding » aigu
    tone(1320, 0.5, { type: 'sine', vol: 0.06, delay: 0.08 }); // un deuxième « ding » plus aigu, juste après
  },

  /** Bip d'un digicode. */
  beep(i = 0) { // bip du digicode (i = numéro du chiffre)
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    tone(1200 + i * 90, 0.08, { type: 'square', vol: 0.04, delay: i * 0.1 }); // un bip, plus aigu et plus tard selon i
  },

  /** Le courant revient : gros "clonk", puis les néons qui grésillent et s'allument. */
  powerOn() { // son du courant qui revient
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    noise(0.3, { freq: 200, vol: 0.5 }); // gros « clonk » grave
    tone(60, 0.5, { type: 'square', vol: 0.08, to: 50 }); // plus une note grave
    // 4 grésillements des néons, un peu au hasard
    for (let i = 0; i < 4; i++) noise(0.05, { freq: 4000, filter: 'highpass', vol: 0.12, delay: 0.35 + i * 0.13 + Math.random() * 0.05 });
    tone(100, 1.4, { type: 'sawtooth', vol: 0.03, delay: 0.9, attack: 0.3 }); // puis le bourdonnement des néons allumés
  },

  /** Une porte claque au loin (le gardien se réveille). */
  distantSlam() { // son d'une porte qui claque au loin
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    noise(0.6, { freq: 180, vol: 0.45, delay: 0.1 }); // souffle grave et long
    tone(50, 0.6, { vol: 0.3, delay: 0.1, to: 35 }); // note très grave qui descend
  },

  /** Le gardien t'éclaire : choc + note qui descend. */
  caught() { // son quand le gardien t'attrape
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    noise(0.4, { freq: 800, vol: 0.4 }); // gros choc
    tone(440, 0.9, { type: 'sawtooth', vol: 0.08, to: 110 }); // note qui descend
    tone(220, 1.1, { type: 'sawtooth', vol: 0.06, to: 55, delay: 0.1 }); // deuxième note plus grave qui descend
  },

  /** Fin réussie : petite fanfare. */
  win() { // son de victoire
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    // six notes (hauteur, moment) jouées une par une
    [[523, 0], [659, 0.15], [784, 0.3], [1047, 0.45], [784, 0.6], [1047, 0.75]].forEach(([f, d]) => tone(f, 0.5, { type: 'triangle', vol: 0.14, delay: d }));
  },

  /** Fin ratée : trois notes qui descendent. */
  lose() { // son de défaite
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    // trois notes qui descendent, une par une
    [[392, 0], [349, 0.3], [262, 0.6]].forEach(([f, d]) => tone(f, 0.7, { type: 'triangle', vol: 0.13, delay: d }));
  },

  /** Alarme (fin par la fenêtre). */
  alarm() { // son d'alarme
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    // 6 bips qui alternent aigu et grave
    for (let i = 0; i < 6; i++) tone(i % 2 ? 700 : 950, 0.25, { type: 'square', vol: 0.05, delay: i * 0.25 });
  },

  /** Tic-tac de l'horloge murale. */
  tick(tock) { // tic-tac de l'horloge
    if (!ready()) return; // si le son n'est pas prêt, on arrête
    noise(0.02, { freq: tock ? 2200 : 3000, filter: 'bandpass', q: 6, vol: 0.06 }); // petit clic, « tic » ou « tac »
  },
};

// ---------- Ambiances (sons de fond en boucle) ----------

let ambience = null; // { name, gain, nodes }

/**
 * Change le fond sonore, avec un fondu.
 * 'hub' : le couloir vide (ventilation, bourdonnement grave) ; 'dark' : salle sans courant (presque le silence) ;
 * 'lit' : salle éclairée (grésillement des néons) ; null : silence.
 */
export function setAmbience(name) { // fonction qui change le son de fond
  if (ambience?.name === name) return; // même ambiance qu'avant : rien à faire
  if (!audio()) return; // si le son n'existe pas, on arrête
  const t = ctx.currentTime; // on note l'heure actuelle du son
  if (ambience) { // s'il y avait déjà une ambiance
    const old = ambience; // on garde l'ancienne ambiance de côté
    old.gain.gain.cancelScheduledValues(t); // on annule ses changements de volume prévus
    old.gain.gain.setTargetAtTime(0, t, 0.3); // on baisse son volume en douceur
    setTimeout(() => old.nodes.forEach((n) => n.stop()), 2000); // après 2 secondes, on arrête tous ses sons
  }
  ambience = null; // plus d'ambiance pour l'instant
  if (!name) return; // pas de nom : on reste dans le silence

  const gain = ctx.createGain(); // on crée le volume de la nouvelle ambiance
  gain.gain.setValueAtTime(0, t); // elle commence en silence
  gain.gain.setTargetAtTime(1, t, 0.6); // puis le volume monte doucement
  gain.connect(master); // on la branche sur le volume général
  const nodes = []; // liste des sons de cette ambiance

  // souffle de la ventilation (bruit filtré très grave), présent partout
  const air = ctx.createBufferSource(); // on crée un lecteur pour le bruit de ventilation
  air.buffer = noiseBuffer; // on lui donne le bruit blanc
  air.loop = true; // il tourne en boucle sans s'arrêter
  const airFilter = ctx.createBiquadFilter(); // on crée un filtre (tamis à sons)
  airFilter.type = 'lowpass'; // il ne garde que les sons graves
  airFilter.frequency.value = name === 'dark' ? 220 : 380; // encore plus grave dans le noir
  const airGain = ctx.createGain(); // volume de la ventilation
  airGain.gain.value = name === 'dark' ? 0.05 : 0.07; // un peu moins fort dans le noir
  air.connect(airFilter).connect(airGain).connect(gain); // on branche : bruit → filtre → volume → ambiance
  nodes.push(air); // on l'ajoute à la liste

  // bourdonnement grave du bâtiment la nuit (deux notes légèrement décalées = ça "respire")
  for (const f of name === 'dark' ? [41, 41.3] : [55, 55.4]) { // pour chacune des deux notes graves
    const o = ctx.createOscillator(); // on crée un oscillateur (machine à son)
    o.frequency.value = f; // on règle sa hauteur
    const g = ctx.createGain(); // on crée son volume
    g.gain.value = 0.035; // volume très bas
    o.connect(g).connect(gain); // on branche : note → volume → ambiance
    nodes.push(o); // on l'ajoute à la liste
  }

  // néons : grésillement à 100 Hz, assez discret
  if (name === 'lit') { // seulement si la salle est éclairée
    const o = ctx.createOscillator(); // on crée un oscillateur (machine à son)
    o.type = 'sawtooth'; // forme en dents de scie : son qui grésille
    o.frequency.value = 100; // hauteur : 100 vibrations par seconde
    const f = ctx.createBiquadFilter(); // on crée un filtre (tamis à sons)
    f.type = 'bandpass'; // il garde une bande de sons au milieu
    f.frequency.value = 1200; // le milieu de cette bande
    f.Q.value = 4; // largeur de la bande (plus haut = plus étroit)
    const g = ctx.createGain(); // on crée son volume
    g.gain.value = 0.012; // volume très très bas
    o.connect(f).connect(g).connect(gain); // on branche : note → filtre → volume → ambiance
    nodes.push(o); // on l'ajoute à la liste
  }

  nodes.forEach((n) => n.start()); // on lance tous les sons de la liste
  ambience = { name, gain, nodes }; // on retient l'ambiance qui joue maintenant
}
