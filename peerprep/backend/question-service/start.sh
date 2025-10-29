#!/bin/sh

# Exit on any error
set -e

echo "Starting PeerPrep Question Service..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "Running database migrations..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "Starting the application..."
exec node dist/index.js
