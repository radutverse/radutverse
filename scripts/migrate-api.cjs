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
const serverDir = path.join(rootDir, "server");
const apiDir = path.join(rootDir, "apps", "web", "api");

let convertedFiles = 0;
let copiedFiles = 0;
let errorCount = 0;

async function migrateAPI() {
  try {
    log("🚀", "Starting API migration...", COLORS.blue);

    await fs.ensureDir(path.join(apiDir, "_lib", "services"));
    await fs.ensureDir(path.join(apiDir, "_lib", "middleware"));
    await fs.ensureDir(path.join(apiDir, "_lib", "utils"));
    log("✅", "Created apps/web/api directory structure");

    const routesDir = path.join(serverDir, "routes");
    if (await fs.pathExists(routesDir)) {
      const files = await fs.readdir(routesDir);

      for (const file of files) {
        const routePath = path.join(routesDir, file);
        const stats = await fs.stat(routePath);

        if (!stats.isFile()) continue;
        if (!file.endsWith(".ts")) continue;

        try {
          log("📝", `Converting ${file}...`);

          const originalContent = await fs.readFile(routePath, "utf-8");
          const destPath = path.join(apiDir, file);

          await fs.writeFile(destPath, originalContent, "utf-8");
          log("✅", `Converted and copied ${file}`);
          convertedFiles++;
        } catch (err) {
          log("❌", `Failed to convert ${file}: ${err.message}`);
          errorCount++;
        }
      }
    }

    const serverUtilsDir = path.join(serverDir, "utils");
    if (await fs.pathExists(serverUtilsDir)) {
      const libUtilsDir = path.join(apiDir, "_lib", "utils");
      const files = await fs.readdir(serverUtilsDir);

      for (const file of files) {
        if (
          file.endsWith(".ts") ||
          file.endsWith(".js") ||
          file.endsWith(".json")
        ) {
          try {
            const src = path.join(serverUtilsDir, file);
            const dest = path.join(libUtilsDir, file);
            await fs.copy(src, dest);
            log("✅", `Copied utility: ${file}`);
            copiedFiles++;
          } catch (err) {
            log("❌", `Failed to copy utility ${file}: ${err.message}`);
            errorCount++;
          }
        }
      }
    }

    const serverDataDir = path.join(serverDir, "data");
    if (await fs.pathExists(serverDataDir)) {
      const apiDataDir = path.join(apiDir, "_lib", "data");
      await fs.copy(serverDataDir, apiDataDir);
      log("✅", "Copied server/data directory");
    }

    const vercelIndexPath = path.join(apiDir, "_lib", "index.ts");
    const indexContent = `// API shared utilities and middleware exports
export * from './utils/index';
`;
    await fs.writeFile(vercelIndexPath, indexContent, "utf-8");
    log("✅", "Created api/_lib/index.ts");

    log(
      "🎉",
      `API migration complete: ${convertedFiles} routes converted, ${copiedFiles} utilities copied`,
      COLORS.green,
    );
    if (errorCount > 0) {
      log(
        "⚠️",
        `Encountered ${errorCount} errors during API migration`,
        COLORS.yellow,
      );
      process.exit(1);
    }
  } catch (error) {
    log("❌", `Fatal error: ${error.message}`, COLORS.red);
    process.exit(1);
  }
}

migrateAPI();
