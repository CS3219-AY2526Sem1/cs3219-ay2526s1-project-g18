#!/bin/sh

# Exit on any error
set -e

echo "Starting PeerPrep Attempt History Service..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "Regenerating Prisma client with runtime DATABASE_URL..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting the application..."
exec node dist/index.js