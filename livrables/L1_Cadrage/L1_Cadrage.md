# L1 — Cadrage

**Projet :** Nuit Blanche à G4 — escape game numérique
**Équipe :** Groupe ___ — Campus de Marseille
**Date de remise :** mardi 3 novembre 2026, 9h00
**Version :** 1.0

---

## 1. Note d'intention

### Le pitch
*« Tu as voulu faire un dernier commit… et tu t'es réveillé enfermé dans l'école. »*

Pendant le Cercle de projets, un élève s'endort sur son clavier. Il se réveille à **minuit**, seul dans les locaux de G4 Marseille. Toutes les portes sont verrouillées et la sortie demande un **code à 4 chiffres**. À **9h00**, l'équipe pédagogique arrive : il doit être dehors avant.

### Pourquoi ce choix
- **Un univers que le jury connaît** : le jeu reprend le vrai plan du campus (Amphi Mont Ventoux, Callelongue, Ste Victoire, Sormiou, Garlaban). Le joueur parcourt l'école dans laquelle il travaille.
- **Des énigmes métier crédibles** : dans une école d'informatique, résoudre un circuit logique, dérouler un algorithme ou calculer un chemin critique est naturel. Chaque salle correspond à un domaine.
- **Un clin d'œil au Cercle de projets** : les indices sont les traces laissées par l'élève (ses commits, ses post-it, le planning de son projet).

### Expérience visée
- Une partie parfaite de **8 à 15 minutes** ; une partie « normale » de 15 à 20 minutes, avec un peu de stress en fin de partie.
- Une difficulté progressive : observation, puis code, puis logique, puis gestion de projet, puis synthèse.
- Un jeu jouable **sans installation** sur ordinateur **et sur mobile**, entièrement au clavier.

### Ce qui nous différencie
- Le gardien et ses **choix à conséquences** (se cacher ou tenter sa chance).
- Les **réponses calculées par le code** (les énigmes sont de vrais petits algorithmes, pas des réponses recopiées).
- **3 fins** différentes.

---

## 2. Charte projet

| Élément | Contenu |
|---|---|
| **Objectif** | Livrer un escape game jouable en ligne, conforme au périmètre minimal, vendredi 6 novembre à 16h00 |
| **Périmètre inclus** | 5 salles + couloir, 5 énigmes (4 domaines + ordre du code), indices, chrono, pénalités, sauvegarde, embranchements, 3 fins, classement, version mobile |
| **Hors périmètre** | Multijoueur en ligne, classement en ligne partagé (optionnel si temps restant), sons originaux complexes |
| **Livrables** | L1 à L5, journal de bord quotidien (voir planning) |
| **Technologies** | Phaser 3 (JavaScript), Vite, GitHub, GitHub Actions + GitHub Pages |
| **Contraintes** | 5 jours, 6 personnes de niveaux mixtes, autonomie maximale, IA déclarée, ressources libres de droits |
| **Critères de succès** | Le jury lance le jeu en < 2 min depuis le README ; aucune énigme bloquante ; tous les livrables à l'heure ; bonus visés : URL publique, accessibilité / mobile, originalité |
| **Méthode** | Scrum allégé : 1 sprint = 1 jour, daily de 15 min à 9h15, revue de fin de journée à 17h30, tableau de tâches partagé |
| **Règles d'équipe** | Commits petits et fréquents ; une branche par fonctionnalité, merge sur `main` après relecture par un autre membre ; tout le monde code au moins une énigme ; blocage → 30 min seul/en équipe, puis le plus expérimenté |

### Planning des jalons

| Jour | Sprint | Objectif | Livrable |
|---|---|---|---|
| Lun 02/11 | Sprint 0 | Cadrage, idée, squelette jouable, dépôt Git | — |
| Mar 03/11 | Sprint 1 | Spécifications, maquettes, énigmes codées | **L1 Cadrage 9h00** |
| Mer 04/11 | Sprint 2 | Énigmes finies + graphismes | **L2 Spécifications 9h00** |
| Jeu 05/11 | Sprint 3 | Polish, sons, accessibilité, recette | **L3 Point d'étape 9h00** (vidéo 3 min) |
| Ven 06/11 | Sprint 4 | Correction de bugs, README, REX | **L3 Recette 9h00**, **L4 Produit + L5 Clôture 16h00** |

