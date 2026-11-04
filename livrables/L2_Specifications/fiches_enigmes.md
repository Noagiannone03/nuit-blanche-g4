# L2 — Scénario et fiches énigmes

## Scénario

### Introduction
Lundi soir, Cercle de projets. Tout le monde est parti. L'élève voulait juste finir « un dernier commit »… Il se réveille la tête sur le clavier : **00:00**. Les portes sont verrouillées et la sortie demande un **code à 4 chiffres**. À **9h00**, l'école ouvre : s'il est encore là, il se fait attraper.

### Fil narratif
Le joueur part de l'entrée (« Vous êtes ici ») et explore le couloir. Chaque salle contient les traces de **sa propre soirée** : ses post-it à Sormiou, son algorithme à Callelongue, son circuit au tableau de l'amphi, le planning à Ste Victoire, et le mot de sa mère sur le frigo du point repas. En recollant les morceaux de sa soirée, il reconstitue le code.

### Dépendances entre énigmes
Toutes les salles sont ouvertes dès le début, mais chaque énigme a besoin d'un objet ou d'une information trouvée dans une autre salle. Le joueur doit donc traverser le couloir plusieurs fois, donc risquer de croiser le gardien. La difficulté monte au fil de la chaîne.

```
Sormiou (★, dans le noir)  ──clé + mot de passe CERCLE26 (post-it jaune)──▶  Mont Ventoux (★★ ; disjoncteur : courant + gardien)
   ──courant──▶  Callelongue (★★)  ──durées imprimées──▶  Ste Victoire (★★★)  ──clé du coffre──▶  Garlaban (★★)  ──ordre──▶  SORTIE : 2358
```

Un objet verrouillé dit seulement qu'il est fermé (« Fermé à clé », « Pas de courant ») : c'est au joueur de faire le lien. Les indices (touche H) donnent la piste, et ceux déjà lus restent consultables gratuitement.

### Embranchements
1. **Le noir, puis le gardien** : au début, le courant est coupé ; dans les salles, seul le flash du téléphone (il suit la souris) éclaire un petit cercle. Remonter le disjoncteur général de l'amphi Mont Ventoux rallume tout. Le joueur le fait quand il veut, et le jeu ne lui dit pas ce qui va se passer : cela **alerte le gardien** (jamais mentionné avant), qui fait des rondes jusqu'au matin : ~40 s au hasard dans le couloir, ~30 s de pause dans son local, puis il repart. Ses rondes continuent quand le joueur est dans une salle (un bandeau « le gardien rôde » s'affiche). Le cercle de sa lampe torche (rayon 120 px) est visible : **si le joueur y entre, fin « Attrapé »**.
   - *Salle de détente* (facultatif) : un vieux carnet, sous un coussin, offre un **indice gratuit**.
   - *Équipements inutiles* : pouf, puzzle, baby-foot, et avec le courant seulement le PC du fond, la borne d'arcade et le distributeur. Ils font perdre 8 à 20 min.
2. **La fenêtre de Garlaban** : le joueur peut s'enfuir sans le code → **fin « Évasion ratée »** (l'alarme se déclenche).

### Fins
| Fin | Condition | Résultat |
|---|---|---|
| Évasion réussie | Code 2358 à la porte de sortie | Victoire, score et classement |
| Évasion ratée | Sauter par la fenêtre | Échec |
| Attrapé | Entrer dans le cercle de la lampe du gardien | Échec |
| Game over | L'horloge atteint 09:00 | Échec |

---

## Fiche 1 — Sormiou : les post-it

