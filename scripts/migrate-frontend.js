#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const ignore = require('ignore');

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
const webDir = path.join(rootDir, 'apps', 'web');

let copiedFiles = 0;
let skippedFiles = 0;

function shouldIgnore(filePath) {
  const ignoredPatterns = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.env',
    '.env.local',
    '.DS_Store',
    '*.log',
  ];

  return ignoredPatterns.some(pattern => {
    if (pattern.includes('/')) {
      return filePath.includes(pattern);
    }
    return path.basename(filePath) === pattern || path.basename(filePath).endsWith(pattern.replace('*', ''));
  });
}

async function copyDirRecursive(src, dest, excludePaths = []) {
  try {
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      // Skip excluded directories
      if (excludePaths.some(excl => entry.name === excl)) {
        skippedFiles++;
        continue;
      }

      if (shouldIgnore(entry.name)) {
        skippedFiles++;
        continue;
      }

      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await fs.ensureDir(destPath);
        await copyDirRecursive(srcPath, destPath, excludePaths);
      } else {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(srcPath, destPath);
        copiedFiles++;
      }
    }
  } catch (err) {
    log('❌', `Error copying directory ${src}: ${err.message}`, COLORS.red);
    throw err;
  }
}

async function migrateFrontend() {
  try {
    log('🚀', 'Starting frontend migration...', COLORS.blue);

    // Create web directory structure
    await fs.ensureDir(path.join(webDir, 'src'));
    await fs.ensureDir(path.join(webDir, 'public'));
    log('✅', 'Created apps/web directory structure');

    // Copy client/src to apps/web/src (exclude types and utils which are in shared)
    const srcDir = path.join(clientDir);
    const srcDestDir = path.join(webDir, 'src');

    log('📋', 'Copying client source code...');
    const entries = await fs.readdir(clientDir, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(clientDir, entry.name);
      const destPath = path.join(webDir, entry.name);

      // Skip types and utils as they're handled by shared
      if (entry.name === 'types' || entry.name === 'lib') {
        log('⏭️', `Skipping ${entry.name} (handled by shared package)`);
        continue;
      }

      if (entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }

      if (entry.isDirectory()) {
        await fs.ensureDir(destPath);
        await copyDirRecursive(sourcePath, destPath);
      } else {
        await fs.copy(sourcePath, destPath);
        copiedFiles++;
      }
    }

    // Copy public folder
    const publicSrc = path.join(clientDir, 'public');
    if (await fs.pathExists(publicSrc)) {
      const publicDest = path.join(webDir, 'public');
      await fs.ensureDir(publicDest);
      await copyDirRecursive(publicSrc, publicDest);
      log('✅', 'Copied public folder');
    }

    // Copy index.html
    const indexHtmlSrc = path.join(clientDir, 'index.html');
    if (await fs.pathExists(indexHtmlSrc)) {
      const indexHtmlDest = path.join(webDir, 'index.html');
      await fs.copy(indexHtmlSrc, indexHtmlDest);
      log('✅', 'Copied index.html');
      copiedFiles++;
    }

    // Copy config files
    const configFiles = [
      'vite.config.ts',
      'tsconfig.json',
      'global.css',
      'vite-env.d.ts',
    ];

    for (const file of configFiles) {
      const srcPath = path.join(clientDir, file);
      if (await fs.pathExists(srcPath)) {
        const destPath = path.join(webDir, file);
        await fs.copy(srcPath, destPath);
        log('✅', `Copied ${file}`);
        copiedFiles++;
      }
    }

    log('🎉', `Frontend migration complete: ${copiedFiles} files copied, ${skippedFiles} files skipped`, COLORS.green);
  } catch (error) {
    log('❌', `Fatal error: ${error.message}`, COLORS.red);
    process.exit(1);
  }
}

migrateFrontend();
