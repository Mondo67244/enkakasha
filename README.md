# 🌟 Genshin AI Mentor (Enkakasha)

<p align="center">
  <a href="#english"><b>🇺🇸 English Version</b></a>
  &nbsp;|&nbsp;
  <a href="#french"><b>🇫🇷 Version Française</b></a>
</p>

<p align="center">
  <img src="https://place-hold.it/800x400?text=Paste+Your+Demo+GIF+Here&fontsize=20" alt="Genshin AI Mentor Demo" width="100%">
  <br>
  <em>AI-Powered Artifact Analysis & Optimization</em>
</p>

---
<div id="english"></div>
#🇺🇸 English Version

**Genshin AI Mentor** is an open-source artifact optimization platform. It combines **Generative AI (Gemini)** with precise game data (scraped via Akasha/Enka) to tell you exactly *why* an artifact is good (or trash), going far beyond simple CV (Crit Value) calculations.

### 🛠 Tech Stack
* **Frontend**: React.js /shadcn ui
* **Backend**: Python (Flask/FastAPI)
* **AI Engine**: Google Gemini (Integration via API)
* **Data**: Custom Scrapers (Akasha/Enka)

## 🎯 Features
This project is divided into several interconnected modules:
* **🔍 Build Analysis**: Uses intelligent algorithms to evaluate the quality of equipped artifacts/weapons.
* **🤖 Mentor AI**: A virtual assistant that suggests concrete improvements based on your specific character build.
* **📊 Leaderboards & Data**: A scraping subsystem that retrieves data from top global players to establish benchmarks.
* **📚 Visual Encyclopedia**: A rich, responsive database of artifact images and characters imagines.

## 📥 Installation & Setup

**Simple :**

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Mondo67244/enkakasha.git
    cd enkakasha
    ```

2.  **Start the application**:
    ```bash
    ./run.sh
    ```
    ✨ **Magic!** This script checks everything for you:
    * Creates the Python virtual environment.
    * Installs dependencies (`requirements.txt` & `package.json`).
    * Launches both the Backend server and Frontend site.

3.  **Setup the AI (Bring Your Own Key)**:
    * Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and get a free API Key.
    * Open the app in your browser (usually `http://localhost:51xx`).
    * Paste your key in the settings field at the top right.

> 🔒 **Privacy First:** When using the "Bring Your Own Key" mode, your API Key communicates directly with Google's servers. We do not store, log, or share your credentials on our servers.

## 🤝 Contributing
We welcome contributions!
1.  **Fork** the project.
2.  Create your **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** to the branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

## ⚖️ License
**Genshin AI Mentor** is open-source software licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**.

* ✅ **Allowed:** Personal use, modification, self-hosting for private use.
* ⚠️ **Condition:** If you host this as a public service, you **MUST** share your source code.

Genshin AI Mentor by [IKOLAM](https://mondo.ikouni.site)

---

<div id="french"></div>
#🇫🇷 Version Française

**Genshin AI Mentor** est une plateforme d'optimisation d'artefacts Open Source. Elle combine l'**IA Générative (Gemini)** avec des données de jeu précises pour vous dire exactement *pourquoi* un artefact est bon (ou à jeter), bien au-delà des simples calculs de "Crit Value".

### 🛠 Stack Technique
* **Frontend**: React.js
* **Backend**: Python
* **Moteur IA**: Google Gemini (via API)
* **Données**: Scrapers Custom (Akasha/Enka)

## 🎯 Fonctionnalités
* **🔍 Analyse de Build** : Algorithmes intelligents pour évaluer vos équipements.
* **🤖 Mentor IA** : Un assistant virtuel qui suggère des améliorations concrètes pour VOTRE box.
* **📊 Leaderboards** : Comparaison avec les meilleurs joueurs mondiaux.
* **📚 Encyclopédie Visuelle** : Base de données locale pour une interface fluide.

## 📥 Installation

**Démarrage rapide :**

1.  **Cloner le dépôt** :
    ```bash
    git clone https://github.com/Mondo67244/enkakasha.git
    cd enkakasha
    ```

2.  **Lancer l'application** :
    ```bash
    ./run.sh
    ```
    ✨ **Magique !** Ce script gère tout : création de l'environnement virtuel Python, installation des dépendances et lancement du serveur + site web.

3.  **Configurer l'IA** :
    * Récupérez une clé API gratuite sur [Google AI Studio](https://aistudio.google.com/app/apikey).
    * Ouvrez l'application (`http://localhost:51xx`).
    * Collez votre clé dans les paramètres en haut à droite.

> 🔒 **Confidentialité :** Votre clé API communique directement avec les serveurs de Google. Nous ne stockons, n'enregistrons et ne partageons jamais vos identifiants.

## ⚖️ Licence
Ce projet est sous licence **GNU Affero General Public License v3.0 (AGPLv3)**.

* ✅ **Autorisé :** Usage personnel, modification, auto-hébergement privé.
* ⚠️ **Condition :** Si vous hébergez ce site comme un service public, vous **DEVEZ** partager votre code source modifié.

Genshin AI Mentor par [IKOLAM](https://mondo.ikouni.site)