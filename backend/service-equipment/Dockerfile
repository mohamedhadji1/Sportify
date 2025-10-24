FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# Run setup script to create placeholder image
RUN node setup-uploads.js

EXPOSE 5020
CMD ["node", "index.js"]
