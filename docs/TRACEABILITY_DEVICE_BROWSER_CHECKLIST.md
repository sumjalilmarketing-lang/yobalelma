# Checklist appareils et navigateurs — traçabilité

Date : 24 juillet 2026.
Règle : aucun test matériel non exécuté n'est déclaré réussi.

## Contrôles déjà exécutés

| Appareil | Compte | Rôle | Précondition | Action | Résultat attendu | Preuve à capturer | Statut |
|---|---|---|---|---|---|---|---|
| Navigateur intégré, bureau | pilote expéditeur | client expéditeur | déploiement accessible | connexion puis ouverture `/client` | espace client affiché, pas d'overflow | capture page et URL | Réussi |
| Navigateur intégré, bureau | pilote voyageur | voyageur | déploiement accessible | connexion puis ouverture `/traveler` | espace voyageur affiché | capture page et URL | Réussi |
| Navigateur intégré, bureau | pilote transporteur | livreur local | déploiement accessible | connexion puis ouverture `/transporter` | espace livreur affiché | capture page et URL | Réussi |
| Navigateur intégré, bureau | pilote Collection | agent Collection | déploiement accessible | connexion puis ouverture `/collection` | espace Collection nominatif affiché | capture page et URL | Réussi |
| Navigateur intégré, bureau | pilote Relais | agent Relais | déploiement accessible | connexion puis ouverture `/relay` | relais pilote affiché | capture page et URL | Réussi |
| Navigateur intégré, bureau | pilote Hub | agent Hub | déploiement accessible | connexion puis ouverture `/hub` | centre opérationnel et rôle affichés | capture page et URL | Réussi |
| Navigateur intégré, bureau | pilote superviseur | superviseur Hub | déploiement accessible | connexion puis ouverture `/hub` | identité superviseur affichée | capture page et URL | Réussi |
| Navigateur intégré, bureau | pilote Admin | administrateur | mot de passe valide | connexion à `/command` | demande MFA avant accès métier | capture écran MFA | Partiel — MFA AAL2 absent |

## Android physique

Compte recommandé : compte pilote correspondant au rôle indiqué. Précondition commune : build pilote installé, colis synthétique autorisé, batterie > 30 %, horloge automatique.

| Appareil | Compte | Rôle | Précondition | Action | Résultat attendu | Preuve à capturer | Statut |
|---|---|---|---|---|---|---|---|
| Android Chrome/app | agent Relais | agent Relais | caméra refusée | lancer un scan QR | explication et reprise possible après permission | vidéo + capture permission | Non exécuté |
| Android Chrome/app | agent Relais | agent Relais | caméra autorisée | scanner QR valide, invalide, expiré puis rejoué | seul le QR valide passe ; replay refusé | vidéo + IDs événements | Non exécuté |
| Android Chrome/app | chauffeur national | chauffeur national | GPS refusé puis autorisé | tenter un transfert | refus explicite puis position enregistrée | capture permission + coordonnées masquées | Non exécuté |
| Android Chrome/app | chauffeur national | chauffeur national | app en arrière-plan | démarrer trajet, verrouiller 5 min, rouvrir | état conservé, reprise GPS conforme | vidéo + timestamps | Non exécuté |
| Android Chrome/app | agent Collection | agent Collection | réseau faible simulé | créer/mettre à jour un colis | retour clair, aucun doublon | vidéo + journal réseau | Non exécuté |
| Android Chrome/app | agent Collection | agent Collection | mode avion | scanner et synchroniser hors ligne | file locale visible, sync unique au retour | vidéo + événements avant/après | Non exécuté |
| Android Chrome/app | agent Hub | agent Hub | caméra et stockage autorisés | charger une photo de preuve | upload unique, aperçu, hash/ID preuve | capture + ID preuve | Non exécuté |
| Android Chrome/app | destinataire | client destinataire | OTP valide | signer puis confirmer réception | signature et événement atomiques | vidéo + passeport | Non exécuté |
| Android Chrome/app | tout rôle terrain | rôle associé | formulaire en cours | fermer de force puis rouvrir | état sûr, aucune validation fantôme | vidéo + état serveur | Non exécuté |

## iOS physique

Répéter chaque ligne Android sur iPhone Safari/app avec les permissions iOS correspondantes : caméra, localisation « lorsque l'app est active », arrière-plan si supporté, réseau dégradé, perte réseau, synchronisation, photo, signature, fermeture forcée et réouverture.

| Appareil | Compte | Rôle | Précondition | Action | Résultat attendu | Preuve à capturer | Statut |
|---|---|---|---|---|---|---|---|
| iPhone Safari/app | agent Relais | agent Relais | appareil pilote et colis synthétique | QR/caméra/permissions | refus et succès gérés sans doublon | vidéo + événements | Non exécuté |
| iPhone Safari/app | chauffeur national | chauffeur national | appareil pilote et trajet synthétique | GPS/arrière-plan/réseau faible | position et reprise conformes | vidéo + timestamps | Non exécuté |
| iPhone Safari/app | agent Collection | agent Collection | mode avion | scan offline puis resynchronisation | synchronisation idempotente | vidéo + événements | Non exécuté |
| iPhone Safari/app | agent Hub | agent Hub | photo autorisée | upload photo | preuve unique liée au transfert | capture + ID preuve | Non exécuté |
| iPhone Safari/app | destinataire | client destinataire | OTP valide | signature, fermeture et réouverture | remise unique et état conservé | vidéo + passeport | Non exécuté |

## Navigateurs bureau

| Appareil | Compte | Rôle | Précondition | Action | Résultat attendu | Preuve à capturer | Statut |
|---|---|---|---|---|---|---|---|
| Chrome physique | comptes pilotes | neuf rôles | environnement pilote | connexion, navigation, QR si caméra, PDF | écrans et autorisations conformes | captures + console | Non exécuté |
| Edge physique | comptes pilotes | neuf rôles | environnement pilote | même parcours | comportement équivalent Chrome | captures + console | Non exécuté |
| Safari macOS physique | comptes pilotes | neuf rôles | environnement pilote | même parcours | fonctionnement sans incompatibilité WebKit | captures + console | Non exécuté |

## Preuve obligatoire par transfert terrain

Pour chaque étape Client → Relais → Chauffeur → Hub → Voyageur/transporteur → Hub destination → Chauffeur local → Relais/destinataire, capturer :

1. détenteur avant et après ;
2. preuve et identifiant QR/OTP ;
3. position et timestamp ;
4. identifiant de l'événement ;
5. Passeport Logistique avant/après ;
6. Digital Twin avant/après ;
7. événement Control Tower ;
8. notification reçue ;
9. seconde tentative refusée avec motif.
