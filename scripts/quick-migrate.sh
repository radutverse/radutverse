#!/bin/bash
# Quick migration using Python script

set -e

echo "🚀 Running file migration..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Run Python migration script
python3 scripts/migration-copy.py

echo ""
echo "✅ Done! Now run:"
echo "   cd apps/web"
echo "   pnpm install"
echo "   pnpm dev"
