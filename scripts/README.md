# Migration Scripts

This directory contains automated scripts to migrate RadutVerse from a traditional Express + client/server structure to a Vercel-optimized monorepo using pnpm workspaces and Turborepo.

## 📋 Overview

All scripts are designed to be:
- **Safe**: Never delete original files
- **Idempotent**: Can be run multiple times without issues
- **Informative**: Detailed logging with emoji indicators
- **Cross-platform**: Work on Windows, Mac, and Linux

## 🚀 Quick Start

```bash
# Run all migrations automatically
pnpm migrate:all

# Or run individual scripts
pnpm migrate:shared      # Step 1: Migrate types and utils
pnpm migrate:frontend    # Step 2: Migrate React code
pnpm migrate:api         # Step 3: Migrate API routes
pnpm migrate:imports     # Step 4: Update import paths
pnpm migrate:check       # Step 5: Verify migration
```

## 📚 Script Descriptions

### 1. migrate-shared.js
**Purpose:** Extract shared code into a standalone package  
**Time:** ~5 seconds  
**What it does:**
- Copies TypeScript types from `client/types/` → `packages/shared/src/types/`
- Copies utilities from `client/lib/utils/` → `packages/shared/src/utils/`
- Copies constants from `client/lib/ip-assistant/` → `packages/shared/src/constants/`
- Generates `packages/shared/src/index.ts` with re-exports
- Creates proper directory structure

**Output:**
```
✅ Created shared directory structure
✅ Copied types: generation.ts
✅ Copied utils: crypto.ts
✅ Copied utils: hash.ts
...
🎉 Migration complete: 12 files copied
```

**Depends on:** Nothing (runs first)

---

### 2. migrate-frontend.js
**Purpose:** Move React application to Vercel-optimized structure  
**Time:** ~10 seconds  
**What it does:**
- Copies `client/src/` → `apps/web/src/` (excluding types/utils)
- Copies `client/public/` → `apps/web/public/`
- Copies `client/index.html` → `apps/web/index.html`
- Copies configuration files (vite.config.ts, tsconfig.json, etc.)
- Skips node_modules, dist, and .git directories

**Output:**
```
✅ Created apps/web directory structure
📋 Copying client source code...
✅ Copied public folder
✅ Copied index.html
✅ Copied vite.config.ts
🎉 Frontend migration complete: 42 files copied
```

**Depends on:** migrate-shared.js (shared structure should exist)

---

### 3. migrate-api.js
**Purpose:** Convert Express routes to Vercel serverless functions  
**Time:** ~8 seconds  
**What it does:**
- Copies Express routes from `server/routes/` → `apps/web/api/`
- Copies server utilities → `apps/web/api/_lib/utils/`
- Copies data files → `apps/web/api/_lib/data/`
- Creates proper Vercel function structure
- Prepares for Vercel deployment

**Output:**
```
✅ Created apps/web/api directory structure
📝 Converting check-ip-assets.ts...
✅ Converted and copied check-ip-assets.ts
✅ Converted and copied upload.ts
...
🎉 API migration complete: 17 routes converted
```

**Depends on:** Nothing (independent)

---

### 4. update-imports.js
**Purpose:** Update all import paths to use the shared package  
**Time:** ~3 seconds  
**What it does:**
- Finds all TypeScript/TSX files in `apps/web/src/` and `apps/web/api/`
- Replaces `from '@/types'` → `from 'shared/types'`
- Replaces `from '@/utils'` → `from 'shared/utils'`
- Handles relative imports like `from '../types'`
- Preserves code formatting

**Patterns updated:**
```
from '@/types'                    → from 'shared/types'
from '@/lib/utils'                → from 'shared/utils'
from '@/utils'                    → from 'shared/utils'
from '../../../types'             → from 'shared/types'
from '@shared/...'                → from 'shared/...'
```

**Output:**
```
✅ Updated: apps/web/src/components/Index.tsx
✅ Updated: apps/web/src/pages/History.tsx
...
🎉 Import update complete: 24 files updated, 89 replacements made
```

**Depends on:** migrate-frontend.js (files to update should exist)

---

### 5. migration-check.js
**Purpose:** Verify the migration was successful  
**Time:** ~5 seconds  
**What it does:**
- ✅ Verifies directory structure exists
- ✅ Checks configuration files created
- ✅ Tests TypeScript compilation
- ✅ Validates package manager
- ✅ Checks for shared package exports

**Checks performed:**
```
✅ apps directory exists
✅ apps/web/src directory exists
✅ packages/shared/src/types directory exists
✅ pnpm-workspace.yaml exists
✅ turbo.json exists
✅ TypeScript compilation successful
✅ pnpm is installed (version X.X.X)
```

**Output:**
```
📂 Checking directory structure...
✅ apps directory exists at apps
✅ apps/web exists at apps/web
...
📊 Migration Verification Summary:
✅ Checks passed: 12
🎉 All migration checks passed!
```

**Depends on:** All other scripts (final verification step)

---

### 6. verify-deployment.js
**Purpose:** Test that the migrated application works  
**Time:** ~10 seconds  
**What it does:**
- Tests homepage loads (GET /)
- Tests API endpoints
- Verifies HTTP responses
- Checks error handling
- Useful for CI/CD integration

