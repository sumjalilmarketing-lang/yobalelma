# AI Governance and Security

RLS applique le périmètre pays à toutes les tables `operational_ai_*`. Les écritures de calcul, modèle et règle sont réservées au service; les décisions humaines utilisent un RPC `security definer` avec recherche figée, rôle, pays, transition et justification. Le RPC ne reçoit jamais les rôles ni le pays de décision depuis le client : il les lit depuis la recommandation verrouillée.

Les données GPS et personnelles ne sont pas copiées dans les explications : seules les références minimales sont conservées. Les simulations sont en lecture seule. Les prompts sont bornés, normalisés et filtrés contre les demandes de contournement; l’assistant ne reçoit que des faits déjà autorisés.

Les secrets restent dans l’environnement. Aucun jeu d’entraînement sensible, prompt système ou secret ne doit être exposé. Le rate limiting et la protection réseau restent ceux de la couche API/plateforme et doivent être validés en préproduction.
