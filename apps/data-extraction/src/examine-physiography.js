import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the source file
const sourceFile = path.join(__dirname, '..', 'extracted', 'northern_california_sites.json');

fs.readFile(sourceFile, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    try {
        const sites = JSON.parse(data);
        
        // Find sites with physiography data
        const sitesWithPhysiography = sites.filter(site => {
            const phys = site.location?.physiography;
            return phys && Object.keys(phys).length > 0;
        }).slice(0, 5);  // Take first 5 examples

        console.log('\nPhysiography Data Examples:');
        console.log('=========================');
        
        sitesWithPhysiography.forEach((site, index) => {
            console.log(`\nSite ${index + 1}: ${site.name}`);
            console.log('Location:', site.location);
            console.log('Raw physiography data:', site.location.physiography);
        });

        // Count elevation occurrences
        const elevationCount = sites.filter(site => {
            const elevation = site.location?.physiography?.elevation;
            return elevation !== undefined && elevation !== null && elevation !== '';
        }).length;

        console.log('\nElevation Statistics:');
        console.log('-------------------');
        console.log(`Total sites with elevation data: ${elevationCount}`);
        console.log(`Percentage: ${((elevationCount/sites.length)*100).toFixed(2)}%`);

    } catch (error) {
        console.error('Error processing JSON:', error);
    }
});
