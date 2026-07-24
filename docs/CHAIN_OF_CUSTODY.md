# Chaîne de possession

La possession ne se déduit plus d’un statut texte. Une seule ligne `parcel_custody_state` existe par colis et chaque changement exige un événement confirmé.

Séquence nominale : expéditeur → relais origine → chauffeur collecte → hub origine → voyageur → hub destination → dernier kilomètre/relais destination → destinataire.

Garanties : verrou de ligne, contrôle du détenteur précédent, nouveau détenteur obligatoire, mission requise par la logique métier, règles de preuve configurables, idempotence, double livraison interdite et historique append-only. Une correction référence l’événement original et conserve une raison d’au moins huit caractères. Une annulation est un nouvel événement ; elle n’efface rien.

Les identifiants de détenteur sont textuels pour couvrir profils, organisations, hubs, relais et partenaires sans fausse clé polymorphe. Leur type est toujours enregistré. Les coordonnées indiquent source, précision, heure d’occurrence et heure de réception ; une estimation n’est jamais présentée comme un GPS direct.
