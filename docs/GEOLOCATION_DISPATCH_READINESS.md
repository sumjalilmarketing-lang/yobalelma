# Préparation géolocalisation et dispatch

Date de validation : 22 juillet 2026

## Verdict

**GÉOLOCALISATION ET DISPATCH NON VALIDÉS — BLOQUANTS RESTANTS**

La fondation interne est sécurisée, testée et appliquée au projet Supabase Yobalelma. La fonction ne peut toutefois pas être déclarée prête : aucun fournisseur cartographique contractuel n'est configuré, aucune carte interactive réelle n'est rendue et les résultats demandés pour les villes de référence ne peuvent donc pas être vérifiés sans données statiques.

## Audit et corrections réalisées

| Surface | Constat initial | Correction | Statut |
|---|---|---|---|
| Création d'expédition | Collecte et livraison limitées à des champs texte | `SmartAddressField`, autocomplétion serveur, position actuelle, adresse structurée et persistance des coordonnées | Prêt côté code, fournisseur requis |
| Base de données | `shipment_addresses`, relais et hubs ne portaient pas tout le modèle structuré | Colonnes adresse, GPS, identifiant fournisseur, précision et validation ajoutées | Appliqué |
| Collection App | Position GPS envoyée sans consentement opérationnel borné | Consentement explicite par mission, durée maximale 8 h, écriture par RPC, rétention 30 jours | Appliqué et testé |
| Admin App | Pas d'espace dispatch fiable ; les vues génériques pouvaient suggérer une carte sans données | Espace `OPÉRATIONS > DISPATCH` alimenté par positions, missions, recommandations et règles réelles ; aucun faux fond cartographique | Prêt côté données, carte requise |
| Moteur de dispatch | Classement partiel et distance géographique | Filtrage disponibilité/zone/capacité/compétences/conformité/fraîcheur GPS, route fournisseur facultative, score et justification | Appliqué et testé |
| Gouvernance | Validation globale des règles/recommandations | Double contrôle, interdiction d'auto-approbation, périmètre pays issu des affectations, recommandation active unique | Appliqué |
| Sécurité navigateur | Géolocalisation interdite par la politique navigateur | Autorisée uniquement à l'origine Yobalelma (`self`) | Appliqué et testé |

Les champs encore simples ou incomplets sont : profil et inscription (ville/adresse), publication de trajet (origine/destination), zones transporteur, création/édition de relais, certains écrans Hub et les données historiques. Leur migration vers le composant commun reste nécessaire avant une validation globale des cinq applications.

## Architecture livrée

- `MapProvider` couvre autocomplete, geocoding, reverse geocoding, place details, route, matrice et recherche de proximité.
- Le navigateur appelle uniquement les routes Yobalelma authentifiées `/api/locations/autocomplete` et `/api/locations/reverse`.
- `MAP_PROVIDER_SERVER_TOKEN` reste exclusivement côté serveur. Le fournisseur et son mapping passent par une passerelle normalisée ; aucun endpoint fournisseur n'est supposé.
- En l'absence d'accès, le fournisseur échoue avec `MAP_PROVIDER_ACCESS_REQUIRED`. Aucun lieu, trajet ou identifiant de transaction fictif n'est produit.
- L'autocomplétion applique 300 ms de debounce, annule la requête précédente et retourne au plus six résultats.
- Le classement favorise pays, ville, proximité, zone desservie et historique récent. Le pays reste visible dans chaque suggestion.
- Les adresses informelles acceptent quartier, repère et GPS sans exiger rue ni code postal.
- Le dispatch utilise la route routière quand elle existe. Le fallback Haversine est marqué provisoire et impose une validation humaine.

## Données et migrations

Migrations appliquées :

- `20260722053000_geolocation_dispatch_foundation.sql`
- `20260722054000_harden_dispatch_country_scope.sql`

Tables ajoutées :

- `operational_location_consents`
- `operational_position_events`
- `dispatch_rule_sets`
- `dispatch_recommendations`
- `dispatch_recommendation_events`

Fonctions sensibles :

- `set_operational_location_consent`
- `record_operational_position`
- `approve_dispatch_rule_set`
- `replace_dispatch_recommendations` (service uniquement)
- `approve_dispatch_recommendation`
- `purge_expired_operational_positions` (service uniquement)

La conservation des positions est limitée à 30 jours. Une tâche d'exploitation doit appeler quotidiennement la purge. Les positions ne disposent d'aucune politique de lecture publique.

## Variables externes requises

Les variables sont documentées sans valeur dans `.env.example` :

