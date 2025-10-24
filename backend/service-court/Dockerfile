# Dockerfile for service-court
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5003
CMD ["node", "index.js"]
