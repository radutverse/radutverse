# Phase 5: File Migration & Validation

## Status: Ready to Execute

Struktur monorepo sudah disiapkan. Sekarang saatnya melakukan file migration dan validasi.

## Quick Start (Automated)

### Option 1: Run Migration Script (Recommended)

```bash
# Dari root directory
bash scripts/migrate-to-monorepo.sh
```

Script ini akan:

1. ✅ Copy client/ → apps/web/src/
2. ✅ Copy server/ → apps/web/server/
3. ✅ Copy public/ → apps/web/public/
4. ✅ Verify critical files exist
5. ✅ Provide next steps

### Option 2: Manual Migration

Jika script tidak bisa dijalankan, ikuti steps di **MIGRATION_GUIDE.md**

## After Migration

### Step 1: Verify Structure

```bash
# Check structure is correct
ls -la apps/web/src/    # Should have App.tsx, pages/, components/, etc
ls -la apps/web/server/ # Should have index.ts, routes/, etc
```

### Step 2: Install Dependencies

```bash
# Dari root
pnpm install

# Or specifically in apps/web
cd apps/web
pnpm install
```

### Step 3: Test Development Server

```bash
# Dari root
pnpm dev

# Atau dari apps/web
cd apps/web
pnpm dev
```

**Expected output:**

```
  ➜  Local:   http://localhost:8080/
  ➜  press h to show help
```

### Step 4: Test Build

```bash
# Dari root
pnpm build

# Atau dari apps/web
cd apps/web
pnpm build
```

**Expected output:**

```
✓ 1234 modules transformed
✓ built in 45.23s

dist/spa/index.html
dist/spa/assets/index-xxx.js
dist/server/node-build.mjs
```

## Validation Checklist

- [ ] Migration script ran without errors
- [ ] `pnpm install` succeeds
- [ ] `pnpm dev` starts dev server on port 8080
- [ ] Dev server hot-reload works
- [ ] `pnpm build` completes successfully
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] All routes accessible (/, /ip-imagine, /ipfi-assistant, etc.)
- [ ] API endpoints respond (/api/\*)
- [ ] Environment variables loaded correctly

## Troubleshooting

### "client/ directory not found"

- This is expected if you already moved files manually
- Check that files are in apps/web/src/

### "pnpm install fails"

```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### "Port 8080 already in use"

```bash
# Kill process on port 8080
lsof -i :8080
kill -9 <PID>

# Or use different port
cd apps/web && pnpm dev -- --port 8081
```

### "TypeScript errors"

- Files might not be in right location
- Imports might need updating (@shared paths)
- Run `pnpm typecheck` for details

### "Build fails"

1. Check all files were copied
2. Verify vercel.json config
3. Check environment variables
4. Review build error output

## Import Path Updates

After migration, some imports might need updating:

### Files that use crypto/hash utilities

Old:

```typescript
import { keccakOfJson } from "@/lib/utils/crypto";
import { calculateBlobHash } from "@/lib/utils/hash";
```

New:

```typescript
import { keccakOfJson } from "@shared/utils/crypto";
import { calculateBlobHash } from "@shared/utils/hash";
```

### Files that use cn() utility

Old:

```typescript
import { cn } from "@/lib/utils";
```

Can stay same OR update to:

```typescript
import { cn } from "@shared/utils";
```

### Files that use generation types

Old:

```typescript
import type { Generation } from "@/types/generation";
```

Can stay same (types are copied to apps/web/src/types) OR update to:

```typescript
import type { Generation } from "@shared/types";
```

**Note:** Automatic import replacement:

```bash
# Find all files that need import updates
grep -r "@/lib/utils/crypto" apps/web/src/
grep -r "@/lib/utils/hash" apps/web/src/

# Or use find & replace in your editor:
# Find: import \{ (.*) \} from "@/lib/utils/crypto"
# Replace: import { $1 } from "@shared/utils/crypto"
```

## Cleanup (After Validation)

Setelah semua test berhasil, hapus old directories:

```bash
# ONLY after everything works!
rm -rf client/
rm -rf server/
rm -rf api/
rm -rf shared/
rm -rf netlify/
rm -rf netlify.toml
rm -rf node_modules/.bin/old-*
```

Or keep them for backup:

```bash
mkdir old-structure
mv client old-structure/
mv server old-structure/
```

## Final Verification

```bash
# Test everything works together
pnpm install  # Install all deps
pnpm build    # Full production build
pnpm dev      # Dev server
```

## Deployment to Vercel

After validation:

1. Push to git:

```bash
git add .
git commit -m "feat: migrate to monorepo structure with Vercel"
git push origin main
```

2. Deploy to Vercel:
   - Connect repo to Vercel
   - Set Root Directory to: `apps/web`
   - Build Command: `pnpm run build`
   - Output Directory: `dist/spa`
   - Set Environment Variables in Vercel Dashboard

3. Verify in Vercel:
   - Preview deployment works
   - API routes respond
   - Frontend loads

## Summary

- **Phases 1-4**: ✅ Complete (Monorepo structure setup)
- **Phase 5**: 🚀 In Progress (File migration & validation)
  - Run: `bash scripts/migrate-to-monorepo.sh`
  - Test: `pnpm dev` and `pnpm build`
  - Validate: Check all features work
  - Deploy: Push to Vercel

---

**Next**: Run the migration script and report results!
