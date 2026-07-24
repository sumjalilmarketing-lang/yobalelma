# Hub multi-hubs

Hubs initialisés : Dakar/DSS, Paris/CDG, Bruxelles/BRU, Abidjan/ABJ, Casablanca/CMN et Montréal/YUL. Chaque hub porte pays, ville, aéroport, fuseau, devise, adresse, capacités, statut, destinations, horaires et règles locales.

`hub_staff_assignments` attribue les hubs autorisés. `hub_agent` et `hub_supervisor` restent limités à leur affectation ; `hub_manager` voit ses affectations ; `operations_manager` peut superviser plusieurs hubs. `current_user_can_access_hub` est la fonction centrale des politiques RLS.