```text
MAP_PROVIDER
MAP_PROVIDER_GATEWAY_URL
MAP_PROVIDER_SERVER_TOKEN
NEXT_PUBLIC_MAP_PROVIDER
NEXT_PUBLIC_MAP_BROWSER_KEY
```

Activation encore requise : choix contractuel du fournisseur, création des clés serveur et navigateur, restriction des domaines/IP et des API, quota/budget, passerelle de mapping fournisseur, accès routing/traffic, puis campagne de qualité Sénégal.

## Fournisseurs, quotas et coûts indicatifs

Le fournisseur actuellement utilisé est **aucun**. Cette décision évite de présenter un service statique comme opérationnel.

Tarifs publics consultés le 22 juillet 2026, hors remises et taxes :

- [Google Maps Platform](https://developers.google.com/maps/billing-and-pricing/pricing) : plafonds gratuits mensuels généralement de 10 000 événements pour Dynamic Maps, Autocomplete, Geocoding et Routes Essentials ; tranche initiale ensuite annoncée à 7 USD/1 000 cartes dynamiques, 2,83 USD/1 000 requêtes d'autocomplete, 5 USD/1 000 géocodages et 5 USD/1 000 routes ou matrices Essentials.
- [Mapbox](https://www.mapbox.com/pricing) : Search Box Standard annonce 2 500 sessions mensuelles gratuites, puis 11,50 USD/1 000 sessions jusqu'à 100 000. Cartes et navigation sont facturées séparément selon les unités utilisées.
- [HERE](https://www.here.com/get-started/pricing) : plan de démarrage gratuit annoncé, mais le chiffrage production détaillé doit être confirmé par offre/contrat.
- [Nominatim public](https://operations.osmfoundation.org/policies/nominatim/) : maximum absolu de 1 requête/seconde et interdiction des usages lourds ; ce service public n'est pas un backend national de production. Il faut l'auto-héberger ou choisir une offre commerciale.

Formule de budget recommandée : `cartes × prix carte + sessions autocomplete × prix session + géocodages × prix géocodage + routes/matrices × prix route`, avec alertes à 50 %, 75 % et 90 % du budget. Un benchmark Keur Massar/Mbao/Dakar/Rufisque doit précéder le choix final ; aucune qualité Sénégal n'est affirmée sans ce test réel.

## Tests et preuves

Résultats obtenus :

- TypeScript strict : réussi.
- Géolocalisation/dispatch/sécurité/Collection ciblés : 27 tests réussis.
- Validation distante Supabase : 94 tables contrôlées, aucune table requise absente.
- Audit RLS/ACL : fonctions sensibles réservées au service, aucune politique requise absente.
- Test visuel local : la route d'expédition redirige correctement vers l'authentification lorsqu'aucune session n'est présente. Aucun compte pilote ni secret n'a été utilisé ou extrait.

Scénarios unitaires couverts : adresse informelle sans rue/code postal, classement local, refus fournisseur non configuré, route fournisseur, fallback contrôlé, agent hors ligne/imprécis/hors zone/saturé, absence d'agent et stabilité Haversine.

Scénarios non prouvés et donc bloquants : résultats réels Keur Massar, Kermassar, Mbao, Dakar, Rufisque, Pikine, Guédiawaye, Thiès, Ziguinchor, Paris, Bruxelles, Abidjan et Casablanca ; fautes/accentuation sur API réelle ; carte et marqueur déplaçable ; relais/hubs proches ; trafic ; suivi et réaffectation E2E ; mobile/tablette/desktop authentifiés ; captures des cartes réelles.

## Risques et conditions de validation

1. Sélectionner le fournisseur après benchmark Sénégal et validation juridique/coût.
2. Configurer clés restreintes, quotas et passerelle, sans committer de secret.
3. Ajouter le rendu cartographique commun et le marqueur déplaçable avec chargement différé.
4. Migrer tous les champs encore simples des cinq applications.
5. Rendre la sauvegarde des adresses et de l'expédition atomique dans une RPC transactionnelle unique.
6. Ajouter cache serveur, cache local des recherches non sensibles et mesure p95 fournisseur.
7. Ajouter file GPS hors ligne, fréquence adaptative et purge quotidienne supervisée.
8. Exécuter les scénarios authentifiés et produire les captures exigées sur desktop, tablette et mobile.

Le passage au verdict validé exige la clôture des huit points avec preuves réelles. Jusqu'alors, le système est une fondation prête à intégrer un fournisseur, pas une géolocalisation production.
