#!/bin/bash
# start.sh - Serve the Blender WASM application
# Usage: ./start.sh [port]
#
# This script serves the built application without requiring Node.js
# For local development, use: npm run dev

set -e

PORT="${1:-8080}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
    echo "Error: dist directory not found. Run 'npm run build' first."
    exit 1
fi

# Try Python HTTP server first (most universally available)
if command -v python3 &> /dev/null; then
    echo "Starting server with Python..."
    cd "$DIST_DIR"
    python3 -m http.server "$PORT" --bind 0.0.0.0
elif command -v python &> /dev/null; then
    echo "Starting server with Python..."
    cd "$DIST_DIR"
    python -m http.server "$PORT" --bind 0.0.0.0
# Try Node.js serve if available
elif command -v npx &> /dev/null; then
    echo "Starting server with npx serve..."
    cd "$DIST_DIR"
    npx --yes serve -l "$PORT"
# Try PHP built-in server
elif command -v php &> /dev/null; then
    echo "Starting server with PHP..."
    cd "$DIST_DIR"
    php -S 0.0.0.0:"$PORT"
else
    echo "Error: No suitable server found. Please install Python, Node.js, or PHP."
    exit 1
fi

echo "Server running at http://localhost:$PORT"
