# Hub staging deployment

Date de validation : 17 juillet 2026.

## Environnement actif

- Application : `apps/hub-app` uniquement.
- Branche : `codex/deploy-hub-app-staging`.
- Fournisseur : Cloudflare Quick Tunnel 2026.7.1 vers un processus Next.js 15 SSR local persistant.
- URL : `https://june-gardening-guru-recently.trycloudflare.com`.
- Origine : Next.js production sur `127.0.0.1:43123`, non exposée directement.
- Santé : `GET /api/health` renvoie HTTP 200 et `supabase: ok`.

Le build indépendant contient 20 routes dynamiques, le middleware Hub et les en-têtes de sécurité. Les variables Supabase, la service role, l’URL applicative et le secret de session sont injectés dans le processus ; aucune valeur n’est commitée ou journalisée.

## Supabase Auth

Le projet exclusif Yobalelma `rgcgtcycbiuhcaoaadbh` a pour Site URL l’origine staging. Les URL autorisées couvrent l’origine, la connexion, le callback et la réinitialisation. La connexion mot de passe, la persistance, la déconnexion et le refus d’un rôle `client` ont été testés sur l’URL HTTPS. Le mode d’authentification démo est désactivé en production.

## Hébergement cible durable

Le domaine futur `hub.yobalelma.com` doit pointer vers Vercel, un VPS LWS ou un hébergeur Node.js prenant en charge : Node.js 22+, SSR Next.js, processus persistant avec redémarrage automatique, variables chiffrées, HTTPS, reverse proxy, logs et health checks. Un mutualisé PHP/statique ne convient pas.

Le Quick Tunnel est adapté à la démonstration et au test interne, mais n’offre ni SLA, ni URL réservée, ni redémarrage automatique de la machine hôte. Il ne constitue pas le staging durable attendu avant pilote.
