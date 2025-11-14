#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

const log = (emoji, message, color = COLORS.reset) => {
  console.log(`${emoji} ${color}${message}${COLORS.reset}`);
};

const rootDir = path.resolve(__dirname, "..");
const webSrcDir = path.join(rootDir, "apps", "web", "src");

let updatedFiles = 0;
let totalMatches = 0;
let errorCount = 0;

const importPatterns = [
  {
    pattern: /from\s+['"]@\/types\/?(['"];?)/g,
    replacement: "from 'shared/types$1",
    desc: "@/types imports",
  },
  {
    pattern: /from\s+['"]@\/lib\/utils\/?(['"];?)/g,
    replacement: "from 'shared/utils$1",
    desc: "@/lib/utils imports",
  },
  {
    pattern: /from\s+['"]@\/utils\/?(['"];?)/g,
    replacement: "from 'shared/utils$1",
    desc: "@/utils imports",
  },
  {
    pattern: /from\s+['"]\.\.\/\.\.\/types\/?(['"];?)/g,
    replacement: "from 'shared/types$1",
    desc: "../../types relative imports",
  },
  {
    pattern: /from\s+['"]\.\.\/types\/?(['"];?)/g,
    replacement: "from 'shared/types$1",
    desc: "../types relative imports",
  },
  {
    pattern: /from\s+['"]\.\.\/\.\.\/lib\/utils\/?(['"];?)/g,
    replacement: "from 'shared/utils$1",
    desc: "../../lib/utils relative imports",
  },
  {
    pattern: /from\s+['"]\.\.\/lib\/utils\/?(['"];?)/g,
    replacement: "from 'shared/utils$1",
    desc: "../lib/utils relative imports",
  },
  {
    pattern: /from\s+['"]\.\.\/\.\.\/utils\/?(['"];?)/g,
    replacement: "from 'shared/utils$1",
    desc: "../../../utils relative imports",
  },
  {
    pattern: /from\s+['"]\.\.\/utils\/?(['"];?)/g,
    replacement: "from 'shared/utils$1",
    desc: "../utils relative imports",
  },
  {
    pattern: /from\s+['"]@shared\//g,
    replacement: "from 'shared/",
    desc: "@shared/ imports (update to workspace reference)",
  },
];

async function updateImportsInFile(filePath) {
  try {
    let content = await fs.readFile(filePath, "utf-8");
    let matches = 0;

    for (const { pattern, replacement } of importPatterns) {
      const fileMatches = (content.match(pattern) || []).length;
      if (fileMatches > 0) {
        content = content.replace(pattern, replacement);
        matches += fileMatches;
      }
    }

    if (matches > 0) {
      await fs.writeFile(filePath, content, "utf-8");
      totalMatches += matches;
      return true;
    }

    return false;
  } catch (error) {
    log("❌", `Error updating file ${filePath}: ${error.message}`);
    errorCount++;
    return false;
  }
}

async function updateImports() {
  try {
    log("🚀", "Starting import path updates...", COLORS.blue);

    if (!(await fs.pathExists(webSrcDir))) {
      log(
        "⚠️",
        `apps/web/src does not exist yet. Run migrate-frontend.cjs first.`,
        COLORS.yellow,
      );
      process.exit(0);
    }

    async function findTsFiles(dir) {
      const files = [];
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (
          ["node_modules", "dist", ".git", ".next", "build"].includes(
            entry.name,
          )
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await findTsFiles(fullPath);
          files.push(...subFiles);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
        ) {
          files.push(fullPath);
        }
      }

      return files;
    }

    const tsFiles = await findTsFiles(webSrcDir);
    log("📋", `Found ${tsFiles.length} TypeScript files to process`);

    for (const file of tsFiles) {
      if (await updateImportsInFile(file)) {
        const relPath = path.relative(rootDir, file);
        log("✅", `Updated: ${relPath}`);
        updatedFiles++;
      }
    }

    const apiDir = path.join(rootDir, "apps", "web", "api");
    if (await fs.pathExists(apiDir)) {
      const apiFiles = await findTsFiles(apiDir);
      for (const file of apiFiles) {
        if (await updateImportsInFile(file)) {
          const relPath = path.relative(rootDir, file);
          log("✅", `Updated: ${relPath}`);
          updatedFiles++;
        }
      }
    }

    log(
      "🎉",
      `Import update complete: ${updatedFiles} files updated, ${totalMatches} total replacements made`,
      COLORS.green,
    );

    if (errorCount > 0) {
      log(
        "⚠️",
        `Encountered ${errorCount} errors during import updates`,
        COLORS.yellow,
      );
      process.exit(1);
    }
  } catch (error) {
    log("❌", `Fatal error: ${error.message}`, COLORS.red);
    process.exit(1);
  }
}

updateImports();
