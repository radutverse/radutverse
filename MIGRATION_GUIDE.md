# RadutVerse Migration Guide: From Express to Vercel-Optimized Monorepo

This guide walks you through migrating your RadutVerse application to a modern pnpm monorepo structure optimized for Vercel deployment.

## 📋 Overview

This migration restructures your application from a mixed Express + serverless setup into a clean, scalable monorepo using:

- **pnpm workspaces** for package management
- **Turborepo** for build orchestration
- **Vercel serverless functions** for backend APIs
- **Shared packages** for reusable code

### Current Structure
```
radutverse/
├── client/              # React frontend
├── server/              # Express backend
├── api/                 # Serverless functions
└── public/
```

### Target Structure
```
radutverse/
├── apps/
│   └── web/             # Frontend + API (Vercel-optimized)
│       ├── src/         # React components, pages, hooks
│       ├── api/         # Vercel serverless functions
│       ├── public/      # Static assets
│       └── package.json
├── packages/
│   └── shared/          # Reusable types, utils, constants
│       └── src/
├── scripts/             # Migration automation
├── pnpm-workspace.yaml  # Workspace configuration
├── turbo.json           # Build orchestration
└── package.json         # Root configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (verify with `node --version`)
- pnpm 10.14.0+ (install with `npm install -g pnpm`)
- Git (for version control)

### Step 1: Verify Your Setup

```bash
# Check Node.js version
node --version  # Should be 18+

# Check pnpm version
pnpm --version  # Should be 10.14.0+
```

### Step 2: Run the Automated Migration

The migration scripts will guide you through the entire process:

```bash
# Run the complete migration
pnpm migrate:all
```

This command:
1. ✅ Creates the workspace directory structure
2. ✅ Migrates shared types and utilities to `packages/shared`
3. ✅ Moves frontend code to `apps/web`
4. ✅ Converts API routes to Vercel serverless functions
5. ✅ Updates all import paths throughout the codebase
6. ✅ Verifies the migration was successful

### Step 3: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### Step 4: Verify Everything Works

```bash
# Type check
pnpm typecheck

# Test the dev server
pnpm dev

# Build for production
pnpm build
```

## 📚 Detailed Steps

### Individual Migration Scripts

If you prefer to run migrations step-by-step:

```bash
# 1. Create workspace structure (automatic with migrate:all)
# 2. Migrate shared package
pnpm migrate:shared

# 3. Migrate frontend code
pnpm migrate:frontend

# 4. Migrate API routes
pnpm migrate:api

# 5. Update all import paths
pnpm migrate:imports

# 6. Verify migration
pnpm migrate:check

