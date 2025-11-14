#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");

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
let checksPassed = 0;
let checksFailed = 0;

async function checkDirectoryExists(dirPath, description) {
  try {
    const fullPath = path.join(rootDir, dirPath);
    if (await fs.pathExists(fullPath)) {
      log("✅", `${description} exists at ${dirPath}`);
      checksPassed++;
      return true;
    } else {
      log("❌", `${description} missing at ${dirPath}`);
      checksFailed++;
      return false;
    }
  } catch (error) {
    log("❌", `Error checking ${dirPath}: ${error.message}`);
    checksFailed++;
    return false;
  }
}

async function checkFileExists(filePath, description) {
  try {
    const fullPath = path.join(rootDir, filePath);
    if (await fs.pathExists(fullPath)) {
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        log("✅", `${description} exists at ${filePath}`);
        checksPassed++;
        return true;
      }
    }
    log("❌", `${description} missing at ${filePath}`);
    checksFailed++;
    return false;
  } catch (error) {
    log("❌", `Error checking ${filePath}: ${error.message}`);
    checksFailed++;
    return false;
  }
}

async function checkDirectoryHasFiles(dirPath, filePattern, description) {
  try {
    const fullPath = path.join(rootDir, dirPath);
    if (!(await fs.pathExists(fullPath))) {
      log("⚠️", `${description}: Directory doesn't exist at ${dirPath}`);
      return false;
    }

    const files = await fs.readdir(fullPath);
    const matchingFiles = files.filter((f) => {
      if (filePattern instanceof RegExp) {
        return filePattern.test(f);
      }
      return f.endsWith(filePattern);
    });

    if (matchingFiles.length > 0) {
      log("✅", `${description}: Found ${matchingFiles.length} files`);
      checksPassed++;
      return true;
    } else {
      log("⚠️", `${description}: No files matching pattern found`);
      return false;
    }
  } catch (error) {
    log("❌", `Error checking ${dirPath}: ${error.message}`);
    checksFailed++;
    return false;
  }
}

async function checkPackageManager() {
  try {
    log("📦", "Checking package manager...");

    try {
      const version = execSync("pnpm --version", { encoding: "utf-8" }).trim();
      log("✅", `pnpm is installed (version ${version})`);
      checksPassed++;
      return true;
    } catch (error) {
      log("⚠️", "pnpm not found, checking npm instead");
      try {
        const version = execSync("npm --version", { encoding: "utf-8" }).trim();
        log("⚠️", `pnpm not found, but npm is available (version ${version})`);
        return true;
      } catch (err) {
        log("❌", "Neither pnpm nor npm found");
        checksFailed++;
        return false;
      }
    }
  } catch (error) {
    log("❌", `Package manager check failed: ${error.message}`);
    checksFailed++;
    return false;
  }
}

async function checkNodeVersion() {
  try {
    log("📋", "Checking Node.js version...");
    const nodeVersion = process.version;
    const majorMinorPatch = nodeVersion.slice(1).split(".");
    const major = parseInt(majorMinorPatch[0], 10);
    const minor = parseInt(majorMinorPatch[1], 10);
    const patch = parseInt(majorMinorPatch[2], 10);

    if (
      major > 18 ||
      (major === 18 && minor > 12) ||
      (major === 18 && minor === 12 && patch >= 0)
    ) {
      log("✅", `Node.js version ${nodeVersion} (required: >=18.12.0)`);
      checksPassed++;
      return true;
    } else {
      log(
        "❌",
        `Node.js version ${nodeVersion} is too old (required: >=18.12.0)`,
      );
      checksFailed++;
      return false;
    }
  } catch (error) {
    log("❌", `Error checking Node.js version: ${error.message}`);
    checksFailed++;
    return false;
  }
}

async function runMigrationChecks() {
  try {
    log("🚀", "Starting migration verification checks...", COLORS.blue);
    log("", "");

    log("📋", "Checking requirements...", COLORS.blue);
    await checkNodeVersion();
    await checkPackageManager();

    log("", "");
    log("📂", "Checking directory structure...", COLORS.blue);
    await checkDirectoryExists("apps", "apps directory");
    await checkDirectoryExists("apps/web", "apps/web directory");
    await checkDirectoryExists("apps/web/src", "apps/web/src directory");
    await checkDirectoryExists("apps/web/api", "apps/web/api directory");
    await checkDirectoryExists("packages", "packages directory");
    await checkDirectoryExists("packages/shared", "packages/shared directory");
    await checkDirectoryExists(
      "packages/shared/src",
      "packages/shared/src directory",
    );
    await checkDirectoryExists(
      "packages/shared/src/types",
      "packages/shared/src/types directory",
    );
    await checkDirectoryExists(
      "packages/shared/src/utils",
      "packages/shared/src/utils directory",
    );

    log("", "");
    log("📋", "Checking configuration files...", COLORS.blue);
    await checkFileExists("pnpm-workspace.yaml", "pnpm-workspace.yaml");
    await checkFileExists("turbo.json", "turbo.json");
    await checkFileExists("apps/web/package.json", "apps/web/package.json");
    await checkFileExists("apps/web/vercel.json", "apps/web/vercel.json");
    await checkFileExists(
      "packages/shared/package.json",
      "packages/shared/package.json",
    );

    log("", "");
    log("📄", "Checking shared package exports...", COLORS.blue);
    await checkFileExists(
      "packages/shared/src/index.ts",
      "packages/shared/src/index.ts",
    );

    log("", "");
    log("📂", "Checking source files...", COLORS.blue);
    await checkDirectoryHasFiles(
      "apps/web/src/components",
      /\.tsx?$/,
      "React components",
    );
    await checkDirectoryHasFiles("apps/web/src/pages", /\.tsx?$/, "Page files");

    log("", "");
    log("📄", "Checking API files...", COLORS.blue);
    await checkDirectoryHasFiles("apps/web/api", /\.ts$/, "API route files");

    log("", "");
    await checkPackageManager();

    log("", "");
    log("📊", `Migration Verification Summary:`, COLORS.blue);
    log("✅", `Checks passed: ${checksPassed}`, COLORS.green);
    if (checksFailed > 0) {
      log("❌", `Checks failed: ${checksFailed}`, COLORS.red);
    }

    if (checksFailed === 0) {
      log(
        "🎉",
        "All migration checks passed! Ready to proceed with installation.",
        COLORS.green,
      );
      process.exit(0);
    } else {
      log(
        "⚠️",
        `${checksFailed} checks failed. Please review and fix these issues.`,
        COLORS.yellow,
      );
      process.exit(1);
    }
  } catch (error) {
    log(
      "❌",
      `Fatal error during migration checks: ${error.message}`,
      COLORS.red,
    );
    process.exit(1);
  }
}

runMigrationChecks();
