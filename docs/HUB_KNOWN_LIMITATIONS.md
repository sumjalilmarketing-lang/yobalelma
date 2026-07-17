# Hub known limitations

1. L’URL `trycloudflare.com` est temporaire et dépend de la machine et du processus actuellement actifs. Cloudflare Quick Tunnel ne garantit pas la disponibilité ni la conservation de l’URL.
2. Aucun compte Vercel, VPS LWS Node.js, DNS Cloudflare nommé ou secret de CI/CD n’était disponible dans le workspace ; aucun déploiement durable ne pouvait être créé sans nouvelle autorité externe.
3. La récupération de mot de passe et la confirmation email n’ont pas été menées jusqu’à la réception d’un email réel sur les adresses `.test`. Les quatre utilisateurs pilotes sont provisionnés avec email déjà confirmé.
4. La session expirée est couverte au niveau des jetons signés et de la redirection middleware ; l’attente réelle de l’expiration Supabase n’a pas été accélérée sur staging.
5. La navigation mobile/tablette affiche le menu complet verticalement : elle est utilisable mais plus longue qu’un menu repliable.
6. Le serveur staging n’a pas de PM2/systemd, alerte externe ni SLA. Les erreurs critiques sont journalisées localement et corrélées.
