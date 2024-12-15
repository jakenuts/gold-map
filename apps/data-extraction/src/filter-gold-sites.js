import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input and output paths
const inputPath = path.join(__dirname, '..', 'extracted', 'northern_california_sites.json');
const outputPath = path.join(__dirname, '..', 'extracted', 'northern_california_gold_sites.json');

// Read and process the file
fs.readFile(inputPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    try {
        const sites = JSON.parse(data);
        
        // Filter sites that contain gold references
        const goldSites = sites.filter(site => {
            const siteText = JSON.stringify(site).toLowerCase();
            return siteText.includes('gold');
        });

        // Write filtered data to new file
        fs.writeFile(outputPath, JSON.stringify(goldSites, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing file:', writeErr);
                return;
            }
            console.log('\nGold Sites Filter Results:');
            console.log('-------------------------');
            console.log(`Total original sites: ${sites.length}`);
            console.log(`Gold-related sites: ${goldSites.length}`);
            console.log(`Filtered out ${sites.length - goldSites.length} non-gold sites`);
            console.log(`New file created: ${path.basename(outputPath)}`);
        });

    } catch (error) {
        console.error('Error processing JSON:', error);
    }
});
