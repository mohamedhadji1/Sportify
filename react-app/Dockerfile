## Frontend Dockerfile - optimized for faster builds
## Stage 1: install dependencies (cached)
FROM node:18-alpine AS deps
WORKDIR /app

# copy package files first to leverage layer cache
COPY package.json package-lock.json ./

# Use BuildKit cache mount for npm to speed up repeated builds
# Requires BuildKit: set DOCKER_BUILDKIT=1 when running docker build
RUN --mount=type=cache,target=/root/.npm \
	npm ci --prefer-offline --no-audit --no-fund

## Stage 2: build
FROM node:18-alpine AS build
WORKDIR /app

# copy node_modules from deps stage (cache-friendly)
COPY --from=deps /app/node_modules ./node_modules

# copy source
COPY . .

# allow passing REACT_APP_API_URL at docker build time so built static assets
# bake the correct API base URL into the production bundle
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# build app (produces /app/build)
RUN npm run build

## Stage 3: nginx production image
FROM nginx:stable-alpine AS prod

# copy static build output
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]