# Alertes Hub

`hub_alerts` prend en charge les statuts ouvert, acquitté, résolu et supprimé. `POST /api/hub/alerts` permet l’acquittement/résolution selon la politique RLS. L’in-app est actif ; email, SMS, WhatsApp et push restent configurables par hub et désactivés tant qu’aucun fournisseur n’est configuré.

Les alertes synthétiques couvrent stock dormant, manifeste incomplet et capacité critique.
