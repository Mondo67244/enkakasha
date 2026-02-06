# Frontend Dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Copier les dépendances
COPY Website/frontend/package*.json ./

# Installer
RUN npm install

# Copier le code
COPY Website/frontend/ .

# Build avec l'URL de l'API relative (pour passer par le proxy Caddy)
# On force l'URL de l'API à "/api"
ENV VITE_API_URL=/api
RUN npm run build

# --- Production ---
FROM caddy:alpine

# Copier le site compilé
COPY --from=build /app/dist /usr/share/caddy

# Configurer Caddy pour servir le site + Proxy vers le backend
# On crée un Caddyfile interne au conteneur pour gérer le routing local
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
