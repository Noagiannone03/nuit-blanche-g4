# L2 — Scénario et fiches énigmes

## Scénario

### Introduction
Lundi soir, Cercle de projets. Tout le monde est parti. L'élève voulait juste finir « un dernier commit »… Il se réveille la tête sur le clavier : **00:00**. Les portes sont verrouillées et la sortie demande un **code à 4 chiffres**. À **9h00**, l'école ouvre : s'il est encore là, il se fait attraper.

### Fil narratif
Le joueur part de l'entrée (« Vous êtes ici ») et explore le couloir. Chaque salle contient les traces de **sa propre soirée** : ses post-it à Sormiou, son algorithme à Callelongue, son circuit au tableau de l'amphi, le planning à Ste Victoire, et ses **commits imprimés** sur le frigo du point repas. En recollant les morceaux de sa soirée, il reconstitue le code.

### Dépendances entre énigmes
Toutes les salles sont ouvertes dès le début, mais chaque énigme a besoin d'un objet ou d'une information trouvée dans une autre salle. Le joueur doit donc traverser le couloir plusieurs fois, donc risquer de croiser le gardien. La difficulté monte au fil de la chaîne.

```
Sormiou (★)  ──mot de passe CERCLE26──▶  Callelongue (★★)  ──clé de l'armoire──▶  Mont Ventoux (★★)
   ──durées projetées──▶  Ste Victoire (★★★)  ──clé du frigo──▶  Garlaban (★★)  ──ordre──▶  SORTIE : 3658
```

Un objet verrouillé explique toujours ce qui manque et donne un indice sur l'endroit où chercher, sans pénalité.

### Embranchements
1. **Les rondes du gardien (à partir de 03:00, jusqu'au matin)** : le gardien marche au hasard dans tout le couloir pendant ~40 s, se repose ~30 s dans son local, puis repart. Ses rondes continuent quand le joueur est dans une salle (un bandeau « le gardien rôde » s'affiche). À sa première apparition, le joueur choisit :
   - *Se cacher en salle de détente* → −45 min, le gardien saute cette ronde, et le carnet du gardien offre un **indice gratuit**. Il revient ensuite.
   - *Continuer en l'évitant* → la ronde commence tout de suite.
   - Repéré : −60 min, retour à l'entrée ; le gardien retourne dans son local avant la ronde suivante.
2. **La fenêtre de Garlaban** : le joueur peut s'enfuir sans le code → **fin « Évasion ratée »** (l'alarme se déclenche).

### Fins
| Fin | Condition | Résultat |
|---|---|---|
| Évasion réussie | Code 3658 à la porte de sortie | Victoire, score et classement |
| Évasion ratée | Sauter par la fenêtre | Échec |
| Game over | L'horloge atteint 09:00 | Échec |

---

## Fiche 1 — Sormiou : les post-it

