#!/bin/bash

# Read version from package.json
VERSION=$(cat package.json | grep -Po '"version":\s*"\K[^"]*')

echo "============================================"
echo "       Starting Anvil v$VERSION - Level 1!"
echo "============================================"
echo

# Check if server dependencies need to be installed/updated
NEED_SERVER_INSTALL=false
if [ ! -d "node_modules" ]; then
    echo "Server node_modules not found..."
    NEED_SERVER_INSTALL=true
else
    # Check if all dependencies from package.json are installed
    echo "Checking for missing server dependencies..."
    if ! npm ls --depth=0 --silent > /dev/null 2>&1; then
        echo "Missing server dependencies detected..."
        NEED_SERVER_INSTALL=true
    fi
fi

if [ "$NEED_SERVER_INSTALL" = true ]; then
    echo "Installing/updating server dependencies..."
    npm install
    echo
fi

# Check if client dependencies need to be installed/updated
NEED_CLIENT_INSTALL=false
if [ ! -d "client/node_modules" ]; then
    echo "Client node_modules not found..."
    NEED_CLIENT_INSTALL=true
else
    # Check if all client dependencies from package.json are installed
    echo "Checking for missing client dependencies..."
    cd client
    if ! npm ls --depth=0 --silent > /dev/null 2>&1; then
        echo "Missing client dependencies detected..."
        NEED_CLIENT_INSTALL=true
    fi
    cd ..
fi

if [ "$NEED_CLIENT_INSTALL" = true ]; then
    echo "Installing/updating client dependencies..."
    cd client
    npm install
    cd ..
    echo
fi

# Check if dist directory exists, if not build the client
if [ ! -d "dist" ]; then
    echo "Building React client application..."
    cd client
    npm run build
    cd ..
    echo
fi

echo "Starting Anvil server..."
echo
echo "Anvil will be available at: http://localhost:3000"
echo
echo "Press Ctrl+C to stop the server"
echo "============================================"
echo

npm start