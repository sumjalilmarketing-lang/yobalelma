# Préparation production Hub Enterprise

État actuel : pilote technique avancé, non production internationale.

Acquis : architecture multi-hubs, RLS, Control Tower, recherche indexée, alertes, incidents, stock, prévisions assistives, audit append-only, exports/documents, observabilité, i18n/RTL, responsive, tests locaux et données synthétiques.

Bloquants externes : hébergement HTTPS durable, domaine `hub.yobalelma.com`, secrets du fournisseur, monitoring externe, fournisseurs email/SMS/WhatsApp/push, stockage privé final, test de charge sur build production et revalidation staging avec mot de passe pilote.

Go production seulement après p95 conforme, restauration testée, rotation de secrets, alerting externe, pentest, runbooks d’astreinte et validation métier multi-pays.
