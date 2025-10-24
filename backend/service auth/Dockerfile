# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /usr/src/app

# Copy package files first so Docker can cache npm install when sources change
COPY package.json package-lock.json ./
# Use npm ci with a cache mount when BuildKit is enabled to speed up repeated builds.
# This will be a no-op if BuildKit is not available, but the Docker build will still work.
RUN --mount=type=cache,target=/root/.npm \
	npm ci --omit=dev

# Stage 2: Runtime
FROM node:18-alpine AS runtime
WORKDIR /usr/src/app

# Copy only production node_modules from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy application source code
COPY . .

# Expose port
EXPOSE 5000

# Run app with initialization step
CMD ["sh", "-c", "npm run init-admin && node index.js"]
