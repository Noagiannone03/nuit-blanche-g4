# Nuit Blanche à G4 — Escape game

> Cercle de projets 2026 — Institut G4 Marseille — Groupe ___

Un élève s'endort pendant le Cercle de projets et se réveille **enfermé dans l'école à minuit**.
Il a jusqu'à **9h00** (environ 20 minutes réelles) pour trouver le code de la porte de sortie avant l'arrivée de l'équipe pédagogique.

## ▶️ Jouer (jury)

**URL publique : https://<compte>.github.io/<depot>/** ← à compléter après le premier déploiement

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
Sormiou ──clé de l'armoire──▶ Mont Ventoux (courant rétabli, gardien alerté) ──mot de passe projeté──▶ Callelongue
   ──durées imprimées──▶ Ste Victoire ──clé du frigo──▶ Garlaban ──ordre──▶ Sortie
```

| Étape | Salle | Domaine | Il faut… | Énigme | Réponse | Ça débloque… |
|---|---|---|---|---|---|---|
| 1 | Sormiou | Observation visuelle | rien (dans le noir, au flash du téléphone) | Compter les post-it **jaunes** (règle sur le tableau blanc) parmi 50 post-it de 6 couleurs : un près de la plante, un sur le mur de droite. Ouvrir le casier (objet 2) | **2** | La clé de l'armoire électrique de l'amphi |
| 2 | Amphi Mont Ventoux | Logique | la clé de l'armoire | Boîtier (objet 2) : interrupteurs **A = 1, B = 0, C = 1** → la lampe s'allume ; 101 en binaire = 5 | **5** | Le courant revient partout (plus besoin du flash) ; le vidéoprojecteur (objet 4) affiche le mot de passe `CERCLE26`. **Le gardien commence ses rondes.** |
| 3 | Callelongue | Algorithmique / code | le mot de passe | PC (objet 1) : `CERCLE26`, puis dérouler le programme : 3 → 5 → (5 ≤ 6 donc × 2) 10 → 10 − 4 = 6 → (pair donc / 2) 3 | **3** | L'imprimante sort les durées des tâches |
| 4 | Ste Victoire | Gestion de projet | les durées | Planning (objet 1) puis coffre (objet 2) : chemin critique A(1) → B(3) → D(4) = 8 jours | **8** | La clé du frigo |
| 5 | Point repas / Garlaban | Ordre du code | la clé du frigo | Frigo (objet 1) : cliquer les commits du plus ancien au plus récent : 21:47, 22:30, 23:12, 23:58 | Sormiou, Callelongue, Ventoux, Ste Victoire | L'ordre du code |
| Fin | Porte de sortie (couloir, à gauche) | — | les 4 chiffres + l'ordre | Chiffres dans l'ordre : 2 · 3 · 5 · 8 | **2358** | L'évasion |

**Parcours de la partie parfaite :** Sormiou → Mont Ventoux → Callelongue → Ste Victoire → Garlaban → Sortie.

**Embranchements :**
- **Au début, le courant est coupé** : les salles sont noires et seul le flash du téléphone (qui suit la souris) éclaire un petit cercle. Le boîtier de l'amphi Mont Ventoux rétablit la lumière.
- **Le retour du courant alerte le gardien** : il fait des rondes jusqu'au matin. Il marche au hasard dans tout le couloir pendant ~40 s, se repose ~30 s dans son local, puis repart. Ses rondes continuent pendant que le joueur est dans une salle (un bandeau le signale). Le cercle de sa lampe torche est visible : **si le joueur y entre, c'est perdu** (fin « Attrapé »).
- **Salle de détente** (facultatif) : le carnet du gardien, sous un coussin, rend le prochain indice gratuit.
- **Fenêtre de Garlaban** : sortie anticipée sans le code → fin « Évasion ratée » (échec).

**Fins possibles :** évasion réussie (code correct), évasion ratée (fenêtre), attrapé (lampe du gardien), game over (9h00).

## 📏 Règles de jeu

- L'horloge démarre à 00:00 ; 1 seconde réelle = 0,45 minute en jeu ; à 09:00 c'est perdu.
- Mauvaise réponse : **+20 min** (l'écran clignote en rouge).
- Indice demandé : **+15 min** (2 ou 3 indices par salle) ; les indices du décor sont gratuits mais comptés.
- Pause : touche **P** (ou Échap dans le couloir) ; le temps et le gardien s'arrêtent.
- Son : ambiance de nuit, pas du joueur et du gardien (plus forts quand il approche, étouffés depuis une salle), cœur qui bat quand il est proche, bruitages des énigmes. Tout est généré par le code (`src/audio/sound.js`). Touche **M** pour couper.
- Sauvegarde automatique (navigateur) : « Sauvegarder et quitter » dans la pause, puis « Continuer » dans le menu.
- Score = 1000 − minutes écoulées − 50 × indices − 30 × erreurs ; classement des 10 meilleurs (local au navigateur).

## 🗂️ Structure du dépôt

```
src/
  main.js            configuration Phaser
  config.js          tous les réglages d'équilibrage (temps, pénalités…)
  scenes/            Boot, Menu, Intro, Hub (couloir), Room (salle générique), UI (barre du haut), End
  rooms/             contenu de chaque salle : objets, textes, indices
  puzzles/           logique pure des énigmes (les réponses sont calculées par le code)
  state/             état de la partie + sauvegarde, classement
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
| … | Chef de projet |
| … | Game designer & scénariste |
| … | Lead développeur |
| … | Développeur |
| … | Graphiste & UX |
| … | Responsable qualité & passation |
