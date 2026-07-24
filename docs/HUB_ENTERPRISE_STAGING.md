# Staging Hub Enterprise

Branche : `codex/hub-enterprise-upgrade`.

L’URL Quick Tunnel historique est `https://june-gardening-guru-recently.trycloudflare.com`. Elle dépend d’un poste local et ne constitue pas le staging durable demandé. La cible reste `hub.yobalelma.com` ou un déploiement durable équivalent.

Déploiement durable requis : connecter la branche au fournisseur, définir les variables Supabase/Hub, exécuter le build, attacher le domaine, puis rejouer santé, auth réelle, RLS et E2E staging. Aucun identifiant fournisseur durable n’est disponible dans ce workspace.
