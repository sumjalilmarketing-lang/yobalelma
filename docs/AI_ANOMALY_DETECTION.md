# AI Anomaly Detection

Le moteur signale actuellement les scans rejoués, vitesses impossibles et transferts concurrents. Chaque signal expose score, gravité, facteurs, sources et limite : une anomalie doit être confirmée et ne prouve ni fraude ni faute.

Les faux positifs et faux négatifs doivent être enregistrés dans le monitoring. Les seuils ne seront ajustés qu’après validation; aucun réentraînement ou changement automatique en production n’est autorisé.
