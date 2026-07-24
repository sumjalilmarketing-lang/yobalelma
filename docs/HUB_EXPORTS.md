# Exports Hub

Endpoint : `GET /api/hub/exports?type=inventory&format=csv`. Formats : CSV UTF-8, feuille Excel XML, PDF et HTML imprimable A4. Chaque document contient auteur, horodatage et périmètre. Les jobs réels sont inscrits dans `hub_export_jobs`.

Types disponibles : inventaire, incidents, audit, performance, manifeste, packing list, lot et inspection. Les réponses portent `Cache-Control: private, no-store` et `X-Content-Type-Options: nosniff`.
