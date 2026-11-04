import Phaser from 'phaser'; // on importe Phaser, le moteur du jeu
import { Peer } from 'peerjs'; // on importe PeerJS : outil pour relier deux navigateurs
import { state } from '../state/GameState.js'; // on importe l'état partagé de la partie
import { startPatrol } from '../state/patrol.js'; // on importe la fonction qui lance la ronde du gardien
import { loadSkin, cleanSkin, DEFAULT_MATE_SKIN } from '../art/skins.js'; // on importe les outils pour l'apparence des personnages

// Partie à 2, chacun sur son ordinateur. PeerJS relie les deux navigateurs en direct (WebRTC) ;
// son serveur public sert seulement à se trouver grâce au code de la partie.
//
// - L'hôte (celui qui crée la partie) fait foi : son horloge et son gardien sont les vrais.
//   Il envoie l'état complet de la partie 6 fois par seconde ("snap").
// - L'invité joue ses actions chez lui tout de suite, et les envoie à l'hôte ("op") qui les rejoue.
//   Chaque action porte un numéro : tant que l'hôte n'a pas confirmé la dernière, l'invité
//   ignore ses "snap" (sinon un objet qu'il vient de trouver disparaîtrait une fraction de seconde).
// - Chacun envoie la position de son personnage 10 fois par seconde ("pos").

const PREFIX = 'nuit-blanche-g4-'; // début du nom de chaque partie sur le serveur
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O ni 1/I, pour ne pas se tromper en dictant
const SNAP_MS = 160; // temps entre deux envois de l'état (160 ms)
const LOST_MS = 8000; // plus de nouvelles du coéquipier depuis 8 s → il est parti

// Chaque joueur a un rôle : ils ont besoin l'un de l'autre pour avancer.
export const ROLES = { // la liste des deux rôles possibles
  tech: { // rôle Technicien :
    icon: '🔧', // son petit dessin
    name: 'Technicien', // son nom affiché
    // ce que ce rôle peut faire (texte affiché au joueur)
    does: 'Tu as le trousseau de clés et les outils : toi seul peux ouvrir, taper les codes et manipuler les appareils. Mais tu as oublié tes lunettes : impossible de lire les documents !',
  },
  enq: { // rôle Enquêteur :
    icon: '🔍', // son petit dessin
    name: 'Enquêteur', // son nom affiché
    // ce que ce rôle peut faire (texte affiché au joueur)
    does: 'Tu as tes lunettes : toi seul peux lire les tableaux, les plannings et les notes. Mais tu n\'as ni clés ni outils : c\'est le technicien qui ouvre et qui tape les codes !',
  },
};

export const net = { // boîte qui garde toutes les infos du jeu en réseau
  online: false, // une partie à 2 est en cours
  host: false, // vrai si j'ai créé la partie (je suis l'hôte)
  role: null, // 'tech' | 'enq'
  myName: '', // mon prénom
  mate: null, // { name, role, skin, room, x, y, flash, seen }
  events: new Phaser.Events.EventEmitter(), // 'start', 'end', 'error', 'mate-left'
  peer: null, // notre « téléphone » PeerJS pour appeler l'autre
  conn: null, // la ligne ouverte avec le coéquipier
  seq: 0, // invité : numéro de sa dernière action envoyée
  ack: 0, // hôte : numéro de la dernière action de l'invité rejouée
  ended: false, // vrai quand la partie est finie
  timer: null, // minuteur des envois réguliers
};

/** Texte venu du coéquipier, à insérer dans du HTML sans risque. */
// esc = rend un texte sûr en remplaçant les signes spéciaux du HTML
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const cleanName = (s) => String(s || '?').slice(0, 16); // nettoie un prénom : 16 lettres maximum

// fabrique un code de 5 lettres tirées au hasard
const randomCode = () => Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

function send(msg) { // fonction qui envoie un message au coéquipier
  if (net.conn?.open) net.conn.send(msg); // on envoie seulement si la ligne est ouverte
}

