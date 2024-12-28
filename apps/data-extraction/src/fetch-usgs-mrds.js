import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { USGSMRDSClient } from './clients/usgs-mrds-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use same bounding box as BLM claims
const BOUNDS = {
    minLon: -124.4071825,
    minLat: 40.0711794,
    maxLon: -122.3933314,
    maxLat: 41.7410164
};

async function fetchMRDSData() {
    console.log('Fetching USGS MRDS data...');
    
    const client = new USGSMRDSClient();
    
    try {
        const features = await client.getMRDSFeatures(BOUNDS);
        
        // Filter and score sites for gold mining potential
        const scoredFeatures = features.map(feature => {
            const props = feature.properties;
            let score = 0;
            
            // Development status scoring
            if (props.development_status === 'Producer') score += 3;
            if (props.development_status === 'Past Producer') score += 2;
            
            // Name indicators
            const nameLower = props.name?.toLowerCase() || '';
            if (nameLower.includes('mine')) score += 1;
            if (nameLower.includes('gold')) score += 2;
            if (nameLower.includes('quartz')) score += 1;
            
            // Commodity scoring
            const commodities = props.commod1?.split(' ') || [];
            if (commodities.includes('AU')) score += 3;
            // Common gold-associated minerals
            if (commodities.includes('AG')) score += 1; // Silver
            if (commodities.includes('CU')) score += 0.5; // Copper
            if (commodities.includes('PB')) score += 0.5; // Lead
            
            return {
                ...feature,
                properties: {
                    ...props,
                    goldPotentialScore: score
                }
            };
        });

        // Analyze score distribution
        const scoreDistribution = scoredFeatures.reduce((acc, feature) => {
            const score = feature.properties.goldPotentialScore;
            acc[score] = (acc[score] || 0) + 1;
            return acc;
        }, {});

        console.log('\nScore distribution:');
        Object.entries(scoreDistribution)
            .sort(([a], [b]) => Number(b) - Number(a))
            .forEach(([score, count]) => {
                console.log(`Score ${score}: ${count} sites`);
            });

        // Filter for features with high gold potential (score > 4)
        const goldLodeFeatures = scoredFeatures
            .filter(feature => feature.properties.goldPotentialScore > 4)
            // Sort by score descending
            .sort((a, b) => b.properties.goldPotentialScore - a.properties.goldPotentialScore);

        // Log some examples of high-scoring sites
        console.log('\nTop 5 highest scoring sites:');
        goldLodeFeatures.slice(0, 5).forEach(feature => {
            console.log(`- ${feature.properties.name} (Score: ${feature.properties.goldPotentialScore})`);
            console.log(`  Status: ${feature.properties.development_status}`);
            console.log(`  Commodities: ${feature.properties.commod1}`);
        });

        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, '..', 'extracted');
        await fs.mkdir(outputDir, { recursive: true });

        // Save all MRDS features
        const allOutputPath = path.join(outputDir, 'usgs_mrds_sites.geojson');
        await fs.writeFile(allOutputPath, JSON.stringify({
            type: 'FeatureCollection',
            features: features
        }, null, 2));

        // Save filtered gold lode features
        const goldOutputPath = path.join(outputDir, 'usgs_mrds_gold_lode.geojson');
        await fs.writeFile(goldOutputPath, JSON.stringify({
            type: 'FeatureCollection',
            features: goldLodeFeatures
        }, null, 2));

        console.log(`Saved ${features.length} total MRDS sites to usgs_mrds_sites.geojson`);
        console.log(`Saved ${goldLodeFeatures.length} gold/quartz lode sites to usgs_mrds_gold_lode.geojson`);
        
        return { features, goldLodeFeatures };
    } catch (error) {
        console.error('Error fetching MRDS data:', error);
        throw error;
    }
}

// Run the fetch operation
fetchMRDSData().catch(console.error);
