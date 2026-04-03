#!/bin/bash
echo "Attempting direct build..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "node_modules not found, running npm install..."
  npm install
fi

# Try to build
echo "Running build..."
npx tsup || {
  echo "Build failed, trying alternative approach..."
  
  # Try compiling TypeScript directly
  npx tsc --noEmit
  
  # If that works, try tsup with verbose output
  npx tsup --verbose
}