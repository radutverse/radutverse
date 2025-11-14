#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

const log = (emoji, message, color = COLORS.reset) => {
  console.log(`${emoji} ${color}${message}${COLORS.reset}`);
};

const rootDir = path.resolve(__dirname, "..");
const reportPath = path.join(rootDir, "MIGRATION_REPORT.md");

let reportContent = `# RadutVerse Migration Report\n\n`;
reportContent += `Generated: ${new Date().toISOString()}\n\n`;
reportContent += `## Migration Summary\n\n`;

const steps = [
  {
    name: "Create Workspace Structure",
    description: "Setting up pnpm workspace directories and package structure",
    command: null,
    action: setupWorkspace,
  },
  {
    name: "Migrate Shared Package",
    description: "Copy types and utilities to packages/shared",
    command: "node scripts/migrate-shared.js",
    action: null,
  },
  {
    name: "Migrate Frontend",
    description: "Copy React code to apps/web",
    command: "node scripts/migrate-frontend.js",
    action: null,
  },
  {
    name: "Migrate API Routes",
    description: "Convert Express routes to Vercel serverless functions",
    command: "node scripts/migrate-api.js",
    action: null,
  },
  {
    name: "Update Import Paths",
    description: "Update all imports to use shared package",
    command: "node scripts/update-imports.js",
    action: null,
  },
  {
    name: "Verify Migration",
    description: "Check workspace structure and compilation",
    command: "node scripts/migration-check.js",
    action: null,
  },
];

let stepsCompleted = 0;
let stepsFailed = 0;

async function setupWorkspace() {
  try {
    log("📁", "Setting up workspace directories...");

    // Create apps directory
    await fs.ensureDir(path.join(rootDir, "apps", "web", "src"));
    await fs.ensureDir(
      path.join(rootDir, "apps", "web", "api", "_lib", "services"),
    );
    await fs.ensureDir(
      path.join(rootDir, "apps", "web", "api", "_lib", "middleware"),
    );

    // Create packages directory
    await fs.ensureDir(
      path.join(rootDir, "packages", "shared", "src", "types"),
    );
    await fs.ensureDir(
      path.join(rootDir, "packages", "shared", "src", "utils"),
    );
    await fs.ensureDir(
      path.join(rootDir, "packages", "shared", "src", "constants"),
    );
    await fs.ensureDir(
      path.join(rootDir, "packages", "shared", "src", "schemas"),
    );

    log("✅", "Workspace directories created");
    return true;
  } catch (error) {
    log("❌", `Workspace setup failed: ${error.message}`);
    return false;
  }
}