| | |
|---|---|
| **Domaine** | Observation visuelle |
| **Difficulté** | ★☆☆ (énigme d'entrée) |
| **Durée visée (partie parfaite)** | 1 min 30 |
| **Contrainte** | Salle dans le noir : il faut balayer la salle avec le flash du téléphone (il suit la souris) |
| **Objets** | Tableau blanc, casier à code, bureau et clavier, 50 post-it de 6 couleurs (jaune, orange, rose, bleu, vert, violet) |
| **Énoncé** | Le tableau blanc : « On ne garde que les idées validées : les post-it **JAUNES**. On notera le nombre d'idées retenues dans le coffre. » Les 2 post-it jaunes sont cliquables : l'un porte « mdp : CERCLE26 » (sans dire à quoi il sert), l'autre une idée validée. |
| **Solution** | Seulement 2 post-it jaunes, perdus parmi 48 leurres (les orange leur ressemblent) : un près de la plante, un sur le mur de droite → **2** |
| **Récompense** | Chiffre 2 + « Tu as obtenu une clé » (celle du boîtier électrique de Mont Ventoux, sans le dire) + le mot de passe du PC de Callelongue (post-it) |
| **Indice décor** | Sous le clavier : « Les infos importantes sont sur les post-it JAUNES. Regarde PARTOUT : murs, sol, près de la plante » |
| **Indice 1** | Balaie toute la salle au flash ; ne compte que les JAUNES (attention aux orange). |
| **Indice 2** | Il y en a très peu : un près de la plante, un sur le mur de droite. Touche-les : des indices sont écrits dessus. |
| **Erreur** | +20 min |
| **Code** | `src/puzzles/observation.js`, `src/rooms/sormiou.js` |

## Fiche 2 — Amphi Mont Ventoux : le circuit

| | |
|---|---|
| **Domaine** | Logique |
| **Difficulté** | ★★☆ |
| **Durée visée** | 2 min 30 |
| **Prérequis** | La clé trouvée dans le casier de Sormiou (le boîtier dit seulement « Fermé à clé ») |
| **Énoncé** | Le tableau montre un circuit : P1 = A OU B ; P2 = NON(A ET B) ; P3 = NON B ; P4 = C ET P1 ; LAMPE = P2 ET P3 ET P4, avec l'objectif écrit en dessous : « LAMPE = 1 → la lampe s'allume ». Le boîtier a 3 interrupteurs et une étiquette « ABC, lu en binaire ». |
| **Solution** | P3 ⇒ B = 0 ; P4 ⇒ C = 1 et A = 1 ; ABC = 101₂ = **5** (une seule combinaison possible) |
| **Interaction** | Interrupteurs, lampe et champ du chiffre sont dans la même boîte (« Tu peux tester la lampe, chaque essai raté coûte du temps »). « Tester la lampe » avec la bonne combinaison allume seulement la lampe du boîtier, sinon pénalité. Le joueur convertit lui-même ABC = 101 en décimal et tape **5** (mauvais chiffre : pénalité). À part, le **disjoncteur général** (objet 4) : le joueur choisit de remonter le levier ou non. |
| **Récompense** | Chiffre 5. Disjoncteur : le courant revient dans toute l'école (fin du noir, le PC de Callelongue s'allume)… et **le gardien commence ses rondes**. |
| **Indice décor** | Bureau : « Colonnes 4, 2, 1 : 110 → 6 » |
| **Indice 1** | La clé est dans le casier de Sormiou. |
| **Indice 2** | Objectif LAMPE = 1 : P2, P3, P4 valent 1. Commence par P3 : que doit valoir B ? |
| **Indice 3** | A = 1, B = 0, C = 1 ; lire 101 avec le mémo du bureau (colonnes 4, 2, 1). |
| **Erreur** | Chaque test raté : +20 min |
| **Code** | `src/puzzles/logique.js`, `src/rooms/ventoux.js` |

## Fiche 3 — Callelongue : le programme

