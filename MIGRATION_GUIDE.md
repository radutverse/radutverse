# Migration Guide: Monorepo Structure

## Overview
Perubahan struktur dari single-app ke monorepo dengan Vercel deployment.

**Sebelum:**
```
client/          → Frontend React SPA
server/          → Express backend
shared/          → Shared types
api/             → Vercel serverless function
```

**Sesudah:**
```
apps/web/
├── src/         → Frontend React SPA (dari client/)
├── server/      → Express backend (dari server/)
├── api/         → Vercel serverless function
└── package.json → Web app workspace

packages/shared/
├── src/
│   ├── types/
│   ├── utils/
│   └── constants/
└── package.json → Shared package workspace
```

## Phase 5: File Reorganization

### Step 1: Backup Current Structure
```bash
# Jika belum, backup dulu:
git add .
git commit -m "backup: before monorepo migration"
```

### Step 2: Move client/ → apps/web/src/

Pindahkan semua file dari `client/` ke `apps/web/src/`:

**Files to move (156 files):**
- `client/App.tsx` → `apps/web/src/App.tsx`
- `client/components/` → `apps/web/src/components/`
- `client/pages/` → `apps/web/src/pages/`
- `client/hooks/` → `apps/web/src/hooks/`
- `client/lib/` → `apps/web/src/lib/`
- `client/config/` → `apps/web/src/config/`
- `client/context/` → `apps/web/src/context/`
- `client/features/` → `apps/web/src/features/`
- `client/services/` → `apps/web/src/services/`
- `client/types/` → `apps/web/src/types/` (atau pindah ke packages/shared)
- `client/global.css` → `apps/web/src/global.css`
- `client/vite-env.d.ts` → `apps/web/src/vite-env.d.ts`

**Automated approach menggunakan bash:**
```bash
#!/bin/bash
# Dari root directory
mkdir -p apps/web/src
cp -r client/* apps/web/src/
```

### Step 3: Move server/ → apps/web/server/

Pindahkan semua file dari `server/` ke `apps/web/server/`:

**Files to move (16 files):**
- `server/index.ts` → `apps/web/server/index.ts`
- `server/node-build.ts` → `apps/web/server/node-build.ts`
- `server/routes/` → `apps/web/server/routes/`
- `server/utils/` → `apps/web/server/utils/`
- `server/data/` → `apps/web/server/data/`

**Automated approach:**
```bash
#!/bin/bash
# Dari root directory
cp -r server/* apps/web/server/
```

### Step 4: Update Imports

Setelah file pindah, update import paths:

**Old paths → New paths:**

Dalam `apps/web/src/**/*.ts(x)`:
```typescript
// OLD
import { cn } from "@/lib/utils"; // ✓ still works (@ = apps/web/src)
import { keccakOfJson } from "@/lib/utils/crypto"; 
// Becomes
import { keccakOfJson } from "@shared/utils/crypto";

// OLD
import { Generation } from "@/types/generation";
// Becomes  
import { Generation } from "@shared/types";
```

**Key import patterns to search & replace:**

1. **Utils yang sudah di-extract ke @shared:**
   - `@/lib/utils/crypto` → `@shared/utils`
   - `@/lib/utils/hash` → `@shared/utils`
   - `@/lib/utils` yang export `cn()` → `@shared/utils`

2. **Types yang sudah di-extract ke @shared:**
   - `@/types/generation` → `@shared/types`

3. **Server imports (dalam apps/web/server):**
   - Import tetap menggunakan relative paths atau @ alias

### Step 5: Clean Up Old Directories

Setelah migrasi dan testing berhasil:
```bash
# Hapus old directories (setelah yakin tidak ada yang tertinggal):
rm -rf client/
rm -rf server/
rm -rf api/
rm -rf shared/  # jika ada
rm -rf netlify/functions/
```

### Step 6: Install Dependencies

```bash
# Di root atau apps/web:
pnpm install
```

### Step 7: Verify Build

```bash
# Test dari root:
pnpm build

# Atau dari apps/web:
cd apps/web
pnpm build
```

## Import Path Mapping

### In apps/web/tsconfig.json (sudah di-setup):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../../packages/shared/src/*"]
    }
  }
}
```

### In packages/shared/tsconfig.json (sudah di-setup):
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

## Vercel Deployment

### Configuration (sudah di-setup di apps/web/vercel.json):
- ✅ Build command: `pnpm run build`
- ✅ Output directory: `dist/spa`
- ✅ API routes: `api/index.ts` → Vercel Node functions
- ✅ SPA fallback: `/(.*) → /index.html`

### Environment Variables di Vercel:
Set di Vercel Dashboard:
```
STORY_API_KEY=***
OPENAI_API_KEY=***
VITE_GUEST_PRIVATE_KEY=***
VITE_PUBLIC_SPG_COLLECTION=0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc
VITE_PUBLIC_STORY_RPC=https://aeneid.storyrpc.io
VITE_PRIVY_APP_ID=***
PINATA_JWT=***
PINATA_GATEWAY=***
OPENAI_VERIFIER_MODEL=gpt-4o
OPENAI_ORGANIZATION=apil
```

## Testing Checklist

- [ ] Build succeeds: `pnpm build`
- [ ] Dev server runs: `pnpm dev`
- [ ] All imports resolve correctly
- [ ] API routes work
- [ ] No TypeScript errors
- [ ] All features work (IP Assistant, IP Imagine, etc.)
- [ ] Vercel preview deployment works

## Rollback

Jika ada masalah:
```bash
# Revert to previous commit
git reset --hard HEAD~1
```

## Notes

1. **Shared package tidak perlu di-publish**: karena `private: true` di package.json
2. **Build akan lebih cepat** di Vercel dengan monorepo structure
3. **Type checking lebih robust** dengan shared types
4. **Easier maintenance** dengan separation of concerns

---

**Status**: Ready for Phase 5 (File Migration & Validation)