**Usage:**
```bash
# Test local dev server
pnpm dev &
pnpm verify:deployment http://localhost:5173

# Test production deployment
pnpm verify:deployment https://example.vercel.app
```

**Output:**
```
🔍 Testing GET /...
✅ GET / - Status: 200
🔍 Testing POST /api/ping...
✅ POST /api/ping - Status: 200
...
📊 Verification Summary:
✅ Successful tests: 3
🎉 All deployment verification tests passed!
```

**Depends on:** Running server (dev or production)

---

### 7. migrate-all.js
**Purpose:** Orchestrate all migration steps in sequence  
**Time:** ~60 seconds total  
**What it does:**
- Runs all migration scripts in proper order
- Creates workspace structure
- Handles errors gracefully
- Generates `MIGRATION_REPORT.md`
- Provides clear progress feedback

**Execution sequence:**
```
1. Create Workspace Structure
2. Migrate Shared Package (calls migrate-shared.js)
3. Migrate Frontend (calls migrate-frontend.js)
4. Migrate API Routes (calls migrate-api.js)
5. Update Import Paths (calls update-imports.js)
6. Verify Migration (calls migration-check.js)
```

**Output:**
```
🚀 Starting shared types and utilities migration...
✅ Step 1/6: Migrate Shared Package ✅

🚀 Starting frontend migration...
✅ Step 2/6: Migrate Frontend ✅

... (continues for all steps)

🎉 Migration Complete!
✅ All 6 migration steps completed successfully!
📄 Report saved to MIGRATION_REPORT.md
```

**Generates:** `MIGRATION_REPORT.md` with detailed migration information

## 🔧 Common Usage Patterns

### Full Automated Migration
```bash
pnpm migrate:all
pnpm install
pnpm build
```

### Step-by-Step with Verification
```bash
pnpm migrate:shared
pnpm migrate:frontend
pnpm migrate:api
pnpm migrate:imports
pnpm migrate:check
```

### Verify Before Cleanup
```bash
pnpm dev &
pnpm verify:deployment http://localhost:5173
# If successful, then clean up old directories
```

### CI/CD Integration
```bash
pnpm migrate:all
pnpm migrate:check
exit $?  # Exit with proper code
```

## 📊 Script Comparison

| Script | Purpose | Duration | Destructive |
|--------|---------|----------|-------------|
| migrate-shared.js | Extract shared code | ~5s | No |
| migrate-frontend.js | Move React app | ~10s | No |
| migrate-api.js | Convert API routes | ~8s | No |
| update-imports.js | Fix imports | ~3s | No* |
| migration-check.js | Verify structure | ~5s | No |
| verify-deployment.js | Test endpoints | ~10s | No |
| migrate-all.js | Run all above | ~60s | No |

*update-imports.js modifies files but leaves originals intact

## ⚙️ Technical Details

### Dependencies
- Node.js built-in modules only (fs, path, https, http, child_process)
- fs-extra (already in devDependencies)
- No other external dependencies required

### Exit Codes
- `0` - Success
- `1` - Failure or errors found

### Environment
- Works on Windows, Mac, Linux
- Works with bash, zsh, PowerShell
- Compatible with CI/CD systems

### Performance
- Total migration time: ~60 seconds
- Fastest step: update-imports.js (~3s)
- Slowest step: migrate-all.js (~60s, orchestrator)

## 🐛 Troubleshooting

### Script not found
```bash
# Make sure you're in the project root
pwd  # Should end with 'radutverse' or similar

# Check scripts directory exists
ls scripts/
```

### Permission denied
```bash
# Make scripts executable
chmod +x scripts/migrate-*.js
chmod +x scripts/update-*.js
```

### pnpm command not found
```bash
# Install pnpm globally
npm install -g pnpm@10.14.0

# Verify
pnpm --version
```

### Import errors after migration
```bash
# Re-run import update
pnpm migrate:imports

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📝 Script Output Examples

### Successful run
```bash
$ pnpm migrate:shared
✅ Created shared directory structure
✅ Copied types: generation.ts
✅ Copied main utils.ts as utils/index.ts
✅ Generated shared/src/index.ts with all exports
🎉 Migration complete: 3 files copied
```

### With warnings
```bash
$ pnpm migrate:frontend
✅ Created apps/web directory structure
⏭️ Skipping types (handled by shared package)
⏭️ Skipping lib (handled by shared package)
🎉 Frontend migration complete: 42 files copied, 2 files skipped
```

### Error handling
```bash
$ pnpm migrate:api
❌ Failed to convert check-ip-assets.ts: File not found
⚠️ Encountered 1 error during API migration
```

## 🎓 Learning Path

1. Read this README
2. Review the individual script files to understand the logic
3. Run `pnpm migrate:all` to execute the migration
4. Check `MIGRATION_REPORT.md` for results
5. Review `MIGRATION_GUIDE.md` for next steps

## 📞 Need Help?

1. Check `MIGRATION_GUIDE.md` for detailed instructions
2. Run `pnpm migrate:check` to verify structure
3. Review `MIGRATION_REPORT.md` for what was migrated
4. Check script output for error messages

---

**Script Package Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Production Ready
