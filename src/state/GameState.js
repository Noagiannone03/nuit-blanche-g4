import Phaser from 'phaser';
import { END_MINUTES, PENALTY_ERROR, PENALTY_HINT } from '../config.js';

const SAVE_KEY = 'nuit-blanche-g4:save';

function freshData(playerName = '') {
  return {
    playerName,
    minutes: 0, // minutes écoulées depuis minuit (horloge du jeu)
    realSeconds: 0, // temps réel joué
    hintsUsed: 0, // indices demandés avec le bouton
    decorHints: [], // indices trouvés dans le décor (ids)
    freeHints: 0, // indices gratuits gagnés (carnet du gardien, salle de détente)
    hintsByRoom: {}, // { roomKey: nombre d'indices déjà lus }
    errors: 0,
    solved: {}, // { roomKey: true }
    digits: {}, // { roomKey: chiffre trouvé }
    orderFound: false,
    items: [], // objets / informations récupérés
    guardChoice: null, // null (pas encore alerté) | 'alerted' (rondes en cours) | 'caught'
    guard: null, // ronde du gardien : { phase: 'patrol' | 'away', timer, from, to, progress } ; null tant que le courant est coupé
    playerPos: null,
    currentRoom: null,
  };
}

// État unique de la partie, partagé par toutes les scènes.
// Il émet 'changed' à chaque modification pour que l'interface se mette à jour.
// En partie à 2 : chaque action (solve, addItem…) est aussi signalée par 'op' pour être envoyée
// au coéquipier (voir src/net/multiplayer.js).
class GameState extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    this.data = freshData();
    this.online = false; // partie à 2 : pas de sauvegarde locale (on ne peut pas reprendre seul)
    this.remote = false; // vrai pendant qu'on rejoue une action reçue du coéquipier
    this.follower = false; // invité d'une partie à 2 : l'horloge et le gardien viennent de l'hôte
  }

  /** Signale une action au réseau, sauf si elle vient déjà du coéquipier. */
  op(name, ...args) {
    if (!this.remote) this.emit('op', name, args);
  }

  /** Remplace l'état par celui reçu de l'hôte (on garde où se trouve notre propre personnage). */
  applySnapshot(data) {
    const { playerPos, currentRoom } = this.data;
    this.data = { ...data, playerPos, currentRoom };
    this.emit('changed');
  }

  reset(playerName) {
    this.data = freshData(playerName);
    this.save();
  }

  // --- Sauvegarde (localStorage) ---
  save() {
    if (this.online) {
      this.emit('changed');
      return;
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // stockage indisponible (navigation privée…) : le jeu continue sans sauvegarde
    }
    this.emit('changed');
  }

  hasSave() {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      this.data = { ...freshData(), ...JSON.parse(raw) };
      return true;
    } catch {
      return false;
    }
  }

  clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* rien à faire */
    }
  }

  // --- Temps ---
  addMinutes(m) {
    this.data.minutes = Math.min(END_MINUTES, this.data.minutes + m);
    this.emit('changed');
  }

  get isTimeUp() {
    return this.data.minutes >= END_MINUTES;
  }

  get clock() {
    const m = Math.floor(this.data.minutes);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }

  // --- Erreurs, indices, énigmes ---
  penalize() {
    this.op('penalize');
    this.data.errors += 1;
    this.addMinutes(PENALTY_ERROR);
    this.save();
    this.emit('penalty', PENALTY_ERROR);
  }

  /** Renvoie le texte de l'indice suivant de la salle, et applique le coût. */
  useHint(roomKey, hints) {
    this.op('useHint', roomKey, hints);
    const seen = this.data.hintsByRoom[roomKey] || 0;
    if (seen >= hints.length) return { text: hints[hints.length - 1], cost: 0, last: true };

    this.data.hintsByRoom[roomKey] = seen + 1;
    this.data.hintsUsed += 1;
    let cost = PENALTY_HINT;
    if (this.data.freeHints > 0) {
      this.data.freeHints -= 1;
      cost = 0;
    } else {
      this.addMinutes(PENALTY_HINT);
    }
    this.save();
    return { text: hints[seen], cost, last: seen + 1 >= hints.length };
  }

  foundDecorHint(id) {
    this.op('foundDecorHint', id);
    if (!this.data.decorHints.includes(id)) {
      this.data.decorHints.push(id);
      this.save();
    }
  }

  solve(roomKey, digit) {
    this.op('solve', roomKey, digit);
    this.data.solved[roomKey] = true;
    if (digit !== undefined) this.data.digits[roomKey] = digit;
    this.save();
  }

  hasItem(id) {
    return this.data.items.includes(id);
  }

  addItem(id) {
    this.op('addItem', id);
    if (!this.hasItem(id)) this.data.items.push(id);
    this.save();
  }

  /** Change un drapeau de la partie (guardChoice, orderFound…). */
  set(key, value) {
    this.op('set', key, value);
    this.data[key] = value;
    this.save();
  }

  /** Le carnet du gardien : le prochain indice est gratuit. */
  gainFreeHint() {
    this.op('gainFreeHint');
    this.data.freeHints += 1;
    this.save();
  }
}

export const state = new GameState();
