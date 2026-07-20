# Yobalelma Admin App

Centre de commandement opérationnel autonome de Yobalelma.

- domaine cible : `admin.yobalelma.com` ;
- espace applicatif : `/command` ;
- authentification réelle et accès limités au périmètre organisationnel ;
- référentiel directions, services, métiers, rôles et affectations ;
- workflows configurables, missions, tâches, preuves, SLA, escalades et audit ;
- projet Vercel strictement séparé des autres applications Yobalelma.

Les rôles sont rattachés à un service unique dans `src/lib/governance-catalog.ts`. Les droits effectifs combinent le rôle, le service et le périmètre d’affectation.
