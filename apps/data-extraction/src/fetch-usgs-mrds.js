import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { USGSMRDSClient } from './clients/usgs-mrds-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Northern California bounding box
const BOUNDS = {
    minLon: -124.482003, // Western edge
    minLat: 39.000000,   // Southern edge (just below Sacramento)
    maxLon: -120.000000, // Eastern edge (Sierra Nevada)
    maxLat: 42.009518    // Northern edge (Oregon border)
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
            if (props.development_status === 'Prospect') score += 1;
            
            // Name indicators
            const nameLower = props.name?.toLowerCase() || '';
            if (nameLower.includes('mine')) score += 1;
            if (nameLower.includes('gold')) score += 2;
            if (nameLower.includes('quartz')) score += 1;
            if (nameLower.includes('placer')) score += 1;
            
            // Commodity scoring - only use code_list to avoid double counting
            const commodities = props.commodities || [];
            const hasGold = commodities.includes('AU');
            const hasSilver = commodities.includes('AG');
            const hasCopper = commodities.includes('CU');

            // Primary gold sites get higher score
            if (hasGold && commodities[0] === 'AU') score += 4;
            else if (hasGold) score += 3;
            
            // Secondary metals
            if (hasSilver) score += 1;
            if (hasCopper) score += 0.5;
            
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

        // Filter for features with high gold potential (score > 6) and exclude placer mines
        const goldLodeFeatures = scoredFeatures
            .filter(feature => {
                const props = feature.properties;
                const nameLower = props.name?.toLowerCase() || '';
                // Exclude placer mines
                if (nameLower.includes('placer')) return false;
                // Only include high-scoring sites
                return props.goldPotentialScore > 6;
            })
            .sort((a, b) => b.properties.goldPotentialScore - a.properties.goldPotentialScore);

        // Log some examples of high-scoring sites
        console.log('\nTop 5 highest scoring sites:');
        goldLodeFeatures.slice(0, 5).forEach(feature => {
            const props = feature.properties;
            console.log(`\n- ${props.name} (Score: ${props.goldPotentialScore})`);
            console.log(`  Location: ${props.state} (County Code: ${props.county_code})`);
            console.log(`  Status: ${props.development_status}`);
            console.log(`  Commodities: ${props.commodity_desc}`);
            console.log(`  URL: ${props.url}`);
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

        console.log(`\nSaved ${features.length} total MRDS sites to usgs_mrds_sites.geojson`);
        console.log(`Saved ${goldLodeFeatures.length} gold/quartz lode sites to usgs_mrds_gold_lode.geojson`);
        
        return { features, goldLodeFeatures };
    } catch (error) {
        console.error('Error fetching MRDS data:', error);
        throw error;
    }
}

// Run the fetch operation
fetchMRDSData().catch(console.error);
