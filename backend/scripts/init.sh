#!/bin/sh
set -x # Print commands for debugging

echo "🚀 Starting deployment script..."

# Trap errors
trap 'echo "❌ Error on line $LINENO"; exit 1' ERR

# Run migrations
echo "📦 Running Migrations..."
npx prisma migrate deploy || { echo "❌ Migration failed!"; exit 1; }

# Run seed
echo "🌱 Running Seed..."
node prisma/seed.js || { echo "❌ Seed failed!"; exit 1; }

# Start application
echo "🚀 Starting Server..."
npm start
