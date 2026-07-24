# Passeport Logistique

Le Passeport regroupe identité du colis, route, état, détenteur, étape suivante, ETA, retard, intervenant, timeline, transferts, preuves, scellés, anomalies et score de confiance.

La vue publique expose uniquement le code de suivi, les villes, le statut, l’étape, l’ETA, la fraîcheur, la confiance et une timeline simplifiée. Elle exclut noms, téléphones, adresses, identités, OTP, chemins de fichiers, données fraude, coordonnées opérationnelles fines et autres colis.

La vue `/command/passports` est soumise à l’authentification Admin, aux rôles autorisés et aux RLS pays. Elle affiche les hashes courts à des fins de vérification, la chaîne de possession, les preuves et anomalies. La recherche accepte le code public opaque ou l’UUID d’expédition et ne retourne rien hors périmètre.

L’export PDF serveur n’est pas déclaré actif : le modèle d’accès et le journal sont prêts, mais le moteur de rendu et la recette d’autorisation restent une dépendance interne à terminer.
