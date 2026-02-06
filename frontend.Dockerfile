# Frontend Dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Copier explicitement les fichiers de dépendances en premier
COPY Website/frontend/package.json ./
# Copier le lockfile s'il existe (sinon la copie échouera mais on peut l'ignorer pour le install)
# Comme le globbing ne marche pas comme on veut si le fichier n'existe pas, on copie juste package.json
# Et on lance npm install (qui va créer un lockfile temporaire)

# Installer les dépendances
# Note: npm install est utilisé car package-lock.json peut être absent
RUN npm install

# Copier le reste du code source
COPY Website/frontend/ .

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
