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
| Revenir au couloir / fermer | Échap | Bouton jaune |

## 🔑 Solution complète

**Code de sortie : `3658`**

| Ordre | Salle | Domaine | Énigme | Réponse |
|---|---|---|---|---|
| — | Sormiou | Observation visuelle | Compter les post-it **jaunes** (le tableau blanc précise la règle). Le mot de passe du PC de Callelongue est sous le clavier du bureau. | **6** (+ mot de passe `CERCLE26`) |
| — | Callelongue | Algorithmique / code | Se connecter au PC avec `CERCLE26`, puis dérouler le programme : x = −1, 1, 0, 4, 3 | **3** |
| — | Amphi Mont Ventoux | Logique | Interrupteurs **A = 1, B = 0, C = 1** → la lampe s'allume ; 101 en binaire = 5 | **5** |
| — | Ste Victoire | Gestion de projet | Chemin critique A(1) → B(3) → D(4) = 8 jours | **8** |
| — | Point repas / Garlaban | Ordre du code | Cliquer les commits du plus ancien au plus récent : 21:47, 22:30, 23:12, 23:58 → Callelongue, Sormiou, Ventoux, Ste Victoire | Ordre **C-S-V-SV** |
| Fin | Porte de sortie (couloir, à gauche) | — | Chiffres dans l'ordre : 3 · 6 · 5 · 8 | **3658** |

**Parcours conseillé (partie parfaite) :** Sormiou → Callelongue → Mont Ventoux → Ste Victoire → Garlaban → Sortie.

**Embranchements :**
- **À 03:00**, si le joueur est dans le couloir, le gardien fait sa ronde :
  - *Se cacher* : −45 min, mais le prochain indice devient gratuit.
  - *Continuer* : le gardien patrouille dans le couloir ; s'il voit le joueur, celui-ci perd 60 min et revient à l'entrée. Se réfugier dans une salle permet de l'éviter.
- **Fenêtre de Garlaban** : sortie anticipée sans le code → fin « Évasion ratée » (échec).

**Fins possibles :** évasion réussie (code correct), évasion ratée (fenêtre), game over (9h00).

## 📏 Règles de jeu

- L'horloge démarre à 00:00 ; 1 seconde réelle = 0,45 minute en jeu ; à 09:00 c'est perdu.
- Mauvaise réponse : **+20 min** (l'écran clignote en rouge).
- Indice demandé : **+15 min** (2 indices par salle) ; les indices du décor sont gratuits mais comptés.
- Sauvegarde automatique (navigateur) : « Continuer la partie » dans le menu.
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
