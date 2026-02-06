# Frontend Dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Copier explicitement les fichiers de dépendances
COPY Website/frontend/package.json ./
RUN npm install

# Copier le code source du Frontend
COPY Website/frontend/ .

# Copier les fichiers externes nécessaires au build (Characters.json)
# On doit copier tout le dossier Characters dans le dossier parent (../Characters)
# Mais Docker ne permet pas de copier en dehors du WORKDIR facilement avec un chemin relatif ".."
# Astuce : On va copier Characters dans /Characters (racine du conteneur)
# Et s'assurer que l'import relatif dans le code fonctionne, ou alors on le met au bon endroit relatif.

# Le code cherche "../../../../Characters/characters.json" depuis "src/pages/Chat.jsx"
# WORKDIR = /app
# src/pages/Chat.jsx est dans /app/src/pages/Chat.jsx
# ../../../../ = /app/src/pages/../../.. = /
# Donc il cherche /Characters/characters.json
# C'est parfait !

COPY Characters /Characters

# Build avec l'URL de l'API relative
ENV VITE_API_URL=/api
RUN npm run build

# --- Production ---
FROM caddy:alpine

# Copier le site compilé
COPY --from=build /app/dist /usr/share/caddy

# Configurer Caddy interne
RUN echo $':80 {\n\
    root * /usr/share/caddy\n\
    encode gzip\n\
    file_server\n\
    \n\
    handle_path /api/* {\n\
        reverse_proxy backend:8000\n\
    }\n\
    \n\
    try_files {path} /index.html\n\
}' > /etc/caddy/Caddyfile

EXPOSE 80
