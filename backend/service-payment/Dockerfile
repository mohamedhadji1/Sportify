FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --only=production
COPY . .
EXPOSE 5010
CMD ["node", "index.js"]
