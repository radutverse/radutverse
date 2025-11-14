#!/bin/bash

# Monorepo Migration Script
# Migrates from single-app structure to monorepo structure
# Usage: bash scripts/migrate-to-monorepo.sh

set -e  # Exit on error

echo "🚀 Starting Monorepo Migration..."

# Step 1: Create directory structure
echo "📁 Creating directory structure..."
mkdir -p apps/web/src
mkdir -p apps/web/server
mkdir -p packages/shared/src

# Step 2: Copy client/ → apps/web/src/
echo "📂 Copying client files to apps/web/src/..."
if [ -d "client" ]; then
  cp -r client/* apps/web/src/
  echo "✅ Client files copied"
else
  echo "⚠️  client/ directory not found, skipping..."
fi

# Step 3: Copy server/ → apps/web/server/
echo "📂 Copying server files to apps/web/server/..."
if [ -d "server" ]; then
  cp -r server/* apps/web/server/
  echo "✅ Server files copied"
else
  echo "⚠️  server/ directory not found, skipping..."
fi

# Step 4: Copy public/ → apps/web/public/
echo "📂 Copying public files to apps/web/public/..."
if [ -d "public" ]; then
  mkdir -p apps/web/public
  cp -r public/* apps/web/public/
  echo "✅ Public files copied"
else
  echo "⚠️  public/ directory not found, skipping..."
fi

# Step 5: Copy global.css (renamed from client/)
echo "📄 Setting up CSS..."
if [ -f "apps/web/src/global.css" ]; then
  echo "✅ Global CSS found"
else
  echo "⚠️  global.css not found"
fi

# Step 6: Verify key files exist
echo ""
echo "🔍 Verifying critical files..."
critical_files=(
  "apps/web/src/App.tsx"
  "apps/web/src/pages/Index.tsx"
  "apps/web/server/index.ts"
  "apps/web/package.json"
  "apps/web/vite.config.ts"
  "packages/shared/src/types/generation.ts"
)

all_good=true
for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file NOT FOUND"
    all_good=false
  fi
done

echo ""
if [ "$all_good" = true ]; then
  echo "✨ Migration structure complete!"
  echo ""
  echo "📝 Next steps:"
  echo "1. Run: cd apps/web && pnpm install"
  echo "2. Test build: pnpm build"
  echo "3. Test dev: pnpm dev"
  echo "4. Review MIGRATION_GUIDE.md for import updates"
  echo "5. Delete old directories: rm -rf client/ server/ api/ shared/ netlify/"
else
  echo "❌ Some critical files are missing!"
  echo "Please check the migration manually."
  exit 1
fi

echo ""
echo "✅ Migration script completed!"
