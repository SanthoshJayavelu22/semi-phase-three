#!/bin/bash

set -e

echo "🚀 Starting production deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Build application
echo "📦 Building application..."
docker-compose -f docker-compose.prod.yml build

# 3. Run database migrations
echo "📊 Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend npm run migrate:up

# 4. Create database backup
echo "💾 Creating database backup..."
docker-compose -f docker-compose.prod.yml run --rm backend npm run backup

# 5. Deploy services
echo "🚀 Deploying services..."
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# 6. Wait for health check
echo "⏳ Waiting for health check..."
sleep 10

# 7. Verify deployment
echo "🔍 Verifying deployment..."
if curl -f http://localhost:5003/api/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "🌐 Application available at: https://semi.org"
else
    echo "❌ Health check failed!"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# 8. Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f --filter "until=24h"
