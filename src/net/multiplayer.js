import Phaser from 'phaser';
import { Peer } from 'peerjs';
import { state } from '../state/GameState.js';
import { startPatrol } from '../state/patrol.js';

// Partie à 2, chacun sur son ordinateur. PeerJS relie les deux navigateurs en direct (WebRTC) ;
// son serveur public sert seulement à se trouver grâce au code de la partie.
//
// - L'hôte (celui qui crée la partie) fait foi : son horloge et son gardien sont les vrais.
//   Il envoie l'état complet de la partie 6 fois par seconde ("snap").
// - L'invité joue ses actions chez lui tout de suite, et les envoie à l'hôte ("op") qui les rejoue.
//   Chaque action porte un numéro : tant que l'hôte n'a pas confirmé la dernière, l'invité
//   ignore ses "snap" (sinon un objet qu'il vient de trouver disparaîtrait une fraction de seconde).
// - Chacun envoie la position de son personnage 10 fois par seconde ("pos").

const PREFIX = 'nuit-blanche-g4-';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O ni 1/I, pour ne pas se tromper en dictant
const SNAP_MS = 160;
const LOST_MS = 8000; // plus de nouvelles du coéquipier depuis 8 s → il est parti

// Chaque joueur a un rôle : ils ont besoin l'un de l'autre pour avancer.
export const ROLES = {
  tech: {
    icon: '🔧',
    name: 'Technicien',
    does: 'Tu as le trousseau de clés et les outils : toi seul peux ouvrir, taper les codes et manipuler les appareils. Mais tu as oublié tes lunettes : impossible de lire les documents !',
  },
  enq: {
    icon: '🔍',
    name: 'Enquêteur',
    does: 'Tu as tes lunettes : toi seul peux lire les tableaux, les plannings et les notes. Mais tu n\'as ni clés ni outils : c\'est le technicien qui ouvre et qui tape les codes !',
  },
};

export const net = {
  online: false, // une partie à 2 est en cours
  host: false,
  role: null, // 'tech' | 'enq'
  myName: '',
  mate: null, // { name, role, room, x, y, flash, seen }
  events: new Phaser.Events.EventEmitter(), // 'start', 'end', 'error', 'mate-left'
  peer: null,
  conn: null,
  seq: 0, // invité : numéro de sa dernière action envoyée
  ack: 0, // hôte : numéro de la dernière action de l'invité rejouée
  ended: false,
  timer: null,
};

/** Texte venu du coéquipier, à insérer dans du HTML sans risque. */
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const cleanName = (s) => String(s || '?').slice(0, 16);

const randomCode = () => Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

function send(msg) {
  if (net.conn?.open) net.conn.send(msg);
}

/** Crée une partie ; renvoie le code à donner au coéquipier. */
export function hostGame(name) {
  leave();
  net.myName = name;
  net.host = true;
  return new Promise((resolve, reject) => {
    const tryCode = () => {
      const code = randomCode();
      const peer = new Peer(PREFIX + code);
      net.peer = peer;
      peer.on('open', () => resolve(code));
      peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          peer.destroy();
          tryCode(); // code déjà pris : on en tire un autre
        } else if (!net.online) reject(new Error(errorText(err)));
      });
      peer.on('connection', (conn) => {
        if (net.conn) {
          conn.on('open', () => conn.close()); // la partie est déjà complète
          return;
        }
        listen(conn);
      });
    };
    tryCode();
  });
}

/** Rejoint la partie dont on a reçu le code. */
export function joinGame(code, name) {
  leave();
  net.myName = name;
  net.host = false;
  const peer = new Peer();
  net.peer = peer;
  peer.on('open', () => {
    const conn = peer.connect(PREFIX + code.trim().toUpperCase(), { reliable: true });
    listen(conn);
    conn.on('open', () => send({ t: 'hello', name }));
  });
  peer.on('error', (err) => {
    if (!net.online) net.events.emit('error', errorText(err));
  });
}

function errorText(err) {
  if (err.type === 'peer-unavailable') return 'Aucune partie avec ce code. Vérifie-le avec ton coéquipier.';
  if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') return 'Impossible de joindre le serveur de mise en relation (connexion internet ou wifi filtré ?).';
  if (err.type === 'browser-incompatible') return 'Ce navigateur ne permet pas le jeu en ligne.';
  return `Erreur réseau (${err.type || err.message}).`;
}

function listen(conn) {
  net.conn = conn;
  conn.on('data', receive);
  conn.on('close', lost);
  conn.on('error', lost);
}

