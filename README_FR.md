# Genshin AI Mentor (Enkakasha)

[🇫🇷 Français](README_FR.md) | [🇺🇸 English](README.md)

**Genshin AI Mentor** est une plateforme avancée d'analyse et d'optimisation pour Genshin Impact. Elle combine la puissance de l'IA avec des données précises (scrappées via Akasha/Enka) pour aider les joueurs à perfectionner leurs builds.

## 🎯 Ce que fait le site

Ce projet se divise en plusieurs modules interconnectés :

*   **🔍 Analyse de Build** : Utilise des algorithmes intelligents pour évaluer la qualité des artéfacts et des armes équipés.
*   **📊 Leaderboards & Data** : Un sous-système de scraping (`Tools/Scrappers`) récupère les données des tops joueurs mondiaux pour établir des référentiels de comparaison.
*   **🤖 Mentor AI** : Un assistant virtuel qui suggère des améliorations concrètes en fonction de votre box et de vos objectifs.
*   **📚 Encyclopédie Visuelle** : Une base de données locale d'images d'artéfacts (générée par nos outils) pour une interface riche et réactive.

## � Installation

Pour installer et tester le projet localement :

1.  **Cloner le dépôt** :
    ```bash
    git clone https://github.com/votre-utilisateur/enkakasha.git
    cd enkakasha
    ```

## 📥 Installation

**Démarrage ultra-simple "Plug & Play" :**

1.  **Cloner le dépôt** :
    ```bash
    git clone https://github.com/votre-utilisateur/enkakasha.git
    cd enkakasha
    ```

2.  **Lancer l'application** :
    ```bash
    ./run.sh
    ```
    ✨ **Magique !** Ce script vérifie tout pour vous :
    *   Il crée l'environnement virtuel Python s'il n'existe pas.
    *   Il installe automatiquement les dépendances (`requirements.txt`).
    *   Il lance le serveur Backend et le site Frontend.

**(Note : Assurez-vous simplement d'avoir Python 3 et Node.js installés sur votre machine.)**

## 🤝 Contribuer (Règles de Collaboration)

Nous accueillons les contributions avec plaisir ! Voici comment procéder :

1.  **Forkez le projet** et créez votre propre branche (`git checkout -b feature/AmazingFeature`).
2.  **Committez vos changements** (`git commit -m 'Add some AmazingFeature'`).
3.  **Poussez vers la branche** (`git push origin feature/AmazingFeature`).
4.  **Ouvrez une Pull Request (PR)**.

**Règles importantes** :
*   Toute PR doit être testée.
*   Respectez la structure des dossiers (`Website/`, `Tools/`, `Artifacts/`).
*   Commentez votre code là où c'est nécessaire.

## 📜 Code de Conduite

Nous nous engageons à faire de ce projet un environnement accueillant et inclusif.
*   Soyez respectueux et courtois.
*   Aucune forme de harcèlement ou de discrimination ne sera tolérée.
*   Les débats techniques sont encouragés, mais doivent rester constructifs.

## ⚖️ Licence et Droits d'Utilisation

**© Mondo - Tous droits réservés sur la commercialisation.**

Ce code est **Open Source** pour une utilisation éducative et personnelle.

### ✅ Vous êtes autorisé à :
*   Consulter le code pour apprendre.
*   Modifier le code pour votre usage personnel.
*   Contribuer au projet via des Pull Requests.
*   Partager vos modifications (forks) tant qu'elles respectent cette même licence.

### � Il est STRICTEMENT INTERDIT de :
*   **Vendre** ce logiciel ou une partie de son code.
*   Utiliser ce code dans un produit commercial payant.
*   Monétiser l'accès à une instance hébergée de ce projet sans l'accord explicite de l'auteur.

Pour toute demande commerciale, veuillez contacter l'auteur principal.

## Crédits & Contributions

* **Mondo** : Créateur original, architecture frontend, Backend et algorithmes d'analyse.

* **Byron voldigoad** : Refonte UI/UX, implémentation du système de thèmes (Light/Dark).
