# Hub security validation

## Contrôles réels Supabase

Le script `apps/hub-app/scripts/validate-staging-security.mjs` utilise deux sessions Hub et une session `client`, avec fixtures temporaires supprimées après test.

- deux scans simultanés : une ligne, un compteur, résultat idempotent ;
- double confirmation : idempotente ;
- double réservation : une réservation ;
- même colis dans deux lots : refusé ;
- capacité insuffisante : refusée ;
- QR scanné deux fois : second scan refusé ;
- identité/document/billet absents : remise refusée ;
- écart sans justification : refusé ;
- écriture et RPC du rôle `client` : refusées par RLS ;
- documents voyageur : non exposés au rôle `client` ;
- audit : événements présents.

Les migrations de staging ajoutent les transactions de scan/confirmation et alignent les accès `hub_agent`, `hub_supervisor`, `hub_manager` sur les colis, le verrouillage voyage et les QR. Les tokens QR restent opaques, signés en cookie HTTP-only à courte durée et à usage unique. Les logs structurés masquent JWT, bearer tokens, clés Supabase et emails.
