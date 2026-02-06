# Frontend Dockerfile
FROM node:20-alpine as build

# Le frontend est dans /app
# Les imports relatifs depuis src/pages/*.jsx sont: ../../../../Characters/...
# Depuis /app/src/pages/, ../../../../ => /
# Donc on doit placer Characters et elements à la racine /

WORKDIR /app

# Copier explicitement les fichiers de dépendances en premier
COPY Website/frontend/package.json ./
# Copier le lockfile s'il existe (sinon la copie échouera mais on peut l'ignorer pour le install)
# Comme le globbing ne marche pas comme on veut si le fichier n'existe pas, on copie juste package.json
# Et on lance npm install (qui va créer un lockfile temporaire)

# Installer les dépendances
# Note: npm install est utilisé car package-lock.json peut être absent
RUN npm install

# Copier le reste du code source frontend
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
