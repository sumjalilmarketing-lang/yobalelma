# Business Implementation Plan

## Audit de l'existant

Etat inspecte le 2026-07-10 sur la branche `codex/yobalelma-platform`.

### Deja en place

- Application Next.js App Router avec TypeScript strict.
- Design Yobalelma noir, orange et blanc.
- Landing page preservee avec le slogan "Chaque voyage devient une livraison".
- Supabase configure avec clients serveur et navigateur.
- Validation Zod et formulaires React Hook Form.
- Authentification magic-link MVP.
- Routes publiques existantes : `/`, `/envoyer`, `/livreur`, `/voyager`, `/auth/sign-in`.
- Dashboard MVP : `/dashboard`.
- Routes API MVP : auth magic-link, profil, demande colis, trajet.
- Migration initiale : `profiles`, `parcel_requests`, `trips`, `offers`, `tracking_events`.
- RLS initiale activee sur les tables MVP.
- Tests Vitest existants pour environnement, schemas et redirections auth.
- CI GitHub Actions : lint, typecheck, tests, build.

### Limites identifiees

- Les roles sont encore simplifies.
- L'authentification ne couvre pas encore inscription email/mot de passe, mot de passe oublie et reset.
- Le KYC n'est pas encore modelise en base ni expose cote UI.
- Les dashboards par role ne sont pas encore separes.
- Les expeditions metier completes ne remplacent pas encore le modele MVP `parcel_requests`.
- Les documents et photos ne sont pas encore lies a un bucket Supabase prive.
- Les migrations existent localement mais ne peuvent pas etre appliquees au projet Supabase distant sans variables secretes et acces CLI/configuration.

## Ordre de livraison

### Phase metier 1 - Auth, roles, KYC

- Roles plateforme complets.
- Inscription publique pour `client`, `local_transporter`, `traveler`.
- Connexion email/mot de passe.
- Mot de passe oublie et reset.
- Redirection par role.
- Profil utilisateur enrichi.
- KYC avec documents, statut, decisions et historique.
- Bucket Supabase prive pour documents KYC.
- RLS adaptee.

### Phase metier 2 - Expedition

- Creation d'expedition complete.
- Adresses depart/destination.
- Colis et dimensions.
- Detection serveur national/international.
- Tracking code `YBL-XXXXXXXX`.
- Digital parcel twin.
- Estimation prix et delai.
- Confirmation avant validation.

### Phase metier 3 - Transporteurs locaux

- Profil transporteur.
- Vehicules, zones, disponibilites.
- Missions compatibles.
- Matching deterministe.
- Enlevements et livraison nationale.

### Phase metier 4 - Relais et collecte

- Reseaux de relais configurables.
- Points relais, inventaire et scans.
- Tournees collecte vers hub.

### Phase metier 5 - Voyageur et hub

- Billets avion avec extraction sandbox.
- Validation voyage.
- Capacite disponible.
- Notifications hub.
- Batches, reservation capacite et QR.

### Phase metier 6 - Paiements, support, back-office

- Provider paiement sandbox.
- Payouts.
- Litiges et support.
- Admin complet.
- Analytics et audit.

## Blocages externes connus

- Application reelle des migrations Supabase : necessite les secrets et l'acces au projet Supabase.
- Stockage effectif des fichiers KYC : necessite les variables Supabase et le bucket applique.
- Email de confirmation et reset : depend de la configuration Auth Supabase du projet distant.

