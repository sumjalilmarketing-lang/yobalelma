# User App Completion Plan

## Audit initial

### Deja fonctionnelles
- Authentification Supabase legacy: inscription, connexion, deconnexion, reset password, callback.
- Creation d'expedition via `POST /api/shipments` et RPC `create_operational_shipment`.
- Detection national/international par pays d'origine et destination.
- Tracking public via `/suivi` et `/suivi/[trackingCode]`, migre aussi vers `/tracking`.
- Dashboards client, livreur et voyageur proteges par role primaire.
- Missions livreur, voyages, billets, QR et sections operationnelles connectes aux tables Supabase existantes.

### Partielles
- Multirole: les roles existent en base, mais les guards utilisent encore le role primaire du profil.
- Depot relais: le choix `relay_dropoff` est stocke, mais la selection cartographique/relais avancee reste a completer.
- Enlevement: `pickup_request` est cree par RPC, mais l'UX de planification reste minimale.
- Dispatch: fondation et RPC existantes, mais scoring geographique sandbox a renforcer.
- Notifications et support: tables/API presentes, UX encore generique.

### Uniquement visuelles
- Pages marketing detaillees `/how-it-works`, `/security`, `/pricing`, `/relay-points`, `/terms`, `/privacy`.
- Certaines sections secondaires livreur/voyageur utilisent `OperationalWorkspace`.

### Encore heritees du host legacy
- Plusieurs pages physiques de user-app re-exportent les composants legacy valides.
- Les anciens liens `/dashboard/client`, `/dashboard/transporter`, `/dashboard/traveler` sont rediriges par le middleware user-app.

### A migrer ensuite en code natif user-app
- Pages detail expedition, detail mission et detail voyage.
- Formulaires KYC, vehicle, zones, availability et tickets.
- Selecteur multirole complet base sur `user_roles`.

### A developper
- Carnet d'adresses dedie.
- Selection relais par ville avec `relay_points`.
- Paiement provider externe.
- Extraction billet non-sandbox.
- Notifications externes email/SMS/WhatsApp.

### Cassees
- Aucun bug critique connu apres cette migration, sous reserve des validations.

### Non testees
- Inscription email reelle et confirmation email dependent de la configuration Supabase Auth distante.
- Paiement reel et providers externes.

## Execution

1. Rendre `apps/user-app` buildable independamment.
2. Migrer physiquement les routes user dans `apps/user-app/app`.
3. Ajouter les tests unitaires et E2E dedies user-app.
4. Executer lint, typecheck, tests, build et E2E user-app.
5. Corriger les erreurs et committer.