function receive(msg) {
  if (net.mate) net.mate.seen = Date.now();
  switch (msg.t) {
    case 'hello': // l'hôte reçoit l'invité : la partie commence
      if (!net.host || net.online) return;
      net.role = 'tech';
      net.mate = { name: cleanName(msg.name), role: 'enq', room: null, seen: Date.now() };
      begin();
      state.reset(`${net.myName} & ${net.mate.name}`);
      send({ t: 'start', data: state.data, hostName: net.myName });
      net.events.emit('start');
      return;
    case 'start': // l'invité reçoit l'état de départ
      net.role = 'enq';
      net.mate = { name: cleanName(msg.hostName), role: 'tech', room: null, seen: Date.now() };
      begin();
      state.applySnapshot(msg.data);
      net.events.emit('start');
      return;
    case 'op':
      if (net.host) replay(msg);
      return;
    case 'snap':
      if (!net.host && msg.ack >= net.seq && !net.ended) applySnap(msg.data);
      return;
    case 'pos':
      net.mate = { ...net.mate, ...msg.p };
      return;
    case 'end':
      if (net.ended) return;
      net.ended = true;
      net.events.emit('end', msg.success, msg.reason);
      return;
    default:
  }
}

function begin() {
  net.online = true;
  net.ended = false;
  net.seq = net.ack = 0;
  state.online = true;
  state.follower = !net.host; // l'invité suit l'horloge et le gardien de l'hôte
  clearInterval(net.timer);
  net.timer = setInterval(() => {
    if (net.host && !net.ended) send({ t: 'snap', data: state.data, ack: net.ack });
    else send({ t: 'ping' }); // « je suis toujours là » (même pendant l'intro, où rien d'autre n'est envoyé)
    if (net.mate && Date.now() - net.mate.seen > LOST_MS) lost();
  }, SNAP_MS);
}

// Les actions que l'invité peut demander à l'hôte (les mêmes noms que dans GameState)
const OPS = {
  penalize: () => state.penalize(),
  useHint: (roomKey, hints) => state.useHint(roomKey, hints),
  foundDecorHint: (id) => state.foundDecorHint(id),
  solve: (roomKey, digit) => state.solve(roomKey, digit),
  addItem: (id) => state.addItem(id),
  set: (key, value) => state.set(key, value),
  gainFreeHint: () => state.gainFreeHint(),
  startPatrol: () => state.data.guard?.phase !== 'patrol' && startPatrol(),
};

function replay({ seq, name, args }) {
  state.remote = true;
  try {
    OPS[name]?.(...args);
  } finally {
    state.remote = false;
  }
  net.ack = seq;
}

/** L'invité reçoit l'état de l'hôte ; on prévient les scènes si le gardien part ou revient. */
function applySnap(data) {
  const before = state.data.guard?.phase;
  state.applySnapshot(data);
  const after = state.data.guard?.phase;
  if (after === 'patrol' && before !== 'patrol') state.emit('patrol-started');
  if (before === 'patrol' && after !== 'patrol') state.emit('patrol-ended', {});
}

// L'invité envoie chacune de ses actions à l'hôte
state.on('op', (name, args) => {
  if (!net.online || net.host) return;
  net.seq += 1;
  send({ t: 'op', seq: net.seq, name, args });
});

/** Position de mon personnage : { room, x, y } dans le couloir, { room, flash } dans une salle. */
export function sendPresence(p) {
  if (net.online) send({ t: 'pos', p });
}

/** Fin de partie (évasion, gardien, 9h…) : elle vaut pour les deux joueurs. */
export function sendEnd(success, reason) {
  if (!net.online || net.ended) return;
  net.ended = true;
  send({ t: 'end', success, reason });
}

function lost() {
  if (!net.online) return;
  net.online = false; // on continue seul : plus de rôles, l'invité reprend l'horloge et le gardien
  state.follower = false;
  clearInterval(net.timer);
  if (!net.ended) net.events.emit('mate-left', net.mate?.name || 'Ton coéquipier');
}

/** Quitte la partie à 2 (retour au menu). */
export function leave() {
  clearInterval(net.timer);
  net.online = false;
  net.mate = null;
  net.role = null;
  net.conn?.close();
  net.peer?.destroy();
  net.conn = net.peer = null;
  state.online = false;
  state.follower = false;
}

/** Ce joueur peut-il utiliser cet objet ? (en solo : tout) */
export const canUse = (role) => !net.online || !role || role === net.role;

/** Message quand l'objet est réservé à l'autre rôle. */
export function roleRefusal(role) {
  const who = `<strong>${esc(net.mate.name)}</strong> (${ROLES[role].icon} ${ROLES[role].name})`;
  return role === 'enq'
    ? `<p>Sans tes lunettes, les lettres sont toutes floues… impossible de lire ça.</p><p>C'est ${who} qui peut le lire : fais-le venir ici !</p>`
    : `<p>Tu n'as ni le trousseau de clés ni les outils pour ça.</p><p>C'est ${who} qui peut s'en occuper : dis-lui quoi faire !</p>`;
}
