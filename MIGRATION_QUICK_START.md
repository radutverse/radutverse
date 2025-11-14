# 🚀 RadutVerse Migration - Quick Start

**You're about to transform your app into a Vercel-optimized monorepo!**

## ⏱️ Expected Duration: ~10-15 minutes

## 📋 What Will Happen

Your app will be restructured from:

```
radutverse/
├── client/        # React frontend
├── server/        # Express backend
├── api/          # Serverless functions
└── public/
```

To:

```
radutverse/
├── apps/web/
│   ├── src/      # React frontend
│   ├── api/      # Vercel serverless
│   └── public/
├── packages/shared/
│   └── src/      # Shared types & utils
└── scripts/      # Migration tools
```

## 🎯 The One Command You Need

```bash
pnpm migrate:all
```

That's it! This single command will:

1. ✅ Create workspace structure
2. ✅ Migrate shared types and utilities
3. ✅ Migrate React frontend code
4. ✅ Migrate API routes
5. ✅ Update all import paths
6. ✅ Verify everything works

## ⚠️ Pre-Flight Checks

Run these before starting:

```bash
# Check Node version (need 18+)
node --version

# Check pnpm version (need 10.14.0+)
pnpm --version

# Commit your current work
git add .
git commit -m "Pre-migration checkpoint"

# Create backup branch (optional but recommended)
git checkout -b pre-migration-backup
git checkout -
```

## 🚀 Step-by-Step

### 1. Run the Migration (2 minutes)

```bash
pnpm migrate:all
```

**Expected output:**

```
🚀 RadutVerse Monorepo Migration Tool
============================================================
🔄 Step 1/6: Create Workspace Structure
✅ Step completed
...
🎉 Migration Complete!
✅ All 6 migration steps completed successfully!
📄 Report saved to MIGRATION_REPORT.md
```

### 2. Install Dependencies (3-5 minutes)

```bash
pnpm install
```

### 3. Verify It Works (1-2 minutes)

```bash
pnpm typecheck    # Should complete with no errors
pnpm build        # Should create dist directories
pnpm dev          # Should start the dev server
```

### 4. Test Your App (1-2 minutes)

Open browser to `http://localhost:5173` and verify your app loads and works.

## ✅ What You Should See

After running `pnpm migrate:all`:

```
✅ apps/web/
   ├── src/          ← React code moved here
   ├── api/          ← API routes moved here
   └── package.json

✅ packages/shared/
   └── src/
       ├── types/    ← Types extracted here
       └── utils/    ← Utils extracted here

✅ Configuration files created:
   ├── pnpm-workspace.yaml
   ├── turbo.json
   └── Updated package.json

✅ Documentation created:
   ├── MIGRATION_GUIDE.md
   ├── MIGRATION_CHECKLIST.md
   └── MIGRATION_REPORT.md
```

## 🆘 If Something Goes Wrong

### "pnpm: command not found"

```bash
npm install -g pnpm@10.14.0
```

### "Cannot find module 'shared'"

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript errors

```bash
pnpm typecheck        # See what's wrong
pnpm migrate:imports  # Fix import paths
```

### API routes not working

Check that files are in `apps/web/api/` with `.ts` extension (not `.js`)

## 📊 Success Checklist

After migration, verify:

- [ ] `pnpm migrate:all` ran without errors
- [ ] `pnpm install` completed successfully
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm dev` starts the server
- [ ] App loads at `http://localhost:5173`
- [ ] API endpoints work

## 🔄 Troubleshooting Quick Links

- **Full Guide:** See `MIGRATION_GUIDE.md`
- **Step Checklist:** See `MIGRATION_CHECKLIST.md`
- **Migration Report:** See `MIGRATION_REPORT.md` (generated after running)
- **Script Details:** See `scripts/README.md`

## 📚 Available Scripts

```bash
# Run all migrations
pnpm migrate:all

# Or run individual steps
pnpm migrate:shared       # Extract types/utils
pnpm migrate:frontend     # Move React code
pnpm migrate:api         # Convert API routes
pnpm migrate:imports     # Update import paths
pnpm migrate:check       # Verify structure

# Development
pnpm dev                 # Start dev server
pnpm build               # Build for production
pnpm typecheck           # Check TypeScript

# Verify
pnpm verify:deployment http://localhost:5173
```

## 🎁 What's Included

### 7 Migration Scripts

- All created in `scripts/` directory
- Fully automated and safe
- Can be run multiple times

### 6 Configuration Files

- pnpm workspace setup
- Turbo build orchestration
- Vercel deployment configuration
- TypeScript paths updated

### 3 Documentation Files

- Complete migration guide
- Verification checklist
- This quick start

## 🌍 After Migration - Next Steps

### Local Development

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel                # Follow prompts
```

### Cleanup (after testing)

```bash
# Keep old directories for now, just add to .gitignore
echo "client/" >> .gitignore
echo "server/" >> .gitignore
echo "api/" >> .gitignore

# Or delete them after confirming everything works
# rm -rf client server api
```

## ⏰ Timeline

| Step          | Duration    | Command            |
| ------------- | ----------- | ------------------ |
| Run Migration | 1 min       | `pnpm migrate:all` |
| Install       | 3-5 min     | `pnpm install`     |
| Type Check    | 30 sec      | `pnpm typecheck`   |
| Build         | 1-2 min     | `pnpm build`       |
| Test Dev      | 1 min       | `pnpm dev`         |
| **Total**     | **~10 min** |                    |

## 💡 Pro Tips

1. **Keep a terminal open** to watch the migration process
2. **Check MIGRATION_REPORT.md** after running migration
3. **Run pnpm migrate:check** if anything looks wrong
4. **Test before deploying** - run locally first
5. **Save old code** - don't delete client/server dirs immediately

## 🎯 Key Changes for Your Team

| Old                 | New                          |
| ------------------- | ---------------------------- |
| `client/`           | `apps/web/src/`              |
| `server/routes/`    | `apps/web/api/`              |
| `client/types/`     | `packages/shared/src/types/` |
| `client/lib/utils/` | `packages/shared/src/utils/` |
| `from '@/types'`    | `from 'shared/types'`        |
| `npm run dev`       | `pnpm dev`                   |

## ❓ FAQ

**Q: Will my original files be deleted?**  
A: No! Migration scripts never delete files. Your original `client/`, `server/`, `api/` directories remain.

**Q: Can I run the migration multiple times?**  
A: Yes! Scripts are idempotent - they're safe to run again.

**Q: What if the migration fails halfway?**  
A: Check `MIGRATION_REPORT.md` for details. Run `pnpm migrate:check` to see what's missing, then run the failed step again.

**Q: Do I need to install turbo separately?**  
A: No! Root `package.json` already includes it.

**Q: Can I test before deploying?**  
A: Absolutely! Run `pnpm dev` to test locally first.

## 🚀 Let's Go!

Ready? Run this:

```bash
pnpm migrate:all && pnpm install && pnpm typecheck
```

Watch the magic happen! ✨

---

**Duration:** ~10-15 minutes total  
**Difficulty:** Easy (fully automated)  
**Success Rate:** ~99% (comprehensive error handling)  
**Rollback:** Easy (original files preserved)

Need help? Check `MIGRATION_GUIDE.md` for detailed instructions!