# 7. Verify deployment (requires running dev server)
pnpm verify:deployment http://localhost:5173
```

## 🔄 What Gets Migrated

### 1. Shared Package (`packages/shared`)

**Copied from:**
- `client/types/*` → `packages/shared/src/types/`
- `client/lib/utils/*` → `packages/shared/src/utils/`
- `client/lib/ip-assistant/constants.ts` → `packages/shared/src/constants/`

**Generated:**
- `packages/shared/src/index.ts` - Exports all types and utilities

### 2. Frontend (`apps/web`)

**Copied from:**
- `client/src/*` → `apps/web/src/` (excluding types and utils)
- `client/public/*` → `apps/web/public/`
- `client/index.html` → `apps/web/index.html`
- `client/*.config.ts` → `apps/web/*.config.ts`

### 3. API Routes (`apps/web/api`)

**Copied from:**
- `server/routes/*` → `apps/web/api/`
- `server/utils/*` → `apps/web/api/_lib/utils/`
- `server/data/*` → `apps/web/api/_lib/data/`

### 4. Import Paths

**Updated from:**
- `from '@/types'` → `from 'shared/types'`
- `from '@/utils'` → `from 'shared/utils'`
- `from '../types'` → `from 'shared/types'`
- All relative imports are converted to workspace references

## 🧪 Testing After Migration

### Local Development

```bash
# Start dev server (both frontend and backend)
pnpm dev

# In another terminal, test API endpoints
curl http://localhost:5173/api/ping
```

### Build for Production

```bash
# Build all packages
pnpm build

# Outputs:
# - apps/web/dist/    # Frontend build
# - apps/web/api/     # API functions
```

### Type Checking

```bash
# Check TypeScript errors
pnpm typecheck

# Should complete with no errors
```

## 🌐 Deployment to Vercel

### Initial Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
cd apps/web
vercel link
```

### Deploy

```bash
# Deploy from project root
vercel

# Or automatic CI/CD deployment via GitHub
# Push to your repository and let Vercel auto-deploy
```

### Environment Variables

Configure these in Vercel project settings:

```
VITE_GUEST_PRIVATE_KEY=...
VITE_PUBLIC_SPG_COLLECTION=...
VITE_PUBLIC_STORY_RPC=...
STORY_API_KEY=...
OPENAI_API_KEY=...
OPENAI_ORGANIZATION=...
OPENAI_VERIFIER_MODEL=...
VITE_PRIVY_APP_ID=...
PINATA_JWT=...
PINATA_GATEWAY=...
```

## 🔧 Troubleshooting

### "pnpm: command not found"

```bash
# Install pnpm globally
npm install -g pnpm@10.14.0

# Verify installation
pnpm --version
```

### "Cannot find module 'shared'"

This occurs if you run `pnpm install` before migration:

```bash
# Delete node_modules
rm -rf node_modules pnpm-lock.yaml

# Run migration
pnpm migrate:all

# Install again
pnpm install
```

### TypeScript compilation errors

```bash
# Clear any cached builds
rm -rf dist apps/web/dist packages/shared/dist

# Rebuild everything
pnpm build
```

### API routes not working

1. Verify files are in `apps/web/api/` directory
2. Check file names don't have `.js` extension (should be `.ts`)
3. Ensure default export is a function: `export default async function handler(req, res)`

### Import path errors after migration

```bash
# Re-run the import update script
pnpm migrate:imports

# Check tsconfig.json paths are correct
cat apps/web/tsconfig.json | grep -A 5 '"paths"'
```

## 📁 File Organization After Migration

```
apps/web/
├── src/
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── context/           # React context
│   ├── services/          # API client services
│   ├── config/            # Configuration files
│   └── App.tsx            # Root component
├── api/
│   ├── check-ip-assets.ts
│   ├── analyze-image-vision.ts
│   ├── capture-asset-vision.ts
│   ├── ... (other route files)
│   └── _lib/
│       ├── services/      # Shared API logic
│       ├── middleware/    # Middleware functions
│       └── utils/         # Utility functions
├── public/
│   ├── favicon.ico
│   └── ... (static assets)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json
└── index.html

packages/shared/
├── src/
│   ├── types/
│   │   ├── generation.ts
│   │   └── ... (other types)
│   ├── utils/
│   │   ├── index.ts
│   │   ├── crypto.ts
│   │   ├── hash.ts
│   │   └── ... (other utils)
│   ├── constants/
│   │   └── ip-assistant.ts
│   └── index.ts          # Main export file
└── package.json
```

## ✅ Success Criteria

After migration, verify:

- ✅ `pnpm install` completes without errors
- ✅ `pnpm dev` starts the dev server
- ✅ `pnpm build` succeeds
- ✅ `pnpm typecheck` passes with zero errors
- ✅ API endpoints respond (test with `curl http://localhost:5173/api/ping`)
- ✅ All imports resolve correctly
- ✅ Vercel deployment succeeds

## 🗑️ Cleanup (After Verification)

Once you've verified everything works, you can clean up the old structure:

```bash
# IMPORTANT: Only do this after thorough testing!

# Remove old directories
rm -rf client/types client/lib/utils server/routes server/utils

# Or just keep them for reference and use .gitignore
echo "client/" >> .gitignore
echo "server/" >> .gitignore
echo "api/" >> .gitignore
```

## 📞 Getting Help

### Check Migration Report

```bash
cat MIGRATION_REPORT.md
```

This file contains detailed information about what was migrated and any issues encountered.

### Verify Migration Checklist

```bash
cat MIGRATION_CHECKLIST.md
```

Reference this for step-by-step verification.

### Run Diagnostics

```bash
# Check workspace structure
pnpm migrate:check

# Verify deployment (requires running dev server)
pnpm dev &
pnpm verify:deployment http://localhost:5173
```

## 🎓 Learning More

### Monorepo Resources

- [pnpm workspaces docs](https://pnpm.io/workspaces)
- [Turborepo documentation](https://turbo.build/repo/docs)
- [Vercel Functions guide](https://vercel.com/docs/functions/serverless-functions)

### Related Documentation

- See `MIGRATION_CHECKLIST.md` for detailed verification steps
- See `MIGRATION_REPORT.md` for what was actually migrated
- See original `DEPLOYMENT_GUIDE.md` for deployment strategies

## 🔒 Important Notes

1. **Backup First**: This script doesn't delete original files, but backup your repository before starting
2. **Test Thoroughly**: Test locally before deploying to production
3. **Environment Variables**: Ensure all env vars are set in Vercel
4. **API Keys**: Double-check API keys are properly configured
5. **Database Connections**: Verify database connections in the new structure

## 🚀 Next Steps After Migration

1. **Add more packages**: Create additional packages in `packages/` for shared logic
2. **Optimize builds**: Use Turborepo caching for faster builds
3. **CI/CD setup**: Configure GitHub Actions or similar for automated testing
4. **Monitoring**: Set up error tracking with Sentry or similar
5. **Performance**: Use Vercel Analytics to monitor performance

---

**Last Updated**: 2024
**Migration Tool Version**: 1.0.0
**Status**: Production Ready
