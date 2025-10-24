# Dockerfile for service-team
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5004
CMD ["node", "index.js"]
