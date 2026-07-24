# Accès pilotes Yobalelma

Ce document décrit les comptes de recette. Il ne contient aucun mot de passe, secret, jeton ou clé d'infrastructure.

## Remise sécurisée

Les mots de passe temporaires uniques sont générés dans `.pilot-access/credentials.json`. Ce répertoire est ignoré par Git et son accès local est limité au propriétaire de la machine et au processus Codex. Le fichier ne doit jamais être envoyé par e-mail, copié dans un ticket, committé ou ajouté à un déploiement.

Après remise au propriétaire Yobalelma :

1. ouvrir le fichier localement sur la machine autorisée ;
2. se connecter avec l'adresse et le mot de passe temporaire correspondant ;
3. remplacer immédiatement le mot de passe ;
4. enregistrer les comptes sensibles dans l'application d'authentification à partir des informations MFA du coffre local ;
5. supprimer le coffre local lorsque la recette est terminée.

La métadonnée `password_change_required` est activée sur tous les comptes. Supabase Auth ne force pas nativement ce changement pour un compte créé par l'administration : l'obligation doit donc être respectée lors de la remise, jusqu'à ce que l'interface applicative de changement obligatoire soit déployée.

## Applications et comptes

| Application | URL de connexion | Rôle pilote | Adresse e-mail |
|---|---|---|---|
| User App | https://yobalelma-user.vercel.app/auth/login | client | pilot.client@yobalelma.test |
| User App | https://yobalelma-user.vercel.app/auth/login | traveler | pilot.traveler@yobalelma.test |
| User App | https://yobalelma-user.vercel.app/auth/login | local_transporter | pilot.transporter@yobalelma.test |
| User App | https://yobalelma-user.vercel.app/auth/login | client + traveler + local_transporter | pilot.multirole@yobalelma.test |
| Hub App | https://yobalelma-hub.vercel.app/auth/sign-in | hub_agent | pilot.hub-agent@yobalelma.test |
| Hub App | https://yobalelma-hub.vercel.app/auth/sign-in | hub_supervisor | pilot.hub-supervisor@yobalelma.test |
| Hub App | https://yobalelma-hub.vercel.app/auth/sign-in | hub_manager | pilot.hub-manager@yobalelma.test |
| Relay App | https://yobalelma-relay.vercel.app/auth/sign-in | relay_agent | pilot.relay-agent@yobalelma.test |
| Relay App | https://yobalelma-relay.vercel.app/auth/sign-in | supervision Relay (`operations_manager`) | pilot.relay-supervisor@yobalelma.test |
| Relay App | https://yobalelma-relay.vercel.app/auth/sign-in | relay_manager | pilot.relay-manager@yobalelma.test |
| Collection App | https://yobalelma-collection.vercel.app/auth/sign-in | collection_driver | pilot.collection-driver@yobalelma.test |
| Collection App | https://yobalelma-collection.vercel.app/auth/sign-in | collection_supervisor | pilot.collection-supervisor@yobalelma.test |
| Collection App | https://yobalelma-collection.vercel.app/auth/sign-in | collection_manager | pilot.collection-manager@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | super_admin | pilot.command@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | admin | pilot.admin@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | operations_manager | pilot.operations@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | hub_manager | pilot.admin-hub@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | relay_manager | pilot.admin-relay@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | collection_manager | pilot.admin-collection@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | local_delivery_manager | pilot.local-delivery@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | traveler_manager | pilot.travelers@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | customs_manager | pilot.customs@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | compliance_manager | pilot.compliance@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | finance_manager | pilot.finance@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | customer_support_manager | pilot.support@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | security_manager | pilot.security@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | auditor | pilot.auditor@yobalelma.test |
| Admin App | https://yobalelma-admin.vercel.app/auth/sign-in | country_manager | pilot.country-sn@yobalelma.test |

## Contrôles de sécurité

- chaque compte possède un mot de passe temporaire distinct et fort ;
- tous les e-mails pilotes sont confirmés pour permettre la recette ;
- les comptes `super_admin`, `admin`, `country_manager`, `security_manager` et `auditor` possèdent un facteur TOTP vérifié ;
- les écritures de rôles sont limitées au `super_admin` ;
- un déclencheur de base bloque la modification des colonnes de rôle d'un profil par un utilisateur non autorisé ;
- des comptes négatifs non remis au testeur contrôlent le refus d'accès aux applications Hub, Relay et Collection ;
- le rapport sans secret est enregistré localement dans `.pilot-access/verification.json`.

## Mot de passe oublié

Les adresses `@yobalelma.test` sont réservées à la recette et ne disposent pas de boîte e-mail publique. Le flux peut être vérifié jusqu'à la demande d'envoi, mais la réception d'un lien ne peut pas être validée avec ces adresses. En cas de perte d'accès, un administrateur autorisé doit générer un nouveau mot de passe temporaire unique via Supabase Auth, conserver `password_change_required`, puis le remettre par le même canal local sécurisé.
