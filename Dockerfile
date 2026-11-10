# The built site is plain HTML, CSS and JS, the same on every platform: the
# build stage runs once on the builder's own platform, even when buildx
# targets arm64 too, and only the nginx stage is per platform.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# .env.production points the app at its own origin, where nginx proxies the API.
RUN npm run build-only


FROM nginx:1.29-alpine

# Where nginx forwards /api/, /admin/ and /static/: the backend service of
# docker compose by default.
ENV BACKEND_URL=http://backend:8000

# The image fills ${BACKEND_URL} in at start and writes conf.d/default.conf.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
