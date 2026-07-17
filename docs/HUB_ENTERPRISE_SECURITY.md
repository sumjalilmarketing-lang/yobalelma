# Sécurité Hub Enterprise

RBAC côté application et RLS côté PostgreSQL s’appliquent ensemble. Les accès sont calculés par affectation de hub. L’audit critique est append-only ; les exports sont privés et auditables ; les fonctions publiques sont révoquées puis accordées à `authenticated`.

Les actions sensibles exigent un rôle gestionnaire et la seconde validation configurée dans `hub_settings`. Les secrets restent dans l’environnement et ne sont jamais committés. La base Supabase autorisée est uniquement `rgcgtcycbiuhcaoaadbh`.
