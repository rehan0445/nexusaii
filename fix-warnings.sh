#!/bin/bash

echo "Fixing deprecation warnings..."
echo ""

echo "Setting NODE_OPTIONS to suppress deprecation warnings..."
export NODE_OPTIONS="--no-deprecation"

echo ""
echo "Starting application without deprecation warnings..."
npm run dev 