async function executeStep(step, stepNumber) {
  const totalSteps = steps.length;

  log("", "");
  log("═".repeat(60), "", COLORS.blue);
  log("🔄", `Step ${stepNumber}/${totalSteps}: ${step.name}`, COLORS.magenta);
  log("═".repeat(60), "", COLORS.blue);
  log("📝", step.description);
  log("", "");

  try {
    let success = false;

    if (step.action) {
      success = await step.action();
    } else if (step.command) {
      try {
        const output = execSync(step.command, {
          cwd: rootDir,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        success = true;
      } catch (error) {
        const errorOutput = error.stdout || error.stderr || error.message;
        log("❌", `Step failed: ${step.name}`);
        console.error(errorOutput);
        throw error;
      }
    }

    if (success) {
      log("✅", `Step completed: ${step.name}`, COLORS.green);
      stepsCompleted++;
      reportContent += `### ✅ ${step.name}\n`;
      reportContent += `- Status: SUCCESS\n`;
      reportContent += `- Timestamp: ${new Date().toISOString()}\n\n`;
    } else {
      log("❌", `Step failed: ${step.name}`, COLORS.red);
      stepsFailed++;
      reportContent += `### ❌ ${step.name}\n`;
      reportContent += `- Status: FAILED\n`;
      reportContent += `- Timestamp: ${new Date().toISOString()}\n\n`;
      throw new Error(`Step failed: ${step.name}`);
    }

    return success;
  } catch (error) {
    log("❌", `Error in step ${stepNumber}: ${error.message}`, COLORS.red);
    stepsFailed++;
    reportContent += `### ❌ ${step.name}\n`;
    reportContent += `- Status: FAILED\n`;
    reportContent += `- Error: ${error.message}\n`;
    reportContent += `- Timestamp: ${new Date().toISOString()}\n\n`;
    throw error;
  }
}

async function runAllMigrations() {
  try {
    log("", "");
    log("🚀", "RadutVerse Monorepo Migration Tool", COLORS.magenta);
    log("═".repeat(60), "", COLORS.blue);
    log("", "");

    for (let i = 0; i < steps.length; i++) {
      const stepNumber = i + 1;
      try {
        await executeStep(steps[i], stepNumber);
      } catch (error) {
        log("", "");
        log(
          "⚠️",
          `Migration paused at step ${stepNumber}. Fix the issue and run the failed step again.`,
          COLORS.yellow,
        );
        log("", "");
        reportContent += `\n## Migration Incomplete\n\n`;
        reportContent += `Migration paused at step ${stepNumber}: ${steps[i].name}\n\n`;
        reportContent += `Error: ${error.message}\n\n`;
        reportContent += `To resume, run:\n\`\`\`bash\n${steps[i].command || "node scripts/setup-workspace.js"}\n\`\`\`\n`;

        await fs.writeFile(reportPath, reportContent, "utf-8");
        log("📄", `Report saved to MIGRATION_REPORT.md`);
        process.exit(1);
      }
    }

    // Migration completed successfully
    log("", "");
    log("═".repeat(60), "", COLORS.green);
    log("🎉", "Migration Complete!", COLORS.green);
    log("═".repeat(60), "", COLORS.green);
    log("", "");
    log("✅", `All ${stepsCompleted} migration steps completed successfully!`);
    log("", "");

    // Add completion summary
    reportContent += `\n## Migration Complete\n\n`;
    reportContent += `All steps completed successfully!\n\n`;
    reportContent += `### Next Steps\n\n`;
    reportContent += `1. **Install dependencies:**\n`;
    reportContent += `   \`\`\`bash\n`;
    reportContent += `   pnpm install\n`;
    reportContent += `   \`\`\`\n\n`;
    reportContent += `2. **Start development:**\n`;
    reportContent += `   \`\`\`bash\n`;
    reportContent += `   pnpm dev\n`;
    reportContent += `   \`\`\`\n\n`;
    reportContent += `3. **Build for production:**\n`;
    reportContent += `   \`\`\`bash\n`;
    reportContent += `   pnpm build\n`;
    reportContent += `   \`\`\`\n\n`;
    reportContent += `4. **Deploy to Vercel:**\n`;
    reportContent += `   \`\`\`bash\n`;
    reportContent += `   vercel\n`;
    reportContent += `   \`\`\`\n\n`;

    reportContent += `### What Changed\n\n`;
    reportContent += `- Frontend code moved to \`apps/web/src\`\n`;
    reportContent += `- Shared types and utilities moved to \`packages/shared/src\`\n`;
    reportContent += `- API routes moved to \`apps/web/api\`\n`;
    reportContent += `- Import paths updated to use shared package\n`;
    reportContent += `- Monorepo workspace configured with pnpm and Turbo\n\n`;

    reportContent += `### Important Notes\n\n`;
    reportContent += `- All original files remain in place\n`;
    reportContent += `- Test thoroughly before deleting original directories\n`;
    reportContent += `- Update your CI/CD pipeline for the new structure\n`;
    reportContent += `- Check MIGRATION_GUIDE.md for detailed instructions\n`;

    // Save report
    await fs.writeFile(reportPath, reportContent, "utf-8");
    log("📄", `Migration report saved to MIGRATION_REPORT.md`);
    log("", "");

    log("📚", "For detailed instructions, see MIGRATION_GUIDE.md", COLORS.blue);
    log("✓", 'Run "pnpm install" to install dependencies', COLORS.blue);
    log("✓", 'Run "pnpm dev" to start the development server', COLORS.blue);

    process.exit(0);
  } catch (error) {
    log("❌", `Fatal error during migration: ${error.message}`, COLORS.red);

    // Save partial report
    reportContent += `\n## Migration Failed\n\n`;
    reportContent += `Error: ${error.message}\n`;
    reportContent += `Timestamp: ${new Date().toISOString()}\n`;

    try {
      await fs.writeFile(reportPath, reportContent, "utf-8");
    } catch (e) {
      // Ignore write errors
    }

    process.exit(1);
  }
}

// Make script executable and run
runAllMigrations();
