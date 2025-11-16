#!/bin/bash
set -e   # Exit immediately if any command fails

echo "Going to frontend directory..."
cd frontend

echo "Installing frontend dependencies..."
npm install

echo "Building frontend..."
npm run build

echo "Copying frontend build files to backend static resources..."
# Adjust the source folder depending on your build output (e.g., dist, build)
cp -r dist/* ../backend/src/main/resources/static/

echo "Going to queue_display directory..."
cd ../queue_display

echo "Installing queue_display dependencies..."
npm install

echo "Building queue display..."
npm run build

echo "Going to backend directory..."
cd ../backend

echo "Running Maven clean package..."
./mvnw -DskipTests clean package

echo "Build process completed."