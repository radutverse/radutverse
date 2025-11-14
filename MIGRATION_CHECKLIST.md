# RadutVerse Migration Checklist

Use this checklist to track your migration progress and verify each step.

## Pre-Migration Preparation

- [ ] **Backup your repository**
  - [ ] Created a backup branch: `git checkout -b pre-migration-backup`
  - [ ] Backed up to external storage
  - [ ] Verified backup integrity

- [ ] **Verify prerequisites**
  - [ ] Node.js 18+ installed (`node --version`)
  - [ ] pnpm 10.14.0+ installed (`pnpm --version`)
  - [ ] Git is initialized
  - [ ] All uncommitted changes are committed or stashed

- [ ] **Review documentation**
  - [ ] Read MIGRATION_GUIDE.md
  - [ ] Understand target directory structure
  - [ ] Identified any custom configurations

## Step 1: Create Workspace Structure

- [ ] `scripts/migrate-all.js` created
- [ ] `scripts/migrate-shared.js` created
- [ ] `scripts/migrate-frontend.js` created
- [ ] `scripts/migrate-api.js` created
- [ ] `scripts/update-imports.js` created
- [ ] `scripts/migration-check.js` created
- [ ] `scripts/verify-deployment.js` created

**Verify:**
```bash
ls -la scripts/migrate*.js scripts/update*.js scripts/migration*.js scripts/verify*.js
```

## Step 2: Configuration Files

- [ ] `pnpm-workspace.yaml` created
  - [ ] Includes `packages/*` entry
  - [ ] Includes `apps/*` entry

- [ ] `turbo.json` created
  - [ ] Pipeline configured correctly
  - [ ] Build cache enabled
  - [ ] Dev task configured

- [ ] Root `package.json` updated
  - [ ] Migration scripts added to scripts
  - [ ] turbo dependency added
  - [ ] fs-extra dependency added

- [ ] `apps/web/package.json` created
  - [ ] Correct dependencies listed
  - [ ] `shared` workspace dependency included
  - [ ] Scripts configured (dev, build, typecheck)

- [ ] `apps/web/vercel.json` created
  - [ ] Framework set to "vite"
  - [ ] Build and install commands correct
  - [ ] Environment variables listed
  - [ ] API rewrites configured

- [ ] `packages/shared/package.json` created
  - [ ] Private set to true
  - [ ] Main and types point to src/index.ts
  - [ ] Exports configured correctly

**Verify:**
```bash
ls -la pnpm-workspace.yaml turbo.json apps/web/package.json apps/web/vercel.json packages/shared/package.json
```

## Step 3: Run Migration Scripts

### 3.1: Run Full Migration

- [ ] Executed `pnpm migrate:all`
- [ ] No errors occurred during migration
- [ ] Checked `MIGRATION_REPORT.md` was generated
- [ ] Reviewed report for any warnings

**Command:**
```bash
pnpm migrate:all
```

### 3.2: Individual Verification (if running separate scripts)

- [ ] **Shared migration** (`pnpm migrate:shared`)
  - [ ] `packages/shared/src/types/` has files
  - [ ] `packages/shared/src/utils/` has files
  - [ ] `packages/shared/src/index.ts` exports everything

- [ ] **Frontend migration** (`pnpm migrate:frontend`)
  - [ ] `apps/web/src/` contains React components
  - [ ] `apps/web/src/pages/` contains page components
  - [ ] `apps/web/src/hooks/` contains custom hooks
  - [ ] `apps/web/public/` has static assets
  - [ ] `apps/web/index.html` exists

- [ ] **API migration** (`pnpm migrate:api`)
  - [ ] `apps/web/api/` has route files
  - [ ] `apps/web/api/_lib/utils/` has server utilities
  - [ ] `apps/web/api/_lib/data/` has data files

- [ ] **Import updates** (`pnpm migrate:imports`)
  - [ ] No `@/types` imports remain
  - [ ] No `@/utils` imports remain
  - [ ] All imports updated to `shared/types` and `shared/utils`

## Step 4: Directory Structure Verification

