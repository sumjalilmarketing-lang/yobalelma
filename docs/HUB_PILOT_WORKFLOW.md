# Hub pilot workflow

## Comptes

- `pilot.hub-agent@yobalelma.test` — `hub_agent`
- `pilot.hub-supervisor@yobalelma.test` — `hub_supervisor`
- `pilot.hub-manager@yobalelma.test` — `hub_manager`
- `pilot.operations-manager@yobalelma.test` — `operations_manager`

Le mot de passe est généré aléatoirement lors du seed, n’est ni affiché ni stocké. Le compte négatif `pilot.hub-denied@yobalelma.test` porte le rôle `client` et sert uniquement au contrôle d’accès.

## Scénario exécuté

Le seed crée `MAN-PILOT001`, la réception `HIR-PILOT001`, deux colis Dakar–Paris, trois emplacements Hub et un voyage validé de 25 kg. Le test HTTPS scanne les deux colis, justifie l’écart, confirme la réception, inspecte le colis de 4,2 kg, le range, consulte le voyage, crée un lot, réserve la capacité, génère le QR, vérifie identité/document/billet et remet le lot. Le QR devient inutilisable, le tracking et les audits sont mis à jour.

Commande opérateur : définir temporairement `HUB_PILOT_PASSWORD` (16 caractères minimum), exécuter `npm --workspace @yobalelma/hub-app run seed:pilot`, puis détruire la variable. Ne jamais transmettre ce mot de passe par Git ou par les logs.
