# Suivi temps réel des chauffeurs — état de préparation

Date : 22 juillet 2026

## Verdict

**SUIVI TEMPS RÉEL NON VALIDÉ — BLOQUANTS RESTANTS**

La couche interne de suivi est implémentée et appliquée. La validation production reste impossible sans fournisseur cartographique/routage, application mobile native capable de fonctionner durablement en arrière-plan, campagne terrain multiappareil et worker opérationnel planifié.

## Architecture livrée

1. Le conducteur donne un consentement explicite borné à huit heures et à une mission/tournée active.
2. La machine d'état serveur vérifie l'affectation et chaque transition opérationnelle.
3. Collection App utilise `watchPosition`, une cadence adaptative et une file IndexedDB bornée à 100 positions.
4. Les positions sont synchronisées en lots idempotents de 50 maximum. Une coupure réseau ne génère aucune position fictive.
5. La base valide consentement, état actif, propriété de la mission, horodatage, précision, vitesse et identifiant d'événement.
6. La dernière position utilisable est séparée de l'historique. Elle expire après dix minutes ; l'historique expire après trente jours.
7. Les changements d'état, consultations, anomalies et franchissements de zone sont historisés séparément.
8. Admin App ne reçoit que les chauffeurs du périmètre pays commun à ses affectations. Le client reçoit uniquement le chauffeur de sa propre mission, avec coordonnées arrondies à trois décimales.
9. L'ETA exige une route fournisseur. Sans fournisseur, le moteur renvoie `ROUTING_PROVIDER_REQUIRED` et n'invente aucune heure d'arrivée.
10. Une entrée dans une géofence garde systématiquement `requires_proof=true`. QR, OTP, signature, photo ou preuve serveur restent nécessaires.

## Modèle de données

Migrations appliquées :

- `20260722055000_realtime_driver_tracking.sql`
- `20260722056000_tracking_alert_workflows.sql`
- `20260722057000_scope_tracking_history_access.sql`

Tables principales :

- `driver_operational_states` : état courant et affectation active.
- `driver_status_events` : transitions horodatées.
- `operational_live_positions` : snapshot live expirant.
- `operational_position_events` : historique opérationnel borné.
- `operational_geofences` et `operational_geofence_events`.
- `operational_tracking_alerts` : qualification, affectation et résolution.
- `operational_location_access_logs` : journal des consultations.

RPC importantes :

- `set_driver_operational_status`
- `record_operational_positions_batch`
- `get_client_mission_tracking`
- `manage_tracking_alert`
- `run_tracking_alert_sweep` — service uniquement
- `record_verified_geofence_event` — service uniquement
- `purge_expired_operational_tracking` — service uniquement

## États et confidentialité

Les états couverts sont : hors ligne, disponible, indisponible, mission proposée/acceptée, route vers collecte, arrivée collecte, colis récupéré, transit, arrivée relais/hub/destinataire, livraison, mission terminée, incident, pause et GPS indisponible.

Le suivi est supprimé du snapshot live et le consentement révoqué lors d'une pause, indisponibilité, fin de mission ou passage hors ligne. Les événements historiques restent soumis à la rétention de trente jours. Les preuves de collecte/livraison utilisent les tables de preuves existantes et ne sont jamais remplacées par un événement GPS.

Le client ne reçoit ni identité privée, ni autre mission, ni historique de trajet antérieur. La consultation client est journalisée et la position est approximative. Les responsables sont limités par rôle, affectation et pays commun avec le conducteur.

## Fréquence, batterie et mode hors ligne

Politique livrée :

| Situation | Intervalle cible |
|---|---:|
| Déplacement actif, réseau normal | 8 s |
| Déplacement, réseau dégradé | 20 s |
| Chauffeur immobile | 30 s |
| Arrière-plan ou batterie ≤ 15 % | 60 s |
| Hors ligne | 60 s, mise en file locale |

La file locale conserve au maximum 100 positions et écarte les éléments de plus de 24 heures. Les UUID clients empêchent les doublons lors de la reprise.

La consommation batterie ne peut pas être certifiée par le code. Une acquisition GPS haute précision continue consomme fortement selon appareil, OS, température et couverture. Budget de test initial : 4 à 12 % de batterie par heure en mouvement, à confirmer sur les appareils cibles. Le critère de validation recommandé est moins de 8 %/h au p50 et moins de 12 %/h au p95 pendant un trajet de deux heures.