- [ ] `apps/` directory structure
  - [ ] `apps/web/src/` exists with subdirectories
  - [ ] `apps/web/api/` exists with route files
  - [ ] `apps/web/public/` exists
  - [ ] `apps/web/package.json` exists
  - [ ] `apps/web/tsconfig.json` exists
  - [ ] `apps/web/vite.config.ts` exists
  - [ ] `apps/web/vercel.json` exists
  - [ ] `apps/web/index.html` exists

- [ ] `packages/` directory structure
  - [ ] `packages/shared/src/types/` has type files
  - [ ] `packages/shared/src/utils/` has utility files
  - [ ] `packages/shared/src/constants/` has constant files
  - [ ] `packages/shared/src/index.ts` exports everything
  - [ ] `packages/shared/package.json` exists

- [ ] Root directory
  - [ ] `pnpm-workspace.yaml` exists
  - [ ] `turbo.json` exists
  - [ ] `package.json` updated
  - [ ] `scripts/` directory has all migration scripts
  - [ ] `MIGRATION_REPORT.md` generated
  - [ ] `MIGRATION_GUIDE.md` exists

**Verify structure:**
```bash
tree -L 2 -I 'node_modules|dist' apps packages
```

## Step 5: Dependency Installation

- [ ] Removed old `node_modules` directory
  - [ ] `rm -rf node_modules pnpm-lock.yaml`

- [ ] Installed dependencies
  - [ ] Ran `pnpm install`
  - [ ] No install errors occurred
  - [ ] `pnpm-lock.yaml` was created/updated

- [ ] Verified lock file
  - [ ] `pnpm-lock.yaml` includes shared workspace package
  - [ ] All packages listed correctly

**Verify:**
```bash
pnpm list
```

## Step 6: Build and Compilation Checks

- [ ] **Type checking passed**
  - [ ] Ran `pnpm typecheck`
  - [ ] Zero TypeScript errors
  - [ ] No missing type definitions

- [ ] **Migration check passed**
  - [ ] Ran `pnpm migrate:check`
  - [ ] All checks passed

- [ ] **Frontend build succeeded**
  - [ ] Ran `pnpm build`
  - [ ] Build completed without errors
  - [ ] `apps/web/dist/` was created

**Verify:**
```bash
pnpm typecheck
pnpm migrate:check
pnpm build
```

## Step 7: Development Server Verification

- [ ] **Started dev server**
  - [ ] Ran `pnpm dev`
  - [ ] Server started without errors
  - [ ] No port conflicts

- [ ] **Frontend loads**
  - [ ] Navigated to `http://localhost:5173`
  - [ ] Page loads without JavaScript errors
  - [ ] React components render correctly

- [ ] **API endpoints respond**
  - [ ] Tested `/api/ping` endpoint
  - [ ] API returns proper JSON response
  - [ ] CORS headers present

- [ ] **Hot module reload works**
  - [ ] Made a test change to a component
  - [ ] Change reflects instantly in browser
  - [ ] No webpack errors

**Commands:**
```bash
pnpm dev
# In another terminal:
curl http://localhost:5173/api/ping
```

## Step 8: Import Path Verification

- [ ] **Search for old imports**
  - [ ] No `from '@/types'` in codebase
  - [ ] No `from '@/utils'` in codebase
  - [ ] No `from '../types'` in codebase
  - [ ] All imports use `from 'shared/...'`

- [ ] **Test imports work**
  - [ ] Create test file that imports from shared
  - [ ] TypeScript resolves imports correctly
  - [ ] No IDE import errors

**Check imports:**
```bash
grep -r "from '@/types'" apps/web/src || echo "✓ No @/types imports found"
grep -r "from '@/utils'" apps/web/src || echo "✓ No @/utils imports found"
grep -r "from 'shared/" apps/web/src | head -5
```

## Step 9: API Route Verification

- [ ] **Route files exist**
  - [ ] All Express routes copied to `apps/web/api/`
  - [ ] No TypeScript compilation errors in routes

- [ ] **Test route execution**
  - [ ] Routes load without errors
  - [ ] Can call routes with appropriate data
  - [ ] Error handling works