---

## 3. Rôles et matrice RACI

| Membre | Rôle principal | Rôle secondaire |
|---|---|---|
| … | Chef de projet | Dev énigme Garlaban |
| … | Game designer & scénariste | Dev énigme Ste Victoire |
| … | Lead développeur | Couloir, gardien, déploiement |
| … | Développeur | Dev énigmes Callelongue + Ventoux |
| … | Graphiste & UX | Dev énigme Sormiou (décor) |
| … | Responsable qualité & passation | Tests, README |

**R** = Réalise · **A** = Approuve (un seul par ligne) · **C** = Consulté · **I** = Informé

| Tâche | Chef de projet | Game designer | Lead dev | Dev | Graphiste UX | Qualité |
|---|---|---|---|---|---|---|
| Planning, dailies, tableau de tâches | **A/R** | I | C | I | I | C |
| Scénario et univers | A | **R** | C | I | C | I |
| Conception des énigmes et indices | C | **A/R** | C | R | I | C |
| Architecture, dépôt Git, déploiement | I | I | **A/R** | C | I | I |
| Développement des énigmes | I | C | A | **R** | C | C |
| Identité visuelle, maquettes, décors | I | C | C | I | **A/R** | I |
| Sons | I | C | I | I | **A/R** | I |
| Accessibilité / version mobile | I | I | C | R | **A/R** | C |
| Recette, cahier de tests, bugs | I | C | C | C | I | **A/R** |
| README (solution), LICENCES, registre IA | C | C | C | I | I | **A/R** |
| Journal de bord | R | I | I | I | I | **A** |
| Vidéo point d'étape | **A** | R | C | I | R | I |
| REX, fiche de passation | **A** | R | R | R | R | R |
| Annonce des dépôts dans #depots | **A/R** | I | I | I | I | I |

---

## 4. Analyse des risques

Probabilité (P) et impact (I) de 1 à 3 ; criticité = P × I.

| # | Risque | P | I | Crit. | Prévention | Plan B |
|---|---|---|---|---|---|---|
| R1 | Une partie parfaite dure moins de 8 min | 3 | 3 | **9** | Chronométrer une partie parfaite chaque soir dès mardi | Ajouter des étapes d'exploration ou une 6ᵉ énigme |
| R2 | Membres qui ne connaissent pas Phaser / JS | 3 | 2 | **6** | Session de transmission mardi matin (1h) par le lead dev ; une salle = un fichier simple | Binômes ancien / nouveau |
| R3 | Conflits Git / code cassé sur `main` | 2 | 3 | **6** | Branches par fonctionnalité, relecture avant merge, déploiement auto pour voir la casse tout de suite | Revenir au dernier commit stable (`git revert`) |
| R4 | Partie de code que personne ne sait expliquer (IA) | 2 | 3 | **6** | Registre IA tenu à jour ; relecture croisée ; chaque membre présente une salle à l'équipe | Réécrire / simplifier la partie concernée |
| R5 | Énigme trop dure ou ambiguë | 2 | 2 | 4 | Tests par une autre équipe jeudi ; 2 indices par salle | Rendre l'indice du décor plus explicite |
| R6 | URL publique indisponible le jour J | 1 | 3 | 3 | Déploiement dès lundi, tests de l'URL chaque jour | `npm run dev` documenté dans le README |
| R7 | Retard sur un livrable | 2 | 2 | 4 | Livrables préparés la veille, relus à 8h30 | Réduire le périmètre et l'expliquer dans le REX |
| R8 | Absence d'un membre | 1 | 2 | 2 | Tâches documentées dans le tableau | Redistribution au daily |
| R9 | Sauvegarde perdue (navigation privée) | 1 | 1 | 1 | Le jeu fonctionne sans stockage | — |

---

## 5. Liens

| Ressource | Lien |
|---|---|
| Dépôt Git | https://github.com/Noagiannone03/nuit-blanche-g4 |
| Jeu en ligne | https://noagiannone03.github.io/nuit-blanche-g4/ |
| Tableau de tâches | https://claude.ai/artifact/DnGsbFg1vjiUiRX156oXvN |
| Journal de bord | `livrables/00_Journal/journal_de_bord.md` |
