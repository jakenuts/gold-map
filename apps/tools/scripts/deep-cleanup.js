#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Files to analyze and potentially incorporate into documentation
const docsToAnalyze = [
  'geophysics_capabilities.xml',
  'gravity_capabilities.xml',
  'magnetic_capabilities.xml',
  'mrds_capabilities.xml',
  'sgmc_capabilities.xml',
  'usmin_capabilities.xml',
  'mrds_feature_type.xml',
  'usmin_points_type.xml',
  'mrds_sample_feature.xml',
  'mrds_sample.xml',
  'mrds_sample_full.json'
];

// Directories to clean up
const directoriesToClean = [
  'data-extraction/data',
  'data-extraction/extracted',
  'data-manager/src/entities',
  'data-manager/src/migrations',
  'kml-editor',
  'New folder'
];

// Files to remove
const filesToRemove = [
  'filtered-norcal-west.kmz',
  'remove_largest_entry.js',
  'previous-working-state.md',
  'feeds-summary.md',
  ...docsToAnalyze
];

// Extract schema information from XML files
async function extractSchemaInfo(xmlFile) {
  try {
    const content = await fs.readFile(xmlFile, 'utf8');
    // Basic XML parsing to extract relevant information
    const schemaInfo = {
      file: xmlFile,
      endpoints: content.match(/https?:\/\/[^\s<>"']+/g) || [],
      fields: content.match(/<Field\s+[^>]*>/g) || [],
      capabilities: content.match(/<Capability\s+[^>]*>/g) || []
    };
    return schemaInfo;
  } catch (error) {
    console.error(`Error processing ${xmlFile}:`, error);
    return null;
  }
}

// Update API documentation with schema information
async function updateApiDocs(schemaInfo) {
  const docsPath = 'docs/data-sources/schemas';
  await fs.mkdir(docsPath, { recursive: true });

  const content = `# ${path.basename(schemaInfo.file, '.xml')}

## Endpoints
${schemaInfo.endpoints.map(endpoint => `- ${endpoint}`).join('\n')}

## Fields
${schemaInfo.fields.map(field => `- ${field.replace(/<[^>]+>/g, '')}`).join('\n')}

## Capabilities
${schemaInfo.capabilities.map(cap => `- ${cap.replace(/<[^>]+>/g, '')}`).join('\n')}
`;

  await fs.writeFile(
    path.join(docsPath, `${path.basename(schemaInfo.file, '.xml')}.md`),
    content
  );
}

// Move useful data to appropriate locations
async function organizeData() {
  // Move sample data to test fixtures
  const fixturesDir = 'packages/data-sources/src/__fixtures__';
  await fs.mkdir(fixturesDir, { recursive: true });

  const sampleFiles = [
    'mrds_sample.xml',
    'mrds_sample_full.json',
    'mrds_sample_feature.xml'
  ];

  for (const file of sampleFiles) {
    try {
      await fs.copyFile(file, path.join(fixturesDir, file));
      console.log(`Moved ${file} to test fixtures`);
    } catch (error) {
      console.error(`Error moving ${file}:`, error);
    }
  }
}

// Clean up extracted data
async function cleanupExtractedData() {
  for (const dir of directoriesToClean) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      console.log(`Removed directory: ${dir}`);
    } catch (error) {
      console.error(`Error removing ${dir}:`, error);
    }
  }
}

// Remove temporary files
async function removeTemporaryFiles() {
  for (const file of filesToRemove) {
    try {
      await fs.unlink(file);
      console.log(`Removed file: ${file}`);
    } catch (error) {
      console.error(`Error removing ${file}:`, error);
    }
  }
}

// Test scripts
async function testScripts() {
  const scripts = [
    'pnpm build',
    'pnpm lint',
    'docker compose up -d',
    'curl http://localhost:3001/health',
    'curl -X POST http://localhost:3001/api/data-collection/schedule -H "Content-Type: application/json" -d \'{"type":"FETCH_USGS_MRDS","config":{"type":"USGS_MRDS","boundingBox":{"minLon":-124.4071825,"maxLon":-122.3933314,"minLat":40.0711794,"maxLat":41.7410164}},"cron":"0 0 * * *"}\'',
    'docker compose down'
  ];

  for (const script of scripts) {
    try {
      console.log(`Running: ${script}`);
      execSync(script, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Error running ${script}:`, error);
      throw error;
    }
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function safeRemove(filePath) {
  if (await fileExists(filePath)) {
    await fs.unlink(filePath);
    console.log(`Removed: ${filePath}`);
  }
}

async function safeRemoveDir(dirPath) {
  if (await fileExists(dirPath)) {
    await fs.rm(dirPath, { recursive: true, force: true });
    console.log(`Removed directory: ${dirPath}`);
  }
}

async function safeCopy(src, dest) {
  if (await fileExists(src)) {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
    console.log(`Copied: ${src} -> ${dest}`);
  }
}

async function main() {
  try {
    console.log('Starting deep cleanup...');

    // Create necessary directories
    const dirs = [
      'docs/data-sources/schemas',
      'packages/data-sources/src/__fixtures__',
      'packages/core/src/types'
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }

    // Process documentation files
    for (const doc of docsToAnalyze) {
      if (await fileExists(doc)) {
        const schemaInfo = await extractSchemaInfo(doc);
        if (schemaInfo) {
          await updateApiDocs(schemaInfo);
          console.log(`Processed documentation: ${doc}`);
        }
      }
    }

    // Organize and clean up
    await organizeData();
    
    // Clean up directories
    for (const dir of directoriesToClean) {
      await safeRemoveDir(dir);
    }

    // Remove temporary files
    for (const file of filesToRemove) {
      await safeRemove(file);
    }

    // Run build
    console.log('Building packages...');
    execSync('pnpm build', { stdio: 'inherit' });

    // Commit changes
    console.log('Committing changes...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "chore: deep cleanup and reorganization"', { stdio: 'inherit' });

    console.log('Deep cleanup completed successfully!');
  } catch (error) {
    console.error('Error during deep cleanup:', error);
    if (error.stdout) console.log('stdout:', error.stdout.toString());
    if (error.stderr) console.log('stderr:', error.stderr.toString());
    process.exit(1);
  }
}

main();
