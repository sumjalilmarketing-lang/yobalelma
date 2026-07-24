# Admin App — gouvernance des métiers

Date : 20 juillet 2026.

Admin App est le centre de commandement opérationnel de Yobalelma. Son périmètre est autonome dans `apps/admin-app` et son espace principal est `/command`.

## Référentiel organisationnel

Le référentiel comprend huit directions, vingt-six services et trente-sept rôles. Chaque rôle possède obligatoirement :

- une direction ;
- un service unique ;
- un niveau de responsabilité ;
- un périmètre d’affectation effectif.

Une affectation peut préciser le pays, la région, l’organisation, le Hub, le point relais, l’équipe et la zone opérationnelle. La base refuse une affectation lorsque le rôle, la direction et le service ne correspondent pas au référentiel.

## Visibilité

- Super Admin et Administrateur plateforme : toutes les directions.
- Manager : son service, avec pouvoir de création, affectation, réaffectation, correction, validation et clôture.
- Superviseur : contrôle de l’exécution dans son périmètre.
- Agent ou spécialiste : missions qui lui sont attribuées et actions prévues par le workflow.
- Auditeur : lecture indépendante dans son périmètre, sans pouvoir d’altération opérationnelle.

La visibilité applicative et les politiques de sécurité utilisent le même rattachement service/périmètre.

## Directions

- Direction générale.
- Direction des opérations.
- Direction voyageurs.
- Direction douane & conformité.
- Direction finance.
- Direction service client.
- Direction sécurité.
- Direction partenaires.

Chaque direction possède son espace, ses services, ses responsabilités et sa file de missions.

## Données

La migration `20260720193000_admin_command_governance.sql` crée le référentiel, les affectations, workflows, missions, tâches, preuves, événements, dépendances, escalades, notifications et règles d’automatisation. Le correctif `20260720194500_admin_governance_runtime_fix.sql` sécurise l’exécution interne des déclencheurs sous RLS.
