FROM node:18

WORKDIR /app

# Copy package.json first for caching
COPY package*.json ./
RUN npm install

# Copy rest of the code
COPY . .

# Environment variable for build only (Prisma generate needs to know schema location)
# Adding a dummy URL prevents validation errors in some prisma versions
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
