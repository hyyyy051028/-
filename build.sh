#!/bin/bash
set -e

echo "Current directory: $(pwd)"
echo "Listing directory contents:"
ls -la

echo "Installing dependencies..."
npm install

echo "Installing Vite globally..."
npm install -g vite

echo "Creating dist directory if it doesn't exist..."
mkdir -p dist

echo "Building the project..."
npm run build

echo "Checking if dist directory was created..."
if [ -d "dist" ]; then
    echo "dist directory exists. Listing contents:"
    ls -la dist/
else
    echo "Error: dist directory was not created!"
    exit 1
fi

echo "Build completed successfully!" 