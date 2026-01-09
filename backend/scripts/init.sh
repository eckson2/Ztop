#!/bin/sh
set -e

echo "🚀 Starting deployment script..."

# Run migrations
echo "📦 Running Migrations..."
npx prisma migrate deploy

# Run seed
echo "🌱 Running Seed..."
node prisma/seed.js

# Start application
echo "🚀 Starting Server..."
npm start
