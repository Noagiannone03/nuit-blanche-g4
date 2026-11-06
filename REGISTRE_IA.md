# Registre IA

> Toute utilisation de l'IA est déclarée ici. Chaque membre doit pouvoir expliquer n'importe quelle partie du produit.

## Qui a fait quoi

**L'équipe a conçu le jeu.** Le concept (s'échapper de l'école la nuit), le choix et le contenu des énigmes, leur ordre, les règles du jeu, l'ambiance et toutes les décisions de gameplay viennent de nous :
- l'ordre des salles : Sormiou → Mont Ventoux → Callelongue → Ste Victoire → Garlaban ;
- le code final **2358** et les 2 seuls post-it jaunes perdus parmi les leurres ;
- l'algorithme de Callelongue ;
- l'énigme du repas au frigo (les sœurs fâchées, le plus jeune garçon servi en 2e, les deux plus jeunes qui jouent ensemble) ;
- la lampe à tester à Mont Ventoux, sans donner le chiffre ;
- le choix d'allumer la lumière ou non, et le gardien qui n'arrive qu'à ce moment ;
- les salles dans le noir avec le flash du téléphone ;
- le mot de passe caché sur un post-it ;
- le pavé de sortie avec A / B ;
- les équipements qui font perdre du temps ;
- le mode 2 joueurs, les skins, la version mobile.

**L'IA (Claude, d'Anthropic, via Claude Code) a servi d'outil de développement** : elle a écrit le code à partir de nos consignes, dessiné les graphismes et généré les sons en code, et préparé des brouillons de documents.

**Nous avons testé, corrigé et validé.** Nous avons joué chaque version, signalé les problèmes et demandé les corrections jusqu'à obtenir le jeu voulu. Exemples :
- un son de porte qui « faisait moustique » ;
- une énigme de Mont Ventoux trop simple qui donnait la réponse ;
- des boutons inutilisables en plein écran ;
- la connexion à 2 joueurs qui tournait en boucle ;
- des textes qui en disaient trop (clés, gardien).

Pour que chaque membre puisse expliquer le code, nous avons fait ajouter un commentaire en français simple sur chaque ligne.

## Détail des utilisations

| Date | Membre | Outil | Demande de l'équipe (résumé) | Ce qui a été produit | Ce que l'équipe a vérifié / modifié | Fichiers concernés |
|---|---|---|---|---|---|---|

| 02/11/2026 | Ilian | Claude (Anthropic) — Claude Code | Analyse des consignes du Cercle de projets et de **notre idée** de jeu ; propositions d'énigmes à partir de nos thèmes | Propositions d'énigmes, de ronde du gardien et d'architecture | Choix des énigmes gardées et de l'ordre ; plusieurs énigmes remplacées ensuite par les nôtres | — |

| 02/11/2026 | Ilian | Claude (Anthropic) — Claude Code | Squelette du jeu Phaser selon **notre cahier des charges** (scènes, sauvegarde, minuteur, score, déploiement) | Premier jeu jouable de bout en bout | Partie testée de bout en bout | `src/`, `index.html`, `.github/workflows/deploy.yml` |


| 02/11/2026 | Ilian | Claude (Anthropic) — Claude Code | Style graphique : d'abord néon, puis **notre choix** d'une ambiance « école la nuit » | Mobilier, couloir, menu tableau noir, dialogues façon cahier, personnages en pixel art, tous dessinés en code | Style néon refusé par l'équipe, remplacé par l'ambiance école | `src/art/`, `src/ui/`, `src/scenes/` |

| 02/11/2026 | Ilian | Claude (Anthropic) — Claude Code | Gardien, menu pause et énigmes enchaînées | Ronde du gardien, pause, dépendances entre salles | Tests en jeu | `src/state/`, `src/scenes/`, `src/rooms/` |
| 03/11/2026 | Ilian | Claude (Anthropic) — Claude Code | **Nos règles** : salles dans le noir avec le flash qui suit la souris, lampe du gardien plus grande, game over si on est attrapé, nouvel ordre des salles | Salles sombres, flash, fin « Attrapé », nouvel ordre | Tests en jeu | `src/scenes/`, `src/rooms/`, `src/state/patrol.js` |

| 03/11/2026 | Ilian | Claude (Anthropic) — Claude Code | Sons immersifs ; gardien animé comme le joueur dans les 4 directions | Sons générés en code (pas, portes, cœur, ambiance), animation du gardien | Son de porte jugé irréaliste (« moustique ») → refait à notre demande | `src/audio/sound.js`, `src/scenes/HubScene.js` |

| 03/11/2026 | Ilian | Claude (Anthropic) — Claude Code | **Nos énigmes** : algorithme de Callelongue (écrit par l'équipe), code 2358, 2 post-it jaunes à Sormiou, énigme du repas, lampe à tester à Mont Ventoux | Intégration des énigmes ; vérification par le code que le repas n'a qu'une solution | Énigme de Mont Ventoux jugée trop simple → refaite deux fois selon nos consignes ; règles du repas ajustées par l'équipe | `src/puzzles/`, `src/rooms/` |

| 03/11/2026 | Ilian | Claude (Anthropic) — Claude Code | Mode 2 joueurs en ligne avec rôles complémentaires | Connexion par code (PeerJS), rôles Technicien / Enquêteur, sortie à deux | Test à deux sur deux PC : blocage de la connexion signalé → message d'erreur clair ajouté | `src/net/multiplayer.js`, `src/scenes/` |

| 04/11/2026 | Ilian | Claude (Anthropic) — Claude Code | Gardien audible depuis les salles, décor plus rempli, choix du skin de l'élève | Bandeau et pas selon la distance, décor des salles, menu « Mon élève » | Tests en jeu | `src/scenes/RoomScene.js`, `src/art/decor.js`, `src/art/skins.js` |

| 04/11/2026 | Ilian | Claude (Anthropic) — Claude Code | Version mobile | Joystick, bouton d'action, plein écran, écran « tourne ton téléphone » | Bug trouvé par l'équipe : boutons inutilisables en plein écran → corrigé | `src/ui/touch.js`, `src/scenes/`, `index.html` |

| 04/11/2026 | Ilian | Claude (Anthropic) — Claude Code | **Notre liste de modifications** : indices relisibles, pavé de sortie A / B, post-it jaunes cliquables avec le mot de passe, PC sans courant, clés sans étiquette, équipements qui font perdre du temps, lumière au choix | Modifications de toutes les salles et du couloir | Chaque point relu et rejoué par l'équipe | `src/rooms/`, `src/scenes/`, `README.md` |