| | |
|---|---|
| **Domaine** | Observation visuelle |
| **Difficulté** | ★☆☆ (énigme d'entrée) |
| **Durée visée (partie parfaite)** | 1 min 30 |
| **Objets** | Tableau blanc, casier à code, bureau et clavier, 15 post-it de 3 couleurs |
| **Énoncé** | Le tableau blanc : « On ne garde que les post-it **JAUNES**. Leur nombre ouvre le casier. » |
| **Solution** | 6 post-it jaunes (2 près de la plante et en bas de l'écran, plus discrets) → **6** |
| **Récompense** | Chiffre 6 + dans le casier : mot de passe **CERCLE26** pour Callelongue |
| **Indice décor** | Sous le clavier : « regarde PARTOUT : murs, sol, près de la plante » |
| **Indice 1** | Ne compte que les jaunes, dans toute la salle : murs, bureau, sol. |
| **Indice 2** | Certains sont près de la plante et presque sous le bureau. |
| **Erreur** | +20 min |
| **Code** | `src/puzzles/observation.js`, `src/rooms/sormiou.js` |

## Fiche 2 — Callelongue : le programme

| | |
|---|---|
| **Domaine** | Algorithmique / code |
| **Difficulté** | ★★☆ |
| **Durée visée** | 2 min |
| **Prérequis** | Mot de passe trouvé dans le casier de Sormiou |
| **Énoncé** | Le PC affiche un pseudo-code ; le bouton « Exécuter » est cassé. Qu'affiche le programme ? |
| **Programme** | `x ← 0 ; POUR i DE 1 À 5 : SI i pair ALORS x ← x + i SINON x ← x − 1 ; AFFICHER x` |
| **Solution** | i=1 → −1 ; i=2 → 1 ; i=3 → 0 ; i=4 → 4 ; i=5 → 3 → **3** |
| **Récompense** | Chiffre 3 + la clé de l'armoire électrique de l'amphi (sort de l'imprimante) |
| **Indice décor** | Post-it sur la rangée de PC : « fais un tableau i \| x », avec les deux premiers tours déroulés |
| **Indice 1** | Le mot de passe est à Sormiou, sous un objet du bureau. |
| **Indice 2** | Déroulé des trois premiers tours de boucle. |
| **Erreur** | Mauvais mot de passe ou mauvaise réponse : +20 min |
| **Code** | `src/puzzles/algorithmique.js`, `src/rooms/callelongue.js` |

## Fiche 3 — Amphi Mont Ventoux : le circuit

| | |
|---|---|
| **Domaine** | Logique |
| **Difficulté** | ★★☆ |
| **Durée visée** | 2 min 30 |
| **Prérequis** | Clé de l'armoire trouvée à Callelongue |
| **Énoncé** | Le tableau montre un circuit : P1 = A OU B ; P2 = NON(A ET B) ; P3 = NON B ; P4 = C ET P1 ; LAMPE = P2 ET P3 ET P4. Le boîtier a 3 interrupteurs et une étiquette « ABC, lu en binaire ». |
| **Solution** | P3 ⇒ B = 0 ; P4 ⇒ C = 1 et A = 1 ; ABC = 101₂ = **5** (une seule combinaison possible) |
| **Interaction** | Les interrupteurs allument vraiment la lampe ; le joueur peut tester |
| **Récompense** | Chiffre 5 + le courant revient : le vidéoprojecteur affiche les durées des tâches pour Ste Victoire |
| **Indice décor** | Bureau : « Colonnes 4, 2, 1 : 110 → 6 » |
| **Indice 1** | Commence par P3 : que doit valoir B ? |
| **Indice 2** | ABC = 101, convertis en décimal. |
| **Erreur** | +20 min |
| **Code** | `src/puzzles/logique.js`, `src/rooms/ventoux.js` |

## Fiche 4 — Ste Victoire : le planning

| | |
|---|---|
| **Domaine** | Conception / gestion de projet |
| **Difficulté** | ★★★ |
| **Durée visée** | 2 min 30 |
| **Prérequis** | Les durées, projetées dans l'amphi Mont Ventoux (sur le mur, la colonne est effacée) |
| **Énoncé** | « Combien de jours, au minimum, pour livrer le projet du mur ? » |
| **Récompense** | Chiffre 8 + la clé du frigo de Garlaban |
| **Données** | A Cadrage 1 j ; B Scénario 3 j (A) ; C Maquettes 2 j (A) ; D Développement 4 j (B, C) ; E Affiches 1 j (C) |
| **Solution** | Chemin critique A → B → D = 1 + 3 + 4 = **8** (A → C → D = 7 ; A → C → E = 4) |
| **Indice décor** | Carnet : définition du chemin critique |
| **Indice 1** | Calcule la fin au plus tôt de chaque tâche. |
| **Indice 2** | A finit J1, B J4, C J3 ; D attend B **et** C. |
| **Erreur** | +20 min |
| **Code** | `src/puzzles/planning.js`, `src/rooms/stevictoire.js` |

## Fiche 5 — Point repas & Garlaban : les commits

| | |
|---|---|
| **Domaine** | Synthèse (ordre du code) — tri chronologique, Git |
| **Difficulté** | ★★☆ |
| **Durée visée** | 1 min 30 |
| **Prérequis** | La clé du frigo, trouvée dans le coffre de Ste Victoire |
| **Énoncé** | 4 commits imprimés rangés dans le frigo, dans le désordre. Les cliquer du plus ancien au plus récent. |
| **Solution** | 21:47 Callelongue → 22:30 Sormiou → 23:12 Ventoux → 23:58 Ste Victoire |
| **Récompense** | L'ordre du code : 3 · 6 · 5 · 8 |
| **Indice décor** | Micro-ondes : « Le code se lit dans l'ordre où j'ai bossé ce soir. » |
| **Indice 1** | Les feuilles sont des commits : regarde leurs heures. |
| **Indice 2** | Le plus ancien est celui de 21:47. |
| **Erreur** | Mauvais clic : on recommence le tri, +20 min |
| **Piège** | Fenêtre entrouverte → fin « Évasion ratée » |
| **Code** | `src/puzzles/ordre.js`, `src/rooms/garlaban.js` |

## Finale — Porte de sortie

Code **3658**. Mauvais code : +20 min et l'écran tremble.

---

## Équilibrage

| Paramètre | Valeur | Fichier |
|---|---|---|
| Durée max réelle | 20 min (00:00 → 09:00) | `src/config.js` |
| Pénalité erreur | +20 min de jeu | `src/config.js` |
| Coût indice | +15 min de jeu | `src/config.js` |
| Gardien | 03:00 ; se cacher −45 min ; repéré −60 min | `src/config.js` |
| Partie parfaite visée | 10 à 12 min réelles | à **mesurer** en recette |

## À compléter pour le L2 (mercredi 9h)
- [ ] Backlog (user stories priorisées) dans le tableau de tâches
- [ ] Maquettes (couloir, une salle, écran de fin)
- [ ] Choix techniques justifiés (Phaser + Vite + GitHub Pages ; HTML pour les énigmes = accessibilité)
- [ ] Planning des sprints détaillé
