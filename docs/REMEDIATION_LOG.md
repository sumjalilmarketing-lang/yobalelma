# Journal de remédiation — 22 juillet 2026

| Priorité | Problème | Correction | Preuve |
|---|---|---|---|
| P1 | `sharp <0.35.0` vulnérable via libvips | override `sharp ^0.35.0`, lockfile et installation propre | audit npm : 1 high → 0 |
| P1 | connexion monolithe envoyait le client vers `/client` et refusait les rôles terrain | destination par surface, support de tous les rôles monolithe | E2E client + relais, puis 9 rôles |
| P2 | sélecteurs E2E obsolètes | noms accessibles accentués et champs SmartAddress | 28 protections + 3 parcours métier |
| P2 | carte et replay trop superficiels | fraîcheur, plein écran, multi-sélection, fiches, timeline pilotable | 13 tests Control Tower, build Admin |
| P2 | centres décision/crise/communication/Direction incomplets | vues reliées aux données autorisées, états externes explicites | build et tests |

La boucle lint → typecheck → tests → builds a été répétée après les corrections. Les blocages externes sont séparés des défauts internes.
