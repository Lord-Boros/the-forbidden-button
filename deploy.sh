#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Check if running latest Node.js version
echo "Checking Node.js version..."
node -v

# Install dependencies
echo "Installing dependencies..."
npm install

# Run tests if they exist
if [ -f "package.json" ] && grep -q "test" "package.json"; then
    echo "Running tests..."
    npm test
fi

# Build frontend assets
echo "Building frontend assets..."
if [ -f "package.json" ] && grep -q "build" "package.json"; then
    npm run build
fi

# Check environment variables
echo "Checking environment variables..."
required_vars=("MONGODB_URI" "JWT_SECRET" "STRIPE_SECRET_KEY" "STRIPE_PRICE_ID")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    fi
done

# Backup database (if MongoDB URI is available)
if [ ! -z "$MONGODB_URI" ]; then
    echo "Creating database backup..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    mongodump --uri="$MONGODB_URI" --out="./backups/backup_$timestamp"
fi

# Start the application
echo "Starting the application..."
if [ "$NODE_ENV" = "production" ]; then
    # Use PM2 in production
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        npm install -g pm2
    fi
    pm2 stop useless-button || true
    pm2 start server.js --name useless-button
else
    # Use nodemon in development
    if ! command -v nodemon &> /dev/null; then
        echo "Installing nodemon..."
        npm install -g nodemon
    fi
    nodemon server.js
fi

echo "✅ Deployment completed successfully!" 