- [ ] **Environment variables**
  - [ ] `.env.local` configured with API keys
  - [ ] All required env vars present
  - [ ] No secrets in version control

**Verify:**
```bash
ls apps/web/api/*.ts | head -5
cat .env.local | grep -c "="
```

## Step 10: Testing & Integration

- [ ] **Run tests** (if applicable)
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] E2E tests pass

- [ ] **Manual testing**
  - [ ] Test main features
  - [ ] Test API integrations
  - [ ] Test error scenarios

- [ ] **Performance check**
  - [ ] Dev server response time acceptable
  - [ ] Build time acceptable
  - [ ] No memory leaks detected

## Step 11: Deployment Verification

- [ ] **Vercel setup** (for deployment)
  - [ ] Vercel CLI installed
  - [ ] Vercel project linked
  - [ ] Environment variables configured in Vercel

- [ ] **Deploy to staging**
  - [ ] Ran `vercel` to deploy
  - [ ] Deployment succeeded
  - [ ] Site loads on Vercel URL

- [ ] **Post-deployment verification**
  - [ ] Frontend loads
  - [ ] API endpoints work
  - [ ] Environment variables loaded correctly
  - [ ] No console errors

**Commands:**
```bash
npm install -g vercel
vercel
vercel env ls
```

## Step 12: Cleanup & Documentation

- [ ] **Updated documentation**
  - [ ] README.md updated with new structure
  - [ ] Deployment instructions updated
  - [ ] Team notified of structure changes

- [ ] **Git cleanup** (optional)
  - [ ] Committed all migration changes
  - [ ] Created migration commit message
  - [ ] Tagged release with migration version
  - [ ] Pushed to remote repository

- [ ] **Archive old code** (optional)
  - [ ] Old `client/`, `server/`, `api/` backed up
  - [ ] Added to `.gitignore` if keeping
  - [ ] Or removed entirely after verification

**Verify final state:**
```bash
git status
ls -la | grep -v node_modules
pnpm list --depth=0
```

## Post-Migration

- [ ] **Monitor production**
  - [ ] Check error tracking (Sentry, etc.)
  - [ ] Monitor performance metrics
  - [ ] Watch for unusual patterns

- [ ] **Team follow-up**
  - [ ] Updated development guidelines
  - [ ] Created onboarding docs for new structure
  - [ ] Team trained on new workflow

- [ ] **Future improvements**
  - [ ] Add more shared packages as needed
  - [ ] Set up CI/CD automation
  - [ ] Implement Turborepo caching
  - [ ] Add pre-commit hooks

## Troubleshooting Checklist

If you encounter issues, check:

- [ ] **Installation issues**
  - [ ] Node.js version correct?
  - [ ] pnpm version correct?
  - [ ] All dependencies installed? (`pnpm install`)
  - [ ] Lock file updated? (`pnpm-lock.yaml`)

- [ ] **Import resolution**
  - [ ] TypeScript paths correct in `tsconfig.json`?
  - [ ] Shared package exports work?
  - [ ] IDE recognizes workspace packages?

- [ ] **Build issues**
  - [ ] Old `dist/` directories removed?
  - [ ] TypeScript compilation clean?
  - [ ] All files use correct extensions (`.ts`/`.tsx`)?

- [ ] **Runtime issues**
  - [ ] Environment variables loaded?
  - [ ] API keys configured?
  - [ ] CORS headers correct?
  - [ ] Database connections working?

- [ ] **Performance issues**
  - [ ] Node modules too large?
  - [ ] Build cache enabled?
  - [ ] Unused dependencies removed?

## Sign-Off

- [ ] **Developer:** __________________ **Date:** __________
- [ ] **Reviewer:** __________________ **Date:** __________
- [ ] **Approved for production:** __________________ **Date:** __________

## Notes

Use this space to document any issues encountered or special configurations:

```
Notes:
- 
- 
- 
```

---

**Checklist Version:** 1.0.0
**Last Updated:** 2024
**Status:** Ready for Use
