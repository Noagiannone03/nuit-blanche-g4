# LICENCES

## Code

| Ressource | Auteur | Licence | Usage |
|---|---|---|---|
| [Phaser 3](https://phaser.io) | Phaser Studio Inc. | MIT | Moteur de jeu |
| [Vite](https://vitejs.dev) | Evan You & contributeurs | MIT | Outil de build |
| [PeerJS](https://peerjs.com) | Michelle Bu, Eric Zhang & contributeurs | MIT | Mode 2 joueurs en ligne (WebRTC + serveur public de mise en relation 0.peerjs.com) |

## Polices

| Police | Auteur | Licence | Source |
|---|---|---|---|
| Permanent Marker | Font Diner | Apache License 2.0 | https://fonts.google.com/specimen/Permanent+Marker |
| Nunito | Vernon Adams, Cyreal, Jacques Le Bailly | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Nunito |
| Caveat | Impallari Type | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Caveat |

## Graphismes

Tous les graphismes actuels sont **dessinés en code**, aucune image externe :
- personnages en pixel art (élève, coéquipier, gardien) : `src/art/characters.js`
- mobilier des salles (tableaux, bureaux, casiers, frigo…) : `src/art/furniture.js`, décor (fenêtres, étagères, affiches, chaises…) : `src/art/decor.js`
- skins de l'élève (couleurs et coiffures au choix) : `src/art/skins.js`
- couloir vu de dessus, ambiance de nuit, lumières : `src/scenes/HubScene.js`, `src/ui/theme.js`, `src/scenes/BootScene.js`
- intérieur des salles : `src/scenes/RoomScene.js`, `src/rooms/*.js`

Le plan du couloir est inspiré du plan d'évacuation affiché sur le campus G4 de Marseille.

## Sons

Tous les sons sont **générés par le code** avec la Web Audio API du navigateur, aucun fichier audio externe : `src/audio/sound.js` (bruitages : pas, portes, interrupteurs, digicode, battements de cœur… ; ambiances : couloir, salle dans le noir, néons).

> ⚠️ Toute ressource ajoutée (image, son, police) doit être listée ici : nom, auteur, licence, lien source.
