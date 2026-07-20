# Admin App — moteur de workflows

## Contrat

Chaque définition de workflow est versionnée et contient :

- des étapes ordonnées ;
- les rôles responsables ;
- les preuves attendues ;
- les validations obligatoires ;
- un SLA par étape ;
- les conditions d’entrée et de sortie ;
- les règles d’escalade et de notification ;
- les transitions autorisées.

Une mission créée génère automatiquement ses tâches à partir de la version active du workflow. Le premier travail devient disponible et les suivants restent en attente.

## Machine d’état

`Brouillon → Assignée → En cours → À valider → Validée → Clôturée`

La validation peut demander une correction, qui renvoie la mission vers l’exécution. Une mission ne peut pas être soumise sans preuve et ne peut pas être clôturée sans validation.

La contrainte est appliquée dans l’API et dans la base afin qu’aucun autre client ne puisse contourner le workflow.

## Interconnexion des services

Les règles d’automatisation créent une mission dépendante lorsque certaines décisions sont prises. Les règles initiales couvrent notamment :

- validation partenaire → contrôle conformité ;
- validation opérationnelle → préparation du règlement ;
- validation conformité → libération opérationnelle ;
- validation financière → information du service client.

Les règles sont configurables et les missions générées conservent l’événement source.

## SLA et escalades

`governance_escalate_overdue_missions()` identifie les missions à risque ou en dépassement, met à jour leur état SLA et crée une escalade vers le manager du service. Son exécution est réservée au rôle de service et peut être planifiée par l’exploitation.

## Audit

Chaque création, affectation, réaffectation, démarrage, soumission, correction, validation, clôture et annulation produit un événement avec l’acteur, l’heure, la transition et la note de décision.
