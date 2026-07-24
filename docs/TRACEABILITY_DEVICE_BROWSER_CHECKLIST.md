# Checklist signable appareils et navigateurs — traçabilité

Date de préparation : 24 juillet 2026.
Règle : une ligne reste « Non exécuté » tant que la preuve et la signature ne sont pas renseignées.

## Tests déjà exécutés sans matériel physique

| Appareil | Version | Application | Rôle | Date | Testeur | Résultat | Capture/vidéo | Anomalie | Signature |
|---|---|---|---|---|---|---|---|---|---|
| Navigateur intégré bureau | moteur géré Codex | User App | client expéditeur | 24/07/2026 | Codex | Réussi | session et page `/client` observées | aucune observée | automatisé |
| Navigateur intégré bureau | moteur géré Codex | User App | voyageur | 24/07/2026 | Codex | Réussi | session et page `/traveler` observées | aucune observée | automatisé |
| Navigateur intégré bureau | moteur géré Codex | User App | livreur local | 24/07/2026 | Codex | Réussi | session et page `/transporter` observées | aucune observée | automatisé |
| Navigateur intégré bureau | moteur géré Codex | Collection App | agent Collection | 24/07/2026 | Codex | Réussi | session et page `/collection` observées | aucune observée | automatisé |
| Navigateur intégré bureau | moteur géré Codex | Relay App | agent Relais | 24/07/2026 | Codex | Réussi | session et page `/relay` observées | aucune observée | automatisé |
| Navigateur intégré bureau | moteur géré Codex | Hub App | agent Hub | 24/07/2026 | Codex | Réussi | session et page `/hub` observées | aucune observée | automatisé |
| Navigateur intégré bureau | moteur géré Codex | Hub App | superviseur Hub | 24/07/2026 | Codex | Réussi | session et rôle observés | aucune observée | automatisé |
| Navigateur intégré bureau | moteur géré Codex | Admin App | administrateur | 24/07/2026 | Codex | Partiel | contrôle MFA observé | facteur AAL2 réel absent | non signé |
| Navigateur intégré bureau | moteur géré Codex | Admin App locale | compte AAL1 simulé | 24/07/2026 | Codex | Réussi | page d'enrôlement rendue, largeur 1280/1280 | activation TOTP réelle non exécutée | automatisé |
| Navigateur intégré bureau | moteur géré Codex | Admin App locale | récupération MFA | 24/07/2026 | Codex | Réussi | procédure de récupération rendue, largeur 1280/1280 | révocation réelle non exécutée | automatisé |

## Fiche appareil

| Champ | Valeur |
|---|---|
| Marque / modèle | |
| Numéro d'actif ou identifiant anonymisé | |
| Version Android/iOS | |
| Version application/navigateur | |
| Réseau/opérateur | |
| Compte et rôle | |
| Date/heure | |
| Testeur | |

## Android physique

| Test | Application | Rôle | Action et résultat attendu | Résultat | Capture/vidéo | Anomalie | Signature |
|---|---|---|---|---|---|---|---|
| Installation | app pilote | agent terrain | installer, ouvrir sans alerte inattendue | Non exécuté | | | |
| Connexion | app pilote | rôle affecté | session ouverte, mauvais rôle refusé | Non exécuté | | | |
| Caméra refusée | app pilote | relais | refus clair, lien vers réglages | Non exécuté | | | |
| Caméra autorisée | app pilote | relais | prévisualisation et scan fonctionnels | Non exécuté | | | |
| GPS refusé | app pilote | chauffeur | transfert bloqué avec motif | Non exécuté | | | |
| GPS autorisé | app pilote | chauffeur | position/accuracy/timestamp enregistrés | Non exécuté | | | |
| QR valide | app pilote | relais | une demande de transfert créée | Non exécuté | | | |
| QR invalide/expiré/rejoué | app pilote | relais | refus sans changement de détenteur | Non exécuté | | | |
| Photo | app pilote | hub | upload signé, aperçu et preuve liée | Non exécuté | | | |
| Signature | app pilote | destinataire | signature liée à la remise | Non exécuté | | | |
| OTP valide/invalide/expiré | app pilote | destinataire | seul le code valide confirme | Non exécuté | | | |
| GPS en déplacement | app pilote | chauffeur | positions ordonnées et plausibles | Non exécuté | | | |
| Arrière-plan | app pilote | chauffeur | reprise conforme après 5 minutes | Non exécuté | | | |
| Écran verrouillé | app pilote | chauffeur | aucun transfert fantôme | Non exécuté | | | |
| Réseau faible | app pilote | agent terrain | feedback clair, aucun doublon | Non exécuté | | | |
| Mode avion | app pilote | agent terrain | opération mise en file offline | Non exécuté | | | |
| Reprise réseau | app pilote | agent terrain | synchronisation unique/idempotente | Non exécuté | | | |
| Batterie faible | app pilote | chauffeur | fonctionnement ou avertissement explicite | Non exécuté | | | |
| Fermeture forcée/réouverture | app pilote | agent terrain | état sûr et file restaurée | Non exécuté | | | |
| Notification push | app pilote | destinataire | notification reçue une fois | Non exécuté | | | |
| Passeport Logistique | app pilote | client | événements et preuves actualisés | Non exécuté | | | |

