# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copier les requirements
COPY Website/requirements.txt .
COPY Website/backend/requirements.txt ./backend/

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copier le code source
COPY Website/ .
COPY enkakasha/Artifacts /app/Artifacts
COPY enkakasha/Characters /app/Characters

# Créer le dossier data pour la persistance
RUN mkdir -p /app/data

# Exposer le port 8000
EXPOSE 8000

# Commande de lancement
CMD ["python", "backend/api.py"]
