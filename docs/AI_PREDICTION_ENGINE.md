# AI Prediction Engine

Le retard est estimé à partir de l’ETA de base, des incidents, de la douane, de la capacité et de la fraîcheur GPS. Toute variable absente est listée et réduit la confiance. En dessous de 30 observations historiques, la sortie reste une heuristique.

La saturation projette le flux net à 1 h, 6 h et 24 h. L’hypothèse de débit constant est affichée. Aucun trafic ou signal météo absent n’est inventé.

Aucun modèle entraîné n’est approuvé. Un passage au statut `predictive_model` exigera jeu de validation, lignage, taille minimale, mesures par pays, revue métier et approbation explicite.
