# Incidents Hub

`/hub/incidents` s’appuie sur `operational_incidents` et la RPC existante `create_hub_incident`. Priorité, assignation, escalade, SLA, commentaires, pièces jointes et post-mortem sont rattachés à un hub et protégés par RLS.

La clôture critique reste une action managériale. Les pièces sont limitées à 10 Mio et les emplacements de stockage sont privés.
