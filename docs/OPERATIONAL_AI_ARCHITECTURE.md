# Yobalelma Operational Intelligence Engine

Le moteur étend le Control Tower existant; il ne crée ni second workflow logistique ni seconde source de vérité. Les événements, le Digital Twin, le dispatch et les recommandations restent les contrats d’intégration.

Modules indépendants : orchestrateur, feature store avec qualité et fraîcheur, règles versionnées, estimation des retards, projection de saturation, anomalies, score de fiabilité, simulation, explicabilité, workflow humain, registre de modèles, monitoring, feedback, audit et garde-fous. Les fonctions pures sont dans `lib/operational-intelligence/`; les artefacts gouvernés sont dans les tables `operational_ai_*`.

Le chemin nominal est : sources RLS → contrôles qualité → calcul classifié → explication → recommandation → décision humaine → événement audité → feedback. Le chemin dégradé conserve règles et dispatch manuel, désactive les recommandations avancées et ne perd aucun événement.

Les données historiques disponibles ne justifient actuellement aucun modèle prédictif entraîné. Les sorties de retard sont donc annoncées comme heuristiques/statistiques simples; la saturation comme calcul linéaire; les scénarios comme simulations.