/** Crée une partie ; renvoie le code à donner au coéquipier. */
export function hostGame(name) { // fonction pour créer une partie
  leave(); // on quitte d'abord une éventuelle ancienne partie
  net.myName = name; // on retient notre prénom
  net.host = true; // on est l'hôte
  return new Promise((resolve, reject) => { // Promise = une réponse qui arrivera plus tard
    const tryCode = () => { // fonction qui essaie un code
      const code = randomCode(); // on tire un code au hasard
      const peer = new Peer(PREFIX + code); // on s'inscrit au serveur avec ce code
      net.peer = peer; // on garde ce « téléphone » en mémoire
      peer.on('open', () => resolve(code)); // inscription réussie : on rend le code
      peer.on('error', (err) => { // si une erreur arrive :
        if (err.type === 'unavailable-id') { // ce code est déjà utilisé ?
          peer.destroy(); // on supprime cette tentative
          tryCode(); // code déjà pris : on en tire un autre
        } else if (!net.online) reject(new Error(errorText(err))); // autre erreur : on renvoie un message d'échec
      });
      peer.on('connection', (conn) => { // quand un joueur se connecte à nous :
        if (net.conn) { // si on a déjà un coéquipier
          conn.on('open', () => conn.close()); // la partie est déjà complète
          return; // on s'arrête là
        }
        listen(conn); // sinon on écoute ce nouveau coéquipier
      });
    };
    tryCode(); // on lance le premier essai
  });
}

/** Rejoint la partie dont on a reçu le code. */
export function joinGame(code, name) { // fonction pour rejoindre une partie avec un code
  leave(); // on quitte d'abord une éventuelle ancienne partie
  net.myName = name; // on retient notre prénom
  net.host = false; // on n'est pas l'hôte
  const peer = new Peer(); // on crée notre « téléphone » PeerJS
  net.peer = peer; // on le garde en mémoire
  let step = 'server'; // 'server' → 'direct' → 'ok'
  const fail = (msg) => { // fonction appelée si la connexion échoue
    if (net.online || step === 'ok' || net.peer !== peer) return; // déjà connecté ou déjà traité : on ne fait rien
    step = 'ok'; // on marque l'étape comme terminée
    clearTimeout(timeout); // on arrête le compte à rebours
    leave(); // on quitte proprement
    net.events.emit('error', msg); // on prévient le jeu avec le message d'erreur
  };
  // Sans réponse au bout de 15 s, on explique ce qui bloque au lieu de tourner en rond
  // après 15 s sans succès : échec avec le bon message
  const timeout = setTimeout(() => fail(step === 'server' ? BLOCKED_SERVER : BLOCKED_DIRECT), 15000);
  peer.on('open', () => { // quand on est inscrit au serveur :
    step = 'direct'; // on passe à l'étape « connexion directe »
    const conn = peer.connect(PREFIX + code.trim().toUpperCase(), { reliable: true }); // on appelle l'hôte avec le code en majuscules
    listen(conn); // on écoute ses messages
    conn.on('open', () => { // quand la ligne est ouverte :
      step = 'ok'; // connexion réussie
      clearTimeout(timeout); // on arrête le compte à rebours
      send({ t: 'hello', name, skin: loadSkin() }); // on se présente : prénom et apparence
    });
    // PeerJS ferme la connexion quand le réseau refuse la liaison directe entre les deux navigateurs
    conn.on('close', () => fail(BLOCKED_DIRECT)); // ligne fermée : échec
    conn.on('error', () => fail(BLOCKED_DIRECT)); // erreur sur la ligne : échec
  });
  peer.on('error', (err) => fail(errorText(err))); // erreur du serveur : échec avec explication
}

// message : serveur injoignable
const BLOCKED_SERVER = 'Impossible de joindre le serveur de mise en relation (pas d\'internet, ou site bloqué par le réseau).';
// message : le réseau bloque la liaison directe
const BLOCKED_DIRECT = 'La partie existe, mais le réseau bloque la connexion directe entre vos deux ordinateurs (fréquent sur un wifi d\'école ou d\'entreprise). Essayez tous les deux sur le partage de connexion d\'un même téléphone, puis recréez une partie.';

function errorText(err) { // transforme une erreur en phrase claire
  if (err.type === 'peer-unavailable') return 'Aucune partie avec ce code. Vérifie-le avec ton coéquipier.'; // aucune partie avec ce code
  // problème d'internet ou de serveur
  if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') return 'Impossible de joindre le serveur de mise en relation (connexion internet ou wifi filtré ?).';
  if (err.type === 'browser-incompatible') return 'Ce navigateur ne permet pas le jeu en ligne.'; // navigateur trop ancien
  return `Erreur réseau (${err.type || err.message}).`; // autre erreur : on affiche son type
}

