#!/usr/bin/env python3
"""
Monorepo File Migration Script
Copy client/, server/, dan public/ ke apps/web/src/, apps/web/server/, apps/web/public/
"""

import os
import shutil
from pathlib import Path
from typing import Tuple, List

def copy_tree(src: Path, dst: Path, exclude_dirs: set = None) -> Tuple[int, List[str]]:
    """Copy directory tree, return (count, errors)"""
    if exclude_dirs is None:
        exclude_dirs = {".git", ".venv", "node_modules", "dist", ".next"}
    
    count = 0
    errors = []
    
    if not src.exists():
        return 0, [f"Source not found: {src}"]
    
    # Create destination
    dst.mkdir(parents=True, exist_ok=True)
    
    for item in src.iterdir():
        # Skip excluded directories
        if item.is_dir() and item.name in exclude_dirs:
            continue
        
        src_path = item
        dst_path = dst / item.name
        
        try:
            if item.is_dir():
                count += copy_tree(src_path, dst_path, exclude_dirs)[0]
            else:
                shutil.copy2(src_path, dst_path)
                count += 1
                print(f"  ✓ {dst_path.relative_to(Path.cwd())}")
        except Exception as e:
            errors.append(f"Error copying {src_path}: {e}")
    
    return count, errors

def main():
    root = Path(".")
    
    print("🚀 Monorepo File Migration")
    print("=" * 60)
    
    # Step 1: client/ → apps/web/src/
    print("\n📂 Step 1: Copying client/ → apps/web/src/")
    src = root / "client"
    dst = root / "apps/web/src"
    
    if src.exists():
        count, errors = copy_tree(src, dst, exclude_dirs={".git", "node_modules"})
        print(f"✅ Copied {count} files")
        if errors:
            for e in errors:
                print(f"  ⚠️  {e}")
    else:
        print(f"❌ Source not found: {src}")
    
    # Step 2: server/ → apps/web/server/
    print("\n📂 Step 2: Copying server/ → apps/web/server/")
    src = root / "server"
    dst = root / "apps/web/server"
    
    if src.exists():
        count, errors = copy_tree(src, dst, exclude_dirs={".git", "node_modules"})
        print(f"✅ Copied {count} files")
        if errors:
            for e in errors:
                print(f"  ⚠️  {e}")
    else:
        print(f"❌ Source not found: {src}")
    
    # Step 3: public/ → apps/web/public/
    print("\n📂 Step 3: Copying public/ → apps/web/public/")
    src = root / "public"
    dst = root / "apps/web/public"
    
    if src.exists():
        count, errors = copy_tree(src, dst, exclude_dirs={".git", "node_modules"})
        print(f"✅ Copied {count} files")
        if errors:
            for e in errors:
                print(f"  ⚠️  {e}")
    else:
        print(f"⚠️  Source not found: {src}")
    
    # Verify critical files
    print("\n🔍 Step 4: Verifying critical files")
    critical_files = [
        "apps/web/src/App.tsx",
        "apps/web/src/pages/Index.tsx",
        "apps/web/server/index.ts",
        "apps/web/src/global.css",
    ]
    
    all_good = True
    for file_path in critical_files:
        p = root / file_path
        if p.exists():
            print(f"  ✅ {file_path}")
        else:
            print(f"  ❌ {file_path} NOT FOUND")
            all_good = False
    
    print("\n" + "=" * 60)
    if all_good:
        print("✨ Migration complete!")
        print("\nNext steps:")
        print("  1. cd apps/web")
        print("  2. pnpm install")
        print("  3. pnpm dev")
        print("  4. Test all features work")
        print("  5. Optionally delete: client/, server/, api/, public/")
    else:
        print("⚠️  Some files are missing. Check above.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