## iPhone physique

| Test | Application | Rôle | Action et résultat attendu | Résultat | Capture/vidéo | Anomalie | Signature |
|---|---|---|---|---|---|---|---|
| Installation/connexion | app pilote/Safari | rôle affecté | installation et session conformes | Non exécuté | | | |
| Caméra/QR | app pilote/Safari | relais | permissions iOS, scan, refus du replay | Non exécuté | | | |
| Photos | app pilote/Safari | hub | permission limitée/complète gérée, upload signé | Non exécuté | | | |
| Localisation active | app pilote/Safari | chauffeur | position et précision enregistrées | Non exécuté | | | |
| Localisation arrière-plan | app pilote | chauffeur | comportement conforme aux droits iOS | Non exécuté | | | |
| Notifications | app pilote | destinataire | permission, réception et ouverture | Non exécuté | | | |
| Stockage local/offline | app pilote/Safari | agent terrain | file chiffrée et reprise idempotente | Non exécuté | | | |
| Fermeture forcée/reprise | app pilote/Safari | agent terrain | aucune perte ni validation fantôme | Non exécuté | | | |
| Économie d'énergie | app pilote | chauffeur | dégradation explicite, reprise correcte | Non exécuté | | | |
| OTP/signature/Passeport | app pilote/Safari | destinataire | remise unique et preuves visibles | Non exécuté | | | |

## Navigateurs réels

Répéter chaque ligne pour Chrome, Edge et Safari.

| Navigateur/version | OS/appareil | Compte/rôle | Contrôle | Résultat attendu | Résultat | Capture | Console | Temps/mémoire | Signature |
|---|---|---|---|---|---|---|---|---|---|
| Chrome | | | authentification + MFA | accès conforme au rôle/AAL2 | Non exécuté | | | | |
| Chrome | | | Control Tower + carte | données, zoom, permissions | Non exécuté | | | | |
| Chrome | | | Passeport + preuves + PDF | affichage et téléchargement corrects | Non exécuté | | | | |
| Chrome | | | responsive | aucun overflow/perte d'action | Non exécuté | | | | |
| Edge | | | authentification + MFA | accès conforme au rôle/AAL2 | Non exécuté | | | | |
| Edge | | | Control Tower + carte | données, zoom, permissions | Non exécuté | | | | |
| Edge | | | Passeport + preuves + PDF | affichage et téléchargement corrects | Non exécuté | | | | |
| Edge | | | responsive | aucun overflow/perte d'action | Non exécuté | | | | |
| Safari | | | authentification + MFA | accès conforme au rôle/AAL2 | Non exécuté | | | | |
| Safari | | | Control Tower + carte | données, zoom, permissions WebKit | Non exécuté | | | | |
| Safari | | | Passeport + preuves + PDF | affichage et téléchargement corrects | Non exécuté | | | | |
| Safari | | | responsive | aucun overflow/perte d'action | Non exécuté | | | | |

## Signature de campagne

| Responsabilité | Nom | Date | Décision | Signature |
|---|---|---|---|---|
| Responsable recette | | | | |
| Responsable opérations | | | | |
| Responsable sécurité | | | | |
| Product owner | | | | |
