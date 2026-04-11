#!/usr/bin/env bash
# start.sh — Build images and launch the Bash Interactive Lab
set -euo pipefail

echo "=== Bash Interactive Lab ==="
echo ""

# 1. Build the Alpine runner image
echo "[1/2] Building Alpine runner image..."
docker build -t bash-crashcourse-runner ./runner

# 2. Build and start the backend
echo "[2/2] Building and starting backend..."
docker-compose up --build backend

echo ""
echo "Lab is running → http://localhost:3000"
echo "Share your machine's LAN IP with students."
echo "Press Ctrl+C to stop."
