# User App Workflows

## Client

1. Inscription via `/auth/register`.
2. Creation du profil par l'API Auth et Supabase.
3. Creation expedition via `/client/shipments/new`.
4. Detection automatique du type de trajet.
5. Creation shipment, package, addresses, events et tracking par RPC.
6. Choix pickup ou relay dropoff.
7. Consultation dans `/client/shipments` et `/client/shipments/[id]`.

## Livreur local

1. Inscription avec role `local_transporter`.
2. KYC, vehicule, zones et disponibilite.
3. Missions disponibles via dispatch.
4. Acceptation/action mission via API `transporters/missions/[id]`.
5. Arrivee, retrait, livraison, OTP/preuve.

## Voyageur

1. Inscription avec role `traveler`.
2. KYC et creation voyage.
3. Ajout billet et extraction sandbox.
4. Declaration capacite.
5. Consultation assignations, QR et paiements.

## Tracking

- Public: `/tracking` masque les informations sensibles.
- Prive: `/client/tracking` utilise les permissions client.
