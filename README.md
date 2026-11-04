# Nuit Blanche à G4 — Escape game

> Cercle de projets 2026 — Institut G4 Marseille — Groupe ___

Un élève s'endort pendant le Cercle de projets et se réveille **enfermé dans l'école à minuit**.
Il a jusqu'à **9h00** (environ 20 minutes réelles) pour trouver le code de la porte de sortie avant l'arrivée de l'équipe pédagogique.

## ▶️ Jouer (jury)

**URL publique : https://nuit-blanche-g4.vercel.app/**

Aucune installation nécessaire : un navigateur récent (Chrome, Firefox, Edge, Safari), sur ordinateur ou mobile.

### Lancer en local (solution de secours)

Prérequis : [Node.js](https://nodejs.org) 20 ou plus.

```bash
npm install
npm run dev        # puis ouvrir http://localhost:5173
```

## 🎮 Commandes

| Action | Clavier | Souris / tactile |
|---|---|---|
| Se déplacer | Flèches ou ZQSD | Cliquer / toucher l'endroit voulu |
| Entrer / interagir | E ou Entrée | Toucher l'étiquette jaune |
| Utiliser un objet dans une salle | Touches 1, 2, 3, 4 | Cliquer sur l'objet |
| Demander un indice | H | Bouton « Indice » |
| Revenir au couloir / fermer | Échap | Bouton « Échap · couloir » |
| Pause / quitter | P (ou Échap dans le couloir) | Bouton ⏸ |
| Couper / remettre le son | M | Bouton dans le menu et dans la pause |

## 🔑 Solution complète

**Code de sortie : `2358`**

Les énigmes s'enchaînent : toutes les salles sont ouvertes, mais chacune a besoin d'un objet ou d'une information trouvée dans la précédente.

```
Sormiou ──clé + mot de passe (post-it jaune)──▶ Mont Ventoux (boîtier : 5 → courant ; lumière au choix → gardien)
   ──courant──▶ Callelongue ──durées imprimées──▶ Ste Victoire ──clé du coffre──▶ Garlaban ──ordre──▶ Sortie
```

| Étape | Salle | Domaine | Il faut… | Énigme | Réponse | Ça débloque… |
|---|---|---|---|---|---|---|
| 1 | Sormiou | Observation visuelle | rien (dans le noir, au flash du téléphone) | Compter les post-it **jaunes** (règle sur le tableau blanc) parmi 50 post-it de 6 couleurs : un près de la plante, un sur le mur de droite. Les post-it jaunes sont cliquables : celui près de la plante porte « mdp : `CERCLE26` ». Ouvrir le casier (objet 2) | **2** | Une clé (celle du boîtier électrique de l'amphi, sans le dire) et le mot de passe du PC de Callelongue |
| 2 | Amphi Mont Ventoux | Logique | la clé | Tableau (objet 1) : objectif LAMPE = 1. Boîtier (objet 2) : interrupteurs, lampe et champ du chiffre. « Tester la lampe » (essai raté = +20 min) avec **A = 1, B = 0, C = 1** allume seulement la lampe du boîtier ; le joueur tape 101 lu en binaire = 5 | **5** | **Le courant revient** pour les appareils (PC de Callelongue, distributeur…) |
| 2 bis | Amphi Mont Ventoux | — | l'énigme résolue | Le joueur choisit « Allumer la lumière » ou « Laisser éteint ». S'il laisse éteint, il pourra encore allumer plus tard en rouvrant le boîtier | — | Lumière : plus besoin du flash… mais on lui annonce que **le gardien est là et commence sa ronde**. Éteint : il garde le flash et le gardien n'est pas mentionné |
| 3 | Callelongue | Algorithmique / code | le courant + le mot de passe | PC (objet 1) : `CERCLE26`, puis dérouler le programme : 3 → 5 → (5 ≤ 6 donc × 2) 10 → 10 − 4 = 6 → (pair donc / 2) 3 | **3** | L'imprimante (objet 2, il faut cliquer dessus) donne les durées des tâches |
| 4 | Ste Victoire | Gestion de projet | les durées | Planning (objet 1) puis coffre (objet 2, « Chemin critique ») : A(1) → B(3) → D(4) = 8 jours | **8** | Une clé (celle du frigo) |
| 5 | Point repas / Garlaban | Ordre du code | la clé du coffre | Frigo (objet 1) : on essaie ses clés (« Essayer une clé » : celle du casier ne rentre pas ; « Essayer l'autre clé » : celle du coffre ouvre). Énigme du repas : pair = fille, impair = garçon, nombre = âge. Plus jeune garçon (3) en deuxième, entre son grand frère (5) et une sœur ; les deux plus jeunes (2 et 3) côte à côte ; les deux sœurs fâchées (2 et 8) pas côte à côte → **2358**. Le lien chiffres = âges n'est pas affiché (indice H n°2) | Sormiou, Callelongue, Ventoux, Ste Victoire | L'ordre du code |
| Fin | Porte de sortie (couloir, à gauche) | — | les 4 chiffres + l'ordre | Pavé numérique à cliquer : **2 → 3 → 5 → 8 → A** (A = valider, B = quitter) | **2358** | L'évasion |

**Parcours de la partie parfaite :** Sormiou → Mont Ventoux → Callelongue → Ste Victoire → Garlaban → Sortie.

**Embranchements :**
- **Au début, le courant est coupé** : les salles sont noires et seul le flash du téléphone (qui suit la souris) éclaire un petit cercle. Résoudre le boîtier de l'amphi Mont Ventoux rétablit le courant des appareils. Le joueur choisit ensuite d'allumer la lumière ou de continuer au flash.
- **Allumer la lumière alerte le gardien** (s'il reste dans le noir, le gardien ne vient jamais et n'est jamais mentionné). Le gardien fait des rondes jusqu'au matin : il marche au hasard dans tout le couloir pendant ~40 s, se repose ~30 s dans son local, puis repart. Ses rondes continuent pendant que le joueur est dans une salle (un bandeau le signale). Le cercle de sa lampe torche est visible : **si le joueur y entre, c'est perdu** (fin « Attrapé »).
- **Équipements qui font perdre du temps** (aucun n'est utile) : pouf (Sormiou, +20 min), puzzle (Ste Victoire, +10 min), baby-foot (+10 min) à Garlaban. Avec le courant seulement (même lumière éteinte) : PC du fond (Callelongue, +10 min), borne d'arcade (+15 min) et distributeur (+8 min) à Garlaban.
- **Salle de détente** (facultatif) : un vieux carnet, sous un coussin, rend le prochain indice gratuit.
- **Indices** : touche H. Les indices déjà lus restent consultables gratuitement, et les indices restent disponibles même quand l'énigme de la salle est finie.
- **Fenêtre de Garlaban** : sortie anticipée sans le code → fin « Évasion ratée » (échec).

**Fins possibles :** évasion réussie (code correct), évasion ratée (fenêtre), attrapé (lampe du gardien), game over (9h00).

## 📏 Règles de jeu

- L'horloge démarre à 00:00 ; 1 seconde réelle = 0,45 minute en jeu ; à 09:00 c'est perdu.
- Mauvaise réponse : **+20 min** (l'écran clignote en rouge).
- Indice demandé : **+15 min** (2 ou 3 indices par salle) ; les indices du décor sont gratuits mais comptés.
- Pause : touche **P** (ou Échap dans le couloir) ; le temps et le gardien s'arrêtent.
- Son : ambiance de nuit, pas du joueur et du gardien (plus forts quand il approche, étouffés depuis une salle), cœur qui bat quand il est proche, bruitages des énigmes. Tout est généré par le code (`src/audio/sound.js`). Touche **M** pour couper.
- **Le gardien entendu depuis une salle** : ses pas sont d'autant plus forts et rapprochés qu'il est près de la porte. Un bandeau indique « loin d'ici » (gris), « se rapproche » (orange, à moins de 400 px de la porte) ou « juste devant la porte ! Ne sors pas ! » (rouge, à moins de 200 px, avec le cœur qui bat).
- **Skin de l'élève** : menu « Mon élève ». On règle la peau, les cheveux, la coiffure (courts, longs, bonnet), le sweat, le pantalon et les baskets, ou on tire au hasard. Le skin est gardé dans le navigateur, vaut en solo comme en ligne, et le coéquipier le voit. Il n'y a pas de sweat jaune, pour ne pas le confondre avec les post-it de Sormiou. Code : `src/art/skins.js`.
- **Décor** : chaque salle a son décor (fenêtres, radiateurs, étagères, affiches, chaises, distributeur…), décrit dans le champ `decor` de `src/rooms/<salle>.js` et dessiné par `src/art/decor.js`. Aucun élément du décor n'est jaune, toujours à cause des post-it de Sormiou.
- Sauvegarde automatique (navigateur) : « Sauvegarder et quitter » dans la pause, puis « Continuer » dans le menu.
- Score = 1000 − minutes écoulées − 50 × indices − 30 × erreurs ; classement des 10 meilleurs (local au navigateur).

## 📱 Version mobile

Le jeu se joue aussi sur téléphone et tablette, **en mode paysage**. En portrait, un écran demande de tourner le téléphone.
- **Dans le couloir** : un joystick en bas à gauche pour bouger, et un bouton ✋ à droite pour agir (entrer dans une salle, la porte de sortie…). On peut aussi toucher une porte pour y aller.
- **Dans les salles** : on touche un objet pour l'utiliser, « ← couloir » pour sortir. Dans le noir, le flash suit le doigt.
- Pour les indices, on touche le post-it « Indice ? » en haut à droite. Le bouton ⏸ met en pause, et « ⛶ plein écran » apparaît dans le menu et dans la pause (sauf sur iPhone, où Safari ne le permet pas).
- Les fenêtres des énigmes sont plus compactes sur petit écran. Le mode 2 joueurs marche aussi sur mobile.
- Code : `src/ui/touch.js` (détection du tactile, plein écran) et `createTouchControls` dans `src/scenes/HubScene.js`.

## 👥 Mode 2 joueurs (en ligne)

Menu → **Jouer à 2 (en ligne)**. Chacun joue sur son ordinateur. Le premier clique « Créer une partie » et donne le **code à 5 caractères** affiché ; le second clique « Rejoindre avec un code ». Il faut une connexion internet : le serveur public gratuit de PeerJS sert seulement à mettre les deux navigateurs en relation, ensuite ils communiquent en direct (WebRTC).

- **Rôles** : le créateur est le 🔧 **Technicien**. Lui seul ouvre, tape les codes et manipule les appareils : casier, boîtier électrique, clavier du PC, coffre, réponse du frigo. L'invité est l'🔍 **Enquêteur**. Lui seul lit les documents : tableaux, mémos, vidéoprojecteur, imprimante, planning, programme du PC, mot du frigo. L'icône du rôle est affichée sur l'étiquette de chaque objet. Ils doivent donc se parler (à côté, ou en vocal) : l'un lit, l'autre agit.
- **Ensemble** : chacun voit le personnage de l'autre (avec le skin qu'il a choisi) dans le couloir et dans les salles. Dans une salle sombre, le flash du coéquipier éclaire aussi. Les objets, chiffres, indices, erreurs et l'horloge sont communs.
- **Le gardien** est le même pour les deux : **si l'un des deux se fait attraper, la partie est perdue pour les deux.**
- **La porte de sortie** ne s'ouvre qu'avec les deux élèves devant.
- À 2, la pause n'arrête pas le temps et la partie n'est pas sauvegardée. Si un joueur se déconnecte, l'autre continue seul, sans rôles.
- Code : `src/net/multiplayer.js`. L'hôte fait foi : il envoie l'état complet ~6 fois par seconde. L'invité joue ses actions tout de suite et les envoie à l'hôte, qui les rejoue.

## 🗂️ Structure du dépôt

```
src/
  main.js            configuration Phaser
  config.js          tous les réglages d'équilibrage (temps, pénalités…)
  scenes/            Boot, Menu, Intro, Hub (couloir), Room (salle générique), UI (barre du haut), End
  rooms/             contenu de chaque salle : objets, textes, indices
  puzzles/           logique pure des énigmes (les réponses sont calculées par le code)
  state/             état de la partie + sauvegarde, classement
  net/               mode 2 joueurs en ligne (PeerJS)
  ui/                boîtes de dialogue HTML + CSS
livrables/           livrables L1 à L5 + journal de bord
LICENCES.md          ressources utilisées
REGISTRE_IA.md       usage de l'IA
```

## 🚀 Déploiement

Chaque push sur `main` déploie automatiquement sur GitHub Pages (`.github/workflows/deploy.yml`).
À faire une fois : *Settings → Pages → Source : GitHub Actions*.

## 👥 Équipe

| Membre | Rôle |
|---|---|
| Rayane | Chef de projet |
| Nassim | Game designer & scénariste |
| Ilian | Développeur |
| Noa | Graphiste & UX |
| Benoit | Responsable qualité & passation |
