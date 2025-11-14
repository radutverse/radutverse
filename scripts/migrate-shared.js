#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = (emoji, message, color = COLORS.reset) => {
  console.log(`${emoji} ${color}${message}${COLORS.reset}`);
};

const rootDir = path.resolve(__dirname, '..');
const clientDir = path.join(rootDir, 'client');
const sharedDir = path.join(rootDir, 'packages', 'shared', 'src');

let copiedFiles = 0;
let errorCount = 0;

async function migrateShared() {
  try {
    log('🚀', 'Starting shared types and utilities migration...', COLORS.blue);

    // Create shared directory structure
    await fs.ensureDir(path.join(sharedDir, 'types'));
    await fs.ensureDir(path.join(sharedDir, 'utils'));
    await fs.ensureDir(path.join(sharedDir, 'constants'));
    await fs.ensureDir(path.join(sharedDir, 'schemas'));
    log('✅', 'Created shared directory structure');

    // Migrate types
    const typesSource = path.join(clientDir, 'types');
    if (await fs.pathExists(typesSource)) {
      const typeFiles = await fs.readdir(typesSource);
      for (const file of typeFiles) {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const source = path.join(typesSource, file);
          const dest = path.join(sharedDir, 'types', file);
          try {
            await fs.copy(source, dest);
            log('✅', `Copied types: ${file}`);
            copiedFiles++;
          } catch (err) {
            log('❌', `Failed to copy ${file}: ${err.message}`);
            errorCount++;
          }
        }
      }
    }

    // Migrate utilities
    const utilsSource = path.join(clientDir, 'lib', 'utils');
    if (await fs.pathExists(utilsSource)) {
      const utilFiles = await fs.readdir(utilsSource);
      for (const file of utilFiles) {
        if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.test.ts')) {
          const source = path.join(utilsSource, file);
          const dest = path.join(sharedDir, 'utils', file);
          try {
            await fs.copy(source, dest);
            log('✅', `Copied utils: ${file}`);
            copiedFiles++;
          } catch (err) {
            log('❌', `Failed to copy ${file}: ${err.message}`);
            errorCount++;
          }
        }
      }
    }

    // Migrate main utils file
    const mainUtilsSource = path.join(clientDir, 'lib', 'utils.ts');
    if (await fs.pathExists(mainUtilsSource)) {
      const mainUtilsDest = path.join(sharedDir, 'utils', 'index.ts');
      try {
        await fs.copy(mainUtilsSource, mainUtilsDest);
        log('✅', 'Copied main utils.ts as utils/index.ts');
        copiedFiles++;
      } catch (err) {
        log('❌', `Failed to copy main utils.ts: ${err.message}`);
        errorCount++;
      }
    }

    // Migrate constants
    const constantsSource = path.join(clientDir, 'lib', 'ip-assistant', 'constants.ts');
    if (await fs.pathExists(constantsSource)) {
      const constantsDest = path.join(sharedDir, 'constants', 'ip-assistant.ts');
      try {
        await fs.copy(constantsSource, constantsDest);
        log('✅', 'Copied IP Assistant constants');
        copiedFiles++;
      } catch (err) {
        log('❌', `Failed to copy constants: ${err.message}`);
        errorCount++;
      }
    }

    // Create index.ts that exports everything
    let indexContent = '// Shared exports\n\n';

    // Export types
    const typesDir = path.join(sharedDir, 'types');
    if (await fs.pathExists(typesDir)) {
      const typeFiles = await fs.readdir(typesDir);
      typeFiles.forEach(file => {
        if (file.endsWith('.ts') && file !== 'index.ts') {
          const name = file.replace('.ts', '');
          indexContent += `export * from './types/${name}';\n`;
        }
      });
    }

    // Export utils
    const utilsDir = path.join(sharedDir, 'utils');
    if (await fs.pathExists(utilsDir)) {
      const utilFiles = await fs.readdir(utilsDir);
      utilFiles.forEach(file => {
        if (file.endsWith('.ts') && file !== 'index.ts') {
          const name = file.replace('.ts', '');
          indexContent += `export * from './utils/${name}';\n`;
        }
      });
    }

    // Export constants
    const constantsDir = path.join(sharedDir, 'constants');
    if (await fs.pathExists(constantsDir)) {
      const constFiles = await fs.readdir(constantsDir);
      constFiles.forEach(file => {
        if (file.endsWith('.ts')) {
          const name = file.replace('.ts', '');
          indexContent += `export * from './constants/${name}';\n`;
        }
      });
    }

    const indexPath = path.join(sharedDir, 'index.ts');
    await fs.writeFile(indexPath, indexContent, 'utf-8');
    log('✅', 'Generated shared/src/index.ts with all exports');

    log('🎉', `Migration complete: ${copiedFiles} files copied`, COLORS.green);
    if (errorCount > 0) {
      log('⚠️', `Encountered ${errorCount} errors during migration`, COLORS.yellow);
      process.exit(1);
    }
  } catch (error) {
    log('❌', `Fatal error: ${error.message}`, COLORS.red);
    process.exit(1);
  }
}

migrateShared();
