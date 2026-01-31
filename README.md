# 🏆 Akasha + Enka Combined Scraper

Ce projet est un outil d'extraction de données combinant **Akasha.cv** et **Enka.Network**. 
Il permet de récupérer les classements (leaderboards) depuis Akasha, puis d'enrichir ces données avec les statistiques détaillées (artéfacts, armes, stats précises) via Enka, le tout exporté proprement en **CSV** et **JSON**.

## 🚀 Fonctionnalités
- **Scraping Akasha** : Récupère les UID du top classement pour un personnage/calcul donné.
- **Scraping Enka** : Récupère les détails complets (build) pour chaque UID.
- **Support des nouveaux personnages** : Mapping à jour (Columbina,Lauma, Flins, Mualani, Kinich, Xilonen, Mavuika...).
- **Export structuré** : CSV détaillé (une ligne par joueur avec colonnes d'artéfacts) + JSON complet.
- **Rapport Markdown** : Génération automatique d'un rapport lisible.

---

## 📦 Installation

### Option 1 : Environnement Virtuel (Recommandé)
Cette méthode isole les dépendances du projet pour ne pas polluer votre système.

```bash
# 1. Créer l'environnement virtuel
python3 -m venv venv

# 2. Activer l'environnement
source venv/bin/activate

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Lancer le script
python leaderboard.py
```

### Option 2 : Installation Globale (Système)
Si vous préférez installer les paquets pour tout le système via APT (Debian/Ubuntu/Linux Mint).

```bash
# 1. Mettre à jour les paquets
sudo apt update

# 2. Installer Python et les librairies nécessaires (si possible)
sudo apt install python3-pandas python3-requests python3-pip

# 3. Compléter avec les dépendances manquantes via pip
pip3 install -r requirements.txt --break-system-packages
```

---

## 🎮 Utilisation

Le script est **interactif**. Vous pouvez le lancer simplement :
```bash
python leaderboard.py
```
Il vous demandera :
1. L'ID du leaderboard Akasha (ex: `1000010212`)
2. Le nombre de joueurs à scanner (défaut 50)

### Mode Avancé (Ligne de commande)
Vous pouvez aussi passer les arguments directement pour automatiser le processus :

```bash
# Scanner les 5 premiers joueurs du leaderboard 1000010212
python leaderboard.py 1000010212 --limit 5
```

---

## 📂 Structure des fichiers
- `leaderboard.py` : Script principal.
- `akasha.py` : Module API pour Akasha.
- `enka.py` : Module API pour Enka (gère aussi le mapping et les calculs de stats).
- `generate_report.py` : Script pour générer un rapport Markdown à partir du CSV.
- `scanresultDDMMYY_ID.csv/json` : Fichiers de sortie contenant les données.