function listen(conn) { // commence à écouter un coéquipier
  net.conn = conn; // on garde la ligne
  conn.on('data', receive); // message reçu : on appelle receive
  conn.on('close', lost); // ligne fermée : coéquipier perdu
  conn.on('error', lost); // erreur : coéquipier perdu
}

function receive(msg) { // traite un message reçu
  if (net.mate) net.mate.seen = Date.now(); // on note l'heure : le coéquipier est toujours là
  switch (msg.t) { // on regarde le type du message
    case 'hello': // l'hôte reçoit l'invité : la partie commence
      if (!net.host || net.online) return; // seul l'hôte pas encore en partie accepte
      net.role = 'tech'; // l'hôte est le technicien
      // on enregistre l'invité : prénom, rôle enquêteur, apparence
      net.mate = { name: cleanName(msg.name), role: 'enq', skin: cleanSkin(msg.skin, DEFAULT_MATE_SKIN), room: null, seen: Date.now() };
      begin(); // on démarre la partie à 2
      state.reset(`${net.myName} & ${net.mate.name}`); // nouvelle partie au nom des deux joueurs
      send({ t: 'start', data: state.data, hostName: net.myName, hostSkin: loadSkin() }); // on envoie l'état de départ à l'invité
      net.events.emit('start'); // on prévient le jeu : c'est parti
      return; // on s'arrête ici
    case 'start': // l'invité reçoit l'état de départ
      net.role = 'enq'; // l'invité est l'enquêteur
      // on enregistre l'hôte : prénom, rôle technicien, apparence
      net.mate = { name: cleanName(msg.hostName), role: 'tech', skin: cleanSkin(msg.hostSkin, DEFAULT_MATE_SKIN), room: null, seen: Date.now() };
      begin(); // on démarre la partie à 2
      state.applySnapshot(msg.data); // on copie l'état reçu
      net.events.emit('start'); // on prévient le jeu : c'est parti
      return; // on s'arrête ici
    case 'op': // « op » : une action de l'invité
      if (net.host) replay(msg); // l'hôte rejoue cette action
      return; // on s'arrête ici
    case 'snap': // « snap » : l'état complet envoyé par l'hôte
      if (!net.host && msg.ack >= net.seq && !net.ended) applySnap(msg.data); // invité à jour : on applique cet état
      return; // on s'arrête ici
    case 'pos': // « pos » : la position du coéquipier
      net.mate = { ...net.mate, ...msg.p }; // on met à jour sa position
      return; // on s'arrête ici
    case 'end': // « end » : la fin de partie
      if (net.ended) return; // déjà finie : on ignore
      net.ended = true; // on note la fin
      net.events.emit('end', msg.success, msg.reason); // on prévient le jeu : gagné ou perdu, et pourquoi
      return; // on s'arrête ici
    default: // autre message : on ne fait rien
  }
}

function begin() { // met en route la partie à 2
  net.online = true; // partie à 2 en cours
  net.ended = false; // pas encore finie
  net.seq = net.ack = 0; // compteurs d'actions remis à zéro
  state.online = true; // l'état sait qu'on joue à 2
  state.follower = !net.host; // l'invité suit l'horloge et le gardien de l'hôte
  clearInterval(net.timer); // on arrête l'ancien minuteur
  net.timer = setInterval(() => { // setInterval = répète ce bloc régulièrement :
    if (net.host && !net.ended) send({ t: 'snap', data: state.data, ack: net.ack }); // hôte : envoie l'état complet
    else send({ t: 'ping' }); // « je suis toujours là » (même pendant l'intro, où rien d'autre n'est envoyé)
    if (net.mate && Date.now() - net.mate.seen > LOST_MS) lost(); // trop longtemps sans nouvelles : coéquipier perdu
  }, SNAP_MS); // toutes les 160 ms (SNAP_MS)
}

// Les actions que l'invité peut demander à l'hôte (les mêmes noms que dans GameState)
const OPS = { // liste des actions que l'hôte sait rejouer
  penalize: () => state.penalize(), // ajouter une erreur
  useHint: (roomKey, hints) => state.useHint(roomKey, hints), // lire un indice
  foundDecorHint: (id) => state.foundDecorHint(id), // indice trouvé dans le décor
  solve: (roomKey, digit) => state.solve(roomKey, digit), // énigme résolue
  addItem: (id) => state.addItem(id), // objet ramassé
  set: (key, value) => state.set(key, value), // changer une info de la partie
  gainFreeHint: () => state.gainFreeHint(), // gagner un indice gratuit
  startPatrol: () => state.data.guard?.phase !== 'patrol' && startPatrol(), // lancer la ronde si elle n'a pas déjà lieu
};

