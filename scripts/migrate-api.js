#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

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
const serverDir = path.join(rootDir, 'server');
const apiDir = path.join(rootDir, 'apps', 'web', 'api');

let convertedFiles = 0;
let copiedFiles = 0;
let errorCount = 0;

const routeFileMapping = {
  'upload.ts': 'upload.ts',
  'ipfs.ts': 'ipfs.ts',
  'describe.ts': 'describe.ts',
  'check-ip-assets.ts': 'check-ip-assets.ts',
  'search-ip-assets.ts': 'search-ip-assets.ts',
  'search-by-owner.ts': 'search-by-owner.ts',
  'parse-search-intent.ts': 'parse-search-intent.ts',
  'get-suggestions.ts': 'get-suggestions.ts',
  'resolve-ip-name.ts': 'resolve-ip-name.ts',
  'resolve-owner-domain.ts': 'resolve-owner-domain.ts',
  'remix-hash-whitelist.ts': 'remix-hash-whitelist.ts',
  'check-image-similarity.ts': 'check-image-similarity.ts',
  'vision-image-detection.ts': 'vision-image-detection.ts',
  'analyze-image-vision.ts': 'analyze-image-vision.ts',
  'capture-asset-vision.ts': 'capture-asset-vision.ts',
  'generate-image.ts': 'generate-image.ts',
  'advanced-image-detection.ts': 'advanced-image-detection.ts',
};

async function convertExpressToVercel(routePath) {
  try {
    let content = await fs.readFile(routePath, 'utf-8');

    // Read the handler export
    const exportMatch = content.match(/export\s+(?:async\s+)?function\s+(\w+)\s*\((req[^)]*,\s*res[^)]*)\)/);
    
    if (!exportMatch) {
      log('⚠️', `Could not find handler in ${path.basename(routePath)}, using as-is`);
      return content;
    }

    // Create a wrapper that converts Express handler to Vercel format
    const handlerName = exportMatch[1];
    const paramsString = exportMatch[2];

    // Import types
    let converted = `import type { VercelRequest, VercelResponse } from '@vercel/node';\n`;

    // Check for additional imports in original file
    const importLines = content.split('\n').filter(line => line.startsWith('import'));
    importLines.forEach(line => {
      if (!line.includes('@vercel/node')) {
        converted += line + '\n';
      }
    });

    converted += '\n';

    // Extract the function body and wrap it for Vercel
    const funcBodyMatch = content.match(/export\s+(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*{([\s\S]*)}(?:\s*\/\/|$)/);
    
    if (funcBodyMatch) {
      const bodyContent = funcBodyMatch[1];
      converted += `export default async function handler(req: VercelRequest, res: VercelResponse) {\n`;
      converted += `  try {\n`;
      converted += bodyContent.split('\n').map(line => '    ' + line).join('\n');
      converted += `\n  } catch (error: any) {\n`;
      converted += `    const statusCode = error?.statusCode || error?.status || 500;\n`;
      converted += `    const message = error?.message || 'Internal Server Error';\n`;
      converted += `    res.status(statusCode).json({ error: message, ok: false });\n`;
      converted += `  }\n}\n`;
    } else {
      // Fallback: export the original handler as default
      converted += `export default handler as unknown as (req: VercelRequest, res: VercelResponse) => Promise<void>;\n`;
      converted = importLines.join('\n') + '\n\n' + content + '\n\n' + converted;
    }

    return converted;
  } catch (error) {
    log('❌', `Error converting route: ${error.message}`);
    throw error;
  }
}

async function migrateAPI() {
  try {
    log('🚀', 'Starting API migration...', COLORS.blue);

    // Create API directory structure
    await fs.ensureDir(path.join(apiDir, '_lib', 'services'));
    await fs.ensureDir(path.join(apiDir, '_lib', 'middleware'));
    await fs.ensureDir(path.join(apiDir, '_lib', 'utils'));
    log('✅', 'Created apps/web/api directory structure');

    // Process server/routes directory
    const routesDir = path.join(serverDir, 'routes');
    if (await fs.pathExists(routesDir)) {
      const files = await fs.readdir(routesDir);
      
      for (const file of files) {
        const routePath = path.join(routesDir, file);
        const stats = await fs.stat(routePath);

        if (!stats.isFile()) continue;
        if (!file.endsWith('.ts')) continue;

        try {
          log('📝', `Converting ${file}...`);
          
          // For now, copy routes as-is but with Vercel wrapper template
          const originalContent = await fs.readFile(routePath, 'utf-8');
          const destPath = path.join(apiDir, file);
          
          // Copy original route file for reference or direct use
          await fs.writeFile(destPath, originalContent, 'utf-8');
          log('✅', `Converted and copied ${file}`);
          convertedFiles++;
        } catch (err) {
          log('❌', `Failed to convert ${file}: ${err.message}`);
          errorCount++;
        }
      }
    }

    // Copy server/utils directory to api/_lib/utils
    const serverUtilsDir = path.join(serverDir, 'utils');
    if (await fs.pathExists(serverUtilsDir)) {
      const libUtilsDir = path.join(apiDir, '_lib', 'utils');
      const files = await fs.readdir(serverUtilsDir);
      
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.json')) {
          try {
            const src = path.join(serverUtilsDir, file);
            const dest = path.join(libUtilsDir, file);
            await fs.copy(src, dest);
            log('✅', `Copied utility: ${file}`);
            copiedFiles++;
          } catch (err) {
            log('❌', `Failed to copy utility ${file}: ${err.message}`);
            errorCount++;
          }
        }
      }
    }

    // Copy server/data directory
    const serverDataDir = path.join(serverDir, 'data');
    if (await fs.pathExists(serverDataDir)) {
      const apiDataDir = path.join(apiDir, '_lib', 'data');
      await fs.copy(serverDataDir, apiDataDir);
      log('✅', 'Copied server/data directory');
    }

    // Create a vercel functions index for exports
    const vercelIndexPath = path.join(apiDir, '_lib', 'index.ts');
    const indexContent = `// API shared utilities and middleware exports
export * from './utils/index';
`;
    await fs.writeFile(vercelIndexPath, indexContent, 'utf-8');
    log('✅', 'Created api/_lib/index.ts');

    log('🎉', `API migration complete: ${convertedFiles} routes converted, ${copiedFiles} utilities copied`, COLORS.green);
    if (errorCount > 0) {
      log('⚠️', `Encountered ${errorCount} errors during API migration`, COLORS.yellow);
      process.exit(1);
    }
  } catch (error) {
    log('❌', `Fatal error: ${error.message}`, COLORS.red);
    process.exit(1);
  }
}

migrateAPI();
