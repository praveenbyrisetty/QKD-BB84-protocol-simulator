#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo ">>> Setting up Unified Deployment Build..."

echo ">>> 1. Building React Frontend..."
cd my-react
npm install
npm run build
cd ..

echo ">>> 2. Installing Python Backend Dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo ">>> Build complete! Ready to start gunicorn server."
