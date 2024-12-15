import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and process the file
const filePath = path.join(__dirname, '..', 'extracted', 'northern_california_sites.json');

let directGoldReferences = 0;
let relatedGoldReferences = 0;
const processedSites = new Set();

// Read the file and process it
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    try {
        const sites = JSON.parse(data);
        
        // Process each site
        sites.forEach(site => {
            if (processedSites.has(site.id)) return;
            processedSites.add(site.id);

            // Check for direct gold references
            const siteText = JSON.stringify(site).toLowerCase();
            if (siteText.includes('gold')) {
                directGoldReferences++;
            }

            // Check related sites for gold references
            if (site.related_sites && Array.isArray(site.related_sites)) {
                const hasRelatedGold = site.related_sites.some(related => {
                    if (typeof related === 'object' && related !== null) {
                        return JSON.stringify(related).toLowerCase().includes('gold');
                    }
                    return false;
                });

                if (hasRelatedGold) {
                    relatedGoldReferences++;
                }
            }
        });

        // Output results
        console.log('\nGold Reference Analysis Results:');
        console.log('--------------------------------');
        console.log(`Total sites processed: ${processedSites.size}`);
        console.log(`Sites with direct gold references: ${directGoldReferences}`);
        console.log(`Additional sites with gold references in related sites: ${relatedGoldReferences}`);
        console.log(`Total sites with gold associations: ${directGoldReferences + relatedGoldReferences}`);
        console.log(`Percentage of sites with gold associations: ${((directGoldReferences + relatedGoldReferences) / processedSites.size * 100).toFixed(2)}%`);

    } catch (error) {
        console.error('Error processing JSON:', error);
    }
});
