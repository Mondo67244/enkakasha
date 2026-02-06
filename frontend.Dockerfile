# Frontend Dockerfile
FROM node:20-alpine as build

# Le frontend est dans /app
# Les imports relatifs depuis src/pages/*.jsx sont: ../../../../Characters/...
# Depuis /app/src/pages/, ../../../../ => /
# Donc on doit placer Characters et elements à la racine /

WORKDIR /app

# Copier explicitement les fichiers de dépendances
COPY Website/frontend/package.json ./
RUN npm install

# Copier le code source du Frontend
COPY Website/frontend/ .

# Copier Characters et elements à la racine du système de fichiers
# pour que le chemin relatif ../../../../Characters fonctionne depuis /app/src/pages/
COPY Characters /Characters
COPY elements /elements

# Build avec l'URL de l'API relative
# CHARACTERS_PATH et ELEMENTS_PATH permettent aux alias Vite de trouver les dossiers
ENV VITE_API_URL=/api
ENV CHARACTERS_PATH=/Characters
ENV ELEMENTS_PATH=/elements
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
