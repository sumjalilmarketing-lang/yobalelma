# Machine à états colis

États : `created`, `at_origin_relay`, `with_collection_driver`, `at_origin_hub`, `with_traveler`, `at_destination_hub`, `with_last_mile_driver`, `at_destination_relay`, `delivered`, `returning`, `returned`, `closed`.

Les transitions sont définies deux fois volontairement : logique TypeScript testable pour les interfaces et contrôle PostgreSQL autoritaire dans `is_valid_parcel_stage_transition`. Un événement informatif peut conserver la même étape. Les raccourcis `created → delivered`, la seconde livraison, le détenteur précédent incohérent, l’absence de nouveau détenteur, la livraison sous un autre type d’événement et les preuves insuffisantes sont rejetés.

Les tests unitaires couvrent les transferts nominaux, transition impossible, mismatch de détenteur, preuve absente et double livraison. Les contraintes de base bornent aussi les types d’événement et les étapes, même si un client contourne l’API.
