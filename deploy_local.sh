#!/bin/bash
set -e

echo "🚀 Starting Local Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Build Backend
echo "🔨 Building Backend (Local NO-CACHE)..."
# Force NO CACHE to ensure fresh code
docker build --no-cache -t ztop-backend:v6-local ./backend

# 3. Build Frontend
echo "🔨 Building Frontend (Local NO-CACHE)..."
# Ensure VITE_API_URL is passed. Adjust domain if needed.
docker build --no-cache --build-arg VITE_API_URL=https://back.ztop.dev.br/api -t ztop-frontend:v6-local ./frontend

# 4. Deploy Stack
echo "🚀 Deploying Stack..."
# Check if stack exists to decide update vs create logic if needed, but 'deploy' handles both.
docker stack deploy -c docker-compose.yml ztop

echo "✅ Deployment Triggered! Monitoring services..."
sleep 5
docker service ls
echo "📜 Logs of Backend:"
sleep 2
docker service logs ztop_backend --tail 20
