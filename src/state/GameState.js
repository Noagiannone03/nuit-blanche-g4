import Phaser from 'phaser'; // on importe Phaser, le moteur du jeu
import { END_MINUTES, PENALTY_ERROR, PENALTY_HINT } from '../config.js'; // on importe les réglages : fin de la nuit et pénalités

const SAVE_KEY = 'nuit-blanche-g4:save'; // nom de la sauvegarde dans localStorage (la mémoire du navigateur)

function freshData(playerName = '') { // fabrique une partie toute neuve
  return { // on renvoie un objet avec :
    playerName, // le prénom du joueur
    minutes: 0, // minutes écoulées depuis minuit (horloge du jeu)
    realSeconds: 0, // temps réel joué
    hintsUsed: 0, // indices demandés avec le bouton
    decorHints: [], // indices trouvés dans le décor (ids)
    freeHints: 0, // indices gratuits gagnés (carnet du gardien, salle de détente)
    hintsByRoom: {}, // { roomKey: nombre d'indices déjà lus }
    errors: 0, // nombre d'erreurs
    solved: {}, // { roomKey: true }
    digits: {}, // { roomKey: chiffre trouvé }
    orderFound: false, // vrai quand l'ordre est trouvé
    items: [], // objets / informations récupérés
    guardChoice: null, // null (pas encore alerté) | 'alerted' (rondes en cours) | 'caught'
    guard: null, // ronde du gardien : { phase: 'patrol' | 'away', timer, from, to, progress } ; null tant que le courant est coupé
    playerPos: null, // position du joueur dans le couloir
    currentRoom: null, // salle où se trouve le joueur
  };
}

// État unique de la partie, partagé par toutes les scènes.
// Il émet 'changed' à chaque modification pour que l'interface se mette à jour.
// En partie à 2 : chaque action (solve, addItem…) est aussi signalée par 'op' pour être envoyée
// au coéquipier (voir src/net/multiplayer.js).
class GameState extends Phaser.Events.EventEmitter { // classe GameState : l'état, qui peut envoyer des signaux
  constructor() { // fonction lancée à la création de l'état
    super(); // on prépare d'abord le système de signaux
    this.data = freshData(); // on part d'une partie neuve
    this.online = false; // partie à 2 : pas de sauvegarde locale (on ne peut pas reprendre seul)
    this.remote = false; // vrai pendant qu'on rejoue une action reçue du coéquipier
    this.follower = false; // invité d'une partie à 2 : l'horloge et le gardien viennent de l'hôte
  }

  /** Signale une action au réseau, sauf si elle vient déjà du coéquipier. */
  op(name, ...args) { // fonction op : signaler une action
    if (!this.remote) this.emit('op', name, args); // si l'action vient de nous, on envoie le signal 'op'
  }

  /** Remplace l'état par celui reçu de l'hôte (on garde où se trouve notre propre personnage). */
  applySnapshot(data) { // fonction : prendre l'état envoyé par l'hôte
    const { playerPos, currentRoom } = this.data; // on garde notre position et notre salle
    this.data = { ...data, playerPos, currentRoom }; // on copie l'état reçu, avec notre position
    this.emit('changed'); // on prévient l'écran de se mettre à jour
  }

  reset(playerName) { // recommencer une partie
    this.data = freshData(playerName); // partie neuve avec ce prénom
    this.save(); // on sauvegarde
  }

