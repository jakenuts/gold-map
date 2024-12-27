#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Directories to create
const directories = [
  'apps/admin',
  'apps/map',
  'packages/core/src',
  'packages/data-sources/src',
  'services/task-runner/src',
  'tools/scripts',
  'tools/docker',
  'docs/assets'
];

// Files to move (source -> destination)
const filesToMove = {
  // Data extraction utilities to move to data-sources package
  'data-extraction/src/fetch-blm-claims.js': 'packages/data-sources/src/sources/blm-claims/client.ts',
  'data-extraction/src/analyze-data-relationships.js': 'packages/data-sources/src/utils/data-analysis.ts',
  
  // Map components to move to map application
  'diggings-map/src': 'apps/map/src',
  
  // Documentation to consolidate
  'data-manager/endpoints.md': 'docs/data-sources/endpoints.md',
  'data-manager/mrds-endpoint.md': 'docs/data-sources/mrds-api.md',
  'data-manager/ogc-client.md': 'docs/data-sources/ogc-services.md',
  
  // Configuration files
  'data-manager/tsconfig.json': 'tsconfig.base.json',
};

// Files to delete (cleanup)
const filesToDelete = [
  'filtered-norcal-west.kmz',
  'remove_largest_entry.js',
  'previous-working-state.md',
  'feeds-summary.md'
];

// Directories to delete after moving content
const directoriesToDelete = [
  'data-extraction',
  'New folder',
  'kml-editor'
];

async function createDirectories() {
  for (const dir of directories) {
    await fs.mkdir(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

async function moveFiles() {
  for (const [src, dest] of Object.entries(filesToMove)) {
    try {
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
      console.log(`Moved ${src} to ${dest}`);
    } catch (error) {
      console.error(`Error moving ${src}: ${error.message}`);
    }
  }
}

async function deleteFiles() {
  for (const file of filesToDelete) {
    try {
      await fs.unlink(file);
      console.log(`Deleted file: ${file}`);
    } catch (error) {
      console.error(`Error deleting ${file}: ${error.message}`);
    }
  }
}

async function deleteDirectories() {
  for (const dir of directoriesToDelete) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      console.log(`Deleted directory: ${dir}`);
    } catch (error) {
      console.error(`Error deleting ${dir}: ${error.message}`);
    }
  }
}

async function main() {
  try {
    console.log('Starting project cleanup...');
    
    // Create new directory structure
    await createDirectories();
    
    // Move files to new locations
    await moveFiles();
    
    // Delete temporary files
    await deleteFiles();
    
    // Delete old directories
    await deleteDirectories();
    
    // Run git commands to track changes
    execSync('git add .');
    execSync('git commit -m "chore: reorganize project structure"');
    
    console.log('Project cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

main();
