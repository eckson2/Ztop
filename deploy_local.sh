#!/bin/bash
set -e

echo "🚀 Starting Local Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Build Backend
echo "🔨 Building Backend (v7-local)..."
# Cleanup old local images to avoid tag-collision or zombie layers
docker image rm ztop-backend:v7-local || true
docker build --no-cache -t ztop-backend:v7-local ./backend

# 3. Build Frontend
echo "🔨 Building Frontend (v7-local)..."
docker image rm ztop-frontend:v7-local || true
# Ensure VITE_API_URL is passed. Adjust domain if needed.
docker build --no-cache --build-arg VITE_API_URL=https://b.ztop.dev.br/api -t ztop-frontend:v7-local ./frontend

# 4. Deploy Stack
echo "🚀 Deploying Stack..."
docker stack deploy -c docker-compose.yml ztop

echo "✅ Deployment Triggered! Monitoring services..."
sleep 5
docker service ls
echo "📜 Logs of Backend:"
sleep 2
docker service logs ztop_backend --tail 20