function replay({ seq, name, args }) { // l'hôte rejoue une action de l'invité
  state.remote = true; // on note : cette action vient du coéquipier
  try { // on essaie :
    OPS[name]?.(...args); // on lance l'action qui porte ce nom
  } finally { // finally = dans tous les cas, même en cas d'erreur :
    state.remote = false; // fin du mode « action du coéquipier »
  }
  net.ack = seq; // on retient le numéro de la dernière action rejouée
}

/** L'invité reçoit l'état de l'hôte ; on prévient les scènes si le gardien part ou revient. */
function applySnap(data) { // fonction : appliquer l'état reçu de l'hôte
  const before = state.data.guard?.phase; // phase du gardien avant
  state.applySnapshot(data); // on copie l'état reçu
  const after = state.data.guard?.phase; // phase du gardien après
  if (after === 'patrol' && before !== 'patrol') state.emit('patrol-started'); // le gardien vient de partir en ronde : on prévient
  if (before === 'patrol' && after !== 'patrol') state.emit('patrol-ended', {}); // le gardien vient de rentrer : on prévient
}

// L'invité envoie chacune de ses actions à l'hôte
state.on('op', (name, args) => { // quand l'état signale une action :
  if (!net.online || net.host) return; // seul l'invité en ligne envoie, sinon on arrête
  net.seq += 1; // nouveau numéro d'action
  send({ t: 'op', seq: net.seq, name, args }); // on envoie l'action à l'hôte
});

/** Position de mon personnage : { room, x, y } dans le couloir, { room, flash } dans une salle. */
export function sendPresence(p) { // envoie ma position au coéquipier
  if (net.online) send({ t: 'pos', p }); // seulement si on joue à 2
}

/** Fin de partie (évasion, gardien, 9h…) : elle vaut pour les deux joueurs. */
export function sendEnd(success, reason) { // annonce la fin de partie
  if (!net.online || net.ended) return; // pas en ligne ou déjà fini : on arrête
  net.ended = true; // on note la fin
  send({ t: 'end', success, reason }); // on prévient le coéquipier : gagné ou perdu, et pourquoi
}

function lost() { // le coéquipier est parti
  if (!net.online) return; // déjà hors ligne : rien à faire
  net.online = false; // on continue seul : plus de rôles, l'invité reprend l'horloge et le gardien
  state.follower = false; // on ne suit plus l'hôte
  clearInterval(net.timer); // on arrête les envois réguliers
  if (!net.ended) net.events.emit('mate-left', net.mate?.name || 'Ton coéquipier'); // on prévient le jeu avec son prénom
}

/** Quitte la partie à 2 (retour au menu). */
export function leave() { // quitter la partie à 2
  clearInterval(net.timer); // on arrête les envois réguliers
  net.online = false; // plus en ligne
  net.mate = null; // plus de coéquipier
  net.role = null; // plus de rôle
  net.conn?.close(); // on raccroche la ligne (si elle existe)
  net.peer?.destroy(); // on détruit notre « téléphone » (s'il existe)
  net.conn = net.peer = null; // on efface les deux
  state.online = false; // l'état sait qu'on est seul
  state.follower = false; // on ne suit plus personne
}

/** Ce joueur peut-il utiliser cet objet ? (en solo : tout) */
// vrai si on joue seul, si l'objet est libre, ou si c'est notre rôle
export const canUse = (role) => !net.online || !role || role === net.role;

/** Message quand l'objet est réservé à l'autre rôle. */
export function roleRefusal(role) { // message de refus selon le rôle demandé
  // texte HTML : prénom et rôle du coéquipier
  const who = `<strong>${esc(net.mate.name)}</strong> (${ROLES[role].icon} ${ROLES[role].name})`;
  return role === 'enq' // c'est l'enquêteur qui est demandé ?
    // oui : message « je ne peux pas lire »
    ? `<p>Sans tes lunettes, les lettres sont toutes floues… impossible de lire ça.</p><p>C'est ${who} qui peut le lire : fais-le venir ici !</p>`
    // non : message « je n'ai pas les outils »
    : `<p>Tu n'as ni le trousseau de clés ni les outils pour ça.</p><p>C'est ${who} qui peut s'en occuper : dis-lui quoi faire !</p>`;
}