## Volume estimé

À cadence maximale de 8 secondes : 450 positions/heure, soit 3 600 positions pour huit heures. Avec une journée mixte autour de 15 secondes : environ 1 920 positions/chauffeur/jour.

Ordres de grandeur à mesurer :

- réseau : environ 0,5 à 1,5 Mo/chauffeur/jour selon taille des lots et en-têtes ;
- stockage indexé : environ 1 à 3 Mo/chauffeur/jour ;
- 1 000 chauffeurs : environ 1,9 million d'événements/jour et 30 à 90 Go sur trente jours.

À partir de plusieurs centaines de chauffeurs actifs, il faut tester le partitionnement temporel, l'archivage, les index et les limites Realtime. Ces chiffres sont des estimations de capacité, pas des mesures de production.

## ETA, carte et coûts

Le fournisseur actif reste **aucun**. Les variables sont préparées sans valeur dans `.env.example`. Les coûts publics doivent être recalculés selon le pays et le contrat :

- [Google Maps Platform](https://developers.google.com/maps/billing-and-pricing/pricing) publie notamment des unités distinctes pour cartes, routes et matrices.
- [Mapbox](https://www.mapbox.com/pricing) facture séparément recherche, cartes et navigation selon l'usage.
- [HERE](https://www.here.com/get-started/pricing) nécessite une validation du plan et, pour l'échelle production, souvent une offre adaptée.
- Le [service Nominatim public](https://operations.osmfoundation.org/policies/nominatim/) impose une limite absolue d'une requête par seconde et ne convient pas à un suivi national intensif.

Le budget doit additionner chargements de carte, mises à jour d'itinéraire, matrices de dispatch et recherches d'adresse. Une route ne doit pas être recalculée à chaque position : recalcul lors d'un déplacement significatif, d'un changement de trafic ou après 30 à 60 secondes réduit fortement le coût.

## Alertes et géofencing

Implémenté : vitesse impossible, déplacement impossible, précision faible, changement rapide de session appareil, position expirée, gestion qualifiée/assignée/résolue, zones collecte/relais/hub/livraison/restreinte/sensible, entrée/sortie et preuve obligatoire.

À activer par worker planifié : balayage des positions anciennes, consommation des positions pour le géofencing, arrêt prolongé, déviation de route, retard, mission non démarrée et escalades. Le worker dispose déjà de RPC service-only ; aucun accès utilisateur ne peut les appeler.

## Validation exécutée

- TypeScript strict : réussi après implémentation.
- Tests ciblés temps réel, Collection et dispatch : 24/24 réussis.
- Supabase : 101 tables requises vérifiées après migration.
- RLS/ACL : aucune table ou politique attendue absente ; RPC worker réservées au service.

Les tests couvrent la cadence adaptative, batterie faible, réseau perdu, position imprécise, déplacement impossible, géofence avec preuve obligatoire, refus d'ETA sans fournisseur, file IndexedDB et synchronisation idempotente.

## Bloquants restants

1. Choisir et configurer le fournisseur carte/routage/traffic avec clés restreintes.
2. Rendre les cartes Admin, chauffeur et client avec des données réelles.
3. Déployer un worker planifié pour alertes, géofencing, escalades et purge.
4. Mettre en place Supabase Realtime ou un canal push autorisé avec tests de charge.
5. Utiliser une application mobile native pour un suivi fiable en arrière-plan, particulièrement sur iOS où une PWA suspendue ne garantit pas `watchPosition`.
6. Tester Android, iOS, appareils faibles, double session et fausse localisation sur parc réel.
7. Exécuter un trajet terrain complet : affectation, acceptation, collecte, relais/hub, livraison, preuve et réaffectation.
8. Mesurer batterie, données, latence p95/p99, précision GPS et coût API.
9. Valider juridiquement consentement, information, droits d'accès, conservation et transferts internationaux.
10. Ajouter l'interface complète de qualification/commentaire/résolution des alertes et les filtres cartographiques interactifs.

Tant que ces preuves ne sont pas obtenues, la plateforme possède une architecture temps réel activable, mais pas un suivi national certifié.

**SUIVI TEMPS RÉEL NON VALIDÉ — BLOQUANTS RESTANTS**
