# Expérience pays et monétisation

Cette architecture applique les adaptations dans le produit sans afficher d’explication technique dans les parcours. Les choix manuels sont regroupés dans les réglages de chaque application.

## Préférences

- La préférence enregistrée sur l’appareil reste prioritaire.
- Les formats de langue, devise, date, fuseau et unités utilisent `lib/i18n/config.ts`.
- Le pays sélectionné définit la devise, le fuseau et les moyens de paiement proposés.
- Le sens RTL est appliqué au document pour l’arabe.
- Le thème, la réduction des mouvements et les offres personnalisées sont modifiables uniquement dans les réglages.
- L’accent local reste secondaire : le logo, la structure et les composants Yobalelma ne changent pas.

## Diffusion partenaire

La migration `20260721143000_country_experience_and_monetization.sql` crée un registre versionné des pays, des annonceurs, campagnes, créations, emplacements, événements et changements.

Règles invariantes :

- surfaces autorisées : User App, site et application mobile ;
- aucun emplacement dans Hub App, Relay App ou Collection App ;
- aucun HTML, JavaScript ou script tiers ;
- liens et images HTTPS uniquement ;
- emplacements désactivés par défaut ;
- publication après revue humaine indépendante ;
- critères sensibles absents du schéma de ciblage ;
- composant rendu côté serveur, avec dimensions réservées et repli statique ;
- contenu toujours identifié comme partenaire.

## Responsabilités Admin

- `super_admin`, `admin`, `country_manager` : expérience par pays ;
- `super_admin`, `admin`, `partner_manager` : publicité et monétisation ;
- `auditor` : consultation du journal de changements ;
- l’approbateur d’une campagne ne peut pas en être le créateur.

## Validation

Les tests couvrent la configuration pays, le RTL existant, les liens HTTPS, le rejet du code exécutable, l’absence de critères sensibles et l’exclusion des applications opérationnelles.
