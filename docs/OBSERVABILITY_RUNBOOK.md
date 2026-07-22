# Observabilité de production

## Contrôles actifs

Le workflow `Production health and SLO guard` interroge toutes les cinq minutes les cinq endpoints `/api/health`. Il exige un HTTP 200, le corps minimal `{ "status": "ok" }` et une réponse en moins de trois secondes. Chaque exécution conserve un artefact JSON pendant 30 jours.

Un échec ouvre ou met à jour l’incident GitHub portant le label `production-incident`. L’identifiant d’exécution relie l’alerte à la preuve. Le mode manuel `simulate_failure` permet de tester la chaîne sans provoquer de panne.

## Réponse à incident

1. Accuser réception de l’incident et nommer un responsable.
2. Identifier l’application et l’heure dans l’artefact, sans copier de donnée personnelle.
3. Contrôler le dernier déploiement Vercel et la santé Supabase.
4. Revenir à la dernière version saine si une régression est confirmée.
5. Vérifier trois passages successifs du moniteur avant clôture.
6. Documenter cause, impact, durée, correction et prévention dans un post-mortem.

## Limites résiduelles

Ce moniteur couvre disponibilité externe et latence synthétique. Une plateforme APM avec traces distribuées, métriques runtime, routage vers une astreinte humaine et preuve de réception reste nécessaire avant lancement. Elle ne peut pas être déclarée active tant qu’un fournisseur et ses destinataires n’ont pas été configurés et testés.