  // --- Sauvegarde (localStorage) ---
  save() { // sauvegarder la partie
    if (this.online) { // partie à 2 ?
      this.emit('changed'); // on met juste l'écran à jour
      return; // et on s'arrête (pas de sauvegarde)
    }
    try { // on essaie :
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); // on range la partie, en texte, dans le navigateur
    } catch { // si ça rate :
      // stockage indisponible (navigation privée…) : le jeu continue sans sauvegarde
    }
    this.emit('changed'); // on prévient l'écran de se mettre à jour
  }

  hasSave() { // y a-t-il une sauvegarde ?
    try { // on essaie :
      return localStorage.getItem(SAVE_KEY) !== null; // vrai si une sauvegarde existe
    } catch { // si ça rate :
      return false; // on répond non
    }
  }

  load() { // charger la sauvegarde
    try { // on essaie :
      const raw = localStorage.getItem(SAVE_KEY); // on lit la sauvegarde
      if (!raw) return false; // rien trouvé : on répond non
      this.data = { ...freshData(), ...JSON.parse(raw) }; // on remet la partie sauvée par-dessus une neuve
      return true; // chargement réussi
    } catch { // si ça rate :
      return false; // on répond non
    }
  }

  clearSave() { // effacer la sauvegarde
    try { // on essaie :
      localStorage.removeItem(SAVE_KEY); // on supprime la sauvegarde du navigateur
    } catch { // si ça rate :
      /* rien à faire */
    }
  }

  // --- Temps ---
  addMinutes(m) { // ajouter des minutes à l'horloge
    this.data.minutes = Math.min(END_MINUTES, this.data.minutes + m); // on avance, sans dépasser la fin de la nuit
    this.emit('changed'); // on met l'écran à jour
  }

  get isTimeUp() { // get = se lit comme une valeur : le temps est fini ?
    return this.data.minutes >= END_MINUTES; // vrai si l'heure de fin est atteinte
  }

  get clock() { // l'heure affichée, par exemple « 02:05 »
    const m = Math.floor(this.data.minutes); // minutes arrondies vers le bas
    // on écrit heures:minutes, toujours avec 2 chiffres
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }

  // --- Erreurs, indices, énigmes ---
  penalize() { // le joueur a fait une erreur
    this.op('penalize'); // on signale l'action au réseau
    this.data.errors += 1; // une erreur de plus au compteur
    this.addMinutes(PENALTY_ERROR); // on ajoute les minutes de pénalité
    this.save(); // on sauvegarde
    this.emit('penalty', PENALTY_ERROR); // on prévient l'écran de la pénalité
  }

  /** Renvoie le texte de l'indice suivant de la salle, et applique le coût. */
  useHint(roomKey, hints) { // demander un indice pour une salle
    this.op('useHint', roomKey, hints); // on signale l'action au réseau
    const seen = this.data.hintsByRoom[roomKey] || 0; // combien d'indices déjà lus ici (0 sinon)
    // tout est lu : on redonne le dernier, gratuitement
    if (seen >= hints.length) return { text: hints[hints.length - 1], cost: 0, last: true };

    this.data.hintsByRoom[roomKey] = seen + 1; // un indice lu de plus dans cette salle
    this.data.hintsUsed += 1; // un indice demandé de plus au total
    let cost = PENALTY_HINT; // prix normal de l'indice
    if (this.data.freeHints > 0) { // a-t-on un indice gratuit ?
      this.data.freeHints -= 1; // oui : on en utilise un
      cost = 0; // et ça ne coûte rien
    } else { // sinon :
      this.addMinutes(PENALTY_HINT); // on paie en minutes
    }
    this.save(); // on sauvegarde
    return { text: hints[seen], cost, last: seen + 1 >= hints.length }; // on renvoie le texte, le prix, et si c'était le dernier
  }

  foundDecorHint(id) { // un indice a été trouvé dans le décor
    this.op('foundDecorHint', id); // on signale l'action au réseau
    if (!this.data.decorHints.includes(id)) { // si on ne l'avait pas déjà
      this.data.decorHints.push(id); // on l'ajoute à la liste
      this.save(); // on sauvegarde
    }
  }

  solve(roomKey, digit) { // une énigme est résolue
    this.op('solve', roomKey, digit); // on signale l'action au réseau
    this.data.solved[roomKey] = true; // on marque la salle comme résolue
    if (digit !== undefined) this.data.digits[roomKey] = digit; // s'il y a un chiffre, on le retient
    this.save(); // on sauvegarde
  }

  hasItem(id) { // a-t-on cet objet ?
    return this.data.items.includes(id); // vrai s'il est dans la liste
  }

  addItem(id) { // ramasser un objet
    this.op('addItem', id); // on signale l'action au réseau
    if (!this.hasItem(id)) this.data.items.push(id); // on l'ajoute s'il n'y est pas déjà
    this.save(); // on sauvegarde
  }

  /** Change un drapeau de la partie (guardChoice, orderFound…). */
  set(key, value) { // changer une info de la partie
    this.op('set', key, value); // on signale l'action au réseau
    this.data[key] = value; // on met la nouvelle valeur
    this.save(); // on sauvegarde
  }

  /** Le carnet du gardien : le prochain indice est gratuit. */
  gainFreeHint() { // gagner un indice gratuit
    this.op('gainFreeHint'); // on signale l'action au réseau
    this.data.freeHints += 1; // un indice gratuit de plus
    this.save(); // on sauvegarde
  }
}

export const state = new GameState(); // on crée l'état unique, utilisé partout dans le jeu