| | |
|---|---|
| **Domaine** | Algorithmique / code |
| **Difficulté** | ★★☆ |
| **Durée visée** | 2 min |
| **Prérequis** | Le courant (disjoncteur de Mont Ventoux : sinon l'écran reste noir) et le mot de passe, sur un post-it jaune de Sormiou |
| **Énoncé** | Le PC affiche un pseudo-code ; le bouton « Exécuter » est cassé. Qu'affiche le programme ? |
| **Programme** | `nombre ← 3 ; nombre ← nombre + 2 ; SI nombre > 6 ALORS nombre ← nombre − 3 SINON nombre ← nombre × 2 ; nombre ← nombre − 4 ; SI nombre est pair ALORS nombre ← nombre / 2 SINON nombre ← nombre + 1 ; AFFICHER nombre` |
| **Solution** | 3 → 5 → 5 n'est pas > 6, donc SINON : 10 → 10 − 4 = 6 → 6 est pair : 6 / 2 = **3** |
| **Récompense** | Chiffre 3 + « une machine se met à ronronner » : il faut cliquer sur l'imprimante pour récupérer les durées des tâches pour Ste Victoire |
| **Indice décor** | Rangée de PC, une fois le courant revenu : un écran affiche « écris la valeur de nombre après chaque ligne ; un SI n'exécute qu'une branche », avec les deux premières lignes déroulées |
| **Indice 1** | Le mot de passe de la session est dans la salle Sormiou. |
| **Indice 2** | 3, puis 5 ; 5 n'est pas > 6, donc SINON : 10… |
| **Erreur** | Mauvais mot de passe ou mauvaise réponse : +20 min |
| **Code** | `src/puzzles/algorithmique.js`, `src/rooms/callelongue.js` |

## Fiche 4 — Ste Victoire : le planning

| | |
|---|---|
| **Domaine** | Conception / gestion de projet |
| **Difficulté** | ★★★ |
| **Durée visée** | 2 min 30 |
| **Prérequis** | Les durées, imprimées à Callelongue (sur le mur, la colonne est effacée) |
| **Énoncé** | Gravé sur le coffre : « Chemin critique ». Sur le mur, la colonne des durées est effacée. |
| **Récompense** | Chiffre 8 + « Tu as trouvé une clé » (celle du frigo de Garlaban, sans le dire) |
| **Données** | A Cadrage 1 j ; B Scénario 3 j (A) ; C Maquettes 2 j (A) ; D Développement 4 j (B, C) ; E Affiches 1 j (C) |
| **Solution** | Chemin critique A → B → D = 1 + 3 + 4 = **8** (A → C → D = 7 ; A → C → E = 4) |
| **Indice décor** | Carnet : définition du chemin critique |
| **Indice 1** | Calcule la fin au plus tôt de chaque tâche. |
| **Indice 2** | A finit J1, B J4, C J3 ; D attend B **et** C. |
| **Erreur** | +20 min |
| **Code** | `src/puzzles/planning.js`, `src/rooms/stevictoire.js` |

## Fiche 5 — Point repas & Garlaban : le repas

| | |
|---|---|
| **Domaine** | Synthèse (ordre du code) — logique et déduction |
| **Difficulté** | ★★☆ |
| **Durée visée** | 1 min 30 |
| **Prérequis** | La clé du coffre de Ste Victoire (le frigo : « fermé par un petit cadenas » ; on y essaie ses clés, celle du boîtier ne rentre pas) ; les 4 chiffres des autres salles |
| **Énoncé** | Mot sur le frigo : « C'est l'heure de manger ! La mère sert ses enfants toujours dans le même ordre (chacun s'assoit dans l'ordre du service). La grande sœur s'est disputée avec sa petite sœur, qui a touché à son maquillage : elles sont toujours en colère. Le deuxième servi est le plus jeune garçon : il s'assoit toujours à côté de son grand frère et d'une de ses sœurs. Les deux plus jeunes passent leur temps ensemble : ils adorent jouer ensemble. » Les chiffres trouvés ne sont **pas** affichés : le joueur doit comprendre seul que les enfants sont les 4 chiffres des autres salles (indice H n°2 sinon). |
| **Règle cachée** | Nombre = âge ; pair = fille (XX, nombre pair de X), impair = garçon (XY) |
| **Solution** | Filles 2 et 8, garçons 3 et 5. 3 (plus jeune garçon) est 2e, entre son grand frère 5 et une sœur. Les deux plus jeunes (2 et 3) sont côte à côte, donc 2 est 1er ou 3e ; les sœurs 2 et 8 ne sont pas côte à côte, donc 2 est 1er, 5 3e, 8 4e = **2358** |
| **Récompense** | L'ordre du code : Sormiou, Callelongue, Ventoux, Ste Victoire |
| **Indice décor** | Micro-ondes, magnet de SVT : « Les hommes ont XY, les femmes XX : les chromosomes féminins ont un nombre pair de X ! » |
| **Indice 1** | La clé du frigo est dans le coffre de Ste Victoire. |
| **Indice 2** | Les 4 enfants sont les 4 chiffres trouvés dans les autres salles (chiffre = âge) ; pair = fille, impair = garçon. |
| **Indice 3** | Le 3 est servi 2e, entre son grand frère 5 et une sœur ; le 2 joue avec le 3 ; les deux sœurs ne sont pas côte à côte. |
| **Erreur** | +20 min |
| **Note de conception** | Le code vérifie qu'il n'existe qu'une seule solution (`servingOrder` dans `src/puzzles/ordre.js`). |
| **Piège** | Fenêtre entrouverte → fin « Évasion ratée » |
| **Code** | `src/puzzles/ordre.js`, `src/rooms/garlaban.js` |

## Finale — Porte de sortie

Pavé numérique à cliquer (le clavier de l'ordinateur ne sert pas) : **2 → 3 → 5 → 8 → A**. A = valider, B = quitter. Mauvais code : +20 min et l'écran tremble.

---

## Équilibrage

| Paramètre | Valeur | Fichier |
|---|---|---|
| Durée max réelle | 20 min (00:00 → 09:00) | `src/config.js` |
| Pénalité erreur | +20 min de jeu | `src/config.js` |
| Coût indice | +15 min de jeu | `src/config.js` |
| Gardien | rondes dès le retour du courant ; lampe 120 px ; repéré = fin de partie | `src/config.js` |
| Flash du téléphone | rayon 110 px, tant que le courant est coupé | `src/config.js` |
| Partie parfaite visée | 10 à 12 min réelles | à **mesurer** en recette |

## À compléter pour le L2 (mercredi 9h)
- [ ] Backlog (user stories priorisées) dans le tableau de tâches
- [x] Maquettes : voir `maquettes/` (planches SVG annotées, importables dans Figma)
- [ ] Choix techniques justifiés (Phaser + Vite + GitHub Pages ; HTML pour les énigmes = accessibilité)
- [ ] Planning des sprints détaillé
