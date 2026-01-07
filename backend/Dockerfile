FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma (Required for Alpine) and Chromium for Puppeteer
RUN apk update && apk add --no-cache openssl libc6-compat chromium nss freetype harfbuzz ca-certificates ttf-freefont

# Puppeteer Environment Variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "server.js"]
