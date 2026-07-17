# Hub Control Tower

Route : `/hub/control-tower`. La RPC `get_hub_control_tower` consolide volumes entrants, stock, lots, incidents, alertes, poids et capacités uniquement pour les hubs accessibles. L’interface propose carte réseau, comparaison, vue exécutive et bascule par hub.

Les statuts `operational`, `degraded`, `paused`, `maintenance`, `closed` proviennent de `hub_statuses`. Le timestamp visible indique la fraîcheur du read model.
